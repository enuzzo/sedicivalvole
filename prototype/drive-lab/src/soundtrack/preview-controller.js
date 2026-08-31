import { fetchSoundtrackCatalog } from "./catalog-client.js";
import { createSoundtrackMediaDeckController } from "./media-deck-controller.js";
import { createSoundtrackQueue, moveSoundtrackQueue } from "./rotation-model.js";
import {
  normalizeSoundtrackSelection,
  rotateSoundtrackEntries,
  startSoundtrackEntriesAtRandom,
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
  random = Math.random,
  setTimer = globalThis.setTimeout?.bind(globalThis),
  clearTimer = globalThis.clearTimeout?.bind(globalThis),
} = {}) {
  let destroyed = false;
  let requestRevision = 0;
  let catalogResult = null;
  let queueState = null;
  let libraryRotation = null;
  let pendingLibraryRotation = null;
  let status = "idle";
  let error = null;
  let mediaSnapshot = null;
  let transitionState = null;
  const transitionTimers = new Set();
  const effects = effectsFactory();

  const catalogCanServeSelection = (selection, nowMs) => {
    const currentSelection = catalogResult?.selection;
    const currentSpeeds = Array.isArray(currentSelection?.speed) ? currentSelection.speed : [];
    const nextSpeeds = Array.isArray(selection?.speed) ? selection.speed : [];
    return catalogResult?.catalog?.status === "fresh"
      && Number.isFinite(catalogResult.catalog.expiresAtMs)
      && nowMs < catalogResult.catalog.expiresAtMs
      && (currentSelection?.kind || "library") === selection.kind
      && (currentSelection?.id || "all") === selection.id
      && (currentSelection?.genre || null) === (selection?.genre || null)
      && currentSpeeds.length === nextSpeeds.length
      && currentSpeeds.every((value, index) => value === nextSpeeds[index]);
  };

  const rotateLibrary = (entries, selection, nowMs) => {
    const rotated = rotateSoundtrackEntries(entries, { nowMs, selection });
    if (selection.kind !== "featured") return rotated;
    return Object.freeze({
      ...rotated,
      entries: startSoundtrackEntriesAtRandom(rotated.entries, {
        random,
        avoidKey: queueState?.slots?.current?.key,
        avoidKeys: mediaSnapshot?.audibleKeys,
      }),
    });
  };

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

  const snapshot = () => {
    const presentedLibrary = pendingLibraryRotation ?? libraryRotation;
    return Object.freeze({
      schema: SOUNDTRACK_PREVIEW_SCHEMA,
      status: destroyed ? "destroyed" : status,
      error,
      current: safeCredit(queueState?.slots?.current),
      hasPrevious: Boolean(queueState?.slots?.previous),
      hasNext: Boolean(queueState?.slots?.next),
      receivedEntries: catalogResult?.receivedEntries ?? 0,
      admittedEntries: catalogResult?.admittedEntries ?? 0,
      rejectedEntries: catalogResult?.rejectedEntries ?? 0,
      library: presentedLibrary ? Object.freeze({
        schema: presentedLibrary.schema,
        selection: presentedLibrary.selection,
        rotationWindow: presentedLibrary.window,
        entries: Object.freeze(presentedLibrary.entries.map(safeCredit).filter(Boolean)),
        refreshCopy: presentedLibrary.selection.kind === "featured"
          ? "Random start · fresh mix every 30 min"
          : "Fresh mix · changes every 30 min",
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
  };

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
    onEnded(entry) {
      if (!destroyed) void advanceAfterEnded(entry);
    },
    onError(detail) {
      const currentKey = queueState?.slots?.current?.key;
      const audibleKeys = new Set(mediaSnapshot?.audibleKeys ?? []);
      if (detail?.key && detail.key !== currentKey && !audibleKeys.has(detail.key)) {
        emit();
        return;
      }
      error = [
        detail?.code ?? "media-error",
        Number.isFinite(detail?.mediaErrorCode) ? `code-${detail.mediaErrorCode}` : null,
        detail?.reason,
      ].filter(Boolean).join(":");
      status = "error";
      emit();
    },
  });

  async function advanceAfterEnded(endedEntry) {
    if (destroyed || !catalogResult || !queueState) return snapshot();
    if (endedEntry?.key !== queueState.slots.current?.key) return snapshot();
    const revision = ++requestRevision;
    clearTransitionTimers();
    const movement = moveSoundtrackQueue(queueState, catalogResult.catalog, "next");
    if (!movement.activated) {
      status = "error";
      error = movement.blockedReason;
      return emit();
    }

    queueState = movement.state;
    const targetKey = queueState.slots.current.key;
    transitionState = createSoundtrackTransitionState(targetKey, clockTime());
    mediaSnapshot = deck.syncQueue(queueState, { restartKeys: [targetKey] });
    effects.setImmediateTrackGains?.({ [targetKey]: 1 });
    status = "prepared";
    error = null;
    emit();

    let started;
    try {
      [started] = await Promise.all([deck.playCurrent(), effects.resume()]);
    } catch (caught) {
      if (destroyed || revision !== requestRevision) return snapshot();
      mediaSnapshot = deck.pauseExcept([]);
      status = "error";
      error = String(caught?.message || caught || "audio-resume-failed").slice(0, 80);
      return emit();
    }
    if (destroyed || revision !== requestRevision) return snapshot();
    if (!started.ok) {
      status = "error";
      error = error || started.reason;
      return emit();
    }
    status = "playing";
    error = null;
    return emit();
  }

  const playPreparedCurrent = async (revision) => {
    const currentKey = queueState?.slots?.current?.key;
    if (currentKey) {
      transitionState = createSoundtrackTransitionState(currentKey, clockTime());
      effects.setImmediateTrackGains?.({ [currentKey]: 1 });
    }
    let result;
    try {
      [result] = await Promise.all([deck.playCurrent(), effects.resume()]);
    } catch (caught) {
      if (destroyed || revision !== requestRevision) return snapshot();
      mediaSnapshot = deck.pauseExcept([]);
      status = "error";
      error = String(caught?.message || caught || "audio-resume-failed").slice(0, 80);
      return emit();
    }
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

  const transitionToQueue = async (nextQueueState, revision, { restartTarget = false } = {}) => {
    clearTransitionTimers();
    if (destroyed || revision !== requestRevision) return snapshot();
    const previousQueueState = queueState;
    const restorePreviousQueue = () => {
      const previousKey = previousQueueState?.slots?.current?.key;
      if (!previousKey) return;
      transitionState = createSoundtrackTransitionState(previousKey, clockTime());
      effects.setImmediateTrackGains?.({ [previousKey]: 1 });
      mediaSnapshot = deck.pauseExcept([previousKey]);
      mediaSnapshot = deck.syncQueue(previousQueueState, { audibleKeys: [previousKey] });
    };
    const targetKey = nextQueueState?.slots?.current?.key;
    const prepared = scheduleWithTrackLimit(targetKey, clockTime());
    if (prepared.blockedReason) {
      status = "error";
      error = prepared.blockedReason;
      return emit();
    }
    const audibleKeys = new Set(mediaSnapshot?.audibleKeys ?? []);
    const retainedKeys = [...new Set([
      ...Object.entries(prepared.state.fromGains)
        .filter(([key, gain]) => gain > 0.000001 && audibleKeys.has(key))
        .map(([key]) => key),
      targetKey,
    ])];
    mediaSnapshot = deck.syncQueue(nextQueueState, {
      retainKeys: retainedKeys,
      audibleKeys: retainedKeys,
      restartKeys: restartTarget ? [targetKey] : [],
    });
    effects.setImmediateTrackGains?.(prepared.state.fromGains);
    // Start every newly audible media element while the transport click still
    // owns transient user activation. Awaiting AudioContext/worklet readiness
    // first can make Chromium reject the incoming deck as autoplay.
    const playRequest = deck.playKeys(retainedKeys);
    const resumeRequest = effects.resume();
    let started;
    try {
      [started] = await Promise.all([playRequest, resumeRequest]);
    } catch (caught) {
      if (destroyed || revision !== requestRevision) return snapshot();
      restorePreviousQueue();
      status = "error";
      error = String(caught?.message || caught || "audio-resume-failed").slice(0, 80);
      return emit();
    }
    if (destroyed || revision !== requestRevision) return snapshot();
    if (!started.ok) {
      restorePreviousQueue();
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
      restorePreviousQueue();
      status = "error";
      error = applied.reason || "transition-gain-failed";
      return emit();
    }
    queueState = nextQueueState;
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
    const audibleBeforeLoad = queueState?.slots?.current?.key
      && mediaSnapshot?.audibleKeys?.includes(queueState.slots.current.key);
    const revision = ++requestRevision;
    const normalizedSelection = normalizeSoundtrackSelection(selection);
    pendingLibraryRotation = rotateSoundtrackEntries([], { selection: normalizedSelection, nowMs });
    status = "loading";
    error = null;
    emit();
    try {
      if (catalogCanServeSelection(normalizedSelection, nowMs)) {
        libraryRotation = rotateLibrary(catalogResult.catalog.entries, normalizedSelection, nowMs);
        pendingLibraryRotation = null;
        const rotatedCatalog = Object.freeze({
          ...catalogResult.catalog,
          entries: libraryRotation.entries,
        });
        const queue = createSoundtrackQueue(rotatedCatalog);
        if (!queue.state.slots.current) throw new Error(queue.blockedReason || "catalog-empty");
        catalogResult = Object.freeze({ ...catalogResult, catalog: rotatedCatalog });
        if (autoplay) return transitionToQueue(queue.state, revision, { restartTarget: true });
        queueState = queue.state;
        mediaSnapshot = deck.syncQueue(queueState);
        transitionState = createSoundtrackTransitionState(queueState.slots.current.key, clockTime());
        effects.setImmediateTrackGains?.({ [queueState.slots.current.key]: 1 });
        status = "prepared";
        return emit();
      }
      const nextCatalogResult = await fetchSoundtrackCatalog({
        fetchImpl,
        limit: 50,
        speed: normalizedSelection.speed,
        genre: normalizedSelection.genre,
        selection: normalizedSelection,
        nowMs,
      });
      if (destroyed || revision !== requestRevision) return snapshot();
      libraryRotation = rotateLibrary(nextCatalogResult.catalog.entries, normalizedSelection, nowMs);
      pendingLibraryRotation = null;
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
      if (!autoplay) return snapshot();
      if (normalizedSelection.kind !== "featured") return playPreparedCurrent(revision);
      mediaSnapshot = deck.syncQueue(queueState, { restartKeys: [queueState.slots.current.key] });
      return playPreparedCurrent(revision);
    } catch (caught) {
      if (destroyed || revision !== requestRevision) return snapshot();
      pendingLibraryRotation = null;
      status = audibleBeforeLoad ? "playing" : "error";
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
    return transitionToQueue(queue.state, revision, { restartTarget: true });
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
    return transitionToQueue(movement.state, revision, { restartTarget: true });
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
