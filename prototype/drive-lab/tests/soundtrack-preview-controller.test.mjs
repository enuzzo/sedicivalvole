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
  async play() { this.paused = false; }
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
