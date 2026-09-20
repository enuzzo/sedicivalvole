# Phone companion integration repair — September 20, 2026

## Reproduced failure and scope

The owner's desktop/iPhone trial found local readings and successful ZERO/wake,
but receiver em dashes despite Fresh. A new browser regression reproduces this in
compiled `20260920-1847.e82f181`: real phone sensor owner, both real sessions, AES-GCM,
protocol and the actual local PHP endpoint. Only platform sensor events, permission
and wake are synthetic. With +0.50 m/s² and +12.0 °/s on the phone, the receiver
shows Fresh and 69 ms round trip but no readings. The assertion fails before repair.
The older onboarding fixture bypassed App, and the compiled gesture checks never
tested live numbers. Private owner screenshots remain ignored and unpublished.

## Ownership and corrections

- App deliberately stripped `values` from slow root metadata. A mounted
  `MotionReceiverPanel` now reads `session.snapshot()` independently at 20 Hz,
  scheduling an extra refresh at the conservative 250 ms expiry. Closing the
  drawer cancels that timer; reopening samples the current session. No stale
  values are cached or promoted by rendering. Root motion metadata updates at
  most once per second, except connection/QR transitions.
- `setupEvidence` cleared all checks when `dataFresh` expired. Timed controlled
  gaps reproduce that behavior while sensors, placement, ZERO and wake on the
  sender are unchanged. Pairing-scoped progress now retains the last accepted
  action evidence. Explicit received sensor failure, settling ZERO or released
  wake revises it; terminal cleanup/new QR clears it. Health/readings still
  expire independently. An interrupted required action stays in the wizard.
- The protocol's sample accessor already bypassed root state for road consumers.
  Engine/Flux/Aperture still require their existing fresh sample and GPS gates;
  unaligned/default-off car motion retains GPS response. Missing drawer numbers
  alone were never proof of consumer or network failure. No transport timing,
  250 ms limit, encrypted envelope or receipt rule was relaxed.

The receiver getter performs no root notification and returns current samples,
including null exactly after expiry. Progress is absent from diagnostic summaries;
no pairing keys, vectors or receipts enter reports. Existing any-pose ZERO, pulse,
reduced motion, console PNG and optional TRACE are preserved.

## Noise investigation

The current consumer thresholds are 0.12 m/s² longitudinal acceleration, with a
12 m/s³ transition limit, and 0.6 °/s vertical rotation for Aperture. Raw relative
readings are intentionally sensitive; the [W3C motion model](https://www.w3.org/TR/orientation-event/)
defines units and device axes, not a universal stationary-noise floor.

A 500-sample, ten-second synthetic stationary input runs through the real sensor
owner, reference/protocol and consumers: observed quantized peaks reach 0.08 m/s²
and 0.4 °/s, while both road responses stay zero. Signed 0.18 m/s² and 1 °/s inputs
still produce the expected direction within two 20 ms steps of the acceleration
slew, then expire normally. These are controlled regression measurements, not an
iPhone noise profile. The owner trial has no recorded stationary distribution;
raising thresholds or smoothing the visible telemetry would be unjustified now.
Existing rejection remains; details explain why small readings need not drive effects.

## Repeatable verification

`prototype/drive-lab/scripts/qa-phone-integration.mjs` starts a localhost-only
static server and persistent PHP worker against an isolated temporary pairing
directory. It runs the compiled App and compiled phone with separate browser
contexts. It never replaces App/session/protocol values, never sends mail and
removes its temporary pairing files. `PLAYWRIGHT_MODULE`, `SEDICIVALVOLE_QA_DIST`
and `QA_OUTPUT` select the existing browser runtime, compiled candidate and
external evidence directory. Set `SEDICIVALVOLE_NO_LOCAL_ENV=1` for build/QA.

The default Browser plugin/skill is unavailable in this session; the existing
Playwright/Chrome installation is used. Initial before/after evidence is under
`/private/tmp/sv-phone-integration-before` and `/private/tmp/sv-phone-integration-after`.
The extended regression records sanitized HTTP/protocol timing and React update
counts. It distinguishes all App activity from the root motion metadata: a
two-second observation has 38 focused sample updates and two root motion updates;
the whole App also renders for its other existing owners. This is not a GPU benchmark.
Final regression, visual and canonical results are recorded after their gates.

## Physical retry after publication

1. Reload both devices; confirm the same published build and create a new QR.
   While parked, allow sensors, connect, confirm any stable placement, ZERO and
   explicitly acquire screen wake. Keep aligned car motion off for this first test.
2. Both screens must show fresh numeric acceleration and rotation. Move the phone
   gently: magnitude must change and vertical rotation must change sign. Leave it
   still for ten seconds, then type nearby for ten seconds; note the displayed
   ranges separately. This provides the missing physical noise evidence.
3. Keep both pages visible for one minute; note any Delayed intervals. Close and
   reopen only the receiver drawer: current numbers should return without a QR.
4. STOP, hiding a page or going offline must end the attempt and remove live
   readings. Use a new QR, repeat ZERO/wake, and verify recovery. Wake release
   requires another explicit wake action; a sensor gap requires a new ZERO.
5. Separately, with a fixed screen facing the cabin and aligned ahead, enable car
   motion and ZERO again. Check forward/brake and curve signs with fresh GPS;
   GPS remains speed authority. Cabin response and physical Tesla acceptance are
   still open and cannot be closed by synthetic browser evidence.
