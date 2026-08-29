import assert from "node:assert/strict";
import test from "node:test";

import {
  BLOOM_RELEASE_SECONDS,
  BLOOM_SWEEP_SECONDS,
  BloomEffect,
} from "../src/score/dsp/bloom-effect.js";

const SAMPLE_RATE = 48000;

function rms(values) {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

function renderSine(frequency, seconds, effect) {
  const frames = Math.round(seconds * SAMPLE_RATE);
  const input = new Float64Array(frames);
  const output = new Float64Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    input[frame] = Math.sin(Math.PI * 2 * frequency * frame / SAMPLE_RATE) * 0.5;
    output[frame] = effect.tick(input[frame], input[frame])[0];
  }
  return { input, output };
}

function positiveCrossingFrequency(values, startSeconds, endSeconds) {
  const crossings = [];
  const start = Math.round(startSeconds * SAMPLE_RATE);
  const end = Math.min(values.length, Math.round(endSeconds * SAMPLE_RATE));
  for (let frame = start + 1; frame < end; frame += 1) {
    if (values[frame - 1] > 0 || values[frame] <= 0) continue;
    const fraction = -values[frame - 1] / (values[frame] - values[frame - 1]);
    crossings.push((frame - 1 + fraction) / SAMPLE_RATE);
  }
  const periods = crossings.slice(1).map((crossing, index) => crossing - crossings[index]);
  return 1 / (periods.reduce((sum, period) => sum + period, 0) / periods.length);
}

test("BLOOM bends the delayed path about 1.8 percent upward", () => {
  const effect = new BloomEffect(SAMPLE_RATE, { depth: 1 });
  effect.trigger();
  const { output } = renderSine(1000, BLOOM_SWEEP_SECONDS, effect);
  const frequency = positiveCrossingFrequency(output, 0.1, 0.3);
  assert.ok(Math.abs(frequency - 1018) <= 2, `wet frequency is ${frequency.toFixed(3)} Hz`);
});

test("BLOOM leaves the sub fundamental within 0.3 dB", () => {
  const effect = new BloomEffect(SAMPLE_RATE);
  effect.trigger();
  const { input, output } = renderSine(60, 0.38, effect);
  const start = Math.round(0.1 * SAMPLE_RATE);
  const deltaDb = 20 * Math.log10(rms(output.slice(start)) / rms(input.slice(start)));
  assert.ok(Math.abs(deltaDb) <= 0.3, `sub changed by ${deltaDb.toFixed(3)} dB`);
});

test("BLOOM is transparent after its release and delay have drained", () => {
  const effect = new BloomEffect(SAMPLE_RATE);
  effect.trigger();
  const totalSeconds = BLOOM_SWEEP_SECONDS + BLOOM_RELEASE_SECONDS + 0.5;
  const { input, output } = renderSine(1000, totalSeconds, effect);
  const start = Math.round((BLOOM_SWEEP_SECONDS + BLOOM_RELEASE_SECONDS + 0.1) * SAMPLE_RATE);
  let residualPeak = 0;
  for (let frame = start; frame < output.length; frame += 1) {
    residualPeak = Math.max(residualPeak, Math.abs(output[frame] - input[frame]));
  }
  assert.ok(residualPeak < 0.001, `released residual is ${residualPeak}`);
  assert.equal(effect.active, false);
});

test("BLOOM stays below a 0.6 dB peak lift on an in-band sine", () => {
  const effect = new BloomEffect(SAMPLE_RATE);
  effect.trigger();
  const { output } = renderSine(1000, 0.65, effect);
  const peak = output.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
  const gainDb = 20 * Math.log10(peak / 0.5);
  assert.ok(gainDb < 0.6, `peak grew by ${gainDb.toFixed(3)} dB`);
});
