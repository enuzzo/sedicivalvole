// FRACTURE — the first authored Flux score.
//
// Original sedicivalvole composition. It is one piece in F minor with a fixed
// harmonic cycle and a fixed principal theme; the arranger changes how that
// piece is performed, never which piece is playing.
//
// The rhythmic vocabulary follows the Drum & Bass and Jungle pattern families in
// illobo/textStep at commit cb107d198b730db60cff4a87c7fd5b8d1fae3fb2 — two-step
// snare placement, syncopated kick, offbeat open hats, sixteenth ghost fields.
// The step encoding is upstream's. The patterns, kit voicings, harmony and theme
// below are written for this project. Upstream preset families named after
// specific commercial records are deliberately not carried across.
//
// Note names are MIDI numbers. Melodic lanes are written as semitone offsets
// above the current chord root, so transposing the harmony carries the theme
// with it and the motif stays recognisable in every scene.

import { drumParams } from "./dsp/drum-voices.js";
import { lanePattern } from "./patterns.js";
import { synthParams, WAVEFORM } from "./dsp/synth-voice.js";

export const SCORE_ID = "fracture";
export const SCORE_LABEL = "FRACTURE";
export const SCORE_GENRE = "Jungle / Drum & Bass";

/**
 * Harmonic cycle: i - i - VI - III over four bars, in F minor.
 *
 * Bass roots are chosen inside one octave so the low end never leaps, and the
 * cycle repeats through every scene. This is the harmonic identity the brief
 * requires to survive at all speeds.
 */
export const HARMONY = Object.freeze([
  { bar: 0, name: "Fm", bassMidi: 29, rootOffset: 0, colour: [0, 3, 7, 10] },
  { bar: 1, name: "Fm", bassMidi: 29, rootOffset: 0, colour: [0, 3, 7, 14] },
  { bar: 2, name: "Db", bassMidi: 25, rootOffset: -4, colour: [0, 4, 7, 11] },
  { bar: 3, name: "Ab", bassMidi: 32, rootOffset: 3, colour: [0, 4, 7, 10] },
]);

export function harmonyForBar(barInPhrase) {
  return HARMONY[((barInPhrase % HARMONY.length) + HARMONY.length) % HARMONY.length];
}

/**
 * The principal theme. Six notes across two bars, deliberately sparse so it
 * stays singable and recognisable when everything around it changes.
 *
 * `at` is the step, `offset` is semitones above the chord root, `steps` is the
 * note length in steps.
 */
export const THEME = Object.freeze([
  { at: 0, offset: 0, steps: 3 },
  { at: 6, offset: 3, steps: 2 },
  { at: 10, offset: 7, steps: 4 },
  { at: 16, offset: 10, steps: 3 },
  { at: 22, offset: 7, steps: 2 },
  { at: 26, offset: 3, steps: 4 },
]);

/** The countermelody that answers the theme in the fullest scene. */
export const RESPONSE = Object.freeze([
  { at: 4, offset: 15, steps: 2 },
  { at: 14, offset: 12, steps: 2 },
  { at: 20, offset: 19, steps: 2 },
  { at: 28, offset: 15, steps: 3 },
]);

/** Sub-bass placement: the root, landing with the kick and holding. */
export const SUB_NOTES = Object.freeze([
  { at: 0, steps: 8 },
  { at: 10, steps: 6 },
  { at: 20, steps: 5 },
  { at: 26, steps: 6 },
]);

/** Reese movement: two long notes per pattern, so the detune has room to churn. */
export const REESE_NOTES = Object.freeze([
  { at: 0, offset: 0, steps: 14 },
  { at: 16, offset: 0, steps: 14 },
]);

/**
 * Percussion patterns, in the upstream 32-step hex encoding.
 *
 * The kick is syncopated rather than four-to-the-floor; the snare is the
 * two-step on the fifth and thirteenth sixteenth of each bar; the ghost field
 * is what gives the break its internal motion.
 */
export const PATTERNS = Object.freeze({
  kick: lanePattern({ hits: "80200820" }),
  snare: lanePattern({ hits: "08080808", ghosts: "23232323", ghostVelocity: 0.34 }),
  breakDetail: lanePattern({ hits: "23232323", velocity: 0.55 }),
  closedHatEighths: lanePattern({ hits: "aaaaaaaa", velocity: 0.7 }),
  closedHatSixteenths: lanePattern({ hits: "ffffffff", velocity: 0.55 }),
  openHat: lanePattern({ hits: "02020202", velocity: 0.6 }),
  clap: lanePattern({ hits: "00080008", velocity: 0.5 }),
  /** A one-bar fill used only to announce a scene climb. */
  fillSnare: lanePattern({ hits: "0000000f", velocity: 0.8 }),
});

/** Drum voicings. Tight, bright and dry: the genre lives on transient detail. */
export const KIT = Object.freeze({
  kick: drumParams({
    tune: 0.24, sweep: 0.42, color: 0.22, snap: 0.62, shape: 0.34,
    filter: 0.5, drive: 0.24, decay: 0.42, volume: 0.9,
  }),
  snare: drumParams({
    tune: 0.46, sweep: 0.3, color: 0.52, snap: 0.78, shape: 0.4,
    filter: 0.34, drive: 0.2, decay: 0.3, volume: 0.72,
  }),
  ghost: drumParams({
    tune: 0.44, sweep: 0.2, color: 0.62, snap: 0.35, shape: 0.3,
    filter: 0.5, drive: 0.12, decay: 0.16, volume: 0.4,
  }),
  closedHat: drumParams({
    tune: 0.55, sweep: 0.35, color: 0.4, snap: 0.5, shape: 0.4,
    filter: 0.62, drive: 0.1, decay: 0.14, volume: 0.34,
  }),
  openHat: drumParams({
    tune: 0.42, sweep: 0.55, color: 0.35, snap: 0.4, shape: 0.35,
    filter: 0.55, drive: 0.1, decay: 0.34, volume: 0.28,
  }),
  clap: drumParams({
    tune: 0.4, sweep: 0.6, color: 0.3, snap: 0.7, shape: 0.5,
    filter: 0.45, drive: 0.15, decay: 0.28, volume: 0.34,
  }),
});

/** Synth voicings. */
export const SYNTHS = Object.freeze({
  sub: synthParams({
    osc1Waveform: WAVEFORM.sine, osc1Level: 0.95, osc1Tune: 0.5,
    osc2Level: 0, subLevel: 0,
    ampAttack: 0.02, ampDecay: 0.5, ampSustain: 0.85, ampRelease: 0.25,
    filterCutoff: 0.22, filterResonance: 0.05, filterEnvAmount: 0.04,
    volume: 0.62,
  }),
  reese: synthParams({
    // Two detuned saws beating against each other: the churn is the point.
    osc1Waveform: WAVEFORM.saw, osc1Level: 0.5, osc1Tune: 0.5, osc1Pwm: 0.35,
    osc2Waveform: WAVEFORM.saw, osc2Level: 0.5, osc2Tune: 0.5, osc2Detune: 0.62,
    subWaveform: 1, subLevel: 0.45,
    ampAttack: 0.06, ampDecay: 0.45, ampSustain: 0.8, ampRelease: 0.3,
    filterEnvAttack: 0.1, filterEnvDecay: 0.5, filterEnvSustain: 0.35,
    filterCutoff: 0.34, filterResonance: 0.32, filterEnvAmount: 0.16,
    filterKeyFollow: 0.1, volume: 0.4,
  }),
  riff: synthParams({
    osc1Waveform: WAVEFORM.square, osc1Level: 0.6, osc1Pwm: 0.32,
    osc2Waveform: WAVEFORM.saw, osc2Level: 0.35, osc2Detune: 0.54,
    ampAttack: 0.0, ampDecay: 0.32, ampSustain: 0.45, ampRelease: 0.28,
    filterEnvAttack: 0.0, filterEnvDecay: 0.28, filterEnvSustain: 0.2,
    filterCutoff: 0.5, filterResonance: 0.24, filterEnvAmount: 0.3,
    filterKeyFollow: 0.25, volume: 0.34,
  }),
  response: synthParams({
    osc1Waveform: WAVEFORM.saw, osc1Level: 0.55, osc1Pwm: 0.5,
    osc2Level: 0,
    ampAttack: 0.02, ampDecay: 0.3, ampSustain: 0.3, ampRelease: 0.35,
    filterCutoff: 0.62, filterResonance: 0.18, filterEnvAmount: 0.22,
    volume: 0.22,
  }),
  atmosphere: synthParams({
    osc1Waveform: WAVEFORM.saw, osc1Level: 0.45, osc1Pwm: 0.7,
    osc2Waveform: WAVEFORM.saw, osc2Level: 0.4, osc2Detune: 0.56,
    ampAttack: 0.55, ampDecay: 0.7, ampSustain: 0.75, ampRelease: 0.8,
    filterCutoff: 0.34, filterResonance: 0.1, filterEnvAmount: 0.06,
    volume: 0.2,
  }),
});

/**
 * Half-time reading of the same material.
 *
 * In the resting scenes the transport still runs at its usual tempo; the score
 * simply plays the theme at doubled note lengths and takes only the strong
 * placements of each pattern. That is what makes a standstill sound slow without
 * the clock being slow, and it is why a return to speed is a change of
 * interpretation rather than a change of piece.
 */
export function halfTimeStep(step) {
  return step % 2 === 0;
}

export const SCORE = Object.freeze({
  id: SCORE_ID,
  label: SCORE_LABEL,
  genre: SCORE_GENRE,
  harmony: HARMONY,
  theme: THEME,
  response: RESPONSE,
  subNotes: SUB_NOTES,
  reeseNotes: REESE_NOTES,
  patterns: PATTERNS,
  kit: KIT,
  synths: SYNTHS,
});
