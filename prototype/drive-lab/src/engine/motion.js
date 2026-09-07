const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const ENGINE_MOTION_POLICY = Object.freeze({ freshMs: 1800, lostMs: 5000, positionAccuracyM: 250, smoothingSeconds: 0.22, stationaryDwellMs: 350 });

/** Coordinate-free acquisition evidence; this is quality gating, not a calibrated probability. */
export function createEngineMotion() {
  let generation = 0;
  let last = null;
  let raw = null;
  let filtered = null;
  let acceleration = 0;
  let zeroSince = null;
  let zeros = 0;
  let reason = "awaiting-motion";
  let invalidated = true;
  const reset = (nextReason = "lifecycle") => {
    generation++;
    last = null; raw = null; filtered = null; acceleration = 0;
    zeroSince = null; zeros = 0; reason = nextReason; invalidated = true;
  };
  return {
    reset,
    observe({ source, rawSpeedKmh, sourceTimestampMs, receivedMs, epochNowMs, accuracyM, driveInput = "auto", brakeHeld = false }) {
      if (!Number.isFinite(receivedMs)) return false;
      if (last && source !== last.source) reset("source-changed");
      const gps = source === "GPS";
      const acquisitionAgeMs = gps && Number.isFinite(sourceTimestampMs) && Number.isFinite(epochNowMs)
        ? epochNowMs - sourceTimestampMs : gps ? Infinity : 0;
      const sourceTime = gps ? sourceTimestampMs : receivedMs;
      if (last && Number.isFinite(sourceTime) && sourceTime <= last.sourceTime) {
        // An exact duplicate never extends freshness or standstill evidence.
        if (sourceTime === last.sourceTime && rawSpeedKmh !== raw) {
          zeroSince = null; zeros = 0; invalidated = true; reason = "conflicting-duplicate";
        }
        return false;
      }
      const valid = Number.isFinite(rawSpeedKmh) && rawSpeedKmh >= 0 && rawSpeedKmh <= 260
        && acquisitionAgeMs >= -250 && acquisitionAgeMs <= ENGINE_MOTION_POLICY.freshMs
        && (!gps || (Number.isFinite(accuracyM) && accuracyM >= 0 && accuracyM <= ENGINE_MOTION_POLICY.positionAccuracyM));
      if (!valid) {
        zeroSince = null; zeros = 0;
        invalidated = true; reason = "untrusted-measurement";
        return false;
      }
      const measuredMs = receivedMs - Math.max(0, acquisitionAgeMs);
      const dt = last ? (sourceTime - last.sourceTime) / 1000 : 0;
      if (last && dt > 0 && dt < 5 && Number.isFinite(raw)
        && Math.abs(rawSpeedKmh - raw) / (3.6 * dt) > 12) {
        zeroSince = null; zeros = 0; invalidated = true; reason = "speed-outlier";
        return false;
      }
      const reacquired = invalidated || !last || receivedMs - last.receivedMs > ENGINE_MOTION_POLICY.lostMs;
      const targetAcceleration = !reacquired && dt > 0 ? clamp((rawSpeedKmh - raw) / (3.6 * dt), -10, 6) : 0;
      const alpha = dt > 0 ? 1 - Math.exp(-dt / ENGINE_MOTION_POLICY.smoothingSeconds) : 1;
      acceleration = reacquired ? 0 : acceleration + alpha * (targetAcceleration - acceleration);
      filtered = reacquired || filtered == null ? rawSpeedKmh : filtered + alpha * (rawSpeedKmh - filtered);
      if (rawSpeedKmh === 0) { zeroSince ??= measuredMs; zeros++; } else { zeroSince = null; zeros = 0; }
      raw = rawSpeedKmh;
      last = { source, sourceTime, receivedMs, measuredMs, driveInput, brakeHeld, reacquired };
      invalidated = false; reason = "accepted";
      return true;
    },
    snapshot(nowMs) {
      const ageMs = last ? Math.max(0, nowMs - last.measuredMs) : Infinity;
      const freshness = invalidated || ageMs > ENGINE_MOTION_POLICY.lostMs ? "lost"
        : ageMs > ENGINE_MOTION_POLICY.freshMs ? "degraded" : "fresh";
      const trusted = freshness === "fresh";
      const brake = last?.brakeHeld === true;
      const drive = !trusted ? 0 : brake || last?.driveInput === "regen" ? 0
        : last?.driveInput === "accelerator" ? 1 : clamp(0.15 + acceleration / 2.5, 0, 1);
      return {
        generation, source: last?.source ?? "unavailable", freshness, reason, ageMs: Number.isFinite(ageMs) ? ageMs : null,
        rawSpeedKmh: Number.isFinite(raw) ? raw : null, speedKmh: filtered, accelerationMps2: acceleration,
        drive, deceleration: clamp(-acceleration / 4, 0, 1),
        trustedStationary: trusted && raw === 0 && zeros >= 2 && zeroSince != null && nowMs - zeroSince >= ENGINE_MOTION_POLICY.stationaryDwellMs,
        canShift: trusted && !last?.reacquired,
      };
    },
  };
}
