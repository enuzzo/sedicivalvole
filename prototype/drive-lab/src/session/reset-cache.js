import { CACHE_PREFIX } from './cache-policy.js';

/** Explicit owner action: static application bytes only, never saved state. */
export async function resetApplicationCache({ storage = globalThis.caches, serviceWorker = globalThis.navigator?.serviceWorker } = {}) {
  let deleted = 0, failed = 0;
  if (storage) {
    try {
      const names = await storage.keys();
      for (const name of names.filter(name => name.startsWith(CACHE_PREFIX))) {
        try { if (await storage.delete(name)) deleted++; else failed++; } catch { failed++; }
      }
    } catch { failed++; }
  }
  // Retire only our static worker, not unrelated registrations on the origin.
  if (serviceWorker?.getRegistrations) {
    try {
      for (const registration of await serviceWorker.getRegistrations()) {
        const worker = registration.active ?? registration.waiting ?? registration.installing;
        if (worker && new URL(worker.scriptURL).pathname === '/session-cache.js') {
          try { if (!await registration.unregister()) failed++; } catch { failed++; }
        }
      }
    } catch { failed++; }
  }
  return { deleted, failed, supported: Boolean(storage || serviceWorker?.getRegistrations) };
}
