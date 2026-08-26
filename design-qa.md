# Design QA — Flux Modular Aperture

Date: 2026-08-26

## Source and implementation

- Source visual: `_references/visual/product-design/flux-revised-2026-08-26/flux-aperture-braun-body-color-source.png`
- Rest capture: `_references/visual/qa/modular-aperture-2026-08-26/flux-rest-773x601.png`
- Full-energy capture: `_references/visual/qa/modular-aperture-2026-08-26/flux-full-energy-773x601.png`
- Combined comparison: `_references/visual/qa/modular-aperture-2026-08-26/source-vs-build-full-energy.png`
- Primary viewport: `773 × 601` CSS pixels
- Secondary viewport: `1254 × 784` CSS pixels
- Source dimensions: `1422 × 1106`; normalized to `773 × 601` for comparison because both frames use the same aspect ratio.
- Compared state: `APERTURE 01`, Red 03, 120 km/h full-energy threshold, simulated speed 120 km/h, energy 100.

The source and current rendered capture were inspected together in one side-by-side image. The implementation preserves the source hierarchy, low control plane, top navigation, rectangular color selector, centered aperture, monochrome/red palette, and modular depth grammar. The procedural field intentionally changes individual panel placement between frames; exact texture matching is neither expected nor desirable.

## QA history

| Severity | Surface | Finding | Resolution |
|---|---|---|---|
| P1 | Rendering | The first browser pass was black because the fragment shader used GLSL-reserved identifiers and invalid scalar/vector addition. | Fixed; clean browser session reports `WebGL2 · Aperture` with no console warnings or errors. |
| P2 | Fidelity | The first running field was too sparse at full energy and used oversized curved panels compared with the approved mock. | Increased tunnel-grid frequency and energy-driven panel occupancy; the final field reads as a dense modular tunnel while remaining generative. |
| P2 | Fidelity | The initial rest state was too bright and busy. | Reduced rest occupancy, inset the modules, and suppressed body-color accents until energy rises. |
| P2 | Interface | The first control slab was proportionally different from the approved Braun/Swiss source and Stop/Mute lacked a strong physical target. | Rebalanced the Tesla-width columns and added a large rectangular Stop/Mute state block. |
| P2 | Surface | Semi-transparent top and bottom chrome weakened the requested flat, non-glass character. | Replaced it with solid black surfaces. |

## Final checks

- Typography: one strict system monospace stack; hierarchy, tracking, and labels remain legible at the primary viewport.
- Layout: no clipping or overlap at `773 × 601` or `1254 × 784`; the low control slab and compact top rail remain reachable.
- Colors: Pearl, Graphite, Red, Blue, and Silver controls update both the field palette and interface accent. Blue 04 and Red 03 selected states were exercised.
- Controls: Test & Start, Demo/GPS source, Stop/Mute, Body Color, and compact DIAG were exercised. The full-energy threshold is a semantic range control with a large housing and rectangular thumb.
- Diagnostics: compact DIAG opened at `773 × 601` and reported the exact viewport and `WebGL2 · Aperture` renderer.
- Keyboard: ArrowUp reached 120 km/h / energy 100; Space remains the bounded deterministic Brake test event and is not exposed as a permanent button.
- Accessibility: semantic buttons and labels, `aria-pressed` states, focus-visible outlines, reduced-motion handling, and practical Tesla touch targets are present.
- Console: zero errors and zero warnings in the clean final browser session.
- Automated checks: all 13 deterministic tests pass and the production build completes.

## Result

Final result: **passed**.

Vehicle frame pacing and musical acceptance remain separate real-Tesla validation gates; they are not claimed by this desktop design QA.
