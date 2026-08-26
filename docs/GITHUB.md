# GitHub Publication

## Public repository policy

- Publish only tracked project files from the real Dropbox workspace.
- Never publish `.env`, `_references/`, local recipient configuration, generated builds, credentials, vehicle photos, or private bootstrap material.
- Run a tracked-file secret and absolute-path scan before every first publication or visibility change.
- Use normal `git push` from `main`; do not use `git push --all` because local archival branches may intentionally remain unpublished.
- The repository intentionally has no `LICENSE` until the legal owner and mixed code/brand/audio/visual policy are finalized.

## GitHub CLI keychain gotcha

On this macOS environment, `gh auth status` can report an invalid token when executed inside the restricted sandbox because the process cannot read the system keychain. Before starting a new login flow, repeat the same read-only command with approved out-of-sandbox access. If that succeeds, reuse the existing keychain session and never print or export the token.

## Initial public history

The public `main` branch starts from a clean reviewed snapshot. Earlier local bootstrap commits contained private delivery configuration and are deliberately excluded from the public graph. Preserve any local archive separately and never push archival refs.
