# Design QA — Braun launch instrument

Date: 2026-08-28

## Source and implementation

- Source visual truth: `/Users/enuzzo/.codex/generated_images/01a044c0-53f2-7381-98ee-6c32f9049387/exec-d5bcf14e-b56c-4dc1-899d-71e759301312.png`.
- Browser-rendered implementation: `/tmp/sedicivalvole-braun-local-final-773x601.png`.
- Full-view comparison evidence: `/tmp/sedicivalvole-braun-comparison-final.png`.
- CSS viewport and implementation pixels: `773 × 601` at a browser screenshot density of `1`.
- Source pixels: `1423 × 1105`, normalized to `773 × 601` for comparison without cropping.
- State: idle Signal Gate splash, Red theme, `PLAY THE ROAD` enabled.

The normalized source and browser rendering were opened together in one `1546 × 601` side-by-side comparison. The implementation preserves the live generative Signal Gate instead of replacing it with the reference raster.

## Required fidelity review

- **Fonts and typography:** the local monospace stack reproduces the reference's Braun equipment character. The integrated lowercase wordmark, tracked red command, build stamp, credit, and capability note remain legible without wrapping.
- **Spacing and layout rhythm:** at `773 × 601`, the plate starts at `y = 376 px` and ends at `y = 546 px`, matching the normalized source. Its centered width differs by no more than one antialiased edge pixel. The brand rail, technical vent, inset safety field, latch and action field follow the source proportions.
- **Colors and visual tokens:** near-black, warm instrument ivory, vermilion and ice white preserve the selected hierarchy. Red is restricted to the activation marker, safety insert, command, and existing Signal Gate lane.
- **Image quality and asset fidelity:** the Signal Gate remains live WebGL2 with Canvas2D fallback. The selected reference's non-standard vent, textured safety insert, and latch are retained as small source-derived raster assets rather than approximated CSS drawings.
- **Copy and content:** `sedicivalvole`, `PLAY THE ROAD`, `A project by Netmilk Studio`, the build stamp, and the local capability note match the approved content.
- **Focused-region evidence:** the full comparison renders the `390 × 170 px` instrument large enough to inspect its typography, `13 px` outer frame, `48 px` brand rail, `72 px` vent, `83 px` safety module, latch and action alignment.

## Comparison history

| Pass | Severity | Finding | Fix and post-fix evidence |
|---|---|---|---|
| 1 | P2 | The first implementation matched the overall plate size but omitted the reference's technical vent and material texture, weakening the Dieter Rams character. | Added source-derived vent, safety and latch assets; the final side-by-side comparison restores all three details. |
| 1 | P2 | The first plate sat four pixels lower and was two pixels shorter than the normalized source. | Set the Tesla plate to `390 × 170 px` and moved the action stack to a `16 px` bottom inset; final evidence aligns its top and bottom edges with the source. |

## Interaction and runtime checks

- `PLAY THE ROAD` is one semantic button containing the wordmark and action; activation completes the existing launch flow.
- Local `773 × 601` browser QA completed the launch, switched Demo mode, selected Vertigo and JUNCTION, opened DIAG, and exposed the raw report.
- The raw report contained distinct splash, visual, music and diagnostics performance phases, heap fields, decoded-audio fields, and no coordinate keys.
- The DIAG drawer uses an edge shadow with no isolated left border.
- Browser console after the full interaction path: zero warnings and zero errors.
- Unit and production-build gates passed.

## Follow-up polish

- P3: judge the ivory plate's cabin brightness and red-command contrast on the physical Tesla display before changing the approved proportions.

final result: passed
