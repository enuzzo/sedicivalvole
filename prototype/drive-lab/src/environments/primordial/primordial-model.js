import { clamp, speedToEnergy } from "../../signal-model.js";

export const DEFAULT_PRIMORDIAL_SETTINGS = Object.freeze({
  scale: 1,
  flow: 1,
  warp: 0.78,
});

export const PRIMORDIAL_CONTROLS = Object.freeze([
  Object.freeze({ id: "scale", label: "Scale", min: 0.6, max: 1.6, step: 0.05 }),
  Object.freeze({ id: "flow", label: "Flow", min: 0.4, max: 1.8, step: 0.05 }),
  Object.freeze({ id: "warp", label: "Warp", min: 0.3, max: 1.4, step: 0.01 }),
]);

function boundedSetting(value, fallback, min, max) {
  const numeric = Number(value);
  return clamp(Number.isFinite(numeric) ? numeric : fallback, min, max);
}

export function normalizePrimordialSettings(value) {
  const source = value && typeof value === "object" ? value : DEFAULT_PRIMORDIAL_SETTINGS;
  return {
    scale: boundedSetting(source.scale, DEFAULT_PRIMORDIAL_SETTINGS.scale, 0.6, 1.6),
    flow: boundedSetting(source.flow, DEFAULT_PRIMORDIAL_SETTINGS.flow, 0.4, 1.8),
    warp: boundedSetting(source.warp, DEFAULT_PRIMORDIAL_SETTINGS.warp, 0.3, 1.4),
  };
}

export function primordialMotionProfile({
  speedKmh = 0,
  musicLevel = 0,
  bpm = 0,
  effect = null,
  reducedMotion = false,
  settings = DEFAULT_PRIMORDIAL_SETTINGS,
} = {}) {
  const energy = speedToEnergy(Math.max(0, speedKmh));
  const level = clamp(Number(musicLevel) || 0, 0, 1);
  const normalized = normalizePrimordialSettings(settings);
  const open = effect === "OPEN" ? 1 : 0;
  const underwater = effect === "UNDERWATER" ? 1 : 0;
  const bloom = effect === "BLOOM" ? 1 : 0;
  const tempoHz = speedKmh >= 0.8 ? clamp(Number(bpm) || 0, 0, 220) / 60 : 0;
  return {
    energy,
    scale: normalized.scale,
    warp: normalized.warp * (1 + level * 0.18 + open * 0.08 - underwater * 0.1),
    flowRate: reducedMotion
      ? 0
      : normalized.flow * (0.028 + level * 0.28) * (underwater ? 0.5 : 1),
    convergence: energy * (0.16 + open * 0.06) * (underwater ? 0.66 : 1),
    agitation: reducedMotion ? 0 : level * 0.24 + bloom * 0.24 + open * 0.08,
    colorRate: reducedMotion ? 0 : 0.018 + level * 0.42 + bloom * 0.14,
    musicTempoHz: reducedMotion ? 0 : tempoHz,
    glow: 0.08 + level * 0.2 + bloom * 0.62,
    pressure: underwater ? 0.72 : open ? 1.12 : 1,
  };
}
