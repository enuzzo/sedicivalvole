import { ROAD_SPEED_CEILING_KMH } from "../../signal-model.js";
import {
  advanceResponse,
  audioMacroAmount,
  createResponseDefinition,
} from "../../response-mapping.js";

export const PRTCL_SOURCE_COMMIT = "2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060";
export const PRTCL_POINT_SCALE_CEILING_KMH = 100;

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
const PRTCL_MACRO_IDS = Object.freeze(["open", "underwater", "bloom"]);
export const PRTCL_MACRO_ATTACK_SECONDS = 0.18;
export const PRTCL_MACRO_RELEASE_SECONDS = 0.64;

export function createPrtclMacroResponse({
  attackSeconds = PRTCL_MACRO_ATTACK_SECONDS,
  releaseSeconds = PRTCL_MACRO_RELEASE_SECONDS,
} = {}) {
  return createResponseDefinition({
    input: [0, 1],
    output: [0, 1],
    attackSeconds,
    releaseSeconds,
  });
}

const DEFAULT_PRTCL_MACRO_RESPONSE = createPrtclMacroResponse();

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

export function prtclMacroTargets({ effect = null, macroSnapshot = null } = {}) {
  const hasSnapshot = macroSnapshot != null;
  return Object.freeze(PRTCL_MACRO_IDS.map((macroId) => (
    hasSnapshot
      ? audioMacroAmount(macroSnapshot, macroId)
      : effect === macroId.toUpperCase() ? 1 : 0
  )));
}

export function createPrtclMacroTransitionState(capturedAtMs = 0) {
  return Object.freeze({
    value: Object.freeze([0, 0, 0]),
    target: Object.freeze([0, 0, 0]),
    capturedAtMs,
  });
}

export function advancePrtclMacroTransition(
  previousState,
  targets,
  capturedAtMs,
  response = DEFAULT_PRTCL_MACRO_RESPONSE,
) {
  const safeTargets = Array.from(targets ?? [], (value) => clamp(value));
  const target = safeTargets.length === PRTCL_MACRO_IDS.length
    ? safeTargets
    : [0, 0, 0];
  // The shared response mapper accepts one scalar input, while PRTCL needs
  // three independent macro targets. Advance each dimension against the same
  // attack/release mechanics and retain one compact vector state.
  const current = Array.from(previousState?.value ?? [0, 0, 0]);
  const previousAt = Number(previousState?.capturedAtMs) || 0;
  const now = Math.max(previousAt, Number(capturedAtMs) || 0);
  const values = current.map((value, index) => {
    return advanceResponse(
      response,
      { value, target: value, capturedAtMs: previousAt },
      target[index],
      now,
    ).value;
  });
  return Object.freeze({
    value: Object.freeze(values),
    target: Object.freeze(target),
    capturedAtMs: now,
  });
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
  macroSnapshot = null,
  macroAmounts = null,
  reducedMotion = false,
} = {}) {
  const roadEnergy = clamp(speedKmh, 0, ROAD_SPEED_CEILING_KMH) / ROAD_SPEED_CEILING_KMH;
  const pointScaleEnergy = clamp(speedKmh, 0, PRTCL_POINT_SCALE_CEILING_KMH)
    / PRTCL_POINT_SCALE_CEILING_KMH;
  const colourEnergy = reducedMotion ? 0 : clamp(audioLevel);
  const [open, underwater, bloom] = macroAmounts == null
    ? prtclMacroTargets({ effect, macroSnapshot })
    : Array.from(macroAmounts, (value) => clamp(value));
  const motionScale = 1 + open * 0.08 - underwater * 0.54;

  return {
    roadEnergy,
    colourEnergy,
    pointScale: 0.82 + pointScaleEnergy * 0.66,
    formScale: 0.68 + pointScaleEnergy * 0.47,
    depthScale: (0.86 + roadEnergy * 0.36) * (1 + open * 0.08 - underwater * 0.08),
    travelRate: reducedMotion ? 0 : (0.42 + roadEnergy * 1.34) * motionScale,
    pulse: reducedMotion ? 0 : colourEnergy * (1 + bloom * 0.28 - underwater * 0.42),
    brightness: 1 + bloom * 0.34 - underwater * 0.28 + open * 0.08,
    spreadScale: 1 + open * 0.1 - underwater * 0.05,
    bloom,
    underwater,
  };
}
