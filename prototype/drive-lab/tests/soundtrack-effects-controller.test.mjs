import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  normalizeSoundtrackManualEffects,
  soundtrackEffectParameters,
} from "../src/soundtrack/effects-model.js";
import { manualEffectParameters } from "../src/manual-effects-graph.js";
import { UNDERWATER_BADGE_AMOUNT } from "../src/underwater-model.js";

function lowPassMagnitude(frequencyHz, cutoffHz, q, sampleRate = 48_000) {
  const omega = 2 * Math.PI * cutoffHz / sampleRate;
  const alpha = Math.sin(omega) / (2 * q);
  const cosine = Math.cos(omega);
  const a0 = 1 + alpha;
  const coefficients = {
    b0: ((1 - cosine) / 2) / a0,
    b1: (1 - cosine) / a0,
    b2: ((1 - cosine) / 2) / a0,
    a1: (-2 * cosine) / a0,
    a2: (1 - alpha) / a0,
  };
  const angle = 2 * Math.PI * frequencyHz / sampleRate;
  const z1 = { real: Math.cos(angle), imaginary: -Math.sin(angle) };
  const z2 = { real: Math.cos(angle * 2), imaginary: -Math.sin(angle * 2) };
  const numerator = {
    real: coefficients.b0 + coefficients.b1 * z1.real + coefficients.b2 * z2.real,
    imaginary: coefficients.b1 * z1.imaginary + coefficients.b2 * z2.imaginary,
  };
  const denominator = {
    real: 1 + coefficients.a1 * z1.real + coefficients.a2 * z2.real,
    imaginary: coefficients.a1 * z1.imaginary + coefficients.a2 * z2.imaginary,
  };
  return Math.hypot(numerator.real, numerator.imaginary)
    / Math.hypot(denominator.real, denominator.imaginary);
}

test("vehicle effects remain silent until the fresh-session master is enabled", () => {
  const off = soundtrackEffectParameters({
    vehicleMaster: false,
    vehicleMacros: { open: 1, underwater: 1, bloom: 1 },
  });
  const on = soundtrackEffectParameters({
    vehicleMaster: true,
    vehicleMacros: { open: 1, underwater: 1, bloom: 1 },
  });
  assert.equal(off.openAirDb, 0);
  assert.equal(off.underwaterCutoffHz, 18_000);
  assert.equal(off.bloom, 0);
  assert.equal(on.openAirDb, 6.5);
  assert.equal(on.underwaterCutoffHz, 460);
  assert.equal(on.bloom, 1);
});

test("UNDERWATER is already audible at the visual engage threshold", () => {
  const threshold = soundtrackEffectParameters({
    vehicleMaster: true,
    vehicleMacros: { underwater: UNDERWATER_BADGE_AMOUNT },
  });
  const full = soundtrackEffectParameters({
    vehicleMaster: true,
    vehicleMacros: { underwater: 1 },
  });

  assert.ok(threshold.underwaterCutoffHz < 1_600, threshold.underwaterCutoffHz);
  assert.ok(threshold.underwaterPressureGainDb > 2.5);
  assert.ok(threshold.underwaterMakeupGain > 1.1);
  const highBandRatio = lowPassMagnitude(
    4_000,
    threshold.underwaterCutoffHz,
    threshold.underwaterResonance,
  ) * lowPassMagnitude(
    4_000,
    threshold.underwaterSecondCutoffHz,
    threshold.underwaterSecondResonance,
  );
  assert.ok(20 * Math.log10(highBandRatio) < -24, "the badge threshold did not collapse the real two-stage high band");
  assert.ok(threshold.underwaterCutoffHz > full.underwaterCutoffHz);
  assert.equal(full.underwaterCutoffHz, 460);
});

test("NIGHTSHIFT uses the same two-stage perceptual brake instead of a linear treble trim", () => {
  const source = readFileSync(new URL("../src/nightshift-player.js", import.meta.url), "utf8");
  assert.match(source, /underwaterEffectParameters\(brake\)/);
  assert.match(source, /toneOne\.frequency\.setTargetAtTime\(parameters\.cutoffHz/);
  assert.match(source, /toneTwo\.frequency\.setTargetAtTime\(parameters\.secondCutoffHz/);
  assert.match(source, /pressure\.gain\.setTargetAtTime\(parameters\.pressureGainDb/);
  assert.doesNotMatch(source, /18000 - brake \* 12500/);
});

test("manual controls are clamped and never expose a playback-rate control", () => {
  assert.deepEqual(normalizeSoundtrackManualEffects({
    flanger: 2,
    reverb: -1,
    chorus: 0.4,
    echo: Number.NaN,
  }), { flanger: 1, reverb: 0, chorus: 0.4, echo: 0 });
  assert.equal("playbackRate" in soundtrackEffectParameters(), false);
});

test("every manual effect has a plainly wet full-depth endpoint", () => {
  const parameters = manualEffectParameters({
    flanger: 1,
    reverb: 1,
    chorus: 1,
    echo: 1,
  });
  assert.ok(parameters.flangerWet >= 0.6);
  assert.ok(parameters.flangerFeedback >= 0.35);
  assert.ok(parameters.reverbWet >= 0.6);
  assert.ok(parameters.chorusWet >= 0.55);
  assert.ok(parameters.echoWet >= 0.5);
  assert.ok(parameters.echoFeedback >= 0.4);
});
