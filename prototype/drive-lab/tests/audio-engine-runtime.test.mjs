import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { build } from "esbuild";

import { withReadinessTimeout } from "../src/promise-timeout.js";

test("FRACTURE processor recovery publishes one fallback state", async () => {
  const source = await readFile(new URL("../src/audio-engine.js", import.meta.url), "utf8");
  assert.equal(
    source.match(/arrangement = fallback\.getState\(\);/g)?.length ?? 0,
    1,
    "processor recovery retained a duplicate fallback state assignment",
  );
});

function deferred() {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolveValue, rejectValue) => {
    resolvePromise = resolveValue;
    rejectPromise = rejectValue;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

class FakeTimers {
  constructor() {
    this.nextId = 1;
    this.timeouts = new Map();
    this.intervals = new Map();
  }

  setTimeout = (callback, delay) => {
    const id = this.nextId++;
    this.timeouts.set(id, { callback, delay });
    return id;
  };

  clearTimeout = (id) => { this.timeouts.delete(id); };

  setInterval = (callback, delay) => {
    const id = this.nextId++;
    this.intervals.set(id, { callback, delay });
    return id;
  };

  clearInterval = (id) => { this.intervals.delete(id); };

  runNextTimeout(delay) {
    const entry = [...this.timeouts.entries()].find(([, timer]) => timer.delay === delay);
    assert.ok(entry, `missing ${delay} ms timeout`);
    this.timeouts.delete(entry[0]);
    entry[1].callback();
  }

  runIntervals(delay) {
    for (const timer of this.intervals.values()) {
      if (timer.delay === delay) timer.callback();
    }
  }
}

class FakeParam {
  constructor(value = 0) {
    this.value = value;
    this.events = [];
  }

  cancelScheduledValues(time) { this.events.push({ type: "cancel", time }); }
  setTargetAtTime(value, time, constant) {
    this.value = value;
    this.events.push({ type: "target", value, time, constant });
  }
  setValueAtTime(value, time) {
    this.value = value;
    this.events.push({ type: "set", value, time });
  }
  linearRampToValueAtTime(value, time) {
    this.value = value;
    this.events.push({ type: "ramp", value, time });
  }
  setValueCurveAtTime(curve, time, duration) {
    this.value = curve[curve.length - 1];
    this.events.push({ type: "curve", curve, time, duration });
  }
}

class FakeNode {
  constructor(label, graphEvents) {
    this.label = label;
    this.graphEvents = graphEvents;
    this.connections = new Set();
  }

  connect(target) {
    this.connections.add(target);
    this.graphEvents.push(`${this.label}:connect:${target.label}`);
    return target;
  }

  disconnect(target) {
    if (target) this.connections.delete(target);
    else this.connections.clear();
    this.graphEvents.push(`${this.label}:disconnect:${target?.label ?? "all"}`);
  }
}

class FakeSource extends FakeNode {
  start() { this.started = true; }
  stop() { this.stopped = true; }
}

class FakeContext {
  constructor(addModule) {
    this.currentTime = 0;
    this.state = "running";
    this.sampleRate = 48_000;
    this.graphEvents = [];
    this.gains = [];
    this.filters = [];
    this.shapers = [];
    this.worklets = [];
    this.destination = new FakeNode("destination", this.graphEvents);
    this.audioWorklet = { addModule };
  }

  node(label) { return new FakeNode(label, this.graphEvents); }
  createGain() {
    const node = Object.assign(this.node(`gain-${this.gains.length}`), { gain: new FakeParam() });
    this.gains.push(node);
    return node;
  }
  createBiquadFilter() {
    const node = Object.assign(this.node(`filter-${this.filters.length}`), {
      frequency: new FakeParam(), Q: new FakeParam(), gain: new FakeParam(),
    });
    this.filters.push(node);
    return node;
  }
  createWaveShaper() {
    const node = Object.assign(this.node(`waveshaper-${this.shapers.length}`), {
      curve: null,
      oversample: "none",
    });
    this.shapers.push(node);
    return node;
  }
  createChannelSplitter() { return this.node("splitter"); }
  createChannelMerger() { return this.node("merger"); }
  createAnalyser() {
    return Object.assign(this.node("analyser"), {
      fftSize: 256,
      smoothingTimeConstant: 0,
      getFloatTimeDomainData(buffer) { buffer.fill(0); },
    });
  }
  createDelay() { return Object.assign(this.node("delay"), { delayTime: new FakeParam() }); }
  createConvolver() { return Object.assign(this.node("convolver"), { buffer: null }); }
  createDynamicsCompressor() {
    return Object.assign(this.node("compressor"), {
      threshold: new FakeParam(), knee: new FakeParam(), ratio: new FakeParam(),
      attack: new FakeParam(), release: new FakeParam(),
    });
  }
  createBuffer(channels, length) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { getChannelData(channel) { return data[channel]; } };
  }
  createOscillator() {
    return Object.assign(new FakeSource("oscillator", this.graphEvents), {
      frequency: new FakeParam(), detune: new FakeParam(),
    });
  }
  createStereoPanner() { return Object.assign(this.node("panner"), { pan: new FakeParam() }); }
  createBufferSource() { return new FakeSource("buffer-source", this.graphEvents); }
  decodeAudioData() { return Promise.resolve({ duration: 1 }); }
  resume() { return Promise.resolve(); }
  close() { this.state = "closed"; return Promise.resolve(); }
}

const bundle = await build({
  entryPoints: [resolve("src/audio-engine.js")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  define: { __APP_BUILD__: JSON.stringify("audio-runtime-test") },
  plugins: [{
    name: "audio-engine-runtime-fakes",
    setup(builder) {
      builder.onResolve({ filter: /junction-player\.js$/ }, () => ({
        path: "junction-player",
        namespace: "runtime-fake",
      }));
      builder.onLoad({ filter: /.*/, namespace: "runtime-fake" }, () => ({
        contents: "export function createJunctionPlayer(...args) { return globalThis.__SV_TEST_JUNCTION_FACTORY__(...args); }",
      }));
      builder.onResolve({ filter: /\?audio-worklet$/ }, (args) => ({
        path: args.path,
        namespace: "worklet-url-fake",
      }));
      builder.onLoad({ filter: /.*/, namespace: "worklet-url-fake" }, (args) => ({
        contents: `export default ${JSON.stringify(args.path)};`,
      }));
    },
  }],
});
const bundledUrl = `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`;
const audioModule = await import(bundledUrl);

function fakeJunction(activationResults = []) {
  const calls = [];
  let destroyed = false;
  return {
    calls,
    player: {
      setActive(active) {
        calls.push({ method: "setActive", active });
        if (!active) return Promise.resolve();
        const result = activationResults.shift();
        return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
      },
      setSpeed() {},
      setBrake() {},
      getState() {
        return {
          score: "junction",
          scoreLabel: "JUNCTION",
          section: "PARK",
          motionLane: "PARK",
          tempo: 127,
          perceivedTempo: null,
          transportTempo: null,
          activeLanes: ["harmony", "atmosphere"],
        };
      },
      destroy() { destroyed = true; },
    },
    get destroyed() { return destroyed; },
  };
}

async function withFakeAudioEnvironment(options, run) {
  const originals = {
    window: globalThis.window,
    AudioWorkletNode: globalThis.AudioWorkletNode,
    junctionFactory: globalThis.__SV_TEST_JUNCTION_FACTORY__,
    performance: globalThis.performance,
    consoleError: console.error,
  };
  const timers = new FakeTimers();
  const junction = options.junction ?? fakeJunction();
  let clockMs = 0;
  const scoreModule = options.scoreModule ?? Promise.resolve();
  const bloomModule = options.bloomModule ?? new Promise(() => {});
  const context = new FakeContext((url) => (
    String(url).includes("bloom") ? bloomModule : scoreModule
  ));
  class ContextFactory { constructor() { return context; } }
  class FakeWorkletNode extends FakeNode {
    constructor(owner, processorName) {
      super(`worklet-${processorName}`, owner.graphEvents);
      this.processorName = processorName;
      this.port = { onmessage: null, messages: [], postMessage: (message) => this.port.messages.push(message) };
      this.onprocessorerror = null;
      owner.worklets.push(this);
    }
  }
  globalThis.window = {
    AudioContext: ContextFactory,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    setInterval: timers.setInterval,
    clearInterval: timers.clearInterval,
  };
  globalThis.AudioWorkletNode = FakeWorkletNode;
  globalThis.__SV_TEST_JUNCTION_FACTORY__ = () => junction.player;
  globalThis.performance = { now: () => clockMs };
  console.error = () => {};
  try {
    await run({
      context,
      timers,
      junction,
      setClock(value) { clockMs = value; },
      createAudioEngine: audioModule.createAudioEngine,
      timeoutMs: audioModule.AUDIO_WORKLET_READY_TIMEOUT_MS,
    });
  } finally {
    globalThis.window = originals.window;
    globalThis.AudioWorkletNode = originals.AudioWorkletNode;
    globalThis.__SV_TEST_JUNCTION_FACTORY__ = originals.junctionFactory;
    globalThis.performance = originals.performance;
    console.error = originals.consoleError;
  }
}

test("a timed-out readiness promise aborts once and ignores a late completion", async () => {
  const timers = new FakeTimers();
  const pending = deferred();
  let aborted = 0;
  const bounded = withReadinessTimeout(pending.promise, {
    label: "test resource",
    timeoutMs: 12,
    schedule: timers.setTimeout,
    cancel: timers.clearTimeout,
    onTimeout: () => { aborted += 1; },
  });
  timers.runNextTimeout(12);
  await assert.rejects(bounded, /test resource timed out after 12 ms/);
  pending.resolve("late");
  await Promise.resolve();
  assert.equal(aborted, 1);
});

test("destroy invalidates a pending score load without constructing a late fallback graph", async () => {
  const score = deferred();
  await withFakeAudioEnvironment({ scoreModule: score.promise }, async ({ createAudioEngine, context, junction }) => {
    const engine = createAudioEngine();
    assert.equal(engine.getState().scoreStatus, "loading");
    const selection = engine.setScore("fracture");
    engine.destroy();
    score.resolve();
    assert.equal(await selection, "fracture");
    await Promise.resolve();
    assert.equal(context.worklets.length, 0);
    assert.equal(junction.calls.length, 0);
    await assert.rejects(engine.setScore("junction"), /Audio engine is closed/);
  });
});

test("a hung FRACTURE module reaches the JUNCTION safety bed at the bounded deadline", async () => {
  const score = deferred();
  const junction = fakeJunction([undefined]);
  await withFakeAudioEnvironment({ scoreModule: score.promise, junction }, async ({
    createAudioEngine, context, timers, timeoutMs,
  }) => {
    const engine = createAudioEngine();
    const selection = engine.setScore("fracture");
    timers.runNextTimeout(timeoutMs);
    assert.equal(await selection, "junction");
    assert.equal(junction.calls[0].active, true);
    assert.equal(engine.getState().scoreStatus, "error");
    assert.equal(context.gains[7].gain.value, 0);
    assert.equal(context.gains[8].gain.value, 1, "safety bed faded up from an already silent renderer");
    assert.equal(engine.getState().scoreStatus, "error", "fallback degradation was hidden after its crossfade");
    engine.destroy();
  });
});

test("JUNCTION keeps its harmonic safety bed when both authored renderers fail", async () => {
  const score = deferred();
  const junction = fakeJunction([new Error("native bank unavailable")]);
  await withFakeAudioEnvironment({ scoreModule: score.promise, junction }, async ({
    createAudioEngine, context,
  }) => {
    const engine = createAudioEngine();
    engine.setSpeed(21);
    const selection = engine.setScore("junction");
    score.reject(new Error("AudioWorklet module unavailable"));
    assert.equal(await selection, "junction");
    assert.equal(context.gains[7].gain.value, 0);
    assert.equal(context.gains[8].gain.value, 1);
    assert.equal(engine.getState().scoreStatus, "error");
    assert.match(engine.getState().scoreError, /native bank unavailable/);
    assert.equal(junction.calls.filter((call) => call.active === false).length, 0);
    assert.equal(junction.destroyed, false);
    engine.destroy();
  });
});

test("a failed JUNCTION bank exposes its safety bed while FRACTURE is still loading", async () => {
  const score = deferred();
  const junction = fakeJunction([new Error("native bank unavailable")]);
  await withFakeAudioEnvironment({ scoreModule: score.promise, junction }, async ({
    createAudioEngine, context,
  }) => {
    const engine = createAudioEngine();
    const selection = engine.setScore("junction");
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(await selection, "junction");
    assert.equal(context.gains[7].gain.value, 0);
    assert.equal(context.gains[8].gain.value, 1, "safety bed waited for the FRACTURE timeout");
    assert.equal(context.worklets.length, 0, "the FRACTURE renderer was still pending");
    assert.equal(engine.getState().scoreStatus, "error");
    assert.match(engine.getState().scoreError, /FRACTURE is not yet audible/);

    score.resolve();
    await Promise.resolve();
    engine.destroy();
  });
});

test("FRACTURE failure still preserves JUNCTION's bed when native readiness rejects", async () => {
  const score = deferred();
  const junction = fakeJunction([new Error("native bank unavailable")]);
  await withFakeAudioEnvironment({ scoreModule: score.promise, junction }, async ({
    createAudioEngine, context,
  }) => {
    const engine = createAudioEngine();
    engine.setSpeed(21);
    const selection = engine.setScore("fracture");
    score.reject(new Error("AudioWorklet module unavailable"));
    assert.equal(await selection, "junction");
    assert.equal(context.gains[7].gain.value, 0);
    assert.equal(context.gains[8].gain.value, 1);
    assert.equal(engine.getState().scoreStatus, "error");
    assert.match(engine.getState().scoreError, /JUNCTION native unavailable/);
    assert.equal(junction.calls.filter((call) => call.active === false).length, 0);
    engine.destroy();
  });
});

test("a rejected JUNCTION reselection keeps its bed until the FRACTURE crossfade completes", async () => {
  const junction = fakeJunction([undefined, new Error("native bank unavailable")]);
  await withFakeAudioEnvironment({ junction }, async ({ createAudioEngine, context, timers }) => {
    const engine = createAudioEngine();
    await engine.setScore("fracture");
    await engine.setScore("junction");
    context.currentTime = 4;
    timers.runNextTimeout(4000);
    await Promise.resolve();

    await engine.setScore("junction");
    assert.equal(junction.calls.filter((call) => call.active === false).length, 0);
    assert.equal(engine.getState().scoreStatus, "error");
    context.currentTime = 8;
    timers.runNextTimeout(4000);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(junction.calls.filter((call) => call.active === false).length, 1);
    assert.equal(engine.getState().scoreStatus, "error");
    engine.destroy();
  });
});

test("a FRACTURE processor error immediately restores JUNCTION instead of fading silence", async () => {
  const pulses = [];
  const recoveries = [];
  const junction = fakeJunction([undefined]);
  await withFakeAudioEnvironment({ junction }, async ({ createAudioEngine, context }) => {
    const engine = createAudioEngine(
      (snapshot) => pulses.push(snapshot),
      undefined,
      (recovery) => recoveries.push(recovery),
    );
    await engine.setScore("fracture");
    const fractureNode = context.worklets.find((node) => node.processorName === "score-processor");
    assert.equal(typeof fractureNode.onprocessorerror, "function");
    fractureNode.onprocessorerror(new Event("processorerror"));
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(engine.getState().requestedScoreId, "junction");
    assert.equal(engine.getState().scoreStatus, "error");
    assert.equal(context.gains[7].gain.value, 0);
    assert.equal(context.gains[8].gain.value, 1);
    assert.equal(pulses.at(-1).motionLane, "PARK");
    assert.deepEqual(recoveries, [{
      failedScoreId: "fracture",
      activeScoreId: "junction",
      message: "FRACTURE audio processor stopped unexpectedly",
    }]);
    engine.destroy();
  });
});

test("a confirmed OPEN trajectory drives the parallel rising focus sweep", async () => {
  const effects = [];
  await withFakeAudioEnvironment({}, async ({ createAudioEngine, context, timers, setClock }) => {
    const engine = createAudioEngine(undefined, (effect) => effects.push(effect));
    const accelerationAir = context.filters[1];
    const accelerationFocus = context.filters[2];
    const accelerationFocusLimiter = context.shapers[0];
    const accelerationFocusGain = context.gains[10];
    assert.equal(accelerationFocus.type, "bandpass");
    assert.equal(accelerationFocusGain.gain.value, 0);
    assert.equal(accelerationAir.connections.has(accelerationFocus), true);
    assert.equal(accelerationFocus.connections.has(accelerationFocusLimiter), true);
    assert.equal(accelerationFocusLimiter.connections.has(accelerationFocusGain), true);
    assert.equal(accelerationFocusLimiter.oversample, "2x");
    assert.equal(accelerationFocusLimiter.curve.length, 2049);
    assert.equal(accelerationFocusGain.connections.has(context.gains[6]), true);

    setClock(1);
    engine.setSpeed(10);
    setClock(801);
    engine.setSpeed(27);
    setClock(1601);
    engine.setSpeed(44);
    for (let tick = 0; tick < 6; tick += 1) timers.runIntervals(40);

    assert.ok(accelerationFocus.frequency.value > 1600);
    assert.ok(accelerationFocusGain.gain.value > 0.2);
    assert.equal(effects.includes("OPEN"), true);
    const macros = engine.getMacroSnapshot();
    assert.equal(macros.schema, "sedicivalvole.audio-macros.v1");
    assert.ok(macros.values.open > 0.2);
    assert.equal(macros.values.underwater, 0);
    assert.equal(engine.getState().macros.values.open, macros.values.open);
    engine.destroy();
  });
});

test("the vehicle-effects master silences audio processing without suppressing visual macros", async () => {
  const effects = [];
  await withFakeAudioEnvironment({}, async ({ createAudioEngine, context, timers, setClock }) => {
    const engine = createAudioEngine(undefined, (effect) => effects.push(effect));
    await engine.setScore("fracture");
    const fractureNode = context.worklets.find((node) => node.processorName === "score-processor");
    const accelerationFocusGain = context.gains[10];

    engine.setVehicleEffectsEnabled(false);
    setClock(1);
    engine.setSpeed(10);
    setClock(801);
    engine.setSpeed(27);
    setClock(1601);
    engine.setSpeed(44);
    for (let tick = 0; tick < 6; tick += 1) timers.runIntervals(40);

    assert.ok(engine.getMacroSnapshot().values.open > 0.2, "the visual OPEN macro stopped");
    assert.equal(accelerationFocusGain.gain.value, 0, "OPEN remained audible with effects off");
    assert.equal(effects.includes("OPEN"), true, "the shared road gesture was no longer reported");

    engine.brake();
    for (let tick = 0; tick < 8; tick += 1) timers.runIntervals(40);
    assert.ok(engine.getMacroSnapshot().values.underwater > 0.4, "the visual UNDERWATER macro stopped");
    assert.equal(
      fractureNode.port.messages.filter((message) => message.type === "BRAKE").at(-1).payload.brake,
      0,
      "UNDERWATER remained audible with effects off",
    );

    engine.setVehicleEffectsEnabled(true);
    assert.ok(accelerationFocusGain.gain.value > 0.2, "OPEN did not return when effects were enabled");
    assert.ok(
      fractureNode.port.messages.filter((message) => message.type === "BRAKE").at(-1).payload.brake > 0.4,
      "UNDERWATER did not return when effects were enabled",
    );
    engine.destroy();
  });
});

test("the shared manual chain is audible on every Play the Road score", async () => {
  await withFakeAudioEnvironment({}, async ({ createAudioEngine, context }) => {
    const engine = createAudioEngine();
    const result = engine.setManualEffects({ flanger: 1, reverb: 1, chorus: 1, echo: 1 });
    assert.deepEqual(result.values, { flanger: 1, reverb: 1, chorus: 1, echo: 1 });
    assert.ok(result.parameters.flangerWet >= 0.6);
    assert.ok(result.parameters.reverbWet >= 0.6);
    assert.ok(result.parameters.chorusWet >= 0.55);
    assert.ok(result.parameters.echoWet >= 0.5);
    assert.equal(context.gains[6].connections.has(context.gains[11]), true);
    assert.equal(context.gains[26].connections.has(context.gains[0]), true);
    engine.destroy();
  });
});

test("a BLOOM processor error reconnects the direct score bus before removing the failed node", async () => {
  await withFakeAudioEnvironment({ bloomModule: Promise.resolve() }, async ({ createAudioEngine, context }) => {
    const engine = createAudioEngine();
    await engine.setScore("fracture");
    await Promise.resolve();
    const bloomNode = context.worklets.find((node) => node.processorName === "bloom-processor");
    const performanceBus = context.gains[1];
    const accelerationScoop = context.filters[0];
    assert.equal(performanceBus.connections.has(bloomNode), true);
    assert.equal(performanceBus.connections.has(accelerationScoop), false);
    bloomNode.onprocessorerror(new Event("processorerror"));
    assert.equal(performanceBus.connections.has(accelerationScoop), true);
    assert.equal(performanceBus.connections.has(bloomNode), false);
    const reconnectAt = context.graphEvents.lastIndexOf("gain-1:connect:filter-0");
    const disconnectAt = context.graphEvents.lastIndexOf("gain-1:disconnect:worklet-bloom-processor");
    assert.ok(reconnectAt >= 0 && reconnectAt < disconnectAt);
    engine.destroy();
  });
});

test("a sustained brake releases an active BLOOM worklet only once", async () => {
  await withFakeAudioEnvironment({ bloomModule: Promise.resolve() }, async ({
    createAudioEngine, context, timers, setClock,
  }) => {
    const engine = createAudioEngine();
    await engine.setScore("fracture");
    await Promise.resolve();
    await Promise.resolve();
    const bloomNode = context.worklets.find((node) => node.processorName === "bloom-processor");
    assert.ok(bloomNode);

    setClock(1);
    engine.setSpeed(10);
    setClock(801);
    engine.setSpeed(27);
    setClock(1601);
    engine.setSpeed(44);
    assert.equal(bloomNode.port.messages.filter((message) => message.type === "TRIGGER").length, 1);
    setClock(1616);
    assert.ok(engine.getMacroSnapshot().values.bloom > 0.45);

    engine.brake();
    for (let index = 0; index < 8; index += 1) timers.runIntervals(40);
    assert.equal(
      bloomNode.port.messages.filter((message) => message.type === "RELEASE").length,
      1,
      "held braking spammed redundant BLOOM release messages",
    );
    assert.ok(engine.getMacroSnapshot().values.underwater > 0.4);
    engine.destroy();
  });
});

test("a stale vehicle-rate sample is published as zero to score consumers", async () => {
  const pulses = [];
  await withFakeAudioEnvironment({}, async ({ createAudioEngine, context, timers, setClock }) => {
    const engine = createAudioEngine((snapshot) => pulses.push(snapshot));
    await engine.setScore("fracture");
    const fractureNode = context.worklets.find((node) => node.processorName === "score-processor");
    setClock(1);
    engine.setSpeed(0);
    setClock(101);
    engine.setSpeed(20);
    fractureNode.port.onmessage({ data: { type: "SNAPSHOT", payload: { sceneId: "rest" } } });
    assert.ok(pulses.at(-1).accelerationMps2 > 0);
    setClock(5000);
    timers.runIntervals(40);
    assert.equal(pulses.at(-1).accelerationMps2, 0);
    engine.destroy();
  });
});
