import { CACHE_PREFIX, BUILD_KEY, staticPath, validManifest, canRetireCache } from './cache-policy.js';

// Public static bytes only. Navigation, private LAB, APIs and remote music bypass us.
const META = 'sedicivalvole.cache-meta.v1';
const origin = self.location.origin;
const inFlight = new Map();
const manifests = new Map();
const clientKeys = new Map();
const metaUrl = key => `${origin}/__asset_cache__/${key}`;
const manifestUrl = key => `${origin}/assets/release-${key}.json`;
async function manifest(key) {
  if (!BUILD_KEY.test(key || '')) return null;
  if (manifests.has(key)) return manifests.get(key);
  const metadata = await caches.open(META);
  const saved = await metadata.match(metaUrl(key));
  if (!saved) return null;
  const value = await saved.json();
  if (!validManifest(value)) return null;
  manifests.set(key, value);
  return value;
}
async function bind(client, key) {
  if (!client || !BUILD_KEY.test(key || '')) throw new Error('Invalid cache binding');
  let value = await manifest(key);
  if (!value) {
    const response = await fetch(manifestUrl(key), { cache: 'no-store' });
    value = await response.json();
    if (!response.ok || !validManifest(value) || value.key !== key) throw new Error('Invalid release manifest');
    value = { ...value, savedAt: Date.now() };
    await (await caches.open(META)).put(metaUrl(key), new Response(JSON.stringify(value)));
    manifests.set(key, value);
  }
  clientKeys.set(client.id, key);
  await (await caches.open(META)).put(metaUrl(`client/${client.id}`), new Response(key));
  return value;
}
async function clientKey(id, url) {
  const fromUrl = new URL(url || origin).searchParams.get('cache-build');
  if (BUILD_KEY.test(fromUrl || '')) return fromUrl;
  if (!id) return null;
  if (clientKeys.has(id)) return clientKeys.get(id);
  const client = await self.clients.get(id);
  const nested = client && new URL(client.url).searchParams.get('cache-build');
  if (BUILD_KEY.test(nested || '')) return nested;
  const saved = await (await caches.open(META)).match(metaUrl(`client/${id}`));
  const key = saved ? await saved.text() : null;
  if (BUILD_KEY.test(key || '')) clientKeys.set(id, key);
  return key;
}
async function cachedResource(request, key) {
  const value = await manifest(key);
  const url = new URL(request.url);
  const asset = value?.assets.find(item => item.path === url.pathname);
  if (!asset || request.headers.has('range')) return fetch(request);
  const store = await caches.open(CACHE_PREFIX + key);
  const cacheKey = `${origin}${asset.path}?sha256=${asset.sha256}`;
  const saved = await store.match(cacheKey);
  if (saved) return saved;
  const pendingKey = `${key}:${cacheKey}`;
  if (!inFlight.has(pendingKey)) {
    inFlight.set(pendingKey, (async () => {
      const response = await fetch(request);
      if (!response.ok || response.status !== 200 || response.type === 'opaque') return response;
      const bytes = await response.clone().arrayBuffer();
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
      if (bytes.byteLength !== asset.bytes || digest !== asset.sha256) return new Response('Asset release mismatch', { status: 409 });
      try { await store.put(cacheKey, response.clone()); }
      catch { /* Quota/privacy mode must never break the live request or evict a live bank. */ }
      return response;
    })().finally(() => inFlight.delete(pendingKey)));
  }
  return (await inFlight.get(pendingKey)).clone();
}
async function prune() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  const active = new Set(await Promise.all(clients.map(client => clientKey(client.id, client.url))));
  // An unbound open page may still be starting; do not guess its generation.
  if (active.has(null)) return;
  const metadata = await caches.open(META);
  for (const name of await caches.keys()) {
    if (!name.startsWith(CACHE_PREFIX)) continue;
    const key = name.slice(CACHE_PREFIX.length), value = await manifest(key);
    if (value && canRetireCache(value.savedAt, Date.now(), active.has(key))) {
      await caches.delete(name); await metadata.delete(metaUrl(key)); manifests.delete(key);
    }
  }
  const live = new Set(clients.map(client => client.id));
  for (const request of await metadata.keys()) {
    const prefix = metaUrl('client/');
    if (request.url.startsWith(prefix) && !live.has(request.url.slice(prefix.length))) {
      clientKeys.delete(request.url.slice(prefix.length)); await metadata.delete(request);
    }
  }
}
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (!['BIND_ASSET_CACHE', 'WARM_ASSET_CACHE'].includes(event.data?.type)) return;
  event.waitUntil((async () => {
    try {
      const value = event.data.type === 'BIND_ASSET_CACHE' ? await bind(event.source, event.data.key) : await manifest(await clientKey(event.source?.id));
      if (!value) return;
      event.ports[0]?.postMessage({ ready: true, key: value.key });
      // Recover initial scripts/fonts fetched before first service-worker control.
      for (const path of (event.data.warm || []).slice(0, 80)) {
        if (!staticPath(path) || !value.assets.some(item => item.path === path)) continue;
        const client = await self.clients.get(event.source.id);
        if (!client || client.visibilityState === 'hidden') break;
        try { await cachedResource(new Request(origin + path, { credentials: 'same-origin' }), value.key); } catch { break; }
      }
      if (event.data.type === "BIND_ASSET_CACHE") await prune();
    } catch { event.ports[0]?.postMessage({ ready: false }); }
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== origin || !staticPath(url.pathname)) return;
  event.respondWith((async () => {
    try {
      const key = await clientKey(event.clientId, request.url);
      return key ? await cachedResource(request, key) : fetch(request);
    } catch { return fetch(request); }
  })());
});
