import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createRemoteSession, parseRemotePair, selectRemotePair } from "../src/remote/session.js";

function fakeSurface() {
  const listeners = new Map();
  const host = {
    isSecureContext: true,
    crypto: webcrypto,
    location: { origin: "https://sedicivalvole.test" },
    navigator: { onLine: true },
    addEventListener(type, handler) { listeners.set(`host:${type}`, handler); },
    removeEventListener(type) { listeners.delete(`host:${type}`); },
  };
  const doc = {
    visibilityState: "visible",
    addEventListener(type, handler) { listeners.set(`doc:${type}`, handler); },
    removeEventListener(type) { listeners.delete(`doc:${type}`); },
  };
  return { host, doc };
}

test("remote pair fragments accept only the bounded bearer shape", () => {
  const value = `pair=${"a".repeat(32)}.${"b".repeat(64)}.${"c".repeat(64)}`;
  assert.deepEqual(parseRemotePair(value), { id: "a".repeat(32), token: "b".repeat(64), key: "c".repeat(64) });
  assert.equal(parseRemotePair("pair=short"), null);
});

test("reload prefers the admitted token over the consumed QR fragment", () => {
  const scanned = `pair=${"a".repeat(32)}.${"b".repeat(64)}.${"c".repeat(64)}`;
  const admitted = { id: "a".repeat(32), token: "d".repeat(64), key: "c".repeat(64), paired: true, expiresAt: 10_000 };
  assert.deepEqual(selectRemotePair(scanned, admitted, 1_000), admitted);
  assert.equal(selectRemotePair(`pair=${"e".repeat(32)}.${"f".repeat(64)}.${"1".repeat(64)}`, admitted, 1_000)?.id, "e".repeat(32));
});

test("a saved phone pairing restores the relay without joining again", async () => {
  const { host, doc } = fakeSurface();
  const actions = [];
  const events = [];
  const fetcher = async (_url, options) => {
    const payload = JSON.parse(options.body);
    actions.push(payload.action);
    return {
      ok: true,
      status: 200,
      async text() { return JSON.stringify({ status: "relay", sequence: 0, packet: null }); },
    };
  };
  const pair = {
    id: "a".repeat(32),
    token: "b".repeat(64),
    key: "c".repeat(64),
    paired: true,
    expiresAt: Date.now() + 60_000,
  };
  const session = createRemoteSession({ role: "phone", host, doc, fetcher, onEvent: (type) => events.push(type) });
  try {
    await session.start(pair);
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.ok(events.includes("restored"));
    assert.ok(actions.includes("exchange"));
    assert.equal(actions.includes("join"), false);
    assert.equal(session.snapshot().role, "phone");
  } finally {
    session.dispose();
    assert.equal(actions.includes("delete"), false);
  }
});
