import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeSoundtrackSelection,
  rotateSoundtrackEntries,
  SOUNDTRACK_ROTATION_INTERVAL_MS,
  startSoundtrackEntriesAtRandom,
  soundtrackRotationWindow,
} from "../src/soundtrack/library-model.js";

const entries = Object.freeze([
  Object.freeze({ key: "jamendo:1" }),
  Object.freeze({ key: "jamendo:2" }),
  Object.freeze({ key: "jamendo:3" }),
  Object.freeze({ key: "jamendo:4" }),
  Object.freeze({ key: "jamendo:5" }),
  Object.freeze({ key: "jamendo:6" }),
]);

test("the fresh mix is stable inside one half-hour window and changes at the boundary", () => {
  const before = rotateSoundtrackEntries(entries, { nowMs: 1, selection: { kind: "featured" } });
  const same = rotateSoundtrackEntries(entries, {
    nowMs: SOUNDTRACK_ROTATION_INTERVAL_MS - 1,
    selection: { kind: "featured" },
  });
  const after = rotateSoundtrackEntries(entries, {
    nowMs: SOUNDTRACK_ROTATION_INTERVAL_MS,
    selection: { kind: "featured" },
  });

  assert.deepEqual(before.entries.map((entry) => entry.key), same.entries.map((entry) => entry.key));
  assert.notDeepEqual(before.entries.map((entry) => entry.key), after.entries.map((entry) => entry.key));
  assert.equal(before.window.endsAtMs, SOUNDTRACK_ROTATION_INTERVAL_MS);
  assert.equal(soundtrackRotationWindow(SOUNDTRACK_ROTATION_INTERVAL_MS).id, 1);
});

test("a Featured press chooses a random start without dropping any playlist entry", () => {
  const started = startSoundtrackEntriesAtRandom(entries, { random: () => 0.5 });
  assert.deepEqual(started.map((entry) => entry.key), [
    "jamendo:4",
    "jamendo:5",
    "jamendo:6",
    "jamendo:1",
    "jamendo:2",
    "jamendo:3",
  ]);
  assert.deepEqual(new Set(started.map((entry) => entry.key)), new Set(entries.map((entry) => entry.key)));

  const avoidsCurrent = startSoundtrackEntriesAtRandom(entries, {
    random: () => 0.5,
    avoidKey: "jamendo:4",
  });
  assert.equal(avoidsCurrent[0].key, "jamendo:5");
});

test("passenger pace choices map only to official Jamendo speed metadata", () => {
  assert.deepEqual(normalizeSoundtrackSelection(), {
    kind: "library",
    id: "all",
    label: "Jamendo Library",
    speed: [],
    genre: null,
  });
  assert.deepEqual(normalizeSoundtrackSelection({ kind: "featured" }), {
    kind: "featured",
    id: "signal-border",
    label: "Signal Border",
    speed: [],
    genre: null,
  });
  assert.deepEqual(normalizeSoundtrackSelection({ kind: "pace", id: "slow" }), {
    kind: "pace",
    id: "slow",
    label: "Slow",
    speed: ["verylow", "low"],
    genre: null,
  });
  assert.deepEqual(normalizeSoundtrackSelection({ kind: "pace", id: "fast" }).speed, ["high", "veryhigh"]);
  assert.deepEqual(normalizeSoundtrackSelection({ kind: "genre", id: "jazz" }), {
    kind: "genre",
    id: "jazz",
    label: "Jazz",
    speed: [],
    genre: "jazz",
  });
});
