import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getShaderGradientStudy,
  shaderGradientResponse,
  SHADERGRADIENT_STUDY_IDS,
} from "../src/environments/shadergradient/studies.js";
import {
  FLUX_VISUAL_CHOICES,
  SHADERGRADIENT_ENVIRONMENTS,
  SHADERGRADIENT_VISUAL_CHOICE,
} from "../src/flux-environments.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const fieldSource = await read("../src/environments/shadergradient/shadergradient-field.jsx");
const appSource = await read("../src/App.jsx");
const packageSource = JSON.parse(await read("../package.json"));

test("three owner-selected ShaderGradient studies power one Gradient 08 family", () => {
  assert.deepEqual(SHADERGRADIENT_STUDY_IDS, ["japanese-mist", "acid-orchard", "chromatic-silk"]);
  assert.equal(getShaderGradientStudy("japanese-mist").type, "waterPlane");
  assert.equal(getShaderGradientStudy("acid-orchard").type, "plane");
  assert.equal(getShaderGradientStudy("chromatic-silk").type, "sphere");
  assert.equal(getShaderGradientStudy("chromatic-silk").shader, "cosmic");
  assert.equal(getShaderGradientStudy("unknown").id, "japanese-mist");
  assert.equal(SHADERGRADIENT_VISUAL_CHOICE.number, "08");
  assert.equal(SHADERGRADIENT_VISUAL_CHOICE.kind, "family");
  assert.equal(FLUX_VISUAL_CHOICES.filter(({ kind }) => kind === "family").length, 1);
  assert.equal(SHADERGRADIENT_ENVIRONMENTS.length, 3);
  assert.deepEqual(new Set(SHADERGRADIENT_ENVIRONMENTS.map(({ number }) => number)), new Set(["08"]));
});

test("every study runs at half base speed at rest and retains its former 130 km/h endpoint", () => {
  for (const studyId of SHADERGRADIENT_STUDY_IDS) {
    const study = getShaderGradientStudy(studyId);
    const rest = shaderGradientResponse(study, { speedKmh: 0, audioLevel: 0, responseMode: "road" });
    const ceiling = shaderGradientResponse(study, { speedKmh: 130, audioLevel: 0, responseMode: "road" });
    const above = shaderGradientResponse(study, { speedKmh: 260, audioLevel: 0, responseMode: "road" });
    assert.ok(Math.abs(rest.uSpeed - study.uSpeed * 0.5) < 1e-12, studyId);
    assert.ok(Math.abs(ceiling.uSpeed - study.uSpeed * 2.8) < 1e-12, studyId);
    assert.deepEqual(above, ceiling, studyId);
  }
});

test("Play the Road admits bounded audio while Soundtrack remains speed-only", () => {
  const study = getShaderGradientStudy("japanese-mist");
  const roadQuiet = shaderGradientResponse(study, { speedKmh: 72, audioLevel: 0, responseMode: "road-audio" });
  const roadLoud = shaderGradientResponse(study, { speedKmh: 72, audioLevel: 1, responseMode: "road-audio" });
  const soundtrackQuiet = shaderGradientResponse(study, { speedKmh: 72, audioLevel: 0, responseMode: "road" });
  const soundtrackLoud = shaderGradientResponse(study, { speedKmh: 72, audioLevel: 1, responseMode: "road" });
  assert.ok(roadLoud.uSpeed > roadQuiet.uSpeed);
  assert.ok(roadLoud.uStrength > roadQuiet.uStrength);
  assert.deepEqual(soundtrackLoud, soundtrackQuiet);
});

test("reduced motion and vehicle macros remain bounded and recognizable", () => {
  const study = getShaderGradientStudy("acid-orchard");
  const plain = shaderGradientResponse(study, { speedKmh: 80, responseMode: "road" });
  const reduced = shaderGradientResponse(study, { speedKmh: 80, responseMode: "road", reducedMotion: true });
  const underwater = shaderGradientResponse(study, { speedKmh: 80, responseMode: "road", effect: "UNDERWATER" });
  const open = shaderGradientResponse(study, { speedKmh: 80, responseMode: "road", effect: "OPEN" });
  const bloom = shaderGradientResponse(study, { speedKmh: 80, responseMode: "road", effect: "BLOOM" });
  assert.equal(reduced.uSpeed, 0);
  assert.ok(underwater.uSpeed < plain.uSpeed * 0.5);
  assert.ok(open.uStrength > plain.uStrength);
  assert.ok(bloom.brightness > plain.brightness);
});

test("the public visual lazily loads the exact renderer and owns a Canvas2D fallback", () => {
  assert.match(fieldSource, /from "@shadergradient\/react"/);
  assert.match(fieldSource, /ShaderGradientCanvas/);
  assert.match(fieldSource, /ShaderGradientFallback/);
  assert.match(fieldSource, /getContext\("2d"/);
  assert.match(fieldSource, /pixelDensity=\{1\}/);
  assert.match(appSource, /lazy\(\(\) => import\("\.\/environments\/shadergradient\/shadergradient-field\.jsx"\)\)/);
  assert.match(appSource, /environment\.renderer === "shadergradient"/);
  assert.match(appSource, /studyId=\{environment\.studyId\}/);
  assert.equal(packageSource.dependencies["@shadergradient/react"], "2.4.20");
});
