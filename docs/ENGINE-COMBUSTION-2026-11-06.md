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

## Owner listening and v2 — November 6

The owner's first listen to v1: "not bad", but some engines (the Flat-Six
above all) had too much hiss, and a steady rpm sounded monotonous. A second,
concept-only reading of teslasound.io pointed at noise that is impulsive
rather than continuous and at a steeper muffler. Measured causes and changes:

- **Hiss.** v1 noise rode the whole blowdown pulse and the collector carried
  steady turbulence. High-band energy was continuous: the 0.7 ms envelope of
  2–8 kHz had a peak/mean of 2.5, against 3.3–14.6 in real recordings. v2 moves
  the noise into a burst on the valve-opening edge. The burst decays in about
  4.2 ms at idle and 1.2 ms at redline. Only a trace of turbulence rides the
  rest of the pulse. The muffler, both shut and valved-open, is fourth order.
  Induction roar arrives in gulps, one per intake stroke. Flat-Six cruise:
  4 kHz share −21.4 → −26.4 dB, 8 kHz −26.1 → −31.2 dB, peak/mean 2.6 → 3.4.
- **Monotony.** v1 had slow drifts, but its one-pole low-passed noise kept only
  √(k/(2−k)) of its amplitude, about 5 %, so they were inaudible. v2 normalizes
  slow noise to unit variance and adds life at a held throttle: the driver's
  foot (0.15 and 0.7 Hz, ±5 % throttle) and the road and driveline (1.5 and
  6 Hz, ±0.3 % rpm). There is none at idle (which has its own wander), at a
  closed throttle or flat out. Over 10 s at 3,000 rpm the level now breathes
  2–3 dB instead of 1–1.9 dB.
- **Per-cycle pulse width** varies ±12 % on top of strength and edge sharpness.
- **Not taken.** teslasound adds short damped cabin reflections; the Engine
  contract keeps a dry path without reverb or delay, so body comes from fixed
  resonances.

## Second listening and v3 — November 6

The owner's verdict on v2: very good progression and rhythm, but at high rpm
or flat out the V8 Flat-plane, V10, V12 and Straight Six were "wind" or
"someone blowing into a microphone" rather than a roaring engine. Shifts in the
V12 sounded like breaths. The owner also asked for the occasional bang of a
modified car.

**Measurements at full load and 85 % of redline.** The metric is the share of
40 Hz–6 kHz energy within ±1.5 % of cam-rate multiples. It was −1.7 to −3.2 dB,
against −1.1 for the real Audi R8 recording. Removing one source at a time
pinned it on exhaust grit: with it gone the share rose to −0.5.

**Changes.**

- Valve-opening bursts scale with √(160 / firing events per second), so many
  cylinders at high rpm no longer fuse into a steady hiss. They also follow
  combustion strength^1.5, so weak cycles in shifts and overrun crack softly.
- Grit drops for the V8 Flat-plane (0.30), V10 (0.30), V12 (0.32), Straight Six
  (0.36) and Flat-Six (0.45).
- Radiation leans on the pipe's near-field body as revs rise.
- Induction roar is thinned by firing density, and the plenum carries more
  under load.
- Throttle-plate hiss builds over 0.7 s of closed throttle, never in a shift.
- The V10, V12 and Flat-plane get more bank asymmetry (spread 0.13, skew
  0.09, merge 0.2) for low-order roar. The V12 and Flat-plane also get
  stronger cylinder trims and a main pipe 35 % longer.

**Result.** Full-load harmonic share is now −0.4 to −1.6 dB. Energy below
600 Hz rose: V10 −5.2 → −2.2 dB, V12 −8.7 → −4.9 dB.

**Bang.** `overrun.bang` gives the probability that a hard lift (an upshift or
lift-off above half redline) ends in a backfire 60–260 ms later. The backfire
is a large ignition with a long thump that rings the pipes and shakes the body
modes. It is enabled on the V8 Cross-plane (0.35), Five Turbo (0.30), Boxer
Rumble (0.30) and V8 Flat-plane (0.15). Like every one-shot it is suppressed
on stale evidence.

**Levels.** Per-engine gains are matched so the road pull sits at −23 ± 0.5 dB
offline, with lifts 3–7 dB below.

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

## Cabin bass for the owner's car — v4, November 6

The owner's Tesla has 17 speakers and two subwoofers, so deep bass reaches the
cabin. A sealed cabin's pressure rises below its first acoustic mode, which is
where a sports car's chest-deep boom comes from. v4 adds that pressure gain as
a +8 dB low shelf at 65 Hz on the output (`cabinGainDb`, `cabinGainHz`). The
earlier first-order 18 Hz DC block becomes a second-order 16 Hz high-pass, so
the subwoofers get no infrasound. No subharmonics are synthesized; only the
engine's own low orders gain.

Measured share below 40 Hz:

- V8 Cross-plane cruise: −20.3 → −12.2 dB
- V12 pull: −16.1 → −9.1 dB
- Five Turbo idle: −7.5 → −3.2 dB (its 34 Hz firing fundamental)

Peaks are unchanged at about −4 to −5 dBFS. The offline road pull stays
level-matched at −21.5 to −22.9 dB, with lifts 1–6 dB below.

## Engine LAB redesign — November 6

The owner found the LAB visually broken and unclear about where to click. Two
Codex CLI Image Gen directions were presented, and the owner selected A,
"Listening Console" (references in `output/lab-redesign/`, not versioned).

- `src/engine/lab.jsx` and `src/engine/lab.css` implement it on the Launch
  Cockpit tokens: a light sheet; engines grouped Published/Candidates on the
  left; Play A/Play B, a 68-second route timeline with phase bands and a
  progress marker, Stop and a compact live readout in the centre; the verdict
  (A/B/No preference, note, save, export, recent notes) on the right.
- The manual bench (start, speed, drive input, transmission, gears, hold to
  rev) and diagnostics sit under Advanced controls.
- The LAB no longer embeds the public telemetry cluster, which overlapped its
  own labels at LAB sizes.
- The layout has three columns from 1,180 px, two below that and one below
  860 px; at the Tesla 773 × 601 view nothing is clipped.
- `scripts/qa-engine-lab.mjs` predates this redesign (and still selects the
  retired Otto) and is historical until it is rewritten.

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
