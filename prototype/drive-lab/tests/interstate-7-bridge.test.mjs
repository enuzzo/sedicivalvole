import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  speedToInterstate7Targets,
  themeToInterstate7Palette,
} from "../src/interstate-7-bridge.js";
import { getFluxTheme } from "../src/flux-themes.js";

const UPSTREAM_FILES = new Map([
  ["index7.html", "6f6737865d80580ace61c7dea61c9b93c217724e7547ce1cf3c6dcd5adf6fb7b"],
  ["js/InfiniteLights.js", "683fc98dac19460d478307bebe92751858456a5414c4834ac8d9caf9741e015e"],
  ["js/Distortions.js", "ab84f9ba32bae503ad59dc5361ba244942a82ecc9842d54e74aa87f9c3d14390"],
  ["js/three.min.js", "5ae6b42ec42418311e2246e604d8e3f70713849879b820fa47cfb9610857bde4"],
  ["js/postprocessing.min.js", "e97d27621fd9f9ee1201039437deaf9743918f003b9efd935798ef76e120adfa"],
  ["css/base.css", "4d124d90b35ac97571d526061333a729f4ad111e8cebe7e9e4fe0c0956e8fd23"],
  ["README.md", "2fee7e688511081d324fc34f99b971a4e06bc0b2670063ab306819f14678d4a6"],
]);

test("maps road speed to the original Interstate 7 time and FOV controls", () => {
  assert.deepEqual(speedToInterstate7Targets(0), {
    normalizedSpeed: 0,
    speedUpTarget: -1,
    fovTarget: 90,
  });
  assert.deepEqual(speedToInterstate7Targets(65), {
    normalizedSpeed: 0.5,
    speedUpTarget: -0.5,
    fovTarget: 120,
  });
  assert.deepEqual(speedToInterstate7Targets(130), {
    normalizedSpeed: 1,
    speedUpTarget: 0,
    fovTarget: 150,
  });
  assert.deepEqual(speedToInterstate7Targets(260), speedToInterstate7Targets(130));
});

test("keeps the original Interstate 7 runtime byte-identical to upstream", async () => {
  for (const [relativePath, expectedHash] of UPSTREAM_FILES) {
    const source = await readFile(
      new URL(`../public/third-party/infinite-lights/${relativePath}`, import.meta.url),
    );
    const actualHash = createHash("sha256").update(source).digest("hex");
    assert.equal(actualHash, expectedHash, relativePath);
  }
});

test("maps every body-colour theme onto all original scene colour groups", () => {
  const palette = themeToInterstate7Palette(getFluxTheme("acid"));
  assert.equal(palette.leftCars.length, 3);
  assert.equal(palette.rightCars.length, 3);
  assert.equal(palette.sticks.length, 2);
  assert.deepEqual(palette.leftCars[0], [1, 0.055, 0.58]);
  assert.deepEqual(palette.rightCars[1], [0.33, 1, 0.16]);
  for (const colors of Object.values(palette)) {
    const entries = Array.isArray(colors[0]) ? colors : [colors];
    for (const color of entries) {
      assert.equal(color.length, 3);
      assert.ok(color.every((channel) => channel >= 0 && channel <= 1));
    }
  }
});
