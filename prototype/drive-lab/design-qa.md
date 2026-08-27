# Drive Lab Design QA — fixed road ceiling and refined Vertigo

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
- Colors and tokens: all five body-color themes remain parameter inputs; the Red QA state preserves the accepted black/red/off-white hierarchy.
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
