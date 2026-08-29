import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { NATIVE_GROOVE_SPEED_KMH } from "../src/low-speed-score.js";
import { junctionPerformanceParameters } from "../src/junction-bank.js";
import { junctionBrakeParameters } from "../src/junction-brake.js";

class FakeParam {
  constructor() { this.events = []; this.value = 0; }
  setTargetAtTime(value, time, constant) { this.value = value; this.events.push({ type: "target", value, time, constant }); }
  setValueAtTime(value, time) { this.value = value; this.events.push({ type: "set", value, time }); }
  linearRampToValueAtTime(value, time) { this.value = value; this.events.push({ type: "ramp", value, time }); }
  setValueCurveAtTime(curve, time, duration) {
    this.value = curve[curve.length - 1];
    this.events.push({ type: "curve", curve, time, duration });
  }
  cancelScheduledValues(time) { this.events.push({ type: "cancel", time }); }
}

class FakeNode {
  connect(target) { this.connectedTo = target; return target; }
  disconnect() {}
}

class FakeSource extends FakeNode {
  start(time, offset, duration) {
    this.startAt = time;
    this.offset = offset;
    this.duration = duration;
  }

  stop(time) { this.stopAt = time; }
}

class FakeOscillator extends FakeNode {
  constructor() {
    super();
    this.frequency = new FakeParam();
    this.detune = new FakeParam();
  }

  start(time = 0) { this.startAt = time; }
  stop(time = 0) { this.stopAt = time; }
}

function fakeContext({ decodeAudioData = async () => ({ decoded: true }) } = {}) {
  const sources = [];
  const gains = [];
  const filters = [];
  const shapers = [];
  const context = {
    currentTime: 0,
    createGain() {
      const gain = Object.assign(new FakeNode(), { gain: new FakeParam() });
      gains.push(gain);
      return gain;
    },
    createBiquadFilter() {
      const filter = Object.assign(new FakeNode(), {
        frequency: new FakeParam(),
        Q: new FakeParam(),
      });
      filters.push(filter);
      return filter;
    },
    createWaveShaper() {
      const shaper = Object.assign(new FakeNode(), { curve: null, oversample: "none" });
      shapers.push(shaper);
      return shaper;
    },
    createDelay() { return Object.assign(new FakeNode(), { delayTime: new FakeParam() }); },
    createStereoPanner() { return Object.assign(new FakeNode(), { pan: new FakeParam() }); },
    createOscillator() { return new FakeOscillator(); },
    createBufferSource() {
      const source = new FakeSource();
      sources.push(source);
      return source;
    },
    decodeAudioData,
  };
  return { context, sources, gains, filters, shapers };
}

test("JUNCTION source keeps one decode-capacity return and no duplicate id field", async () => {
  const source = await readFile(new URL("../src/junction-player.js", import.meta.url), "utf8");
  assert.equal(
    source.match(/return retainedSlotIds\(\[id\]\)\.size <= decodedLimit\(\);/g)?.length ?? 0,
    1,
    "decode-slot reservation retained a duplicate return",
  );
  assert.doesNotMatch(source, /\bid,\s*id,/);
});

test("JUNCTION holds displayed 20 below 100 BPM and opens native only beyond it", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const timers = [];
  globalThis.window = {
    setInterval(callback) { timers.push(callback); return timers.length; },
    clearInterval() {},
  };
  globalThis.__APP_BUILD__ = "junction-rhythm-fade-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  let fetchCalls = 0;
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      fetchCalls += 1;
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });

  try {
    const {
      createJunctionPlayer,
      JUNCTION_DECODE_TIMEOUT_MS,
      JUNCTION_READINESS_TIMEOUT_MS,
      JUNCTION_RHYTHM_FADE_SECONDS,
      JUNCTION_TRANSFER_TIMEOUT_MS,
    } = await import(`../src/junction-player.js?fade-test=${Date.now()}`);
    assert.ok(
      JUNCTION_READINESS_TIMEOUT_MS
        >= JUNCTION_TRANSFER_TIMEOUT_MS + JUNCTION_DECODE_TIMEOUT_MS + 1000,
      "outer readiness deadline can reject a transfer and decode that both meet their own limits",
    );
    const { context, sources } = fakeContext();
    const player = createJunctionPlayer(context, new FakeNode());
    player.setSpeed(0, 0);
    await player.setActive(true);
    const parked = player.getState();
    assert.equal(parked.section, "PARK");
    assert.equal(parked.perceivedTempo, null);
    assert.equal(parked.beat, false);
    assert.equal(parked.bass, false);
    assert.equal(parked.bankLoaded, false);
    assert.equal(fetchCalls, 0, "PARK selection must not wait for or fetch the native bank");
    assert.equal(sources.length, 0);

    player.setSpeed(1.2, 0.02, 0.1);
    assert.equal(player.getState().section, "DEPART");
    assert.equal(player.getState().departureEventsPlayed, 2);
    player.setSpeed(1.1, 0.02, 0.1);
    player.setSpeed(1.3, 0.02, 0.1);
    assert.equal(player.getState().departureEventsPlayed, 2, "GPS jitter must not retrigger departure");

    player.setSpeed(4, 0.05, 0.1);
    assert.equal(player.getState().tempo, 127 * (2 / 3));
    assert.equal(player.getState().transportTempo, 127 * (2 / 3));
    assert.equal(player.getState().perceivedTempo, 127 * (2 / 3));

    player.setSpeed(20, 1 - (1 - 20 / 130) ** 2.2, 0.1);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(fetchCalls, 0, "displayed 20 km/h exposed the 127 BPM native bank");
    assert.equal(player.getState().section, "ROLL");
    assert.ok(player.getState().perceivedTempo <= 100);

    const nativeEnergy = 1 - (1 - NATIVE_GROOVE_SPEED_KMH / 130) ** 2.2;
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, nativeEnergy, 0.1);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(fetchCalls, 1);
    assert.equal(sources.length, 1);
    assert.equal(sources[0].startAt, 0.04);
    assert.equal(player.getState().section, "OPEN");
    assert.equal(player.getState().tempo, 127);
    assert.equal(player.getState().transportTempo, 127);

    context.currentTime = 1;
    player.setSpeed(20, 1 - (1 - 20 / 130) ** 2.2, 0.1);
    assert.equal(player.getState().section, "ROLL");
    assert.ok(player.getState().perceivedTempo < 100);
    assert.equal(sources[0].stopAt, 2.2);
    player.setSpeed(0, 0, 0.1);
    assert.equal(player.getState().section, "PARK");
    assert.equal(JUNCTION_RHYTHM_FADE_SECONDS, 4);
    player.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("JUNCTION stops a retiring native take before a threshold-bounce restart opens the shared gate", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  globalThis.window = { setInterval() { return 1; }, clearInterval() {} };
  globalThis.__APP_BUILD__ = "junction-threshold-bounce-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });

  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?threshold-bounce=${Date.now()}`);
    const rig = fakeContext();
    const player = createJunctionPlayer(rig.context, new FakeNode());
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.12, 0.1);
    await player.setActive(true);
    assert.equal(rig.sources.length, 1);

    rig.context.currentTime = 1;
    player.setSpeed(20, 0.1, 0.1);
    assert.equal(rig.sources[0].stopAt, 2.2, "native exit did not schedule its gentle release");
    assert.equal(player.getState().liveSourceNodes, 1);
    assert.ok(player.getState().decodedSlots <= 6);

    rig.context.currentTime = 1.1;
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.12, 0.1);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(rig.sources.length, 2);
    assert.equal(player.getState().liveSourceNodes, 2, "source-held PCM disappeared from residency accounting");
    assert.ok(player.getState().decodedSlots <= 6, "source-held PCM exceeded the six-slot bound");
    assert.equal(rig.sources[0].stopAt, 1.1, "retiring take survived until the new shared-gate opening");
    assert.ok(Math.abs(rig.sources[1].startAt - 1.14) < 1e-12);
    assert.ok(rig.sources[0].stopAt < rig.sources[1].startAt, "two native takes can overlap after threshold bounce");
    player.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("JUNCTION keeps the harmonic bed honest when a later native-bank request fails", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const originalConsoleError = console.error;
  globalThis.window = { setInterval() { return 1; }, clearInterval() {} };
  globalThis.__APP_BUILD__ = "junction-native-failure-test";
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  console.error = () => {};
  const statuses = [];

  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?native-failure=${Date.now()}`);
    const { context, sources } = fakeContext();
    const player = createJunctionPlayer(
      context,
      new FakeNode(),
      null,
      (status, error) => statuses.push({ status, error }),
    );
    await player.setActive(true);
    assert.equal(player.getState().section, "PARK");
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.3, 0.1);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    const failed = player.getState();
    assert.equal(failed.section, "NATIVE");
    assert.equal(failed.source, "code-synthesized");
    assert.equal(failed.beat, false);
    assert.equal(failed.transportTempo, null);
    assert.equal(failed.bankStatus, "error");
    assert.match(failed.bankError, /503/);
    assert.equal(sources.length, 0);
    assert.equal(statuses.at(-1).status, "error");
    player.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("an initial native-bank failure keeps the harmonic bed alive for score fallback", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const originalConsoleError = console.error;
  globalThis.window = { setInterval() { return 1; }, clearInterval() {} };
  globalThis.__APP_BUILD__ = "junction-initial-native-failure-test";
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  console.error = () => {};

  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?initial-native-failure=${Date.now()}`);
    const { context } = fakeContext();
    const player = createJunctionPlayer(context, new FakeNode());
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.3, 0.1);
    await assert.rejects(
      player.setActive(true, { externalEntranceFade: true }),
      /503/,
    );
    const fallbackBed = player.getState();
    assert.equal(fallbackBed.source, "code-synthesized");
    assert.equal(fallbackBed.beat, false);
    assert.equal(fallbackBed.bass, false);
    assert.ok(fallbackBed.lowSpeedLevel > 0);
    player.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("a cancelled native load cannot poison the next JUNCTION activation", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  globalThis.window = { setInterval() { return 1; }, clearInterval() {} };
  globalThis.__APP_BUILD__ = "junction-reactivation-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  let resolveFetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    if (fetchCalls === 1) await new Promise((resolve) => { resolveFetch = resolve; });
    return {
      ok: true,
      async arrayBuffer() {
        return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
      },
    };
  };

  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?reactivation=${Date.now()}`);
    const { context, sources } = fakeContext();
    const player = createJunctionPlayer(context, new FakeNode());
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.3, 0.1);
    const firstActivation = player.setActive(true);
    await new Promise((resolve) => setImmediate(resolve));
    await player.setActive(false);
    resolveFetch();
    await firstActivation;

    await player.setActive(true);
    assert.equal(player.getState().section, "OPEN");
    assert.equal(sources.length, 1, "reactivation reused the cancelled native promise");
    player.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("JUNCTION applies native hysteresis and backs off after a failed bank request", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const originalConsoleError = console.error;
  const timers = [];
  globalThis.window = {
    setInterval(callback) { timers.push(callback); return timers.length; },
    clearInterval() {},
  };
  globalThis.__APP_BUILD__ = "junction-hysteresis-test";
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return { ok: false, status: 503 };
  };
  console.error = () => {};

  try {
    const {
      createJunctionPlayer,
      JUNCTION_NATIVE_EXIT_SPEED_KMH,
      JUNCTION_NATIVE_RETRY_SECONDS,
    } = await import(`../src/junction-player.js?hysteresis=${Date.now()}`);
    const { context } = fakeContext();
    const player = createJunctionPlayer(context, new FakeNode());
    await player.setActive(true);
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.3, 0.1);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(fetchCalls, 1);
    assert.equal(player.getState().motionLane, "DRIVE");

    for (const speed of [20.9, 21, 20.8, 21.1]) {
      player.setSpeed(speed, 0.3, 0.05);
    }
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(fetchCalls, 1, "failed bank request retried without backoff");
    assert.equal(player.getState().motionLane, "DRIVE", "21 km/h jitter left native mode");
    assert.equal(JUNCTION_NATIVE_EXIT_SPEED_KMH, 20.5);

    context.currentTime += JUNCTION_NATIVE_RETRY_SECONDS + 0.01;
    timers[0]();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(fetchCalls, 2, "stable native speed did not retry after its audio-clock cooldown");

    player.setSpeed(20, 0.2, 0.1);
    assert.equal(player.getState().motionLane, "ROLL");
    assert.ok(player.getState().perceivedTempo < 100);
    player.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("JUNCTION observes one failure while a native transfer remains pending", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const originalConsoleError = console.error;
  const timers = [];
  globalThis.window = {
    setInterval(callback) { timers.push(callback); return timers.length; },
    clearInterval() {},
  };
  globalThis.__APP_BUILD__ = "junction-pending-retry-test";
  let rejectFirstFetch;
  let fetchCalls = 0;
  globalThis.fetch = () => {
    fetchCalls += 1;
    if (fetchCalls === 1) {
      return new Promise((resolve, reject) => { rejectFirstFetch = reject; });
    }
    return Promise.resolve({ ok: false, status: 503 });
  };
  const errors = [];
  const statuses = [];
  console.error = (...args) => errors.push(args);

  try {
    const {
      createJunctionPlayer,
      JUNCTION_NATIVE_RETRY_SECONDS,
    } = await import(`../src/junction-player.js?pending-retry=${Date.now()}`);
    const { context } = fakeContext();
    const player = createJunctionPlayer(
      context,
      new FakeNode(),
      null,
      (status, error) => statuses.push({ status, error }),
    );
    await player.setActive(true);
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.3, 0.1);
    await new Promise((resolve) => setImmediate(resolve));

    for (let index = 0; index < 40; index += 1) timers[0]();
    assert.equal(fetchCalls, 1, "review ticks duplicated the pending bank transfer");

    rejectFirstFetch(new Error("bank offline"));
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      statuses.filter(({ status }) => status === "error").length,
      1,
      "one failed native attempt published multiple error states",
    );
    assert.equal(errors.length, 2, "one failed attempt produced duplicate outer error logs");

    timers[0]();
    assert.equal(fetchCalls, 1, "native retry ignored its audio-clock cooldown");
    context.currentTime += JUNCTION_NATIVE_RETRY_SECONDS + 0.01;
    timers[0]();
    assert.equal(fetchCalls, 2, "native retry did not begin after its cooldown");
    await new Promise((resolve) => setImmediate(resolve));
    player.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("JUNCTION finishes one complete phrase before the next single coherent performance", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const timers = [];
  globalThis.window = {
    setInterval(callback) { timers.push(callback); return timers.length; },
    clearInterval() {},
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
  globalThis.__APP_BUILD__ = "junction-player-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });

  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?test=${Date.now()}`);
    const { context, sources } = fakeContext();
    const player = createJunctionPlayer(context, new FakeNode());
    player.setEnergy(0.93);
    await player.setActive(true);

    const first = player.getState();
    assert.equal(first.section, "FULL");
    assert.equal(first.tempo, 168);
    assert.ok(first.rhythmId);
    assert.equal(first.mixing, "single-synchronous-performance");
    assert.equal(first.tonalDecks, 1);
    assert.equal(first.automaticLead, false);
    assert.equal(first.sectionTakes.length, 1);
    assert.equal(sources.length, 1);

    const firstBoundary = sources[0].startAt + sources[0].duration;
    context.currentTime = firstBoundary - 0.5;
    timers[0]();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(sources.length, 2);
    assert.equal(sources[1].startAt, firstBoundary);

    context.currentTime = firstBoundary;
    timers[0]();
    const second = player.getState();
    assert.equal(second.section, "FULL");
    assert.equal(second.musicalFamily, first.musicalFamily);
    assert.notEqual(second.sectionTake, first.sectionTake);
    assert.equal(second.sectionTakes.length, 1);
    player.destroy();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("a scheduled phrase cannot recolour the active JUNCTION brake filter before its boundary", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const timers = [];
  globalThis.window = {
    setInterval(callback) { timers.push(callback); return timers.length; },
    clearInterval() {},
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
  globalThis.__APP_BUILD__ = "junction-boundary-tone-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });

  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?boundary-tone=${Date.now()}`);
    const rig = fakeContext();
    const player = createJunctionPlayer(rig.context, new FakeNode());
    const activeEnergy = 0.93;
    const pendingEnergy = 0.7;
    player.setEnergy(activeEnergy);
    await player.setActive(true);
    const activeCutoff = junctionPerformanceParameters(activeEnergy, player.getState().tempo).cutoff;

    player.setEnergy(pendingEnergy);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    const boundary = rig.sources[0].startAt + rig.sources[0].duration;
    rig.context.currentTime = boundary - 0.5;
    timers[0]();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(rig.sources.length, 2);

    rig.context.currentTime = boundary - 0.25;
    player.setBrake(1);
    const activeBrakeEvent = rig.filters[0].frequency.events
      .filter((event) => event.type === "target" && event.time === rig.context.currentTime)
      .at(-1);
    assert.equal(
      activeBrakeEvent.value,
      junctionBrakeParameters(1, activeCutoff).cutoffHz,
      "the pending phrase changed the active phrase's brake colour early",
    );

    rig.context.currentTime = boundary;
    timers[0]();
    rig.context.currentTime = boundary + 0.1;
    player.setBrake(0);
    const promotedEvent = rig.filters[0].frequency.events
      .filter((event) => event.type === "target" && event.time === rig.context.currentTime)
      .at(-1);
    assert.equal(
      promotedEvent.value,
      junctionPerformanceParameters(pendingEnergy, player.getState().tempo).cutoff,
      "the promoted phrase did not own subsequent tone changes",
    );
    player.destroy();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("JUNCTION waits for a distinct decoded companion before native playback begins", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  globalThis.window = { setInterval() { return 1; }, clearInterval() {} };
  globalThis.__APP_BUILD__ = "junction-companion-gate-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });

  let decodeCalls = 0;
  let resolveCompanion;
  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?companion=${Date.now()}`);
    const rig = fakeContext({
      decodeAudioData() {
        decodeCalls += 1;
        if (decodeCalls === 1) return Promise.resolve({ decoded: "primary" });
        if (decodeCalls === 2) {
          return new Promise((resolve) => { resolveCompanion = resolve; });
        }
        return Promise.resolve({ decoded: `later-${decodeCalls}` });
      },
    });
    const player = createJunctionPlayer(rig.context, new FakeNode());
    player.setEnergy(0.93);
    const activation = player.setActive(true, { externalEntranceFade: true });
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(decodeCalls, 2);
    assert.equal(rig.sources.length, 0, "native playback began without a decoded alternate take");
    assert.ok(player.getState().decodedSlots <= 6);

    resolveCompanion({ decoded: "companion" });
    await activation;
    assert.equal(rig.sources.length, 1);
    assert.equal(player.getState().rhythmTransition, "steady");
    assert.ok(player.getState().decodedSlots <= 6);
    player.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("JUNCTION retains timed-out native decode reservations across repeated retries", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const originalRandom = Math.random;
  const originalConsoleError = console.error;
  const timeouts = new Map();
  let nextTimerId = 1;
  globalThis.window = {
    setInterval() { return nextTimerId++; },
    clearInterval() {},
    setTimeout(callback, delay) {
      const id = nextTimerId++;
      timeouts.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) { timeouts.delete(id); },
  };
  globalThis.__APP_BUILD__ = "junction-native-decode-lifetime-test";
  Math.random = () => 0;
  console.error = () => {};
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });

  let decodeCalls = 0;
  let nativeDecodesInFlight = 0;
  const pendingNativeDecodes = [];
  let player = null;
  const settle = async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  };
  const runTimeouts = (delay) => {
    const due = [...timeouts.entries()].filter(([, timer]) => timer.delay === delay);
    for (const [id, timer] of due) {
      timeouts.delete(id);
      timer.callback();
    }
    return due.length;
  };

  try {
    const {
      createJunctionPlayer,
      JUNCTION_DECODE_TIMEOUT_MS,
      JUNCTION_NATIVE_RETRY_SECONDS,
    } = await import(`../src/junction-player.js?decode-lifetime=${Date.now()}`);
    const rig = fakeContext({
      decodeAudioData() {
        decodeCalls += 1;
        nativeDecodesInFlight += 1;
        return new Promise((resolve) => {
          pendingNativeDecodes.push((value) => {
            nativeDecodesInFlight -= 1;
            resolve(value);
          });
        });
      },
    });
    player = createJunctionPlayer(rig.context, new FakeNode());
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.3, 0.1);
    const activationResult = player.setActive(true).then(
      () => ({ status: "resolved" }),
      (error) => ({ status: "rejected", error }),
    );
    await settle();

    assert.equal(decodeCalls, 2, "native start did not reserve a primary and companion decode");
    assert.equal(nativeDecodesInFlight, 2);
    assert.equal(player.getState().decodingClips, 2);
    assert.equal(runTimeouts(JUNCTION_DECODE_TIMEOUT_MS), 2);
    await settle();
    const activation = await activationResult;
    assert.equal(activation.status, "rejected");
    assert.equal(activation.error.code, "READINESS_TIMEOUT");

    for (let attempt = 0; attempt < 12; attempt += 1) {
      rig.context.currentTime += JUNCTION_NATIVE_RETRY_SECONDS + 0.01;
      player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.3, 0.1);
      await settle();
      const state = player.getState();
      assert.equal(decodeCalls, 2, `retry ${attempt + 1} duplicated a non-abortable native decode`);
      assert.equal(nativeDecodesInFlight, 2);
      assert.equal(state.decodingClips, 2, "timed-out native reservations were released early");
      assert.ok(
        nativeDecodesInFlight + state.decodedClips <= 6,
        "true native in-flight plus decoded lifetime exceeded the six-slot cap",
      );
      assert.ok(state.decodedSlots <= 6);
    }

    for (const resolve of pendingNativeDecodes) resolve({ decoded: "late" });
    await settle();
    assert.equal(nativeDecodesInFlight, 0);
    assert.equal(player.getState().decodingClips, 0);
    assert.equal(player.getState().decodedClips, 2);
    assert.equal(player.getState().decodedSlots, 2);
  } finally {
    player?.destroy();
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    Math.random = originalRandom;
    console.error = originalConsoleError;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("destroy prevents late native decodes from repopulating retained PCM", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  globalThis.window = { setInterval() { return 1; }, clearInterval() {} };
  globalThis.__APP_BUILD__ = "junction-destroyed-decode-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });

  const pendingDecodes = [];
  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?destroyed-decode=${Date.now()}`);
    const rig = fakeContext({
      decodeAudioData() {
        return new Promise((resolve) => pendingDecodes.push(resolve));
      },
    });
    const player = createJunctionPlayer(rig.context, new FakeNode());
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.3, 0.1);
    const activation = player.setActive(true);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(pendingDecodes.length, 2);
    assert.equal(player.getState().decodingClips, 2);

    player.destroy();
    assert.equal(player.getState().decodingClips, 0);
    assert.equal(player.getState().decodedClips, 0);
    for (const resolve of pendingDecodes) resolve({ decoded: "late-after-destroy" });
    await activation;
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(player.getState().decodingClips, 0);
    assert.equal(player.getState().decodedClips, 0);
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("destroy prevents a pending Blob read from starting native decode", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const originalBlobArrayBuffer = Blob.prototype.arrayBuffer;
  globalThis.window = { setInterval() { return 1; }, clearInterval() {} };
  globalThis.__APP_BUILD__ = "junction-destroyed-blob-read-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });
  const releaseBlobReads = [];
  Blob.prototype.arrayBuffer = function delayedArrayBuffer() {
    return new Promise((resolve, reject) => {
      releaseBlobReads.push(() => originalBlobArrayBuffer.call(this).then(resolve, reject));
    });
  };

  let decodeCalls = 0;
  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?destroyed-blob-read=${Date.now()}`);
    const rig = fakeContext({
      decodeAudioData() {
        decodeCalls += 1;
        return Promise.resolve({ decoded: true });
      },
    });
    const player = createJunctionPlayer(rig.context, new FakeNode());
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.3, 0.1);
    const activation = player.setActive(true);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(releaseBlobReads.length, 2);

    player.destroy();
    for (const release of releaseBlobReads) release();
    await assert.rejects(activation, /JUNCTION player is closed/);
    assert.equal(decodeCalls, 0, "teardown still launched a native decode after Blob extraction");
    assert.equal(player.getState().decodedSlots, 0);
  } finally {
    Blob.prototype.arrayBuffer = originalBlobArrayBuffer;
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("destroy aborts a pending bank transfer and rejects its late payload", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  globalThis.window = { setInterval() { return 1; }, clearInterval() {} };
  globalThis.__APP_BUILD__ = "junction-destroyed-transfer-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  let resolvePayload;
  let observedSignal = null;
  globalThis.fetch = async (_url, options = {}) => {
    observedSignal = options.signal ?? null;
    return {
      ok: true,
      arrayBuffer() {
        return new Promise((resolve) => { resolvePayload = resolve; });
      },
    };
  };

  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?destroyed-transfer=${Date.now()}`);
    const rig = fakeContext();
    const player = createJunctionPlayer(rig.context, new FakeNode());
    player.setSpeed(NATIVE_GROOVE_SPEED_KMH, 0.3, 0.1);
    const activation = player.setActive(true);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(typeof resolvePayload, "function");

    player.destroy();
    assert.equal(observedSignal?.aborted, true);
    resolvePayload(bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength));
    await assert.rejects(activation, /JUNCTION player is closed/);
    assert.equal(player.getState().bankLoaded, false);
    assert.equal(player.getState().bankBytes, 0);
    assert.equal(player.getState().decodedSlots, 0);
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("JUNCTION continues an already decoded phrase on the exact boundary while the future take decodes", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const timers = [];
  globalThis.window = {
    setInterval(callback) { timers.push(callback); return timers.length; },
    clearInterval() {},
  };
  globalThis.__APP_BUILD__ = "junction-delayed-decode-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });

  let decodeCalls = 0;
  const unresolvedDecodes = [];
  try {
    const { createJunctionPlayer } = await import(`../src/junction-player.js?delayed=${Date.now()}`);
    const rig = fakeContext({
      decodeAudioData() {
        decodeCalls += 1;
        if (decodeCalls <= 2) return Promise.resolve({ decoded: `initial-${decodeCalls}` });
        return new Promise((resolve) => unresolvedDecodes.push(resolve));
      },
    });
    const player = createJunctionPlayer(rig.context, new FakeNode());
    player.setEnergy(0.93);
    await player.setActive(true);
    assert.equal(rig.sources.length, 1);
    assert.ok(player.getState().decodedSlots <= 6);
    const firstTake = player.getState().sectionTake;

    // Ask for a different eight-bar section whose two candidate takes are
    // deliberately still decoding. The boundary must use the decoded FULL
    // companion, never repeat the currently playing take or open a gap.
    player.setEnergy(0.7);

    const boundary = rig.sources[0].startAt + rig.sources[0].duration;
    rig.context.currentTime = boundary - 0.5;
    timers[0]();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(rig.sources.length, 2, "the fallback continuation was not scheduled");
    assert.equal(rig.sources[1].startAt, boundary, "decode latency moved the boundary");
    assert.ok(player.getState().decodedSlots <= 6, "in-flight decode exceeded the six-slot bound");

    rig.context.currentTime = boundary;
    timers[0]();
    assert.equal(player.getState().boundaryFallback, true);
    assert.notEqual(player.getState().sectionTake, firstTake, "the primary take repeated immediately");
    player.destroy();
  } finally {
    for (const resolve of unresolvedDecodes) resolve({ decoded: "late" });
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});

test("JUNCTION pins a distinct current companion through cache pressure and stalled future decodes", async () => {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  const originalBuild = globalThis.__APP_BUILD__;
  const originalConsoleError = console.error;
  const timers = [];
  globalThis.window = {
    setInterval(callback) { timers.push(callback); return timers.length; },
    clearInterval() {},
  };
  globalThis.__APP_BUILD__ = "junction-cache-pressure-test";
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });

  let stallFutureDecodes = false;
  let decodeCalls = 0;
  const unresolvedDecodes = [];
  const schedulerErrors = [];
  let player = null;
  const settle = async () => {
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  };

  try {
    console.error = (...args) => schedulerErrors.push(args);
    const { createJunctionPlayer } = await import(`../src/junction-player.js?cache-pressure=${Date.now()}`);
    const rig = fakeContext({
      decodeAudioData() {
        decodeCalls += 1;
        if (!stallFutureDecodes) return Promise.resolve({ decoded: decodeCalls });
        return new Promise((resolve) => unresolvedDecodes.push(resolve));
      },
    });
    player = createJunctionPlayer(rig.context, new FakeNode());
    player.setSpeed(80, 0.85, 0.1);
    await player.setActive(true);
    await settle();
    const firstTake = player.getState().sectionTake;

    // Four different future sections fill and churn the six-slot cache without
    // reaching the active FULL boundary. The active take and one distinct FULL
    // companion must survive every prewarm.
    for (const [speed, energy] of [
      [25, 0.18],
      [30, 0.4],
      [40, 0.55],
      [50, 0.7],
    ]) {
      player.setSpeed(speed, energy, 0.1);
      await settle();
      assert.ok(player.getState().decodedSlots <= 6);
    }

    // TURN is now requested while every new decode remains pending. The exact
    // boundary must use the pinned FULL companion rather than leave a gap.
    stallFutureDecodes = true;
    player.setBrake(1);
    await settle();
    assert.ok(unresolvedDecodes.length >= 1);
    assert.ok(player.getState().decodedSlots <= 6);

    const boundary = rig.sources[0].startAt + rig.sources[0].duration;
    rig.context.currentTime = boundary - 0.5;
    timers[0]();
    await settle();
    assert.equal(rig.sources.length, 2, "cache pressure evicted the exact-boundary continuation");
    assert.equal(rig.sources[1].startAt, boundary);
    assert.ok(player.getState().decodedSlots <= 6);

    rig.context.currentTime = boundary;
    timers[0]();
    assert.equal(player.getState().boundaryFallback, true);
    assert.notEqual(player.getState().sectionTake, firstTake);
    assert.deepEqual(schedulerErrors, []);
  } finally {
    for (const resolve of unresolvedDecodes) resolve({ decoded: "late" });
    await settle();
    player?.destroy();
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});
