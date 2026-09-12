# Release readiness — resumable checklist

This is the active handoff for the owner's September 12 request. It is deliberately independent of a Codex account or conversation history. Update this file after each verified small task and commit useful checkpoints. A checked item means only the evidence stated beside it.

## Checklist

- [x] R01 — Read root/local agent instructions and relevant delivery, provenance, diagnostics and recovery contracts. Initial working tree clean; starting commit `31b9333`.
- [x] R02 — Establish this portable checklist and restart prompt before implementation.
- [x] R03 — Read the two latest diagnostic emails (September 11, 18:58 and 19:01 UTC, build `20260911-1711`). Extracted complete MIME gzip attachments through the raw-message API; decompressed JSON and gzip SHA-256 match each mail body. Sanitized findings below; raw material stays outside Git.
- [ ] R04 — Audit public tracked files for machine paths, private operational details and sensitive material without opening `.env` or local secret variants.
- [ ] R05 — Assess historical Git exposure separately; report findings without rewriting history or printing sensitive values.
- [ ] R06 — Complete the Codex Security scan and validate source-backed findings; fix relevant confirmed issues.
- [x] R07 — README now opens with community/pro bono/non-profit intent, a rights-concern route and preserved third-party rights. Owner explicitly selected retaining optional donations: free access and no donor privileges are stated plainly.
- [ ] R08 — Verify README, LICENSE, LICENSE-SCOPE, NOTICE, third-party notices and generated community credits for consistent rights, exclusions, attribution and actual shipped content.
- [ ] R09 — Inspect current frontend at compact Tesla `773 × 601`, desktop and phone sizes: Intro, launch, running controls, drawers and REPORT. Capture temporary visual evidence and console/interaction results.
- [ ] R10 — Fix verified small visual/interaction defects within approved designs; no new visual direction without the existing three-option selection gate.
- [ ] R11 — Inspect startup/bundle, rendering/lifecycle and network/audio costs; measure representative behavior and implement justified performance fixes.
- [ ] R12 — Run focused tests and the required application/release gates for actual changes; record exact results and limitations.
- [ ] R13 — Commit/push verified checkpoints; publish product changes only after canonical delivery gates. Verify bare-root identity and assets after any publication.
- [ ] R14 — Record final evidence, outstanding device acceptance and next start; leave a clean, comprehensible handoff.

## Current checkpoint

- Continuity checkpoint `3d23211` committed and pushed to the configured remote. Native toolchain check passes on this host. No product fix, build or deployment completed by this task yet.
- Security tool: Standard scan `a6a7a08a-20e8-4a5d-a16e-e8157108e3aa`, target revision `31b9333`, has passed preflight and entered threat mapping. Read-only independent baseline and architecture reviews are active in the original task. A LAB login-window candidate is durably saved, awaiting parent validation. Resolve the existing scan before starting another; do not duplicate it. Daybreak advisory: access not granted, programs none; this does not block scanning.
- Mail: complete latest diagnostic attachments reviewed through the original account's authorized connector. A new account must have its own authorized access; never transfer credentials. Their sanitized observations below are sufficient to continue code investigation without raw mail.
- Findings to verify: README currently opens with dated release notes and calls an older build current. It also documents a Buy Me a Coffee control; reconcile optional support with the owner's explicit no-economic-gain statement before claiming there is no revenue mechanism.
- Browser skill is absent; frontend verification can use the repository's existing Playwright workflow under the frontend-testing skill fallback.
- Private temporary tool state is not a portable artifact and must not be treated as completed evidence.

## Sanitized observations and next small tasks

- The two latest packets are overlapping snapshots of the same session, not two independent trials. Both retain zero runtime issues. The later packet records acceptance of the automatic send; actual inbox receipt is verified by the received message.
- Air Atlas: average `22.98 FPS`, target `60`, retained-frame p95 `69.52 ms`, approximately `44.9 s` of sampled frames and one observation gap. In the later packet, 49 of the 60 retained long tasks belong to Air Atlas. Profile the current implementation; these measurements belong to the older received build.
- Japanese Mist: `59.25 FPS`, p95 `16.8 ms`; Vertigo: `59.98 FPS`, p95 `22.51 ms`. Engine: `10.02 FPS` against its intentional `10 FPS` telemetry target. Do not interpret Engine's raw over-50-ms counter as a failed 60-FPS renderer.
- Media Session repeatedly republishes unchanged track metadata/playback state on media-clock updates. Inspect `App.jsx`'s presentation effect and separate stable presentation from position updates while retaining action handlers, artwork recovery and truthful playback.
- Public tracked-file path scan found no tracked `.env`/private reference path, but found 71 personal-home-path occurrences in 14 text files, including historical handoffs and `scripts/sample-library.mjs` under Drive Lab. Sanitize original project material and replace the executable hardcoded sample root with repository-relative resolution. Preserve third-party bytes and explicitly record archival redaction.
- Owner decision: retain Buy Me a Coffee as optional support. The free service does not sell access, features or donor privileges; non-profit intent does not mean no contributions can be received.
- Current-tree cleanup completed: 71 personal filesystem references in 14 files removed; archive redaction disclosed in `docs/agent-history/PRIVACY-REDACTION.md`; sample root now resolves relative to the authoring module. `python3 scripts/check_public_hygiene.py` passes on 1,447 tracked text files; focused documentation/sample-tool tests pass 15/15; generated dependency credits pass 196/196. This guard covers named signatures, not all possible secrets or Git history.
- Hygiene/README checkpoint `2c0956c` committed and pushed. Optional-support clarification follows the owner's explicit answer.
- LAB fix: the expired authentication window now resets both timestamp and count; an exclusive lock reserves attempts before PBKDF2, storage errors fail closed, and successful login keeps the shared counter inode. PHP syntax passes; native-wrapper LAB tests pass 10/10 including two exhausted windows, 16 concurrent attempts, corrupted storage and missing storage.
- Runtime work in progress: Media Session presentation separated from position updates; diagnostic page location reduced to approved paths, URL/local-path text removed before issue/event retention and transport fitting. First focused runtime test pass: 49/49; later serialization changes still need a rerun. Not built or deployed yet.
- Owner instruction: preserve the current SiteGround transport for now. Plain FTP remains an explicitly known residual risk, with no claim of observed interception or secure transport. Never expose or version `.env`; no protocol migration is authorized by this task.
- History credential scan is running with full redaction and explicit Git path exclusions for `.env` variants, local-secret filenames and private references. Do not mark it passed before its process exits and results are reviewed.

## Restart prompt

```text
Continue the September 12 release-readiness work in the saved sedicivalvole repository. Read AGENTS.md, prototype/drive-lab/AGENTS.md and docs/RELEASE-READINESS-2026-09-12.md first. Reconcile current Git status and recent commits, preserve existing edits and ensure there is only one writer. Do not execute unrelated historical backlog.

Complete the unchecked R01–R14 tasks in small verified units: recent diagnostic emails, frontend/visual polish, measured performance improvements, public-source and sensitive-data hygiene, licensing/provenance consistency, and a prominent honest community/pro bono statement. Update the checklist and its concise checkpoint after each unit, then commit and push useful verified checkpoints using the configured remote. Keep all public source/docs/commit text in English and explain progress to the owner in Italian.

Never open, print, copy, diff or version .env/local secret variants; the only exception is internal loading by the official deployment script. Keep private mail, attachments, coordinates, credentials, machine-specific operational details and temporary QA outside Git. Do not rewrite published history without explicit authority. Do not send messages to people. Use a new account's authorized connectors if available; if mail is inaccessible, state that limitation and continue independent tasks.

Preserve the approved designs and source provenance. Follow the actual changed behavior's tests and the canonical delivery gates before publishing any application changes. Keep implementation, local checks, browser evidence, commit/push, canonical deployment and physical Tesla/iPhone acceptance separate. Do not mark unchecked work complete merely to end a session. End with a short Italian status and exact next start.
```
