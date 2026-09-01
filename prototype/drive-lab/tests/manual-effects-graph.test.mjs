import assert from "node:assert/strict";
import test from "node:test";
import {
  createManualEffectsGraph,
  MANUAL_EFFECT_IDS,
  manualEffectParameters,
} from "../src/manual-effects-graph.js";

class FakeParam {
  constructor(value = 0) { this.value = value; }
  cancelScheduledValues() {}
  setTargetAtTime(value) { this.value = value; }
}

class FakeNode {
  constructor(kind) {
    this.kind = kind;
    this.connections = [];
    this.disconnected = false;
  }
  connect(target) { this.connections.push(target); return target; }
  disconnect() { this.connections = []; this.disconnected = true; }
}

class FakeOscillator extends FakeNode {
  constructor() {
    super("oscillator");
    this.frequency = new FakeParam();
    this.started = false;
    this.stopped = false;
  }
  start() { this.started = true; }
  stop() { this.stopped = true; }
}

function createFakeContext() {
  const nodes = [];
  const make = (kind, values = {}) => {
    const node = Object.assign(new FakeNode(kind), values);
    nodes.push(node);
    return node;
  };
  return {
    currentTime: 0,
    sampleRate: 8_000,
    nodes,
    createGain: () => make("gain", { gain: new FakeParam() }),
    createDelay: () => make("delay", { delayTime: new FakeParam() }),
    createConvolver: () => make("convolver", { buffer: null, normalize: false }),
    createBiquadFilter: () => make("filter", {
      type: "lowpass",
      frequency: new FakeParam(),
      Q: new FakeParam(),
      gain: new FakeParam(),
    }),
    createWaveShaper: () => make("waveshaper", { curve: null, oversample: "none" }),
    createDynamicsCompressor: () => make("compressor", {
      threshold: new FakeParam(),
      knee: new FakeParam(),
      ratio: new FakeParam(),
      attack: new FakeParam(),
      release: new FakeParam(),
    }),
    createOscillator: () => {
      const node = new FakeOscillator();
      nodes.push(node);
      return node;
    },
    createBuffer: (channels, length) => {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { getChannelData: (channel) => data[channel] };
    },
  };
}

const allAt = (amount) => Object.fromEntries(MANUAL_EFFECT_IDS.map((id) => [id, amount]));
const authoredHits = Object.freeze({
  flanger: 0.78,
  reverb: 0.72,
  echo: 0.74,
  underwater: 0.76,
  phaser: 0.78,
  bitcrush: 0.72,
  bassDrive: 0.74,
  radioCut: 0.76,
});

test("the performance graph owns exactly eight distinct effects and no retired Chorus", () => {
  assert.deepEqual(MANUAL_EFFECT_IDS, [
    "flanger",
    "reverb",
    "echo",
    "underwater",
    "phaser",
    "bitcrush",
    "bassDrive",
    "radioCut",
  ]);
  assert.equal(MANUAL_EFFECT_IDS.includes("chorus"), false);
  assert.equal(new Set(MANUAL_EFFECT_IDS).size, 8);
});

test("zero depth is a neutral serial path and full depth reaches bounded extreme endpoints", () => {
  const zero = manualEffectParameters(allAt(0));
  for (const key of [
    "flangerWet", "reverbWet", "echoWet", "manualUnderwaterWet", "phaserWet",
    "bitcrushWet", "bassDriveWet", "radioCutWet",
  ]) assert.equal(zero[key], 0, `${key} was not bypassed`);
  for (const key of [
    "flangerDry", "reverbDry", "echoDry", "manualUnderwaterDry", "phaserDry",
    "bitcrushDry", "bassDriveDry", "radioCutDry",
  ]) assert.equal(zero[key], 1, `${key} was not unity`);

  const full = manualEffectParameters(allAt(1));
  assert.equal(Object.values(full.stunt).every((amount) => amount === 1), true);
  assert.ok(full.flangerDry <= 0.201);
  assert.ok(full.flangerWet >= 1.099);
  assert.ok(full.flangerFeedback < 0.7);
  assert.ok(full.reverbDry <= 0.3);
  assert.ok(full.reverbWet >= 1.099);
  assert.ok(full.echoDry <= 0.5);
  assert.ok(full.echoWet >= 1);
  assert.ok(full.echoFeedback < 0.71);
  assert.equal(full.manualUnderwaterDry, 0);
  assert.ok(full.manualUnderwaterWet >= 0.899);
  assert.ok(full.manualUnderwaterCutoffHz <= 225);
  assert.ok(full.manualUnderwaterSecondCutoffHz <= 350);
  assert.ok(full.manualUnderwaterPressureGainDb >= 8);
  assert.ok(full.manualUnderwaterTextureDrive >= 4);
  assert.ok(full.phaserDry <= 0.2);
  assert.ok(full.phaserWet >= 1.06);
  assert.ok(full.phaserModulationHz >= 1_980);
  assert.ok(full.phaserFeedback < 0.61);
  assert.equal(full.bitcrushDry, 0);
  assert.equal(full.bitcrushLevels, 4);
  assert.ok(full.bitcrushToneHz <= 1_100);
  assert.ok(full.bassDriveDry <= 0.2);
  assert.ok(full.bassDriveShelfDb >= 28);
  assert.ok(full.bassDriveAmount >= 28);
  assert.ok(full.bassDriveWet * full.bassDriveMakeup < 0.3);
  assert.ok(full.bassDriveToneHz <= 600);
  assert.ok(full.radioCutDry <= 0.001);
  assert.ok(full.radioCutWet >= 0.619);
  assert.ok(full.radioCutHighpassHz >= 950);
  assert.ok(full.radioCutLowpassHz <= 2_100);
  assert.ok(full.radioCutPresenceDb >= 14);
  assert.ok(full.radioCutDrive >= 9);
});

test("authored hits stay musical while the final slider segment unlocks the stunt zone", () => {
  const hit = manualEffectParameters(authoredHits);
  assert.deepEqual(hit.stunt, allAt(0));

  const justBelow = manualEffectParameters(allAt(0.82));
  assert.deepEqual(justBelow.stunt, allAt(0));

  const rising = manualEffectParameters(allAt(0.91));
  for (const amount of Object.values(rising.stunt)) {
    assert.ok(amount > 0.49 && amount < 0.51);
  }

  const full = manualEffectParameters(allAt(1));
  assert.ok(full.flangerDry < hit.flangerDry - 0.6);
  assert.ok(full.reverbWet > hit.reverbWet + 0.3);
  assert.ok(full.echoFeedback > hit.echoFeedback + 0.2);
  assert.ok(full.manualUnderwaterCutoffHz < hit.manualUnderwaterCutoffHz * 0.4);
  assert.equal(hit.manualUnderwaterTextureDrive, 0);
  assert.ok(full.manualUnderwaterTextureDrive >= 4);
  assert.ok(full.phaserModulationHz > hit.phaserModulationHz * 2);
  assert.ok(full.bitcrushLevels < hit.bitcrushLevels / 3);
  assert.ok(full.bassDriveAmount > hit.bassDriveAmount * 2.5);
  assert.ok(full.radioCutHighpassHz > hit.radioCutHighpassHz * 1.5);
});

test("the graph updates every processor, creates transfer curves, and tears down cleanly", () => {
  const context = createFakeContext();
  const graph = createManualEffectsGraph(context);
  const oscillators = context.nodes.filter((node) => node.kind === "oscillator");
  assert.equal(oscillators.length, 2);
  assert.equal(oscillators.every((node) => node.started), true);

  const result = graph.set(allAt(1));
  assert.deepEqual(result.values, allAt(1));
  const shapers = context.nodes.filter((node) => node.kind === "waveshaper");
  assert.equal(shapers.length, 4);
  assert.equal(shapers.every((node) => node.curve instanceof Float32Array), true);
  assert.equal(shapers.every((node) => node.curve.length === 4_097), true);

  graph.destroy();
  assert.deepEqual(graph.getSnapshot(), { values: allAt(1), destroyed: true });
  assert.equal(oscillators.every((node) => node.stopped), true);
  assert.equal(context.nodes.every((node) => node.disconnected), true);
  assert.equal(graph.set(allAt(0)), null);
});
