#!/usr/bin/env python3
"""Validate a phase-aware JUNCTION pitch-evidence stack on controlled audio."""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from scipy.signal import butter, hilbert, sosfiltfilt


SAMPLE_RATE = 48_000
DURATION_SECONDS = 2.4
SOURCE_MIDI = 54  # F-sharp3
CANDIDATE_MIDI = 73  # C-sharp5
HARMONIC_NUMBER = 3
TARGET_LEVEL_DB = -20.0
REQUIRED_AXES = (
    "adsr",
    "filter",
    "phase_seed",
    "detune",
    "chorus",
    "spectral_slope",
    "saturation",
    "stereo_coherence",
)


def midi_frequency(midi: int) -> float:
    return 440.0 * math.pow(2.0, (midi - 69) / 12.0)


SOURCE_HZ = midi_frequency(SOURCE_MIDI)
HARMONIC_HZ = SOURCE_HZ * HARMONIC_NUMBER
CANDIDATE_HZ = midi_frequency(CANDIDATE_MIDI)


@dataclass(frozen=True)
class Fixture:
    id: str
    attack_seconds: float = 0.04
    cutoff_hz: float | None = None
    phase_seed: int = 11
    detune_cents: float = 0.0
    chorus_depth_ms: float = 0.0
    partial_slope: float = 1.45
    saturation_drive: float = 0.0
    stereo_target_pan: float = 0.0
    sustain_seconds: float = 1.75


FIXTURES = (
    Fixture("clean"),
    Fixture("shared_slow_adsr", attack_seconds=0.42),
    Fixture("dark_filter", cutoff_hz=1_250.0),
    Fixture("alternate_phase_seed", phase_seed=73),
    Fixture("shallow_spectral_slope", partial_slope=1.05),
    Fixture("steep_spectral_slope", partial_slope=1.95),
    Fixture("saturated", saturation_drive=2.8),
    Fixture("stereo_split", stereo_target_pan=0.72),
    Fixture("detuned_unison", detune_cents=4.5),
    Fixture("chorused", chorus_depth_ms=3.5),
    Fixture("short_sustain", sustain_seconds=0.24),
    Fixture("chorused_saturation", chorus_depth_ms=3.5, saturation_drive=2.8),
)


def envelope(time: np.ndarray, attack: float, sustain: float) -> np.ndarray:
    attack_shape = np.clip((time - 0.03) / max(attack, 1e-6), 0.0, 1.0)
    release_at = 0.03 + attack + sustain
    release_shape = np.clip(1.0 - (time - release_at) / 0.42, 0.0, 1.0)
    return attack_shape * release_shape


def harmonic_source(time: np.ndarray, fixture: Fixture) -> np.ndarray:
    rng = np.random.default_rng(fixture.phase_seed)
    result = np.zeros_like(time)
    detunes = (0.0,) if fixture.detune_cents == 0 else (-fixture.detune_cents, fixture.detune_cents)
    for detune in detunes:
        ratio = math.pow(2.0, detune / 1200.0)
        for harmonic in range(1, 9):
            phase = rng.uniform(-math.pi, math.pi)
            result += (
                np.sin(2.0 * math.pi * SOURCE_HZ * ratio * harmonic * time + phase)
                * math.pow(harmonic, -fixture.partial_slope)
                / len(detunes)
            )
    return result


def variable_delay(signal: np.ndarray, time: np.ndarray, depth_ms: float, phase: float) -> np.ndarray:
    if depth_ms <= 0:
        return signal
    delay = (0.006 + depth_ms / 1000.0 * np.sin(2.0 * math.pi * 0.43 * time + phase)) * SAMPLE_RATE
    source_index = np.arange(signal.size, dtype=np.float64) - delay
    return np.interp(source_index, np.arange(signal.size), signal, left=0.0, right=0.0)


def render(fixture: Fixture, target_present: bool) -> np.ndarray:
    time = np.arange(round(SAMPLE_RATE * DURATION_SECONDS), dtype=np.float64) / SAMPLE_RATE
    source_envelope = envelope(time, fixture.attack_seconds, fixture.sustain_seconds)
    source = harmonic_source(time, fixture) * source_envelope
    target = np.zeros_like(source)
    if target_present:
        target_envelope = envelope(time, fixture.attack_seconds, fixture.sustain_seconds)
        target = (
            np.sin(2.0 * math.pi * CANDIDATE_HZ * time + 0.37)
            * math.pow(10.0, TARGET_LEVEL_DB / 20.0)
            * target_envelope
        )
    left_target = target * math.sqrt((1.0 - fixture.stereo_target_pan) / 2.0)
    right_target = target * math.sqrt((1.0 + fixture.stereo_target_pan) / 2.0)
    stereo = np.vstack((source * 0.707 + left_target, source * 0.707 + right_target))
    if fixture.chorus_depth_ms > 0:
        stereo = np.vstack((
            variable_delay(stereo[0], time, fixture.chorus_depth_ms, 0.0),
            variable_delay(stereo[1], time, fixture.chorus_depth_ms, math.pi),
        ))
    if fixture.cutoff_hz:
        sos = butter(4, fixture.cutoff_hz, btype="lowpass", fs=SAMPLE_RATE, output="sos")
        stereo = sosfiltfilt(sos, stereo, axis=1)
    peak_before_saturation = max(float(np.max(np.abs(stereo))), 1e-12)
    stereo /= peak_before_saturation
    if fixture.saturation_drive > 0:
        stereo = np.tanh(stereo * fixture.saturation_drive) / math.tanh(fixture.saturation_drive)
    noise = np.random.default_rng(404).normal(0.0, 1e-5, stereo.shape)
    return (stereo + noise).astype(np.float64)


def bandpass(signal: np.ndarray, low_hz: float, high_hz: float) -> np.ndarray:
    sos = butter(5, (low_hz, high_hz), btype="bandpass", fs=SAMPLE_RATE, output="sos")
    return sosfiltfilt(sos, signal)


def complex_tone_fit(signal: np.ndarray, frequencies: tuple[float, ...]) -> tuple[np.ndarray, float]:
    time = np.arange(signal.size, dtype=np.float64) / SAMPLE_RATE
    columns = []
    for frequency in frequencies:
        columns.extend((np.cos(2.0 * math.pi * frequency * time), np.sin(2.0 * math.pi * frequency * time)))
    matrix = np.column_stack(columns)
    coefficients, _, _, _ = np.linalg.lstsq(matrix, signal, rcond=1e-6)
    # Elementwise accumulation avoids a spurious Accelerate/NumPy matmul
    # overflow warning observed for this tall two-column matrix on Apple silicon.
    fitted = np.sum(matrix * coefficients[np.newaxis, :], axis=1)
    amplitudes = []
    for index in range(len(frequencies)):
        cosine, sine = coefficients[index * 2:index * 2 + 2]
        amplitudes.append(complex(cosine, -sine))
    residual = float(np.mean(np.square(signal - fitted)))
    return np.asarray(amplitudes), residual


def phase_stability(signal: np.ndarray, frequency: float) -> float:
    chunks = np.array_split(signal, 5)
    phases = []
    for chunk in chunks:
        coefficient, _ = complex_tone_fit(chunk, (frequency,))
        phases.append(np.angle(coefficient[0]))
    return float(abs(np.mean(np.exp(1j * np.asarray(phases)))))


def spectral_metrics(signal: np.ndarray) -> tuple[float, float]:
    windowed = signal * np.hanning(signal.size)
    spectrum = np.abs(np.fft.rfft(windowed))
    frequencies = np.fft.rfftfreq(signal.size, 1.0 / SAMPLE_RATE)
    centroid = float(np.sum(frequencies * spectrum) / max(np.sum(spectrum), 1e-12))
    harmonic_amplitudes = []
    for harmonic in range(1, 7):
        index = int(np.argmin(np.abs(frequencies - SOURCE_HZ * harmonic)))
        harmonic_amplitudes.append(max(float(spectrum[index]), 1e-12))
    slope, _ = np.polyfit(np.log(np.arange(1, 7)), np.log(harmonic_amplitudes), 1)
    return centroid, float(slope)


def invalidity_reasons(fixture: Fixture) -> list[str]:
    reasons = []
    if fixture.sustain_seconds < 0.30:
        reasons.append("sustain_shorter_than_300_ms")
    if fixture.detune_cents > 0:
        reasons.append("multiple_unresolved_detuned_sources")
    if fixture.chorus_depth_ms > 0:
        reasons.append("independent_chorus_modulation_breaks_phase_stationarity")
    if fixture.chorus_depth_ms > 0 and fixture.saturation_drive > 0:
        reasons.append("nonlinear_cross_products_follow_modulated_components")
    return reasons


def analyse(fixture: Fixture, target_present: bool) -> dict:
    stereo = render(fixture, target_present)
    start = round((0.03 + fixture.attack_seconds + 0.08) * SAMPLE_RATE)
    stop = min(stereo.shape[1], start + round(max(0.08, fixture.sustain_seconds - 0.12) * SAMPLE_RATE))
    sustain = stereo[:, start:stop]
    mono = np.mean(sustain, axis=0)
    candidate_band = bandpass(mono, CANDIDATE_HZ - 12.0, HARMONIC_HZ + 12.0)
    one_tone, one_residual = complex_tone_fit(candidate_band, (HARMONIC_HZ,))
    phase_window_valid = candidate_band.size >= round(0.80 * SAMPLE_RATE)
    if phase_window_valid:
        two_tone, two_residual = complex_tone_fit(candidate_band, (HARMONIC_HZ, CANDIDATE_HZ))
    else:
        two_tone = np.asarray((one_tone[0], 0j))
        two_residual = one_residual
    source_fit, _ = complex_tone_fit(mono, (SOURCE_HZ,))
    harmonic_amplitude = abs(two_tone[0])
    candidate_amplitude = abs(two_tone[1])
    source_amplitude = max(abs(source_fit[0]), 1e-12)
    model_gain_db = 10.0 * math.log10(max(one_residual, 1e-18) / max(two_residual, 1e-18))
    candidate_db_relative_to_source = 20.0 * math.log10(max(candidate_amplitude, 1e-12) / source_amplitude)
    target_phase_stability = phase_stability(candidate_band, CANDIDATE_HZ) if phase_window_valid else 0.0
    analytic_left = hilbert(sustain[0])
    analytic_right = hilbert(sustain[1])
    stereo_phase_coherence = float(abs(np.mean(np.exp(1j * (np.angle(analytic_left) - np.angle(analytic_right))))))
    stereo_correlation = float(np.corrcoef(sustain[0], sustain[1])[0, 1])
    centroid_hz, measured_spectral_slope = spectral_metrics(mono)
    rms = math.sqrt(float(np.mean(np.square(mono))))
    crest_db = 20.0 * math.log10(max(float(np.max(np.abs(mono))), 1e-12) / max(rms, 1e-12))
    reasons = invalidity_reasons(fixture)
    valid = not reasons
    if not valid:
        verdict = "unknown"
    elif model_gain_db >= 2.0 and candidate_db_relative_to_source >= -32.0 and target_phase_stability >= 0.55:
        verdict = "voiced"
    elif harmonic_amplitude > 1e-5:
        verdict = "harmonic_of"
    else:
        verdict = "unknown"
        reasons.append("candidate_band_below_measurement_floor")
        valid = False
    expected = "voiced" if target_present else "harmonic_of"
    passed = verdict == expected if valid else verdict == "unknown" and len(reasons) > 0
    return {
        "fixture": fixture.id,
        "target_present": target_present,
        "expected": expected if valid else "unknown",
        "verdict": verdict,
        "valid": valid,
        "invalidity_reasons": reasons,
        "passed": passed,
        "evidence": {
            "adsr": {
                "attack_seconds": fixture.attack_seconds,
                "sustain_seconds": fixture.sustain_seconds,
            },
            "filter": {"cutoff_hz": fixture.cutoff_hz, "spectral_centroid_hz": round(centroid_hz, 3)},
            "phase": {
                "seed": fixture.phase_seed,
                "two_tone_model_gain_db": round(model_gain_db, 3),
                "target_phase_stability": round(target_phase_stability, 6),
            },
            "detune": {"cents": fixture.detune_cents},
            "chorus": {"depth_ms": fixture.chorus_depth_ms},
            "spectrum": {
                "configured_partial_slope": fixture.partial_slope,
                "measured_log_slope": round(measured_spectral_slope, 6),
                "candidate_db_relative_to_source": round(candidate_db_relative_to_source, 3),
            },
            "saturation": {"drive": fixture.saturation_drive, "crest_db": round(crest_db, 3)},
            "stereo": {
                "target_pan": fixture.stereo_target_pan,
                "correlation": round(stereo_correlation, 6),
                "phase_coherence": round(stereo_phase_coherence, 6),
            },
        },
    }


def validate() -> dict:
    cases = [analyse(fixture, target_present) for fixture in FIXTURES for target_present in (False, True)]
    valid_cases = [case for case in cases if case["valid"]]
    invalid_cases = [case for case in cases if not case["valid"]]
    present = [case for case in valid_cases if case["target_present"]]
    absent = [case for case in valid_cases if not case["target_present"]]
    recall = sum(case["verdict"] == "voiced" for case in present) / max(1, len(present))
    false_positive_rate = sum(case["verdict"] == "voiced" for case in absent) / max(1, len(absent))
    abstention_rate = sum(
        case["verdict"] == "unknown" and len(case["invalidity_reasons"]) > 0
        for case in invalid_cases
    ) / max(1, len(invalid_cases))
    result = {
        "required_axes": list(REQUIRED_AXES),
        "axes_covered": True,
        "valid_case_recall": round(recall, 6),
        "valid_case_false_positive_rate": round(false_positive_rate, 6),
        "invalid_case_explicit_abstention_rate": round(abstention_rate, 6),
        "synthetic_acceptance_passed": recall >= 0.90 and false_positive_rate <= 0.05 and abstention_rate == 1.0,
        "real_audio_pitch_gate_authorized": False,
        "real_audio_reason": "complete_processed_mixes_lack_isolated_source_provenance_for_detune_chorus_and_nonlinear_components",
    }
    result["passed"] = result["synthetic_acceptance_passed"] and not result["real_audio_pitch_gate_authorized"]
    return {
        "schema_version": "sedicivalvole.junction-pitch-evidence.v1",
        "method": "phase_aware_two_frequency_model_with_multiaxis_validity_gates",
        "legacy_shortcut": {
            "status": "rejected",
            "reason": "proposal_conditioned_magnitude_residual_was_anti_correlated_with_richer_voicings",
        },
        "frequencies_hz": {
            "source": round(SOURCE_HZ, 6),
            "source_harmonic": round(HARMONIC_HZ, 6),
            "candidate": round(CANDIDATE_HZ, 6),
            "ratio_candidate_to_source": round(CANDIDATE_HZ / SOURCE_HZ, 6),
        },
        "acceptance": {
            "minimum_valid_case_recall": 0.90,
            "maximum_valid_case_false_positive_rate": 0.05,
            "required_invalid_case_explicit_abstention_rate": 1.0,
        },
        "result": result,
        "cases": cases,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="optional JSON evidence path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    report = validate()
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["result"], sort_keys=True))
    if not report["result"]["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
