import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

class FakeParam {
  setTargetAtTime(value) { this.value = value; }
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
}

class FakeNode {
  connect(target) { return target; }
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
  const context = {
    currentTime: 0,
    createGain() { return Object.assign(new FakeNode(), { gain: new FakeParam() }); },
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
  return { context, sources };
}

test("JUNCTION finishes one complete phrase before the next rhythm-locked pair", async () => {
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
    assert.equal(new Set(first.sectionRhythms).size, 1);
    assert.equal(sources.length, 2);
    assert.equal(sources[0].startAt, sources[1].startAt);
    assert.equal(sources[0].duration, sources[1].duration);

    const firstBoundary = sources[0].startAt + sources[0].duration;
    context.currentTime = firstBoundary - 0.5;
    timers[0]();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(sources.length, 4);
    assert.equal(sources[2].startAt, firstBoundary);
    assert.equal(sources[3].startAt, firstBoundary);

    context.currentTime = firstBoundary;
    timers[0]();
    const second = player.getState();
    assert.equal(second.section, "FULL");
    assert.equal(new Set(second.sectionRhythms).size, 1);
    assert.notEqual(second.musicalFamily, first.musicalFamily);
    assert.notDeepEqual(second.sectionTakes, first.sectionTakes);
    player.destroy();
  } finally {
    globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
    if (originalBuild === undefined) delete globalThis.__APP_BUILD__;
    else globalThis.__APP_BUILD__ = originalBuild;
  }
});
