import AtlasPlaces from "./atlas-places.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  advanceAtlasDemoPosition,
  ATLAS_DEMO_POSITION,
  appendAtlasTravelPoint,
  ATLAS_MARKER_UPDATE_INTERVAL_MS,
  ATLAS_MANUAL_CAMERA_LIMITS,
  ATLAS_ROAD_LAYER_IDS,
  atlasCardinalDirection,
  atlasContinuousHeading,
  atlasEffectProfile,
  atlasKeyboardShortcutAvailable,
  atlasManualCameraShouldReturn,
  atlasMapPaint,
  atlasMapPixelRatio,
  atlasRoadNameFromFeatures,
  atlasTravelFeature,
  atlasVehicleFeature,
  createLatestAtlasRequestGate,
  normalizeOpenMeteoElevation,
  openMeteoElevationUrl,
  createAtlasStyle,
  interpolateAtlasPosition,
  paletteToAtlasCss,
  pinchAtlasZoom,
  speedToAtlasEffectCamera,
  validAtlasPosition,
  wheelAtlasZoom,
} from "./atlas-model.js";
import {
  canvasFramebufferSize,
  THIRTY_FPS_FRAME_INTERVAL_MS,
} from "../../render-telemetry.js";

function recolourStyle(map, palette, effect = null, mapAppearance = "palette") {
  const colors = atlasMapPaint(palette, mapAppearance);
  const profile = atlasEffectProfile(effect);
  map.setPaintProperty("atlas-background", "background-color", colors.background);
  map.setPaintProperty("atlas-landcover", "fill-color", colors.landcover);
  map.setPaintProperty("atlas-landcover", "fill-opacity", colors.landcoverOpacity);
  map.setPaintProperty("atlas-landuse", "fill-color", colors.landuse);
  map.setPaintProperty("atlas-landuse", "fill-opacity", colors.landuseOpacity);
  map.setPaintProperty("atlas-water", "fill-color", colors.water);
  map.setPaintProperty("atlas-water", "fill-opacity", Math.min(1, colors.waterOpacityFloor + profile.waterOpacity));
  map.setPaintProperty("atlas-roads-underlay", "line-color", colors.roadCasing);
  map.setPaintProperty("atlas-roads", "line-color", colors.road);
  map.setPaintProperty("atlas-roads", "line-opacity", Math.min(1, colors.roadOpacityBoost + profile.roadOpacity));
  map.setPaintProperty("atlas-roads", "line-width", [
    "interpolate", ["linear"], ["zoom"],
    10, 0.25 * profile.roadWidthScale,
    17, 2 * profile.roadWidthScale,
  ]);
  map.setPaintProperty("atlas-travel-underlay", "line-color", colors.background);
  map.setPaintProperty("atlas-travel-route", "line-color", colors.accent);
  map.setPaintProperty("atlas-vehicle-ripple", "circle-color", colors.accent);
  map.setPaintProperty("atlas-vehicle-dot", "circle-color", colors.accent);
  map.setPaintProperty("atlas-vehicle-dot", "circle-stroke-color", colors.background);
  map.setPaintProperty("atlas-place-labels", "text-color", colors.label);
  map.setPaintProperty("atlas-place-labels", "text-halo-color", colors.labelHalo);
  if (map.getLayer("sedicivalvole-buildings")) {
    map.setPaintProperty("sedicivalvole-buildings", "fill-extrusion-opacity", profile.buildingOpacity);
    map.setPaintProperty("sedicivalvole-buildings", "fill-extrusion-color", [
      "interpolate", ["linear"], ["get", "render_height"],
      0, colors.buildingLow,
      80, colors.buildingMid ?? colors.accent,
      240, colors.buildingHigh ?? colors.foreground,
    ]);
  }
}

export default function AtlasField({
  speed,
  theme,
  position,
  positionSamplesRef = null,
  sessionJourneyRef = null,
  reducedMotion,
  effect,
  onRenderer,
  onFrame,
  onRuntimeError,
  keyboardShortcutsEnabled = true,
  demoRequestToken = 0,
  mapAppearance = "palette",
  appearance = "dark",
  onMapAppearanceChange,
  onReadPlace,
}) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const valuesRef = useRef({ speed, theme, position, positionSamplesRef, sessionJourneyRef, reducedMotion, effect, mapAppearance });
  const [demoPosition, setDemoPosition] = useState(null);
  const panelCollapsed = true;
  const [mapObject, setMapObject] = useState(null);
  const [framing, setFraming] = useState("follow");
  const framingRef = useRef("follow");
  const [displayCamera, setDisplayCamera] = useState(null);
  const [roadName, setRoadName] = useState(null);
  const [terrain, setTerrain] = useState({ elevationM: null, status: "unavailable" });
  const elevationRequestGateRef = useRef(null);
  const travelPointsRef = useRef([]);
  const terrainRef = useRef({ elevationM: null, status: "unavailable" });
  if (!elevationRequestGateRef.current) elevationRequestGateRef.current = createLatestAtlasRequestGate();
  valuesRef.current = {
    speed, theme, position, positionSamplesRef, sessionJourneyRef, reducedMotion, effect, mapAppearance, demoPosition,
  };

  const effectivePosition = useMemo(() => {
    if (validAtlasPosition(position)) return position;
    return demoPosition;
  }, [position, demoPosition]);
  const canStart = Boolean(effectivePosition);
  const elevationPosition = useMemo(() => effectivePosition ? {
    latitude: Math.round(effectivePosition.latitude * 100) / 100,
    longitude: Math.round(effectivePosition.longitude * 100) / 100,
  } : null, [effectivePosition?.latitude, effectivePosition?.longitude]);
  const demo = !validAtlasPosition(position) && Boolean(effectivePosition);
  useEffect(() => {
    const seededJourney = valuesRef.current.sessionJourneyRef?.current;
    travelPointsRef.current = [...(seededJourney?.travelPoints ?? [])];
  }, [canStart]);

  useEffect(() => {
    const request = elevationRequestGateRef.current.begin();
    const url = openMeteoElevationUrl(elevationPosition);
    if (!url) {
      request.commit(() => {
        const next = { elevationM: null, status: "unavailable" };
        terrainRef.current = next;
        setTerrain(next);
        if (sessionJourneyRef?.current) sessionJourneyRef.current.terrain = next;
      });
      return () => request.cancel();
    }
    request.commit(() => {
      const next = { ...terrainRef.current, status: "loading" };
      terrainRef.current = next;
      setTerrain(next);
        if (sessionJourneyRef?.current) sessionJourneyRef.current.terrain = next;
    });
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("elevation unavailable")))
      .then((payload) => {
        const elevationM = normalizeOpenMeteoElevation(payload);
        if (!Number.isFinite(elevationM)) throw new Error("invalid elevation");
        request.commit(() => {
          const next = { elevationM, status: "live" };
          terrainRef.current = next;
          setTerrain(next);
        if (sessionJourneyRef?.current) sessionJourneyRef.current.terrain = next;
        });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        request.commit(() => {
          const next = {
            elevationM: terrainRef.current.elevationM,
            status: Number.isFinite(terrainRef.current.elevationM) ? "stale" : "unavailable",
          };
          terrainRef.current = next;
          setTerrain(next);
        if (sessionJourneyRef?.current) sessionJourneyRef.current.terrain = next;
        });
      });
    return () => {
      request.cancel();
      controller.abort();
    };
  }, [elevationPosition?.latitude, elevationPosition?.longitude]);

  useEffect(() => {
    if (!demoRequestToken || validAtlasPosition(position)) return;
    setDemoPosition({ ...ATLAS_DEMO_POSITION });
  }, [demoRequestToken, position]);

  useEffect(() => {
    let disposed = false;
    let failed = false;
    let frame = 0;
    let interactionCleanup = () => {};
    setRoadName(null);
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
        style: createAtlasStyle(valuesRef.current.theme.palette, valuesRef.current.mapAppearance),
        center: [effectivePosition.longitude, effectivePosition.latitude],
        zoom: camera.zoom,
        pitch: camera.pitch,
        minPitch: ATLAS_MANUAL_CAMERA_LIMITS.minimumPitch,
        maxPitch: ATLAS_MANUAL_CAMERA_LIMITS.maximumPitch,
        bearing: Number.isFinite(effectivePosition.heading) ? effectivePosition.heading : 22,
        attributionControl: false,
        antialias: false,
        fadeDuration: 0,
        pixelRatio: atlasMapPixelRatio(window.devicePixelRatio),
        renderWorldCopies: false,
        cancelPendingTileRequestsWhileZooming: true,
      });
      mapRef.current = map;
      setMapObject(map);
      const manual = {
        pointers: new Map(),
        previousPinchDistance: null,
        lastInteractionAt: null,
        returningUntil: 0,
      };
      let continuousHeading = Number.isFinite(effectivePosition.heading)
        ? effectivePosition.heading
        : 22;
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
          recolourStyle(
            map,
            valuesRef.current.theme.palette,
            valuesRef.current.effect,
            valuesRef.current.mapAppearance,
          );
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
      map.on("move", () => {
        const heading = Math.round(((map.getBearing() % 360) + 360) % 360);
        continuousHeading = atlasContinuousHeading(continuousHeading, heading);
        setDisplayCamera({
          heading,
          pointerHeading: continuousHeading,
          pitch: Math.round(map.getPitch()),
          zoom: Math.round(map.getZoom() * 10) / 10,
        });
      });

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
        framingRef.current = "manual"; setFraming("manual");
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
          map.panBy([previous.x - event.clientX, previous.y - event.clientY], { duration: 0 });
        } else {
          const nextDistance = pointerDistance();
          if (manual.previousPinchDistance && nextDistance) {
            map.jumpTo({ zoom: pinchAtlasZoom(map.getZoom(), manual.previousPinchDistance, nextDistance) });
          }
          manual.previousPinchDistance = nextDistance;
        }
        manual.lastInteractionAt = performance.now();
        framingRef.current = "manual"; setFraming("manual");
      };
      const endManual = (event) => {
        if (!manual.pointers.has(event.pointerId)) return;
        manual.pointers.delete(event.pointerId);
        manual.previousPinchDistance = manual.pointers.size >= 2 ? pointerDistance() : null;
        manual.lastInteractionAt = performance.now();
        framingRef.current = "manual"; setFraming("manual");
        if (event.pointerType === "mouse") canvas.style.cursor = "grab";
      };
      const wheelManual = (event) => {
        if (!mapReady) return;
        event.preventDefault();
        manual.lastInteractionAt = performance.now();
        framingRef.current = "manual"; setFraming("manual");
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
      map.on("render", () => {
        if (failed) return;
        try {
          const canvas = map.getCanvas();
          const framebuffer = canvasFramebufferSize(canvas);
          const capturedAt = performance.now();
          // Count every actual MapLibre render; throttling here aliases 30 FPS
          // callbacks into 15 FPS. UI publication is already sampled separately.
          if (!framebuffer) return;
          onFrame(
            capturedAt,
            canvasFramebufferSize,
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
      let lastMarkerAt = 0;
      let lastBuildingScale = camera.buildingScale;
      const animate = (now) => {
        if (disposed || failed) return;
        frame = requestAnimationFrame(animate);
        try {
          const current = valuesRef.current;
          const interpolatedPosition = validAtlasPosition(current.position)
            ? interpolateAtlasPosition(current.positionSamplesRef?.current, now)
            : null;
          const point = interpolatedPosition
            ?? (validAtlasPosition(current.position) ? current.position : current.demoPosition);
          if (!point) return;
          if (mapReady && now - lastMarkerAt >= ATLAS_MARKER_UPDATE_INTERVAL_MS) {
            lastMarkerAt = now;
            const phase = current.reducedMotion ? 0 : (now % 1000) / 1000;
            map.getSource("atlasVehicle")?.setData(atlasVehicleFeature(
              point,
              phase,
              current.reducedMotion ? 0.24 : (1 - phase) * 0.36,
            ));
          }
          if (now - lastMoveAt < 1100) return;
          lastMoveAt = now;
          if (mapReady) {
            const projected = map.project([point.longitude, point.latitude]);
            const exactFeatures = map.queryRenderedFeatures(projected, {
              layers: ATLAS_ROAD_LAYER_IDS,
            });
            const nearbyRoadFeatures = map.queryRenderedFeatures([
              [projected.x - 28, projected.y - 28],
              [projected.x + 28, projected.y + 28],
            ], { layers: ATLAS_ROAD_LAYER_IDS });
            const roadFeatures = [...exactFeatures, ...nearbyRoadFeatures];
            const preferredLanguages = navigator.languages?.length
              ? navigator.languages
              : [navigator.language];
            const nextRoadName = atlasRoadNameFromFeatures(roadFeatures, preferredLanguages);
            setRoadName((currentRoadName) => currentRoadName === nextRoadName
              ? currentRoadName
              : nextRoadName);
          }
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
          travelPointsRef.current = current.sessionJourneyRef?.current?.travelPoints?.length
            ? current.sessionJourneyRef.current.travelPoints
            : appendAtlasTravelPoint(travelPointsRef.current, point);
          map.getSource("atlasTravel")?.setData(atlasTravelFeature(travelPointsRef.current));
          if (framingRef.current !== "follow") return;
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
      setMapObject(null);
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
      recolourStyle(mapRef.current, theme.palette, effect, mapAppearance);
    } catch {
      // The map's load handler applies the latest ref values if the style is
      // still constructing. Continuous travel-pulse repaints must not make a
      // legitimate later palette change wait for MapLibre's `loaded()` flag.
    }
  }, [effect, mapAppearance, theme]);

  useEffect(() => {
    const resize = () => mapRef.current?.resize();
    const frame = requestAnimationFrame(resize);
    const settled = window.setTimeout(resize, 360);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settled);
    };
  }, [panelCollapsed]);

  if (!effectivePosition) {
    return (
      <section className="atlas-field is-unlocated" aria-label="Atlas is waiting for location permission">
        <div className="atlas-unlocated-field" aria-hidden="true" />
      </section>
    );
  }

  const heading = displayCamera?.heading ?? Math.round(effectivePosition.heading ?? 0);
  const pointerHeading = displayCamera?.pointerHeading ?? heading;
  const cardinalDirection = atlasCardinalDirection(heading) ?? "—";
  const toggleMapAppearance = () => onMapAppearanceChange?.(
    mapAppearance === "standard" ? "palette" : "standard",
  );

  return (
    <section
      className={`atlas-field${panelCollapsed ? " is-panel-collapsed" : ""}`}
      style={{
        "--atlas-accent": paletteToAtlasCss(theme.palette).accent,
        "--atlas-secondary": paletteToAtlasCss(theme.palette).secondary,
      }}
    >
      <div className="atlas-map" ref={hostRef} />

      <nav onPointerDown={event => event.stopPropagation()} className="atlas-framing" aria-label="Map framing">{["follow", "area", "trip"].map(mode => <button key={mode} aria-pressed={framing === mode} onClick={() => {
        framingRef.current = mode; setFraming(mode);
        const map = mapRef.current; if (!map) return;
        map.stop();
        if (mode === "trip") {
          const points = sessionJourneyRef?.current?.travelPoints ?? travelPointsRef.current;
          if (points.length > 1) {
            const origin = points[0].longitude;
            const longitudes = points.map(p => origin + ((p.longitude - origin + 540) % 360) - 180);
            map.fitBounds([[Math.min(...longitudes), Math.min(...points.map(p => p.latitude))], [Math.max(...longitudes), Math.max(...points.map(p => p.latitude))]], { padding: {top:150,bottom:140,left:50,right:50}, maxZoom:14, duration:reducedMotion ? 0 : 800, pitch:0, bearing:0 });
            return;
          }
        }
        map.easeTo({center:[effectivePosition.longitude,effectivePosition.latitude],zoom:mode === "follow" ? 13.4 : 11.8,pitch:0,bearing:0,duration:reducedMotion ? 0 : 700});
      }}>{mode === "follow" && framing === "manual" ? "Follow" : mode[0].toUpperCase()+mode.slice(1)}</button>)}</nav>
      <AtlasPlaces demo={demo} map={mapObject} position={effectivePosition} onReadMore={onReadPlace} />
      <div
        className={`atlas-navigation-plaque${roadName ? "" : " is-roadless"}`}
        aria-label={`Heading ${cardinalDirection}, ${heading} degrees${roadName ? `, ${roadName}` : ""}`}
        data-pitch={displayCamera?.pitch ?? ""}
        data-zoom={displayCamera?.zoom ?? ""}
      >
        <span
          className="atlas-navigation-pointer"
          style={{ "--atlas-pointer-heading": `${pointerHeading}deg` }}
          aria-hidden="true"
        />
        <strong className="atlas-cardinal-direction">{cardinalDirection}</strong>
        <span className="atlas-heading-degrees">{String(heading).padStart(3, "0")}°</span>
        {roadName ? <span className="atlas-road-name">{roadName}</span> : null}
      </div>
      {demo ? <div className="atlas-demo-hint">DEMO LOCATION · NOT A RECORDED JOURNEY</div> : null}
      <button
        className="atlas-map-appearance"
        type="button"
        aria-pressed={mapAppearance === "standard"}
        aria-label={mapAppearance === "standard"
          ? "Map colors: standard cartographic. Switch to product palette."
          : "Map colors: product palette. Switch to standard cartographic colors."}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => {
          event.stopPropagation();
          toggleMapAppearance();
        }}
        onClick={(event) => {
          if (event.detail === 0) toggleMapAppearance();
        }}
      >
        <small>MAP COLOR</small>
        <strong>{mapAppearance === "standard" ? "NATURAL" : "PALETTE"}</strong>
      </button>

    </section>
  );
}
