import { ROAD_SPEED_CEILING_KMH } from "../../signal-model.js";

export const PRTCL_SOURCE_COMMIT = "2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060";

export const PRTCL_TYPES = Object.freeze({
  frequency: Object.freeze({
    id: "frequency",
    label: "FRACTAL",
    fullLabel: "Fractal Frequency",
    particleCount: 24000,
    pointSize: 0.43,
  }),
  murmuration: Object.freeze({
    id: "murmuration",
    label: "MURMURATION",
    fullLabel: "Murmuration",
    particleCount: 16000,
    pointSize: 0.57,
  }),
  axiom: Object.freeze({
    id: "axiom",
    label: "AXIOM",
    fullLabel: "Axiom",
    particleCount: 37000,
    pointSize: 0.93,
  }),
});

export const DEFAULT_PRTCL_SETTINGS = Object.freeze({ type: "frequency" });

const TYPE_IDS = Object.freeze(Object.keys(PRTCL_TYPES));

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

export function normalizePrtclSettings(value) {
  return {
    type: TYPE_IDS.includes(value?.type) ? value.type : DEFAULT_PRTCL_SETTINGS.type,
  };
}

export function nextPrtclTypeId(typeId) {
  const index = TYPE_IDS.indexOf(typeId);
  if (index < 0) return DEFAULT_PRTCL_SETTINGS.type;
  return TYPE_IDS[(index + 1) % TYPE_IDS.length];
}

/**
 * PRTCL keeps the two live signals independent. Road speed owns scale, depth,
 * and travel; the score meter owns only colour animation and luminous pulse.
 * The three macro effects then reshape that authored response without adding a
 * generic intensity slider to the driving surface.
 */
export function prtclMotionProfile({
  speedKmh = 0,
  audioLevel = 0,
  effect = null,
  reducedMotion = false,
} = {}) {
  const roadEnergy = clamp(speedKmh, 0, ROAD_SPEED_CEILING_KMH) / ROAD_SPEED_CEILING_KMH;
  const colourEnergy = reducedMotion ? 0 : clamp(audioLevel);
  const underwater = effect === "UNDERWATER";
  const open = effect === "OPEN";
  const bloom = effect === "BLOOM";
  const motionScale = underwater ? 0.46 : open ? 1.08 : 1;

  return {
    roadEnergy,
    colourEnergy,
    pointScale: 0.82 + roadEnergy * 0.66,
    depthScale: (0.86 + roadEnergy * 0.36) * (open ? 1.08 : underwater ? 0.92 : 1),
    travelRate: reducedMotion ? 0 : (0.42 + roadEnergy * 1.34) * motionScale,
    pulse: reducedMotion ? 0 : colourEnergy * (bloom ? 1.28 : underwater ? 0.58 : 1),
    brightness: bloom ? 1.34 : underwater ? 0.72 : open ? 1.08 : 1,
    spreadScale: open ? 1.1 : underwater ? 0.95 : 1,
    bloom: bloom ? 1 : 0,
    underwater: underwater ? 1 : 0,
  };
}
