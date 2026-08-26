import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceDemoMotion,
  applyKeyboardDelta,
  energyToFlowRate,
  energyToSection,
  normalizeGpsSpeed,
  smoothSpeed,
  speedToBpm,
  speedToEnergy,
  speedToMotion,
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

test("visual travel stays calm at rest and becomes emphatic only near full energy", () => {
  assert.equal(energyToFlowRate(0), 0.025);
  assert.ok(energyToFlowRate(0.25) < 0.2);
  assert.ok(energyToFlowRate(0.75) > 1.5);
  assert.equal(energyToFlowRate(1), 3.425);
});

test("motion separates acceleration from deceleration with bounded rates", () => {
  const accelerating = speedToMotion(40, 52, 0.5);
  const decelerating = speedToMotion(52, 40, 0.5);
  const steady = speedToMotion(40, 40.2, 0.5);

  assert.deepEqual(accelerating, { rateKmhPerSecond: 24, acceleration: 1, deceleration: 0 });
  assert.equal(decelerating.rateKmhPerSecond, -24);
  assert.equal(decelerating.acceleration, 0);
  assert.equal(decelerating.deceleration, 1);
  assert.equal(steady.acceleration > 0 && steady.acceleration < 0.02, true);
  assert.equal(steady.deceleration, 0);
  assert.equal(speedToMotion(0, 260, 0.08).rateKmhPerSecond, 60);
});

test("the demo holds at full speed and reaches a true standstill before restarting", () => {
  assert.deepEqual(
    advanceDemoMotion({ speed: 131, direction: 1, holdTicks: 0 }),
    { speed: 132, direction: -1, holdTicks: 6 },
  );
  assert.deepEqual(
    advanceDemoMotion({ speed: 1, direction: -1, holdTicks: 0 }),
    { speed: 0, direction: 1, holdTicks: 8 },
  );
  assert.deepEqual(
    advanceDemoMotion({ speed: 0, direction: 1, holdTicks: 8 }),
    { speed: 0, direction: 1, holdTicks: 7 },
  );
});
