import assert from "node:assert/strict";
import test from "node:test";
import {
  applyKeyboardDelta,
  normalizeGpsSpeed,
  smoothSpeed,
  speedToBpm,
  speedToEnergy,
  speedToWave,
} from "../src/signal-model.js";

test("normalizes GPS speed without accepting null, negative or non-finite data", () => {
  assert.equal(normalizeGpsSpeed(null), null);
  assert.equal(normalizeGpsSpeed(-1), null);
  assert.equal(normalizeGpsSpeed(Number.NaN), null);
  assert.equal(normalizeGpsSpeed(10), 36);
  assert.equal(normalizeGpsSpeed(100), 260);
});

test("deadband removes jitter and smoothing limits abrupt changes", () => {
  assert.equal(smoothSpeed(50, 50.8), 50);
  assert.equal(smoothSpeed(0, 100), 24);
});

test("tempo has a knee and approaches a musical ceiling", () => {
  assert.equal(speedToBpm(0), 58);
  assert.ok(speedToBpm(70) < 100);
  assert.ok(speedToBpm(260) < 116);
  assert.ok(speedToBpm(260) > speedToBpm(130));
});

test("energy saturates and keyboard simulation stays bounded", () => {
  assert.equal(speedToEnergy(0), 0);
  assert.ok(speedToEnergy(130) < 1);
  assert.equal(applyKeyboardDelta(258, "up"), 260);
  assert.equal(applyKeyboardDelta(2, "down"), 0);
});

test("the continuous energy wave rises smoothly but stays bounded", () => {
  const idle = speedToWave(0);
  const city = speedToWave(50);
  const motorway = speedToWave(130);
  const extreme = speedToWave(260);

  assert.deepEqual(idle, { frequencyHz: 42, gain: 0.024 });
  assert.ok(city.frequencyHz > idle.frequencyHz);
  assert.ok(motorway.frequencyHz > city.frequencyHz);
  assert.ok(extreme.frequencyHz < 128);
  assert.ok(extreme.gain > motorway.gain);
  assert.ok(extreme.gain < 0.132);
});
