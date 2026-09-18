// Isolated feasibility code. No product imports, persistence or transport.
const AXES = ["x", "y", "z"];
const ROTATION = ["alpha", "beta", "gamma"];
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const vector = (value, keys) => Object.fromEntries(keys.map((key) => [key, finite(value?.[key]) ? value[key] : null]));
const complete = (value) => Object.values(value).every(finite);
const norm = (value) => Math.hypot(...Object.values(value));
export const STALE_MS = 250;
export const WINDOW_SIZE = 240;

export function normalizeMotion(event, receivedAtMs, screenAngle = null) {
  if (!finite(receivedAtMs) || receivedAtMs < 0) return null;
  return {
    receivedAtMs,
    frame: "device-standard-orientation",
    screenAngle: finite(screenAngle) ? ((screenAngle % 360) + 360) % 360 : null,
    acceleration: vector(event.acceleration, AXES), // m/s², gravity excluded
    includingGravity: vector(event.accelerationIncludingGravity, AXES),
    rotation: vector(event.rotationRate, ROTATION), // deg/s: alpha=z, beta=x, gamma=y
    reportedIntervalMs: finite(event.interval) && event.interval > 0 ? event.interval : null,
  };
}

function stats(values) {
  if (!values.length) return { mean: null, deviation: null, max: null };
  const mean = values.reduce((sum, n) => sum + n, 0) / values.length;
  return { mean, deviation: Math.sqrt(values.reduce((sum, n) => sum + (n - mean) ** 2, 0) / values.length), max: Math.max(...values) };
}

function baselineAccumulator() {
  return { start: null, count: 0, axes: Object.fromEntries([...AXES, ...ROTATION].map((key) => [key, { mean: 0, m2: 0, max: -Infinity }])) };
}

export function createMotionWindow() {
  let samples = [];
  let total = 0;
  let calibration = { state: "required" };
  let baseline = baselineAccumulator();
  function invalidate(reason = "required") {
    samples = [];
    baseline = baselineAccumulator();
    calibration = { state: reason };
  }
  return {
    clear: invalidate,
    beginCalibration() {
      baseline = baselineAccumulator();
      calibration = { state: "collecting" };
    },
    add(sample) {
      if (!sample) return false;
      const previous = samples.at(-1);
      if (previous && sample.receivedAtMs <= previous.receivedAtMs) return false;
      if (previous && (sample.screenAngle !== previous.screenAngle || sample.receivedAtMs - previous.receivedAtMs > STALE_MS)) {
        invalidate("invalidated");
      }
      samples.push(sample);
      if (samples.length > WINDOW_SIZE) samples.shift();
      total += 1;
      if (calibration.state === "collecting") {
        if (!complete(sample.acceleration) || !complete(sample.rotation)) {
          calibration = { state: "missing-axes" };
          baseline = baselineAccumulator();
        } else if (norm(sample.acceleration) > 0.5 || norm(sample.rotation) > 3) {
          calibration = { state: "motion-detected" };
          baseline = baselineAccumulator();
        } else {
          baseline.start ??= sample.receivedAtMs;
          baseline.count += 1;
          for (const [key, value] of Object.entries({ ...sample.acceleration, ...sample.rotation })) {
            const axis = baseline.axes[key];
            const delta = value - axis.mean;
            axis.mean += delta / baseline.count;
            axis.m2 += delta * (value - axis.mean);
            axis.max = Math.max(axis.max, value);
          }
          const durationMs = sample.receivedAtMs - baseline.start;
          if (durationMs >= 2000 && baseline.count >= 40) {
            const summarize = (keys) => Object.fromEntries(keys.map((key) => [key, {
              mean: baseline.axes[key].mean, deviation: Math.sqrt(baseline.axes[key].m2 / baseline.count), max: baseline.axes[key].max,
            }]));
            const acceleration = summarize(AXES);
            const rotation = summarize(ROTATION);
            const quiet = Object.values(acceleration).every((s) => s.deviation <= 0.1)
              && Object.values(rotation).every((s) => s.deviation <= 0.5);
            calibration = { state: quiet ? "baseline-only" : "noisy", durationMs, count: baseline.count, acceleration, rotation };
            baseline = baselineAccumulator();
          }
        }
      }
      return true;
    },
    summary(now) {
      const last = samples.at(-1);
      const ageMs = last ? now - last.receivedAtMs : null;
      const fresh = finite(ageMs) && ageMs >= 0 && ageMs <= STALE_MS;
      if (!fresh && last) {
        calibration = { state: "invalidated" };
        baseline = baselineAccumulator();
      }
      const gaps = samples.slice(1).map((s, i) => s.receivedAtMs - samples[i].receivedAtMs);
      const cadence = stats(gaps);
      const hasValues = last && [...Object.values(last.acceleration), ...Object.values(last.includingGravity), ...Object.values(last.rotation)].some(finite);
      return {
        total, retained: samples.length, ageMs, fresh,
        quality: !last ? "no-samples" : !fresh ? "stale" : !hasValues ? "no-values" : complete(last.acceleration) && complete(last.rotation) ? "complete" : "partial",
        observedHz: cadence.mean === null ? null : 1000 / cadence.mean,
        intervalJitterMs: cadence.deviation, maxGapMs: cadence.max,
        reportedIntervalMs: last?.reportedIntervalMs ?? null,
        screenAngle: last?.screenAngle ?? null,
        availableAxes: last ? {
          acceleration: AXES.filter((key) => finite(last.acceleration[key])),
          includingGravity: AXES.filter((key) => finite(last.includingGravity[key])),
          rotation: ROTATION.filter((key) => finite(last.rotation[key])),
        } : null,
        calibration: structuredClone(calibration),
      };
    },
  };
}

export function createMotionController({ host = window, document: doc = document, now = () => performance.now() } = {}) {
  const observations = createMotionWindow();
  let state = "idle";
  let permission = "not-requested";
  let generation = 0;
  let startedAt = null;
  let disposed = false;
  const screenAngle = () => host.screen?.orientation?.angle ?? host.orientation ?? null;
  function onMotion(event) {
    if (state !== "listening" || doc.visibilityState !== "visible" || event.isTrusted !== true) return;
    observations.add(normalizeMotion(event, now(), screenAngle()));
  }
  function stop(next = "stopped") {
    generation += 1;
    host.removeEventListener("devicemotion", onMotion);
    observations.clear();
    startedAt = null;
    state = next;
  }
  const onVisibility = () => { if (doc.visibilityState !== "visible") stop("suspended"); };
  const onPageHide = () => stop("suspended");
  const onRotation = () => observations.clear("invalidated");
  doc.addEventListener("visibilitychange", onVisibility);
  host.addEventListener("pagehide", onPageHide);
  host.addEventListener("orientationchange", onRotation);
  host.screen?.orientation?.addEventListener("change", onRotation);
  return {
    // Invoke directly inside a click handler: do not await before permission.
    async start() {
      if (disposed || state === "requesting" || state === "listening") return;
      stop("idle");
      if (doc.visibilityState !== "visible") { state = "suspended"; return; }
      if (!host.isSecureContext) { state = "insecure-context"; return; }
      const API = host.DeviceMotionEvent;
      if (!API) { state = "unavailable"; return; }
      if (host.navigator?.userActivation && !host.navigator.userActivation.isActive) { state = "gesture-required"; return; }
      const token = generation;
      state = "requesting";
      try {
        permission = typeof API.requestPermission === "function" ? await API.requestPermission() : "no-prompt-api";
        if (disposed || token !== generation) return;
        if (permission !== "granted" && permission !== "no-prompt-api") { state = "denied"; return; }
        if (doc.visibilityState !== "visible") { stop("suspended"); return; }
        host.addEventListener("devicemotion", onMotion);
        startedAt = now();
        state = "listening";
      } catch (error) {
        if (token !== generation || disposed) return;
        permission = error?.name === "NotAllowedError" ? "denied-or-gesture-required" : "request-failed";
        state = "permission-error";
      }
    },
    stop: () => stop(),
    calibrate() {
      if (state === "listening" && observations.summary(now()).quality === "complete") observations.beginCalibration();
    },
    remount: () => observations.clear("invalidated"),
    summary() {
      const summary = observations.summary(now());
      return { state: state === "listening" && summary.retained === 0 ? (now() - startedAt >= 3000 ? "no-samples" : "waiting") : state, permission, ...summary };
    },
    dispose() {
      stop();
      disposed = true;
      doc.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pagehide", onPageHide);
      host.removeEventListener("orientationchange", onRotation);
      host.screen?.orientation?.removeEventListener("change", onRotation);
    },
  };
}
