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
  wallApproachSpeedKmh: 55,
  terminalSpeedKmh: 120,
});

/** Speed at which the end wall reaches the far terminus (55 km/h). */
export const WALL_APPROACH_SPEED_KMH = 55;

/**
 * The end wall's depth along the Z axis, screen size, and luminance.
 *
 * At 0 km/h the wall sits at the camera plane (z = 1.0) and covers 100% of the screen.
 * From 0 to 55 km/h the wall smoothly recedes from z = 1.0 to z = 8.0,
 * with the tunnel clearly visible around 35-40 km/h.
 * At 55+ km/h the wall has reached the far terminus (z >= 8.0) and fades to black.
 */
export function apertureWall(speedKmh) {
  const proximity = 1 - smoothstep(0, WALL_APPROACH_SPEED_KMH, Math.max(0, speedKmh));
  const z = 8.0 - 7.0 * proximity;
  const size = 1.0 / z;
  return { proximity, z, size, luminance: smoothstep(0.10, 0.45, size) };
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
