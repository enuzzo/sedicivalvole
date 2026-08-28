import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceTimeOffset,
  distortionAt,
  lookAtFromDistortion,
  MERIDIAN_FIELD_CONSTANTS,
  MERIDIAN_FOV_CEILING_DEGREES,
  MERIDIAN_FOV_REST_DEGREES,
  MERIDIAN_IDLE_RATE,
  MERIDIAN_PIN_PROGRESS,
  meridianDistortionGlsl,
  speedToDistortionField,
  speedToLayerDensity,
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
    Math.abs(speedToProjection(ROAD_SPEED_CEILING_KMH).fovDegrees - MERIDIAN_FOV_CEILING_DEGREES)
      < 1e-12,
  );
  const restLift = speedToProjection(0).cameraLift;
  const ceilingLift = speedToProjection(ROAD_SPEED_CEILING_KMH).cameraLift;
  assert.ok(ceilingLift < restLift, "the viewpoint settles toward the corridor with speed");

  let previousFov = -Infinity;
  let previousLift = Infinity;
  for (let speed = 0; speed <= ROAD_SPEED_CEILING_KMH; speed += 5) {
    const { fovDegrees, cameraLift } = speedToProjection(speed);
    assert.ok(fovDegrees > previousFov, "projection must open monotonically");
    assert.ok(cameraLift <= previousLift, "the viewpoint must settle monotonically");
    assert.ok(cameraLift > 0, "the viewpoint never drops through the corridor floor");
    previousFov = fovDegrees;
    previousLift = cameraLift;
  }
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

test("raises the far field well above the near field at every phase", () => {
  const field = speedToDistortionField(ROAD_SPEED_CEILING_KMH);
  // Checked across the sway phase so the assertion describes the field itself
  // rather than one lucky moment in its cycle.
  for (let phase = 0; phase < 12; phase += 1) {
    const time = (phase / 12) * Math.PI * 2;
    const near = distortionAt(0.1, time, field);
    const far = distortionAt(1, time, field);
    assert.ok(
      far.y - near.y > field.liftAmplitude * 0.5,
      `depth must build a rising far field at phase ${phase}`,
    );
  }
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
