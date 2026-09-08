export const AUTOMATIC_DIAGNOSTIC_INTERVAL_MS = 15 * 60 * 1000;
export const DIAGNOSTIC_PREFERENCES_KEY = 'sedicivalvole.diagnostics.v1';

export function readDiagnosticPreferences(storage) {
  try {
    const saved = JSON.parse(storage.getItem(DIAGNOSTIC_PREFERENCES_KEY));
    return { mode: saved?.mode === 'standard' ? 'standard' : 'dev', automatic: saved?.automatic !== false };
  } catch { return { mode: 'dev', automatic: true }; }
}

/** Observable active session time, independent of GPS and connectivity. No hidden-time interpolation or backlog bursts. */
export function createAutomaticDiagnosticClock() {
  let previous = null, activeMs = 0, unobservedMs = 0, totalActiveMs = 0;
  let busy = false, attempts = 0, retryAt = 0, status = 'waiting', accepted = 0;
  return {
    update(input, now) {
      const dt = previous ? Math.max(0, now - previous.now) : 0;
      if (input.running && input.enabled) {
        if (previous?.running && previous.enabled) {
          if (dt > 5000 || !input.visible || !previous.visible) unobservedMs += dt;
          else { activeMs += dt; totalActiveMs += dt; }
        }
      } else { activeMs = 0; attempts = 0; retryAt = 0; status = 'off'; }
      previous = { ...input, now };
      if (!busy && input.running && input.enabled && activeMs >= AUTOMATIC_DIAGNOSTIC_INTERVAL_MS && !input.online) status = 'waiting-network';
      if (status === 'off' && input.running && input.enabled) status = 'waiting';
      return input.running && input.enabled && input.online && input.visible && !busy
        && activeMs >= AUTOMATIC_DIAGNOSTIC_INTERVAL_MS && now >= retryAt;
    },
    begin() { busy = true; status = 'sending'; },
    complete(success, now, retryable = true) {
      busy = false;
      if (success) { accepted++; activeMs = 0; attempts = 0; retryAt = 0; status = 'accepted'; }
      else if (retryable && attempts < 3) { retryAt = now + [30000, 60000, 120000][attempts++]; status = 'retrying'; }
      else { activeMs = 0; attempts = 0; retryAt = 0; status = 'failed'; }
    },
    snapshot() { return { timeBasis: 'active-visible-session', intervalActiveMs: AUTOMATIC_DIAGNOSTIC_INTERVAL_MS, activeMs, totalActiveMs, unobservedMs, attempts, accepted, status }; },
  };
}
