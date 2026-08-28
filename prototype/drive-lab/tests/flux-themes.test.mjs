import assert from "node:assert/strict";
import test from "node:test";
import { getFluxTheme } from "../src/flux-themes.js";

test("NEON thumbnail describes magenta/lilac while ACID keeps magenta/green", () => {
  assert.equal(getFluxTheme("neon").swatch, "#ff2d95");
  assert.equal(getFluxTheme("neon").swatchSecondary, "#7a3d88");
  assert.equal(getFluxTheme("acid").swatch, "#ff2ca8");
  assert.equal(getFluxTheme("acid").swatchSecondary, "#72ff45");
});
