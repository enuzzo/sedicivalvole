import assert from "node:assert/strict";
import test from "node:test";
import { DRIVE_ROUTE, RATE, createCompressorModel, cruiseSegments, silenceNoise, speedAt, teslaGps } from "../scripts/engine-acoustics/measure.mjs";
import { AutomatedParam, driveMetrics, loadEngineSources, replayDrive } from "../scripts/engine-acoustics/replay.mjs";
import { COMBUSTION_ENGINES } from "../src/engine/combustion/engines.js";

const root = new URL("../", import.meta.url).pathname.replace(/\/$/, "");
const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test("the replay's AudioParam follows Web Audio automation: set, target, ramp, cancel-and-hold", () => {
  const param = new AutomatedParam(0);
  param.setTargetAtTime(1, 1, 0.5);
  near(param.at(0.5), 0); near(param.at(2), 1 - Math.exp(-2));
  const ramp = new AutomatedParam(0);
  ramp.setValueAtTime(0, 0); ramp.linearRampToValueAtTime(1, 2);
  near(ramp.at(1), 0.5); near(ramp.at(3), 1);
  ramp.cancelAndHoldAtTime(1);
  near(ramp.at(1.5), 0.5);
  ramp.prune(1.2);
  near(ramp.at(5), 0.5);
});

test("the master compressor model leaves quiet signals alone and holds a loud one near its curve", () => {
  const steady = amplitude => { const model = createCompressorModel(); for (let i = 0; i < RATE; i++) model.process(amplitude * Math.sin(i / 7)); return model.reductionDb; };
  near(steady(0.1), 0, 1e-6);
  // 0 dBFS peaks against −8 dB, 20:1: 8 − 8 / 20 = 7.6 dB of reduction at the crest.
  assert.ok(steady(1) > 6.5 && steady(1) < 7.7, `${steady(1)}`);
});

test("Tesla-like GPS keeps whole km/h at 10 Hz and an exact zero at a standstill", () => {
  const gps = teslaGps([[0, 0], [2, 0], [6, 40], [8, 40]]);
  assert.equal(gps.length, 81);
  assert.ok(gps.every(sample => Number.isInteger(sample.speed)));
  assert.ok(gps.filter(sample => sample.t <= 2).every(sample => sample.speed === 0));
  near(speedAt(DRIVE_ROUTE, 9), 28);
  assert.deepEqual(cruiseSegments(DRIVE_ROUTE), [[16, 28], [33, 42], [56, 70], [92, 100]]);
});

test("silencing noise zeroes every aperiodic source and leaves the engine definition intact", () => {
  for (const spec of Object.values(COMBUSTION_ENGINES)) {
    const quiet = silenceNoise(spec);
    assert.equal(quiet.pulse.grit + quiet.pulse.flowGrit + (quiet.pulse.turbulence ?? 0) + quiet.intake.roar, 0);
    if (spec.forced) assert.equal(quiet.forced.whoosh + quiet.forced.whistle, 0);
    assert.equal(quiet.firing, spec.firing); assert.equal(quiet.idleRpm, spec.idleRpm);
  }
});

test("a drive replay runs the real runtime: upshifts hold the throttle, a held lift reaches overrun, no pops in a stock map", async () => {
  const route = [[0, 0], [3, 0], [9, 55], [16, 55], [20, 30], [26, 30]];
  const replay = await replayDrive(await loadEngineSources(root), { profileId: "v10", gps: teslaGps(route), seconds: 26 });
  const metrics = driveMetrics(replay, cruiseSegments(route));
  assert.ok(metrics.upshifts >= 2, `${metrics.upshifts} upshifts`);
  assert.ok(metrics.upshiftOverrun < 0.05 && metrics.upshiftTip < 0.2, JSON.stringify(metrics));
  assert.equal(metrics.pops, 0); assert.ok(metrics.maxReductionDb < 0.5);
  assert.ok(replay.rows.some(row => row.t > 16 && row.t < 22 && row.overrun > 0.5), "the lift reaches overrun");
  assert.ok(replay.output.every(Number.isFinite));
});
