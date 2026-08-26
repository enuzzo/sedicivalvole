import assert from "node:assert/strict";
import test from "node:test";
import {
  FLUX_ENVIRONMENTS,
  getFluxEnvironment,
  nextFluxEnvironmentId,
} from "../src/flux-environments.js";

test("exposes Aperture and Vertigo as stable authored environments", () => {
  assert.deepEqual(FLUX_ENVIRONMENTS.map(({ id }) => id), ["aperture", "vertigo"]);
  assert.equal(getFluxEnvironment("vertigo").label, "VERTIGO");
  assert.equal(getFluxEnvironment("unknown").id, "aperture");
});

test("cycles environments deterministically", () => {
  assert.equal(nextFluxEnvironmentId("aperture"), "vertigo");
  assert.equal(nextFluxEnvironmentId("vertigo"), "aperture");
  assert.equal(nextFluxEnvironmentId("unknown"), "aperture");
});
