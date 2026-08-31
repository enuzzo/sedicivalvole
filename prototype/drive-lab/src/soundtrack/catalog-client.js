import {
  createSoundtrackCatalogSnapshot,
  readSoundtrackCatalog,
} from "./catalog-store.js";
import { evaluateIlloboTrack, evaluateJamendoTrack } from "./source-policy.js";

export const SOUNDTRACK_CATALOG_ENDPOINT = "/api/soundtrack-catalog.php";
export const SOUNDTRACK_AUDIO_ENDPOINT = "/api/soundtrack-audio.php";
export const SOUNDTRACK_CATALOG_API_SCHEMA = "sedicivalvole.soundtrack-catalog-api.v1";
export const ILLOBO_CATALOG_ENDPOINT = "/audio/illobo/catalog.json";
export const ILLOBO_CATALOG_SCHEMA = "sedicivalvole.illobo-public-catalog.v1";

const routePolicyThroughAudioRelay = (policy) => {
  if (!policy?.admitted || !policy.item?.id) return policy;
  const playbackUrl = `${SOUNDTRACK_AUDIO_ENDPOINT}?track=${encodeURIComponent(policy.item.id)}`;
  return Object.freeze({
    ...policy,
    item: Object.freeze({ ...policy.item, playbackUrl }),
  });
};

export async function fetchSoundtrackCatalog({
  fetchImpl = globalThis.fetch,
  endpoint = null,
  limit = 24,
  offset = 0,
  speed = [],
  genre = null,
  selection = null,
  nowMs = Date.now(),
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("catalog-fetch-unavailable");
  const featured = selection?.kind === "featured";
  const selectedEndpoint = endpoint || (featured ? ILLOBO_CATALOG_ENDPOINT : SOUNDTRACK_CATALOG_ENDPOINT);
  const url = new URL(selectedEndpoint, globalThis.location?.origin ?? "https://local.invalid");
  if (!featured) {
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
  }
  const speeds = (Array.isArray(speed) ? speed : String(speed ?? "").split(/[\s,+]+/))
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean);
  if (!featured && speeds.length) url.searchParams.set("speed", speeds.join(" "));
  if (!featured && genre) url.searchParams.set("genre", String(genre).trim().toLowerCase());
  const response = await fetchImpl(url.href, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => null);
  const expectedSchema = featured ? ILLOBO_CATALOG_SCHEMA : SOUNDTRACK_CATALOG_API_SCHEMA;
  if (!response.ok || payload?.schema !== expectedSchema || !Array.isArray(payload.tracks)) {
    throw new Error(payload?.status || "catalog-response-invalid");
  }

  const policies = payload.tracks.map((track) => featured
    ? evaluateIlloboTrack(track)
    : routePolicyThroughAudioRelay(evaluateJamendoTrack(track)));
  const snapshot = createSoundtrackCatalogSnapshot(policies, {
    fetchedAtMs: nowMs,
    revision: `${payload.generatedAt ?? payload.fetchedAt ?? (featured ? "illobo" : "jamendo")}:${payload.tracks.length}`,
  });
  const catalog = readSoundtrackCatalog(snapshot, nowMs);
  return Object.freeze({
    catalog,
    receivedEntries: payload.tracks.length,
    admittedEntries: snapshot.admittedEntries,
    rejectedEntries: snapshot.rejectedEntries,
    duplicateEntries: snapshot.duplicateEntries,
    source: featured ? "illobo" : "jamendo",
    providerCredit: featured ? "Illobo · artist-authorized recording" : "Provided by Jamendo",
    selection: Object.freeze({
      kind: featured ? "featured" : (selection?.kind || "library"),
      id: featured ? "signal-border" : (selection?.id || "all"),
      speed: Object.freeze(speeds),
      genre: genre || null,
    }),
    persistentAudioStorage: false,
  });
}
