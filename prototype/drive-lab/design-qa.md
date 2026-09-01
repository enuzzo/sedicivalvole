# Drive Lab Design QA — fixed road ceiling and refined Vertigo

## ATLAS Drive Lab composite — 2026-09-01

- selected Product Design direction: owner-approved composite of the six
  strongest modules from the three reviewed directions;
- fidelity contract: keep one first-line summary with Speed, Distance, Moving
  time and Average speed; place Accel/Braking balance, Speed-band distribution,
  Heading history and Moving/Stopped in a two-by-two field; reserve the complete
  bottom width for Elevation;
- separation contract: ATLAS is journey telemetry, not place discovery. The
  previous Wikipedia, nearby-place and QR surfaces are removed; DISCOVER stays
  independent and neither feature links to the other;
- exact local evidence: the clean Milan demo at `773 × 601` shows the complete
  `300 px` panel without scrolling or footer/header collision. The four
  microcharts and full-width elevation remain simultaneously visible, while
  collapsing expands the map from a `300 px` inset to the full `773 px` field;
- truthful-data evidence: no-motion balance reads `0% / 0%`, heading crosses
  north through continuous angle unwrapping, speed distribution uses five
  fixed labelled bands, and weighted all-session rollups preserve motion,
  direction, distribution and terrain statistics;
- interaction and accessibility: one tap cycles `15 MIN → 1 H → SESSION`; the
  chart canvas exposes a complete text alternative; the persistent midpoint
  handle is an icon-only `36 × 30 px` rectangle with an accessible action name;
- implementation economy: the five charts share one density-capped Canvas2D
  surface rather than five independent renderers, while React owns the visible
  summary values and range control;
- remaining boundary: real-GPS motion, cabin-distance legibility, touch comfort,
  terrain changes and sustained frame/thermal behavior remain Tesla tests.

final result: passed

## DISCOVER complete reader and driving-distance typography — 2026-09-01

- selected source: the owner's annotated canonical `1114 × 905` Discover
  capture and the supplied Wikipedia two-column article reference;
- fidelity contract: enlarge the complete left-rail and reader hierarchy for
  one-glance vehicle reading, fill the measured rail before an exact inline
  `+N MORE`, keep every loaded result scrollable, and render the complete
  localized article with chapters, images and information cards;
- implementation evidence: exact local `773 × 601` Browser inspection measures
  `12.5 px` result titles, `10 px` result metadata, a `22 px` reader heading and
  `16 px / 1.58` article copy. Fifteen results produce `+10 MORE`; the list
  scrolls independently, and the Basilica article exposes 19 images plus its
  full heading hierarchy in a roughly `6,000 px` internal document;
- responsive evidence: the article infobox measures about `209 px` in the
  Tesla reader, lead copy flows alongside it without single-character columns,
  and compact readers stack the card. English-to-Italian switching clears
  edition-local page identity before refetching;
- separation decision: DISCOVER exposes destination-only Google Maps and no
  ATLAS action. It never changes the active renderer; ATLAS remains an
  independent Drive Lab awaiting a separate owner-selected redesign;
- accessibility and safety: the article iframe is scriptless and sandboxed,
  external links open independently, and close/focus recovery remains owned by
  the shared dialog boundary;
- final result: passed.

## ATLAS Live Navigator — 2026-09-01

- selected Product Design direction: 03, preserving the map as the dominant
  field and organizing one `272 px` passenger column into LIVE MOTION and
  WHERE YOU ARE;
- fidelity contract: retain the existing Navigator Plaque, route and pulsing
  endpoint; add honest GPS speed/altitude, session distance/time, two bounded
  direct-labelled charts, local road/place reading, two nearby choices and the
  exact Wikipedia article QR;
- owner correction: the persistent collapse action must be a broad readable
  label but only about one quarter of the field height. The implementation is
  `42 × 116 px` inside the `465 px` running field, never a full-height rail;
- local and live implementation evidence: ignored
  `_references/audits/atlas-live-navigator-20260901/` captures exact open and
  collapsed `773 × 601` states. The final canonical build measures the panel at
  `465/465 px`, keeps the document at `773 × 601`, changes the map inset
  `272 px → 0 px → 272 px`, and restores the same panel after reopening;
- content evidence: the localized Wikipedia request returns six pages; the
  visible panel contains the current place, rendered road, selected image and
  summary, two nearby choices and article QR. Missing GPS altitude stays `— m`
  and its chart stays in `COLLECTING` rather than inventing data;
- correction history: the first canonical candidate measured `466 px` of
  internal content in a `465 px` field because served-font metrics differed by
  one pixel. Checkpoint `e24e753` reduced only section padding; final local and
  canonical measurements are both `465/465 px`;
- remaining boundary: physical Tesla touch, real GPS/altitude, sustained map
  performance and cabin-distance reading remain `R9-01`–`R9-04`.

final result: passed

## Visual truth and implementation

- Aperture source truth: ignored `_references/visual/qa/modular-aperture-2026-08-26/source-normalized-773x601.png` (`773 × 601`);
- Interstate 7 source truth: ignored `_references/qa/2026-08-26/interstate-7-actual-normalized.png` (`773 × 601`), captured from the ignored reference at commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e`;
- Aperture urban implementation: ignored `_references/qa/2026-08-26/aperture-fixed-ceiling-40kmh-773x601.jpg` (`773 × 601`);
- Aperture ceiling implementation: ignored `_references/qa/2026-08-26/aperture-fixed-ceiling-130kmh-773x601.jpg` (`773 × 601`);
- Vertigo idle implementation: ignored `_references/qa/2026-08-26/vertigo-refined-idle-773x601.jpg` (`773 × 601`);
- Vertigo ceiling implementation: ignored `_references/qa/2026-08-26/vertigo-refined-original-max-773x601.jpg` (`773 × 601`);
- full-view Interstate comparison: ignored `_references/qa/2026-08-26/interstate-7-actual-vs-refined.png` (`1546 × 601`);
- CSS viewport: `773 × 601`; source and implementation comparisons normalized to equal pixels at density `1`;
- implementation paths: `src/signal-model.js`, `src/flux-field.jsx`, `src/vertigo-field.jsx`, `src/App.jsx`, `src/audio-engine.js`, and `src/styles.css`.

## State and required fidelity surfaces

- Aperture at `39 km/h`: clear centered tunnel depth while modules remain visibly distinct;
- Aperture at `130 km/h`: complete Plaid-like radial line field and maximum travel/deformation;
- Vertigo at `0 km/h`: unrolled quiet road field, no vertical fold, restrained breathing glow;
- Vertigo at `130 km/h`: byte-identical upstream Interstate 7 road, repeated luminous side sticks, asymmetric opposing car-light trails, bloom, deep distortion, and original non-boosted travel rate;
- control slab: `VISUAL` remains interactive, the energy slider is absent, and `SCORE / PROTOTYPE / TEXTSTEP · NEXT` is truthful rather than a fake genre selector;
- diagnostics: `energyCeilingKmh: 130`, arrangement `score: prototype`, active environment, renderer, and `SEND DIAGNOSTIC` remain reachable.

## Required fidelity review

- Fonts and typography: existing monospace family, optical hierarchy, weights, and small-label tracking remain unchanged and legible at the target viewport.
- Spacing and layout rhythm: the four-column Braun/Swiss control grid remains aligned; removing the slider reduces density without leaving an empty cell.
- Colors and tokens: all ten body-color themes remain parameter inputs; the Red QA state preserves the accepted black/red/off-white hierarchy.
- Image quality and asset fidelity: both environments remain procedural WebGL2/Canvas2D fields; no raster placeholder, copied reference asset, or imported source scene is used.
- Copy and content: `VISUAL`, `SCORE`, `PROTOTYPE`, and `TEXTSTEP · NEXT` accurately distinguish implemented behavior from roadmap work.
- Focused-region comparison was not required because the control labels and geometry are readable at full target resolution; the critical source/implementation difference is the full-field motion composition.

## Comparison history

- Earlier P1: at approximately `50 km/h`, Aperture still appeared primarily planar and ordinary urban driving could miss the tunnel. Fixed by remapping visual velocity to the fixed road domain and moving the continuous warp onset earlier. Post-fix evidence at `39 km/h` shows unmistakable centered tunnel depth.
- Earlier P1: the adjustable full-energy slider did not create a sufficiently perceptible response and implied arbitrary calibration. Fixed by removing the control and using one tested `130 km/h` legal-road ceiling for energy, visual velocity, flow, audio arrangement, Demo, and diagnostics.
- Earlier P2: Vertigo was materially thinner and dimmer than the executable Interstate 7 reference. Fixed with layered halo/glow/core contributions, stronger lane luminance, and stationary breathing. The post-fix side-by-side comparison preserves the reference's fold, channel, color split, wave, and perspective hierarchy.
- Accepted difference: the public AGPL product does not import the custom-licensed source, Three.js scene, original shader, title/navigation, road furniture, or post-processing stack. Its mechanics remain independently implemented and visibly credited.
- P3 follow-up: target-Tesla profiling may permit a restrained blur/bloom pass closer to the source; it is not required before this checkpoint because the current layered glow is legible and bounded.

## Functional verification

- 18 unit tests and 4 packaging tests pass; the production build passes;
- fresh-runtime diagnostics report `energyCeilingKmh: 130`, `score: prototype`, and `WebGL · Original Interstate 7`;
- visual switching, Demo progression, the `39 km/h` urban state, the `130 km/h` ceiling state, idle Vertigo, and diagnostics were exercised at `773 × 601`;
- page identity and meaningful DOM content pass; no framework overlay is present;
- no application warnings or errors were observed in the selected in-app browser.

## Remaining target-vehicle evidence

- real DPR/frame pacing, thermal stability, and context-loss behavior;
- perceptual glow and travel speed on the Tesla display;
- live-GPS transitions through `40 km/h` and the ceiling;
- final audio/visual coherence after the textStep-informed sequencer replaces the rejected score.

final result: passed

## ATLAS desktop camera controls — 2026-08-29

### Root cause and interaction contract

- Before the change, the transparent `.experience` chrome was the top hit-test
  target over the MapLibre canvas. A primary-button drag and a wheel gesture at
  the same map point both left `022°`, pitch `60` and zoom `16.2` unchanged.
- ATLAS now makes only the background chrome pointer-transparent. The top and
  low control planes, speed readout and GPS recovery popup remain interactive,
  while the popup stacking context sits above the passenger panel.
- Primary-button horizontal drag changes bearing, vertical drag changes pitch,
  wheel or trackpad scroll changes bounded zoom, and touch retains one-pointer
  rotate/tilt plus two-pointer pinch. Every path shares the six-second manual
  lease and current automatic-camera return.

### Browser evidence

- Default desktop `1280 × 720`: the top hit target changed from `experience` to
  `maplibregl-canvas`; drag changed `022° / 60°` to `080° / 38°`, and wheel
  changed zoom `16.2 → 17.4`.
- Exact Tesla `773 × 601`: the map owns `527 × 601` with the `246 px` passenger
  panel open; drag changed `022° / 60°` to `082° / 35°`, reverse wheel changed
  zoom `16.2 → 15.0`, and document width/height exactly match the viewport.
- A controlled wheel run retained zoom `17.4` after `4.5 s` and returned to the
  automatic `16.2` after the lease and ease. The GPS popup CLOSE target is the
  actual button rather than the panel beneath it.
- The final automatic state is `022°`, pitch `60`, zoom `16.2`; no warning or
  error was recorded in the selected in-app browser.

### Automated evidence and remaining boundary

- 22 focused ATLAS tests, the complete 343-test suite and the 131-module
  production build `20260829-2257` from `fe2a9a5` pass.
- Real-Tesla multitouch, physical mouse/trackpad behavior, live GPS recovery,
  sustained frame pacing and cabin-distance readability remain open.

final result: passed
