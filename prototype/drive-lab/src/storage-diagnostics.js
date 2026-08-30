const CANARY_DATABASE = "sedicivalvole-diagnostics";
const CANARY_DATABASE_VERSION = 1;
const CANARY_STORE = "canary";
const CANARY_KEY = "persistent-storage-v1";

function errorCode(error) {
  if (typeof error?.name === "string" && error.name) return error.name.slice(0, 80);
  return "unknown-error";
}

export function nextStorageCanary(previous, identity, nowIso) {
  const createdAt = typeof previous?.createdAt === "string" ? previous.createdAt : nowIso;
  return {
    key: CANARY_KEY,
    schema: 1,
    createdAt,
    lastSeenAt: nowIso,
    seenCount: Math.max(0, Number(previous?.seenCount) || 0) + 1,
    app: {
      version: String(identity?.version ?? "unknown").slice(0, 40),
      build: String(identity?.build ?? "unknown").slice(0, 40),
      commit: String(identity?.commit ?? "unknown").slice(0, 40),
    },
    vehicleSoftware: "unavailable",
  };
}

export function summarizeStorageCanary(record, nowMs) {
  const createdAtMs = Date.parse(record?.createdAt);
  return {
    schema: record?.schema ?? null,
    createdAt: record?.createdAt ?? null,
    lastSeenAt: record?.lastSeenAt ?? null,
    seenCount: Number(record?.seenCount) || 0,
    ageMs: Number.isFinite(createdAtMs) ? Math.max(0, nowMs - createdAtMs) : null,
    app: record?.app ?? null,
    vehicleSoftware: "unavailable",
  };
}

function openDatabase(indexedDb) {
  return new Promise((resolve, reject) => {
    const request = indexedDb.open(CANARY_DATABASE, CANARY_DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(CANARY_STORE)) {
        request.result.createObjectStore(CANARY_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexeddb-open-failed"));
    request.onblocked = () => reject(new Error("indexeddb-open-blocked"));
  });
}

function readAndWriteCanary(database, identity, nowIso) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CANARY_STORE, "readwrite");
    const store = transaction.objectStore(CANARY_STORE);
    const readRequest = store.get(CANARY_KEY);
    let nextRecord = null;
    readRequest.onsuccess = () => {
      nextRecord = nextStorageCanary(readRequest.result, identity, nowIso);
      store.put(nextRecord);
    };
    readRequest.onerror = () => reject(readRequest.error ?? new Error("indexeddb-read-failed"));
    transaction.oncomplete = () => resolve(nextRecord);
    transaction.onerror = () => reject(transaction.error ?? new Error("indexeddb-write-failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("indexeddb-write-aborted"));
  });
}

export async function runStorageDiagnostics({
  identity,
  requestPersistence = false,
  indexedDb = globalThis.indexedDB,
  storageManager = globalThis.navigator?.storage,
  now = () => Date.now(),
} = {}) {
  const capturedAtMs = now();
  const nowIso = new Date(capturedAtMs).toISOString();
  const persistedAvailable = typeof storageManager?.persisted === "function";
  const persistRequestAvailable = typeof storageManager?.persist === "function";
  const estimateAvailable = typeof storageManager?.estimate === "function";
  const [persistedBeforeResult, estimateResult] = await Promise.allSettled([
    persistedAvailable ? storageManager.persisted() : Promise.resolve(null),
    estimateAvailable ? storageManager.estimate() : Promise.resolve(null),
  ]);
  const persistedBefore = persistedBeforeResult.status === "fulfilled"
    ? persistedBeforeResult.value
    : null;
  const estimate = estimateResult.status === "fulfilled" ? estimateResult.value : null;
  let persistenceGranted = persistedBefore === true;
  let persistenceError = persistedBeforeResult.status === "rejected"
    ? errorCode(persistedBeforeResult.reason)
    : null;
  let persistenceRequested = false;
  if (requestPersistence && persistedBefore !== true && persistRequestAvailable) {
    persistenceRequested = true;
    try {
      persistenceGranted = await storageManager.persist();
    } catch (error) {
      persistenceGranted = false;
      persistenceError = errorCode(error);
    }
  }

  const result = {
    capturedAt: nowIso,
    indexedDbAvailable: Boolean(indexedDb),
    indexedDbStatus: indexedDb ? "pending" : "unavailable",
    indexedDbError: null,
    persistence: {
      persistedApiAvailable: persistedAvailable,
      persistRequestAvailable,
      persistedBefore,
      requestAttempted: persistenceRequested,
      granted: persistenceGranted,
      error: persistenceError,
    },
    estimate: estimate ? {
      usageBytes: Number.isFinite(estimate.usage) ? estimate.usage : null,
      quotaBytes: Number.isFinite(estimate.quota) ? estimate.quota : null,
      usageDetails: estimate.usageDetails ?? null,
    } : null,
    canary: null,
  };
  if (!indexedDb) return result;

  let database;
  try {
    database = await openDatabase(indexedDb);
    const record = await readAndWriteCanary(database, identity, nowIso);
    result.indexedDbStatus = "read-write-pass";
    result.canary = summarizeStorageCanary(record, capturedAtMs);
  } catch (error) {
    result.indexedDbStatus = "failed";
    result.indexedDbError = errorCode(error);
  } finally {
    database?.close?.();
  }
  return result;
}
