# Session Handoff

Status: **live working record**. Updated on 2026-08-31.

Start with [`CURRENT-STATE.md`](CURRENT-STATE.md) for the product overview. This
file records implementation boundaries, verification commands, and next work so
a new session can continue without reviving superseded prototypes.

## Repository and publication

- branch: `main`, with a configured `origin`;
- semantic version: `VERSION` = `0.0.0`; no release exists;
- canonical development URL: <https://sedicivalvole.app/>;
- latest verified publication evidence: first entry in [`DEPLOY.md`](DEPLOY.md);
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
| MERIDIAN 03 | original WebGL2 plus Canvas2D fallback | selected-reference corridor of sparse oblique blades and longitudinal planes; bounded vertical field plus monotonic FOV/depth/peripheral speed lens |
| ATLAS 04 | lazy MapLibre/OpenFreeMap WebGL | ephemeral GPS or explicit Milan demo drives 3D city tiles, a bounded complete-view route, one pulsing position point, a Navigator Plaque with dynamic arrow/cardinal/degrees/tile-local road name, nearby Wikipedia reading and passenger QR |
| DRIVEY 05 | byte-identical Rezmason runtime plus project bridge | road following, lane-centred zero hold, opposing-only traffic, three cameras, and normal/wire modes |
| PRTCL 06 | original WebGL2 particle renderer | Fractal Frequency, Murmuration, and Axiom with speed-owned form/point scale, depth, and travel |
All six visuals use ten curated palettes. Vertigo is recoloured without editing
its vendor tree. Aperture is the fresh-session and invalid-preference fallback;
PLUMB and every other retired identifier resolve to it. The fixed
visual/music energy ceiling is `130 km/h`; Aperture must already read as a
tunnel near `40 km/h`.

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
- the running Music drawer keeps one explicit **Play the Road** / **Soundtrack**
  switch. Do not label the first branch `Generative`, because JUNCTION and
  NIGHTSHIFT are adaptive sampled scores. Soundtrack gives equal visual and
  interaction weight to compact **Illobo Featured** and **Jamendo Library**
  alternatives. Featured and the cover preview rotate every 30 minutes; Jamendo
  pace, genre, and exact-track gestures start playback immediately. Pace is
  never connected to road speed or playback rate.

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
build is `20260831-1714` from Tesla Soundtrack correction `4b36069`, retaining
ATLAS Navigator Plaque `79d9c9b`, MUTE/FX parity `c0a2f78`, Featured-launch
correction `1171157`, and Illobo cover correction `6218f98`.
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
dry. Checkpoint `4b36069` corrects the exact-ID relay fallback, synchronous
Featured activation, failed-deck recovery, and the low-pass sweep's perceptual
onset. The formerly failing live track and three adjacent Featured tracks now
return `206 audio/mpeg`; local exact-viewport playback state passes. Target-
Tesla retests remain `R4-04`, `R7-06`, `R7-07`, and `R8-01`–`R8-02`.
Milestone row 9 is also office-complete and live:
its selected Navigator Plaque combines a filled continuously rotating arrow,
English cardinal, exact degrees and a rendered-tile road name without reverse
geocoding. Run `R9-01`–`R9-02` for target-vehicle acceptance.

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
direct `.php` catalogue access and later detached. Use stable `R7-01`–`R7-07`
identifiers for the evening cabin run in
[`TESLA-TEST-QUEUE-2026-08-31.md`](TESLA-TEST-QUEUE-2026-08-31.md); the row
cannot close until those cabin results pass.

Milestone row 8 is implemented at `05a754b` and retained in current canonical build
`20260831-1714`, with perceptual correction `6218f98`. Both owner-supplied LOBO variants
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
replacement. Local exact-viewport interaction QA, live relay probes, and
canonical byte identity pass; use `R7-06`–`R7-07` for the corrected Soundtrack
cabin acceptance and `R8-01`–`R8-02` for the cover/title acceptance.

Continue only from the 17-row execution order in
[`MILESTONE-CHECKLIST-2026-08-31.md`](MILESTONE-CHECKLIST-2026-08-31.md). The
first and sixth rows are complete; the second is physical-Tesla acceptance and
the seventh, eighth and ninth are split between published office implementation
and open Tesla gates. Do not reopen the route/dot or Navigator Plaque treatment
as an ATLAS design exploration. The next owner-gated product task is row 10,
DISCOVER.

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
