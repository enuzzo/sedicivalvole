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
  const loaded = await controller.load();

  assert.equal(loaded.status, "prepared");
  assert.equal(loaded.current.key, "jamendo:1");
  assert.equal(loaded.media.preparedMediaElements, 3);
  assert.equal(loaded.media.currentAudibleKey, null);
  assert.equal(loaded.playbackRate, 1);
  assert.equal(loaded.drivingCanChangeTrack, false);
  assert.equal(loaded.drivingCanRetimeRecording, false);
  assert.equal(loaded.persistentAudioStorage, false);
  assert.ok(states.some((state) => state.status === "loading"));
  assert.equal((await controller.resume()).status, "playing");
  assert.equal(controller.getSnapshot().media.currentAudibleKey, "jamendo:1");
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
