const MAGIC = "SVNGHT01";
const HEADER_BYTES = 12;
export const NIGHTSHIFT_MAX_DECODED_CLIPS = 6;

export function nightshiftDecodedLimit(requestedLimit) {
  const requested = Number.isInteger(requestedLimit) ? requestedLimit : NIGHTSHIFT_MAX_DECODED_CLIPS;
  return Math.min(NIGHTSHIFT_MAX_DECODED_CLIPS, Math.max(2, requested));
}

export function parseNightshiftBank(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.byteLength < HEADER_BYTES) throw new Error("NIGHTSHIFT bank header is incomplete");
  const magic = new TextDecoder().decode(bytes.subarray(0, 8));
  if (magic !== MAGIC) throw new Error("NIGHTSHIFT bank signature is invalid");
  const manifestLength = new DataView(arrayBuffer).getUint32(8, true);
  const audioOffset = HEADER_BYTES + manifestLength;
  if (audioOffset >= bytes.byteLength) throw new Error("NIGHTSHIFT bank has no audio payload");
  const manifest = JSON.parse(new TextDecoder().decode(bytes.subarray(HEADER_BYTES, audioOffset)));
  if (manifest.format !== "sedicivalvole.music-bank.v1" || manifest.score !== "nightshift") {
    throw new Error("NIGHTSHIFT bank manifest is incompatible");
  }
  if (manifest.maxDecodedClips !== NIGHTSHIFT_MAX_DECODED_CLIPS
    || manifest.barsPerPerformance !== 8
    || manifest.transitionMode !== "complete-eight-bar-boundary") {
    throw new Error("NIGHTSHIFT bank musical contract is invalid");
  }
  const assets = new Map();
  let cursor = audioOffset;
  for (const asset of manifest.assets ?? []) {
    if (typeof asset?.id !== "string" || assets.has(asset.id)
      || !Number.isInteger(asset.audioBytes) || asset.audioBytes <= 0) {
      throw new Error("NIGHTSHIFT bank asset manifest is invalid");
    }
    const end = cursor + asset.audioBytes;
    if (end > bytes.byteLength) throw new Error("NIGHTSHIFT bank audio payload is incomplete");
    assets.set(asset.id, {
      ...asset,
      audio: new Blob([bytes.slice(cursor, end)], { type: asset.mime }),
    });
    cursor = end;
  }
  if (cursor !== bytes.byteLength || assets.size !== 18) {
    throw new Error("NIGHTSHIFT bank payload is incomplete");
  }
  if ((manifest.sections ?? []).some(({ assetId }) => !assets.has(assetId))) {
    throw new Error("NIGHTSHIFT bank section asset reference is invalid");
  }
  return { manifest, assets, audioBytes: bytes.byteLength - audioOffset };
}

export function chooseNightshiftPerformance(
  sections,
  sectionId,
  previousPerformance = null,
  random = Math.random,
  recentPerformances = [],
) {
  const candidates = sections.filter((section) => section.id === sectionId);
  if (candidates.length === 0) return null;
  const previousTake = previousPerformance?.take ?? previousPerformance;
  const recent = new Set(recentPerformances.map(({ id, take }) => `${id}:${take}`));
  const fresh = candidates.filter(({ id, take }) => take !== previousTake && !recent.has(`${id}:${take}`));
  const notImmediate = candidates.filter(({ take }) => take !== previousTake);
  const pool = fresh.length > 0 ? fresh : notImmediate.length > 0 ? notImmediate : candidates;
  const value = Math.min(0.999999, Math.max(0, Number(random()) || 0));
  return pool[Math.floor(value * pool.length)];
}

export const NIGHTSHIFT_BANK_MAGIC = MAGIC;
