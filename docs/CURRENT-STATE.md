# Current Project State

Status: **authoritative working overview**. Updated on 2026-08-31.

This page is the shortest reliable answer to “what exists now?”. Product
requirements remain in [`PRODUCT-SPEC.md`](PRODUCT-SPEC.md), architecture in
[`TECHNICAL-DIRECTION.md`](TECHNICAL-DIRECTION.md), deployment evidence in
[`DEPLOY.md`](DEPLOY.md), and historical decisions in `CHANGELOG.md` and the
dated study documents.

## Product surface

- `Flux` is the implemented primary mode. `Engine` remains an equal confirmed
  mode, visible but disabled until its own audio model and one of exactly three
  Engine-specific visual directions are selected.
- The selected **16 Road** product mark is implemented as path-only SVG rather
  than live text: a large Orbitron weight-750 `16` sits between mirrored
  vermilion and warm-white three-line roads. Dark, warm-light, and true-alpha
  masters plus 512/1024 px PNGs and favicon/touch/product derivatives live in
  `logo/`; the current app packages and advertises the browser icons. The mark
  fills its 512 px canvas to a 15–18 px optical edge. The selected mark now sits
  beside the textual wordmark in the compact Signal Gate launch surface.
- The source checkout's Flux catalog contains six visual environments:
  **APERTURE 01**, **VERTIGO 02**, **MERIDIAN 03**, **ATLAS 04**, **DRIVEY 05**,
  and the human-approved and canonically published **PRTCL 06**. Aperture
  remains the accepted fresh-session and invalid-preference fallback. The
  rejected PRIMORDIAL field is absent from the current runtime; stored
  `primordial` preferences migrate to Aperture.
- All six source environments use the shared catalog of **10 themes**. Vertigo keeps
  the upstream Interstate 7 files byte-identical while an external runtime
  bridge maps the selected theme onto its existing colour channels.
- OPEN, UNDERWATER and BLOOM are visible in all six checkout environments without
  a shared overlay. Aperture performs its tiled projection and centre light;
  Vertigo changes only the original runtime's externally bridged time, FOV and
  colour controls; Meridian changes corridor projection, flow, fog and rail
  energy; Atlas changes MapLibre camera and layer paint properties; Drivey
  receives smoothed bounded road response, timestamped audio-macro envelopes,
  camera and two-channel material updates through its external bridge without
  editing the vendor files; PRTCL changes complete-form and point scale,
  depth/travel, palette pulse, spread, attenuation, and glow through shared
  frame-rate-independent macro envelopes within its own particle grammar.
- The selected **Focus Canvas** owner LAB is implemented and canonically
  published behind a server-side `/lab/` session gate. Its first manifest controls all
  three PRTCL families through 18 bounded Form, Response, Macro, Scene and
  runtime-context options. Its separate test-audio selector can run MUTE,
  FRACTURE, JUNCTION, or NIGHTSHIFT without writing a music association into
  the visual state or preset. Import, clipboard copy and explicit authenticated
  email use one versioned coordinate-free preset; the browser receives no
  password verifier or recipient. The unauthenticated canonical gate, direct
  endpoint denial and exact Tesla-sized login surface are verified. Authenticated
  canonical QA also passes at `773 × 601` with no overflow or console error. A
  macro-strip overlap was corrected, and the PRTCL canvas now keeps one WebGL2
  renderer alive while controls and families change instead of recreating the
  context until it fails white. The LAB reuses the production motion model:
  `ArrowUp` accelerates, accelerator release regenerates, and `ArrowDown` or
  `Space` brakes without stealing keys from sliders, selects, or buttons.
  The live audio meter drives only the disposable test signal and returns the
  manual AUDIO control immediately when muted.
  Physical-Tesla acceptance remains open.
- Meridian keeps one deterministic low corridor beneath sparse, large oblique
  blades and longitudinal shoulder planes. Its shared travel field has tightly
  bounded vertical motion; FOV, depth compression, peripheral stretch,
  parallax and flow rise monotonically with speed. Conventional buildings,
  stacked towers, high cloud slabs and scene-wide particles are absent.
- ATLAS dynamically loads MapLibre only when selected, draws a minimal
  palette-owned OpenFreeMap vector style with 3D buildings, and pairs it with a
  selected-page Italian Wikipedia abstract, full-width free image, five nearby
  choices at the Tesla viewport and a local QR. All ten theme profiles now own
  explicit label, road and route contrast floors.
  Without reliable GPS, ATLAS keeps the normal control plane instead of a
  blocking waiting splash. The top navigation shows only `GPS` and metre
  accuracy: green means a connected fix at `4 m` or better, orange means a
  connected but less accurate fix, and red means GPS is disconnected. A
  non-modal accessible panel offers an honest retry path and a
  fixed Milan demo without entering coordinates into diagnostics. The camera
  remains oblique and building-rich at `130 km/h`, centers on trusted fixes and
  follows reported or inferred heading. One pointer or a primary-button mouse
  drag rotates and pitches through a hard-clamped `0–85°` range with no elastic
  overshoot; wheel/trackpad scroll and two pointers zoom beyond the automatic
  range. ATLAS passes map hits through the otherwise transparent
  product chrome while keeping its real controls and GPS popup interactive.
  After six idle seconds it eases to the current automatic point, bearing,
  pitch and zoom. A MapLibre
  compass shows heading. A bright route retains the complete current ATLAS-view
  trip and remains legible while zooming out; a `4096`-point ceiling compacts
  older detail instead of deleting the trip origin. One interpolated point at
  the route head pulses once per second with a restrained expanding ripple. The `246 px` passenger panel
  collapses behind a persistent midpoint handle, has one touch-scroll context,
  and keeps mandatory attribution in a tiny translucent strip above the footer.
  A bounded session-only A3 foundation now retains eight monotonic timestamped
  fixes and can interpolate the same path at 30 or 60 FPS with a `100 ms` delay,
  no extrapolation, a `1500 ms` stale freeze and no animation across long gaps.
  Trusted coordinates feed that buffer at GPS cadence outside React state and
  still arrive when numeric GPS speed is unavailable; the first calm
  map/camera update is immediate and later ones remain throttled to `2500 ms`.
  The buffer now drives the MapLibre point source at frame cadence without
  routing coordinates through React state or diagnostics.
  Model-only A3b/A4 helpers also derive a bounded local road name strictly from
  already rendered transportation features and map headings to eight English
  cardinal sectors. They make no reverse-geocoding request and remain unwired
  until road-badge and compass placement are selected.
  The received build-`20260831-0853` real-drive report measures ATLAS/JUNCTION
  at `23.15 FPS` average and `51.7 ms` p95 for `248.2 s`, while Drivey and
  Vertigo remain near 60 FPS. The local correction caps only MapLibre at
  `1.25×` pixel density, disables repeated world rendering, cancels obsolete
  zoom-tile requests, and consolidates marker animation into one `8 Hz` data
  update. Exact local `773 × 601` QA renders the full-width map framebuffer at
  `966 × 751` without console warnings/errors; a new Tesla report must prove
  the 30 FPS target.
- WAKE is rejected after repeated live review: its ribbons read as disordered
  rain rather than a convincing authored 3D road field. Its renderer, fallback,
  tests, catalog entry and current QA captures have been removed. The historical
  decision record remains in Git and the dated design document; a stale `wake`
  preference resolves to Aperture.
- DRIVEY embeds the actual Rezmason Drivey runtime pinned at commit
  `5104cdade2a3158786b05b9b0680a50e942830cf`. Its 51 upstream road, level,
  traffic, camera, rendering and bundled-library files remain byte-identical
  under a SHA-256 manifest; a project-authored iframe shell and external bridge
  apply bounded speed, music, reduced motion, named performance effects and all
  ten Sedici Valvole palettes. The bridge instantiates the upstream automatic
  `Input`, fixes the player car's random weaving, and leaves the original
  road/curve steering in charge while moving. At commanded zero it holds the car
  motionless on the current lane centre and resumes from that same road location.
  It requests 16 NPCs only when every generated car can be assigned and verified
  on the direction opposite the player; otherwise traffic fails closed to zero.
  The former stored traffic-count preference is ignored. Every preset keeps its native `accent` and
  `secondary` colours as simultaneous material channels in both Normal and Wire.
  Two compact `94 × 34 px` text-only controls cycle
  `HOOD → REAR → AERIAL` and `NORMAL ↔ WIRE` directly, with no dropdown, panel,
  native Driver/Chase/Satellite view, or original colour selector. Exact muted
  `773 × 601` and `390 × 844` Browser QA passes with zero warning or error. The
  owner accepted the current published Drivey presentation on 2026-08-30. A
  speed-responsive rise of the Aerial camera is recorded only as a deferred
  nice-to-have; it is not missing behavior in the accepted checkpoint.
- PRTCL adapts the directly authorized Fractal Frequency, Murmuration, and Axiom
  formulas from the user-owned checkout at commit
  `2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060` into a bounded project WebGL2
  renderer. The reviewed particle budgets remain `24,000`, `16,000`, and
  `37,000`; PRTCL's runtime, UI, dependencies, fonts, screenshots, assets, and
  other effects are excluded. One `94 × 34 px` text-only `TYPE` button cycles
  `FRACTAL → MURMURATION → AXIOM → FRACTAL` without a dropdown or panel, while
  the shared `PALETTE` remains a separate colour choice. Road speed alone owns
  complete-form scale, point scale, depth, and travel; music owns colour phase
  and pulse. Both scale responses reach their maximum at `100 km/h` and hold
  above it, while depth and travel continue through the global `130 km/h` road
  ceiling. OPEN, UNDERWATER, and BLOOM morph continuously instead of switching
  discrete geometry state. Exact muted
  `773 × 601` and `390 × 844` QA, every type, OPEN / UNDERWATER / BLOOM, zero
  warning/error state, deterministic reduced motion, 339 tests, and the
  128-module build pass. Human visual approval was recorded on 2026-08-29;
  source commit `b88070c`, build `20260829-2337`, is verified on the canonical
  root, while real-Tesla acceptance remains open.
- PRIMORDIAL 08 was published from project-authored clean-room code and later
  rejected by the product owner on 2026-08-30. Its registry entry, renderer,
  fallback, tuner, preferences, production imports, QA path and active tests are
  removed; the dated admission record and Git history remain as provenance.
  A future original Gradient Field is a separate project with its own exactly
  three-direction visual gate and source-by-source licence review.
- REGISTER was rejected after live review because its static print composition
  was inexplicable in motion and outside the product mood. Its source remains
  only in the rejected-visual archive; the runtime, QA harness and active tests
  do not import it. Invalid or retired environment identifiers fall back to
  Aperture. PLUMB later triggered its own retirement criterion in the first
  exact-viewport local review and was rejected before publication; its renderer,
  QA path and active tests have been removed as well. PLUMB, REGISTER,
  LATITUDES, WAKE and any other retired identifier now resolve to Aperture.
- Speed, BPM, and energy remain visible together. The fixed road-energy ceiling
  is `130 km/h`, with Aperture visibly forming a tunnel near `40 km/h`.
- The main experience retains an icon-only Mute control, GPS/Demo source
  selection, vertically ordered Music and Visual libraries, a shared `PALETTE`
  control, and coordinate-free diagnostics in a measured 64 px footer.
- Signal Gate launches through the approved compact `360 × 160 px` flat surface
  at the Tesla split viewport. Its `42 px` 16 Road mark, textual wordmark and full-width
  `PLAY THE ROAD` field form one semantic gesture with no simulated controls.
  The readable credit beneath it identifies and links the sole project creator,
  enuzzo, credits Illobo, and is followed by a monochrome GitHub-marked link to the public
  `enuzzo/sedicivalvole` repository. Splash links retain light text on hover.
  A compact top-left support control opens the verified `buymeacoffee.com/enuzzo`
  destination, the supplied QR, an honestly labelled playful project-sparks
  signal and a runtime-reconstructed suggestion address; suggestions are
  explicitly welcome without a purchase.
- The opening action now leads to the owner-selected **Instrument Deck** in the
  owner-selected LIGHT **Road Sheet** language: one open warm-ivory sheet, the
  compact left-aligned 16 Road and Orbitron wordmark lockup, hairline structure,
  quiet-gray direct controls, short vermilion state rails, and one black START
  field. `MUSIC` and `VISUAL` keep concise descriptions; START remains disabled
  until both axes are selected, and MUTE still requires a Visual. SOUNDTRACK
  prepares three transient eligible Jamendo roles before START can unlock. The
  running Music drawer now presents compact equal-weight **Illobo Featured** and
  **Jamendo Library** paths, with the final Illobo logo still pending. At exact
  `773 × 601`, the complete Music and Visual button grids share the same
  `342 px` height, top, and bottom. The `72 px` header, shared compact padding,
  `8 px` grid spacing, and `3 px` title/description gap reserve room without
  reducing the approved type sizes. A registry-derived Visual row count keeps a
  future third row inside that fixed block as three `108.66 px` tracks. The
  selected `3 px` rail sits independently above content instead of moving or
  crossing its title. The shared `6 px` radius and complete
  MUTE + APERTURE start flow pass interaction, geometry, and console QA.
- Road Sheet now records the invariant interface anatomy for X10. LIGHT uses
  warm ivory, quiet gray, near-black, and vermilion; DARK will retain the same
  layout and hierarchy with near-black, charcoal, dark-gray, warm-light, and
  vermilion tokens. A non-visual X10 model now owns the independent versioned
  LIGHT/DARK/AUTO preference, explicit reset, safe storage failure, browser-
  scheme priority, offline solar fallback, twilight hold and no-mid-gesture
  rule. Product-wide tokens, capability adapter and visible control remain
  planned rather than silently active in this checkpoint.
- Space Grotesk remains the locally packaged face for all reading text, values,
  controls, operational labels, LAB controls and session-report content under
  OFL-1.1. Its deliberate `400–700` hierarchy and tabular numerals remain intact.
  Orbitron is restored only for exact textual `sedicivalvole` wordmarks in the
  launch surface, Instrument Deck and owner LAB.
- The running top bar now uses the existing transparent 16 Road product mark
  alone as its report trigger. Its fixed `68 px` cell and centered `44 px` mark
  replace the former `263 px` textual wordmark at `773 × 601`, leaving a measured
  `195 px` lane before telemetry; the annotated `702 × 546` viewport retains
  `124 px`. GPS, telemetry and REPORT keep their exact prior positions. Future
  X10 appearance controls may use this lane but are not silently implemented.
- The launch wordmark uses Orbitron `750`, responsive `26–32 px` sizing and
  restrained `-0.02em` tracking beside the `42 px` 16 Road mark. `PLAY THE ROAD`
  remains Space Grotesk `600` with zero added tracking. The product band is
  `64 px`, while the complete action is `360 × 160 px`. The command carries a seamless
  repeating white-to-red horizontal wave whose terminal frame is its first frame.
  The launch surface stays above every preloaded environment overlay, including
  ATLAS's no-GPS waiting state, until the gesture completes. Every Signal Gate
  lane owns a short independently phased travelling gap, with restrained
  perspective airflow behind the road field.
- Diagnostics separate FPS/frame time, browser-exposed heap and decoded-audio
  memory by splash, active Visual/Music pairing, the Aperture wall-retreat pressure
  band and session-report-open state. Re-entry gaps are not counted as slow frames.
- The integrated REPORT surface uses the pinned Tabler report-analytics icon and
  a visible label, then leads with frame, GPS, audio and issue health,
  then exposes aligned motion, rendering, audio/resource and session evidence.
  Its actions no longer cover metrics, raw JSON uses the drawer's single scroll
  context, and an accessible README contains telemetry/privacy, audio provenance,
  licensing and source details without removing essential submission disclosure.
- The raw REPORT also derives one bounded network-notice state from two clearly
  separated evidence classes: browser connectivity estimates and observed,
  instrumented application transfers. Offline, recent request failure, active
  download/upload, recovery, estimated constrained service, healthy hint and
  unavailable states are deterministic. The visible navbar treatment is not yet
  rendered and remains part of the X2 interface selection.
- An explicit diagnostic send keeps the email body concise and attaches the
  complete accepted report as gzip-compressed JSON, named by build and server
  timestamp with uncompressed and compressed SHA-256 evidence.

## Music

- **FRACTURE 02** is a selectable score. It is a generative Jungle / Drum
  & Bass composition rendered by the production AudioWorklet.
- FRACTURE has **10 four-bar sections**, a narrow `162–176 BPM` transport range,
  a clockless harmony-only PARK state, a sub-100-BPM perceived low-speed form,
  three authored half-time rhythm families, arrangement density, deceleration
  memory, and the measured UNDERWATER brake effect. `SILK PULSE`, `BROKEN PULSE`,
  and `RHYTHM WEAVE` rotate accents, rests, ghost articulations, and four
  compatible timbres over eight bars. The native full break cannot arm before
  `88 km/h` and releases below `82 km/h`; the displayed tactus remains the one
  actually articulated. Its
  live arranger now builds only atmosphere, harmony, sub/reese and rhythm: the
  recurring `riff` and `response` lanes are retired from normal playback and
  remain reachable only through the parked development audition path.
- **JUNCTION 01** is selectable sampled Jungle music. Its eight energy states
  each have three complete authored clips: 24 rendered sections built from 76
  distinct recordings in one 5.8 MB segmented Opus bank. Every section shares
  the exact `Emin9 – Cmaj7 – Amin7 – Bmin9` grammar and contains its own vertical
  atmosphere, harmony, bass and break layers. There is no automatic lead, rave
  multisample, tonal second deck, or simultaneous independent identity. Rest is
  harmony and atmosphere without a break or bassline. Native playback begins at
  `21 km/h` with the quiet `127 BPM` OPEN family, advances to `135 BPM` near
  `30 km/h`, `158 BPM` near `40 km/h`, `164 BPM` near `50 km/h`, and reaches
  `168 BPM` only at high energy. The browser
  lazily retains at most six individual clips, finishes the current eight-bar
  phrase, then starts one different self-contained performance on the
  sample-accurate boundary. The primary take does not immediately repeat.
  A rhythm entrance from the zero-beat bed rises for four seconds when JUNCTION
  is already active; a decision to return toward low-speed ambience is
  cancellable if road energy returns.
  Source sounds are never exposed or shuffled mid-phrase.
- JUNCTION PARK is no longer a perpetual first-chord hold. Six root-light
  voicings move through the score's existing `Emin9 – Cmaj7 – Amin7 – Bmin9`
  grammar on unequal `9.8–15.4 s` holds with `3.6 s` crossfades, breathing
  expression and changing filter colour. The form retains its position across
  repeated stops, keeps every fundamental at C4 or above, and never enables a
  beat, bassline, transport clock or production-bank decode. The conservative
  reference measures `-54.290 dBFS` RMS and `-44.313 dBFS` sample peak; musical
  quality still requires low-volume and real-Tesla listening.
- **NIGHTSHIFT 03** is a selectable sampled Synth-pop / 1980s score. Its 18
  self-contained eight-bar performances use one native two-bar drum recording
  at a time beneath a project-authored `Amin9 – Cmaj7 – Emin7 – G6 – Amin9`
  grammar. Three takes at each native `85 / 95 / 110 / 120 / 130 / 140 BPM`
  state avoid immediate repetition. The `120 BPM` and faster families cannot
  enter before `82 km/h`; speed descent uses separate exit thresholds. PARK is
  a six-voicing, clockless, breathing A-minor ambience with no beat or bass.
  The 5.5 MB Opus bank exposes only complete mixes and retains at most six
  decoded clips. Offline measurement is `-21.4 LUFS` integrated, `6.6 LU` LRA
  and `-3.8 dBFS` true peak. Encoded-bank analysis measures the individual
  NIGHTSHIFT assets at `-25.54` to `-18.89 LUFS` and the JUNCTION assets at
  `-30.57` to `-16.71 LUFS`. Both sampled adaptive players now apply the same
  `0.72` performance-entry gain; this corrects NIGHTSHIFT's approximately
  `2.85 dB` in-car level mismatch without changing FRACTURE. Listening
  acceptance remains open.
- The scores retain authored low-speed grammar. Below `0.8 km/h`, PARK
  sustains a very quiet, clockless mood harmony with no beat or bass. A genuine
  forward crossing at `1.2 km/h` plays exactly two soft consonant DEPART events;
  it cannot retrigger until the vehicle has remained at or below `0.5 km/h` for
  three seconds, and an initial GPS fix already in motion cannot invent it.
  CREEP begins a quiet two-chord micro-progression at `4 km/h`; ROLL introduces
  a restrained beat at `10 km/h` without restarting that progression. The
  listener-facing tactus stays at or below `84.667 BPM` through the displayed
  `20 km/h` state. JUNCTION native music enters at `21 km/h`; JUNCTION leaves
  native mode below `20.5 km/h`, retaining a small hysteresis without allowing a
  displayed `20 km/h` state to expose the `127 BPM` bank. FRACTURE continues its
  authored half-time ladder through urban and medium road speeds, reaching its
  full-time break only in the `80–90 km/h` band.
- JUNCTION's oscillator bed and compact production bank are both lazy: a
  FRACTURE-only session constructs neither. Selecting JUNCTION creates its soft
  bed immediately, but the bank is not fetched or decoded below the native
  threshold. The first native performance waits for both the selected take and
  a distinct companion to decode, then begins sample-accurately; a ready
  companion is the exact-boundary fallback, immediate repetition is forbidden,
  decode failures back off for ten audio-clock seconds, and the six-slot bound
  still holds.
- FRACTURE, JUNCTION and NIGHTSHIFT hand off through one four-second equal-power score
  crossfade. Rapid reversals continue from the audible point, cancel overlapping
  Web Audio automation safely and retain revision-guarded cleanup. A score-local
  rhythm fade is not stacked onto the same native entrance.
- The shared post-score **OPEN** macro responds to a supported hard-acceleration
  trajectory: at least `+30 km/h` inside `2.2 s`, at least three coherent
  samples and `3.8 m/s²` average acceleration. It rejects inaccurate and stale
  fixes and makes the gesture independent of stereo separation by sweeping a
  soft-limited score-derived focus band from `480` to `3200 Hz` over `350 ms`.
  Restrained low-mid, air and width changes support that rising intake without
  adding an oscillator, noise or replacement phrase. It releases when the
  curve normalizes and always yields to UNDERWATER braking. Local build
  `20260830-0031` at `ca5ffe9` passes objective mono/level/peak evidence, but
  human headphone, cabin and real-Tesla listening remain open.
- **BLOOM** is the rarer upper tier nested inside OPEN. A supported trajectory
  above `34 km/h`, `5.2 m/s²` and `0.7` normalized intensity sweeps a
  Hermite-interpolated feed-forward delay
  from `8` to `0.8 ms` over `400 ms` in the `300 Hz–8 kHz` band. It replaces
  only that band, preserving the sub; it observes a 25-second refractory period
  and yields immediately to UNDERWATER. The common 6.6 kB AudioWorklet sits
  after either score and before OPEN's shared tone/width stage.
- **CUTWATER 04**, **LOWTIDE 05**, **NIGHTCAST 06**, and
  **STILLWATER 07** are declared honestly as `IN PREPARATION` and are disabled.
- **SOUNDTRACK is connected to the App and owner LAB as a production prototype.**
  A server-side catalogue relay keeps the Jamendo client ID out of browser code,
  admits only complete effect-compatible non-ND Creative Commons records, and
  returns a short-lived no-store metadata view. A separate same-origin relay
  resolves an exact admitted track ID and streams byte ranges without writing an
  audio file. Previous/current/next occupy at most three transient browser media
  elements with native `preload=auto`; displaced sources are paused, detached,
  and discarded rather than copied into Cache Storage, IndexedDB, a service
  worker, or any offline store. Playback requires the explicit START/PLAY
  gesture, has no automatic PLAY THE ROAD fallback, and remains at authored
  `1×`: driving never chooses or retimes a recording. MediaElementSource
  routing feeds a bounded Web Audio graph. The shared footer `FX` master
  gates only audible OPEN/UNDERWATER/BLOOM processing while the same vehicle
  macros remain available to every visual; PLAY THE ROAD starts enabled and
  SOUNDTRACK remains a fresh-session opt-in. Manual flanger, reverb, chorus,
  and beat-repeat controls stay independent. The visible card follows the
  audio-clock gain mix and exposes every genuinely audible artwork, artist,
  title, licence, Jamendo credit, and direct source link. Manual changes use the
  tested nominal `450 ms` equal-power curve for normal skips, reversals, and
  rapid third-deck retargeting while keeping the media-element ceiling at three.
  A compact QR follows the requested current track and opens only its public
  Jamendo page, never the relay or stream URL. The running Music drawer now separates
  **Play the Road** from **Soundtrack** without inaccurately calling every
  adaptive score generative. Soundtrack presents compact, equal-weight **Illobo
  Featured** and **Jamendo Library** alternatives. The Featured playlist and
  Jamendo cover preview rotate deterministically every 30 minutes. Jamendo
  browsing uses the official `speed` values and genre tags; selecting a pace,
  genre, or exact track starts playback immediately. Pace is manual discovery
  metadata only: it can never follow vehicle speed or retime audio. MUTE and FX
  stay universal in the footer, and disabling FX suppresses audio processing
  without stopping visual macro detection. The second live candidate proved
  that incoming media playback must be requested before awaiting effects/worklet
  readiness so Chromium retains the transport gesture's transient activation;
  checkpoint `dcb6801` enforces and tests that ordering. Build `20260831-1241`
  publishes that correction. Physical-Tesla listening of crossfade, buffering, touch, QR,
  transport, licence and effects behavior remain open; no offline-duration promise is made. See
  [`SOUNDTRACK-SOURCE-POLICY.md`](SOUNDTRACK-SOURCE-POLICY.md).
- **The running footer has its compact control geometry.** MUTE and EFFECTS are
  adjacent, both announce a 1.5-second centred status, and the two-row palette is
  fixed to `138 px` at `773 × 601` / `160 px` on desktop at the far-right edge.
  The released centre span is intentionally empty rather than stretched.
  Editorial Music and Visual names use Title Case display labels in the launcher,
  footer, and both pickers; functional micro-labels remain uppercase. Each footer
  catalogue number now sits beside its name on the same baseline at the same type
  size, while canonical uppercase registry labels remain stable for identity,
  diagnostics, and tests.
- `docs/MUSIC-CRAFT.md` records the musical defects and techniques already
  learned. Assertable musical rules belong in tests.
- A development-only sample-harmony pilot now inventories the eight chord hits
  reachable by JUNCTION, records byte identity, envelope shape, tuning and
  high-recall Basic Pitch proposals plus review-only harmonic-residual evidence.
  Its first three-note synthetic C-sharp collision grid passed at `1.0` recall
  and `0.0` false-positive rate but with a narrow `0.012246` separation margin.
  Adding the missing F-sharp2 source falsified that result: false-positive rate
  rose to `0.666667` and the margin became `-0.006729`. The residual is therefore
  removed from classifier input and remains descriptive review data only. A separate
  review-only spectrum pass searches possible lower fundamentals independently;
  it now records calculated hypotheses separately from measured spectral peaks.
  A selection audit proves the current renderer reaches only index zero for all
  chord labels, and an audio-only report measures 63 printed chord transitions
  without using pitch proposals. Its current uncalibrated pass validates all 63
  printed boundaries and flags 24 for listening (39 clear; 30 total flag events),
  led by EASE and `Cmaj7 → Amin7`; it cannot block production
  until live-delay and cross-clip transitions are included and calibrated.
  No authoritative pitch set or chord label is admitted. The ignored Python
  environment and reports never enter the product build or redistribute source
  audio.

## Verified boundaries

- Local gate: `npm test` and `npm run build` from `prototype/drive-lab/`.
- The exact suite count and build identity are refreshed after the final
  integrated gate for each checkpoint. This Dropbox checkout moves between
  Intel and Apple-silicon Macs, so its shared `node_modules` tree is never
  trusted as an architecture boundary. `npm run native:prepare`,
  `npm run test:native`, and `npm run build:native` use exact lockfile versions
  from a per-machine cache without rewriting the shared dependency tree.
- Canonical development URL: <https://sedicivalvole.app/>. The most recent
  canonical publication evidence and build stamp are always the first entry in
  [`DEPLOY.md`](DEPLOY.md).
- The target Tesla split viewport is `773 × 601` CSS pixels on a
  `1254 × 784` logical screen at DPR `1.53`.
- No sample pack file is committed or published. JUNCTION and NIGHTSHIFT ship only mixed,
  processed production permitted by the source terms. The development QA
  harness is excluded from production builds.
- The product owner subsequently authorized direct inspection and offline
  analysis of the ignored 1980s WAV source library. Checkpoint `dd6bb5e`
  inventories all 684 relevant files without committing raw audio. Provenance,
  rights, level/transient evidence and compatibility findings are recorded in
  [`EIGHTIES-SAMPLE-AUDIT-2026-08-29.md`](EIGHTIES-SAMPLE-AUDIT-2026-08-29.md).
  NIGHTSHIFT is now implemented and published from that evidence; raw sources
  remain ignored, uncommitted and unpublished.
- The canonical live product is version `0.0.0`, source/documentation commit
  `7feea06`, build `20260831-1241`, with transition correction `dcb6801`. Its
  guarded 108-file publication, read-only pre/postflight and
  HTML/JavaScript/CSS/BLOOM-worklet byte identity pass. Catalogue and two
  exact-ID audio relay probes pass with schema-valid metadata and ranged
  `206 audio/mpeg` responses. Exact `773 × 601` Browser QA verifies build and
  launch layout with zero warning/error, but automated live transport is not
  claimed because both available control surfaces blocked direct `.php`
  catalogue access and the Chrome control session later detached. The complete
  `486/486` suite plus 145-module App / 70-module LAB / Sites build pass, while
  the physical-cabin checks remain `R7-01`–`R7-06`. Exact
  progressive evidence is in [`DEPLOY.md`](DEPLOY.md).
- Diagnostic telemetry contains no coordinates and is sent only after the
  explicit `SEND DIAGNOSTIC` action. ATLAS location is a separate ephemeral
  feature: the latest reliable point stays in session memory; OpenFreeMap tile
  requests and a coarse Wikimedia nearby-search cell occur only while selected.

## Open work

1. Execute Tesla tests `R7-01`–`R7-06` on live build `20260831-1241` from
   [`TESLA-TEST-QUEUE-2026-08-31.md`](TESLA-TEST-QUEUE-2026-08-31.md), including
   the live audio transport evidence that the available office Browser-control
   surfaces could not collect.
2. Validate the complete ATLAS route, pulsing vehicle point, three-state GPS
   control, measured 30 FPS ATLAS cadence and corrected NIGHTSHIFT level in the
   Tesla after publication.
3. Validate DRIVEY automatic road/curve following, ten-second zero hold,
   zero-to-motion resume, opposing-only traffic and both native palette channels
   in the Tesla. Validate ATLAS multitouch, live GPS
   recovery, map matching, route continuity, point/ripple behavior, passenger readability and palette
   contrast on the target screen.
4. Perform low-volume listening and a real-Tesla drive across FRACTURE's full
   ascent/descent and boundary reversals, JUNCTION's long PARK holds and later
   transition, NIGHTSHIFT's PARK form and complete `85–140 BPM` ascent/descent,
   and the OPEN/BLOOM gain changes. Automated visual, structural and
   loudness evidence is not perceptual acceptance.
5. Audition NIGHTSHIFT at low volume, verify perceived phrasing and loudness
   against both existing scores, then validate acceleration/reversal behavior in
   the target Tesla. Automated measurements are not perceptual acceptance.
6. Keep JUNCTION real-audio pitch admission disabled until isolated-source
   provenance can satisfy the now-tracked ADSR/filter/phase/detune/chorus/
   spectral/saturation and stereo-coherence validity gates. The synthetic stack
   is complete; its explicit abstention is the current correct result.
7. Validate PRTCL motion, performance, touch, and thermal behavior on the target
   Tesla. Present exactly three original Gradient Field directions before any
   implementation, then admit only the selected direction through a fresh
   licence and performance gate. Validate the revised OPEN intake at real
   playback level.
8. Design Engine only after exactly three Engine-specific directions are shown
   and one is selected. Keep `VERSION` at `0.0.0` until an explicit release is
   approved.
9. Build the queued landscape-first iPhone presentation across representative
   `667 × 375` through `932 × 430` Safari viewports. Apply safe-area insets,
   replace the interactive phone portrait layout with an accessible inert
   rotation notice, and preserve the running session across a live rotation
   without changing desktop or Tesla `773 × 601` behavior.

## Documentation map

| Kind | Documents | How to use them |
|---|---|---|
| Current | this page, `README.md`, `PRODUCT-SPEC.md`, `TECHNICAL-DIRECTION.md`, `ROADMAP.md`, `MODES.md`, `SESSION-HANDOFF.md` | Must describe the current repository and verified product state |
| Evidence | `DEPLOY.md`, `DIAGNOSTICS.md`, `AUDIO-QA-2026-08-28.md`, `CHANGELOG.md` | Append-only chronology; older failures remain true historical evidence |
| Knowledge | `MUSIC-CRAFT.md`, licensing and reference studies | Durable technique, provenance, and decision records |
| Future ideas | `FUTURE-IDEAS.md` | Canonical long-horizon owner-idea register; agent proposals remain explicitly separate and unapproved |
| Selection record | `FLUX-VISUAL-DIRECTIONS-2026-08-29.md` | PLUMB and WAKE rejected and retired; SLIP remains proposal-only |
| Historical | `RECOVERED-REQUIREMENTS-2026-08-26.md`, `ADVERSARIAL-REVIEW.md`, `SOURCE-AUDIT.md`, dated work plans | Preserve the reasoning and rejected baselines; do not treat their “current” wording as current product state |

`SESSION_HANDOFF.md` is a retained legacy filename and points to the canonical
hyphenated [`SESSION-HANDOFF.md`](SESSION-HANDOFF.md).
