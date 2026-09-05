# Current Project State

Status: **authoritative working overview**. Updated on 2026-09-04.

The owner-directed office continuation for the ATLAS/UI audit, including the
complete pending regression ledger and pasteable Astra prompt, is recorded in
[`ASTRA-UI-HANDOFF-2026-09-04.md`](ASTRA-UI-HANDOFF-2026-09-04.md).

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
- The source checkout's Flux catalogue contains eight driver-facing Visual
  choices: seven rendered environment families,
  **APERTURE 01**, **VERTIGO 02**, **MERIDIAN 03**, **ATLAS 04**, **DRIVEY 05**,
  the human-approved **PRTCL 06**, and the owner-selected **GRADIENT 08** family
  with **Japanese Mist**, **Acid Orchard**, and **Chromatic Silk** variants, plus the
  separate **DISCOVER 07** Passenger Index destination. The initial Instrument
  Deck and running Visual library expose the same eight actions at `773 × 601`.
  Diagnostics retain the internal variant identities `JAPANESE MIST`,
  `ACID ORCHARD`, and `CHROMATIC SILK` without promoting them to catalogue rows.
  Discover never enters the renderer registry: launch uses
  Aperture behind the passenger surface and closing it returns to a real visual.
  Aperture
  remains the accepted fresh-session and invalid-preference fallback. The
  rejected PRIMORDIAL field is absent from the current runtime; stored
  `primordial` preferences migrate to Aperture.
- The six themed source environments use the shared catalog of **10 themes**. Vertigo keeps
  the upstream Interstate 7 files byte-identical while an external runtime
  bridge maps the selected theme onto its existing colour channels.
- Braking UNDERWATER is the only vehicle-reactive effect and is visible in all
  checkout environments without a shared overlay. OPEN and BLOOM are retired
  from detection, audio, visual mapping, public packaging, and the protected
  LAB. Aperture performs its tiled projection and centre light;
  Vertigo changes only the original runtime's externally bridged time, FOV and
  colour controls; Meridian changes corridor projection, flow, fog and rail
  response; Atlas changes MapLibre camera and layer paint properties; Drivey
  receives smoothed bounded road response, timestamped audio-macro envelopes,
  camera and two-channel material updates through its external bridge without
  editing the vendor files; PRTCL changes complete-form and point scale,
  depth/travel, palette pulse, spread, attenuation, and glow through shared
  frame-rate-independent macro envelopes within its own particle grammar; the
  three ShaderGradient variants use their exact registered starting points with
  half-speed idle motion, bounded road response, optional Play the Road audio
  level response, and speed-only Soundtrack behavior.
- The selected **Focus Canvas** owner LAB is implemented and canonically
  published behind a server-side `/lab/` session gate. Its first manifest controls the
  active PRTCL families through 16 bounded Form, Response, Macro, Scene and
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
  the owner-selected Drive Lab. Its Swiss Compact `320 px` dashboard and
  `340 px` Canvas2D instrument keep Speed, Distance,
  Moving time and Average speed in one first line; Accel/Braking balance,
  proportional five-band speed distribution, an eight-sector Direction History
  rose, compact Open-Meteo/Copernicus GLO-90 Elevation and Moving/Stopped follow
  as one vertical instrument. Accel/Braking owns a centered `km/h/s` timeline;
  Speed bands and Moving/Stopped are low horizontal strips rather than square
  cards. Direction tiles grow outward in five discrete levels from moving-only
  time share, with an explicit dominant direction and a separate current-bearing
  needle; bounded session rollups retain exact sector counts. Direct labels,
  axes and source copy are larger and higher contrast at the Tesla viewport.
  One tap cycles every chart through `15 MIN / 1 H / SESSION`. Missing GPS or
  terrain data remains explicit; weighted bounded
  all-session rollups preserve exact motion, speed, direction-sector and terrain
  aggregates. Journey samples and coordinates remain session-only and absent
  from storage and diagnostics. ATLAS contains no Wikipedia, nearby-place, QR
  or DISCOVER action; DISCOVER owns that separate passenger task. All ten theme
  profiles own explicit label, road, chart and route contrast. An ATLAS-local
  `MAP COLOR` control switches the live style in place between product
  `PALETTE` and dark semantic `STANDARD` cartography. STANDARD distinguishes
  blue water, green vegetation/parks, warm buildings, neutral local roads and
  major-road classes while keeping the route, marker, Navigator Plaque, Drive
  Lab and interface accent in the selected product palette. The state persists
  with safe browser preferences and RESET SAVED STATE returns it to PALETTE;
  no MapLibre renderer, route, position or camera is recreated.
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
  Drive Lab collapses behind a persistent `48 × 48 px` target containing an
  icon-only `36 × 30 px` midpoint tab with an accessible action name, giving
  the complete map width back without a full-height rail. Mandatory attribution
  remains a low translucent strip above the footer and uses the high-contrast
  `14 px` metadata role.
  Exact local and canonical `773 × 601` QA at checkpoint
  `7c9df06`, build `20260901-2012`, proves the corrected vertical no-scroll
  hierarchy, explicit empty-state axes/legends, three-range cycle, full-map
  collapse/reopen, no header/footer collision and canonical byte identity;
  real moving traces and cabin legibility remain a separate Tesla gate.
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
  not ATLAS chrome. Its `246 px` left rail measures the available height, fills
  the first fold, inserts the exact hidden count as `+N MORE`, and keeps all of
  the at-most-15 image-led results reachable in the same scroll; the selected
  reader remains open at right. The first supported browser language is
  automatic, with 14 explicit languages. An empty query lets
  Nearby/Ahead/Region reuse session-only position and heading; free text
  performs a debounced global search against the selected Wikipedia edition,
  sends no position, works without GPS, and retains Wikipedia's explicit
  relevance order rather than reranking distant results by proximity.
  Bounded continuation, deduplication and failure states prevent unbounded
  work. Distance is a Haversine estimate and drive time is explicitly
  approximate. The selected header links only to official Google Maps
  destination directions. The complete localized Wikipedia article now loads
  as Wikipedia's native responsive Minerva page with the owner-approved dark
  test parameter and a `1.2×` outer large-reading scale. Wikipedia retains
  ownership of article colours, cards, media, chapters, links and localized
  interface; language changes navigate to the selected edition. Canonical
  build `20260902-2346` passes the no-GPS `Tokyo Tower` global-search flow,
  source-asset byte identity and an empty warning/error log; physical-Tesla
  touch/network acceptance remains `R10-02`.
  DISCOVER has no ATLAS action and does not change the active visual. Exact
  local `773 × 601` Browser QA proves 15 results with `+10 MORE`, internal list
  and article scrolling, native English/Italian Minerva switching, responsive
  information-card composition and no Browser warning/error.
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
  ten Sedici Valvole palettes. Checkpoint `4624f70` reuses VERTIGO's quadratic
  low-speed curve to cancel the original car model's square-root cruise gain,
  then synchronizes the player and opposing traffic to the smoothed GPS-derived
  world velocity before revealing the iframe. Deterministic equilibrium is
  exactly `5 / 40 / 90 / 130 km/h`, so walking pace no longer resembles road
  speed above `40 km/h`. The bridge instantiates the upstream automatic `Input`,
  fixes the player car's random weaving, and leaves the original road/curve
  steering in charge while moving. At commanded zero it holds the car
  motionless on the current lane centre and resumes from that same road location.
  It requests 16 NPCs only when every generated car can be assigned and verified
  on the direction opposite the player; otherwise traffic fails closed to zero.
  The former stored traffic-count preference is ignored. Every preset keeps its native `accent` and
  `secondary` colours as simultaneous material channels in both Normal and Wire.
  Two compact `94 × 34 px` text-only controls cycle
  `HOOD → REAR → AERIAL` and `NORMAL ↔ WIRE` directly, with no dropdown, panel,
  native Driver/Chase/Satellite view, or original colour selector. Exact muted
  `773 × 601` and `390 × 844` Browser QA passes with zero warning or error. The
  owner accepted the prior Drivey presentation on 2026-08-30. GPS-speed
  calibration checkpoint `4624f70`, published source `5691f58`, is canonical as
  build `20260902-2322`; local/live byte identity and rendered Browser/console
  checks pass, while physical-Tesla motion acceptance remains open. A
  speed-responsive rise of the Aerial camera is recorded only as a deferred
  nice-to-have; it is not missing behavior in the accepted checkpoint.
- PRTCL adapts the directly authorized Fractal Frequency and Axiom
  formulas from the user-owned checkout at commit
  `2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060` into a bounded project WebGL2
  renderer. The active reviewed particle budgets are `24,000` and `37,000`;
  Murmuration is temporarily outside the product and remains recoverable from
  Git and the source-admission record. PRTCL's runtime, UI, dependencies, fonts,
  screenshots, assets, and
  other effects are excluded. One `94 × 34 px` text-only `TYPE` button cycles
  `FRACTAL → AXIOM → FRACTAL` without a dropdown or panel, while
  the shared `PALETTE` remains a separate colour choice. Road speed alone owns
  complete-form scale, point scale, depth, and travel; music owns colour phase
  and pulse. Both scale responses reach their maximum at `100 km/h` and hold
  above it, while depth and travel continue through the global `130 km/h` road
  ceiling. Braking UNDERWATER morphs continuously instead of switching a
  discrete geometry state. It holds Fractal at `22.5%` of natural
  form scale and `27.5%` of natural point scale—25% larger than the previous
  minima—and returns rapidly to the exact
  scale on surfacing. Exact muted
  `773 × 601` and `390 × 844` QA, every type, UNDERWATER, zero
  warning/error state, deterministic reduced motion, 339 tests, and the
  128-module build pass. Human visual approval was recorded on 2026-08-29;
  source commit `b88070c`, build `20260829-2337`, is verified on the canonical
  root, while real-Tesla acceptance remains open.
- PRIMORDIAL 08 was published from project-authored clean-room code and later
  rejected by the product owner on 2026-08-30. Its registry entry, renderer,
  fallback, tuner, preferences, production imports, QA path and active tests are
  removed; the dated admission record and Git history remain as provenance.
  Its successor, the earlier project-owned `GRADIENT 08`, was then itself
  retired by the owner on 2026-09-02. Stored `gradient` preferences migrate to
  the Japanese Mist variant; the old renderer, model, and fallback are deleted.
- On 2026-09-02, the owner promoted all three exact registered starting points
  from the MIT `@shadergradient/react@2.4.20` comparison workbench as variants
  of one public **GRADIENT 08** family: **Japanese Mist**, **Acid Orchard**, and
  **Chromatic Silk**. The package and pinned Three/R3F peers are production
  dependencies isolated in one lazy product chunk. Project-owned adapters own
  the active product palette through accent, secondary, and one light-tinted
  derivative, plus bounded road/audio response that continuously folds and
  densifies under braking before restoring. They also own runtime telemetry,
  reduced motion, and Canvas2D fallback; no upstream source is modified. The
  LABs retain direct geometry,
  shader, palette, surface,
  camera controls, local persistence, JSON capture, and bounded road/audio
  preview. Local development and protected production share the canonical
  `/lab/` route. The workbench uses a side inspector on desktop and at
  `773 × 601`.
  Target-Tesla GPU and sustained-run acceptance remain open.
- REGISTER was rejected after live review because its static print composition
  was inexplicable in motion and outside the product mood. Its source remains
  only in the rejected-visual archive; the runtime, QA harness and active tests
  do not import it. Invalid or retired environment identifiers fall back to
  Aperture. PLUMB later triggered its own retirement criterion in the first
  exact-viewport local review and was rejected before publication; its renderer,
  QA path and active tests have been removed as well. PLUMB, REGISTER,
  LATITUDES, WAKE and any other retired identifier now resolve to Aperture.
- The driving rail exposes speed as its sole numeric hierarchy. Arrangement and
  visual response stay internal, use separate domain names, and saturate at the
  fixed `130 km/h` road-response ceiling; Aperture visibly forms a tunnel near
  `40 km/h`.
- The main experience retains an icon-only Mute control, GPS/Demo source
  selection, vertically ordered Music and Visual libraries, a shared `PALETTE`
  control, and coordinate-free diagnostics in the measured Tesla Compact
  footer. The palette's ten swatches fill their complete assigned cell as a
  `5 × 2` board instead of clustering in one corner.
- Signal Gate launches through the approved compact `360 × 160 px` flat surface
  at the Tesla split viewport. Its `42 px` 16 Road mark, textual wordmark and full-width
  `PLAY THE ROAD` field form one semantic gesture with no simulated controls.
  The readable credit beneath it identifies and links the sole project creator,
  enuzzo, credits Illobo, and is followed by a monochrome GitHub-marked link to the public
  `enuzzo/sedicivalvole` repository. Splash links retain light text on hover.
  A compact top-left support control opens the verified `buymeacoffee.com/enuzzo`
  destination, the supplied QR, an honestly labelled playful project-sparks
  signal and a runtime-reconstructed suggestion address; suggestions are
  explicitly welcome without a purchase. Checkpoint `a9aad78`, canonical build
  `20260901-2137`, restores the dialog above the Signal Gate after its overlay
  fell behind the raised splash stacking layer; open, close and focus return
  pass exact live `773 × 601` Browser QA.
- The opening action now leads to the owner-selected **Instrument Deck** in the
  owner-selected LIGHT **Road Sheet** language: one open warm-ivory sheet, the
  compact left-aligned 16 Road and Orbitron wordmark lockup, hairline structure,
  quiet-gray direct controls, short vermilion state rails, and one black START
  field. `MUSIC` and `VISUAL` keep concise descriptions; START remains disabled
  until both axes are selected, and MUTE still requires a Visual. Instrument
  Deck starts one Jamendo catalogue warm-up as soon as it appears; selecting
  SOUNDTRACK promotes the same request, while START may open the visual and
  state that music will join when ready. The
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
- Road Sheet now supplies the invariant interface anatomy and implemented
  LIGHT/DARK/AUTO appearance. LIGHT is the default and uses warm ivory, quiet
  gray, near-black, and vermilion; DARK keeps the same layout and hierarchy with
  near-black, charcoal, dark-gray, warm-light, and vermilion tokens. The direct
  top-rail menu uses official Tabler sun, moon, and sun-moon icons, and manual
  choices persist independently from the selected Flux palette. AUTO follows a
  genuinely observable browser scheme first, then solar phase from an existing
  consented session position, and otherwise a safe fallback. It triggers no new
  permission request and stores no coordinate or solar result. Semantic tokens
  cover shared chrome while renderer, iframe, map, and authored visual pixels
  retain their independent palette.
- Space Grotesk remains the locally packaged face for all reading text, values,
  controls, operational labels, LAB controls and session-report content under
  OFL-1.1. Its deliberate `400–700` hierarchy and tabular numerals remain intact.
  Orbitron is restored only for exact textual `sedicivalvole` wordmarks in the
  launch surface, Instrument Deck and owner LAB.
- The running top bar uses the owner-approved **Tesla Balanced Rail** at the
  `773 × 601` viewport: compact 16 Road mark, mode, speed, network, appearance,
  GPS, Discover, and Report. The mark stays first and remains visible with speed
  while the secondary chrome rests. Speed is the only two-line numeric module;
  every other actionable cell is a centered icon-only or icon-plus-name peer on
  one baseline. Network keeps a colour-coded status ring and genuine loading
  motion in the rail, then discloses current app-only transfer values plus a
  bounded 15-minute quality graph. The speed readout remains in its exact grid
  cell when the surrounding chrome retracts, shows only the centered value and
  `KM/H`, and keeps its GPS/Demo source available through the accessible control
  label rather than visible duplicate copy.
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
  unavailable states are deterministic. The visible navbar uses one hollow ring
  plus an always-visible rate in the same green/good, orange/medium, or red/poor
  tone. It prefers browser-observed application bytes, retains the last measurable
  download sample, and labels the Network Information fallback as an estimate;
  neither path claims device-wide or cellular throughput.
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
- **JUNCTION 01** is selectable sampled Jungle music. Its eight performance states
  each have three complete authored clips: 24 rendered sections built from 76
  distinct recordings in one 5.8 MB segmented Opus bank. Every section shares
  the exact `Emin9 – Cmaj7 – Amin7 – Bmin9` grammar and contains its own vertical
  atmosphere, harmony, bass and break layers. There is no automatic lead, rave
  multisample, tonal second deck, or simultaneous independent identity. Rest is
  harmony and atmosphere without a break or bassline. Native playback begins at
  `21 km/h` with the quiet `127 BPM` OPEN family, advances to `135 BPM` near
  `30 km/h`, `158 BPM` near `40 km/h`, `164 BPM` near `50 km/h`, and reaches
  `168 BPM` only at high road demand. The browser
  lazily retains at most six individual clips, finishes the current eight-bar
  phrase, then starts one different self-contained performance on the
  sample-accurate boundary. The primary take does not immediately repeat.
  A rhythm entrance from the zero-beat bed rises for four seconds when JUNCTION
  is already active; a decision to return toward low-speed ambience is
  cancellable if road demand returns.
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
- **UNDERWATER is the sole vehicle-reactive macro.** Firm braking drives the
  shared two-stage perceptual low-pass/pressure envelope in both Play the Road
  and Soundtrack and the same timestamped envelope reaches every visual.
  Ordinary acceleration has no separate effect. The former OPEN detector,
  filters and timer plus the BLOOM detector, DSP, AudioWorklet and packaged
  asset are deleted; their prior experiments remain recoverable from Git.
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
  gates only audible braking UNDERWATER while its vehicle envelope remains
  available to every visual; PLAY THE ROAD starts enabled and
  SOUNDTRACK remains a fresh-session opt-in. The office implementation now
  exposes eight manual post-source processors: Flanger, Reverb, Underwater,
  Phaser, Bitcrush, Bass Drive, Radio Cut, and High Cut; Chorus and Echo are
  removed. Bass Drive, Radio Cut, and High Cut are adjacent behind one cyan
  tone/filter family marker. High Cut is a clean dual-stage upper-spectrum roll-off
  that remains separate from Underwater pressure and texture.
  The compact footer `FX ↑` trigger opens a `2 × 4` deck with independent depth,
  authored one-tap defaults, RESET, and one final compressor. Checkpoint
  `0f4a501` is live in build `20260901-1943`; office DSP/build/exact-viewport
  QA, canonical byte identity, and exact live `773 × 601` interaction QA pass.
  Revised Tesla listening `R4-07` remains open.
  The visible card follows the
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
  `20260901-2232` separates the
  true Illobo catalogue from Jamendo, publishes and verifies all 29
  owner-authorized recordings, retains the final Illobo identity plus
  Tesla-facing playback title, exposes all 15 verified Jamendo genre routes,
  and makes every explicit Featured press start
  randomly without dropping an Illobo identity, and recreates every explicit
  Featured target so the chosen complete recording starts at `0:00`. The earlier 23-track audit was
  Jamendo-only and is not Illobo evidence. Physical-Tesla listening of crossfade, buffering, touch, QR,
  transport, licence and effects behavior remain open; no offline-duration promise is made. See
  [`SOUNDTRACK-SOURCE-POLICY.md`](SOUNDTRACK-SOURCE-POLICY.md).
  Regression checkpoint `1ef48be`, canonical as build `20260902-1954`, removes
  two latent browser-lifecycle hazards exposed by the Tesla. Soundtrack and the
  adaptive macro detector now borrow one exact AudioContext in either launch
  order, with ownership-aware teardown, so a separately suspended muted engine
  cannot starve the audible Soundtrack graph of vehicle macros. Initial play,
  selection, NEXT, PREVIOUS and natural-end advancement now have a ten-second
  wall-clock start deadline: a never-settling media `play()` rolls back to the
  prior audible identity, discards the incomplete target, silences any late
  stale settlement and remains retryable. Raw REPORT states the context
  topology, macros, media roles and effects readiness without exposing URLs.
  Deterministic pending-promise coverage and exact local/canonical `773 × 601`
  transport QA pass; physical braking audibility and degraded-network recovery
  remain Tesla tests `R4-08` and `R7-14`.
- **The running footer follows Swiss Compact geometry.** MUTE and FX are
  adjacent equal-width controls with one direct `LABEL / ON–OFF` hierarchy,
  both announce a 1.5-second centred status, and the two-row palette remains at
  the far-right edge. The footer is `72 px` at `773 × 601`; obsolete `GLOBAL`
  and active-count microcopy stays hidden while `15 px` labels and `18 px`
  active names preserve their distinct roles.
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
- The canonical live product is version `0.0.0`, diagnostic audio implementation
  checkpoint `26c4043`, deployed source/documentation checkpoint `1795f0b`,
  build `20260903-2103`. It retains Underwater-only checkpoint `1d43158`,
  audio-contention checkpoint `89d3f15`, and compact-layout
  checkpoint `0d5bb05`, and publishes Road Sheet LIGHT/DARK/AUTO and Swiss Compact
  across the public product, diagnostics, Discover, ATLAS, owner LAB package,
  and ShaderGradient workbench. It also hardens the shared Media Session and
  on-screen transport while preserving the audio-source, renderer,
  remote-source, and licensing boundaries. It retains the ATLAS-local persisted
  `MAP COLOR / PALETTE|STANDARD` switch and dark semantic cartography while
  retaining product-palette route, marker, Navigator Plaque, Drive Lab and UI
  accents. The same build
  publishes mandatory insert `10C` while retaining the single three-variant
  GRADIENT 08 family, shared Soundtrack/adaptive AudioContext and bounded
  recoverable media starts from `1ef48be`, together with the stronger PRTCL
  UNDERWATER/surfacing response, the truthful post-130 readout with a clamped
  audiovisual ceiling, the passenger safety disclosure, backdrop/swipe drawer
  dismissal and the `226 px` Tesla palette, together with the
  complete `10A` / `10B` drive-note interaction and density closeout, including
  the verified Buy Me a Coffee flow, together with the corrected owner-selected vertical ATLAS
  Drive Lab hierarchy together with the complete readable
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
  Plaque `79d9c9b`, corrected Drive Lab `7c9df06`, MUTE/FX parity `c0a2f78`, Illobo/title
  implementation `05a754b`, cover correction `6218f98`, Featured-launch
  correction `1171157`, transition correction `dcb6801`, and Tesla Soundtrack
  relay/activation/effect correction `4b36069`, Featured random-start
  `61471e8`, true Illobo catalogue `1a47e23`, and track-head guarantee
  `236f2c9`. Its guarded publication, read-only pre/postflight, and
  HTML/main-JavaScript/main-CSS byte identity pass. Exact live `773 × 601`
  Browser QA proves Swiss Compact's `72 / 384 / 72 / 72 px` vertical
  composition, seven-track top and six-track footer grids, persistent `532 px` Now Playing,
  Music's single scroll, Discover's non-clipping `246 px` rail and `64 px`
  result rhythm, REPORT, and the `320 px` ATLAS Drive Lab with full-map
  collapse/reopen and mandatory attribution clear of hint and transport. Exact
  local `702 × 546` and `1280 × 720` QA proves responsive shell bounds without
  source/network collision. All inspected canonical warning/error logs are
  empty. The authenticated LAB
  gate retains its no-store/CSP boundary; physical-Tesla cabin/glare/touch,
  motion, native Media Session, and listening acceptance remain open.
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
  Sites build pass.
- Follow-up checkpoint `f8f554b` spends that recovered sidebar height on
  content rather than labels: the visible `LANGUAGE` row is removed while the
  localized select keeps its accessible name, the three scope controls measure
  `38 px` high, and result distance/ETA metadata grows to `11.5 px`. Focused
  `10/10`, complete `541/541` and the 148-module App / 71-module LAB / Sites
  build pass together with the image-balance correction. Canonical build
  `20260901-1624` at `fd4b636` publishes both checkpoints with byte-identical
  HTML/JS/CSS. Exact live `773 × 601` Browser QA measures the responsive
  Basilica infobox at `165.3 px`, confirms the uncropped `145.3 × 218.8 px`
  lead image, accessible label-free language selector, `38 px` scopes,
  `11.5 px` metadata, complete article/result scrolling and an empty log. Only
  target-Tesla `R10-00A`–`R10-05` acceptance remains open.
- Product checkpoint `cdccbd7` supersedes only the custom article renderer.
  Discover now embeds the complete localized Wikipedia page directly with
  `useskin=minerva&minervanightmode=1`, leaving responsive layout, information
  cards, media, chapters, links, colours and edition-local chrome to Wikipedia.
  The iframe presentation is scaled `1.2×` for the owner-selected large cabin
  reading size without rewriting article CSS. Focused Discover `10/10`, complete
  `486/486`, nine Sites packaging checks, the 148-module App / 71-module LAB /
  protected LAB build and exact local `773 × 601` English/Italian Browser QA
  pass. Build `20260901-2300`, published from checkpoint `c98414d`, adds
  protected FTP publication, canonical HTML/JS/CSS byte identity and exact live
  English/Italian Minerva verification with no canonical warning/error.
  Target-Tesla `R10-03` remains open.
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
  pass, while physical-cabin checks for the published baseline remain
  `R4-01`–`R4-06`, `R5-01`–`R5-05`, `R7-01`–`R7-09`, `R8-01`–`R8-02`,
  `R9-01`–`R9-05` and
  `R10-01`–`R10-05`. Exact
  progressive evidence is in [`DEPLOY.md`](DEPLOY.md).
- Diagnostic telemetry contains no coordinates and is sent only after the
  explicit `SEND DIAGNOSTIC` action. ATLAS/DISCOVER location is a separate
  ephemeral feature: the latest reliable point stays in session memory;
  OpenFreeMap tile requests occur only while ATLAS is selected, while DISCOVER
  alone sends a coarse localized Wikipedia nearby-search cell. ATLAS additionally sends an
  approximately `0.001°` rounded cell to Open-Meteo for Copernicus terrain
  elevation; the response and histories remain session-only.

## Mandatory 2026-09-01 owner corrections

The 09:01–09:15 owner VoiceNotes are promoted into the active milestone and
test queue, not the optional future register. Row 4's current eight-effect
roster is canonical in build `20260901-1943`: checkpoint `0f4a501` removes
Echo, adds High Cut, groups the three tone/filter controls, and passes office
DSP/build plus exact local/canonical Tesla-size Browser QA. Tesla listening
and checkpoint `d45f8dd` closes the remaining `10A` office implementation:

- physically accept the revised eight-effect `2 × 4` Performance FX deck from
  live build `20260901-1943`; deterministic graph tests, `544/544`, the
  production build, exact local/canonical `773 × 601`
  tone-family/RESET/focus QA, dedicated High Cut spectrum evidence, and a
  bounded hostile full-depth render pass, while Tesla listening remains open;
- ATLAS prepares from the best truthful session fix, exposes a visible
  waiting/degraded state without a black lock, and refines without restart;
- previous / play-pause / next stay directly reachable over the running
  experience, supported Media Session actions share the same transport, and a
  large bounded notice follows committed title/album-or-source/artist identity;
- every shared drawer accepts cancelable downward/rightward swipe dismissal and
  outside-backdrop taps while preserving scroll, CLOSE, Escape and focus release.
  Interior swipes are pointer-captured; the first `28 px` of the left edge is
  deliberately left to embedded Chromium's native history gesture;
- 29 measured public Illobo WebP derivatives total about `380 KB`; the matching
  512 px HD PNG masters remain local under `artwork-masters` and are not shipped;
- the Tesla footer palette now measures `226 px` wide at `773 × 601`, with larger
  colour targets. The separate X10 `LIGHT / DARK / AUTO` appearance switch is
  implemented at checkpoint `6cda7ee` and canonical in build `20260903-1752`,
  uses the measured top-rail lane, and never recolours the active visual
  palette; physical Tesla acceptance remains the milestone 13 gate.

Mandatory inserts `10A` and `10B` have office and canonical PASS in build
`20260901-2232`; target-Tesla gates remain open.

The owner's five additional 17:52–18:07 Tesla notes are mandatory insert `10B`
and also have office implementation in checkpoint `d45f8dd`:

- Discover keeps the browser on the article and replaces its outbound Maps
  action with a large destination-only Google Maps QR plus concise Tesla-app
  sharing instructions. Official Tesla owner documentation supports both the
  phone share sheet after Tesla-app access is granted and Tesla app
  `Locations → Navigate → Send to Car`; actual vehicle receipt remains `R10-06`;
- the existing Jamendo vertical Pace rail, 15-genre board and real
  playback-bound activity mark remain the implementation baseline. Remove only
  the redundant `JAMENDO LIBRARY / Browse and play` and
  `AUTHORED PLAYBACK · 1×` block, retain PACE / GENRE plus the right-aligned
  fresh-mix notice, larger filter/track/artist copy, and rebalanced Now Playing
  without page scroll (`R7-13`);
- the running Visual drawer is a two-column, description-led no-scroll
  surface. The primary catalogue now contains eight choices—seven rendered
  families plus Discover. One Gradient entry starts its remembered variant; a
  persistent in-visual control cycles its three exact lazy ShaderGradient variants;
- APERTURE smooths its raw low-speed wall input and caches canvas dimensions,
  removing the per-frame layout read without slowing its motion (`R5-07`);
- versioned safe product preferences restore across supported history and
  reload lifecycles, with RESET SAVED STATE exposed in splash and
  settings (`R1-03`). GPS “position” is a distinct session-only requirement:
  after permission, one app-level collector must remain active regardless of
  the selected visual and retain the latest reliable point plus bounded
  route/journey history in memory so ATLAS and DISCOVER hydrate immediately
  after visual switches (`R9-07`). Coordinates, diagnostics, ephemeral audio
  URLs and automatic vehicle-effect envelopes remain outside persistent state.
  The watch, latest/eight-sample position buffer, bounded route and Drive Lab
  journey aggregation are App-scoped and survive ATLAS remounts.

Mandatory insert `10C` records the 2026-09-01 evening–09-02 vehicle notes.
Implementation checkpoint `92e581b`, published source checkpoint `16afc61`, is
canonical as build `20260902-2127`. It does not redo Soundtrack checkpoint
`1ef48be`: it keeps that ten-second atomic transport boundary and fixes the
surrounding launch/vehicle experience.

- Visual launch is independent from remote Soundtrack preparation. START is
  available after Music + Visual selection, explains offline/limited or pending
  data, enters the visual immediately, resumes a later prepared track, and
  retries a recoverable catalogue failure. Mute is no longer the only apparent
  route around the launch wait.
- The three transient previous/current/next media roles remain the audio
  prefetch boundary. Safe previous/current/next metadata now also drives browser
  artwork prefetch; supported Media Session previous/next remain wired.
- Debug checkpoint `c869f1d` adds an exact coordinate-free interaction and
  media flight recorder for the next Tesla run. A dedicated 1,200-entry channel
  preserves sequenced safe control activations and correlated Soundtrack
  request/completion/failure events with launch/on-screen/Media-Session source,
  before/after three-deck state, timing, buffer/readiness, error and playback
  confirmation. Browser media lifecycle plus Media Session metadata,
  playback-state and per-action registration outcomes are recorded separately.
  Significant and ordinary sample channels retain 800 and 1,200 events; the
  two-second drive trace retains one hour. Transport fitting removes
  non-interaction evidence first. Pointer coordinates, typed text, GPS
  coordinates, media URLs, persistence and automatic transmission remain
  excluded. Complete `498/498`, build and exact local raw-REPORT QA pass.
  Source/documentation checkpoint `bbc7bb9` is canonical as protected build
  `20260903-0843`; HTML, main JavaScript and CSS are byte-identical to the local
  candidate and final read-only postflight reports `remote_writes=NONE`.
  Physical-Tesla Media Session behavior and receipt of its explicitly sent
  diagnostic remain open.
- Soundtrack's source readout is a speed-only module at the current `773 × 601`
  Swiss Compact breakpoint. The persistent lower transport shares the chrome
  lifecycle and becomes hidden/non-interactive after idle. Follow-up checkpoint
  `92e581b` prevents GPS/demo motion, acceleration, braking, regeneration and
  passive pointer movement from waking resting chrome; a deliberate pointer
  press/touch still wakes it, and intentional keyboard focus remains accessible.
- Music-drawer checkpoint `543978e` presents the retained byte-identical black
  Tabler Now Playing source icon in white on the current dark surface and keeps
  `NOW PLAYING` on one line. The source stays black for milestone 13's future
  LIGHT appearance; contrast remains an appearance-token responsibility.
  Published source checkpoint `a501545` is canonical as build `20260902-2142`;
  local rendered drawer QA, canonical byte identity and canonical Browser
  identity/console checks pass. Physical-Tesla visual confirmation remains open.
- The navbar adds a compact `NET` state derived from browser hints. It is
  explicitly an estimate, not cellular signal strength, and it does not create
  a continuous ping service.
- Discover uses a `52 px` header band with a `24 px` title, `48 px` tools,
  `64 px` result rows and a `246 px` left rail at `773 × 601`. Navigation QR URLs use Google Maps search
  without `dir_action`, origin or automatic route start.
- APERTURE's four perspective planes share one longitudinal grid origin so
  depth cuts align at the corners. Splash and running Visual catalogues omit
  internal-choice counts; the drawer keeps only stable `01–08` catalogue numbers,
  while each visual reveals its own controls after selection.
- Existing versioned safe preferences and both reset controls cover the requested
  product-state restoration. Coordinates, route history, transient audio URLs,
  autoplay state and automatic vehicle envelopes remain deliberately
  session-only.

Focused checks pass `80/80`; the complete suite passes `579/579`; the
235-module App / 159-module protected LAB / Sites production build passes.
Exact local `773 × 601` QA covers constrained-network START, preference reload,
non-overlapping Soundtrack navbar cells, chrome retraction, the measured
Discover composition and corrected APERTURE seams. Protected publication,
local/live byte identity and exact canonical Browser QA pass. All physical
Tesla/phone `R10C-*` acceptance remains open. The `92e581b` retraction follow-up
passes focused `32/32`, complete `580/580`, production build, protected
publication, byte identity and rendered local/canonical
`controls-resting → ArrowUp → controls-resting → visual click → controls-awake`
interaction QA. Physical `R10C-04` remains open.

Row 11's earlier Original Gradient Field is retired. Its replacement—one
Gradient 08 family with Japanese Mist, Acid Orchard, and Chromatic Silk
variants—has automated plus exact local and canonical `773 × 601`
interaction/WebGL/console PASS in build `20260902-1905` from product checkpoint
`87a5668`; the complete suite passes `563/563`. Both catalogues contain eight
primary choices and show Gradient once. One tap starts the remembered variant;
the persistent `VARIANT` control cycles `MIST → ORCHARD → SILK → MIST` without
a picker or reload. Canonical HTML, main JavaScript, CSS and the lazy
ShaderGradient chunk are byte-identical to the verified candidate. Target-Tesla
motion/performance acceptance remains open.

Row 11A's comparison bench is complete locally and inside the protected LAB. Its
three selected studies now also enter the public product as variants behind one lazy
visuals. For pinned ShaderGradient `2.4.20`, the workbench
exposes all ten exported upstream presets, all three geometries, all four
registered shader families, and every useful public visual/runtime parameter in
organized disclosure groups. These cover motion/timeline, colour and grain,
3D/HDR lighting, transform, camera/touch, canvas/performance and normalized
official-URL import. Default 3D lighting remains local; HDR mode is explicitly
marked as a remote dependency. Framer panel metadata and raw callback/object
plumbing are not misrepresented as creative controls.
Checkpoint `1a79cea` is canonical as protected build `20260902-1341`.
Preflight/postflight, protected packaging and the unauthenticated live gate pass;
authenticated target-Tesla rendering and control reach remain `R11A-01`.

### 2026-09-03 Automotive Glance and Soundtrack stability checkpoint

Implementation checkpoint `d38c333`, exact-live copy follow-up `68b1830`, and
always-visible overlay correction `be74aa6` respond to the physical-Tesla report from
canonical build `20260903-0843` without claiming that office evidence closes
vehicle listening. The selected **Automotive Glance** system establishes a
tested universal `20 px` visible-type floor across the public App, owner LAB,
ShaderGradient workbench, diagnostics, Discover, ATLAS attribution, and every
responsive rule. Body/control copy uses `20–24 px`, important values `24–28 px`,
headings `28–36 px`, and the exact `773 × 601` navbar/footer are `100 px`.
Secondary copy is removed or content becomes deliberately scrollable before any
text may shrink. Healthy network state is an accessible outlined dot; limited
and offline states use large actionable copy and expose the browser downlink
estimate when available.

The lower Soundtrack surface is no longer a transient notice. Whenever chrome
is awake, one persistent overlay immediately above the footer presents current
artwork, title, artist/source, and `72 px` previous/play-pause/next controls.
It follows the committed identity for Jamendo and Illobo, natural track end,
explicit drawer selection, and on-screen or native transport. Handler
registration is stable for the whole running session and every previous/next
request enters one serialized queue. The overlay sits outside the inert visual
experience so it remains visibly and interactively above every in-page drawer;
drawers reserve its lower space instead of hiding content behind it.

The three-deck loader now gives bandwidth to the audible programme first.
Current owns automatic preload; adjacent roles start metadata-only and promote
only NEXT after current has at least `30 s` of observed contiguous headroom.
PREVIOUS rewinds and reuses a healthy retained deck instead of
destroying its buffer. Every initial, manual, or automatic target starts silent,
waits for a six-second observed contiguous floor within the existing ten-second transaction,
rewinds, and only then becomes audible; the prior track and metadata remain
committed through pending or failed work. Soundtrack creates the shared context
with a playback latency hint.

The complete suite passes `501/501` plus `9/9` Sites checks; production App,
protected LAB, and Sites builds pass. Exact local Browser QA at `773 × 601`
and `1280 × 720` finds no visible text below `20 px`, no selector/chrome
overflow, a non-overlapping persistent player, real Jamendo PREVIOUS and NEXT
changes, and no console warning/error. The constrained-network START status was
shortened after the first live target-viewport pass found it wrapping. `R10C-02`, `R10C-03`, `R10C-06`, and
`R10C-07` retain their earlier canonical code/model evidence, but none is
physically concluded: weak-network Tesla playback, native Tesla Media Session,
phone/car QR receipt, and moving-Tesla APERTURE seams remain the decisive gates.

Canonical build `20260903-1155` publishes built source/documentation checkpoint
`cc6afd0`. Live target-viewport QA confirms zero visible type below `20 px`, the
single-line pending-network START status, a top-hit-tested Now Playing dock above
the Music drawer, and real Jamendo `Make It New → I Want You → Make It New`
Back/Forward navigation without warning/error. This is strong browser evidence,
not a substitute for the remaining physical-Tesla listening and integration gates.

### 2026-09-03 Swiss Compact published checkpoint

The owner selected Direction 1 / **Swiss Compact** as the replacement for the
Automotive Glance typography calibration. The published source applies it
across the public App, diagnostics, Discover, ATLAS, owner LAB, and the
ShaderGradient workbench without changing audio, Media Session, Now Playing
identity, renderer ownership, remote-source, or licensing boundaries.

- Semantic roles are `14 px` metadata, `15 px` labels, `16 px` body/actions,
  `18 px` active names, `24 px` titles, and `34 px` primary values. The
  typography contract asserts those roles rather than a universal minimum.
- Important actions use `48 px` targets and primary actions use `56 px`, so
  interaction geometry remains independent from typography.
- At `773 × 601`, the top bar, Now Playing band, and footer are each `72 px`.
  Now Playing is `532 px` wide with `56 px` artwork and `48 / 56 / 48 px`
  previous/play-pause/next targets.
- ATLAS uses a `320 px` panel, `340 px` canvas, tabular Canvas2D metrics, and
  `14–16 px` map/place labeling. DISCOVER uses a `52 px` heading band,
  `48 px` tools, and `64 px` result rows.
- Space Grotesk remains the reading and control face; Orbitron remains isolated
  to the established project wordmarks. Editorial names remain Title Case,
  functional micro-labels remain uppercase, and changing values remain tabular.

Exact local Browser QA from checkpoint `bcec32e` passes at `773 × 601` and
`1280 × 720`. One joined `1546 × 601` comparison places the selected source and
the controls-awake implementation at the same `773 × 601` viewport. Splash,
launch, running/resting chrome, Music and Visual drawers, Discover, REPORT,
ATLAS open/collapsed, constrained/offline network states, owner LAB, and the
ShaderGradient workbench remain readable and operable with empty warning/error
logs. Focused checks pass `92/92`, the complete unit group passes `505/505`,
Sites passes `9/9`, and the 235-module App / 159-module protected-LAB production
build passes.

Canonical build `20260903-1448` publishes built source/documentation checkpoint
`5303fdf`. Protected preflight/postflight, complete-tree publication, and
canonical HTML/JavaScript/CSS byte identity pass. Exact live Browser QA covers
the shell, Music, Discover, REPORT, and ATLAS open/collapsed at `773 × 601`,
plus the wide shell at `1280 × 720`, with empty warning/error logs. The owner-LAB
package passed the local build and typography matrix; its live authenticated
boundary remains intact. Physical-Tesla legibility, glare, touch, motion,
native Media Session, and listening remain open.

### 2026-09-03 Road Sheet appearance and media-control canonical checkpoint

Implementation checkpoint `6cda7ee` is canonical through deployed
source/documentation checkpoint `bd572b2`, build `20260903-1752`. It makes LIGHT
the default and adds the direct persisted
LIGHT/DARK/AUTO sun/moon/sun-moon menu. AUTO uses an observable system scheme
first, then an already-consented session position for solar phase, and finally
a safe fallback; it neither requests GPS nor stores coordinates. Appearance
tokens cover shared chrome without changing the active visual palette.

The same checkpoint makes browser-native and on-screen Play, Pause, Previous,
and Next share stable handlers for Play the Road and Soundtrack. Media Session
publishes only truthful committed metadata, artwork, playback state, and valid
position. Its serialized intent queue cancels stale work after newer playback,
source, track, score, or reset intent; duplicate Play during buffering shares
one activation, and Pause then Play preserves the observed position. Native
invocation IDs, order, and correlated outcomes enter the coordinate-free flight
recorder.

The aggregate gate passes `615/615`: unit `521/521`, Sites `9/9`, and all
feature suites. The `239`-module App / `159`-module protected-LAB production
build passes. Protected publication uploaded `184` files / `215,967,240` bytes
after and before read-only `remote_writes=NONE` checks; canonical HTML,
JavaScript, and CSS are byte-identical to the candidate. Exact live
`773 × 601` Browser QA passes LIGHT/DARK/AUTO, system-dark AUTO with unchanged
`data-palette=acid`, menu focus, return to LIGHT, on-screen Pause/Play, and
`Junction 01 → Fracture 02 → Junction 01` Next/Previous with an empty console.
Local `702 × 546` and `1280 × 720` responsive QA also passes. Physical-Tesla
native-control, listening, distance, glare, and touch evidence remains open.

### 2026-09-03 Tesla Soundtrack stutter correction published

The first physical-Tesla pass on canonical build `20260903-1752` failed
continuous playback: both Jamendo and Illobo stuttered repeatedly after two or
three minutes on one recording. A speed test in the same browser measured
`54.3 Mbps` down, `30.6 Mbps` up and `25 ms` latency, separating the failure
from a simple lack of aggregate bandwidth. The product's simultaneous
`navigator.connection` estimate is only a coarse browser hint and is not
accepted as a speed measurement.

Audio checkpoint `89d3f15` preserves the one playback-oriented shared
AudioContext but does not create silent Play the Road worklets during a
Soundtrack launch. Braking macro detection and speed-only visual
response continue; an explicit Play the Road switch initializes the processors
lazily. Diagnostic-driven checkpoint `26c4043` supersedes the optimistic
readiness detail: when the browser exposes `TimeRanges`, audible admission
requires six real contiguous seconds and never accepts `readyState=4` alone.
Only after the current fixed recording proves `30 s` of forward headroom may
the next deck promote to audio preload. The previous role keeps
any browser-owned data and remains reusable without requesting a second
speculative audio stream. Each media lifecycle record now carries the emitting
deck key/role, exact forward headroom, readiness/network state, and playback
intent. Invariant checkpoint `a2545c4` updates the complete startup/fallback
source gate.

Layout checkpoint `0d5bb05` restores the accepted Tesla composition without
changing Swiss Compact type sizes: horizontal Play the Road/Soundtrack tabs,
two `372 px` Lobo/Jamendo cards, and a `96 / 634 px` Pace/Genre split containing
all 15 genres at exact `773 × 601`. Splash card titles share their row top, and
the Jamendo three-cover stack no longer enters its copy column. Headless local
Chrome proves the exact viewport, paired columns and zero horizontal overflow;
the aggregate suite passes `617/617` and both production builds pass. No office
test can close the continuous Tesla listening gate. The original correction was
canonical build `20260903-1953`; current build `20260903-2137` from
source/documentation checkpoint `4ffd707` carries it forward while removing
OPEN/BLOOM and adding diagnostic-driven admission. Protected publication, independent postflight, canonical HTML/JS/CSS
byte identity, cache `MISS`, trusted-input exact-viewport layout and zero
inactive score-worklet requests during Soundtrack startup pass. Retest with
Gradient and a lighter visual, and send the existing diagnostic if any stutter
remains. The supplied failed-drive diagnostic records `11` waiting and `16`
stalled events, audio requests open for `42–87 s`, and some Illobo starts with
only `1.83–2.27 s` of contiguous buffer despite browser-ready states. Aperture,
Japanese Mist, and overall frame evidence remain near `59–60 FPS`; the report
does not support attributing the dropout to Aperture styling. The new
`26c4043` correction is canonical. Exact live headless Chrome at `773 × 601`
starts Soundtrack on dry Aperture, requests no inactive score processor, records
no console event, and retains exact canvas/document bounds. Only a physical
Tesla listen can accept continuous playback.

UI normalization checkpoint `0ec5d4e` gives Gradient, Drivey, and PRTCL one
shared contextual-control origin and geometry. Exact local headless Chrome at
`773 × 601` measures `x=16`, `y=82`, `112 × 55 px` for each first switch and
proves `MIST → ORCHARD`, `REAR → AERIAL`, and `AXIOM → FRACTAL` interaction.
The same pass measures a `104 × 72 px` speed cell containing only value plus
`KM/H`, and a `112 × 72 px` network cell whose hollow ring and persistent rate
are green, orange, or red together. Browser QA, `504/504` product checks,
`9/9` Sites checks, and production builds pass. Build `20260903-2137` from clean
source/documentation checkpoint `4ffd707` is canonical after the owner-approved
normal publisher switched the dynamic root through its exact hash-gated cleanup.
Independent read-only postflight passes; canonical HTML/JavaScript/CSS are
byte-identical to the local candidate, and the public JavaScript embeds the
expected build and commit. Physical-Tesla distance, glare, touch, network
interpretation, and continuous audio listening remain open.

## 2026-09-04 Tesla Compact interaction correction

The current local product uses a modest Tesla-reference calibration rather than
shrinking touch geometry: semantic type is `13 / 14 / 15 / 15 / 17 / 22 / 32
px`, primary chrome is `64 px`, actions remain `48 px`, and primary actions
remain `56 px`. LIGHT and DARK surfaces use neutral gray/near-black families
with signal red while retaining the existing Space Grotesk product identity.
The values are product tokens calibrated against the current community Tesla UI
reference; they are not represented as an official Tesla in-vehicle design
specification.

Passenger surfaces are now immersive. Opening any shared drawer, including
DISCOVER, suppresses top chrome, footer, contextual controls and Now Playing.
ATLAS never mounts Now Playing; when chrome rests, its `320 px` Drive Lab panel
expands from `64 px` insets to the full `601 px` viewport height. The Canvas2D
chart changes between dark and high-contrast light ink with the product
appearance. Closing a drawer releases focus restored to the former trigger, so
the idle timer can retract chrome instead of polling a focused control forever.
Drivey, PRTCL and Gradient contextual controls now disappear with chrome and
return on the next screen touch, with the shared `6 px` radius.

Soundtrack begins one deduplicated catalogue/current-role warm-up during the
Signal Gate and reuses it from the launch selector. Gradient preserves its
continuous Underwater response while reducing active-brake framebuffer density
from `1` to `0.8`, a 36% pixel-count reduction at fixed CSS size, and avoids
Soundtrack-only audio subscriptions in its response calculation. Static and
local rendered checks pass; physical Tesla frame pacing, glare and first-load
Jamendo playback remain acceptance gates until the canonical candidate is
published and driven.

## Open work

1. Execute live Tesla `R4-07`–`R4-09`, `R7-15`, the canonical `10A` / `10B` /
   `10C` codes, and row 11 on final build `20260903-2137`. Execute Tesla tests
   `R1-01`–`R1-03`, `R4-01`–`R4-09`,
   `R5-01`–`R5-07`, `R7-01`–`R7-14`, `R8-01`–`R8-03`, `R9-01`–`R9-07`,
   `R10-00A`–`R10-06`, `R10C-01`–`R10C-08`, `R11-01`–`R11-06`, `R11A-01`, and
   the now canonical `R13-00`–`R13-03` from
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
   and braking UNDERWATER. Automated visual, structural and
   loudness evidence is not perceptual acceptance.
5. Audition NIGHTSHIFT at low volume, verify perceived phrasing and loudness
   against both existing scores, then validate acceleration/reversal behavior in
   the target Tesla. Automated measurements are not perceptual acceptance.
6. Keep JUNCTION real-audio pitch admission disabled until isolated-source
   provenance can satisfy the now-tracked ADSR/filter/phase/detune/chorus/
   spectral/saturation and stereo-coherence validity gates. The synthetic stack
   is complete; its explicit abstention is the current correct result.
7. Validate PRTCL's stronger UNDERWATER collapse/recovery and each of Japanese
   Mist 08, Acid Orchard 09, and Chromatic Silk 10 across rest-to-130 motion,
   Play-the-Road audio response, Soundtrack speed-only behavior, sustained frame
   pacing, and thermal behavior on the target Tesla.
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
| Current | this page, `README.md`, `PRODUCT-SPEC.md`, `TECHNICAL-DIRECTION.md`, `ROADMAP.md`, `MODES.md`, `SESSION-HANDOFF.md`, `ASTRA-UI-HANDOFF-2026-09-04.md` | Must describe the current repository, verified product state, and explicitly queued office continuation |
| Evidence | `DEPLOY.md`, `DIAGNOSTICS.md`, `AUDIO-QA-2026-08-28.md`, `CHANGELOG.md` | Append-only chronology; older failures remain true historical evidence |
| Knowledge | `MUSIC-CRAFT.md`, `LOCAL-SHADERGRADIENT-LAB.md`, licensing and reference studies | Durable technique, provenance, local comparison instructions, and decision records |
| Future ideas | `FUTURE-IDEAS.md` | Canonical long-horizon owner-idea register; agent proposals remain explicitly separate and unapproved |
| Selection record | `FLUX-VISUAL-DIRECTIONS-2026-08-29.md` | PLUMB and WAKE rejected and retired; SLIP remains proposal-only |
| Historical | `RECOVERED-REQUIREMENTS-2026-08-26.md`, `ADVERSARIAL-REVIEW.md`, `SOURCE-AUDIT.md`, dated work plans | Preserve the reasoning and rejected baselines; do not treat their “current” wording as current product state |

`SESSION_HANDOFF.md` is a retained legacy filename and points to the canonical
hyphenated [`SESSION-HANDOFF.md`](SESSION-HANDOFF.md).

## 2026-09-04 Astra semantic foundation (UI integration pending)

The office audit and full remaining ledger are in [ASTRA-UI-AUDIT-2026-09-04.md](ASTRA-UI-AUDIT-2026-09-04.md). A cached semantic colour resolver now covers all ten palettes, both appearances and fifteen critical roles, with a reproducible raw/resolved contrast matrix. It is not yet connected to product components: no corrected UI or complete browser regression is claimed. The foundation passes 625 automated checks including Sites 9/9 and the real PHP fixture, plus the exact-toolchain ARM64 production build. The shared Dropbox dependencies contained stale Vite/PostCSS; the verified build used an isolated temporary dependency cache without rewriting that tree. Direction selection and the requested headless-browser fallback answer are pending in this same task; canonical deployment remains withheld.

## 2026-09-04 office completion — refined Balanced Rail

The owner selected direction 1, authorized Playwright/Chrome and requested a
strict chrome lifecycle. The earlier semantic-foundation pending status is now
superseded by [the completed verification](ASTRA-UI-VERIFICATION-2026-09-04.md).

Implemented: unified footer/Now Playing animation and inert boundary; suppression
while any surface is open or ATLAS is active; immediate action/close retraction;
6-second inactivity independent of stale focus; genuine open surfaces retain
chrome; motion at or above 0.8 km/h keeps unpinned controls and the mark hidden.
The stationary 16 mark remains first. Rail glyphs share 32 px optical frames and
2 px stroke; touch targets retain 48/56 px minima. UNDERWATER matches the 96 × 64
speed badge and uses palette-derived contrast-safe colour. ATLAS gains case,
spacing and chart contrast; DISCOVER gains two-line names and loses numbering.
The full-cell palette opens ten large targets. Semantic integration covers 320
role variants and 180 measured rendered text/background pairs. Splash preparation
survives React trial cleanup and is reused by Soundtrack selection.

Passed: 625 native checks including actual PHP gzip fixture and Sites 9/9;
64 rendered lifecycle checks plus 6 preload/Gradient/badge checks; zero browser
warnings/errors; native ARM64 App 242/LAB 154/Sites production build; diff whitespace
check. The pre-existing build chunk-size advisory remains. Real Tesla acceptance
and canonical deployment remain unperformed. No `_references/` or secret files
were accessed or added. Source/runtime licensing boundaries are unchanged.


Verified product checkpoint: `0696283`, pushed cleanly to origin/main. The local
ARM64 production artifact is build `20260904-2333` (VERSION remains `0.0.0`).
The subsequent traceability commit changes documentation only. No deployment.


## Canonical publication confirmed — 2026-09-04 23:59

The owner-authorized build **20260904-2351** (VERSION **0.0.0**, clean source
**6c362ac**) is now verified at https://sedicivalvole.app/. This supersedes the
earlier local-only/no-deployment status without changing its historical record.
The final documentation checkpoint is a descendant of that built source.

Passed: **626** native tests including actual PHP and Sites **9/9**, clean ARM64
App/LAB/Sites build, protected 183-file publication with 29 full audio hashes,
read-only postflight, **12** canonical HTTP/asset identity checks and **64** live
browser lifecycle checks at **773 × 601**, with zero warning/errors or overflow.
The deployment gate now retains the verified v3 diagnostic predecessor during
the transition to v4. The existing build chunk-size advisory remains.

[Deployment and browser evidence](ASTRA-UI-VERIFICATION-2026-09-04.md) records
exact hashes, current captures and the config-use authorization. Next: owner
Tesla acceptance of chrome/player retraction, palette/ATLAS readability,
UNDERWATER, GPS, continuous audio/native media and sustained GPU behaviour.
Browser evidence does not close these physical gates; no diagnostic was sent.


## Weekend continuation — 2026-09-05 00:11

Long-trip diagnostic work, approved curated-experience and travel-ATLAS/statistics
directions, Engine study intake limitations and the morning recovery checklist
are recorded in [WEEKEND-HANDOFF-2026-09-05.md](WEEKEND-HANDOFF-2026-09-05.md).
The active short-drive baseline is build 20260904-2351; the later publication
identity will be appended to the weekend handoff after verification.


## Long-trip canonical checkpoint — 2026-09-05 00:20

Build **20260905-0012**, source **41721eb**, is verified at the canonical root.
Whole-session diagnostic windows now complement the rolling detailed trace.
Passed 629 native checks including actual PHP/Sites 9/9, ARM64 production build,
12 canonical HTTP/asset checks and three live diagnostic integration checks.
The browser SEND test was intercepted locally; no email was sent. See the final
publication section and morning checklist in
[WEEKEND-HANDOFF-2026-09-05.md](WEEKEND-HANDOFF-2026-09-05.md).
Curated experiences, travel ATLAS and the separate statistics visual remain
approved drafts. Engine intake is partial; no complete review or integration
is claimed. Preserve allowance for incoming Tesla evidence.


## Moving-control accessibility correction — 2026-09-05 00:26

Real Tesla feedback exposed a mistaken interpretation of speed-only resting chrome:
`wakeControls`, rendered visibility, footer inert state and the per-speed effect
collectively prevented deliberate access above 0.8 km/h. The owner could use controls
again after stopping. Fix: explicit wake is speed-independent, departure retracts
only on the stationary-to-moving transition, and later speed samples do not revoke
user intent. Inactivity, action/close retraction and genuine open-surface pinning
remain intact. The committed browser matrix now holds acceleration during moving
interaction tests instead of asserting that touches must be ignored.

The supplied diagnostic was received in Gmail (build 20260904-2351) and its gzip
attachment was inspected locally through the raw MIME message. It reports no runtime
issues and a final speed below the old threshold, consistent with the report. Its
short retained recording is not proof of every touch or the entire journey. No
private report, mail content or attachment is committed.

629 native checks and 69 browser matrix checks pass with zero browser warnings/errors.
Publication identity and the focused live Vertigo regression will be appended after
deployment. This correction supersedes earlier claims that ignoring moving taps
was desirable; previous recorded tests remain historical evidence of the wrong rule.


## Moving-touch publication — 2026-09-05 00:35

Build **20260905-0028** (source **8dab1b3**) is verified live. Explicit wake is
speed-independent; departure retracts once and subsequent speed samples cannot
cancel deliberate control access. The old moving-touch lock is superseded.
629 native, 69 local browser and four focused live moving-interaction checks
pass. Full publication, console-policy caveat and the next Tesla confirmation
are recorded at the end of [WEEKEND-HANDOFF-2026-09-05.md](WEEKEND-HANDOFF-2026-09-05.md).


## Palette and Music refinement — 2026-09-05 00:57

Canonical **build 20260905-0051**, source **ade6c84**, replaces duplicated footer
swatches with a Tabler icon and `Palette` label, gives popup names readable Title
Case, compacts Music typography and aligns Now Playing artwork/copy/transport and
credit columns. Moving-touch access and whole-journey diagnostics remain included.
Passed: 629 native checks (actual PHP, Sites 9/9), 69 local browser lifecycle
checks, 20 targeted checks locally and live, four live moving-interaction checks,
ARM64 production build, 10 post-build checks, 13 canonical HTTP/asset checks and
independent publication postflight. Publication verified 184 files and all 29
Illobo recordings. Zero warnings/errors in the established user-gesture Chrome
profile; the earlier default-policy startup warning remains a separate follow-up.

[Verification and before/after comparisons](PALETTE-MUSIC-VERIFICATION-2026-09-05.md)
record contrast (Music minimum 4.95:1 LIGHT / 6.98:1 DARK), 48/56 px geometry and
exact publication identity. The newly attached gzip is the same earlier 2351
report already inspected in Gmail; it does not validate either later fix.
Next: reload for 0051, confirm deliberate moving touch and Music readability on
the target Tesla, then gather a new diagnostic if needed. Multi-hour vehicle
acceptance remains open; approved experience/Atlas/statistics drafts and Engine
review limits remain as recorded in the weekend handoff.

## 2026-09-05 — Round Lobo marks and two curated grooves

Product source: **202e100**, including main refinement **f487b7b**. Build: **20260905-0152**, VERSION **0.0.0**. Both source checkpoints were pushed to `origin/main` from the saved Dropbox checkout; only one writer was used.

- **Night Glass**: Vertigo / Graphite / DARK / Lounge. The owner found Ambient too experimental and synth-test-like; Lounge replaces it. This is an existing genre catalogue, not an individually auditioned playlist.
- **Neon Groove**: Aperture / Neon / DARK / Funk. Both presets are available before START and in the running Visual library. They use the existing music/visual owners, preserve independent controls, prepare silently, and close the picker after a runtime choice.
- **Lobo Playlist**: the two supplied root SVGs were relocated into the existing public featured-mark paths, byte-identical. Existing eight-second light/dark crossfade and reduced-motion behavior remain. Reviewed old/new hashes protect publication.
- **UNDERWATER**: 32 px tall, attached immediately below the unchanged 64 px speed control. Palette-safe background and down/up motion remain. The tested palette measures 8.76:1 LIGHT / 4.52:1 DARK.
- **Compact layout**: equal experience cards share one Tesla-width row and stack on narrow screens; final narrow typography keeps Soundtrack whole. Touch targets remain unchanged.

Validation: 634 native checks (including actual PHP 24-hour gzip round-trip and Sites 9/9), 35 focused splash checks after the final selector fix, 69 browser lifecycle checks, 16 checks per experience, two delayed/failing-catalogue fixtures, 10 post-build checks, clean ARM64 build and `git diff --check`. Browser checks prove actual advancing media time and moving wake/retraction, not musical quality or target-GPU acceptance. Main JS is 755,416 bytes, +465 bytes from build 0116; the new real Aperture preview is 82,311 bytes. No new dependency, renderer loop or audio graph. Vite retains its existing large-bundle advisory.

Evidence: `docs/qa/2026-09-05-groove/` and `docs/NIGHT-GLASS-2026-09-05.md`. Historical Ambient screenshots and build 0116 evidence remain labeled as earlier states; current production/live captures supersede them.

Morning recovery: read AGENTS, CURRENT-STATE, SESSION-HANDOFF, this weekend handoff and NIGHT-GLASS before resuming. Verify Git/Dropbox and canonical build first. Try Neon Groove, then Night Glass; assess musical fit and switching in the Tesla, and send an explicit diagnostic only through the existing in-app flow. Do not infer musical listening or real multi-hour acceptance from automated playback. Sunday endurance, travel-focused ATLAS, a separate statistics view and the Engine study/prototype remain pending drafts. No Engine runtime was added here.

### 2026-09-05 01:59 — Canonical publication verified

Live at **https://sedicivalvole.app/**: build **20260905-0152**, source **202e100**. Official publication verified **186 files / 216,249,308 bytes**, all **29 Illobo tracks** by full hash, and retained two prior assets for cache overlap. Preflight and independent read-only postflight pass. Seventeen public HTTP checks prove bare/cache-busted canonical HTML, all JS/CSS bytes, both round SVGs, both experience previews, LAB availability and diagnostic method boundary. HTML remains no-store. Night Glass and Neon Groove each pass 16 live browser checks with zero warning/error output. Live capture scripts await image decoding to avoid treating a pending request as missing artwork.

The automatic review initially rejected the official script's internal configuration access despite recovered earlier consent. The owner directly renewed the narrow exception for official preflight/publication/postflight without displaying or logging configuration; the official flow then completed. No alternative credential route was used. No diagnostic email was sent.

Changed card text measures at least **4.95:1 LIGHT / 6.98:1 DARK**, with 357 × 82 px targets and a visible 3 px focus outline at 773 × 601. The build has a pre-existing large-chunk advisory; real Tesla GPU, listening quality and multi-hour journey acceptance remain open.
