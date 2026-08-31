import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchSoundtrackCatalog,
  SOUNDTRACK_AUDIO_ENDPOINT,
  SOUNDTRACK_CATALOG_API_SCHEMA,
} from "../src/soundtrack/catalog-client.js";

const track = (id, licence = "by-nc") => ({
  id: String(id),
  name: `Track ${id}`,
  artist_id: `artist-${id}`,
  artist_name: `Artist ${id}`,
  album_name: `Album ${id}`,
  license_ccurl: `https://creativecommons.org/licenses/${licence}/4.0/`,
  audio: `https://prod-1.storage.jamendo.com/?trackid=${id}&format=mp32`,
  shareurl: `https://www.jamendo.com/track/${id}`,
  image: `https://usercontent.jamendo.com?type=album&id=${id}&width=300`,
  musicinfo: { tags: { genres: ["electronic"] } },
});

test("the client converts the same-origin response into a fresh admitted catalog", async () => {
  let request = null;
  const result = await fetchSoundtrackCatalog({
    nowMs: 1000,
    limit: 12,
    offset: 4,
    endpoint: "/api/soundtrack-catalog.php",
    fetchImpl: async (url, options) => {
      request = { url: new URL(url), options };
      return {
        ok: true,
        json: async () => ({
          schema: SOUNDTRACK_CATALOG_API_SCHEMA,
          fetchedAt: "2026-08-31T00:00:00.000Z",
          tracks: [track(1), track(2, "by-nc-nd"), track(3, "by-sa")],
        }),
      };
    },
  });

  assert.equal(request.url.pathname, "/api/soundtrack-catalog.php");
  assert.equal(request.url.searchParams.get("limit"), "12");
  assert.equal(request.url.searchParams.get("offset"), "4");
  assert.equal(request.options.cache, "no-store");
  assert.equal(request.options.credentials, "same-origin");
  assert.equal(result.catalog.status, "fresh");
  assert.deepEqual(result.catalog.entries.map((entry) => entry.key), ["jamendo:1", "jamendo:3"]);
  assert.equal(
    result.catalog.entries[0].policy.item.playbackUrl,
    `${SOUNDTRACK_AUDIO_ENDPOINT}?track=1`,
  );
  assert.equal(result.receivedEntries, 3);
  assert.equal(result.admittedEntries, 2);
  assert.equal(result.rejectedEntries, 1);
  assert.equal(result.persistentAudioStorage, false);
});

test("HTTP and schema failures do not produce a partial catalog", async () => {
  await assert.rejects(
    fetchSoundtrackCatalog({
      fetchImpl: async () => ({
        ok: false,
        json: async () => ({ status: "upstream_unavailable" }),
      }),
    }),
    /upstream_unavailable/,
  );
  await assert.rejects(
    fetchSoundtrackCatalog({
      fetchImpl: async () => ({ ok: true, json: async () => ({ tracks: [] }) }),
    }),
    /response-invalid/,
  );
});
