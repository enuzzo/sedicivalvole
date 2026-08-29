import assert from "node:assert/strict";
import test from "node:test";
import {
  appendConnectionHistory,
  appendViewportHistory,
  classifyGpsConfidence,
  createDriveTelemetry,
  createDriveTelemetryReport,
  DIAGNOSTIC_MAX_REQUEST_BODY_BYTES,
  DRIVE_TRACE_FIELDS,
  fitDiagnosticReportForTransport,
  createFrameTelemetry,
  createPhasePerformanceTelemetry,
  createGpsTelemetry,
  inferViewportMode,
  recordDriveTelemetrySample,
  recordFrameSample,
  recordPhaseFrame,
  recordPhaseMemorySample,
  recordGpsSample,
  summarizeFrameTelemetry,
  summarizePhasePerformanceTelemetry,
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

test("frame telemetry reuses one fixed interval ring after 300 samples", () => {
  const telemetry = createFrameTelemetry(0);
  for (let frame = 0; frame <= 300; frame += 1) {
    recordFrameSample(telemetry, {
      capturedAtMs: frame * 16,
      targetFrameMs: 1000 / 60,
      renderer: "Canvas2D",
    });
  }
  const ring = telemetry.intervalsMs;
  recordFrameSample(telemetry, {
    capturedAtMs: 301 * 16,
    targetFrameMs: 1000 / 60,
    renderer: "Canvas2D",
  });

  assert.equal(telemetry.intervalsMs, ring);
  assert.equal(telemetry.intervalsMs.length, 300);
  assert.equal(telemetry.intervalWriteIndex, 1);
  assert.equal(summarizeFrameTelemetry(telemetry).p95FrameMs, 16);
});

test("performance telemetry separates visual and diagnostic phases with bounded memory summaries", () => {
  const telemetry = createPhasePerformanceTelemetry(0);
  for (const capturedAtMs of [0, 17, 34]) {
    recordPhaseFrame(telemetry, {
      phase: "drive:aperture:junction:visual",
      capturedAtMs,
      targetFrameMs: 1000 / 60,
      renderer: "WebGL2",
      canvasWidth: 773,
      canvasHeight: 601,
    });
  }
  recordPhaseMemorySample(telemetry, {
    phase: "drive:aperture:junction:visual",
    capturedAtMs: 2000,
    usedJsHeapBytes: 12_000_000,
    totalJsHeapBytes: 18_000_000,
    jsHeapLimitBytes: 2_000_000_000,
    audioDecodedPcmBytes: 24_000_000,
    audioBankBytes: 25_000_000,
  });
  recordPhaseFrame(telemetry, {
    phase: "drive:aperture:junction:diagnostics",
    capturedAtMs: 2050,
    targetFrameMs: 1000 / 60,
    renderer: "WebGL2",
    canvasWidth: 773,
    canvasHeight: 601,
  });
  const summary = summarizePhasePerformanceTelemetry(telemetry);

  assert.deepEqual(Object.keys(summary), [
    "drive:aperture:junction:visual",
    "drive:aperture:junction:diagnostics",
  ]);
  assert.equal(summary["drive:aperture:junction:visual"].frame.sampledFrames, 3);
  assert.equal(summary["drive:aperture:junction:visual"].memory.maximumUsedJsHeapBytes, 12_000_000);
  assert.equal(summary["drive:aperture:junction:visual"].memory.maximumAudioDecodedPcmBytes, 24_000_000);
  assert.equal(summary["drive:aperture:junction:diagnostics"].memory.jsHeapSupported, false);
});

test("phase telemetry treats re-entry as a new segment instead of a slow frame", () => {
  const telemetry = createPhasePerformanceTelemetry(0);
  for (const capturedAtMs of [0, 17, 34, 5000, 5017]) {
    recordPhaseFrame(telemetry, {
      phase: "drive:aperture:junction:visual:morph",
      capturedAtMs,
      targetFrameMs: 1000 / 60,
      renderer: "WebGL2",
    });
  }
  const phase = summarizePhasePerformanceTelemetry(telemetry)["drive:aperture:junction:visual:morph"];
  assert.equal(phase.continuitySegments, 2);
  assert.equal(phase.sampledDurationMs, 51);
  assert.equal(phase.frame.maximumFrameMs, 17);
  assert.equal(phase.frame.slowFramesOver34Ms, 0);
});

test("GPS confidence isolates stale and implausibly inaccurate samples", () => {
  assert.equal(classifyGpsConfidence({ gpsState: "not tested", gpsAgeMs: null, accuracyM: null }), "unavailable");
  assert.equal(classifyGpsConfidence({ gpsState: "live", gpsAgeMs: 4000, accuracyM: 2 }), "stale");
  assert.equal(classifyGpsConfidence({ gpsState: "live", gpsAgeMs: 100, accuracyM: 10000 }), "unreliable");
  assert.equal(classifyGpsConfidence({ gpsState: "live", gpsAgeMs: 100, accuracyM: 2 }), "precise");
  assert.equal(classifyGpsConfidence({ gpsState: "live", gpsAgeMs: 100, accuracyM: 25 }), "usable");
});

test("connection history deduplicates stable readings and keeps changes", () => {
  const first = { capturedAt: "one", online: true, effectiveType: "4g", downlinkMbps: 10, roundTripTimeMs: 50 };
  const unchanged = { ...first, capturedAt: "two" };
  const offline = { ...first, capturedAt: "three", online: false };

  assert.equal(appendConnectionHistory([first], unchanged).length, 1);
  assert.deepEqual(appendConnectionHistory([first], offline), [first, offline]);
});

test("drive telemetry retains a bounded trace while preserving full-session aggregates", () => {
  const telemetry = createDriveTelemetry(1000);
  const baseSample = {
    rawGpsSpeedKmh: null,
    gpsAgeMs: null,
    gpsState: "not tested",
    accuracyM: null,
    source: "DEMO",
    driveInput: "auto",
    energy: 0,
    bpm: 72,
    averageFps: 45,
    p95FrameMs: 22,
    audioLevel: 0.1,
    audioSection: "OPEN",
    audioFamily: "signal",
    audioRhythm: "open-2-1",
    audioRhythmTransition: "fade-in",
    audioTakes: [3, 8],
    audioRhythms: ["open-2-1", "open-2-1"],
    audioBankLoaded: true,
    visualId: "aperture",
    musicId: "junction",
    gpsConfidence: "precise",
    motionPhase: "steady",
    online: true,
    effectiveType: "4g",
    roundTripTimeMs: 50,
    visibility: "visible",
  };
  recordDriveTelemetrySample(telemetry, { ...baseSample, capturedAtMs: 1000, speedKmh: 0 }, 2);
  recordDriveTelemetrySample(telemetry, { ...baseSample, capturedAtMs: 3000, speedKmh: 36 }, 2);
  recordDriveTelemetrySample(telemetry, { ...baseSample, capturedAtMs: 5000, speedKmh: 36 }, 2);
  const report = createDriveTelemetryReport(telemetry, 5000);

  assert.equal(report.summary.totalSamples, 3);
  assert.equal(report.summary.retainedSamples, 2);
  assert.equal(report.summary.discardedSamples, 1);
  assert.equal(report.summary.sampleLimit, 2);
  assert.equal(report.summary.sessionDurationMs, 4000);
  assert.equal(report.summary.retainedDurationMs, 2000);
  assert.equal(report.summary.estimatedDistanceKm, 0.03);
  assert.equal(report.summary.movingDurationMs, 4000);
  assert.equal(report.summary.peakAccelerationKmhPerSecond, 18);
  assert.equal(report.samples[0][DRIVE_TRACE_FIELDS.indexOf("rate")], 18);
  assert.equal(report.samples[1][DRIVE_TRACE_FIELDS.indexOf("speed")], 36);
  assert.equal(report.samples[1][DRIVE_TRACE_FIELDS.indexOf("section")], "OPEN");
  assert.equal(report.samples[1][DRIVE_TRACE_FIELDS.indexOf("rhythmTransition")], "fade-in");
  assert.equal(report.summary.exposure.families.count, 1);
  assert.deepEqual(report.summary.exposure.takePairs.values, ["3+8"]);
  assert.deepEqual(report.summary.exposure.rhythmPairs.values, ["open-2-1"]);
  assert.deepEqual(
    report.samples[1][DRIVE_TRACE_FIELDS.indexOf("rhythms")],
    ["open-2-1", "open-2-1"],
  );
  assert.equal(JSON.stringify(report).includes("latitude"), false);
  assert.equal(JSON.stringify(report).includes("longitude"), false);
});

test("diagnostic transport fitting preserves recent evidence within the request limit", () => {
  const noisyValue = "x".repeat(1200);
  const report = {
    schema: "sedicivalvole.tesla-diagnostic.v3",
    flightRecorder: {
      summary: { totalSamples: 300 },
      samples: Array.from({ length: 300 }, (_, index) => [index, noisyValue]),
    },
    events: Array.from({ length: 240 }, (_, index) => ({ index, detail: noisyValue })),
    runtimeIssues: Array.from({ length: 24 }, (_, index) => ({ index, stack: noisyValue })),
  };
  const fitted = fitDiagnosticReportForTransport(report, 160000);
  const bytes = new TextEncoder().encode(JSON.stringify({ schema: fitted.schema, report: fitted })).byteLength;

  assert.ok(bytes <= 160000);
  assert.equal(fitted.events.at(-1).index, 239);
  assert.equal(fitted.runtimeIssues.at(-1).index, 23);
  assert.equal(fitted.flightRecorder.samples.at(-1)[0], 299);
  assert.ok(fitted.transport.transmittedEvents < fitted.transport.originalEvents);
  assert.ok(fitted.transport.transmittedSamples <= fitted.transport.originalSamples);
  assert.equal(fitted.transport.requestBodyBytes, bytes);
  assert.equal(DIAGNOSTIC_MAX_REQUEST_BODY_BYTES, 1966080);
});

test("diagnostic transport fitting rotates oldest evidence from an oversized drive", () => {
  const noisyValue = "telemetry".repeat(1000);
  const report = {
    schema: "sedicivalvole.tesla-diagnostic.v3",
    flightRecorder: {
      summary: { totalSamples: 300, discardedSamples: 900 },
      samples: Array.from({ length: 300 }, (_, index) => [index, noisyValue]),
    },
    events: Array.from({ length: 240 }, (_, index) => ({ index, detail: noisyValue })),
    runtimeIssues: Array.from({ length: 24 }, (_, index) => ({ index, stack: noisyValue })),
  };

  const fitted = fitDiagnosticReportForTransport(report);
  const requestBytes = new TextEncoder()
    .encode(JSON.stringify({ schema: fitted.schema, report: fitted }))
    .byteLength;

  assert.ok(requestBytes <= DIAGNOSTIC_MAX_REQUEST_BODY_BYTES);
  assert.equal(fitted.transport.requestBodyBytes, requestBytes);
  assert.equal(fitted.events.at(-1).index, 239);
  assert.equal(fitted.runtimeIssues.at(-1)?.index, 23);
  assert.equal(fitted.flightRecorder.samples.at(-1)[0], 299);
  assert.ok(fitted.transport.transmittedEvents < fitted.transport.originalEvents);
  assert.ok(fitted.transport.transmittedSamples < fitted.transport.originalSamples);
  assert.equal(fitted.flightRecorder.summary.totalSamples, 300);
  assert.equal(fitted.flightRecorder.summary.discardedSamples, 900);
});
