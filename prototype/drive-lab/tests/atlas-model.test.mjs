import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  advanceAtlasDemoPosition,
  appendAtlasJourneySample,
  appendAtlasPositionSample,
  appendAtlasTravelPoint,
  ATLAS_CARDINAL_DIRECTIONS,
  ATLAS_GPS_PRECISE_ACCURACY_M,
  ATLAS_JOURNEY_HISTORY_LIMIT,
  ATLAS_JOURNEY_SAMPLE_INTERVAL_MS,
  ATLAS_MARKER_UPDATE_INTERVAL_MS,
  ATLAS_MAXIMUM_PIXEL_RATIO,
  ATLAS_MANUAL_CAMERA_LIMITS,
  ATLAS_MANUAL_IDLE_MS,
  ATLAS_POSITION_BUFFER_LIMIT,
  ATLAS_POSITION_INTERPOLATION_DELAY_MS,
  ATLAS_POSITION_MAXIMUM_GAP_MS,
  ATLAS_POSITION_STALE_AFTER_MS,
  ATLAS_TRAVEL_POINT_LIMIT,
  atlasCardinalDirection,
  atlasContinuousHeading,
  atlasContrastRatio,
  atlasEffectProfile,
  atlasGpsPresentation,
  atlasKeyboardShortcutAvailable,
  atlasJourneyDistanceMetres,
  atlasManualCameraShouldReturn,
  atlasMapPixelRatio,
  atlasRoadNameFromFeatures,
  atlasTravelFeature,
  atlasVehicleFeature,
  createLatestAtlasRequestGate,
  createAtlasStyle,
  interpolateAtlasPosition,
  manualAtlasCamera,
  normalizeNearbyPages,
  paletteToAtlasMapChannels,
  pinchAtlasZoom,
  resolveAtlasHeading,
  speedToAtlasCamera,
  speedToAtlasEffectCamera,
  validAtlasPosition,
  validAtlasPositionSample,
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
const navigationIcon = readFileSync(
  new URL("../public/third-party/tabler-icons/navigation-filled.svg", import.meta.url),
  "utf8",
);

test("Atlas accepts only bounded finite coordinates kept outside diagnostics", () => {
  assert.equal(validAtlasPosition({ latitude: 45.46, longitude: 9.19 }), true);
  assert.equal(validAtlasPosition({ latitude: 95, longitude: 9.19 }), false);
  assert.equal(validAtlasPosition({ latitude: 45.46, longitude: Number.NaN }), false);
});

test("Atlas GPS presentation covers denial, timeout, inaccurate fixes and recovery", () => {
  assert.deepEqual(atlasGpsPresentation("permission denied", null), {
    live: false, requiresHelp: true, status: "DENIED", accuracy: "±— m", tone: "offline",
  });
  assert.equal(ATLAS_GPS_PRECISE_ACCURACY_M, 4);
  assert.equal(atlasGpsPresentation("timeout", null).requiresHelp, true);
  assert.equal(atlasGpsPresentation("signal unavailable", null).requiresHelp, true);
  assert.deepEqual(atlasGpsPresentation("live", 247.7), {
    live: true, requiresHelp: false, status: "LIVE", accuracy: "±248 m", tone: "imprecise",
  });
  assert.deepEqual(atlasGpsPresentation("live", 3.2), {
    live: true, requiresHelp: false, status: "LIVE", accuracy: "±3 m", tone: "precise",
  });
  assert.equal(atlasGpsPresentation("live", 4.1).tone, "imprecise");
  assert.equal(atlasGpsPresentation("permission denied", null, "DEMO").tone, "offline");
  assert.match(appSource, /className=\{`gps-state is-\$\{gpsPresentation\.tone\}`\}/);
  assert.match(appSource, /<span>GPS<\/span>\s*<small>\{gpsPresentation\.accuracy\}<\/small>/);
  assert.doesNotMatch(appSource, /<strong>\{gpsPresentation\.status\}<\/strong>/);
  assert.match(styles, /\.gps-state\.is-precise \{ color: #55d991; \}/);
  assert.match(styles, /\.gps-state\.is-imprecise \{ color: #f3a84c; \}/);
  assert.match(styles, /\.gps-state\.is-offline \{ color: #ff6b64; \}/);
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
  assert.match(appSource, /heading: resolveAtlasHeading\(previousPosition, position\.coords, position\.coords\.heading\)/);
  assert.match(appSource, /const nextMapPosition = \{[\s\S]*?capturedAtMs,[\s\S]*?\};/);
  assert.match(atlasSource, /bearing: Number\.isFinite\(point\.heading\) \? point\.heading : map\.getBearing\(\)/);
});

test("Atlas converts heading into deterministic English cardinal sectors", () => {
  assert.deepEqual(ATLAS_CARDINAL_DIRECTIONS, ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);
  assert.equal(atlasCardinalDirection(0), "N");
  assert.equal(atlasCardinalDirection(22.499), "N");
  assert.equal(atlasCardinalDirection(22.5), "NE");
  assert.equal(atlasCardinalDirection(44.999), "NE");
  assert.equal(atlasCardinalDirection(90), "E");
  assert.equal(atlasCardinalDirection(180), "S");
  assert.equal(atlasCardinalDirection(225), "SW");
  assert.equal(atlasCardinalDirection(315), "NW");
  assert.equal(atlasCardinalDirection(337.499), "NW");
  assert.equal(atlasCardinalDirection(337.5), "N");
  assert.equal(atlasCardinalDirection(-45), "NW");
  assert.equal(atlasCardinalDirection(720), "N");
  assert.equal(atlasCardinalDirection(Number.NaN), null);
  assert.equal(atlasCardinalDirection(null), null);
});

test("Atlas unwraps pointer heading across north without a long reverse spin", () => {
  assert.equal(atlasContinuousHeading(null, 22), 22);
  assert.equal(atlasContinuousHeading(358, 2), 362);
  assert.equal(atlasContinuousHeading(2, 358), -2);
  assert.equal(atlasContinuousHeading(725, 10), 730);
  assert.equal(atlasContinuousHeading(42, Number.NaN), 42);
  assert.equal(atlasContinuousHeading(null, Number.NaN), null);
});

test("Atlas derives a bounded street label only from rendered transportation features", () => {
  const features = [
    {
      layer: { id: "sedicivalvole-buildings", "source-layer": "building" },
      properties: { name: "Not a road" },
    },
    {
      layer: { id: "atlas-roads", "source-layer": "transportation" },
      properties: { name: "  Corso   Buenos\nAires  ", "name:en": "Buenos Aires Avenue" },
    },
  ];
  assert.equal(atlasRoadNameFromFeatures(features, "en-US"), "Corso Buenos Aires");
  assert.equal(atlasRoadNameFromFeatures([{
    sourceLayer: "transportation",
    properties: { "name:it": "Via Torino" },
  }], ["it", "en"]), "Via Torino");
  assert.equal(atlasRoadNameFromFeatures([{
    sourceLayer: "transportation_name",
    properties: { name: "Corso di Porta Romana" },
  }], ["it", "en"]), "Corso di Porta Romana");
  assert.equal(atlasRoadNameFromFeatures([{
    layer: { id: "atlas-road-name-probe" },
    properties: { ref: "A1" },
  }]), "A1");
  assert.equal(atlasRoadNameFromFeatures([{
    sourceLayer: "place",
    properties: { name: "Milano" },
  }]), null);
  assert.equal(atlasRoadNameFromFeatures([{
    sourceLayer: "transportation",
    properties: { name: "\u0000\u0007" },
  }]), null);
  assert.equal(atlasRoadNameFromFeatures(null), null);
  assert.ok(atlasRoadNameFromFeatures([{
    sourceLayer: "transportation",
    properties: { name: "x".repeat(120) },
  }]).length <= 80);
  assert.doesNotMatch(atlasRoadNameFromFeatures.toString(), /fetch|XMLHttpRequest|https?:/);
});

test("Atlas wires the selected navigator plaque to rendered tiles and the live bearing", () => {
  assert.match(atlasSource, /map\.queryRenderedFeatures\(projected/);
  assert.match(atlasSource, /roadFeatures = \[\.\.\.exactFeatures, \.\.\.nearbyRoadFeatures\]/);
  assert.match(atlasSource, /layers: ATLAS_ROAD_LAYER_IDS/);
  assert.match(atlasSource, /atlasRoadNameFromFeatures\(roadFeatures, preferredLanguages\)/);
  assert.match(atlasSource, /atlasCardinalDirection\(heading\)/);
  assert.match(atlasSource, /className="atlas-navigation-pointer"/);
  assert.match(atlasSource, /--atlas-pointer-heading/);
  assert.match(atlasSource, /className="atlas-cardinal-direction"/);
  assert.match(atlasSource, /className="atlas-road-name"/);
  assert.match(styles, /mask: url\("\/third-party\/tabler-icons\/navigation-filled\.svg"\)/);
  assert.match(styles, /transition: transform 260ms/);
  assert.match(navigationIcon, /version: "2\.0"/);
  assert.match(navigationIcon, /<path d="M11\.092 2\.581a1 1 0 0 1 1\.754/);
  assert.ok(createAtlasStyle(FLUX_THEMES[0].palette).layers.some((layer) => (
    layer.id === "atlas-road-name-probe"
      && layer["source-layer"] === "transportation_name"
      && layer.paint["line-opacity"] === 0
  )));
  assert.doesNotMatch(atlasSource, /reverse.?geocod/i);
});

test("Atlas retains a bounded chronological position buffer without accepting bad fixes", () => {
  assert.equal(ATLAS_POSITION_BUFFER_LIMIT, 8);
  let samples = [];
  for (let index = 0; index < 12; index += 1) {
    samples = appendAtlasPositionSample(samples, {
      latitude: 45.46 + index * 0.00001,
      longitude: 9.19 + index * 0.00001,
      heading: index === 0 ? 350 : 10,
    }, 1000 + index * 100);
  }
  assert.equal(samples.length, ATLAS_POSITION_BUFFER_LIMIT);
  assert.equal(samples[0].capturedAtMs, 1400);
  assert.equal(samples.at(-1).capturedAtMs, 2100);
  assert.equal(validAtlasPositionSample(samples.at(-1)), true);

  const unchanged = appendAtlasPositionSample(samples, { latitude: 95, longitude: 9.2 }, 2200);
  assert.equal(unchanged, samples);
  assert.equal(appendAtlasPositionSample(samples, { latitude: 45.5, longitude: 9.2 }, 2100), samples);
  assert.equal(appendAtlasPositionSample(samples, { latitude: 45.5, longitude: 9.2 }, Number.NaN), samples);
});

test("Atlas keeps a bounded, truthful live journey history", () => {
  assert.equal(ATLAS_JOURNEY_SAMPLE_INTERVAL_MS, 2000);
  assert.equal(ATLAS_JOURNEY_HISTORY_LIMIT, 60);
  let samples = appendAtlasJourneySample([], {
    capturedAtMs: 1000,
    speedKmh: 42,
    altitudeM: 121.4,
  });
  assert.deepEqual(samples, [{ capturedAtMs: 1000, speedKmh: 42, altitudeM: 121.4 }]);
  assert.equal(appendAtlasJourneySample(samples, {
    capturedAtMs: 2999,
    speedKmh: 50,
    altitudeM: 122,
  }), samples, "sub-interval UI ticks must not inflate the chart buffer");
  samples = appendAtlasJourneySample(samples, {
    capturedAtMs: 3000,
    speedKmh: 50,
    altitudeM: null,
  });
  assert.deepEqual(samples.at(-1), { capturedAtMs: 3000, speedKmh: 50, altitudeM: null });
  assert.equal(appendAtlasJourneySample(samples, { capturedAtMs: Number.NaN }), samples);
  for (let index = 0; index < 80; index += 1) {
    samples = appendAtlasJourneySample(samples, {
      capturedAtMs: 5000 + index * 2000,
      speedKmh: index,
      altitudeM: index % 2 ? 130 + index : null,
    });
  }
  assert.equal(samples.length, ATLAS_JOURNEY_HISTORY_LIMIT);
  assert.equal(samples.at(-1).speedKmh, 79);

  const route = [
    { latitude: 45.46, longitude: 9.19 },
    { latitude: 45.461, longitude: 9.19 },
    { latitude: 95, longitude: 9.19 },
    { latitude: 45.462, longitude: 9.19 },
  ];
  assert.ok(Math.abs(atlasJourneyDistanceMetres(route) - 222.64) < 0.5);
});

test("Atlas feeds position samples at GPS cadence without driving React camera state at that cadence", () => {
  const appendAt = appSource.indexOf("atlasPositionSamplesRef.current = appendAtlasPositionSample");
  const nullSpeedAt = appSource.indexOf("if (kmh == null)", appendAt);
  assert.ok(appendAt >= 0 && nullSpeedAt > appendAt, "coordinates must survive a null GPS speed sample");
  assert.match(appSource, /const atlasPositionSamplesRef = useRef\(\[\]\)/);
  assert.match(appSource, /const mapPositionUpdatedAtRef = useRef\(Number\.NEGATIVE_INFINITY\)/);
  assert.match(appSource, /capturedAtMs - mapPositionUpdatedAtRef\.current >= 2500/);
  assert.match(appSource, /positionSamplesRef=\{atlasPositionSamplesRef\}/);
  assert.match(atlasSource, /positionSamplesRef = null/);
  assert.match(atlasSource, /valuesRef\.current = \{[\s\S]*?positionSamplesRef/);
  assert.match(
    appSource,
    /atlasPositionSamplesRef\.current = \[\];\s*mapPositionUpdatedAtRef\.current = Number\.NEGATIVE_INFINITY;[\s\S]*?if \(!navigator\.geolocation\)/,
  );

  const reportStart = appSource.indexOf("const buildDiagnosticReport");
  const reportEnd = appSource.indexOf("const sendDiagnostic", reportStart);
  assert.ok(reportStart >= 0 && reportEnd > reportStart);
  assert.doesNotMatch(
    appSource.slice(reportStart, reportEnd),
    /atlasPositionSamplesRef|latitude|longitude/,
    "the high-rate coordinate buffer must stay outside the diagnostic report",
  );
});

test("Atlas position interpolation is timestamped, frame-rate independent and bounded", () => {
  assert.equal(ATLAS_POSITION_INTERPOLATION_DELAY_MS, 100);
  assert.equal(ATLAS_POSITION_MAXIMUM_GAP_MS, 750);
  assert.equal(ATLAS_POSITION_STALE_AFTER_MS, 1500);
  let samples = [];
  for (let index = 0; index <= 10; index += 1) {
    samples = appendAtlasPositionSample(samples, {
      latitude: 45.46,
      longitude: 9.19 + index * 0.0001,
      heading: index < 5 ? 350 : 10,
    }, 1000 + index * 100);
  }

  const midpoint = interpolateAtlasPosition(samples, 1750);
  assert.ok(Math.abs(midpoint.longitude - 9.19065) < 1e-10);
  assert.equal(midpoint.interpolating, true);
  assert.equal(midpoint.stale, false);

  const thirtyFps = Array.from({ length: 16 }, (_, index) => (
    interpolateAtlasPosition(samples, 1400 + index * (1000 / 30)).longitude
  ));
  const sixtyFps = Array.from({ length: 31 }, (_, index) => (
    interpolateAtlasPosition(samples, 1400 + index * (1000 / 60)).longitude
  ));
  thirtyFps.forEach((value, index) => {
    assert.ok(Math.abs(value - sixtyFps[index * 2]) < 1e-12);
    if (index > 0) assert.ok(value > thirtyFps[index - 1]);
  });

  const held = interpolateAtlasPosition(samples, 2150);
  assert.equal(held.longitude, samples.at(-1).longitude);
  assert.equal(held.interpolating, false, "the marker must not extrapolate beyond the latest fix");
  const stale = interpolateAtlasPosition(samples, 3501);
  assert.equal(stale.longitude, samples.at(-1).longitude);
  assert.equal(stale.stale, true);
  assert.equal(stale.interpolating, false);
  assert.equal(interpolateAtlasPosition([], 1000), null);
  assert.equal(interpolateAtlasPosition(samples, Number.NaN), null);
});

test("Atlas interpolates cyclic values by the short route and never cuts across a long sample gap", () => {
  let samples = appendAtlasPositionSample([], {
    latitude: 0,
    longitude: 179.999,
    heading: 350,
  }, 1000);
  samples = appendAtlasPositionSample(samples, {
    latitude: 0,
    longitude: -179.999,
    heading: 10,
  }, 1100);
  const midpoint = interpolateAtlasPosition(samples, 1150);
  assert.ok(Math.abs(Math.abs(midpoint.longitude) - 180) < 1e-9);
  assert.ok(midpoint.heading < 0.001 || midpoint.heading > 359.999);

  const gap = [
    { latitude: 45.46, longitude: 9.19, heading: 0, capturedAtMs: 0 },
    { latitude: 45.56, longitude: 9.29, heading: 90, capturedAtMs: 2000 },
  ];
  const recovered = interpolateAtlasPosition(gap, 2050);
  assert.equal(recovered.latitude, gap[1].latitude);
  assert.equal(recovered.longitude, gap[1].longitude);
  assert.equal(recovered.interpolating, false);
});

test("Atlas live journey and place reading remain legible at the Tesla viewport", () => {
  assert.match(styles, /\.atlas-field \{[\s\S]*?--atlas-panel-width: 272px;/);
  assert.match(styles, /\.atlas-panel \{[\s\S]*?width: var\(--atlas-panel-width\);[\s\S]*?padding: 0;/);
  assert.match(styles, /\.atlas-motion-readouts \{[\s\S]*?grid-template-columns: 76px 1fr;/);
  assert.match(styles, /\.atlas-journey-chart canvas \{[^}]*width: 100%;[^}]*height: 30px;/);
  assert.match(styles, /\.atlas-selected-context \{[\s\S]*?grid-template-columns: 72px 1fr;/);
  assert.match(styles, /\.atlas-selected-context img \{[\s\S]*?width: 72px;[\s\S]*?height: 62px;/);
  assert.match(styles, /\.atlas-selected-context p \{[\s\S]*?font-size: 9px;[\s\S]*?-webkit-line-clamp: 3;/);
  assert.match(styles, /\.atlas-places button strong \{[^}]*font-size: 10px;/);
  assert.match(styles, /\.atlas-qr img \{ width: 34px; height: 34px;/);
  assert.match(atlasSource, /width: 192,/);
  assert.match(atlasSource, /window\.innerHeight >= 560 \? 2 : 1/);
  assert.match(atlasSource, /window\.innerHeight >= 700 \? 3 : window\.innerHeight >= 560 \? 2 : 1/);
  assert.match(atlasSource, /appendAtlasJourneySample/);
  assert.match(atlasSource, /atlasJourneyDistanceMetres\(travelPointsRef\.current\)/);
  assert.match(atlasSource, /field="speedKmh"/);
  assert.match(atlasSource, /field="altitudeM"/);
});

test("Atlas grants touch and desktop exploration for six seconds, then returns to fresh automatic camera", () => {
  assert.deepEqual(ATLAS_MANUAL_CAMERA_LIMITS, {
    minimumZoom: 3,
    maximumZoom: 20.5,
    minimumPitch: 0,
    maximumPitch: 85,
  });
  assert.equal(atlasManualCameraShouldReturn(null, ATLAS_MANUAL_IDLE_MS), false);
  assert.equal(atlasManualCameraShouldReturn(1000, 1000 + ATLAS_MANUAL_IDLE_MS - 1), false);
  assert.equal(atlasManualCameraShouldReturn(1000, 1000 + ATLAS_MANUAL_IDLE_MS), true);
  const moved = manualAtlasCamera({ bearing: 350, pitch: 60, zoom: 16 }, 50, 40);
  assert.ok(moved.bearing < 20);
  assert.ok(moved.pitch < 60);
  assert.equal(
    manualAtlasCamera({ bearing: 0, pitch: 60, zoom: 16 }, 0, 1000).pitch,
    0,
    "dragging toward vertical must stop exactly at the approved floor",
  );
  assert.equal(
    manualAtlasCamera({ bearing: 0, pitch: 60, zoom: 16 }, 0, -1000).pitch,
    85,
    "dragging toward the horizon must stop exactly at the approved ceiling",
  );
  assert.equal(
    manualAtlasCamera({ bearing: 0, pitch: 85, zoom: 16 }, 0, -20).pitch,
    85,
    "the manual camera must not elastically overshoot the MapLibre ceiling",
  );
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
  assert.match(atlasSource, /minPitch: ATLAS_MANUAL_CAMERA_LIMITS\.minimumPitch/);
  assert.match(atlasSource, /maxPitch: ATLAS_MANUAL_CAMERA_LIMITS\.maximumPitch/);
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

test("Atlas keeps a bounded complete-session route with one pulsing vehicle point", () => {
  const first = { latitude: 45.4642, longitude: 9.19 };
  const second = { latitude: 45.4643, longitude: 9.1901 };
  let points = appendAtlasTravelPoint([], first);
  points = appendAtlasTravelPoint(points, second);
  assert.deepEqual(atlasTravelFeature(points).features[0].geometry.coordinates, [
    [first.longitude, first.latitude],
    [second.longitude, second.latitude],
  ]);
  assert.equal(appendAtlasTravelPoint(points, second), points, "sub-metre noise should not extend the line");
  let compacted = [];
  for (let index = 0; index < 7; index += 1) {
    compacted = appendAtlasTravelPoint(compacted, {
      latitude: first.latitude + index * 0.0001,
      longitude: first.longitude,
    }, 4);
  }
  assert.deepEqual(compacted[0], first, "bounded compaction must retain the trip origin");
  assert.deepEqual(compacted.at(-1), {
    latitude: first.latitude + 0.0006,
    longitude: first.longitude,
  });
  assert.ok(compacted.length <= 4);
  assert.equal(ATLAS_TRAVEL_POINT_LIMIT, 4096);
  const vehicle = atlasVehicleFeature(second, 0.5, 0.18).features[0];
  assert.deepEqual(vehicle.geometry.coordinates, [second.longitude, second.latitude]);
  assert.deepEqual(vehicle.properties, { pulse: 0.5, rippleOpacity: 0.18 });
  assert.equal(atlasVehicleFeature(null).features.length, 0);
  assert.match(atlasSource, /travelPointsRef = useRef\(\[\]\)/);
  assert.match(atlasSource, /travelPointsRef\.current = \[\];/);
  assert.doesNotMatch(atlasSource, /\["line-progress"\]/);
  assert.match(atlasSource, /\(now % 1000\) \/ 1000/);
  assert.match(atlasSource, /atlasVehicleFeature\([\s\S]*?point,[\s\S]*?phase/);
  assert.doesNotMatch(appSource, /travelPointsRef|atlasTravelFeature/);
});

test("Atlas bounds map density and consolidates marker animation work", () => {
  assert.equal(ATLAS_MAXIMUM_PIXEL_RATIO, 1.25);
  assert.equal(ATLAS_MARKER_UPDATE_INTERVAL_MS, 125);
  assert.equal(atlasMapPixelRatio(1), 1);
  assert.equal(atlasMapPixelRatio(1.53), 1.25);
  assert.equal(atlasMapPixelRatio(3), 1.25);
  assert.equal(atlasMapPixelRatio(null), 1);
  assert.match(atlasSource, /pixelRatio: atlasMapPixelRatio\(window\.devicePixelRatio\)/);
  assert.match(atlasSource, /renderWorldCopies: false/);
  assert.match(atlasSource, /cancelPendingTileRequestsWhileZooming: true/);
  assert.doesNotMatch(atlasSource, /setPaintProperty\("atlas-vehicle-ripple", "circle-radius"/);
  assert.match(atlasSource, /ATLAS_MARKER_UPDATE_INTERVAL_MS/);
});

test("Atlas shows an integrated compass and coordinate-free GPS recovery without a blocking waiting splash", () => {
  assert.doesNotMatch(atlasSource, /NavigationControl/);
  assert.match(atlasSource, /className=\{`atlas-navigation-plaque/);
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
  assert.match(styles, /\.atlas-panel-toggle \{[\s\S]*?width: 42px;[\s\S]*?height: 116px;/);
  assert.match(styles, /\.atlas-panel-toggle-icon\.is-collapse \{ mask-image: url\("\/third-party\/tabler-icons\/chevron-right\.svg"\); \}/);
  assert.match(atlasSource, /panelCollapsed \? "SHOW INFO" : "HIDE INFO"/);
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
  assert.ok(style.layers.some((layer) => layer.id === "atlas-travel-route"));
  assert.ok(style.layers.some((layer) => layer.id === "atlas-vehicle-ripple"));
  assert.ok(style.layers.some((layer) => layer.id === "atlas-vehicle-dot"));
  assert.equal(style.layers.some((layer) => layer.type === "raster"), false);
  assert.match(atlasSource, /AttributionControl\(\{ compact: false \}\)/);
  assert.match(styles, /\.atlas-field \.maplibregl-ctrl-attrib \{[\s\S]*?font-size: 7px;[\s\S]*?opacity: \.46;/);
});
