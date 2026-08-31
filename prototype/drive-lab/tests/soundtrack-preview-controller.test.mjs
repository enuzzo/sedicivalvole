import assert from "node:assert/strict";
import test from "node:test";
import { SOUNDTRACK_CATALOG_API_SCHEMA } from "../src/soundtrack/catalog-client.js";
import { createSoundtrackPreviewController } from "../src/soundtrack/preview-controller.js";

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
    this.duration = 180;
    this.buffered = { length: 1, start: () => 0, end: () => 30 };
  }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  removeEventListener(name) { this.listeners.delete(name); }
  removeAttribute(name) { if (name === "src") this.src = ""; }
  load() {}
  pause() { this.paused = true; }
  async play() {
    if (this.rejectPlay) throw Object.assign(new Error("blocked"), { name: "NotAllowedError" });
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
  const controller = createSoundtrackPreviewController({
    fetchImpl: async (...args) => {
      fetches += 1;
      return catalogFetch(...args);
    },
    mediaFactory: () => new FakeMedia(),
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
  assert.notDeepEqual(
    featured.library.entries.map((entry) => entry.key),
    library.library.entries.map((entry) => entry.key),
  );
  assert.notEqual(featured.current.key, library.current.key);
  assert.equal(featured.media.currentAudibleKey, featured.current.key);
  assert.equal(fetches, 1, "Featured must reuse the prepared catalogue inside the click gesture");
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
  const controller = createSoundtrackPreviewController({
    fetchImpl: catalogFetch,
    mediaFactory: () => new FakeMedia(),
  });
  await controller.load();
  const firstKey = controller.getSnapshot().current.key;
  const next = await controller.move("next");
  const previous = await controller.move("previous");

  assert.notEqual(next.current.key, firstKey);
  assert.equal(next.status, "playing");
  assert.equal(previous.current.key, firstKey);
  assert.equal(previous.media.currentAudibleKey, firstKey);
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
