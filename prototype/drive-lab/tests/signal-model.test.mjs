import assert from "node:assert/strict";
import test from "node:test";
import {
  applyKeyboardDelta,
  energyToSection,
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

test("energy reaches the selected full-energy speed and keyboard simulation stays bounded", () => {
  assert.equal(speedToEnergy(0), 0);
  assert.ok(speedToEnergy(60, 120) > 0.5);
  assert.equal(speedToEnergy(120, 120), 1);
  assert.ok(speedToEnergy(90, 180) < speedToEnergy(90, 120));
  assert.equal(applyKeyboardDelta(258, "up"), 260);
  assert.equal(applyKeyboardDelta(2, "down"), 0);
});

test("structural sections use hysteresis instead of following jitter", () => {
  assert.equal(energyToSection(0.2, 0), 1);
  assert.equal(energyToSection(0.13, 1), 1);
  assert.equal(energyToSection(0.09, 1), 0);
  assert.equal(energyToSection(0.7, 2), 3);
  assert.equal(energyToSection(0.6, 3), 3);
  assert.equal(energyToSection(0.55, 3), 2);
});

test("the continuous energy wave rises smoothly but stays bounded", () => {
  const idle = speedToWave(0);
  const city = speedToWave(50);
  const motorway = speedToWave(130);
  const extreme = speedToWave(260);

  assert.deepEqual(idle, { frequencyHz: 38, gain: 0.012 });
  assert.ok(city.frequencyHz > idle.frequencyHz);
  assert.ok(motorway.frequencyHz > city.frequencyHz);
  assert.ok(extreme.frequencyHz <= 114);
  assert.equal(extreme.gain, motorway.gain);
  assert.ok(extreme.gain <= 0.08);
});
