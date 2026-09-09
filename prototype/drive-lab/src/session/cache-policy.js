export const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const CACHE_PREFIX = 'sedicivalvole.assets.v1.';
export const BUILD_KEY = /^\d{8}-\d{4}\.[a-f0-9]{7,40}$/;
export function staticPath(path) {
  return /^\/(assets|engine-audio|third-party|fonts|brand|artwork|ui|experiences|audio)\//.test(path)
    && !/\.php$/i.test(path) && (!/\.html?$/i.test(path) || path.startsWith('/third-party/')) && !path.includes('/..')
    && !path.startsWith('/audio/illobo/');
}
export function validManifest(value) {
  return value?.schema === 1 && BUILD_KEY.test(value.key) && Array.isArray(value.assets)
    && value.assets.length < 1500 && new Set(value.assets.map(item => item.path)).size === value.assets.length
    && value.assets.every(item => staticPath(item.path)
      && /^[a-f0-9]{64}$/.test(item.sha256) && Number.isSafeInteger(item.bytes) && item.bytes > 0 && item.bytes <= 64 * 1024 * 1024);
}
export function canRetireCache(savedAt, now, active) {
  return !active && Number.isFinite(savedAt) && now - savedAt >= RETENTION_MS;
}
