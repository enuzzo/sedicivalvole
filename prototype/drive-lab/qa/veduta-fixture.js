// Development-only controlled observations. This entry is not a build input.
if (!import.meta.env.DEV || !['127.0.0.1', 'localhost'].includes(location.hostname)) throw new Error('Local development QA only');
const params = new URLSearchParams(location.search);
let active = true, moving = false, elapsed = 0;
// Optional ?speed=<m/s>&distance=<m> reproduce faster journeys; defaults keep the original 1.5 m/s for 40 m.
const speed = Math.max(0.1, Number(params.get('speed')) || 1.5), distance = Math.max(1, Number(params.get('distance')) || 40);
const callbacks = new Map(); let sequence = 0;
const fetchOriginal = window.fetch.bind(window);
window.fetch = (input, init) => String(typeof input === 'string' ? input : input?.url).includes('send-diagnostic.php')
  ? Promise.resolve(new Response('{}', { status: 403, headers: { 'Content-Type': 'application/json' } })) : fetchOriginal(input, init);
const fixture = () => ({ timestamp: Date.now(), coords: {
  // Public OpenFreeMap road sample, not a recorded personal journey.
  latitude: params.get('place') === 'milan' ? 45.4642 : 46.006294199042 - Math.min(distance, elapsed * speed) * 0.9978 / 111320,
  longitude: params.get('place') === 'milan' ? 9.19 : 8.958173844373498 + Math.min(distance, elapsed * speed) * 0.06605 / 77323,
  heading: 176.2124, speed: moving && elapsed * speed < distance ? speed : 0, accuracy: 4,
} });
Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
  watchPosition(callback) { const id = ++sequence; callbacks.set(id, callback); callback(fixture()); return id; },
  clearWatch(id) { callbacks.delete(id); }, getCurrentPosition(callback) { callback(fixture()); },
} });
setInterval(() => { if (active) { if (moving) elapsed += 0.2; callbacks.forEach(callback => callback(fixture())); } }, 200);
localStorage.setItem('sedicivalvole.preferences.v2', JSON.stringify({ themeId: 'blue', environmentId: 'veduta', muted: true }));
const ribbon = document.createElement('aside');
ribbon.setAttribute('aria-label', 'Synthetic GPS QA controls');
ribbon.style.cssText = 'position:fixed;z-index:10000;bottom:130px;left:12px;display:flex;gap:8px;align-items:center;background:#161c25;color:#fff;padding:6px 10px;font:13px sans-serif;border:1px solid #849aaa';
const caption = document.createElement('span'); caption.textContent = 'SYNTHETIC GPS · local QA'; ribbon.append(caption);
for (const [label, action] of [['Pause GPS', button => { active = !active; button.textContent = active ? 'Pause GPS' : 'Resume GPS'; }], ['Move fixture', button => { moving = !moving; button.textContent = moving ? 'Hold fixture' : 'Move fixture'; }]]) {
  const button = document.createElement('button'); button.textContent = label; button.style.cssText = 'min-height:48px;padding:6px 10px'; button.addEventListener('click', () => action(button)); ribbon.append(button);
}
document.body.append(ribbon);
await import('../src/main.jsx');
