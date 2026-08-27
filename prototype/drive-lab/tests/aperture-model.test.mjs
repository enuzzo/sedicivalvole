import test from "node:test";
import assert from "node:assert/strict";
import {
  APERTURE_TUNING,
  apertureReadout,
  apertureShaderControls,
  apertureSmoothing,
  apertureWall,
} from "../src/aperture-model.js";

test("Aperture wall at standstill (0 km/h) covers the full screen plane", () => {
  const wall = apertureWall(0);
  assert.equal(wall.proximity, 1);
  assert.equal(wall.z, 1.0);
  assert.equal(wall.size, 1.0);
  assert.equal(wall.luminance, 1.0);
});

test("Aperture wall at 35 km/h reaches the far terminus matching benchmark geometry", () => {
  const wall = apertureWall(35);
  assert.equal(wall.proximity, 0);
  assert.equal(wall.z, 8.0);
  assert.equal(wall.size, 0.125);
});

test("Aperture wall recedes monotonically between 0 and 35 km/h", () => {
  let prevZ = 0;
  for (let speed = 0; speed <= 35; speed += 1) {
    const wall = apertureWall(speed);
    assert.ok(wall.z >= prevZ, `Wall Z should be non-decreasing at speed ${speed}`);
    assert.ok(wall.z >= 1.0 && wall.z <= 8.0);
    prevZ = wall.z;
  }
});

test("Aperture readout reports 7 depth levels and 7 tiles per wall", () => {
  const readout35 = apertureReadout(35);
  assert.equal(readout35.depthLevels, 7);
  assert.equal(readout35.tilesPerWall, 7);
  assert.equal(readout35.wallProximity, 0);
  assert.equal(readout35.terminalVelocity, 0);
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

test("shader controls preserve every existing speed threshold", () => {
  assert.deepEqual(apertureShaderControls(0), {
    warp: 0,
    terminalVelocity: 0,
    speedPulseMask: 0,
    voidActive: 0,
  });
  assert.equal(apertureShaderControls(35).warp, 1);
  assert.equal(apertureShaderControls(130).terminalVelocity, 1);
  assert.equal(apertureShaderControls(15).speedPulseMask, 1);
  assert.equal(apertureShaderControls(35).voidActive, 1);
});
