# TAMARRO / Show-off verification — 2026-09-07

Implementation **cd99d06**, built source **cb88e2a**, build **20260907-1256**.
The owner clarified a neutral throttle-blipping performance, not a held pedal.

- [Local actual-WAV browser evidence](browser-evidence.json): three profiles,
  four/five measured peaks, near-limiter RPM, non-silent output below clipping,
  neutral throughout, natural idle return, opposite-button stop, keyboard and mute.
- [Local screenshot](show-off.png) is an actual 773 × 601 Chrome capture.
- 652 native regression tests, ten post-build checks and 196 dependency credits pass.
- Engine samples, upstream code and global gain are unchanged. The original host
  envelope has variable timing/peaks within a bounded 3.26–4.75 second phrase.
- Browser plugin not available: regular Playwright/Chrome headless was used.
  GPS is synthetic, and no diagnostic is sent. Browser evidence is not physical
  listening acceptance or proof of real vehicle GPS/native-media behavior.

The test is reproducible with `scripts/qa-engine-show-off.mjs` from drive-lab;
`QA_URL` selects the server, `QA_OUTPUT` the evidence folder and `EXPECT_BUILD`
checks the exact published candidate. PLAYWRIGHT_MODULE and CHROME_EXECUTABLE
may select installed development tools without adding application dependencies.


## Canonical verification

- [Public browser evidence](live/browser-evidence.json), including exact build
  identity and full per-profile RPM/audio traces; five detected peaks per profile.
- [Public screenshot](live/show-off.png), inspected at 773 × 601.
- [28 public byte checks](canonical-hashes.json), [preflight](preflight.txt),
  [publication](publish.txt) and [independent postflight](postflight.txt).
- The initial public test reused a 700 ms local profile-loading wait. The duration
  assertion failed. Inferred cause: a new bank could finish during a phrase and
  reset the gesture. The reproducible script now waits for SAMPLE ENGINE
  before starting each profile; all three pass. No runtime change was needed.
- Target-vehicle listening remains open. Existing pre-gesture audio-policy and
  build warnings are unchanged by this host-envelope correction.
