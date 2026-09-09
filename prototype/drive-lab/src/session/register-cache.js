import { BUILD_KEY, staticPath } from './cache-policy.js';
let starting = null, observing = false;
function observeEarlyAssets(worker) {
  if (observing || typeof PerformanceObserver !== 'function') return;
  observing = true;
  const queued = new Set(), seen = new Set();
  let timer = null;
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      const url = new URL(entry.name);
      if (url.origin === location.origin && staticPath(url.pathname) && !seen.has(url.pathname)) {
        seen.add(url.pathname); queued.add(url.pathname);
      }
    }
    if (!timer && queued.size) timer = setTimeout(() => {
      timer = null;
      if (document.visibilityState !== 'hidden') worker.postMessage({ type: 'WARM_ASSET_CACHE', warm: [...queued].slice(0, 80) });
      queued.clear();
    }, 500);
  });
  try { observer.observe({ type: 'resource', buffered: true }); } catch { observing = false; }
}
/** Failure is optional capability loss, never a blocked Intro. */
export function registerSessionCache() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return Promise.resolve(false);
  if (starting) return starting;
  starting = (async () => {
    const key = `${__APP_BUILD__}.${__APP_COMMIT__}`;
    if (!BUILD_KEY.test(key)) return false;
    await navigator.serviceWorker.register('/session-cache.js', { scope: '/', updateViaCache: 'none' });
    const registration = await navigator.serviceWorker.ready;
    const worker = navigator.serviceWorker.controller || registration.active;
    if (!worker) return false;
    const warm = performance.getEntriesByType('resource').map(item => {
      const url = new URL(item.name); return url.origin === location.origin ? url.pathname : '';
    }).filter(Boolean);
    return new Promise(resolve => {
      const channel = new MessageChannel();
      const deadline = setTimeout(() => { channel.port1.close(); resolve(false); }, 15000);
      channel.port1.onmessage = event => { clearTimeout(deadline); channel.port1.close(); if (event.data?.ready) observeEarlyAssets(worker); resolve(event.data?.ready === true); };
      worker.postMessage({ type: 'BIND_ASSET_CACHE', key, warm: [...new Set(warm)] }, [channel.port2]);
    });
  })().catch(() => false).finally(() => { starting = null; });
  return starting;
}
