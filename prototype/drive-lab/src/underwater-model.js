const clamp01 = (value) => Number.isFinite(value)
  ? Math.min(1, Math.max(0, value))
  : 0;

export const UNDERWATER_BADGE_AMOUNT = 0.4;
export const UNDERWATER_OPEN_HZ = 18_000;
export const UNDERWATER_FLOOR_HZ = 460;

/**
 * Maps detector depth to perceived depth.
 *
 * The UI reports UNDERWATER at 0.4. The audio path must already be unmistakable
 * at that exact boundary instead of saving most of the spectral movement for
 * the last part of the brake gesture.
 */
export function underwaterAudibleDepth(amount) {
  const normalized = clamp01(amount);
  if (normalized === 0) return 0;
  if (normalized < UNDERWATER_BADGE_AMOUNT) {
    return (normalized / UNDERWATER_BADGE_AMOUNT) * 0.68;
  }
  return 0.68 + ((normalized - UNDERWATER_BADGE_AMOUNT) / (1 - UNDERWATER_BADGE_AMOUNT)) * 0.32;
}

export function underwaterEffectParameters(amount) {
  const inputDepth = clamp01(amount);
  const depth = underwaterAudibleDepth(inputDepth);
  const cutoffHz = UNDERWATER_OPEN_HZ * (
    UNDERWATER_FLOOR_HZ / UNDERWATER_OPEN_HZ
  ) ** depth;
  return Object.freeze({
    inputDepth,
    depth,
    cutoffHz,
    secondCutoffHz: Math.min(UNDERWATER_OPEN_HZ, cutoffHz * 1.08),
    q: 0.72 + depth * 2.15,
    secondQ: 0.72 + depth * 1.2,
    pressureFrequencyHz: 240,
    pressureGainDb: depth * 4.2,
    makeupGain: 1 + depth * 0.16,
  });
}
