import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  advanceAtlasDemoPosition,
  ATLAS_DEMO_POSITION,
  ATLAS_HISTORY_RANGES,
  ATLAS_JOURNEY_SAMPLE_INTERVAL_MS,
  appendAtlasJourneySample,
  appendAtlasSessionJourneySample,
  appendAtlasTravelPoint,
  ATLAS_MARKER_UPDATE_INTERVAL_MS,
  ATLAS_MANUAL_CAMERA_LIMITS,
  ATLAS_ROAD_LAYER_IDS,
  atlasCardinalDirection,
  atlasContinuousHeading,
  atlasDriveLabMetrics,
  atlasEffectProfile,
  atlasKeyboardShortcutAvailable,
  atlasJourneyDistanceMetres,
  atlasJourneySamplesForRange,
  atlasJourneyStatistics,
  atlasManualCameraShouldReturn,
  atlasMapPixelRatio,
  atlasRoadNameFromFeatures,
  atlasTravelFeature,
  atlasVehicleFeature,
  createLatestAtlasRequestGate,
  cycleAtlasHistoryRange,
  normalizeOpenMeteoElevation,
  openMeteoElevationUrl,
  createAtlasStyle,
  manualAtlasCamera,
  interpolateAtlasPosition,
  paletteToAtlasCss,
  paletteToAtlasMapCss,
  pinchAtlasZoom,
  speedToAtlasEffectCamera,
  validAtlasPosition,
  wheelAtlasZoom,
} from "./atlas-model.js";
import {
  canvasFramebufferSize,
  frameTelemetryIsDue,
  THIRTY_FPS_FRAME_INTERVAL_MS,
} from "../../render-telemetry.js";

const ATLAS_CHART_PIXEL_RATIO_LIMIT = 1.5;

function formatAtlasDuration(elapsedMs) {
  const totalSeconds = Math.max(0, Math.floor((Number(elapsedMs) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatAtlasDistance(distanceM) {
  const metres = Math.max(0, Number(distanceM) || 0);
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

function AtlasDriveLabCanvas({ samples, metrics, statistics, colors, terrain, rangeLabel }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const ratio = Math.min(ATLAS_CHART_PIXEL_RATIO_LIMIT, Math.max(1, window.devicePixelRatio || 1));
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);
      const paper = "rgba(238, 234, 224, .92)";
      const muted = "rgba(238, 234, 224, .46)";
      const line = "rgba(238, 234, 224, .13)";
      const accent = colors.accent;
      const secondary = colors.secondary;
      const gap = 8;
      const halfWidth = (bounds.width - gap) / 2;
      const microHeight = Math.floor((bounds.height - gap - 104) / 2);
      const elevationTop = microHeight * 2 + gap * 2;
      const card = (column, row) => ({
        x: column * (halfWidth + gap), y: row * (microHeight + gap), width: halfWidth, height: microHeight,
      });
      const text = (value, x, y, font, color = paper, align = "left") => {
        context.fillStyle = color;
        context.font = font;
        context.textAlign = align;
        context.textBaseline = "alphabetic";
        context.fillText(value, x, y);
      };
      const frame = ({ x, y, width, height }) => {
        context.fillStyle = "rgba(255,255,255,.018)";
        context.fillRect(x, y, width, height);
        context.strokeStyle = line;
        context.lineWidth = 1;
        context.strokeRect(x + .5, y + .5, width - 1, height - 1);
      };
      const label = (value, region) => text(value, region.x + 8, region.y + 14, "600 8px ui-monospace, monospace", muted);
      const percent = (value) => `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;

      const balance = card(0, 0);
      frame(balance);
      label("ACCEL / BRAKING", balance);
      text(percent(metrics.accelerationShare), balance.x + 8, balance.y + 32, "600 15px ui-sans-serif, sans-serif", accent);
      text(percent(metrics.brakingShare), balance.x + balance.width - 8, balance.y + 32, "600 15px ui-sans-serif, sans-serif", secondary, "right");
      const balanceX = balance.x + 8;
      const balanceY = balance.y + balance.height - 17;
      const balanceWidth = balance.width - 16;
      context.fillStyle = "rgba(238,234,224,.1)";
      context.fillRect(balanceX, balanceY, balanceWidth, 7);
      context.fillStyle = accent;
      context.fillRect(balanceX, balanceY, balanceWidth * metrics.accelerationShare, 7);
      context.fillStyle = secondary;
      context.fillRect(balanceX + balanceWidth * metrics.accelerationShare, balanceY, balanceWidth * metrics.brakingShare, 7);

      const bands = card(1, 0);
      frame(bands);
      label("SPEED BANDS", bands);
      const bandMaximum = Math.max(1, ...metrics.speedBands.map((band) => band.share));
      const bandGap = 4;
      const bandWidth = (bands.width - 16 - bandGap * 4) / 5;
      metrics.speedBands.forEach((band, index) => {
        const x = bands.x + 8 + index * (bandWidth + bandGap);
        const availableHeight = Math.max(16, bands.height - 44);
        const height = Math.max(2, availableHeight * band.share / bandMaximum);
        context.fillStyle = index === 4 ? secondary : accent;
        context.globalAlpha = .48 + index * .1;
        context.fillRect(x, bands.y + bands.height - 17 - height, bandWidth, height);
        context.globalAlpha = 1;
        text(["0", "30", "60", "90", "130+"][index], x + bandWidth / 2, bands.y + bands.height - 5, "600 6px ui-monospace, monospace", muted, "center");
      });

      const heading = card(0, 1);
      frame(heading);
      label("HEADING HISTORY", heading);
      const headings = samples.filter((sample) => Number.isFinite(sample.headingDegrees));
      const currentHeading = headings.at(-1)?.headingDegrees;
      text(Number.isFinite(currentHeading) ? `${atlasCardinalDirection(currentHeading)} ${Math.round(currentHeading)}°` : "COLLECTING", heading.x + 8, heading.y + 32, "600 14px ui-sans-serif, sans-serif", paper);
      if (headings.length >= 2) {
        const continuous = [];
        headings.forEach((sample) => continuous.push(atlasContinuousHeading(continuous.at(-1), sample.headingDegrees)));
        const minimum = Math.min(...continuous);
        const maximum = Math.max(...continuous);
        const span = Math.max(45, maximum - minimum);
        context.strokeStyle = accent;
        context.lineWidth = 1.5;
        context.lineJoin = "round";
        context.beginPath();
        continuous.forEach((value, index) => {
          const x = heading.x + 8 + index / Math.max(1, continuous.length - 1) * (heading.width - 16);
          const y = heading.y + heading.height - 10 - (value - minimum) / span * Math.max(12, heading.height - 50);
          if (index) context.lineTo(x, y); else context.moveTo(x, y);
        });
        context.stroke();
      }

      const motion = card(1, 1);
      frame(motion);
      label("MOVING / STOPPED", motion);
      text(percent(metrics.movingShare), motion.x + 8, motion.y + 32, "600 15px ui-sans-serif, sans-serif", accent);
      text(percent(metrics.stoppedShare), motion.x + motion.width - 8, motion.y + 32, "600 15px ui-sans-serif, sans-serif", muted, "right");
      const motionX = motion.x + 8;
      const motionY = motion.y + motion.height - 17;
      const motionWidth = motion.width - 16;
      context.fillStyle = "rgba(238,234,224,.16)";
      context.fillRect(motionX, motionY, motionWidth, 7);
      context.fillStyle = accent;
      context.fillRect(motionX, motionY, motionWidth * metrics.movingShare, 7);

      const elevation = { x: 0, y: elevationTop, width: bounds.width, height: bounds.height - elevationTop };
      frame(elevation);
      label("ELEVATION", elevation);
      const elevationValues = samples.filter((sample) => Number.isFinite(sample.groundElevationM));
      const elevationMinimum = statistics.minimumGroundElevationM;
      const elevationMaximum = statistics.maximumGroundElevationM;
      const elevationSummary = Number.isFinite(elevationMinimum) && Number.isFinite(elevationMaximum)
        ? `${Math.round(elevationMinimum)}–${Math.round(elevationMaximum)} M`
        : terrain.status === "loading" ? "LOADING" : "UNAVAILABLE";
      text(elevationSummary, elevation.x + elevation.width - 8, elevation.y + 13, "600 7px ui-monospace, monospace", terrain.status === "live" ? accent : muted, "right");
      if (elevationValues.length >= 2) {
        const minimum = Math.min(...elevationValues.map((sample) => sample.groundElevationM));
        const maximum = Math.max(...elevationValues.map((sample) => sample.groundElevationM));
        const span = Math.max(4, maximum - minimum);
        const timeMinimum = elevationValues[0].capturedAtMs;
        const timeMaximum = Math.max(timeMinimum + 1, elevationValues.at(-1).capturedAtMs);
        context.beginPath();
        elevationValues.forEach((sample, index) => {
          const x = elevation.x + 8 + (sample.capturedAtMs - timeMinimum) / (timeMaximum - timeMinimum) * (elevation.width - 16);
          const y = elevation.y + elevation.height - 13 - (sample.groundElevationM - minimum) / span * (elevation.height - 36);
          if (index) context.lineTo(x, y); else context.moveTo(x, y);
        });
        context.lineTo(elevation.x + elevation.width - 8, elevation.y + elevation.height - 10);
        context.lineTo(elevation.x + 8, elevation.y + elevation.height - 10);
        context.closePath();
        const gradient = context.createLinearGradient(0, elevation.y, 0, elevation.y + elevation.height);
        gradient.addColorStop(0, secondary.replace(")", " / .46)"));
        gradient.addColorStop(1, secondary.replace(")", " / .03)"));
        context.fillStyle = gradient;
        context.fill();
        context.strokeStyle = secondary;
        context.lineWidth = 1.75;
        context.beginPath();
        elevationValues.forEach((sample, index) => {
          const x = elevation.x + 8 + (sample.capturedAtMs - timeMinimum) / (timeMaximum - timeMinimum) * (elevation.width - 16);
          const y = elevation.y + elevation.height - 13 - (sample.groundElevationM - minimum) / span * (elevation.height - 36);
          if (index) context.lineTo(x, y); else context.moveTo(x, y);
        });
        context.stroke();
      } else {
        text("COLLECTING TERRAIN SAMPLES", elevation.x + 8, elevation.y + elevation.height - 18, "600 7px ui-monospace, monospace", muted);
      }
      text(rangeLabel, elevation.x + elevation.width - 8, elevation.y + elevation.height - 8, "600 6px ui-monospace, monospace", muted, "right");
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [colors, metrics, rangeLabel, samples, statistics, terrain.status]);

  const summary = `Acceleration ${Math.round(metrics.accelerationShare * 100)} percent, braking ${Math.round(metrics.brakingShare * 100)} percent. Moving ${Math.round(metrics.movingShare * 100)} percent, stopped ${Math.round(metrics.stoppedShare * 100)} percent. Elevation ${Number.isFinite(statistics.minimumGroundElevationM) ? `${Math.round(statistics.minimumGroundElevationM)} to ${Math.round(statistics.maximumGroundElevationM)} metres` : "not yet available"}.`;

  return (
    <canvas className="atlas-drive-lab-canvas" ref={canvasRef} role="img" aria-label={summary} />
  );
}

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
  map.setPaintProperty("atlas-travel-route", "line-color", colors.accent);
  map.setPaintProperty("atlas-vehicle-ripple", "circle-color", colors.accent);
  map.setPaintProperty("atlas-vehicle-dot", "circle-color", colors.accent);
  map.setPaintProperty("atlas-vehicle-dot", "circle-stroke-color", colors.background);
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

function AtlasDriveLabPanel({
  demo,
  collapsed,
  speed,
  journey,
  colors,
  historyRange,
  onCycleHistoryRange,
  terrain,
}) {
  const metrics = useMemo(() => atlasDriveLabMetrics(journey.samples), [journey.samples]);
  const movingTimeMs = journey.elapsedMs * metrics.movingShare;
  return (
    <aside
      id="atlas-passenger-panel"
      className="atlas-panel"
      aria-live="polite"
      aria-hidden={collapsed}
      inert={collapsed ? true : undefined}
    >
      <section className="atlas-drive-lab" aria-label="Atlas Drive Lab journey telemetry">
        <header className="atlas-panel-section-heading">
          <div><small>ATLAS</small><strong>DRIVE LAB</strong></div>
          <button
            type="button"
            className="atlas-history-range"
            onClick={onCycleHistoryRange}
            aria-label={`History range ${historyRange.label}. Press to show ${cycleAtlasHistoryRange(historyRange.id).label}`}
            title="Cycle history range"
          >
            {historyRange.label}
          </button>
        </header>
        <dl className="atlas-drive-summary">
          <div><dt>SPEED</dt><dd>{Math.round(Math.max(0, Number(speed) || 0))}<span>KM/H</span></dd></div>
          <div><dt>DISTANCE</dt><dd>{formatAtlasDistance(journey.distanceM)}</dd></div>
          <div><dt>MOVING</dt><dd>{formatAtlasDuration(movingTimeMs)}</dd></div>
          <div><dt>AVG SPEED</dt><dd>{Number.isFinite(journey.statistics.averageSpeedKmh) ? Math.round(journey.statistics.averageSpeedKmh) : "—"}<span>KM/H</span></dd></div>
        </dl>
        <AtlasDriveLabCanvas
          samples={journey.samples}
          metrics={metrics}
          statistics={journey.statistics}
          colors={colors}
          terrain={terrain}
          rangeLabel={historyRange.label}
        />
        <div className={`atlas-terrain-source is-${terrain.status}`}>
          <span>{demo ? "DEMO · " : ""}GPS ALT {Number.isFinite(journey.gpsAltitudeM) ? `${Math.round(journey.gpsAltitudeM)} M` : "—"}</span>
          <a
            href="https://open-meteo.com/en/docs/elevation-api"
            target="_blank"
            rel="noreferrer"
            title="Terrain elevation: Open-Meteo / Copernicus DEM GLO-90"
          >
            {terrain.status.toUpperCase()} · OPEN-METEO / COPERNICUS
          </a>
        </div>
      </section>
    </aside>
  );
}

export default function AtlasField({
  speed,
  theme,
  position,
  positionSamplesRef = null,
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
  const valuesRef = useRef({ speed, theme, position, positionSamplesRef, reducedMotion, effect });
  const [demoPosition, setDemoPosition] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [displayCamera, setDisplayCamera] = useState(null);
  const [roadName, setRoadName] = useState(null);
  const [historyRangeId, setHistoryRangeId] = useState(ATLAS_HISTORY_RANGES[0].id);
  const [journey, setJourney] = useState({
    recentSamples: [], sessionSamples: [], distanceM: 0, elapsedMs: 0,
    gpsAltitudeM: null, groundElevationM: null, nowMs: 0,
  });
  const [terrain, setTerrain] = useState({ elevationM: null, status: "unavailable" });
  const elevationRequestGateRef = useRef(null);
  const travelPointsRef = useRef([]);
  const journeySamplesRef = useRef([]);
  const sessionJourneySamplesRef = useRef([]);
  const terrainRef = useRef({ elevationM: null, status: "unavailable" });
  const journeyStartedAtRef = useRef(null);
  if (!elevationRequestGateRef.current) elevationRequestGateRef.current = createLatestAtlasRequestGate();
  valuesRef.current = {
    speed, theme, position, positionSamplesRef, reducedMotion, effect, demoPosition,
  };

  const effectivePosition = useMemo(() => {
    if (validAtlasPosition(position)) return position;
    return demoPosition;
  }, [position, demoPosition]);
  const canStart = Boolean(effectivePosition);
  const elevationPosition = useMemo(() => effectivePosition ? {
    latitude: Math.round(effectivePosition.latitude * 1000) / 1000,
    longitude: Math.round(effectivePosition.longitude * 1000) / 1000,
  } : null, [effectivePosition?.latitude, effectivePosition?.longitude]);
  const demo = !validAtlasPosition(position) && Boolean(effectivePosition);
  const historyRange = ATLAS_HISTORY_RANGES.find((range) => range.id === historyRangeId)
    ?? ATLAS_HISTORY_RANGES[0];
  const selectedJourneySamples = useMemo(() => atlasJourneySamplesForRange(
    journey.recentSamples,
    journey.sessionSamples,
    historyRangeId,
    journey.nowMs,
  ), [journey.nowMs, journey.recentSamples, journey.sessionSamples, historyRangeId]);
  const selectedJourneyStatistics = useMemo(
    () => atlasJourneyStatistics(selectedJourneySamples),
    [selectedJourneySamples],
  );

  useEffect(() => {
    journeySamplesRef.current = [];
    sessionJourneySamplesRef.current = [];
    journeyStartedAtRef.current = canStart ? performance.now() : null;
    setJourney({
      recentSamples: [], sessionSamples: [], distanceM: 0, elapsedMs: 0,
      gpsAltitudeM: null, groundElevationM: null, nowMs: 0,
    });
    if (!canStart) return undefined;
    const updateJourney = () => {
      const now = performance.now();
      const latestPosition = valuesRef.current.positionSamplesRef?.current?.at(-1)
        ?? valuesRef.current.position
        ?? valuesRef.current.demoPosition;
      const gpsAltitudeM = Number.isFinite(latestPosition?.altitudeM) ? latestPosition.altitudeM : null;
      const groundElevationM = terrainRef.current.elevationM;
      const nextSample = {
        capturedAtMs: now,
        speedKmh: valuesRef.current.speed,
        altitudeM: gpsAltitudeM,
        groundElevationM,
        headingDegrees: latestPosition?.heading,
      };
      journeySamplesRef.current = appendAtlasJourneySample(journeySamplesRef.current, nextSample);
      sessionJourneySamplesRef.current = appendAtlasSessionJourneySample(
        sessionJourneySamplesRef.current,
        journeySamplesRef.current.at(-1) ?? nextSample,
      );
      setJourney({
        recentSamples: journeySamplesRef.current,
        sessionSamples: sessionJourneySamplesRef.current,
        distanceM: atlasJourneyDistanceMetres(travelPointsRef.current),
        elapsedMs: now - journeyStartedAtRef.current,
        gpsAltitudeM,
        groundElevationM,
        nowMs: now,
      });
    };
    updateJourney();
    const timer = window.setInterval(updateJourney, ATLAS_JOURNEY_SAMPLE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [canStart]);

  useEffect(() => {
    const request = elevationRequestGateRef.current.begin();
    const url = openMeteoElevationUrl(elevationPosition);
    if (!url) {
      request.commit(() => {
        const next = { elevationM: null, status: "unavailable" };
        terrainRef.current = next;
        setTerrain(next);
      });
      return () => request.cancel();
    }
    request.commit(() => {
      const next = { ...terrainRef.current, status: "loading" };
      terrainRef.current = next;
      setTerrain(next);
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
        style: createAtlasStyle(valuesRef.current.theme.palette),
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

  return (
    <section
      className={`atlas-field${panelCollapsed ? " is-panel-collapsed" : ""}`}
      style={{
        "--atlas-accent": paletteToAtlasCss(theme.palette).accent,
        "--atlas-secondary": paletteToAtlasCss(theme.palette).secondary,
      }}
    >
      <div className="atlas-map" ref={hostRef} aria-hidden="true" />
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
      {demo ? <div className="atlas-demo-hint">DRAG: ROTATE / TILT · WHEEL / PINCH: ZOOM</div> : null}
      <button
        className="atlas-panel-toggle"
        type="button"
        aria-controls="atlas-passenger-panel"
        aria-expanded={!panelCollapsed}
        aria-label={panelCollapsed ? "Open Atlas Drive Lab" : "Collapse Atlas Drive Lab"}
        onClick={() => setPanelCollapsed((current) => !current)}
      >
        <span className={`atlas-panel-toggle-icon ${panelCollapsed ? "is-open" : "is-collapse"}`} aria-hidden="true" />
      </button>
      <AtlasDriveLabPanel
        demo={demo}
        collapsed={panelCollapsed}
        speed={speed}
        journey={{
          ...journey,
          samples: selectedJourneySamples,
          statistics: selectedJourneyStatistics,
        }}
        historyRange={historyRange}
        onCycleHistoryRange={() => setHistoryRangeId((current) => cycleAtlasHistoryRange(current).id)}
        terrain={terrain}
        colors={paletteToAtlasCss(theme.palette)}
      />
    </section>
  );
}
