# Visual recovery and diagnostic accounting — 2026-09-07

Implementation: `9b57fc3`; candidate built from `f590f51`, stamp
`20260907-0930`, version supplied by `VERSION` (`0.0.0`).

## Verified locally

- Native suites: 639 tests, zero failures. Includes PHP/server transport,
  upstream integrity and all product groups; post-build identity/package tests:
  10/10. README dependency coverage: 196/196. Whitespace validation passes.
- Frame-counter fixtures cover 60 Hz, 33.3/33.4 ms and 50 ms observations plus a
  30-minute gap; the gap is separate from the observed FPS distribution.
- Driving fixture at 36 km/h with four observed seconds around a 30-minute gap
  reports 0.04 km, four observed seconds and 1,800 unobserved seconds, without
  inventing travel inside the gap.
- Recovery fixtures cover increasing delays, connectivity/foreground gating,
  expiry, successful reset and disposal of stale callbacks.
- Headless installed Chrome at the target `773 × 601` viewport: selected Mute
  and Drivey, held the first iframe without its ready signal, observed the
  15-second failure and automatic retry, then the actual upstream ready frame.
  Exactly two iframe requests, no diagnostic sends, no console warnings/errors.
- A separate run forced the browser offline after starting. It displayed the
  connection-wait state and did not retry offline; restoring connectivity
  caused recovery without reselection. Console entries were limited to six
  deliberately induced `ERR_INTERNET_DISCONNECTED` resource failures.
- Rendered REPORT → SHOW RAW confirms mute exposure, no inactive arrangement,
  and the `visual.recovery.retry` event. Both failure and recovered screenshots
  were inspected. QA raw reports/screenshots are local temporary evidence and
  contain synthetic sessions; no user mail attachments entered Git.

## Boundaries

This fixes diagnostic interpretation and visual recovery. It does not claim a
physical ATLAS frame-rate improvement, uninterrupted background browser execution,
full native-media-control acceptance or a measured multi-hour endurance run.
Only the selected visual's handled failures use the new recovery controller.
Standard/Dev diagnostics and periodic transmission remain future work, recorded
in the owner decisions document. The diagnostic submit endpoint was blocked in
browser QA and received no test message.

Canonical publication passed. The same failure/retry/ready/report flow passed on
`https://sedicivalvole.app/` with exactly two iframe requests, no console
warnings/errors and zero diagnostic sends. REPORT confirmed build
`20260907-0930` / source `f590f51`. All ten canonical identity/cache comparisons
passed; complete publication evidence is recorded in `DEPLOY.md`.

Independent official postflight also passed with `remote_writes=NONE`. The local
Vite development server emitted existing public-SVG raw-import advisories; the
production build and live browser flow passed. No production-console advisory
was observed in the tested flow.
