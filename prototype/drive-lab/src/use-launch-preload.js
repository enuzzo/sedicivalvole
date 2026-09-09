import { useEffect } from 'react';
import { createLoadRecovery } from './load-recovery.js';

/** One cancellable preparation per selection, including foreground recovery. */
export function useLaunchPreload(enabled, selection, prepare) {
  useEffect(() => {
    if (!enabled) return;
    let disposed = false, pending = false, complete = false, controller = null;
    const available = () => navigator.onLine !== false && document.visibilityState !== 'hidden';
    const recovery = createLoadRecovery({
      now: () => performance.now(), schedule: setTimeout, cancel: clearTimeout,
      canRetry: available, retry: () => void attempt(),
    });
    async function attempt() {
      if (disposed || pending || complete) return;
      if (!available()) { recovery.fail(); return; }
      pending = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      try {
        await prepare(selection, controller.signal);
        if (!disposed) { complete = true; recovery.succeed(); }
      } catch {
        if (!disposed) recovery.fail();
      } finally { pending = false; clearTimeout(timeout); }
    }
    const wake = () => {
      if (!available()) controller?.abort();
      else recovery.wake();
    };
    window.addEventListener('online', wake);
    window.addEventListener('offline', wake);
    document.addEventListener('visibilitychange', wake);
    void attempt();
    return () => {
      disposed = true; controller?.abort(); recovery.dispose();
      window.removeEventListener('online', wake); window.removeEventListener('offline', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [enabled, selection, prepare]);
}
