import assert from "node:assert/strict";
import test from "node:test";
import {
  createSoundtrackCatalogSnapshot,
  readSoundtrackCatalog,
} from "../src/soundtrack/catalog-store.js";
import { createSoundtrackMediaDeckController } from "../src/soundtrack/media-deck-controller.js";
import {
  createSoundtrackQueue,
  moveSoundtrackQueue,
} from "../src/soundtrack/rotation-model.js";
import { evaluateJamendoTrack } from "../src/soundtrack/source-policy.js";

const makePolicy = (id, artistId, token = "one") => evaluateJamendoTrack({
  id: String(id),
  name: `Track ${id}`,
  artist_id: String(artistId),
  artist_name: `Artist ${artistId}`,
  album_name: `Album ${artistId}`,
  license_ccurl: "https://creativecommons.org/licenses/by-nc/3.0/",
  audio: `https://prod-1.storage.jamendo.com/?trackid=${id}&format=mp32&token=${token}`,
  shareurl: `https://www.jamendo.com/track/${id}`,
  image: `https://usercontent.jamendo.com?type=album&id=${artistId}&width=300`,
});

const makeCatalog = (policies, revision = "one") => readSoundtrackCatalog(
  createSoundtrackCatalogSnapshot(policies, {
    fetchedAtMs: 1000,
    revision,
  }),
  1001,
);

class FakeTimeRanges {
  constructor(ranges = []) {
    this.ranges = ranges;
    this.length = ranges.length;
  }

  start(index) {
    return this.ranges[index][0];
  }

  end(index) {
    return this.ranges[index][1];
  }
}

class FakeMedia {
  constructor(entry, { deferredPlay = null, rejectPlay = null } = {}) {
    this.entry = entry;
    this.listeners = new Map();
    this.preload = "none";
    this.crossOrigin = null;
    this.src = "";
    this.readyState = 0;
    this.networkState = 2;
    this.buffered = new FakeTimeRanges();
    this.currentTime = 0;
    this.duration = 180;
    this.paused = true;
    this.ended = false;
    this.error = null;
    this.loadCalls = 0;
    this.pauseCalls = 0;
    this.playCalls = 0;
    this.removedSource = false;
    this.deferredPlay = deferredPlay;
    this.rejectPlay = rejectPlay;
  }

  addEventListener(eventName, listener) {
    const listeners = this.listeners.get(eventName) ?? new Set();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
  }

  removeEventListener(eventName, listener) {
    this.listeners.get(eventName)?.delete(listener);
  }

  emit(eventName) {
    for (const listener of [...(this.listeners.get(eventName) ?? [])]) listener();
  }

  load() {
    this.loadCalls += 1;
  }

  async play() {
    this.playCalls += 1;
    if (this.rejectPlay) throw this.rejectPlay;
    if (this.deferredPlay) await this.deferredPlay.promise;
    this.paused = false;
    this.emit("playing");
  }

  pause() {
    this.pauseCalls += 1;
    this.paused = true;
    this.emit("pause");
  }

  removeAttribute(name) {
    if (name !== "src") return;
    this.removedSource = true;
    this.src = "";
  }
}

const createFixture = (count = 6, mediaOptions = () => ({})) => {
  const policies = Array.from({ length: count }, (_, index) => makePolicy(index + 1, index + 10));
  const catalog = makeCatalog(policies);
  const queue = createSoundtrackQueue(catalog).state;
  const mediaByKey = new Map();
  const controller = createSoundtrackMediaDeckController({
    mediaFactory: (entry) => {
      const media = new FakeMedia(entry, mediaOptions(entry));
      mediaByKey.set(entry.key, media);
      return media;
    },
  });
  return { policies, catalog, queue, mediaByKey, controller };
};

test("sync creates exactly three transient browser media roles with honest readiness", () => {
  const fixture = createFixture();
  const snapshot = fixture.controller.syncQueue(fixture.queue);

  assert.equal(snapshot.status, "prepared");
  assert.equal(snapshot.preparedMediaElements, 3);
  assert.equal(snapshot.playableMediaElements, 0);
  assert.equal(snapshot.browserPreloadHint, "auto");
  assert.equal(snapshot.browserBufferOwnership, "browser-owned-observation-only");
  assert.equal(snapshot.offlineAudioAvailable, false);
  assert.equal(snapshot.persistentAudioStorage, false);
  assert.equal(snapshot.automaticModeFallback, false);
  for (const role of ["previous", "current", "next"]) {
    const media = fixture.controller.getMediaForRole(role);
    assert.equal(media.preload, "auto");
    assert.equal(media.crossOrigin, "anonymous");
    assert.equal(media.src, fixture.queue.slots[role].policy.item.streamUrl);
    assert.equal(media.loadCalls, 1);
  }
});

test("an explicit playlist restart recreates a prepared target at zero", () => {
  const fixture = createFixture();
  fixture.controller.syncQueue(fixture.queue);
  const key = fixture.queue.slots.current.key;
  const previousMedia = fixture.controller.getMediaForRole("current");
  previousMedia.currentTime = 87;

  fixture.controller.syncQueue(fixture.queue, { restartKeys: [key] });
  const restartedMedia = fixture.controller.getMediaForRole("current");

  assert.notEqual(restartedMedia, previousMedia);
  assert.equal(previousMedia.removedSource, true);
  assert.equal(restartedMedia.currentTime, 0);
});

test("a raw direct-source preview may omit CORS mode without changing production default", () => {
  const defaultMedia = [];
  const directMedia = [];
  const defaultController = createSoundtrackMediaDeckController({
    mediaFactory: () => {
      const media = new FakeMedia();
      defaultMedia.push(media);
      return media;
    },
  });
  const directController = createSoundtrackMediaDeckController({
    crossOrigin: null,
    mediaFactory: () => {
      const media = new FakeMedia();
      directMedia.push(media);
      return media;
    },
  });
  const queue = createSoundtrackQueue(makeCatalog([
    makePolicy(1, 11),
    makePolicy(2, 12),
    makePolicy(3, 13),
  ])).state;

  defaultController.syncQueue(queue);
  directController.syncQueue(queue);

  assert.deepEqual(defaultMedia.map((media) => media.crossOrigin), ["anonymous", "anonymous", "anonymous"]);
  assert.deepEqual(directMedia.map((media) => media.crossOrigin), [null, null, null]);
});

test("readiness and buffered time are browser observations rather than promises", () => {
  const fixture = createFixture();
  fixture.controller.syncQueue(fixture.queue);
  const current = fixture.controller.getMediaForRole("current");
  current.readyState = 3;
  current.currentTime = 12;
  current.buffered = new FakeTimeRanges([[0, 42.25]]);
  current.emit("progress");
  const snapshot = fixture.controller.getSnapshot();

  assert.equal(snapshot.roles.current.state, "playable");
  assert.equal(snapshot.roles.current.bufferedAheadSeconds, 30.25);
  assert.equal(snapshot.playableMediaElements, 1);
  assert.equal(snapshot.offlineAudioAvailable, false);
});

test("only an explicit play request makes the current role audible", async () => {
  const fixture = createFixture();
  fixture.controller.syncQueue(fixture.queue);
  const result = await fixture.controller.playCurrent();

  assert.equal(result.ok, true);
  assert.equal(result.snapshot.currentAudibleKey, fixture.queue.slots.current.key);
  assert.equal(fixture.controller.getMediaForRole("current").playCalls, 1);
  assert.equal(fixture.controller.getMediaForRole("previous").playCalls, 0);
  assert.equal(fixture.controller.getMediaForRole("next").playCalls, 0);
  assert.equal(fixture.controller.pauseCurrent().currentAudibleKey, null);
});

test("queue rotation reuses retained decks and destroys only the displaced one", async () => {
  const fixture = createFixture();
  fixture.controller.syncQueue(fixture.queue);
  await fixture.controller.playCurrent();
  const oldCurrent = fixture.controller.getMediaForRole("current");
  const oldNext = fixture.controller.getMediaForRole("next");
  const oldPrevious = fixture.controller.getMediaForRole("previous");
  const moved = moveSoundtrackQueue(fixture.queue, fixture.catalog, "next");
  const snapshot = fixture.controller.syncQueue(moved.state);

  assert.equal(snapshot.preparedMediaElements, 3);
  assert.equal(fixture.controller.getMediaForRole("previous"), oldCurrent);
  assert.equal(fixture.controller.getMediaForRole("current"), oldNext);
  assert.equal(oldCurrent.paused, true);
  assert.equal(oldPrevious.removedSource, true);
  assert.ok(oldPrevious.pauseCalls >= 1);
  assert.ok(oldPrevious.loadCalls >= 2);
  assert.equal(snapshot.currentAudibleKey, null);
});

test("a transition keeps the outgoing deck inside the strict three-element bound", async () => {
  const fixture = createFixture();
  fixture.controller.syncQueue(fixture.queue);
  await fixture.controller.playCurrent();
  const outgoingKey = fixture.queue.slots.current.key;
  const moved = moveSoundtrackQueue(fixture.queue, fixture.catalog, "next");
  const incomingKey = moved.state.slots.current.key;
  const prepared = fixture.controller.syncQueue(moved.state, {
    retainKeys: [outgoingKey, incomingKey],
    audibleKeys: [outgoingKey, incomingKey],
  });
  const started = await fixture.controller.playKeys([outgoingKey, incomingKey]);

  assert.equal(prepared.preparedMediaElements, 3);
  assert.equal(started.ok, true);
  assert.deepEqual(new Set(started.snapshot.audibleKeys), new Set([outgoingKey, incomingKey]));
  const settled = fixture.controller.pauseExcept([incomingKey]);
  assert.deepEqual(settled.audibleKeys, [incomingKey]);
});

test("a refreshed queued URL replaces its dormant media before activation", () => {
  const fixture = createFixture();
  fixture.controller.syncQueue(fixture.queue);
  const oldNext = fixture.controller.getMediaForRole("next");
  const nextId = fixture.queue.slots.next.policy.item.id;
  const refreshedPolicies = fixture.policies.map((policy) => (
    policy.item.id === nextId ? makePolicy(nextId, policy.item.artistId, "two") : policy
  ));
  const refreshedCatalog = makeCatalog(refreshedPolicies, "two");
  const moved = moveSoundtrackQueue(fixture.queue, refreshedCatalog, "next");
  fixture.controller.syncQueue(moved.state);
  const current = fixture.controller.getMediaForRole("current");

  assert.notEqual(current, oldNext);
  assert.equal(oldNext.removedSource, true);
  assert.match(current.src, /token=two/);
  assert.equal(current.paused, true);
});

test("events from a disposed deck cannot change state or end the current item", () => {
  const ended = [];
  const errors = [];
  const fixture = createFixture();
  const controller = createSoundtrackMediaDeckController({
    mediaFactory: (entry) => {
      const media = new FakeMedia(entry);
      fixture.mediaByKey.set(entry.key, media);
      return media;
    },
    onEnded: (entry) => ended.push(entry.key),
    onError: (error) => errors.push(error),
  });
  controller.syncQueue(fixture.queue);
  const disposed = controller.getMediaForRole("previous");
  const moved = moveSoundtrackQueue(fixture.queue, fixture.catalog, "next");
  controller.syncQueue(moved.state);
  disposed.error = { code: 2 };
  disposed.emit("error");
  disposed.emit("ended");

  assert.deepEqual(ended, []);
  assert.deepEqual(errors, []);
  controller.getMediaForRole("next").emit("ended");
  assert.deepEqual(ended, []);
  controller.getMediaForRole("current").emit("ended");
  assert.deepEqual(ended, [moved.state.slots.current.key]);
});

test("media errors and play rejection are reported without changing mode", async () => {
  const errors = [];
  const policies = [makePolicy(1, 10), makePolicy(2, 20), makePolicy(3, 30)];
  const catalog = makeCatalog(policies);
  const queue = createSoundtrackQueue(catalog).state;
  const controller = createSoundtrackMediaDeckController({
    mediaFactory: (entry) => new FakeMedia(entry, {
      rejectPlay: entry.key === queue.slots.current.key
        ? Object.assign(new Error("gesture required"), { name: "NotAllowedError" })
        : null,
    }),
    onError: (error) => errors.push(error),
  });
  controller.syncQueue(queue);
  const current = controller.getMediaForRole("current");
  current.error = { code: 3 };
  current.emit("error");
  const result = await controller.playCurrent();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "play-rejected");
  assert.equal(result.snapshot.automaticModeFallback, false);
  assert.equal(errors[0].code, "media-error");
  assert.equal(errors[0].mediaErrorCode, 3);
  assert.equal(errors[1].code, "play-rejected");
  assert.equal(errors[1].reason, "NotAllowedError");
});

test("a broken media factory degrades one role without leaking a partial record", () => {
  const errors = [];
  const policies = [makePolicy(1, 10), makePolicy(2, 20), makePolicy(3, 30)];
  const catalog = makeCatalog(policies);
  const queue = createSoundtrackQueue(catalog).state;
  const brokenKey = queue.slots.next.key;
  const controller = createSoundtrackMediaDeckController({
    mediaFactory: (entry) => {
      if (entry.key !== brokenKey) return new FakeMedia(entry);
      const media = new FakeMedia(entry);
      Object.defineProperty(media, "src", {
        configurable: true,
        get: () => "",
        set: () => { throw new Error("source rejected"); },
      });
      return media;
    },
    onError: (error) => errors.push(error),
  });
  const snapshot = controller.syncQueue(queue);

  assert.equal(snapshot.status, "degraded");
  assert.equal(snapshot.preparedMediaElements, 2);
  assert.equal(snapshot.roles.next.state, "unavailable");
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, "media-create-failed");
  assert.equal(errors[0].key, brokenKey);
});

test("a pending play promise cannot make an old role audible after rapid navigation", async () => {
  let resolvePlay;
  const deferredPlay = {
    promise: new Promise((resolve) => { resolvePlay = resolve; }),
  };
  const fixture = createFixture();
  fixture.controller.syncQueue(fixture.queue);
  const oldCurrent = fixture.controller.getMediaForRole("current");
  oldCurrent.deferredPlay = deferredPlay;
  const pending = fixture.controller.playCurrent();
  const moved = moveSoundtrackQueue(fixture.queue, fixture.catalog, "next");
  fixture.controller.syncQueue(moved.state);
  resolvePlay();
  const result = await pending;

  assert.equal(result.ok, false);
  assert.equal(result.reason, "stale-play-request");
  assert.equal(oldCurrent.paused, true);
  assert.equal(fixture.controller.getSnapshot().currentAudibleKey, null);
});

test("destroy is idempotent, releases every source, and ignores late events", () => {
  const snapshots = [];
  const fixture = createFixture();
  const media = [];
  const controller = createSoundtrackMediaDeckController({
    mediaFactory: (entry) => {
      const element = new FakeMedia(entry);
      media.push(element);
      return element;
    },
    onSnapshot: (snapshot, reason) => snapshots.push([snapshot.status, reason]),
  });
  controller.syncQueue(fixture.queue);
  const first = controller.destroy();
  const second = controller.destroy();
  media[0].emit("progress");

  assert.equal(first.status, "destroyed");
  assert.equal(second.status, "destroyed");
  assert.equal(first.preparedMediaElements, 0);
  assert.equal(media.every((element) => element.removedSource), true);
  assert.equal(snapshots.at(-1)[1], "controller:destroyed");
});
