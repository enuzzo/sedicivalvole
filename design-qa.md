# Compact Round Instruments design QA — 2026-09-07

- Source visual truth: `/Users/enuzzo/.codex/generated_images/01a07aa2-df2e-7de0-8f88-418daa91baa4/exec-18024c95-7324-4f68-b7d3-09fba9465291.png`.
- Implementation: `docs/qa/2026-09-07-round-launch/final-jazz-aperture.png`.
- Viewport: 773 × 601 CSS px, DPR 1. Source generated 1422 × 1106 normalized proportionally into 773 × 601; implementation 773 × 601 pixels.
- State: Music / Soundtrack / precise Jazz / Aperture. Local catalogue intentionally unavailable for the final capture; START correctly says music joins when ready.
- Full-view comparison: `/tmp/sv-round-qa/comparison.png`, source and implementation side by side; reviewed at original size. It also includes all eight actual effect previews.
- Focused evidence: the middle selection region and all typography are legible at the native full-view scale; a separate crop is unnecessary.
- Browser plugin not available; use the established headless regular Chrome/Playwright path, without controlling user windows.

## Findings and comparison history

1. Fixed: source captures initially retained the speed button background. Recaptured all effects with the complete host speed control hidden; no renderer source edited.
2. Fixed: slow external cover left a blank circle. The local generated music image now remains underneath the requested image during loading and after failure.
3. Accepted constraint: generated mock depicts smaller action targets than permitted. Implementation retains 48 px actions and original 56 px START; columns are 137 px tall rather than expanding the sheet.
4. Accepted asset choices: generic amber music illustration replaces invented artist art until exact queue cover is ready; actual existing preset images supply small colour markers. Pinned Tabler engine glyph replaces the mock's gear symbol.

## Required fidelity surfaces

- Typography: existing Orbitron brand and Space Grotesk content; 13 px high-contrast metadata, 17 px actions, 24 px selection names. Long names wrap inside their column. No clipped labels.
- Spacing: equal columns, common dividers, 64 × 64 px circles, 6 px control radius, original panel/chrome rhythm. 48/56 px hit targets verified.
- Colour: native LIGHT/DARK tokens; amber Music and active-accent Engine; no new full-surface gradient.
- Images: eight real effect screenshots, proportionally exported to 192 × 149 px; circular cover crop is intentional. No simulated renderer assets or modified third-party runtime. Genuine score/preset/Illobo identities preserved.
- Copy: source/mode names and precise selectors remain; Feeling lucky and Change act immediately, while Choose opens the respective catalogue.

## Verification

655 native tests pass. Sixteen browser interaction checks cover exact genres/pace/Lobo, fresh visit defaults, nonrepeating random visual selection, eight catalogue entries/three Gradient variants, focus/Escape, muted and delayed startup, presets, Engine, one AudioContext and silent prelaunch. Geometry/hit tests cover 773 × 601, 390 × 844 and 1280 × 800. Zero page exceptions, unexpected resource failures or diagnostic sends. Existing browser pre-gesture AudioContext warnings remain documented.

Physical Tesla touch/readability, GPU and listening acceptance are not repeated by desktop QA. Previews are static images, not animation.

Canonical follow-up: build 20260907-1400/source 7ab630b verified at https://sedicivalvole.app/. `docs/qa/2026-09-07-round-launch/08-canonical-music.png` shows actual ready Jazz cover and Aperture, 773 × 601. Twenty-two byte/cache checks and real Jazz/Lobo/Engine startup pass; zero page exceptions or diagnostic sends, six inherited pre-gesture audio warnings. Exact production candidate also passes the same 16 UI scenarios and 17 packaging checks.

final result: passed

## Owner-reported tall-window correction — 2026-09-07

The supplied Mac screenshot showed viewport-filling empty selection panels.
Fixed the absolute sheet constraints and nested elastic rows: content now owns
height and the footer follows the sheet. Preset thumbnails are 36 px (was 16).
Actual matching Play the Road / Fracture / Drivey captures are in
`docs/qa/2026-09-07-launch-sizing/1280x1200.png` and `773x601.png`.
Reviewed both: existing fonts, colour tokens, content and main 64 px imagery
are preserved; oversized vertical spacing is removed and preset art is legible.
Sheet height is 502 px and choices 138 px at both 1280 × 800 and 1280 × 1200.
Tesla 773 × 601 has the same geometry. Phone 390 × 844 fits; a 773 × 420 window
scrolls the complete flow to reach the footer. No overlapping footer or clipped
controls. Seventeen interaction scenarios, 655 native tests and 196 credits pass.
Browser plugin absent; established headless Chrome fallback. Physical Tesla
acceptance remains separate. No new visual direction or asset generation.

final result: passed

The sizing correction is now canonically verified at build 20260907-1520/source
05bcf45. Live five-viewport evidence matches the measured local/production
geometry exactly, with zero page exceptions and 22 successful byte/cache checks.
See docs/qa/2026-09-07-launch-sizing/live-evidence.json.

## Centered-sheet owner follow-up — 2026-09-07

The owner requested viewport centering and independent edge credits. Current
evidence: docs/qa/2026-09-07-centered-launch/1280x1200.png, 773x601.png,
390x844.png and 773x420.png. Reviewed all dimensions: exact vertical centering,
unchanged type/colour/64 px images/36 px presets, fixed viewport-bottom footer,
and independently centered safety caption. Short viewport fix uses 100dvh for
the splash and internal sheet scrolling instead of the running shell's 480 px
minimum height. START remains reachable. Five geometry cases, 17 interaction
scenarios and 655 native tests pass; no page exceptions. Browser plugin absent,
established headless Chrome fallback. Physical Tesla acceptance remains separate.

final result: passed

Canonical verification: build **20260907-1534**, source **e092752**. All five live viewport cases and 22 byte/cache checks pass; official independent postflight reports `remote_writes=NONE`. Fresh live screenshots and evidence are recorded in `docs/qa/2026-09-07-centered-launch/`. Physical Tesla acceptance remains separate.


## Support-header owner refinement — 2026-09-07

Production candidate 20260907-1557/source 7ea0712, implementation ec0f459.
Four viewports (773 × 601, 1280 × 1200, 390 × 844, 773 × 420) preserve exact
sheet centering, fixed bottom-left credits and 48 px About/coffee actions.
Drive responsibly is below the wordmark; light/dark marks have no square fill.
The same yellow trigger exists in diagnostics. Both entry paths open a centered
bounded dialog; Escape/Close restore focus and the underlying report is inert.
Local, production Light and explicitly selected production Dark checks pass,
with zero page exceptions. All 17 launch interaction scenarios, 655 native
checks, 17 package checks and 196 credits pass. Existing pre-gesture AudioContext
warnings remain in the broader launch suite. Browser plugin unavailable;
headless Chrome/Playwright fallback does not touch the owner's mouse/browser.
Evidence and fresh screenshots: /tmp/sv-support-qa/, /tmp/sv-support-production/,
/tmp/sv-support-dark/. Physical Tesla acceptance remains separate.

Canonical 20260907-1557 live validation passes: four viewport cases and diagnostic
support/focus, 24 byte/cache checks, independent postflight `remote_writes=NONE`.
Fresh evidence: `/tmp/sv-support-live/`. Result: passed; physical Tesla remains separate.
