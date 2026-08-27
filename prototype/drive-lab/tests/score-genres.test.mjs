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
  assert.equal(new Set(ids).size, ids.length, "identifiers must be unique");
  assert.equal(new Set(numbers).size, numbers.length, "numbers must be unique");
  assert.equal(new Set(labels).size, labels.length, "labels must be unique");
  assert.equal(SCORE_GENRES[0].id, DEFAULT_GENRE_ID, "the default must come first");
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

test("the one ready score is the authored composition that actually plays", () => {
  const ready = readyScoreGenres();
  assert.equal(ready.length, 1, "only FRACTURE is authored so far");
  assert.equal(ready[0].score, SCORE_ID);
  assert.ok(isScoreReady(ready[0].id));
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
