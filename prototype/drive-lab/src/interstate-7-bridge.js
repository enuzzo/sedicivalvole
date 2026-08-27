import { ROAD_SPEED_CEILING_KMH } from "./signal-model.js";

const ORIGINAL_FOV = 90;
const ORIGINAL_SPEED_UP_FOV = 150;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function speedToInterstate7Targets(speedKmh) {
  const normalizedSpeed = clamp(speedKmh / ROAD_SPEED_CEILING_KMH, 0, 1);
  return {
    normalizedSpeed,
    speedUpTarget: normalizedSpeed - 1,
    fovTarget: ORIGINAL_FOV + (ORIGINAL_SPEED_UP_FOV - ORIGINAL_FOV) * normalizedSpeed,
  };
}
