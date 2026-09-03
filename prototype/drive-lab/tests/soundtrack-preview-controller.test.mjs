import assert from "node:assert/strict";
import test from "node:test";
import {
  ILLOBO_CATALOG_SCHEMA,
  SOUNDTRACK_CATALOG_API_SCHEMA,
} from "../src/soundtrack/catalog-client.js";
import {
  createSoundtrackPreviewController,
  SOUNDTRACK_TRANSPORT_START_TIMEOUT_MS,
} from "../src/soundtrack/preview-controller.js";

const track = (id) => ({
  id: String(id),
  name: `Track ${id}`,
  artist_id: `artist-${id}`,
  artist_name: `Artist ${id}`,
  album_name: `Album ${id}`,
  license_ccurl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  audio: `https://prod-1.storage.jamendo.com/?trackid=${id}&format=mp32`,
  shareurl: `https://www.jamendo.com/track/${id}`,
  image: `https://usercontent.jamendo.com?type=album&id=${id}&width=300`,
  musicinfo: { tags: { genres: ["electronic"] } },
});

class FakeMedia {
  constructor() {
    this.listeners = new Map();
    this.paused = true;
    this.ended = false;
    this.readyState = 4;
    this.networkState = 1;
    this.currentTime = 0;
    this.playPositions = [];
    this.duration = 180;
    this.buffered = { length: 1, start: () => 0, end: () => 30 };
  }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  removeEventListener(name) { this.listeners.delete(name); }
  emit(name) { this.listeners.get(name)?.(); }
  removeAttribute(name) { if (name === "src") this.src = ""; }
  load() {}
  pause() { this.paused = true; }
  async play() {
    this.playPositions.push(this.currentTime);
    if (this.rejectPlay) throw Object.assign(new Error("blocked"), { name: "NotAllowedError" });
    if (this.pendingPlay) await this.pendingPlay;
    this.paused = false;
  }
}

const catalogFetch = async () => ({
  ok: true,
  json: async () => ({
    schema: SOUNDTRACK_CATALOG_API_SCHEMA,
    fetchedAt: "2026-08-31T00:00:00.000Z",
    tracks: [track(1), track(2), track(3), track(4)],
  }),
});

const sourceAwareCatalogFetch = async (url) => {
  if (new URL(url).pathname === "/audio/illobo/catalog.json") {
    return {
      ok: true,
      json: async () => ({
        schema: ILLOBO_CATALOG_SCHEMA,
        generatedAt: "2026-08-30T16:43:00Z",
        tracks: [
          { id: "floating-stars", title: "Floating Stars", filename: "floating-stars.mp3" },
          { id: "this-point", title: "This Point", filename: "this-point.mp3" },
          { id: "space-train", title: "Space Train", filename: "space-train.mp3" },
          { id: "tropico", title: "Tropico", filename: "tropico.mp3" },
        ],
      }),
    };
  }
  return catalogFetch();
};

test("the preview loads and prepares three media roles before explicit playback", async () => {
  const states = [];
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new FakeMedia(),
    onState: (state) => states.push(state),
  });
  const loaded = await controller.load({ nowMs: 0 });

  assert.equal(loaded.status, "prepared");
  assert.ok(["jamendo:1", "jamendo:2", "jamendo:3", "jamendo:4"].includes(loaded.current.key));
  assert.equal(loaded.library.entries.length, 4);
  assert.equal(loaded.library.refreshCopy, "Fresh mix · changes every 30 min");
  assert.equal(loaded.media.preparedMediaElements, 3);
  assert.equal(loaded.media.currentAudibleKey, null);
  assert.equal(loaded.playbackRate, 1);
  assert.equal(loaded.drivingCanChangeTrack, false);
  assert.equal(loaded.drivingCanRetimeRecording, false);
  assert.equal(loaded.persistentAudioStorage, false);
  assert.ok(states.some((state) => state.status === "loading"));
  assert.equal((await controller.resume()).status, "playing");
  assert.equal(controller.getSnapshot().media.currentAudibleKey, loaded.current.key);
});

test("pause and native play resume from the observed position without restarting", async () => {
  const mediaByKey = new Map();
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      mediaByKey.set(entry.key, media);
      return media;
    },
  });
  const playing = await controller.load({ autoplay: true, nowMs: 0 });
  const currentMedia = mediaByKey.get(playing.current.key);
  currentMedia.currentTime = 42;
  currentMedia.buffered = { length: 1, start: () => 0, end: () => 72 };

  controller.pause();
  const resumed = await controller.resume();
  assert.equal(resumed.status, "playing");
  assert.equal(currentMedia.currentTime, 42);
  assert.equal(currentMedia.playPositions.at(-1), 42);

  const playRequestCount = currentMedia.playPositions.length;
  const duplicatePlay = await controller.resume();
  assert.equal(duplicatePlay.status, "playing");
  assert.equal(currentMedia.currentTime, 42);
  assert.equal(currentMedia.playPositions.length, playRequestCount);
});

test("a slow explicit resume is marked buffering so automatic recovery cannot duplicate it", async () => {
  const mediaByKey = new Map();
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      mediaByKey.set(entry.key, media);
      return media;
    },
  });
  const prepared = await controller.load({ nowMs: 0 });
  const currentMedia = mediaByKey.get(prepared.current.key);
  let releasePlay;
  currentMedia.pendingPlay = new Promise((resolve) => { releasePlay = resolve; });

  const resuming = controller.resume();
  const duplicateResume = controller.resume();
  assert.equal(duplicateResume, resuming);
  assert.equal(controller.getSnapshot().status, "buffering");
  assert.equal(currentMedia.playPositions.length, 1);

  releasePlay();
  const [playing, duplicateResult] = await Promise.all([resuming, duplicateResume]);
  assert.equal(playing.status, "playing");
  assert.equal(duplicateResult.status, "playing");
  assert.equal(currentMedia.playPositions.length, 1);
});

test("debug telemetry observes browser media lifecycle without changing playback", async () => {
  const telemetry = [];
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new FakeMedia(),
    onTelemetry: (type, detail) => telemetry.push({ type, detail }),
  });
  const loaded = await controller.load({ nowMs: 0 });
  const currentMedia = controller.getSnapshot().media.roles.current;

  assert.ok(telemetry.some((event) => (
    event.type === "soundtrack.media.lifecycle"
      && event.detail.reason === "queue:synced"
      && event.detail.preparedMediaElements === 3
  )));
  assert.equal(currentMedia.key, loaded.current.key);
  assert.equal((await controller.resume()).status, "playing");
  assert.ok(telemetry.some((event) => (
    event.type === "soundtrack.media.lifecycle"
      && event.detail.currentAudibleKey === loaded.current.key
  )));
  const mediaByKey = new Map();
  const attributedTelemetry = [];
  const attributedController = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      mediaByKey.set(entry.key, media);
      return media;
    },
    onTelemetry: (type, detail) => attributedTelemetry.push({ type, detail }),
  });
  const attributed = await attributedController.load({ nowMs: 0 });
  const attributedMedia = mediaByKey.get(attributed.current.key);
  attributedMedia.currentTime = 10;
  attributedMedia.buffered = { length: 1, start: () => 0, end: () => 12.5 };
  attributedMedia.emit("stalled");
  assert.ok(attributedTelemetry.some((event) => (
    event.type === "soundtrack.media.lifecycle"
      && event.detail.reason === "media:stalled"
      && event.detail.event?.key === attributed.current.key
      && event.detail.event?.role === "current"
      && event.detail.event?.bufferedAheadSeconds === 2.5
  )));
});

test("pace, genre, and exact track choices start playback immediately", async () => {
  const requests = [];
  const controller = createSoundtrackPreviewController({
    fetchImpl: async (url) => {
      requests.push(new URL(url));
      return catalogFetch();
    },
    mediaFactory: () => new FakeMedia(),
  });

  const pace = await controller.load({
    selection: { kind: "pace", id: "fast" },
    autoplay: true,
    nowMs: 0,
  });
  assert.equal(pace.status, "playing");
  assert.equal(requests[0].searchParams.get("speed"), "high veryhigh");

  const genre = await controller.load({
    selection: { kind: "genre", id: "jazz" },
    autoplay: true,
    nowMs: 0,
  });
  assert.equal(genre.status, "playing");
  assert.equal(requests[1].searchParams.get("genre"), "jazz");

  const target = genre.library.entries.find((entry) => entry.key !== genre.current.key);
  const selected = await controller.select(target.key);
  assert.equal(selected.status, "playing");
  assert.equal(selected.current.key, target.key);
});

test("the default Jamendo library and explicit Illobo Featured path are distinct immediate-play queues", async () => {
  let fetches = 0;
  const randomValues = [0, 0.5];
  const mediaByKey = new Map();
  const controller = createSoundtrackPreviewController({
    fetchImpl: async (...args) => {
      fetches += 1;
      return sourceAwareCatalogFetch(...args);
    },
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      const instances = mediaByKey.get(entry.key) ?? [];
      instances.push(media);
      mediaByKey.set(entry.key, instances);
      return media;
    },
    random: () => randomValues.shift() ?? 0.75,
  });

  const library = await controller.load({ autoplay: true, nowMs: 0 });
  assert.equal(library.status, "playing");
  assert.equal(library.library.selection.kind, "library");

  const featured = await controller.load({
    selection: { kind: "featured", id: "signal-border" },
    autoplay: true,
    nowMs: 0,
  });
  assert.equal(featured.status, "playing");
  assert.equal(featured.library.selection.kind, "featured");
  assert.ok(featured.library.entries.every((entry) => entry.key.startsWith("illobo:")));
  assert.equal(featured.library.refreshCopy, "Random start · fresh mix every 30 min");
  assert.notDeepEqual(
    featured.library.entries.map((entry) => entry.key),
    library.library.entries.map((entry) => entry.key),
  );
  assert.notEqual(featured.current.key, library.current.key);
  assert.equal(featured.media.currentAudibleKey, featured.current.key);

  for (const instances of mediaByKey.values()) {
    for (const media of instances) {
      if (media.paused) media.currentTime = 87;
    }
  }

  const repeated = await controller.load({
    selection: { kind: "featured", id: "signal-border" },
    autoplay: true,
    nowMs: 0,
  });
  assert.equal(repeated.status, "playing");
  assert.notEqual(repeated.current.key, featured.current.key);
  const repeatedMedia = mediaByKey.get(repeated.current.key).at(-1);
  assert.equal(repeatedMedia.playPositions.at(-1), 0, "a new random track must start at 0:00");
  assert.deepEqual(
    new Set(repeated.library.entries.map((entry) => entry.key)),
    new Set(featured.library.entries.map((entry) => entry.key)),
  );
  const returnedLibrary = await controller.load({
    selection: { kind: "library", id: "all" },
    autoplay: true,
    nowMs: 0,
  });
  assert.equal(returnedLibrary.status, "playing");
  assert.equal(returnedLibrary.library.selection.kind, "library");
  assert.ok(returnedLibrary.library.entries.every((entry) => entry.key.startsWith("jamendo:")));
  assert.ok(returnedLibrary.current.key.startsWith("jamendo:"));
  assert.equal(returnedLibrary.media.currentAudibleKey, returnedLibrary.current.key);
  assert.equal(fetches, 3, "Jamendo → Illobo → Jamendo must fetch only the selected source catalog");
});

test("a pending path exposes its own loading identity before the network resolves", async () => {
  let releaseFeatured;
  const featuredResponse = new Promise((resolve) => { releaseFeatured = resolve; });
  const states = [];
  const controller = createSoundtrackPreviewController({
    fetchImpl: async (url) => (
      new URL(url).pathname === "/audio/illobo/catalog.json"
        ? featuredResponse
        : catalogFetch()
    ),
    mediaFactory: () => new FakeMedia(),
    onState: (state) => states.push(state),
  });
  await controller.load({ autoplay: true, nowMs: 0 });

  const loadingFeatured = controller.load({
    selection: { kind: "featured", id: "signal-border" },
    autoplay: true,
    nowMs: 0,
  });
  const pending = controller.getSnapshot();
  assert.equal(pending.status, "loading");
  assert.equal(pending.library.selection.kind, "featured");
  assert.deepEqual(pending.library.entries, []);

  releaseFeatured(await sourceAwareCatalogFetch("https://example.test/audio/illobo/catalog.json"));
  assert.equal((await loadingFeatured).library.selection.kind, "featured");
  assert.ok(states.some((state) => state.status === "loading" && state.library?.selection?.kind === "featured"));
});

test("Jamendo reclaims the path when a slower Illobo request finishes late", async () => {
  let releaseFeatured;
  const featuredResponse = new Promise((resolve) => { releaseFeatured = resolve; });
  const controller = createSoundtrackPreviewController({
    fetchImpl: async (url) => (
      new URL(url).pathname === "/audio/illobo/catalog.json"
        ? featuredResponse
        : catalogFetch()
    ),
    mediaFactory: () => new FakeMedia(),
  });
  await controller.load({ autoplay: true, nowMs: 0 });

  const slowFeatured = controller.load({
    selection: { kind: "featured", id: "signal-border" },
    autoplay: true,
    nowMs: 0,
  });
  assert.equal(controller.getSnapshot().library.selection.kind, "featured");

  const returned = await controller.load({
    selection: { kind: "library", id: "all" },
    autoplay: true,
    nowMs: 0,
  });
  assert.equal(returned.status, "playing");
  assert.equal(returned.library.selection.kind, "library");
  assert.ok(returned.current.key.startsWith("jamendo:"));

  releaseFeatured(await sourceAwareCatalogFetch("https://example.test/audio/illobo/catalog.json"));
  await slowFeatured;
  const settled = controller.getSnapshot();
  assert.equal(settled.library.selection.kind, "library");
  assert.ok(settled.current.key.startsWith("jamendo:"));
  assert.equal(settled.media.currentAudibleKey, settled.current.key);
});

test("a failed current deck cannot poison an explicitly selected replacement", async () => {
  const mediaByKey = new Map();
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      mediaByKey.set(entry.key, media);
      return media;
    },
  });
  const prepared = await controller.load({ nowMs: 0 });
  mediaByKey.get(prepared.current.key).rejectPlay = true;
  assert.equal((await controller.resume()).status, "error");

  const target = prepared.library.entries.find((entry) => entry.key !== prepared.current.key);
  const recovered = await controller.select(target.key);
  assert.equal(recovered.status, "playing");
  assert.equal(recovered.current.key, target.key);
  assert.equal(recovered.media.currentAudibleKey, target.key);
});

test("manual next and previous keep reversible identities and playback ownership", async () => {
  const mediaByKey = new Map();
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      const instances = mediaByKey.get(entry.key) ?? [];
      instances.push(media);
      mediaByKey.set(entry.key, instances);
      return media;
    },
  });
  await controller.load();
  const prepared = controller.getSnapshot();
  const firstKey = prepared.current.key;
  assert.equal(prepared.previous.key, prepared.media.roles.previous.key);
  assert.equal(prepared.next.key, prepared.media.roles.next.key);
  assert.ok(prepared.previous.imageUrl);
  assert.ok(prepared.next.imageUrl);
  const next = await controller.move("next");
  mediaByKey.get(firstKey).at(-1).currentTime = 42;
  const previous = await controller.move("previous");

  assert.notEqual(next.current.key, firstKey);
  assert.equal(next.status, "playing");
  assert.equal(previous.current.key, firstKey);
  assert.equal(previous.media.currentAudibleKey, firstKey);
  assert.equal(
    mediaByKey.get(firstKey).at(-1).playPositions.at(-1),
    0,
    "returning to a settled previous track must restart it from the beginning",
  );
});

test("pause remains authoritative when a weak-network next resolves late", async () => {
  const mediaByKey = new Map();
  const statesAfterPause = [];
  let pauseIssued = false;
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      mediaByKey.set(entry.key, media);
      return media;
    },
    onState: (state) => {
      if (pauseIssued) statesAfterPause.push(state);
    },
  });
  const playing = await controller.load({ autoplay: true, nowMs: 0 });
  const originalKey = playing.current.key;
  const incoming = mediaByKey.get(playing.next.key);
  let releaseIncoming;
  incoming.pendingPlay = new Promise((resolve) => { releaseIncoming = resolve; });

  const moving = controller.move("next");
  assert.equal(controller.getSnapshot().status, "buffering");
  pauseIssued = true;
  const paused = controller.pause();
  assert.equal(paused.status, "paused");
  assert.deepEqual(paused.media.audibleKeys, []);

  releaseIncoming();
  const settled = await moving;
  assert.equal(settled.status, "paused");
  assert.equal(settled.current.key, originalKey);
  assert.deepEqual(settled.media.audibleKeys, []);
  assert.equal(incoming.paused, true, "the late play promise must be silenced again");
  assert.ok(statesAfterPause.every((state) => state.media.audibleKeys.length === 0));
});

test("a newer play intent owns the current deck while a cancelled next resolves", async () => {
  const mediaByKey = new Map();
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      mediaByKey.set(entry.key, media);
      return media;
    },
  });
  const playing = await controller.load({ autoplay: true, nowMs: 0 });
  const originalKey = playing.current.key;
  const incoming = mediaByKey.get(playing.next.key);
  let releaseIncoming;
  incoming.pendingPlay = new Promise((resolve) => { releaseIncoming = resolve; });

  const moving = controller.move("next");
  controller.pause();
  const resumed = await controller.resume();
  assert.equal(resumed.status, "playing");
  assert.deepEqual(resumed.media.audibleKeys, [originalKey]);

  releaseIncoming();
  await moving;
  const settled = controller.getSnapshot();
  assert.equal(settled.status, "playing");
  assert.equal(settled.current.key, originalKey);
  assert.deepEqual(settled.media.audibleKeys, [originalKey]);
  assert.equal(incoming.paused, true, "the cancelled NEXT target must not join the newer PLAY");
});

test("a manual skip keeps committed metadata and outgoing playback until the target buffer is stable", async () => {
  const mediaByKey = new Map();
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      mediaByKey.set(entry.key, media);
      return media;
    },
  });
  await controller.load({ autoplay: true, nowMs: 0 });
  const before = controller.getSnapshot();
  const incoming = mediaByKey.get(before.next.key);
  incoming.readyState = 3;
  incoming.buffered = { length: 1, start: () => 0, end: () => 2 };

  const moving = controller.move("next");
  const buffering = controller.getSnapshot();
  assert.equal(buffering.status, "buffering");
  assert.equal(buffering.current.key, before.current.key);
  assert.equal(buffering.pending.direction, "next");
  assert.equal(buffering.pending.track.key, before.next.key);
  assert.ok(buffering.media.audibleKeys.includes(before.current.key));

  incoming.buffered = { length: 1, start: () => 0, end: () => 8 };
  incoming.emit("progress");
  const moved = await moving;

  assert.equal(moved.status, "playing");
  assert.equal(moved.current.key, before.next.key);
  assert.equal(moved.pending, null);
  assert.equal(incoming.playPositions.at(-1), 0);
  assert.equal(incoming.currentTime, 0);
});

test("natural track end advances once to a fresh target without replaying the ended deck", async () => {
  const mediaByKey = new Map();
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      mediaByKey.set(entry.key, media);
      return media;
    },
    setTimer: () => ({}),
    clearTimer: () => {},
  });
  await controller.load({ autoplay: true, nowMs: 0 });
  const before = controller.getSnapshot();
  const endedMedia = mediaByKey.get(before.current.key);
  endedMedia.currentTime = endedMedia.duration;
  endedMedia.paused = true;
  endedMedia.ended = true;
  endedMedia.emit("ended");
  await new Promise((resolve) => setImmediate(resolve));

  const advanced = controller.getSnapshot();
  assert.equal(advanced.status, "playing");
  assert.notEqual(advanced.current.key, before.current.key);
  assert.equal(advanced.media.currentAudibleKey, advanced.current.key);
  assert.equal(endedMedia.playPositions.length, 1, "the ended deck must never be replayed");
  assert.equal(mediaByKey.get(advanced.current.key).playPositions.at(-1), 0);
});

test("a dormant preload error does not stop the audible track and is refreshed on activation", async () => {
  const mediaByKey = new Map();
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      const instances = mediaByKey.get(entry.key) ?? [];
      instances.push(media);
      mediaByKey.set(entry.key, instances);
      return media;
    },
  });
  await controller.load({ autoplay: true, nowMs: 0 });
  const before = controller.getSnapshot();
  const targetKey = before.media.roles.next.key;
  const failedPreload = mediaByKey.get(targetKey).at(-1);
  failedPreload.error = { code: 2 };
  failedPreload.emit("error");

  const degraded = controller.getSnapshot();
  assert.equal(degraded.status, "playing");
  assert.equal(degraded.error, null);
  assert.equal(degraded.media.currentAudibleKey, before.current.key);

  const moved = await controller.move("next");
  assert.equal(moved.status, "playing");
  assert.equal(moved.current.key, targetKey);
  assert.notEqual(mediaByKey.get(targetKey).at(-1), failedPreload);
  assert.equal(mediaByKey.get(targetKey).at(-1).playPositions.at(-1), 0);
});

test("a failed playlist request preserves the already audible track and transport state", async () => {
  let requests = 0;
  const controller = createSoundtrackPreviewController({
    fetchImpl: async () => {
      requests += 1;
      if (requests === 1) return catalogFetch();
      return { ok: false, json: async () => ({ status: "upstream_unavailable" }) };
    },
    mediaFactory: () => new FakeMedia(),
  });
  await controller.load({ autoplay: true, nowMs: 0 });
  const before = controller.getSnapshot();
  const failed = await controller.load({
    selection: { kind: "genre", id: "jazz" },
    autoplay: true,
    nowMs: 1,
  });

  assert.equal(failed.status, "playing");
  assert.equal(failed.current.key, before.current.key);
  assert.equal(failed.media.currentAudibleKey, before.current.key);
  assert.equal(failed.error, "upstream_unavailable");
});

test("transport remains coherent through 120 deterministic skips, reversals, selections, and resumes", async () => {
  let now = 10;
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new FakeMedia(),
    effectsFactory: () => ({
      attachMedia: () => {},
      detachMedia: () => {},
      getClockTime: () => now,
      setImmediateTrackGains: () => ({ ok: true, mode: "test" }),
      applyTransition: () => ({ ok: true, mode: "test" }),
      resume: async () => {},
      setVehicleMaster: () => {},
      setVehicleMacros: () => {},
      setManualEffects: () => {},
      getSnapshot: () => ({ status: "running" }),
      getLevel: () => 0,
      destroy: () => {},
    }),
    setTimer: () => ({}),
    clearTimer: () => {},
  });
  await controller.load({ autoplay: true, nowMs: 0 });

  for (let index = 0; index < 120; index += 1) {
    now += 0.6;
    let state;
    if (index > 0 && index % 17 === 0) {
      const entries = controller.getSnapshot().library.entries;
      state = await controller.select(entries[(index / 17) % entries.length | 0].key);
    } else if (index > 0 && index % 13 === 0) {
      controller.pause();
      state = await controller.resume();
    } else {
      state = await controller.move(index % 5 === 0 ? "previous" : "next");
    }
    assert.equal(state.status, "playing", `transport action ${index} must remain playable`);
    assert.equal(state.error, null);
    assert.equal(state.media.currentAudibleKey, state.current.key);
    assert.ok(state.media.preparedMediaElements <= 3);
    assert.ok(state.media.audibleKeys.length <= 2);
    assert.equal(new Set(state.media.audibleKeys).size, state.media.audibleKeys.length);
  }
});

test("audible skips schedule the 450 ms model and keep rapid-retarget credits synchronized", async () => {
  let now = 10;
  const timers = [];
  const applied = [];
  const media = new Map();
  const effects = {
    attachMedia(key, element) { media.set(key, element); },
    detachMedia(key) { media.delete(key); },
    getClockTime: () => now,
    setImmediateTrackGains: () => ({ ok: true, mode: "test" }),
    applyTransition(state) { applied.push(state); return { ok: true, mode: "test" }; },
    resume: async () => {},
    setVehicleMaster: () => {},
    setVehicleMacros: () => {},
    setManualEffects: () => {},
    getSnapshot: () => ({ status: "running", attachedMediaElements: media.size }),
    getLevel: () => 0,
    destroy: () => {},
  };
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new FakeMedia(),
    effectsFactory: () => effects,
    setTimer: (callback, delay) => {
      const timer = { callback, delay, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => { timer.cleared = true; },
  });
  await controller.load({ autoplay: true, nowMs: 0 });
  const firstKey = controller.getSnapshot().current.key;
  const next = await controller.move("next");
  const secondKey = next.current.key;

  assert.equal(next.status, "playing");
  assert.equal(applied.length, 1);
  assert.ok(Math.abs(applied[0].durationSeconds - 0.45) < 1e-9);
  assert.equal(applied[0].targetKey, secondKey);
  assert.deepEqual(new Set(applied[0].fromGains ? Object.keys(applied[0].fromGains) : []), new Set([firstKey, secondKey]));
  assert.equal(next.media.preparedMediaElements, 3);

  now = 10.225;
  const previous = await controller.move("previous");
  assert.equal(previous.current.key, firstKey);
  assert.equal(applied.length, 2);
  assert.equal(applied[1].targetKey, firstKey);
  assert.deepEqual(new Set(controller.getSnapshot().attribution.audibleKeys), new Set([firstKey, secondKey]));

  now = applied[1].endAt + 0.03;
  for (const timer of timers.filter((item) => !item.cleared)) timer.callback();
  const settled = controller.getSnapshot();
  assert.equal(settled.attribution.status, "audible");
  assert.deepEqual(settled.attribution.audibleKeys, [firstKey]);
  assert.deepEqual(settled.media.audibleKeys, [firstKey]);
});

test("wall-clock cleanup settles a skip when Chromium freezes the audio clock", async () => {
  const frozenAudioTime = 10;
  const timers = [];
  const media = new Map();
  const effects = {
    attachMedia(key, element) { media.set(key, element); },
    detachMedia(key) { media.delete(key); },
    getClockTime: () => frozenAudioTime,
    setImmediateTrackGains: () => ({ ok: true, mode: "test" }),
    applyTransition: () => ({ ok: true, mode: "test" }),
    resume: async () => {},
    setVehicleMaster: () => {},
    setVehicleMacros: () => {},
    setManualEffects: () => {},
    getSnapshot: () => ({ status: "suspended", attachedMediaElements: media.size }),
    getLevel: () => 0,
    destroy: () => {},
  };
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new FakeMedia(),
    effectsFactory: () => effects,
    setTimer: (callback, delay) => {
      const timer = { callback, delay, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => { timer.cleared = true; },
  });

  await controller.load({ autoplay: true, nowMs: 0 });
  const moved = await controller.move("next");
  assert.equal(moved.transition.status, "active");
  assert.equal(moved.transition.targetKey, moved.current.key);

  for (const timer of timers.filter((item) => !item.cleared)) timer.callback();
  const settled = controller.getSnapshot();
  assert.equal(settled.attribution.transitioning, false);
  assert.deepEqual(settled.attribution.audibleKeys, [moved.current.key]);
  assert.deepEqual(settled.media.audibleKeys, [moved.current.key]);
});

test("an incoming deck starts before asynchronous effects readiness can consume user activation", async () => {
  const events = [];
  let resumeCalls = 0;
  let releaseTransitionResume;
  const transitionResume = new Promise((resolve) => { releaseTransitionResume = resolve; });
  class OrderedMedia extends FakeMedia {
    async play() {
      events.push(`play:${this.src}`);
      return super.play();
    }
  }
  const effects = {
    attachMedia: () => {},
    detachMedia: () => {},
    getClockTime: () => 10,
    setImmediateTrackGains: () => ({ ok: true, mode: "test" }),
    applyTransition: () => ({ ok: true, mode: "test" }),
    resume() {
      resumeCalls += 1;
      events.push(`resume:${resumeCalls}`);
      return resumeCalls === 1 ? Promise.resolve() : transitionResume;
    },
    setVehicleMaster: () => {},
    setVehicleMacros: () => {},
    setManualEffects: () => {},
    getSnapshot: () => ({ status: "running" }),
    getLevel: () => 0,
    destroy: () => {},
  };
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new OrderedMedia(),
    effectsFactory: () => effects,
  });
  await controller.load();
  await controller.resume();
  events.length = 0;

  const moving = controller.move("next");
  assert.equal(events.filter((event) => event.startsWith("play:")).length, 2);
  assert.equal(events.at(-1), "resume:2");
  releaseTransitionResume();

  assert.equal((await moving).status, "playing");
});

test("initial playback starts the media deck before asynchronous effects readiness", async () => {
  const events = [];
  let releaseResume;
  const resumeReady = new Promise((resolve) => { releaseResume = resolve; });
  class OrderedMedia extends FakeMedia {
    async play() {
      events.push("play");
      return super.play();
    }
  }
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new OrderedMedia(),
    effectsFactory: () => ({
      attachMedia: () => {},
      detachMedia: () => {},
      getClockTime: () => 10,
      setImmediateTrackGains: () => ({ ok: true, mode: "test" }),
      applyTransition: () => ({ ok: true, mode: "test" }),
      resume() { events.push("resume"); return resumeReady; },
      setVehicleMaster: () => {},
      setVehicleMacros: () => {},
      setManualEffects: () => {},
      getSnapshot: () => ({ status: "running" }),
      getLevel: () => 0,
      destroy: () => {},
    }),
  });
  await controller.load();
  const playing = controller.resume();
  assert.deepEqual(events, ["play", "resume"]);
  releaseResume();
  assert.equal((await playing).status, "playing");
});

test("an effects-resume rejection becomes a bounded transport error without phantom playback", async () => {
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new FakeMedia(),
    effectsFactory: () => ({
      attachMedia: () => {},
      detachMedia: () => {},
      getClockTime: () => 10,
      setImmediateTrackGains: () => ({ ok: true, mode: "test" }),
      applyTransition: () => ({ ok: true, mode: "test" }),
      resume: async () => { throw new Error("audio context blocked"); },
      setVehicleMaster: () => {},
      setVehicleMacros: () => {},
      setManualEffects: () => {},
      getSnapshot: () => ({ status: "suspended" }),
      getLevel: () => 0,
      destroy: () => {},
    }),
  });
  await controller.load();
  const failed = await controller.resume();

  assert.equal(failed.status, "error");
  assert.equal(failed.error, "audio context blocked");
  assert.equal(failed.media.currentAudibleKey, null);
  assert.deepEqual(failed.media.audibleKeys, []);
});

test("a failed incoming deck never commits target metadata or a stale QR credit", async () => {
  const mediaByKey = new Map();
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      mediaByKey.set(entry.key, media);
      return media;
    },
  });
  await controller.load({ autoplay: true, nowMs: 0 });
  const before = controller.getSnapshot();
  const targetKey = before.media.roles.next.key;
  mediaByKey.get(targetKey).rejectPlay = true;
  const failed = await controller.move("next");

  assert.equal(failed.status, "error");
  assert.equal(failed.current.key, before.current.key);
  assert.equal(failed.attribution.targetKey, before.current.key);
  assert.deepEqual(failed.attribution.audibleKeys, [before.current.key]);
  assert.equal(failed.media.currentAudibleKey, before.current.key);
});

test("a Jamendo play request that never settles times out, rolls back, and remains retryable", async () => {
  const timers = [];
  const mediaByKey = new Map();
  let releasePendingPlay;
  const pendingPlay = new Promise((resolve) => { releasePendingPlay = resolve; });
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: (entry) => {
      const media = new FakeMedia();
      const instances = mediaByKey.get(entry.key) ?? [];
      instances.push(media);
      mediaByKey.set(entry.key, instances);
      return media;
    },
    setTimer: (callback, delay) => {
      const timer = { callback, delay, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => { timer.cleared = true; },
  });
  await controller.load({ autoplay: true, nowMs: 0 });
  const before = controller.getSnapshot();
  const targetKey = before.media.roles.next.key;
  const blockedMedia = mediaByKey.get(targetKey).at(-1);
  blockedMedia.pendingPlay = pendingPlay;

  const moving = controller.move("next");
  const deadline = timers.find((timer) => (
    !timer.cleared && timer.delay === SOUNDTRACK_TRANSPORT_START_TIMEOUT_MS
  ));
  assert.ok(deadline, "the incoming Jamendo deck has no bounded start deadline");
  deadline.callback();
  const failed = await moving;

  assert.equal(failed.status, "error");
  assert.equal(failed.error, "transport-start-timeout");
  assert.equal(failed.current.key, before.current.key);
  assert.equal(failed.media.currentAudibleKey, before.current.key);
  assert.notEqual(mediaByKey.get(targetKey).at(-1), blockedMedia);

  releasePendingPlay();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(blockedMedia.paused, true, "a discarded late deck became audible after timeout");

  const retried = await controller.move("next");
  assert.equal(retried.status, "playing");
  assert.equal(retried.current.key, targetKey);
  assert.equal(retried.media.currentAudibleKey, targetKey);
});

test("the preview exposes the exact effects AudioContext for one-context vehicle macros", () => {
  const audioContext = { state: "running" };
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new FakeMedia(),
    effectsFactory: () => ({
      attachMedia: () => {},
      detachMedia: () => {},
      getAudioContext: () => audioContext,
      getClockTime: () => 0,
      setImmediateTrackGains: () => ({ ok: true }),
      applyTransition: () => ({ ok: true }),
      resume: async () => {},
      setVehicleMaster: () => {},
      setVehicleMacros: () => {},
      setManualEffects: () => {},
      getSnapshot: () => ({ status: "running" }),
      getLevel: () => 0,
      destroy: () => {},
    }),
  });

  assert.equal(controller.getAudioContext(), audioContext);
});

test("pause, resume, and destruction remain explicit and bounded", async () => {
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new FakeMedia(),
  });
  await controller.load();
  assert.equal(controller.pause().status, "paused");
  assert.equal((await controller.resume()).status, "playing");
  assert.equal(controller.destroy().status, "destroyed");
  assert.equal(controller.getSnapshot().current, null);
});

test("catalog failures remain visible without a partial playable state", async () => {
  const controller = createSoundtrackPreviewController({
    fetchImpl: async () => ({ ok: false, json: async () => ({ status: "upstream_unavailable" }) }),
    mediaFactory: () => new FakeMedia(),
  });
  const result = await controller.load();

  assert.equal(result.status, "error");
  assert.equal(result.error, "upstream_unavailable");
  assert.equal(result.current, null);
  assert.equal(result.media, null);
});
