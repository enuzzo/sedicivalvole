import test from "node:test";
import assert from "node:assert/strict";
import { createGpsCurveTracker } from "../src/motion/gps-curve.js";
import { apertureCurveTarget } from "../src/motion/aperture-curve.js";

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
