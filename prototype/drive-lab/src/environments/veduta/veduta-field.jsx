import { useEffect, useRef, useState } from 'react';
import { ContextualRail, useContextualControls } from '../../contextual-controls.jsx';
import { advanceAtlasFollowCamera, atlasMapPixelRatio, validAtlasPosition } from '../atlas/atlas-model.js';
import { createVedutaLayer } from './veduta-layer.js';
import { installVedutaPatterns } from './veduta-patterns.js';
import { createVedutaStyle, normalizeVedutaPreferences, VEDUTA_COLORS, VEDUTA_PREFERENCE_KEY, VEDUTA_STYLES, VEDUTA_VEHICLES, vedutaCamera, vedutaCameraCentre, vedutaPosition, vedutaStatus } from './veduta-model.js';
import '../../vendor-maplibre.css';
import './veduta.css';

function savedPreferences() {
  try { return normalizeVedutaPreferences(JSON.parse(localStorage.getItem(VEDUTA_PREFERENCE_KEY))); }
  catch { return normalizeVedutaPreferences(null); }
}
function applyMedium(map, preferences) {
  const style = createVedutaStyle(preferences.style);
  map.setSky(style.sky);
  for (const layer of style.layers) if (map.getLayer(layer.id)) {
    for (const [property, value] of Object.entries(layer.paint ?? {})) map.setPaintProperty(layer.id, property, value);
  }
  installVedutaPatterns(map, preferences.style);
  map.triggerRepaint();
}

/** One map and one measured GPS stream. All persisted settings are non-geographic. */
export default function VedutaField({ position, positionSamplesRef, gpsState, speed, theme, reducedMotion, onRenderer, onFrame, onRuntimeError, onRetryLocation }) {
  const host = useRef(null), mapRef = useRef(null), layerFactory = useRef(null), sceneLayerRef = useRef(null), pointRef = useRef(null);
  const latest = useRef(null), panel = useRef(null), optionsButton = useRef(null);
  const contextual = useContextualControls();
  const [preferences, setPreferences] = useState(savedPreferences);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [state, setState] = useState({ message: 'Waiting for GPS', terrain: false, mapError: false });
  const [retry, setRetry] = useState(0);
  const zoomRef = useRef(0);
  const canStart = validAtlasPosition(position);
  latest.current = { position, positionSamplesRef, speed, theme, reducedMotion, preferences, gpsState };

  useEffect(() => { try { localStorage.setItem(VEDUTA_PREFERENCE_KEY, JSON.stringify(preferences)); } catch { /* Settings remain usable without storage. */ } }, [preferences]);
  useEffect(() => {
    if (!optionsOpen) return;
    const close = event => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && (panel.current?.contains(event.target) || optionsButton.current?.contains(event.target))) return;
      setOptionsOpen(false);
      if (event.type === 'keydown') { event.stopPropagation(); optionsButton.current?.focus(); }
    };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [optionsOpen]);
  useEffect(() => { if (contextual.inert) setOptionsOpen(false); }, [contextual.inert]);

  useEffect(() => {
    if (!canStart || !host.current) { onRenderer('Veduta · waiting for GPS'); return undefined; }
    let disposed = false, failed = false, map, frame, timer, loadTimer, lastFrame = 0, lastUi = 0, lastRender = 0, lastPose = '';
    let ready = false, terrain = false, failures = 0, tileFailure = false;
    const failedTiles = new Set();
    const fail = error => {
      if (disposed || failed) return;
      failed = true; cancelAnimationFrame(frame); onRuntimeError?.(error instanceof Error ? error : new Error('Veduta renderer unavailable'));
    };
    const recover = () => {
      timer = null;
      if (disposed || document.hidden || navigator.onLine === false || failures >= 5) return;
      failures++;
      const retryMetadata = failedTiles.has('openfreemap:metadata');
      // Old coverage may never emit another tile event after the car moves.
      // New errors in this attempt repopulate the set before healthy idle.
      failedTiles.clear();
      const vector = map?.getSource('openfreemap');
      // A failed TileJSON request creates no tiles for refreshTiles to reload.
      if (retryMetadata && vector?.setUrl) vector.setUrl(createVedutaStyle().sources.openfreemap.url);
      else if (vector) map.refreshTiles('openfreemap');
      if (map?.getSource('veduta-terrain')) map.refreshTiles('veduta-terrain');
      if (map?.getSource('veduta-shading')) map.refreshTiles('veduta-shading');
    };
    const animate = now => {
      if (disposed || failed || document.hidden) return;
      frame = requestAnimationFrame(animate);
      const current = latest.current;
      const point = vedutaPosition(current.position, current.positionSamplesRef?.current, now);
      pointRef.current = point ? { ...point, reducedMotion: current.reducedMotion } : null;
      const dt = Math.min(64, Math.max(0, now - (lastFrame || now))); lastFrame = now;
      if (!ready || !point) return;
      try {
        const camera = vedutaCamera(current.speed, zoomRef.current), centre = map.getCenter();
        const target = { ...vedutaCameraCentre(point), bearing: Number.isFinite(point.heading) ? point.heading : map.getBearing(), ...camera };
        const move = advanceAtlasFollowCamera({ latitude: centre.lat, longitude: centre.lng, bearing: map.getBearing(), zoom: map.getZoom(), pitch: map.getPitch() }, target, dt, current.reducedMotion);
        if (move) map.jumpTo(move);
        if (now - lastUi > 700) {
          lastUi = now;
          const message = vedutaStatus({ online: navigator.onLine !== false, tileFailure, terrain, point });
          const mapError = tileFailure || navigator.onLine === false;
          setState(previous => previous.message === message && previous.terrain === terrain && previous.mapError === mapError ? previous : { message, terrain, mapError });
        }
        // The 3D symbol is updated inside the same map render, including while stopped.
        const pose = `${point.longitude.toFixed(8)}:${point.latitude.toFixed(8)}:${Number.isFinite(point.heading) ? point.heading.toFixed(2) : 'unknown'}`;
        if (move || pose !== lastPose) { map.triggerRepaint(); lastPose = pose; }
      } catch (error) { fail(error); }
    };
    const wake = () => {
      cancelAnimationFrame(frame); lastFrame = 0; clearTimeout(timer); timer = null;
      if (!document.hidden) { map?.resize(); if (tileFailure || !ready) { failures = 0; recover(); } frame = requestAnimationFrame(animate); }
    };
    let resize;
    (async () => {
      try {
        const maplibre = await import('../../maplibre-runtime.js');
        if (disposed || !host.current) return;
        const current = latest.current, p = current.position, camera = vedutaCamera(current.speed);
        pointRef.current = vedutaPosition(p, current.positionSamplesRef?.current, performance.now());
        map = new maplibre.Map({ container: host.current, style: createVedutaStyle(current.preferences.style, current.theme.palette),
          center: [vedutaCameraCentre(p).longitude, vedutaCameraCentre(p).latitude], bearing: Number.isFinite(p.heading) ? p.heading : 0, ...camera,
          minZoom: 13, maxZoom: 19, maxPitch: 75, interactive: false, attributionControl: false,
          canvasContextAttributes: { antialias: false }, pixelRatio: atlasMapPixelRatio(window.devicePixelRatio),
          fadeDuration: 0, renderWorldCopies: false, cancelPendingTileRequestsWhileZooming: true });
        mapRef.current = map;
        map.setVerticalFieldOfView(48);
        layerFactory.current = () => createVedutaLayer(maplibre, latest.current.preferences, () => pointRef.current, fail);
        const mountLayer = () => {
          if (disposed) return;
          applyMedium(map, latest.current.preferences);
          if (map.getLayer('veduta-illustration')) map.removeLayer('veduta-illustration');
          sceneLayerRef.current = layerFactory.current(); map.addLayer(sceneLayerRef.current); ready = true;
          clearTimeout(loadTimer); onRenderer('WebGL2 · Veduta');
        };
        map.on('style.load', mountLayer);
        map.on('sourcedata', event => {
          if (event.sourceId === 'veduta-terrain' && event.tile?.dem) terrain = true;
          if (event.tile?.state === 'loaded') failedTiles.delete(`${event.sourceId}:${event.tile.tileID?.key ?? 'metadata'}`);
          if (event.sourceDataType === 'metadata') failedTiles.delete(`${event.sourceId}:metadata`);
        });
        map.on('error', event => {
          if (disposed || failed) return;
          tileFailure = true;
          if (failedTiles.size < 256) failedTiles.add(`${event.sourceId ?? 'unknown'}:${event.tile?.tileID?.key ?? 'metadata'}`);
          setState({ message: vedutaStatus({ online: navigator.onLine !== false, tileFailure, terrain, point: pointRef.current }), terrain, mapError: true });
          if (!timer && !document.hidden && navigator.onLine !== false && failures < 5) timer = setTimeout(recover, Math.min(120000, 5000 * 2 ** failures));
        });
        map.on('idle', () => { if (ready && terrain && !failedTiles.size) { tileFailure = false; failures = 0; clearTimeout(timer); timer = null; } });
        map.on('render', () => {
          if (disposed || document.hidden || !ready) return;
          const now = performance.now(), canvas = map.getCanvas();
          onFrame(now, lastRender ? now - lastRender : 1000 / 60, 'WebGL2 · Veduta', canvas.width, canvas.height); lastRender = now;
        });
        map.getCanvas().addEventListener('webglcontextlost', fail);
        loadTimer = setTimeout(() => { if (!ready) fail(new Error('Veduta map loading timed out')); }, 45000);
        // Native sky in pinned MapLibre 6.7 does not account for map padding.
        // Geographic look-ahead lowers the marker without splitting the horizon.
        const fit = () => { map.resize(); };
        resize = new ResizeObserver(fit); resize.observe(host.current); fit();
        document.addEventListener('visibilitychange', wake); window.addEventListener('online', wake); window.addEventListener('offline', wake);
        frame = requestAnimationFrame(animate);
      } catch (error) { fail(error); }
    })();
    return () => {
      disposed = true; cancelAnimationFrame(frame); clearTimeout(timer); clearTimeout(loadTimer); resize?.disconnect();
      document.removeEventListener('visibilitychange', wake); window.removeEventListener('online', wake); window.removeEventListener('offline', wake);
      map?.getCanvas().removeEventListener('webglcontextlost', fail); map?.remove(); mapRef.current = null; layerFactory.current = null; sceneLayerRef.current = null;
    };
  }, [canStart, retry, onRenderer, onFrame, onRuntimeError]);

  useEffect(() => {
    const map = mapRef.current; if (!map?.getLayer('veduta-ground')) return;
    // Update paints and original materials in place: replacing the whole style
    // races native terrain-depth rendering and needlessly reloads geographic tiles.
    applyMedium(map, preferences); sceneLayerRef.current?.updatePreferences(preferences); map.triggerRepaint();
  }, [preferences.style]);
  useEffect(() => {
    sceneLayerRef.current?.updatePreferences(latest.current.preferences); mapRef.current?.triggerRepaint();
  }, [preferences.vehicle, preferences.color]);
  const set = (key, value) => setPreferences(previous => normalizeVedutaPreferences({ ...previous, [key]: value }));
  return <>
    <div className="veduta-field" ref={host} aria-label="Veduta illustrated geographic landscape" />
    {!canStart ? <div className="veduta-waiting" role="status"><strong>Veduta</strong><span>Waiting for the car’s GPS position</span><small>{gpsState === 'permission denied' ? 'Allow Location in this browser, then retry.' : 'The landscape starts when a usable position arrives.'}</small><button onClick={onRetryLocation}>RETRY LOCATION</button></div> : null}
    {canStart ? <>
      <ContextualRail className="veduta-rail"><nav {...contextual} className="veduta-controls" aria-label="Veduta controls" onPointerDown={event => event.stopPropagation()}>
        <label className="veduta-key"><span>STYLE</span><select aria-label="Illustration style" value={preferences.style} onChange={event => set('style', event.target.value)}>{VEDUTA_STYLES.map(name => <option key={name}>{name}</option>)}</select></label>
        <button className="veduta-key" ref={optionsButton} aria-label="Follow camera and vehicle settings" aria-expanded={optionsOpen} onClick={() => setOptionsOpen(value => !value)}><span>VIEW</span><strong>Follow</strong></button>
        {optionsOpen ? <section className="veduta-options" ref={panel} aria-label="Follow camera and vehicle settings">
          <div className="veduta-option-heading"><strong>Follow camera</strong><button onClick={() => { setOptionsOpen(false); optionsButton.current?.focus(); }}>CLOSE</button></div>
          <div className="veduta-zoom"><button aria-label="Zoom in Veduta" onClick={() => { zoomRef.current = Math.min(1, zoomRef.current + 0.25); }}>+</button><button onClick={() => { zoomRef.current = 0; }}>RESET VIEW</button><button aria-label="Zoom out Veduta" onClick={() => { zoomRef.current = Math.max(-1, zoomRef.current - 0.25); }}>−</button></div>
          <label className="veduta-vehicle-label">Vehicle<select aria-label="Vehicle shape" value={preferences.vehicle} onChange={event => set('vehicle', event.target.value)}>{VEDUTA_VEHICLES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          {preferences.vehicle !== 'point' ? <div className="veduta-colors" role="group" aria-label="Vehicle body colour">{VEDUTA_COLORS.map(color => <button key={color.id} aria-label={color.label} aria-pressed={preferences.color === color.id} onClick={() => set('color', color.id)}><span style={{ backgroundColor: color.hex }} /><small>{color.label}</small></button>)}</div> : null}
          <small>{preferences.vehicle === 'point' ? 'GPS position. The dot stays small at every zoom.' : 'Illustrative GPS marker. Road alignment and height are approximate.'}</small>
        </section> : null}
      </nav></ContextualRail>
      <div className="veduta-status" role="status"><span>{state.message}</span>{state.mapError ? <button onClick={() => { setRetry(value => value + 1); }}>RETRY MAP</button> : null}</div>
      <nav className="veduta-attribution" aria-label="Map sources"><a href="https://mapterhorn.com/attribution/" target="_blank" rel="noopener noreferrer">© Mapterhorn</a><span> · </span><a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a><span> · </span><a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a><span> · © </span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a></nav>
    </> : null}
  </>;
}
