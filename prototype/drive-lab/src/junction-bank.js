const MAGIC = "SVJCTN03";
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
  if (manifest.format !== "sedicivalvole.music-bank.v3" || manifest.score !== "junction") {
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

export function chooseJunctionMix(
  sections,
  sectionId,
  previousPrimary = null,
  random = Math.random,
  recentPrimaries = [],
) {
  const candidates = sections.filter((section) => section.id === sectionId);
  if (candidates.length < 2) return null;
  const previousPrimaryTake = typeof previousPrimary === "object" ? previousPrimary?.take : previousPrimary;
  const previousFamily = typeof previousPrimary === "object" ? previousPrimary?.family : null;
  const recentKeys = new Set(recentPrimaries.map((section) => (
    `${section.id}:${section.take}`
  )));
  const recentFamilies = new Set(recentPrimaries.map((section) => section.family).filter(Boolean));
  const recentRhythms = new Set(recentPrimaries.map((section) => section.rhythmId).filter(Boolean));
  const byRhythm = new Map();
  for (const candidate of candidates) {
    const family = candidate.family ?? "legacy";
    const rhythm = candidate.rhythmId ?? `legacy-${family}`;
    const key = `${family}:${rhythm}`;
    const group = byRhythm.get(key) ?? [];
    group.push(candidate);
    byRhythm.set(key, group);
  }
  const compatibleGroups = [...byRhythm.values()].filter((group) => group.length >= 2);
  const unseenGroups = compatibleGroups.filter((group) => (
    group[0].family !== previousFamily
    && !recentFamilies.has(group[0].family)
    && !recentRhythms.has(group[0].rhythmId)
  ));
  const freshFamilyGroups = compatibleGroups.filter((group) => group[0].family !== previousFamily);
  const groupPool = unseenGroups.length > 0
    ? unseenGroups
    : freshFamilyGroups.length > 0 ? freshFamilyGroups : compatibleGroups;
  if (groupPool.length === 0) return null;
  const compatibleCandidates = groupPool[Math.floor(randomUnit(random) * groupPool.length)];
  const primaryPool = compatibleCandidates.filter((section) => (
    section.take !== previousPrimaryTake && !recentKeys.has(`${section.id}:${section.take}`)
  ));
  const eligible = primaryPool.length > 0 ? primaryPool : compatibleCandidates;
  const primary = eligible[Math.floor(randomUnit(random) * eligible.length)];
  const secondaryPool = compatibleCandidates.filter((section) => section.take !== primary.take);
  const secondary = secondaryPool[Math.floor(randomUnit(random) * secondaryPool.length)];
  const mixStart = 0.12 + randomUnit(random) * 0.16;
  const mixEnd = 0.3 + randomUnit(random) * 0.18;
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

/**
 * Keeps the prepared ambient rest section silent on launch, then introduces
 * JUNCTION only after the vehicle is genuinely moving. Energy is normalized
 * against 130 km/h, so the fade spans 4–10 km/h and completes before the first
 * quiet break enters near 13 km/h.
 */
export function junctionMovementGain(energy) {
  const speedKmh = Math.min(130, Math.max(0, Number(energy) || 0) * 130);
  const normalized = Math.min(1, Math.max(0, (speedKmh - 4) / 6));
  return normalized * normalized * (3 - 2 * normalized);
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

export const JUNCTION_BANK_MAGIC = MAGIC;
