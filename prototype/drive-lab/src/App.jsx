import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createAudioEngine } from "./audio-engine.js";
import {
  appendConnectionHistory,
  appendViewportHistory,
  createFrameTelemetry,
  createGpsTelemetry,
  inferViewportMode,
  recordFrameSample,
  recordGpsSample,
  summarizeFrameTelemetry,
  summarizeGpsTelemetry,
} from "./diagnostics-model.js";
import { FluxField } from "./flux-field.jsx";
import { FLUX_THEMES, getFluxTheme } from "./flux-themes.js";
import {
  advanceDemoMotion,
  applyKeyboardDelta,
  clamp,
  normalizeGpsSpeed,
  smoothSpeed,
  speedToBpm,
  speedToEnergy,
} from "./signal-model.js";

const APP_VERSION = __APP_VERSION__;
const PREFERENCES_KEY = "sedicivalvole.preferences.v1";

function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "null");
    return {
      fullEnergyKmh: clamp(Number(value?.fullEnergyKmh) || 120, 60, 180),
      themeId: FLUX_THEMES.some((theme) => theme.id === value?.themeId) ? value.themeId : "red",
    };
  } catch {
    return { fullEnergyKmh: 120, themeId: "red" };
  }
}

function readSafeAreaInsets() {
  const probe = document.createElement("div");
  probe.style.cssText = [
    "position:fixed",
    "visibility:hidden",
    "pointer-events:none",
    "padding-top:env(safe-area-inset-top)",
    "padding-right:env(safe-area-inset-right)",
    "padding-bottom:env(safe-area-inset-bottom)",
    "padding-left:env(safe-area-inset-left)",
  ].join(";");
  document.body.append(probe);
  const styles = getComputedStyle(probe);
  const insets = {
    top: Number.parseFloat(styles.paddingTop) || 0,
    right: Number.parseFloat(styles.paddingRight) || 0,
    bottom: Number.parseFloat(styles.paddingBottom) || 0,
    left: Number.parseFloat(styles.paddingLeft) || 0,
  };
  probe.remove();
  return insets;
}

function readDisplaySnapshot(reason) {
  const visual = window.visualViewport;
  const displayScreen = window.screen;
  const snapshot = {
    capturedAt: new Date().toISOString(),
    reason,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    documentWidth: document.documentElement.clientWidth,
    documentHeight: document.documentElement.clientHeight,
    visualWidth: visual ? Math.round(visual.width * 100) / 100 : null,
    visualHeight: visual ? Math.round(visual.height * 100) / 100 : null,
    visualScale: visual?.scale ?? null,
    visualOffsetLeft: visual?.offsetLeft ?? null,
    visualOffsetTop: visual?.offsetTop ?? null,
    screenWidth: displayScreen?.width ?? null,
    screenHeight: displayScreen?.height ?? null,
    availableWidth: displayScreen?.availWidth ?? null,
    availableHeight: displayScreen?.availHeight ?? null,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    dpr: window.devicePixelRatio || 1,
    orientationType: displayScreen?.orientation?.type ?? null,
    orientationAngle: displayScreen?.orientation?.angle ?? window.orientation ?? null,
    safeAreaInsets: readSafeAreaInsets(),
    fullscreen: Boolean(document.fullscreenElement),
    displayModeStandalone: window.matchMedia?.("(display-mode: standalone)").matches ?? false,
  };
  return { ...snapshot, mode: inferViewportMode(snapshot) };
}

function readGraphicsCapabilities() {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
  });
  if (!gl) return { webgl2: false };
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  return {
    webgl2: true,
    vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    maxViewportDimensions: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
  };
}

function roundMetric(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function readConnectionSnapshot(reason) {
  const connection = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
  return {
    capturedAt: new Date().toISOString(),
    reason,
    online: navigator.onLine,
    type: connection?.type ?? null,
    effectiveType: connection?.effectiveType ?? null,
    downlinkMbps: connection?.downlink ?? null,
    roundTripTimeMs: connection?.rtt ?? null,
    saveData: connection?.saveData ?? null,
  };
}

function readPerformanceSnapshot(frameTelemetry, longTaskTelemetry, harnessStartedAtMs) {
  const navigation = performance.getEntriesByType?.("navigation")?.[0];
  const paints = Object.fromEntries(
    (performance.getEntriesByType?.("paint") ?? []).map((entry) => [entry.name, roundMetric(entry.startTime)]),
  );
  const resources = performance.getEntriesByType?.("resource") ?? [];
  const byInitiatorType = {};
  for (const resource of resources) {
    const key = resource.initiatorType || "other";
    const aggregate = byInitiatorType[key] ?? {
      count: 0,
      durationMs: 0,
      transferBytes: 0,
      encodedBodyBytes: 0,
      decodedBodyBytes: 0,
    };
    aggregate.count += 1;
    aggregate.durationMs += Number.isFinite(resource.duration) ? resource.duration : 0;
    aggregate.transferBytes += Number.isFinite(resource.transferSize) ? resource.transferSize : 0;
    aggregate.encodedBodyBytes += Number.isFinite(resource.encodedBodySize) ? resource.encodedBodySize : 0;
    aggregate.decodedBodyBytes += Number.isFinite(resource.decodedBodySize) ? resource.decodedBodySize : 0;
    byInitiatorType[key] = aggregate;
  }
  for (const aggregate of Object.values(byInitiatorType)) {
    aggregate.durationMs = roundMetric(aggregate.durationMs);
  }
  const memory = performance.memory;

  return {
    timeOrigin: new Date(performance.timeOrigin).toISOString(),
    pageElapsedMs: roundMetric(performance.now()),
    harnessElapsedMs: roundMetric(performance.now() - harnessStartedAtMs),
    navigation: navigation ? {
      type: navigation.type,
      durationMs: roundMetric(navigation.duration),
      redirectCount: navigation.redirectCount,
      responseStartMs: roundMetric(navigation.responseStart),
      responseEndMs: roundMetric(navigation.responseEnd),
      domInteractiveMs: roundMetric(navigation.domInteractive),
      domContentLoadedMs: roundMetric(navigation.domContentLoadedEventEnd),
      loadEventMs: roundMetric(navigation.loadEventEnd),
      transferBytes: navigation.transferSize ?? null,
      encodedBodyBytes: navigation.encodedBodySize ?? null,
      decodedBodyBytes: navigation.decodedBodySize ?? null,
    } : null,
    paints,
    resources: {
      count: resources.length,
      byInitiatorType,
    },
    memory: memory ? {
      jsHeapSizeLimitBytes: memory.jsHeapSizeLimit,
      totalJsHeapSizeBytes: memory.totalJSHeapSize,
      usedJsHeapSizeBytes: memory.usedJSHeapSize,
    } : null,
    frame: summarizeFrameTelemetry(frameTelemetry),
    longTasks: {
      supported: longTaskTelemetry.supported,
      count: longTaskTelemetry.count,
      totalDurationMs: roundMetric(longTaskTelemetry.totalDurationMs),
      maximumDurationMs: roundMetric(longTaskTelemetry.maximumDurationMs),
      recentDurationsMs: longTaskTelemetry.recentDurationsMs.map(roundMetric),
    },
  };
}

async function readExtendedCapabilities() {
  const [storageResult, batteryResult, userAgentResult] = await Promise.allSettled([
    navigator.storage?.estimate?.() ?? Promise.resolve(null),
    navigator.getBattery?.() ?? Promise.resolve(null),
    navigator.userAgentData?.getHighEntropyValues?.([
      "architecture",
      "bitness",
      "model",
      "platformVersion",
      "uaFullVersion",
      "wow64",
    ]) ?? Promise.resolve(null),
  ]);
  const storage = storageResult.status === "fulfilled" ? storageResult.value : null;
  const battery = batteryResult.status === "fulfilled" ? batteryResult.value : null;
  const userAgentData = userAgentResult.status === "fulfilled" ? userAgentResult.value : null;
  return {
    storageEstimate: storage ? {
      usageBytes: storage.usage ?? null,
      quotaBytes: storage.quota ?? null,
      usageDetails: storage.usageDetails ?? null,
    } : null,
    battery: battery ? {
      charging: battery.charging,
      level: battery.level,
      chargingTimeSeconds: Number.isFinite(battery.chargingTime) ? battery.chargingTime : null,
      dischargingTimeSeconds: Number.isFinite(battery.dischargingTime) ? battery.dischargingTime : null,
    } : null,
    userAgentData,
  };
}

function canUseKeyboardTarget(target) {
  if (!(target instanceof HTMLElement)) return true;
  return !target.closest("input, textarea, select, button, [contenteditable='true'], [role='slider']");
}

function ModeSelector() {
  return (
    <nav className="mode-selector" aria-label="Experience mode">
      <button type="button" disabled title="Engine design is pending">ENGINE</button>
      <button className="is-active" type="button" aria-current="page">FLUX</button>
    </nav>
  );
}

function EnergyThresholdControl({ value, onChange }) {
  const progress = ((value - 60) / 120) * 100;
  return (
    <label className="energy-control">
      <span className="control-label">FULL ENERGY</span>
      <strong>{value}<small>km/h</small></strong>
      <span className="slider-housing">
        <input
          aria-label="Speed for full energy"
          type="range"
          min="60"
          max="180"
          step="10"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{ "--value": `${progress}%` }}
        />
      </span>
    </label>
  );
}

function BodyColorControl({ themeId, onChange }) {
  const selected = getFluxTheme(themeId);
  return (
    <fieldset className="body-color-control">
      <legend>BODY COLOR</legend>
      <strong>{selected.label}</strong>
      <div className="swatch-housing">
        {FLUX_THEMES.map((theme) => (
          <button
            key={theme.id}
            className={theme.id === themeId ? "is-selected" : ""}
            type="button"
            aria-label={`Use ${theme.label.toLowerCase()} color theme`}
            aria-pressed={theme.id === themeId}
            onClick={() => onChange(theme.id)}
          >
            <span style={{ background: theme.swatch }} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function App() {
  const initialPreferences = useMemo(readPreferences, []);
  const [phase, setPhase] = useState("idle");
  const [speed, setSpeed] = useState(0);
  const [source, setSource] = useState("GPS");
  const [gpsState, setGpsState] = useState("not tested");
  const [accuracy, setAccuracy] = useState(null);
  const [renderer, setRenderer] = useState("checking…");
  const [muted, setMuted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [controlsAwake, setControlsAwake] = useState(true);
  const [brakeFlash, setBrakeFlash] = useState(0);
  const [diagnostics, setDiagnostics] = useState(null);
  const [sendState, setSendState] = useState("idle");
  const [pulseFlash, setPulseFlash] = useState(0);
  const [keyboardHint, setKeyboardHint] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [fullEnergyKmh, setFullEnergyKmh] = useState(initialPreferences.fullEnergyKmh);
  const [themeId, setThemeId] = useState(initialPreferences.themeId);
  const reducedMotion = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    [],
  );

  const audioRef = useRef(null);
  const watchRef = useRef(null);
  const wakeTimerRef = useRef(null);
  const controlsHiddenAtPointerDownRef = useRef(false);
  const smoothedSpeedRef = useRef(0);
  const demoTimerRef = useRef(null);
  const brakeCooldownRef = useRef(0);
  const keyboardHintTimerRef = useRef(null);
  const keyboardLeaseTimerRef = useRef(null);
  const sourceRef = useRef("GPS");
  const audioMeterTimerRef = useRef(null);
  const viewportCaptureTimerRef = useRef(null);
  const gpsTelemetryRef = useRef(createGpsTelemetry(performance.now()));
  const frameTelemetryRef = useRef(createFrameTelemetry(performance.now()));
  const connectionHistoryRef = useRef([]);
  const diagnosticsActiveRef = useRef(false);
  const longTaskTelemetryRef = useRef({
    supported: false,
    count: 0,
    totalDurationMs: 0,
    maximumDurationMs: null,
    recentDurationsMs: [],
  });
  const diagnosticEventsRef = useRef([]);
  const sessionStartedAtRef = useRef(performance.now());

  const theme = getFluxTheme(themeId);
  const energy = speedToEnergy(speed, fullEnergyKmh);
  const bpm = speedToBpm(speed);

  const logDiagnosticEvent = useCallback((type, detail = {}) => {
    diagnosticEventsRef.current = [...diagnosticEventsRef.current, {
      at: new Date().toISOString(),
      elapsedMs: Math.round((performance.now() - sessionStartedAtRef.current) * 10) / 10,
      type,
      detail,
    }].slice(-240);
  }, []);

  const recordRenderedFrame = useCallback((capturedAtMs, targetFrameMs, frameRenderer, canvasWidth, canvasHeight) => {
    if (!diagnosticsActiveRef.current) return;
    frameTelemetryRef.current = recordFrameSample(frameTelemetryRef.current, {
      capturedAtMs,
      targetFrameMs,
      renderer: frameRenderer,
      canvasWidth,
      canvasHeight,
    });
  }, []);

  const wakeControls = useCallback(() => {
    setControlsAwake(true);
    window.clearTimeout(wakeTimerRef.current);
    wakeTimerRef.current = window.setTimeout(() => setControlsAwake(false), 4200);
  }, []);

  const handleSurfacePointerDown = useCallback(() => {
    controlsHiddenAtPointerDownRef.current = !(controlsAwake || drawerOpen);
    wakeControls();
  }, [controlsAwake, drawerOpen, wakeControls]);

  const triggerPulse = useCallback(() => {
    setPulseFlash(1);
    window.setTimeout(() => setPulseFlash(0), 110);
  }, []);

  const triggerBrake = useCallback(() => {
    const now = performance.now();
    if (now - brakeCooldownRef.current < 900) return;
    brakeCooldownRef.current = now;
    logDiagnosticEvent("brake.triggered", { source: sourceRef.current });
    audioRef.current?.brake();
    setBrakeFlash(1);
    window.setTimeout(() => setBrakeFlash(0), 460);
  }, [logDiagnosticEvent]);

  const startGps = useCallback(() => {
    gpsTelemetryRef.current = createGpsTelemetry(performance.now());
    if (!navigator.geolocation) {
      setGpsState("unavailable");
      logDiagnosticEvent("gps.unavailable");
      return;
    }
    setGpsState("permission requested");
    logDiagnosticEvent("gps.requested", { highAccuracy: true });
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const capturedAtMs = performance.now();
        setAccuracy(Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null);
        const kmh = normalizeGpsSpeed(position.coords.speed);
        gpsTelemetryRef.current = recordGpsSample(gpsTelemetryRef.current, {
          capturedAtMs,
          speedKmh: kmh,
          accuracyM: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        });
        logDiagnosticEvent("gps.sample", {
          speedKmh: kmh == null ? null : Math.round(kmh * 10) / 10,
          accuracyM: Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy * 10) / 10 : null,
        });
        if (kmh == null) {
          setGpsState("GPS active · speed is null");
          return;
        }
        const next = smoothSpeed(smoothedSpeedRef.current, kmh);
        smoothedSpeedRef.current = next;
        if (sourceRef.current === "GPS") setSpeed(next);
        setGpsState("live");
      },
      (error) => {
        const states = { 1: "permission denied", 2: "signal unavailable", 3: "timeout" };
        setGpsState(states[error.code] || "sanitized error");
        logDiagnosticEvent("gps.failed", { code: states[error.code] || "unknown" });
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 12000 },
    );
  }, [logDiagnosticEvent]);

  const stopDemo = useCallback(() => {
    window.clearInterval(demoTimerRef.current);
    demoTimerRef.current = null;
  }, []);

  const toggleSource = useCallback(() => {
    if (controlsHiddenAtPointerDownRef.current) {
      controlsHiddenAtPointerDownRef.current = false;
      logDiagnosticEvent("controls.woken", { source: "speed-readout" });
      return;
    }
    wakeControls();
    if (source === "GPS") {
      logDiagnosticEvent("speed-source.changed", { source: "DEMO" });
      sourceRef.current = "DEMO";
      setSource("DEMO");
      stopDemo();
      let demoMotion = { speed, direction: speed >= 132 ? -1 : 1, holdTicks: 0 };
      demoTimerRef.current = window.setInterval(() => {
        setSpeed((previous) => {
          demoMotion = advanceDemoMotion({ ...demoMotion, speed: previous });
          return demoMotion.speed;
        });
      }, 180);
    } else {
      logDiagnosticEvent("speed-source.changed", { source: "GPS" });
      stopDemo();
      sourceRef.current = "GPS";
      setSource("GPS");
      setSpeed(smoothedSpeedRef.current);
    }
  }, [logDiagnosticEvent, source, speed, stopDemo, wakeControls]);

  const runHarness = useCallback(async () => {
    sessionStartedAtRef.current = performance.now();
    diagnosticsActiveRef.current = true;
    diagnosticEventsRef.current = [];
    frameTelemetryRef.current = createFrameTelemetry(performance.now());
    connectionHistoryRef.current = [readConnectionSnapshot("harness-start")];
    longTaskTelemetryRef.current = {
      ...longTaskTelemetryRef.current,
      count: 0,
      totalDurationMs: 0,
      maximumDurationMs: null,
      recentDurationsMs: [],
    };
    logDiagnosticEvent("harness.started");
    setPhase("testing");
    wakeControls();
    const graphics = readGraphicsCapabilities();
    let storage = false;
    try {
      localStorage.setItem("__sv_probe__", "1");
      localStorage.removeItem("__sv_probe__");
      storage = true;
    } catch {
      storage = false;
    }

    audioRef.current = createAudioEngine(triggerPulse);
    if (audioRef.current) {
      await audioRef.current.resume();
      audioRef.current.setPerformance({ fullEnergyKmh });
      audioRef.current.setMuted(false);
      audioRef.current.startCue();
      window.clearInterval(audioMeterTimerRef.current);
      audioMeterTimerRef.current = window.setInterval(() => {
        setAudioLevel(audioRef.current?.getLevel() ?? 0);
      }, 180);
    }
    startGps();
    const display = readDisplaySnapshot("harness-start");
    const connection = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
    const context = audioRef.current?.context;
    setDiagnostics({
      display,
      viewportHistory: [display],
      graphics,
      audio: {
        available: Boolean(context),
        state: context?.state ?? "unavailable",
        sampleRate: context?.sampleRate ?? null,
        baseLatencyMs: Number.isFinite(context?.baseLatency) ? context.baseLatency * 1000 : null,
        outputLatencyMs: Number.isFinite(context?.outputLatency) ? context.outputLatency * 1000 : null,
        audioWorklet: Boolean(context?.audioWorklet),
      },
      capabilities: {
        wasm: typeof WebAssembly === "object",
        serviceWorker: "serviceWorker" in navigator,
        serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller),
        cacheStorage: "caches" in window,
        indexedDb: "indexedDB" in window,
        localStorage: storage,
        offscreenCanvas: typeof OffscreenCanvas !== "undefined",
        webCodecs: "VideoEncoder" in window || "AudioEncoder" in window,
        touchPoints: navigator.maxTouchPoints || 0,
        hardwareConcurrency: navigator.hardwareConcurrency ?? null,
        deviceMemoryGb: navigator.deviceMemory ?? null,
      },
      environment: {
        secureContext: window.isSecureContext,
        online: navigator.onLine,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.userAgentData?.platform ?? navigator.platform ?? null,
        mobileHint: navigator.userAgentData?.mobile ?? null,
        connectionType: connection?.effectiveType ?? null,
        downlinkMbps: connection?.downlink ?? null,
        roundTripTimeMs: connection?.rtt ?? null,
        saveData: connection?.saveData ?? null,
        reducedMotion,
        userAgent: navigator.userAgent,
      },
    });
    readExtendedCapabilities().then((extendedCapabilities) => {
      setDiagnostics((current) => current ? {
        ...current,
        capabilities: { ...current.capabilities, ...extendedCapabilities },
      } : current);
    });
    window.setTimeout(() => {
      setPhase("running");
      wakeControls();
    }, reducedMotion ? 180 : 620);
  }, [fullEnergyKmh, logDiagnosticEvent, reducedMotion, startGps, triggerPulse, wakeControls]);

  useEffect(() => {
    const supported = typeof PerformanceObserver !== "undefined"
      && PerformanceObserver.supportedEntryTypes?.includes("longtask");
    longTaskTelemetryRef.current.supported = Boolean(supported);
    if (!supported) return undefined;
    const observer = new PerformanceObserver((list) => {
      if (!diagnosticsActiveRef.current) return;
      for (const entry of list.getEntries()) {
        const duration = Number.isFinite(entry.duration) ? entry.duration : 0;
        const telemetry = longTaskTelemetryRef.current;
        telemetry.count += 1;
        telemetry.totalDurationMs += duration;
        telemetry.maximumDurationMs = Math.max(telemetry.maximumDurationMs ?? duration, duration);
        telemetry.recentDurationsMs = [...telemetry.recentDurationsMs, duration].slice(-60);
      }
    });
    observer.observe({ entryTypes: ["longtask"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const connection = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
    const capture = (reason) => {
      if (!diagnosticsActiveRef.current) return;
      const snapshot = readConnectionSnapshot(reason);
      connectionHistoryRef.current = appendConnectionHistory(connectionHistoryRef.current, snapshot);
      logDiagnosticEvent("network.changed", {
        reason,
        online: snapshot.online,
        effectiveType: snapshot.effectiveType,
        downlinkMbps: snapshot.downlinkMbps,
        roundTripTimeMs: snapshot.roundTripTimeMs,
      });
    };
    const onConnectionChange = () => capture("connection-change");
    const onOnline = () => capture("online");
    const onOffline = () => capture("offline");
    const onVisibility = () => logDiagnosticEvent("document.visibility", { state: document.visibilityState });
    connection?.addEventListener?.("change", onConnectionChange);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      connection?.removeEventListener?.("change", onConnectionChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [logDiagnosticEvent]);

  useEffect(() => { audioRef.current?.setSpeed(speed); }, [speed]);
  useEffect(() => { audioRef.current?.setPerformance({ fullEnergyKmh }); }, [fullEnergyKmh]);
  useEffect(() => { audioRef.current?.setMuted(muted); }, [muted]);
  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ fullEnergyKmh, themeId }));
    } catch {
      // Preference persistence is optional.
    }
  }, [fullEnergyKmh, themeId]);

  const captureViewport = useCallback((reason) => {
    const snapshot = readDisplaySnapshot(reason);
    logDiagnosticEvent("viewport.measured", {
      reason,
      innerWidth: snapshot.innerWidth,
      innerHeight: snapshot.innerHeight,
      dpr: snapshot.dpr,
      mode: snapshot.mode,
    });
    setDiagnostics((current) => current ? {
      ...current,
      display: snapshot,
      viewportHistory: appendViewportHistory(current.viewportHistory ?? [], snapshot),
    } : current);
  }, [logDiagnosticEvent]);

  useEffect(() => {
    if (phase !== "running") return undefined;
    const scheduleCapture = (reason) => {
      window.clearTimeout(viewportCaptureTimerRef.current);
      viewportCaptureTimerRef.current = window.setTimeout(() => captureViewport(reason), 140);
    };
    const onResize = () => scheduleCapture("window-resize");
    const onVisualResize = () => scheduleCapture("visual-viewport-resize");
    const onOrientation = () => scheduleCapture("orientation-change");
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onVisualResize, { passive: true });
    window.screen.orientation?.addEventListener("change", onOrientation);
    captureViewport("experience-running");
    return () => {
      window.clearTimeout(viewportCaptureTimerRef.current);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onVisualResize);
      window.screen.orientation?.removeEventListener("change", onOrientation);
    };
  }, [captureViewport, phase]);

  useEffect(() => {
    if (phase !== "running") return undefined;
    const handler = (event) => {
      if (!canUseKeyboardTarget(event.target)) return;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        sourceRef.current = "DEMO";
        if (source !== "DEMO") setSource("DEMO");
        stopDemo();
        setSpeed((previous) => {
          const next = applyKeyboardDelta(previous, event.key === "ArrowUp" ? "up" : "down");
          setKeyboardHint(`${Math.round(next)} km/h · SIM`);
          return next;
        });
        window.clearTimeout(keyboardLeaseTimerRef.current);
        keyboardLeaseTimerRef.current = window.setTimeout(() => {
          sourceRef.current = "GPS";
          setSource("GPS");
          setSpeed(smoothedSpeedRef.current);
        }, 4200);
        window.clearTimeout(keyboardHintTimerRef.current);
        keyboardHintTimerRef.current = window.setTimeout(() => setKeyboardHint(null), 1600);
        wakeControls();
      } else if (event.code === "Space") {
        event.preventDefault();
        triggerBrake();
        setKeyboardHint("BRAKE · SIM");
        window.clearTimeout(keyboardHintTimerRef.current);
        keyboardHintTimerRef.current = window.setTimeout(() => setKeyboardHint(null), 1200);
        wakeControls();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, source, stopDemo, triggerBrake, wakeControls]);

  useEffect(() => () => {
    diagnosticsActiveRef.current = false;
    window.clearTimeout(wakeTimerRef.current);
    window.clearTimeout(keyboardHintTimerRef.current);
    window.clearTimeout(keyboardLeaseTimerRef.current);
    window.clearInterval(audioMeterTimerRef.current);
    window.clearTimeout(viewportCaptureTimerRef.current);
    stopDemo();
    if (watchRef.current != null) navigator.geolocation?.clearWatch(watchRef.current);
    audioRef.current?.destroy();
  }, [stopDemo]);

  const diagnosticReport = useMemo(() => diagnostics ? {
    schema: "sedicivalvole.tesla-diagnostic.v3",
    generatedAt: new Date().toISOString(),
    app: {
      version: APP_VERSION,
      mode: "flux",
      environment: "aperture",
      pageUrl: window.location.href,
      source,
      displayedSpeedKmh: Math.round(speed * 10) / 10,
      bpm: Math.round(bpm * 10) / 10,
      energy: Math.round(energy * 1000) / 1000,
      fullEnergyKmh,
      bodyColorTheme: themeId,
      muted,
      arrangement: audioRef.current?.getState() ?? null,
    },
    display: diagnostics.display,
    viewportHistory: diagnostics.viewportHistory,
    graphics: { ...diagnostics.graphics, activeRenderer: renderer },
    audio: {
      ...diagnostics.audio,
      state: audioRef.current?.context.state ?? diagnostics.audio.state,
      level: Math.round(audioLevel * 1000) / 1000,
    },
    gps: {
      state: gpsState,
      speedField: gpsState === "live" ? "numeric" : "not-confirmed",
      accuracyM: accuracy,
      telemetry: summarizeGpsTelemetry(gpsTelemetryRef.current),
    },
    capabilities: diagnostics.capabilities,
    environment: {
      ...diagnostics.environment,
      currentVisibility: document.visibilityState,
    },
    network: {
      current: readConnectionSnapshot("report-generated"),
      history: connectionHistoryRef.current,
      rawCellularSignalStrengthAvailable: false,
    },
    performance: readPerformanceSnapshot(
      frameTelemetryRef.current,
      longTaskTelemetryRef.current,
      sessionStartedAtRef.current,
    ),
    events: diagnosticEventsRef.current,
    privacy: {
      coordinatesCollected: false,
      coordinatesStored: false,
      coordinatesTransmitted: false,
      automaticRemoteTelemetry: false,
      transmissionRequiresExplicitGesture: true,
    },
  } : null, [accuracy, audioLevel, bpm, diagnostics, energy, fullEnergyKmh, gpsState, muted, renderer, source, speed, themeId]);
  const diagnosticText = diagnosticReport ? JSON.stringify(diagnosticReport, null, 2) : "Test not run yet";

  const sendDiagnostic = useCallback(async () => {
    if (!diagnosticReport || sendState === "sending") return;
    setSendState("sending");
    logDiagnosticEvent("diagnostic-send.requested");
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/send-diagnostic.php`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: diagnosticReport.schema, report: diagnosticReport }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) throw new Error("diagnostic_send_failed");
      setSendState("sent");
      logDiagnosticEvent("diagnostic-send.accepted", { status: result.status });
    } catch {
      setSendState("error");
      logDiagnosticEvent("diagnostic-send.failed");
    }
  }, [diagnosticReport, logDiagnosticEvent, sendState]);

  return (
    <main
      className={`app phase-${phase} ${controlsAwake || drawerOpen ? "controls-awake" : "controls-resting"}`}
      data-theme={themeId}
      onPointerDown={handleSurfacePointerDown}
      onPointerMove={wakeControls}
    >
      <FluxField
        energy={energy}
        theme={theme}
        reducedMotion={reducedMotion}
        pulse={pulseFlash}
        brake={brakeFlash}
        onRenderer={setRenderer}
        onFrame={recordRenderedFrame}
      />
      {keyboardHint ? <div className="keyboard-hint" role="status">{keyboardHint}</div> : null}

      <section className="splash" aria-hidden={phase === "running"}>
        <div className="splash-mark"><span>sedicivalvole</span><small>FLUX · APERTURE · {APP_VERSION}</small></div>
        <div className="splash-action">
          <p>PLAY THE ROAD.</p>
          <button className="launch-button" type="button" onClick={runHarness} disabled={phase === "testing"}>
            {phase === "testing" ? "TESTING" : "TEST & START"}
          </button>
          <small>Audio, display, motion, and GPS are checked locally.</small>
        </div>
      </section>

      <section className="experience" aria-hidden={phase !== "running"}>
        <header className="topbar control-layer">
          <button className="wordmark" type="button" onClick={() => setDrawerOpen(true)} aria-label="Open diagnostic report">
            sedicivalvole
          </button>
          <ModeSelector />
          <span className="speed-spacer" aria-hidden="true" />
          <span className={`gps-state ${gpsState === "live" || source === "DEMO" ? "is-live" : ""}`}>GPS</span>
          <button className="diag-button" type="button" onClick={() => setDrawerOpen(true)}>DIAG</button>
        </header>

        <button className="source-readout" type="button" onClick={toggleSource} aria-label={`Speed source ${source}. Tap to switch`}>
          <strong>{Math.round(speed)}</strong><span>km/h</span><small>{source}</small>
        </button>

        <div className="energy-readout" aria-hidden="true">
          {Math.round(bpm)} BPM / ENERGY {Math.round(energy * 100)}
        </div>

        <footer className="control-slab control-layer" aria-label="Flux performance controls">
          <button
            className={`stop-button ${muted ? "is-muted" : ""}`}
            type="button"
            onClick={async () => {
              if (muted) await audioRef.current?.resume();
              setMuted((value) => !value);
            }}
            aria-pressed={muted}
          >
            <span>STOP / MUTE</span><strong>{muted ? "MUTED" : "RUNNING"}</strong>
          </button>
          <div className="environment-control">
            <span className="control-label">ENVIRONMENT</span>
            <strong>APERTURE</strong><small>01</small>
          </div>
          <EnergyThresholdControl value={fullEnergyKmh} onChange={setFullEnergyKmh} />
          <BodyColorControl themeId={themeId} onChange={setThemeId} />
        </footer>
      </section>

      {drawerOpen ? (
        <section className="diagnostic-drawer" role="dialog" aria-modal="true" aria-labelledby="diagnostic-title">
          <button className="drawer-backdrop" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close" />
          <div className="drawer-panel">
            <div className="drawer-heading">
              <div><small>TESLA CAPABILITY HARNESS</small><h2 id="diagnostic-title">Device report</h2></div>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close report">CLOSE</button>
            </div>
            <div className="diagnostic-grid">
              <article><small>VIEWPORT</small><strong>{diagnostics ? `${diagnostics.display.innerWidth} × ${diagnostics.display.innerHeight}` : "—"}</strong><span>{diagnostics ? `${diagnostics.display.mode} · DPR ${diagnostics.display.dpr}` : "—"}</span></article>
              <article><small>RENDERER</small><strong>{renderer}</strong><span>{reducedMotion ? "reduced motion" : "motion active"}</span></article>
              <article><small>WEB AUDIO</small><strong>{diagnostics?.audio.state || "—"}</strong><span>{muted ? "muted" : `signal ${Math.round(audioLevel * 100)}%`}</span></article>
              <article><small>GPS SPEED</small><strong>{gpsState}</strong><span>{accuracy == null ? "accuracy unavailable" : `accuracy ±${accuracy} m`}</span></article>
              <article><small>FRAME PACING</small><strong>{diagnosticReport?.performance.frame.averageFps ?? "—"} FPS</strong><span>{diagnosticReport?.performance.frame.p95FrameMs ?? "—"} ms p95</span></article>
              <article><small>NETWORK</small><strong>{diagnosticReport?.network.current.effectiveType || (diagnosticReport?.network.current.online ? "online" : "offline") || "—"}</strong><span>{diagnosticReport?.network.current.roundTripTimeMs ?? "—"} ms RTT</span></article>
            </div>
            <p className="privacy-note">No coordinates are displayed, stored, or transmitted. Extended technical telemetry is aggregated locally and sent only after pressing SEND DIAGNOSTIC.</p>
            <pre>{diagnosticText}</pre>
            <div className="drawer-actions">
              <button className="send-diagnostic-button" type="button" onClick={sendDiagnostic} disabled={sendState === "sending"}>
                {sendState === "sending" ? "SENDING…" : sendState === "sent" ? "SENT" : "SEND DIAGNOSTIC"}
              </button>
              <button type="button" onClick={() => navigator.clipboard?.writeText(diagnosticText)}>COPY REPORT</button>
              <button type="button" onClick={toggleSource}>{source === "GPS" ? "TRY DEMO MODE" : "RETURN TO GPS"}</button>
            </div>
            <p className={`send-state send-state-${sendState}`} role="status" aria-live="polite">
              {sendState === "sent" ? "Accepted by the server mail transport. Inbox delivery still needs confirmation." : null}
              {sendState === "error" ? "The report could not be sent. No diagnostic data was stored by the app." : null}
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
