import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  advanceAtlasDemoPosition,
  normalizeNearbyPages,
  createAtlasStyle,
  paletteToAtlasCss,
  speedToAtlasCamera,
  validAtlasPosition,
  wikipediaNearbyUrl,
} from "./atlas-model.js";

const FALLBACK_POSITION = { latitude: 45.4642, longitude: 9.19, heading: 22 };

function recolourStyle(map, palette) {
  const colors = paletteToAtlasCss(palette);
  map.setPaintProperty("atlas-background", "background-color", colors.background);
  map.setPaintProperty("atlas-landcover", "fill-color", colors.terrain);
  map.setPaintProperty("atlas-landuse", "fill-color", colors.terrain);
  map.setPaintProperty("atlas-water", "fill-color", colors.secondary);
  map.setPaintProperty("atlas-roads-underlay", "line-color", colors.background);
  map.setPaintProperty("atlas-roads", "line-color", colors.secondary);
  map.setPaintProperty("atlas-place-labels", "text-color", colors.foreground);
  map.setPaintProperty("atlas-place-labels", "text-halo-color", colors.background);
  if (map.getLayer("sedicivalvole-buildings")) {
    map.setPaintProperty("sedicivalvole-buildings", "fill-extrusion-color", [
      "interpolate", ["linear"], ["get", "render_height"],
      0, colors.terrain,
      80, colors.accent,
      240, colors.foreground,
    ]);
  }
}

function NearbyPanel({ pages, selectedId, onSelect, qrUrl, loading, demo }) {
  const selected = pages.find((page) => page.id === selectedId) ?? pages[0];
  return (
    <aside className="atlas-panel" aria-live="polite">
      <header>
        <small>{demo ? "DEMO LOCATION" : "NEARBY"}</small>
        <strong>{selected?.title ?? (loading ? "Reading the city…" : "Location unavailable")}</strong>
        {selected?.summary ? <p>{selected.summary}</p> : null}
      </header>
      {pages.length ? (
        <div className="atlas-places">
          <small>FOR THE PASSENGER</small>
          {pages.slice(0, 4).map((page, index) => (
            <button
              key={page.id}
              type="button"
              className={page.id === selected?.id ? "active" : ""}
              onClick={() => onSelect(page.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{page.title}</strong>
            </button>
          ))}
        </div>
      ) : null}
      {selected && qrUrl ? (
        <a className="atlas-qr" href={selected.url} target="_blank" rel="noreferrer" aria-label={`Open ${selected.title} on Wikipedia`}>
          <img src={qrUrl} alt="" />
          <span>SCAN TO READ</span>
        </a>
      ) : null}
    </aside>
  );
}

export default function AtlasField({ speed, theme, position, reducedMotion, onRenderer, onFrame }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const valuesRef = useRef({ speed, theme, position, reducedMotion });
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoPosition, setDemoPosition] = useState(null);
  valuesRef.current = { speed, theme, position, reducedMotion, demoPosition };

  const effectivePosition = useMemo(() => {
    if (validAtlasPosition(position)) return position;
    return demoPosition;
  }, [position, demoPosition]);
  const canStart = Boolean(effectivePosition);
  const nearbyPosition = useMemo(() => effectivePosition ? {
    latitude: Math.round(effectivePosition.latitude * 20) / 20,
    longitude: Math.round(effectivePosition.longitude * 20) / 20,
  } : null, [effectivePosition?.latitude, effectivePosition?.longitude]);
  const demo = !validAtlasPosition(position) && Boolean(effectivePosition);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    if (!hostRef.current || !effectivePosition) {
      onRenderer("Atlas · waiting for GPS");
      return undefined;
    }

    (async () => {
      const { default: maplibregl } = await import("maplibre-gl");
      if (disposed || !hostRef.current) return;
      const camera = speedToAtlasCamera(valuesRef.current.speed);
      const map = new maplibregl.Map({
        container: hostRef.current,
        style: createAtlasStyle(valuesRef.current.theme.palette),
        center: [effectivePosition.longitude, effectivePosition.latitude],
        zoom: camera.zoom,
        pitch: camera.pitch,
        bearing: Number.isFinite(effectivePosition.heading) ? effectivePosition.heading : 22,
        attributionControl: false,
        antialias: false,
        fadeDuration: 0,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
      map.on("load", () => {
        map.setPaintProperty("sedicivalvole-buildings", "fill-extrusion-height", [
          "*", ["coalesce", ["get", "render_height"], 5], camera.buildingScale,
        ]);
        recolourStyle(map, valuesRef.current.theme.palette);
        onRenderer("WebGL2 · OpenFreeMap");
      });
      map.on("render", () => {
        const canvas = map.getCanvas();
        onFrame(performance.now(), 1000 / 30, "WebGL2 · MapLibre", canvas.width, canvas.height);
      });

      let lastMoveAt = 0;
      let lastBuildingScale = camera.buildingScale;
      const animate = (now) => {
        if (disposed) return;
        frame = requestAnimationFrame(animate);
        if (now - lastMoveAt < 1100) return;
        lastMoveAt = now;
        const current = valuesRef.current;
        const point = validAtlasPosition(current.position) ? current.position : current.demoPosition;
        if (!point) return;
        const nextCamera = speedToAtlasCamera(current.reducedMotion ? Math.min(current.speed, 20) : current.speed);
        if (Math.abs(nextCamera.buildingScale - lastBuildingScale) >= 0.035) {
          lastBuildingScale = nextCamera.buildingScale;
          map.setPaintProperty("sedicivalvole-buildings", "fill-extrusion-height", [
            "*", ["coalesce", ["get", "render_height"], 5], nextCamera.buildingScale,
          ]);
        }
        map.easeTo({
          center: [point.longitude, point.latitude],
          bearing: Number.isFinite(point.heading) ? point.heading : map.getBearing() + Math.min(1.2, current.speed / 100),
          pitch: nextCamera.pitch,
          zoom: nextCamera.zoom,
          duration: nextCamera.durationMs,
          essential: false,
        });
      };
      frame = requestAnimationFrame(animate);
    })().catch(() => onRenderer("Atlas unavailable"));

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [canStart, onFrame, onRenderer]);

  useEffect(() => {
    if (!demo || !demoPosition) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const turn = event.key === "ArrowLeft" ? -7 : 7;
      setDemoPosition((current) => current ? {
        ...current,
        heading: ((current.heading ?? 22) + turn + 360) % 360,
      } : current);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [demo, Boolean(demoPosition)]);

  useEffect(() => {
    if (!demo || !demoPosition) return undefined;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const deltaSeconds = Math.min(0.3, Math.max(0, (now - previous) / 1000));
      previous = now;
      setDemoPosition((current) => advanceAtlasDemoPosition(
        current,
        valuesRef.current.reducedMotion ? Math.min(valuesRef.current.speed, 20) : valuesRef.current.speed,
        current?.heading ?? 22,
        deltaSeconds,
      ));
    }, 200);
    return () => window.clearInterval(timer);
  }, [demo, Boolean(demoPosition)]);

  useEffect(() => {
    if (mapRef.current?.loaded()) recolourStyle(mapRef.current, theme.palette);
  }, [theme]);

  useEffect(() => {
    const url = wikipediaNearbyUrl(nearbyPosition);
    if (!url) {
      setPages([]);
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(url, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("nearby unavailable")))
      .then((payload) => {
        const nextPages = normalizeNearbyPages(payload);
        setPages(nextPages);
        setSelectedId(nextPages[0]?.id ?? null);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setPages([]);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [nearbyPosition?.latitude, nearbyPosition?.longitude]);

  useEffect(() => {
    const selected = pages.find((page) => page.id === selectedId) ?? pages[0];
    if (!selected) {
      setQrUrl("");
      return undefined;
    }
    let active = true;
    import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(selected.url, {
      width: 116,
      margin: 1,
      color: { dark: "#09090b", light: "#f1eee5" },
    })).then((dataUrl) => {
      if (active) setQrUrl(dataUrl);
    });
    return () => { active = false; };
  }, [pages, selectedId]);

  if (!effectivePosition) {
    return (
      <div className="atlas-waiting">
        <strong>ATLAS</strong>
        <span>Waiting for a reliable GPS position</span>
        <button
          type="button"
          onClick={() => setDemoPosition({ ...FALLBACK_POSITION })}
        >TEST FROM MILAN</button>
      </div>
    );
  }

  return (
    <section className="atlas-field" style={{ "--atlas-accent": paletteToAtlasCss(theme.palette).accent }}>
      <div className="atlas-map" ref={hostRef} aria-hidden="true" />
      {demo ? <div className="atlas-demo-hint">↑ DRIVE · ↓ BRAKE · ← → STEER</div> : null}
      <NearbyPanel pages={pages} selectedId={selectedId} onSelect={setSelectedId} qrUrl={qrUrl} loading={loading} demo={demo} />
    </section>
  );
}
