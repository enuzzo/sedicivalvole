export function inferViewportMode({ innerWidth, innerHeight, screenWidth, screenHeight }) {
  if (![innerWidth, innerHeight, screenWidth, screenHeight].every(Number.isFinite)) return "unknown";
  const widthRatio = innerWidth / screenWidth;
  const heightRatio = innerHeight / screenHeight;
  return widthRatio < 0.8 || heightRatio < 0.8 ? "split" : "expanded";
}

export function appendViewportHistory(history, snapshot, limit = 24) {
  const previous = history.at(-1);
  const unchanged = previous
    && previous.innerWidth === snapshot.innerWidth
    && previous.innerHeight === snapshot.innerHeight
    && previous.visualWidth === snapshot.visualWidth
    && previous.visualHeight === snapshot.visualHeight
    && previous.dpr === snapshot.dpr;
  if (unchanged) return history;
  return [...history, snapshot].slice(-limit);
}

export function createGpsTelemetry(startedAtMs = 0) {
  return {
    startedAtMs,
    lastCapturedAtMs: null,
    samples: 0,
    numericSpeedSamples: 0,
    nullSpeedSamples: 0,
    latestSpeedKmh: null,
    minimumSpeedKmh: null,
    maximumSpeedKmh: null,
    intervalsMs: [],
    accuraciesM: [],
  };
}

export function recordGpsSample(telemetry, { capturedAtMs, speedKmh, accuracyM }) {
  const numeric = Number.isFinite(speedKmh) && speedKmh >= 0;
  const interval = Number.isFinite(telemetry.lastCapturedAtMs)
    ? Math.max(0, capturedAtMs - telemetry.lastCapturedAtMs)
    : null;
  const accuraciesM = Number.isFinite(accuracyM)
    ? [...telemetry.accuraciesM, accuracyM].slice(-60)
    : telemetry.accuraciesM;
  const intervalsMs = interval == null
    ? telemetry.intervalsMs
    : [...telemetry.intervalsMs, interval].slice(-60);

  return {
    ...telemetry,
    lastCapturedAtMs: capturedAtMs,
    samples: telemetry.samples + 1,
    numericSpeedSamples: telemetry.numericSpeedSamples + (numeric ? 1 : 0),
    nullSpeedSamples: telemetry.nullSpeedSamples + (numeric ? 0 : 1),
    latestSpeedKmh: numeric ? speedKmh : telemetry.latestSpeedKmh,
    minimumSpeedKmh: numeric
      ? Math.min(telemetry.minimumSpeedKmh ?? speedKmh, speedKmh)
      : telemetry.minimumSpeedKmh,
    maximumSpeedKmh: numeric
      ? Math.max(telemetry.maximumSpeedKmh ?? speedKmh, speedKmh)
      : telemetry.maximumSpeedKmh,
    intervalsMs,
    accuraciesM,
  };
}

function percentile(values, quantile) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * quantile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function median(values) {
  return percentile(values, 0.5);
}

export function summarizeGpsTelemetry(telemetry) {
  return {
    samples: telemetry.samples,
    numericSpeedSamples: telemetry.numericSpeedSamples,
    nullSpeedSamples: telemetry.nullSpeedSamples,
    latestSpeedKmh: telemetry.latestSpeedKmh,
    minimumSpeedKmh: telemetry.minimumSpeedKmh,
    maximumSpeedKmh: telemetry.maximumSpeedKmh,
    medianIntervalMs: median(telemetry.intervalsMs),
    minimumAccuracyM: telemetry.accuraciesM.length ? Math.min(...telemetry.accuraciesM) : null,
    medianAccuracyM: median(telemetry.accuraciesM),
    latestAccuracyM: telemetry.accuraciesM.at(-1) ?? null,
  };
}

export function createFrameTelemetry(startedAtMs = 0) {
  return {
    startedAtMs,
    firstCapturedAtMs: null,
    lastCapturedAtMs: null,
    sampledFrames: 0,
    intervalCount: 0,
    totalIntervalMs: 0,
    maximumFrameMs: null,
    slowFramesOver34Ms: 0,
    verySlowFramesOver50Ms: 0,
    estimatedMissedTargetFrames: 0,
    targetFrameMs: null,
    renderer: null,
    canvasWidth: null,
    canvasHeight: null,
    intervalsMs: [],
    intervalWriteIndex: 0,
  };
}

export function recordFrameSample(telemetry, {
  capturedAtMs,
  targetFrameMs,
  renderer,
  canvasWidth,
  canvasHeight,
}) {
  if (!Number.isFinite(capturedAtMs)) return telemetry;
  const interval = Number.isFinite(telemetry.lastCapturedAtMs)
    ? Math.max(0, capturedAtMs - telemetry.lastCapturedAtMs)
    : null;
  const validTarget = Number.isFinite(targetFrameMs) && targetFrameMs > 0 ? targetFrameMs : null;

  telemetry.firstCapturedAtMs ??= capturedAtMs;
  telemetry.lastCapturedAtMs = capturedAtMs;
  telemetry.sampledFrames += 1;
  telemetry.targetFrameMs = validTarget ?? telemetry.targetFrameMs;
  telemetry.renderer = renderer ?? telemetry.renderer;
  telemetry.canvasWidth = Number.isFinite(canvasWidth) ? canvasWidth : telemetry.canvasWidth;
  telemetry.canvasHeight = Number.isFinite(canvasHeight) ? canvasHeight : telemetry.canvasHeight;

  if (interval != null) {
    telemetry.intervalCount += 1;
    telemetry.totalIntervalMs += interval;
    telemetry.maximumFrameMs = Math.max(telemetry.maximumFrameMs ?? interval, interval);
    telemetry.slowFramesOver34Ms += interval > 34 ? 1 : 0;
    telemetry.verySlowFramesOver50Ms += interval > 50 ? 1 : 0;
    telemetry.estimatedMissedTargetFrames += validTarget
      ? Math.max(0, Math.round(interval / validTarget) - 1)
      : 0;
    if (telemetry.intervalsMs.length < 300) {
      telemetry.intervalsMs.push(interval);
    } else {
      telemetry.intervalsMs[telemetry.intervalWriteIndex] = interval;
      telemetry.intervalWriteIndex = (telemetry.intervalWriteIndex + 1) % 300;
    }
  }

  return telemetry;
}

export function summarizeFrameTelemetry(telemetry) {
  const round = (value) => Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
  return {
    renderer: telemetry.renderer,
    canvasWidth: telemetry.canvasWidth,
    canvasHeight: telemetry.canvasHeight,
    sampledFrames: telemetry.sampledFrames,
    sampledDurationMs: round(telemetry.totalIntervalMs) ?? 0,
    targetFps: telemetry.targetFrameMs ? round(1000 / telemetry.targetFrameMs) : null,
    averageFps: telemetry.totalIntervalMs > 0
      ? round((telemetry.intervalCount * 1000) / telemetry.totalIntervalMs)
      : null,
    medianFrameMs: round(median(telemetry.intervalsMs)),
    p95FrameMs: round(percentile(telemetry.intervalsMs, 0.95)),
    maximumFrameMs: round(telemetry.maximumFrameMs),
    slowFramesOver34Ms: telemetry.slowFramesOver34Ms,
    verySlowFramesOver50Ms: telemetry.verySlowFramesOver50Ms,
    estimatedMissedTargetFrames: telemetry.estimatedMissedTargetFrames,
    retainedIntervalSamples: telemetry.intervalsMs.length,
  };
}

function normalizePerformancePhase(value) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : "unknown";
}

function createMemoryTelemetry() {
  return {
    samples: 0,
    jsHeapSupported: false,
    latestUsedJsHeapBytes: null,
    minimumUsedJsHeapBytes: null,
    maximumUsedJsHeapBytes: null,
    latestTotalJsHeapBytes: null,
    jsHeapLimitBytes: null,
    latestAudioDecodedPcmBytes: null,
    maximumAudioDecodedPcmBytes: null,
    latestAudioBankBytes: null,
  };
}

function ensurePerformancePhase(telemetry, phase, capturedAtMs) {
  const phaseId = normalizePerformancePhase(phase);
  telemetry.phases[phaseId] ??= {
    firstCapturedAtMs: capturedAtMs,
    lastCapturedAtMs: capturedAtMs,
    activeDurationMs: 0,
    continuitySegments: 0,
    lastObservedAtMs: null,
    frame: createFrameTelemetry(capturedAtMs),
    memory: createMemoryTelemetry(),
  };
  return telemetry.phases[phaseId];
}

export function createPhasePerformanceTelemetry(startedAtMs = 0) {
  return { startedAtMs, phases: {} };
}

export function recordPhaseFrame(telemetry, sample) {
  if (!Number.isFinite(sample?.capturedAtMs)) return telemetry;
  const phase = ensurePerformancePhase(telemetry, sample.phase, sample.capturedAtMs);
  phase.firstCapturedAtMs = Math.min(phase.firstCapturedAtMs, sample.capturedAtMs);
  phase.lastCapturedAtMs = Math.max(phase.lastCapturedAtMs, sample.capturedAtMs);
  const intervalMs = Number.isFinite(phase.lastObservedAtMs)
    ? Math.max(0, sample.capturedAtMs - phase.lastObservedAtMs)
    : null;
  // A phase can disappear and later re-enter. The time spent in another phase
  // is not a slow frame in this one, so begin a fresh continuity segment.
  const discontinuityMs = Math.max(250, (Number(sample.targetFrameMs) || 1000 / 60) * 8);
  if (intervalMs == null || intervalMs > discontinuityMs) {
    phase.frame.lastCapturedAtMs = null;
    phase.continuitySegments += 1;
  } else {
    phase.activeDurationMs += intervalMs;
  }
  phase.lastObservedAtMs = sample.capturedAtMs;
  recordFrameSample(phase.frame, sample);
  return telemetry;
}

export function recordPhaseMemorySample(telemetry, {
  phase: phaseId,
  capturedAtMs,
  usedJsHeapBytes,
  totalJsHeapBytes,
  jsHeapLimitBytes,
  audioDecodedPcmBytes,
  audioBankBytes,
}) {
  if (!Number.isFinite(capturedAtMs)) return telemetry;
  const phase = ensurePerformancePhase(telemetry, phaseId, capturedAtMs);
  const memory = phase.memory;
  phase.firstCapturedAtMs = Math.min(phase.firstCapturedAtMs, capturedAtMs);
  phase.lastCapturedAtMs = Math.max(phase.lastCapturedAtMs, capturedAtMs);
  memory.samples += 1;
  if (Number.isFinite(usedJsHeapBytes)) {
    memory.jsHeapSupported = true;
    memory.latestUsedJsHeapBytes = usedJsHeapBytes;
    memory.minimumUsedJsHeapBytes = Math.min(memory.minimumUsedJsHeapBytes ?? usedJsHeapBytes, usedJsHeapBytes);
    memory.maximumUsedJsHeapBytes = Math.max(memory.maximumUsedJsHeapBytes ?? usedJsHeapBytes, usedJsHeapBytes);
  }
  if (Number.isFinite(totalJsHeapBytes)) memory.latestTotalJsHeapBytes = totalJsHeapBytes;
  if (Number.isFinite(jsHeapLimitBytes)) memory.jsHeapLimitBytes = jsHeapLimitBytes;
  if (Number.isFinite(audioDecodedPcmBytes)) {
    memory.latestAudioDecodedPcmBytes = audioDecodedPcmBytes;
    memory.maximumAudioDecodedPcmBytes = Math.max(
      memory.maximumAudioDecodedPcmBytes ?? audioDecodedPcmBytes,
      audioDecodedPcmBytes,
    );
  }
  if (Number.isFinite(audioBankBytes)) memory.latestAudioBankBytes = audioBankBytes;
  return telemetry;
}

export function summarizePhasePerformanceTelemetry(telemetry) {
  return Object.fromEntries(Object.entries(telemetry.phases).map(([phaseId, phase]) => [phaseId, {
    sampledDurationMs: Math.max(0, Math.round(phase.activeDurationMs)),
    continuitySegments: phase.continuitySegments,
    frame: summarizeFrameTelemetry(phase.frame),
    memory: { ...phase.memory },
  }]));
}

export function appendConnectionHistory(history, snapshot, limit = 60) {
  const previous = history.at(-1);
  const comparableKeys = ["online", "type", "effectiveType", "downlinkMbps", "roundTripTimeMs", "saveData"];
  const unchanged = previous && comparableKeys.every((key) => previous[key] === snapshot[key]);
  if (unchanged) return history;
  return [...history, snapshot].slice(-limit);
}

export const DRIVE_TRACE_INTERVAL_MS = 2000;
export const DRIVE_TRACE_SAMPLE_LIMIT = 300;
export const DIAGNOSTIC_MAX_REQUEST_BODY_BYTES = 1966080;
export const DRIVE_TRACE_FIELDS = [
  "t", "speed", "gps", "gpsAge", "gpsState", "accuracy", "rate", "source", "input", "energy",
  "bpm", "fps", "p95Frame", "audio", "audioPeak", "visual", "music", "section", "family", "rhythm", "rhythmTransition", "takes", "rhythms",
  "bank", "gpsConfidence", "motion", "online", "net", "rtt", "visibility",
];

const rounded = (value, precision = 2) => {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

function addDuration(totals, key, durationMs) {
  const safeKey = typeof key === "string" && key ? key : "unknown";
  totals[safeKey] = (totals[safeKey] ?? 0) + durationMs;
}

export function createDriveTelemetry(startedAtMs = 0) {
  return {
    startedAtMs,
    lastCapturedAtMs: null,
    lastSpeedKmh: null,
    totalSamples: 0,
    sampleLimit: DRIVE_TRACE_SAMPLE_LIMIT,
    discardedSamples: 0,
    totalDistanceKm: 0,
    movingDurationMs: 0,
    stationaryDurationMs: 0,
    sourceDurationsMs: {},
    inputDurationsMs: {},
    maximumSpeedKmh: null,
    peakAccelerationKmhPerSecond: null,
    peakDecelerationKmhPerSecond: null,
    minimumGpsAccuracyM: null,
    exposure: {
      visuals: new Set(),
      music: new Set(),
      sections: new Set(),
      families: new Set(),
      takePairs: new Set(),
      rhythmPairs: new Set(),
    },
    samples: [],
  };
}

export function recordDriveTelemetrySample(telemetry, sample, limit = DRIVE_TRACE_SAMPLE_LIMIT) {
  if (!Number.isFinite(sample?.capturedAtMs)) return telemetry;
  const speedKmh = Math.max(0, Number(sample.speedKmh) || 0);
  const intervalMs = Number.isFinite(telemetry.lastCapturedAtMs)
    ? Math.max(0, sample.capturedAtMs - telemetry.lastCapturedAtMs)
    : 0;
  const rateKmhPerSecond = intervalMs > 0 && Number.isFinite(telemetry.lastSpeedKmh)
    ? (speedKmh - telemetry.lastSpeedKmh) / (intervalMs / 1000)
    : 0;
  const averageSpeedKmh = Number.isFinite(telemetry.lastSpeedKmh)
    ? (telemetry.lastSpeedKmh + speedKmh) / 2
    : speedKmh;

  telemetry.totalSamples += 1;
  telemetry.sampleLimit = limit;
  telemetry.totalDistanceKm += averageSpeedKmh * intervalMs / 3600000;
  telemetry.movingDurationMs += averageSpeedKmh >= 1 ? intervalMs : 0;
  telemetry.stationaryDurationMs += averageSpeedKmh < 1 ? intervalMs : 0;
  addDuration(telemetry.sourceDurationsMs, sample.source, intervalMs);
  addDuration(telemetry.inputDurationsMs, sample.driveInput, intervalMs);
  telemetry.maximumSpeedKmh = Math.max(telemetry.maximumSpeedKmh ?? speedKmh, speedKmh);
  telemetry.peakAccelerationKmhPerSecond = Math.max(
    telemetry.peakAccelerationKmhPerSecond ?? rateKmhPerSecond,
    rateKmhPerSecond,
  );
  telemetry.peakDecelerationKmhPerSecond = Math.min(
    telemetry.peakDecelerationKmhPerSecond ?? rateKmhPerSecond,
    rateKmhPerSecond,
  );
  if (Number.isFinite(sample.accuracyM)) {
    telemetry.minimumGpsAccuracyM = Math.min(
      telemetry.minimumGpsAccuracyM ?? sample.accuracyM,
      sample.accuracyM,
    );
  }
  if (typeof sample.visualId === "string" && sample.visualId) telemetry.exposure.visuals.add(sample.visualId);
  if (typeof sample.musicId === "string" && sample.musicId) telemetry.exposure.music.add(sample.musicId);
  if (typeof sample.audioSection === "string" && sample.audioSection) telemetry.exposure.sections.add(sample.audioSection);
  if (typeof sample.audioFamily === "string" && sample.audioFamily) telemetry.exposure.families.add(sample.audioFamily);
  if (typeof sample.audioRhythm === "string" && sample.audioRhythm) telemetry.exposure.rhythmPairs.add(sample.audioRhythm);
  if (Array.isArray(sample.audioTakes) && sample.audioTakes.length) {
    telemetry.exposure.takePairs.add(sample.audioTakes.map(String).join("+"));
  }

  const retainedSample = {
    t: rounded((sample.capturedAtMs - telemetry.startedAtMs) / 1000, 1),
    speed: rounded(speedKmh, 1),
    gps: rounded(sample.rawGpsSpeedKmh, 1),
    gpsAge: rounded(sample.gpsAgeMs, 0),
    gpsState: sample.gpsState ?? null,
    accuracy: rounded(sample.accuracyM, 1),
    rate: rounded(rateKmhPerSecond, 2),
    source: sample.source ?? "unknown",
    input: sample.driveInput ?? "unknown",
    energy: rounded(sample.energy, 3),
    bpm: rounded(sample.bpm, 1),
    fps: rounded(sample.averageFps, 1),
    p95Frame: rounded(sample.p95FrameMs, 1),
    audio: rounded(sample.audioLevel, 3),
    audioPeak: rounded(sample.audioPeak, 3),
    visual: typeof sample.visualId === "string" ? sample.visualId.slice(0, 32) : null,
    music: typeof sample.musicId === "string" ? sample.musicId.slice(0, 32) : null,
    section: typeof sample.audioSection === "string"
      ? sample.audioSection.slice(0, 32)
      : Number.isFinite(sample.audioSection) ? sample.audioSection : null,
    family: typeof sample.audioFamily === "string" ? sample.audioFamily.slice(0, 32) : null,
    rhythm: typeof sample.audioRhythm === "string" ? sample.audioRhythm.slice(0, 48) : null,
    rhythmTransition: typeof sample.audioRhythmTransition === "string"
      ? sample.audioRhythmTransition.slice(0, 24)
      : null,
    takes: Array.isArray(sample.audioTakes) ? sample.audioTakes.slice(0, 2) : [],
    rhythms: Array.isArray(sample.audioRhythms)
      ? sample.audioRhythms.map((value) => String(value).slice(0, 48)).slice(0, 2)
      : [],
    bank: typeof sample.audioBankLoaded === "boolean" ? sample.audioBankLoaded : null,
    gpsConfidence: typeof sample.gpsConfidence === "string" ? sample.gpsConfidence : null,
    motion: sample.motionPhase ?? null,
    online: typeof sample.online === "boolean" ? sample.online : null,
    net: sample.effectiveType ?? null,
    rtt: rounded(sample.roundTripTimeMs, 0),
    visibility: sample.visibility ?? null,
  };
  telemetry.samples.push(retainedSample);
  if (telemetry.samples.length > limit) {
    const overflow = telemetry.samples.length - limit;
    telemetry.samples.splice(0, overflow);
    telemetry.discardedSamples += overflow;
  }
  telemetry.lastCapturedAtMs = sample.capturedAtMs;
  telemetry.lastSpeedKmh = speedKmh;
  return telemetry;
}

function roundDurationTotals(totals) {
  return Object.fromEntries(
    Object.entries(totals).map(([key, durationMs]) => [key, Math.round(durationMs)]),
  );
}

export function summarizeDriveTelemetry(telemetry, generatedAtMs = telemetry.lastCapturedAtMs) {
  const durationMs = Number.isFinite(generatedAtMs)
    ? Math.max(0, generatedAtMs - telemetry.startedAtMs)
    : 0;
  const retainedDurationSeconds = telemetry.samples.length > 1
    ? Math.max(0, telemetry.samples.at(-1).t - telemetry.samples[0].t)
    : 0;
  return {
    samplingIntervalMs: DRIVE_TRACE_INTERVAL_MS,
    sampleLimit: telemetry.sampleLimit,
    totalSamples: telemetry.totalSamples,
    retainedSamples: telemetry.samples.length,
    discardedSamples: telemetry.discardedSamples,
    sessionDurationMs: Math.round(durationMs),
    retainedDurationMs: Math.round(retainedDurationSeconds * 1000),
    estimatedDistanceKm: rounded(telemetry.totalDistanceKm, 3),
    movingDurationMs: Math.round(telemetry.movingDurationMs),
    stationaryDurationMs: Math.round(telemetry.stationaryDurationMs),
    maximumSpeedKmh: rounded(telemetry.maximumSpeedKmh, 1),
    peakAccelerationKmhPerSecond: rounded(telemetry.peakAccelerationKmhPerSecond, 2),
    peakDecelerationKmhPerSecond: rounded(telemetry.peakDecelerationKmhPerSecond, 2),
    minimumGpsAccuracyM: rounded(telemetry.minimumGpsAccuracyM, 1),
    sourceDurationsMs: roundDurationTotals(telemetry.sourceDurationsMs),
    inputDurationsMs: roundDurationTotals(telemetry.inputDurationsMs),
    exposure: Object.fromEntries(Object.entries(telemetry.exposure).map(([key, values]) => [key, {
      count: values.size,
      values: [...values],
    }])),
  };
}

export function createDriveTelemetryReport(telemetry, generatedAtMs = telemetry.lastCapturedAtMs) {
  return {
    summary: summarizeDriveTelemetry(telemetry, generatedAtMs),
    sampleFields: DRIVE_TRACE_FIELDS,
    fieldLegend: {
      t: "seconds since recorder start",
      speed: "displayed speed in km/h",
      gps: "latest raw GPS speed in km/h",
      gpsAge: "milliseconds since the latest GPS sample",
      accuracy: "GPS accuracy radius in metres",
      rate: "displayed-speed change in km/h per second",
      fps: "aggregate average frames per second",
      p95Frame: "aggregate p95 frame time in milliseconds",
      audio: "normalized output level",
      audioPeak: "normalized output peak",
      visual: "active visual environment",
      music: "active score",
      family: "active JUNCTION musical family",
      rhythm: "active JUNCTION rhythmic identity",
      takes: "active JUNCTION take pair",
      rhythms: "active JUNCTION rhythm pair",
      bank: "whether the sampled bank was ready",
      gpsConfidence: "coordinate-free GPS confidence class",
      rtt: "network round-trip estimate in milliseconds",
    },
    samples: telemetry.samples.map((sample) => DRIVE_TRACE_FIELDS.map((field) => sample[field])),
  };
}

export function classifyGpsConfidence({ gpsState, gpsAgeMs, accuracyM }) {
  if (gpsState !== "live") return "unavailable";
  if (Number.isFinite(gpsAgeMs) && gpsAgeMs > 3000) return "stale";
  if (Number.isFinite(accuracyM) && accuracyM > 250) return "unreliable";
  if (Number.isFinite(accuracyM) && accuracyM <= 10) return "precise";
  return "usable";
}

function serializedRequestUtf8Bytes(report) {
  return new TextEncoder().encode(JSON.stringify({ schema: report.schema, report })).byteLength;
}

export function fitDiagnosticReportForTransport(report, maximumBytes = DIAGNOSTIC_MAX_REQUEST_BODY_BYTES) {
  const trimmingTargetBytes = Math.max(0, maximumBytes - 8192);
  const originalSamples = report.flightRecorder?.samples?.length ?? 0;
  const originalEvents = report.events?.length ?? 0;
  const originalRuntimeIssues = report.runtimeIssues?.length ?? 0;
  const fitted = {
    ...report,
    flightRecorder: report.flightRecorder ? {
      ...report.flightRecorder,
      summary: { ...report.flightRecorder.summary },
      samples: [...report.flightRecorder.samples],
    } : null,
    events: [...(report.events ?? [])],
    runtimeIssues: [...(report.runtimeIssues ?? [])],
    transport: {
      maximumRequestBodyBytes: maximumBytes,
      trimmingTargetBytes,
      originalSamples,
      originalEvents,
      originalRuntimeIssues,
      requestBodyBytes: 0,
    },
  };

  while (serializedRequestUtf8Bytes(fitted) > trimmingTargetBytes && fitted.events.length > 40) {
    fitted.events.splice(0, Math.min(20, fitted.events.length - 40));
  }
  while (serializedRequestUtf8Bytes(fitted) > trimmingTargetBytes && fitted.runtimeIssues.length > 4) {
    fitted.runtimeIssues.splice(0, Math.min(4, fitted.runtimeIssues.length - 4));
  }
  while (serializedRequestUtf8Bytes(fitted) > trimmingTargetBytes && fitted.flightRecorder?.samples.length > 60) {
    fitted.flightRecorder.samples.splice(0, Math.min(20, fitted.flightRecorder.samples.length - 60));
  }
  while (serializedRequestUtf8Bytes(fitted) > trimmingTargetBytes && fitted.events.length > 0) {
    fitted.events.splice(0, Math.min(10, fitted.events.length));
  }
  while (serializedRequestUtf8Bytes(fitted) > trimmingTargetBytes && fitted.runtimeIssues.length > 0) {
    fitted.runtimeIssues.splice(0, Math.min(2, fitted.runtimeIssues.length));
  }
  while (serializedRequestUtf8Bytes(fitted) > trimmingTargetBytes && fitted.flightRecorder?.samples.length > 1) {
    fitted.flightRecorder.samples.splice(0, Math.min(10, fitted.flightRecorder.samples.length - 1));
  }

  fitted.transport.transmittedSamples = fitted.flightRecorder?.samples.length ?? 0;
  fitted.transport.transmittedEvents = fitted.events.length;
  fitted.transport.transmittedRuntimeIssues = fitted.runtimeIssues.length;
  for (let pass = 0; pass < 3; pass += 1) {
    const measuredBytes = serializedRequestUtf8Bytes(fitted);
    if (measuredBytes === fitted.transport.requestBodyBytes) break;
    fitted.transport.requestBodyBytes = measuredBytes;
  }
  return fitted;
}
