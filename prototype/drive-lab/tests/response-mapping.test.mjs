import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceResponse,
  audioMacroAmount,
  createAudioMacroSnapshot,
  createResponseDefinition,
  createResponseState,
  mapResponseValue,
  sampleTimedGestureEnvelope,
} from "../src/response-mapping.js";

function runAtFps(definition, { fps, input, seconds }) {
  let state = createResponseState(definition, 0, 0);
  const frameMs = 1000 / fps;
  for (let frame = 1; frame <= fps * seconds; frame += 1) {
    state = advanceResponse(definition, state, input, frame * frameMs);
  }
  return state;
}

test("response curves clamp exact scalar and vector endpoints", () => {
  const scalar = createResponseDefinition({
    input: [0, 100],
    output: [10, 30],
    exponent: 2,
  });
  const vector = createResponseDefinition({
    input: [0, 100],
    output: [[0, 10, -1], [1, 30, 1]],
  });

  assert.equal(mapResponseValue(scalar, -10), 10);
  assert.equal(mapResponseValue(scalar, 50), 15);
  assert.equal(mapResponseValue(scalar, 200), 30);
  assert.deepEqual(mapResponseValue(vector, 0), [0, 10, -1]);
  assert.deepEqual(mapResponseValue(vector, 50), [0.5, 20, 0]);
  assert.deepEqual(mapResponseValue(vector, 100), [1, 30, 1]);
});

test("asymmetric response is frame-rate invariant at 30, 60, and 120 FPS", () => {
  const definition = createResponseDefinition({
    attackSeconds: 0.4,
    releaseSeconds: 0.9,
    risePerSecond: 10,
    fallPerSecond: 10,
  });
  const results = [30, 60, 120].map((fps) => runAtFps(definition, {
    fps,
    input: 1,
    seconds: 2,
  }).value);

  assert.ok(Math.max(...results) - Math.min(...results) < 1e-12, results.join(", "));
  assert.ok(results[0] > 0.99 && results[0] < 1);

  let release = createResponseState(definition, 1, 0);
  release = advanceResponse(definition, release, 0, 400);
  assert.ok(release.value > results[0] - 0.5, "release should use its slower time constant");
});

test("slew ceilings prevent overshoot on abrupt scalar and vector changes", () => {
  const scalar = createResponseDefinition({
    attackSeconds: 0,
    releaseSeconds: 0,
    risePerSecond: 0.5,
    fallPerSecond: 0.25,
  });
  let scalarState = createResponseState(scalar, 0, 0);
  scalarState = advanceResponse(scalar, scalarState, 1, 1000);
  assert.equal(scalarState.value, 0.5);
  scalarState = advanceResponse(scalar, scalarState, 1, 5000);
  assert.equal(scalarState.value, 1);
  scalarState = advanceResponse(scalar, scalarState, 0, 6000);
  assert.equal(scalarState.value, 0.75);

  const vector = createResponseDefinition({
    output: [[0, 10], [1, 20]],
    attackSeconds: 0,
    risePerSecond: [0.25, 2],
  });
  const vectorState = advanceResponse(
    vector,
    createResponseState(vector, 0, 0),
    1,
    1000,
  );
  assert.deepEqual(vectorState.value, [0.25, 12]);
  assert.ok(vectorState.value.every((value, index) => value <= vectorState.target[index]));
});

test("shared audio macro snapshots are typed, clamped, and timestamped", () => {
  const snapshot = createAudioMacroSnapshot({
    capturedAtMs: 1250,
    open: 1.5,
    underwater: -1,
    bloom: 0.4,
  });
  assert.equal(snapshot.schema, "sedicivalvole.audio-macros.v1");
  assert.equal(snapshot.capturedAtMs, 1250);
  assert.equal(audioMacroAmount(snapshot, "open"), 1);
  assert.equal(audioMacroAmount(snapshot, "underwater"), 0);
  assert.equal(audioMacroAmount(snapshot, "bloom"), 0.4);
  assert.equal(audioMacroAmount(snapshot, "unknown"), 0);
});

test("the timed gesture envelope matches attack, automatic release, and early release", () => {
  const sample = (elapsedSeconds, releaseElapsedSeconds = null) => sampleTimedGestureEnvelope({
    elapsedSeconds,
    releaseElapsedSeconds,
    attackSeconds: 0.03,
    automaticReleaseAtSeconds: 0.4,
    releaseSeconds: 0.25,
  });
  assert.equal(sample(0), 0);
  assert.ok(Math.abs(sample(0.015) - 0.5) < 1e-12);
  assert.equal(sample(0.03), 1);
  assert.equal(sample(0.4), 1);
  assert.ok(Math.abs(sample(0.525) - 0.5) < 1e-12);
  assert.equal(sample(0.65), 0);
  assert.ok(Math.abs(sample(0.2, 0.125) - 0.5) < 1e-12);
});

test("invalid definitions fail closed", () => {
  assert.throws(() => createResponseDefinition({ input: [1, 1] }), /increasing/);
  assert.throws(() => createResponseDefinition({ output: [[0, 1], [1]] }), /must contain/);
  assert.throws(() => createResponseDefinition({ exponent: 0 }), /greater than zero/);
});
