#!/usr/bin/env python3
"""Update only DEPLOY_REMOTE_PATH without exposing other .env values."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
TARGET = "sedicivalvole.app/public_html"


def main() -> int:
    original = ENV_PATH.read_text(encoding="utf-8")
    lines = original.splitlines()
    updated: list[str] = []
    replaced = False
    for line in lines:
        if line.startswith("DEPLOY_REMOTE_PATH="):
            updated.append(f"DEPLOY_REMOTE_PATH={TARGET}")
            replaced = True
        else:
            updated.append(line)
    if not replaced:
        updated.append(f"DEPLOY_REMOTE_PATH={TARGET}")

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=ROOT, delete=False) as handle:
        temporary = Path(handle.name)
        handle.write("\n".join(updated) + "\n")
    os.chmod(temporary, 0o600)
    os.replace(temporary, ENV_PATH)
    print("deploy_remote_path_update=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
