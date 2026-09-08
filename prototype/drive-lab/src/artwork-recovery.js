import { createLoadRecovery } from "./load-recovery.js";

/** One selected image, one request, bounded retries; no stale completion. */
export function createArtworkRecovery({ url, makeImage, now, schedule, cancel, canRetry, onState }) {
  let disposed = false, image = null, deadline = null, loaded = false;
  const clear = () => {
    if (deadline != null) cancel(deadline);
    deadline = null;
    if (image) { image.onload = null; image.onerror = null; image.src = ""; image = null; }
  };
  const recovery = createLoadRecovery({ now, schedule, cancel, canRetry,
    onState: state => onState({ status: state, src: null }),
    retry: () => attempt(),
  });
  const attempt = () => {
    if (disposed || image || loaded) return;
    if (!canRetry()) { recovery.fail(); return; }
    onState({ status: "loading", src: null });
    const pending = makeImage(); image = pending;
    pending.decoding = "async";
    pending.onload = () => {
      if (disposed || image !== pending) return;
      if (deadline != null) cancel(deadline);
      deadline = null; pending.onload = null; pending.onerror = null; image = null;
      loaded = true; recovery.succeed(); onState({ status: "ready", src: url });
    };
    pending.onerror = () => {
      if (disposed || image !== pending) return;
      clear(); recovery.fail();
    };
    deadline = schedule(() => { if (image === pending) { clear(); recovery.fail(); } }, 15000);
    pending.src = url;
  };
  attempt();
  return {
    wake() {
      if (disposed || loaded) return;
      if (!canRetry() && image) { clear(); recovery.fail(); }
      else recovery.wake();
    },
    dispose() { disposed = true; clear(); recovery.dispose(); },
  };
}
