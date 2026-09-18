# Motion feasibility: isolated N03 / N04 probes

## Status and scope

The local software foundation is implemented. **Physical iPhone sensing and
phone-to-Tesla delivery remain unverified.** No product speed, GPS, audio,
renderer, source-selection UI, server or infrastructure has changed. VERSION
remains 0.0.0; the canonical product stays at **20260918-2212.721274c**.

`prototype/drive-lab/qa-motion.html` follows the existing development-only QA
entry convention. Unlike the protected production LAB, it is not a build entry,
not in `public/`, and not imported by App or LAB. Its three modules live under
`qa/`; the harness refuses non-development execution. No new dependency or
third-party implementation was admitted. This is an owner-operated technical
probe, not a selected public motion interface.

## N03 sample and controller contract

- `motion-sensor.mjs` accepts DeviceMotion acceleration excluding gravity,
  acceleration including gravity, and rotation rate as separate nullable axes.
  Units are m/s² and degrees/s. The frame stays the device's standard orientation;
  screen angle is metadata, never a covert screen-to-vehicle transform. Missing,
  non-numeric and non-finite values stay null, including missing zero axes.
- Timing is monotonic local **event receipt**, using `performance.now()`. This
  does not establish hardware acquisition time or queued-event latency. The API's
  declared interval is reported separately from observed delivery frequency,
  interval deviation and maximum gap over at most 240 observations.
- START alone requests permission, synchronously from the button handler when
  a request API exists. Insecure context, unavailable API, missing gesture,
  denial, permission error, waiting and three-second no-event states differ.
  Missing prompt API is not labelled granted. Granted permission is not evidence
  of values: quality distinguishes no events, no values, partial, complete and
  stale. Synthetic DOM events are ignored by the real controller.
- Receipt freshness expires after 250 ms. Stop, hidden document and pagehide
  detach capture and clear observations. Permission promises cannot resurrect a
  stopped/hidden/disposed controller. Returning foreground requires START again.
  Screen rotation, remount, stale input and delivery gaps invalidate calibration.
- Stationary capture needs at least two seconds and 40 complete observations.
  A constant-size online accumulator computes axis bias and standard deviation,
  including at high event rates. Provisional rejection thresholds are linear
  acceleration magnitude above 0.5 m/s², rotation magnitude above 3 degrees/s,
  or per-axis deviation above 0.1 m/s² / 0.5 degrees/s. These are test parameters,
  **not measured iPhone noise limits**. Passing yields `baseline-only`; it neither
  establishes the forward axis nor proves vehicle calibration. No bias is applied
  to product input. Remount without a screen-angle change requires explicit reset.

Raw observations remain bounded in page memory and have no export, storage,
console or network path. The UI displays aggregate quality/noise only. It imports
no automatic diagnostics, GPS, audio or product session modules.

## N04 direct-channel experiment

`motion-link.mjs` creates a deliberate five-minute WebRTC session with
`iceServers: []`, an unordered channel and `maxRetransmits: 0`. No media capture,
STUN/TURN service, WebSocket, discovery endpoint, account or hosting capability
is assumed or provisioned. An actual opened channel and accepted replies are
required; the presence of `RTCPeerConnection` alone is insufficient evidence.

The receiver sends one outstanding numbered challenge at a time. The sender
replies with a versioned, allowlisted **synthetic** envelope containing only
session, request, source sequence and sender-local sample age. It generates a
virtual 50 Hz source; polling is 20 Hz. Sensor vectors cannot enter this schema
and the link module does not import the sensor module.

The receiver computes:

`age upper bound now = sender-local age at reply + receiver round trip + time since receipt`

The request/response round trip conservatively includes the return path. It
avoids subtracting unrelated monotonic clocks and does not claim one-way latency,
sensor acquisition age or motion-to-render latency. Replies over the 250 ms
budget, older sequences, replayed challenges, wrong sessions, malformed or
oversized messages and additional fields are rejected. Clocks reversing before
session start fail closed. Messages are capped at 512 characters; history is
bounded at 240 RTT and arrival intervals. There is no stale sample replay queue.

`expiredRequests` counts challenges without a timely valid reply, including
local backpressure/send failure; it is **not network packet loss**.
`skippedSourceTicks` counts skipped synthetic source generations, expected when
polling slower than the source; it is **not packet loss** either. The summary
separately reports send errors, local backpressure drops, RTT and arrival jitter.
Application-level loss/recovery can be tested; transport packet-loss claims need
separate target-network evidence. Samples are dropped above 4 KiB buffered data.

Disconnect/failure, page hiding, explicit clear or expiry revoke the connection.
Reconnection needs a new deliberate session and offer/answer. Loopback negotiates
inside one page. Optional manual signaling exchanges temporary offer/answer text
between trusted devices; it contains network details and must not go into logs,
screenshots or reports. Session IDs and DTLS fingerprints are bound through that
trusted exchange, not a public pairing/authentication system. Text is cleared on
disconnect, hiding, expiry or completion on the receiver.

Direct host ICE may work on a reachable private network, or fail because of
isolation, ICE/browser policy or missing browser capability. Failure does not
establish a universal TURN requirement. Existing hosting's signaling/WebSocket/
TURN support is unknown; this probe does not depend on it.

## Running the local probe

From `prototype/drive-lab`, use the existing native wrapper with local environment
loading explicitly disabled:

```sh
SEDICIVALVOLE_NO_LOCAL_ENV=1 node scripts/native-toolchain.mjs -- node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5183 --strictPort
npm run test:motion
```

Open `http://127.0.0.1:5183/qa-motion.html` in the Codex internal browser for local
QA. Automatic diagnostics are absent from this entry, not merely toggled off.
The loopback URL is only for the host Mac. **A phone or Tesla cannot use the
Mac's loopback URL**, and a plain LAN HTTP URL is not an acceptable sensor test.
Real-device execution needs a reachable origin with trusted HTTPS, or an explicitly
chosen protected distribution of this probe. No certificate trust, access,
provider or deployment changes were made. Do not bypass certificate warnings or
expose the Vite development server publicly. Selecting that execution path is
the next owner/infrastructure dependency; it is separate from public UI design.

For manual testing after that dependency is resolved: receiver creates an offer;
sender pastes it and selects ANSWER; receiver pastes the answer and selects APPLY.
Only share signaling through an owner-controlled direct path. Do not send raw
sensor values; N04 remains synthetic even when N03 is collecting locally.

## Physical evidence protocol

Record only aggregate readings, phone/iOS/Safari version, Tesla firmware/browser,
test revision, orientation, network topology and test outcome. No coordinates,
raw sensor streams, SDP, IP addresses, VINs or device identifiers in the record.
An operator/passenger performs interactions; mounting and stationary work precede
any ordinary-motion observation.

| Trial | Required observation / decision |
| --- | --- |
| iPhone permission | Explicit START; reject once, retry according to actual browser behavior; note absent request API, denial and no-value/no-event outcomes independently. |
| Stationary 30 s | Secure mount; observed Hz, API interval, jitter, max gap, missing axes, baseline means/deviations and baseline outcome. Repeat in each intended mounting orientation. |
| Rotation/remount | Rotate screen; confirm invalidation. Remount without screen change; press RESET and recapture. Determine forward-axis/sign separately; stationary gravity alone cannot resolve yaw. |
| Lifecycle | Hide, return, lock/unlock and reload; confirm no retained raw observations, no automatic restart and fresh baseline requirement. Do not infer continuous background delivery. |
| Ordinary motion | With a secured phone, compare qualitative forward/brake response against independently observed product GPS speed/age; do not integrate acceleration into km/h. This probe intentionally does not read GPS. Hardware acquisition latency and motion-to-render latency remain unmeasured. |
| Target browser | Run synthetic loopback on the exact Tesla firmware/browser; record creation, channel-open and accepted-reply results. Local Mac success cannot close this row. |
| Two-device path | Start on one trusted private Wi-Fi; record topology without addresses. Test other owner-approved existing network topologies separately. A hotspot/shared Wi-Fi label alone does not guarantee peer reachability. |
| Timing/recovery | Observe RTT, conservative age, jitter, expired requests and local drops. Disconnect/restore the network, hide the phone, wait past five minutes, unpair/re-pair. Confirm old replies cannot re-enter and a new session restores delivery. |

Acceptance thresholds for a product motion effect need real-device distributions
and a selected interaction. GPS stays the sole real speed reference throughout;
the existing 130 km/h energy boundary is untouched. Public permission, mounting,
pairing and source UI require exactly three directions and owner selection when
hardware evidence makes that design useful. No such direction is selected here.

## Verification and delivery evidence

Implementation checkpoint **467c105**, committed and pushed to `origin/main`.
Credits **189/189**, tracked-text hygiene **1,473 files / zero findings**, and
`git diff --check` pass. Agent-created QA server and browser tab were closed.

- Initial checkout `d5634b2`, clean main; origin fetched and synchronized before
  implementation. Native toolchain check passed on this Mac.
- **49/49** focused checks pass: **22** motion behavior tests, **8** documentation
  checks, **10** protected LAB tests and **9** Sites tests. Motion cases cover
  missing axes, receipt clocks, bounded memory,
  stationary/noisy/high-rate baselines, permission cancellation, visibility,
  rotation, strict synthetic schema, replay/out-of-order/age rejection, timeout
  recovery, expiry, revocation and backpressure. See `npm run test:motion`.
- Internal Codex browser, local route, 773 × 601 and 390 × 844: meaningful entry,
  readable wrapping/scrolling and functional controls, no framework overlay or
  console warning/error. START on the Mac received permission and one event with
  no axes; it became stale, and STOP cleared observations. This is **not** iPhone
  sensor evidence. Reload starts idle with no capture or connection.
- Actual internal-browser RTC loopback: both channels opened; one observed
  snapshot accepted 739 synthetic replies, zero rejections/expired requests,
  trailing-window RTT mean 0.799 ms, maximum 4.3 ms, arrival jitter 5.54 ms.
  These are local, transient observations, not a network/device benchmark.
  DISCONNECT returned to `Not connected`. Invalid manual signaling was rejected
  and CLEAR removed temporary text. Manual cross-device signaling is not physically
  verified. The QA tab was closed and temporary viewport overrides were reset.
- Local production build **20260918-2230.d5634b2** passed App, protected LAB,
  Sites preparation and **827** exact package hashes. This was an exclusion
  check from the development working tree, not a release. Built client files
  contain neither the QA entry nor its module/protocol markers. Existing large
  chunk warnings remain; no new dependency was introduced.
- **No deploy:** changes are excluded QA code/tests and documentation. The live
  product remains the previously verified Drivey release. No physical acceptance
  or SemVer release is claimed.

## Remaining independent work / R06

Read-only refresh of historical scan `a6a7a08a-20e8-4a5d-a16e-e8157108e3aa`
still reports discovery against `31b9333`, two review receipts, no registered
artifacts and no completed report. Its registered directory and matching target
directories in the checked temporary roots are absent. No reset, duplicate,
preflight mutation or false finalization was attempted. Recovery needs the
original evidence/owner context; replacement needs a deliberate owner decision.

N03/N04 now need the secure device execution path and actual phone/Tesla
measurements. No further automatic task is launched solely to wait for those
dependencies. Conditions stays deferred; dynamic Aerial stays retired. Physical
S04/P05, accepted Engine follow-ups and release choice retain their separate gates.

## Primary references checked September 18

- [W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/):
  API units/frame, nullable data, secure context and activation/permission model.
  Browser-delivered values are high-level observations, not direct sensor access.
- [Apple DeviceMotionEvent](https://developer.apple.com/documentation/webkitjs/devicemotionevent)
  and [WebKit permission discussion](https://bugs.webkit.org/show_bug.cgi?id=201676):
  API/permission background; historical discussions are not current-device proof.
- [WebRTC peer connections](https://webrtc.org/getting-started/peer-connections)
  and [data channels](https://webrtc.org/getting-started/data-channels): signaling,
  ICE configuration and application-data transport. No inspected primary source
  establishes RTCDataChannel support for the owner's exact Tesla firmware.
- [W3C WebRTC](https://www.w3.org/TR/webrtc/): channel ordering/retransmission,
  connection lifecycle and buffer semantics. Probe policy/thresholds above are
  project choices, not compatibility guarantees supplied by the standard.
