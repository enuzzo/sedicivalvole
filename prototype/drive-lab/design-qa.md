# Drive Lab Design QA — fixed road ceiling and refined Vertigo

## 10A / 10B Tesla interaction and density closeout — 2026-09-01

- selected source truth: the owner's annotated `773 × 601` Music and Discover
  captures, Generated image 35 for Play the Road, the approved `3–3–1` launch
  grid, and the 2026-09-01 09:01–09:15 / 17:52–18:07 VoiceNotes;
- comparison method: source captures and the post-change in-app Browser states
  were inspected at the same `773 × 601` CSS viewport. The launch deck, running
  shell, Play the Road, Jamendo, Visual Library, REPORT reset and support flow
  were compared in their matching top-of-surface states rather than against an
  unrelated archived mock;
- Music result: horizontal primary tabs remain at top; Play the Road retains the
  approved two sampled cards plus full-width responsive-generative card;
  Jamendo removes the redundant header block, preserves all 15 genres and six
  tracks, increases filter/title/artist legibility, separates Pace/Genre, and
  keeps Now Playing plus credits inside one `601 px` no-scroll surface;
- Visual result: all seven current destinations fit in two columns with one
  useful description each; no unapproved eighth item is fabricated;
- running-shell result: the persistent transport occupies the measured
  bottom-centre lane above the 64 px footer; the `3.2 s` committed-track notice
  is centred below the top telemetry. Both preserve the GPS/header/footer
  hierarchy at `773 × 601`;
- Discover result: navigation opens an in-place destination QR and Tesla-app
  handoff card without leaving or linking to ATLAS;
- palette/assets: Tesla swatches rise from `15 px` to `18 px`; 29 public Illobo
  WebP derivatives total about `380 KB` while the approximately `9.6 MB` set of
  512 px PNG masters remains local outside the publish tree;
- interactions checked: Buy Me a Coffee opens and navigates to its real support
  destination in the same tab; reset returns the visible launch selection to
  Play the Road/Aperture after reload; Music and Visual drawers open/close; the
  persistent transport and committed-track notice render correctly;
- accessibility: Media Session actions are registered defensively; buttons keep
  explicit names; swipe dismissal ignores interactive descendants, preserves
  Escape/CLOSE/focus and cancels below its thresholds;
- performance/privacy: APERTURE wall motion smooths sampled speed and caches
  canvas dimensions instead of reading layout every frame. GPS journey state is
  bounded and session-only; preference tests reject coordinates and transient
  media data;
- tests/build: complete suite `486/486`; 148-module App, 71-module LAB,
  protected LAB and Sites builds pass;
- canonical result: build `20260901-2232` on deployment checkpoint `7e990ee`
  passes read-only pre/postflight, cache-busted byte identity and exact live
  `773 × 601` launch/support QA. The public WebP returns 200 while its verified
  retired PNG returns 404;
- remaining evidence: target-Tesla gesture, Media Session exposure, cabin
  typography/audio, WebP sharpness/network and real-GPS continuity remain the
  coded acceptance queue. The later Gradient gate and its subsequent retirement
  are tracked in milestone row 11; three ShaderGradient visuals now replace it.

final result: passed for office and canonical implementation; Tesla acceptance pending

## DISCOVER responsive article imagery correction — 2026-09-01

- source visual truth: owner annotation on the selected-place reader at
  `http://127.0.0.1:5178/?qaMute=1`, `773 × 601` CSS viewport, Basilica di San
  Calimero selected, complete English article loaded;
- source pixels and density: the Browser-rendered source capture is `773 × 601`
  CSS pixels at the in-app Browser's current device density. The implementation
  must be recaptured in the same tab, viewport, place, language and article
  scroll origin before comparison;
- pre-correction evidence: the reader is `486 × 523 px`; its article body is
  `475 px` wide; the floated infobox is about `209 px` wide with a `22 px` left
  margin, leaving approximately `204 px` for the lead and causing the annotated
  over-narrow wrapping. The infobox remains floated for over `1,100 px` of
  article height;
- correction applied: checkpoint `55caa8d` changes the infobox to
  `clamp(150px, 35vw, 240px)` with a `38%` ceiling and `18 px` margin, bounds
  its imagery to `260 px` without cropping, replaces arbitrary word breaking,
  and stacks cards only when the reader width reaches `420 px`;
- follow-up density correction: checkpoint `f8f554b` removes the redundant
  visible `LANGUAGE` label without weakening the select's accessible name,
  reduces the scope row from `42 px` to `38 px`, and raises distance/ETA copy
  from `10 px / 1.15` to `11.5 px / 1.18`;
- verified same-state geometry: the live reader remains `486 × 523 px` with a
  `475 px` article body; the Basilica infobox is now `165.3 px` wide with an
  `18 px` left margin, and its lead image is `145.3 × 218.8 px` beneath the
  `260 px` uncropped ceiling. The complete article remains independently
  scrollable at `5,290 px` content height;
- fonts and typography: unchanged `16 px / 1.58` article body and existing
  hierarchy; the correction targets measure and wrapping rather than shrinking
  cabin-readable type;
- spacing and layout rhythm: the infobox margin decreases from `22 px` to
  `18 px`; reader, rail, header, footer and independent scroll boundaries are
  unchanged;
- colors and visual tokens: unchanged;
- image quality and asset fidelity: original Wikipedia imagery remains remote,
  proportional and uncropped; only its maximum rendered height changes;
- copy and content: complete localized Wikipedia markup, headings, tables,
  links and destination-only Maps action remain unchanged;
- comparison history: the owner's P1 finding was the overly narrow lead beside
  the dominant infobox. The canonical post-fix capture at the identical
  `773 × 601` viewport and Basilica/English/article-top state now shows a
  balanced two-column lead, readable paragraph measure and an uncropped card;
- implementation screenshot: in-app Browser capture of canonical
  `https://sedicivalvole.app/?build=20260901-1624&commit=fd4b636&qaMute=1`;
- primary interactions tested: Milan demo loading, exact `+10 MORE` counter,
  continuous `398 / 1,028 px` result scroll, complete article loading and
  internal scrolling. The visible `LANGUAGE` label is absent while the select
  retains `Wikipedia language`; scope controls measure `38 px`; distance/ETA
  copy measures `11.5 px / 13.57 px`;
- tests/build: focused source/document checks pass `10/10`, complete tests pass
  `541/541`, and the 148-module App / 71-module LAB / Sites build passes;
- console errors checked: canonical Browser log is empty.

final result: passed

## ATLAS Drive Lab composite — 2026-09-01

- selected Product Design direction: owner-approved composite of the six
  strongest modules from the three reviewed directions. The visual sources are
  `exec-22fb6214-36b8-411b-8140-5c1b3c9e081b.png`,
  `exec-4b117a6b-5852-477a-989a-d2b17e2fd86e.png`, and
  `exec-f0ca5ea9-919f-4a53-93d4-4b74f7feece9.png` under the ignored generated
  image store;
- owner composite: one first-line summary with Speed, Distance, Moving time and
  Average speed; full-width Accel/Braking balance; a low horizontal Speed-band
  distribution; full-width Heading history; full-width Elevation; and a low
  horizontal Moving/Stopped strip;
- separation contract: ATLAS is journey telemetry, not place discovery. The
  previous Wikipedia, nearby-place and QR surfaces are removed; DISCOVER stays
  independent and neither feature links to the other;
- comparison evidence: the earlier canonical `20260901-1943` capture and the
  three selected sources were normalized to `773 × 601` and compared together
  in `_references/audits/atlas-drive-lab-redesign-2026-09-01/`. That comparison
  exposed a P1 fidelity failure: a uniform two-by-two card grid replaced the
  approved vertical instrument, and short bar modules consumed square cards;
- corrected live evidence: build `20260901-2012` at `773 × 601` shows the
  complete `300 px` no-scroll panel in the Milan demo with `15 MIN` selected.
  The tracked current-build capture is
  `qa/atlas-drive-lab-redesign-2026-09-01/after-live-20260901-2012-773x601.png`;
- finding closure: Accel/Braking now owns a full-width centred `km/h/s`
  timeline, Speed bands and Moving/Stopped are low strips, and Heading and
  Elevation are full-width histories. Direct legends plus value/time axes close
  the prior ambiguity, while quadratic curves replace angular polylines;
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
- typography, spacing, colour, copy and complete-view hierarchy were checked
  against the combined source/current-build comparison. Live range cycling,
  collapse and reopen pass; the Browser warning/error log is empty;
- validation: the complete suite passes `544/544`; the 148-module App,
  71-module LAB, protected LAB packaging and Sites build pass; canonical HTML,
  main JavaScript, main CSS, ATLAS JavaScript and ATLAS CSS are byte-identical
  to the verified candidate;
- remaining boundary: real-GPS motion, cabin-distance legibility, touch comfort,
  terrain changes and sustained frame/thermal behavior remain Tesla tests.

final result: passed

## DISCOVER native Minerva dark reader and driving-distance typography — 2026-09-01

- selected source: the owner's annotated canonical `1114 × 905` Discover
  capture and the supplied Wikipedia two-column article reference;
- fidelity contract: keep the measured left-rail hierarchy for one-glance
  vehicle reading, fill the rail before an exact inline `+N MORE`, retain every
  loaded result in one scroll, and hand the complete article presentation back
  to Wikipedia's native responsive Minerva skin in its own dark mode;
- implementation evidence: checkpoint `cdccbd7` embeds the edition-local article
  URL with `useskin=minerva&minervanightmode=1`; no product-authored article
  colours, infobox widths, image ceilings or chapter layout remain. The iframe
  uses one `1.2×` presentation scale for the owner-selected large reading size;
- responsive evidence: exact local `773 × 601` Browser inspection shows the
  native dark Minerva header, responsive Basilica media/information card and
  full internally scrollable article without the former narrow word column.
  English-to-Italian switching updates both Discover results and Wikipedia's
  interface language;
- separation decision: DISCOVER exposes destination-only Google Maps and no
  ATLAS action. It never changes the active renderer; ATLAS remains an
  independent Drive Lab awaiting a separate owner-selected redesign;
- accessibility and safety: the sandbox admits the scripts and same-origin
  access required by the native Minerva interface while links remain isolated
  from the parent product; close/focus recovery stays owned by the shared
  dialog boundary;
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
