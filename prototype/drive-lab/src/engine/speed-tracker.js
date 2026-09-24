const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

/**
 * Speed trend between GPS updates, for the acoustic Engine only.
 *
 * Providers differ: some report a new Doppler speed on every ~100 ms callback,
 * others repeat a quantized value (the owner's Tesla reports whole km/h) or a
 * value that only changes about once a second. A repeated value inside the
 * provider's own update interval carries no new information, so it neither
 * resets the trend to zero nor counts as a measurement; a repeat that outlasts
 * that interval is a real constant speed. An alpha-beta tracker then keeps a
 * continuous speed and acceleration, and `predict` extrapolates briefly past
 * the last informative sample (with decay) so RPM flows between updates and
 * leads the GPS latency slightly. Predictions never go below zero and never
 * extend beyond the bounded horizon; they are an acoustic estimate, not speed.
 */
export const SPEED_TRACKER_POLICY = Object.freeze({
  leadSeconds: 0.25,
  horizonSeconds: 1.2,
  decaySeconds: 1.0,
  minWindowMs: 120,
  maxWindowMs: 1500,
});

export function createSpeedTracker(policy = SPEED_TRACKER_POLICY) {
  let state = null;
  const window = () => clamp(1.25 * (state?.changeMs ?? 0), policy.minWindowMs, policy.maxWindowMs);
  return {
    reset() { state = null; },
    /** Returns true when the sample was informative (changed or outlasted the window). */
    observe(speedKmh, atMs, reacquired = false) {
      if (!Number.isFinite(speedKmh) || !Number.isFinite(atMs)) return false;
      if (reacquired || !state || atMs < state.at) {
        state = { v: speedKmh, a: 0, at: atMs, lastValue: speedKmh, lastChangeAt: atMs, changeMs: null };
        return true;
      }
      const changed = speedKmh !== state.lastValue;
      if (changed) {
        const interval = atMs - state.lastChangeAt;
        if (interval > 0 && interval < 3000) state.changeMs = state.changeMs == null ? interval : state.changeMs + 0.3 * (interval - state.changeMs);
        state.lastChangeAt = atMs; state.lastValue = speedKmh;
      }
      const since = atMs - state.at;
      if (!changed && since < window()) return false;
      const dt = clamp(since / 1000, 0.02, 2);
      const predicted = state.v + state.a * 3.6 * dt;
      const residual = speedKmh - predicted;
      const alpha = clamp(dt / 0.35, 0.3, 0.85);
      const beta = alpha * alpha / (2 - alpha);
      state.v = Math.max(0, predicted + alpha * residual);
      state.a = clamp(state.a + beta * residual / 3.6 / dt, -10, 6);
      state.at = atMs;
      return true;
    },
    /** Seconds since the last change, used to bound the outlier test to the provider's interval. */
    outlierSeconds(atMs, sampleSeconds) {
      if (!state) return sampleSeconds;
      // Before the provider's interval is known, a held value may span up to a second.
      const bound = state.changeMs == null ? 1 : Math.max(0.15, 1.5 * state.changeMs / 1000);
      return clamp((atMs - state.lastChangeAt) / 1000, sampleSeconds, bound);
    },
    predict(nowMs) {
      if (!state) return null;
      if (state.lastValue === 0) return 0;
      const horizon = clamp((nowMs - state.at) / 1000 + policy.leadSeconds, 0, policy.horizonSeconds);
      const reach = policy.decaySeconds * (1 - Math.exp(-horizon / policy.decaySeconds));
      return Math.max(0, state.v + state.a * 3.6 * reach);
    },
    get accelerationMps2() { return state?.a ?? 0; },
    get intervalMs() { return state?.changeMs ?? null; },
  };
}
