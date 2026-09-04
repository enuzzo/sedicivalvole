# Independent Technical Direction

This recommendation does not automatically adopt the bootstrap stack. It optimizes for a Tesla browser, deterministic audio, graceful degradation, and maintainability.

## Recommended stack

| Layer | Recommendation | Reason |
|---|---|---|
| Language/build | TypeScript + Vite | typed contracts and simple static output |
| UI shell | Preact or similarly small component runtime | maintainable state/accessibility with low overhead |
| Real-time audio | AudioWorklet | stable scheduling away from the main thread |
| DSP | JavaScript first; WASM only after profiling | avoids premature complexity and preserves fallback |
| Visuals | authored WebGL2 or Canvas2D per environment, with measured quality tiers and a shared fallback | rich generative fields without forcing one rendering technology onto every direction |
| Persistence | versioned IndexedDB for packs; localStorage only for tiny preferences | explicit migrations and bounded data |
| Offline | service worker after Tesla validation | resilient core without unverified PWA claims |
| Backend | none for core | privacy, simplicity, and offline behavior |
| Deployment | static HTTPS at the canonical root | required for Geolocation and secure APIs |

The current Product Design prototype uses React because it came from the verified template. That is an implementation fact, not a final stack decision.

## System boundaries

```text
GPS adapter ─┐
             ├─> normalized speed stream ─> signal model ─> mode coordinator
Simulator ───┘                                  │             │
                                               │             ├─> Engine audio + visual
                                               │             ├─> Flux audio + visual
                                               │             └─> shared analysis snapshot
                                               └────────────────> diagnostics
```

The audio clock is authoritative for musical events. Visuals consume derived snapshots and may drop frames without changing sound. UI state never schedules musical timing directly.

## Primary-mode boundary

```ts
type ExperienceMode = "engine" | "flux";
```

The mode coordinator owns selection and lifecycle, not signal acquisition. Both modes consume the same normalized speed samples, motion events, confidence state, and master safety envelope. They share AudioContext unlock, diagnostics, master Stop/Mute, output limiter, reduced-motion preference, and fallback policy.

They remain separate audio and rendering modules:

- **Engine** maps speed and derived acceleration into an explicitly synthetic RPM/load/gear-state model, then renders selectable engine timbres and an instrument-inspired visual system.
- **Flux** maps speed and motion into tempo, arrangement, harmony, timbre, space, and renderer-specific field parameters.

Switching should use a bounded equal-power crossfade or an equivalent click-free transition. The incoming mode may prewarm minimal assets, but inactive full DSP/rendering must not consume an unbounded CPU or memory budget. A switch must not recreate Geolocation, request permission again, or start a second independent AudioContext.

The mode selector must remain reachable and clearly show the active mode at the verified `773 × 601` split viewport. Its exact component anatomy and Engine visual language require Product Design exploration before implementation.

## Speed-source contract

Each source emits normalized samples and events rather than exposing browser APIs downstream.

```ts
type SpeedSample = {
  source: "gps" | "simulator";
  capturedAtMs: number;
  speedKmh: number | null;
  accuracyM: number | null;
  stale: boolean;
};

type MotionEvent =
  | { type: "brake"; strength: number; capturedAtMs: number }
  | { type: "source_changed"; source: "gps" | "simulator" };
```

Rules:

- accept `coords.speed` only when finite and non-negative;
- convert m/s to km/h once at the adapter boundary;
- treat null as unknown rather than zero;
- discard latitude/longitude immediately;
- gate optional position-derived fallback by accuracy and elapsed time, and never treat it as equivalent quality;
- use a monotonic local clock for filters and timeouts;
- simulator input gets an explicit source lease and hands control back to GPS only through a continuity gate;
- do not intercept keyboard events owned by focused controls.

## Reference motion model

The desktop Demo uses a transparent Model 3 Long Range AWD Highland reference rather than fixed speed increments. Tesla Italy publishes `4.4 s` from zero to `100 km/h` and a `1,824 kg` curb mass for the current Premium Long Range AWD: [Tesla Model 3](https://www.tesla.com/it_it/model3). Tesla's owner documentation lists approximately `1,823 kg` for the AWD configuration and notes that weights vary by options: [Model 3 dimensions and weights](https://www.tesla.com/ownersmanual/model3/en_cn/GUID-56562137-FC31-4110-A13C-9A9FC6657BF0.html).

The implementation integrates elapsed time at each Demo step. Its decreasing acceleration curve is calibrated to the official zero-to-100 time. The held-brake curve is a moderate blended estimate: `5,600 N` reference force against `1,824 kg`, with a `0.32 s` progressive pedal ramp and a low-speed taper. This is deliberately not presented as Tesla brake-system data.

Accelerator lift-off has its own nominal curve rather than reusing either service braking or a timer. It combines an estimated `1.7 m/s²` peak regenerative component with `0.10 m/s²` rolling resistance, reaches demand through a `0.45 s` jerk-limiting ramp, tapers progressively below `28 km/h`, and enters simulated Vehicle Hold below `0.8 km/h`. Tesla states that accelerator release slows the vehicle and returns surplus power to the battery, but that regenerative strength varies with battery temperature and state of charge; the vehicle may blend regular brakes when regeneration is limited: [Model 3 braking and stopping](https://www.tesla.com/ownersmanual/model3/en_us/GUID-3DFFB071-C0F6-474D-8A45-17BE1A006365.html). UN Regulation No. 13-H requires the braking signal above `1.3 m/s²` of regenerative deceleration and permits hysteresis to prevent flicker: [UN Regulation No. 13-H](https://unece.org/fileadmin/DAM/trans/main/wp29/wp29regs/R13hr2e.pdf). This threshold is a regulatory behavior boundary, not a measured Tesla curve; the `1.7 m/s²` value remains a transparent product estimate for a nominal warm-battery, high-regeneration state.

Holding `Space` takes a simulator lease from the exact displayed speed, emits one bounded Brake-onset event, and continuously integrates deceleration until release or standstill. Release holds the achieved speed for `0.55 s` before Demo acceleration resumes. If the hold began from GPS, the simulator returns to the live GPS stream after its bounded lease.

Holding `ArrowUp` applies the acceleration curve continuously. Releasing it, or pressing `ArrowDown`, changes the active drive input to regenerative lift-off without replacing the speed sample. If keyboard acceleration began from GPS, handoff waits until simulated deceleration converges within `1.5 km/h` of the latest filtered GPS speed; there is no fixed timeout and therefore no forced zero-speed jump. Automatic Demo deceleration uses the same lift-off curve.

GPS remains an observed source, never a physics simulation. Reference acceleration, ordinary lift-off, and wider service-braking envelopes define time-aware outlier bands before asymmetric smoothing. Expected acceleration/lift-off samples receive normal smoothing, plausible harder braking receives a faster response, and samples beyond the service-brake envelope remain bounded. The first valid numeric sample passes through directly, and null speed remains unknown rather than being inferred.

## Filtering and confidence

Use a pipeline with:

1. validity and accuracy gate;
2. outlier/reordering guard;
3. asymmetric smoothing (faster attack, slower release where musically appropriate);
4. deadband around tiny changes;
5. stale timeout;
6. source confidence/state;
7. a separate discrete Brake detector with cooldown.

Do not hide unavailable GPS behind a false zero. Surface `unknown`, `stale`, or `manual` in a calm, compact state.

## Multi-lane musical mapping

Never drive the entire experience from one “intensity” or “energy” variable.

- `tempo`: monotonic, knee-shaped, and saturating;
- `arrangementDrive`: private continuous orchestration/dynamics demand;
- `aperturePressure`: private renderer-specific depth response;
- `visualFlow`: separately filtered movement/depth response that continues to scale with speed after arrangement drive saturates;
- `confidence`: reduces risky reactions to low-quality input;
- structural state: bar-quantized layer/harmony/section decisions;
- transients: bounded acceleration, deceleration, and Brake envelopes.

A suitable family for bounded domain responses is a monotonic saturating curve such as:

```text
y(v) = y0 + (ymax - y0) × (1 - exp(-v / k))
```

Use hysteresis and dwell around structural thresholds. Quantize layer changes to beats or bars and crossfade timbral/ambient changes. High speed primarily increases depth, density, low end, timbre, harmony, and space rather than tempo.

## Audio architecture

### Engine direction

The browser currently provides speed evidence, not powertrain telemetry. Engine therefore needs a deterministic synthesis model with explicitly named derived signals:

- `rpmProxy`: speed plus simulated ratio/gear state, never labeled as vehicle RPM;
- `loadProxy`: filtered positive acceleration and sustained-speed demand;
- `liftEnvelope`: deceleration/lift-off transient;
- `shiftEvent`: hysteretic synthetic structural event, not a detected vehicle gear change;
- `engineModel`: user-selected timbral/sampling definition with provenance and license metadata.

Sample loops require phase-consistent crossfades, bounded decoded-memory use, click-free pitch transitions, and conservative limiting. Procedural synthesis may reduce asset weight but must win an actual listening test. Neither approach is preferred without a dedicated spike.

### Current Flux score engine

The current Drive Lab runs FRACTURE in a bundled AudioWorklet. A thin processor
owns the 128-frame render quantum, message port, mute ramp, and brake filter;
`src/score/score-core.js` owns the transport, arrangement, voices, bus effects,
and snapshots. The identical DSP core runs in Node for offline listening renders.

FRACTURE is one composition in F minor with ten four-bar sections. Production
playback uses drum, break-detail, bass, harmony, atmosphere, and transition
lanes; the former recurring theme (`riff`) and response lanes are hard-retired
from live arrangement goals and remain available only to the parked audition
harness. Its ambience-only launch, harmony, low-end/rhythm growth, voice output,
and brake level are checked rather than inferred. Continuous speed maps
to bounded arrangement drive, dynamics, timbre, and space; structural changes remain on
musical boundaries behind hysteresis, dwell, deceleration memory, and
crossfades. Tempo stays within `162–176 BPM`; high-speed power comes primarily
from interpretation and arrangement rather than playback-rate escalation.

The music registry separates `ready` from `preparing`. FRACTURE and JUNCTION are
ready; the remaining five directions are truthful disabled roadmap entries.
SOUNDTRACK's fixed-recording path is now connected as a production prototype.
A server-side catalogue relay keeps the Jamendo client ID outside browser code
and admits a bounded session-memory metadata snapshot only when it retains a
complete HTTPS stream/backlink, provider credit and effect-compatible licence
reference. Expired snapshots expose zero activatable entries. A separate
immutable previous/current/next model keeps
bounded recent track/artist identity, prefers a different recent artist when
possible, validates a queued target against the newest fresh snapshot, reports
displaced entries for later media disposal, and refills missing roles after
recovery without replacing the audible current item. It explicitly reports
metadata-slot depth, not browser-buffer bytes or offline duration, and never
changes back to PLAY THE ROAD when exhausted. A detached controller now maps the
three roles onto at most three direct-source media elements. The current deck
alone begins with `preload=auto`; adjacent decks start metadata-only. After the
current deck exposes at least `30 s` of contiguous forward buffer, only the next
role may promote to audio preload. The previous role keeps any
browser-owned buffer under its metadata hint and is rewound in place rather than
recreated. Every initial, manual, or natural-end target begins silently,
must satisfy a six-second contiguous floor inside the ten-second transport transaction,
is rewound, and becomes audible only then. The prior audible deck and committed
metadata survive a failed or pending target. The controller requires explicit
activation, rejects stale play/event completion, reuses retained roles, and
removes listeners and `src` before a displaced element is released. Readiness
and buffered-time values remain observations, never availability promises. A separate transition state now
models the nominal 450 ms equal-power skip on the audio clock. It preserves unit
squared gain through reversal or a third prepared target, rejects a fourth
simultaneous identity, validates all AudioParams before scheduling, and guards
completion by requested identity plus revision. A fail-closed attribution view
then derives primary and secondary credit from the sampled audible gains, keeps
all three identities during a rapid retarget, strips stream URLs, preserves the
licence/provider/direct-link obligations, and refuses playback eligibility when
any audible identity lacks complete credit. The admitted Jamendo record retains
normalized genre tags and one validated official Jamendo pace classification for
manual discovery; neither field enters vehicle-reactive state. A same-
origin exact-ID relay validates admission again and streams byte ranges with
`no-store`; it never writes a hosted copy. The App and LAB map the three roles
onto transient media elements and a MediaElementSource graph. A separate playback
boundary fixes every recording at authored `1×`, prevents driving from selecting
or retiming it, and divides processing into two explicit families:
the footer-gated braking UNDERWATER path and eight manual performance effects.
Playback, current-track attribution,
direct source navigation, transport, and both effect families are visible in the
App and LAB. The running Music drawer owns two persistent horizontal top
selectors for Play the Road / Soundtrack. Play the Road follows the owner-
selected Generated image 35 hierarchy: sampled JUNCTION and NIGHTSHIFT share
the first row, while responsive-generative FRACTURE occupies the full-width row
below. Its Soundtrack branch gives equal hierarchy to
the artist-owned Lobo Playlist and the filterable Jamendo Library, places Pace
in a three-item vertical rail beside the readable `5 × 3` genre grid, uses a
stable half-hour shuffle, and treats pace, genre, and exact-track gestures as
explicit immediate play requests. Now Playing animation follows real playback,
and credits reserve a separate QR column. The main App master affects only audio processing: macro detection
and visual response continue independently. When Soundtrack owns the shared
playback-oriented AudioContext, braking detection runs without constructing
the Play the Road score worklet; an explicit Play the Road switch promotes
that processor lazily. A muted inactive score renderer is still real-time DSP
and must not compete with the fixed-recording graph on the Tesla browser.
Jamendo metadata remains short-lived
and its audio remains non-persistent; owner-authorized Illobo web masters are
hosted deliberately without creating a browser offline store. The unqualified
controller load normalizes to Jamendo `library:all`; the Illobo button requests
`featured:signal-border` through a separate static catalogue of 29
owner-authorized recordings. Catalogue cache reuse includes source kind and
identifier, so an Illobo gesture cannot reuse Jamendo entries. Each explicit
Featured gesture rotates the complete Illobo set to a random non-current start
while preserving stable 30-minute ordering. The target media instance is
recreated for that explicit playlist gesture, so randomness selects a track but
never a timestamp: playback begins at `0:00`.
The production deck now performs the nominal `450 ms` equal-power queue commit,
including reversal and third-deck retargeting, and derives every visible credit
from the same audio-clock gain vector. Its compact QR opens the current public
content page rather than the no-store stream relay. Two byte-identical supplied
Illobo SVGs are stacked on an unclipped square dark field and crossfaded by CSS
on a continuous eight-second linear cycle. Each full transition takes four
seconds with no static hold. The solid SVG retains its white-on-black state;
the outline retains its original black paths on a 40-percent-paper graphite
field. Recolouring both states identically is prohibited because it makes their
shared glyph geometry appear static. No React timer state or path mutation is
used. A pure bounded formatter derives the active
Soundtrack document title from admitted artist/title metadata only while status
is `playing`; all other states restore the fixed product title. Canonical
publication and target-Tesla tuning remain later boundaries.

JUNCTION is a 192-bar rendered production: eight adaptive performance states each
have three complete takes, giving 24 clips from 76 distinct recordings in one
5.8 MB segmented Opus resource. Every clip uses one stable
`Emin9 – Cmaj7 – Amin7 – Bmin9` identity and prints its compatible atmosphere,
harmony, bass and break layers offline. Automatic rave lead/melody and a tonal
second deck are absent. Each
section carries its own native tempo and duration: ambient rest at 127 BPM has
no rhythm or bassline; a quiet 127 BPM break enters near 13 km/h, followed by
135, 158, 164 and finally 168 BPM recordings as arrangement demand rises. The urban
mapping deliberately holds 127 BPM at 40 km/h, 135 BPM at 60 km/h, and does not
enter 158 BPM until above approximately 65 km/h. The browser
lazily retains no more than six individual clips and schedules one complete,
self-contained performance at a time. A deterministic bounded filter/delay
stage follows it; compatible take selection occurs only at a complete eight-bar
boundary and avoids immediate primary repetition. Each performance owns a
separate runtime transition bus. Moving from
beatless rest into a rhythmic section ramps that bus over four seconds; deciding
to return to rest releases it toward a near-silent floor over the same duration,
then recovers the ambient section gently. Re-acceleration cancels the release
and restores the current section without restarting its phrase.
The original sample-pack files never enter the build.

Source-harmony qualification is a separate offline boundary. The current
pilot scans only the eight chord hits reachable by that four-chord grammar,
hashes and segments the original files in place, estimates tuning, and records
Basic Pitch output as high-recall proposals. A filename remains declared
metadata, chroma is visual evidence only, and both the authoritative pitch set
and chord label stay unknown. The temporal residual is retained only as
descriptive review data and is absent from classifier input: adding F-sharp2 to
the known-truth collision fixture falsified its earlier threshold. A separate spectral pass enumerates
possible source fundamentals directly from each disputed upper component,
without depending on the proposer, but remains review-only because magnitude
cannot distinguish an aligned partial from an independent voice. It records the
calculated source hypothesis separately from the measured peak frequency. A
separate selection audit mirrors the renderer's exact index arithmetic and now
proves that its 24 performances all reach only index zero for every chord label;
the unused files remain excluded until they form a compatible registral deck.
An audio-only pass measures 63 printed chord boundaries without consulting pitch
proposals and keeps its first thresholds uncalibrated and flag-only. The next
decision layer requires explicit abstention plus independent stereo and phase
evidence. Reports and the Python environment live under ignored development
paths and cannot enter the production resource.

All ready scores feed one post-score performance bus. UNDERWATER is the sole
vehicle-reactive gesture: firm braking drives one bounded two-stage perceptual
low-pass/pressure envelope shared with Soundtrack and with every visual. The
audio graph retains no acceleration filter chain or reactive launch worklet,
and no acceleration detector/timer runs. OPEN and BLOOM remain historical Git
evidence only.

### Flux sequencer direction

The synthesis-first boundary is implemented. The next extension is a sampler
that preserves the same contracts:

- immutable score data grouped into phrases and sections;
- independent musical lanes and queued changes at musical boundaries;
- stable AudioWorklet transport with sample-accurate step timing;
- separately authored sound, pattern, harmony, and arrangement data;
- bounded decoded-memory use, click-free playback, shared effects, and limiting;
- only mixed, processed music packaged as a playable resource; a proprietary
  container is not treated as protection for redistributable source samples;
- no time-stretching of break loops: select material recorded at the active
  native tempo instead.

Deceleration uses a three-stage state machine: `catch`, `recovery`, and `sustained_release`. The catch window preserves tempo and principal groove through brief braking. Recovery cancels queued exits when speed returns. Sustained release removes detail lanes on musical boundaries and only then eases tempo downward. State changes use asymmetric dwell, retained peak-demand memory, hysteresis, minimum scene tenure, cancellable queues, and crossfades. See [`REFERENCE-STUDY-TEXTSTEP.md`](REFERENCE-STUDY-TEXTSTEP.md).

### Shared production direction

- one AudioContext created by an explicit user gesture;
- AudioWorklet for timing-critical synthesis/sequencing;
- bounded voice pool and reused buffers/nodes;
- deterministic parameter queue keyed to audio time;
- master limiter with conservative headroom;
- worklet capability fallback to simpler main-thread scheduling or sample loops;
- suspend/resume handling and explicit audio-state display;
- performance counters that do not include personal location data.

Profile before adding WASM. It is justified only if measured DSP cost, not fashion, requires it.

## Flux visual architecture

The Flux renderer exposes six selectable environments, not static backgrounds.
**Modular Aperture** was selected from exactly three revised minimal alternatives:

- central-axis depth and flow;
- outward vanishing-point travel at speed, with a non-linear flow ceiling and a near-planar zero-motion state;
- one shared procedural cell field whose coordinates interpolate geometrically from a flat square mosaic into tunnel space, with no scene-opacity crossfade;
- a complete seam-free zero-speed tiling of large squares with deterministic, even four-color distribution and no disabled cells;
- pressure-driven module compaction separated from speed-driven coordinate warping, with renderer-side velocity smoothing for continuous acceleration and deceleration;
- aspect-correct square insets at rest, an eased low-speed warp, a bounded central perspective singularity, and a continuous blend between adjoining tunnel walls so intermediate geometry cannot tear into diagonal fragments;
- a central aperture whose radius opens geometrically with tunnel formation instead of appearing through opacity;
- speed-driven radial panel elongation and reduced depth frequency in the 150 km/h velocity band;
- ten curated palettes for all six renderers; Vertigo's external bridge updates only existing runtime colour channels;
- road-response-driven pressure, luminance, distortion, and rectangular panel density;
- aggregate pulses rather than one flash per audio event;
- renderer quality levels controlling resolution scale, shader complexity, passes, and frame rate;
- context-loss recovery;
- reduced-motion mode with slow luminance/chroma breathing and no tunnel acceleration;
- a continuously redrawn Canvas2D fallback.

**Plumb** reached a local Canvas2D prototype after the later PLUMB / SLIP / WAKE
gate, but its exact-viewport review triggered the direction's strings/bars
retirement rule. It was rejected before publication and removed from the active
renderer, QA harness and tests. Aperture remains the safe accepted default.

**Vertigo** was selected as the second environment and now runs the complete upstream Interstate 7 scene from commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e`. The vendored runtime retains the original road, instanced side light sticks, opposing instanced car-light tubes, fog, bloom/SMAA post-processing, deep-distortion shader injection, camera look-at distortion, and geometry. SHA-256 tests guard the vendor files against accidental edits. The external integration hides the editorial shell before revealing the iframe and maps themes onto existing colour buffers/uniforms. The earlier independent shader and Canvas2D interpretation were rejected and removed from the active source.

**Meridian** is an original low architectural corridor. One
depth-parameterized displacement field controls geometry and camera aim while a
monotonic travel clock moves sparse large oblique blades, broad shoulder screens
and three solid longitudinal bands without coupling motion to frame rate. Speed
raises FOV, depth compression, peripheral stretch, parallax and optical flow;
vertical excursion stays tightly bounded. Conventional buildings, stacked
towers, high cloud slabs, scene-wide particles and wireframe grids are absent.

**Atlas** is a lazy-loaded OpenFreeMap/MapLibre city field. It owns a minimal
vector style rather than inheriting a generic street-map skin, extrudes building
height from the OpenFreeMap planet source, and maps speed to pitch, zoom and
camera response. Its upper-speed camera curve is compressed rather than allowed
to approach a flat plan: at `130 km/h`, zoom remains `14.65` and pitch `55.5°`.
Every trusted fix recenters the map. Device heading owns the bearing when
available; otherwise a displacement of at least three metres between fixes
derives it, while smaller jitter preserves the last reliable direction. A
reliable Geolocation point is held only in session memory.
A3 has a rendered motion foundation: at most eight monotonic
timestamped fixes remain in session memory, and a `100 ms` delayed sampler
interpolates latitude, longitude and the shortest heading arc independently of
render frame rate. It never extrapolates, freezes after `1500 ms`, and refuses
to animate across gaps above `750 ms`. Trusted coordinates feed the bounded ref
at GPS cadence even when `coords.speed` is null, without driving app-wide React
state at that rate; the first map/camera fix is immediate and later camera
updates remain at `2500 ms`. The MapLibre point source renders one pulsing point
at the interpolated route head; its one-second ripple uses one data-driven
source update at `8 Hz` rather than repeated style mutations. A bright route
retains the current ATLAS-view trip through origin-preserving bounded
compaction. On high-density displays, only the map framebuffer is capped at
`1.25×`; product text and controls retain native resolution. World copies are
disabled and obsolete zoom-tile requests are cancelled. The cap is a measured
response to repeated `23 FPS` real-Tesla ATLAS evidence and still requires a new
target report to prove the deliberate `30 FPS` ceiling.
A3b reads a bounded label only from the map's already rendered
`transportation_name` features and never introduces reverse geocoding; A4
partitions normalized heading into eight deterministic English cardinal
sectors. The selected Navigator Plaque wires both contracts into one compact
overlay beside exact degrees and the official filled Tabler navigation icon.
Its display heading is continuously unwrapped before the CSS transition so a
`358° → 2°` update advances to `362°` instead of spinning backwards. A
zero-opacity rendered line probe keeps road lookup inside the existing vector
tile pipeline without adding visible map geometry or a network service.
The same owned style exposes two normalized paint profiles. `palette` derives
the basemap from the selected product theme. `standard` supplies dark semantic
expressions for OpenMapTiles land-cover, land-use and transportation classes,
plus blue water and warm height-interpolated buildings. A paint-only update
changes those layers without `setStyle`, source replacement, renderer teardown,
camera reset, or route loss. Product accent/secondary channels continue to own
the trip line, marker, Navigator Plaque and Drive Lab in both profiles.
The Drive Lab reuses one density-capped Canvas2D surface. Its Direction History
partitions moving samples into eight fixed `45°` sectors and draws at most five
annular tiles per sector relative to the strongest share. Session compaction
sums the eight-bin histogram inside every rollup, so the display never derives a
false sector from an averaged circular heading. Samples below `2 km/h` are
excluded from the distribution, while the latest bearing remains a separate
needle. The same two-second journey cadence drives the remaining proportional
speed strip, Accel/Braking history, terrain trace and Moving/Stopped strip; no
continuous chart animation or additional renderer is introduced.
The selected map necessarily requests the surrounding tile area from
OpenFreeMap; a `0.05°`-quantized cell is sent to the localized Wikipedia Geosearch
API only when the cell changes. The same response supplies each page's concise
introduction and, when available, a free-license PageImages thumbnail; no second
content request is needed when the passenger changes selection. Up to four nearby
pages and one selected QR are rendered for the passenger. No coordinate enters
local storage, diagnostics or the explicit diagnostic email.

DISCOVER reuses the same ephemeral position boundary outside permanent ATLAS
chrome. The selected split surface owns a left index and always-open reader.
It enters the shared Visual catalogue as destination `07`, not as a renderer:
the launch grid therefore contains eight primary choices, starts the normal
Aperture runtime behind the passenger surface, and the running Visual library
can reopen it without replacing or persisting the active field.
The browser's first supported language selects the Wikipedia host automatically;
an explicit selector can choose among 14 supported languages without storing a
preference. One bounded continuation loop performs at most four requests,
deduplicates pages by identity, and stops at 15 normalized coordinate-bearing
results. Five remain visible before the `+N MORE` control expands the existing
scroll rail. Nearby/Region vary radius; Ahead ranks against the session heading
and falls back to the closest set when too few results lie inside the forward
cone. Search is local over the admitted title/summary fields. Haversine distance
and a documented local road-factor heuristic supply an approximate ETA; the
official Google Maps directions handoff intentionally omits origin so the Maps
client can use its own current location. No route estimate is presented as live
traffic or API-derived navigation evidence.

**Register** is rejected and archived outside the active runtime. Live review
found its deterministic Swiss-print page static, inexplicable and outside the
driving mood even after boundary and acceleration responses were added. The
archived source is evidence, not a roadmap commitment. The required replacement
gate has now happened: PLUMB, SLIP and WAKE were the three presented directions.
PLUMB was rejected after its first local prototype; WAKE was selected and
implemented, then rejected after repeated live review, while SLIP remains
proposal-only.

**Wake** is retired. Its ribbons ultimately read as disordered rain rather than
a convincing authored 3D field. The catalog entry, WebGL2 renderer, Canvas2D
fallback, tests and current QA captures are removed; only historical Git and
dated decision evidence remain.

**Drivey** embeds the actual Rezmason Drivey runtime at commit
`5104cdade2a3158786b05b9b0680a50e942830cf` in a same-origin iframe. Fifty-one
upstream files remain byte-identical under a SHA-256 manifest and continue to
own the road, levels, traffic, generated cars, cameras, materials, post-processing
and rendering. The separate sedicivalvole shell and parent bridge clamp road
speed, music level, reduced motion and performance state, instantiate the
upstream automatic `Input`, remove only the player car's random weaving, and map
each theme's native `accent` and `secondary` colours onto separate material
channels. A project-owned response mapper turns bounded scalar input into
scalar/vector scene output with authored endpoints, curve exponent, asymmetric
attack/release and hard per-second slew limits. Drivey is its first visual
consumer; it also receives the timestamped UNDERWATER envelope used by audio.
At commanded zero the bridge projects the
player to the current lane centre, aligns it to the road tangent and clears
velocity, steering and physics state. It asks upstream for 16 generated NPCs,
then retains them only if all can be placed and verified opposite the player's
road direction; any unavailable or ambiguous lane metadata fails closed to zero
traffic. No vendor file is changed. It exposes only Hood, Rear and Aerial views plus Normal/Wire rendering.
Two compact text-only controls cycle those
states directly; they open no contextual panel and never edit the vendor tree.

**PRTCL** is a project-owned WebGL2 point renderer around directly authorized
adaptations of the Fractal Frequency and Axiom formulas pinned at PRTCL commit
`2a22f33b`. Murmuration is temporarily excluded from the active product. The
renderer uses `gl_VertexID` rather than CPU buffer rewrites, draws exactly
`24,000` or `37,000` points, caps DPR at `1.25`, and
deletes its vertex array, shaders, and program on cleanup. The renderer imports
no Three.js/R3F dependency or PRTCL runtime/UI/asset. Road speed alone controls
complete-form scale, point scale, depth, and the frame-rate-independent travel
clock; score level controls palette interpolation and pulse. UNDERWATER
attenuates and slows through a continuous frame-rate-independent envelope rather
than a state snap. Reduced motion freezes both travel and musical pulse. A single `94 × 48 px` text-only
TYPE button cycles the two active families; shared Palette remains independent and
no contextual panel is created.

The fixed road-speed mapping separates early recognition from maximum deformation. Aperture begins opening into recognizable tunnel space by approximately `40 km/h`; velocity, perspective, elongation, and travel then continue increasing until the shared `130 km/h` ceiling. Vertigo uses a narrow external bridge rather than new scene mathematics. It enters the untouched distortion at a composed `2.1 s` phase where the road already fills the Tesla viewport, and seeds the current motion/FOV controls before the iframe is revealed. Road speed follows a quadratic response through the original `speedUpTarget` path: zero cancels the base clock, `40 km/h` uses approximately `0.095×`, `60 km/h` approximately `0.213×`, and `130 km/h` restores the original non-boosted `1×` rate. The original FOV range still moves from `90°` to `150°` through that same curve. The upstream click boost is not dispatched.

Environment preferences preserve every valid implemented selection. Missing,
retired or invalid identifiers—including PLUMB—safely resolve to Aperture.
Interface appearance is a separate versioned preference with explicit reset;
it never shares storage identity with the active visual palette. Its pure X10
model resolves manual LIGHT/DARK directly and lets AUTO prefer a verified
`prefers-color-scheme` signal. A network-free solar fallback consumes only the
current ephemeral position and UTC time, classifies day/twilight/night, and
holds the current family through twilight or active interaction. No coordinate
or solar result is persisted. The running adapter applies LIGHT by default and
persists explicit LIGHT/DARK/AUTO choices through safe storage. AUTO treats the
system signal as authoritative only when a working change subscription proves
it is observable; otherwise it consumes solar phase only after the existing
session GPS flow has already produced a consented position, and falls back
without requesting permission. Semantic `data-appearance` tokens recolour only
product chrome, while `data-palette`, authored renderers, iframes, and map pixels
retain independent visual ownership. The direct top-rail menu uses the pinned
official Tabler sun, moon, and sun-moon assets and follows menu-radio keyboard,
Escape, outside-dismissal, and focus-return behavior.

The Flux chrome uses a shared 6 px UI radius for framed controls and diagnostic surfaces. The owner-selected **Tesla Compact** refinement separates type from interaction geometry through one semantic scale: `13 px` metadata, `14 px` labels, `15 px` body/action copy, `17 px` active names, `22 px` titles, and `32 px` primary values. Metadata remains high contrast, live values use tabular numerals, discrete action targets use at least `48 px`, and primary actions use `56 px`; no universal type floor may flatten this hierarchy. At `773 x 601` the retracting navbar, lower Now Playing band, and footer are each `64 px`. The owner-approved **Tesla Balanced Rail** keeps the 16 Road mark first, uses speed as its sole two-line numeric hierarchy, and aligns all remaining icon-only or icon-plus-name controls as equal peers on one central baseline. Network exposes only a three-state ring and genuine loading motion until opened; its popover owns current app-only transfer values and a bounded 15-minute quality history. MUTE and FX keep equal tracks and direct `LABEL / ON–OFF` anatomy while obsolete `GLOBAL` and active-count microcopy stays hidden. The palette's `5 × 2` swatch board fills its assigned footer cell. Structural rails remain aligned to the underlying grid. Functional labels stay uppercase, while editorial Visual, Music, mode, and effect names use separate Title Case display labels in the launcher, footer, and pickers. Stable identifiers and canonical registry labels remain unchanged. The lower Now Playing overlay follows every committed fixed-recording identity on unobstructed visual surfaces and combines artwork with `48 / 56 / 48 px` previous/play-pause/next targets; it is not mounted while a passenger drawer or DISCOVER is open, nor in ATLAS. ATLAS therefore expands its Drive Lab panel from the chrome insets to the complete `601 px` field as chrome rests. Stable Media Session handlers live for the session and dispatch into one serialized, cancellable transport queue. Closing a drawer releases restored trigger focus to the experience, allowing the idle timer to retract top and bottom chrome. Contextual Drivey, PRTCL, and Gradient controls use the same `6 px` radius and retract with chrome until the next screen touch.

The Codrops/Tympanus Infinite Lights reference is useful for coordinated instancing, depth cues, distortion, FOV response, eased speed offset, and the matched distortion/look-at relationship. Vertigo intentionally vendors the byte-identical Interstate 7 runtime as separately licensed third-party material. Meridian studies its mechanical grammar without copying that runtime's source or visual skin. See [`REFERENCE-STUDY-INFINITE-LIGHTS.md`](REFERENCE-STUDY-INFINITE-LIGHTS.md).

The renderer consumes a small snapshot and never blocks the audio event queue.

The former project-owned `GRADIENT 08` renderer is retired and deleted. A legacy
saved selection migrates to the Japanese Mist variant.

`GRADIENT 08` is one public ShaderGradient family with Japanese Mist, Acid
Orchard, and Chromatic Silk variants. One shared registry contains the
exact owner-selected LAB starting-point props; one lazy field imports the exact,
unmodified `@shadergradient/react@2.4.20`, React Three Fiber, Three.js,
three-stdlib, and camera-controls production stack only when one of the three is
selected. The main entry therefore does not parse or execute that renderer for
the other visuals. The primary catalogues expose one family entry and a
persistent in-visual control cycles the three variants. Idle animation runs at half each starting point's base rate;
road response reaches the previous endpoint at `130 km/h`. Play the Road admits
bounded Play the Road audio-level response, Soundtrack passes zero audio response, and reduced motion
sets motion to zero. UNDERWATER alters the registered native parameters without
adding a shared overlay. A project-owned Canvas2D fallback,
error boundary, explicit frame telemetry, and no remote HDR dependency bound the
runtime. The truthful speed readout remains independent above the response
ceiling.

`shadergradient-lab.html` remains the standalone development workbench and the
same reusable workbench remains selectable inside the authenticated protected
LAB. Both keep the exhaustive controls and exact registry. The upstream MIT
notice is retained; no upstream package source is copied or modified.

## Engine visual architecture

Engine may use an abstract tachometer, throttle/load arc, acceleration trace, mechanical light field, or related instrument-like motif. It must not collapse into a generic dashboard, imply unavailable telemetry, or copy a protected vehicle cluster. The next Product Design gate is exactly three Engine-specific directions; no final palette, instrument anatomy, or motion grammar is selected yet.

Flux may incorporate procedural road-like flow only as abstract WebGL geometry or light/depth structure. It must not reintroduce scenic landscapes, illustrative environments, or visually distracting narrative decoration.

## Control-state model

Controls have explicit states: `awake`, `resting`, `parked_configuration`, and `reduced`. In `resting`, the footer and secondary header controls retract while the compact 16 Road mark and speed readout remain visible. No synthetic response percentage is shown. The first interaction reveals the layer without mutating a value. Stop/Mute remains immediate once the layer is awake. Sliders use large physical targets, clear active/focus states, and accessible names.

## Splash as bootstrap

The approved Signal Gate splash is a dedicated lightweight WebGL2 shader with a Canvas2D fallback. It renders paired red and ice-blue lanes that curve into a narrow central gate. A stable per-lane phase varies the position, cadence and length of short travelling gaps across both sides, preventing adjacent interruptions from forming a false crossbar. Eight low-opacity asymmetrical perspective rays add restrained airflow toward the display. The field freezes while the splash fades so no hidden animation loop survives in the running experience. The compact flat launch surface contains the selected 16 Road mark beside the Orbitron textual wordmark and the white-to-red travelling Space Grotesk `PLAY THE ROAD` command; simulated appliance controls are explicitly excluded. It represents real work:

1. a user gesture unlocks audio;
2. minimum assets are verified/decoded;
3. capability state is measured;
4. the Signal Gate fades into the selected live Flux scene.

Do not add artificial delay. Return visits may compress the visual sequence, but cannot bypass a newly required audio gesture. Inject version from `VERSION`; never copy it manually.

## Persistence and offline

- store only non-sensitive preferences by default;
- never persist coordinates or a raw route;
- use versioned IndexedDB records and migration tests for future packs;
- define cache version, byte budget, corruption recovery, and update flow;
- provide a visible offline-readiness indicator before relying on it;
- do not promise PWA installation until the Tesla browser proves support.

## Pack contract requirements

A future pack needs:

- strict versioned JSON Schema;
- explicit units, ranges, defaults, and compatibility version;
- content hashes and per-file provenance/license metadata;
- compressed/decoded memory budgets;
- migration and partial-failure rules;
- fixture tests and safe rejection of unknown executable content.

## Testing gates

### Deterministic desktop

- speed normalization, null/negative/outlier handling;
- smoothing, deadband, stale state, and source lease;
- tempo/road-response saturation;
- hysteresis/dwell and bar-quantized structural transitions;
- Brake envelope/cooldown;
- audio unlock/resume and safe failure;
- renderer fallback and reduced motion;
- rejected-renderer exclusion and safe Aperture fallback;
- package/build integrity.

### Target Tesla

- viewport/DPR/touch reach;
- Geolocation availability, cadence, null rate, and accuracy;
- AudioContext/AudioWorklet behavior and output latency;
- frame pacing, context loss, thermal stability, and long session;
- permission denial, network loss, cache reset, and background/minimize behavior;
- audible balance against real vehicle alerts.

## Diagnostic harness and data handling

The first vehicle evidence confirms a `773 × 601` split-view CSS viewport on a `1254 × 784` logical screen at DPR `1.53`. The integrated v4 report records viewport history, runtime/GPU/audio details, bounded GPS statistics, aggregate canvas frame pacing, long tasks, page/resource timing, memory/storage hints, connection changes, and a chronological event log. Phase telemetry separates the Signal Gate, active Visual/Music combinations, the Aperture `0–40 km/h` wall-retreat band and the session-report-open state; a returning phase begins a new continuity segment so time spent elsewhere is never counted as one slow frame. Each phase owns bounded frame distributions and two-second memory samples for browser-exposed JavaScript heap, JUNCTION's compressed bank and decoded PCM. A coordinate-free flight recorder adds a two-second trace of displayed and raw GPS speed, GPS confidence, input, BPM, active Visual/Music, JUNCTION section/harmonic identity/single take/rhythm transition/bank readiness, real output RMS/peak, frame pacing, network state, and document visibility. It intentionally excludes renderer and arrangement response scalars. It also summarizes the unique musical and visual exposure across the session. The event stream samples ordinary GPS evidence at two-second cadence while retaining null or low-confidence anomalies immediately, which prevents ten-hertz GPS traffic from evicting meaningful transitions. An isolated accuracy collapse above 250 m is recorded but does not command the smoothed experience. The recorder keeps 300 trace samples (approximately ten minutes) in session memory while full-session time, distance, motion, source, and input aggregates continue beyond rotation. Runtime errors, unhandled rejections, and WebGL context loss/restoration are separately bounded. High-frequency metrics accumulate outside React state so diagnostics do not add a per-frame render cost. The report contains no coordinates and disappears when the page closes or reloads.

Network observability keeps browser hints and application evidence structurally
separate. `navigator.onLine`, effective type, downlink and RTT remain estimates;
resource bytes come only from exposed completed Resource Timing entries, while
upload bytes and active direction counts require an instrumented app request.
The REPORT derives a deterministic notice status for offline, unrecovered
failure, transfer, recovery, constrained estimate, quiet online or unavailable
evidence. It never claims device-wide throughput, RSSI, opaque/cache bytes or
unrelated vehicle traffic. X2 still owns the eventual navbar presentation.

Aperture keeps its existing square palette, perspective tunnel, flow and terminal
behavior. The former full-frame morph evaluated flat and perspective coordinates
for every fragment. The replacement treats the opening grid as one rigid end wall:
at rest it covers the viewport and uses only wall shading; from `0–40 km/h` it
recedes intact while revealed pixels use only the existing tunnel path; at `40 km/h`
it disappears at the terminus. The complete retreat uses one physical pixel per
CSS pixel rather than Tesla DPR `1.53` supersampling capped at `1.25`. At
`773 × 601` that also reduces the render target from approximately 725,000 to
465,000 pixels per frame (36%); the exclusive shader paths remove the former
double coordinate evaluation as well. Above `40 km/h` the existing 1.25 cap remains.

The user explicitly approved a same-origin PHP send endpoint with a fixed private recipient and extensive technical reports after an explicit send gesture. It rejects cross-origin requests, oversized or malformed payloads, and common coordinate keys; applies a hashed temporary per-client rate limit; persists no report; and exposes no FTP credentials. Before submission, a deterministic recent-first fitter records original/transmitted counts and trims only if the pretty-printed report would exceed the mail budget. The endpoint forces shortest-round-trip float serialization because provider-level PHP precision settings must not expand compact telemetry decimals after fitting. The accepted schema/report envelope is then encoded as one gzip-compressed JSON attachment; the compact multipart body records its name, byte counts and SHA-256 digests, avoiding email-client preview clipping while preserving a verifiable complete artifact. Failed sends preserve the in-memory recorder for retry and expose only sanitized reason codes. PHP `mail()` acceptance is local transport handoff, not inbox-delivery proof.

The calibration surface is implemented as an owner-only application packaged
for canonical `/lab/`, not security by obscurity and not part of the public
driving flow. A
PHP gate authenticates an ignored password hash, issues an expiring secure
session cookie, protects the LAB document, assets, preset-mail route and logout,
and validates CSRF, same-origin requests, rate, payload size and schema at the
server boundary. Client JavaScript never receives the password, hash, recipient,
or an authentication decision it could bypass. The same app remains runnable
locally for engineering work without weakening the canonical gate.

LAB presets use `sedicivalvole.control.v1`, the same versioned transport-neutral
`param`/`command`/`state` protocol intended for later passenger clients.
One export records app/version/build/commit/time, viewport and bounded runtime
context, active visual/theme/input source, speed/manual audio level, grouped
`form/response/macros`, every declared scene parameter, protocol revision and
render-health snapshot. Music is an independent disposable test source with
MUTE plus the currently available generative and sampled scores; it is never
stored in, restored from, or associated with a visual preset. `COPY JSON`, import
and explicit `SEND JSON` all operate on that identical visual-only validated
object. The mail route reuses the existing private
recipient boundary where appropriate, sends a digest-verifiable JSON attachment,
retains failed presets for retry, and reports transport acceptance rather than
inbox delivery. Coordinates, credentials, storage contents and unrelated device
or network activity are prohibited from the LAB envelope.

The selected LAB presentation is **Focus Canvas**: a dominant live renderer,
one compact four-group rail, one retractable inspector, three project macro
controls and a low speed/audio-level/preset action plane. The first declared
manifest covers all three PRTCL families and 18 bounded visual/test options.
Scene calibration is an
optional project-owned layer, so the public PRTCL defaults remain unchanged
when no LAB values are supplied.

## Deployment

Build output is static. During the current private development phase, user-approved builds are published to `https://sedicivalvole.app/`. The FTP channel is passive port 21 and therefore unencrypted. Every deploy must keep secrets out of commands/logs, upload assets before the entry point, and verify canonical HTML/assets/version/cache behavior after publication.

## 2026-09-04 Astra semantic foundation (UI integration pending)

The office audit and full remaining ledger are in [ASTRA-UI-AUDIT-2026-09-04.md](ASTRA-UI-AUDIT-2026-09-04.md). A cached semantic colour resolver now covers all ten palettes, both appearances and fifteen critical roles, with a reproducible raw/resolved contrast matrix. It is not yet connected to product components: no corrected UI or complete browser regression is claimed. The foundation passes 625 automated checks including Sites 9/9 and the real PHP fixture, plus the exact-toolchain ARM64 production build. The shared Dropbox dependencies contained stale Vite/PostCSS; the verified build used an isolated temporary dependency cache without rewriting that tree. Direction selection and the requested headless-browser fallback answer are pending in this same task; canonical deployment remains withheld.

## 2026-09-04 semantic integration and chrome lifecycle

The integration-pending foundation above is superseded by
[the verified refinement](ASTRA-UI-VERIFICATION-2026-09-04.md). `semantic-theme.js`
now provides cached CSS variables to the app and opaque chart colours to ATLAS.
Sixteen roles separate neutral text, accent text/fill ink, inverse selection ink,
focus/boundary, chart series, indicators, effect fill/ink and status colours.
Raw renderer palettes remain separate. The integrated CSV contains 320 variants;
rendered browser checks also composite actual backgrounds for 180 text pairs.

`footer-stack` owns the sole footer/transport transform and inert state. Open
surface state, not focus, pins chrome. Unpinned activation/closure retracts on the
next animation frame; a deliberate new wake cancels obsolete queued dismissal.
The idle deadline is six seconds. Motion suppresses unpinned chrome even on taps.
Menu closure returns focus to the main experience; idle expiry cannot steal focus
from an open surface. Source readout and its same-size effect extension remain
independent of the retracting controls.

App resource disposal is deferred one microtask and guarded by a retained lifetime
epoch. React Strict Mode's synchronous trial cleanup therefore cannot destroy the
new splash media controller; a real final unmount still releases it. Source choice
awaits the shared preparation promise, and rotation refresh requires a real finite
deadline. Browser tests verify actual request reuse, not only source-code shape.
