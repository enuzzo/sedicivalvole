import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  advanceGradientResponse,
  gradientMotionProfile,
} from "../src/environments/gradient/gradient-model.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const rendererSource = await read("../src/environments/gradient/gradient-renderer.js");
const fieldSource = await read("../src/environments/gradient/gradient-field.jsx");
const appSource = await read("../src/App.jsx");

test("speed continuously opens Tension Plane into Chromatic Fold and saturates at 130 km/h", () => {
  const rest = gradientMotionProfile({ speedKmh: 0 });
  const city = gradientMotionProfile({ speedKmh: 50 });
  const ceiling = gradientMotionProfile({ speedKmh: 130 });
  const above = gradientMotionProfile({ speedKmh: 260 });
  assert.equal(rest.foldMorph, 0);
  assert.ok(city.foldMorph > rest.foldMorph && city.foldMorph < ceiling.foldMorph);
  assert.equal(ceiling.foldMorph, 1);
  assert.deepEqual(above, ceiling);
  assert.ok(ceiling.foldDepth > rest.foldDepth * 5);
  assert.ok(ceiling.seamFocus > rest.seamFocus * 3);
});

test("Play the Road admits score energy while Soundtrack stays speed-only", () => {
  const roadQuiet = gradientMotionProfile({ speedKmh: 72, audioLevel: 0, musicMode: "play-road" });
  const roadLoud = gradientMotionProfile({ speedKmh: 72, audioLevel: 1, musicMode: "play-road" });
  const soundtrackQuiet = gradientMotionProfile({ speedKmh: 72, audioLevel: 0, musicMode: "soundtrack" });
  const soundtrackLoud = gradientMotionProfile({ speedKmh: 72, audioLevel: 1, musicMode: "soundtrack" });
  assert.ok(roadLoud.displacement > roadQuiet.displacement);
  assert.ok(roadLoud.flowRate > roadQuiet.flowRate);
  assert.equal(soundtrackLoud.audioEnergy, 0);
  assert.deepEqual(soundtrackLoud, soundtrackQuiet);
});

test("grain is one-pass, bounded, and reduced motion stops phase travel", () => {
  const rest = gradientMotionProfile({ speedKmh: 0 });
  const ceiling = gradientMotionProfile({ speedKmh: 130 });
  const reduced = gradientMotionProfile({ speedKmh: 130, audioLevel: 1, reducedMotion: true });
  assert.ok(rest.grain >= 0.03 && ceiling.grain <= 0.06);
  assert.equal(reduced.flowRate, 0);
  assert.equal(reduced.audioEnergy, 0);
  assert.match(rendererSource, /float grain = hash\(gl_FragCoord\.xy/);
  assert.equal((rendererSource.match(/gl\.drawElements\(/g) ?? []).length, 1);
});

test("response interpolation is continuous and frame-rate independent enough for the visual envelope", () => {
  const target = gradientMotionProfile({ speedKmh: 130, audioLevel: 1 });
  const start = gradientMotionProfile({ speedKmh: 0, audioLevel: 0 });
  const first = advanceGradientResponse(start, target, 1 / 60);
  assert.ok(first.foldMorph > 0 && first.foldMorph < 1);
  const run = (fps) => {
    let value = start;
    for (let frame = 0; frame < fps; frame += 1) value = advanceGradientResponse(value, target, 1 / fps);
    return value;
  };
  assert.ok(Math.abs(run(30).foldMorph - run(60).foldMorph) < 1e-9);
  assert.ok(Math.abs(run(60).foldMorph - run(120).foldMorph) < 1e-9);
});

test("the selected visual is an owned bounded WebGL2 field with lifecycle failure handling", () => {
  assert.match(rendererSource, /getContext\("webgl2"/);
  assert.match(rendererSource, /coherentNoise/);
  assert.match(rendererSource, /createGrid\(columns = GRID_COLUMNS, rows = GRID_ROWS\)/);
  assert.doesNotMatch(rendererSource + fieldSource, /from "three"|@react-three|@shadergradient/);
  assert.match(fieldSource, /MAX_GRADIENT_PIXEL_RATIO = 1/);
  assert.match(fieldSource, /webglcontextlost/);
  assert.match(fieldSource, /renderer\.dispose\(\)/);
  assert.match(appSource, /environment\.renderer === "gradient"/);
  assert.match(appSource, /<GradientField[\s\S]*?musicMode=\{musicMode\}/);
});
