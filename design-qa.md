# Guided companion design QA

final result: passed

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
