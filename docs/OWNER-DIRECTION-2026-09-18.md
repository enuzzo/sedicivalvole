# Owner direction and remaining milestones — September 18, 2026

This records the owner's follow-up after quality release `20260918-2110.dbf5108`.
It changes the next-work direction, not the currently published implementation.
Source: direct owner message; technical proposals below are labelled separately.

## Later owner supersession — Conditions deferred

The owner subsequently asked to skip Conditions for now because it overlaps
with weather already used in the Tesla. **N02 / FI-006 is deferred**: do not
start weather research, provider setup or UI design. N01 Drivey simplification
is now implemented and published as **20260918-2212.721274c**; iPhone motion and the companion remain research
candidates. This supersedes the earlier Conditions enthusiasm below.

## Continuation authorization

The owner subsequently requested autonomous progress through the remaining work
and sequential fresh local tasks once a context is crowded, always closing and
documenting the current unit before transfer. N03/N04 feasibility is now the
next authorized execution unit; Conditions remains deferred. Follow the
[concrete motion handoff](MOTION-INPUT-HANDOFF-2026-09-18.md), including delivery,
single-writer transfer and explicit boundaries for physical/design decisions.

## Consolidated decisions

- **Drivey:** retire the proposed speed-dependent Aerial camera (`FI-002` / D4).
  The owner prefers natural forward road following and finds the alternative
  rear/aerial views little used. Remove alternative camera selection
  from the product, retaining forward driving, Normal/Wireframe and both palette
  channels. Preserve the currently familiar forward view (internal default
  `hood`); do not substitute upstream's dashboard `driver` view by assumption.
  Saved rear/aerial choices migrate to that forward view while render mode is retained.
  Remove obsolete project-owned selectors/state/tests where appropriate, but
  preserve all 51 pinned upstream files and their integrity tests. The expected
  benefit is simpler interaction and adapter maintenance; download savings have
  not been measured. Publication **20260918-2212.721274c** is verified; see the
  [health checkpoint](HEALTH-CHECK-2026-09-18.md#drivey-forward-only-continuation--september-18).
- **Conditions (`FI-006`):** the owner supports this next feature direction.
  Prepare the exception-led Atlas/Discover experience, provider/source review,
  coarse-location privacy and three concrete UI compositions before selecting
  and implementing a new surface. No weather provider or transmission is newly
  configured by this planning checkpoint.
- **iPhone motion (`FI-001`):** the owner expresses interest in advancing sensor
  input. Start with feasibility/calibration and preserve honest GPS-versus-motion
  semantics. This is not proof of device support or an inertial speedometer.
- **iPhone → Tesla motion companion (`FI-013`, new owner idea):** investigate
  pairing the phone's sensor stream with the Tesla browser for more responsive
  movement feedback. Treat improved response/precision as a hypothesis requiring
  end-to-end measurement, not an established advantage over GPS.

## Motion companion: feasibility, not a delivery promise

Primary references checked September 18:
[W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/),
[WebRTC peer connections](https://webrtc.org/getting-started/peer-connections),
[WebRTC data channels](https://webrtc.org/getting-started/data-channels), and
[permission request semantics](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static).

Motion events distinguish acceleration and rotation rate. The gyroscope alone
is not a longitudinal acceleration measurement. Motion access requires supported
browser APIs, HTTPS and an explicit user action where permission is required.
The target iPhone's cadence, orientation handling and background behavior need
real measurement.

WebRTC data channels can carry sensor messages between peers. A signaling
service exchanges connection setup; STUN/TURN support connectivity, with TURN
relaying traffic when a direct path is unavailable. A server need not process
every sample on a successful direct path. Tesla `RTCPeerConnection`/data-channel
support and actual mobile-network connectivity are unverified. No claim is made
that the existing host provides signaling, WebSocket or TURN services.

Recommended staged study, not a selected UI or infrastructure deployment:

1. Measure local phone permission, sample cadence, stationary noise, calibration,
   mounting/rotation changes and screen/background interruptions.
2. Test a paired connection on the exact Tesla/browser version. Compare direct
   data-channel delivery with a relay only if needed and explicitly provisioned.
3. Measure sample age, jitter, loss and motion-to-render latency against GPS;
   keep only fresh bounded values and reject stale/out-of-order input.
4. Propose explicit pairing/unpairing, expiring sessions, visible source/quality
   and loss-of-phone recovery. GPS remains the speed reference; supplemental
   motion fades out when stale, without a silent switch of the primary source.
   Do not persist or include raw sensor streams in diagnostic emails.

The sensor work does not authorize accounts, a public relay, paid services,
background tracking or changes to the current automatic diagnostic boundary.

## Work that genuinely remains

| Unit | Status and next evidence |
| --- | --- |
| N01 — Drivey simplification | COMPLETE, published/verified **20260918-2212.721274c**: fixed forward view, one Normal/Wire control, palettes and saved render mode retained; all 51 upstream hashes pass. Physical acceptance remains separate. |
| N02 — Conditions | DEFERRED by subsequent owner instruction: avoid overlap with Tesla weather. No work scheduled. |
| N03 — iPhone motion | Feasibility/calibration research; local browser simulation cannot close real sensor acceptance. |
| N04 — Phone-to-Tesla companion | New owner research idea; depends on N03 and target-browser/network measurements. |
| R06 — Formal security scan | Still incomplete. Recover the historical missing evidence or obtain a deliberate replacement decision; no duplicate scan is implicitly authorized. |
| S04 / P05 / rows 5, 7, 10C, 14–16 | Physical Soundtrack continuity/native transport/weak network; sustained visible Air Atlas/Fly With and GPU/thermal behavior; iPhone Safari rotation/safe areas/audio/PDF; remaining Mono/Rosso/Touring acceptance. Preserve earlier positive owner listening. |
| Row 17 — Production release | Remains a separate explicit release decision after the acceptance matrix; VERSION stays 0.0.0. |

Broader audiovisual catalogue authorship (row 12), Engine source-bank research
in the existing owner-controlled office handoff, flight schedules, persistent
diagnostic outbox and passenger remote controls remain deferred. Existing ten
curated presets are implemented; broader authorship is not a missing basic
preset system. Atlas, Stats, Travel Report, automatic diagnostics and the iPhone
layout are implemented; do not restart them from historical unchecked rows.

Current order: N01 cleanup is complete; N02 is deferred. N03/N04 are the next
research candidates, beginning with a bounded feasibility study. This order is advice,
not a claim that the owner selected infrastructure or approved a new UI design.
