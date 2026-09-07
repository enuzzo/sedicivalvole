const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function virtualRpm(speedKmh, gear, drivetrain) {
  // Road km/h -> virtual wheel RPM -> acoustic crank RPM; virtual radius: 0.25 m.
  return Math.max(1000, Math.max(0, speedKmh) * 1000 / (60 * 2 * Math.PI * 0.25)
    * drivetrain.gears[gear - 1] * drivetrain.final_drive);
}
export function decideAutomaticGear({ gear, speedKmh, drive, canShift, heldSeconds }, profile, drivetrain) {
  if (!canShift || heldSeconds < 1.1) return null;
  const rpm = virtualRpm(speedKmh, gear, drivetrain);
  if (gear < drivetrain.gears.length && speedKmh >= profile.upshiftKmh[gear - 1]) return { gear: gear + 1, reason: "upshift" };
  if (gear > 1) {
    const lower = virtualRpm(speedKmh, gear - 1, drivetrain);
    if (lower < profile.configuration.engine.limiter * 0.95) {
      if (speedKmh <= profile.downshiftKmh[gear - 2]) return { gear: gear - 1, reason: "downshift" };
      if (speedKmh <= profile.upshiftKmh[gear - 2] * .85 && drive >= 0.85 && rpm < profile.kickdown && lower < profile.up * 0.94) return { gear: gear - 1, reason: "kickdown" };
    }
  }
  return null;
}
export function boundedRpm(rpm, profile) { return clamp(rpm, 1000, profile.configuration.engine.limiter); }
