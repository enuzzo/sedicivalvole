// One freshness/quality boundary for the three original road-reactive fields.
// Rotation is a visual input, never integrated into vehicle speed or position.
export function visualCurveTarget(sample, speed, reducedMotion = false) {
  if (reducedMotion || !sample || !Number.isInteger(sample.generation)
    || !Number.isFinite(sample.turnRate) || !Number.isFinite(sample.ageMs) || sample.ageMs < 0
    || !Number.isFinite(speed)) return 0;
  const gpsHeading = sample.frame === 'gps-heading';
  if (sample.frame !== 'tare-relative' && !gpsHeading) return 0;
  if (gpsHeading && (sample.ageMs > 1500 || !Number.isFinite(sample.quality) || sample.quality < 0.2)) return 0;
  if (!gpsHeading && sample.ageMs > 250) return 0;
  const magnitude = Math.max(0, Math.abs(sample.turnRate) - 0.6);
  const opening = Math.max(0, Math.min(1, (speed - (gpsHeading ? 8 : 5)) / (gpsHeading ? 42 : 35)));
  return Math.sign(sample.turnRate) * Math.tanh(magnitude / 18) * opening;
}
export function apertureCurveTarget(sample, speed, reducedMotion = false) {
  return visualCurveTarget(sample, speed, reducedMotion) * 0.46;
}

// Depth zero still translates: the owner requested the entire tunnel to lean
// into the curve, with a stronger progressive bend through the middle distance.
export function apertureCurveOffset(curve, depth) {
  const d = Math.max(0, Math.min(1, depth));
  return curve * (0.16 + 0.5 * d + 0.64 * d * d);
}
export function advanceApertureCurve(current, target, seconds) {
  const dt = Number.isFinite(seconds) ? Math.max(0, Math.min(0.1, seconds)) : 0;
  return current + (target - current) * (1 - Math.exp(-dt / (target === 0 ? 0.22 : 0.14)));
}
