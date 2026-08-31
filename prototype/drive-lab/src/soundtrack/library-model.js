export const SOUNDTRACK_LIBRARY_SCHEMA = "sedicivalvole.soundtrack-library.v1";
export const SOUNDTRACK_ROTATION_INTERVAL_MS = 30 * 60 * 1000;

export const SOUNDTRACK_PACE_OPTIONS = Object.freeze([
  Object.freeze({ id: "slow", label: "Slow", speeds: Object.freeze(["verylow", "low"]) }),
  Object.freeze({ id: "medium", label: "Medium", speeds: Object.freeze(["medium"]) }),
  Object.freeze({ id: "fast", label: "Fast", speeds: Object.freeze(["high", "veryhigh"]) }),
]);

// These are the genre chart tags recommended by the current Jamendo tracks API.
export const SOUNDTRACK_GENRE_OPTIONS = Object.freeze([
  Object.freeze({ id: "lounge", label: "Lounge" }),
  Object.freeze({ id: "electronic", label: "Electronic" }),
  Object.freeze({ id: "jazz", label: "Jazz" }),
  Object.freeze({ id: "rock", label: "Rock" }),
  Object.freeze({ id: "soundtrack", label: "Soundtrack" }),
]);

const asText = (value) => typeof value === "string" ? value.trim() : "";

const hashText = (value) => {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export function soundtrackRotationWindow(nowMs = Date.now()) {
  const capturedAtMs = Number.isFinite(nowMs) && nowMs >= 0 ? nowMs : 0;
  const id = Math.floor(capturedAtMs / SOUNDTRACK_ROTATION_INTERVAL_MS);
  const startsAtMs = id * SOUNDTRACK_ROTATION_INTERVAL_MS;
  return Object.freeze({
    id,
    startsAtMs,
    endsAtMs: startsAtMs + SOUNDTRACK_ROTATION_INTERVAL_MS,
    intervalMs: SOUNDTRACK_ROTATION_INTERVAL_MS,
  });
}

export function normalizeSoundtrackSelection(selection = {}) {
  if (selection?.kind === "pace") {
    const pace = SOUNDTRACK_PACE_OPTIONS.find((entry) => entry.id === selection.id);
    if (pace) return Object.freeze({ kind: "pace", id: pace.id, label: pace.label, speed: pace.speeds, genre: null });
  }
  if (selection?.kind === "genre") {
    const genre = SOUNDTRACK_GENRE_OPTIONS.find((entry) => entry.id === selection.id);
    if (genre) return Object.freeze({ kind: "genre", id: genre.id, label: genre.label, speed: Object.freeze([]), genre: genre.id });
  }
  if (selection?.kind === "featured") {
    return Object.freeze({ kind: "featured", id: "signal-border", label: "Signal Border", speed: Object.freeze([]), genre: null });
  }
  return Object.freeze({ kind: "library", id: "all", label: "Jamendo Library", speed: Object.freeze([]), genre: null });
}

export function soundtrackSelectionSignature(selection = {}) {
  const normalized = normalizeSoundtrackSelection(selection);
  return `${normalized.kind}:${normalized.id}`;
}

export function rotateSoundtrackEntries(entries, {
  nowMs = Date.now(),
  selection = null,
} = {}) {
  const list = Array.isArray(entries) ? [...entries] : [];
  const window = soundtrackRotationWindow(nowMs);
  const signature = soundtrackSelectionSignature(selection);
  list.sort((left, right) => {
    const a = hashText(`${window.id}:${signature}:${asText(left?.key)}`);
    const b = hashText(`${window.id}:${signature}:${asText(right?.key)}`);
    return a - b || asText(left?.key).localeCompare(asText(right?.key));
  });
  return Object.freeze({
    schema: SOUNDTRACK_LIBRARY_SCHEMA,
    window,
    selection: normalizeSoundtrackSelection(selection),
    entries: Object.freeze(list),
  });
}

export function startSoundtrackEntriesAtRandom(entries, {
  random = Math.random,
  avoidKey = null,
} = {}) {
  const list = Array.isArray(entries) ? [...entries] : [];
  if (list.length < 2) return Object.freeze(list);
  let sample = 0;
  try {
    sample = Number(typeof random === "function" ? random() : 0) || 0;
  } catch {
    sample = 0;
  }
  const unit = Math.min(0.999999, Math.max(0, sample));
  let startIndex = Math.floor(unit * list.length);
  const normalizedAvoidKey = asText(avoidKey);
  if (normalizedAvoidKey && asText(list[startIndex]?.key) === normalizedAvoidKey) {
    startIndex = (startIndex + 1) % list.length;
  }
  return Object.freeze([
    ...list.slice(startIndex),
    ...list.slice(0, startIndex),
  ]);
}
