// Rotation is an immediate visual input, never an integrated speed or road heading.
export function apertureCurveTarget(sample, speed, reducedMotion = false) {
  if (reducedMotion || !sample || sample.frame !== 'tare-relative' || !Number.isInteger(sample.generation)
    || !Number.isFinite(sample.turnRate) || !Number.isFinite(sample.ageMs) || sample.ageMs < 0 || sample.ageMs > 250
    || !Number.isFinite(speed)) return 0;
  const magnitude = Math.max(0, Math.abs(sample.turnRate) - 0.6);
  const opening = Math.max(0, Math.min(1, (speed - 5) / 35));
  return Math.sign(sample.turnRate) * Math.tanh(magnitude / 18) * 0.32 * opening;
}
export function advanceApertureCurve(current, target, seconds) {
  const dt = Number.isFinite(seconds) ? Math.max(0, Math.min(0.1, seconds)) : 0;
  return current + (target - current) * (1 - Math.exp(-dt / (target === 0 ? 0.22 : 0.14)));
}
