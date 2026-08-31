import assert from "node:assert/strict";
import test from "node:test";
import {
  buildJamendoTracksUrl,
  fetchJamendoCatalog,
  sanitizeJamendoPayload,
  SOUNDTRACK_CATALOG_API_SCHEMA,
} from "../server/jamendo-catalog-core.mjs";
import { createJamendoCatalogLoader } from "../scripts/vite-jamendo-catalog.mjs";
import { readFile } from "node:fs/promises";

const productionCatalogEndpoint = await readFile(new URL("../public/api/soundtrack-catalog.php", import.meta.url), "utf8");
const productionAudioEndpoint = await readFile(new URL("../public/api/soundtrack-audio.php", import.meta.url), "utf8");

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
  assert.equal(url.searchParams.get("groupby"), "artist_id");
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
  assert.equal(result.tracks[0].musicinfo.speed, "high");
  assert.equal(JSON.stringify(result).includes("audiodownload"), false);
  assert.equal(JSON.stringify(result).includes("client"), false);
  assert.equal(result.persistentAudioStorage, false);
  assert.equal(result.automaticPlayback, false);
});

test("official Jamendo pace and genre filters stay server-side and preserve relevance", () => {
  const url = buildJamendoTracksUrl("fixture-client-id", {
    speed: ["verylow", "low", "invalid"],
    genre: "electronic",
  });

  assert.equal(url.searchParams.get("speed"), "verylow low");
  assert.equal(url.searchParams.get("tags"), "electronic");
  assert.equal(url.searchParams.get("boost"), "popularity_total");
  assert.equal(url.searchParams.has("order"), false);
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

test("the local loader retries transient empty first pages and reuses only metadata", async () => {
  let clock = 1_000;
  let calls = 0;
  const empty = Object.freeze({ returned: 0, tracks: Object.freeze([]) });
  const populated = Object.freeze({ returned: 3, tracks: Object.freeze([upstreamTrack]) });
  const load = createJamendoCatalogLoader({
    clientId: "fixture",
    nowMs: () => clock,
    freshTtlMs: 100,
    fallbackTtlMs: 1_000,
    fetchCatalog: async () => {
      calls += 1;
      if (calls === 1) return empty;
      if (calls === 2) return populated;
      throw new Error("temporary-upstream-failure");
    },
  });

  assert.equal((await load({ limit: "24", offset: "0" })).returned, 3);
  assert.equal(calls, 2);
  assert.equal((await load({ limit: "24", offset: "0" })).returned, 3);
  assert.equal(calls, 2);

  clock += 200;
  assert.equal((await load({ limit: "24", offset: "0" })).returned, 3);
  assert.equal(calls, 3);
});

test("the local loader bounds repeated first-page empties", async () => {
  let calls = 0;
  const load = createJamendoCatalogLoader({
    clientId: "fixture",
    fetchCatalog: async () => {
      calls += 1;
      return Object.freeze({ returned: 0, tracks: Object.freeze([]) });
    },
  });

  assert.equal((await load({ limit: "24", offset: "0" })).returned, 0);
  assert.equal(calls, 4);
});

test("production endpoints keep credentials server-side and audio transient", () => {
  assert.match(productionCatalogEndpoint, /jamendo\.local\.php/);
  assert.match(productionCatalogEndpoint, /persistentAudioStorage' => false/);
  assert.match(productionCatalogEndpoint, /audioformat' => 'mp32/);
  assert.match(productionCatalogEndpoint, /\$attempt < 4/);
  assert.match(productionCatalogEndpoint, /count\(\$candidate\['results'\]\) > 0/);
  assert.match(productionCatalogEndpoint, /usleep\(120000\)/);
  assert.doesNotMatch(productionCatalogEndpoint, /client_secret/);
  assert.match(productionAudioEndpoint, /track_effects_not_admitted/);
  assert.match(productionAudioEndpoint, /'id\[\]' => \$trackId/);
  assert.match(productionAudioEndpoint, /\['id' => \$trackId\]/);
  assert.match(productionAudioEndpoint, /trim\(\(string\)\(\$candidate\['id'\]/);
  assert.match(productionAudioEndpoint, /\$attempt < 2/);
  assert.match(productionAudioEndpoint, /Cache-Control: no-store/);
  assert.match(productionAudioEndpoint, /Cross-Origin-Resource-Policy: same-origin/);
  assert.match(productionAudioEndpoint, /CURLOPT_PROTOCOLS => CURLPROTO_HTTPS/);
  assert.doesNotMatch(productionAudioEndpoint, /file_put_contents|fopen\s*\([^,]+,\s*['\"]w/);
});
