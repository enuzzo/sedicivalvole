import assert from "node:assert/strict";
import test from "node:test";
import {
  createSoundtrackCatalogSnapshot,
  DEFAULT_CATALOG_TTL_MS,
  MAX_CATALOG_TTL_MS,
  MIN_CATALOG_TTL_MS,
  readSoundtrackCatalog,
} from "../src/soundtrack/catalog-store.js";
import {
  createSoundtrackQueue,
  moveSoundtrackQueue,
  refreshSoundtrackQueue,
  summarizeSoundtrackQueue,
} from "../src/soundtrack/rotation-model.js";
import { evaluateJamendoTrack } from "../src/soundtrack/source-policy.js";

const makePolicy = (id, artistId, artistName = `Artist ${artistId}`, licence = "by-nc") => evaluateJamendoTrack({
  id: String(id),
  name: `Track ${id}`,
  artist_id: String(artistId),
  artist_name: artistName,
  album_name: `Album ${artistId}`,
  license_ccurl: `https://creativecommons.org/licenses/${licence}/3.0/`,
  audio: `https://prod-1.storage.jamendo.com/?trackid=${id}&format=mp32`,
  shareurl: `https://www.jamendo.com/track/${id}`,
  image: `https://usercontent.jamendo.com?type=album&id=${artistId}&width=300`,
  audiodownload: `https://prod-1.storage.jamendo.com/download/track/${id}/mp32/`,
  audiodownload_allowed: true,
});

const freshCatalog = (policies, options = {}) => {
  const snapshot = createSoundtrackCatalogSnapshot(policies, {
    fetchedAtMs: 1000,
    revision: options.revision ?? "catalog-a",
    ttlMs: options.ttlMs ?? DEFAULT_CATALOG_TTL_MS,
  });
  return readSoundtrackCatalog(snapshot, options.nowMs ?? 1001);
};

test("catalog snapshots retain only admitted unique metadata for a bounded lifetime", () => {
  const admitted = makePolicy(1, 10);
  const noDerivatives = makePolicy(2, 20, "Artist 20", "by-nd");
  const missingProviderCredit = Object.freeze({ ...makePolicy(3, 30), providerCredit: "" });
  const snapshot = createSoundtrackCatalogSnapshot(
    [admitted, admitted, noDerivatives, missingProviderCredit, null],
    { fetchedAtMs: 1000, ttlMs: 1, revision: "rev-1" },
  );

  assert.equal(snapshot.ttlMs, MIN_CATALOG_TTL_MS);
  assert.equal(snapshot.admittedEntries, 1);
  assert.equal(snapshot.duplicateEntries, 1);
  assert.equal(snapshot.rejectedEntries, 3);
  assert.equal(snapshot.storage, "session-memory-metadata-only");
  assert.equal(JSON.stringify(snapshot).includes("audiodownload"), false);
  assert.equal(Object.isFrozen(snapshot.entries), true);
  assert.equal(readSoundtrackCatalog(snapshot, 30_999).status, "fresh");
  const expired = readSoundtrackCatalog(snapshot, 31_000);
  assert.equal(expired.status, "stale");
  assert.equal(expired.reason, "catalog-expired");
  assert.deepEqual(expired.entries, []);

  const longSnapshot = createSoundtrackCatalogSnapshot([admitted], {
    fetchedAtMs: 0,
    ttlMs: Number.MAX_SAFE_INTEGER,
  });
  assert.equal(longSnapshot.ttlMs, MAX_CATALOG_TTL_MS);
  assert.equal(readSoundtrackCatalog({}, 0).status, "unavailable");
});

test("the initial queue prepares three distinct metadata roles without an offline claim", () => {
  const catalog = freshCatalog([
    makePolicy(1, 10),
    makePolicy(2, 20),
    makePolicy(3, 30),
    makePolicy(4, 40),
    makePolicy(5, 50),
    makePolicy(6, 60),
  ]);
  const result = createSoundtrackQueue(catalog);
  const slotKeys = Object.values(result.state.slots).map((entry) => entry.key);

  assert.equal(result.blockedReason, null);
  assert.equal(new Set(slotKeys).size, 3);
  assert.equal(result.activated.key, result.state.slots.current.key);
  assert.deepEqual(summarizeSoundtrackQueue(result.state), {
    status: "ready",
    catalogRevision: "catalog-a",
    preparedMetadataSlots: 3,
    targetMetadataSlots: 3,
    hasPrevious: true,
    hasCurrent: true,
    hasNext: true,
    currentKey: result.state.slots.current.key,
    recentTrackCount: 1,
    recentArtistCount: 1,
    browserAudioBuffer: "browser-owned-unmeasured",
    offlineAudioAvailable: false,
    automaticModeFallback: false,
  });
});

test("an explicit library track becomes current without changing authored playback semantics", () => {
  const catalog = freshCatalog([
    makePolicy(1, 10),
    makePolicy(2, 20),
    makePolicy(3, 30),
    makePolicy(4, 40),
  ]);
  const queue = createSoundtrackQueue(catalog, { preferredKey: "jamendo:3" });

  assert.equal(queue.activated.key, "jamendo:3");
  assert.equal(queue.state.slots.current.key, "jamendo:3");
  assert.equal(new Set(Object.values(queue.state.slots).map((entry) => entry.key)).size, 3);
});

test("next and previous rotate coherently, release only displaced metadata, and preserve forward history", () => {
  const catalog = freshCatalog([
    makePolicy(1, 10),
    makePolicy(2, 20),
    makePolicy(3, 30),
    makePolicy(4, 40),
    makePolicy(5, 50),
    makePolicy(6, 60),
  ]);
  const initial = createSoundtrackQueue(catalog).state;
  const firstCurrent = initial.slots.current;
  const firstNext = initial.slots.next;
  const firstPrevious = initial.slots.previous;

  const forward = moveSoundtrackQueue(initial, catalog, "next");
  assert.equal(forward.blockedReason, null);
  assert.equal(forward.activated.key, firstNext.key);
  assert.equal(forward.state.slots.previous.key, firstCurrent.key);
  assert.equal(forward.released.some((entry) => entry.key === firstPrevious.key), true);
  assert.equal(new Set(Object.values(forward.state.slots).map((entry) => entry.key)).size, 3);

  const back = moveSoundtrackQueue(forward.state, catalog, "previous");
  assert.equal(back.activated.key, firstCurrent.key);
  assert.equal(back.state.slots.next.key, firstNext.key);
  const forwardAgain = moveSoundtrackQueue(back.state, catalog, "next");
  assert.equal(forwardAgain.activated.key, firstNext.key);
  assert.equal(forwardAgain.state.automaticModeFallback, false);
});

test("selection avoids the current and recently heard artist whenever alternatives exist", () => {
  const catalog = freshCatalog([
    makePolicy(1, 10, "Artist A"),
    makePolicy(2, 10, "Artist A"),
    makePolicy(3, 20, "Artist B"),
    makePolicy(4, 30, "Artist C"),
    makePolicy(5, 40, "Artist D"),
  ]);
  let state = createSoundtrackQueue(catalog, {
    recentTrackLimit: 3,
    recentArtistLimit: 2,
  }).state;

  for (let index = 0; index < 12; index += 1) {
    const before = state.slots.current;
    const moved = moveSoundtrackQueue(state, catalog, "next");
    assert.equal(moved.blockedReason, null);
    assert.notEqual(moved.state.slots.current.key, before.key);
    assert.notEqual(
      moved.state.slots.current.policy.item.artistId,
      before.policy.item.artistId,
    );
    assert.ok(moved.state.recentTrackKeys.length <= 3);
    assert.ok(moved.state.recentArtistKeys.length <= 2);
    state = moved.state;
  }
});

test("expired metadata blocks activation without changing mode or discarding prepared roles", () => {
  const snapshot = createSoundtrackCatalogSnapshot([
    makePolicy(1, 10),
    makePolicy(2, 20),
    makePolicy(3, 30),
  ], { fetchedAtMs: 1000, ttlMs: MIN_CATALOG_TTL_MS, revision: "short" });
  const fresh = readSoundtrackCatalog(snapshot, 1001);
  const state = createSoundtrackQueue(fresh).state;
  const stale = readSoundtrackCatalog(snapshot, 31_000);
  const blocked = moveSoundtrackQueue(state, stale, "next");

  assert.equal(blocked.blockedReason, "catalog-expired");
  assert.equal(blocked.state, state);
  assert.equal(blocked.activated, null);
  assert.deepEqual(blocked.released, []);
  assert.equal(blocked.state.automaticModeFallback, false);
});

test("a removed queued item is never activated and is replaced from fresh metadata", () => {
  const policies = [
    makePolicy(1, 10),
    makePolicy(2, 20),
    makePolicy(3, 30),
    makePolicy(4, 40),
    makePolicy(5, 50),
  ];
  const firstCatalog = freshCatalog(policies, { revision: "before" });
  const state = createSoundtrackQueue(firstCatalog).state;
  const removedKey = state.slots.next.key;
  const refreshedCatalog = freshCatalog(
    policies.filter((policy) => `jamendo:${policy.item.id}` !== removedKey),
    { revision: "after" },
  );
  const moved = moveSoundtrackQueue(state, refreshedCatalog, "next");

  assert.equal(moved.blockedReason, null);
  assert.notEqual(moved.activated.key, removedKey);
  assert.equal(moved.released.some((entry) => entry.key === removedKey), true);
  assert.equal(moved.state.catalogRevision, "after");
});

test("an exhausted one-track catalogue pauses queue movement instead of selecting another mode", () => {
  const catalog = freshCatalog([makePolicy(1, 10)]);
  const state = createSoundtrackQueue(catalog).state;
  const moved = moveSoundtrackQueue(state, catalog, "next");
  const summary = summarizeSoundtrackQueue(moved.state);

  assert.equal(state.status, "partial");
  assert.equal(moved.blockedReason, "metadata-buffer-exhausted");
  assert.equal(moved.activated, null);
  assert.equal(moved.state.slots.current.key, state.slots.current.key);
  assert.equal(summary.preparedMetadataSlots, 1);
  assert.equal(summary.offlineAudioAvailable, false);
  assert.equal(summary.automaticModeFallback, false);
});

test("catalog recovery refills missing roles without replacing the audible current track", () => {
  const originalCatalog = freshCatalog([makePolicy(1, 10)], { revision: "thin" });
  const original = createSoundtrackQueue(originalCatalog).state;
  const recoveredCatalog = freshCatalog([
    makePolicy(1, 10),
    makePolicy(2, 20),
    makePolicy(3, 30),
    makePolicy(4, 40),
  ], { revision: "recovered" });
  const refreshed = refreshSoundtrackQueue(original, recoveredCatalog);

  assert.equal(refreshed.blockedReason, null);
  assert.equal(refreshed.preparedCurrent, null);
  assert.equal(refreshed.state.slots.current, original.slots.current);
  assert.equal(refreshed.state.status, "ready");
  assert.equal(refreshed.state.catalogRevision, "recovered");
  assert.equal(new Set(Object.values(refreshed.state.slots).map((entry) => entry.key)).size, 3);
  assert.deepEqual(refreshed.released, []);
});

test("catalog recovery can prepare an empty current slot without claiming playback", () => {
  const unavailable = readSoundtrackCatalog(null, 1000);
  const empty = createSoundtrackQueue(unavailable).state;
  const recoveredCatalog = freshCatalog([
    makePolicy(1, 10),
    makePolicy(2, 20),
    makePolicy(3, 30),
  ], { revision: "recovered" });
  const refreshed = refreshSoundtrackQueue(empty, recoveredCatalog);

  assert.equal(refreshed.blockedReason, null);
  assert.equal(refreshed.preparedCurrent.key, refreshed.state.slots.current.key);
  assert.equal(refreshed.state.status, "ready");
  assert.equal(summarizeSoundtrackQueue(refreshed.state).browserAudioBuffer, "browser-owned-unmeasured");
});
