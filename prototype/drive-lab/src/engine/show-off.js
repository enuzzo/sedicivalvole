const idle = 1000;
const smooth = value => value * value * (3 - 2 * value);

/** Authored neutral rev phrases: variation in timing and peaks, not audio effects. */
export function createShowOff(random = Math.random) {
  let segments = [], startedAt = null, initialRpm = idle;
  const between = (min, max) => min + (max - min) * Math.max(0, Math.min(1, random()));
  return {
    reset() { segments = []; startedAt = null; },
    start(at, rpm, limiter) {
      startedAt = at; initialRpm = rpm;
      segments = [
        { duration: between(.28, .42), rpm: limiter * between(.53, .66), throttle: .9 },
        { duration: between(.35, .55), rpm: between(1800, 2500), throttle: 0 },
        { duration: between(.32, .46), rpm: limiter * between(.79, .88), throttle: 1 },
        { duration: between(.3, .5), rpm: between(2700, 3600), throttle: 0 },
        { duration: between(.34, .48), rpm: limiter, throttle: 1 },
        { duration: between(.3, .48), rpm: limiter, throttle: 1, limiter: true },
        { duration: between(.48, .65), rpm: between(2000, 2900), throttle: 0 },
        { duration: between(.24, .36), rpm: limiter * between(.62, .77), throttle: .95 },
        { duration: between(.65, .85), rpm: idle, throttle: 0 },
      ];
    },
    sample(at) {
      if (startedAt == null) return null;
      let elapsed = Math.max(0, at - startedAt), from = initialRpm;
      for (const segment of segments) {
        if (elapsed < segment.duration) {
          const phase = elapsed / segment.duration;
          const rpm = segment.limiter
            ? segment.rpm * (1 - .045 * Math.sin(elapsed * Math.PI * 8) ** 2)
            : from + (segment.rpm - from) * smooth(phase);
          return { rpm, throttle: segment.throttle, phase: segment.limiter ? 'limiter' : segment.throttle ? 'rev' : 'release' };
        }
        elapsed -= segment.duration; from = segment.rpm;
      }
      startedAt = null; segments = []; return null;
    },
  };
}
