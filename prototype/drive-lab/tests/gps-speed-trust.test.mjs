import assert from "node:assert/strict";
import test from "node:test";
import { positionUnusable, speedOnlyPlausible } from "../src/gps-speed-trust.js";
import { classifyGpsConfidence } from "../src/diagnostics-model.js";

// The owner's September 24 session after wake: whole km/h every 100 ms, every
// fix with a 9,999.99 m radius (coordinate-free profile of the real report).
function ownerProfile() {
  const knots = [[0, 0], [10, 6], [20, 5], [30, 1], [40, 4], [54, 0], [60, 7], [70, 26], [80, 31], [90, 31], [100, 22], [110, 45], [120, 56], [122, 58]];
  const samples = [];
  for (let ms = 0; ms <= 122000; ms += 100) {
    const s = ms / 1000;
    const i = knots.findIndex(([at]) => at > s);
    const [a, va] = knots[Math.max(0, i - 1)], [b, vb] = knots[i === -1 ? knots.length - 1 : i];
    const v = b === a ? vb : va + (vb - va) * (s - a) / (b - a);
    samples.push({ atMs: ms, kmh: Math.round(v), accuracyM: 9999.99 });
  }
  return samples;
}

test("an unusable radius is judged for position only", () => {
  assert.equal(positionUnusable(9999.99), true);
  assert.equal(positionUnusable(251), true);
  assert.equal(positionUnusable(250), false);
  assert.equal(positionUnusable(null), false);
});

test("the owner's wake-up session is admitted as speed-only instead of a held zero", () => {
  let previous = null, admitted = 0, rejected = 0, displayed = 0;
  for (const sample of ownerProfile()) {
    const ok = positionUnusable(sample.accuracyM) && speedOnlyPlausible(previous, sample.kmh, sample.atMs);
    previous = { kmh: sample.kmh, atMs: sample.atMs };
    if (ok) { admitted++; displayed = sample.kmh; } else rejected++;
  }
  assert.equal(rejected, 1, "only the very first sample lacks a predecessor");
  assert.equal(displayed, 58);
  assert.ok(admitted > 1200);
});

test("a single garbage value fails against both neighbours; gaps and impossible jumps are refused", () => {
  const at = (kmh, atMs) => ({ kmh, atMs });
  assert.equal(speedOnlyPlausible(at(50, 0), 0, 100), false);
  assert.equal(speedOnlyPlausible(at(0, 100), 50, 200), false);
  assert.equal(speedOnlyPlausible(at(50, 0), 52, 100), true, "one quantization step");
  assert.equal(speedOnlyPlausible(at(50, 0), 55, 100), true, "within the 10 m/s² envelope");
  assert.equal(speedOnlyPlausible(at(50, 0), 58, 100), false);
  assert.equal(speedOnlyPlausible(at(50, 0), 50, 3100), false, "too long a gap to vouch for continuity");
  assert.equal(speedOnlyPlausible(null, 20, 100), false);
  for (const bad of [NaN, -1, 300, null]) assert.equal(speedOnlyPlausible(at(20, 0), bad, 100), false);
});

test("diagnostics name speed-only confidence separately from an unreliable fix", () => {
  const base = { gpsState: "live", gpsAgeMs: 100, accuracyM: 9999.99 };
  assert.equal(classifyGpsConfidence(base), "unreliable");
  assert.equal(classifyGpsConfidence({ ...base, speedOnly: true }), "speed-only");
  assert.equal(classifyGpsConfidence({ ...base, accuracyM: 4, speedOnly: true }), "precise");
  assert.equal(classifyGpsConfidence({ ...base, gpsAgeMs: 5000, speedOnly: true }), "stale");
});
