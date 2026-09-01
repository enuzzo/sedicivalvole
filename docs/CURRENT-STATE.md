# Current Project State

Status: **authoritative working overview**. Updated on 2026-09-01.

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
- The source checkout's Flux catalogue contains seven driver-facing Visual
  choices: six rendered environments,
  **APERTURE 01**, **VERTIGO 02**, **MERIDIAN 03**, **ATLAS 04**, **DRIVEY 05**,
  and the human-approved and canonically published **PRTCL 06**, plus the
  separate **DISCOVER 07** Passenger Index destination. The initial Instrument
  Deck presents them as `3–3–1`, and the running Visual library exposes the same
  seventh action. Discover never enters the renderer registry: launch uses
  Aperture behind the passenger surface and closing it returns to a real visual.
  Aperture
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
  palette-owned OpenFreeMap vector style with 3D buildings, and pairs it with
  the owner-selected Drive Lab. Its `300 px` dashboard keeps Speed, Distance,
  Moving time and Average speed in one first line; Accel/Braking balance,
  five-band speed distribution, continuous Heading history and Moving/Stopped
  occupy a two-by-two field; Open-Meteo/Copernicus GLO-90 Elevation spans the
  complete bottom width. One tap cycles every chart through `15 MIN / 1 H /
  SESSION`. Missing GPS or terrain data remains explicit; weighted bounded
  all-session rollups preserve exact motion, distribution, heading and terrain
  aggregates. Journey samples and coordinates remain session-only and absent
  from storage and diagnostics. ATLAS contains no Wikipedia, nearby-place, QR
  or DISCOVER action; DISCOVER owns that separate passenger task. All ten theme
  profiles own explicit label, road, chart and route contrast.
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
  pitch and zoom. The separate MapLibre compass is replaced by the selected
  compact Navigator Plaque: a filled arrow rotates continuously with heading,
  while an English cardinal, rounded degrees and the local rendered-tile road
  name share one readable surface. A bright route retains the complete current ATLAS-view
  trip and remains legible while zooming out; a `4096`-point ceiling compacts
  older detail instead of deleting the trip origin. One interpolated point at
  the route head pulses once per second with a restrained expanding ripple. The
  Drive Lab collapses behind a persistent icon-only `36 × 30 px` midpoint tab
  with an accessible action name, giving the complete map width back without a
  full-height rail. Mandatory attribution remains a tiny translucent strip
  above the footer. Exact local `773 × 601` QA at checkpoint `6ac4259` proves
  the complete no-scroll dashboard, live Open-Meteo response, three-range
  cycle, full-map collapse/reopen and no header/footer collision. Canonical
  build `20260901-1559` repeats those exact live checks and byte identity;
  real-Tesla acceptance remains a separate gate.
  A bounded session-only A3 foundation now retains eight monotonic timestamped
  fixes and can interpolate the same path at 30 or 60 FPS with a `100 ms` delay,
  no extrapolation, a `1500 ms` stale freeze and no animation across long gaps.
  Trusted coordinates feed that buffer at GPS cadence outside React state and
  still arrive when numeric GPS speed is unavailable; the first calm
  map/camera update is immediate and later ones remain throttled to `2500 ms`.
  The buffer now drives the MapLibre point source at frame cadence without
  routing coordinates through React state or diagnostics.
  A3b/A4 helpers derive a bounded local road name strictly from the already
  rendered `transportation_name` layer and map headings to eight English
  cardinal sectors. They now drive the selected Navigator Plaque with exact
  degree copy and short-path continuous arrow rotation. They make no
  reverse-geocoding request and add no coordinate persistence or diagnostic
  field.
  The received build-`20260831-0853` real-drive report measures ATLAS/JUNCTION
  at `23.15 FPS` average and `51.7 ms` p95 for `248.2 s`, while Drivey and
  Vertigo remain near 60 FPS. The local correction caps only MapLibre at
  `1.25×` pixel density, disables repeated world rendering, cancels obsolete
  zoom-tile requests, and consolidates marker animation into one `8 Hz` data
  update. Exact local `773 × 601` QA renders the full-width map framebuffer at
  `966 × 751` without console warnings/errors; a new Tesla report must prove
  the 30 FPS target.
- DISCOVER is implemented as the owner-selected independent Passenger Index,
  not ATLAS chrome. Its `272 px` left rail measures the available height, fills
  the first fold, inserts the exact hidden count as `+N MORE`, and keeps all of
  the at-most-15 image-led results reachable in the same scroll; the selected
  reader remains open at right. The first supported browser language is
  automatic, with 14 explicit languages and local title/summary search inside
  the rail. Nearby/Ahead/Region reuse session-only position and heading;
  bounded continuation, deduplication and failure states prevent unbounded
  work. Distance is a Haversine estimate and drive time is explicitly
  approximate. The selected header links only to official Google Maps
  destination directions. The complete localized Wikipedia article now loads
  inside a scriptless sandbox with readable chapters, images and information
  cards; language changes clear edition-local page identity before refetching.
  DISCOVER has no ATLAS action and does not change the active visual. Exact
  local `773 × 601` Browser QA proves 15 results with `+10 MORE`, internal list
  and article scrolling, Italian content switching, two-column lead/infobox
  composition and no Browser warning/error.
  Checkpoint `e268169` makes it reachable as `DISCOVER 07` from both the initial
  Instrument Deck and the running Visual library while preserving the six-entry
  renderer and preference boundary. Exact Browser review then found the seventh
  running row below the fold; `a257e0c` compacts only that drawer so all seven
  remain simultaneously visible at `773 × 601`. Canonical build
  `20260901-1105` publishes both corrections and passes both exact-viewport
  entry loops, byte identity, focus return and an empty Browser log.
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
  running Music drawer now presents two horizontal top source selectors plus
  compact equal-weight **Lobo Playlist** and **Jamendo Library** paths. The
  Lobo card says **FEATURED ARTIST** and identifies original music written and
  performed by Illobo. Both complete cards remain enabled and visible at
  the narrow Tesla layout, so either path can always replace the other. Jamendo
  preview artwork belongs to the last real Jamendo catalogue and remains
  visible while Illobo owns the active queue. Its final Featured cover uses both supplied LOBO
  SVG variants byte-identically and crossfades continuously over four seconds
  in each direction from white-on-black solid to original black-on-graphite
  outline on an unclipped square field; active fixed
  playback also exposes `16 - Artist - Track title` through the page title for
  Tesla's browser media surface. The running drawer now gives the complete Pace
  and Genre chip surface one-tap behavior, fits the fifteen genres in two
  `5 × 3` rows beside a three-item vertical Pace rail, fits six tracks in two
  rows, animates the licensed Now Playing indicator only during real playback,
  and keeps Track Credit beside an independently bounded QR column without a
  scrollbar at exact `773 × 601`. The owner-selected Generated image 35 layout
  puts sampled JUNCTION and NIGHTSHIFT side by side and responsive-generative
  FRACTURE full-width below, with individual covers and concise copy;
  all 29 Illobo tracks use title-specific square covers from the same dark
  Swiss-modernist family. At exact
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
  and bounded echo controls stay independent. The visible card follows the
  audio-clock gain mix and exposes every genuinely audible artwork, artist,
  title, licence, Jamendo credit, and direct source link. Manual changes use the
  tested nominal `450 ms` equal-power curve for normal skips, reversals, and
  rapid third-deck retargeting while keeping the media-element ceiling at three.
  A compact QR follows the requested current track and opens only its public
  Jamendo page, never the relay or stream URL. The running Music drawer now separates
  **Play the Road** from **Soundtrack** without inaccurately calling every
  adaptive score generative. Soundtrack presents compact, equal-weight **Illobo
  Featured** and **Jamendo Library** alternatives backed by separate source
  adapters. Illobo Featured contains the complete 29-track owner-authorized
  hosted catalogue; Jamendo remains transient through its API/audio relay. Each
  explicit Featured press chooses a random non-current Illobo start while
  retaining all 29 identities. An unqualified start is `library:all`; pressing
  `PLAY FEATURED` switches catalogue source and immediately starts the
  `featured:signal-border` queue without reusing Jamendo cache state. Jamendo
  browsing uses the official `speed` values, a narrow three-item Pace rail and a
  complete readable `5 × 3` selector of 15 live-verified Jamendo genre tags;
  selecting a pace, genre, or exact track
  starts playback immediately. Pace is manual discovery
  metadata only: it can never follow vehicle speed or retime audio. MUTE and FX
  stay universal in the footer, and disabling FX suppresses audio processing
  without stopping visual macro detection. The second live candidate proved
  that incoming media playback must be requested before awaiting effects/worklet
  readiness so Chromium retains the transport gesture's transient activation;
  checkpoint `dcb6801` enforces and tests that ordering. Build `20260831-1241`
  first published that correction. Checkpoint `57fed11` further treats natural
  end, explicit restart, dormant preload failure, failed catalogue replacement,
  effects readiness and effects-resume rejection as bounded transport
  transactions; its deterministic 120-action stress remains coherent within
  three decks. Checkpoint `137ddeb` makes the running Play the Road/Soundtrack
  pane change before any network/effects/score wait, exposes the selected
  loading state, silences the outgoing source immediately and rejects late
  asynchronous completion after a rapid reversal. Checkpoint `0660d71` applies
  the same immediate pending identity inside the Soundtrack path chooser,
  makes Jamendo and Illobo complete reversible controls, and preserves
  Jamendo-owned cover previews across Illobo playback. Current build
  `20260831-2225` separates the
  true Illobo catalogue from Jamendo, publishes and verifies all 29
  owner-authorized recordings, retains the final Illobo identity plus
  Tesla-facing playback title, exposes all 15 verified Jamendo genre routes,
  and makes every explicit Featured press start
  randomly without dropping an Illobo identity, and recreates every explicit
  Featured target so the chosen complete recording starts at `0:00`. The earlier 23-track audit was
  Jamendo-only and is not Illobo evidence. Physical-Tesla listening of crossfade, buffering, touch, QR,
  transport, licence and effects behavior remain open; no offline-duration promise is made. See
  [`SOUNDTRACK-SOURCE-POLICY.md`](SOUNDTRACK-SOURCE-POLICY.md).
- **The running footer has its compact control geometry.** MUTE and FX are
  adjacent equal-width controls with one shared `LABEL / ON–OFF / GLOBAL`
  hierarchy, both announce a 1.5-second centred status, and the two-row palette is
  fixed to `138 px` at `773 × 601` / `160 px` on desktop at the far-right edge.
  The released centre span is intentionally empty rather than stretched.
  After a direct footer action or the final Music, Visual, diagnostics, GPS-help,
  or Performance-FX surface closes, focus returns to the neutral running
  experience instead of its trigger. Open surfaces and keyboard navigation keep
  their accessible focus; an idle experience retracts its header and footer
  after 4.2 seconds without requiring a passenger click on the visual.
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
- The canonical live product is version `0.0.0`, deployed documentation commit
  `3f505a0`, product commit `6ac4259`, build `20260901-1559`, publishing the
  owner-selected composite ATLAS Drive Lab together with the complete readable
  DISCOVER reader and its
  independent boundary from ATLAS on top of the owner-selected ATLAS Live
  Navigator, rounded-cell remote terrain elevation, three bounded history
  ranges, speed statistics, and canonical fit correction, plus DISCOVER 07 in
  both Visual entry points, the
  no-scroll seven-row running Visual library, the horizontal Music selectors and owner-selected
  Generated image 35 Play the Road composition on top of DISCOVER, the one-tap
  library and suspended-clock Soundtrack transition recovery while
  retaining the amplified MERIDIAN
  `50–124°` FOV, stronger
  UNDERWATER projection/motion/glow/fog contrast and complete `0.50 s`
  surfacing response while retaining global audio routing and the two-stage
  perceptual
  UNDERWATER repair `8c53e8d`, the selected global FX Deck `0993e92`,
  reversible Soundtrack paths `0660d71`, immediate Music switching `137ddeb`, transport
  hardening `57fed11`, Illobo provider identity `2c0f5f8`, ATLAS Navigator
  Plaque `79d9c9b`, Drive Lab `6ac4259`, MUTE/FX parity `c0a2f78`, Illobo/title
  implementation `05a754b`, cover correction `6218f98`, Featured-launch
  correction `1171157`, transition correction `dcb6801`, and Tesla Soundtrack
  relay/activation/effect correction `4b36069`, Featured random-start
  `61471e8`, true Illobo catalogue `1a47e23`, and track-head guarantee
  `236f2c9`. Its guarded
  publication, read-only pre/postflight and HTML/main-JavaScript/main-CSS/ATLAS-
  JavaScript/ATLAS-CSS byte identity pass. Current exact live `773 × 601`
  Browser QA proves the ATLAS `300 px` no-scroll dashboard, shared three-range
  cycle and full-map collapse/reopen, plus DISCOVER's `272 px` rail, five-row fold plus `+10 MORE`,
  continuous 15-result scroll, complete `486 × 523 px` Wikipedia reader and
  absence of an ATLAS action. The live ATLAS dashboard retains terrain elevation
  and three-range cycling without Wikipedia/place duplication. It also retains the
  complete Jamendo → Illobo → Jamendo round trip, persistent Jamendo covers,
  restored Jamendo browsing, and a rapid reversal that cannot be reclaimed by
  obsolete Illobo work.
- Owner checkpoint `8450109` supersedes the temporary Music Navigator Rail with
  two horizontal top selectors and the selected Play the Road hierarchy:
  sampled JUNCTION/NIGHTSHIFT side by side and responsive-generative FRACTURE
  full-width below. Canonical build `20260901-1041` passes `533/533`, the
  148-module App / 71-module LAB / Sites build, protected publication,
  read-only pre/postflight, 29/29 Illobo hashes and byte-identical HTML/JS/CSS.
  Exact live `773 × 601` QA measures both panes at `494/494 px` inside a
  `601/601 px` drawer, retains 15 genres plus six Jamendo tracks and reports no
  warning/error. Target-Tesla `R7-08` / `R7-09` acceptance remains open.
- Product checkpoint `e268169` adds DISCOVER 07 to both Visual entry points and
  turns the launch grid into the intended `3–3–1` composition. START opens the
  Passenger Index over Aperture; the running picker labels Discover as an OPEN
  destination and does not replace or persist the active renderer. The complete
  `535/535` suite passes. Follow-up `a257e0c` makes all seven running rows
  simultaneously visible without scroll and raises the complete suite to
  `536/536`. Canonical build `20260901-1105` passes protected publication,
  byte identity and both exact live `773 × 601` interaction loops with an empty
  Browser log. Target-Tesla acceptance remains open.
- Product checkpoint `f843ea6` enlarges the complete DISCOVER hierarchy,
  derives the first-fold result capacity from measured height, retains all 15
  sources in one scroll, loads the complete localized Wikipedia article in a
  scriptless sandbox, prevents cross-edition page-ID collisions and removes the
  reciprocal ATLAS action. Canonical build `20260901-1524` at `0d50a88` passes
  focused `10/10`, complete `541/541`, protected publication, 29/29 Illobo
  hashes, HTML/JS/CSS byte identity and exact live `773 × 601` Browser QA. Only
  target-Tesla `R10-00A`–`R10-05` acceptance remains open.
- Correction checkpoint `55caa8d` responds to the owner's annotated Basilica
  reader: complete Wikipedia infoboxes now float within a responsive
  `150–240 px` width capped at `38%`, lead imagery is bounded to `260 px`
  without cropping, and readers at `420 px` or narrower stack the card. At the
  measured `475 px` article body this expands the lead-copy measure from about
  `204 px` to `251 px` while preserving the complete article and its own scroll.
  Focused `10/10`, complete `541/541` and the 148-module App / 71-module LAB /
  Sites build pass; same-state Browser recapture and canonical publication are
  still required before this correction joins the final Tesla build.
- Follow-up checkpoint `f8f554b` spends that recovered sidebar height on
  content rather than labels: the visible `LANGUAGE` row is removed while the
  localized select keeps its accessible name, the three scope controls measure
  `38 px` high, and result distance/ETA metadata grows to `11.5 px`. Focused
  `10/10`, complete `541/541` and the 148-module App / 71-module LAB / Sites
  build pass together with the image-balance correction.
- Product checkpoint `5c498ac` adds the selected DISCOVER Passenger Index and
  Music Navigator Rail. Build `20260901-0933` passes the complete `533/533`
  suite, 148-module App / 71-module LAB / Sites build, protected publication,
  read-only pre/postflight, 29/29 Illobo verification and canonical HTML/JS/CSS
  byte identity. Exact live `773 × 601` QA proves five results plus `+10 MORE`,
  expansion to 15, English/Italian source switching, Berchet search, the fixed
  reader and Maps handoff; Music exposes all 15 genres, six Jamendo tracks,
  correct Lobo authorship, six Illobo rows and a complete return to Jamendo.
  Prior exact live `773 × 601` Browser QA verifies the unchanged white-on-black
  solid and black-on-graphite outline endpoints, play/pause title behavior and
  zero warning/error. Current exact live Browser QA verifies immediate Play the
  Road/Soundtrack pane replacement, captures the truthful loading state during
  the canonical catalogue request, reverses source before completion, and
  remains on Play the Road after settlement. Earlier local/live QA verifies the
  Library → Featured interaction, synchronized track/title and zero horizontal
  overflow; the formerly failing live Illobo relay ID and three adjacent entries
  return `206 audio/mpeg`. Audible cabin behavior remains a Tesla gate.
  Exact live ATLAS QA also proves the dynamic Navigator Plaque, local road copy,
  zero overflow and no live-origin warning/error.
  Current exact live `773 × 601` QA proves the `720 × 158 px` FX Deck and its
  `12 px` footer gap, four strong tap states, reset, no duplicate Music-drawer
  controls, and state persistence into Soundtrack with zero overflow or live
  warning/error. Protected publication reverified all 29 Illobo masters and the
  retired repeat worklet is admitted for cache overlap only by exact hash.
  Exact local `773 × 601` MERIDIAN QA proves distinct fixed UNDERWATER and dry
  higher-speed states; canonical HTML/JS/CSS byte identity proves the same
  renderer is live with no warning/error. The owner has accepted the corrected
  smoothness and visual quality; stronger real progressive surfacing remains
  the target-Tesla `R5-02` gate.
  The complete `539/539` suite plus 148-module App / 71-module LAB / Sites build
  pass, while physical-cabin checks remain `R4-01`–`R4-06`, `R5-01`–`R5-05`,
  `R7-01`–`R7-09`, `R8-01`–`R8-02`, `R9-01`–`R9-05` and
  `R10-01`–`R10-05`. Exact
  progressive evidence is in [`DEPLOY.md`](DEPLOY.md).
- Diagnostic telemetry contains no coordinates and is sent only after the
  explicit `SEND DIAGNOSTIC` action. ATLAS/DISCOVER location is a separate
  ephemeral feature: the latest reliable point stays in session memory;
  OpenFreeMap tile requests occur only while ATLAS is selected, while DISCOVER
  alone sends a coarse localized Wikipedia nearby-search cell. ATLAS additionally sends an
  approximately `0.001°` rounded cell to Open-Meteo for Copernicus terrain
  elevation; the response and histories remain session-only.

## Open work

1. Execute Tesla tests `R4-01`–`R4-06`, `R5-01`–`R5-05`, `R7-01`–`R7-09`,
   `R8-01`–`R8-02`, `R9-01`–`R9-05` and `R10-00A`–`R10-05` from
   [`TESLA-TEST-QUEUE-2026-08-31.md`](TESLA-TEST-QUEUE-2026-08-31.md), including
   the live audio transport evidence and MERIDIAN
   `0 → brake/UNDERWATER → renewed acceleration → 130` motion that the available
   office Browser-control surfaces could not physically accept.
2. Validate the complete ATLAS route, pulsing vehicle point, three-state GPS
   control, Navigator Plaque heading/road behavior, measured 30 FPS ATLAS
   cadence and corrected NIGHTSHIFT level in the Tesla after publication.
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
