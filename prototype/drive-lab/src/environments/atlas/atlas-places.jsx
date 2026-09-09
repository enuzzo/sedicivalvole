import { normalizeOsmPlaces, combineAtlasPlaces, nearbyOsmUrl, normalizeNearbyOsm } from './osm-places.js';
import { createPlaceLoader } from './place-loader.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { discoverDistanceMetres, formatDiscoverDistance, discoverPreferredLanguage, discoverWikipediaUrl, normalizeDiscoverPages } from '../../discover/discover-model.js';

// Shared provider/normalizer with Discover; requests are bounded by time and travel.
export default function AtlasPlaces({ map, position, onReadMore, demo = false }) {
  const latest = useRef(position); latest.current = position;
  const [language] = useState(() => discoverPreferredLanguage(navigator.languages ?? [navigator.language]));
  const [places, setPlaces] = useState([]);
  const [osmPlaces, setOsmPlaces] = useState([]);
  const [status, setStatus] = useState('loading');
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [osmStatus, setOsmStatus] = useState('loading');
  const [selected, setSelected] = useState(null);
  const markerNodes = useRef(new Map());
  const mapPlaces = useMemo(() => combineAtlasPlaces(places, [...nearbyPlaces, ...osmPlaces]).slice(0, 32), [places, nearbyPlaces, osmPlaces]);
  useEffect(() => {
    const canLoad = () => document.visibilityState !== 'hidden' && navigator.onLine !== false;
    const common = { readPosition: () => latest.current, canLoad };
    const loaders = [createPlaceLoader({ ...common, onResult: setPlaces, onState: setStatus,
      load: async (origin, signal) => {
        const response = await fetch(discoverWikipediaUrl(origin, { language, requestLimit: 20 }), { signal });
        if (!response.ok) throw new Error('Wikipedia places unavailable');
        return normalizeDiscoverPages(await response.json(), origin, 12);
      } }), createPlaceLoader({ ...common, intervalMs: 300000, onResult: setNearbyPlaces, onState: setOsmStatus,
      load: async (origin, signal) => {
        const response = await fetch(nearbyOsmUrl(origin), { signal });
        if (!response.ok) throw new Error('OpenStreetMap places unavailable');
        return normalizeNearbyOsm(await response.json(), origin, language);
      } })];
    const wake = () => loaders.forEach(loader => canLoad() ? loader.wake() : loader.pause());
    loaders.forEach(loader => loader.start());
    window.addEventListener('online', wake); window.addEventListener('offline', wake);
    document.addEventListener('visibilitychange', wake);
    return () => { loaders.forEach(loader => loader.dispose()); window.removeEventListener('online', wake);
      window.removeEventListener('offline', wake); document.removeEventListener('visibilitychange', wake); };
  }, [language]);
  useEffect(() => {
    if (!map) return;
    let timer = null;
    const read = () => {
      timer = null;
      if (document.visibilityState === 'hidden' || !map.getSource('openfreemap')) return;
      try { setOsmPlaces(normalizeOsmPlaces(map.querySourceFeatures('openfreemap', { sourceLayer: 'poi' }), latest.current, language)); } catch { /* The next source event retries while the style is loading. */ }
    };
    const schedule = () => { if (timer == null) timer = setTimeout(read, 500); };
    schedule();map.on('sourcedata', schedule);map.on('moveend', schedule);
    return () => { clearTimeout(timer);map.off('sourcedata', schedule);map.off('moveend', schedule); };
  }, [map, language]);
  useEffect(() => {
    if (!map) return;
    const project = () => {
      if (document.visibilityState === 'hidden') return;
      const container = map.getContainer();
      const width = container.clientWidth, height = container.clientHeight;
      const visible = [];
      for (const place of mapPlaces) {
        const node = markerNodes.current.get(place.id);
        if (!node) continue;
        const p = map.project([place.longitude, place.latitude]);
        const shown = visible.length < 14 && p.x >= 24 && p.y >= 24 && p.x <= width - 24 && p.y <= height - 24
          && !visible.some(v => Math.hypot(v.x - p.x, v.y - p.y) < 48);
        node.hidden = !shown;
        if (!shown) continue;
        visible.push(p);
        node.style.transform = `translate3d(${p.x - 24}px, ${p.y - 24}px, 0)`;
      }
    };
    project(); map.on('render', project); map.on('resize', project);
    return () => { map.off('render', project); map.off('resize', project); };
  }, [map, mapPlaces]);
  return <>
    <div onPointerDown={event => event.stopPropagation()} className="atlas-pois" aria-label="Discover places on the map">{mapPlaces.map((p, index) => <button key={p.id} ref={node => { if (node) markerNodes.current.set(p.id, node); else markerNodes.current.delete(p.id); }} className="atlas-poi" style={{ left:0,top:0 }} aria-label={`Discover ${p.title}`} aria-pressed={selected?.id === p.id} onClick={() => setSelected(p)}>{index + 1}</button>)}</div>
    {selected ? <article onPointerDown={event => event.stopPropagation()} className={`atlas-place-card${selected.thumbnail ? "" : " is-text-only"}`}>
      {selected.thumbnail ? <img src={selected.thumbnail} alt="" onError={event => { event.currentTarget.style.visibility = "hidden"; }} /> : null}
      <div><small>{demo ? "DEMO · " : ""}{selected.source.toUpperCase()} · {formatDiscoverDistance(discoverDistanceMetres(position, selected))}</small><h3>{selected.title}</h3><p>{selected.summary || 'Read the complete Wikipedia article for this place.'}</p>{selected.source === 'OpenStreetMap' ? <div className="atlas-place-links"><a href={selected.googleMapsUrl} target="_blank" rel="noopener noreferrer">Google Maps ↗</a>{selected.wikipediaUrl ? <a href={selected.wikipediaUrl} target="_blank" rel="noopener noreferrer">Wikipedia ↗</a> : null}<a href={selected.mapUrl} target="_blank" rel="noopener noreferrer">OSM ↗</a></div> : <button onClick={() => onReadMore({ ...selected, language })}>Read more</button>}</div>
      <button className="atlas-place-close" onClick={() => setSelected(null)} aria-label="Close place card">Close</button>
    </article> : <div className="atlas-places-hint">{demo ? "DEMO · " : ""}{places.length + osmPlaces.length + nearbyPlaces.length > 0 ? `${places.length} Wikipedia · ${combineAtlasPlaces([], [...nearbyPlaces, ...osmPlaces]).length} OSM${osmStatus === "retrying" ? " · OSM retrying" : ""}` : status === 'empty' ? 'No nearby places yet · zoom in for map POIs' : status === 'retrying' ? 'Places unavailable · retrying automatically' : 'Finding nearby places…'}</div>}
  </>;
}
