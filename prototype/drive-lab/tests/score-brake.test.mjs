import assert from "node:assert/strict";
import test from "node:test";
import { BrakeFilter } from "../src/score/dsp/brake-filter.js";
import { createScoreCore } from "../src/score/score-core.js";

const SAMPLE_RATE = 48000;
const BLOCK = 128;

/** Renders real score output at a given speed, so the measurement uses music. */
function renderScore(speedKmh, seconds) {
  const core = createScoreCore({ sampleRate: SAMPLE_RATE });
  const frames = Math.round(seconds * SAMPLE_RATE);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  const blockLeft = new Float32Array(BLOCK);
  const blockRight = new Float32Array(BLOCK);
  for (let start = 0; start < frames; start += BLOCK) {
    core.observe(speedKmh, BLOCK / SAMPLE_RATE);
    const count = Math.min(BLOCK, frames - start);
    core.process(blockLeft, blockRight, count);
    left.set(blockLeft.subarray(0, count), start);
    right.set(blockRight.subarray(0, count), start);
  }
  return { left, right };
}

/** Runs a signal through the brake at a settled depth and returns both RMS. */
function throughBrake(signal, amount) {
  const brake = new BrakeFilter(SAMPLE_RATE);
  brake.set(amount);
  // Let the smoothing settle, so this measures the effect and not its attack.
  for (let index = 0; index < 400; index += 1) brake.refresh();

  let dry = 0;
  let wet = 0;
  for (let start = 0; start < signal.length; start += BLOCK) {
    const engaged = brake.refresh();
    const gain = brake.gain();
    const count = Math.min(BLOCK, signal.length - start);
    for (let frame = 0; frame < count; frame += 1) {
      const sample = signal[start + frame];
      const out = (engaged ? brake.tick(0, sample) : sample) * gain;
      dry += sample * sample;
      wet += out * out;
    }
  }
  return {
    dry: Math.sqrt(dry / signal.length),
    wet: Math.sqrt(wet / signal.length),
  };
}

const decibels = (ratio) => 20 * Math.log10(ratio);

test("the underwater effect changes character without emptying the level", () => {
  // Reported as "it practically zeroes the volume". It is meant to be an
  // effect, not an attenuator: at most a tenth or so of the level may go.
  const { left } = renderScore(110, 6);
  const { dry, wet } = throughBrake(left.subarray(SAMPLE_RATE), 1);

  const lossDb = decibels(wet / dry);
  assert.ok(
    lossDb > -3.2,
    `the brake removed ${(-lossDb).toFixed(1)} dB, which reads as the volume being cut`,
  );
  assert.ok(
    lossDb < 1,
    `the brake added ${lossDb.toFixed(1)} dB; it must not get louder either`,
  );
});

test("the effect still audibly darkens the mix", () => {
  // The level surviving is only correct if the tone genuinely collapses.
  // Measured as the share of energy left above 2 kHz.
  const { left } = renderScore(110, 6);
  const signal = left.subarray(SAMPLE_RATE);

  const highEnergy = (samples) => {
    // One-pole high pass at 2 kHz is enough to compare the two.
    const coefficient = Math.exp(-2 * Math.PI * 2000 / SAMPLE_RATE);
    let previousInput = 0;
    let previousOutput = 0;
    let power = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const x = samples[index];
      const y = coefficient * (previousOutput + x - previousInput);
      previousInput = x;
      previousOutput = y;
      power += y * y;
    }
    return Math.sqrt(power / samples.length);
  };

  const brake = new BrakeFilter(SAMPLE_RATE);
  brake.set(1);
  for (let index = 0; index < 400; index += 1) brake.refresh();
  const wet = new Float32Array(signal.length);
  for (let start = 0; start < signal.length; start += BLOCK) {
    brake.refresh();
    const gain = brake.gain();
    const count = Math.min(BLOCK, signal.length - start);
    for (let frame = 0; frame < count; frame += 1) {
      wet[start + frame] = brake.tick(0, signal[start + frame]) * gain;
    }
  }

  const before = highEnergy(signal);
  const after = highEnergy(wet);
  assert.ok(
    decibels(after / before) < -9,
    `the top end only dropped ${(-decibels(after / before)).toFixed(1)} dB; that is a tone control, not going under`,
  );
});

test("it releases completely and leaves the signal untouched", () => {
  const brake = new BrakeFilter(SAMPLE_RATE);
  brake.set(0);
  assert.equal(brake.refresh(), false, "a released brake must bypass entirely");
  assert.equal(brake.gain(), 1);
});

test("engaging is quicker than surfacing", () => {
  const engaging = new BrakeFilter(SAMPLE_RATE);
  engaging.set(1);
  for (let index = 0; index < 10; index += 1) engaging.refresh();
  const engaged = engaging.smoothed;

  const surfacing = new BrakeFilter(SAMPLE_RATE);
  surfacing.set(1);
  for (let index = 0; index < 400; index += 1) surfacing.refresh();
  surfacing.set(0);
  for (let index = 0; index < 10; index += 1) surfacing.refresh();
  const surfaced = 1 - surfacing.smoothed;

  assert.ok(engaged > surfaced, "the brake must bite faster than it lets go");
});
