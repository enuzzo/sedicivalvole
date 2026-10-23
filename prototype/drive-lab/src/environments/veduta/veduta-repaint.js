/** Coalesce finite deferred GL work without keeping a parked map rendering. */
export function createVedutaRepaintScheduler({ repaint, visible, now, setTimer, clearTimer }) {
  let timer = null, deadline = Infinity, disposed = false;
  const cancel = () => { if (timer !== null) clearTimer(timer); timer = null; deadline = Infinity; };
  return {
    schedule(at) {
      if (disposed || !visible() || at >= deadline) return;
      cancel(); deadline = at;
      timer = setTimer(() => { timer = null; deadline = Infinity; if (!disposed && visible()) repaint(); }, Math.max(0, at - now()));
    },
    cancel,
    dispose() { disposed = true; cancel(); },
  };
}
