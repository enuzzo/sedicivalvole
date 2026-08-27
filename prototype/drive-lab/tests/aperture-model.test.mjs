import test from "node:test";
import assert from "node:assert/strict";
import { apertureWall, apertureReadout, APERTURE_TUNING } from "../src/aperture-model.js";

test("Aperture wall at standstill (0 km/h) covers the full screen plane", () => {
  const wall = apertureWall(0);
  assert.equal(wall.proximity, 1);
  assert.equal(wall.z, 1.0);
  assert.equal(wall.size, 1.0);
  assert.equal(wall.luminance, 1.0);
});

test("Aperture wall at 55 km/h reaches the far terminus matching benchmark geometry", () => {
  const wall = apertureWall(55);
  assert.equal(wall.proximity, 0);
  assert.equal(wall.z, 8.0);
  assert.equal(wall.size, 0.125);
});

test("Aperture wall recedes monotonically between 0 and 55 km/h", () => {
  let prevZ = 0;
  for (let speed = 0; speed <= 55; speed += 1) {
    const wall = apertureWall(speed);
    assert.ok(wall.z >= prevZ, `Wall Z should be non-decreasing at speed ${speed}`);
    assert.ok(wall.z >= 1.0 && wall.z <= 8.0);
    prevZ = wall.z;
  }
});

test("Aperture readout reports 7 depth levels and 7 tiles per wall", () => {
  const readout55 = apertureReadout(55);
  assert.equal(readout55.depthLevels, 7);
  assert.equal(readout55.tilesPerWall, 7);
  assert.equal(readout55.wallProximity, 0);
  assert.equal(readout55.terminalVelocity, 0);
});

test("Aperture enters terminal velocity above 120 km/h", () => {
  const readout100 = apertureReadout(100);
  assert.equal(readout100.terminalVelocity, 0);

  const readout125 = apertureReadout(125);
  assert.ok(readout125.terminalVelocity > 0.5, "Terminal velocity should be active above 120 km/h");

  const readout130 = apertureReadout(130);
  assert.equal(readout130.terminalVelocity, 1.0);
});
