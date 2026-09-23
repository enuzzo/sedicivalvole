import test from "node:test";
import assert from "node:assert/strict";
import { createCommandProtocol, normalizeRemoteCommand } from "../src/remote/command-protocol.js";
import { createCommandRelay } from "../src/remote/command-relay.js";
import { createMotionCipher, createRelayKey } from "../src/motion/relay.js";
import { webcrypto } from "node:crypto";

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
