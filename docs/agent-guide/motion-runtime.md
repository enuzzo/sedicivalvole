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
relative motion plus allowlisted presentation/receipt context; GPS/Demo remains the sole speed source. Fresh zeroed rotation bends Aperture; audio does not consume it. The September 19 [road connection refinement](../PHONE-MOTION-HTTPS-2026-09-19.md) supersedes the prior direct-only and no-renderer-consumption scope. Keep 250 ms freshness, no clock subtraction across peers,
no raw histories, one-use QR admission and teardown on hide/disconnect.

The phone-only TRACE renderer owns bounded acceleration-space history; it never
integrates speed or overrides reference/sensor freshness. Screen wake has one
explicit owner with observable release/denial; hidden pages stop the connection
and cannot silently regain a valid reference.

Companion recovery must distinguish local sensing from an open Tesla transport.
Permission retry cannot restart pairing or reuse consumed QR admission. Setup
is bounded to 30 seconds (unused QR admission remains three minutes); hide,
offline and terminal peer states clear the pairing and require a new QR.
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
