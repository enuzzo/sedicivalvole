/* Explicit local browser QA only. Synthetic Milan/aircraft inputs are not device evidence.
   Loaded by the separate QA entry, never imported by the application or public package. */
(() => {
  if (!['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error('Local QA only');
  const params = new URLSearchParams(location.search);
  localStorage.setItem('sedicivalvole.diagnostics.v1', JSON.stringify({ mode: 'dev', automatic: false }));
  const preferences = JSON.parse(localStorage.getItem('sedicivalvole.preferences.v2') || '{}');
  localStorage.setItem('sedicivalvole.preferences.v2', JSON.stringify({ ...preferences, muted: true, engineMuted: true }));
  const match = window.matchMedia.bind(window);
  window.matchMedia = query => {
    const result = match(query);
    if ((params.get('phone') === '1' && query === '(pointer: coarse)') ||
      (params.get('reduced') === '1' && query === '(prefers-reduced-motion: reduce)')) {
      Object.defineProperty(result, 'matches', { value: true });
    }
    return result;
  };
  const fix = () => ({ timestamp: Date.now(), coords: { latitude: 45.4642, longitude: 9.19,
    accuracy: 10, altitude: 122, altitudeAccuracy: 5, heading: 90, speed: Number(params.get('speed') || 0) / 3.6 } });
  const timers = new Map(); let next = 1;
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
    getCurrentPosition: success => setTimeout(() => success(fix()), 20),
    watchPosition: success => { const id = next++; success(fix()); timers.set(id, setInterval(() => success(fix()), 1000)); return id; },
    clearWatch: id => { clearInterval(timers.get(id)); timers.delete(id); },
  } });
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, options) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (/diagnostic|report.*\.php/.test(url.pathname)) return Promise.reject(new Error('QA blocks diagnostic delivery'));
    if (url.pathname.endsWith('/radar-data.php')) return Promise.resolve(Response.json({ now: Date.now(), ac: [
      { hex: 'abc123', lat: 45.48, lon: 9.21, seen_pos: 0, seen: 0, flight: 'QA123', r: 'QA-TEST', t: 'A320', category: 'A3', alt_baro: 12000, alt_geom: 12200, gs: 240, track: 90 },
      { hex: 'def456', lat: 45.44, lon: 9.17, seen_pos: 0, seen: 0, flight: 'QA456', t: 'B738', category: 'A3', alt_baro: 18000, gs: 310, track: 210 },
    ] }));
    if (url.pathname.includes('/radar-') && url.pathname.endsWith('.php')) return Promise.resolve(Response.json({}));
    return originalFetch(input, options);
  };
})();
