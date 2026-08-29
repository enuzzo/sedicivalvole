import assert from "node:assert/strict";
import test from "node:test";

import {
  accelerationMacroParameters,
  softLimitAccelerationFocusSample,
} from "../src/acceleration-macro.js";

const SAMPLE_RATE = 48000;

function rbjCoefficients(type, frequency, q, gainDb) {
  const amplitude = 10 ** (gainDb / 40);
  const omega = 2 * Math.PI * frequency / SAMPLE_RATE;
  const cosine = Math.cos(omega);
  const sine = Math.sin(omega);
  const alpha = sine / (2 * q);
  let b0;
  let b1;
  let b2;
  let a0;
  let a1;
  let a2;
  if (type === "peaking") {
    b0 = 1 + alpha * amplitude;
    b1 = -2 * cosine;
    b2 = 1 - alpha * amplitude;
    a0 = 1 + alpha / amplitude;
    a1 = -2 * cosine;
    a2 = 1 - alpha / amplitude;
  } else if (type === "highshelf") {
    const beta = 2 * Math.sqrt(amplitude) * alpha;
    b0 = amplitude * ((amplitude + 1) + (amplitude - 1) * cosine + beta);
    b1 = -2 * amplitude * ((amplitude - 1) + (amplitude + 1) * cosine);
    b2 = amplitude * ((amplitude + 1) + (amplitude - 1) * cosine - beta);
    a0 = (amplitude + 1) - (amplitude - 1) * cosine + beta;
    a1 = 2 * ((amplitude - 1) - (amplitude + 1) * cosine);
    a2 = (amplitude + 1) - (amplitude - 1) * cosine - beta;
  } else {
    b0 = alpha;
    b1 = 0;
    b2 = -alpha;
    a0 = 1 + alpha;
    a1 = -2 * cosine;
    a2 = 1 - alpha;
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}

function filter(input, coefficients) {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return input.map((sample) => {
    const output = coefficients[0] * sample
      + coefficients[1] * x1
      + coefficients[2] * x2
      - coefficients[3] * y1
      - coefficients[4] * y2;
    x2 = x1;
    x1 = sample;
    y2 = y1;
    y1 = output;
    return output;
  });
}

function fixture(seconds = 3) {
  const frames = seconds * SAMPLE_RATE;
  const left = new Float64Array(frames);
  const right = new Float64Array(frames);
  let peak = 0;
  for (let frame = 0; frame < frames; frame += 1) {
    const time = frame / SAMPLE_RATE;
    left[frame] = 0.15 * Math.sin(2 * Math.PI * 60 * time)
      + 0.2 * Math.sin(2 * Math.PI * 320 * time)
      + 0.18 * Math.sin(2 * Math.PI * 1000 * time)
      + 0.08 * Math.sin(2 * Math.PI * 10000 * time)
      + 0.06 * Math.sin(2 * Math.PI * 423 * time);
    right[frame] = 0.15 * Math.sin(2 * Math.PI * 60 * time)
      + 0.2 * Math.sin(2 * Math.PI * 320 * time + 0.15)
      + 0.18 * Math.sin(2 * Math.PI * 1000 * time + 0.4)
      + 0.08 * Math.sin(2 * Math.PI * 10000 * time + 1.1)
      + 0.06 * Math.sin(2 * Math.PI * 477 * time);
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
  }
  const scale = 0.82 / peak;
  for (let frame = 0; frame < frames; frame += 1) {
    left[frame] *= scale;
    right[frame] *= scale;
  }
  return { left, right };
}

test("OPEN is clearly different, level-stable, and clip-safe on a mastered stereo fixture", () => {
  const input = fixture();
  const parameters = accelerationMacroParameters(1);
  const scoop = rbjCoefficients("peaking", 320, 0.8, parameters.midScoopDb);
  const air = rbjCoefficients(
    "highshelf",
    parameters.airShelfFrequencyHz,
    1,
    parameters.airShelfDb,
  );
  const left = filter(filter(input.left, scoop), air);
  const right = filter(filter(input.right, scoop), air);
  const focus = rbjCoefficients(
    "bandpass",
    parameters.focusFrequencyHz,
    parameters.focusQ,
    0,
  );
  const focusLeft = filter(left, focus).map((sample) => softLimitAccelerationFocusSample(sample));
  const focusRight = filter(right, focus).map((sample) => softLimitAccelerationFocusSample(sample));
  const direct = (1 + parameters.width) * 0.5;
  const cross = (1 - parameters.width) * 0.5;

  let inputEnergy = 0;
  let outputEnergy = 0;
  let differenceEnergy = 0;
  let monoDifferenceEnergy = 0;
  let outputPeak = 0;
  for (let frame = 0; frame < left.length; frame += 1) {
    const outputLeft = (
      left[frame] * direct + right[frame] * cross + focusLeft[frame] * parameters.focusGain
    ) * parameters.trimGain;
    const outputRight = (
      right[frame] * direct + left[frame] * cross + focusRight[frame] * parameters.focusGain
    ) * parameters.trimGain;
    const inputMono = (input.left[frame] + input.right[frame]) * 0.5;
    const outputMono = (outputLeft + outputRight) * 0.5;
    inputEnergy += input.left[frame] ** 2 + input.right[frame] ** 2;
    outputEnergy += outputLeft ** 2 + outputRight ** 2;
    differenceEnergy += (outputLeft - input.left[frame]) ** 2
      + (outputRight - input.right[frame]) ** 2;
    monoDifferenceEnergy += (outputMono - inputMono) ** 2;
    outputPeak = Math.max(outputPeak, Math.abs(outputLeft), Math.abs(outputRight));
  }

  const loudnessDeltaDb = 10 * Math.log10(outputEnergy / inputEnergy);
  const differenceRms = Math.sqrt(differenceEnergy / (left.length * 2));
  const monoDifferenceRms = Math.sqrt(monoDifferenceEnergy / left.length);
  assert.ok(outputPeak < 0.99, `OPEN fixture peaked at ${outputPeak}`);
  assert.ok(loudnessDeltaDb >= -1.2 && loudnessDeltaDb <= 0.5, `OPEN changed level by ${loudnessDeltaDb} dB`);
  assert.ok(differenceRms >= 0.09, `OPEN difference fell below its regression floor (${differenceRms})`);
  assert.ok(monoDifferenceRms >= 0.08, `OPEN collapsed to an ambiguous mono change (${monoDifferenceRms})`);
});

test("OPEN sweeps a music-derived focus band upward through the attack", () => {
  const idle = accelerationMacroParameters(0);
  const threshold = accelerationMacroParameters(0.62);
  const full = accelerationMacroParameters(1);
  assert.equal(idle.focusGain, 0);
  assert.ok(threshold.focusFrequencyHz > 1500 && threshold.focusFrequencyHz < 1600);
  assert.ok(full.focusFrequencyHz > threshold.focusFrequencyHz);
  assert.ok(full.focusGain > threshold.focusGain);
});
