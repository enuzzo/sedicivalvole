#!/usr/bin/env python3
"""Maintain the README's complete locked npm credits, without installing packages.

Run --refresh after a lockfile change (public npm metadata only), then --check.
The curated people/media/service credits still require editorial maintenance.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import re
from urllib.parse import quote
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / "prototype/drive-lab/package-lock.json"
INVENTORY = ROOT / "docs/community-npm-credits.json"
README = ROOT / "README.md"
START = "<!-- NPM-CREDITS:START -->"
END = "<!-- NPM-CREDITS:END -->"
FOOTER = "<!-- COMMUNITY-CREDITS:END -->"


def locked():
    return {path: item for path, item in json.loads(LOCK.read_text())["packages"].items() if path}


def metadata(entry):
    path, item = entry
    name = path.rsplit("node_modules/", 1)[-1]
    version = item["version"]
    source = f"https://registry.npmjs.org/{quote(name, safe='')}/{quote(version, safe='')}"
    with urlopen(source, timeout=30) as response:
        data = json.load(response)
    if data.get("name") != name or data.get("version") != version:
        raise ValueError(f"Unexpected registry identity for {name}@{version}")
    author = data.get("author", {})
    author = author.get("name", "") if isinstance(author, dict) else str(author)
    author = re.sub(r"\s*<[^>]*>|\s*\(https?://[^)]*\)", "", author).strip()
    repo = data.get("repository", {})
    repo = repo.get("url", "") if isinstance(repo, dict) else str(repo)
    repo = re.sub(r"^git\+", "", repo)
    repo = re.sub(r"^git://", "https://", repo)
    repo = re.sub(r"^git@github.com:|^ssh://git@github.com/", "https://github.com/", repo)
    repo = re.sub(r"\.git$", "", repo)
    if not repo.startswith("https://"):
        repo = ""
    homepage = data.get("homepage", "")
    if not isinstance(homepage, str) or not homepage.startswith("https://"):
        homepage = ""
    return {"path": path, "name": name, "version": version,
            "author": author or "Project contributors (no author field published)",
            "repository": repo, "homepage": homepage, "metadata": source,
            "description": data.get("description", "No package description published."),
            "development": bool(item.get("dev")), "optional": bool(item.get("optional"))}


def cell(value):
    return str(value).replace("|", "&#124;").replace("\n", " ").replace("<", "&lt;").replace(">", "&gt;")


def render(rows):
    lines = [START, "<details>", f"<summary>🧩 Every locked npm dependency — {len(rows)} entries, including transitive and optional platform packages</summary>", "",
             "These are exact lockfile entries, not a claim that every package ships in the browser or runs on this Mac. Build/development and optional platform packages are identified separately. Author names and descriptions come from each exact release's public npm metadata; a missing author is stated explicitly, never inferred from a maintainer account. Nested versions are credited separately. Repository/homepage links preserve upstream metadata and may redirect. Package descriptions explain their general purpose; the curated table above explains our direct integrations.", "",
             "| Package / exact version | Published author | Original source | Dependency role / purpose |", "|---|---|---|---|"]
    for row in rows:
        links = []
        for key, label in (("repository", "Repository"), ("homepage", "Project page"), ("metadata", "Release metadata")):
            if row[key]:
                links.append(f"[{label}]({row[key]})")
        role = "Build / development" if row["development"] else "Application dependency tree"
        if row["optional"]:
            role += "; optional / platform-specific"
        lines.append(f"| 🧩 {cell(row['name'])} `{cell(row['version'])}` | {cell(row['author'])} | {' · '.join(links)} | {role}. {cell(row['description'])} |")
    return "\n".join(lines + ["", "</details>", END])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    packages = locked()
    if args.refresh:
        with ThreadPoolExecutor(max_workers=8) as pool:
            rows = list(pool.map(metadata, sorted(packages.items())))
        INVENTORY.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n")
    rows = json.loads(INVENTORY.read_text())
    identities = {row["path"]: (row["name"], row["version"], row["development"], row["optional"]) for row in rows}
    expected = {path: (path.rsplit("node_modules/", 1)[-1], item["version"], bool(item.get("dev")), bool(item.get("optional"))) for path, item in packages.items()}
    if len(rows) != len(identities) or identities != expected:
        raise SystemExit("Credits differ from package-lock.json; run --refresh and review.")
    content = README.read_text()
    if content.count(START) != 1 or content.count(END) != 1:
        raise SystemExit("README must contain one npm credits marker pair.")
    before, rest = content.split(START)
    _, after = rest.split(END)
    updated = before + render(rows) + after
    if not updated.rstrip().endswith(FOOTER):
        raise SystemExit("Community credits must remain the final README section.")
    if args.check and updated != content:
        raise SystemExit("README credits are stale; run the script without --check.")
    if not args.check:
        README.write_text(updated)
    print(f"PASS: {len(rows)} exact lockfile credits; community credits at README end.")


if __name__ == "__main__":
    main()
