export const AUTOMATIC_DIAGNOSTIC_INTERVAL_MS = 15 * 60 * 1000;
/** A frozen or reloaded page sends once this much wall time holds at least this much unsent observed activity. */
export const AUTOMATIC_CATCH_UP_MIN_ACTIVE_MS = 60 * 1000;
/** A best-effort report when the app is closed or hidden needs less, so short drives still leave evidence. */
export const AUTOMATIC_FLUSH_MIN_ACTIVE_MS = 2 * 60 * 1000;
export const AUTOMATIC_FLUSH_MIN_WALL_MS = 5 * 60 * 1000;
export const DIAGNOSTIC_PREFERENCES_KEY = 'sedicivalvole.diagnostics.v1';
export const DIAGNOSTIC_CLOCK_KEY = 'sedicivalvole.diagnostic-clock.v1';
const CLOCK_RESTORE_WINDOW_MS = 12 * 60 * 60 * 1000;
const CLOCK_PERSIST_EVERY_MS = 5000;

export function readDiagnosticPreferences(storage) {
  try {
    const saved = JSON.parse(storage.getItem(DIAGNOSTIC_PREFERENCES_KEY));
    return { mode: saved?.mode === 'standard' ? 'standard' : 'dev', automatic: saved?.automatic !== false };
  } catch { return { mode: 'dev', automatic: true }; }
}

/**
 * Observable active session time, independent of GPS and connectivity. No hidden-time interpolation or backlog bursts.
 * The browser may freeze the page for many minutes (the Tesla does), so due work is also recognised by wall time:
 * once fifteen wall minutes hold unsent activity, the first tick that runs again delivers a catch-up report.
 * Progress is stored so a reload continues instead of restarting the count; only counters are stored, never a report.
 */
export function createAutomaticDiagnosticClock({ storage = null } = {}) {
  // ownMs is unsent activity observed by this page instance; restored progress counts toward the cadence but the
  // data behind it died with the old page, so nothing is sent until this instance holds some of its own.
  let previous = null, activeMs = 0, ownMs = 0, unobservedMs = 0, totalActiveMs = 0;
  let busy = false, attempts = 0, retryAt = 0, status = 'waiting', accepted = 0, flushes = 0;
  let anchorWall = null, lastWall = null, reason = null, restored = false, restoreTried = false, lastPersistWall = 0, stored = false;

  const wallElapsed = () => (anchorWall !== null && lastWall !== null ? Math.max(0, lastWall - anchorWall) : 0);
  const intervalDue = () => activeMs >= AUTOMATIC_DIAGNOSTIC_INTERVAL_MS && ownMs >= AUTOMATIC_CATCH_UP_MIN_ACTIVE_MS;
  const catchUpDue = () => wallElapsed() >= AUTOMATIC_DIAGNOSTIC_INTERVAL_MS && activeMs >= AUTOMATIC_CATCH_UP_MIN_ACTIVE_MS
    && ownMs >= AUTOMATIC_CATCH_UP_MIN_ACTIVE_MS;
  const clearStore = () => { if (!stored) return; stored = false; try { storage?.removeItem(DIAGNOSTIC_CLOCK_KEY); } catch {} };
  const persist = () => {
    if (!storage || anchorWall === null || lastWall === null) return;
    try {
      storage.setItem(DIAGNOSTIC_CLOCK_KEY, JSON.stringify({ v: 1, activeMs, totalActiveMs, anchorWall, savedWall: lastWall }));
      stored = true; lastPersistWall = lastWall;
    } catch {}
  };
  const restore = (wall) => {
    try {
      const saved = JSON.parse(storage?.getItem(DIAGNOSTIC_CLOCK_KEY));
      const away = wall - saved?.savedWall;
      if (saved?.v !== 1 || ![saved.activeMs, saved.totalActiveMs, saved.anchorWall, saved.savedWall].every(Number.isFinite)
        || saved.activeMs < 0 || saved.anchorWall > saved.savedWall || away < 0 || away > CLOCK_RESTORE_WINDOW_MS) return;
      activeMs = saved.activeMs; totalActiveMs = saved.totalActiveMs; anchorWall = saved.anchorWall;
      unobservedMs += away; restored = true; stored = true;
    } catch {}
  };

  return {
    update(input, now) {
      const wall = Number.isFinite(input.wallNow) ? input.wallNow : null;
      if (wall !== null) lastWall = wall;
      if (!restoreTried) { restoreTried = true; if (wall !== null && storage) restore(wall); }
      const dt = previous ? Math.max(0, now - previous.now) : 0;
      if (input.running && input.enabled) {
        if (anchorWall === null && wall !== null) anchorWall = wall;
        if (previous?.running && previous.enabled) {
          if (dt > 5000 || !input.visible || !previous.visible) unobservedMs += dt;
          else { activeMs += dt; ownMs += dt; totalActiveMs += dt; }
        }
      } else { activeMs = 0; ownMs = 0; attempts = 0; retryAt = 0; status = 'off'; anchorWall = null; clearStore(); }
      previous = { ...input, now };
      const pending = intervalDue() || catchUpDue();
      if (!busy && input.running && input.enabled && pending && !input.online) status = 'waiting-network';
      if (status === 'off' && input.running && input.enabled) status = 'waiting';
      if (input.running && input.enabled && wall !== null && wall - lastPersistWall >= CLOCK_PERSIST_EVERY_MS) persist();
      return input.running && input.enabled && input.online && !busy && now >= retryAt
        && ((intervalDue() && input.visible) || catchUpDue());
    },
    isPending() { return Boolean(previous?.running && previous.enabled && (intervalDue() || catchUpDue())); },
    begin() { busy = true; status = 'sending'; reason = intervalDue() ? 'interval' : 'catch-up'; },
    complete(success, now, retryable = true) {
      busy = false; reason = null;
      if (success) { accepted++; activeMs = 0; ownMs = 0; attempts = 0; retryAt = 0; status = 'accepted'; anchorWall = lastWall; clearStore(); }
      else if (retryable && attempts < 3) { retryAt = now + [30000, 60000, 120000][attempts++]; status = 'retrying'; }
      else { activeMs = 0; ownMs = 0; attempts = 0; retryAt = 0; status = 'failed'; anchorWall = lastWall; clearStore(); }
    },
    /** Best-effort report while the app is being hidden or closed; the page may not live to see the answer. */
    canFlush(wallNow = lastWall) {
      return Boolean(previous?.running && previous.enabled && !busy && anchorWall !== null && Number.isFinite(wallNow)
        && activeMs >= AUTOMATIC_FLUSH_MIN_ACTIVE_MS && ownMs >= AUTOMATIC_FLUSH_MIN_ACTIVE_MS && wallNow - anchorWall >= AUTOMATIC_FLUSH_MIN_WALL_MS);
    },
    beginFlush(wallNow) {
      if (Number.isFinite(wallNow) && (lastWall === null || wallNow > lastWall)) lastWall = wallNow;
      busy = true; status = 'sending'; reason = 'hide-flush';
    },
    abortFlush() { busy = false; reason = null; status = 'waiting'; },
    /** Reset Saved State reaches this clock while the session runs, so dropping the stored record is not enough:
     *  the unsent progress must go too, or the next tick would simply write the same counters back. */
    forget() {
      clearStore(); try { storage?.removeItem(DIAGNOSTIC_CLOCK_KEY); } catch {}
      activeMs = 0; ownMs = 0; attempts = 0; retryAt = 0; restored = false;
      anchorWall = lastWall; lastPersistWall = lastWall ?? 0;
      if (status !== 'off') status = 'waiting';
    },
    /** Optimistic: a keepalive request cannot report back, and the server's own floor prevents duplicates. */
    completeFlush() { busy = false; reason = null; flushes++; activeMs = 0; ownMs = 0; attempts = 0; retryAt = 0; status = 'flushed'; anchorWall = lastWall; clearStore(); },
    persist,
    snapshot() {
      return { timeBasis: 'active-visible-session', intervalActiveMs: AUTOMATIC_DIAGNOSTIC_INTERVAL_MS, activeMs, totalActiveMs, unobservedMs,
        wallElapsedMs: Math.round(wallElapsed()), deliveryReason: reason, restored, flushes, attempts, accepted, status };
    },
  };
}

/** Choosing Dev is an explicit request to resume the development report cadence. */
export function selectDiagnosticMode(mode) {
  return mode === 'standard' ? { mode: 'standard', automatic: false } : { mode: 'dev', automatic: true };
}
export function diagnosticDeliveryControl(preferences) {
  const enabled = preferences.mode === 'dev' && preferences.automatic;
  return {
    enabled,
    state: enabled ? 'AUTO REPORTS · ON' : 'AUTO REPORTS · OFF',
    detail: enabled ? 'Every 15 active min' : preferences.mode === 'standard' ? 'Standard · manual reports only' : 'Paused by you',
    action: enabled ? 'PAUSE SENDING' : preferences.mode === 'standard' ? 'ENABLE DEV REPORTS' : 'ENABLE SENDING',
    next: { mode: 'dev', automatic: !enabled },
  };
}
