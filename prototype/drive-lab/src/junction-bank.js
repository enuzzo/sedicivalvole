const MAGIC = "SVJCTN01";
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
  if (manifest.format !== "sedicivalvole.music-bank.v1" || manifest.score !== "junction") {
    throw new Error("JUNCTION bank manifest is incompatible");
  }
  if (!Array.isArray(manifest.sections) || manifest.sections.length < 8) {
    throw new Error("JUNCTION bank must contain at least eight authored sections");
  }
  return {
    manifest,
    audio: new Blob([bytes.subarray(audioOffset)], { type: manifest.mime }),
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

export function junctionSectionForEnergy(energy, braking = false) {
  const value = Math.min(1, Math.max(0, Number(energy) || 0));
  if (braking) return value > 0.55 ? "turn" : value > 0.18 ? "ease" : "rest";
  if (value < 0.03) return "rest";
  if (value < 0.18) return "open";
  if (value < 0.35) return "enter";
  if (value < 0.55) return "build";
  if (value < 0.78) return "break";
  return "full";
}

export const JUNCTION_BANK_MAGIC = MAGIC;
