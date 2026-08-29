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
