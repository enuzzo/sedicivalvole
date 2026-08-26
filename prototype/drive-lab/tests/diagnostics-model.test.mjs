import assert from "node:assert/strict";
import test from "node:test";
import {
  appendConnectionHistory,
  appendViewportHistory,
  createFrameTelemetry,
  createGpsTelemetry,
  inferViewportMode,
  recordFrameSample,
  recordGpsSample,
  summarizeFrameTelemetry,
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

test("frame telemetry aggregates pacing without retaining every frame", () => {
  const telemetry = createFrameTelemetry(0);
  const frameTimes = [100, 123, 146, 180, 234, 257];
  for (const capturedAtMs of frameTimes) {
    recordFrameSample(telemetry, {
      capturedAtMs,
      targetFrameMs: 1000 / 45,
      renderer: "WebGL2",
      canvasWidth: 966,
      canvasHeight: 751,
    });
  }
  const summary = summarizeFrameTelemetry(telemetry);

  assert.equal(summary.sampledFrames, 6);
  assert.equal(summary.renderer, "WebGL2");
  assert.equal(summary.canvasWidth, 966);
  assert.equal(summary.slowFramesOver34Ms, 1);
  assert.equal(summary.verySlowFramesOver50Ms, 1);
  assert.equal(summary.maximumFrameMs, 54);
  assert.equal(summary.retainedIntervalSamples, 5);
  assert.ok(summary.averageFps > 31 && summary.averageFps < 32);
  assert.ok(summary.p95FrameMs > 49);
});

test("connection history deduplicates stable readings and keeps changes", () => {
  const first = { capturedAt: "one", online: true, effectiveType: "4g", downlinkMbps: 10, roundTripTimeMs: 50 };
  const unchanged = { ...first, capturedAt: "two" };
  const offline = { ...first, capturedAt: "three", online: false };

  assert.equal(appendConnectionHistory([first], unchanged).length, 1);
  assert.deepEqual(appendConnectionHistory([first], offline), [first, offline]);
});
