import { bac_mono, ferr_458, procar } from "./upstream/configurations.ts";
import inventory from "./source-inventory.json" with { type: "json" };

const sources = new Map(inventory.audio.map(asset => [asset.source.replace(/^public\//, ""), asset]));
const make = (id, label, configuration, shifts) => Object.freeze({
  id, label, configuration, ...shifts,
  assets: Object.entries(configuration.sounds).map(([role, sound]) => ({ ...sound, role, ...sources.get(sound.source) })),
});
// Shift thresholds and durations are project tuning seeds, not measured Tesla state.
export const ENGINE_PROFILES = Object.freeze([
  make("mono", "Mono", bac_mono, { up: 8100, down: 2600, kickdown: 6100, duration: 0.24 }),
  make("rosso", "Rosso", ferr_458, { up: 8150, down: 2900, kickdown: 6500, duration: 0.20 }),
  make("touring", "Touring", procar, { up: 8200, down: 2700, kickdown: 6300, duration: 0.30 }),
]);
export function engineProfile(id) {
  const found = ENGINE_PROFILES.find(profile => profile.id === id);
  if (!found) throw new RangeError("Unknown Engine profile");
  return found;
}
