const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const finite = (value) => Number.isFinite(value);

/**
 * Turns trusted GPS headings into a deliberately slow lateral input.
 *
 * This is a road signal, not a replacement for an IMU: it waits for a moving
 * fix, ignores large accuracy collapses and exposes only a bounded turn rate.
 * The caller owns the position source; this module keeps no coordinates.
 */
export function createGpsCurveTracker({ now = () => performance.now() } = {}) {
  let generation = 0;
  let previous = null;
  let turnRate = 0;
  let observedAt = null;
  let quality = 0;

  function reset() {
    generation += 1;
    previous = null;
    turnRate = 0;
    observedAt = null;
    quality = 0;
  }

  function observe(reading) {
    const capturedAtMs = Number(reading?.capturedAtMs);
    const heading = Number(reading?.heading);
    const speedKmh = Number(reading?.speedKmh);
    const accuracyM = Number(reading?.accuracyM);
    if (!finite(capturedAtMs) || !finite(heading) || !finite(speedKmh)
      || speedKmh < 4 || !finite(accuracyM) || accuracyM < 0 || accuracyM > 50) {
      if (finite(capturedAtMs) && previous && capturedAtMs > previous.capturedAtMs
        && capturedAtMs - previous.capturedAtMs <= 2500) {
        turnRate += (0 - turnRate) * 0.22;
        observedAt = capturedAtMs;
      }
      return null;
    }
    const last = previous;
    previous = { capturedAtMs, heading, speedKmh, accuracyM };
    if (!last) {
      observedAt = capturedAtMs;
      quality = clamp(1 - accuracyM / 50, 0, 1);
      return null;
    }
    const deltaMs = capturedAtMs - last.capturedAtMs;
    if (!(deltaMs >= 250 && deltaMs <= 2500)) {
      observedAt = capturedAtMs;
      turnRate = 0;
      quality = clamp(1 - accuracyM / 50, 0, 1);
      return null;
    }
    const delta = ((heading - last.heading + 540) % 360) - 180;
    const measuredRate = clamp(delta / (deltaMs / 1000), -90, 90);
    const alpha = measuredRate === 0 ? 0.16 : 0.28;
    turnRate += (measuredRate - turnRate) * alpha;
    observedAt = capturedAtMs;
    quality = clamp(1 - Math.max(accuracyM, last.accuracyM) / 50, 0, 1);
      return sample(capturedAtMs);
  }

  function sample(at = now()) {
    const ageMs = observedAt == null ? null : Math.max(0, at - observedAt);
    const fresh = finite(ageMs) && ageMs <= 1500 && quality >= 0.2;
    return fresh ? {
      frame: "gps-heading",
      generation,
      ageMs,
      turnRate: Math.round(turnRate * 10) / 10,
      quality: Math.round(quality * 100) / 100,
    } : null;
  }

  return {
    reset,
    observe,
    sample,
    snapshot(at = now()) {
      const value = sample(at);
      return {
        generation,
        state: value ? "fresh" : observedAt == null ? "waiting" : "stale",
        ageMs: value?.ageMs ?? (observedAt == null ? null : Math.max(0, at - observedAt)),
        turnRate: value?.turnRate ?? 0,
        quality,
      };
    },
  };
}
