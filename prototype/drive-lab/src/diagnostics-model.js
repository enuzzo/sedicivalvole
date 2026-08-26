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

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
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
