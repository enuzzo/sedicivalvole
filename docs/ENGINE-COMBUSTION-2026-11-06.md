# Combustion synthesizer — November 6, 2026

## Why

The owner judged the published Engine voices (Mono, Rosso, Touring: pitched
`markeasting/engine-audio` loops plus EQ and an earlier procedural layer) not
credible — "carelessly synthesized". The owner found teslasound.io credible and
asked for an original engine that raises the bar. This is a LAB prototype for
listening; the public catalogue is unchanged.

## What was studied, and what was not taken

- **teslasound.io** (© 2026 Lifemock, no open licence). Its published page states
  the sound is synthesized live, with no recordings. Its scripts were read once
  for concept only: a crank-angle pulse train through per-bank pipe waveguides,
  resonances, a muffler and saturation, driven by GPS speed through a
  drivetrain model. **No code, structure, parameter value or car table was
  copied.** Our model was written from first principles and differs in
  architecture (per-cylinder primaries, valve-gated reflections, gas
  temperature, valved muffler bypass, intake and mechanical paths).
- **Literature (concepts only):** the physically informed engine model of
  Baldan, Lachambre, Delle Monache and Boussard (IEEE SIVE 2015) and its Sound
  Design Toolkit implementation (valve-gated waveguides, clustered afterfire);
  Ange Yaghi's engine-sim (runner pressure, derivative radiation, convolution
  for the upper band); Doerfler and Wyse's pulse-train model (EUSIPCO 2026);
  Farnell's *Designing Sound*; and cabin-perception work, which found cabin
  resonances matter more for naturalness than micro-modulation. Pointers live in
  the research summary of this session; nothing was imported.
- **Recordings** in `_references/` (Opel Astra loop, Audi R8, Maserati V8, Ford,
  CC0 performance cars) were used only as a measuring stick. Nothing from them
  enters the build.

## Model

`prototype/drive-lab/src/engine/combustion/dsp.js`, per sample:

1. **Crank** over a 720° cycle; real public firing orders and bank layouts per
   architecture, with a small fixed per-cylinder phase offset (cam and port
   tolerances).
2. **Exhaust flow per cylinder**, shaped in crank degrees: a sonic blowdown with
   a sharp opening edge, then the displacement hump. The pulse therefore
   shortens in time as rpm rises, while the resonances stay put. Turbulence is
   coloured noise riding on the pulse.
3. **Combustion per cycle**: an AR(1) random variable per cylinder plus a slow
   global drift sets strength *and* edge sharpness. Idle has a higher
   coefficient of variation, optional misfire and rpm wander. Overrun cuts fuel,
   with occasional late burns.
4. **Primaries**: one waveguide per cylinder, with lengths that differ between
   cylinders. The reflection at the valve end is high while the valve is shut
   and low while it is open.
5. **Collectors → main pipe → muffler**: an expansion-chamber comb, an optional
   drone notch and an absorptive low-pass. A bypass valve opens with rpm and
   load, so the car is restrained in town and full from about 80 km/h.
   Tailpipes follow, radiating near-field flow plus far-field derivative.
6. **Gas temperature** follows sustained load (heating ≈ 3.5 s, cooling ≈ 9 s)
   and sets the speed of sound in every pipe: resonances rise as the engine
   works.
7. **Intake**: per-cylinder suction, plenum and runner resonance, induction roar
   noise, closed-throttle hiss.
8. **Mechanical**: block modes excited by combustion and valve seating, an
   optional cam-drive whine, injector ticks fading with rpm.
9. **Forced induction**: a turbo with spool inertia, whistle, whoosh and turbine
   damping of the pulses. A blow-off valve or compressor surge flutter on lift.
   Or a supercharger whine locked to rpm.
10. **Events**:
    - Clustered afterfire: a hard run recharges it, each pop spends it.
    - Shift crack on a full-throttle upshift.
    - Rev limiter cutting ignition in 55–95 ms bursts while on the limit.
    - None of these fire while motion evidence is stale (`events = 0`).
11. **Cabin**: low-pass plus two body/cabin modes, DC block, soft saturation.

Eight original architectures (`engines.js`):

- V8 Cross-plane
- V8 Flat-plane
- Flat-Six
- V10
- V12
- Five Turbo
- Boxer Rumble (unequal headers, turbo without blow-off valve)
- Straight Six

Their names are architectures, not car replicas.

## Integration

- **Worklet.** `combustion/combustion-processor.js` registers `sedicivalvole-combustion`
  with the same parameter contract as the earlier procedural voice: rpm, load,
  boost, active, events. `procedural-voice.js` picks the processor from
  `voice.model`.
- **Profiles.** Each candidate is a fully procedural profile in `profiles.js`:
  no assets, neutral voicing, mono road ratios, limiter from its definition.
- **Catalogue.** `catalogue.js` lists the candidates as `ENGINE_LAB_CANDIDATES`.
  `isEngineProfile` and the public `ENGINE_CATALOGUE` are untouched.
- **LAB.** A candidate's A/B is **A · Published Rosso** (full-body) against
  **B · Combustion · <engine>**, on the same 68-second route. Saved notes record
  `rosso:full-body.v1` and `combustion.v1:<engine>`. Bump
  `COMBUSTION_CALIBRATION` in `lab-comparison.js` whenever the synthesizer or an
  engine definition changes.
- **Offline audition.** `node scripts/render-combustion.mjs [engine …]` writes
  41-second scenes to `output/combustion-preview/`: idle, blips, limiter,
  four-gear pull, overrun, cruise, kickdown, coast.

## Measured evidence (not listening acceptance)

**Recordings vs renders**

- Real recordings put about 40–80 % of their energy on firing-order harmonics.
- Their long-term spectrum sits mostly at 60–500 Hz and falls 6–10 dB per octave
  above 1 kHz.
- The steady Opel loop has −14.3 dB of non-firing-order (half-order) energy. The
  candidates at steady cruise measure −9 to −12 dB, with the cross-plane V8
  higher, as its uneven bank firing predicts.

**Earlier layer**

- The earlier procedural layer carried a fixed ~100 Hz oscillation inside every
  pulse, a timbre no engine has.

**Fixed during the build**

- An unclustered afterfire rate made overrun louder than full load.
- A blow-off valve was louder than the engine.
- A limiter would have stayed silent when the runtime holds rpm at the limit.
- First-sample spurious events occurred.

**Tests**

- `tests/engine-combustion.test.mjs` covers firing counts at 44.1 and 48 kHz,
  bounds, idle < pull and coast < pull, determinism, limiter bursts,
  stale-evidence suppression, clustered afterfire, gas heating, worklet fade and
  disposal, and the LAB-only catalogue boundary.

**Real runtime, road route**

The dev harness (`scripts/engine-harness.html`) ran the 29-second route: idle,
0–95 km/h, 100 cruise, lift to 30, 30 cruise. With `COMBUSTION_MIX = 6`:

- Acceleration measures −18 to −23 dB RMS, against −20.1 for the published Rosso.
- Peaks stay at −2.9 dBFS or below, with no clipped samples.
- Lifts sit 2–8 dB below acceleration (V8 Cross-plane −2.3, V12 −8.0), after
  making overrun depth absolute in rpm and lowering the valve threshold of the
  high-revving engines.
- Town at 30 km/h sits about 7–12 dB below acceleration, and idle about 10–17 dB
  below.

These are levels, not loudness matching. Runs in a hidden browser pane can
stall the runtime's 160 ms preparation wait, so ignore silent takes from a
background tab.

**Known compromise**

The runtime's confirmed standstill is 600 rpm. Some candidates idle higher
(the flat-plane at 1,000 rpm), so their standstill sounds slower than their own
idle.

**Rendering speed**

- Offline rendering runs 40–70× real time in Node.

**Not yet established**

- Owner listening, Tesla cabin playback, CPU headroom on the car's browser, and
  any claim that it beats the reference. Those need the LAB and the car.
