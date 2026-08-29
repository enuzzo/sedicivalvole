import {
  NIGHTSHIFT_BARS_PER_PERFORMANCE,
  NIGHTSHIFT_HARMONIC_IDENTITY,
  NIGHTSHIFT_HARMONY,
  NIGHTSHIFT_STATES,
  NIGHTSHIFT_TAKES,
} from "../src/nightshift-model.js";

export {
  NIGHTSHIFT_BARS_PER_PERFORMANCE,
  NIGHTSHIFT_HARMONIC_IDENTITY,
  NIGHTSHIFT_HARMONY,
  NIGHTSHIFT_STATES,
  NIGHTSHIFT_TAKES,
  nightshiftStateForSpeed,
} from "../src/nightshift-model.js";

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
