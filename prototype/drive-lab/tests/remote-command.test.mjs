import test from "node:test";
import assert from "node:assert/strict";
import { createCommandProtocol, normalizeRemoteCommand } from "../src/remote/command-protocol.js";
import { createCommandRelay } from "../src/remote/command-relay.js";
import { createMotionCipher, createRelayKey } from "../src/motion/relay.js";
import { webcrypto } from "node:crypto";
import { FLUX_THEMES } from "../src/flux-themes.js";

test("remote commands are allowlisted and bounded", () => {
  assert.deepEqual(normalizeRemoteCommand({ id: "one", type: "mode", value: "flux" }), { v: "sv-remote-1", id: "one", type: "mode", value: "flux" });
  assert.equal(normalizeRemoteCommand({ id: "one", type: "raw-sensor", value: "gyro" }), null);
  assert.equal(normalizeRemoteCommand({ id: "one", type: "manual-effect", effect: "flanger", value: 2 }), null);
  assert.equal(normalizeRemoteCommand({ id: "one", type: "transport", direction: "seek" }), null);
});

test("receiver applies each command once and acknowledges it in a state heartbeat", () => {
  const applied = [];
  let state = { mode: "flux", playing: false };
  const receiver = createCommandProtocol({ role: "receiver", getState: () => state, onCommand: (command) => applied.push(command) });
  const phone = createCommandProtocol({ role: "phone", onState: (next) => { state = next; } });
  phone.enqueue({ id: "command-1", type: "mode", value: "engine" });
  const commandPacket = phone.poll();
  receiver.receive(commandPacket);
  receiver.receive(commandPacket);
  assert.equal(applied.length, 1);
  const statePacket = receiver.poll();
  phone.receive(statePacket);
  assert.equal(phone.summary().pending, 0);
});

test("state heartbeats mirror every palette and resolved appearance without a phone command", () => {
  let displayState = {};
  let phoneState = {};
  const receiver = createCommandProtocol({ role: "receiver", getState: () => displayState });
  const phone = createCommandProtocol({ role: "phone", onState: (state) => { phoneState = state; } });
  for (const theme of FLUX_THEMES) {
    for (const appearance of ["light", "dark"]) {
      displayState = { themeId: theme.id, appearance };
      phone.receive(receiver.poll());
      assert.deepEqual(phoneState, displayState);
      assert.equal(phone.summary().pending, 0);
    }
  }
});

test("appearance is optional for older peers and rejects unresolved or arbitrary values", () => {
  let displayState = { themeId: "blue" };
  const receiver = createCommandProtocol({ role: "receiver", getState: () => displayState });
  const phone = createCommandProtocol({ role: "phone" });
  phone.receive(receiver.poll());
  assert.deepEqual(phone.state(), { themeId: "blue" });
  for (const appearance of ["auto", "sepia", "", null, {}, true]) {
    displayState = { themeId: "blue", appearance };
    const outbound = JSON.parse(receiver.poll());
    assert.equal(Object.hasOwn(outbound.state, "appearance"), false);
    // Receiving peers enforce the same allowlist independently of the sender.
    outbound.state.appearance = appearance;
    phone.receive(JSON.stringify(outbound));
    assert.deepEqual(phone.state(), { themeId: "blue" });
  }
});

test("a lost acknowledgement is repeated without applying the command twice", () => {
  let applied = 0;
  const receiver = createCommandProtocol({ role: "receiver", onCommand: () => { applied += 1; return { ok: true }; } });
  const phone = createCommandProtocol({ role: "phone" });
  phone.enqueue({ id: "repeat-1", type: "transport", direction: "next" });
  receiver.receive(phone.poll());
  receiver.poll(); // The first state packet is lost in transit.
  receiver.receive(phone.poll());
  phone.receive(receiver.poll());
  assert.equal(applied, 1);
  assert.equal(phone.summary().pending, 0);
});

test("a rapid slider drag retains its final value without filling the command queue", () => {
  const phone = createCommandProtocol({ role: "phone" });
  for (let value = 1; value <= 100; value += 1) {
    assert.equal(phone.enqueue({ id: `drag-${value}`, type: "manual-effect", effect: "underwater", value: value / 100 }), true);
  }
  const applied = [];
  const receiver = createCommandProtocol({ role: "receiver", onCommand: command => applied.push(command) });
  receiver.receive(phone.poll());
  assert.equal(phone.summary().pending, 1);
  assert.deepEqual(applied.map(({ effect, value }) => ({ effect, value })), [{ effect: "underwater", value: 1 }]);
});

test("slider replacement preserves other effects and ordered transport gestures at the queue limit", () => {
  const phone = createCommandProtocol({ role: "phone" });
  phone.enqueue({ id: "first", type: "manual-effect", effect: "flanger", value: 0.2 });
  phone.enqueue({ id: "reverb", type: "manual-effect", effect: "reverb", value: 0.72 });
  for (let index = 0; index < 10; index++) phone.enqueue({ id: `next-${index}`, type: "transport", direction: "next" });
  assert.equal(phone.enqueue({ id: "latest", type: "manual-effect", effect: "flanger", value: 1 }), true);
  assert.equal(phone.enqueue({ id: "overflow", type: "transport", direction: "next" }), false);
  const commands = JSON.parse(phone.poll()).commands;
  assert.equal(commands.length, 12);
  assert.deepEqual(commands.filter(command => command.type === "transport").map(command => command.id), Array.from({ length: 10 }, (_, i) => `next-${i}`));
  assert.deepEqual(commands.filter(command => command.type === "manual-effect").map(command => command.value), [0.72, 1]);
});

test("an old acknowledgement cannot clear a newer slider preview; rejection restores confirmed state", () => {
  let preview;
  const phone = createCommandProtocol({ role: "phone", onState: (state, pending) => { preview = { state, ...pending }; } });
  const receiver = createCommandProtocol({ role: "receiver", getState: () => ({ manualEffects: { underwater: 0.2 } }), onCommand: command => ({ ok: command.value !== 1 }) });
  phone.enqueue({ id: "old", type: "manual-effect", effect: "underwater", value: 0.2 });
  receiver.receive(phone.poll());
  phone.enqueue({ id: "new", type: "manual-effect", effect: "underwater", value: 1 });
  phone.receive(receiver.poll());
  assert.equal(preview.state.manualEffects.underwater, 0.2);
  assert.equal(preview.pending[0].value, 1);
  assert.equal(phone.summary().pending, 1);
  receiver.receive(phone.poll());
  phone.receive(receiver.poll());
  assert.equal(preview.pending.length, 0);
  assert.equal(preview.state.manualEffects.underwater, 0.2);
});

test("an async command is acknowledged only after its handler settles", async () => {
  let complete;
  const receiver = createCommandProtocol({ role: "receiver", onCommand: () => new Promise((resolve) => { complete = resolve; }) });
  const phone = createCommandProtocol({ role: "phone" });
  phone.enqueue({ id: "async-1", type: "mode", value: "engine" });
  receiver.receive(phone.poll());
  assert.equal(receiver.summary().acknowledgements, 0);
  complete({ ok: true });
  await Promise.resolve();
  phone.receive(receiver.poll());
  assert.equal(phone.summary().pending, 0);
});

test("encrypted command relays recover from transient request failures", async () => {
  const cipher = await createMotionCipher(createRelayKey(webcrypto), webcrypto);
  const slots = {};
  let failures = 2;
  const exchange = (role) => async (packet) => {
    if (failures > 0) { failures -= 1; throw new TypeError("offline"); }
    if (packet) slots[role] = { sequence: (slots[role]?.sequence ?? 0) + 1, packet };
    return slots[role === "receiver" ? "phone" : "receiver"] ?? {};
  };
  const received = [];
  const receiver = createCommandRelay({ role: "receiver", cipher, exchange: exchange("receiver"), getState: () => ({ mode: "flux" }), onCommand: (command) => received.push(command) });
  const phone = createCommandRelay({ role: "phone", cipher, exchange: exchange("phone") });
  try {
    assert.equal(phone.command({ id: "next-1", type: "transport", direction: "next" }), true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    assert.equal(receiver.summary().state, "connected");
    assert.equal(received.length, 1);
  } finally {
    receiver.close();
    phone.close();
  }
});

test("Soundtrack selections are allowlisted by kind", () => {
  assert.deepEqual(
    normalizeRemoteCommand({ id: "s1", type: "soundtrack-selection", kind: "genre", value: "jazz" }),
    { v: "sv-remote-1", id: "s1", type: "soundtrack-selection", kind: "genre", value: "jazz" },
  );
  assert.equal(normalizeRemoteCommand({ id: "s2", type: "soundtrack-selection", kind: "playlist", value: "x" }), null);
  assert.equal(normalizeRemoteCommand({ id: "s3", type: "soundtrack-selection", kind: "pace" }), null);
});

test("the heartbeat carries the Soundtrack list but always fits, degrading detail first", () => {
  const long = (n) => "x".repeat(n);
  const entries = Array.from({ length: 9 }, (_, index) => ({
    key: `jamendo:${index}${long(60)}`,
    title: long(64),
    artist: long(48),
    artwork: `https://usercontent.jamendo.com/${long(170)}`,
  }));
  const track = { title: long(240), artist: long(240), album: long(240), artwork: `https://a.example/${long(220)}` };
  const receiver = createCommandProtocol({
    role: "receiver",
    getState: () => ({ mode: "flux", musicMode: "soundtrack", track, soundtrack: { selection: { kind: "genre", id: "jazz" }, status: "playing", currentKey: "jamendo:1", entries } }),
  });
  let received = null;
  const phone = createCommandProtocol({ role: "phone", onState: (state) => { received = state; } });
  const packet = receiver.poll();
  assert.ok(packet && packet.length <= 4096, "the state packet stays within the relay plaintext limit");
  phone.receive(packet);
  assert.equal(received.mode, "flux");
  assert.equal(received.track.title.length, 240);
  assert.equal(received.soundtrack.selection.id, "jazz");
  assert.ok(received.soundtrack.entries.length <= 6);
  const compact = createCommandProtocol({
    role: "receiver",
    getState: () => ({ mode: "flux", soundtrack: { entries: entries.slice(0, 6).map((entry) => ({ ...entry, key: "k1", title: "Night Drive", artist: "Artist", artwork: "https://usercontent.jamendo.com/?id=1&width=300" })) } }),
  });
  const phoneCompact = createCommandProtocol({ role: "phone", onState: (state) => { received = state; } });
  phoneCompact.receive(compact.poll());
  assert.equal(received.soundtrack.entries.length, 6);
  assert.match(received.soundtrack.entries[0].artwork, /^https:/, "normal lists keep their covers");
});
