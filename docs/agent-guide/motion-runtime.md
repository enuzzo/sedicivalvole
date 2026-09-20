# Motion and runtime contracts

Consult the section whose ownership the task changes. UI-only geometry does not require this whole file. Changes crossing audio, GPS, maps and lifecycle must read the relevant consumer contract as well: [Engine](engine.md), [Music](music.md), [Maps](maps.md) or [automatic reports](diagnostics-reports.md#automatic-delivery).

## Energy and mode boundary

Engine and Flux are equal, always-selectable primary modes. Music is Flux's public name; keep the active mode identifiable and switching reachable from both. Flux is authored adaptive music with generative fields; Engine has its own engine models and instrument visual. They share normalized speed, diagnostics, audio unlock, active-mode Stop/Mute, safety and accessibility ownership. Music and Engine retain independent explicit mute preferences; switching modes applies the destination preference. Never imply real RPM, throttle, gear or CAN access without evidence.

GPS and Demo feed the same normalized speed signal. Normalize **visual and musical** energy against the fixed `130 km/h` legal-road ceiling, with the Aperture tunnel already clearly visible near `40 km/h`. The user-adjustable threshold is retired; its former slot serves truthful visual/score selection. Do not label unimplemented genres active. Engine's acoustic road response uses the same 130 ceiling, but explicit neutral TAMARRO is exempt from the road cap. Soundtrack recordings remain fixed at 1x; this energy mapping does not automate their pace.

Road speed and musical features are separate inputs. Continuous speed/energy is smoothed; musical structural changes are bar-quantized. Vehicle-macro consumers use the typed `snapshot.values` boundary. For mode transitions inspect actual shared ownership in `prototype/drive-lab/src/App.jsx`, `signal-model.js`, `audio-runtime-guard.js` and the affected consumer rather than creating a second lifecycle owner.

## GPS and simulator

Do not fabricate GPS motion or turn unknown speed into zero. Keep validity/accuracy, outlier/reordering, asymmetric smoothing, deadband, stale/confidence state and separate Brake cooldown boundaries. Live watch timing is monotonic at the shared receiver; one-shot renewals retain acquisition/replay checks. The Engine no-fix manual-rev exception is not GPS standstill: read [TAMARRO and idle](engine.md#tamarro-and-idle) when changing freshness.

Held Space continuously brakes from the exact displayed speed using the documented time-based Model 3 AWD reference curve; release resumes Demo after a short settle. Held ArrowUp accelerates; release or ArrowDown enters nominal regenerative lift-off from the exact speed. Automatic Demo deceleration uses the same lift-off model; Space remains stronger service braking. Do not return to GPS on an arbitrary timer or introduce a speed jump. Use the reference curve only as a soft real-GPS plausibility envelope, never as simulated evidence. For exact source/curve/handoff parameters read [Speed-source contract](../TECHNICAL-DIRECTION.md#speed-source-contract), [Reference motion model](../TECHNICAL-DIRECTION.md#reference-motion-model) and [Filtering and confidence](../TECHNICAL-DIRECTION.md#filtering-and-confidence).

The old universal ban on coordinates is superseded **only within explicitly authorized geographic features and optional route export**. Technical diagnostics remain coordinate-free. Maps use disclosed geographic services and bounded local state; precise route inclusion requires an explicit export choice. Read [Geographic privacy](maps.md#geographic-privacy) before changing collection, storage or transmission. Permission granted is not a GPS fix, and a geographic first fix is not necessarily trusted motion or journey evidence.

## Preparation and recovery

Transient loads retry with bounded backoff for several minutes, online/foreground recovery, one attempt at a time and cancellation on selection change. Do not repeatedly reload hidden/offline renderers. See [Recovery and nearby sources](../ATLAS-STATS-REFINEMENT-2026-09-08.md#recovery-and-nearby-sources) for the map's five-minute recovery episodes and source-specific deadlines; `src/load-recovery.js` is the shared implementation entry. Source-specific backoff/Retry-After and data-age rules remain in [Maps](maps.md#air-atlas).

Intro silently prepares selected Lucky visual dependencies, selected Jamendo track/cover and at least Mono, following explicit Engine selection. Do not mount hidden renderers or start audio before a gesture. Keep preparation reusable across launch choices and Music, including React Strict Mode's lifecycle. Center prominent Engine loading separately from TAMARRO. Retain bounded verified **encoded** Engine assets across mode/profile switches within the page; do not extend the Jamendo transient-media policy. Read [Launch preparation](../LAUNCH-PREPARATION-2026-09-09.md) when changing these owners.

Catalogue replacement must never play the old queue; buffered transitions retain outgoing committed track/metadata until target readiness. These distinct rules are defined together in [Soundtrack and selection](music.md#soundtrack-and-selection). Online/foreground recovery also restores artwork/native metadata through the existing handlers.

## Cache and updates

Keep verified static assets for at least **seven days** in build-specific browser caches. Never delete a generation still used by an open client. Browser eviction, quota, privacy restrictions and unsupported APIs remain capability limits; never promise guaranteed persistence. Remote music and dynamic/private APIs stay outside that static cache boundary.

Check published build identity every **five minutes** and on online/foreground return. Renew a week-old session only after a successful fresh check. Automatic reload needs **thirty observed quiet seconds**, with either Intro eligibility or muted audio plus fresh exact GPS standstill; otherwise offer UPDATE. Interaction, movement, visibility loss and execution gaps reset quiet observation. Keep saved preferences, never clear all site storage, and disclose that session counters restart. No background execution promise. For cache/update changes read [Session cache and updates](../SESSION-CACHE-UPDATES-2026-09-09.md), then inspect `src/session/` and related tests. Delivery additionally reads [cache overlap](delivery.md#canonical-publication).

## Environment portability

Do not trust native `node_modules` copied between machines/architectures through Dropbox. Establish the lockfile/environment and use the existing `native:check`, `test:native` and `build:native` wrappers from `prototype/drive-lab`; prepare missing native packages only when actually required and within the task's permissions. Do not rewrite dependency versions merely to work around a host mismatch. `scripts/native-toolchain.mjs` and [Drive Lab instructions](../../prototype/drive-lab/AGENTS.md#local-work) provide the local entry points. This is environment repair guidance, not a requirement to install or test on every documentation edit.

## Isolated motion feasibility

N03/N04 have development-only QA modules under `prototype/drive-lab/qa/` and
`qa-motion.html`; see [sensor/link contracts and physical protocol](../MOTION-FEASIBILITY-2026-09-18.md). No product motion source is selected. Preserve explicit gesture/permission, nullable device-frame axes, monotonic receipt timing, bounded in-memory observations, foreground restart, baseline invalidation and exclusion from diagnostic delivery. The data-channel probe sends synthetic timing metadata only, uses no external ICE/signaling service, expires/revokes sessions and rejects stale/replayed input. A local loopback pass is not iPhone/Tesla support, synchronized one-way latency or physical acceptance. GPS stays the real speed reference. Real-device access and a new public UI retain their separate authorization/selection gates.

## Phone motion companion

The selected [TRACE companion](../PHONE-MOTION-COMPANION-2026-09-18.md) adds
explicit-permission iPhone sensing, user-triggered pose tare and an expiring encrypted HTTPS companion, with optional local WebRTC via the same-host PHP endpoint. It carries quantized
relative motion plus allowlisted presentation/receipt context; GPS/Demo remains the sole speed source. The later [mounted road-input authorization](../PHONE-ROAD-INPUT-2026-09-19.md) adds calibrated portrait-holder acceleration to Engine/Flux response and mounted gyro to Aperture. GPS retains speed authority; Demo excludes sensors. The September 19 [road connection refinement](../PHONE-MOTION-HTTPS-2026-09-19.md) supersedes the prior direct-only and no-renderer-consumption scope. Keep 250 ms freshness, no clock subtraction across peers,
no raw histories, one-use QR admission and teardown on hide/disconnect.

The phone-only TRACE renderer owns bounded acceleration-space history; it never
integrates speed or overrides reference/sensor freshness. Screen wake has one
explicit owner with observable release/denial; hidden pages stop the connection
and cannot silently regain a valid reference.

Companion recovery must distinguish local sensing from an open Tesla transport.
Permission retry cannot restart pairing or reuse consumed QR admission. Initial admission/direct setup is bounded to 30 seconds (unused QR admission
remains three minutes). The September 20 owner-requested [network recovery](../PHONE-NETWORK-RECOVERY-2026-09-20.md)
supersedes offline teardown for an admitted HTTPS session: retain pairing until
its original one-hour expiry, retry serially with bounded backoff, and preserve
local ZERO only while sensor evidence stays valid. Offline immediately clears
transport receipts and excludes phone input; valid GPS remains the fallback.
Show the interruption and automatic recovery on both screens, distinguishing an
absent GPS fix. Hidden pages, STOP and terminal peer/authentication states still
clear pairing and require a new QR. Temporary direct WebRTC `disconnected` may
recover; `failed`/closed remain terminal.
Incomplete axes invalidate ZERO just like stale observations; remote stale
summaries cannot retain Zero SET. Explicit local sensing after a terminal link
is allowed, visibly labeled local-only, without reviving pairing or calibration.
An explicit local restart also restores local ZERO guidance and visibility;
terminal refreshes must not erase that choice. STOP or a new terminal transition
clears it. Local readiness never claims a restored display connection.

Opening the receiver phone panel starts QR preparation when no active attempt or
connection exists; it preserves active pairing/transport. It does not pre-create
sessions before the user opens the panel. ZERO waits for 500 ms of continuously
eligible, fresh samples after the tap, bounded to eight seconds. Movement,
incomplete readings and gaps reset the settling window; STOP/hide cancels it.
The existing eligibility thresholds remain unchanged. Before ZERO, local scalar
sensor activity is visible separately from the reference-relative trace; it is
never sent as calibrated motion. Diagnostic `tareReason` is a strict enum only.

Mutual readiness requires a fresh tare-relative sample at the receiver, its
accepted generation/sequence in the next poll, and the phone acknowledgement in a fresh
reply. Phone receipt age includes the return journey measured on its own send clock.
Both sides clear confirmation after 250 ms, a sensor gap or a changed
reference. An open channel alone is insufficient. Only peers advertising
`supportsUiContext` receive the optional poll context; legacy three-key polls and
seven-key samples remain compatible. Presentation admits only existing palette
IDs and effective `light`/`dark`, never remote CSS. Context and generation receipts
are excluded from diagnostics; only allowlisted boolean readiness summaries enter
reports. A phone with an older receiver can sense locally but cannot claim mutual
confirmation. Sensor retries preserve the current pairing; CREATE QR explicitly
replaces a stale session instead of silently reusing admission.

## September 19 road recovery

[Road refinement](../ROAD-REFINEMENT-2026-09-19.md) adds explicit static-cache reset in Intro and diagnostics, preserving preferences and pairing. This owner action may purge app generations; automatic cache eviction retains the ordinary open-client rules. Local TRACE reuses the phone sensor owner, preferring permission-capable touch input or trusted complete motion evidence without UA/screen-size identification. Capability or permission is never live evidence; remote QR remains explicitly available. ICE gathering can accept candidate-bearing SDP at its bounded deadline; empty offers fail visibly before QR. No new sensor/audio coupling or external ICE service is authorized. The later September 19 owner request authorizes the encrypted same-origin HTTPS transport and Aperture rotation response described above.

## Mounted road response — September 19

The explicit owner request supersedes earlier no-sensor/audio-coupling restrictions. Follow [mount, axes, fallback and physical limits](../PHONE-ROAD-INPUT-2026-09-19.md). Preserve explicit mount selection, gravity-based ZERO, latched handling rejection, 250 ms freshness and distinct GPS speed authority. Other poses retain TRACE with GPS road response. Never claim automatic vehicle identification or complete handheld-motion rejection.

## Companion continuity correction — September 20

Connection health is independent of sample freshness: an open transport stays CONNECTED
while delayed motion is excluded, with `dataFresh` and sensor/receipt status shown separately.
HTTPS keeps serial HTTP exchanges but pipelines at most eight protocol requests within the
unchanged 250 ms deadline. A matching earlier response can complete while a newer request is
in flight; expired, replayed, unmatched and out-of-order samples remain rejected. Poll pacing
includes HTTP time instead of adding a fixed idle wait after every request. Direct WebRTC
retains its one-pending-request cadence and legacy envelope compatibility. No additional
server, provider or clock synchronization is introduced. See
[reliability correction](../RELIABILITY-CORRECTION-2026-09-20.md).


## Guided remote companion setup — September 20

The selected remote phone flow separates sensor permission, explicit connection,
confirmed placement in any orientation, pose ZERO and an explicit screen-wake
gesture. The local sensor owner keeps its existing wake-on-start default; only
the remote companion defers wake to the final action. Actual wake acquisition,
calibration and reciprocal fresh receipt are required for setup completion.
Numbers become checks from accepted step-specific evidence. Completed setup folds
away; data gaps show blank telemetry and delayed status without toggling transport
connection or replaying old values. Denial/release, invalid calibration and ended
sessions show corrective guidance; terminal pairing still requires a new QR.
Receiver RTT is request/reply time, not synchronized one-way delay; stale RTT is
not displayed as current. Phone telemetry renders only after setup; receiver live
rows exist only while the drawer is mounted. The optional TRACE cube mounts only
after setup and deliberate disclosure. No raw samples enter diagnostic reports.

## Any-pose ZERO correction — September 20

The owner's explicit correction supersedes portrait/holder gating for companion
setup. ZERO accepts any stable pose with complete fresh sensors; it does not require
car-axis calibration. Placement confirmation is separate from optional, default-off
aligned car motion in details. Relative magnitude and vertical rotation are labeled
as phone motion; forward/braking labels require actual admitted road values. GPS
retains vehicle acceleration fallback when car alignment is unknown. Keep the
500 ms settling window, eight-second deadline, 250 ms freshness, real wake lock
and reciprocal receipt. The later integration repair below supersedes the earlier
rule that cleared every completion check on transport delay. See the updated
[calibration contract](../PHONE-ROAD-INPUT-2026-09-19.md).

## Receiver integration repair — September 20

The receiver drawer reads the real session at a focused 20 Hz boundary, including
expiry wakeups; root motion metadata stays bounded to 1 Hz except connection/QR
transitions. Never feed a stripped App metadata snapshot to live readings. Closing
the drawer stops its timer without closing the session; reopening reads current
values, never a saved sample. Consumer sample access stays independent of UI state.

Completed actions are pairing-scoped history, updated only by accepted fresh status.
A transport gap retains those checks and the pending step, while current health,
numbers and reciprocal receipt still expire at 250 ms. Explicit received sensor
failure, new ZERO or wake release revises the affected checks. Terminal state or a
new QR clears history. Keep action guidance visible during subsequent status gaps.
These history marks never authorize sample use. See
[implementation, verification and physical retry](../PHONE-INTEGRATION-REPAIR-2026-09-20.md).


## Automatic direct path and calm telemetry — September 20

The owner's [stability correction](../PHONE-STABILITY-2026-09-20.md) authorizes
opportunistic host-only WebRTC inside the existing encrypted HTTPS pairing. Keep
one admitted owner, one optional RTC child and one serial relay loop. SDP must be
QR-key encrypted, attempt-bound and bounded; no new ICE service or media permission.
Only reciprocal evidence selects the direct path. Child failure wakes HTTPS without
resetting sensors/ZERO, and both paths expire at the original admission lease.

The owner reports that their Tesla drops the iPhone hotspot during poor phone
cellular coverage, switches to its own network and does not automatically return.
Treat shared Wi-Fi as optional; continuity must cover separate networks and
automatic recovery. The current cross-network path is encrypted HTTPS, not
Internet WebRTC. The owner requests testing the current release before changing
transport; traversal/relay reliability and latency remain future investigation.
See the [hotspot constraint](../PHONE-STABILITY-2026-09-20.md#owner-reported-hotspot-dropout-and-next-transport-investigation).

The later owner refinement separates readable historical telemetry from current
input: label the one-second display average explicitly, update at most 4 Hz,
deduplicate samples, and clear on generation/explicit invalidation/offline/terminal
state or one second without valid data. Never feed display averages to consumers.
Current input still expires at 250 ms. Preserve accepted POSITION/ZERO instructions
through gaps and fixed telemetry geometry; connection/wake copy must not alternate
on every packet deadline. This supersedes instantaneous number presentation, not
freshness, mutual receipt, GPS authority, Demo exclusion or physical acceptance.
