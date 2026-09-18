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

## TRACE instrument — September 19

The owner selected the opaque TRACE cube mockup, adding VECTOR's phone
orientation indicator and moving **ZERO** below the graph with the exact
subtitle **recalibrate**. [Selected image, alternatives and prompt brief](design/phone-motion-2026-09-19/README.md).
The selected instrument is implemented with the existing pinned Three.js 0.169.0
WebGL2 dependency. Publication evidence is appended below after release. No new
GPU dependency, native Metal API or WebGPU requirement is introduced.

The opaque cube shows at most three seconds / 180 observed acceleration samples,
with a fading red ribbon and a phone orientation indicator reconstructed from
the relative axis-angle vector. It is acceleration space, not displacement or a
road trajectory. The equal axis range starts at ±1 m/s², expands in powers of two
and stays stable until ZERO or an invalidated reference. Samples beyond ±128
are explicitly OUT OF RANGE, not clipped into a plausible curve. Missing/stale
samples, reference changes and lifecycle gaps clear the trace.

ZERO / recalibrate sits below the graph. Horizontal drag or left/right arrows
rotate only the camera; Home / RECENTER VIEW restores it without changing the
sensor reference. Numbers show acceleration and angular velocity; the small
phone conveys relative orientation. Portrait is primary; narrow and landscape
layouts retain touch targets and scroll vertically for lower readings.

The renderer targets 30 FPS, caps pixel ratio at 1.75 and does not redraw an
unchanged empty instrument. Reduced motion suppresses the ribbon and updates
only the current tip at 5 Hz. Hidden pages stop rendering and sensing; context
loss clears history and exposes a recovery state. Missing WebGL2 leaves the
static cube and numeric sensor readouts available with an explicit explanation.
Each effect owns/disposes its canvas, including React development remounts.

`screen-wake.js` owns one optional screen wake lock. SCREEN AWAKE means an actual
unreleased lock; denial, unsupported API or system release displays SCREEN MAY
SLEEP. Explicit KEEP SCREEN AWAKE retries are available after rejection/release,
without an automatic retry loop. Stop/hide releases ownership and late requests
cannot revive it. Safari must remain visible; this is not background execution.

Renderer, trace model and screen-wake ownership remain in `src/motion/`; sensor
projection and peer freshness retain their existing owners. Bounded trace
history and local receipt timestamps never enter transport or reports.

## Reliability corrections — September 19

The visible phone state distinguishes local-only sensing, unused QR admission,
connecting, connected and ended sessions. Local entry/reload says **ENABLE LOCAL
SENSORS**. Permission retries while paired use **RETRY SENSORS** and do not restart
signaling. An attempted QR is never silently retried; both phone UI and session
owner suppress duplicate starts. Receiver CREATE QR is disabled until an active
attempt is explicitly disconnected. A joined QR disappears immediately.

Setup has a 30-second deadline, distinct from the three-minute unused QR window;
each signaling HTTP request remains bounded to ten seconds. Used/expired
admission has an explicit new-QR recovery message. Offline and peer closure
clear pending requests, peers and QR state. A late successful join after STOP
is deleted without reviving the session. No new relay or automatic retry is added.

Fresh events with missing acceleration, gyro or orientation report **incomplete**
and invalidate the pose. Expired receiver summaries clear Zero SET; guidance is
derived from current sensor evidence, so old calibration-success copy cannot
survive a gap. A rejected recalibration explicitly preserves and identifies the
previous reference; it cannot announce a successful new ZERO. A terminal paired link stops sensors and wake ownership once;
explicit local testing remains possible afterward. Sensor and transport success
remain separate. The aggregate allowlist adds only the `incomplete` sensor state.
The existing protocol shape and backend are unchanged.

Local verification and canonical publication evidence follow in the release
record below. These corrections do not establish physical device compatibility.

## User path

See the [plain first-run and recovery guide](PHONE-MOTION-USER-GUIDE.md) for
operator steps, failure states and collecting evidence before reloading.

1. Open the phone/waves icon in the running Tesla top bar. Choose **CREATE QR**.
2. Scan with iPhone Camera and open in Safari. Prefer the same Wi-Fi for this
   first direct-link implementation; hotspot and Tesla/browser compatibility
   still need physical testing. Both devices need the HTTPS site available.
3. Put the phone in a stable position, flat or upright, then press **ENABLE &
   CONNECT** and allow motion/orientation. Press **ZERO** below the graph while still.
4. The cube displays acceleration history in m/s²; the phone indicates relative
   orientation. Acceleration and angular velocity in degrees/s appear below.
   Missing readings are dashes. ZERO rejects incomplete/stale data or movement and can be
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

## Historical branded cross — September 19 refinement

The owner explicitly requested the existing Sedicivalvole identity, a restrained
technical feel and portrait-first use in a Tesla phone holder tilted about 45°.
This refines the selected XYZ Cross rather than introducing a new direction.
The companion reuses the transparent piston mark, lowercase Orbitron wordmark,
Space Grotesk numerals and the shared RED/DARK semantic colour resolver. It has
an 80 px central TARE, 56 px connection actions, fine axis/radial guides and
separate connection/sensor states. The sample dot stays hidden without data.
The phone page has its own browser title and a footer with build provenance.

The main instrument and rotation values come before quality details. Placement
and diagnostics are expandable; the original mount illustration explains that
an approximately 45° portrait holder can itself be the zero pose. There is no
requirement to level the phone, and no automatic inference of vehicle forward.
Safe-area padding, short-portrait spacing, narrow-screen text sizing and a
landscape two-column arrangement preserve the same controls and sensor session.
No permission, transport, coordinate, telemetry or renderer contract changed.

Local internal-browser evidence: 390 × 844, 375 × 667, 320 × 568, 430 × 932,
390 × 650 and 844 × 390 have no horizontal overflow. At 375 × 667 the 112 × 80
TARE and all rotation readouts fit the initial viewport (last row ends at 661 px).
At 320 × 568 TARE is visible and lower readings/details scroll; the short 390 ×
650 viewport also scrolls slightly for the last rotation line. Landscape keeps
TARE and all rotations visible. Brand image/font loading, guide expansion,
TARE refusal without fresh values, enable/STOP, diagnostic disclosure and the
phone-report download action pass without console warnings/errors. Desktop
sensor events contain missing axes, not evidence of working iPhone sensors.
Full native regression suite: **937/937**. Physical Safari safe areas, touch,
cabin glare, holder stability and actual sensor readings remain unverified.

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
visibility transitions, signaling stage/HTTP outcome and connection setup time.
TRACE adds allowlisted wake states and request/release/failure counters, renderer
availability/context loss, observed render FPS, current point count and axis
range. These aggregate changes also create safe wake/trace events. No ribbon
points or unfiltered platform errors are admitted. The existing interaction log records safe `motion.*`
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

The official publication gate admits the new endpoint by an exact reviewed
SHA-256 and rejects altered remote bytes. No wildcard API admission is added.

Local evidence: 24 new coordinate, sensor lifecycle, permissions, channel,
privacy and PHP tests; complete native regression suite **936/936**, followed by **50/50** focused
motion/PHP/publication checks including the added endpoint-identity case; real internal-browser
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
Try still/flat tare, portrait holder tare at about 45°, upright tare, a small deliberate rotation, retare, background
and reconnect. Keep/export both reports; note the approximate time of each step.
Then evaluate stable cabin mounting, stationary noise and actual turn response.
Do not infer latency to a renderer yet: this release only acquires/transports data.

Primary references checked for this implementation:
[W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/),
[WebRTC peer connections](https://webrtc.org/getting-started/peer-connections),
[WebRTC data channels](https://webrtc.org/getting-started/data-channels).


## Canonical publication and closeout

Published and verified **20260918-2335.9b18086**, VERSION **0.0.0**.
Implementation is `da12ac7`; `9b18086` adds exact endpoint admission and records
the verified checkpoint. Official preserve-existing FTP completed: **38 files /
6,351,664 bytes** uploaded; **825 static files** and **29 full-hash-verified audio
recordings** reused; **two previous assets** retained. No legacy deletion,
`remote_writes=ROOT_UPLOAD_ONLY`. The complete upload was verified before the
dynamic entry switch. No upload remains in progress.

Final package: **827 exact static hashes**, **859 regular build files** passing
the fail-closed safety reader, **189 dependency credits**, and **9/9** Sites
checks on the final package. Full native **936/936** and subsequent focused
**50/50** motion/PHP/publication checks are recorded above. No new dependency
or third-party source was admitted.

Canonical bare and cache-busted HTML return HTTP 200, match local bytes, and
retain `no-store, no-cache, must-revalidate, max-age=0`; both still match after a
controlled browser reload. Nine HTTP checks cover those roots, manifest/main
JS/CSS/phone chunk and API method/origin validation. Live internal-browser QA
at 773 × 601 verifies the build, muted launch, phone icon, SVG guide, real server
QR creation, successful polling, disconnect, and safe `phoneMotion` events in
REPORT. At 390 × 844 the public companion loads the correct build with no
horizontal overflow. The browser warning/error log is empty. No diagnostic email
was sent; AUTO was OFF. All agent-created browser tabs and the local server are
closed after verification; temporary viewport override is reset.

A first read-only preflight overlapped a local rebuild and stopped at the static
safety gate without remote writes. All 859 stable files were then verified and
the official publication reran the full guard successfully. A plain urllib HTTP
probe received 403; browser-user-agent HTTP requests and the actual browser pass.
No provider/security setting was changed.

Selected local/live SHA-256 evidence:

| Resource | SHA-256 |
| --- | --- |
| `/` | `e4a0ea882d70b39982243fefa171b3b63d19c5f39a358e159418b6b858238d7b` |
| `/assets/index-C0lKHxBj.js` | `ac16b34d47bbda69880a5f104f9518e6eab9a358a25210cf57e5fd705d0948ed` |
| `/assets/index-CK0GbmI0.css` | `b01bc372342478172a68dd115cfc1515109b6dbb8290b6cf17125bf54a8421d1` |
| `/assets/phone-CH9GNVtg.js` | `0d397f2853016ceb14a12b437420daf551d6a2cb87fa91535d979ab6c86bb3fd` |
| `/assets/release-20260918-2335.9b18086.json` | `c91b7b1a2ecce10453c1de79d2360b6ab385d0c5c86537c32a666a0aeb615cf2` |

Next acceptance is the real iPhone/Tesla protocol above. No physical sensing,
cross-device timing, relay reachability, sustained performance or Aperture
steering acceptance is claimed. Conditions, R06 and the formal release decision
retain their existing statuses.

## Branded instrument publication — September 19, 2026

Published and verified **20260919-0002.d51b4b7**, VERSION **0.0.0**, from
committed/pushed source `d51b4b7`. The official preserve-existing FTP path
uploaded **38 files / 6,357,543 bytes**, reused **825 static files** and **29
full-hash-verified recordings**, and retained **two prior assets**. Complete
verification preceded the dynamic entry switch; no legacy files were deleted
and `remote_writes=ROOT_UPLOAD_ONLY`. No upload remains.

Gates: full native **937/937**, focused documentation/typography/brand **19/19**,
production **827 exact static hashes**, credits **189**, public hygiene **1,488
files with zero findings**. Thirteen HTTPS checks verify bare/cache-busted and
phone entry HTML, emitted JS/CSS/phone chunk/manifest, piston mark, both fonts
and API method/origin guards. The HTML is byte-identical after controlled
browser reload and retains no-store/no-cache headers.

Canonical internal-browser QA passes at **390 × 844** and **844 × 390**: correct
page title/build, loaded brand/fonts, visible TARE, portrait/landscape readings,
no blank page/error overlay or horizontal overflow, and truthful refusal to
tare without fresh values. At **773 × 601**, muted main-app launch and the
phone navigation entry/guide remain available. Console warning/error logs are
empty. AUTO stays OFF and no diagnostic email is sent. QA tabs and server are
closed and the viewport override is reset. Local six-viewport/interaction
evidence is recorded above; physical iPhone/Tesla acceptance remains open.

Selected verified public byte identities:

| Resource | Bytes | SHA-256 |
| --- | ---: | --- |
| `/` | 1445 | `225808f89010627d9a766ee1aabc489b0ae59efb0bcfc1d81cfa5eebc1183d51` |
| `/assets/index-BJoruCSt.css` | 259089 | `269adaa57536cb937f1432963172ece969759345161f024f901a6f41738f8542` |
| `/assets/index-BTW_xq9x.js` | 876971 | `50c8abe88ce6d1fbc40a35da71d15f2dda5d2d005a5946a38a26e389b11ae59a` |
| `/assets/phone-DB30ok8d.js` | 11098 | `7fb23b85436137b9aa8bf1f13df59c9cdfd8c75578a2ed5833b14ad7c46c8284` |
| `/assets/release-20260919-0002.d51b4b7.json` | 116320 | `5196e0dd67787d074be0e6ac681b0fa3cd2d7da2058dc5bff11cffdca5dde3d6` |


## TRACE local verification — September 19, 2026

The full native regression suite passes **946/946**, including nine new bounded
trace/wake tests. A subsequent focused motion/PHP run passes **15/15**, including
the expanded aggregate packet through the existing server coordinate validator.
No diagnostic API or pairing endpoint changes are required.

The development-only `qa-motion-trace.html` exercises the actual renderer with
explicit synthetic processed values and no pairing, permissions, GPS, audio or
mail. Internal-browser evidence shows a three-second ribbon at approximately
30 FPS, bounded points, no redraw for an unchanged empty instrument, missing-
sample clearing, camera rotation/recenter, new reference clearing, and context
loss/recovery with an incremented counter. A fresh final fixture records no
console warnings/errors. This is not physical-device performance evidence.

Phone UI checks cover 390 × 844, 375 × 667, 320 × 568, 430 × 932, 390 × 650 and
844 × 390. There is no horizontal overflow; ZERO is 132 × 80 px and remains
below the graph. Short screens scroll for lower controls/readings. On the local
browser, an actual wake lock is acquired after enable and released on STOP;
missing sensor axes stay absent and ZERO refuses incomplete data. The landscape
lead retains compact branding and connection controls beside the instrument.
Reduced-motion behavior is source-reviewed, not physically accepted on iPhone.

Next physical run: scan the Tesla QR, allow both sensor permissions, secure the
phone in its approximately 45° portrait holder, set ZERO, observe stillness and
small deliberate rotations, then test STOP/background/foreground/re-pair.
Collect both reports, including wake state, GPU availability, cadence, freshness
and connection events. Do not infer vehicle axes or Aperture support from this
instrument. Actual Safari wake retention and thermal/endurance behavior remain
open.


## TRACE publication — September 19, 2026

Source **e8beb93** is committed and pushed. Canonical build
**20260919-0049.e8beb93**, VERSION **0.0.0**, is published. The final App/LAB/Sites
package passes **828 exact static hashes**, Sites **9/9**, credits **189** and
public hygiene over **1,495** tracked text files. The development fixture has
no production HTML/module/marker hits. Native **946/946**, follow-up **15/15**
and documentation **8/8** evidence is separate from physical acceptance.

Official `--publish --preserve-existing` passes identity/directory and full
remote hash gates: **39 files / 6,369,011 bytes** uploaded, **825** unchanged
static files and **29** full-hash audio recordings reused, **two** previous
assets retained, **13** root entries, `remote_writes=ROOT_UPLOAD_ONLY`. No
legacy deletion, backend change or new third-party dependency is introduced.

Fourteen HTTPS checks pass: bare root, cache-busted root and phone route match
local HTML; main JS/CSS, phone chunk, shared Three.js chunk, release manifest,
piston mark and both fonts match local bytes. Motion endpoint guards remain
GET 405, invalid same-origin action 400 and hostile origin 403. After controlled
browser reload, both bare/cache-busted roots still match with
`no-store, no-cache, must-revalidate, max-age=0`.

| Resource | Bytes | SHA-256 |
| --- | ---: | --- |
| `/` | 1,445 | `0995d436eee09dc7d93ed8259d542d348482da92d65c53090b66e3c4f754a87b` |
| `/assets/index-DUwNadXQ.js` | 877,644 | `92bb21a7f4103629796dfb730ad411b2401fe5416000aaa0e3d886b10de95432` |
| `/assets/index-k8b4gtAl.css` | 260,500 | `0e9324b4f848e0c58d3a82365509ca8602dcdafbeaa56a8d270a6df731569df3` |
| `/assets/phone-D_qhZo2s.js` | 21,689 | `669b863c78991703d58182e3abc8e126a65aee91bac4ad567f4341703a14c6c0` |
| `/assets/release-20260919-0049.e8beb93.json` | 116,454 | `bc2d93f2b0742c44c0fa7fb77a8be907d9b5154f176c37aa57a54f9290f905e3` |
| `/assets/three.module-l_yh09D8.js` | 683,397 | `71b6c16e5f36118ca1818b2109cb9bd681383e7db46cf9e1872596f7b5c1fe20` |

The canonical internal browser confirms TRACE/WebGL2, ZERO below the graph,
no horizontal overflow at 390 × 844, refusal without complete fresh values,
and safe diagnostics showing zero points/FPS when idle. The compact 773 × 601
main app opens the phone panel and updated ZERO guide. Published phone and
main-app checks have no console warnings/errors. AUTO remained OFF and audio
muted for QA; no synthetic mail was sent. Temporary browser tabs and local
servers were closed. Real iPhone/Safari/Tesla sensing, reachability, touch,
wake retention, thermal/endurance and Aperture steering remain open.

## Reliability verification — September 19, 2026

Observed baseline defects: a direct phone URL advertised ENABLE & CONNECT;
null desktop sensor events were labeled live; permission retry restarted the
same QR admission; stale receiver metadata could retain Zero SET. The targeted
corrections above retain the approved TRACE direction and existing direct network.

Software evidence: full native regression **955/955**, followed by expanded
motion/PHP tests **66/66** and documentation **8/8**. Deterministic cases cover
permission denial/late grants, missing axes, fresh ZERO, stale/reference loss,
duplicate starts, consumed/expired admission, non-JSON responses, HTTP/setup
timeouts, late join deletion, offline teardown, used QR removal, replay rejection,
wake denial/release/late acquisition and bounded aggregate privacy.

Rendered checks use the Codex in-app Chromium browser and local development
server with environment loading disabled. The Browser skill package was absent;
the available Computer Use Playwright bridge supplied actual UI checks. Initial
live inspection preceded code review. Local phone UI at 320×568, 375×667,
390×844, 430×932 and 844×390 has no horizontal overflow and keeps the 132 px ZERO
target; lower content scrolls. Direct/local labels, ZERO refusal, missing-axis
guidance, STOP and deliberate local restart pass without console warnings/errors.
Real local WebRTC/PHP receives synthetic processed samples; pausing removes
sample availability and Zero SET while retaining the transport distinction.
STOP disposes both peers. The TRACE fixture renders at about 30 FPS in this short
run, clears history on forced WebGL context loss, reports recovery, and resumes.
These are synthetic/browser observations, not cabin performance or sensor proof.
AUTO remained OFF, audio muted, and no synthetic mail was sent.

Physical iPhone/Safari permission prompts, camera QR scanning, Tesla/browser
interoperability, client isolation/hotspots, screen-lock retention, safe areas,
real sensor accuracy and endurance remain open. Next: the parked first-run and
STOP/background/new-QR exercise in the updated user guide. No Aperture steering
or unrelated backlog work was started. Publication identity follows after the
canonical gates; historical release sections above remain dated evidence.

## Reliability publication — September 19, 2026

Verified at **2026-09-19 01:40 Europe/Rome**: canonical **20260919-0131.c75c921**, VERSION
**0.0.0**, source **c75c921**. Implementation checkpoints f919af6, 45a5b88,
197317f and c75c921 are committed and pushed. The intermediate 0120 and 0129
candidates were stopped before activation while final recovery copy was corrected;
0120 completed asset transfer but did not activate the root, and 0129 stopped
during read-only identity verification. Bare canonical remained 0049 until the
successful complete publication below. No claim of whole-release atomicity is
made for mutable assets; the existing compatibility contract was preserved.

Final immutable package: **828 exact hashes**, **9 Sites checks**, **8 documentation
checks**, **189 dependency credits**, hygiene **1,498 text files**. The full native
suite passed **955/955** at the main implementation checkpoint; final focused
motion/PHP regressions pass **66/66**, including rejected recalibration and
local/paired permission guidance. No dependency or backend change was required.

Official `--publish --preserve-existing` completes all gates: **39 files /
6,374,035 bytes**, **825 unchanged static files**, all **29 full-hash audio
recordings** reused, two previous assets retained, canonical dynamic entry
verified, legacy deletion skipped, **ROOT_UPLOAD_ONLY**. No rebuild occurred
during an upload. The local QA server was stopped after browser checks.

HTTPS: **11 local/live asset size/SHA-256 matches** (main JS/CSS, phone chunk,
release manifest, cache runtime, fonts and brand files), **four bare/cache-busted
root identity checks**, HTTP 200 and no-store/no-cache headers. Prior main JS/CSS
remain HTTP 200. Live browser checks confirm 390×844 portrait, 844×390 landscape,
773×601 Tesla panel, honest local entry, ZERO refusal, incomplete readings,
STOP, reload, QR creation, disabled duplicate start and DISCONNECT/recovery.
Canonical reloading retains the new build. No framework error overlay or console
warning/error occurred in these paths. AUTO remained OFF and audio muted.

The physical acceptance list above remains open. The next step is the owner's
parked first-use and reconnect trial; software checks do not establish physical
iPhone/Tesla compatibility, camera scanning, network reachability or wake retention.


## Desk-test diagnosis and ZERO capture — September 19, 2026

The owner supplied an older-build phone report (`20260919-0049.e8beb93`) from
Chrome on iPhone while at a desk, not in the car. It records a connected channel,
2,240 motion and orientation events, no missing axes and approximately 61 Hz.
Its single ZERO attempt was rejected (`hold-still`), with zero accepted captures
and zero trace points. This explains the empty trace despite live sensor input;
aggregate peaks do not establish which eligibility threshold failed at that tap.
WebGL2 availability is recorded; zero rendering cadence alone is not a renderer
failure when there are no referenced samples. The private raw attachment is not
versioned. This is desk-phone evidence, not Tesla acceptance.

The revised button arms a bounded capture: 500 ms of continuously eligible
samples within eight seconds, allowing a tap disturbance to settle. Existing
0.7 m/s², 5°/s, 7–12 m/s² gravity and 250 ms freshness gates stay intact. Gaps or
incomplete observations restart settling, duplicate taps do not extend the
attempt, and STOP/hide cancels it. A failed recalibration preserves an otherwise
valid previous reference and says so. The strict diagnostic enum `tareReason`
separates acceleration, rotation, gravity, missing data and unfinished settling;
no vectors are added to reports. The units remain aligned with the
[W3C motion specification](https://www.w3.org/TR/orientation-event/).

Before ZERO, two local scalar input magnitudes show sensor activity independently
of the reference-relative cube. These are not vehicle axes or calibrated peer
samples. The receiver begins preparing QR on panel open and preserves existing
pairing/transport; it does not start a session merely by loading the main app.

The owner has been offered three guidance directions (three gestures, two
screens, one step at a time). Selection is pending; this functional correction
retains the previously selected three-SVG layout.
