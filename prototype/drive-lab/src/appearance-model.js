export const APPEARANCE_PREFERENCE_KEY = "sedicivalvole.appearance.v1";
export const APPEARANCE_MODES = Object.freeze(["light", "dark", "auto"]);
export const DEFAULT_APPEARANCE_MODE = "light";
export const APPEARANCE_SOLAR_THRESHOLDS = Object.freeze({
  dayElevationDegrees: 2,
  nightElevationDegrees: -6,
});

const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;
const radiansToDegrees = (radians) => (radians * 180) / Math.PI;
const normalizeDegrees = (degrees) => ((degrees % 360) + 360) % 360;

export function normalizeAppearanceMode(value, fallback = DEFAULT_APPEARANCE_MODE) {
  return APPEARANCE_MODES.includes(value) ? value : fallback;
}

function resolveAppearanceStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function readAppearancePreference(storage) {
  try {
    const target = resolveAppearanceStorage(storage);
    return normalizeAppearanceMode(target?.getItem(APPEARANCE_PREFERENCE_KEY));
  } catch {
    return DEFAULT_APPEARANCE_MODE;
  }
}

export function writeAppearancePreference(mode, storage) {
  const normalized = normalizeAppearanceMode(mode, null);
  if (!normalized) return false;
  try {
    const target = resolveAppearanceStorage(storage);
    if (typeof target?.setItem !== "function") return false;
    target.setItem(APPEARANCE_PREFERENCE_KEY, normalized);
    return true;
  } catch {
    return false;
  }
}

export function resetAppearancePreference(storage) {
  try {
    const target = resolveAppearanceStorage(storage);
    if (typeof target?.removeItem !== "function") return false;
    target.removeItem(APPEARANCE_PREFERENCE_KEY);
    return true;
  } catch {
    return false;
  }
}

function validSolarPosition(position) {
  return Boolean(position)
    && Number.isFinite(position.latitude)
    && Number.isFinite(position.longitude)
    && position.latitude >= -90
    && position.latitude <= 90
    && position.longitude >= -180
    && position.longitude <= 180;
}

function validTimestamp(value) {
  const timestampMs = value instanceof Date ? value.getTime() : Number(value);
  return Number.isFinite(timestampMs) ? timestampMs : null;
}

/**
 * Approximate apparent solar elevation from UTC time and the current ephemeral
 * position. It needs no network request and returns no reusable location data.
 */
export function solarElevationDegrees(position, capturedAt) {
  const timestampMs = validTimestamp(capturedAt);
  if (!validSolarPosition(position) || timestampMs == null) return null;

  const julianDay = timestampMs / 86400000 + 2440587.5;
  const daysSinceJ2000 = julianDay - 2451545;
  const meanLongitude = normalizeDegrees(280.46 + 0.9856474 * daysSinceJ2000);
  const meanAnomaly = degreesToRadians(normalizeDegrees(357.528 + 0.9856003 * daysSinceJ2000));
  const eclipticLongitude = degreesToRadians(normalizeDegrees(
    meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly),
  ));
  const obliquity = degreesToRadians(23.439 - 0.0000004 * daysSinceJ2000);
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  );
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const siderealDegrees = normalizeDegrees(
    280.46061837 + 360.98564736629 * daysSinceJ2000 + position.longitude,
  );
  const hourAngle = degreesToRadians(
    ((siderealDegrees - radiansToDegrees(rightAscension) + 540) % 360) - 180,
  );
  const latitude = degreesToRadians(position.latitude);
  return radiansToDegrees(Math.asin(
    Math.sin(latitude) * Math.sin(declination)
      + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
  ));
}

export function solarAppearancePhase(position, capturedAt) {
  const elevation = solarElevationDegrees(position, capturedAt);
  if (!Number.isFinite(elevation)) return null;
  if (elevation >= APPEARANCE_SOLAR_THRESHOLDS.dayElevationDegrees) return "day";
  if (elevation <= APPEARANCE_SOLAR_THRESHOLDS.nightElevationDegrees) return "night";
  return "twilight";
}

/**
 * Resolves the effective chrome family without mutating the selected visual
 * palette. The caller may withhold a system scheme if Tesla proves the media
 * query static; twilight and active gestures retain the current family.
 */
export function resolveAppearance({
  mode,
  systemColorScheme = null,
  solarPhase = null,
  currentAppearance = DEFAULT_APPEARANCE_MODE,
  interactionActive = false,
} = {}) {
  const preference = normalizeAppearanceMode(mode);
  const current = currentAppearance === "dark" ? "dark" : "light";
  if (preference === "light" || preference === "dark") return preference;

  const system = systemColorScheme === "dark"
    ? "dark"
    : systemColorScheme === "light"
      ? "light"
      : null;
  const solar = solarPhase === "night"
    ? "dark"
    : solarPhase === "day"
      ? "light"
      : current;
  const desired = system ?? solar;
  return interactionActive && desired !== current ? current : desired;
}
