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
  assert.ok(full.flangerFeedback < 0.6);
  assert.ok(full.echoFeedback < 0.6);
  assert.ok(full.phaserFeedback < 0.5);
  assert.ok(full.manualUnderwaterCutoffHz >= 450);
  assert.ok(full.bitcrushLevels >= 8);
  assert.ok(full.bassDriveWet * full.bassDriveMakeup < 0.5);
  assert.ok(full.radioCutWet <= 1.1);
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
  assert.equal(shapers.length, 3);
  assert.equal(shapers.every((node) => node.curve instanceof Float32Array), true);
  assert.equal(shapers.every((node) => node.curve.length === 4_097), true);

  graph.destroy();
  assert.deepEqual(graph.getSnapshot(), { values: allAt(1), destroyed: true });
  assert.equal(oscillators.every((node) => node.stopped), true);
  assert.equal(context.nodes.every((node) => node.disconnected), true);
  assert.equal(graph.set(allAt(0)), null);
});
