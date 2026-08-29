export const NIGHTSHIFT_BARS_PER_PERFORMANCE = 8;
export const NIGHTSHIFT_TAKES = 3;
export const NIGHTSHIFT_HARMONIC_IDENTITY = "amin-neon-road";

export const NIGHTSHIFT_HARMONY = Object.freeze([
  { id: "amin9", bars: 2, root: 45, notes: [57, 60, 64, 67, 71] },
  { id: "cmaj7", bars: 2, root: 48, notes: [60, 64, 67, 71] },
  { id: "emin7", bars: 2, root: 40, notes: [55, 59, 62, 64] },
  { id: "g6-amin9", bars: 1, root: 43, notes: [55, 59, 62, 64] },
  { id: "amin9-return", bars: 1, root: 45, notes: [57, 60, 64, 67, 71] },
]);

export const NIGHTSHIFT_STATES = Object.freeze([
  { id: "glide", bpm: 85, enterKmh: 3, exitKmh: 1.5, drum: 0.22, bass: 0, arp: 0, lead: 0, space: 0.72 },
  { id: "cruise", bpm: 95, enterKmh: 22, exitKmh: 18, drum: 0.27, bass: 0.16, arp: 0.04, lead: 0, space: 0.64 },
  { id: "motion", bpm: 110, enterKmh: 48, exitKmh: 42, drum: 0.31, bass: 0.20, arp: 0.09, lead: 0, space: 0.52 },
  { id: "drive", bpm: 120, enterKmh: 82, exitKmh: 74, drum: 0.34, bass: 0.23, arp: 0.14, lead: 0.025, space: 0.42 },
  { id: "chase", bpm: 130, enterKmh: 105, exitKmh: 96, drum: 0.37, bass: 0.25, arp: 0.18, lead: 0.045, space: 0.34 },
  { id: "limit", bpm: 140, enterKmh: 123, exitKmh: 114, drum: 0.39, bass: 0.27, arp: 0.22, lead: 0.065, space: 0.28 },
]);

export function nightshiftStateForSpeed(speedKmh, previousId = null) {
  const speed = Math.max(0, Number(speedKmh) || 0);
  if (speed < NIGHTSHIFT_STATES[0].enterKmh) return null;
  const previousIndex = NIGHTSHIFT_STATES.findIndex(({ id }) => id === previousId);
  if (previousIndex >= 0 && speed >= NIGHTSHIFT_STATES[previousIndex].exitKmh) {
    let nextIndex = previousIndex;
    while (nextIndex + 1 < NIGHTSHIFT_STATES.length
      && speed >= NIGHTSHIFT_STATES[nextIndex + 1].enterKmh) nextIndex += 1;
    return NIGHTSHIFT_STATES[nextIndex];
  }
  let selected = NIGHTSHIFT_STATES[0];
  for (const state of NIGHTSHIFT_STATES) {
    if (speed >= state.enterKmh) selected = state;
  }
  return selected;
}
