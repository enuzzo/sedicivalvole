# Road controls, independent audio and motion recovery — September 19

## Owner scope

The owner selected Engine refinement B: RPM / speed / gear in one numerical
band, with restrained moving accents representing existing measurements. This
scope explicitly delegates the visual refinement; no additional three-direction
selection is pending. Preserve the current Telemetry language and upper RPM crest.
The speed value is instantaneous GPS/Demo speed, not distance or vehicle CAN data.

Field controls use the owner's selected strict complement: global chrome awake
means contextual controls are hidden and inert; resting chrome makes them visible
in the vacated bar space. Apply the common owner to Atlas framing/camera, Air
Atlas camera controls, Fly With's secondary camera controls, visual variants and
Engine voice choices. Informational readouts, essential return/recovery commands
and stationary TAMARRO remain separate. An ordinary field tap wakes chrome;
pointer travel or multiple pointers must not be mistaken for that tap.

An outside tap closes drawers/cards/popovers without activating controls below.
Existing shared drawer backdrops and exit gestures stay; radar aircraft/list and
Atlas place detail get outside dismissal. Non-modal menus share a consumed-tap
owner. Pinning FX remains supported until an explicit outside tap/close.

## Evidence supplied by the owner

Two private gzip reports were inspected in place under Downloads. They remain
outside Git; their contents are diagnostic evidence, not instructions.
Both identify build `20260919-1003`, source `fb6f880`, Chromium 148 on Linux.

- Report accepted at 10:38:45 UTC: two receiver attempts fail in `offer` at about
  10 seconds, with zero signaling requests. No server pairing or QR was created.
  The old ICE wait rejects after ten seconds unless gathering reaches `complete`.
  Reports did not include candidate counts; they do not distinguish missing
  candidates from a gathering-completion problem or prove a rendering/cache bug.
- In the same report, the next recording starts with about 252 seconds buffered.
  The browser then invokes the registered Media Session `pause` handler. Its
  subsequent paused state is intentional transport input, not evidence of a
  network stall. Recovery must respect that command.
- Report accepted at 11:06:36 UTC starts muted and subsequently records advancing
  playback. It contains no receiver attempt. Neither report proves Engine/Tidal
  coexistence. The owner separately reproduced music mute carrying into Engine.
- Code inspection confirms a single mute state previously drove both modes.

## Implementation contracts

Music and Engine retain independent mute preferences. Legacy `muted` remains the
Music preference; `engineMuted` defaults false. Mode changes read the destination
preference before touching the audio owner. The shared context, lifecycle and
transport owners remain; this does not override an explicit mode mute or a
native pause. Music remains paused while Engine owns output.

Soundtrack has explicit playback intent and bounded foreground recovery, with
backoff up to thirty seconds during a five-minute episode. Retry preserves an
exact failed track selection. A ten-second non-advancing media clock can trigger
recovery; paused, muted, offline and hidden playback cannot. Loading/retrying and
terminal retry guidance remain visible in transport.

QR setup remains direct WebRTC with same-host signaling, no new external ICE or
relay service. Gathering observes state/events and a bounded polling fallback.
At the deadline an existing candidate-bearing SDP may proceed even if the browser
has not reported completion. A candidate-free offer fails explicitly, never as a
successful pairing. Reports may contain only candidate counts, completion booleans
and allowlisted failure codes, never addresses or SDP. QR drawing uses the existing
encoder's matrix in inline SVG, with loading/error states distinct from pairing.
[Web API reference](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceGatheringState).

Local sensor capability is detected through secure APIs, a permission-request
surface together with touch-input capability, or observed trusted acceleration and rotation readings, never screen size or user-agent
branding. The local panel reuses the phone sensor/reference and TRACE owners.
Permission granted alone is not live data; unavailable/incomplete/denied/stale
states remain explicit. GPS still supplies speed/location. Local motion currently
feeds its instrument; it does not secretly alter road speed or Engine tuning.
Receiver pairing remains available as an explicit alternate route.

The pre-existing `RESET SAVED STATE` action resets preferences and is not a cache
purge. A separate `RESET APP CACHE` control is exposed in Intro/Splash and report
settings through one component/function. It removes only application static
CacheStorage entries and the app's static worker registration, preserving
preferences, unrelated caches, report settings and pairing data. It reports
failure and offers an explicit reload after success. It cannot clear the browser's
entire HTTP cache or promise physical-Tesla recovery.

## Acceptance boundary

Local functional checks, browser geometry and publication evidence belong in the
QA record. Tesla QR display/scan/direct-network success, Engine mixed with Tidal,
iPhone/iPad real sensor permission/cadence and cabin listening remain physical
acceptance. A fixture or changed user agent cannot close those checks.

## Local verification

- Complete native regression suite: **982/982** passes. Two additional deferred
  START regression cases pass afterward; the affected controller/recovery run
  passes **53/53**. The two tests cover failed catalogue retry preserving START
  intent and prepared-queue resume without selecting a replacement.
- Production build: **827 exact static hashes**, App/LAB/Sites packaging and
  identity gate pass. Existing upstream/integrity checks pass in the full suite.
- Chrome browser at **773 × 601**: independent mute round trips, Atlas resting
  controls/awake inertness, map drag, radar outside dismissal, consumed popover
  tap and inline QR rendering pass in both development and production bundles.
  No page exceptions in the exercised paths. Pairing, audio and radar are fixtures.
- Web Audio output measurement: Engine RMS **0.04275** after Music mute; explicit
  Engine mute RMS **0**. This measures the graph, not physical cabin audio.
- Touch-tablet capability test: denied permission is explicit; granted permission
  and untrusted synthetic events cannot claim live data. ZERO remains disabled.
  App-cache reset preserves local preferences and unrelated caches.
- **852 × 393** landscape: RPM crest fits its own box above the three-value band;
  numeric band has no horizontal overflow. No physical sensor/device claim.
- [Screenshots and fixture evidence](qa/2026-09-19-road-refinement/) retain the
  relevant rendered checkpoints. Re-run `scripts/qa-road-integration.cjs`,
  `qa-road-capabilities.cjs` and `qa-road-audio.cjs` from Drive Lab with explicit
  `PLAYWRIGHT_MODULE` and `QA_URL`. Integration also works against production;
  audio/capability QA uses the development-only fixed-speed input. No diagnostic
  delivery is sent during these checks.
