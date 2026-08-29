import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DEFAULT_PRIMORDIAL_SETTINGS,
  PRIMORDIAL_CONTROLS,
  normalizePrimordialSettings,
  primordialMotionProfile,
} from "../src/environments/primordial/primordial-model.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const rendererSource = await read("../src/environments/primordial/primordial-renderer.js");
const fieldSource = await read("../src/environments/primordial/primordial-field.jsx");
const sharedSource = await read("../src/environments/source-field-utils.js");
const appSource = await read("../src/App.jsx");
const stylesSource = await read("../src/styles.css");
const harnessSource = await read("../qa/field-harness.jsx");
const packageSource = await read("../package.json");
const admissionSource = await read("../../../docs/SOURCE-ADMISSION-2026-08-29.md");
const noticesSource = await read("../../../THIRD_PARTY_NOTICES.md");

test("PRIMORDIAL exposes only bounded Scale, Flow, and Warp controls", () => {
  assert.deepEqual(PRIMORDIAL_CONTROLS.map(({ id }) => id), ["scale", "flow", "warp"]);
  assert.equal(PRIMORDIAL_CONTROLS.find(({ id }) => id === "warp").step, 0.01);
  assert.deepEqual(normalizePrimordialSettings(null), DEFAULT_PRIMORDIAL_SETTINGS);
  assert.deepEqual(normalizePrimordialSettings({ scale: 0, flow: 99, warp: "0.5" }), {
    scale: 0.6,
    flow: 1.8,
    warp: 0.5,
  });
  assert.deepEqual(normalizePrimordialSettings({ scale: Infinity, flow: NaN, warp: null }), {
    scale: 1,
    flow: 1,
    warp: 0.3,
  });
});

test("road speed owns convergence while music owns flow, colour, and agitation", () => {
  const rest = primordialMotionProfile({ speedKmh: 0, musicLevel: 0.1, bpm: 96 });
  const road = primordialMotionProfile({ speedKmh: 130, musicLevel: 0.1, bpm: 96 });
  const music = primordialMotionProfile({ speedKmh: 0, musicLevel: 0.9, bpm: 96 });
  assert.ok(road.convergence > rest.convergence);
  assert.equal(road.flowRate, rest.flowRate);
  assert.equal(road.colorRate, rest.colorRate);
  assert.equal(music.convergence, rest.convergence);
  assert.ok(music.flowRate > rest.flowRate);
  assert.ok(music.colorRate > rest.colorRate);
  assert.ok(music.agitation > rest.agitation);
  assert.equal(rest.musicTempoHz, 0);
  assert.ok(primordialMotionProfile({ speedKmh: 20, bpm: 96 }).musicTempoHz > 0);
});

test("OPEN, UNDERWATER, BLOOM, and reduced motion have native bounded responses", () => {
  const normal = primordialMotionProfile({ speedKmh: 70, musicLevel: 0.5, bpm: 120 });
  const open = primordialMotionProfile({ speedKmh: 70, musicLevel: 0.5, bpm: 120, effect: "OPEN" });
  const underwater = primordialMotionProfile({ speedKmh: 70, musicLevel: 0.5, bpm: 120, effect: "UNDERWATER" });
  const bloom = primordialMotionProfile({ speedKmh: 70, musicLevel: 0.5, bpm: 120, effect: "BLOOM" });
  const reduced = primordialMotionProfile({
    speedKmh: 130,
    musicLevel: 1,
    bpm: 180,
    effect: "BLOOM",
    reducedMotion: true,
  });
  assert.ok(open.convergence > normal.convergence);
  assert.ok(open.pressure > normal.pressure);
  assert.ok(underwater.flowRate < normal.flowRate);
  assert.ok(underwater.pressure < normal.pressure);
  assert.ok(bloom.glow > normal.glow);
  assert.ok(bloom.agitation > normal.agitation);
  assert.equal(reduced.flowRate, 0);
  assert.equal(reduced.colorRate, 0);
  assert.equal(reduced.agitation, 0);
  assert.equal(reduced.musicTempoHz, 0);
});

test("the fluid field is project-authored WebGL2 with no imported Pen runtime or noise", () => {
  assert.match(rendererSource, /Project-authored fluid field/);
  assert.match(rendererSource, /does not copy the CodePen shader/);
  assert.match(rendererSource, /getContext\("webgl2"/);
  assert.match(rendererSource, /for \(int layer = 0; layer < 6; layer \+= 1\)/);
  assert.match(rendererSource, /gl\.drawArrays\(gl\.TRIANGLES, 0, 3\)/);
  assert.doesNotMatch(rendererSource, /codepen\.io|shubniggurath|Inigo Quilez|cnoise|snoise/);
  assert.doesNotMatch(fieldSource + rendererSource + packageSource, /from "three"|@react-three/);
});

test("WebGL cleanup and Canvas2D fallback share the bounded field lifecycle", () => {
  assert.match(sharedSource, /SOURCE_MAX_PIXEL_RATIO = 1\.25/);
  assert.match(fieldSource, /startSourceCanvasLoop/);
  assert.match(fieldSource, /addEventListener\("webglcontextlost", onContextLost\)/);
  assert.match(fieldSource, /removeEventListener\("webglcontextlost", onContextLost\)/);
  assert.match(fieldSource, /cancelAnimationFrame\(animationFrame\)/);
  assert.match(fieldSource, /renderer\.dispose\(\)/);
  assert.match(rendererSource, /gl\.deleteBuffer\(buffer\)/);
  assert.match(rendererSource, /gl\.deleteVertexArray\(vertexArray\)/);
  assert.match(rendererSource, /gl\.deleteProgram\(program\)/);
});

test("the contextual TUNE disclosure is accessible, persisted, and field-lazy", () => {
  const start = appSource.indexOf("function PrimordialTuner");
  const end = appSource.indexOf("/**", start);
  const tunerSource = appSource.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(tunerSource, /aria-expanded=\{open\}/);
  assert.match(tunerSource, /aria-controls="primordial-tuner-panel"/);
  assert.match(tunerSource, /type="range"/);
  assert.doesNotMatch(tunerSource, /<select|aria-haspopup/);
  assert.match(appSource, /primordialSettings: normalizePrimordialSettings\(value\?\.primordialSettings\)/);
  assert.match(appSource, /const PrimordialField = lazy/);
  assert.match(appSource, /controlsAwake \|\| controlsPinned/);
  assert.match(stylesSource, /\.primordial-tuner \{[\s\S]*?top: 82px;[\s\S]*?left: 16px;[\s\S]*?width: 232px;/);
  assert.match(stylesSource, /\.primordial-tuner-trigger \{[\s\S]*?width: 94px;[\s\S]*?min-height: 44px;/);
});

test("touch deformation receives the field surface while product controls remain interactive", () => {
  assert.match(fieldSource, /setPointerCapture/);
  assert.match(fieldSource, /onPointerMove=\{updatePointer\}/);
  assert.match(fieldSource, /onPointerCancel=\{releasePointer\}/);
  assert.match(stylesSource, /\.primordial-field-canvas \{ touch-action: none; \}/);
  assert.match(stylesSource, /\.app\[data-environment="primordial"\] \.experience \{ z-index: 8; pointer-events: none; \}/);
  assert.match(stylesSource, /\.app\[data-environment="primordial"\]\.controls-awake \.experience \.control-layer/);
});

test("the QA and source records preserve the clean-room comparison boundary", () => {
  assert.match(harnessSource, /primordial: lazy/);
  assert.match(harnessSource, /PRIMORDIAL_SETTINGS/);
  assert.match(harnessSource, /bpm: SCORE_BPM/);
  assert.match(admissionSource, /codepen\.io\/shubniggurath\/pen\/NXGbBo/);
  assert.match(admissionSource, /CodePen's public-Pen policy/);
  assert.match(admissionSource, /copy none|No[\s\S]*?source|clean-room/i);
  assert.match(noticesSource, /GLSL: Primordial Soup/);
});
