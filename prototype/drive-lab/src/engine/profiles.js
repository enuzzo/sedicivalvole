import { bac_mono, ferr_458, procar } from "./upstream/configurations.ts";
import inventory from "./source-inventory.json" with { type: "json" };
import { VIRTUAL_WHEEL_RADIUS_M } from "./gearbox.js";

const sources = new Map(inventory.audio.map(asset => [asset.source.replace(/^public\//, ""), asset]));
const road = (gears, finalDrive, upshiftKmh, downshiftKmh, loadHoldKmh) => Object.freeze({
  gears: Object.freeze(gears), finalDrive, upshiftKmh: Object.freeze(upshiftKmh),
  downshiftKmh: Object.freeze(downshiftKmh), loadHoldKmh: Object.freeze(loadHoldKmh),
});
// Original sporting road transmissions. Ratios stay fixed as speed/load change;
// unlike the retired map, first gear is not forced to reach redline at 35 km/h.
// These are acoustic instruments, not measured or replicated donor-car gearboxes.
const ROAD_TRANSMISSIONS = Object.freeze({
  mono: road([3.75, 2.65, 1.95, 1.47, 1.32, 1.14], 4.1, [18, 29, 58, 96, 124], [12, 22, 47, 83, 108], [4, 5, 12, 14, 6]),
  rosso: road([3.6, 2.55, 1.92, 1.48, 1.3, 1.14], 4.3, [18, 28, 57, 96, 124], [12, 21, 46, 83, 108], [4, 5, 12, 14, 6]),
  touring: road([3.7, 2.6, 1.9, 1.45, 1.26, 1.08], 3.75, [17, 28, 55, 96, 123], [11, 21, 45, 83, 108], [4, 5, 12, 14, 7]),
  otto: road([3.6, 2.5, 1.82, 1.38, 1.2, 1.05], 3.4, [16, 27, 54, 94, 121], [10, 20, 43, 81, 105], [4, 5, 12, 14, 9]),
  cinque: road([3.7, 2.6, 1.92, 1.46, 1.29, 1.11], 3.9, [17, 29, 56, 96, 123], [11, 22, 45, 83, 107], [4, 5, 12, 14, 7]),
});
const make = (id, label, configuration, shifts, voice = null) => {
  const transmission = ROAD_TRANSMISSIONS[id] ?? ROAD_TRANSMISSIONS.mono;
  return Object.freeze({
    id, label, ...shifts, voice, textureLevel: 1,
    crossover: id === "touring" ? [2600, 5700] : id === "rosso" ? [3900, 7300] : [2600, 5900],
    upshiftKmh: transmission.upshiftKmh, downshiftKmh: transmission.downshiftKmh, loadHoldKmh: transmission.loadHoldKmh,
    configuration: { ...configuration, drivetrain: { ...configuration.drivetrain,
      final_drive: transmission.finalDrive, gears: transmission.gears, wheelRadiusM: VIRTUAL_WHEEL_RADIUS_M } },
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
