export const ACCELERATION_MACRO_MIN_SPEED_KMH = 15;
export const ACCELERATION_MACRO_ARM_MPS2 = 3;
export const ACCELERATION_MACRO_RELEASE_MPS2 = 1.5;
export const ACCELERATION_MACRO_FULL_MPS2 = 4;
export const ACCELERATION_MACRO_MAX_HOLD_MS = 4000;
export const ACCELERATION_MACRO_REFRACTORY_MS = 6000;
export const ACCELERATION_MACRO_ATTACK_SECONDS = 0.35;
export const ACCELERATION_MACRO_RELEASE_SECONDS = 1;

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
  const sideBoost = Math.pow(10, 4 / 20);
  return {
    midScoopDb: -3.5 * mix,
    airShelfDb: 2 * mix,
    width: 1 + (sideBoost - 1) * mix,
    trimGain: Math.pow(10, (-0.55 * mix) / 20),
  };
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
