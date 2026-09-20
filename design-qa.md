# Guided companion design QA

final result: execution repair verified; owner visual acceptance remains open

The owner rejected the published drawer composition on September 20: flat/empty
visual hierarchy and inconsistent alignment, especially Connection details. The
prior comparison below is historical evidence, not owner aesthetic acceptance.
See [revision handoff](docs/PHONE-DESIGN-REVIEW-HANDOFF-2026-09-20.md).

## Target and evidence

- Selected target: `docs/design/phone-onboarding-2026-09-20/reference/selected-combination.png` (1568 x 1003 board, three differently scaled content views; no real device chrome).
- Actual browser captures: `docs/qa/2026-09-20-phone-onboarding/phone-awake-390.png`, `phone-live-390.png`, `phone-live-320.png`, `receiver-live.png`, `receiver-delayed.png`, `phone-wake-denied-320.png`, `phone-awake-dark.png`, `phone-ended.png`.
- Browser: Codex integrated Chromium. CSS/capture pixels 390 x 760, 320 x 568 and 773 x 601 at 1:1. Compare the corresponding phone setup/live and receiver live regions of the source board, excluding its frame and captions. The generated receiver panel aspect ratio differs from the product; the established compact viewport controls implementation geometry.
- Source and the three primary implementation captures were opened together in one comparison tool input. Full-view text, controls and illustration are legible at these sizes, so separate focused crops were unnecessary. A premature capture immediately after a viewport resize was discarded and replaced after DOM geometry settled.
- Screens use development-only synthetic samples. They are UI evidence, not sensor, wake-lock or physical network acceptance.

## Comparison history and fixes

1. P2: completed-step disclosure wrapped at 320 px and pushed the last control below the viewport. Fixed the disclosure typography and nowrap labels; reduced short-height title spacing. Fresh geometry: main clientHeight=scrollHeight=568, scrollWidth=320. All primary controls remain visible.
2. P2: temporary navigation/appearance icons did not communicate the intended measured axes. Replaced with the admitted original Tabler arrow-up-right and rotate-clockwise icons; final live captures show them.
3. Rechecked phone 390 x 760: clientHeight=scrollHeight=760 and clientWidth=scrollWidth=390. Final wake action remains 56 px; recovery and disclosure targets remain 48 px.

## Required fidelity surfaces

- Typography: actual Space Grotesk/Orbitron assets, semantic sizes and accessible control targets take precedence over raster-generated letterforms. Correct headings, wrapping and hierarchy; no clipped copy in checked portrait states.
- Spacing: focused phone step, illustration/action/status order, numbered circles and the selected compact two-row receiver hierarchy are retained. The completed guide collapses. Compact-height art shrinks before controls.
- Colors: existing LIGHT/DARK semantic colors control surfaces, type, accent and state; intentional contrast-corrected reds differ from the generated mock. No new palette system.
- Images: original piston identity and four generated genuine RGBA PNGs; real alpha verified separately. Objects have subtle generated tonal shading, but no artificial transparency pattern. The decorative mock sparklines are omitted rather than fabricating history. TRACE remains optional after setup.
- Copy: exact device-specific instructions, receiver request/reply latency, measured forward acceleration and yaw rotation, explicit stale/ended/denied states. The phone shows actual wake state instead of inventing receiver RTT. These necessary truth corrections are documented in the selected brief.

## Interactions and limits

Verified the five button sequence, evidence-driven checkmarks, automatic collapse, receiver delayed-data blanking and restart CTA, denied wake staying incomplete, STOP returning to new-QR guidance, light/dark layout, and zero browser console warnings/errors in the final fixture pass. Unit tests cover unsupported/released wake, missing placement, invalid calibration, missing receipts and deferred wake acquisition. Existing sensor, relay and lifecycle suites remain the protocol evidence.

No actionable P0/P1/P2 findings remain for the selected UI. Larger accessibility text or unusually short browser heights may scroll rather than hide controls. A real Safari wake-lock acquisition/release and iPhone/Tesla end-to-end drive remain open physical checks.

## Follow-up polish

P3: generated illustrations retain slight material shading and the static UI does not reproduce decorative traces from the mock. Neither affects measurement truth or the primary onboarding action.

## Canonical delivery

Published and verified as `20260920-1716.24c955b`; sixteen HTTPS identity/hash/cache/API
checks pass. Public browser verification is recorded separately from the synthetic
layout captures and the still-open physical iPhone/Tesla acceptance. See
[release evidence](docs/qa/2026-09-20-phone-onboarding/README.md).

## September 20 execution repair — current comparison

The current [revision evidence](docs/qa/2026-09-20-phone-design-review/README.md)
supersedes the historical agent sign-off above. Frontend App Builder was explicitly
used. Reference and final captures were inspected together using `view_image`.
The 1568 x 1003 source is a composition board, not one product viewport; comparison
uses its corresponding phone/setup/live and receiver regions. Exact product sizes
are 773 x 601, 390 x 760 and 320 x 568, in both appearances.

| Comparison | Reference / starting mismatch | Current render / repair |
| --- | --- | --- |
| Container and density | Compact receiver; published full-height 800 px sheet left a large void | Intrinsic panel, maximum 640 px, bounded to viewport; QR and ordinary LIVE fit Tesla |
| Shared alignment | Common left gutter; local sensor button added another 24 px | Heading, intro, instructions and details share measured x=142; local option uses the same gutter inside details |
| Progress and icons | Linked numbered/checkmarked sequence, check/close/carets | Quiet connecting rail, real vector checks/carets and admitted telemetry shapes; no false completion |
| Type and hierarchy | Strong heading, section label, two clear measured rows | Space Grotesk 22 px drawer title / 32 px readings, 13 px labels; reference LIVE FROM YOUR PHONE restored |
| Color and surfaces | Reference red semantic emphasis with plain surface | Existing LIGHT/DARK tokens; accent masks preserve pinned icon bytes; no new gradients or palette |
| Media | Focused phone art and legible pairing | Original RGBA assets unchanged; 184 px QR quiet zone; recovery reuses appropriate awake art |
| Phone geometry | Focused step/action and collapsed data | Complete core setup and LIVE fit exact 390 x 760 and 320 x 568; detail controls remain reachable |
| Recovery | Reference omits some failure variants | Truthful wake denial/release and delayed blank values retained; restart visible, optional details may scroll |

Above-the-fold copy diff: platform-neutral phone/page/browser wording is an explicit
owner amendment. Setup completed becomes reference wording Setup complete; LIVE FROM
YOUR PHONE is restored from the accepted reference. Scan to connect replaces the
platform-specific heading; sensor/wake errors describe observed failure and recovery.
No invented badges, metrics, histories or filler copy. The legacy local-sensing copy
and road source label were included in the wording sweep.

Intentional departures remain: the established type/color system overrides generated
letterforms and bright mock red; phone shows actual wake state instead of invented RTT;
no decorative sparklines. Optional details are additional truthful controls. In delayed
receiver state the restart action stays visible and details scroll below it. The board's
outer phone frame/captions are not product chrome.

IAB was used first for actual product and synthetic UI review. Its phone viewport
returned 354 x 691 CSS for a requested 390 x 760 (zoom 1.1); those preliminary phone
captures were replaced. Playwright Chromium at deviceScaleFactor 1 provides exact
viewport evidence, 32 checkpoints and zero page errors. It verifies all five actions,
collapse/review, denial, STOP, fresh-QR restart and stale reading/RTT blanking.

Agency review question: the current implementation faithfully reproduces the accepted
arrangement subject to the documented system/truth constraints; no material fixable
visual mismatch remains in the tested core surfaces. This is an agent fidelity
assessment, explicitly not the owner's aesthetic approval or physical acceptance.

### Compiled-wrapper correction

Actual App QA caught the gesture surface intercepting Connection details, unlike the
isolated fixture. Fixed native summary/SVG target exclusion and refocused remote/local
panel swaps. The final release gate includes a dedicated rendered regression covering
real disclosure, local mode, keyboard Escape, close-icon and non-control drag paths.
