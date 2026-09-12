#!/usr/bin/env python3
"""Check tracked public text without printing matched data or reading secrets.

This is a focused release guard, not a complete secret scanner or history audit.
Ignored/untracked local files are never inspected. Findings contain locations only.
"""

import json
from pathlib import Path
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
HOME_PATH = re.compile(r"/(?:Users|home)/[^/\s<>]+/|[A-Za-z]:\\Users\\[^\\\s<>]+\\")
SECRET_SIGNATURE = re.compile(
    r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"
    r"|\bgh[pousr]_[A-Za-z0-9]{36,}\b"
    r"|\bgithub_pat_[A-Za-z0-9_]{50,}\b"
    r"|\bAKIA[0-9A-Z]{16}\b"
)


def main():
    names = subprocess.check_output(
        ["git", "ls-files", "-z"], cwd=ROOT
    ).decode().split("\0")
    findings = []
    checked = 0
    for name in filter(None, names):
        relative = Path(name)
        if any(part.startswith(".env") and part != ".env.example" for part in relative.parts):
            findings.append({"path": name, "kind": "tracked-secret-configuration"})
            continue
        if relative.parts[0] == "_references":
            findings.append({"path": name, "kind": "tracked-private-reference"})
            continue
        path = ROOT / relative
        if path.is_symlink():
            # Do not follow links outside the public source inventory.
            continue
        if not path.is_file():
            findings.append({"path": name, "kind": "missing-tracked-file"})
            continue
        content = path.read_bytes()
        if b"\0" in content:
            continue
        checked += 1
        for line, text in enumerate(content.decode("utf-8", errors="replace").splitlines(), 1):
            for kind, pattern in (("personal-home-path", HOME_PATH), ("credential-signature", SECRET_SIGNATURE)):
                if pattern.search(text):
                    findings.append({"path": name, "line": line, "kind": kind})
    print(json.dumps({"checkedTextFiles": checked, "findings": findings}, indent=2))
    return bool(findings)


if __name__ == "__main__":
    sys.exit(main())
