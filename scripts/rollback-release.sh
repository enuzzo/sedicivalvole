#!/usr/bin/env bash
# Rebuild a previous release from a Git tag or commit and hand it to the
# official deployment script.
#
#   scripts/rollback-release.sh <tag-or-commit>            build + read-only verify (no remote writes)
#   scripts/rollback-release.sh <tag-or-commit> --publish  build + verify + preserve-existing publication
#
# The ref is built in a temporary worktree, never in this checkout's source.
# Its client build replaces prototype/drive-lab/dist (the current one is kept
# beside it). The official deploy script loads its own configuration; this
# script never reads, copies or links any environment file.
set -euo pipefail

ref="${1:-}"
mode="${2:-}"
if [[ -z "$ref" ]]; then
  echo "usage: scripts/rollback-release.sh <tag-or-commit> [--publish]" >&2
  exit 2
fi
if [[ -n "$mode" && "$mode" != "--publish" ]]; then
  echo "unknown option: $mode" >&2
  exit 2
fi

root="$(git rev-parse --show-toplevel)"
cd "$root"
commit="$(git rev-parse --verify --quiet "${ref}^{commit}")" || { echo "unknown ref: $ref" >&2; exit 2; }
short="$(git rev-parse --short "$commit")"
stamp="$(date +%Y%m%d-%H%M%S)"
worktree="$root/prototype/drive-lab/output/rollback-$short-$stamp"

echo "rollback target: $ref ($short)"
git worktree add --detach "$worktree" "$commit" >/dev/null
cleanup() { git -C "$root" worktree remove --force "$worktree" >/dev/null 2>&1 || true; }
trap cleanup EXIT

lab="$worktree/prototype/drive-lab"
if git diff --quiet "$commit" HEAD -- prototype/drive-lab/package-lock.json; then
  ln -s "$root/prototype/drive-lab/node_modules" "$lab/node_modules"
else
  echo "lockfile differs from HEAD: installing the target's exact dependencies"
  (cd "$lab" && npm ci --no-audit --no-fund)
fi

(cd "$lab" && SEDICIVALVOLE_NO_LOCAL_ENV=1 npm run build)

current="$root/prototype/drive-lab/dist"
if [[ -d "$current" ]]; then
  mv "$current" "$root/prototype/drive-lab/output/dist-before-rollback-$stamp"
  echo "previous build kept in prototype/drive-lab/output/dist-before-rollback-$stamp"
fi
cp -R "$lab/dist" "$current"
grep -o '20[0-9]\{6\}-[0-9]\{4\}' "$current/client/index.html" | head -1 | sed 's/^/rollback build stamp: /'

python3 "$root/scripts/deploy_drive_lab_ftp.py" --verify-only
if [[ "$mode" == "--publish" ]]; then
  python3 "$root/scripts/deploy_drive_lab_ftp.py" --publish --preserve-existing
  python3 "$root/scripts/deploy_drive_lab_ftp.py" --verify-only
  echo "published $short; verify the canonical URL as described in docs/DEPLOY.md"
else
  echo "dry run complete: nothing was published (pass --publish to deploy $short)"
fi
