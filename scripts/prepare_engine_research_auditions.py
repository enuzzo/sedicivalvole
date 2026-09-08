#!/usr/bin/env python3
"""Recreate research excerpts from already acquired source files and a manifest.

Usage: python3 scripts/prepare_engine_research_auditions.py INPUT_DIRECTORY OUTPUT_DIRECTORY
No network access, product writes, pitch changes or listening-quality claims.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys


if __name__ == "__main__":
    root = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    repository = Path(__file__).resolve().parent.parent
    manifest = json.loads((repository / "docs/qa/2026-09-08-engine-recordings/audition-manifest.json").read_text())
    # Verify every input before creating any output.
    for item in manifest:
        source = root / item["source_file"]
        if hashlib.sha256(source.read_bytes()).hexdigest() != item["source_sha256"]:
            raise ValueError("Source hash mismatch: " + item["id"])
    output.mkdir(parents=True, exist_ok=True)
    for item in manifest:
        destination = output / (item["id"] + ".wav")
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-i", str(root / item["source_file"]),
            "-ss", str(item["start_s"]), "-t", str(item["duration_s"]),
            "-af", "volume=-6dB", "-ar", "48000", "-c:a", "pcm_s16le", str(destination)
        ], check=True)
        item["recreated_sha256"] = hashlib.sha256(destination.read_bytes()).hexdigest()
        item["matches_recorded_output"] = item["recreated_sha256"] == item["output_sha256"]
    (output / "provenance.json").write_text(json.dumps(manifest, indent=2) + "\n")
    (output / "README.md").write_text(
        "# Research auditions\n\nOriginal speed, fixed -6 dB gain; not loudness matched. "
        "No auditory acceptance. See provenance.json for sources, authors, intervals and changes. "
        "Source terms remain separate from the project license.\n\n" +
        "\n\n".join(f"- {item['id']}: {item['creator']}; {item['license']}. "
                      f"[Source]({item['source_url']})." for item in manifest) +
        "\n\nLicense texts: https://creativecommons.org/licenses/by/4.0/ ; "
        "https://creativecommons.org/licenses/by/3.0/ ; "
        "https://creativecommons.org/publicdomain/zero/1.0/\n"
    )
    print(json.dumps({"excerpts": len(manifest), "matching_hashes": sum(item["matches_recorded_output"] for item in manifest)}))
