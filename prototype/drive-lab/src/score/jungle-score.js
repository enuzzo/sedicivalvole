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
 * The form: six four-bar sections, played in order and then repeated.
 *
 * One four-bar cycle repeating forever was the whole piece, and it wore out
 * inside a minute. These six are complementary rather than contrasting — every
 * chord is drawn from F natural minor, so nothing modulates and the piece keeps
 * one identity — but each section has its own harmonic motion and its own
 * theme, and twenty-four bars pass before anything repeats.
 *
 * `colour` is the chord above the bass, in semitones above `bassMidi`. Bass
 * roots stay inside one octave so the low end never leaps between sections.
 *
 * Each section carries its own theme because a single fixed line cannot be
 * interesting over six different harmonic motions. What each theme *can* do is
 * stay written in the key and sit consonantly over its own four chords, which
 * is checked by `tests/score-harmony.test.mjs` rather than by ear.
 */
const F_MINOR = Object.freeze([0, 2, 3, 5, 7, 8, 10]);

/** Chord shapes, as semitones above the chord's own root. */
const MINOR_7 = [0, 3, 7, 10];
const MINOR_9 = [0, 3, 7, 14];
const MINOR_11 = [0, 3, 10, 17];
const MAJOR_7 = [0, 4, 7, 11];
const MAJOR_9 = [0, 4, 11, 14];
// The seventh degree of a natural minor key takes a dominant seventh, not a
// major one: Eb with a natural seventh sounds D, the one note outside F minor.
const DOMINANT_7 = [0, 4, 7, 10];
// A sixth rather than a major seventh on the third degree: the theme states Ab
// in the octave directly above where the major seventh lands, and a root a
// semitone over its own leading tone is harsh in that register. The sixth is
// the softer colour and the clash disappears.
const MAJOR_6 = [0, 4, 7, 9];
const DOMINANT_9 = [0, 4, 10, 14];
// Suspended: the fourth replaces the third. The theme states Ab over this
// chord, and Ab is the classic avoid note a minor ninth above a dominant's
// third. Suspending it turns the problem note into the chord's own colour.
const SUS_9 = [0, 5, 10, 14];
// A shell: root, third and seventh, with the fifth left out entirely. Voiced in
// the middle the flattened fifth sat a semitone under the theme's C, and voiced
// an octave up it sat a minor ninth above it. The chord's function comes from
// the bass and the third; the fifth was only ever beating against the tune.
const HALF_DIM = [0, 3, 10, 15];

export const SECTIONS = Object.freeze([
  {
    id: "home",
    name: "HOME",
    // i - i - VI - III. The statement.
    // Voiced as a seventh, not a ninth: the theme's Ab sits a semitone above
    // where the ninth would land, and the theme supplies that colour itself.
    harmony: [
      { name: "Fm7", bassMidi: 29, colour: MINOR_7 },
      { name: "Fm7", bassMidi: 29, colour: MINOR_7 },
      { name: "Dbmaj7", bassMidi: 25, colour: MAJOR_7 },
      { name: "Ab6", bassMidi: 32, colour: MAJOR_6 },
    ],
    theme: [
      { at: 0, midi: 65, steps: 3 },   // F4  — stated
      { at: 6, midi: 63, steps: 2 },   // Eb4
      { at: 10, midi: 60, steps: 4 },  // C4  — settles
      { at: 16, midi: 68, steps: 3 },  // Ab4 — the leap, and the hook
      { at: 22, midi: 67, steps: 2 },  // G4
      { at: 26, midi: 63, steps: 4 },  // Eb4 — hangs into the repeat
    ],
    response: [
      { at: 4, midi: 72, steps: 2 },
      { at: 14, midi: 68, steps: 2 },
      { at: 20, midi: 75, steps: 2 },
      { at: 28, midi: 72, steps: 3 },
    ],
  },
  {
    id: "lift",
    name: "LIFT",
    // III - VII - VI - i. The same material, opened upward.
    harmony: [
      { name: "Ab6", bassMidi: 32, colour: MAJOR_6 },
      { name: "Eb9sus4", bassMidi: 27, colour: SUS_9 },
      { name: "Dbmaj7", bassMidi: 25, colour: MAJOR_7 },
      { name: "Fm11", bassMidi: 29, colour: MINOR_11 },
    ],
    theme: [
      { at: 0, midi: 68, steps: 4 },   // Ab4
      { at: 8, midi: 70, steps: 2 },   // Bb4
      { at: 12, midi: 72, steps: 4 },  // C5  — climbs where HOME fell
      { at: 18, midi: 70, steps: 2 },  // Bb4
      { at: 22, midi: 68, steps: 3 },  // Ab4
      { at: 28, midi: 65, steps: 4 },  // F4
    ],
    response: [
      { at: 4, midi: 75, steps: 2 },
      { at: 16, midi: 77, steps: 3 },
      { at: 26, midi: 72, steps: 3 },
    ],
  },
  {
    id: "turn",
    name: "TURN",
    // iv - VII - III - VI. Falling fourths: the most liquid motion in the form.
    harmony: [
      { name: "Bbm11", bassMidi: 34, colour: MINOR_11 },
      { name: "Eb9sus4", bassMidi: 27, colour: SUS_9 },
      { name: "Ab6", bassMidi: 32, colour: MAJOR_6 },
      { name: "Dbmaj7", bassMidi: 25, colour: MAJOR_7 },
    ],
    theme: [
      { at: 0, midi: 70, steps: 3 },   // Bb4
      { at: 6, midi: 72, steps: 3 },   // C5
      { at: 12, midi: 75, steps: 4 },  // Eb5 — the high point of the form
      { at: 18, midi: 72, steps: 2 },  // C5
      { at: 22, midi: 68, steps: 3 },  // Ab4
      { at: 28, midi: 70, steps: 4 },  // Bb4
    ],
    response: [
      { at: 4, midi: 79, steps: 2 },
      { at: 14, midi: 77, steps: 2 },
      { at: 24, midi: 75, steps: 4 },
    ],
  },
  {
    id: "dark",
    name: "DARK",
    // i - VI - ii(half-diminished) - v. The half-diminished is the shadow.
    harmony: [
      { name: "Fm11", bassMidi: 29, colour: MINOR_11 },
      { name: "Dbmaj7", bassMidi: 25, colour: MAJOR_7 },
      { name: "Gm7", bassMidi: 31, colour: HALF_DIM },
      { name: "Cm7", bassMidi: 24, colour: MINOR_7 },
    ],
    theme: [
      { at: 0, midi: 63, steps: 4 },   // Eb4
      { at: 8, midi: 60, steps: 3 },   // C4
      { at: 12, midi: 58, steps: 4 },  // Bb3 — the form's lowest statement
      { at: 18, midi: 65, steps: 2 },  // F4  — one lift before the fall
      { at: 22, midi: 60, steps: 3 },  // C4
      { at: 28, midi: 53, steps: 4 },  // F3  — the form's floor
    ],
    response: [
      { at: 6, midi: 70, steps: 2 },
      { at: 16, midi: 67, steps: 3 },
      { at: 26, midi: 63, steps: 4 },
    ],
  },
  {
    id: "open",
    name: "OPEN",
    // VI - VII - i - i, with the tonic suspended. The widest air in the piece.
    harmony: [
      { name: "Dbmaj9", bassMidi: 25, colour: MAJOR_9 },
      { name: "Eb9sus4", bassMidi: 27, colour: SUS_9 },
      { name: "Fm11", bassMidi: 29, colour: MINOR_11 },
      { name: "Fm11", bassMidi: 29, colour: MINOR_11 },
    ],
    theme: [
      { at: 0, midi: 72, steps: 6 },   // C5 — held, almost still
      { at: 10, midi: 70, steps: 4 },  // Bb4
      { at: 16, midi: 68, steps: 6 },  // Ab4
      { at: 26, midi: 70, steps: 5 },  // Bb4
    ],
    response: [
      { at: 8, midi: 77, steps: 3 },
      { at: 22, midi: 75, steps: 5 },
    ],
  },
  {
    id: "return",
    name: "RETURN",
    // v - VI - VII - i. The cadence that hands the form back to HOME.
    harmony: [
      { name: "Cm7", bassMidi: 24, colour: MINOR_7 },
      { name: "Dbmaj7", bassMidi: 25, colour: MAJOR_7 },
      { name: "Eb9sus4", bassMidi: 27, colour: SUS_9 },
      { name: "Fm11", bassMidi: 29, colour: MINOR_11 },
    ],
    // The line climbs F-G-Bb-C. It does not pass through Ab, which would land a
    // minor ninth above the fifth of the chord it opens on.
    theme: [
      { at: 0, midi: 65, steps: 3 },   // F4
      { at: 6, midi: 67, steps: 3 },   // G4
      { at: 12, midi: 70, steps: 3 },  // Bb4
      { at: 18, midi: 72, steps: 4 },  // C5
      { at: 24, midi: 68, steps: 2 },  // Ab4
      { at: 28, midi: 65, steps: 4 },  // F4 — home
    ],
    response: [
      { at: 4, midi: 75, steps: 2 },
      { at: 14, midi: 72, steps: 3 },
      { at: 26, midi: 77, steps: 4 },
    ],
  },
]);

export const BARS_PER_SECTION = 4;

/** Scale degrees of the key, exported so the harmony test can check the form. */
export const KEY_ROOT_PITCH_CLASS = 5;
export const KEY_SCALE = F_MINOR;

export function sectionAt(sectionIndex) {
  const count = SECTIONS.length;
  return SECTIONS[((sectionIndex % count) + count) % count];
}

export function harmonyForBar(sectionIndex, barInSection) {
  const section = sectionAt(sectionIndex);
  const bars = section.harmony.length;
  return section.harmony[((barInSection % bars) + bars) % bars];
}

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
  { at: 0, degree: "root", steps: 6 },
  { at: 8, degree: "root", steps: 3 },
  { at: 12, degree: "fifth", steps: 3 },
  { at: 16, degree: "root", steps: 6 },
  { at: 24, degree: "octave", steps: 3 },
  { at: 28, degree: "fifth", steps: 3 },
]);

/**
 * Resolves a bass degree against a chord.
 *
 * The fifth is read from the chord rather than assumed to be seven semitones,
 * because the half-diminished chord in DARK has a flattened one and a natural
 * fifth over it is a semitone clash. Naming the degree instead of the interval
 * is what makes that impossible to get wrong in a new section.
 */
export function bassInterval(chord, degree) {
  if (degree === "octave") return 12;
  if (degree !== "fifth") return 0;
  const fifth = chord.colour.find((interval) => {
    const semitone = ((interval % 12) + 12) % 12;
    return semitone === 6 || semitone === 7;
  });
  return fifth === undefined ? 0 : ((fifth % 12) + 12) % 12;
}

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
  sections: SECTIONS,
  barsPerSection: BARS_PER_SECTION,
  subNotes: SUB_NOTES,
  reeseNotes: REESE_NOTES,
  patterns: PATTERNS,
  kit: KIT,
  synths: SYNTHS,
});
