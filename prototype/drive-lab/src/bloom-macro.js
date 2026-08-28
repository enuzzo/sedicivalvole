export const BLOOM_LAUNCH_LOW_MPS2 = 1.5;
export const BLOOM_LAUNCH_HIGH_MPS2 = 4;
export const BLOOM_LAUNCH_WINDOW_MS = 300;
export const BLOOM_REFRACTORY_MS = 25000;
export const BLOOM_GESTURE_MS = 650;

export function advanceBloomLaunchHistory(history, accelerationMps2, capturedAtMs) {
  const now = Number(capturedAtMs) || 0;
  return [...history, { accelerationMps2: Number(accelerationMps2) || 0, capturedAtMs: now }]
    .filter((sample) => now - sample.capturedAtMs <= BLOOM_LAUNCH_WINDOW_MS)
    .slice(-3);
}

export function isBloomHardLaunch(history, {
  openActive = false,
  braking = false,
  accuracyM = null,
  nowMs = 0,
  refractoryUntilMs = 0,
} = {}) {
  if (!openActive || braking || nowMs < refractoryUntilMs) return false;
  if (Number.isFinite(accuracyM) && accuracyM > 10) return false;
  if (history.length < 2) return false;
  const current = history.at(-1);
  return current.accelerationMps2 >= BLOOM_LAUNCH_HIGH_MPS2
    && history.slice(0, -1).some((sample) => sample.accelerationMps2 <= BLOOM_LAUNCH_LOW_MPS2)
    && current.capturedAtMs - history[0].capturedAtMs <= BLOOM_LAUNCH_WINDOW_MS;
}
