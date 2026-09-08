export const LOAD_RECOVERY_WINDOW_MS = 5 * 60 * 1000;

/** One selected visual owns one bounded recovery episode; no concurrent loads. */
export function createLoadRecovery({
  now, schedule, cancel, canRetry, retry, onState = () => {},
  windowMs = LOAD_RECOVERY_WINDOW_MS,
}) {
  let startedAt = null;
  let attempts = 0;
  let timer = null;
  let pending = false;
  let disposed = false;
  let exhausted = false;
  const clear = () => {
    if (timer != null) cancel(timer);
    timer = null;
  };
  const tick = () => {
    clear();
    if (disposed || !pending) return;
    const remaining = windowMs - (now() - startedAt);
    if (remaining <= 0) {
      pending = false;
      exhausted = true;
      onState("exhausted");
    } else if (!canRetry()) {
      onState("waiting");
      timer = schedule(tick, Math.min(30000, remaining));
    } else {
      pending = false;
      attempts += 1;
      onState("loading");
      retry(attempts);
    }
  };
  return {
    fail() {
      if (disposed || pending) return;
      startedAt ??= now();
      pending = true;
      const remaining = windowMs - (now() - startedAt);
      if (remaining <= 0) return tick();
      onState(canRetry() ? "retrying" : "waiting");
      timer = schedule(tick, Math.min(5000 * 2 ** Math.min(attempts, 3), 30000, remaining));
    },
    wake() {
      if (disposed || !canRetry()) return;
      if (exhausted) {
        exhausted = false; startedAt = now(); attempts = 0; pending = true;
      }
      if (pending) tick();
    },
    succeed() {
      if (disposed || startedAt == null) return;
      clear();
      pending = false;
      exhausted = false;
      startedAt = null;
      attempts = 0;
      onState("idle");
    },
    dispose() { disposed = true; pending = false; clear(); },
  };
}
