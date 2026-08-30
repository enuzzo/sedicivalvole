import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTROL_PROTOCOL_SCHEMA,
  applyParamMessage,
  createCommandMessage,
  createParamMessage,
  createStateMessage,
  validateControlMessage,
} from "../src/control-protocol.js";
import {
  DEFAULT_LAB_VALUES,
  LAB_PARAMETER_MANIFEST,
  LAB_PRESET_SCHEMA,
  createLabPreset,
  importLabPreset,
} from "../src/lab/lab-model.js";

test("typed control messages preserve kind, order, identity, and bounded JSON", () => {
  const param = createParamMessage({ clientId: "lab.owner", sequence: 3, id: "form.scale", value: 1.4, capturedAt: "2026-08-30T15:00:00.000Z" });
  const command = createCommandMessage({ clientId: "lab.owner", sequence: 4, id: "preset.copy", args: { format: "json" }, capturedAt: "2026-08-30T15:00:01.000Z" });
  const state = createStateMessage({ clientId: "lab.owner", sequence: 5, revision: 8, values: { "form.scale": 1.4 }, capturedAt: "2026-08-30T15:00:02.000Z" });
  assert.equal(param.schema, CONTROL_PROTOCOL_SCHEMA);
  assert.equal(param.kind, "param");
  assert.equal(command.kind, "command");
  assert.equal(state.revision, 8);
  assert.deepEqual(validateControlMessage(param), param);
  assert.throws(() => validateControlMessage({ ...param, schema: "future.v2" }), /unsupported/);
  assert.throws(() => createParamMessage({ clientId: "lab owner", sequence: 0, id: "form.scale", value: 1 }), /identifier/);
});

test("manifest admission normalizes values and rejects undeclared parameters", () => {
  const changed = applyParamMessage(DEFAULT_LAB_VALUES, createParamMessage({
    clientId: "lab.owner", sequence: 1, id: "context.speedKmh", value: 999,
  }), LAB_PARAMETER_MANIFEST);
  assert.equal(changed["context.speedKmh"], 130);
  assert.throws(() => applyParamMessage(DEFAULT_LAB_VALUES, createParamMessage({
    clientId: "lab.owner", sequence: 2, id: "secret.password", value: "no",
  }), LAB_PARAMETER_MANIFEST), /not declared/);
});

test("LAB preset round-trips every declared option with coordinate-free context", () => {
  const preset = createLabPreset({
    values: { ...DEFAULT_LAB_VALUES, "scene.cameraDepth": 1.34 },
    app: { version: "0.0.0", build: "20260830-1707", commit: "abc1234" },
    runtime: {
      viewport: { width: 773, height: 601, devicePixelRatio: 1.53 },
      userAgent: "Tesla Chromium",
      language: "en",
      reducedMotion: false,
      online: true,
      renderer: "WebGL2 · PRTCL Fractal Frequency",
      frame: { samples: 240, fps: 59.92, p95Ms: 18.2 },
    },
    revision: 22,
    exportedAt: "2026-08-30T15:30:00.000Z",
  });
  assert.equal(preset.schema, LAB_PRESET_SCHEMA);
  assert.equal(preset.runtime.viewport.width, 773);
  assert.equal(preset.privacy.coordinateFree, true);
  assert.equal(preset.privacy.secretsIncluded, false);
  assert.equal(preset.groups.scene.cameraDepth, 1.34);
  assert.deepEqual(importLabPreset(preset), { ...DEFAULT_LAB_VALUES, "scene.cameraDepth": 1.34 });
  assert.doesNotMatch(JSON.stringify(preset), /latitude|longitude|coordinates|password/i);
});

test("unknown preset major and weakened privacy boundary fail closed", () => {
  assert.throws(() => importLabPreset({ schema: "sedicivalvole.lab-preset.v2" }), /Unsupported/);
  assert.throws(() => importLabPreset({
    ...createLabPreset({ values: DEFAULT_LAB_VALUES }),
    privacy: { coordinateFree: false, secretsIncluded: false },
  }), /privacy boundary/);
});
