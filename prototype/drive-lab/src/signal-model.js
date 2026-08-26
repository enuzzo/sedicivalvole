export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function speedToEnergy(speedKmh, fullEnergyKmh = 120) {
  const threshold = clamp(fullEnergyKmh, 60, 180);
  const normalized = clamp(Math.max(0, speedKmh) / threshold, 0, 1);
  return 1 - (1 - normalized) ** 2.2;
}

export function speedToBpm(speedKmh) {
  const normalized = Math.max(0, speedKmh) / 72;
  return 58 + 58 * (normalized / (1 + normalized));
}

export function speedToWave(speedKmh, fullEnergyKmh = 120) {
  const energy = speedToEnergy(speedKmh, fullEnergyKmh);
  return {
    frequencyHz: 38 + energy * 76,
    gain: 0.012 + energy * 0.068,
  };
}

export function speedToVisualVelocity(speedKmh) {
  const normalized = clamp(Math.max(0, speedKmh) / 160, 0, 1);
  return normalized ** 1.65;
}

function smoothCurve(minimum, maximum, value) {
  const normalized = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function visualVelocityToMorphWarp(visualVelocity) {
  const stagedVelocity = smoothCurve(0.08, 0.96, clamp(visualVelocity, 0, 1));
  return smoothCurve(0.04, 0.62, stagedVelocity);
}

export function energyToFlowRate(energy, speedKmh = 0) {
  const safeEnergy = clamp(energy, 0, 1);
  const velocity = speedToVisualVelocity(speedKmh);
  return 0.02 + safeEnergy ** 2.4 * 2.4 + velocity ** 2.2 * 16;
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
  return clamp(speedMps * 3.6, 0, 260);
}

export function smoothSpeed(previousKmh, nextKmh, deadbandKmh = 1.1, alpha = 0.24) {
  if (Math.abs(nextKmh - previousKmh) < deadbandKmh) return previousKmh;
  return previousKmh * (1 - alpha) + nextKmh * alpha;
}

export function applyKeyboardDelta(speedKmh, direction) {
  return clamp(speedKmh + (direction === "up" ? 5 : -5), 0, 260);
}

export function advanceDemoMotion(state, stepKmh = 2.6) {
  const speed = clamp(state?.speed ?? 0, 0, 160);
  const direction = state?.direction === -1 ? -1 : 1;
  const holdTicks = Math.max(0, Math.round(state?.holdTicks ?? 0));
  if (holdTicks > 0) return { speed, direction, holdTicks: holdTicks - 1 };

  const nextSpeed = speed + direction * stepKmh;
  if (nextSpeed >= 160) return { speed: 160, direction: -1, holdTicks: 6 };
  if (nextSpeed <= 0) return { speed: 0, direction: 1, holdTicks: 8 };
  return { speed: nextSpeed, direction, holdTicks: 0 };
}
