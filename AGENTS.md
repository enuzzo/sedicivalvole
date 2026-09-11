# Agent instructions

## Scope and invariants

- Write code, comments, documentation, logs, UI and commit text in English; speak with the owner in Italian.
- Work in the saved Dropbox checkout; preserve unrelated work. Complete the requested scope without starting roadmap work. Use targeted search and relevant checks; do not load whole documentation sets or run every suite for a small fix.
- Never inspect, print, diff, copy or version `.env` or its local variants, or expose credentials. The sole exception is internal loading by `scripts/deploy_drive_lab_ftp.py` for authorized preflight/publication/postflight. `.env.example` contains placeholders only. Never version `_references/` or copy its external material into the repository.
- Preserve Engine/Flux separation, shared speed/audio-unlock/mute/lifecycle boundaries, reachable mode switching and in-product diagnostics. Virtual RPM/gears are not Tesla telemetry. Technical diagnostics remain coordinate-free; maps and explicit route exports have separate contracts.
- Original code/docs are PolyForm-Noncommercial-1.0.0, source-visible rather than open source. Original brand/media are excluded unless explicitly licensed; earlier AGPL releases retain their rights. `enuzzo` is the sole original creator/licensor. Preserve third-party ownership and notices; do not use Creative Commons for software.
- New visual directions require exactly three alternatives and owner selection before construction. Existing selections and explicit delegations remain valid; do not reopen this gate for ordinary fixes or already-selected refinements.
- Distinguish implemented, tested, live and physically accepted. Only current real renders count as screenshots. Validate affected UI at agreed Tesla viewports (including 773 × 601); browser evidence cannot prove vehicle listening, native controls or sustained Tesla GPU performance.
- `VERSION` is the sole SemVer source. Keep `CHANGELOG.md` append-only with local date/time, corresponding commit hash and deployment stamp when applicable. Update factual docs only when their facts change.
- Create/push verified checkpoints to the existing remote. Agreed product changes have standing canonical deployment authorization; no renewed confirmation. Read release guidance for publishing. Documentation/instruction-only work needs no product deployment.

## Context routing

Read only the matching topic below when changing that behavior, including fixes. These are active constraints, not a startup reading list. Follow deeper links only for the specific detail needed; search headings/sections in long documents instead of reading them in full.

| Task touches | Read |
| --- | --- |
| Engine audio, gears, TAMARRO, new banks or listening LAB | [Engine](docs/agent-context/engine.md) |
| Flux composition, Soundtrack transport or FX | [Music](docs/agent-context/music.md) |
| Visual renderer, shader, source bridge or catalogue variants | [Visuals](docs/agent-context/visuals.md) |
| Intro, chrome, drawers, palette UI or phone layout | [UI](docs/agent-context/ui.md) |
| Atlas, Stats, Discover, radar or Fly With | [Maps](docs/agent-context/maps.md) |
| GPS semantics, altitude, diagnostics or PDF/email reports | [Diagnostics](docs/agent-context/diagnostics.md) |
| Preloading, retries, browser cache or update/reload lifecycle | [Runtime](docs/agent-context/runtime.md) |
| Commit/release details, deployment, licensing, new sources or Sites handoff | [Release](docs/agent-context/release.md) |
| Architecture or service boundaries | Relevant section of [Technical direction](docs/TECHNICAL-DIRECTION.md) |
| Resuming interrupted work or checking delivery status | Relevant section of [Current state](docs/CURRENT-STATE.md) / [Session handoff](docs/SESSION-HANDOFF.md), checked against current Git/evidence |

Use skills only when their stated task applies; incidental UI/code edits do not themselves call for design research, audits or broad skill loading. No repository-local skills are currently defined.

Record durable new decisions in the matching contextual file; keep this root for broad rules. Current explicit owner decisions take precedence over older dated studies/handoffs. Historical instructions under `docs/agent-history/pre-gpt6-astra/` are not normal reading and cannot reinstate superseded gates.

If context becomes unreliable, inventory pending requirements/local edits and prepare a concrete handoff in the saved checkout. For missing desktop/mobile requirements, inspect available queue/history evidence before claiming absence; mark truncation rather than reconstructing text.
