import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCELERATION_REFRACTORY_MS,
  ACCELERATION_STALE_MS,
  accelerationTrajectoryIsBloom,
  advanceAccelerationDetectorClock,
  createAccelerationDetectorState,
  observeAccelerationDetector,
} from "../src/acceleration-detector.js";

function run(samples, initial = createAccelerationDetectorState()) {
  let state = initial;
  let triggered = false;
  for (const sample of samples) {
    const result = observeAccelerationDetector(state, sample);
    state = result.state;
    triggered ||= result.triggered;
  }
  return { state, triggered };
}

test("a Highland AWD full-throttle curve crosses OPEN once", () => {
  const samples = [
    { speedKmh: 0, capturedAtMs: 0, accuracyM: 3 },
    { speedKmh: 8, capturedAtMs: 300, accuracyM: 3 },
    { speedKmh: 17, capturedAtMs: 650, accuracyM: 3 },
    { speedKmh: 27, capturedAtMs: 1050, accuracyM: 3 },
    { speedKmh: 35, capturedAtMs: 1450, accuracyM: 3 },
    { speedKmh: 44, capturedAtMs: 1900, accuracyM: 3 },
  ];
  const result = run(samples);
  assert.equal(result.triggered, true);
  assert.equal(result.state.active, true);
  assert.ok(result.state.riseKmh >= 30);
  assert.ok(result.state.averageMps2 >= 3.8);
  assert.equal(accelerationTrajectoryIsBloom(result.state), true);

  const repeated = observeAccelerationDetector(result.state, {
    speedKmh: 48,
    capturedAtMs: 2150,
    accuracyM: 3,
  });
  assert.equal(repeated.triggered, false);
});

test("ordinary urban acceleration, a GPS spike, and inaccurate fixes stay quiet", () => {
  const urban = run([
    { speedKmh: 0, capturedAtMs: 0, accuracyM: 4 },
    { speedKmh: 5, capturedAtMs: 900, accuracyM: 4 },
    { speedKmh: 11, capturedAtMs: 1800, accuracyM: 4 },
    { speedKmh: 17, capturedAtMs: 2700, accuracyM: 4 },
  ]);
  assert.equal(urban.triggered, false);

  const spike = run([
    { speedKmh: 20, capturedAtMs: 0, accuracyM: 3 },
    { speedKmh: 61, capturedAtMs: 800, accuracyM: 3 },
    { speedKmh: 21, capturedAtMs: 1100, accuracyM: 3 },
  ]);
  assert.equal(spike.triggered, false);

  const inaccurate = run([
    { speedKmh: 0, capturedAtMs: 0, accuracyM: 4 },
    { speedKmh: 18, capturedAtMs: 700, accuracyM: 60 },
    { speedKmh: 38, capturedAtMs: 1400, accuracyM: 60 },
  ]);
  assert.equal(inaccurate.triggered, false);
});

test("one-second GPS cadence still confirms a hard 30 km/h rise", () => {
  const result = run([
    { speedKmh: 10, capturedAtMs: 0, accuracyM: 8 },
    { speedKmh: 25, capturedAtMs: 1000, accuracyM: 8 },
    { speedKmh: 42, capturedAtMs: 2000, accuracyM: 8 },
  ]);
  assert.equal(result.triggered, true);
  assert.equal(result.state.active, true);
});

test("GPS gaps, braking, normalization, and reversal release cleanly", () => {
  const launched = run([
    { speedKmh: 10, capturedAtMs: 0, accuracyM: 3 },
    { speedKmh: 27, capturedAtMs: 800, accuracyM: 3 },
    { speedKmh: 44, capturedAtMs: 1600, accuracyM: 3 },
  ]).state;
  assert.equal(launched.active, true);

  const braking = observeAccelerationDetector(launched, {
    speedKmh: 40,
    capturedAtMs: 1750,
    accuracyM: 3,
    braking: true,
  });
  assert.equal(braking.state.active, false);
  assert.equal(braking.released, true);

  const stale = advanceAccelerationDetectorClock(launched, {
    nowMs: launched.lastSampleAtMs + ACCELERATION_STALE_MS + 1,
  });
  assert.equal(stale.active, false);

  let normalized = observeAccelerationDetector(launched, {
    speedKmh: 44.5,
    capturedAtMs: 1900,
    accuracyM: 3,
  }).state;
  normalized = observeAccelerationDetector(normalized, {
    speedKmh: 45,
    capturedAtMs: 2550,
    accuracyM: 3,
  }).state;
  normalized = observeAccelerationDetector(normalized, {
    speedKmh: 45.2,
    capturedAtMs: 3200,
    accuracyM: 3,
  }).state;
  assert.equal(normalized.active, false);
});

test("the refractory period blocks boundary reversals from retriggering", () => {
  let state = run([
    { speedKmh: 10, capturedAtMs: 0, accuracyM: 3 },
    { speedKmh: 27, capturedAtMs: 800, accuracyM: 3 },
    { speedKmh: 44, capturedAtMs: 1600, accuracyM: 3 },
  ]).state;
  state = observeAccelerationDetector(state, {
    speedKmh: 40,
    capturedAtMs: 1750,
    accuracyM: 3,
    braking: true,
  }).state;
  const refractoryUntilMs = state.refractoryUntilMs;
  assert.equal(refractoryUntilMs, 1750 + ACCELERATION_REFRACTORY_MS);

  const reversal = run([
    { speedKmh: 40, capturedAtMs: 1900, accuracyM: 3 },
    { speedKmh: 57, capturedAtMs: 2600, accuracyM: 3 },
    { speedKmh: 74, capturedAtMs: 3350, accuracyM: 3 },
  ], state);
  assert.equal(reversal.triggered, false);
});
