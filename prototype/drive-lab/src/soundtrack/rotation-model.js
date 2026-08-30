import { findSoundtrackCatalogEntry } from "./catalog-store.js";

export const SOUNDTRACK_QUEUE_SCHEMA = "sedicivalvole.soundtrack-queue.v1";
export const SOUNDTRACK_METADATA_SLOT_TARGET = 3;
export const DEFAULT_RECENT_TRACK_LIMIT = 24;
export const DEFAULT_RECENT_ARTIST_LIMIT = 12;

const asText = (value) => typeof value === "string" ? value.trim() : "";

const boundedLimit = (value, fallback) => Number.isFinite(value)
  ? Math.min(100, Math.max(1, Math.trunc(value)))
  : fallback;

const artistKey = (entry) => {
  const artistId = asText(entry?.policy?.item?.artistId);
  const artistName = asText(entry?.policy?.item?.artistName).toLowerCase();
  return `${entry?.source ?? "unknown"}:${artistId || artistName || "unknown"}`;
};

const remember = (values, value, limit) => {
  if (!value) return values;
  const next = values.filter((candidate) => candidate !== value);
  next.push(value);
  return next.slice(-limit);
};

const narrowWhenPossible = (entries, predicate) => {
  const preferred = entries.filter(predicate);
  return preferred.length ? preferred : entries;
};

const stateStatus = (slots) => {
  const prepared = Object.values(slots).filter(Boolean).length;
  if (!slots.current) return prepared ? "no-current" : "empty";
  return prepared === SOUNDTRACK_METADATA_SLOT_TARGET ? "ready" : "partial";
};

function freezeQueueState({
  slots,
  recentTrackKeys,
  recentArtistKeys,
  selectionCursor,
  recentTrackLimit,
  recentArtistLimit,
  catalogRevision,
}) {
  const frozenSlots = Object.freeze({
    previous: slots.previous ?? null,
    current: slots.current ?? null,
    next: slots.next ?? null,
  });
  return Object.freeze({
    schema: SOUNDTRACK_QUEUE_SCHEMA,
    status: stateStatus(frozenSlots),
    catalogRevision: asText(catalogRevision) || null,
    slots: frozenSlots,
    recentTrackKeys: Object.freeze([...recentTrackKeys]),
    recentArtistKeys: Object.freeze([...recentArtistKeys]),
    selectionCursor: Math.max(0, Math.trunc(selectionCursor)),
    recentTrackLimit,
    recentArtistLimit,
    automaticModeFallback: false,
    audioStorage: "none",
  });
}

function emptyQueueState({
  recentTrackLimit = DEFAULT_RECENT_TRACK_LIMIT,
  recentArtistLimit = DEFAULT_RECENT_ARTIST_LIMIT,
  catalogRevision = null,
} = {}) {
  return freezeQueueState({
    slots: { previous: null, current: null, next: null },
    recentTrackKeys: [],
    recentArtistKeys: [],
    selectionCursor: 0,
    recentTrackLimit: boundedLimit(recentTrackLimit, DEFAULT_RECENT_TRACK_LIMIT),
    recentArtistLimit: boundedLimit(recentArtistLimit, DEFAULT_RECENT_ARTIST_LIMIT),
    catalogRevision,
  });
}

function rememberCurrent(state, entry) {
  if (!entry) return state;
  return freezeQueueState({
    ...state,
    recentTrackKeys: remember(
      state.recentTrackKeys,
      entry.key,
      state.recentTrackLimit,
    ),
    recentArtistKeys: remember(
      state.recentArtistKeys,
      artistKey(entry),
      state.recentArtistLimit,
    ),
  });
}

function selectEntry(state, catalog, {
  usedKeys = new Set(),
  avoidKeys = new Set(),
  currentArtistKey = null,
} = {}) {
  if (catalog?.status !== "fresh") return { entry: null, selectionCursor: state.selectionCursor };
  let candidates = catalog.entries.filter((entry) => !usedKeys.has(entry.key));
  if (!candidates.length) return { entry: null, selectionCursor: state.selectionCursor };

  candidates = narrowWhenPossible(
    candidates,
    (entry) => !state.recentTrackKeys.includes(entry.key),
  );
  candidates = narrowWhenPossible(
    candidates,
    (entry) => !state.recentArtistKeys.includes(artistKey(entry)),
  );
  if (currentArtistKey) {
    candidates = narrowWhenPossible(
      candidates,
      (entry) => artistKey(entry) !== currentArtistKey,
    );
  }
  candidates = narrowWhenPossible(candidates, (entry) => !avoidKeys.has(entry.key));

  const index = state.selectionCursor % candidates.length;
  return {
    entry: candidates[index],
    selectionCursor: state.selectionCursor + 1,
  };
}

function withSelectionCursor(state, selectionCursor) {
  return freezeQueueState({ ...state, selectionCursor });
}

function withSlots(state, slots, catalogRevision = state.catalogRevision) {
  return freezeQueueState({ ...state, slots, catalogRevision });
}

function fillRole(state, catalog, role, avoidKeys = new Set()) {
  const usedKeys = new Set(Object.values(state.slots).filter(Boolean).map((entry) => entry.key));
  const selection = selectEntry(state, catalog, {
    usedKeys,
    avoidKeys,
    currentArtistKey: artistKey(state.slots.current),
  });
  if (!selection.entry) return state;
  return withSlots(
    withSelectionCursor(state, selection.selectionCursor),
    { ...state.slots, [role]: selection.entry },
    catalog.revision,
  );
}

function releasedOutsideState(entries, state) {
  const retainedKeys = new Set(Object.values(state.slots).filter(Boolean).map((entry) => entry.key));
  const released = [];
  const seen = new Set();
  for (const entry of entries.filter(Boolean)) {
    if (retainedKeys.has(entry.key) || seen.has(entry.key)) continue;
    seen.add(entry.key);
    released.push(entry);
  }
  return Object.freeze(released);
}

export function createSoundtrackQueue(catalog, options = {}) {
  let state = emptyQueueState({ ...options, catalogRevision: catalog?.revision });
  if (catalog?.status !== "fresh") {
    return Object.freeze({
      state,
      activated: null,
      released: Object.freeze([]),
      blockedReason: catalog?.reason ?? "catalog-unavailable",
    });
  }

  state = fillRole(state, catalog, "current");
  state = rememberCurrent(state, state.slots.current);
  state = fillRole(state, catalog, "next");
  state = fillRole(state, catalog, "previous");
  return Object.freeze({
    state,
    activated: state.slots.current,
    released: Object.freeze([]),
    blockedReason: state.slots.current ? null : "catalog-empty",
  });
}

export function refreshSoundtrackQueue(state, catalog) {
  if (state?.schema !== SOUNDTRACK_QUEUE_SCHEMA) {
    return Object.freeze({
      state: emptyQueueState(),
      preparedCurrent: null,
      released: Object.freeze([]),
      blockedReason: "invalid-queue",
    });
  }
  if (catalog?.status !== "fresh") {
    return Object.freeze({
      state,
      preparedCurrent: null,
      released: Object.freeze([]),
      blockedReason: catalog?.reason ?? "catalog-unavailable",
    });
  }

  const displaced = [];
  const slots = { ...state.slots };
  for (const role of ["previous", "next"]) {
    const existing = slots[role];
    if (!existing) continue;
    const refreshed = findSoundtrackCatalogEntry(catalog, existing.key);
    if (refreshed) {
      slots[role] = refreshed;
    } else {
      displaced.push(existing);
      slots[role] = null;
    }
  }

  let nextState = withSlots(state, slots, catalog.revision);
  let preparedCurrent = null;
  if (!nextState.slots.current) {
    nextState = fillRole(nextState, catalog, "current");
    preparedCurrent = nextState.slots.current;
    nextState = rememberCurrent(nextState, preparedCurrent);
  }
  if (!nextState.slots.next) nextState = fillRole(nextState, catalog, "next");
  if (!nextState.slots.previous) nextState = fillRole(nextState, catalog, "previous");

  return Object.freeze({
    state: nextState,
    preparedCurrent,
    released: releasedOutsideState(displaced, nextState),
    blockedReason: nextState.slots.current ? null : "catalog-empty",
  });
}

function resolveTarget(state, catalog, role) {
  const target = state.slots[role];
  const freshTarget = target
    ? findSoundtrackCatalogEntry(catalog, target.key)
    : null;
  if (freshTarget) {
    return {
      state: withSlots(state, { ...state.slots, [role]: freshTarget }, catalog.revision),
      displaced: [],
    };
  }

  let nextState = withSlots(
    state,
    { ...state.slots, [role]: null },
    catalog.revision,
  );
  nextState = fillRole(nextState, catalog, role, new Set(target ? [target.key] : []));
  return {
    state: nextState,
    displaced: target ? [target] : [],
  };
}

export function moveSoundtrackQueue(state, catalog, direction) {
  if (state?.schema !== SOUNDTRACK_QUEUE_SCHEMA) {
    return Object.freeze({
      state: emptyQueueState(),
      activated: null,
      released: Object.freeze([]),
      blockedReason: "invalid-queue",
    });
  }
  if (!state.slots.current) {
    return Object.freeze({
      state,
      activated: null,
      released: Object.freeze([]),
      blockedReason: "no-current-track",
    });
  }
  if (catalog?.status !== "fresh") {
    return Object.freeze({
      state,
      activated: null,
      released: Object.freeze([]),
      blockedReason: catalog?.reason ?? "catalog-unavailable",
    });
  }
  if (!["next", "previous"].includes(direction)) {
    return Object.freeze({
      state,
      activated: null,
      released: Object.freeze([]),
      blockedReason: "invalid-direction",
    });
  }

  const resolved = resolveTarget(state, catalog, direction);
  if (!resolved.state.slots[direction]) {
    return Object.freeze({
      state: resolved.state,
      activated: null,
      released: releasedOutsideState(resolved.displaced, resolved.state),
      blockedReason: "metadata-buffer-exhausted",
    });
  }

  const target = resolved.state.slots[direction];
  const expelled = direction === "next"
    ? resolved.state.slots.previous
    : resolved.state.slots.next;
  let nextState = direction === "next"
    ? withSlots(resolved.state, {
      previous: resolved.state.slots.current,
      current: target,
      next: null,
    }, catalog.revision)
    : withSlots(resolved.state, {
      previous: null,
      current: target,
      next: resolved.state.slots.current,
    }, catalog.revision);
  nextState = rememberCurrent(nextState, target);
  nextState = fillRole(
    nextState,
    catalog,
    direction,
    new Set(expelled ? [expelled.key] : []),
  );
  const released = releasedOutsideState(
    [...resolved.displaced, expelled],
    nextState,
  );

  return Object.freeze({
    state: nextState,
    activated: target,
    released,
    blockedReason: null,
  });
}

export function summarizeSoundtrackQueue(state) {
  if (state?.schema !== SOUNDTRACK_QUEUE_SCHEMA) {
    return Object.freeze({
      status: "invalid",
      preparedMetadataSlots: 0,
      targetMetadataSlots: SOUNDTRACK_METADATA_SLOT_TARGET,
      browserAudioBuffer: "unmeasured",
      offlineAudioAvailable: false,
      automaticModeFallback: false,
    });
  }
  const preparedMetadataSlots = Object.values(state.slots).filter(Boolean).length;
  return Object.freeze({
    status: state.status,
    catalogRevision: state.catalogRevision,
    preparedMetadataSlots,
    targetMetadataSlots: SOUNDTRACK_METADATA_SLOT_TARGET,
    hasPrevious: Boolean(state.slots.previous),
    hasCurrent: Boolean(state.slots.current),
    hasNext: Boolean(state.slots.next),
    currentKey: state.slots.current?.key ?? null,
    recentTrackCount: state.recentTrackKeys.length,
    recentArtistCount: state.recentArtistKeys.length,
    browserAudioBuffer: "browser-owned-unmeasured",
    offlineAudioAvailable: false,
    automaticModeFallback: false,
  });
}
