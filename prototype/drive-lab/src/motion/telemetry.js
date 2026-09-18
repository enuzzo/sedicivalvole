// Strict aggregate allowlist: never admit sensor vectors, signaling or bearer tokens.
export const MOTION_STATES = ["idle", "preparing", "pairing", "connecting", "connected", "stale", "closed", "expired", "unavailable", "error", "suspended"];
export const SENSOR_STATES = ["idle", "requesting", "granted", "denied", "unavailable", "waiting", "live", "incomplete", "stale", "suspended", "error", "stopped"];
const numericKeys = ["received", "sent", "rejected", "expiredRequests", "backpressureDrops", "sendErrors", "rttMs", "rttMaxMs", "ageUpperMs", "cadenceHz", "jitterMs", "tareCount", "reconnects", "motionEvents", "orientationEvents", "missingAxes", "visibilityStops", "accelerationPeak", "angularRatePeak", "signalingStatus", "signalingRequests", "signalingErrors", "connectMs", "wakeRequests", "wakeReleases", "wakeFailures", "traceFps", "tracePoints", "traceRange", "traceContextLosses"];
const booleanKeys = ["accelerometer", "gyroscope", "orientation", "orientationEstimated", "tared", "secureContext", "rtc", "wakeLock"];
const eventTypes = new Set(["start", "offer-ready", "phone-joined", "channel-open", "permission", "tare", "retare-required", "stale", "recovered", "stop", "hidden", "expired", "error", "wake", "trace"]);
export function safeMotionSummary(value = {}) {
  const safe = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return safe;
  for (const key of numericKeys) if (typeof value[key] === "number" && Number.isFinite(value[key]) && value[key] >= 0) safe[key] = Math.round(Math.min(1e9, value[key]) * 10) / 10;
  for (const key of booleanKeys) if (typeof value[key] === "boolean") safe[key] = value[key];
  if (["idle", "offer", "create", "poll", "join", "answer", "accept", "connected"].includes(value.stage)) safe.stage = value.stage;
  if (["idle", "requesting", "active", "released", "denied", "unsupported", "error"].includes(value.wakeState)) safe.wakeState = value.wakeState;
  if (["webgl2", "unavailable", "context-lost", "error"].includes(value.traceRenderer)) safe.traceRenderer = value.traceRenderer;
  if (MOTION_STATES.includes(value.state)) safe.state = value.state;
  if (SENSOR_STATES.includes(value.sensorState)) safe.sensorState = value.sensorState;
  if (["tared", "hold-still", "unavailable", "required", "settling"].includes(value.tareState)) safe.tareState = value.tareState;
  if (["ready", "unavailable", "gravity", "acceleration", "rotation", "settling"].includes(value.tareReason)) safe.tareReason = value.tareReason;
  if (["receiver", "phone"].includes(value.role)) safe.role = value.role;
  return safe;
}

export function createMotionTelemetry(now = () => performance.now()) {
  const start = now();
  let latest = {};
  const events = [];
  const history = [];
  let lastHistory = -Infinity;
  let totalEvents = 0;
  return {
    update(value) {
      latest = safeMotionSummary(value);
      if (now() - lastHistory >= 2000) {
        history.push({ elapsedMs: Math.max(0, Math.round(now() - start)), ...latest });
        if (history.length > 300) history.shift();
        lastHistory = now();
      }
    },
    event(type, value = {}) {
      if (!eventTypes.has(type)) return;
      totalEvents += 1;
      events.push({ elapsedMs: Math.max(0, Math.round(now() - start)), type, ...safeMotionSummary(value) });
      if (events.length > 120) events.shift();
    },
    snapshot() {
      return structuredClone({ schema: "sedicivalvole.motion-diagnostic.v1", latest, history, events, totalEvents,
        privacy: { rawSamplesIncluded: false, signalingIncluded: false, pairingTokensIncluded: false, coordinatesIncluded: false, storage: "bounded-session-memory" } });
    },
  };
}
