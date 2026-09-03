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
import { withReadinessTimeout } from "../promise-timeout.js";

export const SOUNDTRACK_PREVIEW_SCHEMA = "sedicivalvole.soundtrack-preview.v1";
export const SOUNDTRACK_TRANSPORT_START_TIMEOUT_MS = 10000;

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
    getAudioContext: () => null,
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
  transportStartTimeoutMs = SOUNDTRACK_TRANSPORT_START_TIMEOUT_MS,
  onTelemetry = null,
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
  let pendingTrack = null;
  let preparedCurrentPromise = null;
  const transitionTimers = new Set();
  const effects = effectsFactory();

  const transportError = (caught) => caught?.code === "READINESS_TIMEOUT"
    ? "transport-start-timeout"
    : String(caught?.message || caught || "audio-resume-failed").slice(0, 80);

  const awaitTransportStart = (promise, { onTimeout } = {}) => withReadinessTimeout(promise, {
    label: "Soundtrack transport start",
    timeoutMs: transportStartTimeoutMs,
    schedule: setTimer,
    cancel: clearTimer,
    onTimeout,
  });

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
      previous: safeCredit(queueState?.slots?.previous),
      current: safeCredit(queueState?.slots?.current),
      next: safeCredit(queueState?.slots?.next),
      pending: pendingTrack,
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

  const emitTelemetry = (type, detail = {}) => {
    if (typeof onTelemetry !== "function") return;
    try {
      onTelemetry(type, Object.freeze(detail));
    } catch {
      // Debug observers can never affect playback ownership.
    }
  };

  const deck = createSoundtrackMediaDeckController({
    mediaFactory,
    crossOrigin,
    onMediaCreate: (key, media) => effects.attachMedia(key, media),
    onMediaDispose: (key) => effects.detachMedia(key),
    onSnapshot(nextSnapshot, reason) {
      mediaSnapshot = nextSnapshot;
      emitTelemetry("soundtrack.media.lifecycle", {
        reason,
        status: nextSnapshot.status,
        currentAudibleKey: nextSnapshot.currentAudibleKey,
        audibleKeys: nextSnapshot.audibleKeys,
        preparedMediaElements: nextSnapshot.preparedMediaElements,
        playableMediaElements: nextSnapshot.playableMediaElements,
        controllerError: nextSnapshot.controllerError,
        roles: nextSnapshot.roles,
      });
      emit();
    },
    onEnded(entry) {
      emitTelemetry("soundtrack.media.ended", { key: entry?.key ?? null });
      if (!destroyed) void advanceAfterEnded(entry);
    },
    onError(detail) {
      emitTelemetry("soundtrack.media.error", detail);
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

  const staleTransportSnapshot = (revision) => {
    // A pending play() may resolve after PAUSE (notably while a weak-network
    // NEXT is buffering). Reassert silence only when pause is the newer owner;
    // a later play or track request must remain in control.
    if (!destroyed && revision !== requestRevision && status === "paused") {
      mediaSnapshot = deck.pauseExcept([]);
    }
    return snapshot();
  };

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
    pendingTrack = Object.freeze({ direction: "automatic", track: safeCredit(queueState.slots.current) });
    transitionState = createSoundtrackTransitionState(targetKey, clockTime());
    mediaSnapshot = deck.syncQueue(queueState, { restartKeys: [targetKey] });
    effects.setImmediateTrackGains?.({ [targetKey]: 0 });
    status = "buffering";
    error = null;
    emit();

    let started;
    const bufferWait = deck.waitForStableBuffer(targetKey);
    try {
      [started] = await awaitTransportStart(
        Promise.all([deck.playCurrent(), effects.resume(), bufferWait.promise]),
        {
          onTimeout: () => {
            bufferWait.cancel();
            deck.pauseExcept([]);
            deck.discardKeys([targetKey]);
            mediaSnapshot = deck.syncQueue(queueState);
          },
        },
      );
    } catch (caught) {
      if (destroyed || revision !== requestRevision) return staleTransportSnapshot(revision);
      mediaSnapshot = deck.pauseExcept([]);
      status = "error";
      error = transportError(caught);
      pendingTrack = null;
      return emit();
    }
    if (destroyed || revision !== requestRevision) return staleTransportSnapshot(revision);
    if (!started.ok) {
      status = "error";
      error = error || started.reason;
      pendingTrack = null;
      return emit();
    }
    mediaSnapshot = deck.rewindKeys([targetKey]);
    effects.setImmediateTrackGains?.({ [targetKey]: 1 });
    status = "playing";
    error = null;
    pendingTrack = null;
    return emit();
  }

  const runPreparedCurrent = async (revision, { restartCurrent = true } = {}) => {
    const currentKey = queueState?.slots?.current?.key;
    if (currentKey) {
      transitionState = createSoundtrackTransitionState(currentKey, clockTime());
      effects.setImmediateTrackGains?.({ [currentKey]: 0 });
      pendingTrack = Object.freeze({ direction: "start", track: safeCredit(queueState.slots.current) });
    }
    let result;
    const bufferWait = currentKey ? deck.waitForStableBuffer(currentKey) : null;
    status = "buffering";
    error = null;
    emit();
    try {
      [result] = await awaitTransportStart(
        Promise.all([deck.playCurrent(), effects.resume(), bufferWait?.promise ?? Promise.resolve()]),
        {
          onTimeout: () => {
            bufferWait?.cancel();
            deck.pauseExcept([]);
            deck.discardKeys(currentKey ? [currentKey] : []);
            if (queueState) mediaSnapshot = deck.syncQueue(queueState);
          },
        },
      );
    } catch (caught) {
      if (destroyed || revision !== requestRevision) return staleTransportSnapshot(revision);
      mediaSnapshot = deck.pauseExcept([]);
      status = "error";
      error = transportError(caught);
      pendingTrack = null;
      return emit();
    }
    if (destroyed || revision !== requestRevision) return staleTransportSnapshot(revision);
    if (!result.ok) {
      status = "error";
      error = error || result.reason;
    } else {
      mediaSnapshot = restartCurrent
        ? deck.rewindKeys(currentKey ? [currentKey] : [])
        : result.snapshot;
      effects.setImmediateTrackGains?.(currentKey ? { [currentKey]: 1 } : {});
      status = "playing";
      error = null;
    }
    pendingTrack = null;
    return emit();
  };

  const playPreparedCurrent = (revision, options) => {
    if (preparedCurrentPromise) return preparedCurrentPromise;
    const operation = runPreparedCurrent(revision, options);
    const shared = operation.finally(() => {
      if (preparedCurrentPromise === shared) preparedCurrentPromise = null;
    });
    preparedCurrentPromise = shared;
    return shared;
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
    if (destroyed || revision !== requestRevision) return staleTransportSnapshot(revision);
    const previousQueueState = queueState;
    const restorePreviousQueue = ({ discardTarget = false } = {}) => {
      const previousKey = previousQueueState?.slots?.current?.key;
      if (!previousKey) return;
      if (discardTarget && targetKey && targetKey !== previousKey) deck.discardKeys([targetKey]);
      transitionState = createSoundtrackTransitionState(previousKey, clockTime());
      effects.setImmediateTrackGains?.({ [previousKey]: 1 });
      mediaSnapshot = deck.pauseExcept([previousKey]);
      mediaSnapshot = deck.syncQueue(previousQueueState, { audibleKeys: [previousKey] });
      pendingTrack = null;
    };
    const targetKey = nextQueueState?.slots?.current?.key;
    pendingTrack = Object.freeze({
      direction: typeof restartTarget === "string" ? restartTarget : "change",
      track: safeCredit(nextQueueState?.slots?.current),
    });
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
    const targetWasAudible = audibleKeys.has(targetKey);
    const bufferWait = deck.waitForStableBuffer(targetKey);
    status = "buffering";
    error = null;
    emit();
    let started;
    try {
      [started] = await awaitTransportStart(
        Promise.all([playRequest, resumeRequest, bufferWait.promise]),
        {
          onTimeout: () => {
            bufferWait.cancel();
            restorePreviousQueue({ discardTarget: true });
          },
        },
      );
    } catch (caught) {
      if (destroyed || revision !== requestRevision) return staleTransportSnapshot(revision);
      restorePreviousQueue();
      status = "error";
      error = transportError(caught);
      pendingTrack = null;
      return emit();
    }
    if (destroyed || revision !== requestRevision) return staleTransportSnapshot(revision);
    if (!started.ok) {
      restorePreviousQueue();
      status = "error";
      error = error || started.reason;
      pendingTrack = null;
      return emit();
    }

    if (!targetWasAudible) mediaSnapshot = deck.rewindKeys([targetKey]);

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
    pendingTrack = null;
    emit();

    const transitionRevision = transitionState.revision;
    const durationMs = transitionState.durationSeconds * 1000;
    scheduleTransitionTimer(() => {
      if (!destroyed && revision === requestRevision && transitionState?.revision === transitionRevision) emit();
    }, durationMs * 0.52);
    scheduleTransitionTimer(() => {
      if (destroyed || revision !== requestRevision || transitionState?.revision !== transitionRevision) return;
      // AudioContext.currentTime can stop while Chromium suspends an audio
      // context (for example during a brief output-device interruption). The
      // wall-clock cleanup must still collapse the two-deck state once its
      // 450 ms deadline has elapsed, otherwise the UI and transport remain
      // permanently stuck on FADING even after audio resumes.
      const settledAt = Math.max(clockTime(), transitionState.endAt);
      const settled = settleSoundtrackTransition({
        state: transitionState,
        at: settledAt,
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
    preparedCurrentPromise = null;
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
      if (destroyed || revision !== requestRevision) return staleTransportSnapshot(revision);
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
      if (destroyed || revision !== requestRevision) return staleTransportSnapshot(revision);
      pendingLibraryRotation = null;
      status = audibleBeforeLoad ? "playing" : "error";
      error = String(caught?.message || caught || "catalog-unavailable").slice(0, 80);
      return emit();
    }
  };

  const select = async (key) => {
    if (destroyed || !catalogResult || !queueState) return snapshot();
    preparedCurrentPromise = null;
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
    pendingTrack = Object.freeze({ direction: "select", track: safeCredit(queue.state.slots.current) });
    emit();
    return transitionToQueue(queue.state, revision, { restartTarget: "select" });
  };

  const move = async (direction) => {
    if (destroyed || !catalogResult || !queueState) return snapshot();
    preparedCurrentPromise = null;
    const revision = ++requestRevision;
    const movement = moveSoundtrackQueue(queueState, catalogResult.catalog, direction);
    if (!movement.activated) {
      error = movement.blockedReason;
      status = "error";
      return emit();
    }
    status = "prepared";
    error = null;
    pendingTrack = Object.freeze({ direction, track: safeCredit(movement.state.slots.current) });
    emit();
    return transitionToQueue(movement.state, revision, { restartTarget: direction });
  };

  const pause = () => {
    if (destroyed) return snapshot();
    preparedCurrentPromise = null;
    requestRevision += 1;
    clearTransitionTimers();
    const currentKey = queueState?.slots?.current?.key;
    effects.setImmediateTrackGains?.(currentKey ? { [currentKey]: 1 } : {});
    mediaSnapshot = deck.pauseExcept([]);
    if (queueState) mediaSnapshot = deck.syncQueue(queueState);
    if (currentKey) transitionState = createSoundtrackTransitionState(currentKey, clockTime());
    status = "paused";
    error = null;
    pendingLibraryRotation = null;
    pendingTrack = null;
    return emit();
  };

  const resume = () => {
    if (destroyed || !queueState?.slots?.current) return Promise.resolve(snapshot());
    if (preparedCurrentPromise) return preparedCurrentPromise;
    const currentKey = queueState.slots.current.key;
    if (mediaSnapshot?.audibleKeys?.includes(currentKey)) return Promise.resolve(snapshot());
    const revision = ++requestRevision;
    return playPreparedCurrent(revision, { restartCurrent: false });
  };

  const destroy = () => {
    if (destroyed) return snapshot();
    preparedCurrentPromise = null;
    destroyed = true;
    requestRevision += 1;
    clearTransitionTimers();
    mediaSnapshot = deck.destroy();
    effects.destroy();
    queueState = null;
    catalogResult = null;
    libraryRotation = null;
    pendingTrack = null;
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
    getAudioContext: () => effects.getAudioContext?.() ?? null,
    getLevel: () => effects.getLevel?.() ?? 0,
    destroy,
    getSnapshot: snapshot,
  });
}
