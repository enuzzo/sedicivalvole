import { ATLAS_MOTION_DELTA_THRESHOLD_KMH, ATLAS_MOVING_SPEED_THRESHOLD_KMH, ATLAS_SPEED_BANDS } from './atlas-model.js';

export const SESSION_GAP_MS = 5000;

export const chartAltitudeSource = sample => sample?.heightContainsGap ? null : Number.isFinite(sample?.altitudeM) ? 'gps'
  : Number.isFinite(sample?.groundElevationM) ? 'map' : null;
export const chartAltitudeValue = sample => sample?.heightContainsGap ? null : Number.isFinite(sample?.altitudeM) ? sample.altitudeM
  : Number.isFinite(sample?.groundElevationM) ? sample.groundElevationM : null;

// A height trace needs local headroom, including at zero or below sea level.
export function altitudeTraceRange(samples) {
  const heights = samples.map(chartAltitudeValue).filter(Number.isFinite);
  if (!heights.length) return { minimum: -5, maximum: 5 };
  const low = Math.min(...heights), high = Math.max(...heights);
  const padding = Math.max(5, (high - low) * .1);
  return { minimum: Math.floor((low - padding) / 5) * 5,
    maximum: Math.ceil((high + padding) / 5) * 5 };
}
export function createSessionStats() {
  return { firstAtMs: null, last: null, observedMs: 0, movingMs: 0, stoppedMs: 0,
    distanceM: 0, peakKmh: null, stops: 0, speedBandsMs: ATLAS_SPEED_BANDS.map(() => 0),
    headingMs: Array(8).fill(0), elevationGainM: 0, elevationLossM: 0,
    elevationObservedMs: 0, altitudeAnchor: null, motionAnchorKmh: null,
    accelerationGainKmh: 0, brakingLossKmh: 0, motionObservedMs: 0 };
}

// Accumulate before chart compaction. Long GPS gaps are unknown, never a stop.
export function observeSessionStats(previous, sample) {
  const state = previous ?? createSessionStats();
  if (!Number.isFinite(sample?.capturedAtMs) || !Number.isFinite(sample.speedKmh)
    || sample.speedKmh < 0 || sample.speedKmh > 250
    || !Number.isFinite(sample.accuracyM) || sample.accuracyM > 50
    || (state.last && sample.capturedAtMs <= state.last.capturedAtMs)) return state;
  const next = { ...state, firstAtMs: state.firstAtMs ?? sample.capturedAtMs, last: { ...sample },
    peakKmh: Math.max(state.peakKmh ?? 0, sample.speedKmh),
    speedBandsMs: [...state.speedBandsMs], headingMs: [...state.headingMs] };
  const dt = state.last ? sample.capturedAtMs - state.last.capturedAtMs : 0;
  const connected = dt > 0 && dt <= SESSION_GAP_MS;
  const motionSpeed = sample.speedKmh < ATLAS_MOVING_SPEED_THRESHOLD_KMH ? 0 : sample.speedKmh;
  const plausibleMotion = connected && Math.abs(sample.speedKmh - state.last.speedKmh) / (3.6 * dt / 1000) <= 12;
  if (!plausibleMotion) next.motionAnchorKmh = motionSpeed;
  else {
    next.motionObservedMs += dt;
    const anchor = state.motionAnchorKmh ?? (state.last.speedKmh < ATLAS_MOVING_SPEED_THRESHOLD_KMH ? 0 : state.last.speedKmh);
    const delta = motionSpeed - anchor;
    // Accumulate slow ramps across callbacks; suppress sub-threshold speed jitter.
    if (Math.abs(delta) >= ATLAS_MOTION_DELTA_THRESHOLD_KMH) {
      next[delta > 0 ? 'accelerationGainKmh' : 'brakingLossKmh'] += Math.abs(delta);
      next.motionAnchorKmh = motionSpeed;
    }
  }
  if (connected) {
    const speed = (state.last.speedKmh + sample.speedKmh) / 2;
    next.observedMs += dt;
    const moving = speed >= 2;
    next[moving ? 'movingMs' : 'stoppedMs'] += dt;
    if (moving) next.distanceM += speed / 3.6 * dt / 1000;
    if (state.last.speedKmh >= 2 && sample.speedKmh < 2) next.stops += 1;
    const band = ATLAS_SPEED_BANDS.findIndex(b => speed >= b.minimumKmh && speed < b.maximumKmh);
    if (band >= 0) next.speedBandsMs[band] += dt;
    if (moving && Number.isFinite(sample.heading)) next.headingMs[Math.floor(((sample.heading % 360 + 382.5) % 360) / 45)] += dt;
  }
  const altitudeValid = Number.isFinite(sample.altitudeM) && Number.isFinite(sample.altitudeAccuracyM)
    && sample.altitudeAccuracyM >= 0 && sample.altitudeAccuracyM <= 15;
  if (!altitudeValid || !connected) next.altitudeAnchor = altitudeValid ? sample.altitudeM : null;
  else if (state.altitudeAnchor == null) next.altitudeAnchor = sample.altitudeM;
  else {
    next.elevationObservedMs += dt;
    const delta = sample.altitudeM - state.altitudeAnchor;
    const threshold = Math.max(4, sample.altitudeAccuracyM);
    if (Math.abs(delta) >= threshold) {
      // Reject implausible altitude jumps instead of counting GPS reacquisition.
      if (Math.abs(sample.altitudeM - (state.last.altitudeM ?? sample.altitudeM)) / (dt / 1000) < 10) {
        next[delta > 0 ? 'elevationGainM' : 'elevationLossM'] += Math.abs(delta);
      }
      next.altitudeAnchor = sample.altitudeM;
    }
  }
  return next;
}

export function sessionStatsSnapshot(state, nowMs) {
  const data = state ?? createSessionStats();
  const elapsedMs = data.firstAtMs == null ? 0 : Math.max(0, nowMs - data.firstAtMs);
  const speedChangeKmh = data.accelerationGainKmh + data.brakingLossKmh;
  return { ...data, elapsedMs, unknownMs: Math.max(0, elapsedMs - data.observedMs),
    coverage: elapsedMs ? Math.min(1, data.observedMs / elapsedMs) : 0,
    averageKmh: data.observedMs ? data.distanceM * 3600 / data.observedMs : null,
    movingAverageKmh: data.movingMs ? data.distanceM * 3600 / data.movingMs : null,
    accelerationShare: speedChangeKmh ? data.accelerationGainKmh / speedChangeKmh : null,
    brakingShare: speedChangeKmh ? data.brakingLossKmh / speedChangeKmh : null };
}

// Optional runtime evidence never substitutes zero for an unsupported observation.
export function sessionRuntimeSnapshot(source = {}) {
  const count = n => Number.isInteger(n) && n >= 0 ? n : null;
  const nonnegative = n => Number.isFinite(n) && n >= 0 ? n : null;
  const longTasks = source.longTasks ?? {};
  const events = source.events ?? {};
  const engine = source.engine ?? {};
  const ready = engine.active === true && (engine.status === 'ready' || engine.playing === true);
  return {
    longTasks: {
      count: longTasks.supported === true ? count(longTasks.count) : null,
      maximumDurationMs: longTasks.supported === true ? nonnegative(longTasks.maximumDurationMs) : null,
    },
    events: {
      scope: events.scope === 'session' ? 'session' : 'retained',
      retryCount: count(events.retryCount),
      audioModeChanges: count(events.audioModeChanges),
    },
    engine: {
      active: engine.active === true,
      rpm: ready ? nonnegative(engine.rpm) : null,
      gear: ready && Number.isInteger(engine.gear) && engine.gear >= 0 ? engine.gear : null,
      load: ready && Number.isFinite(engine.load) && engine.load >= 0 && engine.load <= 1 ? engine.load : null,
    },
  };
}

// Presentation only: bridge missing observations without manufacturing samples.
export function chartTraceSegments(samples, field) {
  const read = sample => field === 'altitudeM' ? chartAltitudeValue(sample) : sample[field];
  const runs = [], bridges = [];
  let run = [], previous = null, interrupted = false;
  for (const sample of samples) {
    if (!Number.isFinite(read(sample)) || sample.containsGap) {
      if (run.length) runs.push(run);
      run = []; interrupted = true; continue;
    }
    const gap = previous && (interrupted ||
      (sample.firstCapturedAtMs ?? sample.capturedAtMs) - (previous.lastCapturedAtMs ?? previous.capturedAtMs) > SESSION_GAP_MS);
    const sourceChange = field === 'altitudeM' && previous && chartAltitudeSource(previous) !== chartAltitudeSource(sample);
    if (gap || sourceChange) {
      if (run.length) runs.push(run);
      run = [];
      bridges.push([previous, sample]);
    }
    run.push(sample); previous = sample; interrupted = false;
  }
  if (run.length) runs.push(run);
  return { runs, bridges };
}
