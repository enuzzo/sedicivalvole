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
  wallApproachSpeedKmh: 35,
  terminalSpeedKmh: 120,
});

/** Speed at which the grid fully folds into the 3D perspective tunnel (35 km/h). */
export const WALL_APPROACH_SPEED_KMH = 35;

/**
 * The end wall's depth along the Z axis, screen size, and luminance.
 *
 * At 0 km/h the grid sits flat at z = 1.0 (covers 100% of the screen).
 * Between 0 and 35 km/h the grid folds directly into the 4 walls of the perspective tunnel.
 * Above 35 km/h the tunnel is fully formed with the dark central terminus void.
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
