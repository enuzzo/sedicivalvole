export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function speedToEnergy(speedKmh) {
  return 1 - Math.exp(-Math.max(0, speedKmh) / 58);
}

export function speedToBpm(speedKmh) {
  const normalized = Math.max(0, speedKmh) / 72;
  return 58 + 58 * (normalized / (1 + normalized));
}

export function speedToWave(speedKmh) {
  const energy = speedToEnergy(speedKmh);
  return {
    frequencyHz: 42 + energy * 86,
    gain: 0.024 + energy * 0.108,
  };
}

export function normalizeGpsSpeed(speedMps) {
  if (speedMps == null || !Number.isFinite(speedMps) || speedMps < 0) return null;
  return clamp(speedMps * 3.6, 0, 260);
}

export function smoothSpeed(previousKmh, nextKmh, deadbandKmh = 1.1, alpha = 0.24) {
  if (Math.abs(nextKmh - previousKmh) < deadbandKmh) return previousKmh;
  return previousKmh * (1 - alpha) + nextKmh * alpha;
}

export function applyKeyboardDelta(speedKmh, direction) {
  return clamp(speedKmh + (direction === "up" ? 5 : -5), 0, 260);
}
