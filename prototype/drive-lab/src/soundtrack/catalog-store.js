import { SOURCE_CAPABILITY } from "./source-policy.js";

export const SOUNDTRACK_CATALOG_SCHEMA = "sedicivalvole.soundtrack-catalog.v1";
export const DEFAULT_CATALOG_TTL_MS = 15 * 60 * 1000;
export const MIN_CATALOG_TTL_MS = 30 * 1000;
export const MAX_CATALOG_TTL_MS = 60 * 60 * 1000;

const asText = (value) => typeof value === "string" ? value.trim() : "";

const finiteTimestamp = (value) => Number.isFinite(value) && value >= 0
  ? value
  : null;

const boundedTtl = (value) => {
  const ttl = Number.isFinite(value) ? value : DEFAULT_CATALOG_TTL_MS;
  return Math.min(MAX_CATALOG_TTL_MS, Math.max(MIN_CATALOG_TTL_MS, Math.round(ttl)));
};

const isHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

export function isAdmittedSoundtrackPolicy(policy) {
  const item = policy?.item;
  return Boolean(
    policy?.admitted === true
    && policy.capabilities?.inAppSelection === SOURCE_CAPABILITY.ALLOW
    && policy.capabilities?.sourceStreaming === SOURCE_CAPABILITY.ALLOW
    && asText(policy.source)
    && asText(item?.id)
    && asText(item?.title)
    && asText(item?.artistName)
    && isHttpsUrl(item?.streamUrl)
    && isHttpsUrl(item?.shareUrl)
    && asText(policy.providerCredit)
    && policy.directBacklinkRequired === true
    && asText(policy.licence?.label)
    && isHttpsUrl(policy.licence?.url),
  );
}

export function soundtrackEntryKey(policy) {
  if (!isAdmittedSoundtrackPolicy(policy)) return null;
  return `${asText(policy.source).toLowerCase()}:${asText(policy.item.id)}`;
}

function createCatalogEntry(policy) {
  const key = soundtrackEntryKey(policy);
  if (!key) return null;
  return Object.freeze({
    key,
    source: asText(policy.source).toLowerCase(),
    policy,
  });
}

export function createSoundtrackCatalogSnapshot(policies, {
  fetchedAtMs = 0,
  ttlMs = DEFAULT_CATALOG_TTL_MS,
  revision = null,
} = {}) {
  const capturedAtMs = finiteTimestamp(fetchedAtMs) ?? 0;
  const safeTtlMs = boundedTtl(ttlMs);
  const entries = [];
  const seen = new Set();
  let rejectedEntries = 0;
  let duplicateEntries = 0;

  for (const policy of Array.isArray(policies) ? policies : []) {
    const entry = createCatalogEntry(policy);
    if (!entry) {
      rejectedEntries += 1;
      continue;
    }
    if (seen.has(entry.key)) {
      duplicateEntries += 1;
      continue;
    }
    seen.add(entry.key);
    entries.push(entry);
  }

  return Object.freeze({
    schema: SOUNDTRACK_CATALOG_SCHEMA,
    revision: asText(revision) || null,
    fetchedAtMs: capturedAtMs,
    expiresAtMs: capturedAtMs + safeTtlMs,
    ttlMs: safeTtlMs,
    entries: Object.freeze(entries),
    admittedEntries: entries.length,
    rejectedEntries,
    duplicateEntries,
    storage: "session-memory-metadata-only",
  });
}

export function readSoundtrackCatalog(snapshot, nowMs = 0) {
  const capturedAtMs = finiteTimestamp(nowMs) ?? 0;
  if (snapshot?.schema !== SOUNDTRACK_CATALOG_SCHEMA
    || !Array.isArray(snapshot.entries)
    || !Number.isFinite(snapshot.expiresAtMs)) {
    return Object.freeze({
      status: "unavailable",
      reason: "invalid-snapshot",
      revision: null,
      fetchedAtMs: null,
      expiresAtMs: null,
      ageMs: null,
      remainingTtlMs: 0,
      entries: Object.freeze([]),
    });
  }

  const ageMs = Math.max(0, capturedAtMs - snapshot.fetchedAtMs);
  const remainingTtlMs = Math.max(0, snapshot.expiresAtMs - capturedAtMs);
  const fresh = capturedAtMs < snapshot.expiresAtMs;
  return Object.freeze({
    status: fresh ? "fresh" : "stale",
    reason: fresh ? null : "catalog-expired",
    revision: snapshot.revision,
    fetchedAtMs: snapshot.fetchedAtMs,
    expiresAtMs: snapshot.expiresAtMs,
    ageMs,
    remainingTtlMs,
    entries: fresh ? snapshot.entries : Object.freeze([]),
  });
}

export function findSoundtrackCatalogEntry(catalog, key) {
  if (catalog?.status !== "fresh" || !asText(key)) return null;
  return catalog.entries.find((entry) => entry.key === key) ?? null;
}
