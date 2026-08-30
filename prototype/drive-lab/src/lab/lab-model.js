import { CONTROL_PROTOCOL_SCHEMA } from "../control-protocol.js";

export const LAB_PRESET_SCHEMA = "sedicivalvole.lab-preset.v1";
export const LAB_CLIENT_ID = "lab.owner";

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
const choice = (values, fallback) => (value) => values.includes(value) ? value : fallback;
const number = (minimum, maximum, precision = 2) => (value) => (
  Number(clamp(value, minimum, maximum).toFixed(precision))
);

export const LAB_GROUPS = Object.freeze([
  Object.freeze({ id: "form", label: "FORM" }),
  Object.freeze({ id: "response", label: "RESPONSE" }),
  Object.freeze({ id: "macros", label: "MACROS" }),
  Object.freeze({ id: "scene", label: "SCENE" }),
]);

export const LAB_PARAMETER_MANIFEST = Object.freeze({
  "context.visual": Object.freeze({ group: "context", normalize: choice(["prtcl"], "prtcl") }),
  "context.prtclType": Object.freeze({ group: "context", normalize: choice(["frequency", "murmuration", "axiom"], "frequency") }),
  "context.music": Object.freeze({ group: "context", normalize: choice(["fracture", "junction", "nightshift"], "junction") }),
  "context.theme": Object.freeze({ group: "context", normalize: choice(["pearl", "graphite", "red", "blue", "silver", "neon", "mint", "acid", "signal", "sulphur"], "signal") }),
  "context.inputSource": Object.freeze({ group: "context", normalize: choice(["manual", "demo", "gps"], "manual") }),
  "context.speedKmh": Object.freeze({ group: "context", normalize: number(0, 130, 1) }),
  "context.bpm": Object.freeze({ group: "context", normalize: number(40, 200, 0) }),
  "context.audioLevel": Object.freeze({ group: "context", normalize: number(0, 1, 2) }),
  "form.scale": Object.freeze({ group: "form", normalize: number(0.5, 1.8, 2) }),
  "form.depth": Object.freeze({ group: "form", normalize: number(0.5, 1.8, 2) }),
  "form.flow": Object.freeze({ group: "form", normalize: number(0, 2, 2) }),
  "response.attackMs": Object.freeze({ group: "response", normalize: number(0, 2000, 0) }),
  "response.releaseMs": Object.freeze({ group: "response", normalize: number(0, 3000, 0) }),
  "macros.open": Object.freeze({ group: "macros", normalize: (value) => Boolean(value) }),
  "macros.underwater": Object.freeze({ group: "macros", normalize: (value) => Boolean(value) }),
  "macros.bloom": Object.freeze({ group: "macros", normalize: (value) => Boolean(value) }),
  "scene.particleSize": Object.freeze({ group: "scene", normalize: number(0.5, 2.5, 2) }),
  "scene.rainDensity": Object.freeze({ group: "scene", normalize: number(0.1, 1, 2) }),
  "scene.drift": Object.freeze({ group: "scene", normalize: number(0, 2, 2) }),
  "scene.cameraDepth": Object.freeze({ group: "scene", normalize: number(0.7, 1.6, 2) }),
});

export const DEFAULT_LAB_VALUES = Object.freeze({
  "context.visual": "prtcl",
  "context.prtclType": "frequency",
  "context.music": "junction",
  "context.theme": "signal",
  "context.inputSource": "manual",
  "context.speedKmh": 72,
  "context.bpm": 128,
  "context.audioLevel": 0.62,
  "form.scale": 1,
  "form.depth": 1,
  "form.flow": 1,
  "response.attackMs": 180,
  "response.releaseMs": 640,
  "macros.open": true,
  "macros.underwater": false,
  "macros.bloom": false,
  "scene.particleSize": 1,
  "scene.rainDensity": 0.72,
  "scene.drift": 1,
  "scene.cameraDepth": 1,
});

export function groupLabValues(values) {
  const grouped = { context: {}, form: {}, response: {}, macros: {}, scene: {} };
  for (const [id, definition] of Object.entries(LAB_PARAMETER_MANIFEST)) {
    const [group, name] = id.split(".");
    grouped[group][name] = definition.normalize(values[id]);
  }
  return grouped;
}

function safeRuntime(runtime = {}) {
  return {
    viewport: {
      width: Math.max(0, Math.round(Number(runtime.viewport?.width) || 0)),
      height: Math.max(0, Math.round(Number(runtime.viewport?.height) || 0)),
      devicePixelRatio: Number(Math.max(0, Number(runtime.viewport?.devicePixelRatio) || 0).toFixed(2)),
    },
    userAgent: String(runtime.userAgent || "unavailable").slice(0, 512),
    language: String(runtime.language || "unavailable").slice(0, 32),
    reducedMotion: Boolean(runtime.reducedMotion),
    online: Boolean(runtime.online),
    renderer: String(runtime.renderer || "unavailable").slice(0, 160),
    frame: {
      samples: Math.max(0, Math.round(Number(runtime.frame?.samples) || 0)),
      fps: Number(Math.max(0, Number(runtime.frame?.fps) || 0).toFixed(2)),
      p95Ms: Number(Math.max(0, Number(runtime.frame?.p95Ms) || 0).toFixed(2)),
    },
  };
}

export function createLabPreset({ values, app, runtime, revision, exportedAt = new Date().toISOString() }) {
  const grouped = groupLabValues(values);
  return {
    schema: LAB_PRESET_SCHEMA,
    exportedAt,
    app: {
      version: String(app?.version || "unknown"),
      build: String(app?.build || "unknown"),
      commit: String(app?.commit || "unknown"),
    },
    control: {
      schema: CONTROL_PROTOCOL_SCHEMA,
      revision: Math.max(0, Math.round(Number(revision) || 0)),
      clientId: LAB_CLIENT_ID,
    },
    selection: {
      visual: grouped.context.visual,
      visualVariant: grouped.context.prtclType,
      music: grouped.context.music,
      theme: grouped.context.theme,
      inputSource: grouped.context.inputSource,
    },
    signal: {
      speedKmh: grouped.context.speedKmh,
      bpm: grouped.context.bpm,
      audioLevel: grouped.context.audioLevel,
    },
    groups: {
      form: grouped.form,
      response: grouped.response,
      macros: grouped.macros,
      scene: grouped.scene,
    },
    runtime: safeRuntime(runtime),
    privacy: {
      coordinateFree: true,
      secretsIncluded: false,
      persistentStorageIncluded: false,
      deviceWideTrafficIncluded: false,
    },
  };
}

export function importLabPreset(preset) {
  if (!preset || typeof preset !== "object" || preset.schema !== LAB_PRESET_SCHEMA) {
    throw new TypeError("Unsupported LAB preset schema");
  }
  if (preset.privacy?.coordinateFree !== true || preset.privacy?.secretsIncluded !== false) {
    throw new TypeError("LAB preset privacy boundary is invalid");
  }
  const candidate = {
    "context.visual": preset.selection?.visual,
    "context.prtclType": preset.selection?.visualVariant,
    "context.music": preset.selection?.music,
    "context.theme": preset.selection?.theme,
    "context.inputSource": preset.selection?.inputSource,
    "context.speedKmh": preset.signal?.speedKmh,
    "context.bpm": preset.signal?.bpm,
    "context.audioLevel": preset.signal?.audioLevel,
    "form.scale": preset.groups?.form?.scale,
    "form.depth": preset.groups?.form?.depth,
    "form.flow": preset.groups?.form?.flow,
    "response.attackMs": preset.groups?.response?.attackMs,
    "response.releaseMs": preset.groups?.response?.releaseMs,
    "macros.open": preset.groups?.macros?.open,
    "macros.underwater": preset.groups?.macros?.underwater,
    "macros.bloom": preset.groups?.macros?.bloom,
    "scene.particleSize": preset.groups?.scene?.particleSize,
    "scene.rainDensity": preset.groups?.scene?.rainDensity,
    "scene.drift": preset.groups?.scene?.drift,
    "scene.cameraDepth": preset.groups?.scene?.cameraDepth,
  };
  return Object.freeze(Object.fromEntries(
    Object.entries(LAB_PARAMETER_MANIFEST).map(([id, definition]) => [id, definition.normalize(candidate[id])]),
  ));
}
