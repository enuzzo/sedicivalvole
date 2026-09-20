# Mounted iPhone road response

The September 19 owner request explicitly authorizes sensor/audio coupling,
superseding the earlier feasibility and Aperture-only restrictions. This extends
the existing companion, without changing transport, speed authority or musical
semantics. Physical Tesla/iPhone acceptance remains open.

## Mount and calibration

The September 20 owner correction makes **pose ZERO independent of mounting**:
flat, upright, inclined, portrait, landscape and inverted stable poses can complete
companion setup. Confirm placement, tap ZERO and keep still for 500 ms, with the
existing eight-second deadline. Screen wake and reciprocal fresh receipt remain
separate gates. Placement is not a declaration of vehicle-axis alignment.

**Use aligned car motion** is an optional, default-off declaration in connection
and sensor details (also available for local sensing). Enable it only for a fixed
phone whose screen faces the cabin and is aligned straight ahead; portrait and
landscape, upright and inclined mounts are supported. Enabling/disabling it clears
ZERO and requires an explicit new reference. A new ZERO attempt suspends road
input while settling; a failed attempt cannot retain the prior road calibration.
Other orientations still provide relative phone motion, without guessed car axes.

Gravity is accelerationIncludingGravity minus acceleration. At ZERO, orientation's
vertical row disambiguates upward proper acceleration from downward Core Motion
gravity: use the gravity vector's measured direction, choosing its polarity against
that row. The two vertical estimates must agree within 12 degrees for car-axis
calibration. This sign choice is local; no raw axes or orientation enter reports.
Linear acceleration is not negated or biased by this correction.

For explicitly aligned car motion, vehicle forward is the normalized projection
of the negative screen normal onto the horizontal plane:
`f = normalize([0,0,-1] + u.z * u)`. Longitudinal acceleration is its dot product
with current gravity-free device acceleration; yaw is gyro dotted with physical
up. The declared mount accepts either portrait or landscape and vertical screens.
It requires 7–12 m/s² gravity, `u.z >= -0.05`, and a horizontal screen-normal
projection of at least 0.15. Near-flat and face-down screens cannot establish
vehicle forward this way; their ordinary pose ZERO remains valid and GPS owns
vehicle acceleration. Stationary gravity cannot identify arbitrary car heading.

These device axes stay attached to the mounted car through yaw; TRACE keeps its
separate tare-relative frame. No acceleration is integrated into speed or heading.
The former positive-gravity-only and portrait/incline restrictions are superseded
within this calibration contract by the September 20 owner correction.

A gravity-direction change over 12 degrees, angular rate over 80 degrees/second
or acceleration magnitude over 15 m/s² latches the mounted input invalid until
another ZERO. Sensor gaps/incomplete axes, STOP, hide and offline invalidate the
reference. Gravity estimation on slopes and hard motion can conservatively
reject valid driving; physical tuning remains open. Smooth handheld yaw or
translation is fundamentally indistinguishable from car movement using these
inputs alone. Uncheck aligned car motion before lifting the phone. Other mounts and
handheld use keep TRACE, with GPS road response; no universal calibration is
claimed. Gyro supplies a bounded vertical turn rate and helps reject abrupt
handling, never a generic audio pitch control.

The axis/sign convention follows the [W3C motion model](https://www.w3.org/TR/orientation-event/),
including its rear-facing vehicle example. Synthetic math verifies incline,
forward/brake signs, lateral rejection and turns; iPhone/browser conventions
still need a real mounted check.

## Consumers and fallback

| Consumer | Effective inputs |
| --- | --- |
| Speed display, visual/score energy, virtual wheel speed | GPS, or existing Demo; fixed 130 km/h energy ceiling |
| Engine demand/load/coast and load-sensitive shifting | Mounted longitudinal acceleration when both sensor and GPS evidence are fresh; existing GPS derivative otherwise |
| Flux braking, including Soundtrack/NIGHTSHIFT Underwater | Mounted deceleration through the existing regen-relative braking threshold, macro attack/release and effects-enable boundary |
| Aperture curve | Mounted gyro projected on ZERO vertical; existing deadband, strength, opening-speed and reduced-motion behavior |
| TRACE | Existing pose-relative acceleration and rotation, including other stable poses |

Phone data never supplies GPS standstill, real RPM/gear/pedal information, tempo
or recording playback rate. Engine still bypasses every Flux creative effect.
Manual Demo inputs retain ownership and exclude the phone from audio and Aperture.

The optional quantized `road` payload carries longitudinal acceleration and
vertical turn rate, not raw histories. Legacy peers remain compatible but cannot
activate road audio without this payload. The conservative 250 ms local/receiver
age limit is unchanged, including full request round trip plus sample age; clocks
from different devices are never subtracted. Engine retains its GPS trust gates.
Flux retains its GPS derivative fallback and 700 ms derivative staleness.

Per-consumer transitions slew at most 12 m/s³; the sensor deadband is 0.12 m/s²
and admitted longitudinal input is bounded to -10…6 m/s². A new generation,
source loss or reacquisition cannot introduce a step. Lifecycle/execution gaps
clear the transition memory. No stale sensor target is held; a short controlled
release is processing state, not a fresh measurement. Neither the UI nor the
transport freshness deadline is extended to conceal intermittent reception.

## UI and diagnostic evidence

The existing phone cell shows LIVE only for usable mounted input with fresh GPS,
otherwise GPS or DEMO, without growing the navbar. Its accessible name and the
phone/local panel explain the effective source: **Phone motion + GPS speed**,
connecting, awaiting ZERO, unsupported/moved mount, stale or unavailable, or
waiting for fresh GPS speed. Open transport alone never turns this indicator on.
The phone distinguishes local mount calibration from receiver usage.

Coordinate-free `roadMotion` reports the selected response source, status and
consumer names. Engine state records its response source. Motion summaries add
only a mounting boolean and a strict calibration-state enum; vectors, keys,
receipts, pose and raw histories remain excluded. Dev/automatic 15-minute
reporting and explicit saved pauses are unchanged. Synthetic QA blocks delivery.

## Physical acceptance

On the next parked setup: confirm placement, ZERO in the actual pose, acquire screen wake and verify fresh motion on both screens. Separately test optional aligned car motion.
Then check forward acceleration versus braking, curve direction and comfort,
GPS fallback after sensor STOP, hide/offline and reconnection with a new QR/ZERO.
Observe mobile-network continuity without increasing the 250 ms limit. Compare
Engine load/coast and Music Underwater against ordinary lift-off and stronger
braking. Recheck the actual incline and mounting stability. This is experimental
response control, not vehicle telemetry or a safety system.

[Verification evidence](qa/2026-09-19-road-motion/README.md).

## September 20 source and reproduction evidence

The owner reported ZERO stuck on “Adjust the holder” and the receiver jumping
backward. The former wizard required `roadState === calibrated` after a successful
pose tare, conflating relative ZERO with optional car axes. Short data gaps also
reset the receiver guide to Connect. Setup now advances from actual pose tare;
delayed receiver status retains only the pending step index, clears success marks
and telemetry, and displays a wait message. No cached sample becomes fresh.

The [WebKit iOS motion producer](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/ios/WebCoreMotionManager.mm)
passes Core Motion gravity/user acceleration through, while its orientation uses
the W3C rotation convention. The [W3C specification](https://www.w3.org/TR/orientation-event/)
provides the upward proper-acceleration and vehicle-axis example. Original tests
cover both gravity polarities, all stable pose categories, explicit wake acquisition
and actual protocol receipt, without copying third-party implementation code.
This reproduces software failures; it does not prove the owner's exact sensor
values, document reloads or physical iPhone/Tesla continuity.
