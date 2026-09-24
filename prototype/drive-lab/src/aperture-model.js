// APERTURE — perspective ray-tunnel speed model.
//
// This module provides pure analytical functions for the Aperture visual
// environment. It holds no WebGL state so every mapping stays
// deterministically testable in Node.

import { speedToVisualVelocity } from "./signal-model.js";

function smoothstep(minimum, maximum, value) {
  const normalized = Math.min(1, Math.max(0, (value - minimum) / (maximum - minimum)));
  return normalized * normalized * (3 - 2 * normalized);
}

/**
 * The field's tuning constants, mirrored from the shader so the diagnostic
 * overlay can report exactly what is being drawn rather than an estimate.
 */
export const APERTURE_TUNING = Object.freeze({
  wallTiles: 7,
  depthBandsAtCruise: 7,
  wallApproachSpeedKmh: 40,
  terminalSpeedKmh: 120,
});

/** Speed at which the rigid grid wall reaches the terminus and disappears. */
export const WALL_APPROACH_SPEED_KMH = 40;

/**
 * Converts the old per-drawn-frame easing coefficient into a time-based one.
 *
 * Aperture historically attempted to draw at 45 FPS, but a 60 Hz browser
 * skipped alternate animation frames and actually rendered at 30 FPS. Using
 * that observed cadence as the reference preserves the approved motion while
 * allowing every available display frame to be drawn.
 */
export function apertureSmoothing(coefficientAtThirtyFps, deltaSeconds) {
  const coefficient = Math.min(1, Math.max(0, coefficientAtThirtyFps));
  const elapsed = Math.max(0, deltaSeconds);
  return 1 - ((1 - coefficient) ** (elapsed * 30));
}

/**
 * A critically damped spring toward a moving target, advanced in closed form.
 * Position and velocity stay continuous, so a speed that arrives in coarse
 * GPS steps is drawn as one uninterrupted motion instead of lurch-and-stop.
 * `omega` is the natural frequency in radians per second.
 */
export function advanceSpring(state, target, omega, deltaSeconds) {
  const value = Number.isFinite(state?.value) ? state.value : target;
  const velocity = Number.isFinite(state?.velocity) ? state.velocity : 0;
  const dt = Math.min(0.1, Math.max(0, Number(deltaSeconds) || 0));
  if (!Number.isFinite(target) || !(omega > 0)) return { value, velocity };
  const offset = value - target;
  const impulse = (velocity + omega * offset) * dt;
  const decay = Math.exp(-omega * dt);
  return { value: target + (offset + impulse) * decay, velocity: (velocity - omega * impulse) * decay };
}

/**
 * The receding end wall follows speed through a slower spring (settling in
 * about 1.5 s) so the 0–40 km/h retreat stays fluid between GPS samples.
 */
export const APERTURE_WALL_SPRING = 2.6;

/** Uniform speed terms computed once per frame rather than once per pixel. */
export function apertureShaderControls(speedKmh) {
  const speed = Math.max(0, speedKmh);
  const wall = apertureWall(speed);
  return {
    wallSize: wall.size,
    wallOpacity: smoothstep(0, 0.08, wall.proximity),
    terminalVelocity: smoothstep(118, 130, speed),
    speedPulseMask: smoothstep(1, 15, speed),
    voidActive: smoothstep(15, 35, speed),
  };
}

/**
 * The end wall's depth along the Z axis, screen size, and luminance.
 *
 * At 0 km/h the grid sits flat at z = 1.0 (covers 100% of the screen).
 * Between 0 and 40 km/h the intact grid recedes as a rigid end wall.
 * At 40 km/h it vanishes at the terminus, revealing the existing tunnel.
 */
export function apertureWall(speedKmh) {
  const proximity = 1 - smoothstep(0, WALL_APPROACH_SPEED_KMH, Math.max(0, speedKmh));
  const z = 8.0 - 7.0 * proximity;
  const size = 1.0 / z;
  return { proximity, z, size, luminance: smoothstep(0.10, 0.45, size) };
}

/**
 * The wall-retreat phase renders at one physical pixel per CSS pixel. This
 * avoids supersampling on the Tesla during the only low-speed transition while
 * preserving the exact CSS-pixel geometry and full-resolution cruise tunnel.
 */
export function aperturePixelRatio(devicePixelRatio, speedKmh, previousRatio = null) {
  const dpr = Math.max(1, Number(devicePixelRatio) || 1);
  const speed = Math.max(0, Number(speedKmh) || 0);
  const ratio = Math.min(dpr, speed <= WALL_APPROACH_SPEED_KMH ? 1 : 1.25);
  // Hysteresis: a speed hovering around 40 km/h must not resize the canvas
  // back and forth, which would read as a stutter.
  if (Number.isFinite(previousRatio) && previousRatio !== ratio
    && Math.abs(speed - WALL_APPROACH_SPEED_KMH) < 3) return Math.min(dpr, previousRatio);
  return ratio;
}

/** What the shader draws at a given speed, for diagnostic overlays and QA. */
export function apertureReadout(speedKmh) {
  const safeSpeed = Math.max(0, speedKmh);
  const velocity = speedToVisualVelocity(safeSpeed);
  const wall = apertureWall(safeSpeed);
  const terminalVelocity = smoothstep(118, 130, safeSpeed);
  return {
    velocity,
    wallZ: wall.z,
    wallProximity: wall.proximity,
    depthLevels: 7,
    tilesPerWall: 7,
    terminalVelocity,
  };
}
