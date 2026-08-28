import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  advanceAtlasDemoPosition,
  createAtlasStyle,
  normalizeNearbyPages,
  resolveAtlasHeading,
  speedToAtlasCamera,
  validAtlasPosition,
  wikipediaNearbyUrl,
} from "../src/environments/atlas/atlas-model.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const atlasSource = readFileSync(new URL("../src/environments/atlas/atlas-field.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("Atlas accepts only bounded finite coordinates kept outside diagnostics", () => {
  assert.equal(validAtlasPosition({ latitude: 45.46, longitude: 9.19 }), true);
  assert.equal(validAtlasPosition({ latitude: 95, longitude: 9.19 }), false);
  assert.equal(validAtlasPosition({ latitude: 45.46, longitude: Number.NaN }), false);
});

test("Atlas camera widens with speed while retaining a strongly dimensional city", () => {
  const rest = speedToAtlasCamera(0);
  const urban = speedToAtlasCamera(40);
  const road = speedToAtlasCamera(130);
  assert.ok(road.zoom < rest.zoom);
  assert.ok(road.pitch < rest.pitch, "the faster camera should rise toward bird's-eye");
  assert.ok(urban.zoom > road.zoom);
  assert.ok(road.zoom >= 14.6, "motorway view must keep extruded buildings materially visible");
  assert.ok(road.pitch >= 55, "motorway view must retain an oblique 3D perspective");
  assert.ok(road.durationMs < rest.durationMs);
  assert.ok(road.buildingScale > rest.buildingScale);
});

test("Atlas follows reported heading or infers it from successive trusted positions", () => {
  const milan = { latitude: 45.4642, longitude: 9.19, heading: 18 };
  assert.equal(resolveAtlasHeading(milan, milan, 271), 271);
  assert.equal(resolveAtlasHeading(milan, { latitude: milan.latitude, longitude: milan.longitude + 0.001 }, null), 90);
  assert.equal(resolveAtlasHeading(milan, { latitude: milan.latitude + 0.001, longitude: milan.longitude }, null), 0);
  assert.equal(resolveAtlasHeading(milan, { ...milan, longitude: milan.longitude + 0.000001 }, null), 18);
  assert.match(appSource, /heading: resolveAtlasHeading\(current, nextMapPosition, position\.coords\.heading\)/);
  assert.match(atlasSource, /bearing: Number\.isFinite\(point\.heading\) \? point\.heading : map\.getBearing\(\)/);
});

test("Atlas passenger reading and QR remain legible at the Tesla viewport", () => {
  assert.match(styles, /\.atlas-field \{[\s\S]*?--atlas-panel-width: 246px;/);
  assert.match(styles, /\.atlas-panel \{[\s\S]*?width: var\(--atlas-panel-width\);[\s\S]*?padding: 16px 16px 12px;/);
  assert.match(styles, /\.atlas-panel header p \{[\s\S]*?font-size: 12px;[\s\S]*?-webkit-line-clamp: 3;/);
  assert.match(styles, /\.atlas-places button strong \{[^}]*font-size: 12px;/);
  assert.match(styles, /\.atlas-qr img \{ width: 86px; height: 86px;/);
  assert.match(atlasSource, /width: 192,/);
});

test("Atlas passenger reading collapses behind a persistent midpoint handle", () => {
  assert.match(atlasSource, /const \[panelCollapsed, setPanelCollapsed\] = useState\(false\)/);
  assert.match(atlasSource, /aria-controls="atlas-passenger-panel"/);
  assert.match(atlasSource, /aria-expanded=\{!panelCollapsed\}/);
  assert.match(atlasSource, /aria-hidden=\{collapsed\}/);
  assert.match(atlasSource, /inert=\{collapsed \? true : undefined\}/);
  assert.match(atlasSource, /setPanelCollapsed\(\(current\) => !current\)/);
  assert.match(styles, /\.atlas-panel-toggle \{[\s\S]*?top: 50%;[\s\S]*?right: var\(--atlas-panel-width\);/);
  assert.match(styles, /\.atlas-field\.is-panel-collapsed \.atlas-panel-toggle \{ right: 0; \}/);
  assert.match(styles, /\.atlas-field\.is-panel-collapsed \.atlas-map \{ right: 0; \}/);
});

test("Atlas Milan demo travels by speed and heading without accepting malformed coordinates", () => {
  const milan = { latitude: 45.4642, longitude: 9.19, heading: 0 };
  const north = advanceAtlasDemoPosition(milan, 60, 0, 1);
  assert.ok(north.latitude > milan.latitude);
  assert.ok(Math.abs(north.longitude - milan.longitude) < 1e-9);
  const east = advanceAtlasDemoPosition(milan, 60, 90, 1);
  assert.ok(east.longitude > milan.longitude);
  assert.equal(advanceAtlasDemoPosition(null, 60, 0, 1), null);
  assert.deepEqual(advanceAtlasDemoPosition(milan, 0, 0, 1), milan);
});

test("Atlas nearby query is explicit and normalizes passenger content", () => {
  const url = wikipediaNearbyUrl({ latitude: 45.46, longitude: 9.19 });
  assert.match(url, /^https:\/\/it\.wikipedia\.org\/w\/api\.php\?/);
  assert.match(url, /generator=geosearch/);
  assert.equal(wikipediaNearbyUrl(null), null);
  assert.deepEqual(normalizeNearbyPages({ query: { pages: [{
    pageid: 7,
    title: "Duomo",
    extract: "A  short\nsummary.",
    fullurl: "https://it.wikipedia.org/wiki/Duomo_di_Milano",
  }] } }), [{
    id: "7",
    title: "Duomo",
    summary: "A short summary.",
    url: "https://it.wikipedia.org/wiki/Duomo_di_Milano",
  }]);
});

test("Atlas owns a minimal palette-driven OpenFreeMap style with mandatory attribution", () => {
  const palette = { base: [0, 0, 0], mid: [0.2, 0.2, 0.2], light: [1, 1, 1], accent: [1, 0, 0], secondary: [0, 0, 1] };
  const style = createAtlasStyle(palette);
  assert.match(style.sources.openfreemap.url, /^https:\/\/tiles\.openfreemap\.org\/planet$/);
  assert.match(style.sources.openfreemap.attribution, /OpenStreetMap/);
  assert.ok(style.layers.some((layer) => layer.type === "fill-extrusion"));
  assert.equal(style.layers.some((layer) => layer.type === "raster"), false);
  assert.match(atlasSource, /AttributionControl\(\{ compact: false \}\)/);
  assert.match(styles, /\.atlas-field \.maplibregl-ctrl-attrib \{[\s\S]*?font-size: 7px;[\s\S]*?opacity: \.46;/);
});
