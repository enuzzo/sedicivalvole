import assert from "node:assert/strict";
import test from "node:test";
import {
  FLUX_ENVIRONMENTS,
  getFluxEnvironment,
  nextFluxEnvironmentId,
} from "../src/flux-environments.js";

test("exposes the authored environments in a stable order", () => {
  assert.deepEqual(
    FLUX_ENVIRONMENTS.map(({ id }) => id),
    ["aperture", "vertigo", "meridian", "latitudes"],
  );
  assert.equal(getFluxEnvironment("vertigo").label, "VERTIGO");
  assert.equal(getFluxEnvironment("meridian").label, "MERIDIAN");
  assert.equal(getFluxEnvironment("meridian").number, "03");
  assert.equal(getFluxEnvironment("latitudes").label, "LATITUDES");
  assert.equal(getFluxEnvironment("latitudes").number, "04");
});

test("keeps Aperture as the default and the unknown-identifier fallback", () => {
  assert.equal(FLUX_ENVIRONMENTS[0].id, "aperture");
  assert.equal(getFluxEnvironment("unknown").id, "aperture");
  assert.equal(getFluxEnvironment(undefined).id, "aperture");
});

test("gives every environment a unique identifier, number, and renderer", () => {
  const ids = new Set();
  const numbers = new Set();
  const renderers = new Set();
  for (const environment of FLUX_ENVIRONMENTS) {
    assert.ok(environment.label && environment.rendererLabel, environment.id);
    assert.equal(typeof environment.themed, "boolean", environment.id);
    ids.add(environment.id);
    numbers.add(environment.number);
    renderers.add(environment.renderer);
  }
  assert.equal(ids.size, FLUX_ENVIRONMENTS.length);
  assert.equal(numbers.size, FLUX_ENVIRONMENTS.length);
  assert.equal(renderers.size, FLUX_ENVIRONMENTS.length);
});

test("keeps the upstream Interstate 7 scene outside body-colour theming", () => {
  assert.equal(getFluxEnvironment("vertigo").themed, false);
  assert.equal(getFluxEnvironment("aperture").themed, true);
  assert.equal(getFluxEnvironment("meridian").themed, true);
  assert.equal(getFluxEnvironment("latitudes").themed, true);
});

test("cycles every environment deterministically and returns to the start", () => {
  let id = FLUX_ENVIRONMENTS[0].id;
  const visited = [id];
  for (let step = 1; step < FLUX_ENVIRONMENTS.length; step += 1) {
    id = nextFluxEnvironmentId(id);
    visited.push(id);
  }
  assert.deepEqual(visited, FLUX_ENVIRONMENTS.map((environment) => environment.id));
  assert.equal(nextFluxEnvironmentId(id), FLUX_ENVIRONMENTS[0].id);
  assert.equal(nextFluxEnvironmentId("unknown"), FLUX_ENVIRONMENTS[0].id);
});
