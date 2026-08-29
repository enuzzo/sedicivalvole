import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  advanceAtlasDemoPosition,
  atlasEffectProfile,
  atlasKeyboardShortcutAvailable,
  createLatestAtlasRequestGate,
  createAtlasStyle,
  normalizeNearbyPages,
  resolveAtlasHeading,
  speedToAtlasCamera,
  speedToAtlasEffectCamera,
  validAtlasPosition,
  wikipediaNearbyUrl,
} from "../src/environments/atlas/atlas-model.js";
import {
  canvasFramebufferSize,
  frameTelemetryIsDue,
  THIRTY_FPS_FRAME_INTERVAL_MS,
} from "../src/render-telemetry.js";

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

test("Atlas expresses all three effects through map-native camera and layer properties", () => {
  const idle = atlasEffectProfile(null);
  const open = atlasEffectProfile("OPEN");
  const underwater = atlasEffectProfile("UNDERWATER");
  const bloom = atlasEffectProfile("BLOOM");
  assert.ok(open.roadWidthScale > idle.roadWidthScale);
  assert.ok(underwater.waterOpacity > idle.waterOpacity);
  assert.ok(underwater.buildingOpacity < idle.buildingOpacity);
  assert.ok(bloom.roadOpacity > open.roadOpacity);
  assert.ok(speedToAtlasEffectCamera(60, "BLOOM").zoom < speedToAtlasCamera(60).zoom);
});

test("Atlas telemetry samples real render events at no more than 30 FPS", () => {
  assert.equal(THIRTY_FPS_FRAME_INTERVAL_MS, 1000 / 30);
  assert.equal(frameTelemetryIsDue(0, THIRTY_FPS_FRAME_INTERVAL_MS - 0.001, THIRTY_FPS_FRAME_INTERVAL_MS), false);
  let lastFrameAt = null;
  const captured = [0, 1000 / 60, 1000 / 30, 1000 / 20, 2000 / 30];
  const reported = captured.filter((capturedAt) => {
    if (!frameTelemetryIsDue(lastFrameAt, capturedAt, THIRTY_FPS_FRAME_INTERVAL_MS)) return false;
    lastFrameAt = capturedAt;
    return true;
  });
  assert.deepEqual(reported, [0, 1000 / 30, 2000 / 30]);
  assert.deepEqual(canvasFramebufferSize({ width: 1546, height: 1202 }), { width: 1546, height: 1202 });
  assert.match(atlasSource, /map\.on\("render"/);
  assert.match(atlasSource, /frameTelemetryIsDue\([\s\S]*?THIRTY_FPS_FRAME_INTERVAL_MS/);
  assert.doesNotMatch(atlasSource, /onFrame\(performance\.now\(\), 1000 \/ 30/);
});

test("an abandoned Atlas import cannot fail the newly selected environment", () => {
  const catchAt = atlasSource.indexOf("})().catch((error) => {");
  const disposedAt = atlasSource.indexOf("if (disposed) return;", catchAt);
  const errorAt = atlasSource.indexOf('onRenderer("Atlas unavailable")', catchAt);
  assert.ok(catchAt >= 0);
  assert.ok(disposedAt > catchAt && disposedAt < errorAt);
});

test("Atlas reports fatal map and animation failures once through the app fallback", () => {
  assert.match(atlasSource, /let failed = false;/);
  assert.match(atlasSource, /const fail = \(error\) => \{[\s\S]*?if \(disposed \|\| failed\) return;[\s\S]*?onRuntimeError\?\./);
  assert.match(atlasSource, /map\.on\("error", \(event\) =>/);
  assert.match(atlasSource, /map\.on\("render", \(\) => \{[\s\S]*?catch \(error\) \{\s*fail\(error\);/);
  assert.match(atlasSource, /const animate = \(now\) => \{[\s\S]*?catch \(error\) \{\s*fail\(error\);/);
});

test("Atlas demo steering yields to modal and interactive keyboard contexts", () => {
  const interactiveTarget = { closest: () => ({ tagName: "BUTTON" }) };
  const passiveTarget = { closest: () => null };
  assert.equal(atlasKeyboardShortcutAvailable({ target: passiveTarget }, false), false);
  assert.equal(atlasKeyboardShortcutAvailable({ target: interactiveTarget }), false);
  assert.equal(atlasKeyboardShortcutAvailable({ target: passiveTarget, defaultPrevented: true }), false);
  assert.equal(atlasKeyboardShortcutAvailable({ target: passiveTarget, altKey: true }), false);
  assert.equal(atlasKeyboardShortcutAvailable({ target: passiveTarget }), true);
  assert.match(atlasSource, /keyboardShortcutsEnabled = true/);
  assert.match(atlasSource, /!demo \|\| !demoPosition \|\| !keyboardShortcutsEnabled/);
  assert.match(atlasSource, /atlasKeyboardShortcutAvailable\(event, keyboardShortcutsEnabled\)/);
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
  assert.match(styles, /\.atlas-selected-context \{[\s\S]*?grid-template-columns: 76px minmax\(0, 1fr\);/);
  assert.match(styles, /\.atlas-selected-context img \{[\s\S]*?width: 76px;[\s\S]*?height: 62px;/);
  assert.match(styles, /\.atlas-selected-context p \{[\s\S]*?font-size: 11px;[\s\S]*?-webkit-line-clamp: 4;/);
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
  assert.match(url, /prop=extracts%7Cinfo%7Cpageimages/);
  assert.match(url, /pithumbsize=320/);
  assert.match(url, /pilicense=free/);
  assert.equal(wikipediaNearbyUrl(null), null);
  assert.deepEqual(normalizeNearbyPages({ query: { pages: [{
    pageid: 7,
    title: "Duomo",
    extract: "A  short\nsummary.",
    fullurl: "https://it.wikipedia.org/wiki/Duomo_di_Milano",
    thumbnail: { source: "//upload.wikimedia.org/duomo.jpg", width: 320, height: 214 },
  }] } }), [{
    id: "7",
    title: "Duomo",
    summary: "A short summary.",
    url: "https://it.wikipedia.org/wiki/Duomo_di_Milano",
    thumbnail: "https://upload.wikimedia.org/duomo.jpg",
    thumbnailWidth: 320,
    thumbnailHeight: 214,
  }]);
});

test("an aborted Atlas nearby request cannot clear the current loading state", async () => {
  const gate = createLatestAtlasRequestGate();
  let loading = false;
  let finishStaleRequest;
  const staleRequest = gate.begin();
  staleRequest.commit(() => { loading = true; });
  const staleCompletion = new Promise((resolve) => { finishStaleRequest = resolve; })
    .finally(() => staleRequest.commit(() => { loading = false; }));

  const currentRequest = gate.begin();
  currentRequest.commit(() => { loading = true; });
  finishStaleRequest();
  await staleCompletion;
  assert.equal(loading, true, "the stale finally hid the current request's progress");

  currentRequest.commit(() => { loading = false; });
  assert.equal(loading, false);
  assert.match(atlasSource, /\.finally\(\(\) => request\.commit\(\(\) => setLoading\(false\)\)\)/);
});

test("Atlas clears a stale QR immediately and ignores late or rejected generation", async () => {
  const gate = createLatestAtlasRequestGate();
  let qrUrl = "qr:previous-article";
  let finishStaleQr;
  const staleRequest = gate.begin();
  const staleGeneration = new Promise((resolve) => { finishStaleQr = resolve; })
    .then((dataUrl) => staleRequest.commit(() => { qrUrl = dataUrl; }));

  const currentRequest = gate.begin();
  currentRequest.commit(() => { qrUrl = ""; });
  finishStaleQr("qr:wrong-article");
  await staleGeneration;
  assert.equal(qrUrl, "", "the previous article's QR returned beside the current article");

  await Promise.reject(new Error("QR chunk unavailable"))
    .catch(() => currentRequest.commit(() => { qrUrl = ""; }));
  assert.equal(qrUrl, "");
  assert.match(atlasSource, /request\.commit\(\(\) => setQrUrl\(""\)\);[\s\S]*?import\("qrcode"\)/);
  assert.match(atlasSource, /\.catch\(\(\) => \{\s*request\.commit\(\(\) => setQrUrl\(""\)\);/);
});

test("Atlas rejects unsafe or absent thumbnail URLs without losing the abstract", () => {
  const [page] = normalizeNearbyPages({ query: { pages: [{
    pageid: 8,
    title: "Milano",
    extract: "City abstract.",
    fullurl: "https://it.wikipedia.org/wiki/Milano",
    thumbnail: { source: "javascript:alert(1)", width: 320, height: 200 },
  }] } });
  assert.equal(page.thumbnail, "");
  assert.equal(page.summary, "City abstract.");
  assert.match(atlasSource, /className=\{`atlas-selected-context/);
  assert.match(atlasSource, /decoding="async"/);
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
