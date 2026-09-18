# Phone motion companion — September 18, 2026

## Owner decision and scope

The owner requested a public QR companion, an immediate central tare button,
live spatial XYZ readings, connection/sensor diagnostics and a top-navigation
entry with SVG guidance. The owner selected **direction 1, XYZ Cross** from the
three proposed directions. This explicitly supersedes the earlier local-only
N03/N04 probe scope and pending UI selection, within this companion feature.

The implementation is an experimental measurement connection. GPS/Demo remains
the road-speed source; no inertial speed, vehicle API access or audio mapping is
introduced. The suggested Aperture inclination/curvature is the next experiment
after real-device evidence, not an implemented renderer effect.

## User path

1. Open the phone/waves icon in the running Tesla top bar. Choose **CREATE QR**.
2. Scan with iPhone Camera and open in Safari. Prefer the same Wi-Fi for this
   first direct-link implementation; hotspot and Tesla/browser compatibility
   still need physical testing. Both devices need the HTTPS site available.
3. Put the phone in a stable position, flat or upright, then press **ENABLE &
   CONNECT** and allow motion/orientation. Press the central **TARE** while still.
4. The cross displays acceleration in m/s². Below it are relative rotation-vector
   components in degrees and angular velocity in degrees/s. Missing readings are
   dashes. TARE rejects incomplete/stale data or appreciable movement and can be
   repeated immediately; it does not require a long calibration routine.
5. Keep Safari visible. A supported optional screen wake lock helps; unsupported
   wake lock is explicitly reported. Hiding either page or disconnecting closes
   the link. Scan a **new** QR to reconnect and retare after remounting.
6. The Tesla **REPORT** includes connection and remote sensor summaries. The phone
   has expandable debug details and **DOWNLOAD PHONE REPORT**, particularly useful
   if no connection was established. Nothing sends diagnostic mail from the phone.

QR admission expires after three minutes, accepts one phone, and uses a random
capability in the URL fragment. The phone removes that fragment from the current
history entry immediately. An open data channel has a one-hour maximum lifetime.

## Coordinate and freshness contract

`src/motion/reference.js` uses the W3C Z-X-Y orientation matrix and transforms
vectors into the saved tare frame with `R_tare^T × R_current`. Relative rotation
uses a bounded axis-angle vector, avoiding naive Euler subtraction and the
359°→1° discontinuity. Acceleration uses the browser's gravity-excluding values;
it is never integrated into speed and is not silently replaced by zeros.

Tare requires complete samples received within 250 ms, acceleration norm at most
0.7 m/s², rotation norm at most 5°/s and gravity magnitude 7–12 m/s². These are
initial eligibility thresholds, not a measured iPhone accuracy claim. It sets
pose, not a learned sensor-bias correction. The initial gravity vector supplies
an optional turn-rate projection; arbitrary placement alone cannot identify
vehicle forward. Hand movement and mounting movement remain real measured input.

Orientation events may be change-driven. Between events, fresh gyro samples
propagate the orientation matrix for intervals no greater than 250 ms; no
propagation crosses a sensor/execution gap. Drift, vendor fusion changes and
mount stability remain physical acceptance items. Gaps invalidate tare; a fresh
orientation received after a gap remains eligible for an explicit new tare.

`channel.js` uses an unordered, zero-retransmission WebRTC data channel with no
STUN/TURN service. Only quantized relative acceleration, angular velocity,
rotation and turn rate plus bounded quality metadata travel to the paired peer.
A receiver challenge measures round-trip time; sender sample age plus the full
round trip is a conservative freshness bound, without comparing device clocks.
Replay/malformed/out-of-range packets are rejected. Samples expire after 250 ms;
there is one outstanding challenge and a 4 KiB send-buffer threshold.

A connected transport is distinct from usable sensors: sensor state and tare
are reported separately, and no eligible sample is returned without fresh data.
There is no fallback that makes stale values drive the product.

## Signaling, privacy and diagnostics

`public/api/motion-pair.php` provides bounded same-origin HTTPS setup on the
existing host. It exchanges SDP, which can contain network addressing, only
between capability holders. It never receives sensor samples. Three separate
random capabilities govern receiver, one-use join and phone actions; server
storage contains hashes, not bearer values. Private temporary files are 0600
inside a 0700 directory; a global lock serializes joins and changes. Sessions
expire after three minutes, at most 64 pending records are admitted, descriptions
are bounded to 24 KiB and requests to 32 KiB. Expired records are inaccessible
immediately and lazily removed on subsequent requests; connected/disconnected
sessions request early deletion. There is no new account, paid relay or provider
configuration. Anonymous setup can exhaust the bounded capacity temporarily;
this experimental endpoint does not claim a comprehensive anti-abuse service.

The session report adds `phoneMotion` (`sedicivalvole.motion-diagnostic.v1`):
latest state, up to 300 two-second aggregate entries, up to 120 events and total
event count. Fields include capability/permission availability, sensor cadence,
jitter, peak acceleration/angular-rate magnitudes, missing axes, tare count,
RTT, conservative age, rejected/expired requests, backpressure, errors and
visibility transitions, signaling stage/HTTP outcome and connection setup time. The existing interaction log records safe `motion.*`
events. Raw vectors, pose, location, SDP and pairing tokens are excluded from
reports, email attachments and persistent storage. Existing automatic diagnostic
preferences/destination/schedule remain unchanged. Phone events before a working
link cannot appear in the Tesla report; download the phone report for that case.

## Local verification and physical acceptance

The original development-only probes remain separate. A new local-only
`qa-motion-companion.html` exercises the production session/channel with
synthetic processed values and real WebRTC plus the production PHP library in
an isolated temporary directory. Start Vite with
`SEDICIVALVOLE_NO_LOCAL_ENV=1 SEDICIVALVOLE_MOTION_QA=1`; its optional PHP adapter
accepts only loopback connections. QA HTML/modules are not production entries.

Local evidence: 23 new coordinate, sensor lifecycle, permissions, channel,
privacy and PHP tests; complete native regression suite **936/936**; real internal-browser
pairing and loss-of-sample/stop paths. At 773 × 601 the six navigation actions
retain 79.5 × 64 px cells. SVG guide/QR, modal Escape and disconnect work. Phone
390 × 844 has central TARE, readable readings and no horizontal overflow.
Landscape 844 × 390 moves TARE into the visible right-hand cross (116 × 74.5 px)
without horizontal overflow. The final real-channel local run received more than
400 synthetic samples with an observed 1 ms loopback RTT; this is not a cabin
or cross-device latency measurement.
Publication identity and final gate counts are recorded below after deployment.
These checks do not establish iOS permission UX, actual motion fidelity, QR camera
scanning, cross-device reachability, Tesla support or physical/endurance quality.

For the first physical run record phone/iOS and Tesla software versions plus build.
Try still/flat tare, upright tare, a small deliberate rotation, retare, background
and reconnect. Keep/export both reports; note the approximate time of each step.
Then evaluate stable cabin mounting, stationary noise and actual turn response.
Do not infer latency to a renderer yet: this release only acquires/transports data.

Primary references checked for this implementation:
[W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/),
[WebRTC peer connections](https://webrtc.org/getting-started/peer-connections),
[WebRTC data channels](https://webrtc.org/getting-started/data-channels).
