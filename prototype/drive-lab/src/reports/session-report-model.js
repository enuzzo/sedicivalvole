import { sessionStatsSnapshot, sessionRuntimeSnapshot, SESSION_GAP_MS } from '../environments/atlas/session-stats.js';

export const REPORT_RECIPIENT_KEY = 'sedicivalvole.session-report-recipient.v1';
const finite = (n, min = 0, max = Number.MAX_SAFE_INTEGER) => Number.isFinite(n) && n >= min && n <= max ? n : null;
const select = (items, limit) => items.length <= limit ? items : Array.from({ length: limit }, (_, i) => items[Math.round(i * (items.length - 1) / (limit - 1))]);
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

export function readReportRecipient(storage) {
  try { const value = storage.getItem(REPORT_RECIPIENT_KEY); return typeof value === 'string' ? value.slice(0, 254) : ''; }
  catch { return ''; }
}

/** Match the server's email identity: domain is case-insensitive, local part is preserved. */
export function normalizeReportRecipient(value) {
  const recipient = typeof value === 'string' ? value.trim() : '';
  const separator = recipient.lastIndexOf('@');
  return separator < 0 ? recipient : `${recipient.slice(0, separator)}@${recipient.slice(separator + 1).toLowerCase()}`;
}

/** One whitelisted revision. Coordinates enter only the separately selected route. */
export function createSessionReportSnapshot({ journey, system, app, nowMs, createdAt, includeRoute = false }) {
  const stats = sessionStatsSnapshot(journey.totals, nowMs);
  if (stats.elapsedMs > 86400000) throw new Error('This report supports sessions up to 24 hours.');
  const runtime = sessionRuntimeSnapshot(system);
  const summary = Object.fromEntries(['elapsedMs', 'observedMs', 'movingMs', 'stoppedMs', 'unknownMs', 'distanceM',
    'averageKmh', 'movingAverageKmh', 'peakKmh', 'stops', 'elevationGainM', 'elevationLossM', 'elevationObservedMs']
    .map(key => [key, finite(stats[key])]));
  const sourceSamples = journey.sessionSamples?.length ? journey.sessionSamples : journey.recentSamples ?? [];
  const first = sourceSamples[0]?.capturedAtMs ?? nowMs;
  const samples = select(sourceSamples, 720).map((sample, index, all) => ({
    t: Math.max(0, (sample.capturedAtMs - first) / 1000),
    speedKmh: finite(sample.speedKmh, 0, 250), altitudeM: finite(sample.altitudeM, -500, 10000),
    gap: Boolean(sample.containsGap || (index && (sample.firstCapturedAtMs ?? sample.capturedAtMs)
      - (all[index - 1].lastCapturedAtMs ?? all[index - 1].capturedAtMs) > SESSION_GAP_MS)),
  }));
  const route = includeRoute ? select((journey.travelPoints ?? []).filter(p => Number.isFinite(p.latitude)
    && Math.abs(p.latitude) <= 90 && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180), 1024)
    .map(p => ({ latitude: p.latitude, longitude: p.longitude })) : [];
  return freeze({ schema: 'sedicivalvole.session-report.v1', createdAt,
    app: { version: app.version, build: app.build, commit: app.commit }, source: 'GPS', includeRoute,
    summary, speedBandsMs: [...stats.speedBandsMs], headingMs: [...stats.headingMs], samples, route,
    system: { audio: system.audio ?? 'unavailable', averageFps: finite(system.frame?.averageFps),
      p95FrameMs: finite(system.frame?.p95FrameMs), longTaskCount: runtime.longTasks.count,
      downloadBytes: finite(system.network?.observedDownloadBytes), uploadBytes: finite(system.network?.observedUploadBytes),
      engineRpm: runtime.engine.rpm, engineGear: runtime.engine.gear, engineLoad: runtime.engine.load } });
}

export function sessionReportFilename(snapshot) {
  return `sedicivalvole-session-${snapshot.createdAt.slice(0, 10)}-${snapshot.app.build}.pdf`;
}
