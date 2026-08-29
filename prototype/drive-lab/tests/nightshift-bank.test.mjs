import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  chooseNightshiftPerformance,
  NIGHTSHIFT_MAX_DECODED_CLIPS,
  nightshiftDecodedLimit,
  parseNightshiftBank,
} from "../src/nightshift-bank.js";
import {
  NIGHTSHIFT_PARK_HOLD_SECONDS,
  NIGHTSHIFT_PARK_LEVEL,
  NIGHTSHIFT_PARK_VOICINGS,
} from "../src/nightshift-low-speed-bed.js";
import {
  createScoreCrossfadeState,
  scheduleScoreCrossfade,
  scoreCrossfadeAtTime,
} from "../src/score-crossfade.js";
import {
  NIGHTSHIFT_ARRANGEMENT,
  NIGHTSHIFT_BARS_PER_PERFORMANCE,
  NIGHTSHIFT_HARMONIC_IDENTITY,
  NIGHTSHIFT_HARMONY,
  NIGHTSHIFT_STATES,
  NIGHTSHIFT_TAKES,
  nightshiftDrumCells,
  nightshiftStateForSpeed,
} from "../scripts/nightshift-form.mjs";

test("NIGHTSHIFT grows through native 1980s tempo families without an early fast lane", () => {
  assert.deepEqual(NIGHTSHIFT_STATES.map(({ bpm }) => bpm), [85, 95, 110, 120, 130, 140]);
  assert.equal(nightshiftStateForSpeed(0), null);
  assert.equal(nightshiftStateForSpeed(3)?.id, "glide");
  assert.equal(nightshiftStateForSpeed(81)?.bpm, 110);
  assert.equal(nightshiftStateForSpeed(82)?.bpm, 120);
  assert.equal(nightshiftStateForSpeed(130)?.bpm, 140);
  assert.equal(nightshiftStateForSpeed(78, "drive")?.id, "drive");
  assert.equal(nightshiftStateForSpeed(73.9, "drive")?.id, "motion");
});

test("NIGHTSHIFT ascent, descent and boundary reversals follow the authored hysteresis", () => {
  const speeds = [0, 3, 21, 22, 47, 48, 81, 82, 104, 105, 122, 123, 130,
    122.5, 114, 113.9, 105, 96, 95.9, 82, 74, 73.9, 48, 42, 41.9, 22, 18, 17.9, 3, 1.5, 1.4, 0];
  const expected = [null, "glide", "glide", "cruise", "cruise", "motion", "motion", "drive",
    "drive", "chase", "chase", "limit", "limit", "limit", "limit", "chase", "chase",
    "chase", "drive", "drive", "drive", "motion", "motion", "motion", "cruise", "cruise",
    "cruise", "glide", "glide", "glide", null, null];
  let previous = null;
  const observed = speeds.map((speed) => {
    const state = nightshiftStateForSpeed(speed, previous);
    previous = state?.id ?? null;
    return previous;
  });
  assert.deepEqual(observed, expected);
});

test("NIGHTSHIFT keeps one consonant grammar and exactly three complete takes per state", () => {
  assert.equal(NIGHTSHIFT_BARS_PER_PERFORMANCE, 8);
  assert.equal(NIGHTSHIFT_TAKES, 3);
  assert.equal(NIGHTSHIFT_ARRANGEMENT.length, NIGHTSHIFT_STATES.length * NIGHTSHIFT_TAKES);
  assert.equal(NIGHTSHIFT_HARMONY.reduce((sum, chord) => sum + chord.bars, 0), 8);
  const aNaturalMinor = new Set([0, 2, 3, 5, 7, 8, 10]);
  for (const chord of NIGHTSHIFT_HARMONY) {
    assert.ok(chord.notes.length >= 4);
    assert.ok(chord.notes.every((note) => aNaturalMinor.has((note - 45 + 120) % 12)));
  }
  for (const section of NIGHTSHIFT_ARRANGEMENT) {
    assert.equal(section.harmonicIdentity, NIGHTSHIFT_HARMONIC_IDENTITY);
    assert.equal(section.drumCells.length, 4);
    assert.ok(section.drumCells.every((cell) => cell.role === "groove" || cell.role === "fill"));
  }
});

test("NIGHTSHIFT uses one native two-bar drum source at a time", () => {
  for (const state of NIGHTSHIFT_STATES) {
    for (let take = 1; take <= NIGHTSHIFT_TAKES; take += 1) {
      const cells = nightshiftDrumCells(state.bpm, take);
      assert.equal(cells.length, 4);
      assert.ok(cells.slice(0, 3).every(({ role }) => role === "groove"));
      assert.ok(new Set(cells.map(({ variant }) => variant)).size >= 3);
    }
  }
});

test("NIGHTSHIFT selection avoids the immediate primary take and recent performances", () => {
  const sections = NIGHTSHIFT_ARRANGEMENT.filter(({ id }) => id === "cruise");
  const first = chooseNightshiftPerformance(sections, "cruise", null, () => 0);
  const second = chooseNightshiftPerformance(sections, "cruise", first, () => 0, [first]);
  const third = chooseNightshiftPerformance(sections, "cruise", second, () => 0, [first, second]);
  assert.notEqual(first.take, second.take);
  assert.notEqual(second.take, third.take);
  assert.equal(new Set([first.take, second.take, third.take]).size, 3);
});

test("the production NIGHTSHIFT bank is mixed, bounded and does not publish source loops", async () => {
  const bank = await readFile(new URL("../public/audio/nightshift.svb", import.meta.url));
  const parsed = parseNightshiftBank(bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength));
  assert.equal(parsed.manifest.sections.length, 18);
  assert.equal(parsed.manifest.assets.length, 18);
  assert.equal(parsed.manifest.primaryGrooves, 1);
  assert.equal(parsed.manifest.rawSourceAssetsPublished, false);
  assert.equal(parsed.manifest.harmonicIdentity, NIGHTSHIFT_HARMONIC_IDENTITY);
  assert.deepEqual(parsed.manifest.bpmRange, [85, 140]);
  assert.equal(parsed.manifest.fastDrumsEnterKmh, 82);
  assert.equal(parsed.manifest.maxDecodedClips, NIGHTSHIFT_MAX_DECODED_CLIPS);
  assert.equal(nightshiftDecodedLimit(99), 6);
  assert.ok(parsed.audioBytes < 6_000_000);
  assert.ok(parsed.manifest.sections.every(({ durationSeconds }) => durationSeconds > 13));
});

test("NIGHTSHIFT PARK is a polite clockless consonant form, not a perpetual note", () => {
  assert.equal(NIGHTSHIFT_PARK_VOICINGS.length, 6);
  assert.equal(new Set(NIGHTSHIFT_PARK_VOICINGS.map(({ id }) => id)).size, 6);
  assert.ok(NIGHTSHIFT_PARK_HOLD_SECONDS.every((seconds) => seconds >= 10));
  assert.equal(new Set(NIGHTSHIFT_PARK_HOLD_SECONDS).size, 6);
  assert.ok(NIGHTSHIFT_PARK_HOLD_SECONDS.reduce((sum, seconds) => sum + seconds, 0) > 75);
  assert.ok(NIGHTSHIFT_PARK_LEVEL <= 0.025);
  assert.ok(NIGHTSHIFT_PARK_VOICINGS.every(({ frequencies }) => frequencies.length === 4));
});

test("the three-score crossfade keeps unit power through NIGHTSHIFT and a reversal", () => {
  class Param {
    cancelScheduledValues() {}
    setValueCurveAtTime() {}
    setValueAtTime() {}
    linearRampToValueAtTime() {}
  }
  let state = createScoreCrossfadeState("fracture", 0);
  state = scheduleScoreCrossfade({
    fractureParam: new Param(),
    junctionParam: new Param(),
    nightshiftParam: new Param(),
    state,
    targetScoreId: "nightshift",
    startAt: 0,
  });
  const middle = scoreCrossfadeAtTime(state, 2);
  assert.ok(Math.abs(middle.fracture ** 2 + middle.junction ** 2 + middle.nightshift ** 2 - 1) < 1e-12);
  state = scheduleScoreCrossfade({
    fractureParam: new Param(),
    junctionParam: new Param(),
    nightshiftParam: new Param(),
    state,
    targetScoreId: "junction",
    startAt: 2,
  });
  const end = scoreCrossfadeAtTime(state, state.endAt);
  assert.ok(Math.abs(end.junction - 1) < 1e-12);
  assert.ok(Math.abs(end.fracture) < 1e-12);
  assert.ok(Math.abs(end.nightshift) < 1e-12);
});

test("the NIGHTSHIFT player preserves native playback rate and complete-phrase boundaries", async () => {
  const source = await readFile(new URL("../src/nightshift-player.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /playbackRate\s*\./);
  assert.match(source, /startPrepared\(prepared, current\.endAt\)/);
  assert.match(source, /boundaryFallbacks/);
  assert.match(source, /decoded-slot limit/);
});
