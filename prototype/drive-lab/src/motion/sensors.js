import { createScreenWake } from "./screen-wake.js";
import { advanceOrientation, createPoseReference, orientationMatrix, zeroReadiness, MOTION_FRESH_MS } from "./reference.js";
import { mountedBasis, mountedReading } from "./road-input.js";
const finite = (n) => typeof n === "number" && Number.isFinite(n);
const vector = (value, keys) => keys.every((key) => finite(value?.[key])) ? keys.map((key) => value[key]) : null;

export function createPhoneSensors({ host = window, doc = document, now = () => performance.now(), onEvent = () => {}, autoWake = true } = {}) {
  const pose = createPoseReference();
  let placementConfirmed = false;
  let mountSelected = false, roadBasis = null, roadState = "not-selected";
  let state = "idle";
  let sample = null;
  let orientation = null;
  let orientationAt = null;
  let orientationEstimated = false;
  let generation = 0;
  let disposed = false;
  let lastAt = null;
  let tareState = "required";
  let tareReason = "unavailable";
  let zeroDeadline = null;
  let stableSince = null;
  let startedAt = null;
  const wake = createScreenWake({ host, doc, onChange: detail => onEvent("wake", detail) });
  const counts = { motionEvents: 0, orientationEvents: 0, missingAxes: 0, tareCount: 0, visibilityStops: 0, accelerationPeak: 0, angularRatePeak: 0 };
  const intervals = [];
  function stop(reason = "stopped") {
    generation += 1;
    host.removeEventListener("devicemotion", motion);
    host.removeEventListener("deviceorientation", orient);
    wake.stop();
    roadBasis = null; roadState = mountSelected ? "needs-zero" : "not-selected";
    pose.clear(); sample = null; orientation = null; orientationAt = null; lastAt = null;
    orientationEstimated = false;
    intervals.length = 0; tareState = "required"; tareReason = "unavailable";
    zeroDeadline = null; stableSince = null;
    state = reason;
    onEvent(reason === "suspended" ? "hidden" : "stop", summary());
  }
  function invalidate() { roadBasis = null; roadState = mountSelected ? "needs-zero" : "not-selected"; pose.clear(); tareState = "required"; onEvent("retare-required", summary()); }
  const poseSample = () => sample ? { ...sample, orientation, orientationAt } : null;
  function captureZero() {
    zeroDeadline = null; stableSince = null;
    tareReason = zeroReadiness(poseSample(), now());
    tareState = pose.tare(poseSample(), now());
    if (tareState === "tared") {
      counts.tareCount += 1;
      roadBasis = mountSelected ? mountedBasis(sample.gravity, orientation) : null;
      roadState = !mountSelected ? "not-selected" : roadBasis ? "calibrated" : "unsupported-pose";
    }
    onEvent("tare", summary());
    return tareState;
  }
  function expireZero(at) {
    if (zeroDeadline === null || at < zeroDeadline) return;
    zeroDeadline = null; stableSince = null;
    tareReason = zeroReadiness(poseSample(), at);
    tareState = tareReason === "unavailable" ? "unavailable" : "hold-still";
    if (tareReason === "ready") tareReason = "settling";
    onEvent("tare", summary());
  }
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
      stableSince = null;
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
    if (roadBasis && !mountedReading(roadBasis, sample)) { roadBasis = null; roadState = "moved"; }
    counts.motionEvents += 1;
    if (acceleration) counts.accelerationPeak = Math.max(counts.accelerationPeak, Math.hypot(...acceleration));
    if (rotation) counts.angularRatePeak = Math.max(counts.angularRatePeak, Math.hypot(...rotation));
    if (!acceleration || !rotation) counts.missingAxes += 1;
    state = "live";
    expireZero(at);
    if (zeroDeadline !== null) {
      tareReason = zeroReadiness(poseSample(), at);
      if (tareReason !== "ready") stableSince = null;
      else {
        stableSince ??= at;
        if (at - stableSince >= 500) captureZero();
      }
    }
  }
  function summary() {
    const at = now();
    expireZero(at);
    const age = sample ? at - sample.at : null;
    const orientationAge = orientationAt === null ? null : at - orientationAt;
    const fresh = age !== null && age >= 0 && age <= MOTION_FRESH_MS;
    const orientationFresh = orientationAge !== null && orientationAge >= 0 && orientationAge <= MOTION_FRESH_MS;
    // An expired pose never silently revives when new sensor events arrive.
    const complete = Boolean(sample?.acceleration && sample?.rotation && orientation && orientationFresh);
    if (pose.tared && (!fresh || !complete)) { roadBasis = null; roadState = mountSelected ? "needs-zero" : "not-selected"; pose.clear(); tareState = "required"; }
    const mean = intervals.length ? intervals.reduce((sum, n) => sum + n, 0) / intervals.length : null;
    return { placementConfirmed, mountSelected, roadState, sensorState: state === "live" ? !fresh ? "stale" : !complete ? "incomplete" : "live" : state,
      accelerometer: Boolean(sample?.acceleration), gyroscope: Boolean(sample?.rotation), orientation: Boolean(orientation && orientationFresh),
      tared: pose.tared, tareState: zeroDeadline === null ? tareState : "settling", tareReason, orientationEstimated, cadenceHz: mean ? 1000 / mean : 0,
      jitterMs: mean ? Math.sqrt(intervals.reduce((sum, n) => sum + (n - mean) ** 2, 0) / intervals.length) : 0,
      ageUpperMs: fresh ? age : null, waitingMs: startedAt === null ? 0 : at - startedAt,
      secureContext: Boolean(host.isSecureContext), ...wake.summary(), ...counts };
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
        if (autoWake) wake.start();
      } catch { if (token === generation) { state = "error"; onEvent("permission", summary()); } }
    },
    confirmPlacement() { placementConfirmed = true; },
    resetPlacement() { placementConfirmed = false; mountSelected = false; invalidate(); zeroDeadline = null; stableSince = null; },
    setMount(selected) { mountSelected = selected === true; invalidate(); zeroDeadline = null; stableSince = null; },
    tare: captureZero,
    requestTare() {
      if (zeroDeadline !== null) return "settling";
      roadBasis = null; roadState = mountSelected ? "needs-zero" : "not-selected";
      if (summary().sensorState !== "live") return captureZero();
      zeroDeadline = now() + 8000; stableSince = null;
      tareReason = zeroReadiness(poseSample(), now());
      onEvent("tare", summary());
      return "settling";
    },
    activity() {
      if (summary().sensorState !== "live") return null;
      return { acceleration: Math.hypot(...sample.acceleration), rotation: Math.hypot(...sample.rotation) };
    },
    latest() { summary(); const value = sample ? pose.project({ ...sample, orientation, orientationAt }, now()) : null; return value ? { ...value, sampleAt: sample.at, ...(roadBasis ? { road: mountedReading(roadBasis, sample) } : {}) } : null; },
    retryWake: () => wake.retry(),
    requestWake: () => wake.start(),
    summary,
    stop: () => stop(),
    dispose() { stop(); disposed = true; doc.removeEventListener("visibilitychange", visibility); host.removeEventListener("pagehide", pagehide); },
  };
}
