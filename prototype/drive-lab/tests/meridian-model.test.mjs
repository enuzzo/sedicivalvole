import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceMeridianVisualResponse,
  advanceTimeOffset,
  distortionAt,
  lookAtFromDistortion,
  MERIDIAN_FIELD_CONSTANTS,
  MERIDIAN_FOV_CEILING_DEGREES,
  MERIDIAN_FOV_REST_DEGREES,
  MERIDIAN_IDLE_RATE,
  MERIDIAN_PIN_PROGRESS,
  MERIDIAN_RESPONSE,
  meridianEffectProfile,
  meridianDistortionGlsl,
  speedToDistortionField,
  speedToLayerDensity,
  speedToPeripheralDeformation,
  speedToProjection,
  speedToTimeRate,
} from "../src/environments/meridian/meridian-model.js";
import { ROAD_SPEED_CEILING_KMH } from "../src/signal-model.js";

test("keeps the corridor alive at rest and reaches the reference rate at the road ceiling", () => {
  assert.equal(speedToTimeRate(0), MERIDIAN_IDLE_RATE);
  assert.ok(speedToTimeRate(0) > 0, "a standstill must not freeze the world");
  assert.ok(Math.abs(speedToTimeRate(ROAD_SPEED_CEILING_KMH) - 1) < 1e-12);
  assert.equal(speedToTimeRate(ROAD_SPEED_CEILING_KMH * 2), speedToTimeRate(ROAD_SPEED_CEILING_KMH));
  assert.equal(speedToTimeRate(-40), MERIDIAN_IDLE_RATE);
});

test("OPEN, UNDERWATER, and BLOOM remain distinct corridor-native gestures", () => {
  const idle = meridianEffectProfile(null);
  const open = meridianEffectProfile("OPEN");
  const underwater = meridianEffectProfile("UNDERWATER");
  const bloom = meridianEffectProfile("BLOOM");
  assert.equal(idle.rateScale, 1);
  assert.ok(open.fovDelta > 0 && open.railGlowScale > 1);
  assert.ok(underwater.rateScale <= 0.58 && underwater.fogScale >= 1.75);
  assert.ok(underwater.fovDelta <= -10 && underwater.railGlowScale <= 0.5);
  assert.ok(bloom.fovDelta > open.fovDelta);
  assert.ok(bloom.railGlowScale > open.railGlowScale);
});

test("makes the first metres of movement clearly legible", () => {
  const rest = speedToTimeRate(0);
  const ceiling = speedToTimeRate(ROAD_SPEED_CEILING_KMH);
  const atTwenty = speedToTimeRate(20);
  const linearAtTwenty = rest + (ceiling - rest) * (20 / ROAD_SPEED_CEILING_KMH);
  assert.ok(
    atTwenty > linearAtTwenty * 1.4,
    `expected an early-legible curve, got ${atTwenty} against linear ${linearAtTwenty}`,
  );
});

test("advances the corridor clock monotonically through any speed profile", () => {
  const profile = [0, 40, 80, 115, 60, 115, 0, 0, 130];
  let offset = 0;
  let previous = offset;
  for (const speed of profile) {
    for (let step = 0; step < 30; step += 1) {
      offset = advanceTimeOffset(offset, speedToTimeRate(speed), 1 / 60);
      assert.ok(offset >= previous, "the corridor clock must never rewind");
      previous = offset;
    }
  }
  assert.ok(offset > 0);
});

test("never restarts the clock on malformed timing input", () => {
  assert.equal(advanceTimeOffset(12.5, 1, Number.NaN), 12.5);
  assert.equal(advanceTimeOffset(12.5, Number.NaN, 1 / 60), 12.5);
  assert.equal(advanceTimeOffset(Number.NaN, 1, 1 / 60), 1 / 60);
  assert.equal(advanceTimeOffset(12.5, 1, -5), 12.5, "negative time must not rewind");
  assert.equal(advanceTimeOffset(0, 1, 900), 0.25, "a long stall is clamped, not replayed");
});

test("widens the projection with speed so acceleration is not only faster geometry", () => {
  assert.equal(speedToProjection(0).fovDegrees, MERIDIAN_FOV_REST_DEGREES);
  assert.ok(
    MERIDIAN_FOV_CEILING_DEGREES - MERIDIAN_FOV_REST_DEGREES >= 74,
    "the road-speed lens must retain a materially wide full-range span",
  );
  assert.ok(
    Math.abs(speedToProjection(ROAD_SPEED_CEILING_KMH).fovDegrees - MERIDIAN_FOV_CEILING_DEGREES)
      < 1e-12,
  );
  const restLift = speedToProjection(0).cameraLift;
  const ceilingLift = speedToProjection(ROAD_SPEED_CEILING_KMH).cameraLift;
  assert.ok(ceilingLift < restLift, "the viewpoint settles toward the corridor with speed");

  let previousFov = -Infinity;
  let previousLift = Infinity;
  let previousDepthCompression = Infinity;
  for (let speed = 0; speed <= ROAD_SPEED_CEILING_KMH; speed += 5) {
    const { fovDegrees, cameraLift, depthCompression } = speedToProjection(speed);
    assert.ok(fovDegrees > previousFov, "projection must open monotonically");
    assert.ok(cameraLift <= previousLift, "the viewpoint must settle monotonically");
    assert.ok(depthCompression <= previousDepthCompression, "depth compression must grow monotonically");
    assert.ok(depthCompression >= 0.68 && depthCompression <= 1);
    assert.ok(cameraLift > 0, "the viewpoint never drops through the corridor floor");
    previousFov = fovDegrees;
    previousLift = cameraLift;
    previousDepthCompression = depthCompression;
  }

  const stages = [0, 26, 52, 78, 104, ROAD_SPEED_CEILING_KMH]
    .map((speed) => speedToProjection(speed).fovDegrees);
  for (let index = 1; index < stages.length; index += 1) {
    assert.ok(
      stages[index] - stages[index - 1] >= 10,
      `every 26 km/h band must add a clearly visible FOV step: ${stages.join(", ")}`,
    );
  }
});

test("smooths acceleration and braking continuously instead of following GPS steps", () => {
  let response = advanceMeridianVisualResponse(null, 0, null, 1 / 60);
  response = advanceMeridianVisualResponse(response, 130, null, 1 / 60);
  assert.ok(response.speedKmh > 0 && response.speedKmh < 130);

  let previousSpeed = response.speedKmh;
  for (let frame = 0; frame < 180; frame += 1) {
    response = advanceMeridianVisualResponse(response, 130, null, 1 / 60);
    assert.ok(response.speedKmh >= previousSpeed, "acceleration response must be monotonic");
    previousSpeed = response.speedKmh;
  }
  assert.ok(Math.abs(response.speedKmh - 130) < 0.01);

  response = advanceMeridianVisualResponse(response, 0, "UNDERWATER", 1 / 60);
  assert.ok(response.speedKmh > 0, "braking must not snap to the sampled road speed");
  assert.ok(response.speedKmh < 130, "braking must begin on the next rendered frame");
  assert.ok(response.effectProfile.rateScale < 1 && response.effectProfile.rateScale > 0.58);

  previousSpeed = response.speedKmh;
  for (let frame = 0; frame < 300; frame += 1) {
    response = advanceMeridianVisualResponse(response, 0, "UNDERWATER", 1 / 60);
    assert.ok(response.speedKmh <= previousSpeed, "braking response must be monotonic");
    previousSpeed = response.speedKmh;
  }
  assert.ok(response.speedKmh < 0.05);
  assert.ok(Math.abs(response.effectProfile.rateScale - 0.58) < 1e-6);
});

test("makes underwater compression and the following surfacing unmistakable but continuous", () => {
  const roadSpeed = 65;
  const dryFov = speedToProjection(roadSpeed).fovDegrees;
  const underwaterFov = dryFov + meridianEffectProfile("UNDERWATER").fovDelta;
  assert.ok(dryFov - underwaterFov >= 10, "underwater must visibly compress the projection");

  let response = advanceMeridianVisualResponse(null, roadSpeed, "UNDERWATER", 1 / 60);
  const submergedFovDelta = response.effectProfile.fovDelta;
  response = advanceMeridianVisualResponse(response, 100, null, 1 / 60);
  assert.ok(
    response.effectProfile.fovDelta > submergedFovDelta,
    "surfacing must start opening the projection on the first frame",
  );
  assert.ok(response.effectProfile.fovDelta < 0, "surfacing must not snap immediately to dry");
  assert.ok(response.speedKmh > roadSpeed, "renewed acceleration must begin immediately");

  for (let frame = 0; frame < 60; frame += 1) {
    response = advanceMeridianVisualResponse(response, 100, null, 1 / 60);
  }
  assert.ok(response.effectProfile.fovDelta > -1.5, "the field must visibly emerge within one second");
  assert.ok(response.effectProfile.railGlowScale > 0.9);
  assert.ok(response.effectProfile.fogScale < 1.12);
});

test("keeps the visual response effectively frame-rate independent", () => {
  const simulate = (framesPerSecond, seconds, targetSpeed, effect) => {
    let response = advanceMeridianVisualResponse(null, 0, null, 1 / framesPerSecond);
    const frames = Math.round(framesPerSecond * seconds);
    for (let frame = 0; frame < frames; frame += 1) {
      response = advanceMeridianVisualResponse(
        response,
        targetSpeed,
        effect,
        1 / framesPerSecond,
      );
    }
    return response;
  };

  const at30 = simulate(30, 1.2, 130, "BLOOM");
  const at60 = simulate(60, 1.2, 130, "BLOOM");
  const at120 = simulate(120, 1.2, 130, "BLOOM");
  for (const response of [at30, at120]) {
    assert.ok(Math.abs(response.speedKmh - at60.speedKmh) < 1e-9);
    assert.ok(Math.abs(response.effectProfile.fovDelta - at60.effectProfile.fovDelta) < 1e-9);
  }

  const simulateSurfacing = (framesPerSecond) => {
    let response = advanceMeridianVisualResponse(null, 65, "UNDERWATER", 1 / framesPerSecond);
    for (let frame = 0; frame < framesPerSecond; frame += 1) {
      response = advanceMeridianVisualResponse(response, 100, null, 1 / framesPerSecond);
    }
    return response;
  };
  const surface30 = simulateSurfacing(30);
  const surface60 = simulateSurfacing(60);
  const surface120 = simulateSurfacing(120);
  for (const response of [surface30, surface120]) {
    assert.ok(Math.abs(response.speedKmh - surface60.speedKmh) < 1e-9);
    assert.ok(Math.abs(response.effectProfile.fovDelta - surface60.effectProfile.fovDelta) < 1e-9);
    assert.ok(Math.abs(response.effectProfile.fogScale - surface60.effectProfile.fogScale) < 1e-9);
  }
  assert.ok(MERIDIAN_RESPONSE.brakingSeconds > MERIDIAN_RESPONSE.accelerationSeconds);
  assert.ok(MERIDIAN_RESPONSE.surfacingSeconds > MERIDIAN_RESPONSE.effectEngageSeconds);
});

test("grows the displacement field continuously from rest to the ceiling", () => {
  const rest = speedToDistortionField(0);
  const ceiling = speedToDistortionField(ROAD_SPEED_CEILING_KMH);
  assert.equal(rest.swayAmplitude, MERIDIAN_FIELD_CONSTANTS.swayAmplitudeRest);
  assert.equal(ceiling.liftAmplitude, MERIDIAN_FIELD_CONSTANTS.liftAmplitudeCeiling);

  let previousSway = -Infinity;
  let previousLift = -Infinity;
  for (let speed = 0; speed <= ROAD_SPEED_CEILING_KMH; speed += 2) {
    const field = speedToDistortionField(speed);
    assert.ok(field.swayAmplitude >= previousSway);
    assert.ok(field.liftAmplitude >= previousLift);
    previousSway = field.swayAmplitude;
    previousLift = field.liftAmplitude;
  }
});

test("pins the near field so the corridor is anchored at the camera", () => {
  const field = speedToDistortionField(90);
  const pinned = distortionAt(MERIDIAN_PIN_PROGRESS, 4.25, field);
  assert.ok(Math.abs(pinned.x) < 1e-9);
  assert.ok(Math.abs(pinned.y) < 1e-9);
});

test("keeps vertical excursion bounded to a stable low corridor at every phase", () => {
  const field = speedToDistortionField(ROAD_SPEED_CEILING_KMH);
  let minimum = Infinity;
  let maximum = -Infinity;
  for (let phase = 0; phase < 12; phase += 1) {
    const time = (phase / 12) * Math.PI * 2;
    for (let step = 0; step <= 40; step += 1) {
      const point = distortionAt(step / 40, time, field);
      minimum = Math.min(minimum, point.y);
      maximum = Math.max(maximum, point.y);
    }
  }
  assert.ok(maximum - minimum < 3.2, `vertical excursion was ${maximum - minimum}`);
  assert.ok(maximum < 2.5 && minimum > -1, "the road cannot become a rollercoaster");
});

test("grows peripheral stretch, parallax and optical flow monotonically with speed", () => {
  let previous = speedToPeripheralDeformation(0);
  assert.equal(previous.stretch, 1);
  assert.equal(previous.flowLength, 1);
  for (let speed = 2; speed <= ROAD_SPEED_CEILING_KMH; speed += 2) {
    const next = speedToPeripheralDeformation(speed);
    assert.ok(next.stretch > previous.stretch);
    assert.ok(next.parallax > previous.parallax);
    assert.ok(next.flowLength > previous.flowLength);
    previous = next;
  }
  assert.ok(previous.stretch >= 1.7);
  assert.ok(previous.flowLength >= 4.7);
});

test("aims the camera along the local slope of the same displacement field", () => {
  const field = speedToDistortionField(110);
  const still = { ...field, swayAmplitude: 0, rollAmplitude: 0 };
  const flat = lookAtFromDistortion(2.5, still);
  assert.ok(Math.abs(flat.x) < 1e-9, "a field without sway must not steer the camera");

  const swaying = lookAtFromDistortion(2.5, field);
  assert.ok(Math.abs(swaying.x) > 0, "a swaying field must steer the camera");
  assert.ok(swaying.z < 0, "the camera always looks down the corridor");
});

test("keeps every layer bounded and monotonic while detail arrives with speed", () => {
  const rest = speedToLayerDensity(0);
  assert.equal(rest.streakFraction, 0, "no travelling markers at a standstill");
  assert.ok(rest.gateFraction > 0.3, "the corridor is still legible at rest");

  let previousGate = -Infinity;
  let previousStreak = -Infinity;
  for (let speed = 0; speed <= ROAD_SPEED_CEILING_KMH; speed += 2) {
    const density = speedToLayerDensity(speed);
    assert.ok(density.gateFraction >= previousGate);
    assert.ok(density.streakFraction >= previousStreak);
    assert.ok(density.gateFraction <= 1 && density.streakFraction <= 1);
    assert.ok(density.railGlow > 0 && density.railGlow <= 1);
    previousGate = density.gateFraction;
    previousStreak = density.streakFraction;
  }
  const ceiling = speedToLayerDensity(ROAD_SPEED_CEILING_KMH);
  assert.ok(Math.abs(ceiling.streakFraction - 1) < 1e-12);
  assert.equal(speedToLayerDensity(0).streakStretch, 1, "markers are unstretched at rest");
  assert.ok(ceiling.streakStretch > 2, "markers elongate substantially at the ceiling");
  let previousStretch = -Infinity;
  for (let speed = 0; speed <= ROAD_SPEED_CEILING_KMH; speed += 2) {
    const { streakStretch } = speedToLayerDensity(speed);
    assert.ok(streakStretch >= previousStretch, "marker elongation must be monotonic");
    previousStretch = streakStretch;
  }
});

test("grows architectural mass and atmosphere progressively with road speed", () => {
  const rest = speedToLayerDensity(0);
  const urban = speedToLayerDensity(50);
  const ceiling = speedToLayerDensity(ROAD_SPEED_CEILING_KMH);
  assert.ok(rest.architectureFraction > 0, "the resting scene keeps a sparse architectural frame");
  assert.ok(rest.architectureFraction < urban.architectureFraction);
  assert.ok(urban.architectureFraction < ceiling.architectureFraction);
  assert.equal(rest.atmosphereFraction, 0);
  assert.ok(urban.atmosphereFraction > 0);
  assert.equal(ceiling.atmosphereFraction, 1);
  assert.ok(rest.volumeGlow < urban.volumeGlow && urban.volumeGlow < ceiling.volumeGlow);
});

test("generates displacement GLSL from the same constants as the JavaScript field", () => {
  const glsl = meridianDistortionGlsl();
  assert.match(glsl, /vec2 getDistortion\(float progress\)/);
  assert.ok(glsl.includes(MERIDIAN_PIN_PROGRESS.toFixed(5)));
  assert.ok(glsl.includes(MERIDIAN_FIELD_CONSTANTS.liftExponent.toFixed(5)));
  assert.ok(glsl.includes(MERIDIAN_FIELD_CONSTANTS.swayNearDamping.toFixed(5)));
  assert.ok(glsl.includes(MERIDIAN_FIELD_CONSTANTS.rollPhaseRate.toFixed(5)));
});
