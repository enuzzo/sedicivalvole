import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

class FakeParam {
  constructor() { this.events = []; this.value = 0; }
  setTargetAtTime(value, time, constant) { this.value = value; this.events.push({ type: "target", value, time, constant }); }
  setValueAtTime(value, time) { this.value = value; this.events.push({ type: "set", value, time }); }
  linearRampToValueAtTime(value, time) { this.value = value; this.events.push({ type: "ramp", value, time }); }
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

function fakeContext() {
  const sources = [];
  const gains = [];
  const context = {
    currentTime: 0,
    createGain() {
      const gain = Object.assign(new FakeNode(), { gain: new FakeParam() });
      gains.push(gain);
      return gain;
    },
    createBiquadFilter() {
      return Object.assign(new FakeNode(), {
        frequency: new FakeParam(),
        Q: new FakeParam(),
      });
    },
    createDelay() { return Object.assign(new FakeNode(), { delayTime: new FakeParam() }); },
    createStereoPanner() { return Object.assign(new FakeNode(), { pan: new FakeParam() }); },
    createBufferSource() {
      const source = new FakeSource();
      sources.push(source);
      return source;
    },
    async decodeAudioData() { return { decoded: true }; },
  };
  return { context, sources, gains };
}

test("JUNCTION fades rhythm in from rest and releases it softly when returning to rest", async () => {
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
  globalThis.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength);
    },
  });

  try {
    const { createJunctionPlayer, JUNCTION_RHYTHM_FADE_SECONDS } = await import(`../src/junction-player.js?fade-test=${Date.now()}`);
    const { context, sources, gains } = fakeContext();
    const player = createJunctionPlayer(context, new FakeNode());
    player.setEnergy(0);
    await player.setActive(true);
    const restSources = player.getState();
    assert.equal(restSources.section, "REST");

    const restBoundary = sources[0].startAt + sources[0].duration;
    player.setEnergy(0.2);
    context.currentTime = restBoundary - 0.5;
    timers[0]();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    const performanceGains = gains.filter((gain) => gain.connectedTo === gains[0]);
    assert.equal(performanceGains.length, 2);
    const enteringBeat = performanceGains[1].gain.events;
    const entranceSet = enteringBeat.find((event) => event.type === "set" && event.value === 0);
    const entranceRamp = enteringBeat.find((event) => event.type === "ramp" && event.value === 1);
    assert.ok(entranceSet);
    assert.equal(entranceRamp.time - entranceSet.time, JUNCTION_RHYTHM_FADE_SECONDS);

    context.currentTime = restBoundary;
    timers[0]();
    assert.equal(player.getState().rhythmTransition, "fade-in");
    context.currentTime = restBoundary + 5;
    player.setEnergy(0);
    const releaseRamp = enteringBeat.at(-1);
    assert.equal(releaseRamp.type, "ramp");
    assert.equal(releaseRamp.value, 0.08);
    assert.equal(releaseRamp.time, context.currentTime + JUNCTION_RHYTHM_FADE_SECONDS);
    assert.equal(player.getState().rhythmTransition, "fade-out");

    context.currentTime = restBoundary + 6;
    player.setEnergy(0.2);
    assert.equal(enteringBeat.at(-2).type, "set");
    assert.equal(enteringBeat.at(-1).value, 1);
    assert.equal(enteringBeat.at(-1).time, context.currentTime + 1.2);
    player.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
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
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});
