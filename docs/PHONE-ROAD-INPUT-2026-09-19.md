# Mounted iPhone road response

The September 19 owner request explicitly authorizes sensor/audio coupling,
superseding the earlier feasibility and Aperture-only restrictions. This extends
the existing companion, without changing transport, speed authority or musical
semantics. Physical Tesla/iPhone acceptance remains open.

## Mount and calibration

Select **Portrait in car holder** on the phone (or local-sensor panel). Mount the
phone top-up, screen toward the cabin, aligned straight ahead. Park and tap ZERO;
the existing 500 ms continuous settling window and eight-second deadline apply.
The selection is session-local, defaults off and changing it invalidates ZERO. A new ZERO attempt suspends mounted road input while settling; a failed attempt cannot retain the prior road calibration.

Gravity is accelerationIncludingGravity minus acceleration. At ZERO its unit
vector `u` defines vertical in device coordinates. Vehicle forward is the
normalized projection of the negative screen normal onto the horizontal plane:
`f = normalize([0,0,-1] + u.z * u)`. Longitudinal acceleration is the dot product
of current gravity-free device acceleration with `f`. Positive means forward
acceleration, negative means braking. These device axes remain attached to the
mounted car through yaw; TRACE still uses its separate tare-relative frame.
There is no acceleration integration into speed, position or heading.

The declared mount requires `abs(u.x) <= 0.2`, `u.y >= 0.25`, `u.z >= 0.15` and
7–12 m/s² gravity magnitude. These are conservative eligibility bounds, not an
assumed holder angle or a claim of physical accuracy. Flat, inverted, landscape
and nearly vertical poses cannot activate this road calibration. The owner’s
30–40 degree estimate has no specified reference plane and is not hard-coded.

A gravity-direction change over 12 degrees, angular rate over 80 degrees/second
or acceleration magnitude over 15 m/s² latches the mounted input invalid until
another ZERO. Sensor gaps/incomplete axes, STOP, hide and offline invalidate the
reference. Gravity estimation on slopes and hard motion can conservatively
reject valid driving; physical tuning remains open. Smooth handheld yaw or
translation is fundamentally indistinguishable from car movement using these
inputs alone. Uncheck the holder before lifting the phone. Other mounts and
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
phone/local panel explain the effective source: **iPhone motion + GPS speed**,
connecting, awaiting ZERO, unsupported/moved mount, stale or unavailable, or
waiting for fresh GPS speed. Open transport alone never turns this indicator on.
The phone distinguishes local mount calibration from receiver usage.

Coordinate-free `roadMotion` reports the selected response source, status and
consumer names. Engine state records its response source. Motion summaries add
only a mounting boolean and a strict calibration-state enum; vectors, keys,
receipts, pose and raw histories remain excluded. Dev/automatic 15-minute
reporting and explicit saved pauses are unchanged. Synthetic QA blocks delivery.

## Physical acceptance

On the next parked setup: select the mount, ZERO and verify LIVE on the display.
Then check forward acceleration versus braking, curve direction and comfort,
GPS fallback after sensor STOP, hide/offline and reconnection with a new QR/ZERO.
Observe mobile-network continuity without increasing the 250 ms limit. Compare
Engine load/coast and Music Underwater against ordinary lift-off and stronger
braking. Recheck the actual incline and mounting stability. This is experimental
response control, not vehicle telemetry or a safety system.

[Verification evidence](qa/2026-09-19-road-motion/README.md).
