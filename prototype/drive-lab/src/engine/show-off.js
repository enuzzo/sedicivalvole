const DEFAULT_IDLE = 600;
const smooth = value => value * value * (3 - 2 * value);
// A closed throttle in neutral: friction and pumping drag hardest at high rpm,
// so the crank falls fast at first and slows toward idle (about 1,500-4,000
// rpm/s on real engines), never with the symmetric ease of a rise.
const fall = value => 1 - Math.pow(1 - value, 2.2);
const FALL_STRETCH = 1.25;

/** Authored neutral rev phrases: variation in timing and peaks, not audio effects. */
export function createShowOff(random = Math.random) {
  let segments = [], startedAt = null, initialRpm = DEFAULT_IDLE, flutters = true;
  const between = (min, max) => min + (max - min) * Math.max(0, Math.min(1, random()));
  return {
    reset() { segments = []; startedAt = null; },
    start(at, rpm, limiter, idle = DEFAULT_IDLE, { flutter = true } = {}) {
      startedAt = at; initialRpm = rpm; flutters = flutter;
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
      ].map(segment => segment.throttle === 0 ? { ...segment, duration: segment.duration * FALL_STRETCH } : segment);
    },
    sample(at) {
      if (startedAt == null) return null;
      let elapsed = Math.max(0, at - startedAt), from = initialRpm;
      for (const segment of segments) {
        if (elapsed < segment.duration) {
          const phase = elapsed / segment.duration;
          const rpm = segment.limiter && flutters
            ? segment.rpm * (1 - .045 * Math.sin(elapsed * Math.PI * 8) ** 2)
            : from + (segment.rpm - from) * (segment.throttle === 0 && segment.rpm < from ? fall(phase) : smooth(phase));
          return { rpm, throttle: segment.throttle, phase: segment.limiter ? 'limiter' : segment.throttle ? 'rev' : 'release' };
        }
        elapsed -= segment.duration; from = segment.rpm;
      }
      startedAt = null; segments = []; return null;
    },
  };
}
