import { bac_mono, ferr_458, procar } from "./upstream/configurations.ts";
import inventory from "./source-inventory.json" with { type: "json" };
import { VIRTUAL_WHEEL_RADIUS_M } from "./gearbox.js";
import { COMBUSTION_ENGINES } from "./combustion/engines.js";

const sources = new Map(inventory.audio.map(asset => [asset.source.replace(/^public\//, ""), asset]));
const road = (gears, finalDrive, upshiftKmh, downshiftKmh, loadHoldKmh) => Object.freeze({
  gears: Object.freeze(gears), finalDrive, upshiftKmh: Object.freeze(upshiftKmh),
  downshiftKmh: Object.freeze(downshiftKmh), loadHoldKmh: Object.freeze(loadHoldKmh),
});
// Original sporting road transmissions. Ratios stay fixed as speed/load change;
// unlike the retired map, first gear is not forced to reach redline at 35 km/h.
// These are acoustic instruments, not measured or replicated donor-car gearboxes.
const ROAD_TRANSMISSIONS = Object.freeze({
  mono: road([3.75, 2.65, 1.95, 1.47, 1.32, 1.14], 4.1, [18, 38, 58, 96, 124], [12, 31, 47, 83, 108], [4, 2, 12, 14, 6]),
  rosso: road([3.6, 2.55, 1.92, 1.48, 1.3, 1.14], 4.3, [18, 38, 57, 96, 124], [12, 31, 46, 83, 108], [4, 2, 12, 14, 6]),
  touring: road([3.7, 2.6, 1.9, 1.45, 1.26, 1.08], 3.75, [17, 37, 55, 96, 123], [11, 30, 45, 83, 108], [4, 2, 12, 14, 7]),
  otto: road([3.6, 2.5, 1.82, 1.38, 1.2, 1.05], 3.4, [16, 36, 54, 94, 121], [10, 29, 43, 81, 105], [4, 2, 12, 14, 9]),
  cinque: road([3.7, 2.6, 1.92, 1.46, 1.29, 1.11], 3.9, [17, 38, 56, 96, 123], [11, 31, 45, 83, 107], [4, 2, 12, 14, 7]),
});
// September 24 voicing: measured against the donor loops' narrow spectra
// (see voicing.js). Retired profiles stay neutral.
const VOICINGS = Object.freeze({
  mono: Object.freeze({ lowShelfHz: 100, lowShelfDb: 2, midHz: 320, midQ: 0.9, midDb: -1.5, presenceHz: 2600, presenceQ: 0.8, presenceDb: 2,
    air: 0.12, body: 0.18, bodyOrders: Object.freeze({ 1: 0.06, 2: 0.35, 4: 1, 8: 0.3 }), trimDb: 3 }),
  rosso: Object.freeze({ lowShelfHz: 120, lowShelfDb: 4, midHz: 520, midQ: 0.9, midDb: -2, presenceHz: 2500, presenceQ: 0.8, presenceDb: 1,
    air: 0.12, body: 0.14, bodyOrders: Object.freeze({ 2: 0.06, 4: 0.35, 8: 1, 16: 0.25 }), trimDb: 2 }),
  touring: Object.freeze({ lowShelfHz: 120, lowShelfDb: 3, midHz: 460, midQ: 1, midDb: -3.5, presenceHz: 3000, presenceQ: 0.8, presenceDb: 3,
    air: 0.12, body: 0.15, bodyOrders: Object.freeze({ 2: 0.05, 3: 0.3, 6: 1, 12: 0.25 }), trimDb: 3 }),
});
// Voice gain bringing the combustion synthesizer near the published loop level.
const COMBUSTION_MIX = 6; // +15.6 dB: road-route acceleration near Rosso, peaks about -3.5 dBFS (Nov 6)
const make = (id, label, configuration, shifts, voice = null, roadScale = 1) => {
  const transmission = ROAD_TRANSMISSIONS[id] ?? ROAD_TRANSMISSIONS.mono;
  return Object.freeze({
    id, label, ...shifts, voice, textureLevel: 1, voicing: VOICINGS[id] ?? null,
    crossover: id === "touring" ? [2600, 5700] : id === "rosso" ? [3900, 7300] : [2600, 5900],
    upshiftKmh: transmission.upshiftKmh, downshiftKmh: transmission.downshiftKmh, loadHoldKmh: transmission.loadHoldKmh,
    configuration: { ...configuration, drivetrain: { ...configuration.drivetrain,
      final_drive: transmission.finalDrive * roadScale, gears: transmission.gears, wheelRadiusM: VIRTUAL_WHEEL_RADIUS_M } },
    assets: Object.entries(configuration.sounds).map(([role, sound]) => ({ ...sound, role, ...sources.get(sound.source) })),
  });
};
// Shift thresholds and durations are project tuning seeds, not measured Tesla state.
export const ENGINE_PROFILES = Object.freeze([
  make("mono", "Mono", bac_mono, { up: 8100, kickdown: 6100, duration: 0.24 },
    { cylinders: 4, banks: [0, 1, 0, 1], pressureHz: 112, pipeSeconds: [.0037, .0061, .0091], level: .72, mix: .48 }),
  make("rosso", "Rosso", ferr_458, { up: 8150, kickdown: 6500, duration: 0.20 }),
  make("touring", "Touring", procar, { up: 8200, kickdown: 6300, duration: 0.30 }),
  make("otto", "Otto", { ...bac_mono, sounds: {}, engine: { ...bac_mono.engine, limiter: 6800, soft_limiter: 6700, inertia: 1.3 } },
    { up: 6100, kickdown: 4300, duration: .36, powertrain: { shiftReleaseFraction: .25 } },
    { cylinders: 8, banks: [0, 1, 0, 0, 1, 0, 1, 1], pressureHz: 76, pulseSeconds: .0048, pipeSeconds: [.0063, .0107, .0159], cutoffHz: 1450, level: 1, mix: 1.6 }),
  make("cinque", "Cinque", { ...bac_mono, sounds: {}, engine: { ...bac_mono.engine, limiter: 7400, soft_limiter: 7300, inertia: .9 } },
    { up: 6700, kickdown: 4800, duration: .23, boost: { enabled: true, thresholdRpm: 1900, fullRpm: 4400 } },
    { cylinders: 5, banks: [0, 0, 0, 0, 0], pressureHz: 135, pulseSeconds: .0032, pipeSeconds: [.0031, .0057, .0083], cutoffHz: 2400, turbo: true, spoolSeconds: .82, level: 1.2, mix: 1.7 }),
  make("turbine", "Turbine", { ...bac_mono, sounds: {}, engine: { ...bac_mono.engine, limiter: 9000, soft_limiter: 8900 } },
    { up: 8000, kickdown: 5000, duration: .3, singleSpeed: true, boost: { enabled: true, thresholdRpm: 600, fullRpm: 8000 } },
    { turbine: true, spoolSeconds: 1.8, mix: 1.8 }),
  ...combustionVoices(),
]);
// November 6 combustion voices: the original physically informed synthesizer
// (./combustion). Fully procedural (no recordings), neutral voicing; public since
// the owner's November 7 decision to test them on the road.
function combustionVoices() {
  return Object.entries(COMBUSTION_ENGINES).map(([engine, spec]) => make(engine, spec.label,
    { ...bac_mono, sounds: {}, engine: { ...bac_mono.engine, idle: spec.idleRpm, limiter: spec.limiterRpm, soft_limiter: spec.limiterRpm - 100,
      inertia: spec.firing.length >= 8 ? 1.15 : 1 } },
    { up: Math.round(spec.redlineRpm * 0.93), kickdown: Math.round(spec.redlineRpm * 0.68), duration: spec.forced ? 0.24 : 0.2,
      // Upshifts cut torque, not the throttle: no overrun, pops or re-engagement bark mid-shift.
      powertrain: { upshiftLoadHold: 0.5 },
      ...(spec.forced?.type === "turbo" ? { boost: { enabled: true, thresholdRpm: 1900, fullRpm: Math.round(spec.redlineRpm * 0.6) } } : {}) },
    { model: "combustion", engine, mix: COMBUSTION_MIX }, combustionRoadScale(spec)));
}
// November 7: the shared road table put every architecture at the same rpm for a
// given speed, so a 9,000 rpm flat-plane never sang above ~5,700 rpm on the road
// and a 6,500 rpm pushrod V8 cruised at 77 % of its range. Scaling the final drive
// with the redline moves each engine toward the same *fraction* of its own range.
// The bounds keep the owner's September road contract in absolute rpm: 20-40 km/h
// stay at or below 3,000 rpm (second at 30 km/h <= 2,800; 3,700 flat out at 40) and 80 km/h starts at
// 3,500 rpm or more.
export function combustionRoadScale(spec) {
  return Math.min(1.025, Math.max(0.88, spec.redlineRpm / 8000));
}
export function engineProfile(id) {
  const found = ENGINE_PROFILES.find(profile => profile.id === id);
  if (!found) throw new RangeError("Unknown Engine profile");
  return found;
}
