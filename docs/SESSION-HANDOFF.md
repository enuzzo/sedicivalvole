# Session Handoff

Status: **live working record**. Updated on 2026-09-04.

Start with [`CURRENT-STATE.md`](CURRENT-STATE.md) for the product overview. This
file records implementation boundaries, verification commands, and next work so
a new session can continue without reviving superseded prototypes.

## Repository and publication

- branch: `main`, with a configured `origin`;
- semantic version: `VERSION` = `0.0.0`; no release exists;
- canonical development URL: <https://sedicivalvole.app/>;
- latest deployment attempt and verified publication evidence: first entries in
  [`DEPLOY.md`](DEPLOY.md); each entry states whether the candidate became canonical;
- latest clean pushed checkpoints: `bf2ec24` for Tesla Compact and immersive
  surfaces, `a6e0cc8` for the Tesla Balanced Rail, `12af607` for the domain-led
  retirement of generic Energy, and `fc61033` for their documentation record;
  the latest canonical source/documentation checkpoint remains `12877db` for
  build `20260903-2137`. The 2026-09-04 checkpoints are not published or
  target-Tesla accepted;
- compact telemetry/contextual-control publication: implementation `0ec5d4e`,
  built source/docs `4ffd707`, build `20260903-2137`. After a conservative staged
  upload, the explicitly owner-approved normal publisher switched the canonical
  dynamic root through its exact hash-gated cleanup. Independent read-only
  postflight and local/live HTML, JavaScript, and CSS identity pass;
- repository code, comments, documentation, interface copy, and logs are English;
- `.env` and local variants must never be read, printed, diffed, logged, or committed;
- `_references/` is local and ignored; never copy its external material into Git.

## Product boundaries

- `Engine` and `Flux` are equal primary modes. Flux is implemented; Engine is
  visible but disabled until exactly three Engine-specific directions are shown
  and one is selected.
- The shared layer owns normalized GPS/Demo speed, diagnostics, AudioContext
  unlock, Stop/Mute, safety limits, reduced motion, and accessibility behavior.
- Never imply access to real RPM, throttle, gear, CAN, motor load, or coordinates.
- The verified Tesla split viewport is `773 × 601` CSS pixels. Product-visible
  validation must include that size and the target vehicle.
- Tesla Compact uses semantic `13 / 14 / 15 / 15 / 17 / 22 / 32 px`
  typography, `48 px` action targets, and `56 px` primary targets. At
  `773 × 601`, top and bottom chrome retract from a compact `64 px` height and
  Now Playing is suppressed in ATLAS and modal passenger surfaces. Do not
  restore the retired universal
  `20 px` type floor or its `100 px` chrome.
- Functional micro-labels remain uppercase, but editorial Music and Visual names
  use dedicated Title Case display labels in the launcher, footer, and pickers.
- Gradient, Drivey, and PRTCL contextual switches retain `48 px` minimum
  targets, retract with the shared chrome, and use the common `6 px` radius. At
  `773 × 601`, the Tesla Balanced Rail keeps the compact 16 Road mark first and
  persistent with speed while secondary chrome rests. Speed alone owns the
  two-line value/unit hierarchy; Network, appearance, GPS, Discover, and Report
  are centred icon peers on one baseline. Network keeps only its three-state
  ring/loading motion in the rail and discloses app-only rate, latency,
  connection detail, and a bounded 15-minute graph on interaction.
  Footer names and catalogue numbers share one baseline and type size; canonical
  uppercase registry labels remain stable identity and diagnostic data.

## Flux visuals

The registry is `prototype/drive-lab/src/flux-environments.js`.

| Environment | Renderer | Boundary |
|---|---|---|
| APERTURE 01 | original WebGL2 plus Canvas2D fallback | rigid square wall recedes intact and disappears at the existing tunnel terminus by `40 km/h` |
| VERTIGO 02 | vendored Interstate 7 | upstream tree stays byte-identical; the external bridge drives speed/FOV and existing colour channels |
| MERIDIAN 03 | original WebGL2 plus Canvas2D fallback | selected-reference corridor of sparse oblique blades and longitudinal planes; bounded vertical field, `50–124°` full-range FOV, stronger UNDERWATER compression and one continuous visual surfacing response |
| ATLAS 04 | lazy MapLibre/OpenFreeMap WebGL plus one Canvas2D dashboard | ephemeral GPS or explicit Milan demo drives 3D city tiles, a bounded complete-view route, one pulsing position point and a Navigator Plaque; the owner-selected Drive Lab cycles `15 MIN / 1 H / SESSION` across Speed/Distance/Moving/Average, Accel/Braking, a proportional five-band speed strip, an eight-sector moving-only Direction History rose, compact Elevation and Moving/Stopped; an icon-only `36 × 30 px` midpoint tab collapses it and ATLAS contains no Discover/Wikipedia surface |
| DRIVEY 05 | byte-identical Rezmason runtime plus project bridge | road following, lane-centred zero hold, opposing-only traffic, three cameras, and normal/wire modes |
| PRTCL 06 | original WebGL2 particle renderer | Fractal Frequency and Axiom remain active; Murmuration is parked; UNDERWATER holds Fractal at 22.5% form / 27.5% point scale and surfaces quickly |
| GRADIENT 08 | lazy ShaderGradient plus Canvas2D fallback | Japanese Mist, Acid Orchard, and Chromatic Silk retain their selected geometry/motion, use the shared palette, and fold/densify during braking |
All rendered visuals use the ten curated palettes. Each Gradient variant keeps
both exact theme colour channels and derives one light-tinted third colour.
Vertigo is recoloured without
editing its vendor tree. Aperture is the fresh-session and invalid-preference fallback;
PLUMB and every other retired identifier resolve to it. The fixed legal-road
response ceiling is `130 km/h`; domain-specific visual and musical response
curves normalize against it, and no generic product Energy metric is exposed.
Aperture must already read as a tunnel near `40 km/h`.

The driver-facing Visual catalogue adds **DISCOVER 07** beside those seven
rendered families. It is a destination, not a render environment: the launch selector
fits all eight primary choices and opens the Passenger Index over Aperture, while the
running Visual library opens the same surface without changing the active
environment. Closing Discover returns to the real visual and normal focus
recovery. This placement is implemented in `e268169`; canonical publication is
complete in build `20260901-1105`. Exact Browser inspection found its seventh
running row below the fold; `a257e0c` compacts only that Visual drawer so all
seven rows fit together at `773 × 601` without changing Music geometry. The
canonical launch and running-picker loops, byte identity, console and focus
recovery all pass; vehicle tests remain `R10-00A`–`R10-05`.

## Flux music

The live engine is `prototype/drive-lab/src/score/` and the browser entry is
`src/score/worklet/score-processor.js`. The Vite worklet plugin bundles that
module graph into one production asset; importing the entry with `?url` alone
would copy it without its dependencies and fail after deployment.

### FRACTURE

- one original F-minor Jungle / Drum & Bass composition;
- ten four-bar sections and forty bars before the form repeats;
- production atmosphere, harmony, pad, sub, reese, drums, break detail, and effects; retired `riff` and `response` are audition-only;
- atmosphere-only launch, with low end and rhythm entering through road energy and no automatic lead melody;
- `162–176 BPM`, with three eight-bar-rotating half-time rhythm families carrying
  low-to-high speed before full-time drumming becomes eligible at `88 km/h` and
  releases below `82 km/h`;
- structural changes only on musical boundaries, behind hysteresis, dwell,
  crossfades, and catch/recovery/sustained-release deceleration memory;
- tested key membership, voiced consonance, held-note harmony, bass degrees,
  form variety, voice audibility, and brake level/character;
- identical DSP core available to the browser and offline Node renderer.

### Music library

- FRACTURE 02 — generative and `ready` in the AudioWorklet;
- JUNCTION 01 — sampled and `ready`; one 5.8 MB segmented Opus bank, 24
  authored clips from 76 distinct recordings, three takes for each of eight
  adaptive states under one E-minor harmonic grammar, one synchronous tonal
  performance at a time with changes at complete eight-bar boundaries, native 127–168 BPM pacing with
  127 BPM at 40 km/h and 135 BPM at 60 km/h, beatless ambient rest, and at most
  six decoded clips;
- NIGHTSHIFT 03 — sampled and `ready`; 18 complete eight-bar performances,
  three takes across native `85–140 BPM` states, one A-minor grammar, beatless
  PARK, and at most six decoded clips. JUNCTION and NIGHTSHIFT now share the
  `0.72` sampled-performance entry gain; the public bank audit is reproducible
  with `npm run analyze:sampled-score-levels`;
- PULSE 03, CUTWATER 04, LOWTIDE 05, NIGHTCAST 06, STILLWATER 07 — declared
  `preparing`, disabled, and must not be presented as playing.

Keep [`MUSIC-CRAFT.md`](MUSIC-CRAFT.md) current whenever a musical defect or
technique is discovered. Prefer a deterministic test whenever the rule can be
asserted.

### SOUNDTRACK

- server-side Jamendo catalogue and exact-ID no-store audio relays keep the read
  credential outside browser code and reject incomplete/effects-disallowed items;
- three transient previous/current/next media elements use explicit playback,
  independent transition gain stages, and never become a persistent or offline
  audio store;
- every fixed recording remains at authored `1×`; driving never selects or
  retimes it;
- the footer `EFFECTS` master separately gates audible braking UNDERWATER;
  the same Underwater envelope continues to drive visuals, PLAY THE ROAD starts on,
  and SOUNDTRACK requires fresh-session opt-in;
- manual flanger, reverb, chorus, and beat repeat remain passenger-operated;
- App and protected LAB expose transport plus audio-clock-derived
  artist/title/licence/Jamendo credits. Manual changes use the tested nominal
  `450 ms` equal-power model through normal skips, reversals, and rapid
  third-deck retargeting without exceeding three media elements. The visible
  card includes every genuinely audible credit, and a compact QR opens the exact
  current public track page without exposing a relay or stream URL;
- the running Music drawer keeps two explicit horizontal top selectors for
  **Play the Road** / **Soundtrack**. Do not label the first branch
  `Generative`, because JUNCTION and
  NIGHTSHIFT are adaptive sampled scores. Soundtrack gives equal visual and
  interaction weight to compact **Illobo Featured** and **Jamendo Library**
  alternatives. Featured and the cover preview rotate every 30 minutes; Jamendo
  pace, genre, and exact-track gestures start playback immediately. Pace is
  never connected to road speed or playback rate. A source tap replaces the
  visible pane before awaiting catalogue/effects/score preparation, names the
  selected loading state, and uses monotonic mode/score revisions so obsolete
  work cannot reclaim playback after a rapid reversal. Checkpoint `856232b`
  makes Pace and Genre whole-surface one-tap controls, places Pace in a narrow
  vertical rail and all fifteen genres in a readable `5 × 3` grid, places six
  tracks in two rows, and keeps player plus credit visible without scrolling at
  `773 × 601`. Owner selection **Generated image 35** supersedes the temporary
  Music Navigator Rail: Play the Road exposes sampled JUNCTION and NIGHTSHIFT
  as two first-row cards and responsive-generative FRACTURE as one full-width
  row, with individual artwork and concise descriptions; the
  29-track Illobo catalogue maps every recording to its own coherent cover.
  Build `20260901-0012` publishes the preceding one-tap/covers baseline;
  checkpoint `5c498ac` adds the Soundtrack composition and DISCOVER. Owner
  checkpoint `8450109` supersedes its temporary Music rail with the horizontal
  source selectors and Generated image 35 Play the Road layout; documentation
  checkpoint `1dcb5bc` is live in canonical build `20260901-1041`. During final
  live transport QA, NEXT exposed
  a Chromium suspension edge case: if the audio clock stopped,
  the nominal wall timer fired but settlement still sampled the frozen clock,
  leaving the UI on FADING. Checkpoint `7085941` makes the 450 ms wall deadline
  force the requested deck into the settled state, reapplies its gain, and
  releases the outgoing deck. A frozen-clock regression passes; two consecutive
  Illobo NEXT actions and the return to Jamendo now pass live with no residual
  FADING or console warning/error.

## Diagnostics and privacy

- v4 reports are coordinate-free and transmitted only through the explicit
  `SEND DIAGNOSTIC` gesture;
- v4 replaces the retired generic Road Energy value with truthful Motion State
  and reports audible output as level; v3 remains historical evidence only;
- the in-memory flight recorder is bounded and disappears on reload;
- the owner-supplied complete attachment from build `20260831-0853` closes the
  `GPS → SENT → received` path. Its coordinate-free v3 payload has 3,928 numeric
  fixes, 243 flight samples, zero runtime issues, and exposes a repeatable
  `23.15 FPS` ATLAS phase that remains a target-performance gate;
- `REPORT` and the send action must remain reachable at `773 × 601`.

## Immediate work

The session started from clean `main == origin/main == bb5a2c9`. Drive
corrections are checkpoint `ac11ed0`; milestone-row-6 audio evidence/recovery
is `614872b`; row-7 transition mechanics are `2dd3cb5`, atomic rollback is
`8f03b34`, and transient transport activation is `dcb6801`. Canonical live
build is `20260831-2207` from amplified MERIDIAN checkpoint `e77d939`, retaining
FX Deck checkpoint `0993e92`, the global effects routing repair `8c53e8d` and
reversible Soundtrack-path checkpoint `0660d71`,
retaining immediate weak-network switch checkpoint `137ddeb`, transport-state hardening `57fed11`, provider-label correction
`2c0f5f8`, track-head guarantee `236f2c9` and true Illobo source correction
`1a47e23`, retaining
Featured random-start logic `61471e8`, Tesla Soundtrack correction `4b36069`, ATLAS Navigator Plaque
`79d9c9b`, MUTE/FX parity `c0a2f78`, Featured-launch correction `1171157`, and
Illobo cover correction `6218f98`.
The first owner drive report found MERIDIAN braking stepped and acceleration FOV
too weak; `6a90621` fixed smoothness and materially widened the complete range.
The owner then accepted MERIDIAN's beauty and confirmed audible UNDERWATER, but
requested stronger visual braking and especially renewed-speed emergence.
Checkpoint `e77d939` raises dry FOV to `124°`, responds to acceleration in
`0.22 s`, strengthens UNDERWATER with `−11°` plus motion/glow/fog contrast, and
preserves one `0.50 s` visual surfacing transition after `0.24 s` engagement.
Build `20260831-2207` passes `520/520`, exact local `773 × 601` state comparison,
protected publication, canonical HTML/JS/CSS identity, and live runtime/console
QA. Real progressive motion remains `R5-02`; Illobo/Jamendo audio retest remains
in progress under `R4-04` and the audio graph was not changed.
Guarded no-delete publication, pre/postflight `remote_writes=NONE`, canonical
HTML/main/CSS/worklet byte identity and catalogue/audio relay probes pass.
Milestone row 8 is office-complete at `05a754b`: both owner-supplied Illobo LOBO
SVG variants are retained byte-identically as the Featured cover and crossfade
continuously over four seconds in each direction on an unclipped square dark
field. Active fixed playback publishes `16 - Artist - Track title`
to the page title and restores the product title on pause. The complete suite,
build, and exact local/live `773 × 601` Browser QA pass. Protected publication,
pre/postflight, canonical byte identity, timed fade, real play/pause title, and
console gates pass. The owner then reported that build `20260831-1653` failed
every Illobo start and made visible Jamendo UNDERWATER engagement acoustically
dry. Investigation established that the first defect was more fundamental than
the relay diagnosis: Featured was a second ordering of Jamendo records, not an
Illobo catalogue. Therefore the earlier **23/23** relay audit is valid Jamendo
evidence only and must never be cited as Lobo verification. Checkpoint `1a47e23`
now loads a separate 29-track owner-authorized Illobo catalogue, prevents
cross-source cache reuse, keeps random non-current starts within those 29
identities, and permits the direct-grant effects path. Build `20260831-1744`
uploaded 29/29 MP3 web masters without entering them into Git; local and remote
full SHA-256 verification passes, the live catalogue reports exactly 29 Illobo
tracks, and all 29/29 HTTP byte-range probes return `206 audio/mpeg` with the
catalogued total size. Checkpoint `236f2c9` further guarantees that randomness
selects only the next complete recording: every Featured relaunch recreates its
target and starts at `0:00`, with no random or retained seek position.
Checkpoint `57fed11` then hardens natural end, explicit restart, dormant preload
failure, failed catalogue replacement and effects readiness/rejection. The
deterministic 120-action transport stress remains coherent within three decks.
Checkpoint `137ddeb` makes both drawer directions visually immediate under weak
network and rejects late completions; exact live `773 × 601` QA captured
`Loading Soundtrack…`, reversed before the catalogue completed, and remained on
Play the Road after settlement. Checkpoint `0660d71` repairs the separate
Soundtrack-path round trip: Jamendo and Illobo remain enabled as complete path
buttons, the three Jamendo covers survive Illobo playback, Jamendo browsing
returns after selection, and a rapid Illobo → Jamendo reversal cannot be
reclaimed by an obsolete request. Exact live `773 × 601` QA passes that complete
round trip with no warning/error. The complete suite passes `512/512`; the
146-module App / 70-module LAB / Sites build, 140-file protected publication,
29/29 full remote Illobo hashes, canonical HTML/JS/CSS identity and read-only
postflight pass. Target-Tesla retests remain `R4-04`, `R7-01`–`R7-09`,
and `R8-01`–`R8-02`.
After that publication, the owner reported a second cabin failure: UNDERWATER
was dry on Illobo, Jamendo, and NIGHTSHIFT, and the original four manual effects
were ineffective across both music sources. Local audio checkpoint `8c53e8d` repairs
the real object-boundary fault (`audioMacros.values` had been read as nonexistent
top-level fields), replaces the separate weak NIGHTSHIFT filter with the shared
two-stage perceptual model, and routes flanger, reverb, chorus, and replacement
Echo through one limited post-source graph for both Play the Road and
Soundtrack. Decoded real Illobo/Jamendo excerpts lose `20.8/18.8 dB` above
`4 kHz` at the minimum visible state. The owner selected FX Deck, and checkpoint
`0993e92` replaces the buried Music-drawer controls with a persistent footer
`MIX` control plus a compact non-modal overlay. Its four large tap states enter
at strong `78 / 72 / 80 / 74` depths, keep independent sliders and reset, and
persist across Play the Road and Soundtrack. That four-pad surface is historical
baseline evidence only. Checkpoint `c7ef484` replaced it with the first
eight-effect roster. Owner-approved checkpoint `0f4a501` now replaces Echo and
exposes exactly Flanger, Reverb, Underwater, Phaser, Bitcrush, Bass Drive, Radio
Cut, and High Cut; Chorus and Echo are absent. Bass Drive, Radio Cut, and High
Cut are contiguous behind one cyan family marker. The shared serial graph separately namespaces manual and
vehicle Underwater, initializes every wet branch at zero, and ends in one
compressor. Exact local `773 × 601` QA measures a `720 × 267 px` `2 × 4` deck
with zero overflow; all eight taps, sliders, hostile full-depth sum, reset,
close/focus release, switching, and persistence pass. A real browser offline
render proves the published baseline finite and non-silent. Checkpoint
`f48b5b2` adds a smooth processor-specific stunt zone only over `82–100%`,
leaving every authored hit below that boundary unchanged. A fresh real-browser
comparison measures every full endpoint `1.3925–2.5184×` more transformed than
its tap, manual Underwater `1.8005×`, maximum individual peak `0.99121`, and
the hostile full sum `0.60941`; the complete suite passes `544/544`. Build
`20260901-1943` publishes checkpoint `0f4a501`; `544/544`, production build,
dedicated High Cut sine evidence, a bounded hostile render, canonical byte
identity, and exact local/live `773 × 601` family/order/RESET/focus QA all
pass. Revised Tesla listening `R4-07` remains open. The
complete suite passes `517/517`; the 147-module App / 71-module LAB / Sites
build `20260831-2005` passes. Protected publication uploaded 138 files /
212,292,932 bytes, fully reverified 29/29 Illobo masters, and passed read-only
pre/postflight plus canonical HTML/JS/CSS byte identity. Exact live `773 × 601`
QA repeats all four taps, removal from the Music drawer, source switching,
state persistence, reset, zero overflow, and zero warning/error. Tesla
listening remains required as `R4-04` and the expanded `R7-06`.
Signal Gate support-dialog regression checkpoint `a9aad78` is canonical in
build `20260901-2137`: the trigger was mounting the accessible dialog behind
the splash because its `z-index: 8` was below the splash layer `20`. The modal
overlay now owns layer `30`. Focused `29/29`, complete `545/545`, protected
build/publication, byte identity and exact live `773 × 601` open/close/focus
QA pass with an empty Browser warning/error log.
Milestone row 9 has an office-complete Drive Lab hierarchy checkpoint `7c9df06`:
its selected Navigator Plaque combines a filled continuously rotating arrow,
English cardinal, exact degrees and a rendered-tile road name without reverse
geocoding. The owner-selected composite dashboard is a vertical instrument:
four-value trip line; full-width Accel/Braking; low Speed-band strip;
full-width Heading; full-width Elevation; and low Moving/Stopped strip. Direct
legends, labelled axes and smoothed curves are visible, all sharing `15 MIN / 1
H / SESSION`; the icon-only `36 × 30 px` midpoint tab collapses it. ATLAS
contains no Discover/Wikipedia duplication. Canonical build `20260901-2012`
carries product checkpoint `7c9df06`; `544/544`, protected build/publication,
canonical byte identity and exact live `773 × 601` range/collapse/reopen QA
pass. Run `R9-01`–`R9-05` for target-vehicle acceptance.

The published corrections provide complete ATLAS-view route retention with origin-preserving bounded
compaction, one interpolated pulsing point/ripple, two-line colour-coded GPS,
shared `0.72` sampled-performance gain, a public-bank loudness audit, updated
tests, a `1.25×` MapLibre-only framebuffer ceiling, consolidated `8 Hz` marker
updates, and synchronized current/checklist/music/diagnostic documentation. Targeted Atlas,
NIGHTSHIFT, JUNCTION, and FRACTURE checks pass `60/60`; the complete suite
passes `482/482`, the 143-module App / 68-module LAB / Sites build passes, and
local and live exact-viewport Browser QA have no warning/error. Release work is
complete; target-vehicle route/GPS/audio acceptance and a new report proving
stable ATLAS 30 FPS remain separate gates.

Milestone row 6 is implemented and pushed at `614872b`, after the live build
above. The tracked JUNCTION evidence grid covers ADSR, filter, phase seed,
detune, chorus, spectral slope, saturation and stereo coherence; it passes its
synthetic acceptance while explicitly refusing to authorize pitch gating on
complete processed mixes. The actual `5,812,361`-byte JUNCTION and
`5,504,595`-byte NIGHTSHIFT banks now share a measured `45 s` transfer budget
for the observed `1.35 Mbps` / `250 ms` boundary. Both players abort genuine
stalls, state the timeout, retain a harmonic bed and retry after ten audio
seconds without reselection. Focused evidence/network checks pass `8/8`; the
complete suite passes `482/482`, and the 143-module App / 68-module LAB / Sites
build passes. Protected build `20260831-1143` is canonical live: pre/postflight
report `remote_writes=NONE`, HTML/JavaScript/CSS are byte-identical, and exact
`773 × 601` Browser QA launches Play the Road, opens the Music drawer, changes
NIGHTSHIFT to JUNCTION and observes zero warning/error. Rows 2, 4 and 5 remain
physical-Tesla gates.

Milestone row 7's office implementation is pushed at `2dd3cb5`. First live
candidate `20260831-1219` at `590ba74` failed the rapid attribution gate;
`8f03b34` made the queue/QR/credit commit atomic. Second candidate
`20260831-1229` at `051d637` passed canonical byte identity and clean real-track
startup but failed normal NEXT: awaiting effects readiness before the incoming
media `play()` consumed Chromium's transient transport activation, so coherent
rollback stopped the prior track. Correction `dcb6801` requests both audible
decks before that await and has a deterministic ordering regression test. The
complete suite passes `486/486`, and the 145-module App / 70-module LAB / Sites
build passes. Build `20260831-1241` at `7feea06` published the row-7 correction after protected
publication, read-only pre/postflight, byte-identical HTML/main/CSS/worklet and
live catalogue/audio relay probes. Exact Browser layout/build/log QA passes,
but automated live transport is not claimed because Browser control blocked
direct `.php` catalogue access and later detached. Use stable `R7-01`–`R7-09`
identifiers for the evening cabin run in
[`TESLA-TEST-QUEUE-2026-08-31.md`](TESLA-TEST-QUEUE-2026-08-31.md); the row
cannot close until those cabin results pass.

Milestone row 8 is implemented at `05a754b` and retained in current canonical build
`20260831-2005`, with perceptual correction `6218f98`. Both owner-supplied LOBO variants
remain byte-identical, the old provisional PNG is retired behind an exact-hash
cache-overlap gate, and the Featured cover uses a continuous four-second-per-
direction dissolve from white-on-black solid to original black-on-graphite
outline on an unclipped square field without a cover border or radius. Local
and live `773 × 601` QA proves both endpoints, exact dimensions, zero
warning/error, real `16 - Artist - Track title` playback identity, and title
restoration on pause. Source correction `1171157` makes an unqualified
Soundtrack start explicitly `library:all`; `4b36069` additionally reuses the
prepared catalogue within the `PLAY FEATURED` gesture, retries exact server
metadata variants, and prevents a failed current deck from poisoning its
replacement. `61471e8` adds the per-press random non-current start without
dropping any playlist identity. Local exact-viewport interaction QA, the full
23/23 live relay audit, and
canonical byte identity pass; use `R7-06`–`R7-07` for the corrected Soundtrack
cabin acceptance and `R8-01`–`R8-02` for the cover/title acceptance.

Continue only from the 17 stable numbered rows plus mandatory insert `10A` in
[`MILESTONE-CHECKLIST-2026-08-31.md`](MILESTONE-CHECKLIST-2026-08-31.md). The
first and sixth rows are complete; the second is physical-Tesla acceptance and
the seventh, eighth and ninth are split between published office implementation
and open Tesla gates. Row 10 DISCOVER is owner-selected and published;
checkpoint `f843ea6` makes its split Passenger Index
readable at driving distance, keeps all 15 sources in one measured-height
scroll, loads the complete localized Wikipedia article in a scriptless reader,
and removes the superseded reciprocal ATLAS action. Canonical build
`20260901-1624` carries documentation checkpoint `fd4b636` plus responsive
article-image checkpoint `55caa8d` and sidebar-density checkpoint `f8f554b`.
It passes `541/541`, protected publication, HTML/JS/CSS byte identity and exact
live `773 × 601` QA, including the `165.3 px` Basilica infobox, uncropped lead
image, label-free accessible language select, `38 px` scopes, `11.5 px`
distance/ETA and empty Browser log. Only
`R10-00A`–`R10-05` Tesla acceptance remains open. ATLAS is an independent
data-first Drive Lab: do not add DISCOVER or duplicate its place cards. The
owner selected the composite of all six preferred telemetry modules. Checkpoint
`7c9df06` corrects their visual hierarchy into the approved vertical instrument
with low band strips, full-width histories, labelled axes, direct legends and
smoothed curves; canonical build `20260901-2012` passes `544/544`, exact live
`773 × 601` QA and canonical byte identity. Target-Tesla `R9-01`–`R9-05`
acceptance remains open.

Owner VoiceNotes recorded on 2026-09-01 at 09:01–09:15 supersede the prior
"row 11 next" handoff. Milestone row 4's mandatory eight-effect `2 × 4`
Performance FX revision, stronger full-depth checkpoint `f48b5b2`, and High
Cut replacement `0f4a501` are live in build `20260901-1943`; exact
office/canonical QA passes and Tesla `R4-07` remains open. Mandatory insert
`10A` follows and requires truthful
ATLAS cold start/refinement, larger Tesla palette, persistent transport,
supported Media Session previous/next, committed-track notice, direction-aware
drawer dismissal and measured WebP Illobo artwork while retaining local HD
masters. Row 4's current roster is present in build `20260901-1943`; the `10A`
and `10B` implementation is canonical in build `20260901-2232`.
Their tests are `R1-02`, `R4-07`, `R7-10`–`R7-12`, `R8-03`, `R9-06`, and
`R13-00`. Checkpoint `d45f8dd`, deployed by `7e990ee`, passes the complete office
and canonical implementation; target-Tesla acceptance remains open. Promoted X10 `LIGHT / DARK / AUTO` is confirmed in milestone 13
with `R13-01`–`R13-03`.

Five later owner notes recorded at 17:52–18:07 form mandatory insert `10B`.
Checkpoint `d45f8dd` implements them with `10A`: Discover's outbound Maps action is an in-place
destination-only QR with official Tesla-app phone-share / `Locations →
Navigate → Send to Car` guidance (`R10-06`); Jamendo removes its redundant
library/authored heading block while preserving larger PACE / GENRE, the
right-aligned 30-minute fresh-mix notice, clearer Now Playing and its real
playback-bound activity mark (`R7-13`); the running Visual drawer is now a
two-column description-led surface (`R5-06`); APERTURE's low-speed wall motion
now uses smoothed raw speed and cached canvas dimensions without weakening its mapping (`R5-07`); and safe
product preferences gain lifecycle restoration plus RESET SAVED STATE in splash
and settings (`R1-03`). The earlier catalogue had eight choices and the
project-owned `GRADIENT 08` was published in build `20260902-0103`; that visual
is now explicitly retired and deleted. “Position” is now
clarified as GPS state: after permission, an app-level collector must continue
for the whole running session regardless of selected visual and retain the
latest reliable point plus bounded route/journey history in memory, allowing
ATLAS and DISCOVER to open already hydrated after visual switches (`R9-07`). No
coordinate may enter persistent storage, diagnostics or automatic telemetry.
The Geolocation watch and bounded route/Drive Lab journey aggregate now live at
App scope and survive ATLAS remounts without duplicating the watch. Safe stored
preferences explicitly exclude coordinates. The complete suite passes
`486/486`; the production build, read-only pre/postflight, byte-identical
canonical assets and exact local/live `773 × 601` Browser flows pass. Row 11
now awaits only target-Tesla motion/performance acceptance.

On 2026-09-02 the owner requested an official-renderer comparison. Exact MIT
`@shadergradient/react@2.4.20`, React Three Fiber `9.7.0`, Three.js `0.169.0`,
three-stdlib `2.36.1`, and camera-controls `2.9.0` were first pinned for the LAB.
The isolated `/shadergradient-lab.html` page offers three project
studies, all ten exported official presets, all `3 × 4` registered
geometry/shader combinations, and the complete useful public visual/runtime
surface for motion/timeline, palette, lighting/HDR environment, transform,
camera/touch, canvas/performance and safe official-URL import. It retains local
persistence, JSON capture, and bounded `FREE / ROAD / ROAD + AUDIO` simulation.
The same reusable workbench is now selectable as `SHADERGRADIENT / LAB` inside
the authenticated protected LAB. Local Vite maps the clean `/lab/` route to its
private development entry, matching production without exposing `lab.html` in
normal use. Desktop and `773 × 601` side-inspector layouts pass.
The usage and licence boundary are in `LOCAL-SHADERGRADIENT-LAB.md`.
Checkpoint `1a79cea` is published as protected build `20260902-1341` after
read-only pre/postflight, complete packaging and canonical HTTP gate checks.
The live owner gate is clean; authenticated Tesla rendering remains `R11A-01`.

Later that day the owner selected all three registered starting points, then
clarified that they belong inside one public **GRADIENT 08** family as the
**Japanese Mist**, **Acid Orchard**, and **Chromatic Silk** variants. The former
project-owned Gradient renderer is deleted; its stored identifier migrates to
Japanese Mist. The exact upstream stack is unmodified and isolated in one lazy
chunk. Project code owns the registry, bounded road/audio response, telemetry,
reduced motion, and Canvas2D fallback. Product checkpoint `87a5668` is canonical
as build `20260902-1905`: both catalogues expose one Gradient card among eight
primary choices; a single tap starts the remembered variant, and a persistent
`VARIANT` control cycles `MIST → ORCHARD → SILK → MIST` without a picker or
reload. Read-only pre/postflight, `563/563` complete checks, byte-identical
HTML/main JS/CSS/lazy ShaderGradient assets, and exact live `773 × 601`
interaction/WebGL QA pass. Target-Tesla GPU, motion, repeated switching and
thermal acceptance remain open under the stable `R11-*` codes.

The first physical-Tesla run of that build then exposed two critical Soundtrack
regressions: automatic braking UNDERWATER was inaudible and one Jamendo track
could leave all later transport pending. Product checkpoint `1ef48be` is live
as build `20260902-1954`. It makes Soundtrack and the adaptive vehicle-macro
detector share one exact AudioContext in either launch order with ownership-aware
teardown. It also bounds every media start to ten wall-clock seconds, atomically
restores the previous audible identity on timeout, discards the incomplete
target and prevents a late promise from resurrecting stale audio. The complete
suite passes `553/553`; exact local and canonical `773 × 601` QA proves shared
context topology, running effects/worklet, three playable media roles and
Jamendo `NEXT → PREVIOUS → NEXT` with no warning/error. This is implementation
and live evidence, not cabin acceptance: run `R4-08` and `R7-14` on the Tesla.

The next owner vehicle-note batch is mandatory insert `10C`. Local product
checkpoint `7378d3b` deliberately does not repeat the `1ef48be` Soundtrack
deadline repair. It instead separates visual launch from remote music
readiness, explains constrained/offline or pending music data, resumes a track
that finishes preparing after START, and retries recoverable catalogue failure
without making Mute a special bypass. Soundtrack keeps the existing three audio
roles and now prefetches adjacent artwork; supported Media Session
previous/next remain wired. Its navbar readout is speed-only and the on-screen
transport retracts with the footer. The navbar `NET` state is explicitly a
browser estimate, not cellular strength or a synthetic ping score.

The same checkpoint compacts Discover to a measured `38 px` heading and
`246 px` rail, narrows the result-number track, and changes the QR target from
immediate directions to exploratory Google Maps place search. APERTURE uses one
longitudinal origin across all tunnel planes. The later owner refinement removes
all internal-choice counts from splash and running Visual cards while retaining
the drawer's stable catalogue numerals and each visual's internal control.
Focused `80/80`, complete `579/579`, the
235-module App / 159-module LAB build, and exact local `773 × 601` checks pass.
The local navbar geometry has non-overlapping `116 / 48 / 48 / 70 / 54 px`
readout/network/GPS/Discover/Report cells; after idle the transport computes to
hidden/non-interactive. Discover measures exactly `38 px` high and `246 px`
wide, reload restores Soundtrack + Aperture, and fresh runtime inspection added
no warning/error. Published source checkpoint `e1005f9` is canonical as build
`20260902-2106`; protected publication, local/live byte identity and exact live
Browser QA pass. `R10C-01`–`R10C-08` target-Tesla and phone acceptance remain
open.

The owner's immediate Browser run then exposed one `R10C-04` follow-up: desktop
accelerator/brake keys reopened the navbar/footer, and passive pointer motion
was also admitted as activity. Checkpoint `92e581b` separates vehicle motion
from human chrome wake. GPS/demo speed updates, accelerator, regenerative
release, service brake and pointer hover leave `controls-resting` unchanged;
only deliberate pointer press/touch wakes the surface, while intentional
keyboard focus remains accessible. Focused `32/32`, complete `580/580`, the
235-module App / 159-module LAB build, rendered
`resting → ArrowUp → resting → visual click → awake` QA and a clean console pass.
Published source checkpoint `16afc61` is canonical as build `20260902-2127`;
protected publication, byte identity and the same canonical Browser interaction
pass. Only physical-Tesla confirmation remains open under `R10C-04`.

The owner's next local Browser check found the Music drawer's Now Playing chart
icon black on black and its label able to wrap. Checkpoint `543978e` leaves the
pinned black Tabler SVG byte-identical, applies a white presentation filter on
the current dark drawer, and gives `NOW PLAYING` an explicit one-line contract.
This intentionally preserves the black source for milestone 13 LIGHT mode.
Focused `32/32`, complete `580/580`, rendered local drawer QA and a clean console
pass. Published source checkpoint `a501545` is canonical as build
`20260902-2142`; protected publication, HTML/JavaScript/CSS/original-icon byte
identity and canonical build/console checks pass. Physical-Tesla contrast and
one-line-fit confirmation remains open; milestone 13 itself is not implemented.

The owner's next `qaSpeed=40` DRIVEY review found that walking-speed GPS motion
still looked far too fast. Checkpoint `4624f70` confirms the cause in the pinned
upstream physics: Drivey's steady vehicle velocity is proportional to the square
root of its cruise command, while the external bridge had supplied an almost
linear input. The bridge now shares VERTIGO's quadratic low-speed response,
solves the original drive-force/linear-drag equilibrium for the active level,
and synchronizes the player plus opposing traffic before the iframe becomes
visible. The vendor tree remains byte-identical. Exact model evidence returns
`5.000 / 40.000 / 90.000 / 130.000 km/h`; focused `16/16`, complete `572/572`,
production builds and rendered local `5 km/h`/clean-console QA pass. Published
source checkpoint `5691f58` is canonical as build `20260902-2322`; protected
publication, HTML/JavaScript/CSS/unchanged-vendor byte identity and canonical
muted DRIVEY render/console QA pass. Physical-Tesla motion judgement remains
open under revised `R5-04`.

The next DISCOVER correction is implemented at checkpoint `5b4e776`. The
search field no longer filters only the geosearch pages around the current
vehicle: after a `320 ms` debounce it performs a global query against the
selected Wikipedia language, works without GPS and sends no position. Empty
search preserves `NEARBY / AHEAD / REGION`. Global results use MediaWiki's
explicit relevance `index`; rendered no-GPS QA caught and fixed the API's
non-ranked page-array order, then proved `Tokyo Tower` at result `01`, its
complete native Minerva article, destination-only Maps handoff and an empty
warning/error log. Focused `12/12`, complete `574/574`, the 235-module App,
159-module protected LAB and Sites build pass. Published source checkpoint
`ec48971` is canonical as build `20260902-2346`; protected publication,
HTML/JavaScript/CSS byte identity and the repeated live no-GPS `Tokyo Tower`
flow pass with an empty warning/error log. Physical-Tesla touch/network search
remains open under revised `R10-02`.

The owner then explicitly selected native **Minerva dark** for Discover, even
with Wikipedia's accepted test parameter. Product checkpoint `cdccbd7` replaces
the custom scriptless article document with the complete localized native page
at `useskin=minerva&minervanightmode=1`; a `1.2×` outer scale supplies the
selected large vehicle-reading presentation while Wikipedia owns responsive
cards, imagery, chapters, links, colours and localized chrome. Exact local
`773 × 601` English/Italian Browser QA, focused Discover `10/10`, complete
`486/486`, nine Sites checks and the production build pass. Canonical build
`20260901-2300` is now published from documentation/deployment checkpoint
`c98414d`: protected upload and postflight pass, HTML/JS/CSS are byte-identical,
and exact live `773 × 601` QA confirms the native night class, dark native
colours, complete responsive article and English-to-Italian interface switch
with no canonical warning/error. Target-Tesla `R10-03` remains open and must
not be reported as accepted from office evidence.

The next owner-requested ATLAS Drive Lab refinement is implemented at checkpoint
`8068975`. A frontend-design review measured summary labels at `6 px`, chart
titles at `8 px`, axes at `6 px`, and the range control at `7 px / 22 px` on the
`773 × 601` surface. The panel remains `300 px` and map-majority, but typography,
contrast and the range target are larger. Speed bands now use one proportional
stacked strip, Moving/Stopped is a direct-labelled ratio, and zero acceleration
states say `NO CHANGE`. The former Heading polyline is replaced by an
eight-sector `45°` Direction History rose derived only from samples at or above
`2 km/h`; up to five outward annular tiles encode relative moving-time share,
the current bearing remains a separate needle, and exact sector counts survive
bounded session rollups. Focused ATLAS `34/34`, all feature/Sites suites, the
complete `494/494` unit group, and production build pass. Published source
checkpoint `af151a9` is canonical as build `20260903-0042`; protected preflight,
publication/postflight, HTML/JavaScript/CSS/ATLAS-chunk byte identity, and exact
live `773 × 601` empty/range/collapse/reopen QA pass with empty Browser logs.
Physical-Tesla moving-data and cabin legibility remain open under revised
`R9-03` and `R9-04`. The three earlier visual
proposals were recovered to the owner's Desktop as `01-trip-pulse.png`,
`02-motion-lab.png`, and `03-journey-ledger.png`; Motion Lab contains the radial
direction study referenced by the owner.

The next owner-requested ATLAS map-colour mode is implemented at checkpoint
`febbba3` after a frontend-design review of the exact `773 × 601` surface. A
compact `MAP COLOR / PALETTE|STANDARD` button occupies the map's free
upper-right lane, follows the `300 px` Drive Lab edge, and remains available
when the panel collapses. STANDARD changes the existing MapLibre paint
properties in place to a dark semantic map: blue water, green land cover and
parks, warm buildings, neutral local streets, and distinct major-road classes.
The current route, vehicle marker, Navigator Plaque, Drive Lab and UI accent
remain product-palette owned. The safe preference survives reload and RESET
SAVED STATE restores PALETTE; coordinates and journey state remain excluded.
Exact local PALETTE/STANDARD renders at `773 × 601`, focused ATLAS `36/36`, the
complete `496/496` unit group, all feature/Sites suites, production build and
empty Browser warning/error logs pass. Canonical publication and physical-Tesla
colour/touch acceptance remain open.

The same checkpoint is now canonical as build `20260903-0118`, built from
source/documentation commit `9df530d`. Protected publication, read-only
postflight, and HTML/main-JavaScript/main-CSS/ATLAS-JavaScript/ATLAS-CSS byte
identity pass. Exact live `773 × 601` QA proves immediate PALETTE/STANDARD
switching, persistence after reload, a measured `12 px` collapsed-panel right
edge, restored PALETTE state, and empty Browser warning/error logs. Physical
Tesla colour, glare, legibility, and touch acceptance remains open under
`R9A-01`.

Debug flight-recorder checkpoint `c869f1d` prepares the next physical Tesla
media-control run. Every semantic UI activation and non-text control change now
has an exact sequence/time/source record; Soundtrack Play, Pause, Previous,
Next, library and track choices add correlated request/outcome events with
before/after three-deck state, latency, buffer/readiness, error and playback
confirmation. Browser media lifecycle and Media Session metadata/state/action
registration are recorded independently, so a visible-but-inert Tesla control
can be distinguished from an unsupported handler, a handler never invoked, a
rejected play, a stalled target, or a successful queue change. Retention is
1,200 protected interactions, 800 significant events, 1,200 samples and 1,800
two-second drive samples; transport fitting removes non-interaction evidence
first. Text, pointer coordinates, GPS coordinates, media URLs, persistence and
automatic transmission remain excluded. Focused `73/73`, complete `498/498`,
production build and exact local Play/Next/Previous/raw-REPORT QA pass with an
empty warning/error log. Protected build `20260903-0843` is now canonical from
source/documentation checkpoint `bbc7bb9`: publication uploaded `181` files /
`215,876,803` bytes, fully reverified `29` tracks, retained one cache-overlap
asset, and final read-only postflight reports `remote_writes=NONE`. Cache-busted
HTML, JavaScript `index-n8F-cPXN.js`, and CSS `index-BIFkZ_G0.css` are
byte-identical to the locally verified candidate; the canonical splash exposes
the correct build identity. Only physical Tesla Media Session behavior and
receipt of the explicitly sent fresh attachment remain open under `R10C-03`.

### Previous canonical checkpoint: Automotive Glance and stable Soundtrack

Checkpoint `d38c333`, target-viewport copy follow-up `68b1830`, and overlay
correction `be74aa6`, all pushed to `origin/main`, implement the owner-selected
Direction 3 / **Automotive Glance** and every 2026-09-03 Soundtrack note. They
start from the clean `6e13898` / live-build-`20260903-0843` baseline.

- A test rejects any visible CSS type below `20 px` in the public App, owner
  LAB, or ShaderGradient workbench. Ordinary copy is `20–24 px`, important
  values `24–28 px`, headings `28–36 px`, and the Tesla navbar/footer are
  exactly `100 px`. Secondary content is hidden, reflowed, or scrolled first.
- Healthy network status is one accessible outlined dot. Limited/offline states
  use readable actionable copy and include the browser-estimated downlink when
  present; the meaningless `NET ONLINE` string is gone.
- One persistent lower Now Playing overlay sits directly above the footer while
  chrome is awake. It carries artwork, current title, artist/source, and three
  `72 px` transport targets for every committed Illobo or Jamendo track,
  including natural end and drawer selection.
- Soundtrack now preserves a healthy previous media element and rewinds it
  instead of discarding its buffer. Current loads first; adjacent roles remain
  metadata-only, and only NEXT promotes after `30 s` of observed current
  headroom. Initial/manual/automatic targets begin silent, wait for six
  contiguous observed seconds inside the ten-second transport deadline, rewind,
  then crossfade. The outgoing identity remains audible and authoritative on a
  pending or failed target.
- Media Session action handlers remain registered for the running session and
  dispatch into a serialized command queue. Soundtrack requests a
  playback-oriented shared AudioContext.

Verification is `501/501` product/unit checks plus `9/9` Sites checks, the
235-module App / 159-module protected-LAB production build, and direct Browser
QA at `773 × 601` and `1280 × 720`. The target view shows no visible copy below
`20 px`, no selector/chrome collision, exact `100 px` header/footer geometry,
the overlay immediately above the footer, and real Jamendo PREVIOUS/NEXT track
changes with an empty warning/error log. The in-app Browser does not expose
Media Session, so native handler invocation remains a physical-Tesla gate. The
first exact live target-viewport pass found only the pending-network START
sentence wrapping; `68b1830` shortens it without changing behavior. A subsequent
live drawer pass proved the dock was mounted but visually covered; `be74aa6`
moves it above every in-page overlay and reserves drawer scroll space beneath it.
Canonical build `20260903-1155` publishes this complete state from `cc6afd0`;
exact live `773 × 601` QA repeats the layer, typography, and real Back/Forward
checks with an empty canonical warning/error log.

Do not mark `R10C-02`, `R10C-03`, `R10C-06`, or `R10C-07` complete from these
office results. Their code/model/canonical prerequisites pass, but weak-network
Tesla playback, native mini-player controls and sent report receipt, phone/car
QR handoff, and moving APERTURE seams respectively remain physical evidence.

### Previous canonical checkpoint: Swiss Compact

The selected Direction 1 calibration is applied across the public App,
diagnostics, Discover, ATLAS, owner LAB, and ShaderGradient workbench. It keeps
Space Grotesk and tabular numerals, restores editorial scale through explicit
roles instead of one minimum, and leaves all audio, Media Session, Now Playing
identity, renderer, third-party, and licensing boundaries unchanged.

At `773 × 601`, the top grid is `184 / 174 / 90 / 94 / 120 / 111 px`; the
top bar, `532 px`-wide Now Playing dock, and footer are each `72 px`. The dock
uses `56 px` artwork and `48 / 56 / 48 px` transport targets. ATLAS expands to
a `320 px` panel with a `340 px` canvas and a `48 × 48 px` collapse target
around the existing `36 × 30 px` visual tab. DISCOVER uses a `52 px` heading
band, `48 px` tools, and `64 px` result rows.

Implementation checkpoint `bcec32e` is pushed. Focused Swiss Compact checks
pass `92/92`, the complete unit group passes `505/505`, Sites passes `9/9`, and
the 235-module App / 159-module protected-LAB build passes. Exact local in-app
Browser QA covers the joined `773 × 601` source/implementation comparison, the
complete product matrix at `773 × 601` and `1280 × 720`, constrained/offline
states, owner LAB, and the ShaderGradient workbench with empty warning/error
logs.

Canonical build `20260903-1448` publishes built source/documentation checkpoint
`5303fdf`. Protected preflight/postflight, complete-tree publication, and
canonical HTML/JavaScript/CSS byte identity pass. Exact live in-app Browser QA
covers the shell, Music, Discover, REPORT, and ATLAS open/collapsed at
`773 × 601`, plus the wide shell at `1280 × 720`, with empty warning/error
logs. Physical-Tesla legibility, glare, touch, motion, native Media Session, and
listening remain separate gates.

### Latest canonical checkpoint: Road Sheet appearance and native media controls

Implementation checkpoint `6cda7ee` is published through source/documentation
checkpoint `bd572b2`, build `20260903-1752`. The owner selected Direction 2 /
**Road Sheet** in LIGHT. LIGHT is the default; the
top rail exposes persisted LIGHT/DARK/AUTO through official Tabler sun, moon,
and sun-moon icons. AUTO accepts a system scheme only when it is genuinely
observable, then uses solar phase only from an already-consented session
position, and otherwise falls back safely. It prompts for no new permission,
persists no coordinate, and never couples appearance to the Flux palette.

Stable Media Session Play, Pause, Previous, and Next handlers now serve both
Play the Road and Soundtrack and publish truthful committed metadata, artwork,
playback state, and valid position state. The serialized intent queue cancels
stale work after newer playback/source/track/score/reset intent; duplicate Play
while buffering shares one activation, and Pause then Play preserves position.
The flight recorder retains native invocation IDs, ordering, and outcomes.

The aggregate gate passes `615/615`, including unit `521/521` and Sites `9/9`;
the `239`-module App / `159`-module protected-LAB production build passes.
Preflight/postflight are read-only and report `remote_writes=NONE`; canonical
HTML, JavaScript, and CSS are byte-identical to the candidate. Exact live
`773 × 601` in-app Browser QA passes LIGHT/DARK/AUTO, system-dark AUTO with
unchanged `data-palette=acid`, menu focus, return to LIGHT, on-screen
Pause/Play, and `Junction 01 → Fracture 02 → Junction 01` Next/Previous with an
empty console. Local `702 × 546` and `1280 × 720` responsive QA passes.
Physical-Tesla native-control, listening, glare, distance, and touch acceptance
remain open.

### Latest canonical checkpoint: diagnostic-driven Soundtrack admission

Canonical build `20260903-1752` failed physical-Tesla playback even with a
same-browser `54.3 Mbps` down / `30.6 Mbps` up / `25 ms` speed test: both
Jamendo and Illobo stuttered continuously after several minutes. The in-product
`navigator.connection` estimate was much lower and remains a coarse hint, not
contradictory throughput evidence.

Checkpoint `89d3f15` removes two sources of embedded-browser contention while
preserving the repaired shared AudioContext. Soundtrack startup runs vehicle
macro detection but defers both silent Play the Road AudioWorklets until an
explicit switch; the three-deck preload policy admits only the next audio role
after the current recording has verified headroom. Checkpoint
`a2545c4` updates the source-order invariant. Checkpoint `0d5bb05` restores the
accepted two-column Soundtrack composition and top-aligns launch titles without
changing Swiss Compact type sizes.

The supplied failed-drive diagnostic adds direct evidence: `11` waiting and
`16` stalled lifecycle events, audio transfers open for `42–87 s`, and Illobo
starts admitted with only `1.83–2.27 s` of contiguous forward buffer while
embedded Chromium already reported ready state `3/4`. Checkpoint `26c4043`
therefore requires the real `TimeRanges` value whenever observable, retains the
six-second audible floor, delays NEXT preload until the current deck owns
`30 s`, and attributes every lifecycle event to the exact deck key/role,
headroom, readiness/network state, and playback intent. The same policy covers
Jamendo. Its aggregate gate passes `599/599`; the correction is canonical in
build `20260903-2137`, while physical listening remains pending.

The clean build processes 234 App modules and 154 protected-LAB modules.
Canonical build `20260903-2137` reports checkpoint `4ffd707`. Protected
publication and independent postflight pass; cache-busted HTML, JavaScript and
CSS are byte-identical. Trusted-input live Chrome at exact `773 × 601` starts
Soundtrack on dry Aperture, records no warning/error or inactive score-worklet
request, and keeps exact canvas/document bounds.
Continuous physical-Tesla listening with Gradient plus a lighter visual remains
the separate `R7-15` gate. Aperture dry geometry, palette, depth, thresholds and
motion are source-identical to the prior dry path: the Underwater-only change
removed only OPEN/BLOOM terms that previously evaluated to zero when inactive.
Nine focused Aperture tests pass; rendered browser comparison remains separate
from target-Tesla visual acceptance.

### Current local checkpoint: Tesla Compact and immersive passenger surfaces

The 2026-09-04 working tree supersedes the `72 px` chrome baseline with `64 px`
chrome and a `13 / 14 / 15 / 15 / 17 / 22 / 32 px` type ladder while preserving
`48 / 56 px` touch geometry. Shared drawers and DISCOVER suppress global chrome
and Now Playing; ATLAS suppresses Now Playing, uses high-contrast light chart
ink, and expands Drive Lab to full viewport height when chrome rests. Drawer
focus restoration no longer keeps the idle timer latched. Contextual visual
controls retract with chrome. Soundtrack starts a deduplicated warm-up in the
Signal Gate. Gradient lowers framebuffer density to `0.8` only during the
Underwater brake envelope and returns to the normal quality path afterward.
Office Browser checks are complete; canonical publication and physical-Tesla
first-load audio/frame-pacing acceptance remain pending.

The clean pushed continuation also includes the owner-approved **Tesla Balanced
Rail** at `a6e0cc8`: the 16 Road mark is first and persists with speed, speed is
the sole exceptional numeric hierarchy, peer controls share one icon baseline,
Network details move into an interactive disclosure with a 15-minute graph, and
the palette selector fills its footer cell. Checkpoint `12af607` retires generic
Energy from the shared domain, UI, Report, and diagnostics without changing the
established response curves; documentation checkpoint `fc61033` records both.

### Next office continuation: Astra UI audit

The owner will start the next task personally from the office and attach the
annotated navbar image. The complete, paste-ready scope, current evidence,
ATLAS contrast/spacing task, broad aesthetic review, regression ledger, local
reference paths, and publication boundaries are in
[`ASTRA-UI-HANDOFF-2026-09-04.md`](ASTRA-UI-HANDOFF-2026-09-04.md). No task is
authorized or running merely because that handoff exists.

## Verification

```bash
cd prototype/drive-lab
npm test
npm run build
```

Rendered QA flow:

1. load the splash;
2. activate `PLAY THE ROAD`;
3. confirm compact speed, network, GPS, Discover, and Report remain distinct at
   `773 × 601`;
4. exercise Demo acceleration/deceleration, visual selection, score library,
   the Gradient/Drivey/PRTCL cycle controls, body themes, Stop/Mute, and diagnostics;
5. check console warnings/errors and capture only real current-build evidence.

The development-only `qa-field.html` may hold an exact environment/speed for
profiling. It must remain absent from production builds and the canonical site.

## Documentation discipline

- [`CURRENT-STATE.md`](CURRENT-STATE.md) is the working overview;
- this file is the only active session handoff;
- `SESSION_HANDOFF.md` is a retained legacy filename that points here;
- `DEPLOY.md`, `DIAGNOSTICS.md`, and `CHANGELOG.md` are chronological evidence:
  old failures must not be rewritten merely because a later checkpoint passed;
- changelog history is strictly append-only. Correct an inaccurate hash or claim
  with a new entry rather than editing the old line.

## 2026-09-04 Astra semantic foundation (UI integration pending)

The office audit and full remaining ledger are in [ASTRA-UI-AUDIT-2026-09-04.md](ASTRA-UI-AUDIT-2026-09-04.md). A cached semantic colour resolver now covers all ten palettes, both appearances and fifteen critical roles, with a reproducible raw/resolved contrast matrix. It is not yet connected to product components: no corrected UI or complete browser regression is claimed. The foundation passes 625 automated checks including Sites 9/9 and the real PHP fixture, plus the exact-toolchain ARM64 production build. The shared Dropbox dependencies contained stale Vite/PostCSS; the verified build used an isolated temporary dependency cache without rewriting that tree. Direction selection and the requested headless-browser fallback answer are pending in this same task; canonical deployment remains withheld.

## 2026-09-04 office completion — owner-selected refined Balanced Rail

The current implementation and evidence are in
[ASTRA-UI-VERIFICATION-2026-09-04.md](ASTRA-UI-VERIFICATION-2026-09-04.md), with a
portable [773 × 601 comparison gallery](qa/2026-09-04-astra/index.html).
The UI/handoff implementation ledger is complete locally: all seven Visual
families, three Gradient variants, modal/popover closure, timer/focus/motion,
semantic contrast, palette targets, ATLAS, DISCOVER, footer/transport and badge
geometry have been exercised. The new browser runners are `qa:chrome` and
`qa:splash-gradient`; supply Playwright and Chrome externally. No new product
runtime dependency was introduced.

There is one writer in the saved project, no new checkout/task, and no deployment.
The next step is owner review of these comparisons, followed by explicitly
requested publication and the separate real-Tesla acceptance queue. Do not claim
native media controls, real GPS/touch/glare, first Jamendo audio on the vehicle,
or sustained GPU/thermal acceptance from desktop evidence. A host without PHP
must still report that fixture unavailable rather than borrowing this host's pass.


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

## 2026-09-05 02:01 — Standing owner authorization

The owner explicitly grants ongoing deployment authorization for sedicivalvole.app in current and future sessions: proceed promptly without another deployment confirmation. Carry forward the directly approved official-script-only internal configuration exception for preflight/publication/postflight; never expose or inspect secrets. The governing AGENTS.md now records this scoped exception and standing permission. Relevant validation, Git/build traceability and canonical postflight remain part of normal execution. This is an instruction-only checkpoint; live product build remains 20260905-0152 (source 202e100).

## 2026-09-05 02:19 — Community credits and concise splash published

Live build **20260905-0213**, source **427ab29**, VERSION **0.0.0**. The splash safety aside now contains only **DRIVE RESPONSIBLY**, with its subordinate copy removed and the runtime energy ceiling/control behavior unchanged. At 773 × 601 and 390 × 844 the reminder fits, the page has no horizontal overflow and PLAY THE ROAD still opens the selector.

README now has a consolidated community credits table. `docs/COMMUNITY-THANKS.md` is the maintained release-outreach companion: 29 personalized unsent drafts, usage and license boundaries, public contact routes, and 52 successfully checked public links. No messages were sent or private contacts accessed. The original app remains PolyForm Noncommercial/source-visible; the drafts do not claim an MIT/open-source app. Appended notice corrections identify Infinite Lights' custom Codrops terms and node-qrcode's Ryan Day authorship, and explicitly cover Jamendo/Illobo runtime credit. Maintain README, notices and the register together when sources change.

Verification: **634 native checks**, including **actual PHP** and **Sites 9/9**; **43 focused documentation/splash checks**; **10 post-build checks**; clean **darwin-arm64** production build; **5 local, 5 production and 5 live UI checks** with final console output empty; **17 canonical HTTP/asset/cache checks**. Official publication verified **186 files / 216,249,060 bytes** and **all 29 Illobo tracks** by full hash, retained one preceding asset for cache overlap, and passed preflight plus independent read-only postflight. Main JS is 755,168 bytes (248 bytes smaller); the existing Vite chunk-size advisory remains. No new dependency or rendering/audio work was introduced.

Evidence: `docs/qa/2026-09-05-community/`. The initial temporary browser harness closed contexts during pending prefetches; keeping both pages alive until completion fixed that harness teardown, and final checks passed without a product-network change. Browser verification is separate from Tesla reading/listening/GPU/endurance acceptance; the previously recorded weekend queue remains open. Documentation-only checkpoint follows this product source without changing the deployed build identity.

## 2026-09-05 02:32 — Contextual alignment verified live

Canonical build **20260905-0225**, source **6e2abff**, VERSION **0.0.0** aligns the functional label and current value left in Prtcl, Drivey and Gradient using one shared CSS declaration. All tested text edges now differ by exactly **0 px**; the controls remain **112 × 52 px** with **6 px** corners. No upstream code or interaction implementation changed.

Validation: **634 native checks** including actual PHP and Sites 9/9; **10 post-build checks**; clean ARM64 build; **49 local, 49 production and 49 live browser checks**, each with no warnings/errors. The browser flow covers all two Prtcl types, three Drivey views, two Drivey render modes and three Gradient variants in LIGHT/DARK, successful cycles, immediate retraction, 390 × 844 narrow geometry and six-second inactivity. Main evidence viewport is **773 × 601**. Real Tesla visual acceptance remains separate.

Publication verified **186 files / 216,249,076 bytes**, all **29 Illobo tracks** by full hash, preflight, independent read-only postflight and **17 canonical HTTP/asset/cache checks**. Two prior assets remain for cache overlap. Main JS remains 755,168 bytes; the only runtime-source change adds one CSS declaration. Existing Vite large-chunk advisory remains. Evidence: `docs/qa/2026-09-05-context-controls/` and `docs/CONTEXT-CONTROL-ALIGNMENT-2026-09-05.md`.

## 2026-09-05 02:40 — Standing complete README credits

Owner instruction: always keep every repository/source credited at the very end of README, including small contributions, authors, original non-Git articles/demos and restrained emojis. Product updates must be inserted above `COMMUNITY-CREDITS:START`. AGENTS.md records this permanently. The existing community anchor and earlier entries remain usable; only the unrelated contextual-alignment paragraph moved above the footer.

README now includes 43 curated credit rows and a collapsible 196-entry exact npm inventory. Vertigo names Daniel Velasquez and links his Codrops profile, original article, demo and repository; all four SampleRadar pack pages are explicit. The named offline analysis tools have individual source/use rows and unsent outreach drafts. Run `python3 scripts/readme_dependency_credits.py --refresh` after lockfile changes and `--check` before publication, and manually reconcile non-npm sources with notices and COMMUNITY-THANKS. Metadata missing an author is labelled, never guessed.

This is documentation/tooling only: no app source, package lock or media changed, and no product rebuild/deploy is needed. Canonical product remains source 6e2abff, build 20260905-0225; previously recorded vehicle acceptance remains open. No thank-you messages were sent.

Verification for the credit checkpoint: 8/8 documentation consistency checks, 196/196 exact npm metadata identities and roles, 43 curated rows, all four sample-pack source pages, original Codrops author/article/demo links, final-footer placement and `git diff --check` pass. The 196 npm metadata requests succeeded. Curated public-link outcomes are recorded separately in `docs/qa/2026-09-05-community/complete-footer-links.json`; provider rate limits or bot protection are not product regressions.
