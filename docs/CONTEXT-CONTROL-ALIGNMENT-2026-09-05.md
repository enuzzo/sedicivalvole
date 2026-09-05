# Contextual visual controls — 2026-09-05

The owner reported the mixed alignment in the Prtcl, Drivey and Gradient style controls and delegated the choice between left and centered alignment. Both label and value now align left through one explicit `text-align: left` on the existing shared `.visual-cycle-button` rule. No component, vendor runtime, dimension, colour role or control behavior changed.

The previous grid placed its title at the start while the full-width value inherited the browser button text centering. Actual text ranges differed by 16.39 px (Prtcl), 26.75/17.25 px (Drivey) and 28.95 px (Gradient). After the change the measured difference is exactly 0 px for every tested state.

Validation: 634 native checks pass, including actual PHP and Sites 9/9. The rendered browser probe passes 49 checks with no warning/error output. It covers LIGHT/DARK, both Prtcl types, all three Drivey cameras, both rendering modes, all three Gradient variants, actual selection/retraction behavior, the narrow viewport and six-second inactivity. Targets remain 112 × 52 px with the existing 6 px radius. The primary viewport is 773 × 601; narrow verification is 390 × 844.

Browser plugin unavailable; the owner-authorized Playwright/Chrome fallback was used. The initial before probe tried reopening a control before the preceding appearance action finished retracting; waiting for that transition corrected the harness. No product lifecycle changes were needed.

Before/after captures and actual text-range measurements are in `docs/qa/2026-09-05-context-controls/`. Local development build labels reflect the long-running dev server; production identity and live verification are recorded below after publication. Real Tesla reading/GPU acceptance remains separate from browser evidence.

## Production verification

Source **6e2abff**, build **20260905-0225**, VERSION **0.0.0**. The exact ARM64 production package repeats all 49 browser checks successfully, with 0 px text-edge difference in every measured state and no warnings/errors. Ten post-build identity/Sites checks pass. Main JS size remains 755,168 bytes; the product change is one CSS declaration, with no new runtime work. The existing Vite large-chunk advisory remains.

## 2026-09-05 02:32 — Contextual alignment verified live

Canonical build **20260905-0225**, source **6e2abff**, VERSION **0.0.0** aligns the functional label and current value left in Prtcl, Drivey and Gradient using one shared CSS declaration. All tested text edges now differ by exactly **0 px**; the controls remain **112 × 52 px** with **6 px** corners. No upstream code or interaction implementation changed.

Validation: **634 native checks** including actual PHP and Sites 9/9; **10 post-build checks**; clean ARM64 build; **49 local, 49 production and 49 live browser checks**, each with no warnings/errors. The browser flow covers all two Prtcl types, three Drivey views, two Drivey render modes and three Gradient variants in LIGHT/DARK, successful cycles, immediate retraction, 390 × 844 narrow geometry and six-second inactivity. Main evidence viewport is **773 × 601**. Real Tesla visual acceptance remains separate.

Publication verified **186 files / 216,249,076 bytes**, all **29 Illobo tracks** by full hash, preflight, independent read-only postflight and **17 canonical HTTP/asset/cache checks**. Two prior assets remain for cache overlap. Main JS remains 755,168 bytes; the only runtime-source change adds one CSS declaration. Existing Vite large-chunk advisory remains. Evidence: `docs/qa/2026-09-05-context-controls/` and `docs/CONTEXT-CONTROL-ALIGNMENT-2026-09-05.md`.
