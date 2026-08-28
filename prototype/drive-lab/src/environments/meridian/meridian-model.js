// MERIDIAN 03 — speed response model.
//
// This module is the complete, pure description of how road speed becomes
// corridor motion. It holds no WebGL state so every mapping stays
// deterministically testable in Node.
//
// The mechanics implemented here were derived by reading the Codrops/Tympanus
// "High-speed Light Trails in Three.js" runtime (Daniel Velasquez / Anemolo) at
// commit e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e directly. MERIDIAN reuses the
// *grammar* of that work and none of its source, geometry, palette, or scene:
//
//   1. speed is an additive time rate, never a position, so the world can never
//      restart (upstream: App.update, timeOffset += speedUp * delta);
//   2. one depth-parameterized displacement function bends every element in the
//      scene, which is what keeps the world coherent (upstream:
//      "#include <getDistortion_vertex>" string-injected into every material);
//   3. the camera aims along the local derivative of that same field, which is
//      why lateral drift reads as travel rather than camera shake (upstream:
//      distortion.getJS sampled near progress 0.025, scaled by lookAtAmp);
//   4. projection widening carries acceleration that geometry speed alone
//      cannot (upstream: fov 90 -> 150).
//
// The displacement function, corridor contents, palette response, rest state
// and density model below are original to sedicivalvole. See
// docs/REFERENCE-STUDY-INFINITE-LIGHTS.md for the full provenance record.

import { clamp, ROAD_SPEED_CEILING_KMH } from "../../signal-model.js";

/** Corridor depth in world units. Elements wrap modulo this length. */
export const MERIDIAN_TRAVEL_LENGTH = 220;

/**
 * The corridor never dies. At a standstill the world holds a slow residual
 * rate so the field breathes instead of freezing into a still image.
 */
export const MERIDIAN_IDLE_RATE = 0.045;

/** Near-field pin. Displacement is measured relative to this depth so the
 *  geometry closest to the camera stays anchored at the origin. */
export const MERIDIAN_PIN_PROGRESS = 0.015;

/** Derivative step used to sample the field slope for camera aim. */
export const MERIDIAN_SLOPE_STEP = 0.012;

export const MERIDIAN_FOV_REST_DEGREES = 54;
export const MERIDIAN_FOV_CEILING_DEGREES = 104;

const FIELD = Object.freeze({
  swayAmplitudeRest: 0.45,
  swayAmplitudeCeiling: 1.9,
  swayFrequency: 1.15,
  swayNearDamping: 0.22,
  liftAmplitudeRest: 0.55,
  liftAmplitudeCeiling: 1.7,
  liftExponent: 1.9,
  rollAmplitudeRest: 0.18,
  rollAmplitudeCeiling: 0.58,
  rollFrequency: 1.7,
  rollPhaseRate: 0.22,
});

export const MERIDIAN_FIELD_CONSTANTS = FIELD;

const normalizedSpeed = (speedKmh) =>
  clamp(Math.max(0, speedKmh) / ROAD_SPEED_CEILING_KMH, 0, 1);

/**
 * Road speed to corridor time rate.
 *
 * The curve is deliberately steep off rest so the first metres of movement are
 * unmistakable, then straightens toward the ceiling. `1` is the reference
 * travel rate at the fixed 130 km/h road ceiling.
 */
export function speedToTimeRate(speedKmh) {
  const normalized = normalizedSpeed(speedKmh);
  const eased = normalized ** 0.62;
  return MERIDIAN_IDLE_RATE + (1 - MERIDIAN_IDLE_RATE) * eased;
}

/**
 * Monotonic corridor clock. The offset only ever accumulates, so no speed
 * change — including a full stop — can restart or rewind the world.
 */
export function advanceTimeOffset(previousOffset, timeRate, deltaSeconds) {
  const previous = Number.isFinite(previousOffset) ? previousOffset : 0;
  const rate = Math.max(0, Number.isFinite(timeRate) ? timeRate : 0);
  const delta = clamp(Number.isFinite(deltaSeconds) ? deltaSeconds : 0, 0, 0.25);
  return previous + rate * delta;
}

/** Projection response. Widening the frustum is what makes speed read as
 *  acceleration rather than as faster scenery. */
export function speedToProjection(speedKmh) {
  const normalized = normalizedSpeed(speedKmh);
  const eased = normalized ** 0.92;
  return {
    fovDegrees:
      MERIDIAN_FOV_REST_DEGREES
      + (MERIDIAN_FOV_CEILING_DEGREES - MERIDIAN_FOV_REST_DEGREES) * eased,
    cameraLift: 5.1 - 1.1 * eased,
    depthCompression: 1 - 0.3 * eased,
    horizonBias: 0.62 + 0.06 * eased,
  };
}

/**
 * Speed lens for the edges of the frame.
 *
 * The centre axis stays geometrically calm while the shoulders carry the
 * acceleration: large lateral planes pull outward, their parallax grows, and
 * the optical-flow marks lengthen. These values are renderer-independent so a
 * future fallback cannot quietly lose the principal speed cue.
 */
export function speedToPeripheralDeformation(speedKmh) {
  const normalized = normalizedSpeed(speedKmh);
  const eased = normalized ** 1.08;
  return {
    stretch: 1 + 0.72 * eased,
    parallax: 0.08 + 0.92 * normalized ** 0.74,
    flowLength: 1 + 3.8 * normalized ** 1.18,
  };
}

/** Displacement-field parameters for the current speed. */
export function speedToDistortionField(speedKmh) {
  const normalized = normalizedSpeed(speedKmh);
  const mix = (rest, ceiling) => rest + (ceiling - rest) * normalized;
  return {
    swayAmplitude: mix(FIELD.swayAmplitudeRest, FIELD.swayAmplitudeCeiling),
    swayFrequency: FIELD.swayFrequency,
    swayNearDamping: FIELD.swayNearDamping,
    liftAmplitude: mix(FIELD.liftAmplitudeRest, FIELD.liftAmplitudeCeiling),
    liftExponent: FIELD.liftExponent,
    rollAmplitude: mix(FIELD.rollAmplitudeRest, FIELD.rollAmplitudeCeiling),
    rollFrequency: FIELD.rollFrequency,
  };
}

/**
 * Layer visibility. Depth cues arrive progressively so the corridor reads as
 * one world gaining detail, never as a scene being swapped in.
 */
export function speedToLayerDensity(speedKmh) {
  const normalized = normalizedSpeed(speedKmh);
  return {
    gateFraction: 0.34 + 0.66 * normalized ** 0.62,
    streakFraction: clamp((normalized - 0.06) / 0.52, 0, 1) ** 0.85,
    architectureFraction: 0.28 + 0.72 * normalized ** 0.72,
    atmosphereFraction: clamp((normalized - 0.12) / 0.66, 0, 1) ** 0.9,
    railGlow: 0.62 + 0.38 * normalized ** 1.3,
    volumeGlow: 0.38 + 0.62 * normalized ** 1.15,
    streakStretch: speedToPeripheralDeformation(speedKmh).flowLength,
  };
}

const unpinned = (progress, time, field) => {
  const p = clamp(progress, 0, 1);
  const sway =
    field.swayAmplitude
    * Math.sin(p * Math.PI * field.swayFrequency + time)
    * (field.swayNearDamping + (1 - field.swayNearDamping) * p);
  const lift = field.liftAmplitude * p ** field.liftExponent
    - field.rollAmplitude
      * Math.sin(p * Math.PI * field.rollFrequency + time * FIELD.rollPhaseRate);
  return { x: sway, y: lift };
};

/**
 * The shared displacement field. Every element in the corridor — rails, gates
 * and travelling markers — is displaced by this single function of depth, which
 * is what makes the world bend coherently instead of as unrelated parts.
 *
 * The JavaScript here and the GLSL returned by `meridianDistortionGlsl()` are
 * the same function and are kept in step through `MERIDIAN_FIELD_CONSTANTS`.
 */
export function distortionAt(progress, time, field) {
  const here = unpinned(progress, time, field);
  const pin = unpinned(MERIDIAN_PIN_PROGRESS, time, field);
  return { x: here.x - pin.x, y: here.y - pin.y };
}

/**
 * Camera aim derived from the local slope of the same displacement field.
 * Sampling the derivative rather than a fixed point is what keeps the horizon
 * and the corridor in agreement while the field sways.
 */
export function lookAtFromDistortion(time, field) {
  const near = distortionAt(MERIDIAN_PIN_PROGRESS, time, field);
  const ahead = distortionAt(MERIDIAN_PIN_PROGRESS + MERIDIAN_SLOPE_STEP, time, field);
  return {
    x: (near.x - ahead.x) * 1.6,
    y: (near.y - ahead.y) * 2.4,
    z: -MERIDIAN_TRAVEL_LENGTH * 0.06,
  };
}

/**
 * GLSL source for the shared displacement field, generated from the same
 * constants as the JavaScript implementation above.
 */
export function meridianDistortionGlsl() {
  return `
  uniform float u_time;
  uniform float u_swayAmplitude;
  uniform float u_swayFrequency;
  uniform float u_liftAmplitude;
  uniform float u_rollAmplitude;
  uniform float u_rollFrequency;

  const float PIN_PROGRESS = ${MERIDIAN_PIN_PROGRESS.toFixed(5)};
  const float SWAY_NEAR_DAMPING = ${FIELD.swayNearDamping.toFixed(5)};
  const float LIFT_EXPONENT = ${FIELD.liftExponent.toFixed(5)};
  const float ROLL_PHASE_RATE = ${FIELD.rollPhaseRate.toFixed(5)};
  const float PI_ = 3.14159265358979;

  vec2 unpinnedDistortion(float progress) {
    float p = clamp(progress, 0.0, 1.0);
    float sway = u_swayAmplitude
      * sin(p * PI_ * u_swayFrequency + u_time)
      * (SWAY_NEAR_DAMPING + (1.0 - SWAY_NEAR_DAMPING) * p);
    float lift = u_liftAmplitude * pow(p, LIFT_EXPONENT)
      - u_rollAmplitude * sin(p * PI_ * u_rollFrequency + u_time * ROLL_PHASE_RATE);
    return vec2(sway, lift);
  }

  vec2 getDistortion(float progress) {
    return unpinnedDistortion(progress) - unpinnedDistortion(PIN_PROGRESS);
  }
`;
}
