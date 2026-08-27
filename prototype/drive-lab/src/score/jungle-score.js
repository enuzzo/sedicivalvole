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
// Note names are MIDI numbers. The theme and its response are absolute pitches
// in the key; only the bass lanes are written as offsets above the chord root,
// and only using intervals that are chord tones in every chord of the cycle.

import { drumParams } from "./dsp/drum-voices.js";
import { lanePattern } from "./patterns.js";
import { synthParams, WAVEFORM } from "./dsp/synth-voice.js";

export const SCORE_ID = "fracture";
export const SCORE_LABEL = "FRACTURE";
export const SCORE_GENRE = "Jungle / Drum & Bass";

/**
 * Harmonic cycle: i7 - i9 - VImaj7 - IIImaj7 over four bars, in F minor.
 *
 * Every chord is drawn from F natural minor and nothing leaves the key. That is
 * not conservatism: it is the property that lets one fixed theme sit consonantly
 * over the whole cycle without being transposed. The third chord was originally
 * voiced as Ab7, whose Gb is the one note in the cycle outside the key, and it
 * fought the theme every time it came round.
 *
 * Bass roots stay inside one octave so the low end never leaps.
 */
export const HARMONY = Object.freeze([
  { bar: 0, name: "Fm7", bassMidi: 29, colour: [0, 3, 7, 10] },
  { bar: 1, name: "Fm9", bassMidi: 29, colour: [0, 3, 7, 14] },
  { bar: 2, name: "Dbmaj7", bassMidi: 25, colour: [0, 4, 7, 11] },
  { bar: 3, name: "Abmaj7", bassMidi: 32, colour: [0, 4, 7, 11] },
]);

export function harmonyForBar(barInPhrase) {
  return HARMONY[((barInPhrase % HARMONY.length) + HARMONY.length) % HARMONY.length];
}

/**
 * The principal theme, written as absolute MIDI in F natural minor.
 *
 * It is deliberately *not* transposed by the chord. F, Ab, C, Eb and G are chord
 * tones or consonant extensions of all four chords in the cycle — the fifth and
 * ninth of Dbmaj7, the sixth and thirteenth of Abmaj7 — so one fixed line reads
 * as written material over the whole progression rather than as a shape being
 * dragged around underneath it.
 *
 * This replaces a transposition that was applied twice. The chord root was
 * already carried by `bassMidi`, and a second `rootOffset` moved the theme again
 * on top of it. Over Dbmaj7 the theme played A-C-E-G against Db-F-Ab-C, a
 * semitone clash on two voices at once; over the next chord it played B-D-F#-A
 * against Ab-C-Eb-G. It did not sound like a choice. It was arithmetic.
 *
 * `at` is the step, `midi` the note, `steps` the length in steps.
 */
export const THEME = Object.freeze([
  { at: 0, midi: 65, steps: 3 },   // F4  — stated
  { at: 6, midi: 63, steps: 2 },   // Eb4
  { at: 10, midi: 60, steps: 4 },  // C4  — settles
  { at: 16, midi: 68, steps: 3 },  // Ab4 — the leap, and the hook
  { at: 22, midi: 67, steps: 2 },  // G4
  { at: 26, midi: 63, steps: 4 },  // Eb4 — hangs into the repeat
]);

/**
 * The countermelody that answers the theme in the fullest scene. It lands in the
 * theme's gaps, an octave above, on the same safe degrees.
 */
export const RESPONSE = Object.freeze([
  { at: 4, midi: 72, steps: 2 },   // C5
  { at: 14, midi: 68, steps: 2 },  // Ab4
  { at: 20, midi: 75, steps: 2 },  // Eb5
  { at: 28, midi: 72, steps: 3 },  // C5
]);

/**
 * Sub-bass placement: the root, landing with the kick and rearticulated.
 *
 * Four long notes across two bars held the pitch but had no rhythm of their own,
 * so the low end read as a drone the kick happened to interrupt. These land on
 * and around the kick, and the short ones between them are what make the bass
 * roll instead of sit.
 */
export const SUB_NOTES = Object.freeze([
  { at: 0, steps: 7 },
  { at: 10, steps: 4 },
  { at: 14, steps: 2 },
  { at: 16, steps: 6 },
  { at: 24, steps: 3 },
  { at: 28, steps: 4 },
]);

/**
 * Reese movement, as semitones above the chord root.
 *
 * Only the root, the fifth and the octave appear. All three are chord tones in
 * every chord of the cycle, so this line can transpose with the harmony and stay
 * consonant — which the theme cannot, and is why the theme does not.
 *
 * Two held notes per pattern gave the detune room to churn but gave the piece no
 * bass line at all. This is a bass line.
 */
export const REESE_NOTES = Object.freeze([
  { at: 0, offset: 0, steps: 6 },
  { at: 8, offset: 0, steps: 3 },
  { at: 12, offset: 7, steps: 3 },
  { at: 16, offset: 0, steps: 6 },
  { at: 24, offset: 12, steps: 3 },
  { at: 28, offset: 7, steps: 3 },
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
    filter: 0.5, drive: 0.24, decay: 0.42, volume: 0.8,
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
    // A pure sine at F1 is inaudible on anything but a large speaker. A quiet
    // square at the same pitch adds odd harmonics an octave and a fifth up, so
    // the note is *heard* on a dashboard speaker while the weight stays where it
    // belongs. The attack is short enough to land with the kick, not after it.
    osc1Waveform: WAVEFORM.sine, osc1Level: 0.95, osc1Tune: 0.5,
    osc2Waveform: WAVEFORM.square, osc2Level: 0.20, osc2Tune: 0.5, osc2Detune: 0.5,
    subLevel: 0,
    ampAttack: 0.004, ampDecay: 0.42, ampSustain: 0.88, ampRelease: 0.18,
    filterCutoff: 0.3, filterResonance: 0.08, filterEnvAmount: 0.06,
    volume: 0.78,
  }),
  reese: synthParams({
    // Two detuned saws beating against each other: the churn is the point.
    osc1Waveform: WAVEFORM.saw, osc1Level: 0.5, osc1Tune: 0.5, osc1Pwm: 0.35,
    osc2Waveform: WAVEFORM.saw, osc2Level: 0.5, osc2Tune: 0.5, osc2Detune: 0.62,
    subWaveform: 1, subLevel: 0.45,
    // Faster attack and a shorter decay, because this now plays a riff rather
    // than two held notes and every rearticulation has to be audible as one.
    ampAttack: 0.012, ampDecay: 0.3, ampSustain: 0.72, ampRelease: 0.16,
    filterEnvAttack: 0.02, filterEnvDecay: 0.34, filterEnvSustain: 0.3,
    filterCutoff: 0.34, filterResonance: 0.34, filterEnvAmount: 0.24,
    filterKeyFollow: 0.1, volume: 0.56,
  }),
  riff: synthParams({
    osc1Waveform: WAVEFORM.square, osc1Level: 0.6, osc1Pwm: 0.32,
    osc2Waveform: WAVEFORM.saw, osc2Level: 0.35, osc2Detune: 0.54,
    ampAttack: 0.0, ampDecay: 0.32, ampSustain: 0.45, ampRelease: 0.28,
    filterEnvAttack: 0.0, filterEnvDecay: 0.28, filterEnvSustain: 0.2,
    filterCutoff: 0.5, filterResonance: 0.24, filterEnvAmount: 0.3,
    filterKeyFollow: 0.25, volume: 0.54,
  }),
  response: synthParams({
    osc1Waveform: WAVEFORM.saw, osc1Level: 0.55, osc1Pwm: 0.5,
    osc2Level: 0,
    ampAttack: 0.02, ampDecay: 0.3, ampSustain: 0.3, ampRelease: 0.35,
    filterCutoff: 0.62, filterResonance: 0.18, filterEnvAmount: 0.22,
    volume: 0.36,
  }),
  atmosphere: synthParams({
    osc1Waveform: WAVEFORM.saw, osc1Level: 0.45, osc1Pwm: 0.7,
    osc2Waveform: WAVEFORM.saw, osc2Level: 0.4, osc2Detune: 0.56,
    ampAttack: 0.55, ampDecay: 0.7, ampSustain: 0.75, ampRelease: 0.8,
    filterCutoff: 0.34, filterResonance: 0.1, filterEnvAmount: 0.06,
    volume: 0.30,
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
