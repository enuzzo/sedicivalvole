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
 *
 * Trust is asymmetric (November 7). A constant-acceleration tracker keeps
 * "pulling" for about a second after the driver lifts, which is the most
 * audible wrong-direction error: the engine still works while the car slows.
 * When a sample falls clearly below the prediction *and* the newest two-sample
 * slope is falling too (with one whole-km/h quantum of allowance), the tracker
 * follows the measurement at once and drops any positive acceleration. Speeding
 * up still uses the gentle gains, so a launch or a pull is never exaggerated.
 *
 * Quantization bound (November 7, v8). A step of at most one whole km/h after
 * the value has held for `held` seconds proves at most one quantum per `held`
 * of acceleration; at a steady cruise such a step is the speed crossing a
 * rounding boundary. The trend is held within twice that bound, so a single
 * flip after a long hold can no longer read as a -0.6 m/s² lift, while real
 * accelerations (whose steps come at intervals matching them) pass unbounded.
 */
export const SPEED_TRACKER_POLICY = Object.freeze({
  leadSeconds: 0.25,
  horizonSeconds: 1.2,
  decaySeconds: 1.0,
  minWindowMs: 120,
  maxWindowMs: 1500,
  liftResidualKmh: 1.5,
  quantumKmh: 1,
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
        state = { v: speedKmh, a: 0, at: atMs, lastValue: speedKmh, lastChangeAt: atMs, changeMs: null, sample: speedKmh, lifts: state?.lifts ?? 0 };
        return true;
      }
      const changed = speedKmh !== state.lastValue;
      const step = Math.abs(speedKmh - state.lastValue), heldSeconds = (atMs - state.lastChangeAt) / 1000;
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
      const slope = (speedKmh + policy.quantumKmh - state.sample) / 3.6 / dt;
      const lifting = residual < -policy.liftResidualKmh && slope < Math.min(0.3, state.a - 1);
      const alpha = lifting ? 0.95 : clamp(dt / 0.35, 0.3, 0.85);
      const beta = lifting ? 1 : alpha * alpha / (2 - alpha);
      state.v = Math.max(0, predicted + alpha * residual);
      state.a = clamp(state.a + beta * residual / 3.6 / dt, -10, 6);
      if (lifting) { state.a = Math.min(state.a, 0); state.lifts++; }
      if (step <= policy.quantumKmh && heldSeconds > 0) {
        const bound = 2 * policy.quantumKmh / 3.6 / heldSeconds;
        state.a = clamp(state.a, -bound, bound);
      }
      state.at = atMs; state.sample = speedKmh;
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
    /** How many lift cues fired since creation (diagnostics and tests). */
    get liftCues() { return state?.lifts ?? 0; },
    get intervalMs() { return state?.changeMs ?? null; },
  };
}
