#!/usr/bin/env python3
"""Measure the chord boundaries already printed into the JUNCTION master.

This tool deliberately works from rendered audio rather than pitch estimates.
Its measurements may flag a transition for listening review, but the first pass
does not block or admit material because its thresholds have not been calibrated.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import wave
from pathlib import Path

import numpy as np


MAGIC = b"SVJCTN04"
CHORD_TRANSITIONS = (("Emin9", "Cmaj7"), ("Cmaj7", "Amin7"), ("Amin7", "Bmin9"))


def load_manifest(path: Path) -> dict:
    with path.open("rb") as handle:
        header = handle.read(12)
        if len(header) != 12 or header[:8] != MAGIC:
            raise ValueError("JUNCTION bank header is invalid")
        manifest_length = struct.unpack("<I", header[8:])[0]
        return json.loads(handle.read(manifest_length))


def load_pcm16_mono(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as source:
        if source.getsampwidth() != 2:
            raise ValueError("transition inspection currently requires a PCM16 WAV")
        channels = source.getnchannels()
        sample_rate = source.getframerate()
        frames = source.getnframes()
        pcm = np.frombuffer(source.readframes(frames), dtype="<i2").astype(np.float64) / 32768.0
    return pcm.reshape(-1, channels).mean(axis=1), sample_rate


def sethares_roughness(frequencies: np.ndarray, amplitudes: np.ndarray) -> float:
    if frequencies.size < 2:
        return 0.0
    total = 0.0
    for first in range(frequencies.size - 1):
        low_frequency = frequencies[first]
        low_amplitude = amplitudes[first]
        following = frequencies[first + 1:]
        scale = 0.24 / (0.0207 * low_frequency + 18.96)
        distance = scale * (following - low_frequency)
        dissonance = np.exp(-3.5 * distance) - np.exp(-5.75 * distance)
        total += float(np.sum(np.minimum(low_amplitude, amplitudes[first + 1:]) * dissonance))
    return total


def frame_features(samples: np.ndarray, sample_rate: int, frame_size: int = 2048, hop: int = 512) -> dict:
    if samples.size < frame_size:
        samples = np.pad(samples, (0, frame_size - samples.size))
    window = np.hanning(frame_size)
    spectra = []
    roughness = []
    centroids = []
    for start in range(0, samples.size - frame_size + 1, hop):
        magnitude = np.abs(np.fft.rfft(samples[start:start + frame_size] * window))
        magnitude[0] = 0
        spectra.append(magnitude)
        frequencies = np.fft.rfftfreq(frame_size, 1 / sample_rate)
        valid = (frequencies >= 40) & (frequencies <= 8000)
        band = magnitude[valid]
        band_frequencies = frequencies[valid]
        if band.size == 0 or np.max(band) <= 0:
            roughness.append(0.0)
            centroids.append(0.0)
            continue
        peak_mask = np.zeros(band.shape, dtype=bool)
        peak_mask[1:-1] = (band[1:-1] > band[:-2]) & (band[1:-1] >= band[2:])
        peak_indices = np.flatnonzero(peak_mask & (band >= np.max(band) * 10 ** (-60 / 20)))
        if peak_indices.size > 48:
            peak_indices = peak_indices[np.argsort(band[peak_indices])[-48:]]
        peak_indices = np.sort(peak_indices)
        peak_amplitudes = band[peak_indices]
        if peak_amplitudes.size:
            peak_amplitudes = peak_amplitudes / np.max(peak_amplitudes)
        roughness.append(sethares_roughness(band_frequencies[peak_indices], peak_amplitudes))
        centroids.append(float(np.sum(band_frequencies * band) / max(np.sum(band), 1e-12)))
    spectrum = np.asarray(spectra)
    flux = np.zeros(spectrum.shape[0])
    if spectrum.shape[0] > 1:
        normalized = spectrum / np.maximum(np.sum(spectrum, axis=1, keepdims=True), 1e-12)
        positive = np.maximum(0, normalized[1:] - normalized[:-1])
        flux[1:] = np.sqrt(np.sum(positive * positive, axis=1))
    rms = math.sqrt(float(np.mean(samples * samples))) if samples.size else 0.0
    return {
        "rms_dbfs": 20 * math.log10(max(rms, 1e-12)),
        "roughness_median": float(np.median(roughness)),
        "roughness_max": float(np.max(roughness)),
        "centroid_hz_median": float(np.median(centroids)),
        "flux_median": float(np.median(flux)),
        "flux_max": float(np.max(flux)),
    }


def rounded(features: dict) -> dict:
    return {key: round(value, 6) for key, value in features.items()}


def inspect_transition(audio: np.ndarray, sample_rate: int, boundary: int, window_seconds: float) -> dict:
    width = round(window_seconds * sample_rate)
    pre = audio[max(0, boundary - width):boundary]
    post = audio[boundary:min(audio.size, boundary + width)]
    around = audio[max(0, boundary - width):min(audio.size, boundary + width)]
    pre_features = frame_features(pre, sample_rate)
    post_features = frame_features(post, sample_rate)
    boundary_features = frame_features(around, sample_rate)
    roughness_reference = max(
        pre_features["roughness_max"],
        post_features["roughness_max"],
        1e-12,
    )
    flux_reference = max(
        pre_features["flux_max"],
        post_features["flux_max"],
        1e-12,
    )
    loudness_reference = (pre_features["rms_dbfs"] + post_features["rms_dbfs"]) * 0.5
    return {
        "analysis_valid": min(pre_features["rms_dbfs"], post_features["rms_dbfs"]) > -70,
        "pre": rounded(pre_features),
        "post": rounded(post_features),
        "boundary": rounded(boundary_features),
        "roughness_ratio": round(boundary_features["roughness_max"] / roughness_reference, 6),
        "boundary_flux_ratio": round(boundary_features["flux_max"] / flux_reference, 6),
        "boundary_rms_delta_db": round(boundary_features["rms_dbfs"] - loudness_reference, 6),
        "centroid_jump_hz": round(abs(
            post_features["centroid_hz_median"] - pre_features["centroid_hz_median"]
        ), 6),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--wav", type=Path, required=True)
    parser.add_argument("--bank", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--window-ms", type=float, default=340.0)
    arguments = parser.parse_args()

    manifest = load_manifest(arguments.bank)
    audio, sample_rate = load_pcm16_mono(arguments.wav)
    cursor_seconds = 0.0
    transitions = []
    for section in manifest["sections"]:
        # REST deliberately omits the ordinary four-chord sequence. Treating
        # its empty bars as chord changes would manufacture invalid metrics.
        if section["id"] == "rest":
            cursor_seconds += section["durationSeconds"]
            continue
        bar_seconds = 240.0 / section["bpm"]
        for transition_index, (source_chord, target_chord) in enumerate(CHORD_TRANSITIONS, start=1):
            boundary_seconds = cursor_seconds + transition_index * 2 * bar_seconds
            measurement = inspect_transition(
                audio,
                sample_rate,
                round(boundary_seconds * sample_rate),
                arguments.window_ms / 1000,
            )
            flags = []
            if measurement["analysis_valid"] and measurement["roughness_ratio"] > 1.15:
                flags.append("roughness_ratio_above_uncalibrated_probe")
            if measurement["analysis_valid"] and measurement["boundary_flux_ratio"] > 2.0:
                flags.append("boundary_flux_above_uncalibrated_probe")
            if measurement["analysis_valid"] and abs(measurement["boundary_rms_delta_db"]) > 1.0:
                flags.append("boundary_rms_delta_above_uncalibrated_probe")
            transitions.append({
                "performance_id": section["performanceId"],
                "section": section["id"],
                "take": section["take"],
                "bpm": section["bpm"],
                "from_chord": source_chord,
                "to_chord": target_chord,
                "boundary_seconds": round(boundary_seconds, 6),
                **measurement,
                "flags": flags,
                "action": "flag_only_calibration",
                "authority": "measurement",
            })
        cursor_seconds += section["durationSeconds"]

    report = {
        "schema": "sedicivalvole.junction-rendered-transition-review.v1",
        "role": "audio_only_transition_measurement",
        "authority": "measurement",
        "decision_status": "review_required",
        "threshold_status": "uncalibrated_flag_only",
        "audio_source": str(arguments.wav),
        "bank_source": str(arguments.bank),
        "sample_rate": sample_rate,
        "window_ms": arguments.window_ms,
        "included_processing": ["printed_instrument_channel", "printed_reverb", "printed_master_processing"],
        "excluded_processing": ["live_browser_delay_tail", "cross_clip_runtime_transitions"],
        "transition_count": len(transitions),
        "transitions": transitions,
    }
    arguments.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
