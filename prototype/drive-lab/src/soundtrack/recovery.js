/** Foreground-only recovery: explicit pause always wins; no invented playback. */
export function createSoundtrackRecovery({ now = () => performance.now(), retry, onState = () => {} }) {
  let key = null, clock = null, changedAt = now(), startedAt = null, nextAt = 0, attempts = 0, busy = false, disposed = false;
  return {
    async tick(snapshot, eligible) {
      const at = now();
      if (disposed || busy) return;
      if (!eligible || snapshot?.playbackWanted === false || snapshot?.status === 'paused') {
        changedAt = at; startedAt = null; attempts = 0; onState('idle'); return;
      }
      const media = snapshot?.media?.roles?.current;
      const current = snapshot?.current?.key;
      if (current !== key || media?.currentTimeSeconds !== clock) {
        key = current; clock = media?.currentTimeSeconds; changedAt = at;
        if (snapshot?.status === 'playing') { startedAt = null; attempts = 0; onState('idle'); }
      }
      const stalled = snapshot?.status === 'playing' && at - changedAt >= 10000;
      if (!stalled && !['idle', 'error', 'prepared'].includes(snapshot?.status)) return;
      startedAt ??= at;
      if (at - startedAt > 300000) { onState('unavailable'); return; }
      if (at < nextAt) return;
      busy = true; onState('retrying');
      try { await retry(snapshot); }
      catch { if (!disposed) onState("retrying"); }
      finally { busy = false; attempts++; nextAt = now() + Math.min(30000, 2000 * 2 ** Math.min(attempts - 1, 4)); changedAt = now(); }
    },
    dispose() { disposed = true; },
  };
}
