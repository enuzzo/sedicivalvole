export const OPENFREEMAP_VECTOR_URL = "https://tiles.openfreemap.org/planet";
export const WIKIPEDIA_SEARCH_RADIUS_METRES = 10000;
export const ATLAS_MANUAL_IDLE_MS = 6000;
export const ATLAS_MANUAL_CAMERA_LIMITS = Object.freeze({
  minimumZoom: 3,
  maximumZoom: 20.5,
  minimumPitch: 0,
  maximumPitch: 85,
});
export const ATLAS_POSITION_BUFFER_LIMIT = 8;
export const ATLAS_POSITION_INTERPOLATION_DELAY_MS = 100;
export const ATLAS_POSITION_MAXIMUM_GAP_MS = 750;
export const ATLAS_POSITION_STALE_AFTER_MS = 1500;
export const ATLAS_TRAVEL_POINT_LIMIT = 4096;
export const ATLAS_TRAVEL_MINIMUM_DISTANCE_M = 2;
export const ATLAS_MAXIMUM_PIXEL_RATIO = 1.25;
export const ATLAS_MARKER_UPDATE_INTERVAL_MS = 125;
export const ATLAS_JOURNEY_SAMPLE_INTERVAL_MS = 2000;
export const ATLAS_JOURNEY_HISTORY_LIMIT = 1800;
export const ATLAS_SESSION_HISTORY_LIMIT = 720;
export const ATLAS_MOVING_SPEED_THRESHOLD_KMH = 2;
export const ATLAS_MOTION_DELTA_THRESHOLD_KMH = 1;
export const ATLAS_HEADING_SECTOR_COUNT = 8;
export const ATLAS_HEADING_TILE_LIMIT = 5;
export const ATLAS_SPEED_BANDS = Object.freeze([
  Object.freeze({ id: "urban", label: "0–30", minimumKmh: 0, maximumKmh: 30 }),
  Object.freeze({ id: "city", label: "30–60", minimumKmh: 30, maximumKmh: 60 }),
  Object.freeze({ id: "road", label: "60–90", minimumKmh: 60, maximumKmh: 90 }),
  Object.freeze({ id: "fast", label: "90–130", minimumKmh: 90, maximumKmh: 130 }),
  Object.freeze({ id: "over", label: "130+", minimumKmh: 130, maximumKmh: Infinity }),
]);
export const ATLAS_HISTORY_RANGES = Object.freeze([
  Object.freeze({ id: "15m", label: "15 MIN", durationMs: 15 * 60 * 1000 }),
  Object.freeze({ id: "1h", label: "1 H", durationMs: 60 * 60 * 1000 }),
  Object.freeze({ id: "session", label: "SESSION", durationMs: null }),
]);
export const OPEN_METEO_ELEVATION_URL = "https://api.open-meteo.com/v1/elevation";
export const ATLAS_GPS_PRECISE_ACCURACY_M = 4;
export const ATLAS_CARDINAL_DIRECTIONS = Object.freeze([
  "N", "NE", "E", "SE", "S", "SW", "W", "NW",
]);
export const ATLAS_ROAD_LAYER_IDS = Object.freeze(["atlas-road-name-probe"]);
export const ATLAS_DEMO_POSITION = Object.freeze({
  latitude: 45.4570505,
  longitude: 9.1940018,
  heading: 135,
});

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

/**
 * Bounds the MapLibre framebuffer independently from UI/text resolution.
 * The verified Tesla DPR is approximately 1.53; a 1.25 ceiling removes about
 * one third of the map pixels while retaining more than CSS-pixel resolution.
 */
export function atlasMapPixelRatio(devicePixelRatio) {
  const ratio = Number(devicePixelRatio);
  return Math.min(
    ATLAS_MAXIMUM_PIXEL_RATIO,
    Math.max(1, Number.isFinite(ratio) && ratio > 0 ? ratio : 1),
  );
}

export function manualAtlasCamera(camera, deltaX, deltaY) {
  return {
    bearing: ((Number(camera?.bearing) + Number(deltaX) * 0.34) % 360 + 360) % 360,
    pitch: clamp(
      Number(camera?.pitch) - Number(deltaY) * 0.24,
      ATLAS_MANUAL_CAMERA_LIMITS.minimumPitch,
      ATLAS_MANUAL_CAMERA_LIMITS.maximumPitch,
    ),
    zoom: clamp(
      Number(camera?.zoom),
      ATLAS_MANUAL_CAMERA_LIMITS.minimumZoom,
      ATLAS_MANUAL_CAMERA_LIMITS.maximumZoom,
    ),
  };
}

export function pinchAtlasZoom(zoom, previousDistance, nextDistance) {
  const ratio = Number(nextDistance) / Math.max(1, Number(previousDistance));
  return clamp(
    Number(zoom) + Math.log2(Math.max(0.2, ratio)) * 1.35,
    ATLAS_MANUAL_CAMERA_LIMITS.minimumZoom,
    ATLAS_MANUAL_CAMERA_LIMITS.maximumZoom,
  );
}

export function wheelAtlasZoom(zoom, deltaY, deltaMode = 0) {
  const deltaUnit = Number(deltaMode) === 1 ? 16 : Number(deltaMode) === 2 ? 240 : 1;
  const normalizedDelta = clamp(Number(deltaY) * deltaUnit, -240, 240);
  return clamp(
    Number(zoom) - normalizedDelta * 0.005,
    ATLAS_MANUAL_CAMERA_LIMITS.minimumZoom,
    ATLAS_MANUAL_CAMERA_LIMITS.maximumZoom,
  );
}

export function atlasManualCameraShouldReturn(lastInteractionAt, now) {
  return Number.isFinite(lastInteractionAt)
    && Number(now) - lastInteractionAt >= ATLAS_MANUAL_IDLE_MS;
}

export function atlasPointDistanceMetres(first, second) {
  if (!validAtlasPosition(first) || !validAtlasPosition(second)) return Number.POSITIVE_INFINITY;
  const latitude = ((first.latitude + second.latitude) * Math.PI) / 360;
  const north = (second.latitude - first.latitude) * 111320;
  const east = (second.longitude - first.longitude) * 111320 * Math.cos(latitude);
  return Math.hypot(north, east);
}

export function atlasJourneyDistanceMetres(points) {
  const trusted = (Array.isArray(points) ? points : []).filter(validAtlasPosition);
  return trusted.slice(1).reduce((total, point, index) => (
    total + atlasPointDistanceMetres(trusted[index], point)
  ), 0);
}

export function appendAtlasJourneySample(
  samples,
  sample,
  {
    intervalMs = ATLAS_JOURNEY_SAMPLE_INTERVAL_MS,
    maximumSamples = ATLAS_JOURNEY_HISTORY_LIMIT,
  } = {},
) {
  const previous = Array.isArray(samples) ? samples : [];
  const capturedAtMs = Number(sample?.capturedAtMs);
  if (!Number.isFinite(capturedAtMs)) return previous;
  const last = previous.at(-1);
  if (last && capturedAtMs <= last.capturedAtMs) return previous;
  if (last && capturedAtMs - last.capturedAtMs < Math.max(0, Number(intervalMs) || 0)) {
    return previous;
  }
  const speedKmh = sample?.speedKmh;
  const altitudeM = sample?.altitudeM;
  const groundElevationM = sample?.groundElevationM;
  const headingDegrees = Number.isFinite(sample?.headingDegrees)
    ? normalizeAtlasAngle(sample.headingDegrees)
    : null;
  const speedDeltaKmh = Number.isFinite(speedKmh) && Number.isFinite(last?.speedKmh)
    ? speedKmh - last.speedKmh
    : 0;
  const next = [...previous, {
    capturedAtMs,
    speedKmh: Number.isFinite(speedKmh) ? Math.max(0, speedKmh) : null,
    altitudeM: Number.isFinite(altitudeM) ? altitudeM : null,
    groundElevationM: Number.isFinite(groundElevationM) ? groundElevationM : null,
    headingDegrees,
    accelerationGainKmh: speedDeltaKmh >= ATLAS_MOTION_DELTA_THRESHOLD_KMH ? speedDeltaKmh : 0,
    brakingLossKmh: speedDeltaKmh <= -ATLAS_MOTION_DELTA_THRESHOLD_KMH ? Math.abs(speedDeltaKmh) : 0,
  }];
  return next.slice(-Math.max(2, Math.floor(Number(maximumSamples) || ATLAS_JOURNEY_HISTORY_LIMIT)));
}

function atlasSessionSample(sample) {
  const capturedAtMs = Number(sample?.capturedAtMs);
  if (!Number.isFinite(capturedAtMs)) return null;
  const speedKmh = Number.isFinite(sample?.speedKmh) ? Math.max(0, sample.speedKmh) : null;
  const altitudeM = Number.isFinite(sample?.altitudeM) ? sample.altitudeM : null;
  const groundElevationM = Number.isFinite(sample?.groundElevationM)
    ? sample.groundElevationM
    : null;
  const headingDegrees = Number.isFinite(sample?.headingDegrees)
    ? normalizeAtlasAngle(sample.headingDegrees)
    : null;
  const headingRadians = Number.isFinite(headingDegrees) ? headingDegrees * Math.PI / 180 : null;
  const headingSectorCounts = Array.from({ length: ATLAS_HEADING_SECTOR_COUNT }, () => 0);
  if (
    Number.isFinite(headingDegrees)
    && Number.isFinite(speedKmh)
    && speedKmh >= ATLAS_MOVING_SPEED_THRESHOLD_KMH
  ) {
    const sectorSize = 360 / ATLAS_HEADING_SECTOR_COUNT;
    const sectorIndex = Math.floor((headingDegrees + sectorSize / 2) / sectorSize)
      % ATLAS_HEADING_SECTOR_COUNT;
    headingSectorCounts[sectorIndex] = 1;
  }
  const speedBandCounts = ATLAS_SPEED_BANDS.map((band) => (
    Number.isFinite(speedKmh) && speedKmh >= band.minimumKmh && speedKmh < band.maximumKmh ? 1 : 0
  ));
  return {
    capturedAtMs,
    speedKmh,
    altitudeM,
    groundElevationM,
    headingDegrees,
    sampleCount: 1,
    speedSampleCount: Number.isFinite(speedKmh) ? 1 : 0,
    speedSumKmh: Number.isFinite(speedKmh) ? speedKmh : 0,
    movingSampleCount: Number.isFinite(speedKmh) && speedKmh >= ATLAS_MOVING_SPEED_THRESHOLD_KMH ? 1 : 0,
    movingSpeedSumKmh: Number.isFinite(speedKmh) && speedKmh >= ATLAS_MOVING_SPEED_THRESHOLD_KMH
      ? speedKmh
      : 0,
    speedMaximumKmh: speedKmh,
    groundMinimumM: groundElevationM,
    groundMaximumM: groundElevationM,
    headingSampleCount: Number.isFinite(headingDegrees) ? 1 : 0,
    headingSinSum: Number.isFinite(headingRadians) ? Math.sin(headingRadians) : 0,
    headingCosSum: Number.isFinite(headingRadians) ? Math.cos(headingRadians) : 0,
    headingSectorCounts,
    accelerationGainKmh: Number.isFinite(sample?.accelerationGainKmh) ? sample.accelerationGainKmh : 0,
    brakingLossKmh: Number.isFinite(sample?.brakingLossKmh) ? sample.brakingLossKmh : 0,
    speedBandCounts,
  };
}

function mergeAtlasSessionSamples(first, second) {
  const sampleCount = first.sampleCount + second.sampleCount;
  const average = (field) => {
    const firstFinite = Number.isFinite(first[field]);
    const secondFinite = Number.isFinite(second[field]);
    if (!firstFinite && !secondFinite) return null;
    if (!firstFinite) return second[field];
    if (!secondFinite) return first[field];
    return (
      first[field] * first.sampleCount + second[field] * second.sampleCount
    ) / sampleCount;
  };
  const finiteValues = (field) => [first[field], second[field]].filter(Number.isFinite);
  const minimum = (field) => {
    const values = finiteValues(field);
    return values.length ? Math.min(...values) : null;
  };
  const maximum = (field) => {
    const values = finiteValues(field);
    return values.length ? Math.max(...values) : null;
  };
  const headingSampleCount = (first.headingSampleCount ?? 0) + (second.headingSampleCount ?? 0);
  const headingSinSum = (first.headingSinSum ?? 0) + (second.headingSinSum ?? 0);
  const headingCosSum = (first.headingCosSum ?? 0) + (second.headingCosSum ?? 0);
  const headingDegrees = headingSampleCount
    ? normalizeAtlasAngle(Math.atan2(headingSinSum, headingCosSum) * 180 / Math.PI)
    : null;
  return {
    capturedAtMs: average("capturedAtMs"),
    speedKmh: average("speedKmh"),
    altitudeM: average("altitudeM"),
    groundElevationM: average("groundElevationM"),
    headingDegrees,
    sampleCount,
    speedSampleCount: first.speedSampleCount + second.speedSampleCount,
    speedSumKmh: first.speedSumKmh + second.speedSumKmh,
    movingSampleCount: first.movingSampleCount + second.movingSampleCount,
    movingSpeedSumKmh: first.movingSpeedSumKmh + second.movingSpeedSumKmh,
    speedMaximumKmh: maximum("speedMaximumKmh"),
    groundMinimumM: minimum("groundMinimumM"),
    groundMaximumM: maximum("groundMaximumM"),
    headingSampleCount,
    headingSinSum,
    headingCosSum,
    headingSectorCounts: Array.from({ length: ATLAS_HEADING_SECTOR_COUNT }, (_, index) => (
      (first.headingSectorCounts?.[index] ?? 0) + (second.headingSectorCounts?.[index] ?? 0)
    )),
    accelerationGainKmh: (first.accelerationGainKmh ?? 0) + (second.accelerationGainKmh ?? 0),
    brakingLossKmh: (first.brakingLossKmh ?? 0) + (second.brakingLossKmh ?? 0),
    speedBandCounts: ATLAS_SPEED_BANDS.map((_, index) => (
      (first.speedBandCounts?.[index] ?? 0) + (second.speedBandCounts?.[index] ?? 0)
    )),
  };
}

/**
 * Keeps an all-session chart without allowing an all-session memory leak.
 * Once full, adjacent samples are averaged into weighted rollups. Scalar
 * statistics remain exact because their counts, sums, minima and maxima are
 * retained inside every rollup.
 */
export function appendAtlasSessionJourneySample(
  samples,
  sample,
  maximumSamples = ATLAS_SESSION_HISTORY_LIMIT,
) {
  const previous = Array.isArray(samples) ? samples : [];
  const nextSample = atlasSessionSample(sample);
  if (!nextSample) return previous;
  const last = previous.at(-1);
  if (last && nextSample.capturedAtMs <= last.capturedAtMs) return previous;
  if (last && nextSample.capturedAtMs - last.capturedAtMs < ATLAS_JOURNEY_SAMPLE_INTERVAL_MS) {
    return previous;
  }
  const next = [...previous, nextSample];
  const limit = Math.max(4, Math.floor(Number(maximumSamples) || ATLAS_SESSION_HISTORY_LIMIT));
  if (next.length <= limit) return next;
  const rolled = [];
  for (let index = 0; index < next.length; index += 2) {
    rolled.push(next[index + 1]
      ? mergeAtlasSessionSamples(next[index], next[index + 1])
      : next[index]);
  }
  return rolled;
}

export function cycleAtlasHistoryRange(rangeId) {
  const index = ATLAS_HISTORY_RANGES.findIndex((range) => range.id === rangeId);
  return ATLAS_HISTORY_RANGES[(index + 1 + ATLAS_HISTORY_RANGES.length)
    % ATLAS_HISTORY_RANGES.length];
}

export function atlasJourneySamplesForRange(recentSamples, sessionSamples, rangeId, nowMs) {
  const range = ATLAS_HISTORY_RANGES.find((candidate) => candidate.id === rangeId)
    ?? ATLAS_HISTORY_RANGES[0];
  if (range.durationMs == null) return Array.isArray(sessionSamples) ? sessionSamples : [];
  const cutoff = Number(nowMs) - range.durationMs;
  return (Array.isArray(recentSamples) ? recentSamples : [])
    .filter((sample) => Number(sample?.capturedAtMs) >= cutoff);
}

export function atlasJourneyStatistics(samples) {
  const source = Array.isArray(samples) ? samples : [];
  let speedSampleCount = 0;
  let speedSumKmh = 0;
  let movingSampleCount = 0;
  let movingSpeedSumKmh = 0;
  let maximumSpeedKmh = null;
  let minimumGroundElevationM = null;
  let maximumGroundElevationM = null;
  for (const sample of source) {
    const speedCount = Number.isFinite(sample?.speedSampleCount)
      ? sample.speedSampleCount
      : Number.isFinite(sample?.speedKmh) ? 1 : 0;
    const speedSum = Number.isFinite(sample?.speedSumKmh)
      ? sample.speedSumKmh
      : Number.isFinite(sample?.speedKmh) ? sample.speedKmh : 0;
    const movingCount = Number.isFinite(sample?.movingSampleCount)
      ? sample.movingSampleCount
      : Number.isFinite(sample?.speedKmh) && sample.speedKmh >= ATLAS_MOVING_SPEED_THRESHOLD_KMH ? 1 : 0;
    const movingSum = Number.isFinite(sample?.movingSpeedSumKmh)
      ? sample.movingSpeedSumKmh
      : movingCount ? sample.speedKmh : 0;
    const speedMaximum = Number.isFinite(sample?.speedMaximumKmh)
      ? sample.speedMaximumKmh
      : sample?.speedKmh;
    const groundMinimum = Number.isFinite(sample?.groundMinimumM)
      ? sample.groundMinimumM
      : sample?.groundElevationM;
    const groundMaximum = Number.isFinite(sample?.groundMaximumM)
      ? sample.groundMaximumM
      : sample?.groundElevationM;
    speedSampleCount += speedCount;
    speedSumKmh += speedSum;
    movingSampleCount += movingCount;
    movingSpeedSumKmh += movingSum;
    if (Number.isFinite(speedMaximum)) {
      maximumSpeedKmh = maximumSpeedKmh == null
        ? speedMaximum
        : Math.max(maximumSpeedKmh, speedMaximum);
    }
    if (Number.isFinite(groundMinimum)) {
      minimumGroundElevationM = minimumGroundElevationM == null
        ? groundMinimum
        : Math.min(minimumGroundElevationM, groundMinimum);
    }
    if (Number.isFinite(groundMaximum)) {
      maximumGroundElevationM = maximumGroundElevationM == null
        ? groundMaximum
        : Math.max(maximumGroundElevationM, groundMaximum);
    }
  }
  return {
    averageSpeedKmh: speedSampleCount ? speedSumKmh / speedSampleCount : null,
    movingAverageSpeedKmh: movingSampleCount ? movingSpeedSumKmh / movingSampleCount : null,
    maximumSpeedKmh,
    minimumGroundElevationM,
    maximumGroundElevationM,
    sampleCount: speedSampleCount,
  };
}

export function atlasDriveLabMetrics(samples) {
  const source = Array.isArray(samples) ? samples : [];
  const speedBandCounts = ATLAS_SPEED_BANDS.map(() => 0);
  let speedSampleCount = 0;
  let movingSampleCount = 0;
  let accelerationGainKmh = 0;
  let brakingLossKmh = 0;
  source.forEach((sample) => {
    const sampleWeight = Number.isFinite(sample?.speedSampleCount)
      ? sample.speedSampleCount
      : Number.isFinite(sample?.speedKmh) ? 1 : 0;
    const movingWeight = Number.isFinite(sample?.movingSampleCount)
      ? sample.movingSampleCount
      : Number.isFinite(sample?.speedKmh) && sample.speedKmh >= ATLAS_MOVING_SPEED_THRESHOLD_KMH ? 1 : 0;
    speedSampleCount += sampleWeight;
    movingSampleCount += movingWeight;
    accelerationGainKmh += Math.max(0, Number(sample?.accelerationGainKmh) || 0);
    brakingLossKmh += Math.max(0, Number(sample?.brakingLossKmh) || 0);
    if (Array.isArray(sample?.speedBandCounts)) {
      sample.speedBandCounts.forEach((count, index) => {
        if (index < speedBandCounts.length) speedBandCounts[index] += Math.max(0, Number(count) || 0);
      });
    } else if (Number.isFinite(sample?.speedKmh)) {
      const index = ATLAS_SPEED_BANDS.findIndex((band) => (
        sample.speedKmh >= band.minimumKmh && sample.speedKmh < band.maximumKmh
      ));
      if (index >= 0) speedBandCounts[index] += 1;
    }
  });
  const motionTotalKmh = accelerationGainKmh + brakingLossKmh;
  const stoppedSampleCount = Math.max(0, speedSampleCount - movingSampleCount);
  return {
    accelerationGainKmh,
    brakingLossKmh,
    accelerationShare: motionTotalKmh ? accelerationGainKmh / motionTotalKmh : 0,
    brakingShare: motionTotalKmh ? brakingLossKmh / motionTotalKmh : 0,
    speedBands: ATLAS_SPEED_BANDS.map((band, index) => ({
      ...band,
      count: speedBandCounts[index],
      share: speedSampleCount ? speedBandCounts[index] / speedSampleCount : 0,
    })),
    speedSampleCount,
    movingSampleCount,
    stoppedSampleCount,
    movingShare: speedSampleCount ? movingSampleCount / speedSampleCount : 0,
    stoppedShare: speedSampleCount ? stoppedSampleCount / speedSampleCount : 0,
  };
}

/**
 * Converts moving journey headings into a compact radial distribution. Session
 * rollups retain the exact sector counts so bounded history never invents a
 * direction from an averaged bearing.
 */
export function atlasHeadingDistribution(
  samples,
  sectorCount = ATLAS_HEADING_SECTOR_COUNT,
  tileLimit = ATLAS_HEADING_TILE_LIMIT,
) {
  const count = Math.max(4, Math.floor(Number(sectorCount) || ATLAS_HEADING_SECTOR_COUNT));
  const maximumTiles = Math.max(1, Math.floor(Number(tileLimit) || ATLAS_HEADING_TILE_LIMIT));
  const sectorSizeDegrees = 360 / count;
  const counts = Array.from({ length: count }, () => 0);
  for (const sample of Array.isArray(samples) ? samples : []) {
    if (count === ATLAS_HEADING_SECTOR_COUNT && Array.isArray(sample?.headingSectorCounts)) {
      sample.headingSectorCounts.forEach((value, index) => {
        if (index < counts.length) counts[index] += Math.max(0, Number(value) || 0);
      });
      continue;
    }
    if (
      !Number.isFinite(sample?.headingDegrees)
      || !Number.isFinite(sample?.speedKmh)
      || sample.speedKmh < ATLAS_MOVING_SPEED_THRESHOLD_KMH
    ) continue;
    const index = Math.floor(
      (normalizeAtlasAngle(sample.headingDegrees) + sectorSizeDegrees / 2) / sectorSizeDegrees,
    ) % count;
    counts[index] += Number.isFinite(sample?.sampleCount) ? Math.max(1, sample.sampleCount) : 1;
  }
  const total = counts.reduce((sum, value) => sum + value, 0);
  const maximum = Math.max(0, ...counts);
  const sectors = counts.map((sectorSampleCount, index) => {
    const centreDegrees = index * sectorSizeDegrees;
    return {
      index,
      centreDegrees,
      label: count === ATLAS_CARDINAL_DIRECTIONS.length
        ? ATLAS_CARDINAL_DIRECTIONS[index]
        : `${Math.round(centreDegrees)}°`,
      count: sectorSampleCount,
      share: total ? sectorSampleCount / total : 0,
      tileCount: maximum
        ? Math.max(0, Math.ceil(sectorSampleCount / maximum * maximumTiles))
        : 0,
    };
  });
  const dominant = total
    ? sectors.reduce((best, sector) => (sector.count > best.count ? sector : best), sectors[0])
    : null;
  return { sectors, dominant, total, sectorSizeDegrees, tileLimit: maximumTiles };
}

export function openMeteoElevationUrl(position) {
  if (!validAtlasPosition(position)) return null;
  const latitude = Math.round(position.latitude * 1000) / 1000;
  const longitude = Math.round(position.longitude * 1000) / 1000;
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  return `${OPEN_METEO_ELEVATION_URL}?${params}`;
}

export function normalizeOpenMeteoElevation(payload) {
  const value = Array.isArray(payload?.elevation) ? Number(payload.elevation[0]) : Number.NaN;
  return Number.isFinite(value) && value >= -500 && value <= 9000 ? value : null;
}

function normalizeAtlasAngle(value) {
  return ((Number(value) % 360) + 360) % 360;
}

export function atlasCardinalDirection(heading) {
  if (!Number.isFinite(heading)) return null;
  const sector = Math.floor((normalizeAtlasAngle(heading) + 22.5) / 45) % 8;
  return ATLAS_CARDINAL_DIRECTIONS[sector];
}

/**
 * Unwraps a normalized heading onto the nearest continuous angle so the
 * direction pointer never spins the long way when crossing north.
 */
export function atlasContinuousHeading(previousHeading, nextHeading) {
  if (!Number.isFinite(nextHeading)) {
    return Number.isFinite(previousHeading) ? previousHeading : null;
  }
  const next = normalizeAtlasAngle(nextHeading);
  if (!Number.isFinite(previousHeading)) return next;
  const previous = Number(previousHeading);
  const delta = ((next - normalizeAtlasAngle(previous) + 540) % 360) - 180;
  return previous + delta;
}

function normalizeAtlasRoadName(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Reads a road label only from already rendered OpenFreeMap transportation
 * features. It never needs reverse geocoding or another coordinate request.
 */
export function atlasRoadNameFromFeatures(features, preferredLanguages = []) {
  const languages = (Array.isArray(preferredLanguages) ? preferredLanguages : [preferredLanguages])
    .map((language) => String(language || "").trim().toLowerCase().split("-")[0])
    .filter(Boolean);
  const keys = [
    "name",
    ...languages.flatMap((language) => [`name:${language}`, `name_${language}`]),
    "name:latin",
    "name_en",
    "ref",
  ];

  for (const feature of Array.isArray(features) ? features : []) {
    const layerId = feature?.layer?.id;
    const sourceLayer = feature?.sourceLayer ?? feature?.layer?.["source-layer"];
    if (!["transportation", "transportation_name"].includes(sourceLayer)
      && !ATLAS_ROAD_LAYER_IDS.includes(layerId)) continue;
    for (const key of keys) {
      const label = normalizeAtlasRoadName(feature?.properties?.[key]);
      if (label) return label;
    }
  }
  return null;
}

function interpolateAtlasAngle(first, second, progress) {
  if (!Number.isFinite(first)) return Number.isFinite(second) ? normalizeAtlasAngle(second) : null;
  if (!Number.isFinite(second)) return normalizeAtlasAngle(first);
  const delta = ((normalizeAtlasAngle(second) - normalizeAtlasAngle(first) + 540) % 360) - 180;
  return normalizeAtlasAngle(first + delta * progress);
}

function interpolateAtlasLongitude(first, second, progress) {
  const delta = ((second - first + 540) % 360) - 180;
  return ((first + delta * progress + 540) % 360) - 180;
}

export function validAtlasPositionSample(sample) {
  return validAtlasPosition(sample) && Number.isFinite(sample?.capturedAtMs);
}

/**
 * Retains a small session-only, chronological GPS buffer for the future ATLAS
 * vehicle point. Invalid and non-monotonic samples leave the last trusted
 * position untouched instead of inventing motion.
 */
export function appendAtlasPositionSample(
  samples,
  position,
  capturedAtMs = position?.capturedAtMs,
  maximumSamples = ATLAS_POSITION_BUFFER_LIMIT,
) {
  const previous = Array.isArray(samples) ? samples : [];
  if (!validAtlasPosition(position) || !Number.isFinite(capturedAtMs)) return previous;
  const last = [...previous].reverse().find(validAtlasPositionSample);
  if (last && capturedAtMs <= last.capturedAtMs) return previous;
  const heading = Number.isFinite(position.heading)
    ? normalizeAtlasAngle(position.heading)
    : Number.isFinite(last?.heading)
      ? normalizeAtlasAngle(last.heading)
      : null;
  return [...previous, {
    latitude: position.latitude,
    longitude: position.longitude,
    heading,
    speedKmh: Number.isFinite(position.speedKmh) ? Math.max(0, position.speedKmh) : null,
    altitudeM: Number.isFinite(position.altitudeM) ? position.altitudeM : null,
    altitudeAccuracyM: Number.isFinite(position.altitudeAccuracyM) ? Math.max(0, position.altitudeAccuracyM) : null,
    accuracyM: Number.isFinite(position.accuracyM) ? Math.max(0, position.accuracyM) : null,
    capturedAtMs,
  }].slice(-Math.max(2, Math.floor(Number(maximumSamples) || ATLAS_POSITION_BUFFER_LIMIT)));
}

function atlasHeldPosition(sample, stale = false) {
  return {
    latitude: sample.latitude,
    longitude: sample.longitude,
    heading: Number.isFinite(sample.heading) ? normalizeAtlasAngle(sample.heading) : null,
    speedKmh: Number.isFinite(sample.speedKmh) ? sample.speedKmh : null,
    altitudeM: Number.isFinite(sample.altitudeM) ? sample.altitudeM : null,
    altitudeAccuracyM: Number.isFinite(sample.altitudeAccuracyM) ? sample.altitudeAccuracyM : null,
    accuracyM: Number.isFinite(sample.accuracyM) ? sample.accuracyM : null,
    sourceCapturedAtMs: sample.capturedAtMs,
    interpolating: false,
    stale,
  };
}

/**
 * Samples the buffered GPS path against time, never frame count. A one-sample
 * delay lets 30 and 60 FPS renderers traverse the same segment smoothly. The
 * function never extrapolates and refuses to animate across a long data gap.
 */
export function interpolateAtlasPosition(samples, renderAtMs, {
  delayMs = ATLAS_POSITION_INTERPOLATION_DELAY_MS,
  maximumGapMs = ATLAS_POSITION_MAXIMUM_GAP_MS,
  staleAfterMs = ATLAS_POSITION_STALE_AFTER_MS,
} = {}) {
  if (!Number.isFinite(renderAtMs)) return null;
  const chronological = [];
  for (const sample of Array.isArray(samples) ? samples : []) {
    if (!validAtlasPositionSample(sample)) continue;
    if (chronological.length && sample.capturedAtMs <= chronological.at(-1).capturedAtMs) continue;
    chronological.push(sample);
  }
  if (!chronological.length) return null;

  const latest = chronological.at(-1);
  if (renderAtMs - latest.capturedAtMs > Math.max(0, Number(staleAfterMs) || 0)) {
    return atlasHeldPosition(latest, true);
  }

  const targetAtMs = renderAtMs - Math.max(0, Number(delayMs) || 0);
  const first = chronological[0];
  if (targetAtMs <= first.capturedAtMs) return atlasHeldPosition(first);

  const upperIndex = chronological.findIndex((sample) => sample.capturedAtMs >= targetAtMs);
  if (upperIndex <= 0) return atlasHeldPosition(latest);
  const lower = chronological[upperIndex - 1];
  const upper = chronological[upperIndex];
  const segmentMs = upper.capturedAtMs - lower.capturedAtMs;
  if (segmentMs <= 0 || segmentMs > Math.max(1, Number(maximumGapMs) || 1)) {
    return atlasHeldPosition(upper);
  }

  const progress = clamp((targetAtMs - lower.capturedAtMs) / segmentMs, 0, 1);
  if (progress <= 0) return atlasHeldPosition(lower);
  if (progress >= 1) return atlasHeldPosition(upper);
  return {
    latitude: lower.latitude + (upper.latitude - lower.latitude) * progress,
    longitude: interpolateAtlasLongitude(lower.longitude, upper.longitude, progress),
    heading: interpolateAtlasAngle(lower.heading, upper.heading, progress),
    speedKmh: Number.isFinite(upper.speedKmh) ? upper.speedKmh : null,
    altitudeM: Number.isFinite(lower.altitudeM) && Number.isFinite(upper.altitudeM)
      ? lower.altitudeM + (upper.altitudeM - lower.altitudeM) * progress
      : Number.isFinite(upper.altitudeM) ? upper.altitudeM : null,
    altitudeAccuracyM: Number.isFinite(upper.altitudeAccuracyM) ? upper.altitudeAccuracyM : null,
    accuracyM: Number.isFinite(upper.accuracyM) ? upper.accuracyM : null,
    sourceCapturedAtMs: upper.capturedAtMs,
    interpolating: true,
    stale: false,
  };
}

/**
 * Keeps one ephemeral, chronological travel line for the current ATLAS view.
 * When the bounded array fills, older detail is decimated instead of deleting
 * the beginning of the trip. The complete route therefore remains visible
 * while memory and GeoJSON work stay bounded; diagnostics never receive it.
 */
export function appendAtlasTravelPoint(
  points,
  position,
  maximumPoints = ATLAS_TRAVEL_POINT_LIMIT,
) {
  if (!validAtlasPosition(position)) return Array.isArray(points) ? points : [];
  const previous = Array.isArray(points) ? points : [];
  const last = previous.at(-1);
  if (last && atlasPointDistanceMetres(last, position) < ATLAS_TRAVEL_MINIMUM_DISTANCE_M) {
    return previous;
  }
  const next = [...previous, {
    latitude: position.latitude,
    longitude: position.longitude,
  }];
  const limit = Math.max(2, Math.floor(Number(maximumPoints) || ATLAS_TRAVEL_POINT_LIMIT));
  if (next.length <= limit) return next;
  return next.filter((_, index) => index === 0 || index === next.length - 1 || index % 2 === 0);
}

export function atlasTravelFeature(points) {
  const coordinates = (Array.isArray(points) ? points : [])
    .filter(validAtlasPosition)
    .map((point) => [point.longitude, point.latitude]);
  return {
    type: "FeatureCollection",
    features: coordinates.length >= 2 ? [{
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates },
    }] : [],
  };
}

export function atlasVehicleFeature(position, pulse = 0, rippleOpacity = 0.36) {
  return {
    type: "FeatureCollection",
    features: validAtlasPosition(position) ? [{
      type: "Feature",
      properties: {
        pulse: clamp(Number(pulse) || 0, 0, 1),
        rippleOpacity: clamp(Number(rippleOpacity) || 0, 0, 1),
      },
      geometry: { type: "Point", coordinates: [position.longitude, position.latitude] },
    }] : [],
  };
}

const ATLAS_KEYBOARD_INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[contenteditable]:not([contenteditable='false'])",
  "[role='dialog']",
  "[aria-modal='true']",
].join(", ");

export function atlasKeyboardShortcutAvailable(event, keyboardShortcutsEnabled = true) {
  if (!keyboardShortcutsEnabled || event?.defaultPrevented || event?.altKey || event?.ctrlKey || event?.metaKey) {
    return false;
  }
  const target = event?.target;
  return typeof target?.closest !== "function"
    || !target.closest(ATLAS_KEYBOARD_INTERACTIVE_SELECTOR);
}

export function validAtlasPosition(position) {
  return Boolean(position)
    && Number.isFinite(position.latitude)
    && Number.isFinite(position.longitude)
    && position.latitude >= -90
    && position.latitude <= 90
    && position.longitude >= -180
    && position.longitude <= 180;
}

export function atlasGpsPresentation(gpsState, accuracyM, source = "GPS") {
  const state = String(gpsState || "not tested");
  const live = source === "DEMO" || state === "live";
  const connected = source !== "DEMO" && state === "live";
  const requiresHelp = [
    "permission denied",
    "signal unavailable",
    "timeout",
    "unavailable",
    "sanitized error",
  ].includes(state);
  const status = source === "DEMO"
    ? "DEMO"
    : live
      ? "LIVE"
      : state.replace("permission ", "").toUpperCase();
  return {
    live,
    requiresHelp,
    status,
    accuracy: Number.isFinite(accuracyM) ? `±${Math.round(accuracyM)} m` : "±— m",
    tone: !connected
      ? "offline"
      : Number.isFinite(accuracyM) && accuracyM <= ATLAS_GPS_PRECISE_ACCURACY_M
        ? "precise"
        : "imprecise",
  };
}

export function speedToAtlasCamera(speedKmh) {
  const speed = Math.min(130, Math.max(0, Number(speedKmh) || 0));
  const energy = speed / 130;
  // Keep the early pull-back legible, then compress the upper end so motorway
  // speed reveals more city without ever flattening the extruded city field.
  const flight = 0.35 * energy + 0.65 * Math.sqrt(energy);
  return {
    zoom: 16.2 - flight * 1.55,
    pitch: 62 - flight * 6.5,
    durationMs: Math.round(2200 - energy * 1050),
    buildingScale: 0.82 + energy * 0.38,
  };
}

export function atlasEffectProfile(effect) {
  if (effect === "OPEN") {
    return {
      zoomDelta: -0.16, pitchDelta: 2, durationScale: 0.72,
      roadWidthScale: 1.16, roadOpacity: 0.72, waterOpacity: 0.2, buildingOpacity: 0.8,
    };
  }
  if (effect === "UNDERWATER") {
    return {
      zoomDelta: 0.12, pitchDelta: -3, durationScale: 1.18,
      roadWidthScale: 0.9, roadOpacity: 0.4, waterOpacity: 0.44, buildingOpacity: 0.64,
    };
  }
  if (effect === "BLOOM") {
    return {
      zoomDelta: -0.28, pitchDelta: 3.5, durationScale: 0.55,
      roadWidthScale: 1.32, roadOpacity: 0.84, waterOpacity: 0.28, buildingOpacity: 0.88,
    };
  }
  return {
    zoomDelta: 0, pitchDelta: 0, durationScale: 1,
    roadWidthScale: 1, roadOpacity: 0.58, waterOpacity: 0.24, buildingOpacity: 0.78,
  };
}

export function speedToAtlasEffectCamera(speedKmh, effect) {
  const camera = speedToAtlasCamera(speedKmh);
  const profile = atlasEffectProfile(effect);
  return {
    ...camera,
    zoom: camera.zoom + profile.zoomDelta,
    pitch: camera.pitch + profile.pitchDelta,
    durationMs: Math.round(camera.durationMs * profile.durationScale),
  };
}

/** Uses device heading when present, otherwise derives travel bearing from two trusted fixes. */
export function resolveAtlasHeading(previous, next, reportedHeading, minimumTravelMetres = 3) {
  if (Number.isFinite(reportedHeading)) return ((reportedHeading % 360) + 360) % 360;
  const previousHeading = Number.isFinite(previous?.heading) ? previous.heading : null;
  if (!validAtlasPosition(previous) || !validAtlasPosition(next)) return previousHeading;

  const meanLatitude = ((previous.latitude + next.latitude) * Math.PI) / 360;
  const northMetres = (next.latitude - previous.latitude) * 111320;
  const eastMetres = (next.longitude - previous.longitude) * 111320 * Math.cos(meanLatitude);
  if (Math.hypot(northMetres, eastMetres) < Math.max(0, minimumTravelMetres)) return previousHeading;
  return ((Math.atan2(eastMetres, northMetres) * 180) / Math.PI + 360) % 360;
}

/** Advances the fixed Milan demo without exposing or inventing user location. */
export function advanceAtlasDemoPosition(position, speedKmh, headingDegrees, deltaSeconds) {
  if (!validAtlasPosition(position)) return null;
  const speedMps = Math.min(130, Math.max(0, Number(speedKmh) || 0)) / 3.6;
  const delta = Math.min(1, Math.max(0, Number(deltaSeconds) || 0));
  const heading = ((Number(headingDegrees) || 0) * Math.PI) / 180;
  const metres = speedMps * delta;
  const latitudeRadians = (position.latitude * Math.PI) / 180;
  const latitude = position.latitude + (Math.cos(heading) * metres) / 111320;
  const longitude = position.longitude
    + (Math.sin(heading) * metres) / Math.max(1, 111320 * Math.cos(latitudeRadians));
  return { latitude, longitude, heading: ((Number(headingDegrees) || 0) + 360) % 360 };
}

export function wikipediaNearbyUrl(position, language = "it") {
  if (!validAtlasPosition(position)) return null;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
    generator: "geosearch",
    ggscoord: `${position.latitude}|${position.longitude}`,
    ggsradius: String(WIKIPEDIA_SEARCH_RADIUS_METRES),
    ggslimit: "6",
    prop: "extracts|info|pageimages",
    exintro: "1",
    explaintext: "1",
    exsentences: "2",
    inprop: "url",
    piprop: "thumbnail",
    pithumbsize: "320",
    pilicense: "free",
  });
  return `https://${language}.wikipedia.org/w/api.php?${params}`;
}

export function normalizeNearbyPages(payload) {
  return (payload?.query?.pages ?? [])
    .filter((page) => page?.title && page?.fullurl)
    .map((page) => {
      const thumbnailSource = String(page.thumbnail?.source ?? "");
      const thumbnail = thumbnailSource.startsWith("//")
        ? `https:${thumbnailSource}`
        : /^https:\/\//i.test(thumbnailSource) ? thumbnailSource : "";
      return {
        id: String(page.pageid),
        title: String(page.title),
        summary: String(page.extract ?? "").replace(/\s+/g, " ").trim(),
        url: String(page.fullurl),
        thumbnail,
        thumbnailWidth: Number.isFinite(page.thumbnail?.width) ? page.thumbnail.width : null,
        thumbnailHeight: Number.isFinite(page.thumbnail?.height) ? page.thumbnail.height : null,
      };
    })
    .slice(0, 6);
}

/**
 * Creates cancellable revision tickets for UI work whose older promises may
 * finish after a newer request has already taken ownership of the surface.
 */
export function createLatestAtlasRequestGate() {
  let revision = 0;
  return {
    begin() {
      const requestRevision = ++revision;
      let active = true;
      return {
        commit(action) {
          if (!active || requestRevision !== revision) return false;
          action();
          return true;
        },
        cancel() {
          active = false;
          if (requestRevision === revision) revision += 1;
        },
      };
    },
  };
}

export function paletteToAtlasCss(palette) {
  const css = (channels) => `rgb(${channels.map((channel) => Math.round(channel * 255)).join(" ")})`;
  return {
    background: css(palette.base),
    terrain: css(palette.mid),
    foreground: css(palette.light),
    accent: css(palette.accent),
    secondary: css(palette.secondary),
  };
}

const mixChannels = (first, second, amount) => first.map((value, index) => (
  value + (second[index] - value) * amount
));

const channelLuminance = (channels) => {
  const linear = channels.map((value) => {
    const bounded = clamp(value, 0, 1);
    return bounded <= 0.04045 ? bounded / 12.92 : ((bounded + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};

export function atlasContrastRatio(first, second) {
  const bright = Math.max(channelLuminance(first), channelLuminance(second));
  const dark = Math.min(channelLuminance(first), channelLuminance(second));
  return (bright + 0.05) / (dark + 0.05);
}

function ensureAtlasContrast(channels, background, minimum) {
  let result = [...channels];
  for (let step = 0; step < 12 && atlasContrastRatio(result, background) < minimum; step += 1) {
    result = mixChannels(result, [1, 1, 1], 0.12);
  }
  return result;
}

/** Preserves every shared theme while giving the map its own legibility mix. */
export function paletteToAtlasMapChannels(palette) {
  const background = [...palette.base];
  const terrain = mixChannels(palette.base, palette.mid, 0.58);
  const foreground = ensureAtlasContrast(palette.light, background, 7);
  const secondary = ensureAtlasContrast(mixChannels(palette.secondary, palette.light, 0.44), background, 3.2);
  const accent = ensureAtlasContrast(mixChannels(palette.accent, palette.light, 0.3), background, 2.8);
  return {
    background,
    terrain,
    foreground,
    accent,
    secondary,
    buildingLow: mixChannels(terrain, foreground, 0.18),
  };
}

export function paletteToAtlasMapCss(palette) {
  const css = (channels) => `rgb(${channels.map((channel) => Math.round(channel * 255)).join(" ")})`;
  return Object.fromEntries(Object.entries(paletteToAtlasMapChannels(palette))
    .map(([key, channels]) => [key, css(channels)]));
}

export function createAtlasStyle(palette) {
  const colors = paletteToAtlasMapCss(palette);
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      openfreemap: {
        type: "vector",
        url: OPENFREEMAP_VECTOR_URL,
        attribution: "© OpenFreeMap © OpenMapTiles Data from OpenStreetMap",
      },
      atlasTravel: {
        type: "geojson",
        data: atlasTravelFeature([]),
      },
      atlasVehicle: {
        type: "geojson",
        data: atlasVehicleFeature(null),
      },
    },
    layers: [
      { id: "atlas-background", type: "background", paint: { "background-color": colors.background } },
      {
        id: "atlas-landcover", type: "fill", source: "openfreemap", "source-layer": "landcover",
        paint: { "fill-color": colors.terrain, "fill-opacity": 0.25 },
      },
      {
        id: "atlas-landuse", type: "fill", source: "openfreemap", "source-layer": "landuse",
        paint: { "fill-color": colors.terrain, "fill-opacity": 0.38 },
      },
      {
        id: "atlas-water", type: "fill", source: "openfreemap", "source-layer": "water",
        paint: { "fill-color": colors.secondary, "fill-opacity": 0.24 },
      },
      {
        id: "atlas-roads-underlay", type: "line", source: "openfreemap", "source-layer": "transportation",
        paint: { "line-color": colors.background, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 17, 5.5], "line-opacity": 0.9 },
      },
      {
        id: "atlas-roads", type: "line", source: "openfreemap", "source-layer": "transportation",
        paint: { "line-color": colors.secondary, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.25, 17, 2.0], "line-opacity": 0.58 },
      },
      {
        id: "atlas-road-name-probe", type: "line", source: "openfreemap", "source-layer": "transportation_name", minzoom: 10,
        paint: { "line-color": colors.background, "line-width": 24, "line-opacity": 0 },
      },
      {
        id: "atlas-travel-underlay", type: "line", source: "atlasTravel",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": colors.background,
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 4, 10, 5, 17, 9],
          "line-opacity": 0.82,
        },
      },
      {
        id: "atlas-travel-route", type: "line", source: "atlasTravel",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": colors.accent,
          "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.6, 10, 2.2, 17, 4],
          "line-opacity": 0.96,
        },
      },
      {
        id: "sedicivalvole-buildings", type: "fill-extrusion", source: "openfreemap", "source-layer": "building", minzoom: 13.5,
        paint: {
          "fill-extrusion-color": [
            "interpolate", ["linear"], ["coalesce", ["get", "render_height"], 5],
            0, colors.buildingLow, 80, colors.accent, 240, colors.foreground,
          ],
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 5],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.78,
        },
      },
      {
        id: "atlas-vehicle-ripple", type: "circle", source: "atlasVehicle",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "pulse"], 0, 7, 1, 19],
          "circle-color": colors.accent,
          "circle-opacity": ["get", "rippleOpacity"],
          "circle-blur": 0.18,
        },
      },
      {
        id: "atlas-vehicle-dot", type: "circle", source: "atlasVehicle",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 3.5, 10, 4.5, 17, 6],
          "circle-color": colors.accent,
          "circle-stroke-color": colors.background,
          "circle-stroke-width": 1.5,
          "circle-opacity": 1,
        },
      },
      {
        id: "atlas-place-labels", type: "symbol", source: "openfreemap", "source-layer": "place", minzoom: 6,
        layout: {
          "text-field": ["coalesce", ["get", "name:it"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 16, 14],
          "text-letter-spacing": 0.08,
        },
        paint: {
          "text-color": colors.foreground,
          "text-halo-color": colors.background,
          "text-halo-width": 1.2,
          "text-opacity": 0.82,
        },
      },
    ],
  };
}
