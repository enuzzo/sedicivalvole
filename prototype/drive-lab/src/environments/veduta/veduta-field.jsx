import { useEffect, useRef, useState } from 'react';
import { ContextualRail, useContextualControls } from '../../contextual-controls.jsx';
import { DisclosureCaret } from '../../ui/disclosure-caret.jsx';
import { useOutsideDismiss } from '../../ui/use-outside-dismiss.js';
import { advanceAtlasFollowCamera, atlasMapPixelRatio, validAtlasPosition } from '../atlas/atlas-model.js';
import { createVedutaLayer } from './veduta-layer.js';
import { createVedutaFinish } from './veduta-finish.js';
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
  const latest = useRef(null), displayed = useRef(null), panel = useRef(null), controls = useRef(null), optionsButton = useRef(null);
  const contextual = useContextualControls();
  const [preferences, setPreferences] = useState(savedPreferences);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [state, setState] = useState({ message: 'Waiting for GPS', terrain: false, mapError: false });
  const [retry, setRetry] = useState(0);
  const zoomRef = useRef(0);
  const canStart = validAtlasPosition(position);
  latest.current = { position, positionSamplesRef, speed, theme, reducedMotion, preferences, gpsState };
  const closeOptions = () => { setOptionsOpen(false); optionsButton.current?.focus({ preventScroll: true }); };
  useOutsideDismiss(controls, optionsOpen, closeOptions);

  useEffect(() => { try { localStorage.setItem(VEDUTA_PREFERENCE_KEY, JSON.stringify(preferences)); } catch { /* Settings remain usable without storage. */ } }, [preferences]);
  useEffect(() => {
    if (!optionsOpen) return;
    const close = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopPropagation(); closeOptions();
    };
    const focus = requestAnimationFrame(() => panel.current?.querySelector('button')?.focus({ preventScroll: true }));
    document.addEventListener('keydown', close);
    return () => { cancelAnimationFrame(focus); document.removeEventListener('keydown', close); };
  }, [optionsOpen]);
  useEffect(() => { if (contextual.inert) setOptionsOpen(false); }, [contextual.inert]);

  useEffect(() => {
    if (!canStart || !host.current) { onRenderer('Veduta · waiting for GPS'); return undefined; }
    let disposed = false, failed = false, map, frame, timer, loadTimer, lastFrame = 0, lastUi = 0, lastPose = '';
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
        if (move || pose !== lastPose) {
          // The camera RAF owns this update. Cancel MapLibre's deferred second
          // RAF and draw the current pose now, as in the shared Atlas owner.
          map.triggerRepaint(); map.redraw(); lastPose = pose;
        }
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
        layerFactory.current = () => createVedutaLayer(maplibre, latest.current.preferences, () => pointRef.current, fail, style => {
          if (disposed || displayed.current?.style === style) return;
          displayed.current = { ...latest.current.preferences, style }; applyMedium(map, displayed.current);
        });
        const mountLayer = () => {
          if (disposed) return;
          displayed.current = { ...latest.current.preferences }; applyMedium(map, displayed.current);
          if (map.getLayer('veduta-illustration')) map.removeLayer('veduta-illustration');
          sceneLayerRef.current = layerFactory.current(); map.addLayer(sceneLayerRef.current); ready = true;
          if (map.getLayer('veduta-medium-finish')) map.removeLayer('veduta-medium-finish');
          map.addLayer(createVedutaFinish(() => displayed.current, () => pointRef.current, fail));
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
          onFrame(now, 1000 / 60, 'WebGL2 · Veduta', canvas.width, canvas.height);
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
    // The completed scenery job atomically switches native paints and finish.
    sceneLayerRef.current?.updatePreferences(preferences); map.triggerRepaint();
  }, [preferences.style]);
  useEffect(() => {
    sceneLayerRef.current?.updatePreferences(latest.current.preferences); mapRef.current?.triggerRepaint();
  }, [preferences.vehicle, preferences.color]);
  const set = (key, value) => setPreferences(previous => normalizeVedutaPreferences({ ...previous, [key]: value }));
  const nextStyle = VEDUTA_STYLES[(VEDUTA_STYLES.indexOf(preferences.style) + 1) % VEDUTA_STYLES.length];
  return <>
    <div className="veduta-field" ref={host} aria-label="Veduta illustrated geographic landscape" />
    {!canStart ? <div className="veduta-waiting" role="status"><strong>Veduta</strong><span>Waiting for the car’s GPS position</span><small>{gpsState === 'permission denied' ? 'Allow Location in this browser, then retry.' : 'The landscape starts when a usable position arrives.'}</small><button onClick={onRetryLocation}>RETRY LOCATION</button></div> : null}
    {canStart ? <>
      <ContextualRail className="veduta-rail"><nav {...contextual} ref={controls} className="veduta-controls visual-cycle-rail" aria-label="Veduta controls" data-contextual-dialog={optionsOpen ? 'open' : undefined} onPointerDown={event => event.stopPropagation()}
        onBlurCapture={event => { if (optionsOpen && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOptionsOpen(false); }}>
        <button className="visual-cycle-button" type="button" aria-label={`Illustration style ${preferences.style}. Next ${nextStyle}`} onClick={() => set('style', nextStyle)}><span>STYLE</span><small>{preferences.style}</small></button>
        <button className="visual-cycle-button veduta-view-key" type="button" ref={optionsButton} aria-label="Follow camera and vehicle settings" aria-haspopup="dialog" aria-controls="veduta-view-options" aria-expanded={optionsOpen} onClick={() => setOptionsOpen(value => !value)}><span>VIEW</span><small>Follow</small><DisclosureCaret /></button>
        {optionsOpen ? <section className="veduta-options" id="veduta-view-options" ref={panel} role="dialog" aria-modal="false" aria-labelledby="veduta-view-title">
          <div className="veduta-option-heading"><strong id="veduta-view-title">Follow camera</strong><button onClick={closeOptions}>CLOSE</button></div>
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
