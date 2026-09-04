# Astra Balanced Rail — implementation and verification

This is the completed office UI checkpoint following the foundation recorded in
`ASTRA-UI-AUDIT-2026-09-04.md`. The owner selected **refined Balanced Rail**,
authorized Playwright/Chrome, and explicitly prohibited canonical deployment.
The original `fc61033` product baseline remained unchanged through `bd43b44`.
Work stayed in the saved Dropbox checkout with one writer, no new task, worktree
or checkout. No secrets were inspected and no `_references/` material was copied.

## Product changes

- Chrome has one lifecycle: deliberate input wakes it while stationary; an
  unpinned action or a closed surface retracts it immediately; inactivity expires
  after 6 seconds. Focus never renews that deadline. Open drawers, menus and
  popovers alone pin chrome. An expired timer does not steal their focus.
- At movement of at least 0.8 km/h, unpinned chrome and the 16 mark stay hidden,
  including after ambient taps. Speed and its effect badge remain. At rest the
  16 mark remains the first persistent element. Informational driving notices
  do not become extra moving chrome.
- Footer and Now Playing share one 260 ms animated container and one inert
  boundary. Now Playing is absent in ATLAS and while any menu/panel is open.
  It cannot cover palette choices, Discover or another passenger surface.
  Media Session handlers and the serialized transport queue are unchanged.
- The four right-side icons use 32 × 32 frames centered at y=32, with a common
  non-scaling 2 px stroke. Optical SVG sizes compensate for the different shapes.
  The five peer cells, including Network, occupy approximately 95.4 × 64 px.
  Nested borders no longer shrink the appearance target by one pixel.
- Navbar/footer retain the 13/14/15/15/17/22/32 px ladder and 48/56 px minimum
  action targets. Both rails are 64 px high. Footer metadata sits on opaque
  semantic neutral surfaces. Its active states retain palette accents.
- The palette's full 122 × 64 px cell opens a 5 × 2 board with targets at least
  48 × 56 px. Its compact swatches are a noninteractive preview, not tiny hit areas.
- UNDERWATER is a 96 × 64 px extension of the 96 × 64 px speed badge. It descends
  from and returns to that badge, uses a resolved palette secondary colour, and
  has no motion transition under reduced motion. It is not an alarm-red status.
- ATLAS uses Title Case/sentence case, a 380 px chart with additional inter-section
  space, readable provenance on separate lines and opaque semantic chart marks.
  The panel fills the 601 px field at rest; while chrome is awake its own scroll
  area allows the same content to remain reachable. The right midpoint handle
  retains its 48 px target, including when collapsed. Attribution is a low dark
  translucent text strip; the map renderer and authored map colours are unchanged.
- DISCOVER drops decorative ordering numbers, uses 88 px result rows with two
  17 px/1.22 lines for real place names, and keeps its 48 px More disclosure.
  The selected place heading wraps at 22 px. Native Minerva content is untouched.
- Splash catalogue preparation survives React Strict Mode's trial cleanup and
  selecting a silent launch source. Music selection awaits that same promise;
  an absent rotation deadline does not trigger an extra refresh. Final unmount
  still disposes the media controller and resources.

## Semantic colour system and provenance

The cached resolver is now consumed by the app and ATLAS. Ten palettes × two
appearances × sixteen roles produce **320 recorded role variants**, including
text on accent fills and inverse selections. Passing colours are preserved.
Failing colours search lighter/darker Oklab lightness at fixed hue, reducing chroma
only for gamut, then choose the closer passing result. This is minimum adjustment
within that constrained search, not a claim of a global perceptual optimum.

[Complete raw/resolved matrix](ASTRA-SEMANTIC-CONTRAST-INTEGRATED-2026-09-04.csv)
records original colour, resolved colour, fallback decision, threshold and each
background. Ratios are tested without rounding. Examples below use the worst
of the declared neutral backgrounds, rather than only the easiest surface:

| ACID role | Appearance | Original | Resolved | Before | After |
|---|---|---|---|---:|---:|
| Secondary chart | LIGHT | `#54ff29` | `#1a7000` | 1.026062 | 4.555543 |
| Secondary chart | DARK | `#54ff29` | unchanged | 9.453719 | 9.453719 |
| Accent text | LIGHT | `#ff2ca8` | `#bb0078` | 2.478894 | 4.525145 |
| Accent text | DARK | `#ff2ca8` | `#ff5eb2` | 3.716817 | 4.509941 |
| Effect surface | LIGHT | `#54ff29` | `#249000` | 1.026062 | 3.023877 |

Text and chart data target 4.5:1; non-text focus, boundaries and indicators target
3:1, following W3C's [text](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
and [non-text](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
criteria. The browser additionally tested **180 actual rendered text/background
pairs**, with a minimum of **4.954127:1**.

LIGHT retains #f4f4f4 with #e6e6e6 controls. DARK uses #1a1a1a/#0f0f0f surfaces,
#262626 controls and #333333 hover states. These are project calibrations informed
by the rendered community [Tesla UI reference](https://www.teslaui.com/), not
proprietary or official Tesla specifications. The eight named Desktop references
were unavailable; the Figma community file could not be retrieved. The owner's
attached navbar annotation remains primary evidence for geometry and hierarchy.

## Executed gates

| Gate | Actual result |
|---|---|
| Full native suite | 625/625, including Sites 9/9 |
| PHP diagnostic gzip fixture | Passed with host `/opt/homebrew/bin/php`; no missing-host exemption |
| Rendered lifecycle suite | 64 checks passed, all seven Visual catalogue families |
| Palette integration | All 20 palette/appearance combinations match resolved CSS tokens; actual text contrast passes |
| Awake/resting, Atlas open/collapsed | LIGHT/DARK screenshots and exact frame/target geometry passed |
| Discover | Real Wikipedia titles wrap; no numbers or global player; close retracts |
| Modal and popup closure | Visual, Discover, Report, Music, FX, Network, GPS and appearance Escape passed |
| Idle and motion | Open menu survives 6 seconds; stale focus does not; moving ambient taps cannot wake chrome |
| Splash / Soundtrack | One catalogue request on untouched splash; no duplicate when selected |
| Gradient | Three variants cycle and retract; brake density recovers; reduced motion passed |
| UNDERWATER | Same 96 × 64 footprint as speed, LIGHT/DARK, palette-derived background |
| Console | Zero warnings, errors or page errors in both final browser suites |
| Document overflow | 773 × 601 scroll bounds at 773 × 601 viewport; internal passenger scrolling remains intentional |
| Production build | Exact ARM64 App 242 modules, LAB 154 modules, Sites packaging passed |
| Upstream boundaries | Existing Interstate/Drivey/Gradient integrity and licensing checks passed; no upstream runtime changes |
| Energy retirement | Existing domain, diagnostic and presentation regression checks passed |
| Whitespace | `git diff --check` passed |

The production build retains the existing advisory about chunks over 500 kB.
It is not represented as a warning-free build. It uses exact Vite 6.4.3 and
PostCSS 8.5.26 in the per-machine temporary toolchain because the shared Dropbox
node_modules was stale. Explicit Vite environment-file loading was disabled.

Gradient's isolated Chrome test at 80 km/h measured p95 16.7 ms before braking,
16.7 ms during braking and 16.8 ms after release, with no frame over 50 ms.
Framebuffer dimensions changed 773 × 601 → 618 × 480 → 773 × 601. These short
browser windows verify the response and recovery; they do not establish Tesla
GPU, thermal or long-drive performance.

## Evidence and repeatability

[Before/after gallery](qa/2026-09-04-astra/index.html) contains real 773 × 601
captures, including collapsed/awake combinations and moving speed-only chrome.
The captures use an explicit Milan demo, not a private journey.

- [Browser matrix, geometries, colours and checks](qa/2026-09-04-astra/browser-evidence.json)
- [Preload, braking, badge and reduced-motion evidence](qa/2026-09-04-astra/extra-browser-evidence.json)
- [Native suite output](qa/2026-09-04-astra/native-tests.txt)
- [Production build output](qa/2026-09-04-astra/production-build.txt)

Run `npm run qa:chrome` and `npm run qa:splash-gradient` in `prototype/drive-lab`
with an externally provisioned Playwright module (`PLAYWRIGHT_MODULE`) and Chrome
executable (`CHROME_EXECUTABLE`). Start the local preview separately without
reading secret environment files. The lifecycle runner accepts
`SEDICIVALVOLE_QA_URL`; `QA_OUTPUT` selects the evidence directory. The splash and
Gradient runner uses local port 5173 and the public canonical catalogue/audio
endpoints through a read-only browser route. It does not publish or send reports.
Playwright is verification tooling, not a new product dependency.

## Reserved gates and deployment

No canonical deployment occurred. Real Tesla acceptance remains open for cabin
distance, glare, touch, GPS motion, native Media Session, weak-network listening,
fresh-session Jamendo audio, and sustained Gradient GPU/thermal behaviour.
The screenshots and Chrome timings do not close those gates. The next authorized
publication must still run the canonical HTML/assets/version/cache identity checks.
