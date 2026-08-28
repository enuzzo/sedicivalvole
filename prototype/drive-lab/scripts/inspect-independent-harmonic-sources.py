#!/usr/bin/env python3
"""Inspect lower harmonic-source hypotheses without relying on note proposals."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import librosa

DRIVE_LAB = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(DRIVE_LAB))

from analysis.harmonic_arbiter import independent_harmonic_sources


TARGET_SAMPLE_RATE = 48_000


def inspect_record(record: dict, repo_root: Path) -> dict:
    path = repo_root / record["file"]
    stereo, native_rate = librosa.load(path, sr=None, mono=False)
    mono = librosa.to_mono(stereo) if stereo.ndim > 1 else stereo
    audio = librosa.resample(mono, orig_sr=native_rate, target_sr=TARGET_SAMPLE_RATE)
    start_s, end_s = record["segmentation"]["sustain_s"]
    start = round(start_s * TARGET_SAMPLE_RATE)
    end = round(end_s * TARGET_SAMPLE_RATE)
    sustain = audio[start:end] if end > start else audio
    tuning_cents = float(record["tuning"]["offset_cents"])
    candidates = []
    for proposal in record["observed"]["proposals"]:
        sources = independent_harmonic_sources(
            sustain,
            TARGET_SAMPLE_RATE,
            int(proposal["midi"]),
            tuning_cents,
        )
        candidates.append(
            {
                "midi": int(proposal["midi"]),
                "name": proposal["name"],
                "independent_sources": [source.__dict__ for source in sources],
            }
        )
    return {
        "file": record["file"],
        "declared": record["declared"],
        "proposal_pitch_set_midi": [int(proposal["midi"]) for proposal in record["observed"]["proposals"]],
        "candidates": candidates,
        "decision_status": "review_evidence_only",
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", type=Path, help="existing proposer report")
    parser.add_argument("--label", help="optional declared chord label filter")
    parser.add_argument("--output", type=Path, required=True, help="JSON evidence output path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    repo_root = DRIVE_LAB.parents[1]
    source = json.loads(args.report.read_text(encoding="utf-8"))
    selected = [
        record
        for record in source["records"]
        if args.label is None or record["declared"]["label"] == args.label
    ]
    if not selected:
        raise SystemExit("no records matched the requested label")
    report = {
        "schema_version": "0.1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_report": str(args.report),
        "method": {
            "role": "independent_lower_source_search",
            "status": "review_evidence_only",
            "candidate_harmonics": [2, 16],
            "tolerance_cents": 8.0,
        },
        "records": [inspect_record(record, repo_root) for record in selected],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(selected)} review-only records to {args.output}")


if __name__ == "__main__":
    main()
