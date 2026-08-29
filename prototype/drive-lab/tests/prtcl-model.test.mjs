import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEFAULT_PRTCL_SETTINGS,
  PRTCL_SOURCE_COMMIT,
  PRTCL_TYPES,
  nextPrtclTypeId,
  normalizePrtclSettings,
  prtclMotionProfile,
} from "../src/environments/prtcl/prtcl-model.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const rendererSource = await read("../src/environments/prtcl/prtcl-renderer.js");
const fieldSource = await read("../src/environments/prtcl/prtcl-field.jsx");
const appSource = await read("../src/App.jsx");
const stylesSource = await read("../src/styles.css");
const harnessSource = await read("../qa/field-harness.jsx");
const packageSource = await read("../package.json");
const admissionSource = await read("../../../docs/SOURCE-ADMISSION-2026-08-29.md");

test("PRTCL exposes only the three reviewed particle families and defaults to Fractal", () => {
  assert.deepEqual(Object.keys(PRTCL_TYPES), ["frequency", "murmuration", "axiom"]);
  assert.deepEqual(normalizePrtclSettings(null), DEFAULT_PRTCL_SETTINGS);
  assert.deepEqual(normalizePrtclSettings({ type: "axiom" }), { type: "axiom" });
  assert.deepEqual(normalizePrtclSettings({ type: "electromagnetic" }), { type: "frequency" });
  assert.equal(PRTCL_TYPES.frequency.particleCount, 24000);
  assert.equal(PRTCL_TYPES.murmuration.particleCount, 16000);
  assert.equal(PRTCL_TYPES.axiom.particleCount, 37000);
});

test("the compact TYPE control cycles directly and returns to Fractal", () => {
  assert.equal(nextPrtclTypeId("frequency"), "murmuration");
  assert.equal(nextPrtclTypeId("murmuration"), "axiom");
  assert.equal(nextPrtclTypeId("axiom"), "frequency");
  assert.equal(nextPrtclTypeId("unknown"), "frequency");
});

test("road speed owns point scale, depth, and travel while music owns colour and pulse", () => {
  const rest = prtclMotionProfile({ speedKmh: 0, audioLevel: 0 });
  const road = prtclMotionProfile({ speedKmh: 110, audioLevel: 0 });
  const music = prtclMotionProfile({ speedKmh: 0, audioLevel: 0.8 });
  assert.ok(road.pointScale > rest.pointScale);
  assert.ok(road.depthScale > rest.depthScale);
  assert.ok(road.travelRate > rest.travelRate);
  assert.equal(road.colourEnergy, rest.colourEnergy);
  assert.equal(road.pulse, rest.pulse);
  assert.equal(music.pointScale, rest.pointScale);
  assert.equal(music.depthScale, rest.depthScale);
  assert.equal(music.travelRate, rest.travelRate);
  assert.ok(music.colourEnergy > rest.colourEnergy);
  assert.ok(music.pulse > rest.pulse);
});

test("OPEN, UNDERWATER, BLOOM, and reduced motion have bounded native responses", () => {
  const normal = prtclMotionProfile({ speedKmh: 70, audioLevel: 0.5 });
  const open = prtclMotionProfile({ speedKmh: 70, audioLevel: 0.5, effect: "OPEN" });
  const underwater = prtclMotionProfile({ speedKmh: 70, audioLevel: 0.5, effect: "UNDERWATER" });
  const bloom = prtclMotionProfile({ speedKmh: 70, audioLevel: 0.5, effect: "BLOOM" });
  const reduced = prtclMotionProfile({ speedKmh: 130, audioLevel: 1, effect: "BLOOM", reducedMotion: true });
  assert.ok(open.spreadScale > normal.spreadScale);
  assert.ok(underwater.travelRate < normal.travelRate);
  assert.ok(underwater.brightness < normal.brightness);
  assert.ok(bloom.brightness > normal.brightness);
  assert.equal(bloom.bloom, 1);
  assert.equal(reduced.travelRate, 0);
  assert.equal(reduced.colourEnergy, 0);
  assert.equal(reduced.pulse, 0);
  for (const profile of [normal, open, underwater, bloom, reduced]) {
    assert.ok(profile.pointScale >= 0.82 && profile.pointScale <= 1.48);
    assert.ok(profile.depthScale >= 0.79 && profile.depthScale <= 1.32);
  }
});

test("the source-faithful renderer is bounded WebGL2 with no imported PRTCL runtime", () => {
  assert.equal(PRTCL_SOURCE_COMMIT, "2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060");
  assert.match(rendererSource, /getContext\("webgl2"/);
  assert.match(rendererSource, /gl_VertexID/);
  assert.match(rendererSource, /gl\.drawArrays\(gl\.POINTS/);
  assert.match(rendererSource, /24000\.0/);
  assert.match(rendererSource, /16000\.0/);
  assert.match(rendererSource, /37000\.0/);
  assert.match(fieldSource, /MAX_PRTCL_PIXEL_RATIO = 1\.25/);
  assert.doesNotMatch(fieldSource + rendererSource, /getContext\("2d"|@react-three|from "three"|prtcl\.es/);
  assert.doesNotMatch(packageSource, /@react-three|"three"/);
  assert.match(admissionSource, /2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060/);
});

test("renderer failure, context loss, frame accounting, and cleanup share the Flux lifecycle", () => {
  assert.match(fieldSource, /const fail = \(error\) => \{/);
  assert.match(fieldSource, /addEventListener\("webglcontextlost", onContextLost\)/);
  assert.match(fieldSource, /onFrame\(now, 1000 \/ 60, "WebGL2", width, height\)/);
  assert.match(fieldSource, /renderer\.dispose\(\)/);
  assert.match(rendererSource, /gl\.deleteVertexArray\(vertexArray\)/);
  assert.match(rendererSource, /gl\.deleteProgram\(program\)/);
});

test("PRTCL uses one small text-only TYPE cycle separate from the shared palette", () => {
  const start = appSource.indexOf("function PrtclCycleControl");
  const end = appSource.indexOf("/**", start);
  const controlSource = appSource.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(controlSource, /<span>TYPE<\/span>/);
  assert.match(controlSource, /nextPrtclTypeId\(current\.id\)/);
  assert.doesNotMatch(controlSource, /<select|aria-haspopup|Dialog|range|input/);
  assert.match(appSource, /<PaletteControl themeId=\{themeId\} onChange=\{setThemeId\}/);
  assert.match(stylesSource, /\.prtcl-cycle-rail \{[\s\S]*?grid-template-columns: 94px;/);
  assert.match(stylesSource, /\.visual-cycle-button[\s\S]*?min-height: 34px;/);
});

test("the reproducible QA harness can hold every PRTCL type, macro, palette, and signal", () => {
  assert.match(harnessSource, /prtcl: lazy/);
  assert.match(harnessSource, /type.*frequency.*murmuration.*axiom/);
  assert.match(harnessSource, /PRTCL_SETTINGS/);
  assert.match(harnessSource, /audioLevel: readNumber\("audio", 0\)/);
  assert.match(harnessSource, /effect: parameters\.get\("effect"\)/);
});
