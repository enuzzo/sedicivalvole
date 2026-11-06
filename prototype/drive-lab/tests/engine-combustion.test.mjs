import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { buildSync } from "esbuild";
import { CombustionEngine } from "../src/engine/combustion/dsp.js";
import { COMBUSTION_ENGINES, COMBUSTION_ENGINE_IDS } from "../src/engine/combustion/engines.js";

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

test("combustion candidates are LAB-only, neutral, procedural and heard against the published Rosso", () => {
  const { ENGINE_PROFILES } = load("src/engine/profiles.js");
  const { ENGINE_CATALOGUE, ENGINE_LAB_CANDIDATES, isEngineProfile, isLabEngine } = load("src/engine/catalogue.js");
  const { comparisonProfile, comparisonCalibrations, makeComparisonNote } = load("src/engine/lab-comparison.js");
  assert.equal(JSON.stringify(ENGINE_CATALOGUE.map(item => item.id)), JSON.stringify(["mono", "rosso", "touring"]));
  assert.equal(JSON.stringify(ENGINE_LAB_CANDIDATES.map(item => item.id)), JSON.stringify(COMBUSTION_ENGINE_IDS));
  for (const id of COMBUSTION_ENGINE_IDS) {
    assert.equal(isEngineProfile(id), false); assert.equal(isLabEngine(id), true);
    const profile = ENGINE_PROFILES.find(item => item.id === id);
    assert.equal(profile.voice.model, "combustion"); assert.equal(profile.voice.engine, id);
    assert.equal(profile.assets.length, 0); assert.equal(profile.voicing, null);
    assert.equal(profile.configuration.engine.limiter, COMBUSTION_ENGINES[id].limiterRpm);
    assert.equal(comparisonProfile(id, "A").id, "rosso"); assert.equal(comparisonProfile(id, "B").id, id);
    assert.match(comparisonCalibrations(id).B, /^Combustion · /);
    const note = makeComparisonNote({ profile: id, preference: "B", note: "", listened: { A: 68, B: 68 }, build: "test", sampleRate: 48000 });
    assert.equal(note.sourceCalibrations.A, "rosso:full-body.v1"); assert.equal(note.sourceCalibrations.B, `combustion.v1:${id}`);
  }
  assert.throws(() => comparisonProfile("v10", "C"));
});
