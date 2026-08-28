# Session Handoff

Status: **live working record**. Updated on 2026-08-27.

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

## Flux visuals

The registry is `prototype/drive-lab/src/flux-environments.js`.

| Environment | Renderer | Boundary |
|---|---|---|
| APERTURE 01 | original WebGL2 plus Canvas2D fallback | rigid square wall recedes intact and disappears at the existing tunnel terminus by `40 km/h` |
| VERTIGO 02 | vendored Interstate 7 | upstream tree stays byte-identical; the external bridge drives speed/FOV and existing colour channels |
| MERIDIAN 03 | original WebGL2 plus Canvas2D fallback | Euclidean portals, solids, curved wind and high cloud slabs share one displacement field and camera aim |
| LATITUDES 04 | original WebGL2 plus Canvas2D fallback | continuously phased oscilloscope contours preserve and release recent motion history |
| ATLAS 05 | lazy MapLibre/OpenFreeMap WebGL | ephemeral GPS or explicit Milan demo drives 3D city tiles, nearby Wikipedia reading and passenger QR |

All five visuals use ten curated palettes. Vertigo is recoloured without editing
its vendor tree. The fixed visual/music energy ceiling is `130 km/h`; Aperture
must already read as a tunnel near `40 km/h`.

## Flux music

The live engine is `prototype/drive-lab/src/score/` and the browser entry is
`src/score/worklet/score-processor.js`. The Vite worklet plugin bundles that
module graph into one production asset; importing the entry with `?url` alone
would copy it without its dependencies and fail after deployment.

### FRACTURE

- one original F-minor Jungle / Drum & Bass composition;
- ten four-bar sections and forty bars before the form repeats;
- five theme timbres plus response, pad, sub, reese, drums, break detail, and effects;
- atmosphere-only launch, with low end entering in ROLL and the principal theme waiting for BREAK;
- `162–176 BPM`, with half-time interpretation and density carrying low-to-high speed;
- structural changes only on musical boundaries, behind hysteresis, dwell,
  crossfades, and catch/recovery/sustained-release deceleration memory;
- tested key membership, voiced consonance, held-note harmony, bass degrees,
  form variety, voice audibility, and brake level/character;
- identical DSP core available to the browser and offline Node renderer.

### Music library

- FRACTURE 02 — generative and `ready` in the AudioWorklet;
- JUNCTION 01 — sampled and `ready`; one 38.7 MB segmented Opus bank, 160
  authored clips from 134 distinct recordings, 20 takes for each of eight
  adaptive states across five rotating multisampled musical families,
  rhythm-locked two-deck live mixing at complete eight-bar boundaries, native 127–168 BPM pacing with
  127 BPM at 40 km/h and 135 BPM at 60 km/h, beatless ambient rest, and at most
  six decoded clips;
- PULSE 03, CUTWATER 04, LOWTIDE 05, NIGHTCAST 06, STILLWATER 07 — declared
  `preparing`, disabled, and must not be presented as playing.

Keep [`MUSIC-CRAFT.md`](MUSIC-CRAFT.md) current whenever a musical defect or
technique is discovered. Prefer a deterministic test whenever the rule can be
asserted.

## Diagnostics and privacy

- v3 reports are coordinate-free and transmitted only through the explicit
  `SEND DIAGNOSTIC` gesture;
- the in-memory flight recorder is bounded and disappears on reload;
- the long-payload float serialization fix is deployed and synthetically
  verified, but a new real drive must still reach `SENT`, arrive in Gmail, and
  be inspected before inbox delivery is considered verified;
- `DIAG` and the send action must remain reachable at `773 × 601`.

## Immediate work

1. Run real Tesla listening and performance QA across FRACTURE, JUNCTION and all five
   visual environments.
2. Confirm the corrected diagnostic delivery path with a fresh real-drive report.
3. Begin Engine discovery only through the required three-direction gate.

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
