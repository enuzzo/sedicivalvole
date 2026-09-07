import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionReportSnapshot, normalizeReportRecipient, readReportRecipient, sessionReportFilename } from '../src/reports/session-report-model.js';
import { createSessionStats, observeSessionStats } from '../src/environments/atlas/session-stats.js';

const base = () => {
  const samples = [0, 1000, 2000].map(capturedAtMs => ({ capturedAtMs, speedKmh: 36,
    accuracyM: 3, altitudeM: 100, altitudeAccuracyM: 3, heading: 90, latitude: 45, longitude: 9 }));
  return { journey: { totals: samples.reduce(observeSessionStats, createSessionStats()), sessionSamples: samples,
    travelPoints: [{ latitude: 45, longitude: 9 }, { latitude: 45.001, longitude: 9.002 }] },
    system: { audio: 'running', frame: { averageFps: 30, p95FrameMs: 34 }, network: { observedDownloadBytes: 1000, observedUploadBytes: 20 },
      engine: { active: true, status: 'ready', rpm: 2500, gear: 2, load: .5 } },
    app: { version: '0.0.0', build: '20260907-2004', commit: 'b27975d' }, nowMs: 4000, createdAt: '2026-09-07T20:00:00.000Z' };
};

test('default report is an immutable coordinate-free snapshot with truthful gaps', () => {
  const input = base(), report = createSessionReportSnapshot(input);
  assert.equal(report.summary.distanceM, 20);
  assert.equal(report.summary.unknownMs, 2000);
  assert.equal(report.system.engineRpm, 2500);
  assert.deepEqual(report.route, []);
  assert.doesNotMatch(JSON.stringify(report), /latitude|longitude|accuracyM/);
  input.journey.totals.distanceM = 999;
  input.journey.sessionSamples[0].speedKmh = 99;
  assert.equal(report.summary.distanceM, 20);
  assert.equal(report.samples[0].speedKmh, 36);
  assert.throws(() => { report.summary.distanceM = 0; }, TypeError);
});

test('precise route requires explicit selection and remains bounded with endpoints', () => {
  const input = base();
  input.journey.travelPoints = Array.from({ length: 3000 }, (_, i) => ({ latitude: 45 + i / 100000, longitude: 9, privateNote: 'excluded' }));
  const report = createSessionReportSnapshot({ ...input, includeRoute: true });
  assert.equal(report.route.length, 1024);
  assert.equal(report.route[0].latitude, 45);
  assert.equal(report.route.at(-1).latitude, 45.02999);
  assert.doesNotMatch(JSON.stringify(report), /privateNote/);
  assert.deepEqual(createSessionReportSnapshot(input).route, []);
});

test('empty, unknown, and whole-day reports preserve missing values rather than fake measures', () => {
  const input = base(); input.journey = { totals: createSessionStats() }; input.system = {};
  const empty = createSessionReportSnapshot(input);
  assert.equal(empty.summary.averageKmh, null);
  assert.equal(empty.summary.peakKmh, null);
  assert.equal(empty.system.downloadBytes, null);
  assert.deepEqual(empty.samples, []);
  input.journey.totals.firstAtMs = 0; input.nowMs = 86400000;
  assert.equal(createSessionReportSnapshot(input).summary.unknownMs, 86400000);
  input.nowMs++;
  assert.throws(() => createSessionReportSnapshot(input), /24 hours/);
});

test('recipient preference tolerates unavailable storage and filenames use pipeline identity', () => {
  assert.equal(readReportRecipient({ getItem: () => { throw new Error('blocked'); } }), '');
  assert.equal(readReportRecipient({ getItem: () => 'driver@example.com' }), 'driver@example.com');
  assert.equal(sessionReportFilename(createSessionReportSnapshot(base())), 'sedicivalvole-session-2026-09-07-20260907-2004.pdf');
});

test('recipient proof identity matches the server without lowercasing the local part', () => {
  assert.equal(normalizeReportRecipient(' Driver@EXAMPLE.COM '), 'Driver@example.com');
  assert.notEqual(normalizeReportRecipient('Driver@example.com'), normalizeReportRecipient('driver@example.com'));
  assert.equal(normalizeReportRecipient('driver@EXAMPLE.COM'), normalizeReportRecipient('driver@example.com'));
  assert.equal(normalizeReportRecipient(null), '');
});
