# Session Handoff

Status: **live working record**. This file exists so any session — human or
assistant — can pick the work up mid-flight without re-deriving context. Update
it whenever a checkpoint lands or a decision changes.

Last updated: 2026-08-27.

## 1. Where the work started

Branch `main`, from commit `9544629` "Accept direct textStep reuse
authorization". Working tree was clean; nothing uncommitted needed preserving.

## 2. The three commissioned workstreams

| # | Workstream | State |
|---|---|---|
| 1 | Study Infinite Lights directly and build a new environment from that reading | **MERIDIAN 03 shipped** |
| 2 | Design a wholly original environment, three directions, user selects | **LATITUDES 04 selected and shipped** |
| 3 | Import and adapt the real textStep sequencer | **in progress** — DSP, transport and arranger done; score data, worklet and offline render pending |

## 3. Protected baseline — do not alter

These were frozen by the commissioning brief and remain so:

- `prototype/drive-lab/public/third-party/infinite-lights/**` — all seven files
  guarded byte-for-byte by SHA-256 in `tests/interstate-7-bridge.test.mjs`;
- `src/interstate-7-field.jsx`, `src/interstate-7-bridge.js` — VERTIGO 02;
- `src/splash-signal-gate.jsx` — the Signal Gate splash;
- `src/signal-model.js` — read-only; every new module consumes it and adds
  nothing to it;
- `src/diagnostics-model.js` and the flight recorder — additive labels only;
- `src/audio-engine.js` — the current audio spike stays live and untouched until
  a new score passes listening review.

**One authorised exception.** `src/flux-field.jsx` (Modular Aperture) was
changed on the user's explicit instruction, in commit `1e9f741`, to fix two
reported defects: a spiral-reading tone distribution and tiles folding across the
wall-to-roof corner. Nothing else about Aperture was touched. Any further
Aperture change needs the same explicit instruction.

## 4. Landed checkpoints

| Commit | What |
|---|---|
| `db655e5` | MERIDIAN 03 environment, model, renderer, Canvas2D fallback, QA harness |
| `1e9f741` | Aperture tone distribution and corner alignment fixes |
| `19d679a` | LATITUDES 04 environment, model, renderer, Canvas2D fallback |
| `5103d60` | textStep DSP core ported to JavaScript |
| _(this one)_ | Flux arranger: scenes, lanes, deceleration memory |

All pushed to `origin/main`. Full suite green at each checkpoint.

## 5. What exists now

### Visual environments

Registry is `src/flux-environments.js`; `App.jsx` resolves `environment.renderer`
to a field component. Four entries, `aperture` first and the unknown-id fallback.

- **APERTURE 01** — protected baseline, plus the two authorised fixes.
- **VERTIGO 02** — the byte-identical upstream Interstate 7 runtime.
- **MERIDIAN 03** — `src/environments/meridian/`. Built from a direct reading of
  the Infinite Lights runtime at `e58d585`. Reuses that work's *grammar* and none
  of its source: an additive monotonic time rate rather than a position, one
  depth-parameterised displacement function shared by every element, a camera
  aimed along that field's local slope, three mutually incoherent scroll rates,
  and a projection that widens with speed. Corridor contents are original — a
  ruled meridian floor grid, edge posts, phrase rules, travelling markers. Raw
  WebGL2 with instancing, no Three.js, analytic glow instead of a bloom pass.
- **LATITUDES 04** — `src/environments/latitudes/`. Original; the mechanic is
  temporal. The stratum at height `h` shows the field as it stood `h x 8` seconds
  ago, driven by distance travelled, so steady speed rakes the lateral marks into
  a diagonal, acceleration curves that rake, and deceleration scrolls the fast
  history up and out. One fullscreen pass; lag reaches the shader as a 240 x 1
  R32F texture.

### Score engine (`src/score/`)

Ported from `illobo/textStep` at `cb107d198b730db60cff4a87c7fd5b8d1fae3fb2`,
under Lobo's direct authorization. Every module header records its upstream file
and the modifications made.

- `clock.js` — sample-accurate transport, swing, bar/phrase/pattern position.
- `patterns.js` — the upstream 32-step hex encoding, decoded to velocities.
- `dsp/primitives.js` — noise, one-pole filters, SVF, comb, drive.
- `dsp/drum-voices.js` — kick, snare, closed and open hats, clap.
- `dsp/synth-voice.js` — oscillators with PolyBLEP, ADSR, 24 dB Cytomic filter.
- `dsp/effects.js` — ramped parameter, tube saturator, sidechain, limiter, and
  an original tempo-synced delay using upstream's subdivisions.
- `arranger.js` — **original sedicivalvole work**, the musical brain.

No AudioContext dependency anywhere, so the same code runs in an AudioWorklet and
in Node for offline rendering.

## 6. Key musical decisions (do not silently revise)

- **Tempo is nearly fixed: 162–176 BPM with a sharp knee.** Speed does not drive
  tempo in any perceptible way. The low-speed "slowness" comes from a half-time
  feel and sparse density, not from a slow clock. This is the mechanism that
  satisfies "must never sound like a record being slowed down".
- **Continuous versus structural is a hard boundary.** Brightness, filter
  pressure, drive, space, dynamics, ghost weight and hat subdivision follow
  smoothed energy every block. Scenes, lane entries and exits, and fills only
  ever happen at a bar or phrase boundary.
- **Five scenes are densities of one composition**, not five pieces:
  rest, roll, break, drive, full.
- **Identity lanes never leave**: atmosphere, sub and riff belong to the resting
  scene, so theme, low end and harmonic identity survive at every speed.
- **Deceleration memory has three stages**: `catch` (a brief drop moves pressure
  and space only), `recovery` (speed returned, queued removals cancelled),
  `sustained_release` (thin the arrangement, one lane per boundary).
- Two subtleties that were got wrong once and must not regress:
  1. the climb dwell measures how long energy has **supported** a higher scene,
     not whether energy is still increasing — otherwise settling at a constant
     speed freezes the arrangement;
  2. the release stage is latched until the arrangement has actually settled —
     the retained peak decays toward a steady lower speed on its own, and
     treating that as recovery strands the release halfway.

## 7. Remaining work

1. **`src/score/jungle-score.js`** — authored lane patterns, kits, harmony cycle
   and the leitmotif. Port the Drum & Bass / Jungle / Breakbeat pattern families
   only. Do **not** carry across upstream preset names that reference specific
   commercial records.
2. **`src/score/score-core.js`** — the sample generator: transport drives lanes,
   lanes drive voices, voices sum into the bus chain with sidechain and limiter.
3. **`scripts/render-reference.mjs`** — Node offline render of
   `0 → 40 → 80 → 115 → 60 → 115 → 0 km/h` to a WAV for listening review. The
   DSP core is environment-agnostic precisely so this needs no browser.
4. **`src/score/worklet/score-processor.js`** — a thin AudioWorklet shell around
   the core, plus `score-engine.js` exposing the same facade shape as
   `createAudioEngine(onPulse)` so `App.jsx` changes by one import and one flag.
5. **Wire the truthful `SCORE` selector** — only once real genres can be
   switched. Do not label an unimplemented genre as active.
6. **Docs** — CHANGELOG, README, PRODUCT-SPEC, TECHNICAL-DIRECTION, ROADMAP,
   MODES, THIRD_PARTY_NOTICES, NOTICE, and both reference studies still describe
   two environments and no ported code. They must be brought up to date before
   any release claim.
7. **Rendered QA and profiling** at `773 x 601` and the expanded viewport, with
   the AudioWorklet running alongside WebGL.
8. **Deploy** only after user approval, then verify canonical HTML, assets,
   version, hashes and cache behaviour.

## 8. Queued user requests not yet done

- **MERIDIAN quality pass.** The user asked for more of a "wow" demo: glow closer
  to the original Interstate 7, a credible wind/rush effect, particles — while
  holding a fluid 60 fps. Not started.

## 9. How to run things

```bash
cd prototype/drive-lab
npm test          # 90 unit + 4 sites tests
npm run build     # must leave dist/client/index.html, dist/server/index.js, dist/.openai/hosting.json
```

The dev server is configured at the repository root in `.claude/launch.json` and
serves on port 5183.

**QA harness** — `qa-field.html` holds any environment at an exact speed and
measures frame pacing. It is development-only: `vite build` takes `index.html` as
its sole entry, so the harness never reaches a build or a deployment.

```
/qa-field.html?env=meridian&speed=115&theme=red
/qa-field.html?env=latitudes&speed=0&theme=blue&readout=0
/qa-field.html?env=aperture&sweep=30
```

Note that LATITUDES needs about 8 seconds of run time before its history window
fills; capture after that, not immediately after load.

## 10. Local reference material

`_references/` is git-ignored and holds the upstream study copies.

- `_references/repos/tympanus-infinite-lights` — must be at `e58d585`.
- `_references/repos/textStep` — must be at `cb107d1`.

The textStep clone **disappeared from the reference library mid-session** and was
restored with `git clone https://github.com/illobo/textStep.git`, which lands on
the required commit as the default branch tip. If it is missing again, re-clone
and verify `git rev-parse HEAD` before relying on it.

## 11. Measurements taken so far

At 966 x 751 — the resolution the verified Tesla split viewport produces at its
1.53 DPR under the renderers' 1.25 pixel-ratio cap — measured through the QA
harness on the development machine, not on the vehicle:

| Environment | Speed | Result |
|---|---|---|
| MERIDIAN 03 | 0 km/h | 60 fps, mean 16.99 ms, one frame over 34 ms |
| MERIDIAN 03 | 130 km/h | 59.3 fps, mean 16.88 ms |
| LATITUDES 04 | 40–130 km/h | 59.6–60 fps, mean 16.7 ms, no frame over 34 ms |

These are desktop numbers. Nothing about Tesla performance is established until
the same harness runs on the vehicle.
