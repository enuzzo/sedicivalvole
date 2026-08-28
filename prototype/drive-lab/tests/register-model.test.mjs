import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  accelerationToMisregistration,
  physicalMisregistrationCssPx,
  registerBoundaryKey,
  speedToRegisterFamily,
} from "../src/environments/register/register-model.js";

test("Register recomposes only on complete eight-bar musical boundaries", () => {
  assert.equal(registerBoundaryKey({ scoreId: "fracture", step: 0 }), "fracture:0");
  assert.equal(registerBoundaryKey({ scoreId: "fracture", step: 127 }), "fracture:0");
  assert.equal(registerBoundaryKey({ scoreId: "fracture", step: 128 }), "fracture:1");
  assert.equal(registerBoundaryKey({ scoreId: "junction", boundaryRevision: 4 }), "junction:4");
});

test("Register offsets land on physical pixels at the Tesla DPR", () => {
  assert.equal(physicalMisregistrationCssPx(0, 1.53), 0);
  assert.ok(Math.abs(physicalMisregistrationCssPx(1, 1.53) * 1.53 - 2) < 1e-9);
  assert.ok(Math.abs(physicalMisregistrationCssPx(3, 1.53) * 1.53 - 6) < 1e-9);
});

test("road energy selects three bounded Register layout families", () => {
  assert.equal(speedToRegisterFamily(0), 0);
  assert.equal(speedToRegisterFamily(40), 1);
  assert.equal(speedToRegisterFamily(90), 2);
  assert.equal(speedToRegisterFamily(300), 2);
});

test("hard acceleration misregisters the plates while braking aligns them", () => {
  assert.equal(accelerationToMisregistration(0.8), 0);
  assert.equal(accelerationToMisregistration(1.5), 1);
  assert.equal(accelerationToMisregistration(3), 2);
  assert.equal(accelerationToMisregistration(6), 3);
  assert.equal(accelerationToMisregistration(6, "release"), 0);
});

test("Register updates one persistent page instead of flashing through a remount", async () => {
  const source = await readFile(
    new URL("../src/environments/register/register-field.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /<div className="register-page">/);
  assert.doesNotMatch(source, /className="register-page" key=/);
});
