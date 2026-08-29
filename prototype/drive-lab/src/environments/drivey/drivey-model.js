// DRIVEY 06 — narrow controls for the original Rezmason Drivey runtime.
//
// Geometry, levels, cameras, car simulation, materials, post-processing and
// rendering remain owned by the byte-identical upstream files under
// public/third-party/drivey. This module only clamps Sedici Valvole inputs and
// maps them onto controls the original runtime already exposes.

import { ROAD_SPEED_CEILING_KMH } from "../../signal-model.js";

export const DRIVEY_UPSTREAM_COMMIT = "5104cdade2a3158786b05b9b0680a50e942830cf";
export const DRIVEY_UPSTREAM_ENTRY = "third-party/drivey/sedicivalvole.html";
export const DRIVEY_LOAD_TIMEOUT_MS = 15000;

export const DRIVEY_CAMERAS = Object.freeze({
  hood: Object.freeze({ id: "hood", label: "HOOD" }),
  rear: Object.freeze({ id: "rear", label: "REAR" }),
  aerial: Object.freeze({ id: "aerial", label: "AERIAL" }),
});

export const DRIVEY_RENDER_MODES = Object.freeze({
  normal: Object.freeze({ id: "normal", label: "NORMAL" }),
  wireframe: Object.freeze({ id: "wireframe", label: "WIRE" }),
});

export const DEFAULT_DRIVEY_SETTINGS = Object.freeze({
  camera: "hood",
  traffic: 16,
  renderMode: "normal",
});

const DRIVEY_CAMERA_SEQUENCE = Object.freeze(Object.keys(DRIVEY_CAMERAS));
const DRIVEY_RENDER_MODE_SEQUENCE = Object.freeze(Object.keys(DRIVEY_RENDER_MODES));

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function legacyStructureToTraffic(value) {
  const structure = Number(value);
  if (!Number.isFinite(structure)) return DEFAULT_DRIVEY_SETTINGS.traffic;
  return Math.round(((clamp(structure, 20, 100) - 20) / 80) * 24);
}

export function normalizeDriveySettings(value) {
  const camera = Object.hasOwn(DRIVEY_CAMERAS, value?.camera)
    ? value.camera
    : DEFAULT_DRIVEY_SETTINGS.camera;
  const renderMode = Object.hasOwn(DRIVEY_RENDER_MODES, value?.renderMode)
    ? value.renderMode
    : DEFAULT_DRIVEY_SETTINGS.renderMode;
  const trafficValue = Number(value?.traffic);
  const traffic = Number.isFinite(trafficValue)
    ? Math.round(clamp(trafficValue, 0, 24))
    : legacyStructureToTraffic(value?.structure);
  return { camera, traffic, renderMode };
}

function nextSequenceValue(sequence, current, fallback) {
  const index = sequence.indexOf(current);
  if (index < 0) return fallback;
  return sequence[(index + 1) % sequence.length];
}

export function nextDriveyCameraId(camera) {
  return nextSequenceValue(
    DRIVEY_CAMERA_SEQUENCE,
    camera,
    DEFAULT_DRIVEY_SETTINGS.camera,
  );
}

export function nextDriveyRenderModeId(renderMode) {
  return nextSequenceValue(
    DRIVEY_RENDER_MODE_SEQUENCE,
    renderMode,
    DEFAULT_DRIVEY_SETTINGS.renderMode,
  );
}

export function createDriveyLoadDeadline({
  schedule,
  cancel,
  onTimeout,
  timeoutMs = DRIVEY_LOAD_TIMEOUT_MS,
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

export function driveyMotionProfile({
  speedKmh = 0,
  audioLevel = 0,
  effect = null,
  reducedMotion = false,
} = {}) {
  const speed = clamp(Number(speedKmh) || 0, 0, ROAD_SPEED_CEILING_KMH);
  const normalizedSpeed = speed / ROAD_SPEED_CEILING_KMH;
  const roadResponse = normalizedSpeed ** 1.18;
  const musicLevel = clamp(Number(audioLevel) || 0, 0, 1);
  const open = effect === "OPEN";
  const underwater = effect === "UNDERWATER";
  const bloom = effect === "BLOOM";
  const effectSpeedScale = underwater ? 0.72 : 1;

  return Object.freeze({
    normalizedSpeed,
    cruiseSpeed: reducedMotion ? 0 : roadResponse * 4 * effectSpeedScale,
    npcSpeedScale: reducedMotion ? 0 : roadResponse * effectSpeedScale,
    fov: clamp(90 + normalizedSpeed * 8 + (open ? 8 : underwater ? -6 : bloom ? 4 : 0), 78, 112),
    colourEnergy: reducedMotion ? 0 : musicLevel * (bloom ? 1 : 0.68),
    lightGain: bloom ? 1.24 : open ? 1.1 : underwater ? 0.78 : 1,
    effect,
    reducedMotion,
  });
}

function mixRgb(from, to, amount) {
  return from.map((value, index) => value + (to[index] - value) * amount);
}

function gainRgb(color, gain) {
  return color.map((value) => clamp(value * gain, 0, 1));
}

export function themeToDriveyPalette(theme, profile) {
  const { base, mid, light, accent, secondary } = theme.palette;
  const colourMix = clamp(profile.colourEnergy * 0.52, 0, 0.52);
  let dark = mixRgb(base, mid, 0.06);
  let full = mixRgb(accent, secondary, colourMix);
  let bright = mixRgb(light, accent, profile.effect === "BLOOM" ? 0.22 : 0.06);

  if (profile.effect === "UNDERWATER") {
    dark = mixRgb(base, secondary, 0.12);
    full = mixRgb(full, mid, 0.34);
    bright = mixRgb(bright, secondary, 0.22);
  } else if (profile.effect === "OPEN") {
    full = mixRgb(full, light, 0.12);
  }

  bright = gainRgb(bright, profile.lightGain);
  return Object.freeze({
    background: gainRgb(dark, profile.effect === "UNDERWATER" ? 0.74 : 0.9),
    dark,
    full,
    light: bright,
  });
}
