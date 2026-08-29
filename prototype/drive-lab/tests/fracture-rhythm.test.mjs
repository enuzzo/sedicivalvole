import assert from "node:assert/strict";
import test from "node:test";

import {
  commitFractureRhythmAtBar,
  createFractureRhythmState,
  FRACTURE_LOW_RHYTHM_PATTERNS,
  FRACTURE_RHYTHM_ENTER_KMH,
  FRACTURE_RHYTHM_PROFILES,
  FRACTURE_RHYTHM_RELEASE_KMH,
  fractureLowRhythmEvent,
  fractureRhythmPatternIndex,
  fractureRhythmProfile,
  isFractureFullTime,
  observeFractureRhythm,
} from "../src/score/fracture-rhythm.js";
import { createScoreCore } from "../src/score/score-core.js";

test("the three low-speed families form a varied eight-bar rotation", () => {
  for (const profileId of ["silk", "pulse", "weave"]) {
    const patterns = FRACTURE_LOW_RHYTHM_PATTERNS[profileId];
    assert.equal(patterns.length, 4, `${profileId} does not span eight bars`);
    const signatures = new Set();
    const voices = new Set();
    let accents = 0;

    for (const pattern of patterns) {
      assert.ok(pattern.length >= 5, `${profileId} has an empty-feeling cell`);
      assert.ok(pattern.length <= 9, `${profileId} became a continuous subdivision`);
      assert.ok(32 - pattern.length >= 23, `${profileId} lost its intentional rests`);
      const signature = pattern.map((event) => `${event.step}:${event.voice}:${event.level}`).join("|");
      assert.equal(signatures.has(signature), false, `${profileId} immediately repeats a cell`);
      signatures.add(signature);

      let previousStep = -2;
      let previousVoice = null;
      let sameVoiceRun = 0;
      for (const event of pattern) {
        assert.ok(event.step > previousStep, `${profileId} events are not ordered`);
        assert.ok(event.step - previousStep >= 2, `${profileId} exposes sixteenth-note drumming`);
        assert.ok(event.level >= 0.08 && event.level <= 0.4, `${profileId} level is unbounded`);
        voices.add(event.voice);
        accents += Number(event.accent);
        sameVoiceRun = event.voice === previousVoice ? sameVoiceRun + 1 : 1;
        assert.ok(sameVoiceRun <= 2, `${profileId} repeats one timbre like a metronome`);
        previousStep = event.step;
        previousVoice = event.voice;
      }
    }

    assert.ok(voices.size >= 4, `${profileId} does not rotate compatible timbres`);
    assert.ok(accents >= 4, `${profileId} does not phrase with accents`);
  }
});

test("event lookup rotates cells every two bars and returns authored rests", () => {
  assert.equal(fractureRhythmPatternIndex(0), 0);
  assert.equal(fractureRhythmPatternIndex(32), 1);
  assert.equal(fractureRhythmPatternIndex(64), 2);
  assert.equal(fractureRhythmPatternIndex(96), 3);
  assert.equal(fractureRhythmPatternIndex(128), 0);
  assert.equal(fractureLowRhythmEvent("silk", 0)?.voice, "hat");
  assert.equal(fractureLowRhythmEvent("silk", 1), null);
  assert.equal(fractureLowRhythmEvent("pulse", 32)?.voice, "hat");
  assert.equal(fractureLowRhythmEvent("native", 0), null);
});

test("ascent can advance only one rhythmic family per bar", () => {
  const state = createFractureRhythmState();
  observeFractureRhythm(state, 130);
  assert.equal(fractureRhythmProfile(state).id, "none");
  assert.deepEqual(
    [0, 1, 2, 3].map(() => commitFractureRhythmAtBar(state).id),
    ["silk", "pulse", "weave", "native"],
  );
  assert.equal(isFractureFullTime(state), true);
});

test("full-time drumming cannot arm below 88 km/h", () => {
  const state = createFractureRhythmState();
  for (const speed of [0, 10, 31.9, 32, 57.9, 58, 80, 87.9]) {
    observeFractureRhythm(state, speed);
    commitFractureRhythmAtBar(state);
    assert.equal(isFractureFullTime(state), false, `${speed} km/h armed full-time drums`);
  }
  observeFractureRhythm(state, FRACTURE_RHYTHM_ENTER_KMH.native);
  commitFractureRhythmAtBar(state);
  assert.equal(isFractureFullTime(state), true);
});

test("the native boundary has hysteresis under reversal and GPS noise", () => {
  const state = createFractureRhythmState();
  observeFractureRhythm(state, 130);
  for (let bar = 0; bar < 4; bar += 1) commitFractureRhythmAtBar(state);
  assert.equal(isFractureFullTime(state), true);

  for (const speed of [87, 89, 85, 88, 83, 86]) {
    observeFractureRhythm(state, speed);
    commitFractureRhythmAtBar(state);
    assert.equal(isFractureFullTime(state), true, `${speed} km/h chattered out of native`);
  }
  observeFractureRhythm(state, FRACTURE_RHYTHM_RELEASE_KMH.native - 0.1);
  commitFractureRhythmAtBar(state);
  assert.equal(fractureRhythmProfile(state).id, "weave");
  assert.equal(isFractureFullTime(state), false);
});

test("the profile catalogue and thresholds stay progressive", () => {
  assert.deepEqual(FRACTURE_RHYTHM_PROFILES.map((profile) => profile.id), [
    "none", "silk", "pulse", "weave", "native",
  ]);
  assert.ok(FRACTURE_RHYTHM_ENTER_KMH.silk < FRACTURE_RHYTHM_ENTER_KMH.pulse);
  assert.ok(FRACTURE_RHYTHM_ENTER_KMH.pulse < FRACTURE_RHYTHM_ENTER_KMH.weave);
  assert.ok(FRACTURE_RHYTHM_ENTER_KMH.weave < FRACTURE_RHYTHM_ENTER_KMH.native);
  assert.ok(FRACTURE_RHYTHM_RELEASE_KMH.native >= 80);
});

test("the production core grows and releases across a complete drive trajectory", (context) => {
  const sampleRate = 8000;
  const blockSize = 128;
  const core = createScoreCore({ sampleRate });
  const left = new Float32Array(blockSize);
  const right = new Float32Array(blockSize);
  const targets = [0, 12, 30, 45, 65, 87, 90, 110, 90, 83, 81, 60, 30, 10, 0];
  const rows = [];
  let previousSpeed = 0;

  for (const targetSpeed of targets) {
    const seconds = 4;
    const frames = seconds * sampleRate;
    for (let frame = 0; frame < frames; frame += blockSize) {
      const count = Math.min(blockSize, frames - frame);
      const progress = (frame + count) / frames;
      const speed = previousSpeed + (targetSpeed - previousSpeed) * progress;
      core.observe(speed, count / sampleRate);
      core.process(left, right, count);
    }
    const snapshot = core.snapshot();
    rows.push({
      speed: targetSpeed,
      lane: snapshot.motionLane,
      rhythm: snapshot.rhythmLabel,
      bpm: snapshot.perceivedTempo == null ? null : Math.round(snapshot.perceivedTempo),
      beat: snapshot.beat,
    });
    previousSpeed = targetSpeed;
  }

  for (const row of rows.slice(0, 6)) {
    assert.notEqual(row.rhythm, "FULL BREAK", `${row.speed} km/h exposed the fast break`);
    assert.ok(row.bpm == null || row.bpm <= 100, `${row.speed} km/h exposed double-time tactus`);
  }
  const firstFullBreak = rows.find((row) => row.rhythm === "FULL BREAK");
  assert.ok(firstFullBreak, "the ascent never earned the full break");
  assert.ok(firstFullBreak.speed >= 90, `full break arrived at ${firstFullBreak.speed} km/h`);
  const releaseAt81 = rows.find((row, index) => index > 8 && row.speed === 81);
  assert.equal(releaseAt81.rhythm, "RHYTHM WEAVE");
  assert.ok(releaseAt81.bpm <= 100);
  assert.equal(rows.at(-1).lane, "PARK");
  assert.equal(rows.at(-1).beat, false);

  context.diagnostic(rows.map((row) => (
    `${row.speed}:${row.rhythm}/${row.bpm ?? "clockless"}`
  )).join(" | "));
});
