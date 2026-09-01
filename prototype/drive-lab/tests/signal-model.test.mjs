import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceDemoMotion,
  energyToFlowRate,
  energyToSection,
  gpsSpeedTolerance,
  MODEL_3_AWD_REFERENCE,
  model3AwdAccelerationMps2,
  model3AwdBrakeDecelerationMps2,
  model3AwdLiftOffDecelerationMps2,
  normalizeGpsSpeed,
  ROAD_SPEED_CEILING_KMH,
  smoothGpsSpeed,
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

test("calibrates the Highland AWD acceleration curve to the official zero-to-hundred time", () => {
  let speedKmh = 0;
  let elapsedSeconds = 0;
  const stepSeconds = 0.001;
  while (speedKmh < 100 && elapsedSeconds < 10) {
    speedKmh += model3AwdAccelerationMps2(speedKmh) * stepSeconds * 3.6;
    elapsedSeconds += stepSeconds;
  }

  assert.equal(MODEL_3_AWD_REFERENCE.curbMassKg, 1824);
  assert.equal(MODEL_3_AWD_REFERENCE.zeroToHundredSeconds, 4.4);
  assert.ok(Math.abs(elapsedSeconds - MODEL_3_AWD_REFERENCE.zeroToHundredSeconds) < 0.03);
  assert.ok(model3AwdAccelerationMps2(0) > model3AwdAccelerationMps2(100));
});

test("ramps a held moderate brake and settles the reference car without reversing", () => {
  assert.equal(model3AwdBrakeDecelerationMps2(100, 0), 0);
  assert.ok(model3AwdBrakeDecelerationMps2(100, 0.16) > 0);
  assert.ok(model3AwdBrakeDecelerationMps2(100, 1) > 3);

  let motion = {
    speed: 100,
    direction: -1,
    holdSeconds: 0,
    brakeHeldSeconds: 0,
  };
  let elapsedSeconds = 0;
  while (motion.speed > 0 && elapsedSeconds < 20) {
    motion = advanceDemoMotion(motion, 0.02, true);
    elapsedSeconds += 0.02;
  }

  assert.equal(motion.speed, 0);
  assert.equal(motion.direction, -1);
  assert.ok(elapsedSeconds > 8 && elapsedSeconds < 11);
});

test("braking starts from the exact simulated speed and release holds it", () => {
  const initialSpeed = 73.4;
  const braking = advanceDemoMotion({
    speed: initialSpeed,
    direction: -1,
    holdSeconds: 0,
    brakeHeldSeconds: 0,
  }, 0.1, true);
  assert.ok(braking.speed < initialSpeed);
  assert.ok(braking.speed > 70);

  const released = advanceDemoMotion({
    ...braking,
    direction: 1,
    holdSeconds: 0.55,
    brakeHeldSeconds: 0,
  }, 0.1, false);
  assert.equal(released.speed, braking.speed);
  assert.ok(Math.abs(released.holdSeconds - 0.45) < 0.0001);

  // Releasing the brake never resumes motion on its own: with no driver input
  // the simulator holds the speed it was left at, however long it is left.
  let resumed = { ...released, holdSeconds: 0 };
  for (let step = 0; step < 50; step += 1) {
    resumed = advanceDemoMotion(resumed, 0.1, false);
  }
  assert.equal(resumed.speed, released.speed);
});

test("accelerator release ramps regenerative deceleration without dropping speed", () => {
  assert.equal(model3AwdLiftOffDecelerationMps2(100, 0), 0.1);
  assert.ok(model3AwdLiftOffDecelerationMps2(100, 0.2) > 0.7);
  assert.ok(model3AwdLiftOffDecelerationMps2(100, 1) > 1.7);
  assert.ok(
    model3AwdLiftOffDecelerationMps2(100, 1)
      < model3AwdBrakeDecelerationMps2(100, 1),
  );

  const releasedFromKmh = 73.4;
  const firstReleaseStep = advanceDemoMotion({
    speed: releasedFromKmh,
    direction: 1,
    holdSeconds: 0,
    brakeHeldSeconds: 0,
    liftOffSeconds: 0,
  }, 0.05, false, "regen");
  assert.ok(firstReleaseStep.speed < releasedFromKmh);
  assert.ok(firstReleaseStep.speed > releasedFromKmh - 0.2);

  let motion = {
    speed: 100,
    direction: -1,
    holdSeconds: 0,
    brakeHeldSeconds: 0,
    liftOffSeconds: 0,
  };
  let elapsedSeconds = 0;
  while (motion.speed > 0 && elapsedSeconds < 30) {
    motion = advanceDemoMotion(motion, 0.02, false, "regen");
    elapsedSeconds += 0.02;
  }

  assert.equal(motion.speed, 0);
  assert.equal(motion.direction, -1);
  assert.ok(elapsedSeconds > 15 && elapsedSeconds < 22);
});

test("held accelerator and lift-off remain continuous at the input boundary", () => {
  let motion = {
    speed: 0,
    direction: 1,
    holdSeconds: 0,
    brakeHeldSeconds: 0,
    liftOffSeconds: 0,
  };
  for (let index = 0; index < 40; index += 1) {
    motion = advanceDemoMotion(motion, 0.05, false, "accelerator");
  }
  const releasedFromKmh = motion.speed;
  assert.ok(releasedFromKmh > 45);

  motion = advanceDemoMotion(motion, 0.05, false, "regen");
  assert.ok(motion.speed < releasedFromKmh);
  assert.ok(motion.speed > releasedFromKmh - 0.2);
});

test("uses vehicle dynamics as a soft GPS tolerance without inventing motion", () => {
  const tolerance = gpsSpeedTolerance(100, 1);
  assert.ok(tolerance.riseKmh > 15 && tolerance.riseKmh < 22);
  assert.ok(tolerance.liftOffFallKmh > tolerance.sensorAllowanceKmh);
  assert.ok(tolerance.fallKmh > tolerance.liftOffFallKmh);
  assert.ok(tolerance.fallKmh > tolerance.riseKmh);
  assert.equal(smoothGpsSpeed(100, 101, 1), 100);
  assert.ok(smoothGpsSpeed(100, 80, 1) < 100);
  assert.ok(smoothGpsSpeed(100, 200, 0.2) < 105);
});

test("tempo has a knee and approaches a musical ceiling", () => {
  assert.equal(speedToBpm(0), 58);
  assert.ok(speedToBpm(70) < 100);
  assert.ok(speedToBpm(130) < 116);
  assert.equal(speedToBpm(260), speedToBpm(130));
});

test("energy uses the fixed legal-road ceiling", () => {
  assert.equal(speedToEnergy(0), 0);
  assert.ok(speedToEnergy(40) > 0.5);
  assert.equal(speedToEnergy(ROAD_SPEED_CEILING_KMH), 1);
  assert.equal(speedToEnergy(260), 1);
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
  assert.ok(energyToFlowRate(0.25, 20) < 0.9);
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

test("the demo manual mode stays at ceiling and stays at standstill without auto looping", () => {
  // No driver input means no motion. The demo holds whatever speed it is given,
  // both mid-range and at the ceiling, instead of driving itself.
  const cruising = advanceDemoMotion({ speed: 129, direction: 1 }, 0.18);
  assert.equal(cruising.speed, 129);
  assert.equal(cruising.direction, 0);
  assert.equal(cruising.holdSeconds, 0);

  const ceiling = advanceDemoMotion(
    { speed: 129, direction: 1 }, 0.18, false, "accelerator",
  );
  assert.equal(ceiling.speed, ROAD_SPEED_CEILING_KMH);
  assert.equal(ceiling.direction, 1);

  const holding = advanceDemoMotion(ceiling, 0.18);
  assert.equal(holding.speed, ROAD_SPEED_CEILING_KMH);
  assert.equal(holding.holdSeconds, 0);

  const standstill = advanceDemoMotion({
    speed: 0.1,
    direction: -1,
    holdSeconds: 0,
    brakeHeldSeconds: 1,
  }, 0.18);
  assert.equal(standstill.speed, 0);
  assert.equal(standstill.direction, 0);
  assert.equal(standstill.holdSeconds, 0);
});
