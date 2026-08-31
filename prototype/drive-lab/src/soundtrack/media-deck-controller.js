import { SOUNDTRACK_QUEUE_SCHEMA } from "./rotation-model.js";

const MEDIA_ROLES = Object.freeze(["previous", "current", "next"]);
const HAVE_FUTURE_DATA = 3;

const asFinite = (value) => Number.isFinite(value) ? value : null;

const rounded = (value, precision = 2) => {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const playbackUrl = (entry) => entry?.policy?.item?.playbackUrl
  || entry?.policy?.item?.streamUrl
  || "";

const defaultMediaFactory = () => {
  if (typeof Audio !== "function") throw new Error("audio-constructor-unavailable");
  return new Audio();
};

function bufferedAheadSeconds(media) {
  const buffered = media?.buffered;
  const currentTime = asFinite(media?.currentTime) ?? 0;
  if (!buffered || !Number.isFinite(buffered.length)) return null;
  try {
    for (let index = 0; index < buffered.length; index += 1) {
      const start = buffered.start(index);
      const end = buffered.end(index);
      if (start <= currentTime + 0.05 && end >= currentTime) {
        return rounded(Math.max(0, end - currentTime), 2);
      }
    }
  } catch {
    return null;
  }
  return 0;
}

function safeErrorCode(media) {
  const code = media?.error?.code;
  return Number.isFinite(code) ? Math.max(0, Math.trunc(code)) : null;
}

function disposeMedia(media, listeners) {
  for (const [eventName, listener] of listeners) {
    media.removeEventListener?.(eventName, listener);
  }
  try {
    media.pause?.();
  } catch {
    // Teardown continues even when an embedded browser rejects pause().
  }
  try {
    media.removeAttribute?.("src");
    if (typeof media.removeAttribute !== "function") media.src = "";
    media.load?.();
  } catch {
    // A failed load reset must not retain the controller record.
  }
}

export function createSoundtrackMediaDeckController({
  mediaFactory = defaultMediaFactory,
  crossOrigin = "anonymous",
  onMediaCreate = null,
  onMediaDispose = null,
  onSnapshot = null,
  onEnded = null,
  onError = null,
} = {}) {
  const records = new Map();
  let roles = { previous: null, current: null, next: null };
  let destroyed = false;
  let controllerError = null;

  const mediaSnapshot = (key) => {
    if (!key) return null;
    const record = records.get(key);
    if (!record) return Object.freeze({
      key,
      state: "unavailable",
      readyState: null,
      networkState: null,
      bufferedAheadSeconds: null,
      paused: true,
      ended: false,
      errorCode: null,
      lastEvent: "media-unavailable",
    });
    const { media } = record;
    return Object.freeze({
      key,
      state: safeErrorCode(media) != null
        ? "error"
        : (Number(media.readyState) >= HAVE_FUTURE_DATA ? "playable" : "loading"),
      readyState: Number.isFinite(media.readyState) ? media.readyState : null,
      networkState: Number.isFinite(media.networkState) ? media.networkState : null,
      bufferedAheadSeconds: bufferedAheadSeconds(media),
      paused: media.paused !== false,
      ended: media.ended === true,
      currentTimeSeconds: rounded(asFinite(media.currentTime), 2),
      durationSeconds: rounded(asFinite(media.duration), 2),
      errorCode: safeErrorCode(media),
      lastEvent: record.lastEvent,
    });
  };

  const getSnapshot = () => {
    const roleSnapshots = Object.freeze({
      previous: mediaSnapshot(roles.previous),
      current: mediaSnapshot(roles.current),
      next: mediaSnapshot(roles.next),
    });
    const values = Object.values(roleSnapshots).filter(Boolean);
    const current = roleSnapshots.current;
    const mediaFailure = values.some((value) => ["error", "unavailable"].includes(value.state));
    const audibleKeys = [...records]
      .filter(([, record]) => record.media.paused === false && record.media.ended !== true)
      .map(([key]) => key);
    return Object.freeze({
      status: destroyed
        ? "destroyed"
        : (controllerError || mediaFailure) ? "degraded" : values.length ? "prepared" : "empty",
      roles: roleSnapshots,
      preparedMediaElements: records.size,
      playableMediaElements: values.filter((value) => value.state === "playable").length,
      currentAudibleKey: current && current.paused === false && current.ended === false
        ? current.key
        : null,
      audibleKeys: Object.freeze(audibleKeys),
      browserPreloadHint: "auto",
      browserBufferOwnership: "browser-owned-observation-only",
      offlineAudioAvailable: false,
      persistentAudioStorage: false,
      automaticModeFallback: false,
      controllerError,
    });
  };

  const emit = (reason) => {
    const snapshot = getSnapshot();
    if (typeof onSnapshot === "function") {
      try {
        onSnapshot(snapshot, reason);
      } catch {
        // Observers cannot break playback ownership.
      }
    }
    return snapshot;
  };

  const reportError = (detail) => {
    if (typeof onError !== "function") return;
    try {
      onError(Object.freeze(detail));
    } catch {
      // Error observers cannot break playback ownership.
    }
  };

  const disposeRecord = (key) => {
    const record = records.get(key);
    if (!record) return;
    records.delete(key);
    try { onMediaDispose?.(key, record.media, record.entry); } catch { /* best effort */ }
    disposeMedia(record.media, record.listeners);
  };

  const createRecord = (entry) => {
    const media = mediaFactory(entry);
    if (!media
      || typeof media !== "object"
      || typeof media.play !== "function"
      || typeof media.pause !== "function") {
      throw new Error("invalid-media-element");
    }
    const record = {
      entry,
      media,
      listeners: [],
      lastEvent: "created",
    };
    const observe = (eventName) => {
      const listener = () => {
        if (destroyed || records.get(entry.key) !== record) return;
        record.lastEvent = eventName;
        if (eventName === "error") {
          reportError({
            code: "media-error",
            key: entry.key,
            mediaErrorCode: safeErrorCode(media),
          });
        }
        if (eventName === "ended" && roles.current === entry.key && typeof onEnded === "function") {
          try {
            onEnded(entry);
          } catch {
            // End observers cannot mutate controller ownership synchronously.
          }
        }
        emit(`media:${eventName}`);
      };
      record.listeners.push([eventName, listener]);
      media.addEventListener?.(eventName, listener);
    };
    for (const eventName of [
      "loadstart",
      "loadedmetadata",
      "progress",
      "canplay",
      "canplaythrough",
      "playing",
      "pause",
      "waiting",
      "stalled",
      "suspend",
      "ended",
      "error",
    ]) observe(eventName);

    try {
      records.set(entry.key, record);
      media.preload = "auto";
      if (crossOrigin) media.crossOrigin = crossOrigin;
      media.src = playbackUrl(entry);
      media.load?.();
      onMediaCreate?.(entry.key, media, entry);
    } catch (error) {
      records.delete(entry.key);
      try { onMediaDispose?.(entry.key, media, entry); } catch { /* best effort */ }
      disposeMedia(media, record.listeners);
      throw error;
    }
    return record;
  };

  const ensureRecord = (entry) => {
    const existing = records.get(entry.key);
    if (existing && playbackUrl(existing.entry) === playbackUrl(entry)) {
      existing.entry = entry;
      return existing;
    }
    if (existing) disposeRecord(entry.key);
    return createRecord(entry);
  };

  const syncQueue = (queueState, { retainKeys = [], audibleKeys = [], restartKeys = [] } = {}) => {
    if (destroyed) return getSnapshot();
    if (queueState?.schema !== SOUNDTRACK_QUEUE_SCHEMA) {
      controllerError = "invalid-queue";
      reportError({ code: controllerError, key: null, mediaErrorCode: null });
      return emit("queue:invalid");
    }

    controllerError = null;
    for (const key of new Set(restartKeys)) {
      const record = records.get(key);
      if (!record || record.media.paused === false) continue;
      disposeRecord(key);
    }
    const desired = new Map();
    const nextRoles = { previous: null, current: null, next: null };
    const queueKeys = MEDIA_ROLES
      .map((role) => queueState.slots?.[role]?.key)
      .filter(Boolean);
    if (new Set(queueKeys).size !== queueKeys.length) {
      controllerError = "duplicate-queue-entry";
      reportError({ code: controllerError, key: null, mediaErrorCode: null });
      return emit("queue:duplicate");
    }
    const currentEntry = queueState.slots?.current ?? null;
    if (currentEntry) desired.set(currentEntry.key, currentEntry);
    for (const key of retainKeys) {
      const record = records.get(key);
      if (record && !desired.has(key) && desired.size < MEDIA_ROLES.length) {
        desired.set(key, record.entry);
      }
    }
    for (const role of MEDIA_ROLES) {
      const entry = queueState.slots?.[role] ?? null;
      if (!entry) continue;
      if (!desired.has(entry.key) && desired.size < MEDIA_ROLES.length) desired.set(entry.key, entry);
      if (desired.has(entry.key)) nextRoles[role] = entry.key;
    }

    for (const key of records.keys()) {
      if (!desired.has(key)) disposeRecord(key);
    }
    for (const entry of desired.values()) {
      try {
        ensureRecord(entry);
      } catch (error) {
        controllerError = "media-create-failed";
        reportError({
          code: controllerError,
          key: entry.key,
          mediaErrorCode: null,
          reason: String(error?.message || "unknown").slice(0, 80),
        });
      }
    }
    roles = nextRoles;
    const audibleSet = new Set(audibleKeys);
    for (const [key, record] of records) {
      if (key === roles.current || audibleSet.has(key) || record.media.paused !== false) continue;
      try {
        record.media.pause?.();
      } catch {
        controllerError = "media-pause-failed";
      }
    }
    return emit("queue:synced");
  };

  const playCurrent = async () => {
    if (destroyed) return Object.freeze({ ok: false, reason: "destroyed", snapshot: getSnapshot() });
    const record = roles.current ? records.get(roles.current) : null;
    if (!record) {
      return Object.freeze({ ok: false, reason: "current-media-unavailable", snapshot: getSnapshot() });
    }
    for (const [key, candidate] of records) {
      if (key === roles.current || candidate.media.paused !== false) continue;
      candidate.media.pause?.();
    }
    try {
      await record.media.play?.();
      if (destroyed || records.get(record.entry.key) !== record || roles.current !== record.entry.key) {
        record.media.pause?.();
        return Object.freeze({ ok: false, reason: "stale-play-request", snapshot: getSnapshot() });
      }
      record.lastEvent = "play-resolved";
      return Object.freeze({ ok: true, reason: null, snapshot: emit("current:playing") });
    } catch (error) {
      if (records.get(record.entry.key) === record) record.lastEvent = "play-rejected";
      reportError({
        code: "play-rejected",
        key: record.entry.key,
        mediaErrorCode: safeErrorCode(record.media),
        reason: String(error?.name || error?.message || "unknown").slice(0, 80),
      });
      return Object.freeze({ ok: false, reason: "play-rejected", snapshot: emit("current:play-rejected") });
    }
  };

  const playKeys = async (keys = []) => {
    if (destroyed) return Object.freeze({ ok: false, reason: "destroyed", snapshot: getSnapshot() });
    const requested = [...new Set(keys)].filter(Boolean);
    if (!requested.length || requested.some((key) => !records.has(key))) {
      return Object.freeze({ ok: false, reason: "transition-media-unavailable", snapshot: getSnapshot() });
    }
    try {
      await Promise.all(requested.map((key) => records.get(key).media.play?.()));
      if (destroyed || requested.some((key) => !records.has(key))) {
        return Object.freeze({ ok: false, reason: "stale-play-request", snapshot: getSnapshot() });
      }
      for (const key of requested) records.get(key).lastEvent = "transition-play-resolved";
      return Object.freeze({ ok: true, reason: null, snapshot: emit("transition:playing") });
    } catch (error) {
      reportError({
        code: "play-rejected",
        key: roles.current,
        mediaErrorCode: safeErrorCode(records.get(roles.current)?.media),
        reason: String(error?.name || error?.message || "unknown").slice(0, 80),
      });
      return Object.freeze({ ok: false, reason: "play-rejected", snapshot: emit("transition:play-rejected") });
    }
  };

  const pauseExcept = (keys = []) => {
    const keep = new Set(keys);
    for (const [key, record] of records) {
      if (keep.has(key) || record.media.paused !== false) continue;
      try { record.media.pause?.(); } catch { controllerError = "media-pause-failed"; }
      record.lastEvent = "transition-pause-requested";
    }
    return emit("transition:paused-outgoing");
  };

  const pauseCurrent = () => {
    const record = roles.current ? records.get(roles.current) : null;
    if (!record) return getSnapshot();
    record.media.pause?.();
    record.lastEvent = "pause-requested";
    return emit("current:paused");
  };

  const destroy = () => {
    if (destroyed) return getSnapshot();
    destroyed = true;
    for (const key of [...records.keys()]) disposeRecord(key);
    roles = { previous: null, current: null, next: null };
    return emit("controller:destroyed");
  };

  return Object.freeze({
    syncQueue,
    playCurrent,
    playKeys,
    pauseExcept,
    pauseCurrent,
    getSnapshot,
    getMediaForRole: (role) => records.get(roles[role])?.media ?? null,
    destroy,
  });
}
