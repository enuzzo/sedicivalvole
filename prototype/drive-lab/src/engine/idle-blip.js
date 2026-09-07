/** Small audio-clock RPM gestures; never infer standstill from a rounded speed. */
export function createIdleBlip() {
  let nextAt = null;
  return {
    reset() { nextAt = null; },
    sample(at, eligible) {
      if (!eligible) { nextAt = null; return 0; }
      nextAt ??= at + 5;
      if (at < nextAt) return 0;
      const phase = (at - nextAt) / 0.7;
      if (phase >= 1) { nextAt = at + 5; return 0; }
      return 450 * Math.sin(Math.PI * phase) ** 2;
    },
  };
}
