#!/usr/bin/env python3
"""Copy hash-verified, already acquired audio into an ignored local listening folder."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

parser = argparse.ArgumentParser()
parser.add_argument("--sources", type=Path, default=Path("/tmp/sedicivalvole-engine-research-20260908"))
args = parser.parse_args()
here = Path(__file__).resolve().parent
repo = here.parent.parent
output = repo / "_references/engine-listening-room"
catalog = json.loads((here / "catalog.json").read_text())
inputs = []
for item in catalog:
    source = (repo if item["sourceFile"].startswith("_references/") else args.sources) / item["sourceFile"]
    if hashlib.sha256(source.read_bytes()).hexdigest() != item["sha256"]:
        raise ValueError("Source hash mismatch: " + item["code"])
    inputs.append((source, output / item["media"]))
for source, destination in inputs:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists() or hashlib.sha256(destination.read_bytes()).hexdigest() != hashlib.sha256(source.read_bytes()).hexdigest():
        shutil.copyfile(source, destination)
for filename in ("index.html", "app.js", "style.css", "notes.js", "catalog.json"):
    if (here / filename).is_file():
        shutil.copyfile(here / filename, output / filename)
(output / "SOURCE-NOTICES.md").write_text(
    "# Local listening source notices\n\nResearch only. No audio is licensed under the project's PolyForm license. "
    "Retain each source's own terms. Public previews are not original masters. "
    "Files are byte-identical to the recorded hashes; prepared excerpts retain their earlier documented edits.\n\n" +
    "\n\n".join(f"- {x['code']} — {x['title']}. {x['creator']}. {x['license']}. "
                  f"[Source]({x['sourceUrl']}). {x['note']} SHA-256: {x['sha256']}" for x in catalog) +
    "\n\nLicense references: https://creativecommons.org/publicdomain/zero/1.0/ ; "
    "https://creativecommons.org/licenses/by/4.0/ ; https://creativecommons.org/licenses/by/3.0/ ; "
    "https://creativecommons.org/licenses/by-sa/3.0/ ; https://creativecommons.org/licenses/by-sa/4.0/\n"
)
print(json.dumps({"files": len(inputs), "output": str(output)}))
