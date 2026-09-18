import { advanceOrientation, createPoseReference, orientationMatrix, MOTION_FRESH_MS } from "./reference.js";
const finite = (n) => typeof n === "number" && Number.isFinite(n);
const vector = (value, keys) => keys.every((key) => finite(value?.[key])) ? keys.map((key) => value[key]) : null;

export function createPhoneSensors({ host = window, doc = document, now = () => performance.now(), onEvent = () => {} } = {}) {
  const pose = createPoseReference();
  let state = "idle";
  let sample = null;
  let orientation = null;
  let orientationAt = null;
  let orientationEstimated = false;
  let generation = 0;
  let disposed = false;
  let lastAt = null;
  let tareState = "required";
  let startedAt = null;
  let wakeLock = null;
  const counts = { motionEvents: 0, orientationEvents: 0, missingAxes: 0, tareCount: 0, visibilityStops: 0, accelerationPeak: 0, angularRatePeak: 0 };
  const intervals = [];
  function stop(reason = "stopped") {
    generation += 1;
    host.removeEventListener("devicemotion", motion);
    host.removeEventListener("deviceorientation", orient);
    if (wakeLock) void wakeLock.release().catch(() => {});
    wakeLock = null;
    pose.clear(); sample = null; orientation = null; orientationAt = null; lastAt = null;
    orientationEstimated = false;
    intervals.length = 0; tareState = "required";
    state = reason;
    onEvent(reason === "suspended" ? "hidden" : "stop", summary());
  }
  function invalidate() { pose.clear(); tareState = "required"; onEvent("retare-required", summary()); }
  function orient(event) {
    if (state !== "live" && state !== "waiting") return;
    if (event.isTrusted !== true || doc.visibilityState !== "visible") return;
    orientation = orientationMatrix(event);
    orientationAt = now();
    orientationEstimated = false;
    counts.orientationEvents += 1;
  }
  function motion(event) {
    if (state !== "live" && state !== "waiting") return;
    if (event.isTrusted !== true || doc.visibilityState !== "visible") return;
    const at = now();
    if (lastAt !== null && at <= lastAt) return;
    if (lastAt !== null && at - lastAt > MOTION_FRESH_MS) {
      if (pose.tared) invalidate();
      if (orientationAt === null || at - orientationAt > MOTION_FRESH_MS) { orientation = null; orientationAt = null; }
      intervals.length = 0;
    } else if (lastAt !== null) {
      intervals.push(at - lastAt); if (intervals.length > 240) intervals.shift();
    }
    lastAt = at;
    const acceleration = vector(event.acceleration, ["x", "y", "z"]);
    const includingGravity = vector(event.accelerationIncludingGravity, ["x", "y", "z"]);
    const rotation = vector(event.rotationRate, ["beta", "gamma", "alpha"]);
    // Orientation events may be change-driven. Propagate short intervals using
    // current gyro observations; never integrate across lifecycle/execution gaps.
    if (orientation && orientationAt !== null && at > orientationAt) {
      orientation = advanceOrientation(orientation, rotation, (at - orientationAt) / 1000);
      orientationAt = orientation ? at : null;
      orientationEstimated = Boolean(orientation);
    }
    sample = { at, acceleration, rotation, gravity: acceleration && includingGravity ? includingGravity.map((n, i) => n - acceleration[i]) : null };
    counts.motionEvents += 1;
    if (acceleration) counts.accelerationPeak = Math.max(counts.accelerationPeak, Math.hypot(...acceleration));
    if (rotation) counts.angularRatePeak = Math.max(counts.angularRatePeak, Math.hypot(...rotation));
    if (!acceleration || !rotation) counts.missingAxes += 1;
    state = "live";
  }
  function summary() {
    const at = now();
    const age = sample ? at - sample.at : null;
    const orientationAge = orientationAt === null ? null : at - orientationAt;
    const fresh = age !== null && age >= 0 && age <= MOTION_FRESH_MS;
    const orientationFresh = orientationAge !== null && orientationAge >= 0 && orientationAge <= MOTION_FRESH_MS;
    // An expired pose never silently revives when new sensor events arrive.
    if (pose.tared && (!fresh || !orientationFresh)) { pose.clear(); tareState = "required"; }
    const mean = intervals.length ? intervals.reduce((sum, n) => sum + n, 0) / intervals.length : null;
    return { sensorState: state === "live" && !fresh ? "stale" : state,
      accelerometer: Boolean(sample?.acceleration), gyroscope: Boolean(sample?.rotation), orientation: Boolean(orientation && orientationFresh),
      tared: pose.tared, tareState, orientationEstimated, cadenceHz: mean ? 1000 / mean : 0,
      jitterMs: mean ? Math.sqrt(intervals.reduce((sum, n) => sum + (n - mean) ** 2, 0) / intervals.length) : 0,
      ageUpperMs: fresh ? age : null, waitingMs: startedAt === null ? 0 : at - startedAt,
      secureContext: Boolean(host.isSecureContext), wakeLock: Boolean(wakeLock && !wakeLock.released), ...counts };
  }
  const visibility = () => { if (doc.visibilityState !== "visible") { counts.visibilityStops += 1; stop("suspended"); } };
  const pagehide = () => stop("suspended");
  doc.addEventListener("visibilitychange", visibility);
  host.addEventListener("pagehide", pagehide);
  return {
    async start() {
      if (disposed || ["requesting", "live", "waiting"].includes(summary().sensorState)) return;
      if (state === "live") stop();
      if (!host.isSecureContext || !host.DeviceMotionEvent || !host.DeviceOrientationEvent) { state = "unavailable"; onEvent("permission", summary()); return; }
      if (doc.visibilityState !== "visible") { state = "suspended"; return; }
      if (host.navigator?.userActivation && !host.navigator.userActivation.isActive) { state = "denied"; onEvent("permission", summary()); return; }
      const token = ++generation;
      state = "requesting";
      try {
        // Both permission requests execute within the initiating gesture.
        const request = (API) => typeof API.requestPermission === "function" ? API.requestPermission() : Promise.resolve("granted");
        const results = await Promise.allSettled([request(host.DeviceMotionEvent), request(host.DeviceOrientationEvent)]);
        if (token !== generation || disposed) return;
        if (results.some((r) => r.status !== "fulfilled" || r.value !== "granted")) { state = "denied"; onEvent("permission", summary()); return; }
        if (doc.visibilityState !== "visible") { stop("suspended"); return; }
        state = "waiting"; startedAt = now();
        host.addEventListener("devicemotion", motion);
        host.addEventListener("deviceorientation", orient);
        onEvent("permission", { ...summary(), sensorState: "granted" });
        if (host.navigator?.wakeLock?.request) {
          void host.navigator.wakeLock.request("screen").then((lock) => {
            if (disposed || token !== generation || doc.visibilityState !== "visible") void lock.release().catch(() => {});
            else wakeLock = lock;
          }).catch(() => {});
        }
      } catch { if (token === generation) { state = "error"; onEvent("permission", summary()); } }
    },
    tare() {
      tareState = pose.tare(sample ? { ...sample, orientation, orientationAt } : null, now());
      if (tareState === "tared") counts.tareCount += 1;
      onEvent("tare", summary());
      return tareState;
    },
    latest() { summary(); return sample ? pose.project({ ...sample, orientation, orientationAt }, now()) : null; },
    summary,
    stop: () => stop(),
    dispose() { stop(); disposed = true; doc.removeEventListener("visibilitychange", visibility); host.removeEventListener("pagehide", pagehide); },
  };
}
