#!/usr/bin/env python3
"""Validate the harmonic arbiter on deterministic, known-note synthetic audio."""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np

DRIVE_LAB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(DRIVE_LAB))

from analysis.harmonic_arbiter import analyse_candidate, midi_to_frequency


SAMPLE_RATE = 48_000
DURATION_SECONDS = 1.4
BASE_NOTES = (35, 45, 54)  # B1, A2, F#3: all can place partials near C#5.
TARGET_MIDI = 73  # C#5.
TARGET_LEVELS_DB = (-6.0, -12.0, -20.0, -30.0)
SATURATION_DRIVES = (0.0, 1.5, 3.0)


def envelope(time: np.ndarray, onset: float, attack: float, release_start: float, release: float) -> np.ndarray:
    shaped = np.zeros_like(time)
    attack_mask = (time >= onset) & (time < onset + attack)
    shaped[attack_mask] = (time[attack_mask] - onset) / max(attack, 1e-9)
    hold_mask = (time >= onset + attack) & (time < release_start)
    shaped[hold_mask] = 1.0
    release_mask = time >= release_start
    shaped[release_mask] = np.maximum(0.0, 1.0 - (time[release_mask] - release_start) / max(release, 1e-9))
    return shaped


def synth_note(midi: int, level: float, time: np.ndarray, note_envelope: np.ndarray) -> np.ndarray:
    fundamental = midi_to_frequency(midi)
    signal = np.zeros_like(time)
    for harmonic in range(1, 17):
        frequency = fundamental * harmonic
        if frequency >= SAMPLE_RATE * 0.45:
            break
        phase = ((midi * 17 + harmonic * 29) % 360) * math.pi / 180.0
        signal += math.pow(harmonic, -1.0) * np.sin(2.0 * math.pi * frequency * time + phase)
    return level * note_envelope * signal


def render_case(target_level_db: float | None, saturation_drive: float) -> np.ndarray:
    time = np.arange(round(SAMPLE_RATE * DURATION_SECONDS), dtype=np.float64) / SAMPLE_RATE
    base_envelope = envelope(time, onset=0.02, attack=0.035, release_start=0.90, release=0.42)
    signal = np.zeros_like(time)
    for midi, level in zip(BASE_NOTES, (0.72, 0.88, 1.0), strict=True):
        signal += synth_note(midi, level, time, base_envelope)
    if target_level_db is not None:
        target_envelope = envelope(time, onset=0.105, attack=0.025, release_start=0.72, release=0.30)
        signal += synth_note(TARGET_MIDI, math.pow(10.0, target_level_db / 20.0), time, target_envelope)
    signal /= max(float(np.max(np.abs(signal))), 1e-12)
    if saturation_drive > 0.0:
        signal = np.tanh(signal * saturation_drive) / math.tanh(saturation_drive)
    return signal.astype(np.float32)


def validate() -> dict:
    cases = []
    for saturation in SATURATION_DRIVES:
        absent = analyse_candidate(render_case(None, saturation), SAMPLE_RATE, TARGET_MIDI, BASE_NOTES)
        cases.append({
            "target_level_db": None,
            "saturation_drive": saturation,
            "expected": "harmonic_of",
            "evidence": absent.to_dict(),
            "passed": absent.verdict == "harmonic_of",
        })
        for level_db in TARGET_LEVELS_DB:
            evidence = analyse_candidate(render_case(level_db, saturation), SAMPLE_RATE, TARGET_MIDI, BASE_NOTES)
            expected = "voiced" if level_db >= -20.0 else "unknown_or_inaudible"
            passed = evidence.verdict == "voiced" if level_db >= -20.0 else evidence.verdict != "harmonic_of"
            cases.append({
                "target_level_db": level_db,
                "saturation_drive": saturation,
                "expected": expected,
                "evidence": evidence.to_dict(),
                "passed": passed,
            })

    required = [case for case in cases if case["target_level_db"] is None or case["target_level_db"] >= -20.0]
    true_positive = [case for case in required if case["target_level_db"] is not None and case["passed"]]
    positive_count = sum(1 for case in required if case["target_level_db"] is not None)
    false_positive = [case for case in required if case["target_level_db"] is None and not case["passed"]]
    absent_count = sum(1 for case in required if case["target_level_db"] is None)
    recall = len(true_positive) / max(1, positive_count)
    false_positive_rate = len(false_positive) / max(1, absent_count)
    absent_residuals = [case["evidence"]["temporal_residual"] for case in required if case["target_level_db"] is None]
    present_residuals = [case["evidence"]["temporal_residual"] for case in required if case["target_level_db"] == -20.0]
    separation_margin = min(present_residuals) - max(absent_residuals)
    accepted = recall >= 0.90 and false_positive_rate <= 0.05 and separation_margin >= 0.01
    return {
        "schema_version": "0.1.0",
        "target": "C#5 voiced versus B1/A2/F#3 partials",
        "acceptance": {
            "minimum_recall": 0.90,
            "maximum_false_positive_rate": 0.05,
            "minimum_residual_margin": 0.01,
        },
        "result": {
            "recall": round(recall, 6),
            "false_positive_rate": round(false_positive_rate, 6),
            "residual_margin": round(separation_margin, 6),
            "accepted": accepted,
        },
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
    if not report["result"]["accepted"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
