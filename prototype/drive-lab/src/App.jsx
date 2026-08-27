import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createAudioEngine } from "./audio-engine.js";
import {
  appendConnectionHistory,
  appendViewportHistory,
  createDriveTelemetry,
  createDriveTelemetryReport,
  createFrameTelemetry,
  createGpsTelemetry,
  DRIVE_TRACE_INTERVAL_MS,
  fitDiagnosticReportForTransport,
  inferViewportMode,
  recordDriveTelemetrySample,
  recordFrameSample,
  recordGpsSample,
  summarizeFrameTelemetry,
  summarizeGpsTelemetry,
} from "./diagnostics-model.js";
import { FluxField } from "./flux-field.jsx";
import { FLUX_ENVIRONMENTS, getFluxEnvironment, nextFluxEnvironmentId } from "./flux-environments.js";
import { FLUX_THEMES, getFluxTheme } from "./flux-themes.js";
import { SplashSignalGate } from "./splash-signal-gate.jsx";
import { Interstate7Field } from "./interstate-7-field.jsx";
import { MeridianField } from "./environments/meridian/meridian-field.jsx";
import { LatitudesField } from "./environments/latitudes/latitudes-field.jsx";
import {
  advanceDemoMotion,
  MODEL_3_AWD_REFERENCE,
  normalizeGpsSpeed,
  ROAD_SPEED_CEILING_KMH,
  smoothGpsSpeed,
  speedToBpm,
  speedToEnergy,
} from "./signal-model.js";

const APP_VERSION = __APP_VERSION__;
const APP_BUILD = __APP_BUILD__;
const APP_COMMIT = __APP_COMMIT__;
const PREFERENCES_KEY = "sedicivalvole.preferences.v1";
const DIAGNOSTIC_SEND_ERROR_COPY = {
  payload_size_rejected: "The browser report exceeded the transport limit. Keep this page open and retry after an update.",
  report_rejected: "The server report exceeded the mail limit. Keep this page open and retry after an update.",
  rate_limited: "Please wait 20 seconds before sending the report again.",
  recipient_unavailable: "The private diagnostic recipient is unavailable on the server.",
  mail_transport_rejected: "The server mail transport rejected the report.",
  serialization_precision_unavailable: "The server could not apply safe diagnostic number formatting.",
  network_error: "The diagnostic request did not reach the server. Check the connection and retry.",
};

function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "null");
    return {
      themeId: FLUX_THEMES.some((theme) => theme.id === value?.themeId) ? value.themeId : "red",
      environmentId: FLUX_ENVIRONMENTS.some((environment) => environment.id === value?.environmentId)
        ? value.environmentId
        : "aperture",
    };
  } catch {
    return { themeId: "red", environmentId: "aperture" };
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

function ScoreRoadmapControl() {
  return (
    <div className="score-control" aria-label="Current score prototype. textStep sequencer is next">
      <span className="control-label">SCORE</span>
      <strong>PROTOTYPE</strong>
      <small>TEXTSTEP · NEXT</small>
    </div>
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
  const [sendErrorCode, setSendErrorCode] = useState(null);
  const [pulseFlash, setPulseFlash] = useState(0);
  const [activeEffect, setActiveEffect] = useState(null);
  const [keyboardHint, setKeyboardHint] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [flightRecorderRevision, setFlightRecorderRevision] = useState(0);
  const [themeId, setThemeId] = useState(initialPreferences.themeId);
  const [environmentId, setEnvironmentId] = useState(initialPreferences.environmentId);
  const reducedMotion = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    [],
  );

  const audioRef = useRef(null);
  const appRef = useRef(null);
  const watchRef = useRef(null);
  const wakeTimerRef = useRef(null);
  const controlsHiddenAtPointerDownRef = useRef(false);
  const smoothedSpeedRef = useRef(0);
  const demoTimerRef = useRef(null);
  const demoMotionRef = useRef(null);
  const demoDriveInputRef = useRef("auto");
  const brakeCooldownRef = useRef(0);
  const brakeFlashTimerRef = useRef(null);
  const brakeHeldRef = useRef(false);
  const brakeStartedAtRef = useRef(0);
  const brakeReturnToGpsRef = useRef(false);
  const acceleratorHeldRef = useRef(false);
  const acceleratorStartedAtRef = useRef(0);
  const keyboardReturnToGpsRef = useRef(false);
  const keyboardHintTimerRef = useRef(null);
  const keyboardLeaseTimerRef = useRef(null);
  const sourceRef = useRef("GPS");
  const speedRef = useRef(0);
  const lastGpsSampleAtRef = useRef(null);
  const gpsSpeedLockedRef = useRef(false);
  const audioMeterTimerRef = useRef(null);
  const flightRecorderTimerRef = useRef(null);
  const viewportCaptureTimerRef = useRef(null);
  const gpsTelemetryRef = useRef(createGpsTelemetry(performance.now()));
  const driveTelemetryRef = useRef(createDriveTelemetry(performance.now()));
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
  const runtimeIssuesRef = useRef([]);
  const latestGpsObservationRef = useRef({ capturedAtMs: null, speedKmh: null });
  const sessionStartedAtRef = useRef(performance.now());
  const gpsStateRef = useRef(gpsState);
  const accuracyRef = useRef(accuracy);
  const audioLevelRef = useRef(audioLevel);
  const rendererRef = useRef(renderer);
  const drawerOpenRef = useRef(drawerOpen);

  const theme = getFluxTheme(themeId);
  const environment = getFluxEnvironment(environmentId);
  const energy = speedToEnergy(speed);
  const bpm = speedToBpm(speed);
  speedRef.current = speed;
  gpsStateRef.current = gpsState;
  accuracyRef.current = accuracy;
  audioLevelRef.current = audioLevel;
  rendererRef.current = renderer;
  drawerOpenRef.current = drawerOpen;

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

  const handleSurfacePointerDown = useCallback((event) => {
    controlsHiddenAtPointerDownRef.current = !(controlsAwake || drawerOpen);
    if (!(event.target instanceof Element)
      || !event.target.closest("button, input, textarea, select, [contenteditable='true'], [role='slider']")) {
      appRef.current?.focus({ preventScroll: true });
    }
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
    window.clearTimeout(brakeFlashTimerRef.current);
    setBrakeFlash(1);
    brakeFlashTimerRef.current = window.setTimeout(() => setBrakeFlash(0), 460);
  }, [logDiagnosticEvent]);

  const startGps = useCallback(() => {
    gpsTelemetryRef.current = createGpsTelemetry(performance.now());
    lastGpsSampleAtRef.current = null;
    gpsSpeedLockedRef.current = false;
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
        latestGpsObservationRef.current = { capturedAtMs, speedKmh: kmh };
        gpsTelemetryRef.current = recordGpsSample(gpsTelemetryRef.current, {
          capturedAtMs,
          speedKmh: kmh,
          accuracyM: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        });
        if (kmh == null) {
          logDiagnosticEvent("gps.sample", {
            speedKmh: null,
            filteredSpeedKmh: null,
            accuracyM: Number.isFinite(position.coords.accuracy)
              ? Math.round(position.coords.accuracy * 10) / 10
              : null,
          });
          setGpsState("GPS active · speed is null");
          return;
        }
        const elapsedSeconds = lastGpsSampleAtRef.current == null
          ? 1
          : (capturedAtMs - lastGpsSampleAtRef.current) / 1000;
        lastGpsSampleAtRef.current = capturedAtMs;
        const next = gpsSpeedLockedRef.current
          ? smoothGpsSpeed(smoothedSpeedRef.current, kmh, elapsedSeconds)
          : kmh;
        gpsSpeedLockedRef.current = true;
        smoothedSpeedRef.current = next;
        logDiagnosticEvent("gps.sample", {
          speedKmh: Math.round(kmh * 10) / 10,
          filteredSpeedKmh: Math.round(next * 10) / 10,
          elapsedMs: Math.round(elapsedSeconds * 1000),
          accuracyM: Number.isFinite(position.coords.accuracy)
            ? Math.round(position.coords.accuracy * 10) / 10
            : null,
        });
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

  const startDemo = useCallback((initialMotion = {}) => {
    stopDemo();
    demoMotionRef.current = {
      speed: Math.max(0, Number(initialMotion.speed) || 0),
      direction: initialMotion.direction === -1 ? -1 : 1,
      holdSeconds: Math.max(0, Number(initialMotion.holdSeconds) || 0),
      brakeHeldSeconds: 0,
      liftOffSeconds: 0,
    };
    let lastStepAt = performance.now();
    demoTimerRef.current = window.setInterval(() => {
      const now = performance.now();
      const elapsedSeconds = (now - lastStepAt) / 1000;
      lastStepAt = now;
      const nextMotion = advanceDemoMotion(
        { ...demoMotionRef.current, speed: speedRef.current },
        elapsedSeconds,
        brakeHeldRef.current,
        demoDriveInputRef.current,
      );
      demoMotionRef.current = nextMotion;
      speedRef.current = nextMotion.speed;
      setSpeed(nextMotion.speed);
      if (demoDriveInputRef.current === "regen"
        && keyboardReturnToGpsRef.current
        && Math.abs(nextMotion.speed - smoothedSpeedRef.current) <= 1.5) {
        window.clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
        demoDriveInputRef.current = "auto";
        keyboardReturnToGpsRef.current = false;
        sourceRef.current = "GPS";
        setSource("GPS");
        speedRef.current = smoothedSpeedRef.current;
        setSpeed(smoothedSpeedRef.current);
        logDiagnosticEvent("speed-source.changed", {
          source: "GPS",
          reason: "simulated-motion-converged",
        });
      }
    }, 50);
  }, [logDiagnosticEvent, stopDemo]);

  const toggleSource = useCallback(() => {
    if (controlsHiddenAtPointerDownRef.current) {
      controlsHiddenAtPointerDownRef.current = false;
      logDiagnosticEvent("controls.woken", { source: "speed-readout" });
      return;
    }
    wakeControls();
    window.clearTimeout(keyboardLeaseTimerRef.current);
    brakeReturnToGpsRef.current = false;
    acceleratorHeldRef.current = false;
    keyboardReturnToGpsRef.current = false;
    demoDriveInputRef.current = "auto";
    if (sourceRef.current === "GPS") {
      logDiagnosticEvent("speed-source.changed", { source: "DEMO" });
      sourceRef.current = "DEMO";
      setSource("DEMO");
      startDemo({
        speed: speedRef.current,
        direction: speedRef.current >= ROAD_SPEED_CEILING_KMH ? -1 : 1,
      });
    } else {
      logDiagnosticEvent("speed-source.changed", { source: "GPS" });
      stopDemo();
      brakeHeldRef.current = false;
      window.clearTimeout(brakeFlashTimerRef.current);
      setBrakeFlash(0);
      sourceRef.current = "GPS";
      setSource("GPS");
      setSpeed(smoothedSpeedRef.current);
    }
  }, [logDiagnosticEvent, startDemo, stopDemo, wakeControls]);

  const startKeyboardBrake = useCallback(() => {
    if (brakeHeldRef.current) return;
    window.clearTimeout(keyboardLeaseTimerRef.current);
    window.clearTimeout(keyboardHintTimerRef.current);
    brakeHeldRef.current = true;
    brakeStartedAtRef.current = performance.now();
    brakeReturnToGpsRef.current = sourceRef.current === "GPS";
    if (sourceRef.current !== "DEMO") {
      sourceRef.current = "DEMO";
      setSource("DEMO");
      logDiagnosticEvent("speed-source.changed", { source: "DEMO", reason: "keyboard-brake" });
    }
    startDemo({ speed: speedRef.current, direction: -1 });
    triggerBrake();
    window.clearTimeout(brakeFlashTimerRef.current);
    setBrakeFlash(1);
    setKeyboardHint("BRAKE HOLD · SIM");
    logDiagnosticEvent("brake.hold.started", {
      speedKmh: Math.round(speedRef.current * 10) / 10,
      referenceVehicle: MODEL_3_AWD_REFERENCE.label,
      curbMassKg: MODEL_3_AWD_REFERENCE.curbMassKg,
    });
    wakeControls();
  }, [logDiagnosticEvent, startDemo, triggerBrake, wakeControls]);

  const releaseKeyboardBrake = useCallback(() => {
    if (!brakeHeldRef.current) return;
    brakeHeldRef.current = false;
    window.clearTimeout(brakeFlashTimerRef.current);
    setBrakeFlash(0);
    const acceleratorHeld = acceleratorHeldRef.current;
    demoDriveInputRef.current = acceleratorHeld ? "accelerator" : "auto";
    demoMotionRef.current = {
      speed: speedRef.current,
      direction: 1,
      holdSeconds: acceleratorHeld ? 0 : 0.55,
      brakeHeldSeconds: 0,
      liftOffSeconds: 0,
    };
    setKeyboardHint(`${Math.round(speedRef.current)} km/h · SIM`);
    window.clearTimeout(keyboardHintTimerRef.current);
    keyboardHintTimerRef.current = window.setTimeout(() => setKeyboardHint(null), 1200);
    logDiagnosticEvent("brake.hold.ended", {
      speedKmh: Math.round(speedRef.current * 10) / 10,
      heldMs: Math.round(performance.now() - brakeStartedAtRef.current),
    });
    if (brakeReturnToGpsRef.current) {
      keyboardLeaseTimerRef.current = window.setTimeout(() => {
        stopDemo();
        sourceRef.current = "GPS";
        setSource("GPS");
        setSpeed(smoothedSpeedRef.current);
        brakeReturnToGpsRef.current = false;
        logDiagnosticEvent("speed-source.changed", { source: "GPS", reason: "keyboard-lease-ended" });
      }, 4200);
    }
  }, [logDiagnosticEvent, stopDemo]);

  const startKeyboardAcceleration = useCallback(() => {
    if (acceleratorHeldRef.current) return;
    window.clearTimeout(keyboardLeaseTimerRef.current);
    window.clearTimeout(keyboardHintTimerRef.current);
    keyboardReturnToGpsRef.current = keyboardReturnToGpsRef.current
      || sourceRef.current === "GPS";
    acceleratorHeldRef.current = true;
    acceleratorStartedAtRef.current = performance.now();
    demoDriveInputRef.current = "accelerator";
    if (sourceRef.current !== "DEMO") {
      sourceRef.current = "DEMO";
      setSource("DEMO");
      logDiagnosticEvent("speed-source.changed", {
        source: "DEMO",
        reason: "keyboard-accelerator",
      });
    }
    startDemo({ speed: speedRef.current, direction: 1 });
    setKeyboardHint("ACCELERATE HOLD · SIM");
    logDiagnosticEvent("accelerator.hold.started", {
      speedKmh: Math.round(speedRef.current * 10) / 10,
      referenceVehicle: MODEL_3_AWD_REFERENCE.label,
    });
    wakeControls();
  }, [logDiagnosticEvent, startDemo, wakeControls]);

  const startKeyboardRegeneration = useCallback((reason = "accelerator-release") => {
    acceleratorHeldRef.current = false;
    demoDriveInputRef.current = "regen";
    demoMotionRef.current = {
      speed: speedRef.current,
      direction: -1,
      holdSeconds: 0,
      brakeHeldSeconds: 0,
      liftOffSeconds: 0,
    };
    if (demoTimerRef.current == null) {
      startDemo({ speed: speedRef.current, direction: -1 });
    }
    setKeyboardHint("REGEN RELEASE · SIM");
    window.clearTimeout(keyboardHintTimerRef.current);
    keyboardHintTimerRef.current = window.setTimeout(() => setKeyboardHint(null), 1400);
    logDiagnosticEvent("accelerator.released", {
      speedKmh: Math.round(speedRef.current * 10) / 10,
      heldMs: Math.round(performance.now() - acceleratorStartedAtRef.current),
      reason,
      estimatedPeakRegenerativeDecelerationMps2:
        MODEL_3_AWD_REFERENCE.estimatedPeakRegenerativeDecelerationMps2,
    });
    wakeControls();
  }, [logDiagnosticEvent, startDemo, wakeControls]);

  const releaseKeyboardAcceleration = useCallback(() => {
    if (!acceleratorHeldRef.current) return;
    startKeyboardRegeneration("accelerator-release");
  }, [startKeyboardRegeneration]);

  const runHarness = useCallback(async () => {
    sessionStartedAtRef.current = performance.now();
    diagnosticsActiveRef.current = true;
    diagnosticEventsRef.current = [];
    runtimeIssuesRef.current = [];
    frameTelemetryRef.current = createFrameTelemetry(performance.now());
    driveTelemetryRef.current = createDriveTelemetry(performance.now());
    latestGpsObservationRef.current = { capturedAtMs: null, speedKmh: null };
    setFlightRecorderRevision((revision) => revision + 1);
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

    audioRef.current = createAudioEngine(triggerPulse, setActiveEffect);
    if (audioRef.current) {
      await audioRef.current.resume();
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
      window.requestAnimationFrame(() => appRef.current?.focus({ preventScroll: true }));
    }, reducedMotion ? 180 : 620);
  }, [logDiagnosticEvent, reducedMotion, startGps, triggerPulse, wakeControls]);

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

  useEffect(() => {
    const retainIssue = (type, detail) => {
      if (!diagnosticsActiveRef.current) return;
      const issue = {
        at: new Date().toISOString(),
        elapsedMs: roundMetric(performance.now() - sessionStartedAtRef.current),
        type,
        detail,
      };
      runtimeIssuesRef.current = [...runtimeIssuesRef.current, issue].slice(-24);
      logDiagnosticEvent(type, {
        message: detail.message ?? null,
        renderer: detail.renderer ?? null,
        status: detail.status ?? null,
      });
    };
    const onError = (event) => retainIssue("runtime.error", {
      message: String(event.message || "Unknown runtime error").slice(0, 500),
      file: String(event.filename || "").slice(0, 500),
      line: Number.isFinite(event.lineno) ? event.lineno : null,
      column: Number.isFinite(event.colno) ? event.colno : null,
      stack: String(event.error?.stack || "").slice(0, 2000),
    });
    const onUnhandledRejection = (event) => retainIssue("runtime.unhandled-rejection", {
      message: String(event.reason?.message || event.reason || "Unknown rejection").slice(0, 1000),
      stack: String(event.reason?.stack || "").slice(0, 2000),
    });
    const onContextLost = (event) => retainIssue("graphics.context-lost", {
      renderer: rendererRef.current,
      status: String(event.statusMessage || "").slice(0, 500),
    });
    const onContextRestored = () => retainIssue("graphics.context-restored", {
      renderer: rendererRef.current,
    });
    const onPageHide = (event) => logDiagnosticEvent("document.pagehide", {
      persisted: Boolean(event.persisted),
    });
    const onFreeze = () => logDiagnosticEvent("document.freeze");
    const onResume = () => logDiagnosticEvent("document.resume");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    document.addEventListener("webglcontextlost", onContextLost, true);
    document.addEventListener("webglcontextrestored", onContextRestored, true);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("freeze", onFreeze);
    document.addEventListener("resume", onResume);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      document.removeEventListener("webglcontextlost", onContextLost, true);
      document.removeEventListener("webglcontextrestored", onContextRestored, true);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("freeze", onFreeze);
      document.removeEventListener("resume", onResume);
    };
  }, [logDiagnosticEvent]);

  useEffect(() => {
    if (phase !== "running") return undefined;
    const captureDriveSample = () => {
      const capturedAtMs = performance.now();
      const latestGps = latestGpsObservationRef.current;
      const frame = summarizeFrameTelemetry(frameTelemetryRef.current);
      const connection = readConnectionSnapshot("flight-recorder");
      const audioState = audioRef.current?.getState() ?? null;
      recordDriveTelemetrySample(driveTelemetryRef.current, {
        capturedAtMs,
        speedKmh: speedRef.current,
        rawGpsSpeedKmh: latestGps.speedKmh,
        gpsAgeMs: Number.isFinite(latestGps.capturedAtMs)
          ? Math.max(0, capturedAtMs - latestGps.capturedAtMs)
          : null,
        gpsState: gpsStateRef.current,
        accuracyM: accuracyRef.current,
        source: sourceRef.current,
        driveInput: brakeHeldRef.current ? "service-brake" : demoDriveInputRef.current,
        energy: speedToEnergy(speedRef.current),
        bpm: speedToBpm(speedRef.current),
        averageFps: frame.averageFps,
        p95FrameMs: frame.p95FrameMs,
        audioLevel: audioLevelRef.current,
        audioSection: audioState?.section,
        motionPhase: audioState?.motionPhase,
        online: connection.online,
        effectiveType: connection.effectiveType,
        roundTripTimeMs: connection.roundTripTimeMs,
        visibility: document.visibilityState,
      });
      if (drawerOpenRef.current) setFlightRecorderRevision((revision) => revision + 1);
    };
    captureDriveSample();
    flightRecorderTimerRef.current = window.setInterval(captureDriveSample, DRIVE_TRACE_INTERVAL_MS);
    return () => {
      window.clearInterval(flightRecorderTimerRef.current);
      flightRecorderTimerRef.current = null;
    };
  }, [phase]);

  useEffect(() => { audioRef.current?.setSpeed(speed); }, [speed]);
  useEffect(() => { audioRef.current?.setMuted(muted); }, [muted]);
  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ themeId, environmentId }));
    } catch {
      // Preference persistence is optional.
    }
  }, [environmentId, themeId]);

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
    const handleKeyDown = (event) => {
      if (!canUseKeyboardTarget(event.target)) return;
      if (event.key === "ArrowUp") {
        event.preventDefault();
        startKeyboardAcceleration();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (demoDriveInputRef.current === "regen") return;
        keyboardReturnToGpsRef.current = keyboardReturnToGpsRef.current
          || sourceRef.current === "GPS";
        if (sourceRef.current !== "DEMO") {
          sourceRef.current = "DEMO";
          setSource("DEMO");
          logDiagnosticEvent("speed-source.changed", {
            source: "DEMO",
            reason: "keyboard-regeneration",
          });
        }
        startKeyboardRegeneration("arrow-down");
      } else if (event.code === "Space") {
        event.preventDefault();
        startKeyboardBrake();
      }
    };
    const handleKeyUp = (event) => {
      if (event.key === "ArrowUp") {
        if (canUseKeyboardTarget(event.target)) event.preventDefault();
        releaseKeyboardAcceleration();
      } else if (event.code === "Space") {
        if (canUseKeyboardTarget(event.target)) event.preventDefault();
        releaseKeyboardBrake();
      }
    };
    const handleBlur = () => {
      releaseKeyboardBrake();
      releaseKeyboardAcceleration();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [
    phase,
    logDiagnosticEvent,
    releaseKeyboardAcceleration,
    releaseKeyboardBrake,
    startKeyboardAcceleration,
    startKeyboardBrake,
    startKeyboardRegeneration,
  ]);

  useEffect(() => () => {
    diagnosticsActiveRef.current = false;
    window.clearTimeout(wakeTimerRef.current);
    window.clearTimeout(keyboardHintTimerRef.current);
    window.clearTimeout(keyboardLeaseTimerRef.current);
    window.clearTimeout(brakeFlashTimerRef.current);
    window.clearInterval(audioMeterTimerRef.current);
    window.clearInterval(flightRecorderTimerRef.current);
    window.clearTimeout(viewportCaptureTimerRef.current);
    brakeHeldRef.current = false;
    acceleratorHeldRef.current = false;
    keyboardReturnToGpsRef.current = false;
    demoDriveInputRef.current = "auto";
    stopDemo();
    if (watchRef.current != null) navigator.geolocation?.clearWatch(watchRef.current);
    audioRef.current?.destroy();
  }, [stopDemo]);

  const diagnosticReport = useMemo(() => diagnostics ? {
    schema: "sedicivalvole.tesla-diagnostic.v3",
    generatedAt: new Date().toISOString(),
    app: {
      version: APP_VERSION,
      build: APP_BUILD,
      mode: "flux",
      environment: environmentId,
      pageUrl: window.location.href,
      source,
      displayedSpeedKmh: Math.round(speed * 10) / 10,
      bpm: Math.round(bpm * 10) / 10,
      energy: Math.round(energy * 1000) / 1000,
      energyCeilingKmh: ROAD_SPEED_CEILING_KMH,
      bodyColorTheme: themeId,
      muted,
      arrangement: audioRef.current?.getState() ?? null,
    },
    simulation: {
      referenceVehicle: MODEL_3_AWD_REFERENCE.label,
      curbMassKg: MODEL_3_AWD_REFERENCE.curbMassKg,
      officialZeroToHundredSeconds: MODEL_3_AWD_REFERENCE.zeroToHundredSeconds,
      estimatedBrakeForceN: MODEL_3_AWD_REFERENCE.estimatedBrakeForceN,
      estimatedPeakRegenerativeDecelerationMps2:
        MODEL_3_AWD_REFERENCE.estimatedPeakRegenerativeDecelerationMps2,
      liftOffRampSeconds: MODEL_3_AWD_REFERENCE.liftOffRampSeconds,
      vehicleHoldCaptureKmh: MODEL_3_AWD_REFERENCE.vehicleHoldCaptureKmh,
      regenerativeModelStatus: "nominal-estimate",
      batteryRegenerationAvailabilityObserved: false,
      brakeHeld: brakeHeldRef.current,
      acceleratorHeld: acceleratorHeldRef.current,
      activeDriveInput: demoDriveInputRef.current,
      physicsAppliesTo: "demo-and-gps-tolerance",
      gpsMotionFabricated: false,
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
    flightRecorder: createDriveTelemetryReport(driveTelemetryRef.current, performance.now()),
    runtimeIssues: runtimeIssuesRef.current,
    events: diagnosticEventsRef.current,
    privacy: {
      coordinatesCollected: false,
      coordinatesStored: false,
      coordinatesTransmitted: false,
      automaticRemoteTelemetry: false,
      transmissionRequiresExplicitGesture: true,
      recorderStorage: "bounded-session-memory-only",
    },
  } : null, [diagnostics, drawerOpen, flightRecorderRevision]);
  const diagnosticText = useMemo(
    () => diagnosticReport ? JSON.stringify(diagnosticReport, null, 2) : "Test not run yet",
    [diagnosticReport],
  );
  const diagnosticPayloadBytes = useMemo(
    () => diagnosticReport
      ? new Blob([JSON.stringify(diagnosticReport, null, 2)]).size
      : 0,
    [diagnosticReport],
  );

  const sendDiagnostic = useCallback(async () => {
    if (!diagnosticReport || sendState === "sending") return;
    setSendState("sending");
    setSendErrorCode(null);
    logDiagnosticEvent("diagnostic-send.requested");
    try {
      const reportToSend = fitDiagnosticReportForTransport({
        ...diagnosticReport,
        generatedAt: new Date().toISOString(),
        flightRecorder: createDriveTelemetryReport(driveTelemetryRef.current, performance.now()),
        runtimeIssues: runtimeIssuesRef.current,
        events: diagnosticEventsRef.current,
      });
      const response = await fetch(`${import.meta.env.BASE_URL}api/send-diagnostic.php`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: reportToSend.schema, report: reportToSend }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        const error = new Error("diagnostic_send_failed");
        error.code = typeof result?.status === "string" ? result.status : "network_error";
        throw error;
      }
      setSendState("sent");
      logDiagnosticEvent("diagnostic-send.accepted", { status: result.status });
    } catch (error) {
      const errorCode = typeof error?.code === "string" ? error.code : "network_error";
      setSendState("error");
      setSendErrorCode(errorCode);
      logDiagnosticEvent("diagnostic-send.failed", { code: errorCode });
    }
  }, [diagnosticReport, logDiagnosticEvent, sendState]);

  return (
    <main
      ref={appRef}
      tabIndex={-1}
      className={`app phase-${phase} ${controlsAwake || drawerOpen ? "controls-awake" : "controls-resting"}`}
      data-theme={themeId}
      data-environment={environmentId}
      onPointerDown={handleSurfacePointerDown}
      onPointerMove={wakeControls}
    >
      {environment.renderer === "vertigo" ? (
        <Interstate7Field
          speed={speed}
          reducedMotion={reducedMotion}
          onRenderer={setRenderer}
          onFrame={recordRenderedFrame}
        />
      ) : environment.renderer === "meridian" ? (
        <MeridianField
          speed={speed}
          theme={theme}
          reducedMotion={reducedMotion}
          onRenderer={setRenderer}
          onFrame={recordRenderedFrame}
        />
      ) : environment.renderer === "latitudes" ? (
        <LatitudesField
          speed={speed}
          theme={theme}
          reducedMotion={reducedMotion}
          onRenderer={setRenderer}
          onFrame={recordRenderedFrame}
        />
      ) : (
        <FluxField
          energy={energy}
          speed={speed}
          theme={theme}
          reducedMotion={reducedMotion}
          pulse={pulseFlash}
          brake={brakeFlash}
          onRenderer={setRenderer}
          onFrame={recordRenderedFrame}
        />
      )}
      {keyboardHint ? <div className="keyboard-hint" role="status">{keyboardHint}</div> : null}

      <section className="splash" aria-hidden={phase === "running"}>
        <SplashSignalGate active={phase !== "running"} reducedMotion={reducedMotion} />
        <div className="splash-mark"><span>sedicivalvole</span></div>
        {/* The build stamp, and nothing else. It is generated at build time as
            YYYYMMDD-HHMM and is the identifier quoted whenever a build is
            published. VERSION stays the only SemVer source of truth and is
            reported separately in the diagnostics. The active environment is
            still named in the live header. */}
        <small className="splash-status">BUILD {APP_BUILD}</small>
        <div className="splash-action">
          <button className="launch-button" type="button" onClick={runHarness} disabled={phase === "testing"}>
            {phase === "testing" ? "STARTING" : "PLAY THE ROAD"}
          </button>
          <small className="splash-credit">A project by Netmilk Studio</small>
          <small className="splash-privacy">Audio, display, motion, and GPS are checked locally.</small>
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
          <div className="telemetry-sub">{Math.round(bpm)} BPM · {Math.round(energy * 100)}%{activeEffect && <span className="effect-badge">{activeEffect}</span>}</div>
        </button>



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
          <button
            className="environment-control"
            type="button"
            aria-label={`Visual ${environment.label}. Tap to change`}
            onClick={() => {
              const nextEnvironmentId = nextFluxEnvironmentId(environmentId);
              setEnvironmentId(nextEnvironmentId);
              logDiagnosticEvent("environment.changed", { environment: nextEnvironmentId });
            }}
          >
            <span className="control-label">VISUAL</span>
            <strong>{environment.label}</strong><small>{environment.number}</small>
          </button>
          <ScoreRoadmapControl />
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
              <article><small>FLIGHT RECORDER</small><strong>{diagnosticReport?.flightRecorder.summary.retainedSamples ?? "—"} SAMPLES</strong><span>{Math.round((diagnosticReport?.flightRecorder.summary.sessionDurationMs ?? 0) / 1000)} s · {Math.round(diagnosticPayloadBytes / 1024)} KB report</span></article>
              <article><small>RUNTIME ISSUES</small><strong>{diagnosticReport?.runtimeIssues.length ?? "—"}</strong><span>errors · rejections · WebGL loss</span></article>
            </div>
            <p className="privacy-note">No coordinates are displayed, stored, or transmitted. The bounded flight recorder stays in session memory and is sent only after pressing SEND DIAGNOSTIC. Keep this page open until the report is sent.</p>
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
              {sendState === "error" ? `${DIAGNOSTIC_SEND_ERROR_COPY[sendErrorCode] ?? "The report could not be sent."} No diagnostic data was stored by the app.` : null}
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
