import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { positionUnusable, speedOnlyPlausible } from "../src/gps-speed-trust.js";
import { classifyGpsConfidence } from "../src/diagnostics-model.js";
import { normalizeGpsSpeed, smoothGpsSpeed } from "../src/signal-model.js";
import { createEngineMotion } from "../src/engine/motion.js";

// Exercise the actual watch callback, including its admission and smoothing
// order. A poor position cannot enter geographic consumers in this fixture.
function appWatch() {
  const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const start = source.indexOf("gpsPositionRef.current = (position, liveWatch = true) => {");
  const end = source.indexOf("    watchRef.current = navigator.geolocation.watchPosition(", start);
  assert.ok(start >= 0 && end > start);
  let now = 0;
  const speeds = [], events = [];
  const ref = (current) => ({ current });
  const scope = {
    performance: { now: () => now },
    gpsPositionRef: ref(null), mapPositionRef: ref(null),
    sourceRef: ref("GPS"), engineMotionRef: ref(createEngineMotion()),
    latestGpsObservationRef: ref(null), terrainElevationRef: ref(null),
    gpsTelemetryRef: ref({}), lastGpsEventAtRef: ref(null),
    lastGpsSampleAtRef: ref(null), gpsSpeedLockedRef: ref(false),
    lastRawGpsSpeedRef: ref(null), gpsSpeedOnlyRef: ref(false),
    smoothedSpeedRef: ref(0),
    radarDisplayFix: () => null, recordGpsSample: (value) => value,
    setAccuracy: () => {}, setGpsState: () => {},
    setSpeed: (value) => speeds.push(value),
    logDiagnosticEvent: (type, detail) => events.push({ type, ...detail }),
    normalizeGpsSpeed, smoothGpsSpeed, positionUnusable, speedOnlyPlausible,
  };
  runInNewContext(source.slice(start, end), scope);
  return {
    speeds, events,
    observe(kmh, atMs) {
      now = atMs;
      scope.gpsPositionRef.current({ timestamp: Date.now(), coords: { speed: kmh / 3.6, accuracy: 9999.99 } });
    },
    motion: () => scope.engineMotionRef.current.snapshot(now),
  };
}

test("the App waits for continuity before admitting its first speed-only sample", () => {
  const watch = appWatch();
  watch.observe(40, 0);
  assert.deepEqual(watch.speeds, [], "an uncorroborated first fix cannot drive music or visuals");
  assert.equal(watch.motion().freshness, "lost");
  assert.equal(watch.events.at(-1).heldForConfidence, true);
  watch.observe(42, 100);
  assert.deepEqual(watch.speeds, [42], "the first admitted value is not smoothed against rejected evidence");
  assert.equal(watch.motion().reason, "speed-only");
});

test("an implausible first GPS value cannot poison the later speed-only launch", () => {
  const watch = appWatch();
  watch.observe(200, 0);
  watch.observe(40, 100);
  assert.deepEqual(watch.speeds, []);
  watch.observe(42, 200);
  assert.deepEqual(watch.speeds, [42]);
  watch.observe(200, 300);
  watch.observe(43, 400);
  assert.deepEqual(watch.speeds, [42], "both neighbours of a garbage value are withheld");
  watch.observe(44, 500);
  assert.ok(watch.speeds.at(-1) > 42 && watch.speeds.at(-1) <= 44);
});

// The owner's September 24 session after wake: whole km/h every 100 ms, every
// fix with a 9,999.99 m radius (coordinate-free profile of the real report).
function ownerProfile() {
  const knots = [[0, 0], [10, 6], [20, 5], [30, 1], [40, 4], [54, 0], [60, 7], [70, 26], [80, 31], [90, 31], [100, 22], [110, 45], [120, 56], [122, 58]];
  const samples = [];
  for (let ms = 0; ms <= 122000; ms += 100) {
    const s = ms / 1000;
    const i = knots.findIndex(([at]) => at > s);
    const [a, va] = knots[Math.max(0, i - 1)], [b, vb] = knots[i === -1 ? knots.length - 1 : i];
    const v = b === a ? vb : va + (vb - va) * (s - a) / (b - a);
    samples.push({ atMs: ms, kmh: Math.round(v), accuracyM: 9999.99 });
  }
  return samples;
}

test("an unusable radius is judged for position only", () => {
  assert.equal(positionUnusable(9999.99), true);
  assert.equal(positionUnusable(251), true);
  assert.equal(positionUnusable(250), false);
  assert.equal(positionUnusable(null), false);
});

test("the owner's wake-up session is admitted as speed-only instead of a held zero", () => {
  let previous = null, admitted = 0, rejected = 0, displayed = 0;
  for (const sample of ownerProfile()) {
    const ok = positionUnusable(sample.accuracyM) && speedOnlyPlausible(previous, sample.kmh, sample.atMs);
    previous = { kmh: sample.kmh, atMs: sample.atMs };
    if (ok) { admitted++; displayed = sample.kmh; } else rejected++;
  }
  assert.equal(rejected, 1, "only the very first sample lacks a predecessor");
  assert.equal(displayed, 58);
  assert.ok(admitted > 1200);
});

test("a single garbage value fails against both neighbours; gaps and impossible jumps are refused", () => {
  const at = (kmh, atMs) => ({ kmh, atMs });
  assert.equal(speedOnlyPlausible(at(50, 0), 0, 100), false);
  assert.equal(speedOnlyPlausible(at(0, 100), 50, 200), false);
  assert.equal(speedOnlyPlausible(at(50, 0), 52, 100), true, "one quantization step");
  assert.equal(speedOnlyPlausible(at(50, 0), 55, 100), true, "within the 10 m/s² envelope");
  assert.equal(speedOnlyPlausible(at(50, 0), 58, 100), false);
  assert.equal(speedOnlyPlausible(at(50, 0), 50, 3100), false, "too long a gap to vouch for continuity");
  assert.equal(speedOnlyPlausible(null, 20, 100), false);
  for (const bad of [NaN, -1, 300, null]) assert.equal(speedOnlyPlausible(at(20, 0), bad, 100), false);
});

test("diagnostics name speed-only confidence separately from an unreliable fix", () => {
  const base = { gpsState: "live", gpsAgeMs: 100, accuracyM: 9999.99 };
  assert.equal(classifyGpsConfidence(base), "unreliable");
  assert.equal(classifyGpsConfidence({ ...base, speedOnly: true }), "speed-only");
  assert.equal(classifyGpsConfidence({ ...base, accuracyM: 4, speedOnly: true }), "precise");
  assert.equal(classifyGpsConfidence({ ...base, gpsAgeMs: 5000, speedOnly: true }), "stale");
});
