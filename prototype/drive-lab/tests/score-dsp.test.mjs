import assert from "node:assert/strict";
import test from "node:test";
import {
  BARS_PER_PHRASE,
  SequencerClock,
  STEPS_PER_BAR,
  STEPS_PER_PATTERN,
  STEPS_PER_PHRASE,
} from "../src/score/clock.js";
import { activeSteps, decodeSteps, encodeSteps, lanePattern } from "../src/score/patterns.js";
import {
  ClapVoice,
  ClosedHiHatVoice,
  createDrumVoices,
  drumParams,
  KickVoice,
  OpenHiHatVoice,
  SnareVoice,
} from "../src/score/dsp/drum-voices.js";
import {
  LookaheadLimiter,
  RampedParam,
  SidechainEnvelope,
  subdivisionSeconds,
  TempoDelay,
  TubeSaturator,
} from "../src/score/dsp/effects.js";
import { applyDrive, Noise, StateVariableFilter } from "../src/score/dsp/primitives.js";

const SAMPLE_RATE = 48000;

/** Renders one triggered voice and reports what it produced. */
function renderVoice(voice, params, samples) {
  voice.trigger(params);
  let peak = 0;
  let energy = 0;
  let finite = true;
  const output = new Float64Array(samples);
  for (let index = 0; index < samples; index += 1) {
    const sample = voice.tick();
    if (!Number.isFinite(sample)) finite = false;
    output[index] = sample;
    peak = Math.max(peak, Math.abs(sample));
    energy += sample * sample;
  }
  return { peak, rms: Math.sqrt(energy / samples), finite, output };
}

// ── clock ──────────────────────────────────────────────────────────────────

test("emits step zero immediately and then only on the sample boundary", () => {
  const clock = new SequencerClock();
  const first = clock.advance(174, SAMPLE_RATE, 0.5);
  assert.equal(first.globalStep, 0);
  assert.equal(first.beat, 0);
  assert.ok(first.isBarStart && first.isPhraseStart);
  assert.equal(clock.advance(174, SAMPLE_RATE, 0.5), null);
});

test("advances one step after exactly the right number of samples", () => {
  const bpm = 174;
  const samplesPerStep = (SAMPLE_RATE * 60) / bpm / 4;
  const clock = new SequencerClock();
  clock.advance(bpm, SAMPLE_RATE, 0.5);

  const fired = [];
  for (let sample = 0; sample < Math.ceil(samplesPerStep); sample += 1) {
    const event = clock.advance(bpm, SAMPLE_RATE, 0.5);
    if (event) fired.push(event.globalStep);
  }
  assert.deepEqual(fired, [1]);
});

test("reports bar, phrase and pattern position for quantised arrangement", () => {
  const clock = new SequencerClock();
  const seen = new Map();
  for (let sample = 0; sample < SAMPLE_RATE * 12; sample += 1) {
    const event = clock.advance(174, SAMPLE_RATE, 0.5);
    if (event && !seen.has(event.globalStep)) seen.set(event.globalStep, event);
  }

  assert.ok(seen.size > STEPS_PER_PHRASE, "twelve seconds must cover a phrase");
  for (const [step, event] of seen) {
    assert.equal(event.isBarStart, step % STEPS_PER_BAR === 0, `bar flag at ${step}`);
    assert.equal(event.isPhraseStart, step % STEPS_PER_PHRASE === 0, `phrase flag at ${step}`);
    assert.equal(event.patternStep, step % STEPS_PER_PATTERN);
    assert.equal(event.barInPhrase, Math.floor(step / STEPS_PER_BAR) % BARS_PER_PHRASE);
    assert.equal(event.beat, Math.floor(step / 4) % 4);
  }
});

test("swing lengthens even steps and shortens odd ones without losing the beat", () => {
  const bpm = 174;
  const measure = (swing) => {
    const clock = new SequencerClock();
    const times = [];
    for (let sample = 0; sample < SAMPLE_RATE * 4; sample += 1) {
      if (clock.advance(bpm, SAMPLE_RATE, swing)) times.push(sample);
    }
    return times;
  };

  const straight = measure(0.5);
  const swung = measure(0.66);
  const straightGaps = straight.slice(1, 9).map((time, index) => time - straight[index]);
  const swungGaps = swung.slice(1, 9).map((time, index) => time - swung[index]);

  assert.ok(Math.max(...straightGaps) - Math.min(...straightGaps) <= 1, "straight is even");
  assert.ok(swungGaps[0] > swungGaps[1], "swing must lengthen the even step");

  // A swung bar still takes the same total time as a straight one.
  assert.ok(Math.abs(swung[8] - straight[8]) < SAMPLE_RATE * 0.01);
});

test("resetting returns to step zero", () => {
  const clock = new SequencerClock();
  for (let sample = 0; sample < SAMPLE_RATE; sample += 1) clock.advance(174, SAMPLE_RATE, 0.5);
  clock.reset();
  assert.equal(clock.advance(174, SAMPLE_RATE, 0.5).globalStep, 0);
});

// ── patterns ───────────────────────────────────────────────────────────────

test("decodes the upstream hex step encoding, most significant bit first", () => {
  assert.deepEqual(Array.from(decodeSteps("80000000").slice(0, 4)), [1, 0, 0, 0]);
  assert.deepEqual(Array.from(decodeSteps("10000000").slice(0, 4)), [0, 0, 0, 1]);
  assert.deepEqual(Array.from(decodeSteps("f0000000").slice(0, 4)), [1, 1, 1, 1]);
  assert.equal(decodeSteps("ffffffff").reduce((total, step) => total + step, 0), 32);
  assert.equal(decodeSteps("00000000").reduce((total, step) => total + step, 0), 0);
});

test("round-trips every pattern through hex", () => {
  for (const hex of ["80200080", "04080408", "aaaa0000", "80200820", "1c3f90a5"]) {
    assert.equal(encodeSteps(decodeSteps(hex)), hex);
  }
});

test("rejects a malformed pattern instead of failing silently", () => {
  for (const bad of ["8020008", "80200080a", "8020008g", "", null, 42]) {
    assert.throws(() => decodeSteps(bad), TypeError, String(bad));
  }
});

test("places ghost articulations below the accented hits", () => {
  const velocities = lanePattern({ hits: "80000000", ghosts: "08000000", velocity: 1 });
  // Velocities are stored as Float32Array for the audio thread, so compare with
  // single-precision tolerance rather than exactly.
  assert.equal(velocities[0], 1);
  assert.ok(Math.abs(velocities[4] - 0.38) < 1e-6);
  assert.ok(velocities[4] < velocities[0], "a ghost must sit below an accent");
  assert.deepEqual(activeSteps(velocities), [0, 4]);
  // A step cannot be both an accent and a ghost; the accent wins.
  const overlap = lanePattern({ hits: "80000000", ghosts: "80000000" });
  assert.equal(overlap[0], 1);
});

// ── primitives ─────────────────────────────────────────────────────────────

test("keeps the noise generator inside its range and non-repeating", () => {
  const noise = new Noise(42);
  const seen = new Set();
  for (let index = 0; index < 20000; index += 1) {
    const sample = noise.next();
    assert.ok(sample >= -1 && sample <= 1, `noise out of range: ${sample}`);
    assert.ok(Number.isFinite(sample));
    seen.add(sample);
  }
  assert.ok(seen.size > 19000, "the generator must not fall into a short cycle");

  // Deterministic: the same seed must reproduce the same stream.
  const a = new Noise(7);
  const b = new Noise(7);
  for (let index = 0; index < 500; index += 1) assert.equal(a.next(), b.next());
});

test("drive is transparent when idle and bounded when pushed", () => {
  assert.equal(applyDrive(0.4, 0), 0.4);
  for (const input of [-1.5, -0.5, 0, 0.5, 1.5]) {
    const driven = applyDrive(input, 1);
    assert.ok(Number.isFinite(driven));
    assert.ok(Math.abs(driven) <= 1.6, `drive must stay bounded, got ${driven}`);
  }
  assert.ok(applyDrive(0.5, 1) > applyDrive(0.5, 0.1), "more drive means more level");
});

test("the state-variable filter stays stable at extreme settings", () => {
  const filter = new StateVariableFilter();
  filter.setFrequency(19000, 0.9, SAMPLE_RATE);
  const noise = new Noise(5);
  for (let index = 0; index < 20000; index += 1) {
    filter.tick(noise.next());
    assert.ok(Number.isFinite(filter.lowPass), `diverged at ${index}`);
    assert.ok(Math.abs(filter.lowPass) < 50, `blew up at ${index}: ${filter.lowPass}`);
  }
});

// ── voices ─────────────────────────────────────────────────────────────────

test("every drum voice produces bounded, finite sound and then falls silent", () => {
  const voices = {
    kick: [new KickVoice(SAMPLE_RATE), drumParams({ tune: 0.28, decay: 0.5 })],
    snare: [new SnareVoice(SAMPLE_RATE), drumParams({ tune: 0.45, decay: 0.35 })],
    closedHat: [new ClosedHiHatVoice(SAMPLE_RATE), drumParams({ decay: 0.2 })],
    openHat: [new OpenHiHatVoice(SAMPLE_RATE), drumParams({ decay: 0.3 })],
    clap: [new ClapVoice(SAMPLE_RATE), drumParams({ decay: 0.3 })],
  };

  for (const [name, [voice, params]] of Object.entries(voices)) {
    // Two seconds: the longest body envelope here crosses the release threshold
    // at about 1.13 s, matching the upstream decay times.
    const rendered = renderVoice(voice, params, SAMPLE_RATE * 2);
    assert.ok(rendered.finite, `${name} produced a non-finite sample`);
    assert.ok(rendered.peak > 0.01, `${name} produced no audible level (${rendered.peak})`);
    assert.ok(rendered.peak < 8, `${name} peaked far too high (${rendered.peak})`);
    assert.equal(voice.active, false, `${name} never released`);

    // Whatever is left in the last quarter second must already be inaudible.
    let tailPeak = 0;
    for (let index = rendered.output.length - SAMPLE_RATE / 4; index < rendered.output.length; index += 1) {
      tailPeak = Math.max(tailPeak, Math.abs(rendered.output[index]));
    }
    assert.ok(tailPeak < 1e-4, `${name} left an audible tail (${tailPeak})`);
  }
});

test("the kick carries real low-frequency weight", () => {
  const kick = new KickVoice(SAMPLE_RATE);
  const { output } = renderVoice(kick, drumParams({ tune: 0.28, decay: 0.55, color: 0.2 }), 12000);

  // Goertzel magnitude at a low and a high probe frequency.
  const magnitudeAt = (frequency) => {
    const omega = (2 * Math.PI * frequency) / SAMPLE_RATE;
    let real = 0;
    let imaginary = 0;
    for (let index = 0; index < output.length; index += 1) {
      real += output[index] * Math.cos(omega * index);
      imaginary += output[index] * Math.sin(omega * index);
    }
    return Math.hypot(real, imaginary);
  };

  assert.ok(
    magnitudeAt(55) > magnitudeAt(2000) * 4,
    "the kick must be dominated by its low end",
  );
});

test("the closed hat is bright and short while the open hat sustains", () => {
  const closed = new ClosedHiHatVoice(SAMPLE_RATE);
  const open = new OpenHiHatVoice(SAMPLE_RATE);
  const closedRender = renderVoice(closed, drumParams({ decay: 0.2 }), SAMPLE_RATE);
  const openRender = renderVoice(open, drumParams({ decay: 0.5 }), SAMPLE_RATE);

  const tailEnergy = (output, from) => {
    let energy = 0;
    for (let index = from; index < output.length; index += 1) energy += output[index] ** 2;
    return energy;
  };

  assert.ok(
    tailEnergy(openRender.output, 12000) > tailEnergy(closedRender.output, 12000) * 10,
    "the open hat must ring far longer than the closed hat",
  );
});

test("choking the open hat cuts it off quickly", () => {
  const open = new OpenHiHatVoice(SAMPLE_RATE);
  open.trigger(drumParams({ decay: 0.9 }));
  for (let index = 0; index < 2000; index += 1) open.tick();
  open.choke();

  let peakAfterChoke = 0;
  for (let index = 0; index < 4000; index += 1) {
    peakAfterChoke = Math.max(peakAfterChoke, Math.abs(open.tick()));
  }
  // Roughly 10 ms of exponential fade, so 4000 samples later it must be gone.
  assert.equal(open.active, false, "a choked hat must release");
  assert.ok(peakAfterChoke < 1.5, "the choke must not spike");
});

test("the clap fires a burst train before its tail", () => {
  const clap = new ClapVoice(SAMPLE_RATE);
  const { output } = renderVoice(clap, drumParams({ snap: 1, decay: 0.3 }), SAMPLE_RATE);
  // Count silent runs inside the first 60 ms: the gate between bursts.
  let gaps = 0;
  let inGap = false;
  for (let index = 0; index < 2880; index += 1) {
    const silent = output[index] === 0;
    if (silent && !inGap) gaps += 1;
    inGap = silent;
  }
  assert.ok(gaps >= 2, `expected a burst train, found ${gaps} gaps`);
});

test("creates the full kit at a given sample rate", () => {
  const voices = createDrumVoices(SAMPLE_RATE);
  assert.deepEqual(
    Object.keys(voices).sort(),
    ["clap", "closedHat", "kick", "openHat", "snare"],
  );
});

// ── effects ────────────────────────────────────────────────────────────────

test("the ramped parameter reaches its target without a jump", () => {
  const param = new RampedParam(0);
  param.set(1, 100);
  let previous = 0;
  for (let index = 0; index < 100; index += 1) {
    const value = param.next();
    assert.ok(value - previous <= 0.011, "the ramp must not step");
    previous = value;
  }
  assert.ok(Math.abs(param.value() - 1) < 1e-9);
  // A zero-length ramp is an immediate write.
  param.set(0.25, 0);
  assert.equal(param.value(), 0.25);
});

test("delay subdivisions follow the transport tempo", () => {
  assert.ok(Math.abs(subdivisionSeconds("quarter", 120) - 0.5) < 1e-9);
  assert.ok(Math.abs(subdivisionSeconds("eighth", 120) - 0.25) < 1e-9);
  assert.ok(Math.abs(subdivisionSeconds("eighthDotted", 120) - 0.375) < 1e-9);
  assert.ok(subdivisionSeconds("eighth", 174) < subdivisionSeconds("eighth", 120));
});

test("the limiter holds the mix below its conservative ceiling", () => {
  const limiter = new LookaheadLimiter(SAMPLE_RATE);
  let peak = 0;
  for (let index = 0; index < SAMPLE_RATE; index += 1) {
    const loud = Math.sin((index / SAMPLE_RATE) * 440 * 2 * Math.PI) * 3;
    const [left, right] = limiter.tickStereo(loud, loud);
    if (index > 4800) peak = Math.max(peak, Math.abs(left), Math.abs(right));
  }
  assert.ok(peak <= 0.76, `the limiter must protect the ceiling, peaked at ${peak}`);
  assert.ok(peak > 0.3, "the limiter must not squash the mix to nothing");
});

test("the sidechain follower ducks on a transient and recovers", () => {
  const sidechain = new SidechainEnvelope(SAMPLE_RATE);
  for (let index = 0; index < 480; index += 1) sidechain.tick(1);
  const ducked = sidechain.duckGain(0.8);
  assert.ok(ducked < 0.55, `expected a clear duck, got ${ducked}`);

  for (let index = 0; index < SAMPLE_RATE; index += 1) sidechain.tick(0);
  assert.ok(sidechain.duckGain(0.8) > 0.99, "the duck must recover to unity");
});

test("the saturator is transparent when clean and bounded when driven", () => {
  const clean = new TubeSaturator(SAMPLE_RATE);
  clean.setDrive(0);
  assert.equal(clean.tick(0.4), 0.4);

  const driven = new TubeSaturator(SAMPLE_RATE);
  driven.setDrive(1);
  let peak = 0;
  for (let index = 0; index < SAMPLE_RATE; index += 1) {
    const sample = driven.tick(Math.sin((index / SAMPLE_RATE) * 220 * 2 * Math.PI));
    assert.ok(Number.isFinite(sample), `saturator diverged at ${index}`);
    peak = Math.max(peak, Math.abs(sample));
  }
  assert.ok(peak < 2, `the saturator must stay bounded, peaked at ${peak}`);
});

test("the delay repeats in time and decays instead of running away", () => {
  const delay = new TempoDelay(SAMPLE_RATE);
  delay.setTime("eighth", 174, 0);
  delay.setFeedback(0.5);

  let peak = 0;
  for (let index = 0; index < SAMPLE_RATE * 8; index += 1) {
    const input = index === 0 ? 1 : 0;
    const [left, right] = delay.tickStereo(input, input);
    assert.ok(Number.isFinite(left) && Number.isFinite(right), `delay diverged at ${index}`);
    if (index > SAMPLE_RATE * 6) peak = Math.max(peak, Math.abs(left), Math.abs(right));
  }
  assert.ok(peak < 0.2, `feedback must decay, tail still at ${peak}`);
});
