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
// September 24 owner request: the curve should read more clearly in Aperture.
export function apertureCurveTarget(sample, speed, reducedMotion = false) {
  return visualCurveTarget(sample, speed, reducedMotion) * 0.62;
}

/** Tunnel bank (radians) that leans into the curve with the depth warp. */
export const APERTURE_BANK_PER_CURVE = 0.16;

/**
 * Curve as a critically damped spring: GPS heading arrives in coarse steps,
 * and a spring keeps the lean continuous. Release toward straight is quicker.
 */
export function advanceCurveSpring(state, target, seconds) {
  const value = Number.isFinite(state?.value) ? state.value : 0;
  const velocity = Number.isFinite(state?.velocity) ? state.velocity : 0;
  const dt = Number.isFinite(seconds) ? Math.max(0, Math.min(0.1, seconds)) : 0;
  const omega = target === 0 ? 8 : 4.5;
  const offset = value - target;
  const impulse = (velocity + omega * offset) * dt;
  const decay = Math.exp(-omega * dt);
  return { value: target + (offset + impulse) * decay, velocity: (velocity - omega * impulse) * decay };
}

// Depth zero still translates: the owner requested the entire tunnel to lean
// into the curve. The bend keeps a low slope (at most 0.88 per unit depth) so
// even a hard turn never compresses the outer wall into a dark wedge; the
// bank supplies the rest of the sense of turning.
export function apertureCurveOffset(curve, depth) {
  const d = Math.max(0, Math.min(1, depth));
  return curve * (0.18 + 0.56 * d + 0.16 * d * d);
}
export function advanceApertureCurve(current, target, seconds) {
  const dt = Number.isFinite(seconds) ? Math.max(0, Math.min(0.1, seconds)) : 0;
  return current + (target - current) * (1 - Math.exp(-dt / (target === 0 ? 0.22 : 0.14)));
}
