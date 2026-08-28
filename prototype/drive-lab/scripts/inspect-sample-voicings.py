#!/usr/bin/env python3
"""Compare proposal-only sample voicings without promoting them to truth."""

from __future__ import annotations

import argparse
import itertools
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


FORBIDDEN_VOICED_INTERVALS = frozenset({1, 13})
NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")


def note_name(midi: int) -> str:
    return f"{NOTE_NAMES[midi % 12]}{midi // 12 - 1}"


def proposal_midis(record: dict) -> list[int]:
    return sorted({int(proposal["midi"]) for proposal in record["observed"]["proposals"]})


def weighted_register_centroid(record: dict) -> Optional[float]:
    proposals = record["observed"]["proposals"]
    total = sum(max(0.0, float(proposal.get("amplitude", 0.0))) for proposal in proposals)
    if total <= 0.0:
        return None
    return sum(
        int(proposal["midi"]) * max(0.0, float(proposal.get("amplitude", 0.0)))
        for proposal in proposals
    ) / total


def collision(lower_midi: int, upper_midi: int, *, scope: str, lower_file: str, upper_file: str) -> dict:
    return {
        "scope": scope,
        "lower": {"file": lower_file, "midi": lower_midi, "name": note_name(lower_midi)},
        "upper": {"file": upper_file, "midi": upper_midi, "name": note_name(upper_midi)},
        "interval_semitones": upper_midi - lower_midi,
        "status": "proposal_collision_requires_review",
    }


def within_take_collisions(record: dict) -> list[dict]:
    file = record["file"]
    return [
        collision(lower, upper, scope="within_take", lower_file=file, upper_file=file)
        for lower, upper in itertools.combinations(proposal_midis(record), 2)
        if upper - lower in FORBIDDEN_VOICED_INTERVALS
    ]


def cross_boundary_collisions(outgoing: dict, incoming: dict) -> list[dict]:
    result = []
    for outgoing_midi in proposal_midis(outgoing):
        for incoming_midi in proposal_midis(incoming):
            interval = abs(incoming_midi - outgoing_midi)
            if interval not in FORBIDDEN_VOICED_INTERVALS:
                continue
            lower, upper = sorted((outgoing_midi, incoming_midi))
            result.append(
                collision(
                    lower,
                    upper,
                    scope="cross_boundary_union",
                    lower_file=outgoing["file"] if outgoing_midi == lower else incoming["file"],
                    upper_file=incoming["file"] if incoming_midi == upper else outgoing["file"],
                )
            )
    unique = {
        (
            item["lower"]["file"],
            item["lower"]["midi"],
            item["upper"]["file"],
            item["upper"]["midi"],
        ): item
        for item in result
    }
    return list(unique.values())


def record_review(record: dict) -> dict:
    midis = proposal_midis(record)
    f_sharps = [midi for midi in midis if midi % 12 == 6]
    centroid = weighted_register_centroid(record)
    return {
        "file": record["file"],
        "declared": record["declared"],
        "proposal_pitch_set_midi": midis,
        "proposal_pitch_set": [note_name(midi) for midi in midis],
        "lowest_proposed_midi": None if not midis else midis[0],
        "lowest_proposed_note": None if not midis else note_name(midis[0]),
        "lowest_proposed_f_sharp": None if not f_sharps else {
            "midi": f_sharps[0],
            "name": note_name(f_sharps[0]),
            "status": "proposal_only",
        },
        "weighted_register_centroid_midi": None if centroid is None else round(centroid, 3),
        "within_take_collisions": within_take_collisions(record),
        "decision_status": "review_evidence_only",
    }


def transition_review(outgoing: dict, incoming: dict) -> dict:
    outgoing_midis = proposal_midis(outgoing)
    incoming_midis = proposal_midis(incoming)
    outgoing_centroid = weighted_register_centroid(outgoing)
    incoming_centroid = weighted_register_centroid(incoming)
    return {
        "from_file": outgoing["file"],
        "to_file": incoming["file"],
        "lowest_note_distance_semitones": None if not outgoing_midis or not incoming_midis else abs(
            outgoing_midis[0] - incoming_midis[0]
        ),
        "register_centroid_distance_semitones": None if outgoing_centroid is None or incoming_centroid is None else round(
            abs(outgoing_centroid - incoming_centroid), 3
        ),
        "peak_level_delta_db": round(abs(
            float(outgoing["audio"]["peak_dbfs"]) - float(incoming["audio"]["peak_dbfs"])
        ), 3),
        "loudness_delta_lu": None,
        "roughness_ratio": None,
        "boundary_flux_ratio": None,
        "cross_boundary_collisions": cross_boundary_collisions(outgoing, incoming),
        "decision_status": "review_evidence_only",
        "missing_measurements": ["loudness_delta_lu", "roughness_ratio", "boundary_flux_ratio"],
    }


def build_report(source: dict, label: Optional[str]) -> dict:
    selected = [
        record for record in source["records"]
        if label is None or record["declared"]["label"] == label
    ]
    if not selected:
        raise ValueError("no records matched the requested label")
    groups: dict[str, list[dict]] = defaultdict(list)
    for record in selected:
        groups[record["declared"]["label"]].append(record)
    return {
        "schema_version": "0.1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_report": source.get("source_report"),
        "method": {
            "role": "proposal_voicing_and_transition_review",
            "status": "review_evidence_only",
            "forbidden_voiced_intervals_semitones": sorted(FORBIDDEN_VOICED_INTERVALS),
            "notes": "Proposal timing and pitch are not authoritative; rendered-transition metrics remain required.",
        },
        "records": [record_review(record) for record in selected],
        "label_groups": [
            {
                "label": group_label,
                "transitions": [
                    transition_review(outgoing, incoming)
                    for outgoing, incoming in itertools.permutations(records, 2)
                ],
            }
            for group_label, records in sorted(groups.items())
        ],
        "decision_status": "review_evidence_only",
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", type=Path, help="existing proposer report")
    parser.add_argument("--label", help="optional declared chord label filter")
    parser.add_argument("--output", type=Path, required=True, help="JSON review output path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source = json.loads(args.report.read_text(encoding="utf-8"))
    try:
        report = build_report(source, args.label)
    except ValueError as error:
        raise SystemExit(str(error)) from error
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(report['records'])} review-only voicing records to {args.output}")


if __name__ == "__main__":
    main()
