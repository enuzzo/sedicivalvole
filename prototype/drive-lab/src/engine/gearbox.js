const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const ENGINE_ROAD_SPEED_CEILING_KMH = 130;
export const VIRTUAL_WHEEL_RADIUS_M = 0.32;
export const engineRoadSpeed = speedKmh => clamp(Number.isFinite(speedKmh) ? speedKmh : 0, 0, ENGINE_ROAD_SPEED_CEILING_KMH);

export function virtualRpm(speedKmh, gear, drivetrain) {
  // km/h -> virtual wheel RPM -> acoustic crank RPM through fixed gear/final ratios.
  // The 0.32 m rolling radius is authored; no wheel, RPM or CAN data is measured.
  const radius = Number.isFinite(drivetrain?.wheelRadiusM) && drivetrain.wheelRadiusM > 0 ? drivetrain.wheelRadiusM : VIRTUAL_WHEEL_RADIUS_M;
  const ratio = drivetrain?.gears?.[gear - 1] * drivetrain?.final_drive;
  if (!Number.isFinite(ratio) || ratio <= 0) return 1000;
  return Math.max(1000, engineRoadSpeed(speedKmh) * 1000 / (60 * 2 * Math.PI * radius) * ratio);
}

export function roadUpshiftSpeed(gear, drive, profile) {
  const base = profile.upshiftKmh?.[gear - 1];
  if (!Number.isFinite(base)) return Infinity;
  const load = clamp(((Number.isFinite(drive) ? drive : 0) - 0.35) / 0.65, 0, 1);
  // Enter the final ratio before the ceiling: filtered GPS approaches a held
  // 130 asymptotically and must not need 130.000... to complete an upshift.
  return Math.min(ENGINE_ROAD_SPEED_CEILING_KMH - 2, engineRoadSpeed(base + load * (profile.loadHoldKmh?.[gear - 1] ?? 0)));
}

/** Pick a coherent initial ratio when a bank becomes ready or GPS is reacquired. */
export function selectRoadGear(speedKmh, drive, profile) {
  if (profile.singleSpeed) return 1;
  const speed = engineRoadSpeed(speedKmh), count = profile.configuration.drivetrain.gears.length;
  let gear = 1;
  while (gear < count && speed >= roadUpshiftSpeed(gear, drive, profile)) gear++;
  return gear;
}

export function decideAutomaticGear({ gear, speedKmh, drive, canShift, heldSeconds }, profile, drivetrain) {
  if (!canShift || profile.singleSpeed || !Number.isFinite(speedKmh) || speedKmh < 0 || !Number.isFinite(heldSeconds) || heldSeconds < 1.1
    || !Number.isInteger(gear) || gear < 1 || gear > drivetrain.gears.length) return null;
  const speed = engineRoadSpeed(speedKmh), rpm = virtualRpm(speed, gear, drivetrain);
  const demand = clamp(Number.isFinite(drive) ? drive : 0, 0, 1);
  if (gear < drivetrain.gears.length && speed >= roadUpshiftSpeed(gear, demand, profile)) return { gear: gear + 1, reason: "upshift" };
  if (gear > 1) {
    const lower = virtualRpm(speed, gear - 1, drivetrain);
    if (lower < profile.configuration.engine.limiter * 0.95) {
      if (speed <= profile.downshiftKmh[gear - 2]) return { gear: gear - 1, reason: "downshift" };
      // A lower ratio must also remain below the earliest next upshift, even if
      // inferred demand falls immediately. That prevents a load-jitter gear loop.
      if (speed >= 48 && speed <= profile.upshiftKmh[gear - 2] - 5 && demand >= 0.86
        && rpm < profile.kickdown && lower < profile.configuration.engine.limiter * 0.8) return { gear: gear - 1, reason: "kickdown" };
    }
  }
  return null;
}
export function boundedRpm(rpm, profile) { return clamp(rpm, 600, profile.configuration.engine.limiter); }
