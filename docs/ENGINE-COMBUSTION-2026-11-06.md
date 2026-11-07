# Combustion synthesizer — November 6, 2026

## Why

The owner judged the published Engine voices (Mono, Rosso, Touring: pitched
`markeasting/engine-audio` loops plus EQ and an earlier procedural layer) not
credible — "carelessly synthesized". The owner found teslasound.io credible and
asked for an original engine that raises the bar. It began as a LAB prototype for
listening; since November 7 its eight voices are public (see [Public release](#public-release--november-7)).

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
   coloured noise riding on the pulse; since v6 it follows cylinder pressure
   (a cube of throttle) and piston speed, so idle and cruise carry only a trace.
3. **Combustion per cycle**: an AR(1) random variable per cylinder plus a slow
   global drift sets strength *and* edge sharpness. Idle has a higher
   coefficient of variation, optional misfire and rpm wander. Overrun cuts fuel
   (since v7 after 0.4 s of closed throttle), with occasional late burns.
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
7. **Intake**: per-cylinder suction, plenum and runner resonance, and induction
   roar rising with the square of the throttle, all heard through the engine-bay
   bulkhead (fourth-order low-pass at 2.2 kHz). The closed-throttle hiss of
   v1–v5 was removed in v6.
8. **Mechanical**: block modes excited by combustion and valve seating, an
   optional cam-drive whine, injector ticks fading with rpm.
9. **Forced induction**: a turbo with spool inertia, whistle, whoosh and turbine
   damping of the pulses. A blow-off valve or compressor surge flutter on lift.
   Or a supercharger whine locked to rpm.
10. **Events**:
    - Clustered afterfire: a hard run recharges it, each pop spends it. Since v7
      only the V8 Cross-plane and the Five Turbo carry it.
    - Shift crack on a full-throttle lift (the same two engines).
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
- **Catalogue.** `catalogue.js` lists them as `ENGINE_COMBUSTION_VOICES`; since
  November 7 they are also in the public `ENGINE_CATALOGUE`.
- **LAB.** A candidate's A/B is **A · Published Rosso** (full-body) against
  **B · Combustion · <engine>**, on the same 68-second route. Saved notes record
  `rosso:full-body.v1` and `combustion.v1:<engine>`. Bump
  `COMBUSTION_CALIBRATION` in `lab-comparison.js` whenever the synthesizer or an
  engine definition changes.
- **Offline audition.** `node scripts/render-combustion.mjs [engine …]` writes
  41-second scenes to `output/combustion-preview/`: idle, blips, limiter,
  four-gear pull, overrun, cruise, kickdown, coast.
- **Drive replay and noise share.** `npm run qa:engine-acoustics -- drive|noise
  [--baseline <ref>]` measures cut-outs, pops, compression and noise against
  any earlier release; see [Acoustic QA tools](agent-guide/engine.md#acoustic-qa-tools--november-7).

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

The runtime's confirmed standstill was 600 rpm, below some engines' own idle
(the flat-plane idles at 1,000 rpm). Resolved in v5: each combustion voice now
stands at its own idle.

**Rendering speed**

- Offline rendering runs 40–70× real time in Node.

**Not yet established**

- Owner listening, Tesla cabin playback, CPU headroom on the car's browser, and
  any claim that it beats the reference. Those need the LAB and the car.

## Public release — November 7

The owner asked to hear the voices driving, on real GPS, and chose "Mettili
pubblici" over a LAB-session-only unlock. All eight voices are now in the public
`ENGINE_CATALOGUE`, after Mono, Rosso and Touring, so the launch grid, the
running stepper, the steering-wheel previous/next cycle and the phone remote
all offer eleven voices. The LAB keeps the same A/B (Rosso against the chosen
combustion voice) and lists them under "COMBUSTION".

- **Launch.** Compact one-line tiles in three columns; START stays visible at
  773 × 601 without scrolling. The selected tile is now visibly marked in the
  Night Instrument appearance, which had lost that state.
- **Running.** The eleven-button row overlapped the voice title, so the lane
  holds a stepper: previous, the voice name with its position, next. The name
  opens every voice in a grid that closes on choice, outside tap or Escape.
- **Not yet established.** Car listening, CPU headroom on the Tesla browser,
  and road behaviour of the higher idles remain the owner's acceptance.


## Refinement v5 — November 7

The owner asked for a deeper refinement pass before car listening: re-read the
owner's August GEAPS study (`_references/sedicivalvole_engine_study`, read only,
nothing copied), research how real engines sound and behave, improve the GPS
response, and keep a stationary engine from sounding monotonous. Calibration id
`combustion.v5`.

**Engine behaviour**

- **Idle per architecture.** A combustion voice idles at its own idle
  (720–1,000 rpm) at a confirmed stop, during the no-speed fallback and at the
  end of TAMARRO; moving road rpm never falls below it. Sample voices keep 600.
- **Road rpm per architecture.** The shared road table put every engine at the
  same rpm for a given speed. The final drive now scales with the redline,
  bounded to 0.88–1.025 so the owner's September contract holds in absolute rpm
  (20–40 km/h ≤ 3,000 rpm, second at 30 km/h ≤ 2,800, 80 km/h ≥ 3,500). At
  100 km/h the flat-plane turns about 4,640 rpm, the cross-plane about 3,950.
  The full-load shift points stay km/h-based: the owner's contract keeps first
  and second below 22 and 40 km/h even flat out.
- **Idle blips** carry a pedal (0.6 for 0.22 s), rise in 0.3 s and fall on a
  closed throttle. Before, the rise ran with the throttle shut, so the voice read
  it as an overrun and the blip was about 2 dB *quieter* than idle. After the
  first blip at five seconds, pauses vary 4–7.5 s and peaks 70–100 % of +1,200 rpm.
- **Power downshifts.** A kickdown, or any downshift above half load, keeps the
  throttle open: the crank flares about 8 % of the rpm step past the new gear
  and settles. Overrun stays at 0 and the level within 1 dB (offline V10, 5→4).
- **Neutral falls.** TAMARRO's closed-throttle segments fall fast at first and
  slow toward idle (ease-out, 25 % longer), as friction and pumping do, instead
  of a symmetric ease.

**Synthesizer**

- **Limiter bounce.** While the limiter holds, the crank falls at 5,200 rpm/s
  during each ignition cut and recovers at 7,000 rpm/s, bounded to 320 rpm: about
  220 rpm deep at 10–18 Hz. Combustion voices no longer receive TAMARRO's authored
  8 Hz flutter, which was uncorrelated with the cut; sample voices keep it.
- **Tip-in bark.** A throttle snapped open boosts combustion strength (+45 %),
  intake roar (×2.2) and level (+30 %) on an envelope decaying in 0.15 s. The rise
  of an idle blip now sits 3–4 dB above idle; steady levels move by under 0.4 dB.
- **Idle life.** ECU hunt (0.45 Hz, 1.2 % rpm), accessory cycling (on 3–8 s, off
  6–18 s; a 6 % sag on engagement, a 3 % flare on release, +8 % load) and a slow
  burn breath (0.12 Hz, ±7 % strength, ±12 % edge). Over 40 s of idle the rpm
  span rises from 23–48 to 61–100 rpm and the level breathes about 1 dB (sd), up
  from 0.35–0.75 dB. None of it acts once the engine works.
- **Turbo whistle** now tops out at 4.5 kHz (Five Turbo) and 4.2 kHz (Boxer
  Rumble), within the 1.2–4.5 kHz shaft-frequency range reported for real turbos.
- **Fixed filters** (valved-open path, cabin) are designed once; the muffler is
  retuned only when gas temperature or throttle have moved enough to be heard.

**GPS response**

- **Asymmetric trust in the speed tracker.** See [engine guide](agent-guide/engine.md).
  Offline, a lift is followed in 280 ms instead of 480 at 10 Hz, and in 0.7 s
  instead of 1.7 at 1 Hz.
- **Not taken:** holding load through a degraded (1.8–5 s) GPS gap. The tested
  contract is that untrusted GPS requests no load, and gaps that long are rare
  with the Tesla's ~10 Hz callbacks.

**Measured, not changed**

- **CPU.** One core of the development Mac: 1.5 % (Boxer Rumble) to 2.4 % (V12)
  in every scene. The cost is spread over the pipes and filters of the model;
  there was no single waste to remove. Tesla CPU headroom is still unmeasured.
- **Master compressor.** Offline at the real chain gain (×6 voice mix, ×0.16
  master), peaks reach −5 to −7 dBFS on the limiter; the −8 dB, 20:1 compressor
  takes at most 0.5 dB. It does not flatten the pulses.
- **Load span** at 3,000 rpm: full load sits 6.5–11 dB above light load. Coast
  is 2–5 dB above light load because of the burble, consistent with the owner's
  rule that lifts keep their level.

**Research leads deferred until car listening** (they would move a timbre the
owner has not heard in the car yet):

- Physical summation of banks and tailpipes: half orders should come from path
  asymmetry, about −10 to −20 dB below the firing order.
- Two-speed gas temperature: primaries following load in about 0.3 s, downstream
  sections dominated by walls (30–90 s).
- Shock steepening at high rpm for a harmonic, not noisy, rasp.
- The +8 dB cabin shelf may double the Tesla cabin's own low-frequency gain;
  check it in the car before keeping it.
- A torque-return thump at shift re-engagement, and S-curved shift ramps.

## Road listening and v6 — November 7

The owner's first drive on the public voices: "all excellent, very deep and
beautiful bass", but a steady "rustle / wind" was always there. A real car has
none: "only engine, bass and mids, except when you accelerate and the dynamics
grow". Calibration id `combustion.v6`.

**Measurement** (reproduce with `npm run qa:engine-acoustics -- noise --baseline
pre-combustion-v6-20261107`). The v2/v3 checks used unweighted energy and full load, where
the firing orders own the spectrum. The noise lives at 0.6–2 kHz, where the ear
is most sensitive, and at part load. The new check silences every aperiodic
source on the same random sequence, subtracts, and weighs the difference
A-weighted against the whole voice. Road scenes use the runtime's load and boost
(50 km/h ≈ 1,800 rpm at load 0.25, 110 km/h ≈ 2,700 rpm at 0.45).

| Scene | v5 noise share | v6 noise share |
| --- | --- | --- |
| Idle | −9 to −14 dBA | −28 to −33 dBA |
| 50 km/h | −7 to −11 dBA | −25 to −30 dBA |
| 110 km/h | −5 to −8 dBA | −17 to −23 dBA |
| Lift at 3,000 rpm | −9 to −15 dBA | −26 to −32 dBA |
| Accelerating (3,000 rpm, load 0.7) | −3 to −6 dBA | −9 to −13 dBA |
| Flat out (4,200 rpm) | −2 to −6 dBA | −3 to −7 dBA |

**Causes, one source at a time.**

- **Valve-opening jet (exhaust grit)**, −4 to −16 dBA in every scene, the
  largest. Its burst followed `0.5 + 0.5 × throttle`, so a cruise kept most of a
  full-load rasp. Real jet noise follows cylinder pressure at exhaust opening
  (about 2–3 bar on a throttled cruise, twice that on a full charge) with a high
  power of flow speed. The burst and the turbulence riding the pulse now follow
  `0.06 + 0.94 × throttle³`; full load is unchanged.
- **Displacement-flow noise**, −25 to −29 dBA at idle and load-independent: it now
  follows piston speed (rpm / redline).
- **Induction roar**, −8 to −23 dBA at part load in the high-revving engines
  (V8 Flat-plane, Flat-Six, V10, V12, Straight Six), centred at 1.1–1.9 kHz: the
  "breath". It followed `0.3 + throttle`; orifice noise past the throttle plate
  now follows `0.04 + 1.26 × throttle²`. The intake also reached the cabin with
  no filtering while the exhaust passed the cabin low-pass; it now passes the
  bulkhead low-pass.
- **Throttle-plate hiss**, −29 to −40 dBA at idle and on lifts, high-passed at
  2.6 kHz: removed. It never reaches a cabin from under the bonnet.
- **Collector turbulence** (−35 to −43 dBA) and **turbo whoosh** (−28 dBA at
  110 km/h, −11 flat out) stay: the whoosh belongs to boost.

**Unchanged.** Bass below 250 Hz and A-weighted level move within ±1 dB (the
removed hiss shifts the random sequence, so single takes differ by that much).
CPU stays at 1.6–2.4 % of one development-Mac core.

**Test.** `engine-combustion.test.mjs` pins the contract for all eight engines:
noise below −22 dBA at idle and −20 dBA at 50 km/h and on lifts, below −15 dBA at
110 km/h, and flat out at least 8 dB above cruise.

## Owner listening and v7 — November 7

The owner's verdict on v6: "not bad", but "remove the constant explosions in
every engine, keep them in a couple, otherwise they all sound the same". Also:
"make sure the mix works and there are no interruptions; now and then it is like
pulling a microphone out and plugging it back in, with 'engagements'". Calibration
id `combustion.v7`.

**Evidence.** No diagnostic report from the car was available (the mailed reports
of November 7 came from desk verification). A drive replay was built instead,
now `npm run qa:engine-acoustics -- drive --baseline pre-combustion-v7-20261107`:
the real runtime (mock `AudioContext`) and the real motion model, fed a
Tesla-like GPS trace (10 Hz, whole km/h, ±0.25 km/h noise), drive the
synthesizer; the master gain and a model of the master compressor (−8 dB, 20:1,
3 ms / 150 ms) follow. The 100 s route has a stop, a pull-away through three
upshifts, cruises, lifts and a stop.

**Causes.**

- **Every upshift cut the engine out.** The shift plan released the load to
  0.06 for about 90 ms. The synthesizer read that as a lift: overrun reached
  0.65–0.75, the sound fell 5–11 dB, afterfire fired, and the load returning
  set off a full tip-in bark. Out, then back in: the "microphone".
- **False lifts at cruise.** At the end of an acceleration a single sample 1 km/h
  low fires the speed tracker's lift cue; the load dips to about 0.1 for half a
  second. Town cruise load is low (about 0.2), so every dip crossed the fuel-cut
  threshold: 1–5 entries into overrun per engine in 35 s of steady cruise.
- **Afterfire everywhere.** 28–43 pops per 100 s in every engine, at every
  upshift and lift; the burble's own pops ignored `overrun.pop`. Pops pushed the
  master compressor to 2–3 dB of gain reduction.

**Changes.**

- **Afterfire in two engines.** The V8 Cross-plane (muscle burble and bang) and
  the Five Turbo (rally crackle and blow-off) keep their sporting maps. The other
  six have a stock map: no crackle, pops, bang or shift crack, and a trace of
  burble (0.05). Burble pops now scale with `overrun.pop`.
- **Upshifts cut torque, not the throttle.** Combustion profiles carry
  `powertrain.upshiftLoadHold: 0.5`: an upshift keeps half the load (at least
  0.15, never more than it had), as a modern automatic's ignition cut does.
  Coasting downshifts and the sample voices keep the full release.
- **Fuel-cut delay.** Overrun engages only after the throttle has been shut for
  0.4 s, as an ECU's deceleration cut-off delay does. Shifts and GPS dips stay
  fuelled; a held lift reaches overrun about 0.5 s after the pedal.
- **Tip-in from vacuum.** The bark fades out as the throttle it opens from
  approaches 0.35: a pedal snapped from closed still barks, the end of a shift
  or a dip from part load does not.

**Result (drive replay, all eight engines; the committed tool on its default
100 s route, which has 43 s of steady cruise).**

| Measure | v6 | v7 |
| --- | --- | --- |
| Pops per 100 s | 30–51 | 0 (six engines), 25 V8 Cross-plane, 20 Five Turbo |
| Overrun during upshifts | 0.65–0.78 | 0 |
| Tip-in bark after upshifts | 1.0 | at most 0.05 |
| Level dip through an upshift | −4.1 to −10.6 dB | −2.8 to −6.6 dB (mostly the rpm drop) |
| Fuel-cut entries in steady cruise | 0–7 | 0–2 (see v8) |
| Master compressor gain reduction | 0.7–2.4 dB | at most 0.1 dB (six engines and Five Turbo), 0.6 V8 Cross-plane |

A held lift still reaches full overrun; the remaining fall at the end of an
acceleration is the engine unloading (about 5 dB over 0.4 s), not a cut.

**Tests.** `engine-combustion.test.mjs` pins afterfire to the two engines, the
fuel-cut delay, the tip-in gate and the upshift load hold; each fails on v6.
