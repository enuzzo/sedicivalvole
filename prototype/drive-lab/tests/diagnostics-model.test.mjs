import assert from "node:assert/strict";
import test from "node:test";
import {
  appendViewportHistory,
  createGpsTelemetry,
  inferViewportMode,
  recordGpsSample,
  summarizeGpsTelemetry,
} from "../src/diagnostics-model.js";

test("identifies the photographed Tesla viewport as split view", () => {
  assert.equal(inferViewportMode({ innerWidth: 773, innerHeight: 601, screenWidth: 1254, screenHeight: 784 }), "split");
  assert.equal(inferViewportMode({ innerWidth: 1220, innerHeight: 760, screenWidth: 1254, screenHeight: 784 }), "expanded");
});

test("viewport history keeps only meaningful size changes", () => {
  const first = { innerWidth: 773, innerHeight: 601, visualWidth: 773, visualHeight: 601, dpr: 1.53 };
  const second = { ...first, innerWidth: 1200, visualWidth: 1200 };
  assert.equal(appendViewportHistory([first], { ...first }, 4).length, 1);
  assert.deepEqual(appendViewportHistory([first], second, 4), [first, second]);
});

test("GPS telemetry counts numeric and null speed without coordinates", () => {
  let telemetry = createGpsTelemetry(1000);
  telemetry = recordGpsSample(telemetry, { capturedAtMs: 1100, speedKmh: null, accuracyM: 10000 });
  telemetry = recordGpsSample(telemetry, { capturedAtMs: 2100, speedKmh: 42, accuracyM: 18 });
  telemetry = recordGpsSample(telemetry, { capturedAtMs: 3100, speedKmh: 55, accuracyM: 12 });
  const summary = summarizeGpsTelemetry(telemetry);

  assert.equal(summary.samples, 3);
  assert.equal(summary.numericSpeedSamples, 2);
  assert.equal(summary.nullSpeedSamples, 1);
  assert.equal(summary.latestSpeedKmh, 55);
  assert.equal(summary.minimumAccuracyM, 12);
  assert.equal(summary.medianIntervalMs, 1000);
  assert.equal("latitude" in summary, false);
  assert.equal("longitude" in summary, false);
});
