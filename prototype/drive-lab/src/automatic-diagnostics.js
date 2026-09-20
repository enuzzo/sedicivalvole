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
 * Progress is stored so a reload continues instead of restarting the count; only counters and a random delivery identity are stored, never a report.
 */
export function createAutomaticDiagnosticClock({ storage = null } = {}) {
  let previous = null, activeMs = 0, ownMs = 0, unobservedMs = 0, totalActiveMs = 0;
  let busy = false, attempts = 0, retryAt = 0, status = 'waiting', accepted = 0, flushes = 0;
  let anchorWall = null, lastWall = null, restored = false, restoreTried = false, lastPersistWall = 0;
  let delivery = null, deliveryOwnMs = 0;
  const wallElapsed = () => anchorWall === null || lastWall === null ? 0 : Math.max(0, lastWall - anchorWall);
  const intervalDue = () => activeMs >= AUTOMATIC_DIAGNOSTIC_INTERVAL_MS && ownMs >= AUTOMATIC_CATCH_UP_MIN_ACTIVE_MS;
  const catchUpDue = () => wallElapsed() >= AUTOMATIC_DIAGNOSTIC_INTERVAL_MS && ownMs >= AUTOMATIC_CATCH_UP_MIN_ACTIVE_MS;
  const retryDue = () => delivery !== null && ownMs >= AUTOMATIC_CATCH_UP_MIN_ACTIVE_MS;
  const clearStore = () => { try { storage?.removeItem(DIAGNOSTIC_CLOCK_KEY); } catch {} };
  const persist = () => {
    if (anchorWall === null || lastWall === null) return;
    try {
      // No report or sensor data: only cadence counters and a random, short-lived delivery identity.
      storage?.setItem(DIAGNOSTIC_CLOCK_KEY, JSON.stringify({ v: 1, activeMs, totalActiveMs, anchorWall, savedWall: lastWall, delivery }));
      lastPersistWall = lastWall;
    } catch {}
  };
  const restore = wall => {
    try {
      const saved = JSON.parse(storage?.getItem(DIAGNOSTIC_CLOCK_KEY));
      const away = wall - saved?.savedWall;
      if (saved?.v !== 1 || ![saved.activeMs, saved.totalActiveMs, saved.anchorWall, saved.savedWall].every(Number.isFinite)
        || saved.activeMs < 0 || saved.totalActiveMs < saved.activeMs || saved.anchorWall > saved.savedWall
        || away < 0 || away > CLOCK_RESTORE_WINDOW_MS) return;
      activeMs = saved.activeMs; totalActiveMs = saved.totalActiveMs; anchorWall = saved.anchorWall;
      unobservedMs += away; restored = true;
      const d = saved.delivery;
      if (d && /^[a-f0-9]{32}$/.test(d.id) && ['interval', 'catch-up', 'hide-flush'].includes(d.reason)
        && Number.isFinite(d.activeMs) && d.activeMs >= 0 && d.activeMs <= activeMs
        && Number.isFinite(d.createdWall) && wall >= d.createdWall && wall - d.createdWall <= CLOCK_RESTORE_WINDOW_MS) {
        delivery = { id: d.id, reason: d.reason, activeMs: d.activeMs, createdWall: d.createdWall };
        status = 'unconfirmed';
      }
    } catch {}
  };
  const begin = reason => {
    if (!delivery) {
      const id = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
      delivery = { id, reason, activeMs, createdWall: lastWall };
      deliveryOwnMs = ownMs;
    }
    busy = true; status = 'sending'; persist();
    return delivery.id;
  };
  const reset = () => {
    busy = false; delivery = null; deliveryOwnMs = 0; activeMs = 0; ownMs = 0; attempts = 0; retryAt = 0; clearStore();
  };
  return {
    update(input, now) {
      if (Number.isFinite(input.wallNow)) lastWall = input.wallNow;
      if (!restoreTried) { restoreTried = true; if (lastWall !== null) restore(lastWall); }
      const dt = previous ? Math.max(0, now - previous.now) : 0;
      if (input.running && input.enabled) {
        if (anchorWall === null && lastWall !== null) anchorWall = lastWall;
        if (previous?.running && previous.enabled) {
          if (dt > 5000 || !input.visible || !previous.visible) unobservedMs += dt;
          else { activeMs += dt; ownMs += dt; totalActiveMs += dt; }
        }
      } else { reset(); status = 'off'; anchorWall = null; }
      previous = { ...input, now };
      // Receipt retention is 24 h server-side; never reuse an identity beyond the 12 h client window.
      if (!busy && delivery && lastWall !== null && delivery.createdWall !== null && lastWall - delivery.createdWall > CLOCK_RESTORE_WINDOW_MS) {
        delivery = null; deliveryOwnMs = 0; attempts = 0;
      }
      const pending = intervalDue() || catchUpDue() || retryDue();
      if (!busy && input.running && input.enabled && pending && !input.online) status = 'waiting-network';
      if (status === 'off' && input.running && input.enabled) status = 'waiting';
      if (input.running && input.enabled && lastWall !== null && lastWall - lastPersistWall >= CLOCK_PERSIST_EVERY_MS) persist();
      return input.running && input.enabled && input.online && !busy && now >= retryAt
        && ((intervalDue() && input.visible) || catchUpDue() || retryDue());
    },
    isPending() { return Boolean(previous?.running && previous.enabled && (intervalDue() || catchUpDue() || retryDue())); },
    begin() { return begin(intervalDue() ? 'interval' : 'catch-up'); },
    complete(success, now, retryable = true, id = delivery?.id) {
      if (!delivery || id !== delivery.id) return; // OFF/reset invalidates a late completion.
      busy = false;
      if (success) {
        accepted++;
        // A retry may confirm an earlier packet. Conservatively keep everything observed since that first attempt.
        activeMs = Math.max(0, activeMs - delivery.activeMs); ownMs = Math.max(0, ownMs - deliveryOwnMs);
        delivery = null; deliveryOwnMs = 0; attempts = 0; retryAt = 0; status = 'accepted'; anchorWall = lastWall;
        clearStore(); if (activeMs > 0) persist();
      } else {
        if (retryable && attempts < 3) { retryAt = now + [30000, 60000, 120000][attempts++]; status = 'retrying'; }
        else { retryAt = now + AUTOMATIC_DIAGNOSTIC_INTERVAL_MS; attempts = 0; status = 'failed'; }
        persist(); // A failed attempt is not a delivery and must not erase progress.
      }
    },
    canFlush(wallNow = lastWall) {
      return Boolean(previous?.running && previous.enabled && !busy && !delivery && anchorWall !== null && Number.isFinite(wallNow)
        && activeMs >= AUTOMATIC_FLUSH_MIN_ACTIVE_MS && ownMs >= AUTOMATIC_FLUSH_MIN_ACTIVE_MS && wallNow - anchorWall >= AUTOMATIC_FLUSH_MIN_WALL_MS);
    },
    beginFlush(wallNow = lastWall) {
      if (Number.isFinite(wallNow) && (lastWall === null || wallNow > lastWall)) lastWall = wallNow;
      flushes++; return begin('hide-flush');
    },
    abortFlush() { busy = false; delivery = null; deliveryOwnMs = 0; status = 'waiting'; persist(); },
    forget() { reset(); restored = false; anchorWall = lastWall; lastPersistWall = lastWall ?? 0; status = 'waiting'; },
    persist,
    snapshot() {
      return { timeBasis: 'active-visible-session', intervalActiveMs: AUTOMATIC_DIAGNOSTIC_INTERVAL_MS, activeMs, totalActiveMs, unobservedMs,
        wallElapsedMs: Math.round(wallElapsed()), deliveryReason: delivery?.reason ?? null, deliveryId: delivery?.id ?? null,
        restored, flushes, attempts, accepted, status };
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
