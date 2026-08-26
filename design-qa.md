# Design QA — Signal Gate splash

Date: 2026-08-26

## Source and implementation

- Source visual truth: `_references/design-directions/2026-08-26/splash-signal-gate-selected.png`.
- Browser-rendered implementation: `_references/design-directions/2026-08-26/splash-signal-gate-implementation-final.jpg`.
- Full-view comparison evidence: `_references/design-directions/2026-08-26/splash-signal-gate-comparison-final.png`.
- CSS viewport: `773 × 601`; browser device-pixel ratio: `2`; the splash canvas caps internal rendering density at `1.25` for bounded Tesla cost.
- Source pixels: `1422 × 1106`; normalized with a centered cover crop to `773 × 601` for comparison.
- Implementation pixels: `773 × 601`; screenshot output matches the CSS viewport.
- Secondary expanded evidence: `_references/design-directions/2026-08-26/splash-signal-gate-expanded-1254x784.jpg` at `1254 × 784` CSS pixels.
- State: idle splash, `VERTIGO 02`, Red theme, `PLAY THE ROAD` enabled.

The source and rendered implementation were opened together in the same side-by-side comparison. The large source headline and smaller source CTA are intentional exceptions: the user explicitly moved `PLAY THE ROAD` into a larger button and requested the centered `A project by Netmilk Studio` credit below it.

## Required fidelity review

- Fonts and typography: the existing local-first monospace stack matches the source character and preserves instant startup. The compact wordmark, tracked status line, centered CTA, credit, and capability note are readable without wrapping.
- Spacing and layout rhythm: the wordmark and environment/version status align to the upper corners; the action stack is centered and clears the Tesla viewport edges with no clipping or overlap.
- Colors and visual tokens: near-black, vermilion, ice blue, and off-white match the approved hierarchy. The CTA remains flat and opaque with the shared `6 px` radius; no glass or decorative gradient was introduced.
- Image quality and asset fidelity: the source's principal artwork is intentionally generative motion, not a static image asset. It is recreated as a crisp WebGL2 field with a Canvas2D fallback rather than a compressed raster; no visible logo, illustration, or icon asset is missing.
- Copy and content: `PLAY THE ROAD` and `A project by Netmilk Studio` match the approved copy. The active Flux environment, build-injected version, and local capability note remain truthful.
- Focused-region comparison was unnecessary because the full `773 × 601` capture keeps every typographic and control detail legible. The CTA was also inspected semantically in the rendered DOM.

## Comparison history

| Pass | Severity | Finding | Fix and post-fix evidence |
|---|---|---|---|
| 1 | P2 | The lower lanes terminated as a vertical comb instead of entering from the side edges and bending into the gate. | Expanded their off-axis origin and removed the flat lower segment; the final comparison shows continuous side-entry curves into the central vertical lanes. |
| 1 | P2 | The wordmark was materially larger than the selected source and weakened the negative space. | Reduced its optical size and preserved its tracked monospace identity; the final comparison restores the source hierarchy. |
| 1 | P2 | The first CTA width was too dominant relative to the selected source, even accounting for the requested enlargement. | Reduced it to `330 px` while retaining a `76 px` touch height; the final capture keeps it clearly primary without becoming a panel. |

## Interaction and runtime checks

- `PLAY THE ROAD` was visible, enabled, and activated successfully; the splash transitioned to the existing Drive Lab in under one second.
- The WebGL2 field animated in the selected in-app browser. Reduced motion renders one stable frame, and Canvas2D remains the non-WebGL fallback.
- Browser console after initial render and launch: zero warnings and zero errors.
- The expanded `1254 × 784` Tesla browser state preserves the same hierarchy, visible status, centered credit, and unclipped CTA with zero console warnings or errors.
- Production build passed; all `18` unit checks and `4` Sites packaging checks passed.

## Follow-up polish

- P3: real-Tesla evaluation may tune glow intensity against cabin brightness without changing the approved geometry or layout.

final result: passed
