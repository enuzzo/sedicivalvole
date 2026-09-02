# Session Handoff

Status: **live working record**. Updated on 2026-09-03.

Start with [`CURRENT-STATE.md`](CURRENT-STATE.md) for the product overview. This
file records implementation boundaries, verification commands, and next work so
a new session can continue without reviving superseded prototypes.

## Repository and publication

- branch: `main`, with a configured `origin`;
- semantic version: `VERSION` = `0.0.0`; no release exists;
- canonical development URL: <https://sedicivalvole.app/>;
- latest verified publication evidence: first entry in [`DEPLOY.md`](DEPLOY.md);
- latest product checkpoint: `fa122b4`; published source checkpoint: `01d3deb`;
  canonical build: `20260903-0015`, with protected publication, byte identity,
  exact `773 × 601` catalogue/Gradient QA and an empty warning/error log passing;
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
- Functional micro-labels remain uppercase, but editorial Music and Visual names
  use dedicated Title Case display labels in the launcher, footer, and pickers.
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
PLUMB and every other retired identifier resolve to it. The fixed
visual/music energy ceiling is `130 km/h`; Aperture must already read as a
tunnel near `40 km/h`.

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
- the footer `EFFECTS` master separately gates audible OPEN/UNDERWATER/BLOOM;
  the shared vehicle macros continue to drive visuals, PLAY THE ROAD starts on,
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

- v3 reports are coordinate-free and transmitted only through the explicit
  `SEND DIAGNOSTIC` gesture;
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
complete `494/494` unit group, production build `20260903-0039`, and exact local
`773 × 601` Browser composition pass. Canonical publication and physical-Tesla
legibility remain open under revised `R9-03`–`R9-05`. The three earlier visual
proposals were recovered to the owner's Desktop as `01-trip-pulse.png`,
`02-motion-lab.png`, and `03-journey-ledger.png`; Motion Lab contains the radial
direction study referenced by the owner.

## Verification

```bash
cd prototype/drive-lab
npm test
npm run build
```

Rendered QA flow:

1. load the splash;
2. activate `PLAY THE ROAD`;
3. confirm speed, BPM, and energy remain distinct at `773 × 601`;
4. exercise Demo acceleration/deceleration, visual selection, score library,
   body themes, Stop/Mute, and diagnostics;
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
