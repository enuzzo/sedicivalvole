import { ROAD_SPEED_CEILING_KMH } from "../../signal-model.js";

const clamp = (value, minimum = 0, maximum = 1) => (
  Math.min(maximum, Math.max(minimum, Number(value) || 0))
);

const smoothstep = (minimum, maximum, value) => {
  const normalized = clamp((value - minimum) / (maximum - minimum));
  return normalized * normalized * (3 - 2 * normalized);
};

/**
 * GRADIENT 08 has two continuous identities rather than two presets. The
 * slower Tension Plane progressively opens into Chromatic Fold as speed rises.
 * Authored recordings never drive the shader: audio is admitted only while
 * Play the Road owns the score.
 */
export function gradientMotionProfile({
  speedKmh = 0,
  audioLevel = 0,
  musicMode = "play-road",
  effect = null,
  reducedMotion = false,
} = {}) {
  const speed = clamp(speedKmh, 0, ROAD_SPEED_CEILING_KMH);
  const speedEnergy = speed / ROAD_SPEED_CEILING_KMH;
  const foldMorph = smoothstep(0.08, 0.94, speedEnergy);
  const audioEnergy = musicMode === "play-road" && !reducedMotion
    ? clamp(audioLevel)
    : 0;
  const underwater = effect === "UNDERWATER" ? 1 : 0;
  const open = effect === "OPEN" ? 1 : 0;
  const bloom = effect === "BLOOM" ? 1 : 0;

  return Object.freeze({
    speedEnergy,
    foldMorph,
    audioEnergy,
    flowRate: reducedMotion
      ? 0
      : (0.035 + 1.72 * speedEnergy ** 1.55 + audioEnergy * 0.34) * (underwater ? 0.42 : 1),
    displacement: 0.24 + foldMorph * 1.38 + audioEnergy * 0.48 + open * 0.18,
    foldDepth: 0.14 + foldMorph * 1.18 + audioEnergy * 0.18,
    seamDepth: 0.42 + speedEnergy * 0.58 + audioEnergy * 0.18 + open * 0.18,
    seamFocus: 1.45 + speedEnergy * 4.8 + audioEnergy * 0.7,
    density: 0.62 + speedEnergy * 1.18 + audioEnergy * 0.16,
    radiance: 0.86 + speedEnergy * 0.24 + audioEnergy * 0.24 + bloom * 0.28,
    grain: 0.038 + speedEnergy * 0.018,
    underwater,
    open,
    bloom,
  });
}

export function advanceGradientResponse(previous, target, deltaSeconds) {
  const elapsed = clamp(deltaSeconds, 0, 0.1);
  if (!previous) return { ...target };
  const next = {};
  for (const [key, value] of Object.entries(target)) {
    if (!Number.isFinite(value)) continue;
    const current = Number.isFinite(previous[key]) ? previous[key] : value;
    const responseSeconds = key === "audioEnergy" ? 0.12 : key === "underwater" ? 0.16 : 0.24;
    const blend = responseSeconds <= 0 ? 1 : 1 - Math.exp(-elapsed / responseSeconds);
    next[key] = current + (value - current) * blend;
  }
  return next;
}
