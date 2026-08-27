const MAGIC = "SVJCTN02";
const HEADER_BYTES = 12;

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
  if (manifest.format !== "sedicivalvole.music-bank.v2" || manifest.score !== "junction") {
    throw new Error("JUNCTION bank manifest is incompatible");
  }
  if (!Array.isArray(manifest.sections) || manifest.sections.length < 8) {
    throw new Error("JUNCTION bank must contain at least eight authored sections");
  }
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    throw new Error("JUNCTION bank must contain segmented audio assets");
  }
  const assets = new Map();
  let cursor = audioOffset;
  for (const asset of manifest.assets) {
    if (!asset?.id || assets.has(asset.id) || !Number.isInteger(asset.audioBytes) || asset.audioBytes <= 0) {
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
  return {
    manifest,
    assets,
    audioBytes: bytes.byteLength - audioOffset,
  };
}

export function chooseJunctionVariation(sections, sectionId, previousTake = null, random = Math.random) {
  const candidates = sections.filter((section) => section.id === sectionId);
  if (candidates.length === 0) return sections[0] ?? null;
  const fresh = candidates.filter((section) => section.take !== previousTake);
  const pool = fresh.length > 0 ? fresh : candidates;
  const value = Math.min(0.999999, Math.max(0, Number(random()) || 0));
  return pool[Math.floor(value * pool.length)];
}

function randomUnit(random) {
  return Math.min(0.999999, Math.max(0, Number(random()) || 0));
}

export function chooseJunctionMix(sections, sectionId, previousPrimaryTake = null, random = Math.random) {
  const candidates = sections.filter((section) => section.id === sectionId);
  if (candidates.length < 2) return null;
  const primaryPool = candidates.filter((section) => section.take !== previousPrimaryTake);
  const eligible = primaryPool.length > 0 ? primaryPool : candidates;
  const primary = eligible[Math.floor(randomUnit(random) * eligible.length)];
  const secondaryPool = candidates.filter((section) => section.take !== primary.take);
  const secondary = secondaryPool[Math.floor(randomUnit(random) * secondaryPool.length)];
  const mixStart = 0.18 + randomUnit(random) * 0.3;
  const mixEnd = 0.52 + randomUnit(random) * 0.3;
  return { primary, secondary, mixStart, mixEnd };
}

export function junctionLiveMixParameters(energy, bpm, random = Math.random) {
  const value = Math.min(1, Math.max(0, Number(energy) || 0));
  const tempo = Math.max(1, Number(bpm) || 127);
  const subdivision = randomUnit(random) < 0.5 ? 0.5 : 0.75;
  return {
    delaySeconds: Math.min(0.5, Math.max(0.12, (60 / tempo) * subdivision)),
    feedback: 0.07 + value * 0.14 + randomUnit(random) * 0.035,
    wet: 0.018 + value * 0.085 + randomUnit(random) * 0.022,
    cutoff: Math.min(20000, 9000 + value * 9000 + randomUnit(random) * 1000),
  };
}

export function junctionSectionForEnergy(energy, braking = false) {
  const value = Math.min(1, Math.max(0, Number(energy) || 0));
  if (braking) return value > 0.6 ? "turn" : value > 0.1 ? "ease" : "rest";
  if (value < 0.1) return "rest";
  if (value < 0.24) return "open";
  if (value < 0.4) return "enter";
  if (value < 0.6) return "build";
  if (value < 0.82) return "break";
  return "full";
}

export const JUNCTION_BANK_MAGIC = MAGIC;
