import assert from "node:assert/strict";
import test from "node:test";
import { BeatRepeatEffect, repeatWindowSeconds } from "../src/soundtrack/beat-repeat-effect.js";

test("beat-repeat maps its control to bounded, progressively shorter windows", () => {
  assert.equal(repeatWindowSeconds(0), 0.5);
  assert.equal(repeatWindowSeconds(1), 0.0625);
  assert.ok(repeatWindowSeconds(0.75) < repeatWindowSeconds(0.25));
  assert.equal(repeatWindowSeconds(Number.NaN), 0.5);
});

test("beat-repeat captures recent audio, stays finite, and releases to the live signal", () => {
  const effect = new BeatRepeatEffect(8_000);
  for (let index = 0; index < 4_200; index += 1) effect.tick(index / 4_200, -index / 4_200);
  effect.set(1);
  const repeated = Array.from({ length: 900 }, () => effect.tick(0.9, -0.9));
  assert.ok(repeated.every(([left, right]) => Number.isFinite(left) && Number.isFinite(right)));
  assert.ok(repeated.some(([left]) => Math.abs(left - 0.9) > 0.05));
  effect.set(0);
  let output = [0, 0];
  for (let index = 0; index < 1_200; index += 1) output = effect.tick(0.25, -0.25);
  assert.ok(Math.abs(output[0] - 0.25) < 0.001);
  assert.ok(Math.abs(output[1] + 0.25) < 0.001);
});
