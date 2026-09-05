# Contextual visual controls — 2026-09-05

The owner reported the mixed alignment in the Prtcl, Drivey and Gradient style controls and delegated the choice between left and centered alignment. Both label and value now align left through one explicit `text-align: left` on the existing shared `.visual-cycle-button` rule. No component, vendor runtime, dimension, colour role or control behavior changed.

The previous grid placed its title at the start while the full-width value inherited the browser button text centering. Actual text ranges differed by 16.39 px (Prtcl), 26.75/17.25 px (Drivey) and 28.95 px (Gradient). After the change the measured difference is exactly 0 px for every tested state.

Validation: 634 native checks pass, including actual PHP and Sites 9/9. The rendered browser probe passes 49 checks with no warning/error output. It covers LIGHT/DARK, both Prtcl types, all three Drivey cameras, both rendering modes, all three Gradient variants, actual selection/retraction behavior, the narrow viewport and six-second inactivity. Targets remain 112 × 52 px with the existing 6 px radius. The primary viewport is 773 × 601; narrow verification is 390 × 844.

Browser plugin unavailable; the owner-authorized Playwright/Chrome fallback was used. The initial before probe tried reopening a control before the preceding appearance action finished retracting; waiting for that transition corrected the harness. No product lifecycle changes were needed.

Before/after captures and actual text-range measurements are in `docs/qa/2026-09-05-context-controls/`. Local development build labels reflect the long-running dev server; production identity and live verification are recorded below after publication. Real Tesla reading/GPU acceptance remains separate from browser evidence.
