import assert from "node:assert/strict";
import test from "node:test";
import { createScoreCore } from "../src/score/score-core.js";

const SAMPLE_RATE = 48000;
const BLOCK = 128;

/** Every voice the interface offers in the preview, by its lane name. */
const PREVIEW_VOICES = [
  "kick", "snare", "ghost", "closedHat", "openHat", "clap",
  "sub", "reese", "riff", "response", "atmosphere",
];

/**
 * Auditions one voice on a stopped vehicle and returns the peak it produced.
 *
 * Stopped is the case that matters: the preview exists so a voice can be heard
 * on demand, and at a standstill almost every lane is silent. A preview that
 * only works while driving is not a preview.
 */
function auditionPeak(voiceId, seconds = 1.2) {
  const core = createScoreCore({ sampleRate: SAMPLE_RATE });
  const left = new Float32Array(BLOCK);
  const right = new Float32Array(BLOCK);

  // Settle at a standstill first, so nothing the arrangement plays is counted.
  for (let block = 0; block < 40; block += 1) {
    core.observe(0, BLOCK / SAMPLE_RATE);
    core.process(left, right, BLOCK);
  }

  assert.equal(core.audition(voiceId), true, `${voiceId} was not recognised`);

  let peak = 0;
  const blocks = Math.round((seconds * SAMPLE_RATE) / BLOCK);
  for (let block = 0; block < blocks; block += 1) {
    core.observe(0, BLOCK / SAMPLE_RATE);
    core.process(left, right, BLOCK);
    for (let frame = 0; frame < BLOCK; frame += 1) {
      const magnitude = Math.max(Math.abs(left[frame]), Math.abs(right[frame]));
      if (magnitude > peak) peak = magnitude;
    }
  }
  return peak;
}

test("every voice the preview offers is audible on a stopped vehicle", () => {
  // The preview is how the sounds get names, so each block has to make one.
  for (const voiceId of PREVIEW_VOICES) {
    const peak = auditionPeak(voiceId);
    assert.ok(
      peak > 0.02,
      `${voiceId} auditioned at ${(20 * Math.log10(Math.max(peak, 1e-9))).toFixed(1)} dB, which is silence`,
    );
  }
});

test("the ghost and the clap are audible even though neither owns a lane", () => {
  // Both are voiced through the snare's level, which is zero at a standstill.
  // Keying the audition by lane rather than by voice left them silent.
  assert.ok(auditionPeak("ghost") > 0.02);
  assert.ok(auditionPeak("clap") > 0.02);
});

test("an unknown voice is refused rather than silently ignored", () => {
  const core = createScoreCore({ sampleRate: SAMPLE_RATE });
  assert.equal(core.audition("theremin"), false);
  assert.equal(core.audition(""), false);
});

test("an audition ends on its own and does not hold a lane open", () => {
  // Measured in the hat's own band, because the resting arrangement keeps
  // playing underneath and the full mix never falls to silence.
  const core = createScoreCore({ sampleRate: SAMPLE_RATE });
  const left = new Float32Array(BLOCK);
  const right = new Float32Array(BLOCK);

  const highBandPeak = (seconds) => {
    const coefficient = Math.exp(-2 * Math.PI * 6000 / SAMPLE_RATE);
    let previousInput = 0;
    let previousOutput = 0;
    let peak = 0;
    const blocks = Math.round((seconds * SAMPLE_RATE) / BLOCK);
    for (let block = 0; block < blocks; block += 1) {
      core.observe(0, BLOCK / SAMPLE_RATE);
      core.process(left, right, BLOCK);
      for (let frame = 0; frame < BLOCK; frame += 1) {
        const x = left[frame];
        const y = coefficient * (previousOutput + x - previousInput);
        previousInput = x;
        previousOutput = y;
        if (Math.abs(y) > peak) peak = Math.abs(y);
      }
    }
    return peak;
  };

  // The window has to be short and taken immediately after the hold expires.
  // Measured over several seconds it drifts into the next voiced phrase, and
  // what it then reports is the arrangement, not the audition.
  const baseline = highBandPeak(2);
  core.audition("closedHat");
  const during = highBandPeak(0.5);
  const after = highBandPeak(1);

  assert.ok(during > baseline * 2, "the audition must be clearly audible over the piece");
  assert.ok(after < during * 0.05, "the audition latched the lane open past its hold");
  assert.ok(after < 0.005, "the audition left a material high-frequency tail");
});
