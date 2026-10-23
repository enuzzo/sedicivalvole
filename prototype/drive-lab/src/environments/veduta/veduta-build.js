/** Finite cooperative work. A yielded promise suspends CPU work without polling. */
export function createVedutaBuildQueue({ schedule, cancel, now, visible, onError, budgetMs = 3 }) {
  let job = null, handle = null, disposed = false;
  const clear = () => { if (handle !== null) cancel(handle); handle = null; };
  const discard = () => {
    clear(); const previous = job; job = null;
    if (previous) {
      previous.abort.abort();
      try { previous.iterator.return?.(); } finally { previous.discard?.(); }
    }
  };
  const enqueue = () => { if (!disposed && job && handle === null) handle = schedule(step); };
  function step(deadline) {
    handle = null;
    const current = job;
    if (!current || disposed) return;
    if (!visible() || !current.valid()) { discard(); return; }
    const start = now(); let count = 0;
    try {
      do {
        if (current !== job || !current.valid() || !visible()) { discard(); return; }
        const result = current.iterator.next(current.input); current.input = undefined;
        if (result.done) {
          job = null;
          try { current.commit(result.value); } catch (error) { current.discard?.(); throw error; }
          return;
        }
        if (result.value?.then) {
          Promise.resolve(result.value).then(value => {
            if (job === current && !disposed) { current.input = value; enqueue(); }
          }, error => {
            if (job === current && !disposed) { discard(); onError(error); }
          });
          return;
        }
        count++;
      } while (count < 256 && now() - start < budgetMs && (deadline?.didTimeout || (deadline?.timeRemaining?.() ?? 1) > .5));
      enqueue();
    } catch (error) { discard(); onError(error); }
  }
  return {
    start(make, options) {
      discard(); if (disposed) return;
      const abort = new AbortController();
      job = { ...options, abort, iterator: make(abort.signal), input: undefined }; enqueue();
    },
    cancel: discard,
    dispose() { disposed = true; discard(); },
  };
}

/** Idle work with a bounded starvation timeout; older browsers retain a timer fallback. */
export function vedutaBuildScheduling(host = window) {
  return typeof host.requestIdleCallback === 'function' ? {
    schedule: callback => host.requestIdleCallback(callback, { timeout: 100 }),
    cancel: handle => host.cancelIdleCallback(handle),
  } : {
    schedule: callback => host.setTimeout(() => callback(null), 8),
    cancel: handle => host.clearTimeout(handle),
  };
}
