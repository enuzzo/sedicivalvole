// The score library.
//
// Data only, in the same shape as `flux-environments.js`: one entry per musical
// direction, naming the score module that performs it. Adding a score never
// touches the speed, energy, safety, persistence or diagnostic contracts every
// score shares.
//
// `status` is the honest part of this file. `ready` means an authored score
// exists and the entry can be selected; `preparing` means the direction is
// planned and its rhythmic family is known, but nothing plays yet. The
// interface must never present a `preparing` entry as active — the project rule
// is explicit that an unimplemented genre may not be labelled as playing.
//
// The families below are the ones the ported textStep pattern library actually
// covers, so each of them has a real starting point rather than a wish.

export const SCORE_STATUS = Object.freeze({
  ready: "ready",
  preparing: "preparing",
});

export const SCORE_GENRES = [
  {
    id: "junction",
    label: "JUNCTION",
    number: "01",
    family: "Jungle / Rave",
    status: SCORE_STATUS.preparing,
    score: null,
    note: "Sampled breaks. Tempo is a recording, never a stretch.",
  },
  {
    id: "fracture",
    label: "FRACTURE",
    number: "02",
    family: "Jungle / Drum & Bass",
    status: SCORE_STATUS.ready,
    /** Resolved by the worklet to an authored score module. */
    score: "fracture",
    note: "Ten melodies, four voices. Half-time at rest.",
  },
  {
    id: "meridian-pulse",
    label: "PULSE",
    number: "03",
    family: "Techno",
    status: SCORE_STATUS.preparing,
    score: null,
    note: "Four to the floor, dub chords, long filter arcs.",
  },
  {
    id: "cutwater",
    label: "CUTWATER",
    number: "04",
    family: "Breakbeat / Electro",
    status: SCORE_STATUS.preparing,
    score: null,
    note: "Broken kick, wide claps, machine funk.",
  },
  {
    id: "lowtide",
    label: "LOWTIDE",
    number: "05",
    family: "Dub Techno",
    status: SCORE_STATUS.preparing,
    score: null,
    note: "Sparse, deep, everything through the delay.",
  },
  {
    id: "nightcast",
    label: "NIGHTCAST",
    number: "06",
    family: "Downtempo",
    status: SCORE_STATUS.preparing,
    score: null,
    note: "Slow shuffle for traffic and night roads.",
  },
  {
    id: "stillwater",
    label: "STILLWATER",
    number: "07",
    family: "Ambient",
    status: SCORE_STATUS.preparing,
    score: null,
    note: "No percussion. Harmony and space only.",
  },
];

/**
 * The score that plays when nothing is chosen.
 *
 * This is deliberately not the first entry. JUNCTION leads the library because
 * it is the direction the project is heading, but the default has to be a score
 * that actually plays, and `readyScoreGenres` is the list the interface offers.
 */
export const DEFAULT_GENRE_ID = "fracture";

export function getScoreGenre(genreId) {
  return SCORE_GENRES.find((genre) => genre.id === genreId)
    ?? SCORE_GENRES.find((genre) => genre.id === DEFAULT_GENRE_ID);
}

export function isScoreReady(genreId) {
  return getScoreGenre(genreId).status === SCORE_STATUS.ready;
}

/** Only a ready score may be selected, so this never returns a silent one. */
export function readyScoreGenres() {
  return SCORE_GENRES.filter((genre) => genre.status === SCORE_STATUS.ready);
}

export function preparingScoreGenres() {
  return SCORE_GENRES.filter((genre) => genre.status === SCORE_STATUS.preparing);
}
