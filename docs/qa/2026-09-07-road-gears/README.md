# Everyday-road Engine gearing verification — 2026-09-07

Actual-WAV browser testing at 773 × 601 uses a controlled rising GPS stream.
[Trace evidence](browser-evidence.json) separates injected speed from the app's
filtered speed. All three profiles reach second by 39–40 and third by 69–70 km/h
of the rising input, including filtering and audio transition completion.

- [Third near 70](third-at-70.png): actual Engine render, no mock.
- [Missing speed](no-speed-signal.png): steady 1000 RPM and disabled rev gestures.
- [Confirmed-stop blip](idle-blip.png): 1000–1450 RPM, with real sample output.
- 655 native checks cover ratio calibration, all gear boundaries, stable high-drive
  behavior around boundaries, shifted RPM limits and absence of untrusted blips.
- The Browser plugin is not available; Playwright/Chrome headless is the retained
  frontend-testing fallback. GPS is synthetic. No diagnostic is sent. Physical
  listening, actual GPS cadence and driver preference remain owner checks.

Run `scripts/qa-engine-road-gears.mjs` with QA_URL, QA_OUTPUT and optional
EXPECT_BUILD. Installed tools may be selected with PLAYWRIGHT_MODULE and
CHROME_EXECUTABLE, without changing application dependencies.


## Canonical publication

Build **20260907-1316**, source **9087bda**, implementation **efeaaf6**, version **0.0.0**.

- [Public browser evidence](live/browser-evidence.json): second by 40 and third
  by 70 in every profile, explicit missing-speed and confirmed-stop blip checks.
- [Public third gear](live/third-at-70.png), [no speed](live/no-speed-signal.png)
  and [actual idle blip](live/idle-blip.png), all inspected at 773 × 601.
- [28 canonical hashes](canonical-hashes.json), [preflight](preflight.txt),
  [publication](publish.txt) and [independent postflight](postflight.txt).
- Real WAVs with controlled GPS; zero page exceptions and diagnostic sends.
  Target-vehicle listening and GPS behavior remain unverified by this fixture.
