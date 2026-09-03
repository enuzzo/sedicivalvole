import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEFAULT_PRTCL_SETTINGS,
  PRTCL_POINT_SCALE_CEILING_KMH,
  PRTCL_SOURCE_COMMIT,
  PRTCL_TYPES,
  advancePrtclMacroTransition,
  createPrtclMacroResponse,
  createPrtclMacroTransitionState,
  nextPrtclTypeId,
  normalizePrtclSettings,
  prtclMacroTargets,
  prtclMotionProfile,
} from "../src/environments/prtcl/prtcl-model.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const rendererSource = await read("../src/environments/prtcl/prtcl-renderer.js");
const fieldSource = await read("../src/environments/prtcl/prtcl-field.jsx");
const appSource = await read("../src/App.jsx");
const stylesSource = await read("../src/styles.css");
const harnessSource = await read("../qa/field-harness.jsx");
const packageSource = await read("../package.json");
const packageMetadata = JSON.parse(packageSource);
const admissionSource = await read("../../../docs/SOURCE-ADMISSION-2026-08-29.md");

test("PRTCL exposes Fractal and Axiom, retires Murmuration, and defaults to Fractal", () => {
  assert.deepEqual(Object.keys(PRTCL_TYPES), ["frequency", "axiom"]);
  assert.deepEqual(normalizePrtclSettings(null), DEFAULT_PRTCL_SETTINGS);
  assert.deepEqual(normalizePrtclSettings({ type: "axiom" }), { type: "axiom" });
  assert.deepEqual(normalizePrtclSettings({ type: "electromagnetic" }), { type: "frequency" });
  assert.equal(PRTCL_TYPES.frequency.particleCount, 24000);
  assert.equal(PRTCL_TYPES.axiom.particleCount, 37000);
  assert.deepEqual(normalizePrtclSettings({ type: "murmuration" }), { type: "frequency" });
});

test("the compact TYPE control cycles directly and returns to Fractal", () => {
  assert.equal(nextPrtclTypeId("frequency"), "axiom");
  assert.equal(nextPrtclTypeId("murmuration"), "frequency");
  assert.equal(nextPrtclTypeId("axiom"), "frequency");
  assert.equal(nextPrtclTypeId("unknown"), "frequency");
});

test("road speed owns point scale, depth, and travel while music owns colour and pulse", () => {
  const rest = prtclMotionProfile({ speedKmh: 0, audioLevel: 0 });
  const road = prtclMotionProfile({ speedKmh: 110, audioLevel: 0 });
  const music = prtclMotionProfile({ speedKmh: 0, audioLevel: 0.8 });
  assert.ok(road.pointScale > rest.pointScale);
  assert.ok(road.formScale > rest.formScale);
  assert.ok(road.depthScale > rest.depthScale);
  assert.ok(road.travelRate > rest.travelRate);
  assert.equal(road.colourEnergy, rest.colourEnergy);
  assert.equal(road.pulse, rest.pulse);
  assert.equal(music.pointScale, rest.pointScale);
  assert.equal(music.formScale, rest.formScale);
  assert.equal(music.depthScale, rest.depthScale);
  assert.equal(music.travelRate, rest.travelRate);
  assert.ok(music.colourEnergy > rest.colourEnergy);
  assert.ok(music.pulse > rest.pulse);
});

test("point and complete-form scale grow smoothly to 100 km/h and then hold", () => {
  assert.equal(PRTCL_POINT_SCALE_CEILING_KMH, 100);
  const speeds = Array.from({ length: 131 }, (_, speedKmh) => speedKmh);
  const forward = speeds.map((speedKmh) => prtclMotionProfile({ speedKmh }).pointScale);
  const form = speeds.map((speedKmh) => prtclMotionProfile({ speedKmh }).formScale);
  const reverse = [...speeds]
    .reverse()
    .map((speedKmh) => prtclMotionProfile({ speedKmh }).pointScale)
    .reverse();
  assert.deepEqual(reverse, forward);
  for (let index = 1; index <= PRTCL_POINT_SCALE_CEILING_KMH; index += 1) {
    assert.ok(forward[index] > forward[index - 1]);
    assert.ok(forward[index] - forward[index - 1] < 0.01);
    assert.ok(form[index] > form[index - 1]);
    assert.ok(form[index] - form[index - 1] < 0.01);
  }
  for (let index = PRTCL_POINT_SCALE_CEILING_KMH + 1; index < forward.length; index += 1) {
    assert.equal(forward[index], forward[PRTCL_POINT_SCALE_CEILING_KMH]);
    assert.equal(form[index], form[PRTCL_POINT_SCALE_CEILING_KMH]);
  }
  const at100 = prtclMotionProfile({ speedKmh: 100 });
  const at130 = prtclMotionProfile({ speedKmh: 130 });
  const aboveRoadLimit = prtclMotionProfile({ speedKmh: 260 });
  assert.equal(at100.pointScale, at130.pointScale);
  assert.equal(at100.formScale, at130.formScale);
  assert.equal(at130.pointScale, aboveRoadLimit.pointScale);
  assert.ok(at130.depthScale > at100.depthScale);
  assert.ok(at130.travelRate > at100.travelRate);
});

test("macro targets morph continuously and remain frame-rate invariant", () => {
  const response = createPrtclMacroResponse({ attackSeconds: 0.12, releaseSeconds: 0.28 });
  const run = (fps, targets, durationMs, initial = createPrtclMacroTransitionState()) => {
    let state = initial;
    const frameMs = 1000 / fps;
    for (let at = frameMs; at < durationMs; at += frameMs) {
      state = advancePrtclMacroTransition(state, targets, at, response);
    }
    return advancePrtclMacroTransition(state, targets, durationMs, response);
  };
  const underwaterTargets = prtclMacroTargets({ effect: "UNDERWATER" });
  const firstFrame = advancePrtclMacroTransition(
    createPrtclMacroTransitionState(),
    underwaterTargets,
    1000 / 60,
    response,
  );
  assert.ok(firstFrame.value[0] > 0 && firstFrame.value[0] < 1, "UNDERWATER snapped instead of morphing");
  const underwater60 = run(60, underwaterTargets, 600);
  const underwater30 = run(30, underwaterTargets, 600);
  const underwater120 = run(120, underwaterTargets, 600);
  assert.ok(Math.abs(underwater60.value[0] - underwater30.value[0]) < 1e-9);
  assert.ok(Math.abs(underwater60.value[0] - underwater120.value[0]) < 1e-9);

  const released = advancePrtclMacroTransition(underwater60, prtclMacroTargets(), 616, response);
  assert.ok(released.value[0] > 0 && released.value[0] < underwater60.value[0]);
});

test("only UNDERWATER and reduced motion change bounded native responses", () => {
  const normal = prtclMotionProfile({ speedKmh: 70, audioLevel: 0.5 });
  const open = prtclMotionProfile({ speedKmh: 70, audioLevel: 0.5, effect: "OPEN" });
  const underwater = prtclMotionProfile({ speedKmh: 70, audioLevel: 0.5, effect: "UNDERWATER" });
  const bloom = prtclMotionProfile({ speedKmh: 70, audioLevel: 0.5, effect: "BLOOM" });
  const reduced = prtclMotionProfile({ speedKmh: 130, audioLevel: 1, effect: "UNDERWATER", reducedMotion: true });
  assert.deepEqual(open, normal);
  assert.ok(underwater.travelRate < normal.travelRate);
  assert.ok(underwater.brightness < normal.brightness);
  assert.ok(underwater.pointScale < normal.pointScale * 0.28);
  assert.ok(underwater.formScale < normal.formScale * 0.23);
  assert.ok(underwater.depthScale < normal.depthScale * 0.4);
  assert.ok(underwater.spreadScale < normal.spreadScale * 0.35);
  assert.deepEqual(bloom, normal);
  assert.equal(reduced.travelRate, 0);
  assert.equal(reduced.colourEnergy, 0);
  assert.equal(reduced.pulse, 0);
  for (const profile of [normal, open, underwater, bloom, reduced]) {
    assert.ok(profile.pointScale >= 0.18 && profile.pointScale <= 1.48);
    assert.ok(profile.depthScale >= 0.32 && profile.depthScale <= 1.32);
  }
});

test("UNDERWATER keeps the Fractal minimum 25% larger and returns exactly to its speed-owned scale", () => {
  for (const speedKmh of [0, 40, 100, 130]) {
    const natural = prtclMotionProfile({ speedKmh, audioLevel: 0.5 });
    const submerged = prtclMotionProfile({ speedKmh, audioLevel: 0.5, effect: "UNDERWATER" });
    const surfaced = prtclMotionProfile({ speedKmh, audioLevel: 0.5, macroAmounts: [0] });
    assert.ok(Math.abs(submerged.pointScale / natural.pointScale - 0.275) < 1e-12);
    assert.ok(Math.abs(submerged.formScale / natural.formScale - 0.225) < 1e-12);
    assert.ok(Math.abs(0.275 / 0.22 - 1.25) < 1e-12);
    assert.ok(Math.abs(0.225 / 0.18 - 1.25) < 1e-12);
    assert.equal(surfaced.pointScale, natural.pointScale);
    assert.equal(surfaced.formScale, natural.formScale);
  }
});

test("the source-faithful renderer is bounded WebGL2 with no imported PRTCL runtime", () => {
  assert.equal(PRTCL_SOURCE_COMMIT, "2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060");
  assert.match(rendererSource, /getContext\("webgl2"/);
  assert.match(rendererSource, /gl_VertexID/);
  assert.match(rendererSource, /gl\.drawArrays\(gl\.POINTS/);
  assert.match(rendererSource, /24000\.0/);
  assert.doesNotMatch(rendererSource, /murmuration|16000\.0/);
  assert.match(rendererSource, /37000\.0/);
  assert.match(fieldSource, /MAX_PRTCL_PIXEL_RATIO = 1\.25/);
  assert.doesNotMatch(fieldSource + rendererSource, /getContext\("2d"|@react-three|from "three"|prtcl\.es/);
  assert.equal(packageMetadata.dependencies?.["@react-three/fiber"], "9.7.0");
  assert.equal(packageMetadata.dependencies?.three, "0.169.0");
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

test("PRTCL keeps one WebGL renderer alive while React callbacks and settings change", () => {
  assert.match(fieldSource, /const callbacksRef = useRef\(\{ onRenderer, onFrame, onRuntimeError \}\)/);
  assert.match(fieldSource, /callbacksRef\.current = \{ onRenderer, onFrame, onRuntimeError \}/);
  assert.match(fieldSource, /\}, \[\]\);/);
  assert.match(fieldSource, /\}, \[type\]\);/);
  assert.doesNotMatch(fieldSource, /\}, \[onFrame, onRenderer, onRuntimeError\]\);/);
});

test("LAB calibration stays optional and bounded inside the project renderer", () => {
  assert.match(fieldSource, /calibration = null/);
  assert.match(rendererSource, /const multiplier = \(name, fallback = 1, minimum = 0, maximum = 3\)/);
  assert.match(rendererSource, /profile\.travelRate \* flowScale/);
  assert.match(rendererSource, /profile\.pointScale \* multiplier\("pointScale"\)/);
  assert.match(rendererSource, /profile\.formScale \* multiplier\("formScale"\)/);
  assert.match(rendererSource, /position \*= u_formScale/);
  assert.match(rendererSource, /advancePrtclMacroTransition/);
  assert.match(rendererSource, /particleCount \* densityScale/);
});

test("the product feeds authored audio macros into the shared PRTCL field", () => {
  assert.match(fieldSource, /macroSnapshot = null/);
  assert.match(appSource, /<PrtclField[\s\S]*?macroSnapshot=\{audioMacros\}/);
});

test("PRTCL uses one small text-only TYPE cycle separate from the shared palette", () => {
  const start = appSource.indexOf("function PrtclCycleControl");
  const end = appSource.indexOf("function ScoreLibraryContent", start);
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
  assert.match(harnessSource, /type.*frequency.*axiom/);
  assert.doesNotMatch(harnessSource, /murmuration/);
  assert.match(harnessSource, /PRTCL_SETTINGS/);
  assert.match(harnessSource, /audioLevel: readNumber\("audio", 0\)/);
  assert.match(harnessSource, /const QA_EFFECT = parameters\.get\("effect"\)/);
  assert.match(harnessSource, /effect: QA_EFFECT/);
});
