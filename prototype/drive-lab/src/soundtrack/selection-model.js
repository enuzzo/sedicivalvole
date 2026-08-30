import { JAMENDO_TRACK_SPEEDS } from "./source-policy.js";

export const SOUNDTRACK_SELECTION_SCHEMA = "sedicivalvole.soundtrack-selection.v1";
export const SOUNDTRACK_CATALOG_SELECTION_SCHEMA = "sedicivalvole.soundtrack-catalog-selection.v1";
export const SOUNDTRACK_PACE_CEILING_KMH = 130;
export const SOUNDTRACK_PACE_HYSTERESIS_KMH = 3;

const BAND_WIDTH_KMH = SOUNDTRACK_PACE_CEILING_KMH / JAMENDO_TRACK_SPEEDS.length;
const PACE_SET = new Set(JAMENDO_TRACK_SPEEDS);

export const SOUNDTRACK_PACE_BANDS = Object.freeze([
  Object.freeze({ id: "verylow", label: "Very low", description: "Unhurried source pace" }),
  Object.freeze({ id: "low", label: "Low", description: "Relaxed source pace" }),
  Object.freeze({ id: "medium", label: "Medium", description: "Balanced source pace" }),
  Object.freeze({ id: "high", label: "High", description: "Lively source pace" }),
  Object.freeze({ id: "veryhigh", label: "Very high", description: "Most energetic source pace" }),
]);

const asText = (value) => typeof value === "string" ? value.trim() : "";

const asPace = (value) => {
  const pace = asText(value).toLowerCase();
  return PACE_SET.has(pace) ? pace : null;
};

const asSpeed = (value) => Number.isFinite(value)
  ? Math.min(SOUNDTRACK_PACE_CEILING_KMH, Math.max(0, value))
  : null;

const roundedSpeed = (value) => value == null ? null : Math.round(value * 10) / 10;

const paceIndex = (pace) => JAMENDO_TRACK_SPEEDS.indexOf(pace);

function directAutomaticPace(speedKmh) {
  const speed = asSpeed(speedKmh);
  if (speed == null) return null;
  const index = Math.min(
    JAMENDO_TRACK_SPEEDS.length - 1,
    Math.floor(speed / BAND_WIDTH_KMH),
  );
  return JAMENDO_TRACK_SPEEDS[index];
}

export function automaticSoundtrackPace(speedKmh, currentPace = null) {
  const speed = asSpeed(speedKmh);
  if (speed == null) return asPace(currentPace);
  let index = paceIndex(asPace(currentPace));
  if (index < 0) return directAutomaticPace(speed);

  while (index < JAMENDO_TRACK_SPEEDS.length - 1) {
    const upperBoundary = (index + 1) * BAND_WIDTH_KMH;
    if (speed < upperBoundary + SOUNDTRACK_PACE_HYSTERESIS_KMH) break;
    index += 1;
  }
  while (index > 0) {
    const lowerBoundary = index * BAND_WIDTH_KMH;
    if (speed > lowerBoundary - SOUNDTRACK_PACE_HYSTERESIS_KMH) break;
    index -= 1;
  }
  return JAMENDO_TRACK_SPEEDS[index];
}

function freezeSelection({
  mode,
  automaticPace,
  manualPace,
  lastSpeedKmh,
  revision,
}) {
  const resolvedMode = mode === "manual" ? "manual" : "automatic";
  const safeAutomatic = asPace(automaticPace);
  const safeManual = asPace(manualPace);
  return Object.freeze({
    schema: SOUNDTRACK_SELECTION_SCHEMA,
    mode: resolvedMode,
    automaticPace: safeAutomatic,
    manualPace: resolvedMode === "manual" ? safeManual : null,
    effectivePace: resolvedMode === "manual" ? safeManual : safeAutomatic,
    lastSpeedKmh: roundedSpeed(asSpeed(lastSpeedKmh)),
    revision: Math.max(0, Math.trunc(revision)),
    appliesTo: "next-track-selection-only",
    currentPlaybackUnaffected: true,
    automaticModeFallback: false,
  });
}

export function createSoundtrackSelectionState({
  mode = "automatic",
  manualPace = null,
  speedKmh = null,
} = {}) {
  const resolvedMode = mode === "manual" && asPace(manualPace)
    ? "manual"
    : "automatic";
  return freezeSelection({
    mode: resolvedMode,
    automaticPace: automaticSoundtrackPace(speedKmh),
    manualPace,
    lastSpeedKmh: speedKmh,
    revision: 0,
  });
}

export function updateSoundtrackDrivingPace(state, speedKmh) {
  if (state?.schema !== SOUNDTRACK_SELECTION_SCHEMA) return state;
  const nextAutomatic = automaticSoundtrackPace(speedKmh, state.automaticPace);
  const selectionChanged = state.mode === "automatic"
    && nextAutomatic !== state.automaticPace;
  return freezeSelection({
    ...state,
    automaticPace: nextAutomatic,
    lastSpeedKmh: speedKmh,
    revision: state.revision + (selectionChanged ? 1 : 0),
  });
}

export function setManualSoundtrackPace(state, pace) {
  if (state?.schema !== SOUNDTRACK_SELECTION_SCHEMA) return state;
  const manualPace = asPace(pace);
  if (!manualPace) return state;
  const changed = state.mode !== "manual" || state.manualPace !== manualPace;
  return freezeSelection({
    ...state,
    mode: "manual",
    manualPace,
    revision: state.revision + (changed ? 1 : 0),
  });
}

export function restoreAutomaticSoundtrackPace(state) {
  if (state?.schema !== SOUNDTRACK_SELECTION_SCHEMA || state.mode === "automatic") return state;
  return freezeSelection({
    ...state,
    mode: "automatic",
    manualPace: null,
    revision: state.revision + 1,
  });
}

const normalizedGenres = (values) => Object.freeze([
  ...new Set((Array.isArray(values) ? values : [])
    .map((value) => asText(value).toLowerCase())
    .filter(Boolean)),
].slice(0, 12));

const matchesGenres = (entry, requestedGenres, mode) => {
  if (!requestedGenres.length) return true;
  const entryGenres = new Set(entry?.policy?.item?.genres ?? []);
  return mode === "all"
    ? requestedGenres.every((genre) => entryGenres.has(genre))
    : requestedGenres.some((genre) => entryGenres.has(genre));
};

export function createSoundtrackCatalogSelectionView(catalog, state, {
  genres = [],
  genreMode = "any",
} = {}) {
  if (state?.schema !== SOUNDTRACK_SELECTION_SCHEMA) {
    return Object.freeze({
      schema: SOUNDTRACK_CATALOG_SELECTION_SCHEMA,
      status: "unavailable",
      reason: "invalid-selection-state",
      revision: null,
      entries: Object.freeze([]),
      sourceEntryCount: 0,
      matchedEntryCount: 0,
      currentPlaybackUnaffected: true,
      automaticModeFallback: false,
    });
  }
  if (catalog?.status !== "fresh" || !Array.isArray(catalog.entries)) {
    return Object.freeze({
      schema: SOUNDTRACK_CATALOG_SELECTION_SCHEMA,
      status: catalog?.status ?? "unavailable",
      reason: catalog?.reason ?? "catalog-unavailable",
      revision: catalog?.revision ?? null,
      entries: Object.freeze([]),
      sourceEntryCount: 0,
      matchedEntryCount: 0,
      currentPlaybackUnaffected: true,
      automaticModeFallback: false,
    });
  }

  const requestedGenres = normalizedGenres(genres);
  const resolvedGenreMode = genreMode === "all" ? "all" : "any";
  const effectivePace = state.effectivePace;
  const entries = catalog.entries.filter((entry) => (
    (!effectivePace || entry?.policy?.item?.pace === effectivePace)
    && matchesGenres(entry, requestedGenres, resolvedGenreMode)
  ));
  const selectionKey = [
    `pace:${effectivePace ?? "all"}`,
    `genres:${requestedGenres.join("+") || "all"}`,
    `mode:${resolvedGenreMode}`,
    `revision:${state.revision}`,
  ].join("|");
  return Object.freeze({
    schema: SOUNDTRACK_CATALOG_SELECTION_SCHEMA,
    status: "fresh",
    reason: entries.length ? null : "selection-empty",
    revision: `${catalog.revision ?? "catalog"}|${selectionKey}`,
    fetchedAtMs: catalog.fetchedAtMs ?? null,
    expiresAtMs: catalog.expiresAtMs ?? null,
    ageMs: catalog.ageMs ?? null,
    remainingTtlMs: catalog.remainingTtlMs ?? 0,
    entries: Object.freeze(entries),
    sourceEntryCount: catalog.entries.length,
    matchedEntryCount: entries.length,
    entriesWithoutPace: catalog.entries.filter((entry) => !entry?.policy?.item?.pace).length,
    entriesWithoutGenres: catalog.entries.filter(
      (entry) => !(entry?.policy?.item?.genres?.length),
    ).length,
    selection: Object.freeze({
      mode: state.mode,
      effectivePace,
      genres: requestedGenres,
      genreMode: resolvedGenreMode,
      exactSourceMetadataOnly: true,
    }),
    appliesTo: "next-track-selection-only",
    currentPlaybackUnaffected: true,
    automaticModeFallback: false,
  });
}
