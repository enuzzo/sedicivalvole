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

## Delivery progress

Receiver source `744c3ec` was committed and pushed. Its candidate build
`20260923-1812.744c3ec` passed local checks. Official read-only preflight passed,
but the subsequent publication timed out in read-only identity verification,
before any remote writes. The combined phone/receiver release supersedes that
unpublished candidate; its final publication evidence is recorded below.

## Acceptance limits

Browser screenshots and software QR decoding establish geometry and payload, not
physical camera acquisition from the Tesla display. Physical Tesla/iPhone scanning,
touch, background suspension, weak-network recovery and road use remain to verify.
Canonical publication and exact release identity are recorded below after delivery.
