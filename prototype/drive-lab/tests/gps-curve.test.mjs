import test from "node:test";
import assert from "node:assert/strict";
import { createGpsCurveTracker } from "../src/motion/gps-curve.js";
import { apertureCurveTarget, apertureCurveOffset, visualCurveTarget, advanceApertureCurve, advanceCurveSpring } from "../src/motion/aperture-curve.js";

const fix = (capturedAtMs, heading, overrides = {}) => ({ capturedAtMs, heading, speedKmh: 70, accuracyM: 2, ...overrides });
const turning = (cadence = 100, direction = 1) => {
  const tracker = createGpsCurveTracker();
  for (let t = 0; t <= 3000; t += cadence) tracker.observe(fix(t, (30 + direction * t * 0.012 + 360) % 360));
  return tracker;
};

test("GPS curve tracker smooths heading changes and expires without fresh fixes", () => {
  let now = 0;
  const tracker = createGpsCurveTracker({ now: () => now });
  tracker.observe({ heading: 10, speedKmh: 70, accuracyM: 4, capturedAtMs: 0 });
  now = 1000;
  tracker.observe({ heading: 22, speedKmh: 70, accuracyM: 4, capturedAtMs: now });
  const first = tracker.sample();
  assert.equal(first.frame, "gps-heading");
  assert.ok(first.turnRate > 0 && first.turnRate < 12);
  assert.ok(apertureCurveTarget(first, 70) > 0);
  now = 2801;
  assert.equal(tracker.sample(), null);
  assert.equal(tracker.snapshot().state, "stale");
});

test("GPS curve tracker rejects slow or inaccurate heading noise", () => {
  const tracker = createGpsCurveTracker({ now: () => 1000 });
  tracker.observe({ heading: 0, speedKmh: 2, accuracyM: 3, capturedAtMs: 0 });
  tracker.observe({ heading: 90, speedKmh: 2, accuracyM: 3, capturedAtMs: 1000 });
  assert.equal(tracker.sample(1000), null);
  tracker.reset();
  tracker.observe({ heading: 0, speedKmh: 60, accuracyM: 80, capturedAtMs: 0 });
  tracker.observe({ heading: 90, speedKmh: 60, accuracyM: 80, capturedAtMs: 1000 });
  assert.equal(tracker.sample(1000), null);
});

test("real Tesla 100 ms cadence accumulates headings and drives Aperture in both directions", () => {
  for (const direction of [-1, 1]) {
    const value = turning(100, direction).sample(3000);
    assert.ok(value.turnRate * direction > 11);
    assert.ok(apertureCurveTarget(value, 70) * direction > 0.15);
  }
});

test("100 ms, 250 ms and 1 s fixes produce the same bounded response over elapsed time", () => {
  const rates = [100, 250, 1000].map(cadence => turning(cadence).sample(3000).turnRate);
  assert.ok(Math.max(...rates) - Math.min(...rates) <= 0.1, rates.join(", "));
  assert.ok(rates.every(rate => rate > 11 && rate < 12));
});

test("fast fixes retain the derivative anchor without pretending to be a new rate", () => {
  const tracker = createGpsCurveTracker();
  tracker.observe(fix(0, 0));
  tracker.observe(fix(100, 1.2));
  tracker.observe(fix(200, 2.4));
  assert.equal(tracker.sample(200).ageMs, 200);
  assert.equal(tracker.sample(200).turnRate, 0);
  tracker.observe(fix(300, 3.6));
  assert.equal(tracker.sample(300).ageMs, 0);
  assert.ok(tracker.sample(300).turnRate > 0);
});

test("crossing north uses the short arc in either direction", () => {
  for (const [first, second, sign] of [[359, 1, 1], [1, 359, -1]]) {
    const tracker = createGpsCurveTracker();
    tracker.observe(fix(0, first));
    tracker.observe(fix(1000, second));
    assert.ok(tracker.sample(1000).turnRate * sign > 0);
    assert.ok(Math.abs(tracker.sample(1000).turnRate) < 2);
  }
});

test("missing or invalid heading, accuracy and speed cannot turn into fresh evidence", () => {
  for (const overrides of [
    { heading: null }, { heading: undefined }, { heading: NaN }, { heading: "90" },
    { heading: -1 }, { heading: 360 }, { accuracyM: null }, { accuracyM: 80 },
    { speedKmh: null }, { speedKmh: 2 },
  ]) {
    const tracker = turning();
    tracker.observe(fix(3100, 67, overrides));
    assert.equal(tracker.sample(3100), null, JSON.stringify(overrides));
    tracker.observe(fix(3200, 90));
    assert.equal(tracker.sample(3200).turnRate, 0, "reacquisition establishes a new baseline");
  }
});

test("duplicate, reversed and absent timestamps neither replace the anchor nor renew freshness", () => {
  const tracker = turning();
  for (const timestamp of [3000, 2900, null, undefined, NaN, -1]) tracker.observe(fix(timestamp, 170));
  assert.equal(tracker.sample(3300).ageMs, 300);
  tracker.observe(fix(3300, 69.6));
  assert.ok(tracker.sample(3300).turnRate > 11);
  assert.equal(tracker.sample(4801), null);
  assert.equal(tracker.sample(3200), null);
});

test("stale heading reacquisition and implausible jumps cannot bend the tunnel", () => {
  const tracker = turning();
  tracker.observe(fix(5000, 170));
  assert.equal(tracker.sample(5000).turnRate, 0);
  tracker.observe(fix(5300, 350));
  assert.equal(tracker.sample(5300), null);
  tracker.observe(fix(5600, 350));
  assert.equal(tracker.sample(5600).turnRate, 0);
});

test("straight travel releases the curve and lost or reduced-motion input returns neutral", () => {
  const tracker = turning();
  for (let t = 3100; t <= 8000; t += 100) tracker.observe(fix(t, 66));
  assert.equal(apertureCurveTarget(tracker.sample(8000), 70), 0);
  const value = turning().sample(3000);
  assert.equal(apertureCurveTarget(value, 8), 0);
  assert.equal(apertureCurveTarget(value, 70, true), 0);
  assert.equal(apertureCurveTarget({ ...value, ageMs: 1501 }, 70), 0);
  let curve = { value: apertureCurveTarget(value, 70), velocity: 0 };
  for (let i = 0; i < 60; i++) curve = advanceCurveSpring(curve, 0, 1 / 60);
  assert.ok(Math.abs(curve.value) < 0.003);
  let shared = visualCurveTarget(value, 70);
  for (let i = 0; i < 60; i++) shared = advanceApertureCurve(shared, 0, 1 / 60);
  assert.ok(Math.abs(shared) < 0.012, "the shared exponential release used by other fields stays prompt");
});

test("reset removes previous direction and increments the input generation", () => {
  const tracker = turning();
  const generation = tracker.sample(3000).generation;
  tracker.reset();
  assert.equal(tracker.sample(3000), null);
  tracker.observe(fix(0, 180));
  assert.equal(tracker.sample(0).generation, generation + 1);
  assert.equal(tracker.sample(0).turnRate, 0);
});

test("all original visual consumers share the bounded direction and freshness gate", () => {
  const sample = turning().sample(3000);
  assert.ok(visualCurveTarget(sample, 70) > 0.5);
  for (const rate of [-900, -12, 0, 12, 900]) {
    const target = visualCurveTarget({ ...sample, turnRate: rate }, 70);
    assert.ok(Math.abs(target) <= 1);
    assert.equal(target, -visualCurveTarget({ ...sample, turnRate: -rate }, 70));
  }
  for (const changed of [null, { ...sample, ageMs: 1501 }, { ...sample, quality: 0.1 }]) {
    assert.equal(visualCurveTarget(changed, 70), 0);
  }
  assert.equal(visualCurveTarget(sample, 70, true), 0);
  assert.equal(visualCurveTarget(sample, 0), 0);
});

test("Aperture carries a curve from the near rim through the middle and far tunnel", () => {
  const curve = apertureCurveTarget(turning().sample(3000), 70);
  const near = apertureCurveOffset(curve, 0);
  const middle = apertureCurveOffset(curve, 0.5);
  const far = apertureCurveOffset(curve, 1);
  assert.ok(near > 0.03, "the near field must move with the tunnel");
  assert.ok(middle > 0.13, "the middle distance must carry a visible bend");
  assert.ok(near < middle && middle < far && far < 0.6);
  for (const depth of [0, 0.25, 0.5, 0.75, 1]) {
    assert.equal(apertureCurveOffset(-curve, depth), -apertureCurveOffset(curve, depth));
    assert.equal(apertureCurveOffset(0, depth), 0);
  }
});

test("the Aperture curve lean is stronger, continuous and still releases on loss", async () => {
  const { advanceCurveSpring, APERTURE_BANK_PER_CURVE } = await import("../src/motion/aperture-curve.js");
  const target = apertureCurveTarget(turning().sample(3000), 70);
  assert.ok(target > 0.25, `a clear turn leans the tunnel noticeably (${target})`);
  let state = { value: 0, velocity: 0 };
  let previous = 0;
  for (let frame = 0; frame < 45; frame += 1) {
    state = advanceCurveSpring(state, target, 1 / 60);
    assert.ok(state.value >= previous, "the lean builds without stepping back");
    previous = state.value;
  }
  assert.ok(state.value > target * 0.6);
  for (let frame = 0; frame < 60; frame += 1) state = advanceCurveSpring(state, 0, 1 / 60);
  assert.ok(Math.abs(state.value) < 0.01, "lost heading returns to straight within a second");
  assert.ok(APERTURE_BANK_PER_CURVE * 0.62 < 0.12, "the bank stays a gentle lean");
});

test("the strongest Aperture bend never compresses a wall by more than half", () => {
  const strongest = 0.62;
  for (let depth = 0; depth < 1; depth += 0.01) {
    const slope = (apertureCurveOffset(strongest, depth + 0.01) - apertureCurveOffset(strongest, depth)) / 0.01;
    assert.ok(slope < 0.56, `slope ${slope.toFixed(3)} at depth ${depth.toFixed(2)}`);
  }
});
