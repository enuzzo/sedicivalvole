import { useEffect, useRef, useState } from 'react';
import { ContextualRail, useContextualControls } from '../../contextual-controls.jsx';
import { DisclosureCaret } from '../../ui/disclosure-caret.jsx';
import { useOutsideDismiss } from '../../ui/use-outside-dismiss.js';
import { advanceAtlasFollowCamera, atlasMapPixelRatio, validAtlasPosition } from '../atlas/atlas-model.js';
import { createVedutaLayer } from './veduta-layer.js';
import { createVedutaFinish } from './veduta-finish.js';
import { installVedutaPatterns } from './veduta-patterns.js';
import { createVedutaStyle, normalizeVedutaPreferences, VEDUTA_COLORS, VEDUTA_PREFERENCE_KEY, VEDUTA_STYLES, VEDUTA_VEHICLES, vedutaCamera, vedutaCameraCentre, vedutaDotColor, vedutaMedium, vedutaPosition, vedutaStatus } from './veduta-model.js';
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
export default function VedutaField({ position, positionSamplesRef, gpsState, speed, theme, night = false, reducedMotion, onRenderer, onFrame, onRuntimeError, onRetryLocation }) {
  const host = useRef(null), mapRef = useRef(null), layerFactory = useRef(null), sceneLayerRef = useRef(null), pointRef = useRef(null);
  const latest = useRef(null), displayed = useRef(null), panel = useRef(null), controls = useRef(null), optionsButton = useRef(null);
  const contextual = useContextualControls();
  const [preferences, setPreferences] = useState(savedPreferences);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [state, setState] = useState({ message: 'Waiting for GPS', terrain: false, mapError: false });
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState(0);
  const zoomRef = useRef(0);
  const canStart = validAtlasPosition(position);
  // The dot colour follows PALETTE and the medium; it is derived, never persisted.
  // DARK appearance selects the night medium (Lanterne); only the base style is persisted.
  const medium = vedutaMedium(preferences.style, night);
  const dotColor = vedutaDotColor(theme?.palette, medium);
  const layerPreferences = { ...preferences, style: medium, dotColor };
  latest.current = { position, positionSamplesRef, speed, theme, reducedMotion, preferences: layerPreferences, gpsState };
  const closeOptions = () => { setOptionsOpen(false); optionsButton.current?.focus({ preventScroll: true }); };
  useOutsideDismiss(controls, optionsOpen, closeOptions);

  useEffect(() => { try { localStorage.setItem(VEDUTA_PREFERENCE_KEY, JSON.stringify(preferences)); } catch { /* Settings remain usable without storage. */ } }, [preferences]);
  useEffect(() => {
    if (!optionsOpen) return;
    const close = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopPropagation(); closeOptions();
    };
    const focus = requestAnimationFrame(() => (panel.current?.querySelector('[aria-checked="true"]') ?? panel.current?.querySelector('button'))?.focus({ preventScroll: true }));
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
          const message = vedutaStatus({ online: navigator.onLine !== false, tileFailure, terrain, point: pointRef.current });
          // A burst of tile errors renders once.
          setState(previous => previous.message === message && previous.terrain === terrain && previous.mapError ? previous : { message, terrain, mapError: true });
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
    sceneLayerRef.current?.updatePreferences(latest.current.preferences); map.triggerRepaint();
  }, [medium]);
  useEffect(() => {
    sceneLayerRef.current?.updatePreferences(latest.current.preferences); mapRef.current?.triggerRepaint();
  }, [preferences.vehicle, preferences.color, dotColor]);
  const set = (key, value) => setPreferences(previous => normalizeVedutaPreferences({ ...previous, [key]: value }));
  const changeZoom = value => { const next = Math.max(-1, Math.min(1, value)); zoomRef.current = next; setZoom(next); };
  const nextStyle = VEDUTA_STYLES[(VEDUTA_STYLES.indexOf(preferences.style) + 1) % VEDUTA_STYLES.length];
  const vehicle = VEDUTA_VEHICLES.find(item => item.id === preferences.vehicle) ?? VEDUTA_VEHICLES[0];
  return <>
    <div className="veduta-field" ref={host} aria-label="Veduta illustrated geographic landscape" />
    {!canStart ? <div className="veduta-waiting" role="status"><strong>Veduta</strong><span>Waiting for the car’s GPS position</span><small>{gpsState === 'permission denied' ? 'Allow Location in this browser, then retry.' : 'The landscape starts when a usable position arrives.'}</small><button onClick={onRetryLocation}>RETRY LOCATION</button></div> : null}
    {canStart ? <>
      <ContextualRail className="veduta-rail"><nav {...contextual} ref={controls} className="veduta-controls visual-cycle-rail" aria-label="Veduta controls" data-contextual-dialog={optionsOpen ? 'open' : undefined} onPointerDown={event => event.stopPropagation()}
        onBlurCapture={event => { if (optionsOpen && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOptionsOpen(false); }}>
        <button className="visual-cycle-button" type="button" aria-label={`Illustration style ${preferences.style}. Next ${nextStyle}`} onClick={() => set('style', nextStyle)}><span>STYLE</span><small>{preferences.style}</small></button>
        <button className="visual-cycle-button veduta-view-key" type="button" ref={optionsButton} aria-label={`View: ${vehicle.label}. Camera and marker settings`} aria-haspopup="dialog" aria-controls="veduta-view-options" aria-expanded={optionsOpen} onClick={() => setOptionsOpen(value => !value)}><span>VIEW</span><small>{vehicle.short}</small><DisclosureCaret /></button>
        {optionsOpen ? <section className="veduta-options" id="veduta-view-options" ref={panel} role="dialog" aria-modal="false" aria-label="Veduta view">
          <div className="veduta-option-group" role="group" aria-labelledby="veduta-camera-label">
            <span className="veduta-option-label" id="veduta-camera-label">Camera</span>
            <div className="veduta-zoom">
              <button type="button" aria-label="Zoom in Veduta" disabled={zoom >= 1} onClick={() => changeZoom(zoom + 0.25)}>+</button>
              <button type="button" aria-pressed={zoom === 0} onClick={() => changeZoom(0)}>Reset</button>
              <button type="button" aria-label="Zoom out Veduta" disabled={zoom <= -1} onClick={() => changeZoom(zoom - 0.25)}>−</button>
            </div>
          </div>
          <div className="veduta-option-group" role="radiogroup" aria-labelledby="veduta-marker-label">
            <span className="veduta-option-label" id="veduta-marker-label">Marker</span>
            {VEDUTA_VEHICLES.map(item => <button key={item.id} type="button" className="veduta-option-row" role="radio" aria-checked={preferences.vehicle === item.id} onClick={() => set('vehicle', item.id)}>{item.label}</button>)}
          </div>
          {preferences.vehicle !== 'point' ? <div className="veduta-colors" role="radiogroup" aria-label="Vehicle body colour">{VEDUTA_COLORS.map(color => <button key={color.id} type="button" role="radio" aria-label={color.label} title={color.label} aria-checked={preferences.color === color.id} onClick={() => set('color', color.id)}><span style={{ backgroundColor: color.hex }} /></button>)}</div> : null}
          {preferences.vehicle !== 'point' ? <small>Illustrative shape. Size and road alignment are approximate.</small> : null}
        </section> : null}
      </nav></ContextualRail>
      {state.message !== 'GPS follow' ? <div className="veduta-status" role="status"><span>{state.message}</span>{state.mapError ? <button type="button" onClick={() => { setRetry(value => value + 1); }}>RETRY MAP</button> : null}</div> : null}
      <nav className="veduta-attribution" aria-label="Map sources"><a href="https://mapterhorn.com/attribution/" target="_blank" rel="noopener noreferrer">© Mapterhorn</a><span> · </span><a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a><span> · </span><a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a><span> · © </span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a></nav>
    </> : null}
  </>;
}
