export const ACCELERATION_MACRO_MIN_SPEED_KMH = 15;
export const ACCELERATION_MACRO_ARM_MPS2 = 3;
export const ACCELERATION_MACRO_RELEASE_MPS2 = 1.5;
export const ACCELERATION_MACRO_FULL_MPS2 = 4;
export const ACCELERATION_MACRO_MAX_HOLD_MS = 4000;
export const ACCELERATION_MACRO_REFRACTORY_MS = 6000;
export const ACCELERATION_MACRO_ATTACK_SECONDS = 0.35;
export const ACCELERATION_MACRO_RELEASE_SECONDS = 1;
export const ACCELERATION_MACRO_MIN_ACTIVE_AMOUNT = 0.62;
export const ACCELERATION_FOCUS_DRIVE = 10;

export function accelerationMacroAmount(accelerationMps2) {
  const acceleration = Number(accelerationMps2) || 0;
  return Math.min(1, Math.max(
    0,
    (acceleration - ACCELERATION_MACRO_RELEASE_MPS2)
      / (ACCELERATION_MACRO_FULL_MPS2 - ACCELERATION_MACRO_RELEASE_MPS2),
  ));
}

export function advanceAccelerationArmSamples(currentSamples, accelerationMps2, eligible = true) {
  if (!eligible || (Number(accelerationMps2) || 0) < ACCELERATION_MACRO_ARM_MPS2) return 0;
  return Math.min(2, Math.max(0, Math.floor(Number(currentSamples) || 0)) + 1);
}

export function accelerationMacroParameters(amount) {
  const mix = Math.min(1, Math.max(0, Number(amount) || 0));
  // OPEN reads as a rising intake built from the score itself. Stereo width is
  // deliberately subordinate: the moving focus band must remain obvious in a
  // near-mono car cabin, and its own shaper supplies headroom without lowering
  // the whole mix.
  const sideBoost = Math.pow(10, 0.5 / 20);
  return {
    midScoopDb: -2.5 * mix,
    airShelfDb: 3 * mix,
    airShelfFrequencyHz: 6000,
    width: 1 + (sideBoost - 1) * mix,
    trimGain: Math.pow(10, (-1 * mix) / 20),
    focusFrequencyHz: 480 * Math.pow(3200 / 480, mix),
    focusQ: 0.9,
    focusGain: 1.2 * mix,
  };
}

export function softLimitAccelerationFocusSample(sample, drive = ACCELERATION_FOCUS_DRIVE) {
  const input = Math.min(1, Math.max(-1, Number(sample) || 0));
  const safeDrive = Math.max(1, Number(drive) || ACCELERATION_FOCUS_DRIVE);
  return Math.tanh(input * safeDrive) / safeDrive;
}

export function createAccelerationFocusCurve(length = 2049) {
  const safeLength = Math.max(3, Math.floor(Number(length) || 2049));
  const curve = new Float32Array(safeLength);
  for (let index = 0; index < safeLength; index += 1) {
    const sample = (index / (safeLength - 1)) * 2 - 1;
    curve[index] = softLimitAccelerationFocusSample(sample);
  }
  return curve;
}

export function accelerationMacroTargetAmount({
  active = false,
  intensity = 0,
  averageMps2 = 0,
} = {}) {
  if (!active) return 0;
  return Math.max(
    ACCELERATION_MACRO_MIN_ACTIVE_AMOUNT,
    Math.min(1, Math.max(0, Number(intensity) || 0)),
    accelerationMacroAmount(averageMps2),
  );
}

export function advanceAccelerationMacroAmount(currentAmount, targetAmount, elapsedSeconds) {
  const current = Math.min(1, Math.max(0, Number(currentAmount) || 0));
  const target = Math.min(1, Math.max(0, Number(targetAmount) || 0));
  const duration = target > current
    ? ACCELERATION_MACRO_ATTACK_SECONDS
    : ACCELERATION_MACRO_RELEASE_SECONDS;
  const maximumStep = Math.max(0, Number(elapsedSeconds) || 0) / duration;
  if (target > current) return Math.min(target, current + maximumStep);
  return Math.max(target, current - maximumStep);
}
