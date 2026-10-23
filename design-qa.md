# Veduta — active visual comparison

final result: blocked

This is a development preview, not an accepted artistic implementation or a
publication candidate. Functional/build gates do not close the findings below.
The prior guided companion review is [preserved separately](docs/PHONE-DESIGN-QA-PRESERVED-2026-10-23.md);
this Veduta comparison does not resolve its owner acceptance.

## Evidence and normalization

- Target: owner-selected first Image Gen direction, forward toward the horizon,
  refined with a white Highland (`exec-aea20e6b-76a8-4caf-87bb-9f9444648ccc.png`).
- Actual application: `http://127.0.0.1:5183/qa-veduta.html?qaMute=1`, explicit
  synthetic public-road GPS, Anime, Highland white, no audio/diagnostic sending.
- Both target and actual comparison images are 1672 × 941 pixels. The browser
  viewport was explicitly set to 1672 × 941 CSS pixels for this capture, then
  restored. Additional actual checks used Tesla 773 × 601 and phone 390 × 844.
- Private local evidence: `Documents/Codex/2026-10-23/veduta/` contains
  `anime-reference-viewport.png`, `anime-tesla.png`, `watercolor-tesla.png`,
  `phone-settings.png` and the inspected combined `design-comparison.jpg`.
  Generated references and full screenshots are not product backgrounds.
- The combined image includes both full views and focused building/car regions.
  The target depicts an invented lakeside composition; the implementation uses
  actual Lugano vector/DEM geometry. Geographic/content differences are not
  treated as geometry defects or permission to manufacture scenery.
- The target has awake chrome and music; the captured actual state has resting
  chrome and muted visuals. Existing chrome behavior/design tokens take
  precedence. This state mismatch prevents a literal chrome-fidelity verdict.

## Current findings

| Priority | Location | Evidence and consequence | Required next change |
| --- | --- | --- | --- |
| P1 | Whole landscape | The target reads as a rich illustration; actual still reads as a simplified 3D map, with broad flat surfaces and sparse near-field vegetation. | Improve semantic terrain/building/vegetation rendering while retaining real geometry and bounded GPU work; compare again. |
| P1 | Watercolor | World-anchored pigment washes are visible on roofs, but silhouette edges, facades and distant terrain remain mechanically clean. | Develop a coherent watercolor treatment across materials; changing palette alone is insufficient. |
| P3 | Optional vehicle | The symbol follows the admitted position, but simplified cabin/roof details remain generic at some angles. The owner rejected the initial enlarged scale. | The default is now a 12 CSS-pixel dot; optional vehicle shapes use approximate metre dimensions. Further silhouette polish can remain a separate iteration. |
| P2 | Travel endurance | Interactive GPS motion/pause/resume was inspected, but sustained actual Tesla GPS/GPU performance is unmeasured. | Validate on the physical Highland with the identified build; desktop rendering cannot certify cabin performance. |

## Required fidelity surfaces

- **Typography:** existing Space Grotesk and shared controls retained. New
  controls remain legible; 48px targets and phone settings panel inspected.
- **Spacing/layout:** forward horizon, separate STYLE/VIEW controls and shared
  chrome preserved. Existing contextual controls intentionally follow the
  product's awake/resting rules. No new Atlas passenger panels were added.
- **Colors/tokens:** chrome uses shared tokens. Illustration uses three explicit
  medium-specific natural palettes. Pinned MapLibre paint transitions are zero
  to prevent a cached mixture of old terrain colors and new buildings/sky.
- **Image quality:** P1 remains open. Procedural geometry/materials are real
  runtime content; the selected generated scene is only a design target.
- **Copy/content:** product text is English. Source attribution links are visible
  in the actual map; a visibly labeled GPS fixture remains development-only.

## Iterations and verified corrections

1. Removed padded camera composition after actual captures exposed a black
   sky/terrain horizon band. Zero padding plus bounded geographic look-ahead
   fixed the band in inspected Tesla/phone captures.
2. Replaced whole-style changes with in-place paints/materials after a native
   terrain-depth failure. Zero paint transitions fixed stale colored terrain
   when switching to Manga. Anime → Manga → Anime → Watercolor was inspected.
3. Corrected missing gallery preview with a 384 × 298 WebP cropped from actual
   runtime geography. It does not promise the richer generated target.
4. Actual UI checks covered Highland/Model Y, white/blue, point selection,
   GPS movement, stale-position hold, recovery, medium switching and phone
   settings. Latest observed warning/error log entries after the current reload
   were empty; historical HMR errors were retained separately by the browser.
5. The owner identified an oversized car during live inspection. The revised
   default is a fixed 12 CSS-pixel GPS dot; optional vehicles no longer use the
   previous 3.4× display enlargement. The original comparison captures retain
   the earlier symbol and do not establish acceptance of the revised default.
   The subsequent inspected `anime-gps-dot.png` shows the small white-rimmed dot
   in the visible browser; its current-reload warning/error log was empty.

## Separate verification

- Full package tests: 1,136 passed (including eleven Veduta tests).
- Affected catalogue/Atlas/launch/Veduta tests: 70 passed.
- Text fit: 14 states passed, no clipped shared chrome text.
- Dependency/community credits: 189 exact lockfile credits passed.
- Production package: build pipeline passed, 838 exact static hashes before the
  runtime gallery thumbnail was added. Final package identity is recorded in
  the accompanying development checkpoint when rebuilt.
- Visual regression baselines: intended Veduta gallery addition only; final
  capture/recheck is recorded separately from artistic acceptance.
- No canonical publication or physical Tesla acceptance is claimed.

Keep the live local preview available for owner inspection. Do not mark the
artistic implementation complete or publish it while P1 findings remain open.
