import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceDemoMotion,
  applyKeyboardDelta,
  energyToFlowRate,
  energyToSection,
  normalizeGpsSpeed,
  ROAD_SPEED_CEILING_KMH,
  smoothSpeed,
  speedToBpm,
  speedToEnergy,
  speedToMotion,
  speedToVisualVelocity,
  speedToWave,
  visualVelocityToMorphWarp,
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

test("energy uses the fixed legal-road ceiling and keyboard simulation stays bounded", () => {
  assert.equal(speedToEnergy(0), 0);
  assert.ok(speedToEnergy(40) > 0.5);
  assert.equal(speedToEnergy(ROAD_SPEED_CEILING_KMH), 1);
  assert.equal(speedToEnergy(260), 1);
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
  assert.equal(energyToFlowRate(0, 0), 0.02);
  assert.ok(energyToFlowRate(0.25, 20) < 0.3);
  assert.ok(energyToFlowRate(0.75, 80) > 2);
  assert.ok(energyToFlowRate(1, ROAD_SPEED_CEILING_KMH) > 14);
  assert.ok(energyToFlowRate(1, ROAD_SPEED_CEILING_KMH) > energyToFlowRate(1, 100));
  assert.equal(energyToFlowRate(1, 150), energyToFlowRate(1, ROAD_SPEED_CEILING_KMH));
  assert.equal(speedToVisualVelocity(0), 0);
  assert.equal(speedToVisualVelocity(ROAD_SPEED_CEILING_KMH), 1);
  assert.equal(speedToVisualVelocity(160), 1);
});

test("visual morph reveals the tunnel at urban speed and reaches full deformation at the road ceiling", () => {
  const idle = visualVelocityToMorphWarp(speedToVisualVelocity(0));
  const lowSpeed = visualVelocityToMorphWarp(speedToVisualVelocity(20));
  const city = visualVelocityToMorphWarp(speedToVisualVelocity(40));
  const transition = visualVelocityToMorphWarp(speedToVisualVelocity(80));
  const tunnel = visualVelocityToMorphWarp(speedToVisualVelocity(ROAD_SPEED_CEILING_KMH));

  assert.equal(idle, 0);
  assert.ok(lowSpeed > 0 && lowSpeed < 0.08);
  assert.ok(city > 0.15 && city < 0.3);
  assert.ok(transition > 0.6 && transition < 0.8);
  assert.equal(tunnel, 1);
});

test("visual morph advances monotonically without a low-speed geometry jump", () => {
  const samples = Array.from({ length: 33 }, (_, index) => (
    visualVelocityToMorphWarp(speedToVisualVelocity(index * 5))
  ));

  assert.equal(samples[0], 0);
  assert.equal(samples.at(-1), 1);
  samples.slice(1).forEach((sample, index) => {
    assert.ok(sample >= samples[index]);
    assert.ok(sample - samples[index] < 0.16);
  });
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
    advanceDemoMotion({ speed: 129, direction: 1, holdTicks: 0 }),
    { speed: ROAD_SPEED_CEILING_KMH, direction: -1, holdTicks: 6 },
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
