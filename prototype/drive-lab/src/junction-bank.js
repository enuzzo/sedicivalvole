import { NATIVE_GROOVE_SPEED_KMH } from "./low-speed-score.js";

const MAGIC = "SVJCTN04";
const HEADER_BYTES = 12;
export const JUNCTION_MAX_DECODED_CLIPS = 6;

export function junctionDecodedLimit(requestedLimit) {
  const requested = Number.isInteger(requestedLimit)
    ? requestedLimit
    : JUNCTION_MAX_DECODED_CLIPS;
  return Math.min(JUNCTION_MAX_DECODED_CLIPS, Math.max(2, requested));
}

export function parseJunctionBank(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.byteLength < HEADER_BYTES) throw new Error("JUNCTION bank header is incomplete");
  const magic = new TextDecoder().decode(bytes.subarray(0, 8));
  if (magic !== MAGIC) throw new Error("JUNCTION bank signature is invalid");
  const manifestLength = new DataView(arrayBuffer).getUint32(8, true);
  const audioOffset = HEADER_BYTES + manifestLength;
  if (audioOffset >= bytes.byteLength) throw new Error("JUNCTION bank has no audio payload");
  const manifest = JSON.parse(
    new TextDecoder().decode(bytes.subarray(HEADER_BYTES, audioOffset)),
  );
  if (manifest.format !== "sedicivalvole.music-bank.v4" || manifest.score !== "junction") {
    throw new Error("JUNCTION bank manifest is incompatible");
  }
  if (!Array.isArray(manifest.sections) || manifest.sections.length < 8) {
    throw new Error("JUNCTION bank must contain at least eight authored sections");
  }
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    throw new Error("JUNCTION bank must contain segmented audio assets");
  }
  if (manifest.maxDecodedClips !== JUNCTION_MAX_DECODED_CLIPS) {
    throw new Error("JUNCTION bank decoded-memory contract is invalid");
  }
  const assets = new Map();
  let cursor = audioOffset;
  for (const asset of manifest.assets) {
    if (typeof asset?.id !== "string" || !asset.id || assets.has(asset.id)
      || !Number.isInteger(asset.audioBytes) || asset.audioBytes <= 0) {
      throw new Error("JUNCTION bank asset manifest is invalid");
    }
    const end = cursor + asset.audioBytes;
    if (end > bytes.byteLength) throw new Error("JUNCTION bank audio payload is incomplete");
    assets.set(asset.id, {
      ...asset,
      audio: new Blob([bytes.slice(cursor, end)], { type: asset.mime }),
    });
    cursor = end;
  }
  if (cursor !== bytes.byteLength) throw new Error("JUNCTION bank has an unexpected trailing payload");
  if (manifest.sections.some((section) => (
    typeof section?.assetId !== "string" || !assets.has(section.assetId)
  ))) {
    throw new Error("JUNCTION bank section asset reference is invalid");
  }
  return {
    manifest,
    assets,
    audioBytes: bytes.byteLength - audioOffset,
  };
}

export function chooseJunctionPerformance(
  sections,
  sectionId,
  previousPerformance = null,
  random = Math.random,
  recentPerformances = [],
) {
  const candidates = sections.filter((section) => section.id === sectionId);
  if (candidates.length === 0) return sections[0] ?? null;
  const previousTake = typeof previousPerformance === "object"
    ? previousPerformance?.take
    : previousPerformance;
  const recentKeys = new Set(recentPerformances.map((section) => `${section.id}:${section.take}`));
  const unseen = candidates.filter((section) => (
    section.take !== previousTake && !recentKeys.has(`${section.id}:${section.take}`)
  ));
  const fresh = candidates.filter((section) => section.take !== previousTake);
  const pool = unseen.length > 0 ? unseen : fresh.length > 0 ? fresh : candidates;
  const value = Math.min(0.999999, Math.max(0, Number(random()) || 0));
  return pool[Math.floor(value * pool.length)];
}

export function junctionPerformanceParameters(energy, bpm) {
  const value = Math.min(1, Math.max(0, Number(energy) || 0));
  const tempo = Math.max(1, Number(bpm) || 127);
  return {
    delaySeconds: Math.min(0.5, Math.max(0.12, (60 / tempo) * 0.5)),
    feedback: 0.07 + value * 0.14,
    wet: 0.018 + value * 0.085,
    cutoff: Math.min(20000, 9500 + value * 9500),
  };
}

export function junctionSectionForEnergy(energy, braking = false) {
  const value = Math.min(1, Math.max(0, Number(energy) || 0));
  if (braking) return value > 0.6 ? "turn" : value > 0.1 ? "ease" : "rest";
  if (value < 0.1) return "rest";
  if (value < 0.34) return "open";
  if (value < 0.5) return "enter";
  if (value < 0.64) return "build";
  if (value < 0.82) return "break";
  return "full";
}

/** Inverse of the shared 130 km/h energy curve, used only for compatibility. */
export function junctionSpeedForEnergy(energy) {
  const value = Math.min(1, Math.max(0, Number(energy) || 0));
  return 130 * (1 - (1 - value) ** (1 / 2.2));
}

/**
 * The mixed native bank remains completely untouched through 20 km/h. Low-speed
 * harmony is synthesized separately, so the 127 BPM recording is never slowed,
 * relabelled or exposed early.
 */
export function junctionSectionForSpeed(speedKmh, energy, braking = false) {
  const speed = Math.max(0, Number(speedKmh) || 0);
  if (speed < NATIVE_GROOVE_SPEED_KMH) return "rest";
  if (!braking && speed < 30) return "open";
  return junctionSectionForEnergy(energy, braking);
}

export const JUNCTION_BANK_MAGIC = MAGIC;
