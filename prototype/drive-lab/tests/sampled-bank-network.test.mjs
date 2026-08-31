import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SAMPLED_BANK_BOUNDARY_MBPS,
  SAMPLED_BANK_TRANSFER_TIMEOUT_MS,
  sampledBankTransferBudgetMs,
} from "../src/sampled-bank-network.js";

class FakeParam {
  constructor(value = 0) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  setValueCurveAtTime(curve) { this.value = curve.at(-1); }
  cancelScheduledValues() {}
  cancelAndHoldAtTime() {}
}

class FakeNode {
  connect(target) { return target; }
  disconnect() {}
}

class FakeSource extends FakeNode {
  start(time, offset, duration) { this.startAt = time; this.offset = offset; this.duration = duration; }
  stop(time) { this.stopAt = time; }
}

function fakeContext() {
  const sources = [];
  const context = {
    currentTime: 0,
    createGain() { return Object.assign(new FakeNode(), { gain: new FakeParam() }); },
    createBiquadFilter() {
      return Object.assign(new FakeNode(), { frequency: new FakeParam(), Q: new FakeParam() });
    },
    createWaveShaper() { return Object.assign(new FakeNode(), { curve: null, oversample: "none" }); },
    createDelay() { return Object.assign(new FakeNode(), { delayTime: new FakeParam() }); },
    createStereoPanner() { return Object.assign(new FakeNode(), { pan: new FakeParam() }); },
    createOscillator() {
      return Object.assign(new FakeNode(), {
        frequency: new FakeParam(),
        detune: new FakeParam(),
        start() {},
        stop() {},
      });
    },
    createBufferSource() {
      const source = new FakeSource();
      sources.push(source);
      return source;
    },
    async decodeAudioData() { return { decoded: true }; },
  };
  return { context, sources };
}

function fakeTimers() {
  let nextId = 1;
  const intervals = new Map();
  const timeouts = new Map();
  return {
    intervals,
    setInterval(callback) { const id = nextId++; intervals.set(id, callback); return id; },
    clearInterval(id) { intervals.delete(id); },
    setTimeout(callback, delay) { const id = nextId++; timeouts.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timeouts.delete(id); },
    runTimeout(delay) {
      const entry = [...timeouts.entries()].find(([, timer]) => timer.delay === delay);
      assert.ok(entry, `no ${delay} ms timeout was scheduled`);
      timeouts.delete(entry[0]);
      entry[1].callback();
    },
    runIntervals() { for (const callback of intervals.values()) callback(); },
  };
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

test("the observed 1.35 Mbps boundary fits both public banks only with the measured deadline", async () => {
  const banks = await Promise.all([
    readFile(new URL("../public/audio/junction.svb", import.meta.url)),
    readFile(new URL("../public/audio/nightshift.svb", import.meta.url)),
  ]);
  assert.equal(SAMPLED_BANK_BOUNDARY_MBPS, 1.35);
  for (const bank of banks) {
    const budget = sampledBankTransferBudgetMs(bank.byteLength);
    assert.ok(budget > 12_000, "the former deadline incorrectly covered the cold-cache boundary");
    assert.ok(budget < SAMPLED_BANK_TRANSFER_TIMEOUT_MS, "the measured bank no longer fits the deadline");
  }
});

for (const fixture of [
  {
    id: "junction",
    bankUrl: new URL("../public/audio/junction.svb", import.meta.url),
    moduleUrl: new URL("../src/junction-player.js", import.meta.url),
    exportName: "createJunctionPlayer",
    retryExport: "JUNCTION_NATIVE_RETRY_SECONDS",
    speed: 21,
    energy: 0.3,
    expectedFailure: /JUNCTION bank transfer timed out after 45000 ms/,
  },
  {
    id: "nightshift",
    bankUrl: new URL("../public/audio/nightshift.svb", import.meta.url),
    moduleUrl: new URL("../src/nightshift-player.js", import.meta.url),
    exportName: "createNightshiftPlayer",
    retryExport: "NIGHTSHIFT_NATIVE_RETRY_SECONDS",
    speed: 3,
    energy: 0.03,
    expectedFailure: /NIGHTSHIFT bank transfer timed out after 45000 ms/,
  },
]) {
  test(`${fixture.id.toUpperCase()} aborts a stalled cold transfer, states why, and recovers without reselection`, async () => {
    const originals = {
      window: globalThis.window,
      fetch: globalThis.fetch,
      build: globalThis.__APP_BUILD__,
      random: Math.random,
      consoleError: console.error,
    };
    const timers = fakeTimers();
    globalThis.window = timers;
    globalThis.__APP_BUILD__ = `cold-cache-${fixture.id}`;
    Math.random = () => 0;
    console.error = () => {};
    const bytes = await readFile(fixture.bankUrl);
    let attempts = 0;
    let firstSignal = null;
    globalThis.fetch = async (_url, options = {}) => {
      attempts += 1;
      if (attempts === 1) {
        firstSignal = options.signal ?? null;
        return { ok: true, arrayBuffer: () => new Promise(() => {}) };
      }
      return {
        ok: true,
        async arrayBuffer() {
          return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        },
      };
    };

    let player;
    try {
      const module = await import(`${fixture.moduleUrl.href}?cold-cache=${fixture.id}-${Date.now()}`);
      const rig = fakeContext();
      player = module[fixture.exportName](rig.context, new FakeNode());
      player.setSpeed(fixture.speed, fixture.energy, 0.1);
      const firstActivation = player.setActive(true);
      await settle();
      assert.equal(attempts, 1);
      timers.runTimeout(SAMPLED_BANK_TRANSFER_TIMEOUT_MS);
      await assert.rejects(firstActivation, fixture.expectedFailure);
      assert.equal(firstSignal?.aborted, true, "the timed-out body was not aborted");
      assert.match(player.getState().bankError, fixture.expectedFailure);
      assert.equal(player.getState().playing, true, "the harmonic safety bed was not audible after failure");

      rig.context.currentTime += module[fixture.retryExport] + 0.01;
      timers.runIntervals();
      await settle();
      assert.equal(attempts, 2, "recovery required another user selection");
      assert.equal(player.getState().bankStatus, "ready");
      assert.equal(player.getState().bankError, null);
      assert.equal(player.getState().bankLoaded, true);
      assert.equal(player.getState().playing, true);
      assert.ok(rig.sources.length >= 1, "the recovered native performance never started");
    } finally {
      player?.destroy();
      globalThis.window = originals.window;
      globalThis.fetch = originals.fetch;
      Math.random = originals.random;
      console.error = originals.consoleError;
      if (originals.build === undefined) delete globalThis.__APP_BUILD__;
      else globalThis.__APP_BUILD__ = originals.build;
    }
  });
}
