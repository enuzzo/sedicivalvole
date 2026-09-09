/** Bounded encoded WAV cache. Decoders receive copies, never retained buffers. */
export function createEngineAssetCache({ fetcher = (...args) => fetch(...args), maxBytes = 40 * 1024 * 1024 } = {}) {
  const retained = new Map(), pending = new Map();
  let size = 0;
  return {
    async read(asset, { signal } = {}) {
      if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
      const key = `${asset.url}:${asset.sha256}`;
      if (retained.has(key)) {
        const bytes = retained.get(key); retained.delete(key); retained.set(key, bytes);
        return bytes.slice(0);
      }
      let entry = pending.get(key);
      if (!entry) {
        const controller = new AbortController();
        entry = { controller, users: 0 };
        pending.set(key, entry);
        entry.promise = (async () => {
          const response = await fetcher(asset.url, { signal: controller.signal });
          if (!response.ok) throw new Error(`Engine audio HTTP ${response.status}`);
          const bytes = await response.arrayBuffer();
          const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
          if (digest !== asset.sha256) throw new Error('Engine audio integrity mismatch');
          if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
          if (bytes.byteLength <= maxBytes) {
            while (size + bytes.byteLength > maxBytes) {
              const oldest = retained.keys().next().value;
              size -= retained.get(oldest).byteLength; retained.delete(oldest);
            }
            retained.set(key, bytes); size += bytes.byteLength;
          }
          return bytes;
        })().finally(() => { if (pending.get(key) === entry) pending.delete(key); });
      }
      entry.users++;
      let abort;
      try {
        const cancelled = new Promise((_, reject) => {
          abort = () => reject(new DOMException('Cancelled', 'AbortError'));
          signal?.addEventListener('abort', abort, { once: true });
        });
        return (await Promise.race([entry.promise, cancelled])).slice(0);
      } finally {
        signal?.removeEventListener('abort', abort);
        if (--entry.users === 0 && pending.get(key) === entry) {
          pending.delete(key); entry.controller.abort();
        }
      }
    },
    get size() { return size; },
  };
}
export const engineAssetCache = createEngineAssetCache();
