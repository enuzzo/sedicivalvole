import assert from "node:assert/strict";
import test from "node:test";
import {
  applySoundtrackTransitionGains,
  createSoundtrackTransitionState,
  sampleSoundtrackTransition,
  scheduleSoundtrackTransition,
  settleSoundtrackTransition,
  shouldCompleteSoundtrackTransition,
  SOUNDTRACK_SKIP_CROSSFADE_SECONDS,
  SOUNDTRACK_TRANSITION_SCHEMA,
  SOUNDTRACK_TRANSITION_TRACK_LIMIT,
} from "../src/soundtrack/transition-model.js";

const closeTo = (actual, expected, epsilon = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
};

class FakeParam {
  constructor({ curve = true, ramp = true } = {}) {
    this.events = [];
    if (!curve) this.setValueCurveAtTime = undefined;
    if (!ramp) this.linearRampToValueAtTime = undefined;
  }

  cancelScheduledValues(at) {
    this.events.push({ type: "cancel", at });
  }

  setValueAtTime(value, at) {
    this.events.push({ type: "set", value, at });
  }

  setValueCurveAtTime(curve, at, duration) {
    this.events.push({ type: "curve", curve, at, duration });
  }

  linearRampToValueAtTime(value, at) {
    this.events.push({ type: "ramp", value, at });
  }
}

test("a normal Soundtrack skip lasts exactly 450 ms at constant power", () => {
  const initial = createSoundtrackTransitionState("track:a", 5);
  const scheduled = scheduleSoundtrackTransition({
    state: initial,
    targetKey: "track:b",
    startAt: 10,
  });

  assert.equal(scheduled.blockedReason, null);
  assert.equal(scheduled.state.schema, SOUNDTRACK_TRANSITION_SCHEMA);
  assert.equal(scheduled.state.startAt, 10);
  assert.equal(scheduled.state.endAt, 10 + SOUNDTRACK_SKIP_CROSSFADE_SECONDS);
  closeTo(scheduled.state.durationSeconds, SOUNDTRACK_SKIP_CROSSFADE_SECONDS);
  assert.equal(scheduled.state.revision, 1);
  assert.equal(scheduled.state.automaticModeFallback, false);
  assert.equal(scheduled.state.persistentAudioStorage, false);

  for (const progress of [0, 0.125, 0.25, 0.5, 0.75, 0.875, 1]) {
    const sampled = sampleSoundtrackTransition(
      scheduled.state,
      scheduled.state.startAt + scheduled.state.durationSeconds * progress,
    );
    closeTo(sampled.powerSquared, 1, 1e-12);
  }
});

test("a rapid reversal starts from the audible mix and scales its duration", () => {
  const forward = scheduleSoundtrackTransition({
    state: createSoundtrackTransitionState("track:a", 0),
    targetKey: "track:b",
    startAt: 10,
  }).state;
  const reversedAt = 10 + SOUNDTRACK_SKIP_CROSSFADE_SECONDS * 0.25;
  const before = sampleSoundtrackTransition(forward, reversedAt);
  const reversed = scheduleSoundtrackTransition({
    state: forward,
    targetKey: "track:a",
    startAt: reversedAt,
  }).state;

  closeTo(reversed.fromGains["track:a"], before.gains["track:a"]);
  closeTo(reversed.fromGains["track:b"], before.gains["track:b"]);
  closeTo(reversed.durationSeconds, SOUNDTRACK_SKIP_CROSSFADE_SECONDS * 0.25);
  closeTo(sampleSoundtrackTransition(reversed, reversed.endAt).gains["track:a"], 1);
  closeTo(sampleSoundtrackTransition(reversed, reversed.endAt).powerSquared, 1);
});

test("a third prepared target can replace an active two-track fade without a gain hole", () => {
  const forward = scheduleSoundtrackTransition({
    state: createSoundtrackTransitionState("track:a", 0),
    targetKey: "track:b",
    startAt: 1,
  }).state;
  const retargetedAt = 1 + SOUNDTRACK_SKIP_CROSSFADE_SECONDS * 0.5;
  const retargeted = scheduleSoundtrackTransition({
    state: forward,
    targetKey: "track:c",
    startAt: retargetedAt,
  });

  assert.equal(retargeted.blockedReason, null);
  assert.equal(Object.keys(retargeted.state.fromGains).length, SOUNDTRACK_TRANSITION_TRACK_LIMIT);
  closeTo(retargeted.state.durationSeconds, SOUNDTRACK_SKIP_CROSSFADE_SECONDS);
  for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
    const sampled = sampleSoundtrackTransition(
      retargeted.state,
      retargeted.state.startAt + retargeted.state.durationSeconds * progress,
    );
    closeTo(sampled.powerSquared, 1, 1e-12);
  }

  const blocked = scheduleSoundtrackTransition({
    state: retargeted.state,
    targetKey: "track:d",
    startAt: retargeted.state.startAt + 0.1,
  });
  assert.equal(blocked.blockedReason, "transition-track-limit");
  assert.equal(blocked.state, retargeted.state);
});

test("gain scheduling emits matched equal-power curves for every active deck", () => {
  const state = scheduleSoundtrackTransition({
    state: createSoundtrackTransitionState("track:a", 0),
    targetKey: "track:b",
    startAt: 2,
  }).state;
  const outgoing = new FakeParam();
  const incoming = new FakeParam();
  const result = applySoundtrackTransitionGains(state, {
    "track:a": outgoing,
    "track:b": incoming,
  });

  assert.equal(result.ok, true);
  assert.equal(result.schedules.length, 2);
  const outgoingCurve = outgoing.events.find((event) => event.type === "curve");
  const incomingCurve = incoming.events.find((event) => event.type === "curve");
  assert.equal(outgoing.events[0].type, "cancel");
  assert.equal(incoming.events[0].type, "cancel");
  closeTo(outgoingCurve.duration, SOUNDTRACK_SKIP_CROSSFADE_SECONDS);
  closeTo(incomingCurve.duration, SOUNDTRACK_SKIP_CROSSFADE_SECONDS);
  assert.equal(outgoingCurve.curve.length, incomingCurve.curve.length);
  for (let index = 0; index < outgoingCurve.curve.length; index += 1) {
    closeTo(
      outgoingCurve.curve[index] ** 2 + incomingCurve.curve[index] ** 2,
      1,
      1e-6,
    );
  }
});

test("gain capabilities are validated before any AudioParam is mutated", () => {
  const state = scheduleSoundtrackTransition({
    state: createSoundtrackTransitionState("track:a", 0),
    targetKey: "track:b",
    startAt: 2,
  }).state;
  const complete = new FakeParam();
  const missing = applySoundtrackTransitionGains(state, { "track:a": complete });
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, "missing-gain-param");
  assert.deepEqual(complete.events, []);

  const noCurveOrRamp = new FakeParam({ curve: false, ramp: false });
  const missingRamp = applySoundtrackTransitionGains(state, {
    "track:a": complete,
    "track:b": noCurveOrRamp,
  });
  assert.equal(missingRamp.ok, false);
  assert.equal(missingRamp.reason, "missing-gain-ramp");
  assert.deepEqual(complete.events, []);
  assert.deepEqual(noCurveOrRamp.events, []);
});

test("segmented linear ramps preserve the curve when value curves are unavailable", () => {
  const state = scheduleSoundtrackTransition({
    state: createSoundtrackTransitionState("track:a", 0),
    targetKey: "track:b",
    startAt: 4,
  }).state;
  const outgoing = new FakeParam({ curve: false });
  const incoming = new FakeParam({ curve: false });
  const result = applySoundtrackTransitionGains(state, {
    "track:a": outgoing,
    "track:b": incoming,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(outgoing.events.slice(0, 2).map((event) => event.type), ["cancel", "set"]);
  assert.deepEqual(incoming.events.slice(0, 2).map((event) => event.type), ["cancel", "set"]);
  assert.equal(outgoing.events.length, 66);
  assert.equal(incoming.events.length, 66);
  assert.equal(outgoing.events.slice(2).every((event) => event.type === "ramp"), true);
  assert.equal(incoming.events.slice(2).every((event) => event.type === "ramp"), true);
  closeTo(outgoing.events[1].value, 1, 1e-6);
  closeTo(outgoing.events.at(-1).value, 0, 1e-6);
  closeTo(incoming.events[1].value, 0, 1e-6);
  closeTo(incoming.events.at(-1).value, 1, 1e-6);
  closeTo(outgoing.events.at(-1).at, state.endAt);
  closeTo(incoming.events.at(-1).at, state.endAt);
});

test("audio-clock, requested-track, and revision guards reject stale completion", () => {
  const state = scheduleSoundtrackTransition({
    state: createSoundtrackTransitionState("track:a", 0),
    targetKey: "track:b",
    startAt: 8,
  }).state;
  const correct = {
    state,
    at: state.endAt,
    requestedKey: "track:b",
    currentRevision: state.revision,
  };

  assert.equal(shouldCompleteSoundtrackTransition({ ...correct, at: state.endAt - 0.001 }), false);
  assert.equal(shouldCompleteSoundtrackTransition({ ...correct, requestedKey: "track:c" }), false);
  assert.equal(shouldCompleteSoundtrackTransition({ ...correct, currentRevision: state.revision + 1 }), false);
  assert.equal(shouldCompleteSoundtrackTransition(correct), true);
  assert.equal(settleSoundtrackTransition({ ...correct, currentRevision: state.revision + 1 }).completed, false);
  const settled = settleSoundtrackTransition(correct);
  assert.equal(settled.completed, true);
  assert.equal(settled.state.targetKey, "track:b");
  assert.equal(settled.state.startAt, state.endAt);
  assert.equal(settled.state.endAt, state.endAt);
  assert.deepEqual(settled.state.fromGains, { "track:b": 1 });
});

test("invalid state and target input fail closed without changing selection", () => {
  assert.equal(createSoundtrackTransitionState(""), null);
  const state = createSoundtrackTransitionState("track:a", 0);
  assert.deepEqual(scheduleSoundtrackTransition({ state: {}, targetKey: "track:b" }), {
    state: {},
    blockedReason: "invalid-transition-state",
  });
  const invalidTarget = scheduleSoundtrackTransition({ state, targetKey: "" });
  assert.equal(invalidTarget.state, state);
  assert.equal(invalidTarget.blockedReason, "invalid-target");
  assert.equal(sampleSoundtrackTransition(null, 0).status, "invalid");
});
