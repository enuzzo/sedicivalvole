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
  depthBandsAt20Kmh: 7,
  wallApproachSpeedKmh: 20,
  terminalSpeedKmh: 120,
});

/** Speed at which the end wall stops approaching and becomes the far terminus. */
export const WALL_APPROACH_SPEED_KMH = 20;

/**
 * The end wall's depth along the Z axis, screen size, and luminance.
 *
 * At 0 km/h the wall sits at the camera plane (z = 1.0) and covers 100% of the screen.
 * From 0 to 20 km/h the wall recedes down the corridor from z = 1.0 to z = 8.0,
 * revealing the 4 tunnel walls.
 * Above 20 km/h the wall is parked at the far terminus (z >= 8.0) and fades to black.
 */
export function apertureWall(speedKmh) {
  const proximity = 1 - smoothstep(0, WALL_APPROACH_SPEED_KMH, Math.max(0, speedKmh));
  // At speed 0, proximity = 1 => z = 1.0 (screen plane, covers full viewport).
  // At speed 20, proximity = 0 => z = 8.0 (far aperture, exactly 7 depth levels).
  const z = 8.0 - 7.0 * proximity;
  const size = 1.0 / z;
  return { proximity, z, size, luminance: smoothstep(0.12, 0.45, size) };
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
