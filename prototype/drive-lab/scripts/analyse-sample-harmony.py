#!/usr/bin/env python3
"""Inventory tonal samples and propose notes without pretending they are truth."""

from __future__ import annotations

import argparse
import contextlib
import hashlib
import io
import json
import logging
import math
import subprocess
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import librosa
import numpy as np

logging.getLogger().setLevel(logging.ERROR)
warnings.filterwarnings("ignore", message="pkg_resources is deprecated as an API.*")

from basic_pitch import ICASSP_2022_MODEL_PATH
from basic_pitch.inference import Model, predict

DRIVE_LAB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(DRIVE_LAB))

from analysis.harmonic_arbiter import MIN_TEMPORAL_RESIDUAL, analyse_candidate


SCHEMA_VERSION = "0.1.0"
TARGET_SAMPLE_RATE = 48_000
JUNCTION_CHORDS = frozenset({"Emin9", "Cmaj7", "Amin7", "Bmin9"})
ROOT_NAMES = {
    "C": 0,
    "C#": 1,
    "Db": 1,
    "D": 2,
    "D#": 3,
    "Eb": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "Gb": 6,
    "G": 7,
    "G#": 8,
    "Ab": 8,
    "A": 9,
    "A#": 10,
    "Bb": 10,
    "B": 11,
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def git_sha(repo_root: Path) -> str:
    result = subprocess.run(
        ["git", "rev-parse", "--short", "HEAD"],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def declared_from_filename(path: Path) -> dict[str, Any]:
    stem = path.stem
    if not stem.startswith("Jungle_") or "_" not in stem[7:]:
        raise ValueError(f"unsupported chord filename: {path.name}")
    instrument, label = stem[7:].split("_", 1)
    root = next((name for name in sorted(ROOT_NAMES, key=len, reverse=True) if label.startswith(name)), None)
    if root is None:
        raise ValueError(f"cannot parse declared root from: {path.name}")
    return {
        "label": label,
        "root_pc": ROOT_NAMES[root],
        "instrument": instrument,
        "source": "filename",
    }


def first_index(condition: np.ndarray, fallback: int) -> int:
    matches = np.flatnonzero(condition)
    return int(matches[0]) if matches.size else fallback


def segment_audio(y: np.ndarray, sample_rate: int) -> dict[str, Any]:
    absolute = np.abs(y)
    peak = float(np.max(absolute))
    if peak <= 1e-9:
        raise ValueError("silent audio cannot be analysed")

    onset_threshold = peak * math.pow(10.0, -45.0 / 20.0)
    onset = max(0, first_index(absolute >= onset_threshold, 0) - round(0.005 * sample_rate))
    rms_window = max(1, round(0.010 * sample_rate))
    rms = np.sqrt(np.convolve(np.square(y), np.ones(rms_window) / rms_window, mode="same"))
    peak_index = int(np.argmax(rms))
    peak_rms = max(float(rms[peak_index]), 1e-9)

    sustain_start = min(len(y) - 1, peak_index + round(0.060 * sample_rate))
    sustain_threshold = peak_rms * math.pow(10.0, -12.0 / 20.0)
    sustain_offset = first_index(rms[sustain_start:] <= sustain_threshold, len(y) - sustain_start)
    sustain_end = min(len(y), sustain_start + sustain_offset, sustain_start + round(1.5 * sample_rate))
    if sustain_end <= sustain_start:
        sustain_end = min(len(y), sustain_start + round(0.050 * sample_rate))

    tail_threshold = peak_rms * math.pow(10.0, -60.0 / 20.0)
    tail_offset = first_index(rms[sustain_end:] <= tail_threshold, len(y) - sustain_end)
    tail_end = min(len(y), sustain_end + tail_offset)

    attack_seconds = max(0.0, (peak_index - onset) / sample_rate)
    sustain_seconds = max(0.0, (sustain_end - sustain_start) / sample_rate)
    if attack_seconds >= 0.20:
        envelope_shape = "swelled"
    elif sustain_seconds >= 0.40:
        envelope_shape = "sustained"
    elif attack_seconds <= 0.08:
        envelope_shape = "impulsive"
    else:
        envelope_shape = "gated"

    valid_tests = []
    if sustain_seconds >= 0.40:
        valid_tests.append("beat")
    if sustain_seconds >= 0.80:
        valid_tests.append("partial_separation")

    def seconds(index: int) -> float:
        return round(index / sample_rate, 6)

    return {
        "onset_s": seconds(onset),
        "peak_s": seconds(peak_index),
        "sustain_s": [seconds(sustain_start), seconds(sustain_end)],
        "sustain_duration_s": round(sustain_seconds, 6),
        "tail_s": [seconds(sustain_end), seconds(tail_end)],
        "envelope_shape": envelope_shape,
        "tests_valid": valid_tests,
    }


def propose_notes(path: Path, model: Model) -> list[dict[str, Any]]:
    with contextlib.redirect_stdout(io.StringIO()):
        _, _, events = predict(
            path,
            model,
            onset_threshold=0.30,
            frame_threshold=0.20,
            minimum_note_length=40.0,
        )
    grouped: dict[int, dict[str, Any]] = {}
    for start, end, midi, amplitude, bends in events:
        current = grouped.get(midi)
        proposal = {
            "midi": int(midi),
            "name": librosa.midi_to_note(int(midi), unicode=False),
            "start_s": round(float(start), 6),
            "end_s": round(float(end), 6),
            "amplitude": round(float(amplitude), 6),
            "pitch_bends": [int(value) for value in bends] if bends else [],
            "status": "proposal_only",
        }
        if current is None or proposal["amplitude"] > current["amplitude"]:
            grouped[midi] = proposal
    return [grouped[midi] for midi in sorted(grouped)]


def analyse_file(path: Path, repo_root: Path, model: Model) -> dict[str, Any]:
    stereo, native_rate = librosa.load(path, sr=None, mono=False)
    channels = 1 if stereo.ndim == 1 else int(stereo.shape[0])
    mono = librosa.to_mono(stereo) if stereo.ndim > 1 else stereo
    y = librosa.resample(mono, orig_sr=native_rate, target_sr=TARGET_SAMPLE_RATE)
    segmentation = segment_audio(y, TARGET_SAMPLE_RATE)
    sustain_start = round(segmentation["sustain_s"][0] * TARGET_SAMPLE_RATE)
    sustain_end = round(segmentation["sustain_s"][1] * TARGET_SAMPLE_RATE)
    tuning_audio = y[sustain_start:sustain_end] if sustain_end > sustain_start else y
    tuning_bins = float(librosa.estimate_tuning(y=tuning_audio, sr=TARGET_SAMPLE_RATE))
    tuning_confidence = 0.0 if tuning_audio.size < round(0.30 * TARGET_SAMPLE_RATE) else 0.5
    declared = declared_from_filename(path)
    proposals = propose_notes(path, model)
    proposal_midis = tuple(proposal["midi"] for proposal in proposals)
    arbiter_evidence = []
    for proposal in proposals:
        evidence = analyse_candidate(
            tuning_audio,
            TARGET_SAMPLE_RATE,
            proposal["midi"],
            (midi for midi in proposal_midis if midi < proposal["midi"]),
            tuning_cents=tuning_bins * 100.0,
        )
        arbiter_evidence.append(evidence.to_dict())
    flags = ["harmonic_arbiter_real_audio_requires_review"]
    if any(not evidence["valid"] for evidence in arbiter_evidence):
        flags.append("harmonic_arbiter_abstained")
    if segmentation["sustain_duration_s"] < 0.30:
        flags.append("extension_unknown_short_sustain")
    if segmentation["envelope_shape"] not in {"impulsive", "sustained"}:
        flags.append("segmentation_needs_review")

    return {
        "schema_version": SCHEMA_VERSION,
        "file": str(path.relative_to(repo_root)),
        "sha256": sha256(path),
        "declared": declared,
        "audio": {
            "sample_rate": int(native_rate),
            "channels": channels,
            "duration_s": round(len(mono) / native_rate, 6),
            "peak_dbfs": round(float(librosa.amplitude_to_db(np.array([np.max(np.abs(mono))]), ref=1.0)[0]), 3),
        },
        "tuning": {
            "offset_cents": round(tuning_bins * 100.0, 3),
            "confidence": tuning_confidence,
        },
        "segmentation": segmentation,
        "observed": {
            "proposals": proposals,
            "arbiter_evidence": arbiter_evidence,
            "pitch_set_midi": None,
            "pitch_classes": None,
        },
        "chord_label": {
            "value": "unknown",
            "confidence": 0.0,
            "agrees_with_declared": "not_evaluated",
        },
        "flags": flags,
        "needs_review": True,
        "methods": {
            "basic_pitch": {
                "version": "0.4.0",
                "role": "high_recall_proposer",
                "onset_threshold": 0.30,
                "frame_threshold": 0.20,
                "minimum_note_length_ms": 40.0,
                "model": str(ICASSP_2022_MODEL_PATH),
            },
            "harmonic_arbiter": {
                "status": "proposal_conditioned_feature_not_decision_authority",
                "minimum_temporal_residual": MIN_TEMPORAL_RESIDUAL,
                "independent_source_search": {
                    "status": "review_evidence_only",
                    "candidate_harmonics": [2, 16],
                    "tolerance_cents": 8.0,
                },
            },
            "chroma": {"role": "human_visualisation_only", "votes": False},
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="*", type=Path, help="WAV files to analyse")
    parser.add_argument("--junction", action="store_true", help="analyse only JUNCTION-reachable chord hits")
    parser.add_argument("--output", type=Path, help="JSON output path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    drive_lab = Path(__file__).resolve().parents[1]
    repo_root = drive_lab.parents[1]
    sample_dir = repo_root / "_references/audio/samples/Jungle Samples/Synth One Shots"
    if args.junction:
        candidates = [path for path in sorted(sample_dir.glob("*.wav")) if declared_from_filename(path)["label"] in JUNCTION_CHORDS]
    else:
        candidates = [path.resolve() for path in args.paths]
    if not candidates:
        raise SystemExit("no samples selected; pass --junction or one or more WAV paths")

    output = args.output or repo_root / "_references/audio/analysis/junction-harmony-proposals.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    model = Model(ICASSP_2022_MODEL_PATH)
    records = []
    for path in candidates:
        records.append(analyse_file(path, repo_root, model))
        print(f"analysed {path.name}")
    report = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "git_sha": git_sha(repo_root),
        "scope": "junction_reachable_chord_hits" if args.junction else "explicit_paths",
        "sample_count": len(records),
        "decision_status": "proposals_only",
        "records": records,
    }
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(records)} proposal records to {output}")


if __name__ == "__main__":
    main()
