import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceAccelerationArmSamples,
  advanceAccelerationMacroAmount,
  accelerationMacroAmount,
  accelerationMacroParameters,
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
  assert.deepEqual(idle, { midScoopDb: -0, airShelfDb: 0, width: 1, trimGain: 1 });
  assert.equal(full.midScoopDb, -3.5);
  assert.equal(full.airShelfDb, 2.8);
  assert.ok(full.width > 1.67 && full.width < 1.69);
  assert.ok(full.trimGain > 0.97 && full.trimGain < 0.98);
});
