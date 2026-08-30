import {
  createSoundtrackCatalogSnapshot,
  readSoundtrackCatalog,
} from "./catalog-store.js";
import { evaluateJamendoTrack } from "./source-policy.js";

export const SOUNDTRACK_CATALOG_ENDPOINT = "/api/soundtrack-catalog.json";
export const SOUNDTRACK_CATALOG_API_SCHEMA = "sedicivalvole.soundtrack-catalog-api.v1";

export async function fetchSoundtrackCatalog({
  fetchImpl = globalThis.fetch,
  endpoint = SOUNDTRACK_CATALOG_ENDPOINT,
  limit = 24,
  offset = 0,
  nowMs = Date.now(),
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("catalog-fetch-unavailable");
  const url = new URL(endpoint, globalThis.location?.origin ?? "https://local.invalid");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  const response = await fetchImpl(url.href, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.schema !== SOUNDTRACK_CATALOG_API_SCHEMA || !Array.isArray(payload.tracks)) {
    throw new Error(payload?.status || "catalog-response-invalid");
  }

  const policies = payload.tracks.map(evaluateJamendoTrack);
  const snapshot = createSoundtrackCatalogSnapshot(policies, {
    fetchedAtMs: nowMs,
    revision: `${payload.fetchedAt ?? "jamendo"}:${payload.tracks.length}`,
  });
  const catalog = readSoundtrackCatalog(snapshot, nowMs);
  return Object.freeze({
    catalog,
    receivedEntries: payload.tracks.length,
    admittedEntries: snapshot.admittedEntries,
    rejectedEntries: snapshot.rejectedEntries,
    duplicateEntries: snapshot.duplicateEntries,
    source: "jamendo",
    providerCredit: "Provided by Jamendo",
    persistentAudioStorage: false,
  });
}
