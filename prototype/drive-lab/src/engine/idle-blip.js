const RISE = 0.3, FALL = 0.9, PEDAL = 0.22, PEAK = 1200, FALL_TAU = 0.25;
const END = Math.exp(-FALL / FALL_TAU);
const smooth = value => value * value * (3 - 2 * value);

/**
 * Small audio-clock RPM gestures; never infer standstill from a rounded speed.
 * A real blip is a throttle stab: the pedal opens for ~0.2 s, the crank rises
 * fast (~4,000 rpm/s) and falls back more slowly on a closed throttle. Within
 * the 1.2 s / +1,200 rpm contract, `throttle()` reports that pedal so the voice
 * barks on the way up instead of reading the rise as an overrun.
 *
 * The owner found a stationary engine monotonous (November 7): after the first
 * gesture at five seconds, the pause varies between 4 and 7.5 s and each blip
 * between about 70 % and 100 % of the +1,200 rpm peak, like a foot that never
 * presses the same way twice.
 */
export function createIdleBlip(random = Math.random) {
  let nextAt = null, pedal = 0, peak = PEAK, count = 0;
  const schedule = at => { count++; nextAt = at + 4 + 3.5 * random(); peak = PEAK * (0.7 + 0.3 * random()); };
  return {
    reset() { nextAt = null; pedal = 0; peak = PEAK; count = 0; },
    /** Pedal of the gesture at the last `sample`: null when no gesture is running. */
    throttle() { return pedal; },
    sample(at, eligible) {
      pedal = null;
      if (!eligible) { nextAt = null; peak = PEAK; count = 0; return 0; }
      nextAt ??= at + 5;
      if (at < nextAt) return 0;
      const t = at - nextAt;
      if (t >= RISE + FALL) { schedule(at); return 0; }
      pedal = t < PEDAL ? 0.6 * (0.6 + 0.4 * peak / PEAK) : 0;
      if (t < RISE) return peak * smooth(t / RISE);
      return peak * Math.max(0, (Math.exp(-(t - RISE) / FALL_TAU) - END) / (1 - END));
    },
  };
}
