# Drive Lab Design QA — Vertigo 02

## Visual truth and implementation

- selected Product Design source: ignored `_references/design-directions/2026-08-26/flux-environment-02-vertical-fold.png` (`1422 × 1106`), normalized to `773 × 601` for comparison;
- executable mechanics source: ignored `_references/repos/tympanus-infinite-lights/` at commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e`, specifically Interstate 7 and `deepDistortion`;
- current implementation: `src/vertigo-field.jsx`, `src/flux-environments.js`, and the environment integration in `src/App.jsx`;
- target viewport: `773 × 601` CSS pixels; browser QA DPR `2`, target Tesla evidence approximately `1.53`;
- implementation capture: ignored `_references/qa/2026-08-26/vertigo-implementation-final.jpg` (`773 × 601`);
- selected-direction comparison: ignored `_references/qa/2026-08-26/vertigo-source-vs-final.png` (`1546 × 601`);
- actual-reference comparison: ignored `_references/qa/2026-08-26/interstate-7-actual-vs-final.png` (`1546 × 601`).

## Required fidelity surfaces

- one continuous band field from flat rest through the floor-to-wall fold;
- subtle time-varying lateral drift and multiple coherent waves;
- strong forward travel and perspective response at full energy;
- continuous geometric release during deceleration, without a scene fade;
- dark ground, central breathing space, restrained bloom, and tunable body-color palette;
- persistent integrated speed module and off-canvas resting chrome;
- reachable diagnostics in the compact Tesla viewport.

## Comparison history

- Initial P2: the resting state retained too much upright wall and did not read as an unrolled field. Lowering the resting horizon and masking the upright portion resolved it.
- Initial P2: full-energy trails were too thin, uniform, and underexposed. Per-lane widths, intensity variation, glow, and near-field perspective thickening resolved the hierarchy.
- User correction: the selected generated image is straighter than the intended source mechanics. The implementation intentionally follows the original Interstate 7 lateral wave and rolling distortion instead of flattening it into a rigid vertical extrusion.
- Accepted difference: the product excludes the source title/navigation, literal road furniture, old scene structure, and heavy bloom. These are not required fidelity surfaces.

## Functional verification

- Aperture → Vertigo → Aperture → Vertigo cycling is deterministic and leaves one canvas mounted;
- Vertigo and the selected Red body-color theme persist after reload;
- the splash identifies `FLUX · VERTIGO` from environment data;
- `DIAG` opens after the wake-first interaction at `773 × 601` and reports `WebGL2 · Vertigo` with `SEND DIAGNOSTIC` reachable;
- no application warnings or errors were observed in the selected browser; Vite development messages only;
- automated tests and the production build must pass again immediately before publication.

## Remaining target-vehicle evidence

- real DPR/frame pacing, thermal stability, and context-loss behavior;
- perceptual travel speed and line weight on the Tesla display;
- touch reach while parked and deceleration behavior from live GPS;
- final audio/visual coherence after the rejected score is replaced.

passed
