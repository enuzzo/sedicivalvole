# Smartphone drawer refinement

## Before implementation: accepted design inventory

Reference: [selected combination](../../design/phone-onboarding-2026-09-20/reference/selected-combination.png).
Scope: faithful repair of the selected phone wizard and compact receiver. Owner
visual acceptance is reopened; no new direction is proposed.

- Keep the real Space Grotesk UI, Orbitron wordmark, piston mark, LIGHT/DARK
  semantic surfaces and accent. No gradients, new branding or filler metrics.
- Receiver: compact right-hand panel, shared 24 px content gutter, intrinsic
  height bounded by the viewport, 22 px title, 15 px body, 13 px metadata,
  32 px measured values. Use rules between progress, action, telemetry and status.
- Keep all five numbered/evidence-checked steps. Join them with a quiet rail as
  in the reference; never color future steps as completed.
- QR and generated transparent art occupy the same deliberate media column.
  Preserve original PNG bytes, alpha, aspect and unfiltered palette. A real QR
  needs a white quiet zone. No photographic overlay or decorative history.
- Close, review and details use clear inline vector marks; 48 px secondary and
  56 px primary targets. Disclosure labels align left, carets align right.
- Live rows retain admitted direction/rotation icon geometry, accent presentation,
  right-aligned values and a separate two-column RTT/data region. Status text and
  its hint share a baseline gutter beside the genuine state indicator.
- Phone preserves focused heading, flexible artwork, one action, progress footer,
  and collapsed live view. Small-height artwork gives space to required text.
- Allowed visible copy comes from the current workflow/reference: Connect your
  phone; GPS for speed. Phone for acceleration + rotation.; Sensors / Connect /
  Position / ZERO / Awake; setup actions; Acceleration / Rotation; ROUND TRIP /
  DATA QUALITY / SCREEN; current evidence-derived states; Connection details;
  optional local sensing. Intentional copy amendment: generic phone/page/browser
  replaces iPhone/Safari/iOS assumptions, including denial and recovery.
- No readiness, freshness, transport, sensor or GPS logic changes are planned.

## Observed starting defects

The live integrated preview (1149 x 1101) displayed an 800 px wide full-height
panel with content confined to its upper half. QR was only 160 px, progress was
spread across 752 px, heading/action hierarchy was flat and the local-sensing
button had an additional 24 px inset. Disclosure lacked a visible caret.
The inspection pairing was cancelled; retained QA uses synthetic fixtures only.

## Verified execution

- IAB first: actual published product and revised synthetic drawer. Exact CSS
  geometry used Playwright Chromium because IAB applied 110% phone zoom.
- 32 browser checkpoints, zero page errors; no external network, GPS, audio or mail.
  [Machine evidence](browser-evidence.json) records exact geometry. Curated PNGs here
  replace preliminary captures; the full local matrix remains in ignored output.
- Phone core setup and live views fit 390 x 760 / 320 x 568 in LIGHT and DARK.
  Receiver QR and ordinary live content fit 773 x 601. Recovery action remains visible;
  optional expanded details and delayed-state details may scroll inside the panel.
- Full regression: 1,026/1,027 initially passed, with one Python-environment-sensitive
  publisher test. Python 3.11 rerun plus Sites packaging passed 35/35, closing that
  failure and the nine previously unreached packaging checks: 1,036 unique checks.
- Credits 189/189; public hygiene 1,592 text files at the pre-documentation pass.
- Reference and latest captures inspected via view_image for hierarchy, layout,
  alignment, typography, palette, icon geometry, media and responsive behavior.
  See [fidelity ledger](../../../design-qa.md).
- No sensor/transport/freshness/readiness/GPS logic was changed. Physical smartphone
  support, wake retention, mounted signs and sustained Tesla continuity remain open.
  Owner visual acceptance and first real automatic diagnostic receipt remain open.

Publication evidence follows after committed-source build and official deployment.

## Real App follow-up

The compiled wrapper revealed a defect absent from the isolated visual harness:
shared drawer pointer capture swallowed clicks on the native summary. The same
HTMLElement-only guard missed SVG descendants of buttons. The fix excludes summary
and all Element descendants of controls from drag initiation. Summary joins the
keyboard focus traversal. Remote/local panel replacement resets initial focus while
preserving the original opener for dismissal.

The dedicated `prototype/drive-lab/scripts/qa-phone-drawer.mjs` exercises the real
App with external requests blocked and API failures simulated; it sends no mail,
requests no GPS and does not acquire real sensors or wake lock. Re-run against the
final compiled build before activation. This gate supplements, not replaces, the
32-state visual comparison. The previous 1746 package was not published.

## Final local release gate

Source `eb5eb91`, package `20260920-1757.eb5eb91`: 833 exact static hashes, protected
LAB and Sites package verified. Six real-App rendered checks pass on this compiled
package, including the corrected SVG/disclosure, local mode, Escape and drag paths;
zero page errors. [Compiled evidence](release/compiled-browser.json).
Final docs 8/8, credits 189/189 and public hygiene 1,595 text files pass. The
[read-only publisher preflight](release/preflight.txt) passes identity/directory gates
with remote_writes=NONE. Official preserve-existing publication completed; its
completion and canonical proof are recorded separately below.

## Canonical publication

**20260920-1757.eb5eb91** is published through the official preserve-existing FTP
publisher: 38 files / 6,513,791 bytes, 831 static files and all 29 recordings verified
and reused, two previous assets retained, ROOT_UPLOAD_ONLY. See
[publication record](release/publication.txt). All sixteen
[canonical HTTPS checks](release/canonical.json) pass: bare root, cache-busted root,
controlled reload, exact local/live assets, no-store policy and motion API rejection
boundaries. No diagnostic mail was sent.

At the normal integrated preview size 1149 x 1101, the synthetic receiver panel is
640 x 535 CSS pixels, centered vertically at the right rather than filling the window.
The [public browser](release/public-browser.json) confirms the new build, 640 px drawer,
platform-neutral fresh QR guidance, disclosure open/close, capability-gated local option
and cancellation recovery, with zero observed console warnings/errors.
Owner aesthetic approval, actual smartphone wake retention, mounted signs, sustained
phone/Tesla continuity and first real automatic inbox receipt remain separate and open.
