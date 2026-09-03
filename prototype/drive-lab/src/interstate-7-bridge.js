import { ROAD_SPEED_CEILING_KMH } from "./signal-model.js";

const ORIGINAL_FOV = 90;
const ORIGINAL_SPEED_UP_FOV = 150;
export const INTERSTATE7_ENTRY_PHASE_SECONDS = 2.1;
export const INTERSTATE7_LOAD_TIMEOUT_MS = 10000;

export function createInterstateLoadDeadline({
  schedule,
  cancel,
  onTimeout,
  timeoutMs = INTERSTATE7_LOAD_TIMEOUT_MS,
}) {
  let active = true;
  let timer = schedule(() => {
    if (!active) return;
    active = false;
    timer = null;
    onTimeout();
  }, timeoutMs);

  const clear = () => {
    if (!active) return false;
    active = false;
    if (timer !== null) cancel(timer);
    timer = null;
    return true;
  };

  return { clear };
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function speedToInterstate7Targets(speedKmh) {
  const normalizedSpeed = clamp(speedKmh / ROAD_SPEED_CEILING_KMH, 0, 1);
  // Interstate 7's light trails are intentionally much faster than road-scale
  // motion. A quadratic response keeps urban speeds grounded while still
  // reaching the complete original non-boosted motion at the road ceiling.
  const playbackRate = normalizedSpeed * normalizedSpeed;
  return {
    normalizedSpeed,
    playbackRate,
    speedUpTarget: playbackRate - 1,
    fovTarget: ORIGINAL_FOV + (ORIGINAL_SPEED_UP_FOV - ORIGINAL_FOV) * playbackRate,
  };
}

export function interstate7EffectTargets(speedKmh, effect) {
  const targets = speedToInterstate7Targets(speedKmh);
  if (effect === "UNDERWATER") {
    return {
      ...targets,
      speedUpTarget: Math.max(-1, targets.speedUpTarget - 0.1),
      fovTarget: targets.fovTarget - 4,
    };
  }
  return targets;
}

function mixRgb(from, to, amount) {
  return from.map((value, index) => value + (to[index] - value) * amount);
}

/**
 * Maps a sedicivalvole body-colour theme onto the original scene's existing
 * colour channels. Geometry, bloom, distortion, camera and motion stay owned
 * by the byte-identical upstream runtime.
 */
export function themeToInterstate7Palette(theme, effect = null) {
  const { base, mid, light, accent, secondary } = theme.palette;
  const palette = {
    background: base,
    road: mixRgb(base, mid, 0.08),
    island: mixRgb(base, mid, 0.14),
    markings: mixRgb(base, mid, 0.58),
    leftCars: [accent, mixRgb(accent, mid, 0.28), accent],
    rightCars: [light, secondary, mixRgb(light, secondary, 0.42)],
    sticks: [secondary, light],
  };
  if (effect === "UNDERWATER") {
    return {
      ...palette,
      road: mixRgb(palette.road, base, 0.38),
      markings: mixRgb(palette.markings, base, 0.22),
      leftCars: palette.leftCars.map((color) => mixRgb(color, mid, 0.34)),
      rightCars: palette.rightCars.map((color) => mixRgb(color, mid, 0.34)),
      sticks: palette.sticks.map((color) => mixRgb(color, mid, 0.42)),
    };
  }
  return palette;
}
