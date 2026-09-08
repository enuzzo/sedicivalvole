import { engineProfile } from './profiles.js';

export const COMPARISON_ROUTE_ID = 'urban-road-return-v1';
export const COMPARISON_SECONDS = 68;
export const COMPARISON_CALIBRATIONS = Object.freeze({ A: 'Reference · 08:34', B: 'Refined · 11:02' });
const points = [[0,0],[3,0],[7,20],[11,20],[13,30],[18,30],[20,40],[24,40],
  [30,80],[35,80],[40,100],[44,100],[49,130],[54,130],[64,0],[68,0]];
export function comparisonSpeed(seconds) {
  const time = Math.max(0, Math.min(COMPARISON_SECONDS, Number.isFinite(seconds) ? seconds : 0));
  const index = points.findIndex(([at]) => at >= time);
  if (index <= 0) return points[0][1];
  const [a, start] = points[index - 1], [b, end] = points[index];
  return start + (end - start) * (time - a) / (b - a);
}
const earlier = {
  mono: { up: 29, down: 22, mix: .78, level: .72 },
  rosso: { up: 28, down: 21 }, touring: { up: 28, down: 21 },
  otto: { up: 27, down: 20, mix: 1.6, level: .86 },
  cinque: { up: 29, down: 22, mix: 1.7, level: 1.05 },
  turbine: { up: 29, down: 22, mix: 1.8 },
};
const earlierAcoustics = Object.freeze({ pipeFeedback: .54, pipeFeedbackStep: .09,
  intakeFeedback: .43, direct: .2, returns: [.55,.3,.2], intakeReturn: .32,
  bladeBase: .07, bladeRange: .08, bladeDrift: 0, bladeAmplitudeDrift: 0, compressor: .065 });
/** Frozen original 0834 calibration; donor source/WAVs remain shared and unchanged. */
export function comparisonProfile(id, calibration) {
  const profile = engineProfile(id);
  if (calibration === 'B') return profile;
  if (calibration !== 'A') throw new RangeError('Unknown listening calibration');
  const old = earlier[id];
  const replaceSecond = (array, value) => array.map((entry, i) => i === 1 ? value : entry);
  return { ...profile, sampleBlend: 'reference',
    upshiftKmh: old.up ? replaceSecond(profile.upshiftKmh, old.up) : profile.upshiftKmh,
    downshiftKmh: old.down ? replaceSecond(profile.downshiftKmh, old.down) : profile.downshiftKmh,
    loadHoldKmh: replaceSecond(profile.loadHoldKmh, 5),
    voice: profile.voice ? { ...profile.voice, mix: old.mix, ...(old.level ? { level: old.level } : {}), acoustics: earlierAcoustics } : null };
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
    sourceCalibrations: { A: "d1beea3", B: "b524cd4" },
    listenedSeconds: Object.fromEntries(['A','B'].map(key => [key, Math.max(0,Math.min(68, Number(listened[key]) || 0))])),
    build, sampleRate, levels: 'Original calibration levels; not loudness matched', coordinates: 'Not collected' };
}
