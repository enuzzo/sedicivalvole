import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FLUX_ENVIRONMENTS,
  getFluxEnvironment,
  nextFluxEnvironmentId,
} from "../src/flux-environments.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const qaSource = readFileSync(new URL("../qa/field-harness.jsx", import.meta.url), "utf8");
const packageSource = readFileSync(new URL("../package.json", import.meta.url), "utf8");

test("exposes the authored environments in a stable order", () => {
  assert.deepEqual(
    FLUX_ENVIRONMENTS.map(({ id }) => id),
    ["aperture", "vertigo", "meridian", "atlas"],
  );
  assert.equal(getFluxEnvironment("vertigo").label, "VERTIGO");
  assert.equal(getFluxEnvironment("meridian").label, "MERIDIAN");
  assert.equal(getFluxEnvironment("meridian").number, "03");
  assert.equal(getFluxEnvironment("atlas").label, "ATLAS");
  assert.equal(getFluxEnvironment("atlas").number, "04");
  assert.equal(getFluxEnvironment("register").id, "aperture");
  assert.equal(getFluxEnvironment("latitudes").id, "aperture");
});

test("keeps Aperture as the default and the unknown-identifier fallback", () => {
  assert.equal(FLUX_ENVIRONMENTS[0].id, "aperture");
  assert.equal(getFluxEnvironment("unknown").id, "aperture");
  assert.equal(getFluxEnvironment(undefined).id, "aperture");
});

test("keeps rejected visual renderers outside the active runtime and QA", () => {
  assert.doesNotMatch(appSource, /LatitudesField|RegisterField|renderer === "latitudes"|renderer === "register"/);
  assert.doesNotMatch(qaSource, /environments\/(?:latitudes|register)|latitudes:|register:/);
  assert.doesNotMatch(packageSource, /tests\/(?:latitudes|register)-model\.test\.mjs/);
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

test("connects every implemented environment to body-colour theming", () => {
  assert.equal(getFluxEnvironment("vertigo").themed, true);
  assert.equal(getFluxEnvironment("aperture").themed, true);
  assert.equal(getFluxEnvironment("meridian").themed, true);
  assert.equal(getFluxEnvironment("atlas").themed, true);
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
