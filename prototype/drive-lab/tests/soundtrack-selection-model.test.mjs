import assert from "node:assert/strict";
import test from "node:test";
import {
  createSoundtrackCatalogSnapshot,
  readSoundtrackCatalog,
} from "../src/soundtrack/catalog-store.js";
import {
  createSoundtrackQueue,
  refreshSoundtrackQueue,
} from "../src/soundtrack/rotation-model.js";
import {
  automaticSoundtrackPace,
  createSoundtrackCatalogSelectionView,
  createSoundtrackSelectionState,
  restoreAutomaticSoundtrackPace,
  setManualSoundtrackPace,
  SOUNDTRACK_PACE_BANDS,
  SOUNDTRACK_PACE_CEILING_KMH,
  SOUNDTRACK_PACE_HYSTERESIS_KMH,
  updateSoundtrackDrivingPace,
} from "../src/soundtrack/selection-model.js";
import { evaluateJamendoTrack } from "../src/soundtrack/source-policy.js";

const makePolicy = (id, artistId, pace, genres = []) => evaluateJamendoTrack({
  id: String(id),
  name: `Track ${id}`,
  artist_id: String(artistId),
  artist_name: `Artist ${artistId}`,
  album_name: `Album ${artistId}`,
  license_ccurl: "https://creativecommons.org/licenses/by-nc/3.0/",
  audio: `https://prod-1.storage.jamendo.com/?trackid=${id}&format=mp32`,
  shareurl: `https://www.jamendo.com/track/${id}`,
  image: `https://usercontent.jamendo.com?type=album&id=${artistId}&width=300`,
  musicinfo: { speed: pace, tags: { genres } },
});

const freshCatalog = (policies, revision = "source-a") => readSoundtrackCatalog(
  createSoundtrackCatalogSnapshot(policies, { fetchedAtMs: 1000, revision }),
  1001,
);

test("the five source pace bands remain plain, ordered, and tied to the 130 km/h ceiling", () => {
  assert.deepEqual(SOUNDTRACK_PACE_BANDS.map((band) => band.id), [
    "verylow",
    "low",
    "medium",
    "high",
    "veryhigh",
  ]);
  assert.deepEqual(SOUNDTRACK_PACE_BANDS.map((band) => band.label), [
    "Very low",
    "Low",
    "Medium",
    "High",
    "Very high",
  ]);
  assert.equal(SOUNDTRACK_PACE_CEILING_KMH, 130);
  assert.equal(SOUNDTRACK_PACE_HYSTERESIS_KMH, 3);
  assert.equal(automaticSoundtrackPace(null), null);
  assert.equal(automaticSoundtrackPace(0), "verylow");
  assert.equal(automaticSoundtrackPace(25.9), "verylow");
  assert.equal(automaticSoundtrackPace(26), "low");
  assert.equal(automaticSoundtrackPace(52), "medium");
  assert.equal(automaticSoundtrackPace(78), "high");
  assert.equal(automaticSoundtrackPace(104), "veryhigh");
  assert.equal(automaticSoundtrackPace(999), "veryhigh");
});

test("automatic pace uses hysteresis rather than chattering at a boundary", () => {
  let state = createSoundtrackSelectionState({ speedKmh: 25 });
  assert.equal(state.effectivePace, "verylow");
  state = updateSoundtrackDrivingPace(state, 28.9);
  assert.equal(state.effectivePace, "verylow");
  assert.equal(state.revision, 0);
  state = updateSoundtrackDrivingPace(state, 29);
  assert.equal(state.effectivePace, "low");
  assert.equal(state.revision, 1);
  state = updateSoundtrackDrivingPace(state, 23.1);
  assert.equal(state.effectivePace, "low");
  state = updateSoundtrackDrivingPace(state, 23);
  assert.equal(state.effectivePace, "verylow");
  assert.equal(state.revision, 2);

  const jumped = updateSoundtrackDrivingPace(state, 120);
  assert.equal(jumped.effectivePace, "veryhigh");
  assert.equal(jumped.lastSpeedKmh, 120);
  assert.equal(jumped.revision, 3);
});

test("manual pace ignores later speed until automatic mode is explicitly restored", () => {
  const automatic = createSoundtrackSelectionState({ speedKmh: 90 });
  const manual = setManualSoundtrackPace(automatic, "low");
  const driven = updateSoundtrackDrivingPace(manual, 125);

  assert.equal(manual.mode, "manual");
  assert.equal(driven.manualPace, "low");
  assert.equal(driven.automaticPace, "veryhigh");
  assert.equal(driven.effectivePace, "low");
  assert.equal(driven.revision, manual.revision);
  assert.equal(driven.appliesTo, "next-track-selection-only");
  assert.equal(driven.currentPlaybackUnaffected, true);
  assert.equal(driven.automaticModeFallback, false);

  const restored = restoreAutomaticSoundtrackPace(driven);
  assert.equal(restored.mode, "automatic");
  assert.equal(restored.manualPace, null);
  assert.equal(restored.effectivePace, "veryhigh");
  assert.equal(restored.revision, driven.revision + 1);
  assert.equal(setManualSoundtrackPace(restored, "unknown"), restored);
});

test("catalog views use exact source pace and explicit any/all genre semantics", () => {
  const catalog = freshCatalog([
    makePolicy(1, 10, "high", ["rock", "electronic"]),
    makePolicy(2, 20, "high", ["rock"]),
    makePolicy(3, 30, "medium", ["electronic"]),
    makePolicy(4, 40, null, []),
  ]);
  const state = setManualSoundtrackPace(createSoundtrackSelectionState(), "high");
  const any = createSoundtrackCatalogSelectionView(catalog, state, {
    genres: [" Electronic ", "funk"],
    genreMode: "any",
  });
  const all = createSoundtrackCatalogSelectionView(catalog, state, {
    genres: ["rock", "electronic"],
    genreMode: "all",
  });

  assert.equal(any.status, "fresh");
  assert.deepEqual(any.entries.map((entry) => entry.key), ["jamendo:1"]);
  assert.equal(any.selection.effectivePace, "high");
  assert.deepEqual(any.selection.genres, ["electronic", "funk"]);
  assert.equal(any.selection.genreMode, "any");
  assert.equal(any.selection.exactSourceMetadataOnly, true);
  assert.deepEqual(all.entries.map((entry) => entry.key), ["jamendo:1"]);
  assert.equal(any.sourceEntryCount, 4);
  assert.equal(any.entriesWithoutPace, 1);
  assert.equal(any.entriesWithoutGenres, 1);
  assert.equal(any.currentPlaybackUnaffected, true);
  assert.equal(any.automaticModeFallback, false);
  assert.match(any.revision, /pace:high/);
});

test("unknown automatic pace browses all admitted tracks without pretending GPS is zero", () => {
  const catalog = freshCatalog([
    makePolicy(1, 10, "verylow", ["ambient"]),
    makePolicy(2, 20, "veryhigh", ["rock"]),
    makePolicy(3, 30, null, []),
  ]);
  const state = createSoundtrackSelectionState();
  const view = createSoundtrackCatalogSelectionView(catalog, state);

  assert.equal(state.lastSpeedKmh, null);
  assert.equal(state.effectivePace, null);
  assert.equal(view.selection.effectivePace, null);
  assert.equal(view.matchedEntryCount, 3);
});

test("an exact empty band fails honestly without widening to adjacent source pace", () => {
  const catalog = freshCatalog([makePolicy(1, 10, "medium", ["jazz"])]);
  const state = setManualSoundtrackPace(createSoundtrackSelectionState(), "veryhigh");
  const view = createSoundtrackCatalogSelectionView(catalog, state);
  const queue = createSoundtrackQueue(view);

  assert.equal(view.status, "fresh");
  assert.equal(view.reason, "selection-empty");
  assert.deepEqual(view.entries, []);
  assert.equal(queue.blockedReason, "catalog-empty");
  assert.equal(queue.state.automaticModeFallback, false);
});

test("a driving-band change can refill future slots without replacing current playback", () => {
  const catalog = freshCatalog([
    makePolicy(1, 10, "medium", ["electronic"]),
    makePolicy(2, 20, "medium", ["electronic"]),
    makePolicy(3, 30, "medium", ["electronic"]),
    makePolicy(4, 40, "high", ["rock"]),
    makePolicy(5, 50, "high", ["rock"]),
    makePolicy(6, 60, "high", ["rock"]),
  ]);
  const mediumState = setManualSoundtrackPace(createSoundtrackSelectionState(), "medium");
  const mediumView = createSoundtrackCatalogSelectionView(catalog, mediumState);
  const queue = createSoundtrackQueue(mediumView).state;
  const audibleCurrent = queue.slots.current;
  const highState = setManualSoundtrackPace(mediumState, "high");
  const highView = createSoundtrackCatalogSelectionView(catalog, highState);
  const refreshed = refreshSoundtrackQueue(queue, highView);

  assert.equal(refreshed.state.slots.current, audibleCurrent);
  assert.equal(refreshed.preparedCurrent, null);
  assert.equal(refreshed.state.slots.previous.policy.item.pace, "high");
  assert.equal(refreshed.state.slots.next.policy.item.pace, "high");
  assert.equal(refreshed.state.automaticModeFallback, false);
});

test("invalid selection state and unavailable catalog fail closed", () => {
  const catalog = freshCatalog([makePolicy(1, 10, "medium")]);
  const invalid = createSoundtrackCatalogSelectionView(catalog, {});
  assert.equal(invalid.status, "unavailable");
  assert.equal(invalid.reason, "invalid-selection-state");
  assert.deepEqual(invalid.entries, []);

  const unavailable = createSoundtrackCatalogSelectionView(
    readSoundtrackCatalog(null, 0),
    createSoundtrackSelectionState(),
  );
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.reason, "invalid-snapshot");
  assert.deepEqual(unavailable.entries, []);
});
