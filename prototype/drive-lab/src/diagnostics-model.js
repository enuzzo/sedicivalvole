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
    telemetry.intervalsMs = [...telemetry.intervalsMs, interval].slice(-300);
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
    sampledDurationMs: Number.isFinite(telemetry.firstCapturedAtMs) && Number.isFinite(telemetry.lastCapturedAtMs)
      ? round(telemetry.lastCapturedAtMs - telemetry.firstCapturedAtMs)
      : 0,
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

export function appendConnectionHistory(history, snapshot, limit = 60) {
  const previous = history.at(-1);
  const comparableKeys = ["online", "type", "effectiveType", "downlinkMbps", "roundTripTimeMs", "saveData"];
  const unchanged = previous && comparableKeys.every((key) => previous[key] === snapshot[key]);
  if (unchanged) return history;
  return [...history, snapshot].slice(-limit);
}
