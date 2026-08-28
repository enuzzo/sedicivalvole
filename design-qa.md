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
