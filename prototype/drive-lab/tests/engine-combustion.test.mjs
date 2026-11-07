import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { buildSync } from "esbuild";
import { CombustionEngine } from "../src/engine/combustion/dsp.js";
import { COMBUSTION_ENGINES, COMBUSTION_ENGINE_IDS } from "../src/engine/combustion/engines.js";
import { aWeightedDb, silenceNoise } from "../scripts/engine-acoustics/measure.mjs";

const root = new URL("../", import.meta.url).pathname;
const bundle = entry => buildSync({ entryPoints: [root + entry], bundle: true, format: "cjs", platform: "node", write: false }).outputFiles[0].text;
const load = entry => { const module = { exports: {} }; vm.runInNewContext(bundle(entry), { module, exports: module.exports }); return module.exports; };

/** Renders a steady state; returns the mono mix after `settle` seconds. */
function steady(id, { rate = 48000, rpm = 3000, load = 0.5, boost = 0, seconds = 2, settle = 0.5, events = 1, active = 1, spec = {} } = {}) {
  const engine = new CombustionEngine(rate, { ...COMBUSTION_ENGINES[id], ...spec });
  const frames = Math.round(rate * seconds), left = new Float32Array(frames), right = new Float32Array(frames);
  for (let at = 0; at < frames; at += 128) {
    const size = Math.min(128, frames - at);
    engine.process(left.subarray(at, at + size), right.subarray(at, at + size), size, [rpm], [load], [boost], active, events);
  }
  const from = Math.round(rate * settle), mono = Float32Array.from(left.subarray(from), (v, i) => (v + right[from + i]) / 2);
  return { engine, left, right, mono };
}
const rms = samples => Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);

test("every engine fires once per cylinder per four-stroke cycle at both output rates", () => {
  for (const rate of [44100, 48000]) for (const id of COMBUSTION_ENGINE_IDS) for (const rpm of [900, 4200]) {
    const { engine } = steady(id, { rate, rpm, load: 0.4, seconds: 2, settle: 0 });
    const expected = rpm * COMBUSTION_ENGINES[id].firing.length / 120 * 2;
    // Idle wander may move the crank by ±2 %; the count follows the sample clock.
    assert.ok(Math.abs(engine.cycles - expected) <= Math.max(3, expected * 0.03), `${id} ${rate} ${rpm}: ${engine.cycles} vs ${expected}`);
  }
});

test("output stays finite and below full scale across idle, full load, overrun and the limiter", () => {
  for (const id of COMBUSTION_ENGINE_IDS) {
    const spec = COMBUSTION_ENGINES[id];
    for (const [rpm, loadValue, boost] of [[spec.idleRpm, 0.08, 0], [spec.redlineRpm * 0.9, 1, 1], [spec.redlineRpm * 0.7, 0.05, 0], [spec.limiterRpm, 1, 1]]) {
      const { left, right } = steady(id, { rpm, load: loadValue, boost, seconds: 1.5, settle: 0 });
      for (const channel of [left, right]) for (const value of channel) assert.ok(Number.isFinite(value) && Math.abs(value) <= 1, `${id} ${rpm}`);
    }
  }
});

test("full load is louder than idle, and lifting off at the same rpm is quieter than pulling", () => {
  for (const id of COMBUSTION_ENGINE_IDS) {
    const spec = COMBUSTION_ENGINES[id], rpm = Math.round(spec.redlineRpm * 0.6);
    const idle = rms(steady(id, { rpm: spec.idleRpm, load: 0.08 }).mono);
    const pull = rms(steady(id, { rpm, load: 1, boost: spec.forced ? 1 : 0 }).mono);
    const coast = rms(steady(id, { rpm, load: 0.05, events: 0 }).mono);
    assert.ok(pull > idle * 1.6, `${id}: pull ${pull} idle ${idle}`);
    assert.ok(coast < pull * 0.8, `${id}: coast ${coast} pull ${pull}`);
  }
});

// November 7 road listening: a cabin hears the firing orders (bass and mids) at
// idle and cruise, never a bed of wind; flow noise grows only as the throttle opens.
test("flow noise stays far under the firing orders at idle, cruise and lifts, and grows as the throttle opens", () => {
  const { ENGINE_PROFILES } = load("src/engine/profiles.js");
  const { boostDemand } = load("src/engine/powertrain.js");
  for (const id of COMBUSTION_ENGINE_IDS) {
    const profile = ENGINE_PROFILES.find(item => item.id === id);
    const share = (rpm, loadValue) => {
      const options = { rpm, load: loadValue, boost: boostDemand({ rpm, load: loadValue }, profile), seconds: 1.4, settle: 0.6, events: 0 };
      const full = steady(id, options).mono, clean = steady(id, { ...options, spec: silenceNoise(COMBUSTION_ENGINES[id]) }).mono;
      return aWeightedDb(full.map((value, i) => value - clean[i])) - aWeightedDb(full);
    };
    // Load as the runtime drives it: idle, 50 km/h, 110 km/h, a lift at 3,000 rpm, flat out.
    const idle = share(COMBUSTION_ENGINES[id].idleRpm, 0.08), town = share(1800, 0.25), cruise = share(2700, 0.45);
    const lift = share(3000, 0.08), pull = share(4200, 0.95);
    assert.ok(idle < -22 && town < -20 && lift < -20, `${id}: idle ${idle.toFixed(1)} town ${town.toFixed(1)} lift ${lift.toFixed(1)} dBA`);
    assert.ok(cruise < -15, `${id}: cruise ${cruise.toFixed(1)} dBA`);
    assert.ok(pull > cruise + 8, `${id}: pull ${pull.toFixed(1)} cruise ${cruise.toFixed(1)} dBA`);
  }
});

test("rendering is deterministic for one engine definition", () => {
  const a = steady("v8-crossplane", { seconds: 0.6, settle: 0 }).mono, b = steady("v8-crossplane", { seconds: 0.6, settle: 0 }).mono;
  assert.deepEqual(a, b);
});

test("the rev limiter cuts ignition in bursts while the engine sits on the limit", () => {
  for (const id of COMBUSTION_ENGINE_IDS) {
    const spec = COMBUSTION_ENGINES[id], engine = new CombustionEngine(48000, spec), l = new Float32Array(128), r = new Float32Array(128);
    let cut = 0, blocks = 0, toggles = 0, previous = false;
    for (let i = 0; i < 48000 * 1.5 / 128; i++) {
      engine.process(l, r, 128, [spec.limiterRpm + 20], [1], [1], 1, 1);
      if (i < 40) continue;
      blocks++; if (engine.cut) cut++; if (engine.cut !== previous) toggles++; previous = engine.cut;
    }
    assert.ok(cut / blocks > 0.25 && cut / blocks < 0.75, `${id}: cut share ${cut / blocks}`);
    assert.ok(toggles > 10, `${id}: ${toggles} toggles`);
  }
});

test("stale motion evidence suppresses afterfire, shift cracks and blow-off one-shots", () => {
  for (const id of ["five-turbo", "boxer-rumble", "v8-crossplane"]) {
    const spec = COMBUSTION_ENGINES[id], engine = new CombustionEngine(48000, spec), l = new Float32Array(128), r = new Float32Array(128);
    const run = (rpm, loadValue, boost, seconds) => { for (let i = 0; i < 48000 * seconds / 128; i++) engine.process(l, r, 128, [rpm], [loadValue], [boost], 1, 0); };
    run(spec.redlineRpm * 0.8, 1, 1, 2); run(spec.redlineRpm * 0.8, 0.05, 0, 2);
    assert.equal(engine.popCount, 0, id); assert.equal(engine.releaseEnvelope, 0, id);
  }
});

test("lifting off a hard run releases a cluster of afterfire that dies away", () => {
  const spec = COMBUSTION_ENGINES["v8-crossplane"], engine = new CombustionEngine(48000, spec), l = new Float32Array(128), r = new Float32Array(128);
  for (let i = 0; i < 48000 * 3 / 128; i++) engine.process(l, r, 128, [5200], [1], [0], 1, 1);
  const before = engine.popCount, perSecond = [];
  for (let s = 0; s < 4; s++) { const start = engine.popCount; for (let i = 0; i < 48000 / 128; i++) engine.process(l, r, 128, [5200 - s * 600], [0.05], [0], 1, 1); perSecond.push(engine.popCount - start); }
  assert.ok(engine.popCount > before, "some afterfire");
  assert.ok(perSecond[0] >= perSecond[3], `decays: ${perSecond}`);
  assert.ok(perSecond.reduce((a, b) => a + b, 0) < 40, `bounded: ${perSecond}`);
});

// November 7 owner listening: "keep the explosions in a couple of engines, otherwise they all sound the same".
test("only the V8 Cross-plane and the Five Turbo pop; the other six lift off clean, even off the limiter", () => {
  for (const id of COMBUSTION_ENGINE_IDS) {
    const spec = COMBUSTION_ENGINES[id], engine = new CombustionEngine(48000, spec), l = new Float32Array(128), r = new Float32Array(128);
    const run = (rpm, loadValue, seconds) => { for (let i = 0; i < 48000 * seconds / 128; i++) engine.process(l, r, 128, [rpm], [loadValue], [spec.forced ? loadValue : 0], 1, 1); };
    for (let lift = 0; lift < 4; lift++) { run(spec.redlineRpm * 0.8, 1, 1.5); run(spec.redlineRpm * 0.7, 0.05, 1.5); }
    run(spec.limiterRpm, 1, 1.5); run(spec.redlineRpm * 0.6, 0.05, 1.5);
    if (["v8-crossplane", "five-turbo"].includes(id)) assert.ok(engine.popCount > 5, `${id}: ${engine.popCount} pops`);
    else { assert.equal(engine.popCount, 0, `${id} pops`); assert.equal(engine.bangs, 0, `${id} bangs`); }
  }
});

test("a brief throttle dip never reaches fuel cut; a held lift does after the cut-off delay", () => {
  const engine = new CombustionEngine(48000, COMBUSTION_ENGINES.v10), l = new Float32Array(128), r = new Float32Array(128);
  const run = (loadValue, seconds) => { let most = 0; for (let i = 0; i < Math.round(48000 * seconds / 128); i++) { engine.process(l, r, 128, [3000], [loadValue], [0], 1, 1); most = Math.max(most, engine.overrun); } return most; };
  run(0.3, 1);
  // A shift's release or a GPS undershoot: a quarter second with the throttle shut.
  assert.ok(run(0.05, 0.25) < 0.02 && run(0.3, 0.5) < 0.02, "a dip stays fuelled");
  assert.ok(run(0.05, 0.35) < 0.02, "no fuel cut in the first 0.35 s of a lift");
  assert.ok(run(0.05, 1.2) > 0.8, "a held lift reaches overrun");
});

test("only a throttle opening from nearly shut barks, not the end of a shift from part load", () => {
  const tipFrom = (fromLoad, toLoad) => {
    const engine = new CombustionEngine(48000, COMBUSTION_ENGINES.v12), l = new Float32Array(128), r = new Float32Array(128);
    for (let i = 0; i < 375; i++) engine.process(l, r, 128, [3000], [fromLoad], [0], 1, 1);
    let most = 0; for (let i = 0; i < 40; i++) { engine.process(l, r, 128, [3000], [toLoad], [0], 1, 1); most = Math.max(most, engine.tip); }
    return most;
  };
  assert.ok(tipFrom(0.08, 0.7) > 0.8, "a snapped pedal from closed barks");
  assert.ok(tipFrom(0.55, 1) < 0.05, "re-engaging from half load does not");
});

test("combustion upshifts cut torque with the throttle held; sample voices keep their full release", () => {
  const { ENGINE_PROFILES } = load("src/engine/profiles.js");
  const { planEngineShift } = load("src/engine/powertrain.js");
  const lowest = (profile, fromLoad, toGear = 3) => Math.min(...planEngineShift({ at: 1, fromRpm: 4000, toRpm: toGear > 2 ? 3000 : 5000, fromLoad, toLoad: fromLoad,
    fromGear: 2, toGear, reason: toGear > 2 ? "upshift" : "downshift", profile, duration: profile.duration }).points.map(point => point.load));
  for (const profile of ENGINE_PROFILES.filter(item => item.voice?.model === "combustion")) {
    assert.equal(lowest(profile, 0.9), 0.45, profile.id);
    assert.equal(lowest(profile, 0.25), 0.15, profile.id);
    assert.equal(lowest(profile, 0.1), 0.1, profile.id);
    assert.equal(lowest(profile, 0.08, 1), 0.06, `${profile.id} coasting downshift`);
  }
  for (const id of ["mono", "rosso", "touring"]) assert.equal(lowest(ENGINE_PROFILES.find(item => item.id === id), 0.9), 0.06, id);
});

test("tuned maps end some hard lifts in a backfire bang, never with stale evidence", () => {
  for (const [events, check] of [[1, n => n >= 2 && n <= 14], [0, n => n === 0]]) {
    const spec = COMBUSTION_ENGINES["v8-crossplane"], engine = new CombustionEngine(48000, spec), l = new Float32Array(128), r = new Float32Array(128);
    for (let lift = 0; lift < 20; lift++) {
      for (let i = 0; i < 48000 * 1.2 / 128; i++) engine.process(l, r, 128, [5200], [1], [0], 1, events);
      for (let i = 0; i < 48000 * 0.8 / 128; i++) engine.process(l, r, 128, [4800], [0.05], [0], 1, events);
    }
    assert.ok(check(engine.bangs), `events ${events}: ${engine.bangs} bangs`);
  }
  const plain = new CombustionEngine(48000, COMBUSTION_ENGINES.v12), l = new Float32Array(128), r = new Float32Array(128);
  for (let lift = 0; lift < 10; lift++) { for (let i = 0; i < 450; i++) plain.process(l, r, 128, [7000], [1], [0], 1, 1); for (let i = 0; i < 300; i++) plain.process(l, r, 128, [6500], [0.05], [0], 1, 1); }
  assert.equal(plain.bangs, 0);
});

test("sustained load heats the gas and raises the pipe resonances", () => {
  const { engine } = steady("v10", { rpm: 7000, load: 1, seconds: 8, settle: 0 });
  assert.ok(engine.temperature > 950, `${engine.temperature}`);
  const cold = new CombustionEngine(48000, COMBUSTION_ENGINES.v10);
  assert.ok(engine.primaries[0].delay < cold.primaries[0].delay * 0.85);
});

test("the worklet mutes after a bounded fade, clears one-shots and stops after disposal", () => {
  let Constructor;
  class AudioWorkletProcessor { port = { onmessage: null }; }
  vm.runInNewContext(bundle("src/engine/combustion/combustion-processor.js"), { module: { exports: {} }, exports: {}, AudioWorkletProcessor, sampleRate: 48000,
    registerProcessor: (name, klass) => { assert.equal(name, "sedicivalvole-combustion"); Constructor = klass; } });
  const node = new Constructor({ processorOptions: { model: "combustion", engine: "five-turbo", mix: 1, limiter: 7150 } });
  const channels = [new Float32Array(128), new Float32Array(128)];
  const params = { rpm: new Float32Array([4800]), load: new Float32Array([1]), boost: new Float32Array([1]), active: new Float32Array([1]), events: new Float32Array([1]) };
  for (let i = 0; i < 400; i++) node.process([], [channels], params);
  assert.ok(channels[0].some(value => value !== 0)); assert.ok(node.engine.spool > 0.5);
  params.active[0] = 0;
  for (let i = 0; i < 10; i++) node.process([], [channels], params);
  assert.equal(node.engine.fade, 0); assert.equal(node.engine.spool, 0); assert.equal(node.engine.releaseEnvelope, 0);
  const frozen = node.engine.frame;
  for (let i = 0; i < 20; i++) node.process([], [channels], params);
  assert.equal(node.engine.frame, frozen); assert.ok(channels.every(channel => channel.every(value => value === 0)));
  node.port.onmessage({ data: "dispose" });
  assert.equal(node.process([], [channels], params), false);
});

test("combustion voices are public, neutral, procedural and heard in the LAB against Rosso", () => {
  const { ENGINE_PROFILES } = load("src/engine/profiles.js");
  const { ENGINE_CATALOGUE, ENGINE_COMBUSTION_VOICES, isEngineProfile, isCombustionVoice } = load("src/engine/catalogue.js");
  const { comparisonProfile, comparisonCalibrations, makeComparisonNote } = load("src/engine/lab-comparison.js");
  assert.equal(JSON.stringify(ENGINE_CATALOGUE.map(item => item.id)), JSON.stringify(["mono", "rosso", "touring", ...COMBUSTION_ENGINE_IDS]));
  assert.equal(JSON.stringify(ENGINE_COMBUSTION_VOICES.map(item => item.id)), JSON.stringify(COMBUSTION_ENGINE_IDS));
  for (const id of COMBUSTION_ENGINE_IDS) {
    assert.equal(isEngineProfile(id), true); assert.equal(isCombustionVoice(id), true);
    const profile = ENGINE_PROFILES.find(item => item.id === id);
    assert.equal(profile.voice.model, "combustion"); assert.equal(profile.voice.engine, id);
    assert.equal(profile.assets.length, 0); assert.equal(profile.voicing, null);
    assert.equal(profile.configuration.engine.limiter, COMBUSTION_ENGINES[id].limiterRpm);
    assert.equal(comparisonProfile(id, "A").id, "rosso"); assert.equal(comparisonProfile(id, "B").id, id);
    assert.match(comparisonCalibrations(id).B, /^Combustion · /);
    const note = makeComparisonNote({ profile: id, preference: "B", note: "", listened: { A: 68, B: 68 }, build: "test", sampleRate: 48000 });
    assert.equal(note.sourceCalibrations.A, "rosso:full-body.v1"); assert.equal(note.sourceCalibrations.B, `combustion.v7:${id}`);
  }
  assert.throws(() => comparisonProfile("v10", "C"));
});

test("a combustion voice idles at its own architecture's idle; sample voices keep 600 rpm", () => {
  const { ENGINE_PROFILES } = load("src/engine/profiles.js");
  const { idleRpmFor } = load("src/engine/gearbox.js");
  const { createShowOff } = load("src/engine/show-off.js");
  for (const id of ["mono", "rosso", "touring"]) assert.equal(idleRpmFor(ENGINE_PROFILES.find(item => item.id === id)), 600);
  for (const id of COMBUSTION_ENGINE_IDS) {
    const profile = ENGINE_PROFILES.find(item => item.id === id);
    assert.equal(idleRpmFor(profile), COMBUSTION_ENGINES[id].idleRpm, id);
    // TAMARRO settles back to that idle, not to the sample voices' 600 rpm.
    const gesture = createShowOff(() => 0.5); gesture.start(0, idleRpmFor(profile), profile.configuration.engine.limiter, idleRpmFor(profile));
    let last = null; for (let at = 0; at < 8; at += 0.01) { const sample = gesture.sample(at); if (!sample) break; last = sample; }
    assert.ok(Math.abs(last.rpm - COMBUSTION_ENGINES[id].idleRpm) < 15, `${id} ends at ${last.rpm}`);
  }
  assert.equal(idleRpmFor({ configuration: { engine: { idle: 50 } } }), 600);
});

test("high-revving combustion voices turn more road rpm than the pushrod V8, within the road contract", () => {
  const { ENGINE_PROFILES, combustionRoadScale } = load("src/engine/profiles.js");
  const { virtualRpm } = load("src/engine/gearbox.js");
  const at = (id, speed, gear) => virtualRpm(speed, gear, ENGINE_PROFILES.find(item => item.id === id).configuration.drivetrain);
  assert.ok(at("v8-flatplane", 100, 5) > at("v8-crossplane", 100, 5) * 1.12);
  assert.ok(at("v10", 80, 4) > at("five-turbo", 80, 4));
  for (const id of COMBUSTION_ENGINE_IDS) {
    const scale = combustionRoadScale(COMBUSTION_ENGINES[id]);
    assert.ok(scale >= 0.88 && scale <= 1.025, `${id}: ${scale}`);
  }
});

test("on the limiter the crank bounces with the ignition cut, a few hundred rpm deep", () => {
  const spec = COMBUSTION_ENGINES["v8-flatplane"], engine = new CombustionEngine(48000, spec);
  const left = new Float32Array(128), right = new Float32Array(128);
  let deepest = 0, cutDip = 0, cutBlocks = 0, liveDip = 0, liveBlocks = 0;
  for (let block = 0; block < 900; block++) {
    engine.process(left, right, 128, [spec.limiterRpm], [1], [0], 1, 1);
    if (block < 300) continue;
    deepest = Math.min(deepest, engine.limiterDip);
    if (engine.cut) { cutDip += engine.limiterDip; cutBlocks++; } else { liveDip += engine.limiterDip; liveBlocks++; }
  }
  assert.ok(deepest < -150 && deepest >= -320, `deepest ${deepest}`);
  assert.ok(cutBlocks > 0 && liveBlocks > 0);
  // Off the limit the dip recovers fully.
  for (let block = 0; block < 200; block++) engine.process(left, right, 128, [spec.limiterRpm * 0.8], [0.5], [0], 1, 1);
  assert.equal(engine.limiterDip, 0);
});
