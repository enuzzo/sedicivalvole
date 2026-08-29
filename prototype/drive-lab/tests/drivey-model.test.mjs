import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DEFAULT_DRIVEY_SETTINGS,
  DRIVEY_CAMERAS,
  driveyGridDensity,
  driveyMotionProfile,
  driveyRoadSample,
  normalizeDriveySettings,
  projectDriveyPoint,
} from "../src/environments/drivey/drivey-model.js";

const fieldSource = readFileSync(
  new URL("../src/environments/drivey/drivey-field.jsx", import.meta.url),
  "utf8",
);

test("DRIVEY exposes three authored camera variants and clamps persisted controls", () => {
  assert.deepEqual(Object.keys(DRIVEY_CAMERAS), ["driver", "hood", "rear"]);
  assert.deepEqual(normalizeDriveySettings(null), DEFAULT_DRIVEY_SETTINGS);
  assert.deepEqual(normalizeDriveySettings({ camera: "rear", structure: 999 }), {
    camera: "rear",
    structure: 100,
  });
  assert.deepEqual(normalizeDriveySettings({ camera: "unknown", structure: -1 }), {
    camera: "driver",
    structure: 20,
  });
});

test("road speed owns travel and perspective while music owns colour pulse", () => {
  const rest = driveyMotionProfile({ speedKmh: 0, audioLevel: 0 });
  const road = driveyMotionProfile({ speedKmh: 100, audioLevel: 0 });
  const music = driveyMotionProfile({ speedKmh: 0, audioLevel: 0.7 });
  assert.ok(road.travelRate > rest.travelRate * 20);
  assert.ok(road.perspective > rest.perspective);
  assert.equal(road.colourPulse, 0);
  assert.ok(music.colourPulse > 0);
  assert.equal(music.travelRate, rest.travelRate);
});

test("OPEN, UNDERWATER, BLOOM and reduced motion use distinct native responses", () => {
  const normal = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4 });
  const open = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4, effect: "OPEN" });
  const underwater = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4, effect: "UNDERWATER" });
  const bloom = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4, effect: "BLOOM" });
  const reduced = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4, reducedMotion: true });
  assert.ok(open.perspective > normal.perspective);
  assert.ok(underwater.depthCompression > 0);
  assert.ok(underwater.terrainRelief < normal.terrainRelief);
  assert.ok(bloom.colourPulse > open.colourPulse);
  assert.equal(reduced.travelRate, 0);
  assert.equal(reduced.colourPulse, 0);
});

test("the road remains convergent and bounded in every camera", () => {
  const profile = driveyMotionProfile({ speedKmh: 130, audioLevel: 0.8, effect: "BLOOM" });
  for (const camera of Object.keys(DRIVEY_CAMERAS)) {
    const settings = { camera, structure: 100 };
    const far = projectDriveyPoint({ lateral: 1, progress: 0, time: 4.2, profile, settings });
    const nearLeft = projectDriveyPoint({ lateral: -1, progress: 1, time: 4.2, profile, settings });
    const nearRight = projectDriveyPoint({ lateral: 1, progress: 1, time: 4.2, profile, settings });
    assert.ok(far.sample.halfWidth < nearRight.sample.halfWidth);
    assert.ok(nearLeft.x < nearRight.x);
    assert.ok(far.y < nearLeft.y);
    assert.ok([far, nearLeft, nearRight].every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)));
  }
});

test("structure increases bounded grid detail without changing camera identity", () => {
  const sparse = driveyGridDensity({ camera: "hood", structure: 20 });
  const dense = driveyGridDensity({ camera: "hood", structure: 100 });
  assert.ok(dense.longitudinal > sparse.longitudinal);
  assert.ok(dense.crossSections > sparse.crossSections);
  assert.ok(dense.terrainLines > sparse.terrainLines);
  assert.ok(dense.longitudinal <= 26);
  const profile = driveyMotionProfile({ speedKmh: 40 });
  const sample = driveyRoadSample(0.5, 2, profile, { camera: "hood", structure: 50 });
  assert.ok(sample.halfWidth > 0);
});

test("the Canvas2D runtime fails once, cleans up, and imports no upstream runtime", () => {
  assert.match(fieldSource, /const fail = \(error\) => \{/);
  assert.match(fieldSource, /cancelAnimationFrame\(animationFrame\)/);
  assert.match(fieldSource, /onRuntimeError\?\./);
  assert.doesNotMatch(fieldSource, /drivey\/(?:src|js)|Rezmason|THREE|three\.js/i);
});
