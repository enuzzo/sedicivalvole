import { bac_mono, ferr_458, procar } from "./upstream/configurations.ts";
import inventory from "./source-inventory.json" with { type: "json" };

const sources = new Map(inventory.audio.map(asset => [asset.source.replace(/^public\//, ""), asset]));
// Entertainment gearing, calibrated to road speeds rather than donor-car ratios.
const UPSHIFT_KMH = Object.freeze([35, 65, 90, 112, 132]);
const DOWNSHIFT_KMH = Object.freeze([26, 50, 73, 94, 112]);
const make = (id, label, configuration, shifts, voice = null) => {
  const finalDrive = configuration.drivetrain.final_drive ?? 3.44;
  const gears = [...UPSHIFT_KMH, 165].map(speed => shifts.up * 60 * 2 * Math.PI * .25 / (speed * 1000 * finalDrive));
  return Object.freeze({
    id, label, ...shifts, voice, textureLevel: 1,
    crossover: id === "touring" ? [2600, 5700] : id === "rosso" ? [3900, 7300] : [2600, 5900],
    upshiftKmh: UPSHIFT_KMH, downshiftKmh: DOWNSHIFT_KMH,
    configuration: { ...configuration, drivetrain: { ...configuration.drivetrain, final_drive: finalDrive, gears } },
    assets: Object.entries(configuration.sounds).map(([role, sound]) => ({ ...sound, role, ...sources.get(sound.source) })),
  });
};
// Shift thresholds and durations are project tuning seeds, not measured Tesla state.
export const ENGINE_PROFILES = Object.freeze([
  make("mono", "Mono", bac_mono, { up: 8100, kickdown: 6100, duration: 0.24 },
    { cylinders: 4, banks: [0, 1, 0, 1], pressureHz: 112, pipeSeconds: [.0037, .0061, .0091], level: .72, mix: .78 }),
  make("rosso", "Rosso", ferr_458, { up: 8150, kickdown: 6500, duration: 0.20 }),
  make("touring", "Touring", procar, { up: 8200, kickdown: 6300, duration: 0.30 }),
  make("otto", "Otto", { ...bac_mono, sounds: {}, engine: { ...bac_mono.engine, limiter: 6800, soft_limiter: 6700, inertia: 1.3 } },
    { up: 6100, kickdown: 4300, duration: .36, powertrain: { shiftReleaseFraction: .25 } },
    { cylinders: 8, banks: [0, 1, 0, 0, 1, 0, 1, 1], pressureHz: 76, pulseSeconds: .0048, pipeSeconds: [.0063, .0107, .0159], cutoffHz: 1450, level: .86, mix: 1.6 }),
  make("cinque", "Cinque", { ...bac_mono, sounds: {}, engine: { ...bac_mono.engine, limiter: 7400, soft_limiter: 7300, inertia: .9 } },
    { up: 6700, kickdown: 4800, duration: .23, boost: { enabled: true, thresholdRpm: 1900, fullRpm: 4400 } },
    { cylinders: 5, banks: [0, 0, 0, 0, 0], pressureHz: 135, pulseSeconds: .0032, pipeSeconds: [.0031, .0057, .0083], cutoffHz: 2400, turbo: true, spoolSeconds: .82, level: 1.05, mix: 1.7 }),
  make("turbine", "Turbine", { ...bac_mono, sounds: {}, engine: { ...bac_mono.engine, limiter: 9000, soft_limiter: 8900 } },
    { up: 8000, kickdown: 5000, duration: .3, singleSpeed: true, boost: { enabled: true, thresholdRpm: 600, fullRpm: 8000 } },
    { turbine: true, spoolSeconds: 1.8, mix: 1.8 }),
]);
export function engineProfile(id) {
  const found = ENGINE_PROFILES.find(profile => profile.id === id);
  if (!found) throw new RangeError("Unknown Engine profile");
  return found;
}
