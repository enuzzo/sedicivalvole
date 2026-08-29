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

/**
 * How a score makes its sound.
 *
 * `generative` is synthesised from nothing at runtime: every note is computed,
 * so the arrangement can be reshaped without limit. `sampled` is built from
 * recorded material, which brings a realism synthesis cannot reach and a
 * fixed vocabulary in exchange.
 *
 * The two are genuinely different products to listen to, and a listener
 * choosing between them should be told which is which rather than having to
 * work it out.
 */
export const SCORE_SOURCE = Object.freeze({
  generative: "generative",
  sampled: "sampled",
});

/** Short labels and marks for the two kinds, for the interface to render. */
export const SCORE_SOURCE_LABEL = Object.freeze({
  generative: { label: "GENERATIVE", mark: "◇", note: "Synthesised live" },
  sampled: { label: "SAMPLED", mark: "◆", note: "Built from recordings" },
});

export const SCORE_GENRES = [
  {
    id: "junction",
    label: "JUNCTION",
    number: "01",
    family: "Jungle / Breakbeat",
    source: SCORE_SOURCE.sampled,
    status: SCORE_STATUS.ready,
    score: "junction",
    note: "24 complete performances · one coherent harmonic identity.",
  },
  {
    id: "fracture",
    label: "FRACTURE",
    number: "02",
    family: "Jungle / Drum & Bass",
    source: SCORE_SOURCE.generative,
    status: SCORE_STATUS.ready,
    /** Resolved by the worklet to an authored score module. */
    score: "fracture",
    note: "Atmosphere, harmony, low end and rhythm. No automatic lead.",
  },
  {
    id: "nightshift",
    label: "NIGHTSHIFT",
    number: "03",
    family: "Synth-pop / 1980s",
    source: SCORE_SOURCE.sampled,
    status: SCORE_STATUS.ready,
    score: "nightshift",
    note: "18 complete performances · native 85–140 BPM drum families.",
  },
  {
    id: "cutwater",
    label: "CUTWATER",
    number: "04",
    family: "Breakbeat / Electro",
    source: SCORE_SOURCE.generative,
    status: SCORE_STATUS.preparing,
    score: null,
    note: "Broken kick, wide claps, machine funk.",
  },
  {
    id: "lowtide",
    label: "LOWTIDE",
    number: "05",
    family: "Dub Techno",
    source: SCORE_SOURCE.generative,
    status: SCORE_STATUS.preparing,
    score: null,
    note: "Sparse, deep, everything through the delay.",
  },
  {
    id: "nightcast",
    label: "NIGHTCAST",
    number: "06",
    family: "Downtempo",
    source: SCORE_SOURCE.generative,
    status: SCORE_STATUS.preparing,
    score: null,
    note: "Slow shuffle for traffic and night roads.",
  },
  {
    id: "stillwater",
    label: "STILLWATER",
    number: "07",
    family: "Ambient",
    source: SCORE_SOURCE.generative,
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

/** The label, mark and one-line note for how a score makes its sound. */
export function scoreSource(genreId) {
  return SCORE_SOURCE_LABEL[getScoreGenre(genreId).source] ?? SCORE_SOURCE_LABEL.generative;
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
