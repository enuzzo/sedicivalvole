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
  let lastReceiptAt = null;
  let turnRate = 0;
  let observedAt = null;
  let quality = 0;

  function reset() {
    generation += 1;
    previous = null;
    lastReceiptAt = null;
    turnRate = 0;
    observedAt = null;
    quality = 0;
  }

  function observe(reading) {
    const { capturedAtMs, heading, speedKmh, accuracyM } = reading ?? {};
    if (!finite(capturedAtMs) || capturedAtMs < 0
      || (lastReceiptAt != null && capturedAtMs <= lastReceiptAt)) return null;
    lastReceiptAt = capturedAtMs;
    if (!finite(heading) || heading < 0 || heading >= 360 || !finite(speedKmh)
      || speedKmh < 4 || !finite(accuracyM) || accuracyM < 0 || accuracyM > 50) {
      previous = null;
      turnRate = 0;
      observedAt = null;
      quality = 0;
      return null;
    }
    const last = previous;
    const deltaMs = last ? capturedAtMs - last.capturedAtMs : null;
    // Keep the measurement anchor through fast callbacks. Replacing it on every
    // 100 ms Tesla fix prevented the old 250 ms gate from ever opening.
    if (last && deltaMs < 250) return null;
    previous = { capturedAtMs, heading, accuracyM };
    if (!last || deltaMs > 1500) {
      observedAt = capturedAtMs;
      turnRate = 0;
      quality = clamp(1 - accuracyM / 50, 0, 1);
      return null;
    }
    const delta = ((heading - last.heading + 540) % 360) - 180;
    const measuredRate = delta / (deltaMs / 1000);
    if (Math.abs(measuredRate) > 90) {
      // Rebase after an implausible heading jump without bending the tunnel.
      turnRate = 0;
      observedAt = null;
      quality = 0;
      return null;
    }
    // Preserve the 250 ms response while making it independent of GPS cadence.
    const alpha = 1 - Math.pow(1 - (measuredRate === 0 ? 0.16 : 0.28), deltaMs / 250);
    turnRate += (measuredRate - turnRate) * alpha;
    observedAt = capturedAtMs;
    quality = clamp(1 - Math.max(accuracyM, last.accuracyM) / 50, 0, 1);
    return sample(capturedAtMs);
  }

  function sample(at = now()) {
    const ageMs = observedAt == null ? null : at - observedAt;
    const fresh = finite(at) && finite(ageMs) && ageMs >= 0 && ageMs <= 1500 && quality >= 0.2;
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
