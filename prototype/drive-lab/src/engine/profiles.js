import { bac_mono, ferr_458, procar } from "./upstream/configurations.ts";
import inventory from "./source-inventory.json" with { type: "json" };

const sources = new Map(inventory.audio.map(asset => [asset.source.replace(/^public\//, ""), asset]));
// Entertainment gearing, calibrated to road speeds rather than donor-car ratios.
const UPSHIFT_KMH = Object.freeze([35, 65, 90, 112, 132]);
const DOWNSHIFT_KMH = Object.freeze([26, 50, 73, 94, 112]);
const make = (id, label, configuration, shifts) => {
  const finalDrive = configuration.drivetrain.final_drive ?? 3.44;
  const gears = [...UPSHIFT_KMH, 165].map(speed => shifts.up * 60 * 2 * Math.PI * .25 / (speed * 1000 * finalDrive));
  return Object.freeze({
    id, label, ...shifts, upshiftKmh: UPSHIFT_KMH, downshiftKmh: DOWNSHIFT_KMH,
    configuration: { ...configuration, drivetrain: { ...configuration.drivetrain, final_drive: finalDrive, gears } },
    assets: Object.entries(configuration.sounds).map(([role, sound]) => ({ ...sound, role, ...sources.get(sound.source) })),
  });
};
// Shift thresholds and durations are project tuning seeds, not measured Tesla state.
export const ENGINE_PROFILES = Object.freeze([
  make("mono", "Mono", bac_mono, { up: 8100, kickdown: 6100, duration: 0.24 }),
  make("rosso", "Rosso", ferr_458, { up: 8150, kickdown: 6500, duration: 0.20 }),
  make("touring", "Touring", procar, { up: 8200, kickdown: 6300, duration: 0.30 }),
]);
export function engineProfile(id) {
  const found = ENGINE_PROFILES.find(profile => profile.id === id);
  if (!found) throw new RangeError("Unknown Engine profile");
  return found;
}
