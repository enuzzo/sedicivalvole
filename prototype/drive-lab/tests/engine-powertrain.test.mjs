import assert from "node:assert/strict";
import test from "node:test";
import { engineSampleCents } from "../src/engine/sample-pitch.js";
import { estimateEngineDemand, advanceEngineDemand, transmissionCents, planEngineShift,
  sampleEngineShift, createEngineShiftController, boostDemand, createEngineBoost } from "../src/engine/powertrain.js";

const fresh = (speedKmh, accelerationMps2 = 0) => ({ speedKmh, accelerationMps2, freshness: "fresh", drive: 0.15 });
const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const shift = (overrides = {}) => planEngineShift({ at: 10, fromRpm: 7800, toRpm: 4300,
  fromLoad: 0.9, toLoad: 0.65, fromGear: 1, toGear: 2, duration: 0.3, ...overrides });
const turbo = { boost: { thresholdRpm: 1800, fullRpm: 4600, spoolSeconds: 0.65, decaySeconds: 0.42 } };

test("steady-speed demand includes rolling and quadratic drag instead of one constant cruise load", () => {
  const low = estimateEngineDemand(fresh(30)), middle = estimateEngineDemand(fresh(60)), high = estimateEngineDemand(fresh(120));
  assert.ok(low.roadLoad > 0.12 && low.throttle < middle.throttle && middle.throttle < high.throttle);
  near((high.roadLoad - 0.12) / (middle.roadLoad - 0.12), 4);
  const accelerating = estimateEngineDemand(fresh(60, 2));
  const coasting = estimateEngineDemand(fresh(60, -1));
  assert.ok(accelerating.load > middle.load && middle.load > coasting.load);
  assert.equal(coasting.throttle, 0); assert.equal(coasting.coast, 1);
  assert.equal("masterGain" in coasting, false);
});

test("untrusted GPS cannot request acceleration or boost, while an explicit manual gesture works without GPS", () => {
  for (const freshness of ["lost", "degraded", undefined]) {
    const demand = estimateEngineDemand({ ...fresh(90, 4), freshness });
    assert.equal(demand.throttle, 0); assert.equal(demand.roadLoad, 0); assert.equal(demand.coast, 0);
    assert.equal(estimateEngineDemand({ freshness }, {}, { throttleOverride: 0.8 }).throttle, 0.8);
  }
  assert.equal(estimateEngineDemand({ freshness: "fresh", speedKmh: 45, drive: 0.7 }).throttle, 0.7);
});

test("resolved receiver accelerator/regen controls override the inferred cruise load", () => {
  assert.equal(estimateEngineDemand({ ...fresh(80), drive: 0 }).throttle, 0);
  assert.equal(estimateEngineDemand({ ...fresh(80), drive: 1 }).throttle, 1);
  assert.equal(estimateEngineDemand({ ...fresh(80), driveInput: "regen" }).throttle, 0);
  assert.equal(estimateEngineDemand({ ...fresh(80), brakeHeld: true }).throttle, 0);
  assert.equal(estimateEngineDemand({ ...fresh(80), driveInput: "accelerator" }).throttle, 1);
});

test("explicit zero, invalid observations and profile tuning stay finite and bounded", () => {
  const config = { powertrain: { rollingLoad: Infinity, dragLoad: -4, accelerationForFullLoad: 0, idleLoad: NaN } };
  for (const value of [NaN, Infinity, -Infinity, null, -100, 99999]) {
    const target = estimateEngineDemand({ freshness: "fresh", speedKmh: value, accelerationMps2: value }, config);
    for (const number of Object.values(target)) assert.ok(Number.isFinite(number) && number >= 0 && number <= 1);
  }
  assert.equal(estimateEngineDemand(fresh(0)).roadLoad, 0);
  assert.equal(estimateEngineDemand(fresh(60, 2), {}, { throttleOverride: 0 }).throttle, 0);
});

test("constant-demand exponential response agrees across 44.1/48 kHz and jittered controller subdivisions", () => {
  const run = (steps) => {
    let result = null;
    for (const dt of steps) result = advanceEngineDemand(result, fresh(85, 1), {}, dt);
    return result;
  };
  const regular = run(Array(40).fill(0.025));
  const jittered = run(Array(10).fill([0.009, 0.041, 0.019, 0.031]).flat());
  const rate441 = run(Array(44100).fill(1 / 44100)), rate480 = run(Array(48000).fill(1 / 48000));
  for (const key of Object.keys(regular)) {
    near(jittered[key], regular[key]); near(rate441[key], regular[key]); near(rate480[key], regular[key]);
  }
  const frozen = advanceEngineDemand(regular, fresh(0), {}, -1);
  assert.deepEqual(frozen, regular);
});

test("wheel-owned transmission pitch survives a gear/RPM change at constant road speed", () => {
  const before = transmissionCents(65, { powertrain: { transmissionReferenceKmh: 65, transmissionBaseCents: 0 } });
  const after = transmissionCents(65, { rpm: 7500, gear: 1, powertrain: { transmissionReferenceKmh: 65, transmissionBaseCents: 0 } });
  assert.equal(before, 0); assert.equal(after, before);
  near(transmissionCents(100) - transmissionCents(50), 1200);
  for (const speed of [0, -1, 1, 260, NaN, Infinity]) assert.ok(Math.abs(transmissionCents(speed)) <= 2400);
});

test("road load and transmission pitch stop growing at 130 without mutating GPS evidence", () => {
  const ceiling = estimateEngineDemand(fresh(130));
  for (const speed of [131, 160, 260]) {
    const evidence = fresh(speed);
    assert.deepEqual(estimateEngineDemand(evidence), ceiling);
    assert.equal(transmissionCents(speed), transmissionCents(130));
    assert.equal(evidence.speedKmh, speed);
  }
  assert.ok(estimateEngineDemand(fresh(80, 2)).load > 0.9);
  assert.ok(estimateEngineDemand(fresh(30)).load < 0.25);
});

test("core texture pitch doubles with RPM instead of retaining a high urban pitch", () => {
  const asset = { rpm: 5300 };
  const at1800 = engineSampleCents(1800, asset, { id: "rosso" });
  near(engineSampleCents(3600, asset, { id: "rosso" }) - at1800, 1200);
  near(asset.rpm * 2 ** (at1800 / 1200), 1800);
  assert.ok(at1800 < -1800);
  near(engineSampleCents(3400, { rpm: 1000 }, { id: "mono" }), 0);
  near(engineSampleCents(1700, { rpm: 1000 }, { id: "mono" }), -1200);
  for (const rpm of [0, 600, 1000, 9000, 99999, NaN, Infinity]) {
    assert.ok(Math.abs(engineSampleCents(rpm, asset, {})) <= 2400);
  }
});

test("shift has distinct release, synchronized commit and re-engagement on exact audio time", () => {
  const plan = shift();
  assert.ok(Object.isFrozen(plan) && Object.isFrozen(plan.points) && Object.isFrozen(plan.points[0]));
  assert.equal(sampleEngineShift(plan, 9).phase, "pending");
  assert.equal(sampleEngineShift(plan, plan.startAt).load, 0.9);
  assert.equal(sampleEngineShift(plan, plan.releaseAt).clutch, 0);
  assert.equal(sampleEngineShift(plan, plan.releaseAt).phase, "synchronize");
  assert.equal(sampleEngineShift(plan, plan.commitAt).rpm, 4300);
  assert.equal(sampleEngineShift(plan, plan.commitAt).phase, "engage");
  assert.equal(sampleEngineShift(plan, plan.commitAt).committed, true);
  assert.equal(sampleEngineShift(plan, plan.endAt).load, 0.65);
  assert.equal(sampleEngineShift(plan, plan.endAt).clutch, 1);
  assert.equal(sampleEngineShift(plan, plan.endAt).done, true);
  for (const point of plan.points) assert.equal("masterGain" in point, false);
});

test("downshift rev matching rises while clutch is open and settles before load return", () => {
  const plan = shift({ fromGear: 3, toGear: 2, fromRpm: 3200, toRpm: 5200, fromLoad: 0.08, toLoad: 0.15 });
  const release = sampleEngineShift(plan, plan.releaseAt);
  const blip = sampleEngineShift(plan, (plan.releaseAt + plan.syncAt) / 2);
  const sync = sampleEngineShift(plan, plan.syncAt);
  assert.ok(blip.rpm > release.rpm && sync.rpm > blip.rpm);
  assert.equal(blip.clutch, 0); assert.ok(blip.load > 0.6 && sync.load < 0.1);
  assert.equal(sync.rpm, 5200); assert.equal(plan.reason, "downshift");
});

test("shift ramps are continuous at every keyframe and invariant to polling cadence/sample rate", () => {
  for (const plan of [shift(), shift({ fromGear: 3, toGear: 2, fromRpm: 3000, toRpm: 5100 })]) {
    for (const point of plan.points) {
      const left = sampleEngineShift(plan, point.at - 1e-9), right = sampleEngineShift(plan, point.at + 1e-9);
      near(left.rpm, right.rpm, 0.0002); near(left.load, right.load, 1e-7);
    }
    for (const sampleRate of [44100, 48000]) {
      let previous = sampleEngineShift(plan, plan.startAt);
      for (let frame = 1; frame <= Math.ceil(plan.duration * sampleRate); frame++) {
        const current = sampleEngineShift(plan, plan.startAt + frame / sampleRate);
        assert.ok(Math.abs(current.rpm - previous.rpm) < 2);
        assert.ok(Math.abs(current.load - previous.load) < 0.01);
        previous = current;
      }
    }
  }
});

test("one active shift rejects overlap and late polling emits one timestamped commit", () => {
  const controller = createEngineShiftController();
  const input = { at: 4, fromRpm: 7000, toRpm: 4000, fromGear: 1, toGear: 2 };
  const plan = controller.schedule(input);
  assert.equal(controller.schedule({ ...input, at: 4.1 }), null);
  assert.deepEqual(controller.sample(4).events, []);
  const late = controller.sample(4.6);
  assert.deepEqual(late.events, [{ type: "commit", at: plan.commitAt, gear: 2 }, { type: "complete", at: plan.endAt, gear: 2 }]);
  assert.equal(controller.sample(4.8), null);
  assert.ok(controller.schedule({ ...input, at: 5 }));
  controller.cancel(); assert.equal(controller.sample(6), null);
});

test("invalid shifts fail before scheduling and profile times/RPM stay bounded", () => {
  assert.throws(() => shift({ at: NaN }), RangeError);
  assert.throws(() => shift({ toGear: 1 }), RangeError);
  assert.throws(() => shift({ toRpm: Infinity }), RangeError);
  const plan = shift({ duration: 20, toRpm: 20000, profile: { configuration: { engine: { limiter: 8100 } }, powertrain: { shiftReleaseFraction: 0.8, shiftSyncFraction: 0.1 } } });
  assert.equal(plan.duration, 0.9); assert.equal(plan.points.at(-1).rpm, 8100);
  for (let i = 1; i < plan.points.length; i++) assert.ok(plan.points[i].at > plan.points[i - 1].at);
});

test("boost needs a declared turbo profile and both exhaust load and RPM", () => {
  assert.equal(boostDemand({ rpm: 6000, load: 1 }), 0);
  assert.equal(boostDemand({ rpm: 6000, load: 1 }, { boost: { enabled: false } }), 0);
  assert.equal(boostDemand({ rpm: 1000, load: 1 }, turbo), 0);
  assert.equal(boostDemand({ rpm: 6000, load: 0.08 }, turbo), 0);
  assert.equal(boostDemand({ rpm: 6000, load: 1 }, turbo), 1);
});

test("turbo spool has duration-invariant lag and one bounded lift-off valve event", () => {
  const run = (dt) => {
    const model = createEngineBoost(turbo); model.sample({ at: 0, rpm: 6000, load: 1 });
    let state;
    for (let i = 1; i <= Math.round(2 / dt); i++) state = model.sample({ at: i * dt, rpm: 6000, load: 1 });
    return { model, state };
  };
  const fine = run(0.01), coarse = run(0.1);
  near(fine.state.spool, coarse.state.spool);
  assert.ok(fine.state.spool > 0.9 && fine.state.spool < 1);
  const release = fine.model.sample({ at: 2.025, rpm: 5000, load: 0.08 });
  assert.equal(release.event.type, "blow-off"); assert.equal(release.event.at, 2.025);
  assert.ok(release.blowOff > 0.8 && release.blowOff <= 1);
  for (let i = 1; i <= 20; i++) {
    const state = fine.model.sample({ at: 2.025 + i * 0.025, rpm: 5000, load: 0.08 });
    assert.equal(state.event, null); assert.ok(state.blowOff >= 0 && state.blowOff <= 1);
    if (i >= 12) assert.equal(state.blowOff, 0);
  }
});

test("shift release vents once; mute, lifecycle gaps and clock rewind cancel every boost event", () => {
  const model = createEngineBoost(turbo);
  const charge = () => { for (let i = 0; i <= 100; i++) model.sample({ at: i * 0.025, rpm: 6000, load: 1 }); };
  charge(); assert.ok(model.sample({ at: 2.525, rpm: 5000, load: 0.8, shiftRelease: true }).event);
  assert.equal(model.sample({ at: 2.55, rpm: 5000, load: 0.8, shiftRelease: true }).event, null);
  assert.deepEqual(model.sample({ at: 2.575, active: false }), { spool: 0, target: 0, blowOff: 0, event: null });
  assert.equal(model.sample({ at: 2.6, rpm: 6000, load: 0.08 }).event, null);
  model.reset(); charge(); assert.equal(model.sample({ at: 10, rpm: 6000, load: 0.08 }).spool, 0);
  assert.equal(model.sample({ at: 1, rpm: 6000, load: 0.08 }).event, null);
});

test("gradual throttle closure still releases stored boost once after smoothing", () => {
  const model = createEngineBoost(turbo), events = [];
  for (let i = 0; i <= 100; i++) model.sample({ at: i * 0.025, rpm: 6000, load: 1 });
  for (let i = 1; i <= 40; i++) {
    const state = model.sample({ at: 2.5 + i * 0.025, rpm: 5000, load: Math.max(0.08, 1 - i * 0.045) });
    if (state.event) events.push(state.event);
  }
  assert.equal(events.length, 1);
  assert.ok(events[0].level > 0.16 && events[0].at > 2.5);
});
