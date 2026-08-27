import assert from "node:assert/strict";
import test from "node:test";
import {
  BARS_PER_SECTION,
  bassInterval,
  harmonyForBar,
  KEY_ROOT_PITCH_CLASS,
  KEY_SCALE,
  REESE_NOTES,
  SECTIONS,
  sectionAt,
  SYNTHS,
} from "../src/score/jungle-score.js";

const NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const pitchClass = (midi) => ((midi % 12) + 12) % 12;
const name = (midi) => `${NAMES[pitchClass(midi)]}${Math.floor(midi / 12) - 1}`;

/** Pitch classes of the key, as absolute 0..11. */
const KEY_PITCH_CLASSES = new Set(
  KEY_SCALE.map((degree) => pitchClass(KEY_ROOT_PITCH_CLASS + degree)),
);

/** Pitch classes a chord actually sounds. */
function chordPitchClasses(chord) {
  return new Set(chord.colour.map((interval) => pitchClass(chord.bassMidi + interval))
    .concat(pitchClass(chord.bassMidi)));
}

/**
 * The chord as it is actually voiced, in absolute MIDI.
 *
 * Comparing pitch classes is the wrong test and rejects good writing: G against
 * a Dbmaj7 is a sharp eleventh, which is the characteristic colour of that
 * chord, and it only becomes a clash if the two notes are next to each other in
 * the same register. What matters is the interval between the notes as played.
 */
function chordVoicing(chord) {
  return [chord.bassMidi, ...chord.colour.map((interval) => chord.bassMidi + 24 + interval)];
}

/**
 * True when a melody note forms a minor second or a minor ninth against a note
 * of the chord as voiced. Those two intervals are the clash; a minor ninth above
 * the chord's own root is the one traditional exception and is not used here.
 */
function clashesWith(midi, chord) {
  return chordVoicing(chord).some((tone) => {
    const distance = Math.abs(midi - tone);
    return distance === 1 || distance === 13;
  });
}

test("the form is ten complementary sections, not one cycle repeating", () => {
  // Ten melodies rather than six: at a phrase each, a driver hears forty bars
  // before anything comes round again, which is the difference between a form
  // and a refrain.
  assert.ok(SECTIONS.length >= 10, "the form needs about ten melodies");
  const ids = SECTIONS.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length, "section identifiers must be unique");

  // Sections must genuinely differ. Comparing the harmony as written catches a
  // section that was duplicated and renamed.
  const shapes = SECTIONS.map((section) => section.harmony.map((chord) => (
    `${chord.bassMidi}:${chord.colour.join(",")}`
  )).join("|"));
  assert.equal(new Set(shapes).size, shapes.length, "two sections share a harmony");

  const themes = SECTIONS.map((section) => section.theme.map((note) => note.midi).join(","));
  assert.equal(new Set(themes).size, themes.length, "two sections share a theme");
});

test("the theme changes instrument as well as melody across the form", () => {
  // Ten melodies on one timbre is still one long tune.
  const voices = SECTIONS.map((section) => section.riffVoice);
  for (const voice of voices) {
    assert.ok(voice, "every section must name the voice its theme is played on");
    assert.ok(
      Object.hasOwn(SYNTHS, voice),
      `${voice} is named by a section but is not a declared patch`,
    );
  }
  assert.ok(
    new Set(voices).size >= 3,
    `the form uses only ${new Set(voices).size} timbres for ten melodies`,
  );
});

test("every section is four bars and declares a theme and a response", () => {
  for (const section of SECTIONS) {
    assert.equal(section.harmony.length, BARS_PER_SECTION, `${section.id} is not four bars`);
    assert.ok(section.theme.length >= 4, `${section.id} has no theme worth the name`);
    assert.ok(section.response.length >= 2, `${section.id} has no response`);
    for (const note of [...section.theme, ...section.response]) {
      assert.ok(note.at >= 0 && note.at < 32, `${section.id} places a note outside the pattern`);
      assert.ok(note.steps > 0, `${section.id} has a note with no length`);
    }
  }
});

test("nothing in the form leaves the key", () => {
  // One key is what makes six sections one piece rather than six fragments.
  for (const section of SECTIONS) {
    for (const chord of section.harmony) {
      for (const pc of chordPitchClasses(chord)) {
        assert.ok(
          KEY_PITCH_CLASSES.has(pc),
          `${section.id}: ${chord.name} sounds ${NAMES[pc]}, which is outside the key`,
        );
      }
    }
    for (const note of [...section.theme, ...section.response]) {
      assert.ok(
        KEY_PITCH_CLASSES.has(pitchClass(note.midi)),
        `${section.id}: the theme plays ${name(note.midi)}, which is outside the key`,
      );
    }
  }
});

/**
 * The chords a note at `at` is actually heard over.
 *
 * The theme is thirty-two steps — two bars — and the section is four, so the
 * theme is played twice per section and each note sounds over two chords: the
 * one in its own bar, and the one two bars later. Checking against all four
 * would reject writing that is never heard against the other two.
 */
function chordsUnder(section, at) {
  const bar = Math.floor(at / 16);
  return [section.harmony[bar], section.harmony[bar + 2]];
}

test("no theme note clashes with either chord it is heard over", () => {
  // This is the regression that was reported as sounding out of tune. The theme
  // was transposed twice and played C against C#, and E against F, in the same
  // register. Checking it by ear is how it survived; checking it here is how it
  // stays gone.
  for (const section of SECTIONS) {
    for (const note of [...section.theme, ...section.response]) {
      for (const chord of chordsUnder(section, note.at)) {
        assert.ok(
          !clashesWith(note.midi, chord),
          `${section.id}: ${name(note.midi)} at step ${note.at} clashes with ${chord.name}`,
        );
      }
    }
  }
});

test("a sustained theme note also holds against the chord it runs into", () => {
  // Notes are held for several steps, so one that starts late in a bar sounds
  // over the next chord as well as its own.
  for (const section of SECTIONS) {
    for (const note of section.theme) {
      const endsAt = note.at + note.steps - 1;
      if (Math.floor(endsAt / 16) === Math.floor(note.at / 16)) continue;
      for (const chord of chordsUnder(section, endsAt % 32)) {
        assert.ok(
          !clashesWith(note.midi, chord),
          `${section.id}: ${name(note.midi)} runs into ${chord.name} and clashes`,
        );
      }
    }
  }
});

test("the bass resolves its degrees against each chord rather than assuming them", () => {
  // The bass transposes with the harmony, so a fixed interval is a bug waiting
  // for a chord that does not contain it. DARK's half-diminished chord has a
  // flattened fifth, and a natural fifth over it is exactly the clash this
  // whole file exists to catch.
  for (const note of REESE_NOTES) {
    assert.ok(
      ["root", "fifth", "octave"].includes(note.degree),
      `the bass names an unknown degree: ${note.degree}`,
    );
    for (const section of SECTIONS) {
      for (const chord of section.harmony) {
        const midi = chord.bassMidi + 12 + bassInterval(chord, note.degree);
        assert.ok(
          chordPitchClasses(chord).has(pitchClass(midi)),
          `the bass ${note.degree} is not a chord tone of ${chord.name}`,
        );
        assert.ok(
          !clashesWith(midi, chord),
          `the bass ${note.degree} clashes with ${chord.name}`,
        );
      }
    }
  }
});

test("the form advances by section and wraps without a gap", () => {
  assert.equal(sectionAt(0).id, SECTIONS[0].id);
  assert.equal(sectionAt(SECTIONS.length).id, SECTIONS[0].id, "the form must loop");
  assert.equal(sectionAt(-1).id, SECTIONS.at(-1).id, "and must not break going backwards");

  const first = SECTIONS[0];
  for (let bar = 0; bar < BARS_PER_SECTION; bar += 1) {
    assert.equal(harmonyForBar(0, bar).name, first.harmony[bar].name);
  }
  assert.equal(harmonyForBar(0, BARS_PER_SECTION).name, first.harmony[0].name);
});
