import test from "node:test";
import assert from "node:assert/strict";
import { createMotionController, createMotionWindow, normalizeMotion, WINDOW_SIZE } from "../qa/motion-sensor.mjs";
import { createLinkReceiver, createSyntheticPeer, syntheticReply, LINK_TTL_MS } from "../qa/motion-link.mjs";

const event = (overrides = {}) => ({ acceleration: { x: 0.02, y: 0, z: 0 }, accelerationIncludingGravity: { x: 0, y: 0, z: 9.8 }, rotationRate: { alpha: 0, beta: 0, gamma: 0 }, interval: 16.7, isTrusted: true, ...overrides });
const sample = (at, overrides, angle = 0) => normalizeMotion(event(overrides), at, angle);
class Events {
  listeners = new Map();
  addEventListener(type, listener) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(listener); }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  emit(type, value = {}) { for (const listener of this.listeners.get(type) ?? []) listener(value); }
  count(type) { return this.listeners.get(type)?.size ?? 0; }
}
function fixture(API = { requestPermission: () => Promise.resolve("granted") }) {
  const host = Object.assign(new Events(), { isSecureContext: true, DeviceMotionEvent: API, navigator: { userActivation: { isActive: true } }, screen: { orientation: Object.assign(new Events(), { angle: 0 }) } });
  const doc = Object.assign(new Events(), { visibilityState: "visible" });
  let time = 0;
  const controller = createMotionController({ host, document: doc, now: () => time });
  return { host, doc, controller, at: (value) => { time = value; } };
}

test("normalization keeps device axes and missing values, never substitutes gravity or zero", () => {
  const s = sample(10, { acceleration: { x: null, y: NaN, z: 0 }, rotationRate: { alpha: Infinity, beta: "2" } }, -90);
  assert.deepEqual(s.acceleration, { x: null, y: null, z: 0 });
  assert.deepEqual(s.rotation, { alpha: null, beta: null, gamma: null });
  assert.equal(s.screenAngle, 270);
  assert.equal(s.includingGravity.z, 9.8);
  assert.equal(s.frame, "device-standard-orientation");
  assert.equal(normalizeMotion(event(), NaN), null);
  assert.equal(sample(0, { interval: 0 }).reportedIntervalMs, null);
});

test("observation cadence is independent from the API's declared interval", () => {
  const window = createMotionWindow();
  for (let i = 0; i <= 100; i += 20) window.add(sample(i));
  const summary = window.summary(120);
  assert.equal(summary.observedHz, 50);
  assert.equal(summary.reportedIntervalMs, 16.7);
  assert.equal(summary.intervalJitterMs, 0);
  assert.equal(summary.ageMs, 20);
  assert.equal(summary.quality, "complete");
  assert.equal(window.summary(351).quality, "stale");
});

test("empty, partial and backwards clock states remain truthful", () => {
  const window = createMotionWindow();
  assert.equal(window.summary(0).quality, "no-samples");
  window.add(sample(100, { acceleration: null }));
  assert.equal(window.summary(100).quality, "partial");
  assert.equal(window.summary(99).fresh, false);
  assert.equal(window.add(sample(99)), false);
  assert.equal(window.add(sample(100)), false);
  assert.equal(window.summary(100).total, 1);
  window.add(sample(110, { acceleration: null, accelerationIncludingGravity: null, rotationRate: null }));
  assert.equal(window.summary(110).quality, "no-values");
});

test("raw observations are bounded and not returned by the aggregate summary", () => {
  const window = createMotionWindow();
  for (let i = 0; i < 1000; i++) window.add(sample(i * 20));
  const summary = window.summary(19980);
  assert.equal(summary.retained, WINDOW_SIZE);
  assert.equal(summary.total, 1000);
  assert.equal(summary.acceleration, undefined);
  window.clear();
  assert.equal(window.summary(20000).retained, 0);
});

test("stationary baseline needs duration and count, returns noise/bias without vehicle calibration", () => {
  const window = createMotionWindow();
  window.beginCalibration();
  for (let i = 0; i < 100; i++) window.add(sample(i * 20));
  assert.equal(window.summary(1980).calibration.state, "collecting");
  window.add(sample(2000));
  const baseline = window.summary(2000).calibration;
  assert.equal(baseline.state, "baseline-only");
  assert.equal(baseline.count, 101);
  assert.ok(Math.abs(baseline.acceleration.x.mean - 0.02) < 1e-12);
  baseline.acceleration.x.mean = 99;
  assert.notEqual(window.summary(2000).calibration.acceleration.x.mean, 99);
  assert.equal(window.summary(2251).calibration.state, "invalidated");
});

test("calibration rejects motion, unavailable axes and excessive stationary noise", () => {
  for (const [overrides, expected] of [
    [{ acceleration: null }, "missing-axes"],
    [{ acceleration: { x: 0.6, y: 0, z: 0 } }, "motion-detected"],
    [{ rotationRate: { alpha: 4, beta: 0, gamma: 0 } }, "motion-detected"],
  ]) {
    const window = createMotionWindow();
    window.beginCalibration(); window.add(sample(0, overrides));
    assert.equal(window.summary(0).calibration.state, expected);
  }
  const window = createMotionWindow(); window.beginCalibration();
  for (let i = 0; i <= 100; i++) window.add(sample(i * 20, { acceleration: { x: i % 2 ? 0.2 : -0.2, y: 0, z: 0 } }));
  assert.equal(window.summary(2000).calibration.state, "noisy");
});

test("high-rate baseline completes without growing the raw observation window", () => {
  const window = createMotionWindow(); window.beginCalibration();
  for (let i = 0; i <= 500; i++) window.add(sample(i * 4));
  assert.equal(window.summary(2000).calibration.state, "baseline-only");
  assert.equal(window.summary(2000).calibration.count, 501);
  assert.equal(window.summary(2000).retained, WINDOW_SIZE);
});

test("screen changes and execution gaps invalidate history and calibration", () => {
  for (const next of [sample(20, {}, 90), sample(300)]) {
    const window = createMotionWindow(); window.beginCalibration(); window.add(sample(0)); window.add(next);
    assert.equal(window.summary(next.receivedAtMs).calibration.state, "invalidated");
    assert.equal(window.summary(next.receivedAtMs).retained, 1);
  }
});

test("controller does nothing until start, calls permission synchronously and removes listeners", async () => {
  let called = false;
  const f = fixture({ requestPermission() { called = true; return Promise.resolve("granted"); } });
  assert.equal(f.host.count("devicemotion"), 0);
  const starting = f.controller.start();
  assert.equal(called, true);
  await starting;
  f.host.emit("devicemotion", event());
  assert.equal(f.controller.summary().quality, "complete");
  f.controller.stop();
  assert.equal(f.host.count("devicemotion"), 0);
  assert.equal(f.controller.summary().retained, 0);
  f.controller.dispose();
  assert.equal(f.doc.count("visibilitychange"), 0);
  assert.equal(f.host.count("orientationchange"), 0);
  await f.controller.start();
  assert.equal(f.host.count("devicemotion"), 0);
});

test("unsupported, insecure, denied and missing gesture are distinct", async () => {
  for (const [setup, expected] of [
    [(f) => { f.host.DeviceMotionEvent = null; }, "unavailable"],
    [(f) => { f.host.isSecureContext = false; }, "insecure-context"],
    [(f) => { f.host.navigator.userActivation.isActive = false; }, "gesture-required"],
    [(f) => { f.host.DeviceMotionEvent.requestPermission = () => Promise.resolve("denied"); }, "denied"],
    [(f) => { f.host.DeviceMotionEvent.requestPermission = () => Promise.reject(new Error()); }, "permission-error"],
  ]) {
    const f = fixture(); setup(f); await f.controller.start();
    assert.equal(f.controller.summary().state, expected);
    assert.equal(f.host.count("devicemotion"), 0);
    f.controller.dispose();
  }
});

test("absence of requestPermission does not claim grant or usable sensors", async () => {
  const f = fixture({}); await f.controller.start();
  assert.equal(f.controller.summary().permission, "no-prompt-api");
  assert.equal(f.controller.summary().state, "waiting");
  f.at(3000);
  assert.equal(f.controller.summary().state, "no-samples");
  f.host.emit("devicemotion", event({ isTrusted: false }));
  assert.equal(f.controller.summary().retained, 0);
  f.controller.dispose();
});

test("hide, stop or dispose while permission is pending cannot resurrect capture", async () => {
  for (const action of ["hide", "stop", "dispose"]) {
    let resolve;
    const f = fixture({ requestPermission: () => new Promise((r) => { resolve = r; }) });
    const pending = f.controller.start();
    if (action === "hide") { f.doc.visibilityState = "hidden"; f.doc.emit("visibilitychange"); }
    else f.controller[action]();
    resolve("granted"); await pending;
    assert.equal(f.host.count("devicemotion"), 0);
    f.controller.dispose();
  }
});

test("foreground requires deliberate restart and orientation/remount discard baseline", async () => {
  const f = fixture(); await f.controller.start();
  f.host.emit("devicemotion", event()); f.controller.calibrate();
  f.host.screen.orientation.emit("change");
  assert.equal(f.controller.summary().retained, 0);
  assert.equal(f.controller.summary().calibration.state, "invalidated");
  f.doc.visibilityState = "hidden"; f.doc.emit("visibilitychange");
  f.doc.visibilityState = "visible"; f.doc.emit("visibilitychange");
  assert.equal(f.controller.summary().state, "suspended");
  assert.equal(f.host.count("devicemotion"), 0);
  await f.controller.start(); f.at(10); f.host.emit("devicemotion", event());
  assert.equal(f.controller.summary().quality, "complete");
  f.controller.remount(); assert.equal(f.controller.summary().retained, 0);
  f.host.emit("pagehide"); assert.equal(f.host.count("devicemotion"), 0);
  f.controller.dispose();
});

const session = "a".repeat(32);
function linkFixture() {
  let time = 500000;
  const receiver = createLinkReceiver({ session, now: () => time });
  return { receiver, advance: (n) => { time += n; } };
}

test("freshness is conservative using receiver RTT and sender-local age, without cross-clock subtraction", () => {
  const f = linkFixture(); const poll = f.receiver.poll();
  f.advance(30);
  assert.equal(f.receiver.receive(syntheticReply(poll, { session, sequence: 900, ageMs: 12 })), true);
  assert.equal(f.receiver.summary().ageUpperMs, 42);
  assert.equal(f.receiver.summary().rttMeanMs, 30);
  f.advance(209);
  assert.equal(f.receiver.summary().state, "stale");
});

test("delayed, replayed, reordered, wrong-session and malformed responses are rejected", () => {
  for (const mutate of [
    (p) => ({ ...p, session: "b".repeat(32) }),
    (p) => ({ ...p, kind: "sensor" }),
    (p) => ({ ...p, acceleration: [1, 2, 3] }),
    (p) => ({ ...p, request: 999 }),
    (p) => ({ ...p, sequence: -1 }),
    (p) => ({ ...p, ageMs: null }),
    (p) => ({ ...p, ageMs: 251 }),
  ]) {
    const f = linkFixture(); const poll = f.receiver.poll();
    const valid = syntheticReply(poll, { session, sequence: 10, ageMs: 0 });
    assert.equal(f.receiver.receive(JSON.stringify(mutate(JSON.parse(valid)))), false);
    assert.equal(f.receiver.receive(valid), true);
    assert.equal(f.receiver.receive(valid), false);
    const next = f.receiver.poll();
    assert.equal(f.receiver.receive(syntheticReply(next, { session, sequence: 9, ageMs: 0 })), false);
  }
  const f = linkFixture(); const poll = f.receiver.poll(); f.advance(251);
  assert.equal(f.receiver.receive(syntheticReply(poll, { session, sequence: 0, ageMs: 0 })), false);
  assert.equal(f.receiver.summary().expiredRequests, 1);
  assert.equal(f.receiver.receive("{"), false);
  assert.equal(f.receiver.receive("x".repeat(513)), false);
});

test("one outstanding challenge bounds work; loss expires and a fresh challenge recovers", () => {
  const f = linkFixture(); const abandoned = f.receiver.poll();
  assert.equal(f.receiver.poll(), null);
  f.advance(251); const next = f.receiver.poll();
  assert.notEqual(next, abandoned);
  assert.equal(f.receiver.receive(syntheticReply(abandoned, { session, sequence: 0, ageMs: 0 })), false);
  assert.equal(f.receiver.receive(syntheticReply(next, { session, sequence: 5, ageMs: 0 })), true);
  f.advance(50); const last = f.receiver.poll(); f.advance(10);
  assert.equal(f.receiver.receive(syntheticReply(last, { session, sequence: 8, ageMs: 0 })), true);
  assert.equal(f.receiver.summary().skippedSourceTicks, 2);
  assert.equal(f.receiver.summary().expiredRequests, 1);
  assert.equal(f.receiver.summary().state, "fresh-synthetic");
});

test("revocation, TTL and receiver clock rollback fail closed", () => {
  for (const action of ["revoke", "expire", "rollback"]) {
    const f = linkFixture(); const poll = f.receiver.poll();
    if (action === "revoke") f.receiver.revoke();
    if (action === "expire") f.advance(LINK_TTL_MS);
    if (action === "rollback") f.advance(-1);
    assert.equal(f.receiver.poll(), null);
    assert.equal(f.receiver.receive(syntheticReply(poll, { session, sequence: 0, ageMs: 0 })), false);
    assert.equal(f.receiver.summary().state, "expired-or-revoked");
  }
});

test("synthetic sender strictly limits schema and never echoes arbitrary fields", () => {
  const f = linkFixture(); const poll = f.receiver.poll();
  const metadata = { session, sequence: 1, ageMs: 10 };
  assert.equal(syntheticReply(JSON.stringify({ ...JSON.parse(poll), coordinates: [1, 2] }), metadata), null);
  assert.equal(syntheticReply(poll, { ...metadata, session: "b".repeat(32) }), null);
  assert.equal(syntheticReply(poll, { ...metadata, ageMs: NaN }), null);
  assert.equal(syntheticReply("null", metadata), null);
  assert.throws(() => createLinkReceiver({ session: "invalid" }));
});

function peerFixture(t, role = "receiver") {
  t.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
  let time = 0;
  let pc;
  class Channel extends Events {
    label = "synthetic-motion-probe";
    ordered = false;
    maxRetransmits = 0;
    readyState = "connecting";
    bufferedAmount = 0;
    sent = [];
    send(value) { this.sent.push(value); }
    close() { this.readyState = "closed"; this.emit("close"); }
  }
  class PC extends Events {
    connectionState = "new";
    signalingState = "stable";
    iceGatheringState = "complete";
    constructor(config) { super(); pc = this; this.config = config; }
    createDataChannel(label, options) { this.channel = new Channel(); this.options = options; return this.channel; }
    close() { this.connectionState = "closed"; this.signalingState = "closed"; this.emit("connectionstatechange"); }
    createOffer() { return Promise.resolve({ type: "offer", sdp: "synthetic-test-description" }); }
    setLocalDescription(value) { this.localDescription = value; return Promise.resolve(); }
  }
  const peer = createSyntheticPeer({ role, session, host: { isSecureContext: true, RTCPeerConnection: PC }, now: () => time });
  t.after(() => peer.close());
  return { peer, pc, Channel, advance(n) { time += n; t.mock.timers.tick(n); } };
}

test("peer requests direct unreliable channel only and bounds backpressure", async (t) => {
  const f = peerFixture(t);
  assert.deepEqual(f.pc.config, { iceServers: [] });
  assert.deepEqual(f.pc.options, { ordered: false, maxRetransmits: 0 });
  assert.equal((await f.peer.offer()).type, "offer");
  const channel = f.pc.channel; channel.readyState = "open"; channel.emit("open");
  channel.bufferedAmount = 4097; f.advance(50);
  assert.equal(channel.sent.length, 0);
  assert.equal(f.peer.summary().droppedForBackpressure, 1);
  channel.bufferedAmount = 0; f.advance(300);
  assert.equal(channel.sent.length, 1);
  channel.emit("message", { data: syntheticReply(channel.sent[0], { session, sequence: 10, ageMs: 0 }) });
  assert.equal(f.peer.summary().state, "fresh-synthetic");
  f.peer.close(); f.peer.close(); f.advance(1000);
  assert.equal(channel.sent.length, 1);
  assert.equal(f.peer.summary().state, "expired-or-revoked");
});

test("disconnect and expiry close the channel; recovery requires a new peer", (t) => {
  const f = peerFixture(t);
  f.pc.connectionState = "disconnected"; f.pc.emit("connectionstatechange");
  assert.equal(f.peer.summary().connection, "closed");
  assert.equal(f.pc.channel.readyState, "closed");
});

test("peer TTL ends even when a channel never opened", (t) => {
  const f = peerFixture(t); f.advance(LINK_TTL_MS);
  assert.equal(f.peer.summary().connection, "closed");
  assert.equal(f.peer.summary().channelOpened, false);
});

test("sender rejects unrelated channels and responds only with synthetic metadata", (t) => {
  const f = peerFixture(t, "sender");
  const unwanted = new f.Channel(); unwanted.label = "other";
  f.pc.emit("datachannel", { channel: unwanted });
  assert.equal(unwanted.readyState, "closed");
  const channel = new f.Channel(); channel.readyState = "open";
  f.pc.emit("datachannel", { channel });
  const receiver = createLinkReceiver({ session, now: () => 0 });
  channel.emit("message", { data: receiver.poll() });
  assert.equal(channel.sent.length, 1);
  assert.equal(receiver.receive(channel.sent[0]), true);
});
