import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  advanceAtlasDemoPosition,
  appendAtlasTravelPoint,
  atlasEffectProfile,
  atlasKeyboardShortcutAvailable,
  atlasManualCameraShouldReturn,
  atlasTravelFeature,
  createLatestAtlasRequestGate,
  normalizeNearbyPages,
  createAtlasStyle,
  manualAtlasCamera,
  paletteToAtlasCss,
  paletteToAtlasMapCss,
  pinchAtlasZoom,
  speedToAtlasEffectCamera,
  validAtlasPosition,
  wheelAtlasZoom,
  wikipediaNearbyUrl,
} from "./atlas-model.js";
import {
  canvasFramebufferSize,
  frameTelemetryIsDue,
  THIRTY_FPS_FRAME_INTERVAL_MS,
} from "../../render-telemetry.js";

const FALLBACK_POSITION = { latitude: 45.4642, longitude: 9.19, heading: 22 };

function recolourStyle(map, palette, effect = null) {
  const colors = paletteToAtlasMapCss(palette);
  const profile = atlasEffectProfile(effect);
  map.setPaintProperty("atlas-background", "background-color", colors.background);
  map.setPaintProperty("atlas-landcover", "fill-color", colors.terrain);
  map.setPaintProperty("atlas-landuse", "fill-color", colors.terrain);
  map.setPaintProperty("atlas-water", "fill-color", colors.secondary);
  map.setPaintProperty("atlas-water", "fill-opacity", profile.waterOpacity);
  map.setPaintProperty("atlas-roads-underlay", "line-color", colors.background);
  map.setPaintProperty("atlas-roads", "line-color", colors.secondary);
  map.setPaintProperty("atlas-roads", "line-opacity", profile.roadOpacity);
  map.setPaintProperty("atlas-roads", "line-width", [
    "interpolate", ["linear"], ["zoom"],
    10, 0.25 * profile.roadWidthScale,
    17, 2 * profile.roadWidthScale,
  ]);
  map.setPaintProperty("atlas-travel-underlay", "line-color", colors.background);
  map.setPaintProperty("atlas-place-labels", "text-color", colors.foreground);
  map.setPaintProperty("atlas-place-labels", "text-halo-color", colors.background);
  if (map.getLayer("sedicivalvole-buildings")) {
    map.setPaintProperty("sedicivalvole-buildings", "fill-extrusion-opacity", profile.buildingOpacity);
    map.setPaintProperty("sedicivalvole-buildings", "fill-extrusion-color", [
      "interpolate", ["linear"], ["get", "render_height"],
      0, colors.buildingLow,
      80, colors.accent,
      240, colors.foreground,
    ]);
  }
}

function NearbyPanel({ pages, selectedId, onSelect, qrUrl, loading, demo, collapsed, visiblePlaceCount }) {
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
          {pages.slice(0, visiblePlaceCount).map((page, index) => (
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
  effect,
  onRenderer,
  onFrame,
  onRuntimeError,
  keyboardShortcutsEnabled = true,
  demoRequestToken = 0,
}) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const valuesRef = useRef({ speed, theme, position, reducedMotion, effect });
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoPosition, setDemoPosition] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [displayCamera, setDisplayCamera] = useState(null);
  const [visiblePlaceCount, setVisiblePlaceCount] = useState(() => (window.innerHeight >= 560 ? 5 : 4));
  const nearbyRequestGateRef = useRef(null);
  const qrRequestGateRef = useRef(null);
  const travelPointsRef = useRef([]);
  if (!nearbyRequestGateRef.current) nearbyRequestGateRef.current = createLatestAtlasRequestGate();
  if (!qrRequestGateRef.current) qrRequestGateRef.current = createLatestAtlasRequestGate();
  valuesRef.current = { speed, theme, position, reducedMotion, effect, demoPosition };

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
    if (!demoRequestToken || validAtlasPosition(position)) return;
    setDemoPosition({ ...FALLBACK_POSITION });
  }, [demoRequestToken, position]);

  useEffect(() => {
    let disposed = false;
    let failed = false;
    let frame = 0;
    let interactionCleanup = () => {};
    if (!hostRef.current || !effectivePosition) {
      onRenderer("Atlas · waiting for GPS");
      return undefined;
    }

    (async () => {
      const { default: maplibregl } = await import("maplibre-gl");
      if (disposed || !hostRef.current) return;
      const camera = speedToAtlasEffectCamera(valuesRef.current.speed, valuesRef.current.effect);
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
      const manual = {
        pointers: new Map(),
        previousPinchDistance: null,
        lastInteractionAt: null,
        returningUntil: 0,
      };
      const fail = (error) => {
        if (disposed || failed) return;
        failed = true;
        cancelAnimationFrame(frame);
        onRenderer("Atlas unavailable");
        onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
      };
      let mapReady = false;
      map.addControl(new maplibregl.AttributionControl({ compact: false }), "bottom-left");
      map.addControl(new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: false,
        visualizePitch: true,
      }), "top-left");
      map.on("load", () => {
        try {
          map.setPaintProperty("sedicivalvole-buildings", "fill-extrusion-height", [
            "*", ["coalesce", ["get", "render_height"], 5], camera.buildingScale,
          ]);
          recolourStyle(map, valuesRef.current.theme.palette, valuesRef.current.effect);
          mapReady = true;
          map.dragPan.disable();
          map.dragRotate.disable();
          map.touchZoomRotate.disable();
          map.scrollZoom.disable();
          map.doubleClickZoom.disable();
          onRenderer("WebGL2 · OpenFreeMap");
        } catch (error) {
          fail(error);
        }
      });
      map.on("move", () => setDisplayCamera({
        heading: Math.round(((map.getBearing() % 360) + 360) % 360),
        pitch: Math.round(map.getPitch()),
        zoom: Math.round(map.getZoom() * 10) / 10,
      }));

      const canvas = map.getCanvas();
      canvas.style.touchAction = "none";
      canvas.style.cursor = "grab";
      const pointerDistance = () => {
        const [first, second] = [...manual.pointers.values()];
        return first && second ? Math.hypot(second.x - first.x, second.y - first.y) : null;
      };
      const beginManual = (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        try {
          canvas.setPointerCapture?.(event.pointerId);
        } catch {
          // Synthetic QA events and older embedded browsers may not expose an
          // active pointer capture even though their pointer stream is usable.
        }
        manual.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        manual.previousPinchDistance = manual.pointers.size >= 2 ? pointerDistance() : null;
        manual.lastInteractionAt = performance.now();
        manual.returningUntil = 0;
        map.stop();
        if (event.pointerType === "mouse") canvas.style.cursor = "grabbing";
      };
      const moveManual = (event) => {
        const previous = manual.pointers.get(event.pointerId);
        if (!previous) return;
        if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
          manual.pointers.delete(event.pointerId);
          manual.previousPinchDistance = null;
          canvas.style.cursor = "grab";
          return;
        }
        event.preventDefault();
        manual.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (manual.pointers.size === 1) {
          const camera = manualAtlasCamera({
            bearing: map.getBearing(), pitch: map.getPitch(), zoom: map.getZoom(),
          }, event.clientX - previous.x, event.clientY - previous.y);
          map.jumpTo(camera);
        } else {
          const nextDistance = pointerDistance();
          if (manual.previousPinchDistance && nextDistance) {
            map.jumpTo({ zoom: pinchAtlasZoom(map.getZoom(), manual.previousPinchDistance, nextDistance) });
          }
          manual.previousPinchDistance = nextDistance;
        }
        manual.lastInteractionAt = performance.now();
      };
      const endManual = (event) => {
        if (!manual.pointers.has(event.pointerId)) return;
        manual.pointers.delete(event.pointerId);
        manual.previousPinchDistance = manual.pointers.size >= 2 ? pointerDistance() : null;
        manual.lastInteractionAt = performance.now();
        if (event.pointerType === "mouse") canvas.style.cursor = "grab";
      };
      const wheelManual = (event) => {
        if (!mapReady) return;
        event.preventDefault();
        manual.lastInteractionAt = performance.now();
        manual.returningUntil = 0;
        map.stop();
        map.jumpTo({ zoom: wheelAtlasZoom(map.getZoom(), event.deltaY, event.deltaMode) });
      };
      canvas.addEventListener("pointerdown", beginManual, { passive: false });
      canvas.addEventListener("pointermove", moveManual, { passive: false });
      canvas.addEventListener("pointerup", endManual);
      canvas.addEventListener("pointercancel", endManual);
      canvas.addEventListener("lostpointercapture", endManual);
      canvas.addEventListener("wheel", wheelManual, { passive: false });
      interactionCleanup = () => {
        canvas.removeEventListener("pointerdown", beginManual);
        canvas.removeEventListener("pointermove", moveManual);
        canvas.removeEventListener("pointerup", endManual);
        canvas.removeEventListener("pointercancel", endManual);
        canvas.removeEventListener("lostpointercapture", endManual);
        canvas.removeEventListener("wheel", wheelManual);
      };
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
      let lastPulseAt = 0;
      let lastBuildingScale = camera.buildingScale;
      const animate = (now) => {
        if (disposed || failed) return;
        frame = requestAnimationFrame(animate);
        try {
          if (mapReady && now - lastPulseAt >= 90) {
            lastPulseAt = now;
            const phase = ((now / 1000) * (0.18 + Math.min(130, valuesRef.current.speed) / 54)) % 1;
            const colors = paletteToAtlasMapCss(valuesRef.current.theme.palette);
            const head = Math.max(0.001, Math.min(0.999, phase));
            const before = Math.max(0, head - 0.12);
            const after = Math.min(1, head + 0.12);
            map.setPaintProperty("atlas-travel-pulse", "line-gradient", [
              "interpolate", ["linear"], ["line-progress"],
              0, colors.secondary,
              before, colors.secondary,
              head, colors.accent,
              after, colors.secondary,
              1, colors.secondary,
            ]);
          }
          if (now - lastMoveAt < 1100) return;
          lastMoveAt = now;
          const current = valuesRef.current;
          const point = validAtlasPosition(current.position) ? current.position : current.demoPosition;
          if (!point) return;
          const nextCamera = speedToAtlasEffectCamera(
            current.reducedMotion ? Math.min(current.speed, 20) : current.speed,
            current.effect,
          );
          if (Math.abs(nextCamera.buildingScale - lastBuildingScale) >= 0.035) {
            lastBuildingScale = nextCamera.buildingScale;
            map.setPaintProperty("sedicivalvole-buildings", "fill-extrusion-height", [
              "*", ["coalesce", ["get", "render_height"], 5], nextCamera.buildingScale,
            ]);
          }
          travelPointsRef.current = appendAtlasTravelPoint(travelPointsRef.current, point);
          map.getSource("atlasTravel")?.setData(atlasTravelFeature(travelPointsRef.current));
          if (manual.pointers.size > 0
            || (manual.lastInteractionAt != null && !atlasManualCameraShouldReturn(manual.lastInteractionAt, now))) {
            return;
          }
          if (manual.returningUntil > now) return;
          const returningFromManual = manual.lastInteractionAt != null;
          const duration = returningFromManual ? Math.max(1600, nextCamera.durationMs) : nextCamera.durationMs;
          if (returningFromManual) {
            manual.lastInteractionAt = null;
            manual.returningUntil = now + duration;
          }
          map.easeTo({
            center: [point.longitude, point.latitude],
            bearing: Number.isFinite(point.heading) ? point.heading : map.getBearing(),
            pitch: nextCamera.pitch,
            zoom: nextCamera.zoom,
            duration,
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
      interactionCleanup();
      mapRef.current?.remove();
      mapRef.current = null;
      travelPointsRef.current = [];
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
    if (!mapRef.current) return;
    try {
      recolourStyle(mapRef.current, theme.palette, effect);
    } catch {
      // The map's load handler applies the latest ref values if the style is
      // still constructing. Continuous travel-pulse repaints must not make a
      // legitimate later palette change wait for MapLibre's `loaded()` flag.
    }
  }, [effect, theme]);

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
    const resize = () => setVisiblePlaceCount(window.innerHeight >= 700 ? 6 : window.innerHeight >= 560 ? 5 : 4);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

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
      <section className="atlas-field is-unlocated" aria-label="Atlas is waiting for location permission">
        <div className="atlas-unlocated-field" aria-hidden="true" />
      </section>
    );
  }

  return (
    <section
      className={`atlas-field${panelCollapsed ? " is-panel-collapsed" : ""}`}
      style={{ "--atlas-accent": paletteToAtlasCss(theme.palette).accent }}
    >
      <div className="atlas-map" ref={hostRef} aria-hidden="true" />
      <div
        className="atlas-heading"
        aria-label={`Map heading ${displayCamera?.heading ?? Math.round(effectivePosition.heading ?? 0)} degrees`}
        data-pitch={displayCamera?.pitch ?? ""}
        data-zoom={displayCamera?.zoom ?? ""}
      >
        {String(displayCamera?.heading ?? Math.round(effectivePosition.heading ?? 0)).padStart(3, "0")}°
      </div>
      {demo ? <div className="atlas-demo-hint">DRAG: ROTATE / TILT · WHEEL / PINCH: ZOOM</div> : null}
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
        visiblePlaceCount={visiblePlaceCount}
      />
    </section>
  );
}
