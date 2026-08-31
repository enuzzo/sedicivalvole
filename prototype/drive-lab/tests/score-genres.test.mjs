import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_GENRE_ID,
  getScoreGenre,
  isScoreReady,
  preparingScoreGenres,
  readyScoreGenres,
  SCORE_GENRES,
  SCORE_STATUS,
} from "../src/score/genres.js";
import { SCORE_ID } from "../src/score/jungle-score.js";

test("exposes the score library in a stable order with unique identity", () => {
  assert.ok(SCORE_GENRES.length >= 2, "a library of one is not a library");
  const ids = SCORE_GENRES.map((genre) => genre.id);
  const numbers = SCORE_GENRES.map((genre) => genre.number);
  const labels = SCORE_GENRES.map((genre) => genre.label);
  const displayLabels = SCORE_GENRES.map((genre) => genre.displayLabel);
  assert.equal(new Set(ids).size, ids.length, "identifiers must be unique");
  assert.equal(new Set(numbers).size, numbers.length, "numbers must be unique");
  assert.equal(new Set(labels).size, labels.length, "labels must be unique");
  assert.equal(new Set(displayLabels).size, displayLabels.length, "display labels must be unique");
  assert.ok(SCORE_GENRES.every((genre) => genre.label === genre.label.toUpperCase()));
  assert.ok(SCORE_GENRES.every((genre) => genre.displayLabel !== genre.label));
  // The default is not required to be first: the library is ordered by where
  // the project is heading, and the default has to be a score that plays.
  assert.ok(
    SCORE_GENRES.some((genre) => genre.id === DEFAULT_GENRE_ID),
    "the default must be in the library",
  );
  assert.equal(
    getScoreGenre(DEFAULT_GENRE_ID).status, SCORE_STATUS.ready,
    "the default must be a score that actually plays",
  );
});

test("every entry declares a status the interface can act on", () => {
  for (const genre of SCORE_GENRES) {
    assert.ok(
      genre.status === SCORE_STATUS.ready || genre.status === SCORE_STATUS.preparing,
      `${genre.id} has no usable status`,
    );
    assert.ok(genre.family, `${genre.id} must name its rhythmic family`);
    assert.ok(genre.note, `${genre.id} must say what it is, for the caption`);
  }
});

test("a ready entry names a real score and a preparing entry names none", () => {
  // This is the rule that keeps the selector truthful: an entry may only be
  // selectable when there is something authored behind it.
  for (const genre of SCORE_GENRES) {
    if (genre.status === SCORE_STATUS.ready) {
      assert.ok(genre.score, `${genre.id} is ready but names no score`);
    } else {
      assert.equal(genre.score, null, `${genre.id} is not ready but names a score`);
    }
  }
});

test("the ready scores name all three live music runtimes", () => {
  const ready = readyScoreGenres();
  assert.deepEqual(ready.map((genre) => genre.id), ["junction", "fracture", "nightshift"]);
  assert.equal(getScoreGenre("junction").score, "junction");
  assert.equal(getScoreGenre("fracture").score, SCORE_ID);
  assert.equal(getScoreGenre("nightshift").score, "nightshift");
  assert.ok(ready.every((genre) => isScoreReady(genre.id)));
  assert.ok(ready.every((genre) => genre.coverUrl?.startsWith("/artwork/play-road/")));
  assert.ok(ready.every((genre) => genre.description?.length > 40));
  assert.match(getScoreGenre("junction").note, /one coherent harmonic identity/i);
  assert.doesNotMatch(getScoreGenre("junction").note, /160|five.*famil/i);
  assert.match(getScoreGenre("fracture").note, /no automatic lead/i);
  assert.match(getScoreGenre("nightshift").note, /85.140 BPM/i);
});

test("the rest of the library is declared as preparing, not as playing", () => {
  const preparing = preparingScoreGenres();
  assert.ok(preparing.length >= 1);
  for (const genre of preparing) {
    assert.equal(isScoreReady(genre.id), false, `${genre.id} must not read as ready`);
  }
  assert.equal(readyScoreGenres().length + preparing.length, SCORE_GENRES.length);
});

test("an unknown identifier falls back to the default rather than to nothing", () => {
  assert.equal(getScoreGenre("does-not-exist").id, DEFAULT_GENRE_ID);
  assert.equal(getScoreGenre(undefined).id, DEFAULT_GENRE_ID);
  assert.equal(getScoreGenre(DEFAULT_GENRE_ID).id, DEFAULT_GENRE_ID);
});
