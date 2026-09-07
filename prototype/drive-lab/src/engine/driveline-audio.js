const FULL_WHINE_SPEED_KMH = 5;

/** Original acoustic gate for the road-driven transmission layer, not engine loudness. */
export function drivelineAudibility({ rawSpeedKmh, speedKmh = rawSpeedKmh, freshness, neutral = false, gear = 1 } = {}) {
  if (neutral || freshness !== "fresh" || !Number.isInteger(gear) || gear < 1 || gear > 6) return 0;
  if (![rawSpeedKmh, speedKmh].every(value => Number.isFinite(value) && value > 0 && value <= 260)) return 0;
  // Raw zero wins over a lingering filtered speed; the existing audio ramp smooths changes.
  const progress = Math.min(1, Math.min(rawSpeedKmh, speedKmh) / FULL_WHINE_SPEED_KMH);
  return progress * progress * (3 - 2 * progress);
}
