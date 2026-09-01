export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const ROAD_SPEED_CEILING_KMH = 130;
export const DISPLAY_SPEED_SANITY_CEILING_KMH = 260;
export const MODEL_3_AWD_REFERENCE = Object.freeze({
  label: "Model 3 Long Range AWD Highland reference",
  curbMassKg: 1824,
  zeroToHundredSeconds: 4.4,
  estimatedBrakeForceN: 5600,
  pedalRampSeconds: 0.32,
  estimatedPeakRegenerativeDecelerationMps2: 1.7,
  rollingResistanceDecelerationMps2: 0.1,
  liftOffRampSeconds: 0.45,
  vehicleHoldCaptureKmh: 0.8,
});

export function speedToEnergy(speedKmh) {
  const normalized = clamp(Math.max(0, speedKmh) / ROAD_SPEED_CEILING_KMH, 0, 1);
  return 1 - (1 - normalized) ** 2.2;
}

export function speedToBpm(speedKmh) {
  const normalized = clamp(Math.max(0, speedKmh), 0, ROAD_SPEED_CEILING_KMH) / 72;
  return 58 + 58 * (normalized / (1 + normalized));
}

export function speedToWave(speedKmh) {
  const energy = speedToEnergy(speedKmh);
  return {
    frequencyHz: 38 + energy * 76,
    gain: 0.012 + energy * 0.068,
  };
}

export function speedToVisualVelocity(speedKmh) {
  const normalized = clamp(Math.max(0, speedKmh) / ROAD_SPEED_CEILING_KMH, 0, 1);
  return normalized ** 1.1;
}

function smoothCurve(minimum, maximum, value) {
  const normalized = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function visualVelocityToMorphWarp(visualVelocity) {
  return smoothCurve(0.02, 0.92, clamp(visualVelocity, 0, 1)) ** 1.05;
}

export function energyToFlowRate(energy, speedKmh = 0) {
  const safeEnergy = clamp(energy, 0, 1);
  const safeSpeed = clamp(Math.max(0, speedKmh) / ROAD_SPEED_CEILING_KMH, 0, 1);
  const baseFlow = (safeSpeed ** 1.6) * 14.5;
  const energyFlow = (safeEnergy ** 2.2) * 1.8;
  return 0.02 + baseFlow + energyFlow;
}

export function speedToMotion(previousSpeedKmh, nextSpeedKmh, elapsedSeconds) {
  const elapsed = clamp(elapsedSeconds, 0.08, 2);
  const rateKmhPerSecond = clamp((nextSpeedKmh - previousSpeedKmh) / elapsed, -60, 60);
  return {
    rateKmhPerSecond,
    acceleration: clamp(rateKmhPerSecond / 24, 0, 1),
    deceleration: clamp(-rateKmhPerSecond / 18, 0, 1),
  };
}

const SECTION_ENTER = [0.16, 0.4, 0.68];
const SECTION_EXIT = [0.1, 0.31, 0.56];

export function energyToSection(energy, currentSection = 0) {
  const safeEnergy = clamp(energy, 0, 1);
  const safeSection = Math.round(clamp(currentSection, 0, 3));
  if (safeSection < 3 && safeEnergy >= SECTION_ENTER[safeSection]) return safeSection + 1;
  if (safeSection > 0 && safeEnergy < SECTION_EXIT[safeSection - 1]) return safeSection - 1;
  return safeSection;
}

export function normalizeGpsSpeed(speedMps) {
  if (speedMps == null || !Number.isFinite(speedMps) || speedMps < 0) return null;
  return clamp(speedMps * 3.6, 0, DISPLAY_SPEED_SANITY_CEILING_KMH);
}

export function smoothSpeed(previousKmh, nextKmh, deadbandKmh = 1.1, alpha = 0.24) {
  if (Math.abs(nextKmh - previousKmh) < deadbandKmh) return previousKmh;
  return previousKmh * (1 - alpha) + nextKmh * alpha;
}

export function model3AwdAccelerationMps2(
  speedKmh,
  massKg = MODEL_3_AWD_REFERENCE.curbMassKg,
) {
  const safeMass = clamp(massKg, 1200, 2600);
  const normalizedToHundred = clamp(Math.max(0, speedKmh) / 100, 0, 1.3);
  const referenceAcceleration = Math.max(
    0.75,
    7.6 - 2.8 * normalizedToHundred ** 1.35,
  );
  return referenceAcceleration * MODEL_3_AWD_REFERENCE.curbMassKg / safeMass;
}

export function model3AwdBrakeDecelerationMps2(
  speedKmh,
  heldSeconds = MODEL_3_AWD_REFERENCE.pedalRampSeconds,
  massKg = MODEL_3_AWD_REFERENCE.curbMassKg,
) {
  const safeMass = clamp(massKg, 1200, 2600);
  const speedForce = 0.58 + 0.42 * smoothCurve(0, 12, Math.max(0, speedKmh));
  const pedal = smoothCurve(0, MODEL_3_AWD_REFERENCE.pedalRampSeconds, Math.max(0, heldSeconds));
  return MODEL_3_AWD_REFERENCE.estimatedBrakeForceN * speedForce * pedal / safeMass;
}

export function model3AwdLiftOffDecelerationMps2(
  speedKmh,
  releasedSeconds = MODEL_3_AWD_REFERENCE.liftOffRampSeconds,
  massKg = MODEL_3_AWD_REFERENCE.curbMassKg,
) {
  const safeMass = clamp(massKg, 1200, 2600);
  const speedFactor = 0.48 + 0.52 * smoothCurve(3, 28, Math.max(0, speedKmh));
  const release = smoothCurve(
    0,
    MODEL_3_AWD_REFERENCE.liftOffRampSeconds,
    Math.max(0, releasedSeconds),
  );
  const regenerativeDeceleration = MODEL_3_AWD_REFERENCE.estimatedPeakRegenerativeDecelerationMps2
    * speedFactor
    * release
    * MODEL_3_AWD_REFERENCE.curbMassKg
    / safeMass;
  return MODEL_3_AWD_REFERENCE.rollingResistanceDecelerationMps2
    + regenerativeDeceleration;
}

export function gpsSpeedTolerance(speedKmh, elapsedSeconds = 1) {
  const safeSpeed = clamp(Math.max(0, speedKmh), 0, 260);
  const elapsed = clamp(elapsedSeconds, 0.08, 2);
  const sensorAllowanceKmh = 1.1 + safeSpeed * 0.008;
  return {
    sensorAllowanceKmh,
    riseKmh: model3AwdAccelerationMps2(safeSpeed) * elapsed * 3.6 + sensorAllowanceKmh,
    liftOffFallKmh: model3AwdLiftOffDecelerationMps2(safeSpeed, 1) * elapsed * 3.6
      + sensorAllowanceKmh,
    fallKmh: model3AwdBrakeDecelerationMps2(safeSpeed, 1) * elapsed * 3.6 * 1.75
      + sensorAllowanceKmh,
  };
}

export function smoothGpsSpeed(previousKmh, nextKmh, elapsedSeconds = 1) {
  const previous = clamp(Math.max(0, previousKmh), 0, 260);
  const next = clamp(Math.max(0, nextKmh), 0, 260);
  const tolerance = gpsSpeedTolerance(previous, elapsedSeconds);
  const difference = next - previous;
  if (Math.abs(difference) <= tolerance.sensorAllowanceKmh) return previous;

  const boundedDifference = clamp(difference, -tolerance.fallKmh, tolerance.riseKmh);
  const plausible = difference === boundedDifference;
  const ordinaryMotion = difference >= 0
    ? difference <= tolerance.riseKmh
    : -difference <= tolerance.liftOffFallKmh;
  const alpha = !plausible ? 0.18 : ordinaryMotion ? 0.55 : 0.68;
  return clamp(previous + boundedDifference * alpha, 0, 260);
}

export function advanceDemoMotion(
  state,
  elapsedSeconds = 0.18,
  brakeHeld = false,
  driveInput = "auto",
) {
  const speed = clamp(state?.speed ?? 0, 0, DISPLAY_SPEED_SANITY_CEILING_KMH);
  const elapsed = clamp(elapsedSeconds, 1 / 240, 0.25);
  const input = brakeHeld
    ? "brake"
    : driveInput === "accelerator" || driveInput === "regen"
      ? driveInput
      : "auto";
  const direction = input === "accelerator"
    ? 1
    : input === "brake" || input === "regen" || state?.direction === -1
      ? -1
      : 1;
  const holdSeconds = Math.max(0, Number(state?.holdSeconds) || 0);
  const brakeHeldSeconds = input === "brake"
    ? Math.max(0, Number(state?.brakeHeldSeconds) || 0) + elapsed
    : 0;
  const liftOffSeconds = input === "regen" || (input === "auto" && direction < 0)
    ? Math.max(0, Number(state?.liftOffSeconds) || 0) + elapsed
    : 0;
  const launchSeconds = direction > 0
    ? Math.max(0, Number(state?.launchSeconds) || 0) + elapsed
    : 0;

  if (direction < 0 && speed <= MODEL_3_AWD_REFERENCE.vehicleHoldCaptureKmh) {
    return input === "brake" || input === "regen"
      ? {
        speed: 0,
        direction: -1,
        holdSeconds: 0,
        brakeHeldSeconds,
        liftOffSeconds,
        launchSeconds: 0,
      }
      : {
        speed: 0,
        direction: 0, // Stay stopped
        holdSeconds: 0,
        brakeHeldSeconds: 0,
        liftOffSeconds: 0,
        launchSeconds: 0,
      };
  }
  // `auto` means no driver input, and the simulator then holds the speed it was
  // left at. It never stages a drive of its own: acceleration comes only from a
  // held accelerator, deceleration only from the lift-off curve or the brake.
  // Without this the demo drove itself, which made the score's response to the
  // driver impossible to judge.
  if (input === "auto") {
    return {
      speed,
      direction: 0,
      holdSeconds: Math.max(0, holdSeconds - elapsed),
      brakeHeldSeconds: 0,
      liftOffSeconds: 0,
      launchSeconds: 0,
    };
  }

  const rateMps2 = input === "brake"
    ? -model3AwdBrakeDecelerationMps2(speed, brakeHeldSeconds)
    : direction > 0
      ? model3AwdAccelerationMps2(speed)
      : -model3AwdLiftOffDecelerationMps2(speed, liftOffSeconds);
  const nextSpeed = speed + rateMps2 * elapsed * 3.6;
  if (nextSpeed >= ROAD_SPEED_CEILING_KMH) {
    if (input === "accelerator") {
      return {
        speed: ROAD_SPEED_CEILING_KMH,
        direction: 1,
        holdSeconds: 0,
        brakeHeldSeconds: 0,
        liftOffSeconds: 0,
        launchSeconds,
      };
    }
    return {
      speed: ROAD_SPEED_CEILING_KMH,
      direction: 1, // Stay at ceiling
      holdSeconds: 0,
      brakeHeldSeconds: 0,
      liftOffSeconds: 0,
      launchSeconds: 0,
    };
  }
  if (nextSpeed <= 0) {
    return input === "brake" || input === "regen"
      ? { speed: 0, direction: -1, holdSeconds: 0, brakeHeldSeconds, liftOffSeconds, launchSeconds: 0 }
      : {
        speed: 0,
        direction: 1,
        holdSeconds: 1.44,
        brakeHeldSeconds: 0,
        liftOffSeconds: 0,
        launchSeconds: 0,
      };
  }
  return {
    speed: nextSpeed,
    direction,
    holdSeconds: 0,
    brakeHeldSeconds,
    liftOffSeconds,
    launchSeconds,
  };
}
