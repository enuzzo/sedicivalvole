// Rotation is an immediate visual input, never an integrated speed or road heading.
export function apertureCurveTarget(sample, speed, reducedMotion = false) {
  if (reducedMotion || !sample || !Number.isInteger(sample.generation)
    || !Number.isFinite(sample.turnRate) || !Number.isFinite(sample.ageMs) || sample.ageMs < 0
    || !Number.isFinite(speed)) return 0;
  const gpsHeading = sample.frame === 'gps-heading';
  if (sample.frame !== 'tare-relative' && !gpsHeading) return 0;
  if (gpsHeading && (sample.ageMs > 1500 || !Number.isFinite(sample.quality) || sample.quality < 0.2)) return 0;
  if (!gpsHeading && sample.ageMs > 250) return 0;
  const magnitude = Math.max(0, Math.abs(sample.turnRate) - 0.6);
  const opening = Math.max(0, Math.min(1, (speed - (gpsHeading ? 8 : 5)) / (gpsHeading ? 42 : 35)));
  return Math.sign(sample.turnRate) * Math.tanh(magnitude / 18) * 0.32 * opening;
}
export function advanceApertureCurve(current, target, seconds) {
  const dt = Number.isFinite(seconds) ? Math.max(0, Math.min(0.1, seconds)) : 0;
  return current + (target - current) * (1 - Math.exp(-dt / (target === 0 ? 0.22 : 0.14)));
}
