import assert from "node:assert/strict";
import test from "node:test";
import {
  buildJamendoTracksUrl,
  fetchJamendoCatalog,
  sanitizeJamendoPayload,
  SOUNDTRACK_CATALOG_API_SCHEMA,
} from "../server/jamendo-catalog-core.mjs";

const upstreamTrack = Object.freeze({
  id: "1848357",
  name: "Road Test",
  artist_id: "421168",
  artist_name: "Independent Artist",
  album_name: "Open Roads",
  license_ccurl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
  audio: "https://prod-1.storage.jamendo.com/?trackid=1848357&format=mp32",
  shareurl: "https://www.jamendo.com/track/1848357",
  image: "https://usercontent.jamendo.com?type=album&id=368084&width=300",
  audiodownload: "https://prod-1.storage.jamendo.com/download/track/1848357/mp32/",
  audiodownload_allowed: true,
  musicinfo: { speed: "high", tags: { genres: ["Rock", "rock", " Funk "] } },
});

test("the upstream request is read-only and asks for music metadata without OAuth", () => {
  const url = buildJamendoTracksUrl("fixture-client-id", { limit: 999, offset: -4 });

  assert.equal(url.origin + url.pathname, "https://api.jamendo.com/v3.0/tracks/");
  assert.equal(url.searchParams.get("client_id"), "fixture-client-id");
  assert.equal(url.searchParams.get("limit"), "50");
  assert.equal(url.searchParams.get("offset"), "0");
  assert.equal(url.searchParams.get("include"), "musicinfo");
  assert.equal(url.searchParams.get("audioformat"), "mp32");
  assert.equal(url.searchParams.has("client_secret"), false);
  assert.equal(url.searchParams.has("redirect_uri"), false);
});

test("catalog sanitation emits only the application fields and removes download data", () => {
  const result = sanitizeJamendoPayload({
    headers: { status: "success", code: 0 },
    results: [upstreamTrack, null, { name: "incomplete" }],
  }, { fetchedAt: "2026-08-31T00:00:00.000Z" });

  assert.equal(result.schema, SOUNDTRACK_CATALOG_API_SCHEMA);
  assert.equal(result.returned, 1);
  assert.equal(result.providerCredit, "Provided by Jamendo");
  assert.deepEqual(result.tracks[0].musicinfo.tags.genres, ["rock", "funk"]);
  assert.equal("speed" in result.tracks[0].musicinfo, false);
  assert.equal(JSON.stringify(result).includes("audiodownload"), false);
  assert.equal(JSON.stringify(result).includes("client"), false);
  assert.equal(result.persistentAudioStorage, false);
  assert.equal(result.automaticPlayback, false);
});

test("the fetch boundary never returns the credential or unchecked upstream fields", async () => {
  let requestUrl = null;
  const result = await fetchJamendoCatalog({
    clientId: "private-fixture-id",
    fetchImpl: async (url, options) => {
      requestUrl = url;
      assert.equal(options.method, "GET");
      return {
        ok: true,
        json: async () => ({ headers: { status: "success" }, results: [upstreamTrack] }),
      };
    },
  });

  assert.equal(requestUrl.searchParams.get("client_id"), "private-fixture-id");
  assert.equal(JSON.stringify(result).includes("private-fixture-id"), false);
  assert.equal(result.tracks.length, 1);
});

test("missing credentials and malformed upstream payloads fail closed", async () => {
  assert.throws(() => buildJamendoTracksUrl(""), /client-id-unavailable/);
  assert.throws(
    () => sanitizeJamendoPayload({ headers: { status: "failed" }, results: [] }),
    /payload-invalid/,
  );
  await assert.rejects(
    fetchJamendoCatalog({
      clientId: "fixture",
      fetchImpl: async () => ({ ok: false }),
    }),
    /http-error/,
  );
});
