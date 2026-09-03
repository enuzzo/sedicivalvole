import {
  SOUNDTRACK_VEHICLE_MACROS,
} from "./playback-boundary.js";
import {
  manualEffectParameters,
  normalizeManualEffects,
} from "../manual-effects-graph.js";
import { underwaterEffectParameters } from "../underwater-model.js";

const clamp01 = (value) => Number.isFinite(value)
  ? Math.min(1, Math.max(0, value))
  : 0;

const normalizedValues = (ids, values = {}) => Object.freeze(Object.fromEntries(
  ids.map((id) => [id, clamp01(values[id])]),
));

export const normalizeSoundtrackVehicleMacros = (values = {}) => normalizedValues(
  SOUNDTRACK_VEHICLE_MACROS,
  values,
);

export const normalizeSoundtrackManualEffects = normalizeManualEffects;

export function soundtrackEffectParameters({
  vehicleMaster = false,
  vehicleMacros = {},
  manualEffects = {},
} = {}) {
  const vehicle = normalizeSoundtrackVehicleMacros(vehicleMacros);
  const manual = normalizeSoundtrackManualEffects(manualEffects);
  const underwater = vehicleMaster ? vehicle.underwater : 0;
  const underwaterParameters = underwaterEffectParameters(underwater);
  const manualParameters = manualEffectParameters(manual);
  return Object.freeze({
    vehicle,
    manual,
    underwaterDepth: underwaterParameters.depth,
    underwaterCutoffHz: underwaterParameters.cutoffHz,
    underwaterSecondCutoffHz: underwaterParameters.secondCutoffHz,
    underwaterResonance: underwaterParameters.q,
    underwaterSecondResonance: underwaterParameters.secondQ,
    underwaterPressureFrequencyHz: underwaterParameters.pressureFrequencyHz,
    underwaterPressureGainDb: underwaterParameters.pressureGainDb,
    underwaterMakeupGain: underwaterParameters.makeupGain,
    ...manualParameters,
  });
}
