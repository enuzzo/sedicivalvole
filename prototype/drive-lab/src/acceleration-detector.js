// Rolling-window hard-acceleration detection for Tesla GPS speed samples.
//
// A single derivative is too dependent on browser cadence: the same physical
// launch can arrive as five 250 ms samples or two one-second samples. This
// detector instead asks whether the vehicle has gained a meaningful amount of
// speed across a short, physically defensible window, while retaining enough
// intermediate evidence to reject a lone GPS spike.

export const ACCELERATION_WINDOW_MS = 2200;
export const ACCELERATION_STALE_MS = 1600;
export const ACCELERATION_MAX_SAMPLE_GAP_MS = 1400;
export const ACCELERATION_MIN_RISE_KMH = 30;
export const ACCELERATION_FULL_RISE_KMH = 40;
export const ACCELERATION_MIN_AVERAGE_MPS2 = 3.8;
export const ACCELERATION_RELEASE_MPS2 = 1.15;
export const ACCELERATION_RELEASE_DWELL_MS = 600;
export const ACCELERATION_MAX_HOLD_MS = 4600;
export const ACCELERATION_REFRACTORY_MS = 5000;
export const ACCELERATION_MAX_ACCURACY_M = 25;

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function createAccelerationDetectorState() {
  return {
    samples: [],
    active: false,
    triggeredAtMs: null,
    releaseCandidateAtMs: null,
    refractoryUntilMs: 0,
    lastSampleAtMs: null,
    riseKmh: 0,
    averageMps2: 0,
    intensity: 0,
  };
}

function releaseDetector(state, nowMs) {
  if (!state.active) return state;
  return {
    ...state,
    active: false,
    releaseCandidateAtMs: null,
    refractoryUntilMs: nowMs + ACCELERATION_REFRACTORY_MS,
    riseKmh: 0,
    averageMps2: 0,
    intensity: 0,
  };
}

function trajectoryFrom(samples) {
  if (samples.length < 3) return null;
  const current = samples.at(-1);
  let best = null;

  for (let startIndex = 0; startIndex <= samples.length - 3; startIndex += 1) {
    const trajectory = samples.slice(startIndex);
    const first = trajectory[0];
    const durationMs = current.capturedAtMs - first.capturedAtMs;
    if (durationMs < 450 || durationMs > ACCELERATION_WINDOW_MS) continue;

    const gaps = trajectory.slice(1).map((sample, index) => (
      sample.capturedAtMs - trajectory[index].capturedAtMs
    ));
    if (gaps.some((gap) => gap <= 0 || gap > ACCELERATION_MAX_SAMPLE_GAP_MS)) continue;

    const riseKmh = current.speedKmh - first.speedKmh;
    const averageMps2 = (riseKmh / 3.6) / (durationMs / 1000);
    if (riseKmh < ACCELERATION_MIN_RISE_KMH
      || averageMps2 < ACCELERATION_MIN_AVERAGE_MPS2) continue;

    const intermediate = trajectory.slice(1, -1);
    const hasSupportedRise = intermediate.some((sample) => (
      sample.speedKmh >= first.speedKmh + 6
      && sample.speedKmh <= current.speedKmh + 3
    ));
    const largestReversal = trajectory.slice(1).reduce((largest, sample, index) => (
      Math.max(largest, trajectory[index].speedKmh - sample.speedKmh)
    ), 0);
    if (!hasSupportedRise || largestReversal > 4) continue;

    if (!best || durationMs < best.durationMs) {
      best = { riseKmh, averageMps2, durationMs };
    }
  }
  return best;
}

function recentAverageMps2(samples) {
  if (samples.length < 2) return 0;
  const current = samples.at(-1);
  const recent = samples.filter((sample) => current.capturedAtMs - sample.capturedAtMs <= 1200);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const seconds = (current.capturedAtMs - first.capturedAtMs) / 1000;
  return seconds > 0 ? ((current.speedKmh - first.speedKmh) / 3.6) / seconds : 0;
}

export function observeAccelerationDetector(currentState, {
  speedKmh,
  capturedAtMs,
  accuracyM = null,
  braking = false,
} = {}) {
  const nowMs = Number(capturedAtMs);
  const speed = Number(speedKmh);
  let state = currentState ?? createAccelerationDetectorState();
  if (!Number.isFinite(nowMs) || !Number.isFinite(speed) || speed < 0) {
    return { state, triggered: false, released: false };
  }

  const wasActive = state.active;
  if (braking) {
    state = releaseDetector(state, nowMs);
    return { state, triggered: false, released: wasActive && !state.active };
  }

  const staleGap = state.lastSampleAtMs != null
    && nowMs - state.lastSampleAtMs > ACCELERATION_STALE_MS;
  if (staleGap) {
    state = {
      ...releaseDetector(state, nowMs),
      samples: [],
      releaseCandidateAtMs: null,
    };
  }

  if (Number.isFinite(accuracyM) && accuracyM > ACCELERATION_MAX_ACCURACY_M) {
    return {
      state: { ...state, lastSampleAtMs: nowMs },
      triggered: false,
      released: wasActive && !state.active,
    };
  }

  const sample = { speedKmh: speed, capturedAtMs: nowMs };
  const samples = [...state.samples.filter((entry) => (
    nowMs - entry.capturedAtMs <= ACCELERATION_WINDOW_MS
    && entry.capturedAtMs < nowMs
  )), sample];
  state = { ...state, samples, lastSampleAtMs: nowMs };

  if (!state.active && nowMs >= state.refractoryUntilMs) {
    const trajectory = trajectoryFrom(samples);
    if (trajectory) {
      const riseIntensity = clamp(
        (trajectory.riseKmh - ACCELERATION_MIN_RISE_KMH)
          / (ACCELERATION_FULL_RISE_KMH - ACCELERATION_MIN_RISE_KMH),
        0,
        1,
      );
      const rateIntensity = clamp(
        (trajectory.averageMps2 - ACCELERATION_MIN_AVERAGE_MPS2) / 2.4,
        0,
        1,
      );
      state = {
        ...state,
        active: true,
        triggeredAtMs: nowMs,
        releaseCandidateAtMs: null,
        riseKmh: trajectory.riseKmh,
        averageMps2: trajectory.averageMps2,
        intensity: clamp(0.35 + riseIntensity * 0.35 + rateIntensity * 0.3, 0, 1),
      };
      return { state, triggered: true, released: false };
    }
  }

  if (state.active) {
    const recentRate = recentAverageMps2(samples);
    const normalized = recentRate <= ACCELERATION_RELEASE_MPS2;
    const releaseCandidateAtMs = normalized
      ? state.releaseCandidateAtMs ?? nowMs
      : null;
    state = { ...state, releaseCandidateAtMs };
    const normalizedLongEnough = releaseCandidateAtMs != null
      && nowMs - releaseCandidateAtMs >= ACCELERATION_RELEASE_DWELL_MS;
    const timedOut = nowMs - state.triggeredAtMs >= ACCELERATION_MAX_HOLD_MS;
    if (normalizedLongEnough || timedOut) state = releaseDetector(state, nowMs);
  }

  return { state, triggered: false, released: wasActive && !state.active };
}

export function advanceAccelerationDetectorClock(currentState, {
  nowMs,
  braking = false,
} = {}) {
  const state = currentState ?? createAccelerationDetectorState();
  const now = Number(nowMs);
  if (!Number.isFinite(now)) return state;
  const stale = state.lastSampleAtMs != null
    && now - state.lastSampleAtMs > ACCELERATION_STALE_MS;
  const timedOut = state.triggeredAtMs != null
    && now - state.triggeredAtMs >= ACCELERATION_MAX_HOLD_MS;
  return braking || stale || timedOut ? releaseDetector(state, now) : state;
}

export function accelerationTrajectoryIsBloom(state) {
  return Boolean(state?.active)
    && state.riseKmh >= 34
    && state.averageMps2 >= 5.2
    && state.intensity >= 0.7;
}
