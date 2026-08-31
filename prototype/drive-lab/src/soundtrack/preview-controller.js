import { fetchSoundtrackCatalog } from "./catalog-client.js";
import { createSoundtrackMediaDeckController } from "./media-deck-controller.js";
import { createSoundtrackQueue, moveSoundtrackQueue } from "./rotation-model.js";
import {
  normalizeSoundtrackSelection,
  rotateSoundtrackEntries,
} from "./library-model.js";
import { deriveSoundtrackAttribution } from "./attribution-model.js";
import {
  createSoundtrackTransitionState,
  sampleSoundtrackTransition,
  scheduleSoundtrackTransition,
  settleSoundtrackTransition,
} from "./transition-model.js";

export const SOUNDTRACK_PREVIEW_SCHEMA = "sedicivalvole.soundtrack-preview.v1";

const safeCredit = (entry) => entry ? Object.freeze({
  key: entry.key,
  title: entry.policy.item.title,
  artistName: entry.policy.item.artistName,
  albumName: entry.policy.item.albumName,
  imageUrl: entry.policy.item.imageUrl,
  shareUrl: entry.policy.item.shareUrl,
  providerCredit: entry.policy.providerCredit,
  licenceLabel: entry.policy.licence.label,
  licenceUrl: entry.policy.licence.url,
  pace: entry.policy.item.pace,
  genres: entry.policy.item.genres,
}) : null;

export function createSoundtrackPreviewController({
  fetchImpl = globalThis.fetch,
  mediaFactory,
  crossOrigin = "anonymous",
  effectsFactory = () => ({
    attachMedia: () => {},
    detachMedia: () => {},
    getClockTime: () => (globalThis.performance?.now?.() ?? Date.now()) / 1000,
    setImmediateTrackGains: () => Object.freeze({ ok: true, mode: "bypassed" }),
    applyTransition: () => Object.freeze({ ok: true, mode: "bypassed" }),
    resume: async () => {},
    setVehicleMaster: () => {},
    setVehicleMacros: () => {},
    setManualEffects: () => {},
    getSnapshot: () => Object.freeze({ status: "bypassed" }),
    getLevel: () => 0,
    destroy: () => {},
  }),
  onState = null,
  setTimer = globalThis.setTimeout?.bind(globalThis),
  clearTimer = globalThis.clearTimeout?.bind(globalThis),
} = {}) {
  let destroyed = false;
  let requestRevision = 0;
  let catalogResult = null;
  let queueState = null;
  let libraryRotation = null;
  let status = "idle";
  let error = null;
  let mediaSnapshot = null;
  let transitionState = null;
  const transitionTimers = new Set();
  const effects = effectsFactory();

  const clockTime = () => Number(effects.getClockTime?.()) || 0;

  const clearTransitionTimers = () => {
    for (const timer of transitionTimers) clearTimer?.(timer);
    transitionTimers.clear();
  };

  const scheduleTransitionTimer = (callback, delayMs) => {
    if (typeof setTimer !== "function") return null;
    const timer = setTimer(() => {
      transitionTimers.delete(timer);
      callback();
    }, Math.max(0, delayMs));
    transitionTimers.add(timer);
    return timer;
  };

  const attribution = () => transitionState && catalogResult
    ? deriveSoundtrackAttribution({
      transitionState,
      at: clockTime(),
      entries: catalogResult.catalog.entries,
    })
    : null;

  const snapshot = () => Object.freeze({
    schema: SOUNDTRACK_PREVIEW_SCHEMA,
    status: destroyed ? "destroyed" : status,
    error,
    current: safeCredit(queueState?.slots?.current),
    hasPrevious: Boolean(queueState?.slots?.previous),
    hasNext: Boolean(queueState?.slots?.next),
    receivedEntries: catalogResult?.receivedEntries ?? 0,
    admittedEntries: catalogResult?.admittedEntries ?? 0,
    rejectedEntries: catalogResult?.rejectedEntries ?? 0,
    library: libraryRotation ? Object.freeze({
      schema: libraryRotation.schema,
      selection: libraryRotation.selection,
      rotationWindow: libraryRotation.window,
      entries: Object.freeze(libraryRotation.entries.map(safeCredit).filter(Boolean)),
      refreshCopy: "Fresh mix · changes every 30 min",
    }) : null,
    attribution: attribution(),
    transition: transitionState ? sampleSoundtrackTransition(transitionState, clockTime()) : null,
    media: mediaSnapshot,
    effects: effects.getSnapshot(),
    playbackRate: 1,
    drivingCanChangeTrack: false,
    drivingCanRetimeRecording: false,
    persistentAudioStorage: false,
  });

  const emit = () => {
    const state = snapshot();
    if (typeof onState === "function") {
      try {
        onState(state);
      } catch {
        // Preview observers cannot affect media ownership.
      }
    }
    return state;
  };

  const deck = createSoundtrackMediaDeckController({
    mediaFactory,
    crossOrigin,
    onMediaCreate: (key, media) => effects.attachMedia(key, media),
    onMediaDispose: (key) => effects.detachMedia(key),
    onSnapshot(nextSnapshot) {
      mediaSnapshot = nextSnapshot;
      emit();
    },
    onEnded() {
      if (!destroyed) void move("next");
    },
    onError(detail) {
      error = [
        detail?.code ?? "media-error",
        Number.isFinite(detail?.mediaErrorCode) ? `code-${detail.mediaErrorCode}` : null,
        detail?.reason,
      ].filter(Boolean).join(":");
      status = "error";
      emit();
    },
  });

  const playPreparedCurrent = async (revision) => {
    await effects.resume();
    const currentKey = queueState?.slots?.current?.key;
    if (currentKey) {
      transitionState = createSoundtrackTransitionState(currentKey, clockTime());
      effects.setImmediateTrackGains?.({ [currentKey]: 1 });
    }
    const result = await deck.playCurrent();
    if (destroyed || revision !== requestRevision) return snapshot();
    if (!result.ok) {
      status = "error";
      error = error || result.reason;
    } else {
      status = "playing";
      error = null;
    }
    return emit();
  };

  const scheduleWithTrackLimit = (targetKey, at) => {
    const initial = transitionState
      ?? createSoundtrackTransitionState(queueState?.slots?.current?.key, at);
    let scheduled = scheduleSoundtrackTransition({ state: initial, targetKey, startAt: at });
    if (scheduled.blockedReason !== "transition-track-limit") return scheduled;
    const sampled = sampleSoundtrackTransition(initial, at);
    const fallbackKey = sampled.dominantKey || initial.targetKey;
    const collapsed = createSoundtrackTransitionState(fallbackKey, at);
    effects.setImmediateTrackGains?.({ [fallbackKey]: 1 });
    deck.pauseExcept([fallbackKey]);
    scheduled = scheduleSoundtrackTransition({ state: collapsed, targetKey, startAt: at });
    transitionState = collapsed;
    return scheduled;
  };

  const transitionToQueue = async (nextQueueState, revision) => {
    clearTransitionTimers();
    await effects.resume();
    if (destroyed || revision !== requestRevision) return snapshot();
    const targetKey = nextQueueState?.slots?.current?.key;
    const prepared = scheduleWithTrackLimit(targetKey, clockTime());
    if (prepared.blockedReason) {
      status = "error";
      error = prepared.blockedReason;
      return emit();
    }
    const retainedKeys = [...new Set([
      ...Object.entries(prepared.state.fromGains)
        .filter(([, gain]) => gain > 0.000001)
        .map(([key]) => key),
      targetKey,
    ])];
    queueState = nextQueueState;
    mediaSnapshot = deck.syncQueue(queueState, {
      retainKeys: retainedKeys,
      audibleKeys: retainedKeys,
    });
    effects.setImmediateTrackGains?.(prepared.state.fromGains);
    const started = await deck.playKeys(retainedKeys);
    if (destroyed || revision !== requestRevision) return snapshot();
    if (!started.ok) {
      status = "error";
      error = error || started.reason;
      return emit();
    }

    const scheduled = scheduleWithTrackLimit(targetKey, clockTime());
    if (scheduled.blockedReason) {
      status = "error";
      error = scheduled.blockedReason;
      return emit();
    }
    transitionState = scheduled.state;
    const applied = effects.applyTransition?.(transitionState);
    if (applied?.ok === false) {
      status = "error";
      error = applied.reason || "transition-gain-failed";
      return emit();
    }
    status = "playing";
    error = null;
    emit();

    const transitionRevision = transitionState.revision;
    const durationMs = transitionState.durationSeconds * 1000;
    scheduleTransitionTimer(() => {
      if (!destroyed && revision === requestRevision && transitionState?.revision === transitionRevision) emit();
    }, durationMs * 0.52);
    scheduleTransitionTimer(() => {
      if (destroyed || revision !== requestRevision || transitionState?.revision !== transitionRevision) return;
      const settled = settleSoundtrackTransition({
        state: transitionState,
        at: clockTime(),
        requestedKey: targetKey,
        currentRevision: transitionRevision,
      });
      if (!settled.completed) return;
      transitionState = settled.state;
      effects.setImmediateTrackGains?.({ [targetKey]: 1 });
      mediaSnapshot = deck.pauseExcept([targetKey]);
      mediaSnapshot = deck.syncQueue(queueState, { audibleKeys: [targetKey] });
      emit();
    }, durationMs + 24);
    return snapshot();
  };

  const load = async ({
    selection = null,
    autoplay = false,
    nowMs = Date.now(),
  } = {}) => {
    if (destroyed) return snapshot();
    const revision = ++requestRevision;
    status = "loading";
    error = null;
    emit();
    try {
      const normalizedSelection = normalizeSoundtrackSelection(selection);
      const nextCatalogResult = await fetchSoundtrackCatalog({
        fetchImpl,
        limit: 50,
        speed: normalizedSelection.speed,
        genre: normalizedSelection.genre,
        nowMs,
      });
      if (destroyed || revision !== requestRevision) return snapshot();
      libraryRotation = rotateSoundtrackEntries(nextCatalogResult.catalog.entries, {
        nowMs,
        selection: normalizedSelection,
      });
      const rotatedCatalog = Object.freeze({
        ...nextCatalogResult.catalog,
        entries: libraryRotation.entries,
      });
      const queue = createSoundtrackQueue(rotatedCatalog);
      if (!queue.state.slots.current) throw new Error(queue.blockedReason || "catalog-empty");
      catalogResult = Object.freeze({ ...nextCatalogResult, catalog: rotatedCatalog });
      queueState = queue.state;
      mediaSnapshot = deck.syncQueue(queueState);
      transitionState = createSoundtrackTransitionState(queueState.slots.current.key, clockTime());
      effects.setImmediateTrackGains?.({ [queueState.slots.current.key]: 1 });
      status = "prepared";
      emit();
      return autoplay ? playPreparedCurrent(revision) : snapshot();
    } catch (caught) {
      if (destroyed || revision !== requestRevision) return snapshot();
      status = "error";
      error = String(caught?.message || caught || "catalog-unavailable").slice(0, 80);
      return emit();
    }
  };

  const select = async (key) => {
    if (destroyed || !catalogResult || !queueState) return snapshot();
    const revision = ++requestRevision;
    const queue = createSoundtrackQueue(catalogResult.catalog, {
      preferredKey: key,
      selectionCursor: queueState.selectionCursor,
      recentTrackLimit: queueState.recentTrackLimit,
      recentArtistLimit: queueState.recentArtistLimit,
    });
    if (!queue.activated || queue.activated.key !== key) {
      status = "error";
      error = "track-unavailable";
      return emit();
    }
    status = "prepared";
    error = null;
    emit();
    return transitionToQueue(queue.state, revision);
  };

  const move = async (direction) => {
    if (destroyed || !catalogResult || !queueState) return snapshot();
    const revision = ++requestRevision;
    const movement = moveSoundtrackQueue(queueState, catalogResult.catalog, direction);
    if (!movement.activated) {
      error = movement.blockedReason;
      status = "error";
      return emit();
    }
    status = "prepared";
    error = null;
    emit();
    return transitionToQueue(movement.state, revision);
  };

  const pause = () => {
    if (destroyed) return snapshot();
    clearTransitionTimers();
    const currentKey = queueState?.slots?.current?.key;
    effects.setImmediateTrackGains?.(currentKey ? { [currentKey]: 1 } : {});
    mediaSnapshot = deck.pauseExcept([]);
    if (currentKey) transitionState = createSoundtrackTransitionState(currentKey, clockTime());
    status = "paused";
    error = null;
    return emit();
  };

  const resume = async () => {
    if (destroyed || !queueState?.slots?.current) return snapshot();
    const revision = ++requestRevision;
    status = "prepared";
    emit();
    return playPreparedCurrent(revision);
  };

  const destroy = () => {
    if (destroyed) return snapshot();
    destroyed = true;
    requestRevision += 1;
    clearTransitionTimers();
    mediaSnapshot = deck.destroy();
    effects.destroy();
    queueState = null;
    catalogResult = null;
    libraryRotation = null;
    return emit();
  };

  return Object.freeze({
    load,
    select,
    move,
    pause,
    resume,
    setVehicleMaster(value) { effects.setVehicleMaster(value); return emit(); },
    setVehicleEffects(values) { effects.setVehicleMacros(values); return emit(); },
    setManualEffects(values) { effects.setManualEffects(values); return emit(); },
    getLevel: () => effects.getLevel?.() ?? 0,
    destroy,
    getSnapshot: snapshot,
  });
}
