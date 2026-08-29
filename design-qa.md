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
