export const AUTOMATIC_DIAGNOSTIC_INTERVAL_MS = 15 * 60 * 1000;
export const DIAGNOSTIC_PREFERENCES_KEY = 'sedicivalvole.diagnostics.v1';

export function readDiagnosticPreferences(storage) {
  try {
    const saved = JSON.parse(storage.getItem(DIAGNOSTIC_PREFERENCES_KEY));
    return { mode: saved?.mode === 'standard' ? 'standard' : 'dev', automatic: saved?.automatic !== false };
  } catch { return { mode: 'dev', automatic: true }; }
}

/** Observable driving time only. No hidden-time interpolation or backlog bursts. */
export function createAutomaticDiagnosticClock() {
  let previous = null, drivingMs = 0, unobservedMs = 0, totalDrivingMs = 0;
  let busy = false, attempts = 0, retryAt = 0, status = 'waiting', accepted = 0;
  return {
    update(input, now) {
      const dt = previous ? Math.max(0, now - previous.now) : 0;
      if (input.running && input.enabled) {
        if (previous?.running && previous.enabled) {
          if (dt > 5000 || !input.visible || !previous.visible) unobservedMs += dt;
          else if (input.moving && previous.moving) { drivingMs += dt; totalDrivingMs += dt; }
        }
      } else { drivingMs = 0; attempts = 0; retryAt = 0; status = 'off'; }
      previous = { ...input, now };
      if (status === 'off' && input.running && input.enabled) status = 'waiting';
      return input.running && input.enabled && input.online && input.visible && !busy
        && drivingMs >= AUTOMATIC_DIAGNOSTIC_INTERVAL_MS && now >= retryAt;
    },
    begin() { busy = true; status = 'sending'; },
    complete(success, now, retryable = true) {
      busy = false;
      if (success) { accepted++; drivingMs = 0; attempts = 0; retryAt = 0; status = 'accepted'; }
      else if (retryable && attempts < 3) { retryAt = now + [30000, 60000, 120000][attempts++]; status = 'retrying'; }
      else { drivingMs = 0; attempts = 0; retryAt = 0; status = 'failed'; }
    },
    snapshot() { return { intervalDrivingMs: AUTOMATIC_DIAGNOSTIC_INTERVAL_MS, drivingMs, totalDrivingMs, unobservedMs, attempts, accepted, status }; },
  };
}
