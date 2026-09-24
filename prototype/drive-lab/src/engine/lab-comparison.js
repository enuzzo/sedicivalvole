import { engineProfile } from './profiles.js';

export const COMPARISON_ROUTE_ID = 'urban-road-return-v1';
export const COMPARISON_SECONDS = 68;
// September 24: A is the previous public sound (Refined, neutral voicing) and B
// the full-body voicing now published. Both share the same route, ratios and
// motion response; only the voicing differs, so the comparison isolates it.
export const COMPARISON_CALIBRATIONS = Object.freeze({ A: 'Refined · 11:02', B: 'Full body · 24.09' });
const points = [[0,0],[3,0],[7,20],[11,20],[13,30],[18,30],[20,40],[24,40],
  [30,80],[35,80],[40,100],[44,100],[49,130],[54,130],[64,0],[68,0]];
export function comparisonSpeed(seconds) {
  const time = Math.max(0, Math.min(COMPARISON_SECONDS, Number.isFinite(seconds) ? seconds : 0));
  const index = points.findIndex(([at]) => at >= time);
  if (index <= 0) return points[0][1];
  const [a, start] = points[index - 1], [b, end] = points[index];
  return start + (end - start) * (time - a) / (b - a);
}
/** A is the earlier refined voicing; B is the published full-body default. */
export function comparisonProfile(id, calibration) {
  const profile = engineProfile(id);
  if (calibration === 'B') return profile;
  if (calibration !== 'A') throw new RangeError('Unknown listening calibration');
  return { ...profile, voicing: null };
}

export const COMPARISON_STORAGE_KEY = 'sedicivalvole.engine-listening.v1';
export function readComparisonNotes(storage) {
  try {
    const saved = JSON.parse(storage.getItem(COMPARISON_STORAGE_KEY));
    return Array.isArray(saved) ? saved.filter(note => note?.schema === 'engine-listening.v1'
      && typeof note.id === 'string' && typeof note.profile === 'string'
      && ['A','B','tie'].includes(note.preference) && typeof note.note === 'string'
      && note.note.length <= 4000).slice(-60) : [];
  } catch { return []; }
}
export function makeComparisonNote({ profile, preference, note, listened, build, sampleRate, now = new Date() }) {
  if (!['A','B','tie'].includes(preference)) throw new Error('Choose a preference before saving.');
  engineProfile(profile);
  return { schema: 'engine-listening.v1', id: now.toISOString(), profile, preference,
    note: String(note).slice(0,4000), route: COMPARISON_ROUTE_ID, calibrations: COMPARISON_CALIBRATIONS,
    sourceCalibrations: { A: "b524cd4", B: "full-body.v1" },
    listenedSeconds: Object.fromEntries(['A','B'].map(key => [key, Math.max(0,Math.min(68, Number(listened[key]) || 0))])),
    build, sampleRate, levels: 'Original calibration levels; not loudness matched', coordinates: 'Not collected' };
}
