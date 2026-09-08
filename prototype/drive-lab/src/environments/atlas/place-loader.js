import { discoverDistanceMetres } from '../../discover/discover-model.js';

/** One provider, one request, bounded retry and location-aware refresh. */
export function createPlaceLoader({ readPosition, canLoad, load, onResult, onState,
  now = Date.now, schedule = setTimeout, cancel = clearTimeout, intervalMs = 60000 }) {
  let disposed = false, pending = false, controller, timer;
  let origin = null, successAt = null, retryAt = 0, failures = 0;
  const tick = async () => {
    cancel(timer);
    if (disposed || pending) return;
    const position = readPosition(), time = now();
    if (!canLoad() || !position || time < retryAt || (successAt != null &&
      (time - successAt < intervalMs || (time - successAt < 300000 && (discoverDistanceMetres(origin, position) ?? 0) < 1000)))) {
      timer = schedule(tick, 10000); return;
    }
    pending = true; controller = new AbortController();
    const timeout = schedule(() => controller.abort(), 25000);
    try {
      const result = await load(position, controller.signal);
      if (disposed) return;
      origin = { ...position }; successAt = now(); failures = 0; retryAt = 0;
      onResult(result); onState(result.length ? 'ready' : 'empty');
    } catch {
      if (!disposed) { retryAt = now() + Math.min(300000, 30000 * 2 ** Math.min(4, failures++)); onState('retrying'); }
    } finally {
      cancel(timeout); pending = false;
      if (!disposed) timer = schedule(tick, 10000);
    }
  };
  return {
    start: tick,
    wake() { if (canLoad()) { retryAt = 0; void tick(); } },
    pause() { cancel(timer); controller?.abort(); },
    dispose() { disposed = true; cancel(timer); controller?.abort(); },
  };
}
