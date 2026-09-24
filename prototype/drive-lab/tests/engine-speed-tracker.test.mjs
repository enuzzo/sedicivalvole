import assert from "node:assert/strict";
import test from "node:test";
import { createSpeedTracker } from "../src/engine/speed-tracker.js";
import { createEngineMotion } from "../src/engine/motion.js";
import { followRoadSpeed, launchSlipRpm } from "../src/engine/powertrain.js";

// Truth: 2 m/s² from standstill (7.2 km/h per second).
const truth = (ms) => Math.min(130, 7.2 * ms / 1000);

test("a provider that only changes once a second is followed continuously, not in steps", () => {
  const tracker = createSpeedTracker();
  let worst = 0;
  for (let ms = 0; ms <= 8000; ms += 100) {
    const reported = truth(Math.floor(ms / 1000) * 1000); // held for a whole second
    tracker.observe(reported, ms);
    if (ms >= 3000) {
      for (let at = ms; at < ms + 100; at += 25) worst = Math.max(worst, Math.abs(tracker.predict(at) - truth(at)));
    }
  }
  // The held value lags truth by up to 7 km/h; the prediction stays close.
  assert.ok(worst < 2.2, `prediction error ${worst.toFixed(2)} km/h`);
  assert.ok(Math.abs(tracker.accelerationMps2 - 2) < 0.35, `trend ${tracker.accelerationMps2}`);
  assert.ok(tracker.intervalMs > 800 && tracker.intervalMs < 1200);
});

test("whole-km/h values at 10 Hz (the owner's Tesla trace) give a steady trend", () => {
  const tracker = createSpeedTracker();
  const trends = [];
  for (let ms = 0; ms <= 6000; ms += 100) {
    tracker.observe(Math.round(truth(ms)), ms);
    if (ms >= 2000) trends.push(tracker.accelerationMps2);
  }
  const min = Math.min(...trends), max = Math.max(...trends);
  // The old per-callback estimate swung between 0 and several m/s² at each step.
  assert.ok(min > 1.2 && max < 2.8, `trend range ${min.toFixed(2)}–${max.toFixed(2)}`);
  assert.ok(Math.abs(tracker.predict(6000) - truth(6000)) < 1.8);
});

test("a real constant speed settles the trend, and a stop predicts exactly zero", () => {
  const tracker = createSpeedTracker();
  for (let ms = 0; ms <= 3000; ms += 100) tracker.observe(Math.round(truth(ms)), ms);
  for (let ms = 3100; ms <= 7000; ms += 100) tracker.observe(22, ms);
  assert.ok(Math.abs(tracker.accelerationMps2) < 0.3, `cruise trend ${tracker.accelerationMps2}`);
  assert.ok(Math.abs(tracker.predict(7000) - 22) < 0.8);
  for (const [ms, speed] of [[7100, 12], [7400, 6], [7700, 2], [8000, 0]]) tracker.observe(speed, ms);
  assert.equal(tracker.predict(8200), 0);
  tracker.observe(3, 8300);
  assert.ok(tracker.predict(8600) >= 0);
});

test("stepped providers are not mistaken for outliers, while real glitches still are", () => {
  const stepped = createEngineMotion();
  const gps = (m, t, speed) => m.observe({ source: "GPS", rawSpeedKmh: speed, sourceTimestampMs: 100000 + t, epochNowMs: 100000 + t, receivedMs: t, accuracyM: 5, liveWatch: true });
  for (let ms = 0; ms <= 5000; ms += 100) {
    gps(stepped, ms, truth(Math.floor(ms / 1000) * 1000));
    assert.notEqual(stepped.snapshot(ms).freshness, "lost", `lost at ${ms} ms`);
  }
  const snapshot = stepped.snapshot(5050);
  assert.ok(snapshot.predictedSpeedKmh > snapshot.speedKmh, "the prediction leads the held value");
  assert.ok(snapshot.drive > 0.5, `drive ${snapshot.drive}`);
  const glitch = createEngineMotion();
  for (let ms = 0; ms <= 1000; ms += 100) gps(glitch, ms, 20);
  gps(glitch, 1100, 120);
  assert.equal(glitch.snapshot(1100).freshness, "lost");
});

test("the acoustic road speed glides to a correction and pull-away slips the clutch", () => {
  let spring = followRoadSpeed(null, 40, 0.025);
  assert.equal(spring.value, 40);
  let biggestStep = 0, previous = spring.value;
  for (let i = 0; i < 40; i++) {
    spring = followRoadSpeed(spring, 47, 0.025);
    biggestStep = Math.max(biggestStep, spring.value - previous); previous = spring.value;
  }
  assert.ok(Math.abs(spring.value - 47) < 0.4 && biggestStep < 1.2, `step ${biggestStep}`);
  const profile = { powertrain: {} };
  assert.equal(launchSlipRpm({ gear: 1, speedKmh: 0, load: 1 }, profile), 0);
  assert.ok(launchSlipRpm({ gear: 1, speedKmh: 6, load: 0.9 }, profile) > 2200);
  assert.ok(launchSlipRpm({ gear: 1, speedKmh: 6, load: 0.1 }, profile) < 1100);
  // The floor is flat in speed, so the road ratio overtakes it without a dip.
  assert.equal(launchSlipRpm({ gear: 1, speedKmh: 8, load: 0.9 }, profile), launchSlipRpm({ gear: 1, speedKmh: 16, load: 0.9 }, profile));
  assert.equal(launchSlipRpm({ gear: 2, speedKmh: 6, load: 1 }, profile), 0);
  assert.equal(launchSlipRpm({ gear: 1, speedKmh: 6, load: 1, stationary: true }, profile), 0);
  assert.equal(launchSlipRpm({ gear: 1, speedKmh: 25, load: 1 }, profile), 0);
});
