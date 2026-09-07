import { useEffect, useRef, useState } from 'react';
import { discoverDistanceMetres, formatDiscoverDistance, discoverPreferredLanguage, discoverWikipediaUrl, normalizeDiscoverPages } from '../../discover/discover-model.js';

// Shared provider/normalizer with Discover; requests are bounded by time and travel.
export default function AtlasPlaces({ map, position, onReadMore, demo = false }) {
  const latest = useRef(position); latest.current = position;
  const [language] = useState(() => discoverPreferredLanguage(navigator.languages ?? [navigator.language]));
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState('loading');
  const [selected, setSelected] = useState(null);
  const [projected, setProjected] = useState([]);
  useEffect(() => {
    let disposed = false, controller, lastOrigin = null, lastSuccess = 0, failures = 0, nextAttempt = 0, pending = false;
    const refresh = async () => {
      if (pending || disposed || !latest.current || document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now < nextAttempt) return;
      if (lastOrigin && now - lastSuccess < 300000 && (discoverDistanceMetres(lastOrigin, latest.current) ?? 0) < 1000) return;
      if (lastSuccess && now - lastSuccess < 60000) return;
      const origin = { ...latest.current };
      const url = discoverWikipediaUrl(origin, { language, requestLimit: 20 });
      if (!url) return;
      pending = true;controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Places unavailable');
        const pages = normalizeDiscoverPages(await response.json(), origin, 12);
        if (disposed) return;
        setPlaces(pages);setStatus(pages.length ? 'ready' : 'empty');
        lastOrigin = origin;lastSuccess = now;failures = 0;
      } catch {
        if (!disposed) { setStatus('retrying'); failures++;nextAttempt = now + Math.min(300000, 10000 * 2 ** Math.min(5, failures)); }
      } finally { clearTimeout(timeout);pending = false; }
    };
    refresh();const timer = setInterval(refresh, 10000);window.addEventListener('online', refresh);
    return () => { disposed = true;clearInterval(timer);controller?.abort();window.removeEventListener('online', refresh); };
  }, [language]);
  useEffect(() => {
    if (!map) return;
    let projectedAt = -Infinity;
    const project = () => {
      if (performance.now() - projectedAt < 125) return;
      projectedAt = performance.now();
      const bounds = map.getContainer().getBoundingClientRect();
      const visible = [];
      for (const [i, place] of places.entries()) {
        const p = map.project([place.longitude, place.latitude]);
        if (p.x < 26 || p.y < 26 || p.x > bounds.width - 26 || p.y > bounds.height - 26) continue;
        if (visible.some(v => Math.hypot(v.x - p.x, v.y - p.y) < 52)) continue;
        visible.push({ ...place, x: p.x, y: p.y, number: i + 1 });
      }
      setProjected(visible.slice(0, 8));
    };
    project();map.on('move', project);map.on('resize', project);
    return () => { map.off('move', project);map.off('resize', project); };
  }, [map, places]);
  return <>
    <div onPointerDown={event => event.stopPropagation()} className="atlas-pois" aria-label="Discover places on the map">{projected.map(p => <button key={p.id} className="atlas-poi" style={{ left:p.x,top:p.y }} aria-label={`Discover ${p.title}`} aria-pressed={selected?.id === p.id} onClick={() => setSelected(p)}>{p.number}</button>)}</div>
    {selected ? <article onPointerDown={event => event.stopPropagation()} className="atlas-place-card">
      <img src={selected.thumbnail || '/third-party/tabler-icons/brand-wikipedia.svg'} alt="" onError={event => { if (!event.currentTarget.src.endsWith('/brand-wikipedia.svg')) event.currentTarget.src = '/third-party/tabler-icons/brand-wikipedia.svg'; }} />
      <div><small>{demo ? "DEMO · " : ""}DISCOVER · WIKIPEDIA · {formatDiscoverDistance(discoverDistanceMetres(position, selected))}</small><h3>{selected.title}</h3><p>{selected.summary || 'Read the complete Wikipedia article for this place.'}</p><button onClick={() => onReadMore({ ...selected, language })}>Read more</button></div>
      <button className="atlas-place-close" onClick={() => setSelected(null)} aria-label="Close place card">Close</button>
    </article> : <div className="atlas-places-hint">{demo ? "DEMO · " : ""}{status === 'ready' ? `${places.length} nearby places · tap a numbered point` : status === 'empty' ? 'No Wikipedia places found nearby' : status === 'retrying' ? 'Places unavailable · retrying automatically' : 'Finding nearby places…'}</div>}
  </>;
}
