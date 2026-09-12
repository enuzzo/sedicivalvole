# Release readiness — resumable checklist

This is the active handoff for the owner's September 12 request. It is deliberately independent of a Codex account or conversation history. Update this file after each verified small task and commit useful checkpoints. A checked item means only the evidence stated beside it.

## Checklist

- [x] R01 — Read root/local agent instructions and relevant delivery, provenance, diagnostics and recovery contracts. Initial working tree clean; starting commit `31b9333`.
- [x] R02 — Establish this portable checklist and restart prompt before implementation.
- [ ] R03 — Read the latest relevant diagnostic emails; record only sanitized observations, build/date and actionable symptoms here. Keep raw mail/attachments outside Git.
- [ ] R04 — Audit public tracked files for machine paths, private operational details and sensitive material without opening `.env` or local secret variants.
- [ ] R05 — Assess historical Git exposure separately; report findings without rewriting history or printing sensitive values.
- [ ] R06 — Complete the Codex Security scan and validate source-backed findings; fix relevant confirmed issues.
- [ ] R07 — Put community/pro bono/no economic gain intentions and a practical rights-concern response route prominently at the top of README. Reconcile this statement with any existing support/donation UI and the current license.
- [ ] R08 — Verify README, LICENSE, LICENSE-SCOPE, NOTICE, third-party notices and generated community credits for consistent rights, exclusions, attribution and actual shipped content.
- [ ] R09 — Inspect current frontend at compact Tesla `773 × 601`, desktop and phone sizes: Intro, launch, running controls, drawers and REPORT. Capture temporary visual evidence and console/interaction results.
- [ ] R10 — Fix verified small visual/interaction defects within approved designs; no new visual direction without the existing three-option selection gate.
- [ ] R11 — Inspect startup/bundle, rendering/lifecycle and network/audio costs; measure representative behavior and implement justified performance fixes.
- [ ] R12 — Run focused tests and the required application/release gates for actual changes; record exact results and limitations.
- [ ] R13 — Commit/push verified checkpoints; publish product changes only after canonical delivery gates. Verify bare-root identity and assets after any publication.
- [ ] R14 — Record final evidence, outstanding device acceptance and next start; leave a clean, comprehensible handoff.

## Current checkpoint

- Work in progress: initial diagnostics discovery and security scan setup. No source review, product fix, build or deployment completed by this task yet.
- Security tool: the initial Standard scan start is pending in the original task. Resolve its returned scan context before starting another scan; do not duplicate an active scan.
- Mail: Gmail connectors are available in the original account. A bounded studio-mail search found no diagnostic report; personal-mail search is pending. A new account must have its own authorized access; never transfer credentials.
- Findings to verify: README currently opens with dated release notes and calls an older build current. It also documents a Buy Me a Coffee control; reconcile optional support with the owner's explicit no-economic-gain statement before claiming there is no revenue mechanism.
- Browser skill is absent; frontend verification can use the repository's existing Playwright workflow under the frontend-testing skill fallback.
- Private temporary tool state is not a portable artifact and must not be treated as completed evidence.

## Restart prompt

```text
Continue the September 12 release-readiness work in the saved sedicivalvole repository. Read AGENTS.md, prototype/drive-lab/AGENTS.md and docs/RELEASE-READINESS-2026-09-12.md first. Reconcile current Git status and recent commits, preserve existing edits and ensure there is only one writer. Do not execute unrelated historical backlog.

Complete the unchecked R01–R14 tasks in small verified units: recent diagnostic emails, frontend/visual polish, measured performance improvements, public-source and sensitive-data hygiene, licensing/provenance consistency, and a prominent honest community/pro bono statement. Update the checklist and its concise checkpoint after each unit, then commit and push useful verified checkpoints using the configured remote. Keep all public source/docs/commit text in English and explain progress to the owner in Italian.

Never open, print, copy, diff or version .env/local secret variants; the only exception is internal loading by the official deployment script. Keep private mail, attachments, coordinates, credentials, machine-specific operational details and temporary QA outside Git. Do not rewrite published history without explicit authority. Do not send messages to people. Use a new account's authorized connectors if available; if mail is inaccessible, state that limitation and continue independent tasks.

Preserve the approved designs and source provenance. Follow the actual changed behavior's tests and the canonical delivery gates before publishing any application changes. Keep implementation, local checks, browser evidence, commit/push, canonical deployment and physical Tesla/iPhone acceptance separate. Do not mark unchecked work complete merely to end a session. End with a short Italian status and exact next start.
```
