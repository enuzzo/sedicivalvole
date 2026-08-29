// DRIVEY 06 — bounded, project-authored perspective-road model.
//
// The renderer studies the idea of a continuously driven wireframe landscape
// without importing upstream code, geometry, assets, or level data. All values
// are normalized and deterministic so visual pacing can be asserted offline.

import { ROAD_SPEED_CEILING_KMH } from "../../signal-model.js";

export const DRIVEY_CAMERAS = Object.freeze({
  driver: Object.freeze({ id: "driver", label: "DRIVER", horizon: 0.355, roadScale: 1, look: 1, bankScale: 1 }),
  hood: Object.freeze({ id: "hood", label: "HOOD", horizon: 0.29, roadScale: 1.14, look: 1, bankScale: 0.72 }),
  rear: Object.freeze({ id: "rear", label: "REAR", horizon: 0.405, roadScale: 0.9, look: -1, bankScale: -0.82 }),
});

export const DEFAULT_DRIVEY_SETTINGS = Object.freeze({
  camera: "driver",
  structure: 62,
});

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function normalizeDriveySettings(value) {
  const camera = Object.hasOwn(DRIVEY_CAMERAS, value?.camera)
    ? value.camera
    : DEFAULT_DRIVEY_SETTINGS.camera;
  const structureValue = Number(value?.structure);
  return {
    camera,
    structure: Number.isFinite(structureValue)
      ? Math.round(clamp(structureValue, 20, 100))
      : DEFAULT_DRIVEY_SETTINGS.structure,
  };
}

export function driveyMotionProfile({
  speedKmh = 0,
  audioLevel = 0,
  effect = null,
  reducedMotion = false,
} = {}) {
  const speed = clamp(Number(speedKmh) || 0, 0, ROAD_SPEED_CEILING_KMH);
  const velocity = speed / ROAD_SPEED_CEILING_KMH;
  const eased = velocity * velocity * (3 - 2 * velocity);
  const level = clamp(Number(audioLevel) || 0, 0, 1);
  const open = effect === "OPEN" || effect === "BLOOM";
  const underwater = effect === "UNDERWATER";
  const bloom = effect === "BLOOM";
  return Object.freeze({
    velocity,
    travelRate: reducedMotion ? 0 : 0.015 + eased * 1.58,
    perspective: 0.94 + eased * 0.24 + (open ? 0.08 : 0),
    curveAmplitude: 0.44 + eased * 0.68,
    terrainRelief: (0.52 + eased * 0.34) * (underwater ? 0.72 : 1),
    bank: (0.018 + eased * 0.072) * (underwater ? 0.36 : 1),
    colourPulse: reducedMotion ? 0 : level * (bloom ? 1 : 0.72),
    lineEnergy: 0.62 + eased * 0.28 + level * 0.22 + (bloom ? 0.24 : 0),
    depthCompression: underwater ? 0.16 : 0,
  });
}

export function driveyRoadSample(progress, time, profile, settings = DEFAULT_DRIVEY_SETTINGS) {
  const safeProgress = clamp(Number(progress) || 0, 0, 1);
  const safeTime = Number(time) || 0;
  const normalized = normalizeDriveySettings(settings);
  const camera = DRIVEY_CAMERAS[normalized.camera];
  const structure = normalized.structure / 100;
  const look = camera.look;
  const farPhase = safeTime * 0.21 * look;
  const nearDamping = 0.24 + safeProgress * 0.76;
  const bend = (
    Math.sin(safeProgress * 7.8 + farPhase)
    + Math.sin(safeProgress * 17.4 - farPhase * 0.63) * 0.34
  ) * profile.curveAmplitude * nearDamping * look;
  const relief = (
    Math.sin(safeProgress * 11.1 - safeTime * 0.12)
    + Math.sin(safeProgress * 25.2 + safeTime * 0.08) * 0.28
  ) * profile.terrainRelief * (0.025 + safeProgress * 0.065) * structure;
  return Object.freeze({
    center: bend * 0.12,
    relief,
    halfWidth: (0.025 + Math.pow(safeProgress, 1.35) * 0.455)
      * camera.roadScale
      * profile.perspective,
    bank: Math.sin(safeProgress * 8.6 + farPhase) * profile.bank * camera.bankScale,
  });
}

export function projectDriveyPoint({
  lateral = 0,
  progress = 0,
  time = 0,
  profile,
  settings = DEFAULT_DRIVEY_SETTINGS,
} = {}) {
  const normalized = normalizeDriveySettings(settings);
  const camera = DRIVEY_CAMERAS[normalized.camera];
  const safeProgress = clamp(Number(progress) || 0, 0, 1);
  const sample = driveyRoadSample(safeProgress, time, profile, normalized);
  const depth = Math.pow(safeProgress, 1.5 - profile.depthCompression);
  const y = camera.horizon + depth * (1.02 - camera.horizon) - sample.relief * (1 - depth);
  const x = 0.5 + sample.center + lateral * sample.halfWidth + sample.bank * depth;
  return Object.freeze({ x, y, depth, sample });
}

export function driveyGridDensity(settings = DEFAULT_DRIVEY_SETTINGS) {
  const structure = normalizeDriveySettings(settings).structure;
  return Object.freeze({
    longitudinal: Math.round(10 + structure * 0.16),
    crossSections: Math.round(12 + structure * 0.2),
    terrainLines: Math.round(8 + structure * 0.12),
  });
}
