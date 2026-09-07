import { ATLAS_SPEED_BANDS } from './atlas-model.js';

export const SESSION_GAP_MS = 5000;
export function createSessionStats() {
  return { firstAtMs: null, last: null, observedMs: 0, movingMs: 0, stoppedMs: 0,
    distanceM: 0, peakKmh: null, stops: 0, speedBandsMs: ATLAS_SPEED_BANDS.map(() => 0),
    headingMs: Array(8).fill(0), elevationGainM: 0, elevationLossM: 0,
    elevationObservedMs: 0, altitudeAnchor: null };
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
    && sample.altitudeAccuracyM <= 15;
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
  return { ...data, elapsedMs, unknownMs: Math.max(0, elapsedMs - data.observedMs),
    coverage: elapsedMs ? Math.min(1, data.observedMs / elapsedMs) : 0,
    averageKmh: data.observedMs ? data.distanceM * 3600 / data.observedMs : null,
    movingAverageKmh: data.movingMs ? data.distanceM * 3600 / data.movingMs : null };
}
