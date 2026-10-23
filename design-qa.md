# Veduta — active visual comparison

final result: blocked for full artistic fidelity; owner-authorized experimental vehicle trial

This is not an accepted final artistic implementation. The owner's subsequent
October 23 request explicitly authorizes publication for a real Tesla trial
after focused performance work and release verification. That trial authority
supersedes the earlier publication hold, without closing the findings below.
The prior guided companion review is [preserved separately](docs/PHONE-DESIGN-QA-PRESERVED-2026-10-23.md);
this Veduta comparison does not resolve its owner acceptance.

## Evidence and normalization

- Target: owner-selected first Image Gen direction, forward toward the horizon,
  refined with a white Highland (`exec-aea20e6b-76a8-4caf-87bb-9f9444648ccc.png`).
- Original actual application comparison:
  `http://127.0.0.1:5183/qa-veduta.html?qaMute=1`, explicit synthetic public-road
  GPS, Anime, Highland white, no audio/diagnostic sending. The owner subsequently
  accepted a small GPS point; the latest comparison uses that approved point.
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
- Current whole-scene iteration: the three `*-tesla-final.png` files under
  `Documents/Codex/2026-10-23/veduta-art/` have identical 773 × 601 viewport,
  public synthetic GPS, dot and resting-chrome state. `three-media-final.jpg`
  combines them. GeoPoster Anime R140, Manga R144 and Watercolor R129 native
  proofs were also inspected read-only; no proof or lab asset enters the app.

## Current findings

| Priority | Location | Evidence and consequence | Required next change |
| --- | --- | --- | --- |
| P1 | Whole landscape | The latest whole-scene finish gives distinct media, stronger Anime light/shadow and Manga paper/ink. Repeated schematic houses/windows, generic vegetation and uniform water remain far simpler than the reference/GeoPoster. | Develop material-specific architecture, vegetation and water hierarchy within bounded GPU work; compare again. |
| P1 | Watercolor | Paper/pigment now covers the whole scene. Separating one-pixel contours from broad washes removed most ghosted roof/road edges, but the overall foreground remains pale and the brush hierarchy is limited. | Preserve the corrected structural edges and develop differentiated washes/detail by material. |
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
6. The owner accepted the point, rejected the ordinary 3D-map appearance and
   requested the GeoPoster media. The original bounded terminal GPU pass now
   abstracts the completed scene, with distinct Anime/Manga/Watercolor responses.
   No sampled pixels leave the GPU and the pass owns no extra canvas/context.
7. Independent final image review confirms the targeted corrections: stronger
   geometry-based Anime value grouping, clearer Watercolor structural edges and
   finer Manga retino. This is a scoped visual pass, not full artistic fidelity.
8. STYLE/VIEW now share the two-line control cells, extracted footer caret and
   popover material. Phone LIGHT/DARK, keyboard Tab, Escape/focus return and
   consumed outside dismissal were inspected. Synthetic 40-metre motion moves
   the geographic scene; paused GPS holds its last position and resumes.

## Separate verification

- Full package tests: 1,136 passed before the final dot refinement (including
  eleven Veduta tests). Subsequent Veduta/documentation checks: 19 passed.
- Affected catalogue/Atlas/launch/Veduta tests: 70 passed.
- Text fit: 14 states passed, no clipped shared chrome text.
- Dependency/community credits: 189 exact lockfile credits passed.
- Production package: `20261023-1342.495204d`, 839 exact static hashes, VERSION
  and HTML identity matched. The actual GPS fixture is not a production entry.
- Local visual regression: 16/16 passed. Only the two gallery baselines were
  changed after visual inspection of the new real thumbnail; unrelated Intro
  baselines were preserved. This chrome gate is separate from artistic fidelity.
- No canonical publication or physical Tesla acceptance is claimed.

The whole-scene iteration subsequently passes 1,141 full package tests,
16/16 chrome regression and 14/14 text fit with no further baseline changes.
After the last shader/normal refinement, 16 focused renderer/model tests pass;
actual current browser captures cover all three media and phone options. These
gates establish implementation behavior, not the unresolved artistic P1 target.
Source checkpoint `9d4821b` is pushed; local production package
`20261023-1458.9d4821b` passes 839 exact static hashes and VERSION/HTML identity.
Documentation consistency passes 8 checks. No canonical publication is made.

Keep the live local preview available for owner inspection. Do not mark the
artistic implementation complete while P1 findings remain open. Experimental
publication for the owner's real-car trial is now explicitly authorized;
release verification and physical acceptance remain separate.

The authorized trial is now canonical build `20261023-1537.4969ee2`, with
19 browser HTTPS identity/cache checks and all three media loaded through the
public App with synthetic GPS. The [performance record](docs/VEDUTA-PERFORMANCE-2026-10-23.md)
separates measured desktop improvement, remaining rebuild hitches and physical
Tesla evidence still required. Artistic P1 findings above remain open.
