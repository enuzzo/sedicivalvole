# Passenger remote pairing and iPhone quality — September 23, 2026

## Observed failure and scoped correction

The owner reported that the new receiver drawer and QR could not be scanned on
Tesla. Current public IAB evidence at 773 × 601 reproduced a full-width 773 px
panel, a 710 × 710 px QR starting at y=198 and 1,019 px scroll content. The receiver
component used styles defined only in the lazy phone route. This was an integrated
App failure that the previous broad public-panel check did not measure.

The repair imports dedicated receiver CSS eagerly, bounds the intrinsic panel to
640 px with 16 px viewport gutters, and gives the real QR explicit 240 px dimensions
and a four-module quiet zone. The selected previous sensor onboarding supplies the
shared type, palette, progress rail and glyphs. This refines that approved direction.
Instructions stay beside the QR; connection details remain optional. Phone-width
layout puts the QR above instructions. Errors no longer look like an idle session,
and expiry offers one recovery action. Closing keeps pairing; cancel/disconnect
revokes it. No transport, audio or sensor consumer contract changes.

## Local evidence

- IAB through Computer Use, exact 773 × 601 and 390 × 844 viewports. Direct Playwright
  fallback was not used. Temporary captures and fixture tooling live outside Git.
- Actual App and compiled package: 640 × 516.6 px receiver, 240 × 240 px QR fully
  inside the viewport, equal scroll/client heights (515 px), 48 px close/cancel
  targets. Narrow 390 × 844 panel is 374 × 700.9 px with the same complete QR.
- Current old-onboarding reference and new dark/light captures compared at 773 × 601.
  Intentional departures: three command steps instead of five sensor steps, larger
  QR for scanning, no sensor placement/ZERO instructions or telemetry rows.
- ZBar decodes the complete URL from the rendered 773 × 601 screenshot, independently
  of the QR encoder. Real local PHP pairing with the compiled phone route succeeds;
  a remote Visual command changes Drivey to Aperture and the phone receives the
  applied state. Details mouse/keyboard, Escape and reopen retain pairing.
- State fixtures cover connected, reconnecting and expired presentations; expiry
  recovery creates a QR and cancel returns to disconnected. Four focused tests cover
  exact QR modules/quiet zone, encoding failure, readiness and recovery semantics.
- Full native aggregate: 1,083 passing tests (including 950 unit and 9 Sites cases).
  Candidate production build passes App/LAB/Sites packaging and 835 exact static
  hashes. Community credits: 189 exact entries. Compiled App console: no warnings
  or errors in the inspected session. Local catalogue is disabled in credential-free
  QA; pairing uses the existing localhost-only PHP test wrapper. No diagnostic mail.
- Public hygiene has only six pre-existing personal-path findings in the unrelated
  dirty historical recovery note; the repair introduces none. That note, root
  AGENTS.md and tools/jev-recovery-lab remain untouched.

## iPhone quality pass

The owner's follow-up retains the selected compact home and adds the piston
identity and Orbitron wordmark above a truthful connection row. First use presents
three concise steps, existing scan/connect artwork and expandable connection help.
The guide replaces disconnected placeholder controls and can be reopened while
paired. Terminal failures explain the new-QR recovery path.

Shared semantic tokens support light/dark appearance and acknowledged palette
changes. Controls have at least 44 px touch targets; page controls are 48 px.
Modal pages isolate background content, trap and restore focus and close with
Escape. Slider gestures are excluded from horizontal page dismissal.

The full native aggregate also passed after the phone changes: 1,083 tests, zero
failures. Browser QA at 390 × 844 shows the entire connected home without scroll
or horizontal overflow. At 320 × 568 the guide scrolls to its final step, help and
footer without horizontal clipping. Real local PHP pairing verifies a Flanger
drag to 70 percent while the page remains open, acknowledged Blue palette, HELP
and return, keyboard focus wrap/restore, saved pairing after reload and Forget
returning to first use. The HELP target was widened to the same 44 px minimum.
Light/dark onboarding and the light connected home were visually inspected.

## Delivery

Receiver source `744c3ec` was committed and pushed. Its candidate build
`20260923-1812.744c3ec` passed local checks. Official read-only preflight passed,
but the subsequent publication timed out in read-only identity verification,
before any remote writes. The combined phone/receiver release supersedes that
unpublished candidate; its final publication evidence is recorded below.

Combined source `675b2c9` is committed and pushed. Build
`20260923-1933.675b2c9` passes App/LAB/Sites packaging, 835 exact hashes and 189
credits. Its compiled 773 × 601 receiver retains the measured 640 × 516.6 px
panel and 240 px QR, decoded from the screenshot; actual pairing and a Drivey to
Aperture command succeed. The compiled phone confirms the corrected 44 × 44 px
HELP target and the final dark onboarding. Official read-only preflight passes
with 13 root entries and no remote writes.

Official preserve-existing publication succeeds: 39 files / 6,496,638 bytes
uploaded, 832 static files and 29 recordings verified/reused, two previous root
assets retained for cache overlap, 13 root entries, no legacy deletion. The
dynamic root was activated only after full verification.

Fifteen canonical HTTPS checks pass for the bare root, cache-busted root,
controlled no-cache reload, entry assets, phone JS/CSS, release manifest and cache
worker. HTML is 1,445 bytes at SHA-256
`81aa935a8ffd7f7f3310cda31a6a42b1a78fc2e2907075d9ed5b48a9965a2641`, identical
to the local build with no-store/no-cache. The public browser transitions from
`20260923-1534.05ad287` to `20260923-1933.675b2c9` on reload.

Public IAB at exact 773 × 601 confirms the same 640 × 516.6 px panel, complete
240 px QR and equal 515 px client/scroll height. Software decoding opens the actual
public phone link; the receiver becomes Phone connected. At 390 × 844 the phone
home has no overflow and no button below 44 × 44 px. A Flanger command receives
applied-state confirmation, and reload retains the pairing and effect. Forget
revokes the pair; the receiver returns to its new-QR recovery state. Both inspected
public consoles have zero warnings/errors. Reports stayed OFF; no synthetic mail.
Official read-only postflight also passes with 13 root entries and
`remote_writes=NONE`.

## Acceptance limits

Browser screenshots and software QR decoding establish geometry and payload, not
physical camera acquisition from the Tesla display. Physical Tesla/iPhone scanning,
touch, background suspension, weak-network recovery and road use remain to verify.
Canonical publication is verified above; it does not close physical acceptance.

## Live appearance synchronization follow-up

The owner requested matching light/dark and themes throughout the paired session.
The previous release already synchronized palette changes, but appearance stayed
at the value captured by the QR. The receiver now includes its resolved light/dark
appearance in each existing state heartbeat; both protocol boundaries accept only
those two values. Auto uses the display's resolved result. Older peers that omit
appearance retain the QR fallback. Initial phone state also starts with the QR's
palette, avoiding the default-red flash while awaiting the first state packet.

Fifty-three focused regression checks pass for commands, pairing, receiver UI,
appearance resolution/runtime, semantic colours, all ten themes and phone layout.
New protocol tests cover every palette in both appearances, unsolicited display
changes, older state packets and rejected arbitrary/unresolved appearances.
Local paired IAB confirms Dark to Light and back without rescanning, Blue to Neon
applied on both peers, Auto agreement and current-state recovery after reload.
Phone console has no warnings/errors. An initially stale Vite module was detected
and the local server restarted before the successful browser evidence.
