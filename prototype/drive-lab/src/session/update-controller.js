import { BUILD_KEY, RETENTION_MS } from './cache-policy.js';
export const UPDATE_CHECK_MS = 5 * 60 * 1000;
export function releaseFromHtml(html) {
  const match = html.match(/<meta\s+name="sedicivalvole-release"\s+content="([^"]+)"\s*\/?\s*>/);
  return match && BUILD_KEY.test(match[1]) ? match[1] : null;
}
export function canAutoReload({ phase, muted, source, motion, modalOpen }) {
  return !modalOpen && (phase === 'idle' || (phase === 'running' && muted && source === 'GPS'
    && motion?.freshness === 'fresh' && motion?.trustedStationary === true && motion?.rawSpeedKmh === 0));
}
export function createUpdateController({ current, now = Date.now, fetcher = fetch, available,
  safe, reload, onState = () => {}, schedule = setTimeout, cancel = clearTimeout }) {
  const started = now();
  let latest = null, checkedAt = null, pending = false, disposed = false, reloading = false;
  let timer = null, request = null, lastCheck = -Infinity, safeSince = null, lastTick = now(), lastApply = -Infinity;
  const state = () => ({ latest, current, due: Boolean(latest && (latest !== current || now() - started >= RETENTION_MS)), checkedAt, reloading });
  function apply(manual = false) {
    if (disposed || pending || reloading || !state().due || !available() || !checkedAt || now() - checkedAt > 15000) return false;
    if (!manual && (!safe() || safeSince == null || now() - safeSince < 30000)) return false;
    reloading = true; onState(state()); reload(); return true;
  }
  async function check(force = false) {
    if (disposed || pending || reloading || !available() || (!force && now() - lastCheck < UPDATE_CHECK_MS)) return;
    pending = true; lastCheck = now(); request = new AbortController();
    const deadline = schedule(() => request?.abort(), 12000);
    try {
      const response = await fetcher(`/?release-check=${now()}`, { cache: 'no-store', credentials: 'same-origin', signal: request.signal });
      if (!response.ok) throw new Error('Release check unavailable');
      const found = releaseFromHtml(await response.text());
      if (!found) throw new Error('Release identity unavailable');
      if (!disposed) { latest = found; checkedAt = now(); onState(state()); }
    } catch { checkedAt = null; /* A failed check must never trigger reload. */ }
    finally { pending = false; cancel(deadline); request = null; }
  }
  function tick() {
    if (disposed) return;
    if (now() - lastTick > 5000) safeSince = null;
    lastTick = now();
    if (available() && safe()) safeSince ??= now(); else safeSince = null;
    if (!available()) request?.abort();
    void check();
    if (state().due && available() && safe() && safeSince != null && now() - safeSince >= 30000 && !pending && now() - lastApply >= 30000) {
      lastApply = now();
      void check(true).then(() => apply());
    }
    timer = schedule(tick, available() ? 1000 : 30000);
  }
  tick();
  return {
    interact() { safeSince = null; },
    wake() { if (!available()) { request?.abort(); safeSince = null; } else { void check(true); } },
    async requestReload() { await check(true); return apply(true); },
    dispose() { disposed = true; cancel(timer); request?.abort(); },
    snapshot: state,
  };
}
