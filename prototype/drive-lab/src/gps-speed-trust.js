/**
 * Speed without a usable position, September 24 owner report.
 *
 * After waking, the owner's Tesla reported every fix for minutes with a
 * 9,999.99 m accuracy radius (its "unknown" value) while `coords.speed` kept
 * the vehicle's own speed in whole km/h (0 → 7 → 26 → 31 → 45 → 58 in normal
 * urban driving). Treating the radius as a verdict on speed held the display
 * at 0 while the car drove. Position consumers (maps, curves, terrain, route)
 * keep their accuracy gate; speed is judged on its own continuity instead:
 * a sample is plausible only against the immediately previous numeric sample,
 * within a hard-braking/launch envelope plus one quantization step. A single
 * garbage value therefore fails twice (against its predecessor and its
 * successor) and is never admitted.
 */
export const POSITION_ACCURACY_LIMIT_M = 250;
export const SPEED_ONLY_MAX_ACCELERATION_MPS2 = 10;
const QUANTIZATION_KMH = 2;
const MAX_GAP_SECONDS = 3;

export function positionUnusable(accuracyM) {
  return Number.isFinite(accuracyM) && accuracyM > POSITION_ACCURACY_LIMIT_M;
}

/** `previous` is the last numeric sample as `{ kmh, atMs }`, whatever its accuracy. */
export function speedOnlyPlausible(previous, kmh, atMs) {
  if (!Number.isFinite(kmh) || kmh < 0 || kmh > 260 || !Number.isFinite(atMs)) return false;
  if (!previous || !Number.isFinite(previous.kmh) || !Number.isFinite(previous.atMs)) return false;
  const seconds = (atMs - previous.atMs) / 1000;
  if (!(seconds > 0) || seconds > MAX_GAP_SECONDS) return false;
  return Math.abs(kmh - previous.kmh) <= SPEED_ONLY_MAX_ACCELERATION_MPS2 * 3.6 * seconds + QUANTIZATION_KMH;
}
