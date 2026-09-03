import assert from "node:assert/strict";
import test from "node:test";
import {
  clearMediaSessionPresentation,
  createMediaTransportIntentQueue,
  installMediaSessionTransport,
  mediaSessionArtwork,
  playRoadMediaObservation,
  soundtrackMediaIsPlaying,
  soundtrackMediaPositionState,
} from "../src/media-session.js";

test("a newer playback intent cancels queued skips without blocking later navigation", async () => {
  const queue = createMediaTransportIntentQueue();
  const events = [];
  let markStarted;
  let releaseFirst;
  const firstStarted = new Promise((resolve) => { markStarted = resolve; });
  const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
  const first = queue.run(async () => {
    events.push("first:start");
    markStarted();
    await firstGate;
    events.push("first:end");
    return "first";
  });
  await firstStarted;
  const second = queue.run(
    async () => {
      events.push("second:ran");
      return "second";
    },
    { onCancelled: () => "cancelled" },
  );

  queue.invalidate();
  releaseFirst();
  assert.deepEqual(await Promise.all([first, second]), ["first", "cancelled"]);
  assert.deepEqual(events, ["first:start", "first:end"]);

  const third = await queue.run(async () => {
    events.push("third:ran");
    return "third";
  });
  assert.equal(third, "third");
  assert.deepEqual(events, ["first:start", "first:end", "third:ran"]);
});

class FakeMediaSession {
  constructor() {
    this.handlers = new Map();
    this.registrations = [];
  }

  setActionHandler(action, handler) {
    this.registrations.push({ action, handler });
    if (handler) this.handlers.set(action, handler);
    else this.handlers.delete(action);
  }

  invoke(action, details = {}) {
    this.handlers.get(action)?.(details);
  }
}

test("native play, pause, previous, and next are observed synchronously before dispatch and clean up", () => {
  const mediaSession = new FakeMediaSession();
  const trace = [];
  let clock = 100;
  const handlers = Object.fromEntries([
    "play",
    "pause",
    "previoustrack",
    "nexttrack",
  ].map((action) => [action, (invocation) => {
    trace.push(`dispatch:${action}:${invocation.id}`);
  }]));
  const runtime = installMediaSessionTransport({
    mediaSession,
    handlers,
    clock: () => ++clock,
    onInvocation: (invocation) => {
      trace.push(`invoke:${invocation.action}:${invocation.id}:${invocation.invokedAtMs}`);
    },
  });

  for (const action of ["play", "pause", "previoustrack", "nexttrack"]) {
    mediaSession.invoke(action);
  }

  assert.deepEqual(trace, [
    "invoke:play:media-session-1:101",
    "dispatch:play:media-session-1",
    "invoke:pause:media-session-2:102",
    "dispatch:pause:media-session-2",
    "invoke:previoustrack:media-session-3:103",
    "dispatch:previoustrack:media-session-3",
    "invoke:nexttrack:media-session-4:104",
    "dispatch:nexttrack:media-session-4",
  ]);
  assert.deepEqual(
    Object.fromEntries(Object.entries(runtime.actionRegistration)
      .map(([action, result]) => [action, result.registered])),
    { play: true, pause: true, previoustrack: true, nexttrack: true },
  );

  runtime.cleanup();
  runtime.cleanup();
  assert.equal(mediaSession.handlers.size, 0);
  assert.deepEqual(
    mediaSession.registrations.filter(({ handler }) => handler === null).map(({ action }) => action),
    ["play", "pause", "previoustrack", "nexttrack"],
  );
});

test("remote catalogue artwork carries only a source while verified local artwork carries truthful hints", () => {
  const baseUrl = "https://sedicivalvole.app/?build=test";
  assert.deepEqual(
    mediaSessionArtwork("https://usercontent.jamendo.com?type=album&id=123&width=300", { baseUrl }),
    { src: "https://usercontent.jamendo.com/?type=album&id=123&width=300" },
  );
  assert.deepEqual(
    mediaSessionArtwork("https://cdn.example/cover.jpg", { baseUrl }),
    { src: "https://cdn.example/cover.jpg" },
  );
  assert.deepEqual(
    mediaSessionArtwork("/artwork/play-road/junction.png", { baseUrl }),
    {
      src: "https://sedicivalvole.app/artwork/play-road/junction.png",
      type: "image/png",
      sizes: "512x512",
    },
  );
  assert.deepEqual(
    mediaSessionArtwork("/artwork/illobo/space-train.webp", { baseUrl }),
    {
      src: "https://sedicivalvole.app/artwork/illobo/space-train.webp",
      type: "image/webp",
      sizes: "512x512",
    },
  );
});

test("Soundtrack position state is finite, clamped, and absent without a usable duration", () => {
  assert.deepEqual(soundtrackMediaPositionState({
    playbackRate: 1,
    current: { key: "track-a" },
    media: { roles: { current: { key: "track-a", currentTimeSeconds: 91.25, durationSeconds: 180 } } },
  }), { duration: 180, playbackRate: 1, position: 91.25 });
  assert.deepEqual(soundtrackMediaPositionState({
    playbackRate: 0,
    current: { key: "track-a" },
    media: { roles: { current: { key: "track-a", currentTimeSeconds: 205, durationSeconds: 180 } } },
  }), { duration: 180, playbackRate: 1, position: 180 });
  assert.equal(soundtrackMediaPositionState({
    current: { key: "track-a" },
    media: { roles: { current: { key: "track-a", currentTimeSeconds: 12, durationSeconds: Number.POSITIVE_INFINITY } } },
  }), null);
  assert.equal(soundtrackMediaPositionState({
    current: { key: "track-a" },
    media: { roles: { current: { key: "track-a", currentTimeSeconds: null, durationSeconds: 180 } } },
  }), null);
  assert.equal(soundtrackMediaPositionState({
    current: { key: "track-a" },
    media: { roles: { current: { key: "track-b", currentTimeSeconds: 12, durationSeconds: 180 } } },
  }), null);
  assert.equal(soundtrackMediaPositionState(null), null);
});

test("a buffering Soundtrack with an audible outgoing deck keeps the visible pause intent", () => {
  const buffering = {
    status: "buffering",
    media: { audibleKeys: ["jamendo:outgoing"] },
  };
  assert.equal(soundtrackMediaIsPlaying(buffering), true);
  assert.equal(soundtrackMediaIsPlaying(buffering, { muted: true }), false);
  assert.equal(soundtrackMediaIsPlaying({ status: "playing", media: { audibleKeys: [] } }), false);
});

test("native metadata, playback and position are cleared when no current track remains", () => {
  const positionCalls = [];
  const mediaSession = {
    metadata: { title: "Stale track" },
    playbackState: "playing",
    setPositionState(value) { positionCalls.push(value); },
  };

  assert.deepEqual(clearMediaSessionPresentation(mediaSession), {
    metadataCleared: true,
    playbackStateCleared: true,
    positionStateCleared: true,
  });
  assert.equal(mediaSession.metadata, null);
  assert.equal(mediaSession.playbackState, "none");
  assert.deepEqual(positionCalls, [undefined]);
});

test("Play the Road navigation reports only observed audible playback", () => {
  const selected = { ok: true, activeScoreId: "junction" };
  assert.deepEqual(playRoadMediaObservation({
    selectionResult: selected,
    previousScoreId: "fracture",
    audioContextState: "running",
  }), {
    playbackConfirmed: true,
    currentChanged: true,
    after: {
      status: "playing",
      currentScore: "junction",
      audioContextState: "running",
      muted: false,
    },
  });
  assert.equal(playRoadMediaObservation({
    selectionResult: selected,
    previousScoreId: "fracture",
    audioContextState: "suspended",
    paused: true,
  }).playbackConfirmed, false);
  assert.deepEqual(playRoadMediaObservation({
    selectionResult: { ok: false, activeScoreId: null },
    previousScoreId: "fracture",
    audioContextState: "running",
  }), {
    playbackConfirmed: false,
    currentChanged: false,
    after: {
      status: "playing",
      currentScore: "fracture",
      audioContextState: "running",
      muted: false,
    },
  });
});
