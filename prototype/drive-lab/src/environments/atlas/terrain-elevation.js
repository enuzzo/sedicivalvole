import { normalizeOpenMeteoElevation, openMeteoElevationUrl } from './atlas-model.js';

export const TERRAIN_REQUEST_INTERVAL_MS = 30000;
export const TERRAIN_REQUEST_TIMEOUT_MS = 8000;
export const TERRAIN_RECOVERY_WINDOW_MS = 5 * 60 * 1000;
export const TERRAIN_CACHE_LIMIT = 128;

/** The request and cache use the same coarse cell; precise fixes never leave this module. */
export function terrainElevationCell(position) {
  if (!Number.isFinite(position?.latitude) || Math.abs(position.latitude) > 90
    || !Number.isFinite(position?.longitude) || Math.abs(position.longitude) > 180) return null;
  return [position.latitude, position.longitude]
    .map(value => (Math.round(value * 100) / 100 || 0).toFixed(2)).join(',');
}

/** One running session owns terrain requests independently of any mounted visual. */
export function createTerrainElevation({
  fetchImpl = (...args) => globalThis.fetch(...args),
  now = () => performance.now(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  canRequest = () => true,
  onResult = () => {},
} = {}) {
  const cache = new Map();
  let wanted = null;
  let needed = false;
  let status = 'unavailable';
  let paused = false;
  let destroyed = false;
  let active = null;
  let timer = null;
  let lastStartedAt = -Infinity;
  let episodeStartedAt = null;
  let failures = 0;
  let retryAt = -Infinity;

  const allowed = () => {
    try { return !paused && canRequest() === true; } catch { return false; }
  };
  const clearWake = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
  };
  const abortActive = () => {
    if (!active) return;
    active.cancelled = true;
    clearTimer(active.timeout);
    active.controller.abort();
  };
  const resetEpisode = () => {
    episodeStartedAt = null;
    failures = 0;
    retryAt = -Infinity;
  };
  const read = cell => {
    if (!destroyed && cell !== null && cache.has(cell)) {
      return { cell, elevationM: cache.get(cell), status: 'live' };
    }
    return { cell, elevationM: null, status: !destroyed && cell === wanted ? status : 'unavailable' };
  };
  const current = request => !destroyed && !request.cancelled && active === request
    && needed && wanted === request.cell && allowed();
  const schedule = delay => {
    if (timer !== null) return;
    timer = setTimer(() => { timer = null; pump(); }, Math.max(0, delay));
  };

  function pump() {
    if (destroyed || !needed || wanted === null) return;
    if (cache.has(wanted)) { status = 'live'; clearWake(); return; }
    if (!allowed()) { status = 'waiting'; clearWake(); abortActive(); return; }
    if (active) { status = active.cell === wanted && !active.cancelled ? 'loading' : 'waiting'; return; }
    const time = now();
    if (episodeStartedAt !== null && time - episodeStartedAt >= TERRAIN_RECOVERY_WINDOW_MS) {
      status = 'unavailable'; clearWake(); return;
    }
    const readyAt = Math.max(lastStartedAt + TERRAIN_REQUEST_INTERVAL_MS, retryAt);
    if (time < readyAt) {
      status = failures ? 'retrying' : 'waiting';
      const remaining = episodeStartedAt === null ? Infinity : episodeStartedAt + TERRAIN_RECOVERY_WINDOW_MS - time;
      schedule(Math.min(readyAt - time, remaining));
      return;
    }
    clearWake();
    const cell = wanted;
    const [latitude, longitude] = cell.split(',').map(Number);
    const request = { cell, controller: new AbortController(), cancelled: false, timedOut: false, timeout: null };
    active = request;
    lastStartedAt = time;
    episodeStartedAt ??= time;
    status = 'loading';
    request.timeout = setTimer(() => { request.timedOut = true; request.controller.abort(); }, TERRAIN_REQUEST_TIMEOUT_MS);
    Promise.resolve()
      .then(() => {
        if (!current(request)) return null;
        return fetchImpl(openMeteoElevationUrl({ latitude, longitude }), {
          signal: request.controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer',
        });
      })
      .then(response => {
        if (!current(request)) return null;
        if (!response?.ok || request.timedOut) throw new Error('terrain_unavailable');
        return response.json();
      })
      .then(payload => {
        if (!current(request)) return;
        const elevationM = normalizeOpenMeteoElevation(payload);
        if (!Number.isFinite(elevationM) || request.timedOut) throw new Error('terrain_unavailable');
        cache.delete(cell);
        cache.set(cell, elevationM);
        while (cache.size > TERRAIN_CACHE_LIMIT) cache.delete(cache.keys().next().value);
        status = 'live';
        resetEpisode();
        onResult({ cell, elevationM, status: 'live' });
      })
      .catch(() => {
        if (!current(request) || cache.has(cell)) return;
        failures += 1;
        retryAt = now() + Math.min(TERRAIN_REQUEST_INTERVAL_MS * 2 ** Math.min(failures - 1, 1), 60000);
        status = 'retrying';
      })
      .finally(() => {
        clearTimer(request.timeout);
        if (active === request) active = null;
        pump();
      });
  }

  return {
    lookup(position) { return read(terrainElevationCell(position)); },
    observe(position, { needed: nextNeeded = true } = {}) {
      const cell = terrainElevationCell(position);
      if (destroyed) return read(cell);
      const wantsTerrain = nextNeeded === true && cell !== null;
      if (wanted !== cell || needed !== wantsTerrain) {
        clearWake(); abortActive(); resetEpisode();
        wanted = cell; needed = wantsTerrain; status = 'unavailable';
      }
      if (cache.has(cell)) {
        const elevationM = cache.get(cell);
        cache.delete(cell); cache.set(cell, elevationM);
      }
      pump();
      return read(cell);
    },
    pause() {
      if (destroyed) return;
      paused = true; clearWake(); abortActive();
      if (needed && !cache.has(wanted)) status = 'waiting';
    },
    recover() {
      if (destroyed) return;
      paused = false;
      if (episodeStartedAt !== null && now() - episodeStartedAt >= TERRAIN_RECOVERY_WINDOW_MS) resetEpisode();
      pump();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true; clearWake(); abortActive(); cache.clear();
      wanted = null; needed = false; status = 'unavailable';
    },
  };
}
