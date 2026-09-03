export const MEDIA_SESSION_TRANSPORT_ACTIONS = Object.freeze([
  "play",
  "pause",
  "previoustrack",
  "nexttrack",
]);

/**
 * Serialise navigation commands while allowing a newer PLAY/PAUSE intent to
 * invalidate navigation that has not started yet.
 */
export function createMediaTransportIntentQueue() {
  let tail = Promise.resolve();
  let generation = 0;

  return Object.freeze({
    invalidate() {
      generation += 1;
      return generation;
    },
    async run(task, { onCancelled = null } = {}) {
      const queuedGeneration = generation;
      const waitForTurn = tail.catch(() => {});
      let releaseTurn;
      const gate = new Promise((resolve) => { releaseTurn = resolve; });
      tail = waitForTurn.then(() => gate);
      await waitForTurn;
      try {
        if (queuedGeneration !== generation) {
          return typeof onCancelled === "function"
            ? onCancelled({ queuedGeneration, currentGeneration: generation })
            : null;
        }
        return await task();
      } finally {
        releaseTurn();
      }
    },
  });
}

const ARTWORK_MIME_TYPES = Object.freeze({
  ".avif": "image/avif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
});

const KNOWN_SQUARE_ARTWORK_PATHS = Object.freeze([
  /^\/artwork\/play-road\/[^/]+\.(?:png)$/i,
  /^\/artwork\/illobo\/[^/]+\.(?:webp)$/i,
]);

const finiteClockValue = (clock) => {
  try {
    const rawValue = clock?.();
    if (rawValue == null) return null;
    const value = Number(rawValue);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

const artworkMimeType = (pathname) => {
  const normalized = String(pathname || "").toLowerCase();
  const extension = Object.keys(ARTWORK_MIME_TYPES)
    .find((candidate) => normalized.endsWith(candidate));
  return extension ? ARTWORK_MIME_TYPES[extension] : null;
};

/**
 * Build MediaMetadata artwork without inventing response MIME types or image
 * dimensions. Cross-origin catalogue artwork is intentionally advertised by
 * URL alone; only project-owned artwork with a verified file contract carries
 * type and size hints.
 */
export function mediaSessionArtwork(url, {
  baseUrl = globalThis.location?.href,
} = {}) {
  if (typeof url !== "string" || !url.trim() || !baseUrl) return null;
  try {
    const base = new URL(baseUrl);
    const resolved = new URL(url, base);
    const descriptor = { src: resolved.href };
    const knownLocalArtwork = resolved.origin === base.origin
      && KNOWN_SQUARE_ARTWORK_PATHS.some((pattern) => pattern.test(resolved.pathname));
    if (!knownLocalArtwork) return Object.freeze(descriptor);
    const type = artworkMimeType(resolved.pathname);
    if (type) descriptor.type = type;
    descriptor.sizes = "512x512";
    return Object.freeze(descriptor);
  } catch {
    return null;
  }
}

/** Return a standards-valid position payload for finite Soundtrack media. */
export function soundtrackMediaPositionState(snapshot) {
  const current = snapshot?.media?.roles?.current;
  if (!snapshot?.current?.key || current?.key !== snapshot.current.key) return null;
  const duration = current?.durationSeconds;
  const rawPosition = current?.currentTimeSeconds;
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(rawPosition)) return null;
  const playbackRate = Number(snapshot?.playbackRate);
  return Object.freeze({
    duration,
    playbackRate: Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1,
    position: Math.min(duration, Math.max(0, rawPosition)),
  });
}

/** Match the visible transport state to actually audible Soundtrack decks. */
export function soundtrackMediaIsPlaying(snapshot, { muted = false } = {}) {
  return !muted && Boolean(snapshot?.media?.audibleKeys?.length);
}

/** Clear stale native presentation while keeping each browser API best-effort. */
export function clearMediaSessionPresentation(mediaSession) {
  const result = {
    metadataCleared: false,
    playbackStateCleared: false,
    positionStateCleared: false,
  };
  if (!mediaSession) return Object.freeze(result);
  try {
    mediaSession.metadata = null;
    result.metadataCleared = true;
  } catch {
    // Unsupported presentation properties must not break application cleanup.
  }
  try {
    mediaSession.playbackState = "none";
    result.playbackStateCleared = true;
  } catch {
    // Some older browser surfaces expose Media Session as read-only.
  }
  if (typeof mediaSession.setPositionState === "function") {
    try {
      mediaSession.setPositionState();
      result.positionStateCleared = true;
    } catch {
      // Position is optional and browser-specific.
    }
  }
  return Object.freeze(result);
}

/** Derive Play the Road transport evidence only from observed runtime state. */
export function playRoadMediaObservation({
  selectionResult,
  previousScoreId = null,
  audioContextState = "unavailable",
  paused = false,
  muted = false,
} = {}) {
  const activeScoreId = selectionResult?.activeScoreId ?? previousScoreId;
  const audible = audioContextState === "running" && !paused && !muted;
  return Object.freeze({
    playbackConfirmed: Boolean(selectionResult?.ok && audible),
    currentChanged: Boolean(selectionResult?.ok && activeScoreId !== previousScoreId),
    after: Object.freeze({
      status: audible ? "playing" : "paused",
      currentScore: activeScoreId,
      audioContextState,
      muted: Boolean(muted),
    }),
  });
}

/**
 * Install stable Media Session transport handlers. The invocation observer is
 * called synchronously before any application handler can enqueue or await
 * work, preserving the native command order in the flight recorder.
 */
export function installMediaSessionTransport({
  mediaSession,
  handlers = {},
  onInvocation = null,
  onHandlerError = null,
  clock = () => globalThis.performance?.now?.() ?? Date.now(),
  invocationPrefix = "media-session",
} = {}) {
  const actionRegistration = {};
  const registeredActions = [];
  let invocationSequence = 0;
  let active = true;

  if (!mediaSession || typeof mediaSession.setActionHandler !== "function") {
    return Object.freeze({
      actionRegistration: Object.freeze(actionRegistration),
      cleanup() { active = false; },
    });
  }

  const reportHandlerError = (action, invocation, error) => {
    try { onHandlerError?.(action, invocation, error); } catch { /* telemetry is best effort */ }
  };

  for (const action of MEDIA_SESSION_TRANSPORT_ACTIONS) {
    const applicationHandler = handlers[action];
    if (typeof applicationHandler !== "function") continue;
    const handler = (details) => {
      if (!active) return;
      const sequence = ++invocationSequence;
      const invocation = Object.freeze({
        id: `${invocationPrefix}-${sequence}`,
        sequence,
        action,
        invokedAtMs: finiteClockValue(clock),
      });
      try { onInvocation?.(invocation); } catch { /* telemetry cannot block transport */ }
      try {
        Promise.resolve(applicationHandler(invocation, details))
          .catch((error) => reportHandlerError(action, invocation, error));
      } catch (error) {
        reportHandlerError(action, invocation, error);
      }
    };
    try {
      mediaSession.setActionHandler(action, handler);
      registeredActions.push(action);
      actionRegistration[action] = Object.freeze({ registered: true, error: null });
    } catch (error) {
      actionRegistration[action] = Object.freeze({
        registered: false,
        error: String(error?.name || error?.message || error || "unsupported").slice(0, 120),
      });
    }
  }

  return Object.freeze({
    actionRegistration: Object.freeze(actionRegistration),
    cleanup() {
      if (!active) return;
      active = false;
      for (const action of registeredActions) {
        try { mediaSession.setActionHandler(action, null); } catch { /* unsupported cleanup */ }
      }
    },
  });
}
