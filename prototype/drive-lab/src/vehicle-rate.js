export const VEHICLE_RATE_STALE_MS = 700;

/** A speed derivative is valid only across one fresh measurement interval. */
export function nextVehicleRate({
  previousRateMps2 = 0,
  previousSpeedKmh = 0,
  nextSpeedKmh = 0,
  elapsedMs = 0,
} = {}) {
  const elapsed = Number(elapsedMs) || 0;
  if (elapsed <= 0 || elapsed > VEHICLE_RATE_STALE_MS) {
    return { rateMps2: 0, stale: elapsed > VEHICLE_RATE_STALE_MS };
  }
  const instantaneous = ((Number(nextSpeedKmh) - Number(previousSpeedKmh)) / 3.6)
    / (elapsed / 1000);
  return {
    rateMps2: (Number(previousRateMps2) || 0) * 0.72 + instantaneous * 0.28,
    stale: false,
  };
}
