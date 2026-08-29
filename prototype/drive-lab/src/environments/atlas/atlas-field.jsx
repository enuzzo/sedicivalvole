import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  advanceAtlasDemoPosition,
  atlasKeyboardShortcutAvailable,
  createLatestAtlasRequestGate,
  normalizeNearbyPages,
  createAtlasStyle,
  paletteToAtlasCss,
  speedToAtlasCamera,
  validAtlasPosition,
  wikipediaNearbyUrl,
} from "./atlas-model.js";
import {
  canvasFramebufferSize,
  frameTelemetryIsDue,
  THIRTY_FPS_FRAME_INTERVAL_MS,
} from "../../render-telemetry.js";

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

function NearbyPanel({ pages, selectedId, onSelect, qrUrl, loading, demo, collapsed }) {
  const selected = pages.find((page) => page.id === selectedId) ?? pages[0];
  return (
    <aside
      id="atlas-passenger-panel"
      className="atlas-panel"
      aria-live="polite"
      aria-hidden={collapsed}
      inert={collapsed ? true : undefined}
    >
      <header>
        <small>{demo ? "DEMO LOCATION" : "NEARBY"}</small>
        <strong>{selected?.title ?? (loading ? "Reading the city…" : "Location unavailable")}</strong>
        {selected?.summary || selected?.thumbnail ? (
          <div className={`atlas-selected-context${selected.thumbnail ? "" : " is-text-only"}`}>
            {selected.thumbnail ? (
              <img
                src={selected.thumbnail}
                width={selected.thumbnailWidth ?? undefined}
                height={selected.thumbnailHeight ?? undefined}
                alt=""
                decoding="async"
              />
            ) : null}
            {selected.summary ? <p>{selected.summary}</p> : null}
          </div>
        ) : null}
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

export default function AtlasField({
  speed,
  theme,
  position,
  reducedMotion,
  onRenderer,
  onFrame,
  onRuntimeError,
  keyboardShortcutsEnabled = true,
}) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const valuesRef = useRef({ speed, theme, position, reducedMotion });
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoPosition, setDemoPosition] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const nearbyRequestGateRef = useRef(null);
  const qrRequestGateRef = useRef(null);
  if (!nearbyRequestGateRef.current) nearbyRequestGateRef.current = createLatestAtlasRequestGate();
  if (!qrRequestGateRef.current) qrRequestGateRef.current = createLatestAtlasRequestGate();
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
    let failed = false;
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
      const fail = (error) => {
        if (disposed || failed) return;
        failed = true;
        cancelAnimationFrame(frame);
        onRenderer("Atlas unavailable");
        onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
      };
      let mapReady = false;
      map.addControl(new maplibregl.AttributionControl({ compact: false }), "bottom-left");
      map.on("load", () => {
        try {
          map.setPaintProperty("sedicivalvole-buildings", "fill-extrusion-height", [
            "*", ["coalesce", ["get", "render_height"], 5], camera.buildingScale,
          ]);
          recolourStyle(map, valuesRef.current.theme.palette);
          mapReady = true;
          onRenderer("WebGL2 · OpenFreeMap");
        } catch (error) {
          fail(error);
        }
      });
      map.on("error", (event) => {
        const error = event?.error instanceof Error ? event.error : new Error("Atlas map runtime error");
        if (!mapReady || /webgl|context\s*lost|initiali[sz]/i.test(error.message)) fail(error);
      });
      let lastTelemetryFrameAt = null;
      map.on("render", () => {
        if (failed) return;
        try {
          const canvas = map.getCanvas();
          const framebuffer = canvasFramebufferSize(canvas);
          const capturedAt = performance.now();
          if (!framebuffer || !frameTelemetryIsDue(
            lastTelemetryFrameAt,
            capturedAt,
            THIRTY_FPS_FRAME_INTERVAL_MS,
          )) return;
          lastTelemetryFrameAt = capturedAt;
          onFrame(
            capturedAt,
            THIRTY_FPS_FRAME_INTERVAL_MS,
            "WebGL2 · MapLibre",
            framebuffer.width,
            framebuffer.height,
          );
        } catch (error) {
          fail(error);
        }
      });

      let lastMoveAt = 0;
      let lastBuildingScale = camera.buildingScale;
      const animate = (now) => {
        if (disposed || failed) return;
        frame = requestAnimationFrame(animate);
        try {
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
            bearing: Number.isFinite(point.heading) ? point.heading : map.getBearing(),
            pitch: nextCamera.pitch,
            zoom: nextCamera.zoom,
            duration: nextCamera.durationMs,
            essential: false,
          });
        } catch (error) {
          fail(error);
        }
      };
      frame = requestAnimationFrame(animate);
    })().catch((error) => {
      if (disposed) return;
      onRenderer("Atlas unavailable");
      onRuntimeError?.(error);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [canStart, onFrame, onRenderer, onRuntimeError]);

  useEffect(() => {
    if (!demo || !demoPosition || !keyboardShortcutsEnabled) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (!atlasKeyboardShortcutAvailable(event, keyboardShortcutsEnabled)) return;
      event.preventDefault();
      const turn = event.key === "ArrowLeft" ? -7 : 7;
      setDemoPosition((current) => current ? {
        ...current,
        heading: ((current.heading ?? 22) + turn + 360) % 360,
      } : current);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [demo, Boolean(demoPosition), keyboardShortcutsEnabled]);

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
    const resize = () => mapRef.current?.resize();
    const frame = requestAnimationFrame(resize);
    const settled = window.setTimeout(resize, 360);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settled);
    };
  }, [panelCollapsed]);

  useEffect(() => {
    const request = nearbyRequestGateRef.current.begin();
    const url = wikipediaNearbyUrl(nearbyPosition);
    if (!url) {
      request.commit(() => {
        setPages([]);
        setLoading(false);
      });
      return () => request.cancel();
    }
    const controller = new AbortController();
    request.commit(() => setLoading(true));
    fetch(url, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("nearby unavailable")))
      .then((payload) => {
        request.commit(() => {
          const nextPages = normalizeNearbyPages(payload);
          setPages(nextPages);
          setSelectedId(nextPages[0]?.id ?? null);
        });
      })
      .catch((error) => {
        request.commit(() => {
          if (error.name !== "AbortError") setPages([]);
        });
      })
      .finally(() => request.commit(() => setLoading(false)));
    return () => {
      request.cancel();
      controller.abort();
    };
  }, [nearbyPosition?.latitude, nearbyPosition?.longitude]);

  useEffect(() => {
    const request = qrRequestGateRef.current.begin();
    request.commit(() => setQrUrl(""));
    const selected = pages.find((page) => page.id === selectedId) ?? pages[0];
    if (!selected) {
      return () => request.cancel();
    }
    import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(selected.url, {
      width: 192,
      margin: 1,
      color: { dark: "#09090b", light: "#f1eee5" },
    })).then((dataUrl) => {
      request.commit(() => setQrUrl(dataUrl));
    }).catch(() => {
      request.commit(() => setQrUrl(""));
    });
    return () => request.cancel();
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
    <section
      className={`atlas-field${panelCollapsed ? " is-panel-collapsed" : ""}`}
      style={{ "--atlas-accent": paletteToAtlasCss(theme.palette).accent }}
    >
      <div className="atlas-map" ref={hostRef} aria-hidden="true" />
      {demo ? <div className="atlas-demo-hint">↑ DRIVE · ↓ BRAKE · ← → STEER</div> : null}
      <button
        className="atlas-panel-toggle"
        type="button"
        aria-controls="atlas-passenger-panel"
        aria-expanded={!panelCollapsed}
        aria-label={panelCollapsed ? "Open Atlas passenger panel" : "Collapse Atlas passenger panel"}
        onClick={() => setPanelCollapsed((current) => !current)}
      >
        <span aria-hidden="true">{panelCollapsed ? "‹" : "›"}</span>
      </button>
      <NearbyPanel
        pages={pages}
        selectedId={selectedId}
        onSelect={setSelectedId}
        qrUrl={qrUrl}
        loading={loading}
        demo={demo}
        collapsed={panelCollapsed}
      />
    </section>
  );
}
