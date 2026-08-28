import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceAtlasDemoPosition,
  createAtlasStyle,
  normalizeNearbyPages,
  speedToAtlasCamera,
  validAtlasPosition,
  wikipediaNearbyUrl,
} from "../src/environments/atlas/atlas-model.js";

test("Atlas accepts only bounded finite coordinates kept outside diagnostics", () => {
  assert.equal(validAtlasPosition({ latitude: 45.46, longitude: 9.19 }), true);
  assert.equal(validAtlasPosition({ latitude: 95, longitude: 9.19 }), false);
  assert.equal(validAtlasPosition({ latitude: 45.46, longitude: Number.NaN }), false);
});

test("Atlas camera becomes wider, higher and more responsive with road speed", () => {
  const rest = speedToAtlasCamera(0);
  const road = speedToAtlasCamera(130);
  assert.ok(road.zoom < rest.zoom);
  assert.ok(road.pitch < rest.pitch, "the faster camera should rise toward bird's-eye");
  assert.ok(road.durationMs < rest.durationMs);
  assert.ok(road.buildingScale > rest.buildingScale);
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
});
