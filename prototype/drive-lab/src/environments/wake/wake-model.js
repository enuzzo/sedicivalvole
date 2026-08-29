import { clamp, ROAD_SPEED_CEILING_KMH, speedToEnergy } from "../../signal-model.js";

export const WAKE_RIBBONS = Object.freeze([
  { tone: "accent", widthStart: 0.11, widthEnd: 0.12, depth: -0.34, twist: 0.04, fold: 0.92, phase: 0.2, points: [[-1.30, 0.85], [-0.76, 0.72], [-0.20, 0.56], [0.05, 0.38], [0.63, 0.25], [1.30, 0.25]] },
  { tone: "accentShadow", widthStart: 0.06, widthEnd: 0.20, depth: -0.15, twist: 0.12, fold: 0.20, phase: 1.6, points: [[-0.03, 0.37], [0.22, 0.57], [0.58, 0.72], [0.95, 0.80], [1.30, 0.86]] },
  { tone: "graphite", widthStart: 0.28, widthEnd: 0.035, depth: -0.04, twist: -0.08, fold: 1.08, phase: 3.1, points: [[-1.30, 0.23], [-0.79, 0.12], [-0.32, 0.04], [-0.08, -0.09], [-0.29, -0.18], [-0.79, -0.13], [-1.30, -0.17]] },
  { tone: "accent", widthStart: 0.34, widthEnd: 0.025, depth: -0.43, twist: -0.06, fold: 0.66, phase: 4.4, points: [[-1.30, -0.76], [-0.93, -0.56], [-0.54, -0.36], [-0.28, -0.31], [-0.08, -0.05]] },
  { tone: "accentDark", widthStart: 0.035, widthEnd: 0.27, depth: -0.28, twist: 0.08, fold: 0.24, phase: 5.8, points: [[0.16, -0.34], [0.35, -0.25], [0.64, -0.18], [0.96, -0.11], [1.30, -0.02]] },
  { tone: "graphite", widthStart: 0.17, widthEnd: 0.17, depth: -0.08, twist: 0.03, fold: 0.42, phase: 0.9, points: [[-0.45, -1.03], [-0.20, -0.82], [0.14, -0.63], [0.34, -0.54], [0.31, -0.78], [0.25, -1.03]] },
  { tone: "accentShadow", widthStart: 0.035, widthEnd: 0.28, depth: -0.12, twist: -0.10, fold: 0.22, phase: 2.4, points: [[0.18, -0.27], [0.42, -0.46], [0.73, -0.71], [1.30, -0.98]] },
]);

export function wakeMotionProfile(speedKmh, effect = null, reducedMotion = false) {
  const speed = reducedMotion ? Math.min(20, Math.max(0, speedKmh)) : Math.max(0, speedKmh);
  const energy = speedToEnergy(speed);
  const effectRate = effect === "UNDERWATER" ? 0.48 : effect === "BLOOM" ? 1.16 : 1;
  const effectSway = effect === "UNDERWATER" ? 0.70 : effect === "OPEN" ? 1.15 : effect === "BLOOM" ? 1.22 : 1;
  const effectTangle = effect === "UNDERWATER" ? 0.65 : effect === "OPEN" ? 1.10 : effect === "BLOOM" ? 1.25 : 1;
  return {
    energy,
    timeRate: reducedMotion ? 0 : (0.045 + 0.62 * energy ** 1.25) * effectRate,
    breathing: reducedMotion ? 0 : 0.006 + 0.018 * energy,
    sway: reducedMotion ? 0 : (0.012 + 0.055 * energy ** 1.4) * effectSway,
    tangle: reducedMotion ? 0 : clamp((energy - 0.42) / 0.58, 0, 1) ** 1.35 * effectTangle,
    drape: 0.006 + 0.026 * (1 - energy) * (effect === "UNDERWATER" ? 1.25 : 1),
    widthScale: effect === "OPEN" ? 1.1 : effect === "UNDERWATER" ? 0.96 : effect === "BLOOM" ? 1.05 : 1,
    separation: effect === "OPEN" ? 0.035 : effect === "UNDERWATER" ? -0.012 : 0,
    lightScale: effect === "UNDERWATER" ? 0.58 : effect === "BLOOM" ? 1.45 : effect === "OPEN" ? 1.12 : 1,
    foldScale: (0.78 + 0.88 * energy) * (effect === "UNDERWATER" ? 0.72 : effect === "BLOOM" ? 1.18 : 1),
  };
}

export function wakeRibbonMotion(ribbon, progress, time, profile) {
  const safeProgress = clamp(Number(progress) || 0, 0, 1);
  const envelope = Math.sin(Math.PI * safeProgress) ** 2;
  const travelling = Math.sin(safeProgress * Math.PI * 2.3 - time * 4.0 + ribbon.phase);
  const secondary = Math.sin(safeProgress * Math.PI * 5.2 - time * 6.8 + ribbon.phase * 1.7);
  const knotEnvelope = Math.exp(-Math.pow((safeProgress - 0.56) / 0.22, 2));
  const knotPhase = time * 3.2 + ribbon.phase * 1.35;
  const flowWave = Math.sin(safeProgress * Math.PI * 2.7 - time * 5.2 + ribbon.phase);
  const drape = -Math.sin(Math.PI * safeProgress) * profile.drape
    * (0.78 + 0.22 * Math.sin(time * 0.58 + ribbon.phase));
  return {
    x: envelope * travelling * profile.sway * 0.42
      + knotEnvelope * Math.sin(knotPhase) * profile.tangle * 0.18,
    y: drape + envelope * (travelling + secondary * 0.24) * profile.sway
      + knotEnvelope * Math.cos(knotPhase * 0.91) * profile.tangle * 0.15,
    z: knotEnvelope * Math.sin(knotPhase * 1.21 + safeProgress * 6.0) * profile.tangle * 0.16,
    twist: envelope * secondary * profile.sway * 4.2
      + knotEnvelope * Math.sin(knotPhase + safeProgress * 10.0) * profile.tangle * 1.05,
    along: envelope * flowWave * (0.008 + 0.035 * profile.energy),
    widthScale: 1 + flowWave * (0.035 + 0.10 * profile.energy),
  };
}

export function catmullRomPoint(points, progress) {
  const safe = clamp(Number(progress) || 0, 0, 1);
  const spanCount = Math.max(1, points.length - 1);
  const scaled = safe * spanCount;
  const span = Math.min(spanCount - 1, Math.floor(scaled));
  const t = scaled - span;
  const p0 = points[Math.max(0, span - 1)];
  const p1 = points[span];
  const p2 = points[Math.min(points.length - 1, span + 1)];
  const p3 = points[Math.min(points.length - 1, span + 2)];
  const interpolate = (axis) => 0.5 * (
    2 * p1[axis]
    + (-p0[axis] + p2[axis]) * t
    + (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t * t
    + (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t * t * t
  );
  return [interpolate(0), interpolate(1)];
}

export function wakeToneColor(palette, tone) {
  const mix = (from, to, amount) => from.map((value, index) => value + (to[index] - value) * amount);
  if (tone === "accent") return mix(palette.accent, palette.light, 0.015);
  if (tone === "accentDark") return mix(palette.accent, palette.base, 0.24);
  if (tone === "accentShadow") return mix(palette.base, palette.accent, 0.18);
  if (tone === "graphite") return mix(palette.base, palette.mid, 0.68);
  return mix(palette.base, palette.mid, 0.22);
}
