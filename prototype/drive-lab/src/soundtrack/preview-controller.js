import { fetchSoundtrackCatalog } from "./catalog-client.js";
import { createSoundtrackMediaDeckController } from "./media-deck-controller.js";
import { createSoundtrackQueue, moveSoundtrackQueue } from "./rotation-model.js";

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
}) : null;

export function createSoundtrackPreviewController({
  fetchImpl = globalThis.fetch,
  mediaFactory,
  crossOrigin = "anonymous",
  effectsFactory = () => ({
    attachMedia: () => {},
    detachMedia: () => {},
    resume: async () => {},
    setVehicleMaster: () => {},
    setVehicleMacros: () => {},
    setManualEffects: () => {},
    getSnapshot: () => Object.freeze({ status: "bypassed" }),
    getLevel: () => 0,
    destroy: () => {},
  }),
  onState = null,
} = {}) {
  let destroyed = false;
  let requestRevision = 0;
  let catalogResult = null;
  let queueState = null;
  let status = "idle";
  let error = null;
  let mediaSnapshot = null;
  const effects = effectsFactory();

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

  const load = async () => {
    if (destroyed) return snapshot();
    const revision = ++requestRevision;
    status = "loading";
    error = null;
    emit();
    try {
      const nextCatalogResult = await fetchSoundtrackCatalog({ fetchImpl });
      if (destroyed || revision !== requestRevision) return snapshot();
      const queue = createSoundtrackQueue(nextCatalogResult.catalog);
      if (!queue.state.slots.current) throw new Error(queue.blockedReason || "catalog-empty");
      catalogResult = nextCatalogResult;
      queueState = queue.state;
      mediaSnapshot = deck.syncQueue(queueState);
      status = "prepared";
      return emit();
    } catch (caught) {
      if (destroyed || revision !== requestRevision) return snapshot();
      status = "error";
      error = String(caught?.message || caught || "catalog-unavailable").slice(0, 80);
      return emit();
    }
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
    deck.pauseCurrent();
    queueState = movement.state;
    mediaSnapshot = deck.syncQueue(queueState);
    status = "prepared";
    error = null;
    emit();
    return playPreparedCurrent(revision);
  };

  const pause = () => {
    if (destroyed) return snapshot();
    mediaSnapshot = deck.pauseCurrent();
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
    mediaSnapshot = deck.destroy();
    effects.destroy();
    queueState = null;
    catalogResult = null;
    return emit();
  };

  return Object.freeze({
    load,
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
