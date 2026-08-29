import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DEFAULT_FLUX_ENVIRONMENT_ID,
  FLUX_ENVIRONMENTS,
  getFluxEnvironment,
  migrateLegacyEnvironmentPreference,
  nextFluxEnvironmentId,
} from "../src/flux-environments.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const qaSource = readFileSync(new URL("../qa/field-harness.jsx", import.meta.url), "utf8");
const packageSource = readFileSync(new URL("../package.json", import.meta.url), "utf8");
const apertureFieldSource = readFileSync(new URL("../src/flux-field.jsx", import.meta.url), "utf8");
const meridianFieldSource = readFileSync(
  new URL("../src/environments/meridian/meridian-field.jsx", import.meta.url),
  "utf8",
);
const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("exposes the authored environments in a stable order", () => {
  assert.deepEqual(
    FLUX_ENVIRONMENTS.map(({ id }) => id),
    ["aperture", "vertigo", "meridian", "atlas", "wake", "drivey"],
  );
  assert.equal(getFluxEnvironment("vertigo").label, "VERTIGO");
  assert.equal(getFluxEnvironment("meridian").label, "MERIDIAN");
  assert.equal(getFluxEnvironment("meridian").number, "03");
  assert.equal(getFluxEnvironment("atlas").label, "ATLAS");
  assert.equal(getFluxEnvironment("atlas").number, "04");
  assert.equal(getFluxEnvironment("wake").label, "WAKE");
  assert.equal(getFluxEnvironment("wake").number, "05");
  assert.equal(getFluxEnvironment("drivey").label, "DRIVEY");
  assert.equal(getFluxEnvironment("drivey").number, "06");
  assert.equal(getFluxEnvironment("plumb").id, "aperture");
  assert.equal(getFluxEnvironment("register").id, "aperture");
  assert.equal(getFluxEnvironment("latitudes").id, "aperture");
});

test("keeps Aperture as the accepted fresh and invalid-preference default", () => {
  assert.equal(FLUX_ENVIRONMENTS[0].id, "aperture");
  assert.equal(DEFAULT_FLUX_ENVIRONMENT_ID, "aperture");
  assert.equal(getFluxEnvironment("unknown").id, "aperture");
  assert.equal(getFluxEnvironment(undefined).id, "aperture");
  assert.match(appSource, /environmentId: DEFAULT_FLUX_ENVIRONMENT_ID/);
});

test("preserves implemented preferences and retires rejected identifiers to Aperture", () => {
  assert.equal(migrateLegacyEnvironmentPreference("aperture", true), "aperture");
  assert.equal(migrateLegacyEnvironmentPreference("meridian", true), "meridian");
  assert.equal(migrateLegacyEnvironmentPreference("aperture", false), "aperture");
  assert.equal(migrateLegacyEnvironmentPreference("plumb", false), "aperture");
  assert.equal(migrateLegacyEnvironmentPreference("unknown", false), "aperture");
});

test("keeps rejected visual renderers outside the active runtime and QA", () => {
  assert.doesNotMatch(appSource, /LatitudesField|RegisterField|PlumbField|renderer === "(?:latitudes|register|plumb)"/);
  assert.doesNotMatch(qaSource, /environments\/(?:latitudes|register|plumb)|latitudes:|register:|plumb:/);
  assert.doesNotMatch(packageSource, /tests\/(?:latitudes|register|plumb)-model\.test\.mjs/);
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
  assert.equal(getFluxEnvironment("wake").themed, true);
  assert.equal(getFluxEnvironment("drivey").themed, true);
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
  assert.equal(nextFluxEnvironmentId("unknown"), DEFAULT_FLUX_ENVIRONMENT_ID);
});

test("short landscape keeps the control slab on one low row without changing portrait mobile", () => {
  assert.match(
    stylesSource,
    /@media \(min-width: 500px\) and \(max-width: 650px\) and \(max-height: 480px\) and \(orientation: landscape\) \{[\s\S]*?\.control-slab \{[\s\S]*?min-height: 64px;[\s\S]*?grid-template-columns: 52px 22vw 25vw minmax\(0, 1fr\);[\s\S]*?grid-template-rows: auto;[\s\S]*?\.stop-button \{ grid-row: auto; \}[\s\S]*?\.palette-control \{ border-top: 0; \}[\s\S]*?\.atlas-panel \{ bottom: 73px; \}[\s\S]*?\}/,
  );
  assert.match(
    stylesSource,
    /@media \(max-width: 650px\) \{[\s\S]*?\.control-slab \{ min-height: 224px;[\s\S]*?grid-template-rows: 106px 118px; \}/,
  );
});

test("Aperture and Meridian stop failed animation loops and enter the shared fallback", () => {
  for (const [label, source] of [
    ["APERTURE", apertureFieldSource],
    ["MERIDIAN", meridianFieldSource],
  ]) {
    assert.match(source, /const fail = \(error\) => \{/i, `${label} has no fail-once path`);
    assert.match(source, /catch \(error\) \{\s*fail\(error\);/i, `${label} does not catch frame errors`);
    assert.match(source, /const onContextLost = \(event\) => \{[\s\S]*?fail\(new Error\(/i, `${label} ignores context loss`);
    assert.match(source, /addEventListener\("webglcontextlost", onContextLost\)/i);
    assert.match(source, /onRuntimeError\?\./, `${label} does not report the runtime failure`);
    const renderAt = source.indexOf("const render = (now) =>");
    const catchAt = source.indexOf("catch (error)", renderAt);
    const renderBody = source.slice(renderAt, catchAt);
    assert.ok(
      renderBody.lastIndexOf("requestAnimationFrame(render)")
        > renderBody.lastIndexOf("onFrame(now"),
      `${label} schedules another frame before the current frame succeeds`,
    );
  }
  assert.match(appSource, /<MeridianField[\s\S]*?onRuntimeError=\{handleEnvironmentError\}/);
  assert.match(appSource, /<FluxField[\s\S]*?onRuntimeError=\{handleEnvironmentError\}/);
  assert.match(appSource, /environmentRuntimeError \? \(\s*<FieldFailure/);
});
