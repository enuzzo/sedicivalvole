import {
  SOUNDTRACK_MANUAL_EFFECT_IDS,
  SOUNDTRACK_VEHICLE_MACROS,
} from "./playback-boundary.js";

const clamp01 = (value) => Number.isFinite(value)
  ? Math.min(1, Math.max(0, value))
  : 0;

const normalizedValues = (ids, values = {}) => Object.freeze(Object.fromEntries(
  ids.map((id) => [id, clamp01(values[id])]),
));

const perceptualFrequencySweep = (startHz, endHz, amount) => (
  startHz * ((endHz / startHz) ** clamp01(amount))
);

export const normalizeSoundtrackVehicleMacros = (values = {}) => normalizedValues(
  SOUNDTRACK_VEHICLE_MACROS,
  values,
);

export const normalizeSoundtrackManualEffects = (values = {}) => normalizedValues(
  SOUNDTRACK_MANUAL_EFFECT_IDS,
  values,
);

export function soundtrackEffectParameters({
  vehicleMaster = false,
  vehicleMacros = {},
  manualEffects = {},
} = {}) {
  const vehicle = normalizeSoundtrackVehicleMacros(vehicleMacros);
  const manual = normalizeSoundtrackManualEffects(manualEffects);
  const open = vehicleMaster ? vehicle.open : 0;
  const underwater = vehicleMaster ? vehicle.underwater : 0;
  return Object.freeze({
    vehicle,
    manual,
    openScoopDb: -7.5 * open,
    openAirDb: 6.5 * open,
    openFocusGain: 0.32 * open,
    // Filter frequency is perceived logarithmically. A linear-Hz sweep left
    // the 0.4 badge threshold near 11 kHz, which looked active in the vehicle
    // while remaining effectively inaudible over road noise.
    underwaterCutoffHz: perceptualFrequencySweep(18_000, 520, underwater),
    underwaterResonance: 0.7 + underwater * 3.8,
    flangerWet: manual.flanger * 0.42,
    flangerDelaySeconds: 0.0018 + manual.flanger * 0.0028,
    chorusWet: manual.chorus * 0.4,
    chorusDelaySeconds: 0.012 + manual.chorus * 0.01,
    reverbWet: manual.reverb * 0.46,
    beatRepeat: manual["beat-repeat"],
    bloom: vehicleMaster ? vehicle.bloom : 0,
  });
}
