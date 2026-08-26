"use strict";

const $ = (selector) => document.querySelector(selector);

const ui = {
  runAll: $("#run-all"),
  sessionState: $("#session-state"),
  lastRun: $("#last-run"),
  summary: $("#summary"),
  viewport: $("#viewport-results"),
  gpsStart: $("#gps-start"),
  gpsStop: $("#gps-stop"),
  gpsStatus: $("#gps-status"),
  gpsResults: $("#gps-results"),
  audioTest: $("#audio-test"),
  audioStatus: $("#audio-status"),
  audioResults: $("#audio-results"),
  runtimeResults: $("#runtime-results"),
  report: $("#report"),
  copyReport: $("#copy-report"),
  copyState: $("#copy-state"),
  eventCount: $("#event-count"),
  resetSession: $("#reset-session"),
  version: $("#version"),
  webglProbe: $("#webgl-probe"),
};

const state = {
  generatedAt: null,
  viewport: {},
  environment: {},
  runtime: {},
  graphics: {},
  storage: {},
  gps: { status: "not_tested" },
  audio: { status: "not_tested" },
  events: [],
};

const sessionStartedAt = performance.now();

let gpsWatchId = null;
let gpsTimerId = null;
let gpsStopAt = 0;
let gpsSamples = null;

function nowIso() {
  return new Date().toISOString();
}

function logEvent(type, detail = {}) {
  state.events.push({
    elapsedMs: round(performance.now() - sessionStartedAt, 1),
    at: nowIso(),
    type,
    detail,
  });
  if (state.events.length > 500) state.events.shift();
  ui.eventCount.textContent = `${state.events.length} ${state.events.length === 1 ? "event" : "events"}`;
}

function round(value, digits = 2) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function setStatus(element, label, tone = "neutral") {
  element.textContent = label;
  element.className = `status ${tone}`;
}

function metricMarkup(items) {
  return items
    .map(
      ([label, value]) =>
        `<div class="metric"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(
          value ?? "—",
        )}</dd></div>`,
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function boolLabel(value) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "—";
}

function collectViewport() {
  const visual = window.visualViewport;
  const orientation = screen.orientation;
  state.viewport = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    screenWidth: screen.width,
    screenHeight: screen.height,
    availableWidth: screen.availWidth,
    availableHeight: screen.availHeight,
    devicePixelRatio: round(window.devicePixelRatio, 3),
    visualViewportWidth: visual ? round(visual.width, 2) : null,
    visualViewportHeight: visual ? round(visual.height, 2) : null,
    visualViewportScale: visual ? round(visual.scale, 3) : null,
    orientationType: orientation?.type ?? null,
    orientationAngle: orientation?.angle ?? window.orientation ?? null,
  };
  logEvent("viewport.measured", {
    innerWidth: state.viewport.innerWidth,
    innerHeight: state.viewport.innerHeight,
    devicePixelRatio: state.viewport.devicePixelRatio,
    visualViewportScale: state.viewport.visualViewportScale,
  });
  renderViewport();
  renderReport();
}

function renderViewport() {
  const value = state.viewport;
  ui.viewport.innerHTML = metricMarkup([
    ["inner viewport", `${value.innerWidth ?? "—"} × ${value.innerHeight ?? "—"} CSS px`],
    ["screen", `${value.screenWidth ?? "—"} × ${value.screenHeight ?? "—"} CSS px`],
    ["devicePixelRatio", value.devicePixelRatio],
    ["visual viewport", `${value.visualViewportWidth ?? "—"} × ${value.visualViewportHeight ?? "—"}`],
    ["visual scale", value.visualViewportScale],
    ["available area", `${value.availableWidth ?? "—"} × ${value.availableHeight ?? "—"}`],
    ["orientation", value.orientationType ?? "not reported"],
    ["angle", value.orientationAngle ?? "—"],
  ]);
}

async function permissionState(name) {
  if (!navigator.permissions?.query) return "unsupported";
  try {
    const result = await navigator.permissions.query({ name });
    return result.state;
  } catch {
    return "query_failed";
  }
}

function probeWebGl() {
  const gl = ui.webglProbe.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
  });
  if (!gl) {
    return { webgl2: false, vendor: null, renderer: null, maxTextureSize: null };
  }

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const vendor = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    : gl.getParameter(gl.VENDOR);
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    webgl2: true,
    vendor,
    renderer,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
  };
}

function testLocalStorage() {
  const key = "sedicivalvole-diagnostic-probe";
  try {
    localStorage.setItem(key, "1");
    const passed = localStorage.getItem(key) === "1";
    localStorage.removeItem(key);
    return passed;
  } catch {
    return false;
  }
}

function testIndexedDb() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(false);
      return;
    }

    const name = "sedicivalvole-diagnostic-probe";
    const request = indexedDB.open(name, 1);
    const timeout = window.setTimeout(() => resolve(false), 4000);

    request.onerror = () => {
      window.clearTimeout(timeout);
      resolve(false);
    };
    request.onupgradeneeded = () => request.result.createObjectStore("probe");
    request.onsuccess = () => {
      request.result.close();
      const deletion = indexedDB.deleteDatabase(name);
      deletion.onerror = deletion.onblocked = deletion.onsuccess = () => {
        window.clearTimeout(timeout);
        resolve(true);
      };
    };
  });
}

function sampleAnimationFrames(durationMs = 1100) {
  return new Promise((resolve) => {
    const deltas = [];
    let startedAt = 0;
    let previous = 0;

    function frame(timestamp) {
      if (!startedAt) {
        startedAt = timestamp;
        previous = timestamp;
      } else {
        deltas.push(timestamp - previous);
        previous = timestamp;
      }

      if (timestamp - startedAt < durationMs) {
        requestAnimationFrame(frame);
        return;
      }

      const sorted = [...deltas].sort((a, b) => a - b);
      const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
      const average = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
      resolve({
        samples: deltas.length,
        averageFrameMs: round(average, 2),
        p95FrameMs: round(p95, 2),
        estimatedFps: average > 0 ? round(1000 / average, 1) : null,
      });
    }

    requestAnimationFrame(frame);
  });
}

async function runAutomaticTests() {
  ui.runAll.disabled = true;
  setStatus(ui.sessionState, "testing", "warn");
  ui.lastRun.textContent = "measuring…";
  logEvent("automatic.started");
  collectViewport();

  const connection = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
  state.environment = {
    secureContext: window.isSecureContext,
    protocol: location.protocol,
    online: navigator.onLine,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.userAgentData?.platform ?? navigator.platform ?? null,
    mobileHint: navigator.userAgentData?.mobile ?? null,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemoryGb: navigator.deviceMemory ?? null,
    connectionType: connection?.effectiveType ?? null,
    saveData: connection?.saveData ?? null,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    highContrast: matchMedia("(prefers-contrast: more)").matches,
    standalone: matchMedia("(display-mode: standalone)").matches,
    geolocationApi: "geolocation" in navigator,
    geolocationPermission: await permissionState("geolocation"),
  };
  logEvent("automatic.environment", {
    secureContext: state.environment.secureContext,
    online: state.environment.online,
    touchPoints: state.environment.maxTouchPoints,
    geolocationApi: state.environment.geolocationApi,
    geolocationPermission: state.environment.geolocationPermission,
  });

  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  state.runtime = {
    audioContextApi: Boolean(AudioContextClass),
    audioWorkletApi: Boolean(window.AudioWorkletNode && AudioContextClass),
    webAssembly: typeof WebAssembly === "object",
    serviceWorkerApi: "serviceWorker" in navigator,
    serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller),
    cacheStorageApi: "caches" in window,
    offscreenCanvas: typeof OffscreenCanvas !== "undefined",
    webCodecs: "VideoEncoder" in window || "AudioEncoder" in window,
    cssColorP3: CSS.supports?.("color", "color(display-p3 1 0 0)") ?? false,
    cssDvh: CSS.supports?.("height", "100dvh") ?? false,
    animationFrames: await sampleAnimationFrames(),
  };
  logEvent("automatic.runtime", {
    audioContextApi: state.runtime.audioContextApi,
    audioWorkletApi: state.runtime.audioWorkletApi,
    serviceWorkerApi: state.runtime.serviceWorkerApi,
    frameSample: state.runtime.animationFrames,
  });

  state.graphics = probeWebGl();
  logEvent("automatic.graphics", {
    webgl2: state.graphics.webgl2,
    renderer: state.graphics.renderer,
    maxTextureSize: state.graphics.maxTextureSize,
  });
  state.storage = {
    localStorage: testLocalStorage(),
    indexedDb: await testIndexedDb(),
  };
  logEvent("automatic.storage", state.storage);
  state.generatedAt = nowIso();

  renderSummary();
  renderRuntime();
  renderReport();
  ui.lastRun.textContent = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
  setStatus(ui.sessionState, "test complete", "pass");
  logEvent("automatic.completed");
  renderReport();
  ui.runAll.disabled = false;
}

function summaryItem(label, value, tone) {
  return `<div class="summary-item"><span>${escapeHtml(label)}</span><strong class="${escapeHtml(
    tone,
  )}">${escapeHtml(value)}</strong></div>`;
}

function renderSummary() {
  const environment = state.environment;
  const runtime = state.runtime;
  const graphics = state.graphics;
  const storage = state.storage;
  const secureTone = environment.secureContext ? "pass" : "fail";
  const gpsTone = environment.geolocationApi ? "pass" : "fail";
  const audioTone = runtime.audioContextApi ? "pass" : "fail";
  const graphicsTone = graphics.webgl2 ? "pass" : "warn";

  ui.summary.innerHTML = [
    summaryItem("Secure context", environment.secureContext ? "PASS" : "FAIL", secureTone),
    summaryItem("Geolocation API", environment.geolocationApi ? "available" : "absent", gpsTone),
    summaryItem("Web Audio", runtime.audioContextApi ? "available" : "absent", audioTone),
    summaryItem("WebGL2", graphics.webgl2 ? "available" : "fallback required", graphicsTone),
    summaryItem("Touch points", String(environment.maxTouchPoints ?? "—"), "neutral"),
    summaryItem("Frame sample", `${runtime.animationFrames?.estimatedFps ?? "—"} fps`, "neutral"),
    summaryItem("Local storage", storage.localStorage ? "PASS" : "FAIL", storage.localStorage ? "pass" : "fail"),
    summaryItem("IndexedDB", storage.indexedDb ? "PASS" : "FAIL", storage.indexedDb ? "pass" : "fail"),
  ].join("");
}

function renderRuntime() {
  const environment = state.environment;
  const runtime = state.runtime;
  const graphics = state.graphics;
  ui.runtimeResults.innerHTML = metricMarkup([
    ["browser", environment.userAgent ?? "—"],
    ["platform", environment.platform ?? "—"],
    ["touch points", environment.maxTouchPoints ?? "—"],
    ["logical CPUs", environment.hardwareConcurrency ?? "not reported"],
    ["reported memory", environment.deviceMemoryGb ? `${environment.deviceMemoryGb} GB` : "not reported"],
    ["WebGL2", boolLabel(graphics.webgl2)],
    ["GPU vendor", graphics.vendor ?? "not exposed"],
    ["GPU renderer", graphics.renderer ?? "not exposed"],
    ["maximum texture", graphics.maxTextureSize ?? "—"],
    ["estimated fps", runtime.animationFrames?.estimatedFps ?? "—"],
    ["average frame", runtime.animationFrames?.averageFrameMs ? `${runtime.animationFrames.averageFrameMs} ms` : "—"],
    ["frame p95", runtime.animationFrames?.p95FrameMs ? `${runtime.animationFrames.p95FrameMs} ms` : "—"],
    ["AudioContext API", boolLabel(runtime.audioContextApi)],
    ["AudioWorklet API", boolLabel(runtime.audioWorkletApi)],
    ["WebAssembly", boolLabel(runtime.webAssembly)],
    ["Service Worker", boolLabel(runtime.serviceWorkerApi)],
    ["Cache Storage", boolLabel(runtime.cacheStorageApi)],
    ["OffscreenCanvas", boolLabel(runtime.offscreenCanvas)],
    ["reduced motion", boolLabel(environment.reducedMotion)],
    ["connection", environment.connectionType ?? "not reported"],
  ]);
}

function startGpsTest() {
  if (!("geolocation" in navigator)) {
    state.gps = { status: "unsupported", error: "geolocation_api_absent" };
    logEvent("gps.unsupported");
    setStatus(ui.gpsStatus, "API absent", "fail");
    renderGps();
    renderReport();
    return;
  }

  stopGpsTest(false);
  gpsSamples = {
    startedAt: performance.now(),
    timestamps: [],
    speedsKmh: [],
    accuracies: [],
    nullSpeedSamples: 0,
  };
  gpsStopAt = performance.now() + 20_000;
  logEvent("gps.started", { durationSeconds: 20, highAccuracy: true });
  state.gps = { status: "running", durationSeconds: 0, samples: 0 };
  ui.gpsStart.disabled = true;
  ui.gpsStop.disabled = false;
  setStatus(ui.gpsStatus, "20 s", "warn");

  gpsWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const timestamp = performance.now();
      const speed = position.coords.speed;
      gpsSamples.timestamps.push(timestamp);
      gpsSamples.accuracies.push(position.coords.accuracy);
      if (Number.isFinite(speed) && speed >= 0) {
        gpsSamples.speedsKmh.push(speed * 3.6);
      } else {
        gpsSamples.nullSpeedSamples += 1;
      }
      logEvent("gps.sample", {
        speedKmh: Number.isFinite(speed) && speed >= 0 ? round(speed * 3.6, 2) : null,
        accuracyM: round(position.coords.accuracy, 1),
      });
      updateGpsState();
    },
    (error) => {
      const errorMap = {
        1: "permission_denied",
        2: "position_unavailable",
        3: "timeout",
      };
      state.gps = {
        ...state.gps,
        status: "failed",
        error: errorMap[error.code] ?? "unknown_error",
      };
      logEvent("gps.failed", { error: state.gps.error });
      setStatus(ui.gpsStatus, "FAIL", "fail");
      stopGpsTest(false);
      renderGps();
      renderReport();
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
  );

  gpsTimerId = window.setInterval(() => {
    const remaining = Math.max(0, gpsStopAt - performance.now());
    setStatus(ui.gpsStatus, `${Math.ceil(remaining / 1000)} s`, "warn");
    updateGpsState();
    if (remaining <= 0) stopGpsTest(true);
  }, 250);
}

function updateGpsState() {
  if (!gpsSamples) return;
  const intervals = gpsSamples.timestamps.slice(1).map((value, index) => value - gpsSamples.timestamps[index]);
  const durationSeconds = (performance.now() - gpsSamples.startedAt) / 1000;
  const latestSpeedKmh = gpsSamples.speedsKmh.at(-1) ?? null;
  state.gps = {
    status: "running",
    durationSeconds: round(durationSeconds, 1),
    samples: gpsSamples.timestamps.length,
    speedSamples: gpsSamples.speedsKmh.length,
    nullSpeedSamples: gpsSamples.nullSpeedSamples,
    latestSpeedKmh: round(latestSpeedKmh, 1),
    medianIntervalMs: round(median(intervals), 1),
    medianAccuracyM: round(median(gpsSamples.accuracies), 1),
  };
  renderGps();
  renderReport();
}

function stopGpsTest(completed = false) {
  const wasFailed = state.gps.status === "failed";
  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;
  }
  if (gpsTimerId !== null) {
    window.clearInterval(gpsTimerId);
    gpsTimerId = null;
  }

  if (gpsSamples) {
    updateGpsState();
    state.gps.status = completed ? "completed" : wasFailed ? "failed" : "stopped";
    setStatus(
      ui.gpsStatus,
      completed ? "complete" : wasFailed ? "FAIL" : "stopped",
      completed ? "pass" : wasFailed ? "fail" : "neutral",
    );
    logEvent(`gps.${state.gps.status}`, {
      samples: state.gps.samples,
      speedSamples: state.gps.speedSamples,
      nullSpeedSamples: state.gps.nullSpeedSamples,
    });
  }
  ui.gpsStart.disabled = false;
  ui.gpsStop.disabled = true;
  renderGps();
  renderReport();
  gpsSamples = null;
}

function renderGps() {
  const gps = state.gps;
  ui.gpsResults.innerHTML = metricMarkup([
    ["status", gps.status],
    ["duration", gps.durationSeconds != null ? `${gps.durationSeconds} s` : "—"],
    ["samples", gps.samples ?? 0],
    ["numeric speed", gps.speedSamples ?? 0],
    ["speed null", gps.nullSpeedSamples ?? 0],
    ["latest speed", gps.latestSpeedKmh != null ? `${gps.latestSpeedKmh} km/h` : "—"],
    ["median interval", gps.medianIntervalMs != null ? `${gps.medianIntervalMs} ms` : "—"],
    ["median accuracy", gps.medianAccuracyM != null ? `${gps.medianAccuracyM} m` : "—"],
  ]);
}

async function testAudio() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) {
    state.audio = { status: "unsupported", error: "audio_context_absent" };
    logEvent("audio.unsupported");
    setStatus(ui.audioStatus, "API absent", "fail");
    renderAudio();
    renderReport();
    return;
  }

  ui.audioTest.disabled = true;
  logEvent("audio.started", { userGesture: true });
  setStatus(ui.audioStatus, "testing", "warn");
  let context;
  try {
    context = new AudioContextClass({ latencyHint: "interactive" });
    await context.resume();
    const resumedState = context.state;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 220;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.025, context.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);

    let audioWorklet = false;
    let audioWorkletError = null;
    if (context.audioWorklet && window.AudioWorkletNode) {
      const source = `class DiagnosticProcessor extends AudioWorkletProcessor { process(){ return true; } } registerProcessor("sedicivalvole-diagnostic", DiagnosticProcessor);`;
      const blobUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
      try {
        await context.audioWorklet.addModule(blobUrl);
        const node = new AudioWorkletNode(context, "sedicivalvole-diagnostic");
        const silent = context.createGain();
        silent.gain.value = 0;
        node.connect(silent).connect(context.destination);
        node.disconnect();
        silent.disconnect();
        audioWorklet = true;
      } catch {
        audioWorkletError = "module_or_node_failed";
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    }

    state.audio = {
      status: "completed",
      resumedState,
      sampleRate: context.sampleRate,
      baseLatencyMs: round((context.baseLatency ?? 0) * 1000, 2),
      outputLatencyMs: Number.isFinite(context.outputLatency)
        ? round(context.outputLatency * 1000, 2)
        : null,
      audioWorklet,
      audioWorkletError,
    };
    logEvent("audio.completed", {
      resumedState,
      sampleRate: state.audio.sampleRate,
      baseLatencyMs: state.audio.baseLatencyMs,
      outputLatencyMs: state.audio.outputLatencyMs,
      audioWorklet: state.audio.audioWorklet,
      audioWorkletError: state.audio.audioWorkletError,
    });
    setStatus(ui.audioStatus, "PASS", "pass");
  } catch {
    state.audio = { status: "failed", error: "audio_unlock_or_runtime_failed" };
    logEvent("audio.failed", { error: state.audio.error });
    setStatus(ui.audioStatus, "FAIL", "fail");
  } finally {
    if (context && context.state !== "closed") {
      window.setTimeout(() => context.close().catch(() => {}), 350);
    }
    ui.audioTest.disabled = false;
    renderAudio();
    renderReport();
  }
}

function renderAudio() {
  const audio = state.audio;
  ui.audioResults.innerHTML = metricMarkup([
    ["status", audio.status],
    ["AudioContext", audio.resumedState ?? "—"],
    ["sample rate", audio.sampleRate ? `${audio.sampleRate} Hz` : "—"],
    ["base latency", audio.baseLatencyMs != null ? `${audio.baseLatencyMs} ms` : "not reported"],
    ["output latency", audio.outputLatencyMs != null ? `${audio.outputLatencyMs} ms` : "not reported"],
    ["real AudioWorklet", audio.audioWorklet === true ? "PASS" : audio.audioWorklet === false ? "FAIL" : "—"],
  ]);
}

function publicReport() {
  return {
    schema: "sedicivalvole.tesla-capabilities.v1",
    generatedAt: state.generatedAt ?? nowIso(),
    note: "No coordinates are collected or included.",
    viewport: state.viewport,
    environment: state.environment,
    runtime: state.runtime,
    graphics: state.graphics,
    storage: state.storage,
    gps: state.gps,
    audio: state.audio,
    events: state.events,
  };
}

function renderReport() {
  ui.report.textContent = JSON.stringify(publicReport(), null, 2);
}

async function copyReport() {
  logEvent("report.copy_requested");
  const text = JSON.stringify(publicReport(), null, 2);
  renderReport();
  try {
    await navigator.clipboard.writeText(text);
    ui.copyState.textContent = "report copied";
    logEvent("report.copy_completed", { method: "clipboard" });
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    ui.copyState.textContent = copied ? "report copied" : "copy unavailable";
    logEvent(copied ? "report.copy_completed" : "report.copy_failed", { method: "fallback" });
  }
  renderReport();
  window.setTimeout(() => {
    ui.copyState.textContent = "";
  }, 3000);
}

function resetSession() {
  stopGpsTest(false);
  state.generatedAt = null;
  state.environment = {};
  state.runtime = {};
  state.graphics = {};
  state.storage = {};
  state.gps = { status: "not_tested" };
  state.audio = { status: "not_tested" };
  state.events = [];
  ui.summary.innerHTML = "";
  ui.runtimeResults.innerHTML = "";
  setStatus(ui.sessionState, "ready", "neutral");
  setStatus(ui.gpsStatus, "not tested", "neutral");
  setStatus(ui.audioStatus, "not tested", "neutral");
  ui.lastRun.textContent = "not run yet";
  logEvent("session.reset");
  renderGps();
  renderAudio();
  collectViewport();
}

async function loadVersion() {
  try {
    const response = await fetch("../../VERSION", { cache: "no-store" });
    if (!response.ok) throw new Error("version_unavailable");
    const value = (await response.text()).trim();
    ui.version.textContent = `version ${value}`;
    logEvent("version.loaded", { value });
  } catch {
    ui.version.textContent = "version unavailable";
    logEvent("version.unavailable");
  }
  renderReport();
}

ui.runAll.addEventListener("click", runAutomaticTests);
ui.gpsStart.addEventListener("click", startGpsTest);
ui.gpsStop.addEventListener("click", () => stopGpsTest(false));
ui.audioTest.addEventListener("click", testAudio);
ui.copyReport.addEventListener("click", copyReport);
ui.resetSession.addEventListener("click", resetSession);
window.addEventListener("resize", collectViewport, { passive: true });
window.visualViewport?.addEventListener("resize", collectViewport, { passive: true });
screen.orientation?.addEventListener("change", collectViewport);
window.addEventListener("pagehide", () => stopGpsTest(false));
document.addEventListener("visibilitychange", () => {
  logEvent("page.visibility", { state: document.visibilityState });
  renderReport();
});
window.addEventListener("online", () => {
  logEvent("network.online");
  renderReport();
});
window.addEventListener("offline", () => {
  logEvent("network.offline");
  renderReport();
});

logEvent("session.started", { secureContext: window.isSecureContext });
collectViewport();
renderGps();
renderAudio();
renderReport();
loadVersion();
