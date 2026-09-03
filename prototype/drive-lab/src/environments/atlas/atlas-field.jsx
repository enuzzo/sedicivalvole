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
  atlasHeadingDistribution,
  atlasEffectProfile,
  atlasKeyboardShortcutAvailable,
  atlasJourneyDistanceMetres,
  atlasJourneySamplesForRange,
  atlasJourneyStatistics,
  atlasManualCameraShouldReturn,
  atlasMapPaint,
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
const ATLAS_CHART_FONT_FAMILY = '"Space Grotesk", ui-sans-serif, system-ui, sans-serif';
const ATLAS_CHART_TYPE = Object.freeze({
  meta: 14,
  label: 14,
  data: 15,
  value: 16,
});

function atlasChartFont(weight, size = ATLAS_CHART_TYPE.meta) {
  return `${weight} ${size}px ${ATLAS_CHART_FONT_FAMILY}`;
}

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
  const headingDistribution = useMemo(() => atlasHeadingDistribution(samples), [samples]);

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
      canvas.style.fontFamily = ATLAS_CHART_FONT_FAMILY;
      canvas.style.fontVariantNumeric = "tabular-nums";
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);
      const paper = "rgba(238, 234, 224, .92)";
      const muted = "rgba(238, 234, 224, .68)";
      const line = "rgba(238, 234, 224, .13)";
      const accent = colors.accent;
      const secondary = colors.secondary;
      const text = (value, x, y, font, color = paper, align = "left", maximumWidth = null) => {
        context.fillStyle = color;
        context.font = font;
        context.textAlign = align;
        context.textBaseline = "alphabetic";
        const characters = Array.from(String(value));
        if (characters.some((character) => /[0-9]/.test(character))) {
          const tabularDigitWidth = Math.max(
            ...Array.from("0123456789", (digit) => context.measureText(digit).width),
          );
          const advances = characters.map((character) => (
            /[0-9]/.test(character) ? tabularDigitWidth : context.measureText(character).width
          ));
          const naturalWidth = advances.reduce((total, advance) => total + advance, 0);
          const horizontalScale = Number.isFinite(maximumWidth) && naturalWidth > maximumWidth
            ? maximumWidth / naturalWidth
            : 1;
          const renderedWidth = naturalWidth * horizontalScale;
          const originX = align === "right"
            ? x - renderedWidth
            : align === "center" ? x - renderedWidth / 2 : x;
          context.save();
          context.translate(originX, y);
          context.scale(horizontalScale, 1);
          context.textAlign = "left";
          let cursor = 0;
          characters.forEach((character, index) => {
            context.fillText(character, cursor, 0);
            cursor += advances[index];
          });
          context.restore();
        } else if (Number.isFinite(maximumWidth)) {
          context.fillText(value, x, y, maximumWidth);
        } else {
          context.fillText(value, x, y);
        }
      };
      const rule = (y) => {
        context.strokeStyle = line;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(.5, y + .5);
        context.lineTo(bounds.width - .5, y + .5);
        context.stroke();
      };
      const label = (value, x, y, maximumWidth = null) => (
        text(value, x, y, atlasChartFont(700, ATLAS_CHART_TYPE.label), paper, "left", maximumWidth)
      );
      const percent = (value) => `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
      const dotLegend = (value, x, y, color) => {
        context.fillStyle = color;
        context.fillRect(x, y - 7, 10, 3);
        text(value, x + 14, y, atlasChartFont(650, ATLAS_CHART_TYPE.data), muted);
      };
      const timeLabels = rangeLabel === "1 H"
        ? ["−1 H", "−40", "−20", "NOW"]
        : rangeLabel === "SESSION"
          ? ["START", "⅓", "⅔", "NOW"]
          : ["−15 MIN", "−10", "−5", "NOW"];
      const timeAxis = (y, left, right) => {
        const axisLabels = right - left < 200
          ? rangeLabel === "1 H"
            ? ["−1H", "−40", "−20", "NOW"]
            : rangeLabel === "SESSION"
              ? ["START", "⅓", "⅔", "NOW"]
              : ["−15", "−10", "−5", "NOW"]
          : timeLabels;
        axisLabels.forEach((value, index) => {
          const x = left + index / (axisLabels.length - 1) * (right - left);
          text(
            value,
            x,
            y,
            atlasChartFont(600),
            muted,
            index === 0 ? "left" : index === timeLabels.length - 1 ? "right" : "center",
          );
        });
      };
      const smoothPath = (points) => {
        if (!points.length) return;
        context.moveTo(points[0].x, points[0].y);
        for (let index = 1; index < points.length - 1; index += 1) {
          const point = points[index];
          const next = points[index + 1];
          context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
        }
        if (points.length > 1) context.lineTo(points.at(-1).x, points.at(-1).y);
      };

      const acceleration = { top: 0, height: 88 };
      const speedBands = { top: 88, height: 70 };
      const instruments = { top: 158, height: 126 };
      const motion = { top: 284, height: Math.max(56, bounds.height - 284) };
      const plotLeft = 36;
      const plotRight = bounds.width - 8;

      rule(acceleration.top);
      label("ACCEL / BRAKING BALANCE", 0, acceleration.top + 15, bounds.width - 66);
      text("KM/H/S", bounds.width, acceleration.top + 15, atlasChartFont(600), muted, "right");
      dotLegend(`ACCEL ${percent(metrics.accelerationShare)}`, 0, acceleration.top + 31, accent);
      dotLegend(`BRAKE ${percent(metrics.brakingShare)}`, 150, acceleration.top + 31, secondary);
      const accelerationSamples = samples.filter((sample) => (
        Number.isFinite(sample.accelerationGainKmh) || Number.isFinite(sample.brakingLossKmh)
      ));
      const accelerationValues = accelerationSamples.map((sample) => (
        ((Number(sample.accelerationGainKmh) || 0) - (Number(sample.brakingLossKmh) || 0))
        / Math.max(1, ATLAS_JOURNEY_SAMPLE_INTERVAL_MS / 1000)
      ));
      const accelerationMaximum = Math.max(1, ...accelerationValues.map((value) => Math.abs(value)));
      const accelerationMidline = acceleration.top + 53;
      text(`+${accelerationMaximum.toFixed(1)}`, 0, acceleration.top + 50, atlasChartFont(600, ATLAS_CHART_TYPE.data), muted);
      text(`−${accelerationMaximum.toFixed(1)}`, 0, acceleration.top + 70, atlasChartFont(600, ATLAS_CHART_TYPE.data), muted);
      context.strokeStyle = "rgba(238,234,224,.2)";
      context.beginPath();
      context.moveTo(plotLeft, accelerationMidline + .5);
      context.lineTo(plotRight, accelerationMidline + .5);
      context.stroke();
      if (accelerationValues.length >= 2) {
        const zeroPoints = accelerationValues.map((_, index) => ({
          x: plotLeft + index / Math.max(1, accelerationValues.length - 1) * (plotRight - plotLeft),
          y: accelerationMidline,
        }));
        const positivePoints = accelerationValues.map((value, index) => ({
          x: zeroPoints[index].x,
          y: accelerationMidline - Math.max(0, value) / accelerationMaximum * 16,
        }));
        const negativePoints = accelerationValues.map((value, index) => ({
          x: zeroPoints[index].x,
          y: accelerationMidline + Math.max(0, -value) / accelerationMaximum * 16,
        }));
        for (const [points, color, direction] of [[positivePoints, accent, -1], [negativePoints, secondary, 1]]) {
          context.beginPath();
          smoothPath(points);
          context.lineTo(points.at(-1).x, accelerationMidline);
          context.lineTo(points[0].x, accelerationMidline);
          context.closePath();
          const gradient = context.createLinearGradient(0, accelerationMidline, 0, accelerationMidline + direction * 17);
          gradient.addColorStop(0, color.replace(")", " / .08)"));
          gradient.addColorStop(1, color.replace(")", " / .62)"));
          context.fillStyle = gradient;
          context.fill();
          context.strokeStyle = color;
          context.lineWidth = 1.25;
          context.beginPath();
          smoothPath(points);
          context.stroke();
        }
      } else {
        text("NO CHANGE", (plotLeft + plotRight) / 2, accelerationMidline - 5, atlasChartFont(700), muted, "center");
      }
      timeAxis(acceleration.top + acceleration.height - 4, plotLeft, plotRight);

      rule(speedBands.top);
      label("SPEED BAND DISTRIBUTION", 0, speedBands.top + 15);
      const bandY = speedBands.top + 23;
      context.fillStyle = "rgba(238,234,224,.14)";
      context.fillRect(0, bandY, bounds.width, 11);
      let bandOffset = 0;
      metrics.speedBands.forEach((band, index) => {
        const segmentWidth = bounds.width * band.share;
        context.fillStyle = index === 4 ? secondary : accent;
        context.globalAlpha = .44 + index * .09;
        context.fillRect(bandOffset, bandY, segmentWidth, 11);
        context.globalAlpha = 1;
        bandOffset += segmentWidth;
        const cellWidth = bounds.width / metrics.speedBands.length;
        const centre = cellWidth * (index + .5);
        text(band.label, centre, bandY + 24, atlasChartFont(600), muted, "center", cellWidth - 4);
        text(percent(band.share), centre, bandY + 41, atlasChartFont(750, ATLAS_CHART_TYPE.value), band.share ? (index === 4 ? secondary : accent) : muted, "center", cellWidth - 4);
      });

      rule(instruments.top);
      const splitX = Math.min(137, bounds.width * .5);
      context.strokeStyle = line;
      context.beginPath();
      context.moveTo(splitX + .5, instruments.top + 8);
      context.lineTo(splitX + .5, instruments.top + instruments.height - 8);
      context.stroke();

      label("DIRECTION HISTORY", 0, instruments.top + 15, splitX - 6);
      text(`${headingDistribution.sectorSizeDegrees}° SECTORS`, 0, instruments.top + 31, atlasChartFont(600), muted, "left", splitX - 6);
      const roseCentre = { x: 63, y: instruments.top + 81 };
      const roseInnerRadius = 10;
      const roseRingStep = 4.4;
      const roseOuterRadius = roseInnerRadius + headingDistribution.tileLimit * roseRingStep;
      context.strokeStyle = "rgba(238,234,224,.14)";
      context.lineWidth = 1;
      for (let ring = 1; ring <= headingDistribution.tileLimit; ring += 1) {
        context.beginPath();
        context.arc(roseCentre.x, roseCentre.y, roseInnerRadius + ring * roseRingStep, 0, Math.PI * 2);
        context.stroke();
      }
      const sectorAngle = Math.PI * 2 / headingDistribution.sectors.length;
      headingDistribution.sectors.forEach((sector) => {
        const start = sector.index * sectorAngle - Math.PI / 2 - sectorAngle / 2;
        const end = start + sectorAngle;
        for (let tile = 0; tile < sector.tileCount; tile += 1) {
          const inner = roseInnerRadius + tile * roseRingStep + 1;
          const outer = inner + roseRingStep - 2;
          context.beginPath();
          context.arc(roseCentre.x, roseCentre.y, outer, start + .035, end - .035);
          context.arc(roseCentre.x, roseCentre.y, inner, end - .035, start + .035, true);
          context.closePath();
          context.fillStyle = accent;
          context.globalAlpha = .4 + tile / Math.max(1, headingDistribution.tileLimit - 1) * .5;
          context.fill();
          context.globalAlpha = 1;
        }
        const angle = sector.index * sectorAngle - Math.PI / 2;
        text(
          sector.label,
          roseCentre.x + Math.cos(angle) * (roseOuterRadius + 9),
          roseCentre.y + Math.sin(angle) * (roseOuterRadius + 9) + 3,
          atlasChartFont(700),
          muted,
          "center",
        );
      });
      const currentHeading = [...samples].reverse().find((sample) => Number.isFinite(sample.headingDegrees))?.headingDegrees;
      if (Number.isFinite(currentHeading)) {
        const currentAngle = currentHeading * Math.PI / 180 - Math.PI / 2;
        context.strokeStyle = paper;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(roseCentre.x, roseCentre.y);
        context.lineTo(
          roseCentre.x + Math.cos(currentAngle) * (roseOuterRadius - 2),
          roseCentre.y + Math.sin(currentAngle) * (roseOuterRadius - 2),
        );
        context.stroke();
        context.fillStyle = paper;
        context.beginPath();
        context.arc(roseCentre.x, roseCentre.y, 2.5, 0, Math.PI * 2);
        context.fill();
      }
      const dominantHeading = headingDistribution.dominant;
      text(
        dominantHeading ? `${dominantHeading.label} ${percent(dominantHeading.share)}` : "—",
        roseCentre.x,
        roseCentre.y + 5,
        atlasChartFont(700, ATLAS_CHART_TYPE.value),
        dominantHeading ? accent : muted,
        "center",
        splitX - 12,
      );

      const elevationLeft = splitX + 10;
      const elevationRight = bounds.width;
      label("ELEVATION", elevationLeft, instruments.top + 15);
      const elevationValues = samples.filter((sample) => Number.isFinite(sample.groundElevationM));
      const elevationMinimum = statistics.minimumGroundElevationM;
      const elevationMaximum = statistics.maximumGroundElevationM;
      const elevationSummary = Number.isFinite(elevationMinimum) && Number.isFinite(elevationMaximum)
        ? `${Math.round(elevationMinimum)}–${Math.round(elevationMaximum)} M`
        : terrain.status === "loading" ? "LOADING" : "UNAVAILABLE";
      text(elevationSummary, elevationRight, instruments.top + 32, atlasChartFont(700, ATLAS_CHART_TYPE.value), terrain.status === "live" ? secondary : muted, "right");
      if (elevationValues.length >= 2) {
        const minimum = Math.min(...elevationValues.map((sample) => sample.groundElevationM));
        const maximum = Math.max(...elevationValues.map((sample) => sample.groundElevationM));
        const span = Math.max(4, maximum - minimum);
        const timeMinimum = elevationValues[0].capturedAtMs;
        const timeMaximum = Math.max(timeMinimum + 1, elevationValues.at(-1).capturedAtMs);
        const elevationTopY = instruments.top + 54;
        const elevationBottomY = instruments.top + 108;
        const elevationPoints = elevationValues.map((sample) => ({
          x: elevationLeft + (sample.capturedAtMs - timeMinimum) / (timeMaximum - timeMinimum) * (elevationRight - elevationLeft),
          y: elevationBottomY - (sample.groundElevationM - minimum) / span * (elevationBottomY - elevationTopY),
        }));
        text(`${Math.round(maximum)} M`, elevationLeft, elevationTopY + 3, atlasChartFont(600, ATLAS_CHART_TYPE.data), muted);
        text(`${Math.round(minimum)} M`, elevationLeft, elevationBottomY - 3, atlasChartFont(600, ATLAS_CHART_TYPE.data), muted);
        context.beginPath();
        smoothPath(elevationPoints);
        context.lineTo(elevationPoints.at(-1).x, elevationBottomY);
        context.lineTo(elevationPoints[0].x, elevationBottomY);
        context.closePath();
        const gradient = context.createLinearGradient(0, elevationTopY, 0, elevationBottomY);
        gradient.addColorStop(0, secondary.replace(")", " / .42)"));
        gradient.addColorStop(1, secondary.replace(")", " / .02)"));
        context.fillStyle = gradient;
        context.fill();
        context.strokeStyle = secondary;
        context.lineWidth = 1.6;
        context.beginPath();
        smoothPath(elevationPoints);
        context.stroke();
      } else {
        text("COLLECTING", elevationLeft, instruments.top + 76, atlasChartFont(700, ATLAS_CHART_TYPE.value), muted);
        text("TERRAIN SAMPLES", elevationLeft, instruments.top + 94, atlasChartFont(600), muted);
      }
      timeAxis(instruments.top + instruments.height - 5, elevationLeft, elevationRight);

      rule(motion.top);
      label("MOVING VS STOPPED", 0, motion.top + 15, bounds.width * .52);
      text("RANGE SHARE", bounds.width, motion.top + 15, atlasChartFont(600), muted, "right", bounds.width * .4);
      text(`MOVING ${percent(metrics.movingShare)}`, 0, motion.top + 33, atlasChartFont(750, ATLAS_CHART_TYPE.value), accent);
      text(`STOPPED ${percent(metrics.stoppedShare)}`, bounds.width, motion.top + 33, atlasChartFont(750, ATLAS_CHART_TYPE.value), muted, "right");
      const motionY = motion.top + 36;
      context.fillStyle = "rgba(238,234,224,.18)";
      context.fillRect(0, motionY, bounds.width, 11);
      context.fillStyle = accent;
      context.fillRect(0, motionY, bounds.width * metrics.movingShare, 11);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    let disposed = false;
    document.fonts?.load(`${ATLAS_CHART_TYPE.meta}px "Space Grotesk"`).then(
      () => {
        if (!disposed) draw();
      },
      () => {},
    );
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [colors, headingDistribution, metrics, rangeLabel, samples, statistics, terrain.status]);

  const dominantSpeedBand = metrics.speedBands.reduce(
    (best, band) => (band.share > best.share ? band : best),
    metrics.speedBands[0],
  );
  const headingSummary = headingDistribution.dominant
    ? `Dominant moving direction ${headingDistribution.dominant.label}, ${Math.round(headingDistribution.dominant.share * 100)} percent, across ${headingDistribution.sectorSizeDegrees} degree sectors.`
    : "Moving direction is still being collected.";
  const summary = `Acceleration ${Math.round(metrics.accelerationShare * 100)} percent, braking ${Math.round(metrics.brakingShare * 100)} percent. Most used speed band ${dominantSpeedBand.label} kilometres per hour, ${Math.round(dominantSpeedBand.share * 100)} percent. ${headingSummary} Moving ${Math.round(metrics.movingShare * 100)} percent, stopped ${Math.round(metrics.stoppedShare * 100)} percent. Elevation ${Number.isFinite(statistics.minimumGroundElevationM) ? `${Math.round(statistics.minimumGroundElevationM)} to ${Math.round(statistics.maximumGroundElevationM)} metres` : "not yet available"}.`;

  return (
    <canvas className="atlas-drive-lab-canvas" ref={canvasRef} role="img" aria-label={summary} />
  );
}

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
          <div><dt aria-label="Distance">DIST.</dt><dd>{formatAtlasDistance(journey.distanceM)}</dd></div>
          <div><dt aria-label="Moving time">TIME</dt><dd>{formatAtlasDuration(movingTimeMs)}</dd></div>
          <div><dt aria-label="Average speed">AVG SPD</dt><dd>{Number.isFinite(journey.statistics.averageSpeedKmh) ? Math.round(journey.statistics.averageSpeedKmh) : "—"}<span>KM/H</span></dd></div>
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
  sessionJourneyRef = null,
  reducedMotion,
  effect,
  onRenderer,
  onFrame,
  onRuntimeError,
  keyboardShortcutsEnabled = true,
  demoRequestToken = 0,
  mapAppearance = "palette",
  onMapAppearanceChange,
}) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const valuesRef = useRef({ speed, theme, position, positionSamplesRef, sessionJourneyRef, reducedMotion, effect, mapAppearance });
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
    speed, theme, position, positionSamplesRef, sessionJourneyRef, reducedMotion, effect, mapAppearance, demoPosition,
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
    const seededJourney = valuesRef.current.sessionJourneyRef?.current;
    journeySamplesRef.current = [...(seededJourney?.recentSamples ?? [])];
    sessionJourneySamplesRef.current = [...(seededJourney?.sessionSamples ?? [])];
    travelPointsRef.current = [...(seededJourney?.travelPoints ?? [])];
    journeyStartedAtRef.current = canStart
      ? seededJourney?.startedAtMs ?? performance.now()
      : null;
    setJourney({
      recentSamples: journeySamplesRef.current,
      sessionSamples: sessionJourneySamplesRef.current,
      distanceM: atlasJourneyDistanceMetres(travelPointsRef.current),
      elapsedMs: 0,
      gpsAltitudeM: journeySamplesRef.current.at(-1)?.altitudeM ?? null,
      groundElevationM: null,
      nowMs: performance.now(),
    });
    if (!canStart) return undefined;
    const updateJourney = () => {
      const now = performance.now();
      const externalJourney = valuesRef.current.sessionJourneyRef?.current;
      if (externalJourney?.recentSamples?.length) {
        journeySamplesRef.current = [...externalJourney.recentSamples];
        sessionJourneySamplesRef.current = [...externalJourney.sessionSamples];
        travelPointsRef.current = [...externalJourney.travelPoints];
        const latestExternalSample = journeySamplesRef.current.at(-1);
        setJourney({
          recentSamples: journeySamplesRef.current,
          sessionSamples: sessionJourneySamplesRef.current,
          distanceM: atlasJourneyDistanceMetres(travelPointsRef.current),
          elapsedMs: now - (externalJourney.startedAtMs ?? journeyStartedAtRef.current ?? now),
          gpsAltitudeM: latestExternalSample?.altitudeM ?? null,
          groundElevationM: terrainRef.current.elevationM,
          nowMs: now,
        });
        return;
      }
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
        <strong>{mapAppearance === "standard" ? "STANDARD" : "PALETTE"}</strong>
      </button>
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
