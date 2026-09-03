# Design QA — ATLAS Live Navigator

Date: 2026-09-01

## Source and implementation

- Owner-selected Product Design direction 03:
  `/Users/enuzzo/.codex/generated_images/01a056ca-c4ff-7433-92c5-7a0aa0abd6e3/exec-70c9d268-7497-4498-bbb2-6d357dab8e2a.png`.
- Source pixels: `1423 × 1105`, normalized with a centred cover crop to the
  target `773 × 601` CSS viewport.
- Browser-rendered implementation:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/atlas-live-navigator-20260901/implementation-open-773x601.png`.
- Collapsed interaction state:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/atlas-live-navigator-20260901/implementation-collapsed-773x601.png`.
- Joined full-view comparison:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/atlas-live-navigator-20260901/joined-reference-implementation-1546x601.png`.
- Joined focused panel comparison:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/atlas-live-navigator-20260901/joined-panel-focus-544x465.png`.
- Implementation screenshot: `773 × 601` at the browser's device density;
  comparison dimensions are normalized to `773 × 601` per half.
- State: ATLAS, explicit Milan demo, selected RED 03 palette, panel open;
  the collapsed state was also captured and measured.

## Fidelity review

- **Fonts and typography:** the implementation deliberately retains the
  product's local Space Grotesk hierarchy instead of the generated mock's
  approximate face. LIVE MOTION, values, graph labels, WHERE YOU ARE and place
  rows remain legible at the exact Tesla viewport with bounded truncation.
- **Spacing and layout:** MapLibre remains the majority surface at `501 px`;
  the selected two-layer panel occupies `272 px`. The owner's refinement
  supersedes the full-height mock rail with a `42 × 116 px` midpoint handle,
  approximately one quarter of the `465 px` field. Final panel geometry is
  exactly `465 / 465 px` client/scroll height and the document is exactly
  `773 × 601` with no overflow.
- **Colors and tokens:** the active shared palette continues to own the map,
  panel rule, speed trace, altitude trace and handle state. The panel retains
  the approved black/ivory/accent hierarchy without introducing a detached
  dashboard palette.
- **Images and icons:** the selected Wikipedia thumbnail remains a real
  free-license source image. The direction pointer and panel chevrons use
  official local Tabler assets; no glyph, CSS drawing or placeholder replaces
  a visible icon.
- **Copy and content:** LIVE MOTION contains GPS speed, honest GPS altitude,
  session distance/time and two direct-labelled trends. WHERE YOU ARE keeps
  locality, tile-local road name, selected place context, two nearby choices
  and the exact article QR. Missing altitude remains `— m`; demo and live
  sessions are explicitly distinguished.

## Interaction and runtime checks

- `HIDE INFO` collapses the panel, changes its accessible expansion state to
  false, returns the map to `right: 0`, and leaves a `42 × 116 px` `SHOW INFO`
  control at the right midpoint. `SHOW INFO` restores the panel immediately.
- Two Canvas2D microcharts own only sampled marks. HTML owns values, labels and
  accessibility text; one-second UI refreshes are decimated into a bounded
  60-sample, two-second history. Speed uses a fixed `0–130 km/h` domain;
  altitude refuses to draw until two finite GPS samples exist.
- Journey samples, altitude, distance and coordinates remain session-only and
  outside the diagnostic report. The browser warning/error log is empty.
- Focused ATLAS tests pass `32/32`; the 148-module App, 71-module LAB and Sites
  build pass.

## Comparison history

| Pass | Severity | Finding | Resolution and evidence |
|---|---|---|---|
| 1 | P2 | The first open implementation exposed the QR but its lower section produced an 11 px internal overflow. | Removed only unused lower section padding; final panel geometry is exactly `465 / 465 px`, with the QR and both nearby rows fully visible. |
| 2 | — | No actionable P0, P1 or P2 mismatch remains. | Full-view and focused joined comparisons preserve the selected hierarchy; exact open/collapsed geometry, interaction, honest empty altitude state and empty Browser log pass. |

final result: passed

---

# GRADIENT 08 Design QA — 2026-09-02

## Source of truth

- selected direction: one continuous sequence combining the owner-approved
  low-speed Tension Plane and high-speed Chromatic Fold;
- slow reference:
  `/Users/enuzzo/.codex/generated_images/01a056ca-c4ff-7433-92c5-7a0aa0abd6e3/exec-fdcf91cc-0fd8-44c7-ac1c-ccb21dfb3c09.png`;
- fast reference:
  `/Users/enuzzo/.codex/generated_images/01a056ca-c4ff-7433-92c5-7a0aa0abd6e3/exec-bf685923-ccf4-4d62-94dc-bfefc45f914d.png`;
- required additions: visible grain, genuine WebGL/3D shader behavior, strong
  speed response, Play-the-Road audio response, and Soundtrack speed-only
  behavior.

The two images are direction references for consecutive speed states, not a
request to reproduce one frozen frame pixel-for-pixel. Their persistent product
chrome, ACID 08 palette, central convergence, smooth dimensional surface, and
slow/fast hierarchy are the comparison anchors.

## Implementation evidence

- environment: local Vite product runtime in the in-app browser;
- viewport: `773 × 601` CSS pixels;
- slow state: `20 km/h`, ACID 08, Play the Road;
- fast state: `130 km/h`, ACID 08, Play the Road;
- slow capture:
  `prototype/drive-lab/qa/gradient-design-qa-2026-09-02/gradient-slow-acid-773x601.png`;
- fast capture:
  `prototype/drive-lab/qa/gradient-design-qa-2026-09-02/gradient-fast-acid-773x601.png`;
- full joined comparison used during QA:
  `/tmp/sedicivalvole-gradient-compare-all-final.png`.

Both source references were normalized to `773 × 601` before being placed
beside the implementation captures in one comparison image.

## Visible comparison and iteration

1. The first high-speed mesh failed because it read as faceted mountain terrain.
   Smooth analytical normals and lower high-speed noise removed the facets.
2. The second mesh still failed because it read as one horizontal landscape
   with uncovered black regions. Geometry changed to one continuous inside-view
   cylindrical 3D surface so low speed converges and high speed folds around the
   viewer.
3. The first tunnel version failed because it retained a large terminus and an
   open wedge. The final surface overlaps beyond a complete circumference,
   extends to the far convergence plane, and uses the matching projection bound.
4. The final slow state is broad, calm, grain-bearing, and convergent; the final
   fast state produces multiple large chromatic folds around the same central
   depth axis. ACID 08 preserves the selected magenta/green hierarchy while the
   real header, transport, and footer stay unchanged.

## Focused checks

| Region | Result | Evidence |
|---|---|---|
| Header and footer | PASS | Existing Road Sheet chrome remains bounded at `773 × 601`. |
| Slow identity | PASS | Broad Tension Plane, low phase rate, deep convergence, subordinate grain. |
| Fast identity | PASS | Distinct Chromatic Fold, larger radial deformation, sharper colour separation, no low-poly facets. |
| State continuity | PASS | One smoothed model and one persistent renderer; no crossfade between presets. |
| Palette | PASS | Three project palette channels remain simultaneous; ACID 08 supplies the reference comparison. |
| Interaction | PASS | Transport, selectors, Performance FX, drawer gestures/backdrops, and widened palette remain reachable. |
| Console | PASS | No warning or error in the captured slow/fast states. |

Target-Tesla sustained frame pacing, thermal behavior, cabin motion comfort, and
audio-reactive perception remain separate physical acceptance gates.

final result: passed

---

# Design QA — DISCOVER Visual catalogue placement

Date: 2026-09-01

## Source and implementation

- Owner requirement: expose Discover in both the initial Visual selection and
  the running Visual library; make the initial seven-card grid `3–3–1`.
- Exact canonical launch screenshot:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/discover-visual-catalog-20260901/live-launch-3-3-1-20260901-1105.jpg`.
- Exact canonical running-picker screenshot:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/discover-visual-catalog-20260901/live-running-visual-seven-rows-20260901-1105.jpg`.
- Exact canonical opened-surface screenshot:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/discover-visual-catalog-20260901/live-discover-open-from-visual-20260901-1105.jpg`.
- CSS viewport: `773 × 601`; canonical build `20260901-1105`.

## Interaction and runtime checks

- The launch surface contains exactly seven Visual cards in three measured rows
  at `y=146 / 262 / 379`; DISCOVER is the only third-row item and ends at
  `487 px`, with zero document overflow.
- Selecting Mute plus Discover enables START. START runs Aperture, opens the
  Passenger Index, and CLOSE returns neutral focus to `main.app`.
- The running Visual drawer measures `601 / 601 px`; all seven rows are visible
  together, and the DISCOVER row spans `493–553 px` with an explicit `OPEN`
  state. No scroll gesture is required.
- Opening Discover from that row closes the picker, preserves Aperture as the
  active renderer, and the final CLOSE again returns focus to `main.app`.
- The complete `536/536` suite, 148-module App build, 71-module LAB build,
  Sites package, canonical byte identity and Browser warning/error log pass.

## Comparison history

| Pass | Severity | Finding | Resolution and evidence |
|---|---|---|---|
| 1 | P1 | DISCOVER existed only as header chrome and was absent from both user-requested Visual entry points. | `e268169` adds one shared seven-choice catalogue while retaining the six-entry renderer registry. |
| 2 | P2 | The running picker contained DISCOVER 07, but exact `773 × 601` review placed it below the first fold. | `a257e0c` compacts only that drawer to seven `60 px` rows; the final row is fully visible at `493–553 px`. |
| 3 | — | No actionable P0, P1 or P2 issue remains in the requested placement flow. | Exact canonical screenshots, geometry, both interaction loops, focus return and empty Browser log pass. |

final result: passed

---

# Design QA — horizontal Music sources and Play the Road

Date: 2026-09-01

## Source and implementation

- Owner annotation removing the temporary vertical rail:
  `/var/folders/48/00rryty17dzb6g7877yxqym00000gn/T/codex-clipboard-919b70f2-9b4e-47ba-92d8-fb38d1dd1c4e.png`.
- Owner-selected Play the Road direction **Generated image 35**:
  `/var/folders/48/00rryty17dzb6g7877yxqym00000gn/T/codex-clipboard-f1b70547-66b1-4448-98aa-9609f7effc23.png`.
- Exact implementation screenshot:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/music-horizontal-play-road-20260901/implementation-773x601.png`.
- Exact canonical build `20260901-1041` screenshot:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/music-horizontal-play-road-20260901/live-20260901-1041-773x601.png`.
- Joined normalized source/implementation comparison:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/music-horizontal-play-road-20260901/joined-source-vs-implementation.png`.
- Implementation CSS viewport and screenshot: `773 × 601` at density `1`.

## Fidelity and owner refinements

- The temporary left Navigator Rail is removed. `PLAY THE ROAD` and
  `SOUNDTRACK` return to one persistent horizontal selector pair directly below
  the Music heading.
- Play the Road preserves the selected hierarchy and supplied artwork: sampled
  JUNCTION and NIGHTSHIFT share the first row, responsive-generative FRACTURE
  spans the row below, and the introductory arrangement copy remains above all
  three cards.
- The generative badge uses the selected cyan hierarchy instead of appearing
  subordinate to the sampled scores. Family and listener description occupy
  distinct lines, preserving the source's scan order at driving distance.
- The implementation retains the product's established Space Grotesk type,
  current palette accent, compact square media controls, and actual playback
  state rather than copying a static mock state.

## Interaction and runtime checks

- Exact `773 × 601` Play the Road geometry measures `494 px` client height and
  `494 px` scroll height inside the drawer content; the complete panel measures
  `601 / 601 px`.
- Soundtrack retains all 15 genres, six tracks, current player and credit after
  the horizontal selector change and also measures `494 / 494 px` with no
  scroll.
- Both source selectors remain one-tap controls and preserve the existing
  immediate pane-switch and stale-request guards.
- The complete `533/533` suite, 148-module App build, 71-module LAB build and
  Sites package pass. Browser warning/error log: empty.

## Comparison history

| Pass | Severity | Finding | Resolution and evidence |
|---|---|---|---|
| 1 | P1 | The previous implementation contradicted the owner's annotation by moving the two primary sources into a tall left rail. | Restored the two equal horizontal selectors at the top and removed the rail-only labels. |
| 1 | P1 | Play the Road did not record Generated image 35 and rendered all three scores as one vertical list. | Implemented the selected two-sampled-plus-one-generative card hierarchy, exact copy direction, existing covers and cyan generative emphasis. |
| 2 | P2 | The first local pass compressed family and description onto one line and made the selected hierarchy scan too densely. | Split family and description into separate lines and increased the exact-Tesla card typography and artwork scale without introducing scroll. |
| 3 | — | No actionable P0, P1 or P2 mismatch remains. | Joined source/implementation review, exact geometry and Browser interaction/console QA pass. |

final result: passed

---

# Design QA — DISCOVER Passenger Index

Date: 2026-09-01

## Source and implementation

- Owner-selected direction 01:
  `/Users/enuzzo/.codex/generated_images/01a056ca-c4ff-7433-92c5-7a0aa0abd6e3/exec-f977a5e7-622f-422f-bc57-17525d8e41eb.png`.
- Exact Tesla-viewport implementation:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/discover-implementation-20260901-final-773x601.png`.
- Joined source/implementation comparison:
  `/Users/enuzzo/Library/CloudStorage/Dropbox/Mitnick/sedicivalvole/_references/audits/discover-design-comparison-20260901.png`.
- Reference pixels: `1423 × 1105`, normalized to `773 × 601`.
- Implementation CSS viewport and screenshot: `773 × 601` at density `1`.

## Fidelity and owner refinements

- The implementation preserves the selected split Passenger Index: a bounded
  place rail on the left and one always-open article reader on the right.
- It retains the dark Swiss instrument surface, vermilion navigation state,
  image-led place choices, prominent selected title, large source image,
  distance/ETA line, Google Maps handoff, Wikipedia attribution, and reciprocal
  ATLAS action.
- The owner's refinements are integrated rather than stacked below the concept:
  browser-language detection, an internal language selector, search, 15-source
  pagination, and a bottom `+N MORE` counter share the fixed left rail.
- The local ETA is explicitly approximate. Google Maps owns actual directions
  and starts from the device's current origin because the generated directions
  URL supplies only the destination.

## Interaction and runtime checks

- A GPS-denied session presents bounded `RETRY GPS` and `MILAN DEMO` recovery.
- The Milan demo returns 15 English places and `+10 MORE`; expansion exposes all
  15 without growing the document. Italian selection switches to
  `it.wikipedia.org`, Italian article copy, and an Italian source link.
- Search for `Berchet` reduces the index to one result and updates the open
  reader. Nearby/Ahead/Region controls, place selection, `READ FULL ARTICLE`,
  `OPEN IN GOOGLE MAPS`, ATLAS, CLOSE, and retry remain operable.
- The same-viewport Music QA also confirms the selected Navigator Rail, all 15
  readable genre chips, six tracks, player, and non-overlapping QR credits on
  one `773 × 601` surface.

## Comparison history

| Pass | Severity | Finding | Resolution and evidence |
|---|---|---|---|
| 1 | P2 | The first implementation used text-only index rows, losing the source direction's image-led scanning. | Added real free-license Wikipedia thumbnails plus a licensed Wikipedia-icon fallback within the same five-row viewport. |
| 2 | P1 | One MediaWiki response page exposed only ten candidates despite the 15-place product ceiling. | Added bounded continuation handling, safe continuation-token admission, deduplication, and a four-request ceiling; the final English demo exposes 15 places and `+10 MORE`. |
| 3 | — | No actionable P0, P1, or P2 mismatch remains. | The joined `1546 × 601` comparison preserves the selected hierarchy while fitting the owner-required language/search and source-count controls. |

final result: passed

---

# Design QA — equal-path Soundtrack library

Date: 2026-08-31

## Source and implementation

- Owner-selected Product Design direction 02:
  `/Users/enuzzo/.codex/generated_images/01a0566c-fcda-7f42-9ed8-1f8898dd5258/exec-d149c4d6-8971-4694-abad-3d46c8135a84.png`.
- Browser-rendered implementation at the reference viewport:
  `/private/tmp/sedicivalvole-music-drawer-1491x1055.png`.
- Joined reference/implementation comparison opened as one visual input:
  `/private/tmp/sedicivalvole-music-drawer-comparison.png`.
- Exact Tesla-viewport implementation reviewed at `773 × 601` with Soundtrack
  open, real Jamendo metadata and cover art, muted QA startup, and APERTURE.
- Cache-busted canonical exact-viewport evidence after publication:
  `/private/tmp/sedicivalvole-music-drawer-live-773x601.png`.

## Fidelity and owner refinements

- The implementation preserves direction 02's split overlay, persistent source
  switch, dark Swiss/Braun surface, vermilion selection rails, compact filter
  rows, cover-led track list, and anchored now-playing transport.
- The owner-requested refinement deliberately supersedes the mock's dominant
  Featured album: **Illobo Featured** and **Jamendo Library** are two compact,
  equal-width, equal-border alternatives under the explicit copy `Two equal
  ways to start listening`. The provisional generated mark stays replaceable by
  the owner-supplied final logo.
- Jamendo Library previews six real covers in two columns at the wide viewport.
  At `773 × 601`, the drawer becomes full-width and touch-first while retaining
  both alternatives, all three pace actions, all five genre actions, and the
  first cover row above the scroll fold.
- The interface says `AUTHORED PLAYBACK · 1×` and `Fresh mix · changes every 30
  min`. Catalogue pace is visibly a passenger choice and never appears as a
  playback-rate or vehicle-speed control.

## Interaction and runtime checks

- Signal Gate → Instrument Deck → SOUNDTRACK + APERTURE → START prepares a real
  eligible catalogue, enters the running field, and opens the Soundtrack branch.
- Focused model/runtime tests prove that Featured, pace, genre, and exact-track
  gestures request immediate playback; the stable shuffle is unchanged inside
  a half-hour window and changes at the next boundary.
- MUTE and FX remain adjacent global footer controls across both source modes.
  FX off affects only audible OPEN/UNDERWATER/BLOOM processing; visual macro
  detection remains active.
- Browser console warnings/errors are zero. The drawer and cover data render at
  both `1491 × 1055` and exact Tesla `773 × 601`; no cropped primary action or
  horizontal overflow was observed.
- Canonical HTML, JavaScript, CSS, and the provisional Illobo asset are
  byte-identical to the verified build; the live exact-viewport Browser repeats
  the selected hierarchy with zero observed warning/error.
- Eighty-nine focused Soundtrack/presentation checks pass. The complete unit
  suite is 426/427: its only failure is the unchanged host limitation
  `spawn php ENOENT` in the diagnostic-mail fixture. The 141-module production
  build and protected LAB build pass.

## Residual boundary

- Replace the provisional Illobo image when the final logo is supplied.
- Physical-Tesla cabin listening, the modelled audible 450 ms equal-power skip,
  and QR handoff remain separate acceptance work.

final result: passed

# Design QA — ATLAS manual pitch range

Date: 2026-08-31

## Source and implementation

- Owner-approved A1 contract: extend manual camera pitch to a hard-clamped
  `0–85°` range while preserving the exact six-second ownership lease and
  automatic return.
- Exact Tesla-viewport Browser evidence:
  `/private/tmp/sedicivalvole-atlas-a1-773x601.png`.
- State: ATLAS, explicit Milan demo, GPS unavailable, passenger panel open.

## Deterministic checks

- Project drag math reaches exactly `0°` and `85°`; further input at either
  endpoint remains clamped with no elastic overshoot.
- MapLibre receives the same `minPitch` and `maxPitch`, preventing native and
  project interaction limits from diverging.
- Invalid manual ownership does not trigger a return. A valid lease still
  begins one fresh return only after `6000 ms` of inactivity.
- Twenty-two focused ATLAS model checks and the 130-module production build
  pass.

## Rendered QA and residual acceptance

- At exact `773 × 601`, the real lazy-loaded MapLibre field renders the Milan
  demo, 3D buildings, passenger content and compass. Its initial automatic
  camera reports `62°` pitch and `16.2` zoom; browser warnings/errors are zero.
- The available in-app Browser exposes clicks but cannot synthesize the map's
  pointer-drag gesture. Exact endpoint behavior is therefore covered by the
  pure interaction model and explicit MapLibre constructor bounds; physical
  endpoint feel, near-horizon building occlusion, thermal cost and real-Tesla
  touch acceptance remain open.
- Deployment is intentionally deferred by the owner.

final result: passed

# Design QA — running topbar product mark

Date: 2026-08-31

## Source and implementation

- Owner browser annotation: replace the running textual `sedicivalvole`
  wordmark with the logo alone so later navbar copy or LIGHT/DARK/AUTO controls
  have a truthful allocation.
- Before, exact Tesla viewport:
  `/private/tmp/sedicivalvole-topbar-wordmark-before-773x601.png`.
- After, exact Tesla viewport:
  `/private/tmp/sedicivalvole-topbar-mark-after-773x601.png`.
- After, annotated viewport:
  `/private/tmp/sedicivalvole-topbar-mark-after-702x546.png`.
- State: running APERTURE with muted QA audio, RED 03 palette, controls awake.

## Required review

- **Identity:** the trigger reuses the packaged project-owned transparent
  `product-icon-512.png`; it introduces no new asset, licence, font, or remote
  request. The image remains decorative inside the accessible `Open session
  report` button.
- **Tesla geometry:** at `773 × 601`, the former `263 px` wordmark cell becomes
  a fixed `68 px` control with a centered `44 × 44 px` mark. ENGINE/FLUX moves
  beside it while telemetry, GPS and REPORT retain their exact prior positions.
  The resulting open lane between mode and telemetry measures `195 px`.
- **Annotated geometry:** at `702 × 546`, the same control and image dimensions
  remain intact, document dimensions stay exact, and the open lane remains
  `124 px`. At `1280 × 720`, the mark grows to `46 px` inside `72 px` and the
  open lane is `630 px`.
- **Future appearance boundary:** no LIGHT/DARK/AUTO control is pre-implemented.
  X10 owns the eventual control and must swap to a contrast-safe mark variant
  if the top bar itself adopts LIGHT tokens.

## Interaction and runtime checks

- Flow tested: Signal Gate → Instrument Deck → MUTE + APERTURE → START → wake
  controls → logo → Session report → CLOSE.
- The logo opens the report, initial focus lands on `Close session report`, and
  closing restores focus to `.topbar-mark` exactly.
- Browser page identity, meaningful content, framework-overlay absence, and
  console health pass at `773 × 601`, `702 × 546`, and `1280 × 720`; no tested
  viewport overflows.
- Twenty-six focused presentation/diagnostic checks and the 130-module
  production build pass. Deployment is intentionally deferred by the owner.

final result: passed

---

# Design QA — Road Sheet LIGHT Instrument Deck

Date: 2026-08-31

## Source and implementation

- Owner-selected direction 03 reference:
  `/Users/enuzzo/.codex/generated_images/01a0520f-bb95-7472-9af3-0100087ecc3e/exec-e84c6919-60af-41b9-be0d-8df9520d5d1c.png`.
- Browser-rendered implementation:
  `/private/tmp/sedicivalvole-road-sheet-selected-773x601.png`.
- Normalized full-view side-by-side comparison:
  `/private/tmp/sedicivalvole-road-sheet-comparison.png`.
- Warm-cache canonical rendering:
  `/private/tmp/sedicivalvole-road-sheet-live-warm-cache-773x601.jpg`.
- Normalized selected-reference/canonical comparison:
  `/private/tmp/sedicivalvole-road-sheet-live-comparison.png`.
- Pre-refinement exact-viewport Browser capture:
  `/private/tmp/sedicivalvole-road-sheet-spacing-before-773x601.png`.
- Refined exact-viewport Browser capture:
  `/private/tmp/sedicivalvole-road-sheet-spacing-after-773x601.png`.
- Refined annotated-size Browser capture:
  `/private/tmp/sedicivalvole-road-sheet-spacing-after-702x546.png`.
- Refined canonical exact-viewport Browser capture:
  `/private/tmp/sedicivalvole-road-sheet-spacing-live-773x601.png`.
- Refined canonical annotated-size Browser capture:
  `/private/tmp/sedicivalvole-road-sheet-spacing-live-702x546.png`.
- Reference pixels: `1423 × 1105`, normalized to the exact target ratio.
  Implementation CSS viewport and screenshot: `773 × 601` at density `1`.
- State: Instrument Deck with PLAY THE ROAD and APERTURE selected, START enabled.

The reference and both local and canonical browser renderings were normalized to
`773 × 601`, joined into `1546 × 601` comparison images, and opened as complete
comparison inputs. The browser frames are real application renders over the live
Signal Gate rather than static recreations of the concept.

## Required fidelity review

- **Typography:** exact `sedicivalvole` wordmark uses the packaged Orbitron
  variable face at weight `750` and `-0.02em`; labels, titles, descriptions,
  state copy, and START use Space Grotesk. At the Tesla viewport, section labels
  remain `19 px`, choice titles remain `15 px`, descriptions remain `12.5 px`,
  and the compact adjacent wordmark computes to `32 px`.
- **Layout and rhythm:** one open `724 × 552 px` warm-ivory sheet groups the
  `52 px` light 16 Road mark and Orbitron wordmark in one left-aligned lockup,
  while BACK remains independently anchored at right. The header contracts from
  `112 px` to `72 px`; the hairline, two-column body, vertical divider, and
  black START field retain the selected anatomy without nested black panels.
- **Exact equal-height requirement:** Music and Visual fieldsets both measure
  `378 px` from `y=117.5` to `y=495.5`. Their button grids both measure exactly
  `342 px` from `y=145.5` to `y=487.5`. The selector has `scrollHeight ===
  clientHeight === 550` and the document remains exactly `773 × 601`.
- **Future third Visual row:** row count derives from the Visual registry with a
  floor of two rows. A temporary non-committed Browser QA row-count override at
  `702 × 546` produced three exact `90.66 px` tracks inside the unchanged
  `288 px` grid, with `21.45 px` minimum content clearance on both sides, no
  scroll growth, and the same `3 px` title/description gap. At `773 × 601`, the
  same formula yields three `108.66 px` tracks inside the fixed `342 px` grid.
- **Color and materials:** LIGHT uses warm ivory `#EEE9DE`, quiet control gray
  `#DCD7CE`, near-black ink/actions, vermilion `#E32219` state rails, thin dark
  rules, and the shared `6 px` radius. No active Visual palette is recoloured.
- **Interaction:** PLAY THE ROAD + APERTURE expose two measured `34 × 3 px`
  vermilion rails and enable START. At the annotated `702 × 546` size, the
  closest rail/title clearance is `11.45 px`; selected content no longer shifts
  vertically. MUTE + APERTURE enters the running experience
  with `data-environment="aperture"`, a live canvas, no retained launcher, and no
  audio output.

## Comparison history

| Pass | Severity | Finding | Resolution and evidence |
|---|---|---|---|
| 1 | P1 | Native fieldset layout let Music grow beyond Visual and overlap the START row despite grid declarations. | Added explicit equal-height Music/Visual grid wrappers, bounded the body with `minmax(0, 1fr)`, and measured identical `280 px` grid bounds in Browser. |
| 2 | — | No actionable P0, P1, or P2 mismatch remained in the joined reference/implementation review. | The implementation preserves the reference's hierarchy, direct controls, warm sheet, restrained signal color, and readable cabin-scale type while satisfying the stricter equal-height product constraint. |
| 3 | P1 | The first canonical frame loaded the old dark SVG from a warm browser cache even though the deployed stable-name file was byte-identical to the new LIGHT master. | Both product-mark consumers now append the injected build stamp to the packaged asset URL. The same browser session then loaded `/brand/sedicivalvole-mark.svg?build=20260830-2344`; the final canonical comparison shows the correct warm-light master with no black plate. |
| 4 | P1 | At the narrower annotated viewport, the selected vermilion rail could cross PLAY THE ROAD; the header consumed unnecessary height; Music and Visual used looser, inconsistent-feeling internal space before a planned third Visual row. | Raised the rail from `12 px` to `7 px`, reduced it to `3 px`, removed selected-title displacement, halved the title/description gap, standardized `10 px` card and field padding with `8 px` grid gaps, and replaced the separated `112 px` brand header with a compact `72 px` adjacent lockup. Exact `773 × 601`, annotated `702 × 546`, and temporary three-row Browser measurements pass without overflow or console output. |

## Runtime checks

- Page identity, non-blank content, meaningful launcher copy, and framework-
  overlay absence pass.
- Exact `773 × 601` interaction flow: Signal Gate → Instrument Deck → PLAY THE
  ROAD + APERTURE → enabled START; separate MUTE + APERTURE → running canvas.
- The local Browser reports zero warnings and zero errors after the complete
  interaction flow.
- Refined local Browser QA at `773 × 601` and `702 × 546` keeps page dimensions
  exact, preserves all approved font sizes, and completes MUTE + APERTURE into
  `phase-running` with one canvas and no retained launcher.
- Canonical build `20260831-0006` repeats the refined exact `773 × 601`
  geometry: the sheet remains `724 × 552 px`, the compact header is `72 px`,
  the mark is `52 px`, and both fieldsets and both grids measure `378 px` and
  `342 px`. The selected PLAY THE ROAD rail retains `27.7 px` clearance from
  its title; APERTURE retains `49.63 px`.
- The same canonical build at the annotated `702 × 546` viewport keeps the
  document exact, the sheet at `654 × 498 px`, the header at `72 px`, and both
  grids at `288 px`. PLAY THE ROAD retains the measured `11.45 px` minimum
  rail/title clearance, title/description spacing remains `3 px`, and the
  `10 px` card padding plus `8 px` grid gap remain shared by Music and Visual.
- Canonical MUTE + APERTURE enters `phase-running` with one live canvas and no
  retained launcher. Page identity, meaningful content, and framework-overlay
  absence pass; the exact `773 × 601` canonical run reports zero warnings and
  zero errors.
- Live HTML, JavaScript, CSS, and the LIGHT SVG are byte-identical to the clean
  build. Twenty-six focused presentation/documentation checks, nine Sites
  checks, sixteen deployment-identity checks, and the 130-module production
  build pass. The complete suite retains only the known local
  `spawn php ENOENT` fixture.

## Follow-up boundary

- Product-wide DARK tokens, the Appearance control, persistence/reset behavior,
  and AUTO day/night selection remain X10 work. They must reuse this exact Road
  Sheet anatomy rather than redesigning the layout.
- Physical-Tesla cabin-distance and glare validation remain required before
  changing the approved type hierarchy or LIGHT surface luminance.

final result: passed

---

# Design QA — 16 Road launch lockup and Orbitron wordmarks

Date: 2026-08-30

## Source and implementation

- Source product state: `/private/tmp/sedicivalvole-brand-before-773x601.png`.
- Selected identity asset: `prototype/drive-lab/public/brand/sedicivalvole-mark.svg`; visual inspection used the packaged `512 × 512` product icon rendered from the same approved 16 Road master.
- Browser-rendered Tesla implementation: `/private/tmp/sedicivalvole-brand-home-773x601.png`.
- Browser-rendered Instrument Deck: `/private/tmp/sedicivalvole-brand-deck-773x601.png`.
- Browser-rendered running top bar: `/private/tmp/sedicivalvole-brand-topbar-773x601.png`.
- Browser-rendered desktop implementation: `/private/tmp/sedicivalvole-brand-home-1280x720.png`.
- Canonical browser rendering: `/private/tmp/sedicivalvole-brand-live-773x601.jpg`.
- Full-view normalized before/after comparison: `/private/tmp/sedicivalvole-brand-before-after-773x601.png`.
- Tesla CSS viewport and screenshots: `773 × 601` at density `1`; desktop CSS viewport and screenshot: `1280 × 720` at density `1`.
- State: idle Signal Gate for the primary comparison, then Instrument Deck and running MUTE + APERTURE for wordmark-isolation checks.

The prior and revised Signal Gate captures were joined into one `1554 × 601` comparison and opened as a single image. Both sides therefore share the exact viewport, field state family, crop and density. The selected brand mark was also opened independently at its full packaged `512 × 512` size before implementation.

## Required fidelity review

- **Fonts and typography:** exact textual `sedicivalvole` wordmarks use the restored, unmodified Orbitron variable font at weight `750` with restrained `-0.02em` tracking. The launch lockup computes to `-0.64 px` at `32 px`; Instrument Deck computes to `-0.58 px`; the compact top bar computes to `-0.34 px`. `PLAY THE ROAD`, all Music/Visual labels, telemetry, controls and the session report remain Space Grotesk. No unrelated typography changed.
- **Spacing and layout rhythm:** the welcome contracts from `390 × 170 px` to `360 × 160 px`. The mark is `42 × 42 px`, separated from the wordmark by `12 px` inside a `64 px` identity band; the command keeps `74 px`. At `773 × 601`, the action remains centered with zero document overflow and leaves slightly more negative space around the visual field without appearing undersized.
- **Colors and visual tokens:** the existing warm-ivory frame, near-black action field, vermilion/ice Signal Gate and travelling white-to-red command are unchanged. The real 16 Road asset supplies its own black, vermilion and warm-white palette without a synthetic recolour.
- **Image quality and asset fidelity:** the home uses the existing approved vector master directly at `/brand/sedicivalvole-mark.svg`; no copied, redrawn, rasterised or approximate logo was introduced. The SVG reports its full natural `512 px` source width and renders sharply at `42 px`.
- **Copy and content:** the welcome remains one semantic `PLAY THE ROAD` button. The mark is decorative inside that already named action (`alt=""`, `aria-hidden="true"`), avoiding duplicate screen-reader speech. Project title, command, creator, collaborator, source and local-capability copy are unchanged.
- **Focused-region evidence:** the combined comparison shows the new horizontal mark/wordmark lockup filling its band more deliberately than the previous text-only title while the smaller outer plate reduces visual dominance. Instrument Deck confirms the same brand face at a useful title scale; the running top bar remains compact and leaves REPORT, GPS, mode and telemetry geometry unchanged.

## Comparison history

| Pass | Severity | Finding | Resolution and evidence |
|---|---|---|---|
| 1 | — | No actionable P0, P1 or P2 mismatch. | The side-by-side lockup preserves the selected Signal Gate hierarchy, uses the approved asset, reduces the welcome footprint, keeps tracking visibly restrained, and introduces no clipping or layout reflow at either tested viewport. |

## Interaction and runtime checks

- Flow tested: Signal Gate → `PLAY THE ROAD` → Instrument Deck → MUTE + APERTURE → START → running top bar.
- Page identity and meaningful content pass; no Vite/framework overlay appears.
- The icon loads completely at its expected `512 px` natural width.
- Browser console check reports zero warnings and zero errors after the complete interaction flow.
- Exact `773 × 601` and `1280 × 720` screenshots both report zero horizontal or vertical document overflow.
- Canonical build `20260830-2243` repeats the full Signal Gate → Instrument Deck → MUTE + APERTURE → START flow at exact `773 × 601`; the home action computes to `360 × 160 px`, the SVG loads at `42 px` from its `512 px` source, the deck and top-bar wordmarks retain isolated Orbitron metrics, and the live page reports zero warning/error.
- Canonical HTML, CSS, JavaScript, Orbitron WOFF2 and 16 Road SVG are byte-identical to the verified local build; HTML returns explicit no-cache and `nosniff` headers.
- Twenty-eight focused splash, brand and LAB checks pass; the broader forty-one-check documentation/presentation set passes; the complete production build transforms `130` modules and packages both fonts plus the protected LAB. The full suite retains only the known local `spawn php ENOENT` diagnostic-mail fixture limitation.

## Follow-up polish

- P3: confirm the `42 px` mark and compact Orbitron top-bar wordmark from normal cabin distance on the physical Tesla before increasing either; the current desktop and exact-viewport evidence does not justify a larger lockup.

final result: passed

---

# Design QA — REPORT top-bar control

Date: 2026-08-30

## Source and implementation

- Source visual truth: `/Users/enuzzo/.codex/generated_images/01a0520f-bb95-7472-9af3-0100087ecc3e/exec-77d7458d-58a8-4f40-8c11-26e1def81082.png`.
- Browser-rendered implementation: `/private/tmp/sedicivalvole-report-773x601.png`.
- Canonical browser rendering: `/private/tmp/sedicivalvole-report-live-773x601.png`.
- Open-dialog interaction evidence: `/private/tmp/sedicivalvole-report-dialog-773x601.png`.
- Full-view normalized comparison: `/private/tmp/sedicivalvole-report-full-comparison.png`.
- Focused control comparison: `/private/tmp/sedicivalvole-report-control-comparison.png`.
- CSS viewport and implementation pixels: `773 × 601` at screenshot density `1`.
- Source pixels: `1422 × 1106`, downsampled to `773 × 601`; its aspect ratio already matches the Tesla viewport within rounding.
- State: running APERTURE with muted QA audio, RED 03 palette, controls awake, REPORT closed for the source comparison and open for the interaction check.

The source and implementation were opened together in one `1546 × 601` image. A second `392 × 248` comparison normalizes the two REPORT cells to the same height so icon geometry, label scale, spacing, and edge treatment remain readable.

## Required fidelity review

- **Fonts and typography:** the visible `REPORT` label uses the product's locally packaged Space Grotesk at `8 px`, weight `600`, with restrained tracking. It stays fully legible inside the real `52 × 68 px` Tesla navigation cell and preserves the selected uppercase hierarchy.
- **Spacing and layout rhythm:** the official icon sits above the label in a `19 px + auto` two-row stack with a `4 px` gap. The existing GPS cell, telemetry module, mode switch, wordmark, and `64 px` footer do not move; the document remains exactly `773 × 601` with no overflow.
- **Colors and visual tokens:** the control keeps the product's near-black top bar, warm off-white foreground, one-pixel divider, and quiet inactive state. The outer top-right corner continues the approved shared `6 px` product radius instead of adopting the mock's larger illustrative rounding.
- **Image quality and asset fidelity:** the icon is the official Tabler Icons `report-analytics` SVG from pinned release `3.46.0`, retained byte-identically at `618` bytes and SHA-256 `d58847492f890b8beedc7eff543860219e0f382e46d2c2695107d64ae434b9ba`. CSS changes only its monochrome presentation; the complete MIT licence ships beside it.
- **Copy and content:** the opaque abbreviation `DIAG` is removed from the current top bar and nearby live privacy copy. The visible label is `REPORT`, the accessible name is `Open session report`, and the destination remains visibly titled `Session report`. The full word `diagnostic` remains where it accurately names the technical send action and architecture.
- **Focused-region evidence:** the normalized crop confirms the same clipboard/report-with-metrics silhouette, icon-above-label anatomy, centered alignment, and monochrome treatment as the selected direction. The implementation is intentionally narrower because it preserves the real GPS and telemetry allocation at `773 × 601`.

## Comparison history

| Pass | Severity | Finding | Resolution and evidence |
|---|---|---|---|
| 1 | — | No actionable P0, P1, or P2 mismatch. | The full-view comparison preserves the existing approved product layout, while the focused comparison confirms the selected REPORT anatomy without introducing a gear, icon-only control, tooltip dependency, or top-bar reflow. |

## Interaction and runtime checks

- Flow tested: Signal Gate → Instrument Deck → MUTE + APERTURE → START → wake controls → REPORT → Session report → CLOSE.
- REPORT opens the modal session report, whose initial focus lands on `Close session report`; closing returns focus to the exact `.report-button` trigger.
- The rendered report confirms `773 × 601`, APERTURE, coordinate-free metrics, and zero captured runtime issues.
- Browser page identity, non-blank content, framework-overlay absence, and console health pass; the in-app Browser reported zero warnings or errors.
- Sixty-two focused presentation, ATLAS, documentation, launcher, and Sites checks pass. The production build completes with `130` modules and packages the pinned SVG plus its MIT licence.
- The complete suite retains one pre-existing local-environment failure only: the deterministic mail fixture cannot spawn the absent `php` executable (`spawn php ENOENT`).

## Follow-up polish

- P3: physical-Tesla cabin-distance confirmation remains useful before changing the selected `19 px` icon or `8 px` label; the current proportions already match the normalized source and preserve the compact navigation contract.

final result: passed

---

# Design QA — flat Signal Gate launch surface

Date: 2026-08-28

## Source and implementation

- Source visual truth: `/Users/enuzzo/.codex/generated_images/01a044c0-53f2-7381-98ee-6c32f9049387/exec-55b8c8bc-3e76-4797-b18c-04ccea8c6f5a.png`.
- Browser-rendered implementation: `/tmp/sedicivalvole-signal-flat-refined-773x601.png`.
- Full-view comparison evidence: `/tmp/sedicivalvole-signal-comparison-final.png`.
- Focused launch-surface comparison: `/tmp/sedicivalvole-signal-comparison-plate-final.png`.
- Motion evidence: `/tmp/sedicivalvole-signal-wave-sequence.png`.
- CSS viewport and implementation pixels: `773 × 601` at screenshot density `1`.
- Source pixels: `1423 × 1105`, center-cropped and normalized to `773 × 601` for full-view comparison; the launch surface was separately normalized to the approved `390 × 170 px` product constraint.
- State: idle Signal Gate splash, launch enabled.

The normalized source and latest browser rendering were opened together in one `1546 × 601` comparison. A second `780 × 170` focused comparison makes typography and surface anatomy inspectable at the approved product size.

## Required fidelity review

- **Fonts and typography:** the existing monospace stack preserves the selected rigorous character. The wordmark grows from `20 px` to `29.37 px` at the Tesla viewport and occupies `281.42 px`; `PLAY THE ROAD` renders at `23.19 px` across `258.38 px`. Neither wraps or clips. The command's infinite gradient moves through measured background positions, with a static white/red state under reduced motion.
- **Spacing and layout rhythm:** the one semantic launch surface remains exactly `390 × 170 px` at `x = 191.5`, `y = 376.21`. A `58 px` ivory wordmark rail and `86 px` full-width black command field sit inside the restrained `12 px` frame. The ImageGen source made the plate larger relative to the screen; retaining the earlier user-approved Tesla size is an intentional product constraint, not implementation drift.
- **Colors and visual tokens:** near-black, warm ivory, vermilion, pale red and ice white match the selected hierarchy. Red appears only in the live road and travelling command wave; no decorative safety control remains.
- **Image quality and asset fidelity:** Signal Gate stays a live WebGL2 field with Canvas2D fallback, never a raster replacement. All three obsolete latch, vent and safety textures were removed from the published asset tree. Independently phased gaps are visible on every lane; eight low-opacity asymmetrical rays remain subordinate to the road.
- **Copy and content:** the launch surface contains only `sedicivalvole` and the stateful `PLAY THE ROAD` / `STARTING` command. Build stamp, project credit and local-capability note remain outside it.
- **Focused-region evidence:** the `390 × 170 px` comparison confirms that the implementation follows the selected two-band hierarchy while removing the requested red button, perforation grid, separator and all simulated hardware.

## Comparison history

| Pass | Severity | Finding | Fix and post-fix evidence |
|---|---|---|---|
| 1 | P2 | Initial code translation removed the fake controls correctly, but the wordmark and command did not occupy enough of their bands relative to the selected revision. | Increased the responsive wordmark from `27 px` to `29.37 px` and the command from `19.33 px` to `23.19 px`; the final focused comparison confirms the stronger typographic fill without clipping. |
| 1 | P2 | One still frame could not prove that the horizontal command wave actually travelled. | Captured three browser frames `700 ms` apart; computed background positions changed from `-44.57%` to `153.52%` to `108.76%`, and the combined sequence shows the red wave crossing different letter groups. |

## Interaction and runtime checks

- `PLAY THE ROAD` remains one semantic button and completes the existing launch transition.
- Local Browser QA at `773 × 601` measured the launch surface, captured the animated command and exercised the primary launch gesture.
- The running experience became visible, the splash became hidden, and no console warnings or errors were recorded.
- WebGL2 compiled and rendered the independently phased road gaps and restrained rays; the deterministic source test also asserts the per-lane hash, true gap multiplier and eight-ray contract.
- 136 unit tests, 4 packaging tests and the production build pass.

## Follow-up polish

- P3: validate the ray visibility and ivory brightness on the physical Tesla display before increasing either; the current implementation intentionally prioritizes the road and typography.

final result: passed
---

# Historical design QA — Kinetic Meridian, rejected Latitudes, and ATLAS

> Latitudes was rejected and removed from the active product on 2026-08-28.
> Its references and measurements below remain historical evidence only; the
> archived source under `archive/visuals/latitudes/` is not built or selectable.

Date: 2026-08-28

## Selected directions and current render evidence

- Meridian source direction: `/Users/enuzzo/.codex/generated_images/01a044c0-53f2-7381-98ee-6c32f9049387/exec-2b816b1b-69e3-4a7d-b484-ab891ce135ca.png`.
- Meridian implementation: `/tmp/sedicivalvole-meridian-kinetic-final-773x601.png`.
- Meridian side-by-side comparison: `/tmp/sedicivalvole-meridian-comparison.png`.
- Latitudes retained source direction: `/Users/enuzzo/.codex/generated_images/01a044c0-53f2-7381-98ee-6c32f9049387/exec-33f73680-c78b-4564-b8d0-8e9c3bc66990.png`.
- Latitudes implementation: `/tmp/sedicivalvole-latitudes-topography-773x601.png`.
- Latitudes side-by-side comparison: `/tmp/sedicivalvole-latitudes-comparison.png`.
- ATLAS implementation: `/tmp/sedicivalvole-atlas-773x601.png`.
- Browser viewport: `773 × 601`, DPR `1`, fixed QA speed `80 km/h`.

The reference and implementation images were normalized to the same viewport
and opened side by side. The references establish hierarchy, material and depth;
they are not shipped assets or substitutes for the live renderers.

## Visible comparison

| Area | Finding | Resolution |
|---|---|---|
| Meridian depth | The first implementation revealed only distant forms at rest and retained too much of the old wire grid. | Visibility keys now reveal a deterministic cross-section at every depth. Solid and glass towers, floor plates and cantilevers share the same wrapped displacement field. |
| Meridian material | Flat pale blocks lacked the selected direction's facade detail and atmosphere. | Added palette-driven window grids, emissive edges, translucent secondary volumes, directional lighting and one inexpensive full-screen horizon-haze pass. |
| Meridian continuity | New architecture could not change the approved travel geometry or frame-rate-independent motion. | Buildings reuse the established travel length, time offset, distortion function and camera aim. Speed changes density, glow and mass progressively rather than replacing the scene. |
| Latitudes form | The old quantized field read as thick horizontal zebra bands with no spatial intent. | Fourteen broad temporal ribbons now sample the same eight-second history as continuous relief. Contour light and sparse particles grow with speed without changing renderer identity. |
| ATLAS hierarchy | The first OpenFreeMap Liberty pass carried unrelated iconography and a generic multicolour street-map skin. | Replaced it with a minimal original vector style: near-black land, palette roads/water, height-driven 3D buildings, restrained place labels, mandatory attribution and no sprite dependency. |
| Passenger panel | Place context had to remain useful without competing with the road experience. | A fixed right panel contains one concise nearby introduction, four selectable Wikipedia pages and one locally generated QR. It follows the active palette and remains clear of the 64 px footer. |

## Interaction, privacy, and runtime checks

- Visual library selection for Meridian, Latitudes and ATLAS: **PASS**.
- Palette propagation through WebGL shaders, MapLibre style, panel accent and
  NEON/ACID thumbnails: **PASS**.
- ATLAS demo-location map tiles, 3D buildings, Italian Wikipedia response, four
  passenger entries, selected-page QR and required attribution: **PASS**.
- Browser warnings, errors, WebGL context loss and unhandled rejection: **zero**.
- The MapLibre and QR modules are separate dynamic chunks; neither is loaded on
  the initial Aperture/Meridian/Latitudes path.
- The diagnostic JSON remains coordinate-free. ATLAS location use is separately
  disclosed and never enters local storage or the diagnostic send payload.
- 149 unit tests, 4 packaging tests and the production build pass.

## Simulated performance evidence

At the exact `773 × 601` viewport and fixed `80 km/h` QA speed:

| Environment | Frames | Average | p95 | Slow frames >34 ms | Latest JS heap |
|---|---:|---:|---:|---:|---:|
| Meridian | 20,076 | 59.99 FPS | 18.0 ms | 0 | 24.7 MB |
| Latitudes | 96 | 59.99 FPS | 17.5 ms | 0 | unavailable in the short phase |
| ATLAS | 5,441 | 60.00 FPS | 18.3 ms | 0 | 55.7 MB |

ATLAS peaked at `84.9 MB` browser-exposed JS heap after map initialization. Its
approximately `941 KB` minified MapLibre chunk is lazy and therefore does not
affect launch or the other visual environments. These are desktop simulations,
not vehicle acceptance; the next Tesla diagnostic must confirm ATLAS GPU/memory
behavior and sustained thermal frame pacing.

final result: passed locally; vehicle acceptance open

---

# Design QA — compact PALETTE footer

Date: 2026-08-28

## Source and implementation

- Source state: canonical build `20260828-0927` captured at `773 × 601` in
  `/tmp/sedicivalvole-footer-before.png`.
- Selected direction: user-approved `PALETTE` anatomy — audio icon only, no
  `RUNNING`, category above value for Visual and Music, and explicit carets.
- Implemented state: `/tmp/sedicivalvole-footer-final-773.png`.
- Side-by-side comparison: `/tmp/sedicivalvole-footer-comparison.png`.
- Target flow: launch → running Flux → wake footer → change Palette → open and
  close Visual/Music libraries → mute/unmute.

## Mismatch ledger

| Priority | Source mismatch | Resolution and post-fix evidence |
|---|---|---|
| P1 | Audio used a 96 px cell plus `RUNNING`, spending two text rows on an icon state. | Reduced it to one 64 px touch cell and one palette-coloured 38 px icon; the mute glyph changes without adding copy or inverting the whole cell. |
| P1 | `VISUAL VERTIGO` and `MUSIC JUNCTION` competed horizontally with their number/caret metadata. | Category now occupies the first row, the active choice the second, and number/caret own a fixed right column. No child overflows its measured track. |
| P2 | `BODY COLOR` implied vehicle paint even though the same control drives every visual renderer and the interface accent. | Renamed it `PALETTE` in UI, accessibility copy, diagnostics, durable direction and current product documents. |

## Pixel and interaction evidence

- Footer open state: `773 × 64.5 px`; measured tracks are `64 / 196 / 212 /
  301 px`, exactly filling the viewport.
- Every track reports `scrollWidth == clientWidth`; no horizontal overflow,
  clipping or redundant line is present.
- Palette selection updates the field, active swatch, selected name, caret and
  audio icon accent together.
- Visual and Music both open real modal libraries; both carets therefore remain
  truthful. The icon-only Mute control changes to an `Unmute audio` accessible
  name.
- Page identity, meaningful DOM, launch interaction, Visual library, Music
  library, palette selection and mute state: **PASS**.
- Console warnings/errors: **zero**.
- 142 unit tests, 4 packaging tests and the production build pass.

final result: passed

---

# Design QA — selected Meridian oblique-blade rebuild

## Reference

- Selected fidelity contract: `/Users/enuzzo/.codex/generated_images/01a044c0-53f2-7381-98ee-6c32f9049387/exec-9b5af995-6134-463c-af4c-d4a7392badf3.png`
- Previous current build: `/tmp/sedicivalvole-meridian-current-90kmh-773x601.png`
- Rebuilt real WebGL2 render: `/tmp/sedicivalvole-meridian-90kmh-773x601.jpg`
- Combined same-state comparison: `/tmp/meridian-reference-vs-final.png`
- Exact speed matrix: `/tmp/meridian-speed-matrix-773x601.jpg` (`0`, `40`, `90`, `130 km/h`; every panel is `773 × 601`)

## Checklist

- [x] **Layout:** Passed. Existing header, footer, selectors, palette and telemetry remain unchanged at `773 × 601`; the corridor stays low and leaves the control plane legible.
- [x] **Spacing:** Passed. No new overlay or control collision; the selected environment remains fully visible between the existing chrome bands.
- [x] **Typography:** Passed. Existing local Orbitron hierarchy and product copy are preserved.
- [x] **Color:** Passed. Large blade faces, translucent shoulders, edge light and longitudinal bands use the active palette; RED 03 was compared directly with the selected reference.
- [x] **Interaction:** Passed. Launch, Visual library, Meridian selection, Music library, JUNCTION selection and diagnostic drawer were exercised in the in-app browser.
- [x] **Responsiveness:** Passed for the agreed Tesla viewport. Exact captures at rest, urban and motorway states are `773 × 601`; model tests cover monotonic FOV/depth/peripheral response.
- [x] **Content:** Passed. The tower/city/balcony grammar is removed. The field uses sparse oblique Euclidean blades and authored longitudinal shoulder planes, with no scene-wide particles or sky wireframe.
- [x] **Polish:** Passed. The final comparison removes the previous repetitive buildings and the intermediate horizontal scan-line artifact. Runtime diagnostics report WebGL2, `60.15 FPS`, `18.1 ms p95` and zero runtime issues during the sustained local Meridian pass.

## Discrepancies resolved

- **P0:** none found.
- **P1:** fixed the visually impoverished tower corridor by replacing it with large solid/translucent palette blades; fixed the weak speed reading with monotonic FOV, depth compression, peripheral stretch/parallax and longer structural flow planes; fixed excessive vertical rollercoaster excursion.
- **P2:** removed repeated posts/cloud slabs, removed sky scan lines, introduced asymmetrical station timing and face materials, and strengthened red/white/secondary blade mass without changing product chrome.

## Browser QA Result

Passed locally at the required `773 × 601` viewport. Launch and core selectors work; Meridian renders through WebGL2 across `0`, `40`, `90` and `130 km/h`; the fresh browser session reports no current console warnings/errors. The result is an implementation match within the practical limits of the real-time no-bloom renderer, not a generated-image substitution. Real-Tesla visual acceptance remains open.

---

# Design QA — WAKE fidelity contract

Date: 2026-08-29

Status: **superseded and rejected later on 2026-08-29**. The product owner found
that the final ribbons read as disordered rain rather than a convincing 3D
field. The renderer, fallback, tests and current QA captures were removed. The
record below is retained only to explain the abandoned iterations; its referenced
captures remain recoverable from Git history but are not current product assets.

## Contract

- Approved source: `/Users/enuzzo/.codex/generated_images/01a04c97-3426-7903-8336-af01ab3c6a15/exec-428d4bbf-ef29-46c1-9aee-2d8a2c1c6ca8.png`
- Source dimensions: `1423 × 1105`, normalized to the agreed `773 × 601` viewport for comparison.
- Implementation capture: `prototype/drive-lab/qa/wake-design-qa/implementation-final-773x601.png`
- Blocking side-by-side comparison: `prototype/drive-lab/qa/wake-design-qa/comparison-final.png`
- Motion sequences: `prototype/drive-lab/qa/wake-design-qa/flow-20-sequence.png`,
  `flow-60-sequence.png`, and `flow-130-sequence.png`.
- Runtime state: Flux, WAKE 05, JUNCTION, RED 03, QA speed `20 km/h`, audio muted.

## Comparison record

The approved source and the running implementation were inspected together in
one `1546 × 601` comparison image after each geometry and material pass. The
final pass preserves the complete Sedici Valvole header and control plane and
matches the source's seven authored surfaces: the upper red crossing, recessed
upper shadow, returning graphite loop, folded lower-left red sheet, tapered
right red sheet, lower graphite fold and lower-right maroon sheet.

Live review reopened the gate twice: first because the material itself needed
to move, then because draping was not enough and the surfaces needed to stream
like roads. The final renderer therefore transports compression, width, fold
and twist geometry longitudinally along every authored spline. Drape dominates
at low speed; directional flow, crossings and temporary knots grow continuously
with road energy. This is geometric advection, not a light-only animation.

Three-frame browser sequences use `900 ms` intervals at each speed. Field-only
frame-one-to-frame-three RMSE rises monotonically from `0.072862` at `20 km/h`
to `0.161393` at `60 km/h` and `0.254572` at `130 km/h`, confirming that the
surfaces themselves travel progressively faster. Deterministic model tests
separately assert monotonic phase rate, sway, tangle, longitudinal compression
and moving width.

The implementation intentionally reports JUNCTION's current truthful `85 BPM`
at `20 km/h`, rather than the superseded `127 BPM` shown by the static design
source. The implementation capture is intentionally muted because unattended
browser QA must not play through the speakers. Neither state difference changes
the WAKE visual contract.

## Severity gate

- P0: none.
- P1: none.
- P2: none after pass 8. Continuous cross-section tessellation removed the
  segmented edges; authored tapering restored the source composition; the
  final material pass restored graphite separation, fold highlights, subtle
  grain and red-to-maroon depth. The two live-review passes added geometric
  cloth motion and directional road-like flow without altering the product
  control plane.

final result: passed

### Pass 9 — explicit road travel after live review

The product owner reopened the motion gate after pass 8: the sheets moved and
draped successfully, but the motion still read as deformation in place rather
than ribbons travelling like roads. The previous RMSE evidence proved change,
not a persistent direction of travel, and therefore did not satisfy that
perceptual requirement by itself.

- Previous and corrected `130 km/h` sequences were inspected together in
  `prototype/drive-lab/qa/wake-road-flow-2026-08-29/old-vs-road-flow-130.png`.
- A new integrated conveyor phase advances monotonically and independently of
  the breathing/drape clock. It moves centerline compression, width, camber,
  relief and twist; the synchronized shader cue is supporting evidence rather
  than the source of motion.
- The Canvas2D fallback now samples the same moving spline geometry instead of
  drawing static authored control points.
- Equal-interval muted browser sequences at exactly `773 × 601` use three
  frames separated by `900 ms`. Frame-one-to-frame-three RMSE is `0.0620132`
  at `20 km/h` and `0.205038` at `130 km/h`.
- A deterministic check asserts forward phase travel, more than fivefold speed
  separation between `20` and `130 km/h`, simultaneous centerline/depth/width
  displacement, and a frozen conveyor under reduced motion.
- Browser console warnings and errors: zero. Six WAKE model checks and the
  production build pass.

Pass 9 severity gate: **P0 none, P1 none, P2 none**. Real-Tesla visual review
remains the acceptance boundary for apparent direction, cabin distance and
display persistence.

final result after pass 9: passed locally; vehicle acceptance open

---

# Design QA — DRIVEY 06 original road field

Date: 2026-08-29

## Contract and evidence

- Admitted mechanics source: Drivey commit `5104cdad`, attribution and
  implementation boundary already recorded in `THIRD_PARTY_NOTICES.md` and
  `docs/SOURCE-ADMISSION-2026-08-29.md`.
- Internal implementation concept:
  `/Users/enuzzo/.codex/generated_images/01a04dcc-293b-7d32-87b8-b8aa744650ff/exec-833d4088-526e-4dd2-aa46-f39659ac4a33.png`.
- Exact product captures:
  `prototype/drive-lab/qa/drivey-design-qa/implementation-closed-773x601.png`
  and `implementation-tune-773x601.png`.
- Runtime boundary: project-authored Canvas2D road, lane and terrain projection;
  no upstream source, shader, runtime, texture, model, level, vehicle, font,
  screenshot or brand asset enters the product.

## Fidelity ledger

| Priority | Comparison point | Resolution and evidence |
|---|---|---|
| P1 | The first implementation exaggerated road relief into a mountain-like fold and made the Rear camera approach an accidental loop. | Reduced road elevation to a restrained fraction of the terrain profile and repeated the `60 / 130 km/h` render comparison. The road remains continuous, broad and readable in Driver, Hood and Rear views. |
| P1 | The concept requires actual road travel rather than a static wireframe composition. | Longitudinal road sections and centre dashes advance through a frame-rate-independent phase. Speed owns travel rate and perspective; the deterministic model proves more than twentyfold rate separation between rest and `100 km/h`. |
| P1 | TUNE must fit the real product without covering the speed module or footer. | The collapsed control occupies the measured upper-left gap at `16 × 82 px`; the 232 px panel ends above the 64 px Tesla footer. Responsive checks show no document overflow at `773 × 601`, `390 × 844`, or `601 × 390`. |
| P2 | Palette and macro behavior must belong to the road rather than a generic overlay. | Road edges, centre guide, cross-sections and terrain read the selected Sedici palette. OPEN changes perspective, UNDERWATER compresses depth/relief, and BLOOM strengthens native line and colour timing. |
| P2 | Camera and Structure controls must be purposeful and accessible. | Driver, Hood and Rear are 44 px pressed-state buttons; Structure is one clamped `20–100` range with an explicit accessible name and live value. No generic intensity control was added. |

## Browser and responsive result

- Exact `773 × 601` product flow: launch muted → Visual library → DRIVEY 06 →
  RED 03 → TUNE → Hood → Structure `100` → `130 km/h` BLOOM: **PASS**.
- Product chrome, title hierarchy, Music selection, palette control and the
  existing 68 px / 64 px bands remain unchanged. Above-the-fold copy adds only
  the approved `TUNE`, `DRIVEY 06`, Camera, and Structure labels.
- Runtime: Canvas2D, 59.99 FPS, 17.9 ms p95, zero runtime issues, zero current
  Browser warning or error.
- Reduced motion freezes travel and musical colour animation while retaining a
  legible road composition and every control.

P0: none. P1: none after the relief correction. P2: none.

final result: passed locally; real-Tesla motion comfort, touch and sustained
thermal acceptance remain open

---

# Design QA — DRIVEY 06 source-faithful recovery

Date: 2026-08-29

This gate supersedes the rejected clean-room result above without rewriting its
historical evidence. The accepted implementation embeds the actual Rezmason
Drivey runtime at commit
`5104cdade2a3158786b05b9b0680a50e942830cf`; its 51 manifest-listed files are
byte-identical. The project-authored same-origin iframe shell and parent bridge
hide the editorial/native control chrome and map Sedici Valvole speed, music,
effects and ten palettes onto state already owned by the upstream runtime.

## Product-review corrections

- Driver, Chase and Satellite are absent from the product surface. The remaining
  `VIEW` control cycles `HOOD → REAR → AERIAL → HOOD` on repeated presses.
- Native colour choices such as Technicolor are absent. Both Normal and Wire
  rendering use the active Sedici Valvole palette.
- `RENDER` cycles `NORMAL ↔ WIRE` on repeated presses. Wire is a full alternate
  rendering mode, not a generic effect laid over the scene.
- The initially approved controls were reduced to two `94 × 34 px` text-only
  buttons after live review. There is no icon, dropdown, disclosure or tuner
  panel; the visible text always reports the current state.

## Verified evidence

- Exact muted Browser flow at `773 × 601`: launch → DRIVEY → `VIEW` pressed
  three times produced Hood, Rear, Aerial, Hood; `RENDER` pressed three times
  produced Wire, Normal, Wire. The document contained zero DRIVEY panels and the
  current Browser console contained zero warning or error.
- A second muted pass at `390 × 844` confirmed that the compact rail fits without
  overflow and retains both controls.
- Current-build captures are
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/drivey-compact-normal-blue-773x601.png`,
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/drivey-compact-wire-blue-773x601.png`, and
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/drivey-compact-wire-blue-390x844.png`.
- Nine focused DRIVEY tests, the complete 335-test suite, the 128-module
  production build and the read-only canonical FTP preflight pass.

P0: none. P1: none. P2: none after the compact cycling-control correction.

final result: accepted locally by the product owner; real-Tesla touch, motion
comfort, frame pacing and sustained thermal acceptance remain open

---

# Design QA — PRTCL 07 local recovery candidate

Date: 2026-08-29

## Fidelity contract

- Audited PRTCL identity: local commit
  `2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060`.
- Stable source captures at `773 × 601`:
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/prtcl-source-frequency-stable-2a22f33-773x601.png`,
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/prtcl-source-murmuration-stable-2a22f33-773x601.png`, and
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/prtcl-source-axiom-stable-2a22f33-773x601.png`.
- Final clean-field candidates at the same viewport:
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/prtcl-qa-frequency-final-773x601.png`,
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/prtcl-qa-murmuration-final-773x601.png`, and
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/prtcl-qa-axiom-final-773x601.png`.
- Current product captures preserve the full Sedici Valvole chrome and separate
  TYPE / Palette choices:
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/prtcl-candidate-frequency-blue-773x601.png`,
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/prtcl-candidate-murmuration-blue-773x601.png`, and
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/prtcl-candidate-axiom-blue-773x601.png`.
  The `390 × 844` responsive pass remains current because the final renderer
  change did not alter layout. No PRTCL source UI, copy, brand, font,
  dependency, or asset is present.

## Comparison record

- Fractal Frequency retains the continuous golden-angle folded harmonic body,
  crest concentration, self-occluding depth, and slow rotation. The first local
  pass was too large and clipped; its camera framing was reduced before the
  final capture. Native spectral colour is deliberately replaced by the active
  Sedici Valvole palette.
- Murmuration retains the deterministic elongated flock, travelling wave,
  breathing, split/reform, roll, and flight circuit. The first pass looked like
  an undifferentiated cloud because it observed the flock along the wrong axis;
  the corrected camera exposes the broad horizontal wave seen in the source.
- Axiom retains the low rolling grid landscape, stacked moving waves, and the
  distinct falling/sliding/respawning agent population. Terrain colour now
  reserves the palette's light value for crests instead of whitening the whole
  surface.
- Portrait projection reduces camera zoom below `0.9` aspect so the particle
  body remains legible above the existing two-row footer without changing the
  exact Tesla-landscape composition.

## Interaction and runtime evidence

- One text-only `94 × 34 px` TYPE button cycles
  `FRACTAL → MURMURATION → AXIOM → FRACTAL`; the measured size is identical at
  `773 × 601` and `390 × 844`. The DOM contains zero `select` elements and no
  PRTCL panel or disclosure.
- The existing Palette control remains independent. RED 03 and BLUE 04 product
  passes visibly recolour the same Fractal form without changing particle type.
- OPEN, UNDERWATER, and BLOOM have current deterministic `773 × 601` captures
  with distinct SHA-256 identities: base `3cd28078`, OPEN `a6cb5e08`,
  UNDERWATER `87bc2c4d`, and BLOOM `023cfbe0`. OPEN widens/spreads, UNDERWATER
  slows and attenuates, and BLOOM increases native point glow.
- Two reduced-motion screenshots separated by `800 ms` are byte-identical:
  `e734410e1a3888b2ef20408b415c60811746598b1658ada6e568aa68508f7462`.
- Fractal, Murmuration, and Axiom sustained `60.0`, `60.0`, and `59.2 FPS`
  respectively in the local exact-viewport harness, with no interval above
  `34 ms`. Browser logs contain Vite/React development info only, with zero
  warning or error. Eight focused PRTCL tests, the complete 343-test suite, and
  the exact 131-module production build `20260829-2222` carrying checkpoint
  `9f177fa` pass.

Local self-review severity: P0 none, P1 none after camera/framing corrections,
P2 none. This is machine and design-review evidence, not product-owner or
real-Tesla acceptance.

final result: local candidate ready for human visual approval; push, deploy,
real-Tesla motion comfort, frame pacing and thermal acceptance remain open

Product-owner update, 2026-08-29 23:26 CEST: PRTCL is visually approved for
publication. The fidelity, interaction, palette, source-boundary, and local
runtime evidence above are accepted; exact-source push/deployment and real-Tesla
motion comfort, frame pacing, thermal, and touch validation remain separate.

Publication update, 2026-08-29 23:37 CEST: source commit `b88070c`, build
`20260829-2337`, is live at the canonical root. Exact muted `773 × 601` Browser
QA cycled Fractal, Murmuration and Axiom independently of Palette, measured the
TYPE control at `94 × 34 px`, found zero `select` elements and returned zero
warning/error. The same run proved Drivey's build-stamped iframe, Normal/Wire
cycle and diagnostics at 59.42 FPS / 17.6 ms p95 with zero runtime issue.
Real-Tesla validation remains open.

---

# Design QA — DRIVEY 05 automatic road and dual-palette recovery

Date: 2026-08-29

## Product correction

- The parent bridge now instantiates the pinned runtime's real `Input` class in
  automatic mode instead of substituting a plain object. Manual steering remains
  disabled, the player car's random `weaving` value is reset to zero, and the
  original road approximation, look-ahead, tangent and steering code continues
  to own every curve. None of the 51 manifest-listed upstream files changed.
- Normal rendering now uses a four-stop project-owned runtime material ramp:
  dark → native `accent` → native `secondary` → light. Wire uses the same two
  native channels spatially, so it no longer averages a complementary pair into
  one intermediate line colour. Deterministic checks cover all ten presets.
- WAKE is rejected rather than revised again. Its catalog entry, renderer,
  fallback, tests and current QA captures are removed; stale preferences fall
  back to Aperture. DRIVEY and PRTCL close the active catalog as `05` and `06`.

## Verified evidence

- A muted held-speed Browser run remained aligned with the Industrial Zone road
  and its visible right-hand curve for 22 seconds at the `130 km/h` ceiling. The
  runtime readout stayed `WebGL · Original Drivey · Normal` at `60.0 FPS`, with
  `18.6 ms` p95, `19.5 ms` maximum, and zero intervals above `34 ms`.
- The exact `773 × 601` product frame shows RED 03 simultaneously as a red sky
  and blue road/highlight channel in Normal mode. ACID 08 Wire simultaneously
  shows magenta upper geometry and green road geometry. The compact controls,
  footer, speed module and palette remain unobscured.
- The exact `773 × 601` Visual library contains six entries, no WAKE node,
  `DRIVEY 05`, and `PRTCL 06`. Current captures are
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/drivey-road-follow-dual-red-773x601.jpg`,
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/drivey-wire-dual-acid-773x601.jpg`, and
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/visual-catalog-no-wake-773x601.jpg`.
- Ten focused DRIVEY checks, the complete 338-test suite, the exact 128-module
  production build `20260829-2322` carrying commit `633d526`, and the 51-file
  upstream SHA-256 integrity
  gate pass locally.

Local self-review severity: P0 none. P1 none after restoring the upstream Input
and suppressing only random player weaving. P2 none after separating both theme
channels in Normal and Wire.

final result: local candidate ready for product-owner and real-Tesla validation;
push and deployment remain intentionally open behind PRTCL approval

---

# Design QA — PRIMORDIAL 08 clean-room fluid field

Date: 2026-08-30

## Source and implementation boundary

- Visual reference: Liam Egan's public
  [GLSL: Primordial Soup](https://codepen.io/shubniggurath/pen/NXGbBo) Pen,
  rechecked on 2026-08-29. CodePen's
  [public-Pen licensing policy](https://blog.codepen.io/documentation/licensing/)
  applies MIT by default, but the Pen also attributes a value-noise fragment to
  Inigo Quilez without separately established reuse terms.
- The stricter admission boundary therefore remains in force: the local field
  copies no Pen HTML, CSS, JavaScript, shader, Three.js runtime, or attributed
  noise function. Its coupled-sine domains, six-layer warp loop, contours,
  colour mixing, pointer response, WebGL lifecycle, and Canvas2D failure path
  are project-authored.
- Reference and candidate evidence is retained outside the repository at:
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/primordial-reference-codepen-NXGbBo.jpg`,
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/primordial-red-bf9dec2-773x601.jpg`,
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/primordial-mint-bf9dec2-773x601.jpg`, and
  `/Users/enuzzo/.codex/visualizations/2026/08/29/01a04e7e-d9e8-7693-b050-beaedf042936/primordial-tuner-mint-bf9dec2-773x601.jpg`.
  The filenames retain the starting documentation identity; the rendered local
  implementation is checkpointed at `9b733f6`.

## Visual comparison

- The reference's dark organic marbling, layered colour islands, internal
  boundaries, slow fluid drift, and touch-deformed field are the high-level
  fidelity contract. The Sedici Valvole result deliberately replaces the
  source palette and all source math with five channels from each native theme.
- The first clean-room pass read as flat binary bands. The reviewed candidate
  broadens the islands, adds separate outer, inner, crease, and fine-crease
  structures, and mixes accent/secondary colour without becoming the rejected
  starburst language.
- Road speed alone owns radial convergence. Music level and tempo own field
  flow, colour movement, local agitation, and pulse. OPEN increases pressure
  and convergence, UNDERWATER slows and darkens the field, and BLOOM raises
  native crease light; no shared visual overlay is used.

## Controls and responsive evidence

- At exact `773 × 601`, the closed `TUNE / FIELD` text trigger measures
  `94 × 44 px` at `x=16`, `y=82`. Its open panel measures `232 × 227.5 px` at
  `x=16`, `y=130`, ending at `357.5 px`, above the footer at `528 px`.
- The panel exposes only Scale `0.60–1.60`, Flow `0.40–1.80`, and Warp
  `0.30–1.40`; Warp uses a `0.01` step so the authored `0.78` default is exactly
  representable. Values persist in the existing preferences, Escape closes the
  panel, opening pins the header/footer awake, and the DOM contains no `select`
  or dropdown.
- At `390 × 844`, the trigger starts at `12,76`, the `232 × 227.5 px` panel
  ends at `351.5 px`, and the footer starts at `642.67 px`. At short-landscape
  `601 × 390`, the `232 × 180 px` visible panel ends at `304 px`, retains a
  `226 px` internally scrollable content height, and remains above the footer at
  `317 px`. Both viewports have zero horizontal or vertical page overflow.

## Interaction and runtime evidence

- Pointer capture and direct canvas hit testing preserve touch and desktop
  deformation while the real product controls remain interactive. Under
  reduced motion, a mouse move changed the field capture from SHA-256
  `c702b69e...` to `8f40433b...`, proving interaction remains live without
  periodic animation.
- Two reduced-motion frames separated by `650 ms` are byte-identical at
  `c702b69ea1618143bc12283737bf1e0573a30eec0a75b06ae286c075c926ca75`.
  Base, OPEN, UNDERWATER, and BLOOM captures are all distinct at `c702b69e`,
  `b09d6788`, `564ff469`, and `1e913224` respectively.
- Exact muted `773 × 601` diagnostics report WebGL2 Primordial fluid field at
  `59.62 FPS` / `18.3 ms` p95 with zero runtime issue. Browser warning and error
  logs are empty. The catalog contains seven local entries, preserves slot 07
  for INFINITE, contains no WAKE, and leaves audio output muted.
- Eight focused PRIMORDIAL checks, ten DRIVEY checks, eight PRTCL checks, nine
  NIGHTSHIFT checks, 303 unit checks, and nine packaging checks pass: **347 / 347**.
  The exact 132-module production build `20260830-0008` carries implementation
  checkpoint `9b733f6`.

Local self-review severity: P0 none, P1 none after the layered-island correction,
P2 none after making the Warp default exactly representable.

final result: PRIMORDIAL is implemented, tested, accepted and canonically
published in exact source `44a3a42`, build `20260830-0038`; real-Tesla motion,
touch, frame-pacing, and thermal acceptance remain open

---

# Audio QA — unmistakable OPEN intake

Date: 2026-08-30

- The rejected baseline used a `320 Hz` cut, `9 kHz` shelf and `4.5 dB` side
  expansion. Its eight-second FRACTURE excerpt measured `0.013798` stereo and
  `0.011019` mono difference RMS, confirming why it could read only as reduced
  body in a car cabin.
- The revised path sweeps a music-derived band from `480` to `3200 Hz`, limits
  only that band, and keeps width at `0.5 dB`. The same excerpt measures
  `0.018116` stereo and `0.016630` mono difference RMS without normalization.
- A full constant-OPEN pass over the current FRACTURE reference peaks at
  `0.973394`; the old path peaked at `1.068865`. The A/B files are retained
  outside Git as `open-before-subtle.wav` and `open-after-focus-sweep.wav` in
  the current Codex visualization artifact directory.
- Twenty-one focused audio/runtime checks pass. The complete project gate is
  **351 / 351**, the 132-module build is `20260830-0031` at `ca5ffe9`, and muted
  local Browser QA shows OPEN at `35 km/h` with no warning or error.

final result: technically verified and canonically published in exact source
`44a3a42`, build `20260830-0038`; human headphone/cabin A/B and real-Tesla
listening acceptance remain open

---

final result: passed

---

# Design QA — ATLAS Navigator Plaque

Date: 2026-08-31

## Selected visual contract

- The owner selected direction **1 — Navigator Plaque** after exactly three
  focused ATLAS overlay treatments were presented.
- The selected direction was refined once before implementation: a live
  directional arrow must sit to the left of the English cardinal sector, with
  degrees on the same row and the rendered-tile road name below.
- Refined target:
  `/Users/enuzzo/.codex/generated_images/01a056ca-c4ff-7433-92c5-7a0aa0abd6e3/exec-85f9dbbb-3eb2-45fa-8146-062669a74970.png`.
- Exact local implementation:
  `/tmp/sedicivalvole-atlas-navigator-final-773x601.jpg`.
- Joined component comparison used for review:
  `/tmp/atlas-nav-final-comparison.png`.

## Visible comparison and iteration

- The first implementation retained MapLibre's separate compass beside the
  new plaque, which duplicated direction and did not match the selected target.
  The final implementation replaces it with the integrated pointer and moves
  the plaque to the target's `16 px` left alignment.
- The first outline pointer read too lightly against the map. It was replaced
  with the official byte-identical Tabler `navigation-filled` icon, rendered
  through the existing monochrome interface treatment.
- The initial road query inspected the visible `transportation` line layer,
  whose rendered features carry geometry/class but no street name. The final
  query uses a zero-opacity rendered line probe over OpenMapTiles'
  `transportation_name` source layer. It reads `Corso di Porta Romana` from the
  already loaded tile and performs no reverse-geocoding request.
- At exact `773 × 601`, the final plaque retains the target hierarchy, dark
  translucent field, square editorial geometry, filled pointer, cardinal,
  degrees and blue road line without obscuring the route or passenger panel.

## Interaction and responsive evidence

- Demo steering moved the plaque from `SE / 135°` to `S / 180°`; the pointer's
  continuous angle moved from `135deg` to `180deg` and the cardinal updated
  with it. The unwrap helper protects `359° → 0°` from a long reverse spin.
- Collapsing the passenger panel expanded the map from `527 px` to `773 px`;
  reopening restored the selected layout. Document dimensions remained exactly
  `773 × 601` with no horizontal or vertical overflow.
- The final screenshot shows `S / 184° / CORSO DI PORTA ROMANA`; the arrow
  points south and the road label remains stable while the automatic camera
  finishes its short bearing ease.
- Browser warning and error logs are empty.

final result: passed

---

# Swiss Compact Product-wide Design QA — 2026-09-03

## Selected visual contract

- The owner selected Direction 1, **Swiss Compact**, including its restrained
  editorial character, for the complete product typography calibration.
- The exact source of truth is
  `/Users/enuzzo/.codex/visualizations/2026/09/03/01a066e4-3cb6-7b22-bb96-503aeb7e838e/automotive-glance-audit/17-direction-swiss-compact.jpg`
  at `773 × 601`.
- Review used Codex's in-app Browser only. A locally served `1546 × 601`
  comparison canvas placed the source at exact `773 × 601` on the left and the
  live implementation, in the same running/controls-awake state and exact
  viewport, on the right. The comparison was inspected as one input rather
  than as unrelated screenshots.

## Five-point visible comparison

1. The implementation matches the selected six-track top-bar structure at the
   Tesla viewport: `184 / 174 / 90 / 94 / 120 / minmax(111, 1fr) px`.
2. The `72 px` top bar and `72 px` footer retain the reference's clear central
   visual field from `y=72` through `y=456`, or `384 px` of uninterrupted
   depth.
3. The lower transport is centred at approximately `x=120.5`, `y=456.5` and
   measures `532 × 72 px`, with `56 px` artwork and independent
   `48 / 56 / 48 px` previous, play/pause, and next targets.
4. The footer follows the selected `88 / 88 / 185 / 210 / 80 / 122 px`
   control tracks. Touch geometry remains larger than the visible type and no
   label crosses its assigned track.
5. The visible hierarchy follows the selected compact/editorial rhythm:
   `14 px` metadata, `15 px` labels, `16 px` body/actions, `18 px` active
   names, `24 px` titles, and `34 px` primary values, with tabular numerals and
   deliberate Title Case versus functional uppercase.

## Copy, content, and intentional deviations

- Calibration annotations printed on the source image are design evidence, not
  product copy, and are intentionally absent from the running interface.
- The source mock shows a fixed `Tropico / Illobo` example and `MUTE OFF`; the
  comparison build truthfully showed the selected runtime score/visual and its
  current mute state. Those content differences do not change geometry.
- Dynamic Aperture/map frames and palette colours remain live product state
  rather than being frozen to the reference frame.
- The packaged Space Grotesk interface face and Orbitron product wordmark are
  retained. MapLibre's remote map glyph rendering remains separately owned by
  the map style; the surrounding ATLAS interface follows Swiss Compact.

## Iteration history

- The first product-wide pass established the semantic scale and compact
  chrome. The final review then corrected a desktop source/network collision,
  a one-pixel mode-switch overflow, ATLAS time-axis and terrain compression,
  demo-hint/attribution placement, Music's nested scrollbar, Discover's
  two-pixel workspace clip, and its result-row rhythm.
- ATLAS now keeps its `320 px` panel and `340 px` instrument readable, uses
  compact narrow-axis labels, ellipsizes the terrain provider safely, and
  renders mandatory attribution as a dark subordinate strip clear of the hint,
  transport, and footer.
- Music exposes one internal scrolling surface only. Discover's drawer is a
  two-row grid with a non-clipping workspace and exact `64 px` result rows.

## Runtime and responsive evidence

- Exact local Browser QA covers splash, Instrument Deck, running/resting
  chrome, Music and Visual drawers, REPORT, Discover, ATLAS open/collapsed,
  limited and offline network states at `773 × 601`, plus the product at
  `1280 × 720`.
- Owner LAB and ShaderGradient workbench pass at both target sizes without
  relevant horizontal overflow; the workbench preserves editorial display type
  above its compact controls.
- Document dimensions remain exact at both product viewports. Music's outer
  panel is `overflow: hidden` with one bounded inner scroll; Discover's drawer,
  heading, workspace, and result rail fit their grid. Browser warning/error
  logs are empty.
- Focused checks pass `92/92`; the complete unit group passes `505/505`, Sites
  passes `9/9`, and production builds process `235` App modules and `159`
  protected-LAB modules.
- Real-Tesla cabin distance, glare, glance, touch, and motion acceptance remain
  an explicit physical gate and are not inferred from office/browser QA.

Local self-review severity: P0 none, P1 none, P2 none after the final geometry
and scroll corrections.

final result: passed
