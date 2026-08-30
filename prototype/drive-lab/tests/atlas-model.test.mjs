import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  advanceAtlasDemoPosition,
  appendAtlasTravelPoint,
  ATLAS_MANUAL_IDLE_MS,
  atlasEffectProfile,
  atlasGpsPresentation,
  atlasKeyboardShortcutAvailable,
  atlasManualCameraShouldReturn,
  atlasContrastRatio,
  atlasTravelFeature,
  createLatestAtlasRequestGate,
  createAtlasStyle,
  manualAtlasCamera,
  normalizeNearbyPages,
  paletteToAtlasMapChannels,
  pinchAtlasZoom,
  resolveAtlasHeading,
  speedToAtlasCamera,
  speedToAtlasEffectCamera,
  validAtlasPosition,
  wheelAtlasZoom,
  wikipediaNearbyUrl,
} from "../src/environments/atlas/atlas-model.js";
import { FLUX_THEMES } from "../src/flux-themes.js";
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

test("Atlas GPS presentation covers denial, timeout, inaccurate fixes and recovery", () => {
  assert.deepEqual(atlasGpsPresentation("permission denied", null), {
    live: false, requiresHelp: true, status: "DENIED", accuracy: "±— m",
  });
  assert.equal(atlasGpsPresentation("timeout", null).requiresHelp, true);
  assert.equal(atlasGpsPresentation("signal unavailable", null).requiresHelp, true);
  assert.equal(atlasGpsPresentation("live", 247.7).accuracy, "±248 m");
  assert.deepEqual(atlasGpsPresentation("live", 3.2), {
    live: true, requiresHelp: false, status: "LIVE", accuracy: "±3 m",
  });
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
  assert.match(styles, /\.atlas-selected-context \{[\s\S]*?flex-direction: column;/);
  assert.match(styles, /\.atlas-selected-context img \{[\s\S]*?width: 100%;[\s\S]*?height: 96px;/);
  assert.match(styles, /\.atlas-selected-context p \{[\s\S]*?font-size: 11\.5px;[\s\S]*?-webkit-line-clamp: 3;/);
  assert.match(styles, /\.atlas-places button strong \{[^}]*font-size: 12px;/);
  assert.match(styles, /\.atlas-qr img \{ width: 58px; height: 58px;/);
  assert.match(atlasSource, /width: 192,/);
  assert.match(atlasSource, /window\.innerHeight >= 560 \? 5 : 4/);
  assert.match(atlasSource, /pages\.slice\(0, visiblePlaceCount\)/);
});

test("Atlas grants touch and desktop exploration for six seconds, then returns to fresh automatic camera", () => {
  assert.equal(atlasManualCameraShouldReturn(1000, 1000 + ATLAS_MANUAL_IDLE_MS - 1), false);
  assert.equal(atlasManualCameraShouldReturn(1000, 1000 + ATLAS_MANUAL_IDLE_MS), true);
  const moved = manualAtlasCamera({ bearing: 350, pitch: 60, zoom: 16 }, 50, 40);
  assert.ok(moved.bearing < 20);
  assert.ok(moved.pitch < 60);
  assert.ok(pinchAtlasZoom(16, 100, 160) > 16);
  assert.ok(pinchAtlasZoom(16, 100, 40) < 16);
  assert.ok(pinchAtlasZoom(20, 100, 1000) <= 20.5);
  assert.ok(wheelAtlasZoom(16, -120) > 16);
  assert.ok(wheelAtlasZoom(16, 120) < 16);
  assert.equal(wheelAtlasZoom(20, -1000), 20.5);
  assert.ok(wheelAtlasZoom(16, -3, 1) > 16, "line-mode mouse wheels should zoom in");
  assert.match(atlasSource, /canvas\.style\.touchAction = "none"/);
  assert.match(atlasSource, /event\.pointerType === "mouse" && event\.button !== 0/);
  assert.match(atlasSource, /event\.pointerType === "mouse" && \(event\.buttons & 1\) === 0/);
  assert.match(atlasSource, /manual\.pointers\.size === 1/);
  assert.match(atlasSource, /pinchAtlasZoom\(map\.getZoom\(\)/);
  assert.match(atlasSource, /map\.scrollZoom\.disable\(\)/);
  assert.match(atlasSource, /canvas\.addEventListener\("wheel", wheelManual, \{ passive: false \}\)/);
  assert.match(atlasSource, /wheelAtlasZoom\(map\.getZoom\(\), event\.deltaY, event\.deltaMode\)/);
  assert.match(
    styles,
    /\.app\[data-environment="atlas"\] \.experience(?:,\s*\.app\[data-environment="[^"]+"\] \.experience)* \{ z-index: 8; pointer-events: none; \}/,
  );
  assert.match(styles, /\.app\[data-environment="atlas"\]\.controls-awake \.experience \.control-layer,[\s\S]*?pointer-events: auto;/);
  assert.match(atlasSource, /atlasManualCameraShouldReturn\(manual\.lastInteractionAt, now\)/);
  assert.match(atlasSource, /center: \[point\.longitude, point\.latitude\][\s\S]*?pitch: nextCamera\.pitch[\s\S]*?zoom: nextCamera\.zoom/);
});

test("Atlas travel pulse is directional, ephemeral and absent from diagnostics", () => {
  const first = { latitude: 45.4642, longitude: 9.19 };
  const second = { latitude: 45.4643, longitude: 9.1901 };
  let points = appendAtlasTravelPoint([], first);
  points = appendAtlasTravelPoint(points, second);
  assert.deepEqual(atlasTravelFeature(points).features[0].geometry.coordinates, [
    [first.longitude, first.latitude],
    [second.longitude, second.latitude],
  ]);
  assert.equal(appendAtlasTravelPoint(points, second), points, "sub-metre noise should not extend the line");
  assert.match(atlasSource, /travelPointsRef = useRef\(\[\]\)/);
  assert.match(atlasSource, /travelPointsRef\.current = \[\];/);
  assert.match(atlasSource, /\["line-progress"\]/);
  assert.doesNotMatch(appSource, /travelPointsRef|atlasTravelFeature/);
});

test("Atlas shows a compass and coordinate-free GPS recovery without a blocking waiting splash", () => {
  assert.match(atlasSource, /NavigationControl\(\{[\s\S]*?showCompass: true/);
  assert.match(atlasSource, /className="atlas-heading"/);
  assert.match(appSource, /id="gps-help-popover"/);
  assert.match(appSource, /RETRY LOCATION/);
  assert.match(appSource, /EXPLORE MILAN DEMO/);
  assert.match(appSource, /Position stays in this ATLAS session and never enters the session report/);
  assert.match(appSource, /!mapPosition && !atlasDemoActive/);
  assert.match(appSource, /setAtlasDemoActive\(true\)/);
  assert.doesNotMatch(atlasSource, /Waiting for a reliable GPS position/);
  assert.match(atlasSource, /className="atlas-field is-unlocated"/);
});

test("every shared palette gets map-specific road and label contrast", () => {
  for (const theme of FLUX_THEMES) {
    const colors = paletteToAtlasMapChannels(theme.palette);
    assert.ok(atlasContrastRatio(colors.foreground, colors.background) >= 7, `${theme.id} labels`);
    assert.ok(atlasContrastRatio(colors.secondary, colors.background) >= 3.2, `${theme.id} roads`);
    assert.ok(atlasContrastRatio(colors.accent, colors.background) >= 2.8, `${theme.id} pulse`);
  }
  assert.doesNotMatch(atlasSource, /mapRef\.current\?\.loaded\(\).*recolourStyle/);
  assert.match(atlasSource, /recolourStyle\(mapRef\.current, theme\.palette, effect\)/);
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

test("Atlas exposes up to six normalized nearby pages", () => {
  const pages = Array.from({ length: 8 }, (_, index) => ({
    pageid: index + 1,
    title: `Place ${index + 1}`,
    extract: "Readable context.",
    fullurl: `https://it.wikipedia.org/wiki/Place_${index + 1}`,
  }));
  assert.equal(normalizeNearbyPages({ query: { pages } }).length, 6);
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
  assert.equal(style.sources.atlasTravel.lineMetrics, true);
  assert.ok(style.layers.some((layer) => layer.id === "atlas-travel-pulse"));
  assert.equal(style.layers.some((layer) => layer.type === "raster"), false);
  assert.match(atlasSource, /AttributionControl\(\{ compact: false \}\)/);
  assert.match(styles, /\.atlas-field \.maplibregl-ctrl-attrib \{[\s\S]*?font-size: 7px;[\s\S]*?opacity: \.46;/);
});
