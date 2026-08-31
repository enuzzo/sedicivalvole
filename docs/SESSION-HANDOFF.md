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
| ATLAS 04 | lazy MapLibre/OpenFreeMap WebGL | ephemeral GPS or explicit Milan demo drives 3D city tiles, a bounded complete-view route, one pulsing position point, nearby Wikipedia reading and passenger QR |
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
- three transient previous/current/next media elements use explicit playback and
  never become a persistent or offline audio store;
- every fixed recording remains at authored `1×`; driving never selects or
  retimes it;
- the footer `EFFECTS` master separately gates audible OPEN/UNDERWATER/BLOOM;
  the shared vehicle macros continue to drive visuals, PLAY THE ROAD starts on,
  and SOUNDTRACK requires fresh-session opt-in;
- manual flanger, reverb, chorus, and beat repeat remain passenger-operated;
- App and protected LAB expose transport and direct artist/title/licence/Jamendo
  credit; physical-Tesla listening and audible equal-power skips remain open;
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

The session started from clean `main == origin/main == bb5a2c9`; the implemented
Music drawer remains commit `61f356d` and canonical live build
`20260831-0853`. The guarded 108-file no-delete deployment, byte identity, live
Jamendo pace/genre endpoints, and cache-busted `773 × 601` Browser QA pass. The
Illobo mark is explicitly provisional until the owner supplies the final logo.

The current working tree intentionally contains the locally verified drive
corrections: complete ATLAS-view route retention with origin-preserving bounded
compaction, one interpolated pulsing point/ripple, two-line colour-coded GPS,
shared `0.72` sampled-performance gain, a public-bank loudness audit, updated
tests, a `1.25×` MapLibre-only framebuffer ceiling, consolidated `8 Hz` marker
updates, and synchronized current/checklist/music/diagnostic documentation. Targeted Atlas,
NIGHTSHIFT, JUNCTION, and FRACTURE checks pass `60/60`; the complete suite
passes `478/478`, the 142-module App / 67-module LAB / Sites build passes, and
local exact-viewport Browser QA has no warning/error. The owner authorized the
implementation checkpoint, push and canonical publication; completion of that
release work and target-vehicle acceptance remain separate gates.

Continue only from the 17-row execution order in
[`MILESTONE-CHECKLIST-2026-08-31.md`](MILESTONE-CHECKLIST-2026-08-31.md). The
first row is the explicit owner gate for committing, pushing, and publishing
these corrections; the second is their physical-Tesla acceptance. Do not reopen
the route/dot treatment as an ATLAS design exploration: only the still-unwired
road/cardinal overlay retains the exactly-three direction gate.

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
