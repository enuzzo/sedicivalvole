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

const GROOVE_VARIANTS = Object.freeze({
  85: [1, 4, 5, 6],
  95: [1, 3, 5, 7, 2, 4],
  110: [1, 3, 5, 2, 4, 6],
  120: [1, 3, 5, 2, 4, 6],
  130: [1, 3, 5, 2, 4, 6],
  140: [1, 3, 5, 2, 4, 6],
});

export function nightshiftPerformanceFrames(bpm, sampleRate = 48000) {
  return Math.round((60 / bpm) * 4 * NIGHTSHIFT_BARS_PER_PERFORMANCE * sampleRate);
}

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

export function nightshiftDrumCells(bpm, take) {
  const variants = GROOVE_VARIANTS[bpm];
  if (!variants) throw new Error(`NIGHTSHIFT has no ${bpm} BPM drum family`);
  const offset = (Math.max(1, take) - 1) * 2;
  return [0, 1, 2, 3].map((cell) => ({
    role: cell === 3 && take > 1 ? "fill" : "groove",
    variant: cell === 3 && take > 1
      ? ((take + Math.floor(bpm / 10)) % (bpm === 95 ? 4 : 6)) + 1
      : variants[(cell + offset) % variants.length],
  }));
}

export const NIGHTSHIFT_ARRANGEMENT = Object.freeze(
  NIGHTSHIFT_STATES.flatMap((state) => Array.from({ length: NIGHTSHIFT_TAKES }, (_, index) => ({
    ...state,
    take: index + 1,
    performanceId: `${state.id}-${index + 1}`,
    harmonicIdentity: NIGHTSHIFT_HARMONIC_IDENTITY,
    drumCells: nightshiftDrumCells(state.bpm, index + 1),
  }))),
);
