import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceAccelerationArmSamples,
  advanceAccelerationMacroAmount,
  accelerationMacroAmount,
  accelerationMacroParameters,
  accelerationMacroTargetAmount,
  createAccelerationFocusCurve,
  softLimitAccelerationFocusSample,
} from "../src/acceleration-macro.js";

test("OPEN requires two consecutive eligible hard-acceleration samples", () => {
  assert.equal(advanceAccelerationArmSamples(0, 3.2), 1);
  assert.equal(advanceAccelerationArmSamples(1, 2.9), 0);
  assert.equal(advanceAccelerationArmSamples(0, 3.2, false), 0);
  assert.equal(advanceAccelerationArmSamples(1, 3.2), 2);
});

test("the acceleration macro stays off below a hard launch and saturates safely", () => {
  assert.equal(accelerationMacroAmount(1.5), 0);
  assert.equal(accelerationMacroAmount(2.75), 0.5);
  assert.equal(accelerationMacroAmount(4), 1);
  assert.equal(accelerationMacroAmount(12), 1);
});

test("OPEN reaches its target in 350 ms and releases in one second", () => {
  assert.equal(advanceAccelerationMacroAmount(0, 1, 0.175), 0.5);
  assert.equal(advanceAccelerationMacroAmount(0.5, 1, 0.175), 1);
  assert.equal(advanceAccelerationMacroAmount(1, 0, 0.5), 0.5);
  assert.equal(advanceAccelerationMacroAmount(0.5, 0, 0.5), 0);
});

test("OPEN trades mid energy for air and width instead of adding raw level", () => {
  const idle = accelerationMacroParameters(0);
  const full = accelerationMacroParameters(1);
  assert.deepEqual(idle, {
    midScoopDb: -0,
    airShelfDb: 0,
    airShelfFrequencyHz: 6000,
    width: 1,
    trimGain: 1,
    focusFrequencyHz: 480,
    focusQ: 0.9,
    focusGain: 0,
  });
  assert.equal(full.midScoopDb, -2.5);
  assert.equal(full.airShelfDb, 3);
  assert.ok(full.width > 1.05 && full.width < 1.06);
  assert.ok(full.trimGain > 0.89 && full.trimGain < 0.9);
  assert.equal(full.focusFrequencyHz, 3200);
  assert.equal(full.focusGain, 1.2);
});

test("OPEN bounds the added focus band without flattening quiet score detail", () => {
  const curve = createAccelerationFocusCurve();
  assert.equal(curve.length, 2049);
  assert.ok(Math.abs(curve[0]) <= 0.126);
  assert.equal(curve[1024], 0);
  assert.ok(Math.abs(curve[2048]) <= 0.126);
  assert.ok(Math.abs(softLimitAccelerationFocusSample(0.001) - 0.001) < 0.000001);
  assert.ok(softLimitAccelerationFocusSample(1) < 0.126);
  assert.ok(softLimitAccelerationFocusSample(-1) > -0.126);
});

test("every confirmed OPEN gesture crosses the unmistakable sweep floor", () => {
  assert.equal(accelerationMacroTargetAmount({ active: false, intensity: 1, averageMps2: 8 }), 0);
  assert.equal(accelerationMacroTargetAmount({ active: true, intensity: 0.35, averageMps2: 1.5 }), 0.62);
  assert.ok(accelerationMacroTargetAmount({ active: true, intensity: 0.35, averageMps2: 3.8 }) >= 0.9);
  assert.equal(accelerationMacroTargetAmount({ active: true, intensity: 0.8, averageMps2: 2.75 }), 0.8);
  assert.equal(accelerationMacroTargetAmount({ active: true, intensity: 0.7, averageMps2: 12 }), 1);
});
