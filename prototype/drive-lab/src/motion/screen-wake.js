// One explicit screen-lock owner. Browser/OS revocation is never hidden or retried in a loop.
export function createScreenWake({ host = window, doc = document, onChange = () => {} } = {}) {
  let lock = null, epoch = 0, wanted = false, pending = false;
  let state = 'idle', requests = 0, releases = 0, failures = 0;
  const summary = () => ({ wakeLock: Boolean(lock && !lock.released), wakeState: state,
    wakeRequests: requests, wakeReleases: releases, wakeFailures: failures });
  const emit = () => onChange(summary());
  function stop() {
    epoch += 1; wanted = false; pending = false;
    const old = lock; lock = null;
    state = 'idle';
    if (old && !old.released) { releases += 1; void old.release().catch(() => {}); }
    emit();
  }
  async function request() {
    if (!wanted || pending || lock && !lock.released || doc.visibilityState !== 'visible') return;
    if (!host.navigator?.wakeLock?.request) { state = 'unsupported'; emit(); return; }
    const token = epoch;
    pending = true; state = 'requesting'; requests += 1; emit();
    try {
      const next = await host.navigator.wakeLock.request('screen');
      if (token !== epoch || !wanted || doc.visibilityState !== 'visible') {
        void next.release().catch(() => {});
        if (token === epoch) { releases += 1; state = 'released'; emit(); }
        return;
      }
      lock = next;
      state = next.released ? 'released' : 'active';
      next.addEventListener('release', () => {
        if (token !== epoch || lock !== next) return;
        lock = null; state = 'released'; releases += 1; emit();
      }, { once: true });
      emit();
    } catch (error) {
      if (token === epoch) { failures += 1; state = error?.name === 'NotAllowedError' ? 'denied' : 'error'; emit(); }
    } finally { if (token === epoch) pending = false; }
  }
  return { start() { wanted = true; void request(); }, retry: request, stop, summary };
}
