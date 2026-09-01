import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  APERTURE_TUNING,
  apertureReadout,
  aperturePixelRatio,
  apertureShaderControls,
  apertureSmoothing,
  apertureWall,
} from "../src/aperture-model.js";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const fieldSource = readFileSync(resolve(TEST_DIR, "../src/flux-field.jsx"), "utf8");

test("Aperture wall at standstill (0 km/h) covers the full screen plane", () => {
  const wall = apertureWall(0);
  assert.equal(wall.proximity, 1);
  assert.equal(wall.z, 1.0);
  assert.equal(wall.size, 1.0);
  assert.equal(wall.luminance, 1.0);
});

test("Aperture removes supersampling throughout the wall-retreat pressure band", () => {
  assert.equal(aperturePixelRatio(1.53, 0), 1);
  assert.equal(aperturePixelRatio(1.53, 17.9), 1);
  assert.equal(aperturePixelRatio(1.53, 18), 1);
  assert.equal(aperturePixelRatio(1.53, 30), 1);
  assert.equal(aperturePixelRatio(1.53, 40), 1);
  assert.equal(aperturePixelRatio(1.53, 40.1), 1.25);
  assert.equal(aperturePixelRatio(1, 30), 1);
  assert.ok((1 ** 2) / (1.25 ** 2) <= 0.64, "morph fragment work should fall by at least 36%");
});

test("Aperture wall at 40 km/h reaches the far terminus and disappears", () => {
  const wall = apertureWall(40);
  assert.equal(wall.proximity, 0);
  assert.equal(wall.z, 8.0);
  assert.equal(wall.size, 0.125);
});

test("Aperture wall recedes monotonically between 0 and 40 km/h", () => {
  let prevZ = 0;
  for (let speed = 0; speed <= 40; speed += 1) {
    const wall = apertureWall(speed);
    assert.ok(wall.z >= prevZ, `Wall Z should be non-decreasing at speed ${speed}`);
    assert.ok(wall.z >= 1.0 && wall.z <= 8.0);
    prevZ = wall.z;
  }
});

test("Aperture readout reports 7 depth levels and 7 tiles per wall", () => {
  const readout40 = apertureReadout(40);
  assert.equal(readout40.depthLevels, 7);
  assert.equal(readout40.tilesPerWall, 7);
  assert.equal(readout40.wallProximity, 0);
  assert.equal(readout40.terminalVelocity, 0);
});

test("Aperture enters terminal velocity above 120 km/h", () => {
  const readout100 = apertureReadout(100);
  assert.equal(readout100.terminalVelocity, 0);

  const readout125 = apertureReadout(125);
  assert.ok(readout125.terminalVelocity > 0.5, "Terminal velocity should be active above 120 km/h");

  const readout130 = apertureReadout(130);
  assert.equal(readout130.terminalVelocity, 1.0);
});

test("time-based easing preserves the approved 30 FPS motion at 60 FPS", () => {
  for (const coefficient of [0.065, 0.12, 0.14]) {
    const halfFrame = apertureSmoothing(coefficient, 1 / 60);
    const twoHalfFrames = 1 - ((1 - halfFrame) ** 2);
    assert.ok(Math.abs(twoHalfFrames - coefficient) < 1e-12, coefficient);
    assert.ok(Math.abs(apertureSmoothing(coefficient, 1 / 30) - coefficient) < 1e-12);
  }
});

test("Aperture smooths the low-speed wall and avoids a per-frame layout read", () => {
  assert.match(fieldSource, /let visualWallSpeed =/);
  assert.match(fieldSource, /nextWallSpeed >= visualWallSpeed \? 0\.22 : 0\.16/);
  assert.match(fieldSource, /aperturePixelRatio\(window\.devicePixelRatio, visualWallSpeed\)/);
  assert.match(fieldSource, /apertureShaderControls\(\s*visualWallSpeed/);
  assert.match(fieldSource, /new ResizeObserver\(updateCanvasSize\)/);
  const renderLoop = fieldSource.slice(fieldSource.indexOf("const render = (now) =>", fieldSource.indexOf("WebGL2 · Aperture")));
  assert.doesNotMatch(renderLoop, /canvas\.clientWidth \* ratio|canvas\.clientHeight \* ratio/);
});

test("shader controls preserve every existing speed threshold", () => {
  assert.deepEqual(apertureShaderControls(0), {
    wallSize: 1,
    wallOpacity: 1,
    terminalVelocity: 0,
    speedPulseMask: 0,
    voidActive: 0,
  });
  assert.equal(apertureShaderControls(40).wallSize, 0.125);
  assert.equal(apertureShaderControls(40).wallOpacity, 0);
  assert.equal(apertureShaderControls(130).terminalVelocity, 1);
  assert.equal(apertureShaderControls(15).speedPulseMask, 1);
  assert.equal(apertureShaderControls(35).voidActive, 1);
});
