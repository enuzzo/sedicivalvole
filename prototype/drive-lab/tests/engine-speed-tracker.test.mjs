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
  const held = glitch.snapshot(1100);
  assert.equal(held.reason, "speed-outlier");
  assert.equal(held.freshness, "degraded", "the glitch is rejected and the last good speed held");
  assert.equal(held.speedKmh, 20);
  assert.equal(held.canShift, false);
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

// November 7 asymmetric trust: a lift is followed at once, a pull never jumps.
function liftDrive(stepMs) {
  // 40 km/h, 2.5 m/s² for 4 s, then 8 m/s³ down to -1.5 m/s² (a lift with regen).
  let v = 40, a = 2.5; const samples = []; let crossedAt = null;
  for (let ms = 0; ms <= 8000; ms += 10) {
    if (ms > 4000) a = Math.max(-1.5, a - 8 * 0.01);
    if (crossedAt == null && a <= 0) crossedAt = ms;
    v += a * 3.6 * 0.01;
    if (ms % stepMs === 0) samples.push([ms, Math.round(v)]);
  }
  return { samples, crossedAt };
}
function reactionMs(stepMs, policy) {
  const tracker = createSpeedTracker(policy), { samples, crossedAt } = liftDrive(stepMs);
  let reacted = null;
  for (const [ms, value] of samples) { tracker.observe(value, ms); if (ms > crossedAt && reacted == null && tracker.accelerationMps2 <= 0) reacted = ms - crossedAt; }
  return { reacted, lifts: tracker.liftCues };
}
const symmetric = { leadSeconds: .25, horizonSeconds: 1.2, decaySeconds: 1, minWindowMs: 120, maxWindowMs: 1500, liftResidualKmh: Infinity, quantumKmh: 1 };

test("a lift-off is followed sooner than the symmetric tracker, at 10 Hz and at 1 Hz", () => {
  for (const step of [100, 1000]) {
    const asymmetric = reactionMs(step), before = reactionMs(step, symmetric);
    assert.ok(asymmetric.lifts >= 1, `${step} ms: no lift cue`);
    assert.ok(asymmetric.reacted <= before.reacted * 0.8, `${step} ms: ${asymmetric.reacted} vs ${before.reacted} ms`);
  }
});

test("a pull, a launch and a wandering cruise never fire the lift cue", () => {
  const pull = createSpeedTracker();
  for (let ms = 0; ms <= 8000; ms += 100) pull.observe(Math.round(truth(ms)), ms);
  assert.equal(pull.liftCues, 0);
  const hourly = createSpeedTracker();
  for (let ms = 0; ms <= 8000; ms += 1000) hourly.observe(truth(ms), ms);
  assert.equal(hourly.liftCues, 0);
  const cruise = createSpeedTracker();
  for (let ms = 0; ms <= 20000; ms += 100) cruise.observe(Math.round(80 + 0.8 * Math.sin(ms / 900) + 0.4 * Math.sin(ms / 230)), ms);
  assert.equal(cruise.liftCues, 0);
});

test("one whole-km/h flip after a steady hold reads as a rounding step, not a lift", () => {
  for (const flipAt of [7600, 7700, 7800, 7900, 8000]) {
    const tracker = createSpeedTracker();
    // Slowing from 73 to 54 km/h at about -1 m/s², then a steady 54 km/h with one 53.
    for (let ms = 0; ms <= 5000; ms += 100) tracker.observe(Math.round(73 - 3.8 * ms / 1000), ms);
    let ms = 5100, worst = 0;
    for (; ms < flipAt; ms += 100) tracker.observe(54, ms);
    tracker.observe(53, ms); worst = Math.min(worst, tracker.accelerationMps2);
    for (ms += 100; ms <= flipAt + 2000; ms += 100) { tracker.observe(54, ms); worst = Math.min(worst, tracker.accelerationMps2); }
    // Unbounded, the flip read as up to -0.58 m/s² for about a second: a fuel-cut lift at a town cruise.
    assert.ok(worst > -0.25, `flip at ${flipAt} ms: trend ${worst.toFixed(2)} m/s²`);
  }
});
