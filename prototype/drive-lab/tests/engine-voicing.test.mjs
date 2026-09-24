import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { bodyFrequencyHz, bodyLevel, createEngineVoicing, NEUTRAL_VOICING } from "../src/engine/voicing.js";

const compiled = await build({ entryPoints: [new URL("../src/engine/profiles.js", import.meta.url).pathname], bundle: true, platform: "node", format: "esm", write: false, loader: { ".ts": "ts" } });
const { ENGINE_PROFILES } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);

class Param {
  constructor(value = 0) { this.value = value; this.targets = []; }
  setValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; this.targets.push(value); }
  linearRampToValueAtTime(value) { this.value = value; }
  cancelAndHoldAtTime() {}
}
function fakeContext() {
  const nodes = [];
  const node = (extra) => { const n = { connect(to) { (n.to ??= []).push(to); return to; }, disconnect() { n.disconnected = true; }, ...extra }; nodes.push(n); return n; };
  return {
    currentTime: 0, nodes,
    createGain: () => node({ kind: "gain", gain: new Param(1) }),
    createBiquadFilter: () => node({ kind: "filter", type: "", frequency: new Param(), Q: new Param(), gain: new Param() }),
    createWaveShaper: () => node({ kind: "shaper", curve: null, oversample: "none" }),
    createOscillator: () => node({ kind: "osc", frequency: new Param(), started: false, start() { this.started = true; }, stop() { this.stopped = true; }, setPeriodicWave(wave) { this.wave = wave; } }),
    createPeriodicWave: (real, imag) => ({ real, imag }),
  };
}

test("a null voicing is exactly the earlier sound", () => {
  const context = fakeContext();
  const voicing = createEngineVoicing(context, { connect() {} });
  voicing.setVoicing(null);
  const filters = context.nodes.filter((n) => n.kind === "filter" && ["lowshelf", "peaking"].includes(n.type));
  assert.equal(filters.length, 3);
  for (const filter of filters) assert.equal(filter.gain.value, 0);
  const gains = context.nodes.filter((n) => n.kind === "gain");
  const [trim] = gains.filter((n) => n.gain.targets.includes(1));
  assert.ok(trim, "trim sits at unity");
  voicing.follow(4000, 1, 0);
  assert.ok(gains.every((n) => n.gain.value === 0 || n.gain.value === 1 || n.gain.value === 5), "air and body stay silent");
  assert.equal(NEUTRAL_VOICING.body, 0);
  assert.equal(NEUTRAL_VOICING.air, 0);
});

test("the body follows the virtual crank exactly and opens up under load", () => {
  assert.equal(bodyFrequencyHz(6000), 50);
  assert.equal(bodyFrequencyHz(-5), 0);
  const voiced = { body: 0.2 };
  assert.equal(bodyLevel({ body: 0 }, 5000, 1), 0);
  assert.ok(bodyLevel(voiced, 600, 0.08) < bodyLevel(voiced, 3000, 0.08), "standstill stays restrained");
  assert.ok(bodyLevel(voiced, 3000, 0.1) < bodyLevel(voiced, 3000, 0.9), "load opens the body");
  assert.ok(bodyLevel(voiced, 9000, 1) <= 0.2 + 1e-12, "never above the authored cap");
  const context = fakeContext();
  const voicing = createEngineVoicing(context, { connect() {} });
  voicing.setVoicing(voiced);
  voicing.follow(4800, 0.7, 0);
  const osc = context.nodes.find((n) => n.kind === "osc");
  assert.equal(osc.started, true);
  assert.equal(osc.frequency.value, 40);
  voicing.dispose();
  assert.equal(osc.stopped, true);
});

test("the three public engines carry a bounded full-body voicing; retired ones stay neutral", () => {
  for (const profile of ENGINE_PROFILES) {
    if (!["mono", "rosso", "touring"].includes(profile.id)) { assert.equal(profile.voicing, null); continue; }
    const v = profile.voicing;
    assert.ok(v.body > 0 && v.body <= 0.25, `${profile.id} body ${v.body}`);
    assert.ok(v.air > 0 && v.air <= 0.2, `${profile.id} air ${v.air}`);
    assert.ok(v.trimDb > 0 && v.trimDb <= 3, `${profile.id} trim ${v.trimDb}`);
    assert.ok(Math.abs(v.lowShelfDb) <= 6 && Math.abs(v.midDb) <= 6 && Math.abs(v.presenceDb) <= 6);
    const orders = Object.keys(v.bodyOrders).map(Number);
    assert.ok(orders.every((order) => Number.isInteger(order) && order >= 1 && order <= 32));
  }
});
