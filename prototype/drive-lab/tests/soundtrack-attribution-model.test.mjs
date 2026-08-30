import assert from "node:assert/strict";
import test from "node:test";
import {
  createSoundtrackCredit,
  deriveSoundtrackAttribution,
  SOUNDTRACK_ATTRIBUTION_SCHEMA,
} from "../src/soundtrack/attribution-model.js";
import {
  createSoundtrackCatalogSnapshot,
  readSoundtrackCatalog,
} from "../src/soundtrack/catalog-store.js";
import { evaluateJamendoTrack } from "../src/soundtrack/source-policy.js";
import {
  createSoundtrackTransitionState,
  scheduleSoundtrackTransition,
  SOUNDTRACK_SKIP_CROSSFADE_SECONDS,
} from "../src/soundtrack/transition-model.js";

const makePolicy = (id, artistId, options = {}) => evaluateJamendoTrack({
  id: String(id),
  name: options.title ?? `Track ${id}`,
  artist_id: String(artistId),
  artist_name: options.artistName ?? `Artist ${artistId}`,
  album_name: options.albumName === undefined ? `Album ${artistId}` : options.albumName,
  license_ccurl: options.licence ?? "https://creativecommons.org/licenses/by-nc-sa/3.0/",
  audio: `https://prod-1.storage.jamendo.com/?trackid=${id}&format=mp32`,
  shareurl: `https://www.jamendo.com/track/${id}`,
  image: options.image === undefined
    ? `https://usercontent.jamendo.com?type=album&id=${artistId}&width=300`
    : options.image,
});

const makeEntries = (...policies) => readSoundtrackCatalog(
  createSoundtrackCatalogSnapshot(policies, {
    fetchedAtMs: 1000,
    revision: "credits-a",
  }),
  1001,
).entries;

const transition = (from, to, startAt = 1) => scheduleSoundtrackTransition({
  state: createSoundtrackTransitionState(from, 0),
  targetKey: to,
  startAt,
}).state;

test("credit projection keeps required source facts and removes the stream URL", () => {
  const entries = makeEntries(makePolicy(1, 10));
  const credit = createSoundtrackCredit(entries[0]);

  assert.equal(credit.key, "jamendo:1");
  assert.equal(credit.source, "jamendo");
  assert.equal(credit.title, "Track 1");
  assert.equal(credit.artistName, "Artist 10");
  assert.equal(credit.albumName, "Album 10");
  assert.equal(credit.providerCredit, "Provided by Jamendo");
  assert.equal(credit.directContentUrl, "https://www.jamendo.com/track/1");
  assert.equal(credit.qrDestination, credit.directContentUrl);
  assert.equal(credit.licence.label, "CC BY-NC-SA 3.0");
  assert.equal(credit.licence.url, "https://creativecommons.org/licenses/by-nc-sa/3.0/");
  assert.deepEqual(credit.obligations, [
    "attribution",
    "noncommercial-only",
    "share-adaptations-alike",
  ]);
  assert.equal(credit.directBacklinkRequired, true);
  assert.equal(JSON.stringify(credit).includes("storage.jamendo.com"), false);
});

test("the primary credit follows the actually dominant deck through a crossfade", () => {
  const entries = makeEntries(makePolicy(1, 10), makePolicy(2, 20));
  const state = transition("jamendo:1", "jamendo:2");
  const before = deriveSoundtrackAttribution({ transitionState: state, at: 1, entries });
  const midpoint = deriveSoundtrackAttribution({
    transitionState: state,
    at: 1 + SOUNDTRACK_SKIP_CROSSFADE_SECONDS * 0.5,
    entries,
  });
  const after = deriveSoundtrackAttribution({ transitionState: state, at: state.endAt, entries });

  assert.equal(before.status, "audible");
  assert.equal(before.primary.key, "jamendo:1");
  assert.deepEqual(before.secondary, []);
  assert.equal(midpoint.status, "transitioning");
  assert.equal(midpoint.primary.key, "jamendo:2", "the requested target wins an equal-gain tie");
  assert.equal(midpoint.primary.isTarget, true);
  assert.deepEqual(midpoint.secondary.map((item) => item.key), ["jamendo:1"]);
  assert.deepEqual(midpoint.audibleKeys, ["jamendo:2", "jamendo:1"]);
  assert.deepEqual(midpoint.providerCredits, ["Provided by Jamendo"]);
  assert.equal(after.status, "audible");
  assert.equal(after.primary.key, "jamendo:2");
  assert.deepEqual(after.secondary, []);
});

test("rapid retargeting can expose all three genuinely audible credits", () => {
  const entries = makeEntries(makePolicy(1, 10), makePolicy(2, 20), makePolicy(3, 30));
  const first = transition("jamendo:1", "jamendo:2");
  const second = scheduleSoundtrackTransition({
    state: first,
    targetKey: "jamendo:3",
    startAt: 1 + SOUNDTRACK_SKIP_CROSSFADE_SECONDS * 0.5,
  }).state;
  const attribution = deriveSoundtrackAttribution({
    transitionState: second,
    at: second.startAt + second.durationSeconds * 0.5,
    entries,
  });

  assert.equal(attribution.status, "transitioning");
  assert.equal(attribution.transitioning, true);
  assert.equal(attribution.primary.key, "jamendo:3");
  assert.equal(attribution.primary.isTarget, true);
  assert.equal(attribution.secondary.length, 2);
  assert.deepEqual(
    new Set(attribution.audibleKeys),
    new Set(["jamendo:1", "jamendo:2", "jamendo:3"]),
  );
  assert.equal(attribution.playbackAllowed, true);
  assert.equal(attribution.streamUrlsExposed, false);
  assert.equal(attribution.automaticModeFallback, false);
});

test("a missing audible credit fails closed instead of showing stale metadata", () => {
  const entries = makeEntries(makePolicy(1, 10));
  const state = transition("jamendo:1", "jamendo:2");
  const attribution = deriveSoundtrackAttribution({
    transitionState: state,
    at: 1 + SOUNDTRACK_SKIP_CROSSFADE_SECONDS * 0.5,
    entries,
  });

  assert.equal(attribution.status, "incomplete-attribution");
  assert.equal(attribution.playbackAllowed, false);
  assert.equal(attribution.creditDisplayRequired, true);
  assert.deepEqual(attribution.missingCreditKeys, ["jamendo:2"]);
  assert.equal(attribution.primary.key, "jamendo:1");
  assert.equal(attribution.primary.isTarget, false);
});

test("optional album and artwork fail quietly without weakening core credit", () => {
  const entries = makeEntries(makePolicy(1, 10, { albumName: "", image: "" }));
  const credit = createSoundtrackCredit(entries[0]);

  assert.equal(credit.albumName, null);
  assert.equal(credit.imageUrl, null);
  assert.equal(credit.title, "Track 1");
  assert.equal(credit.artistName, "Artist 10");
  assert.ok(credit.directContentUrl);
  assert.ok(credit.licence.url);
});

test("unadmitted or malformed entries never become display credit", () => {
  const denied = makePolicy(1, 10, {
    licence: "https://creativecommons.org/licenses/by-nd/4.0/",
  });
  assert.equal(denied.admitted, false);
  assert.equal(createSoundtrackCredit({ key: "jamendo:1", source: "jamendo", policy: denied }), null);
  assert.equal(createSoundtrackCredit(null), null);
});

test("invalid transition evidence yields a bounded non-playing attribution state", () => {
  const result = deriveSoundtrackAttribution({ transitionState: null, at: 0, entries: [] });

  assert.equal(result.schema, SOUNDTRACK_ATTRIBUTION_SCHEMA);
  assert.equal(result.status, "invalid-transition");
  assert.equal(result.playbackAllowed, false);
  assert.equal(result.creditDisplayRequired, false);
  assert.equal(result.primary, null);
  assert.deepEqual(result.secondary, []);
  assert.deepEqual(result.audibleKeys, []);
  assert.equal(Object.isFrozen(result), true);
});
