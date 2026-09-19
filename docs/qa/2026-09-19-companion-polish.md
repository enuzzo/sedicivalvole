# Companion first-screen refinement — September 19, 2026

Source checkpoint: `fb6f880`. Candidate build: `20260919-1003.fb6f880`.

The owner requested a short quality pass and explicitly prioritized seeing the
iPhone companion's sensor enablement and recalibration without scrolling.

## Changes

- Keep ENABLE, ZERO, RECENTER VIEW and STOP in the first compact phone viewport.
  The graph uses remaining height; detailed XYZ readings and disclosures follow.
  Compact phone steps retain labels and completion marks. The display guide keeps
  its existing illustrations. Short graphs omit crowded numerical ticks while
  preserving axis labels. No automatic scroll when ZERO is already visible.
- After a terminated connection, an explicit local sensor restart now restores
  local ZERO guidance. It cannot claim mutual readiness or reuse QR admission.
- Memoize the TRACE React component while preserving its independent renderer,
  live sample callback, camera reset and palette-change inputs.
- Remove 14 unreferenced companion CSS rules, totaling 1,111 source bytes.

## Verification

| Evidence | Result |
| --- | --- |
| Final clean-lockfile native regression | 973/973 |
| Affected motion, TRACE, typography and documentation checks | 67/67 |
| Production package | 828 exact hashes; VERSION and HTML identity match |
| Dependency attribution | 189 exact lockfile credits |
| Public hygiene before the new report | 1,500 text files, no findings |
| Compact launch / muted running view | 773 × 601, current local UI inspected |
| Companion layout | Actual CSS viewports 320 × 568, 390 × 844, 844 × 390 |
| Production smallest phone | ZERO bottom 443 px; STOP row bottom 544 px in 568 px height; no horizontal overflow |
| Controlled component flow | Enable, settling, ZERO, STOP, explicit local restart, local ZERO; no scroll needed for principal actions |

The controlled fixture bundles the actual component and substitutes sensors and
session transport only. It sends no synthetic mail or real signaling. It tests
layout and UI handlers, not physical sensor correctness or WebRTC acceptance.
Hot replacement of the fixture caused two duplicate-Three warnings; the fresh
production companion has no captured warning/error.

An in-memory probe using the installed React reconciler and actual TRACE
component body measures **601 executions without memoization versus 1 with it**
for mount plus 600 identical-property parent updates. Changing `resetKey` and
`themeKey` each causes one additional execution. Graphics effects and host JSX
are suppressed in that probe: it measures React execution count, not CPU/GPU
savings, real frame rate or endurance.

Initial regression used the system Python and failed the existing Python-version
deployment test; Python 3.11 passed. The first build found an incoherent local
MapLibre installation (6.4.1 and conflict copies against lockfile 6.7.0). Repeating
the credential-free exact-lockfile installation restored 6.7.0 and its stylesheet.
Git remained clean at the checkpoint. Final full regression and production build
were repeated successfully with the restored dependencies.

The old installation reappeared again during publication while tracked source
and all 828 candidate hashes remained intact. The generated dependency tree is
now an ignored symlink to the host-local, lockfile-keyed directory
`~/.cache/sedicivalvole/dependencies/darwin-x64/a44f544f69cc5a94/node_modules`.
It was populated with `npm ci --ignore-scripts --no-audit --no-fund`; no dependency
version changed. The previous generated tree is retained at
`/private/tmp/sv-node-modules-sync-backup-1789805356`. MapLibre 6.7.0, native wrapper
availability and the unchanged release hashes were rechecked. Future dependency
repairs on this host should use the local cache, preserving the ignored symlink.

Private local screenshots, controlled fixture and geometry captures are under
`prototype/drive-lab/output/playwright/2026-09-19-polish/` (ignored). Test/build
logs are `/tmp/sv-polish-tests-final.log` and `/tmp/sv-polish-build.log`.

## Remaining acceptance

Physical iPhone Safari viewport/toolbar/safe-area behavior, actual permission
prompts, holder calibration and Tesla transport remain open. No new audio or
visual steering, network protocol, dependency version or design direction.
Publication evidence is appended after canonical verification.

## Canonical publication verified

Official preserve-existing publication uploaded 39 files / 6,430,157 bytes,
reused 825 static files and 29 fully hash-verified recordings, retained two prior
assets and returned `remote_writes=ROOT_UPLOAD_ONLY`. All 11 independent HTTPS
checks pass, covering bare, cache-busted and phone HTML, current assets and a
repeated bare root. Canonical browser reload confirms `20260919-1003.fb6f880`,
all main controls visible at 390 × 844 and no captured warning/error.
[Canonical evidence](2026-09-19-companion-polish-canonical.json).
