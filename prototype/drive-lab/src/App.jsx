import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createAudioEngine } from "./audio-engine.js";
import {
  appendConnectionHistory,
  appendViewportHistory,
  classifyGpsConfidence,
  createDriveTelemetry,
  createDriveTelemetryReport,
  createFrameTelemetry,
  createGpsTelemetry,
  createPhasePerformanceTelemetry,
  DRIVE_TRACE_INTERVAL_MS,
  fitDiagnosticReportForTransport,
  inferViewportMode,
  recordDriveTelemetrySample,
  recordFrameSample,
  recordPhaseFrame,
  recordPhaseMemorySample,
  recordGpsSample,
  summarizeFrameTelemetry,
  summarizeGpsTelemetry,
  summarizePhasePerformanceTelemetry,
} from "./diagnostics-model.js";
import { FluxField } from "./flux-field.jsx";
import { FLUX_ENVIRONMENTS, getFluxEnvironment } from "./flux-environments.js";
import { FLUX_THEMES, getFluxTheme } from "./flux-themes.js";
import {
  DEFAULT_GENRE_ID,
  getScoreGenre,
  SCORE_GENRES,
  SCORE_STATUS,
  scoreSource,
} from "./score/genres.js";
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
  speedToEnergy,
} from "./signal-model.js";

const AtlasField = lazy(() => import("./environments/atlas/atlas-field.jsx"));

/**
 * The lanes the voice preview can audition.
 *
 * Identifiers are the score's own lane names, so a block here plays exactly what
 * the arrangement plays. The previous list named voices the engine does not
 * have and described a synth it no longer runs.
 */
const SCORE_VOICES = [
  { id: "kick", label: "KICK", note: "909-style body, click and subharmonic" },
  { id: "snare", label: "SNARE", note: "Tuned shell, comb resonance, impact" },
  { id: "ghost", label: "GHOST", note: "The same shell, quiet and short" },
  { id: "closedHat", label: "CLOSED HAT", note: "Six-ratio metallic cluster" },
  { id: "openHat", label: "OPEN HAT", note: "The same cluster, left to ring" },
  { id: "clap", label: "CLAP", note: "Stacked noise bursts" },
  { id: "sub", label: "SUB", note: "Sine root with a square for presence" },
  { id: "reese", label: "REESE", note: "Two detuned saws, an octave up" },
  { id: "riff", label: "THEME", note: "The principal melody" },
  { id: "response", label: "RESPONSE", note: "The countermelody above it" },
  { id: "atmosphere", label: "PAD", note: "The chord, four voices" },
];

const APP_VERSION = __APP_VERSION__;
const APP_BUILD = __APP_BUILD__;
const APP_COMMIT = __APP_COMMIT__;
const PREFERENCES_KEY = "sedicivalvole.preferences.v1";
const QA_SPEED = import.meta.env.DEV
  ? Math.min(130, Math.max(0, Number(new URLSearchParams(window.location.search).get("qaSpeed")) || 0))
  : 0;
const DIAGNOSTIC_SEND_ERROR_COPY = {
  payload_size_rejected: "The browser report exceeded the transport limit. Keep this page open and retry after an update.",
  report_rejected: "The server report exceeded the mail limit. Keep this page open and retry after an update.",
  rate_limited: "Please wait 20 seconds before sending the report again.",
  recipient_unavailable: "The private diagnostic recipient is unavailable on the server.",
  mail_transport_rejected: "The server mail transport rejected the report.",
  serialization_precision_unavailable: "The server could not apply safe diagnostic number formatting.",
  attachment_encoding_unavailable: "The server could not package the complete diagnostic attachment.",
  compression_unavailable: "The server cannot compress the complete diagnostic attachment.",
  mail_packaging_unavailable: "The server could not prepare the diagnostic email attachment.",
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
      // A stored genre is only honoured if it still has an authored score.
      genreId: SCORE_GENRES.some((genre) => (
        genre.id === value?.genreId && genre.status === SCORE_STATUS.ready
      )) ? value.genreId : DEFAULT_GENRE_ID,
    };
  } catch {
    return { themeId: "red", environmentId: "aperture", genreId: DEFAULT_GENRE_ID };
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

function readPerformanceSnapshot(frameTelemetry, phaseTelemetry, longTaskTelemetry, harnessStartedAtMs) {
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
    phases: summarizePhasePerformanceTelemetry(phaseTelemetry),
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

/**
 * The score control in the command bar.
 *
 * The bar keeps the geometry it had: one cell, one label, one value. The
 * library itself opens in a panel, because six entries with their state written
 * on them cannot be legible at arm's length inside a 190px cell, and making the
 * bar taller to fit them would cost the thing that makes this interface work —
 * that it retreats off-canvas entirely and leaves the road.
 */
function DisclosureCaret() {
  return (
    <svg className="disclosure-caret" viewBox="0 0 12 8" aria-hidden="true">
      <path d="m1 1 5 5 5-5" />
    </svg>
  );
}

function VisualControl({ environment, onOpen }) {
  return (
    <button
      className="environment-control"
      type="button"
      aria-haspopup="dialog"
      aria-label={`Visual ${environment.label}. Tap to change`}
      onClick={onOpen}
    >
      <span className="control-label">VISUAL</span>
      <strong>{environment.label}</strong>
      <span className="control-disclosure"><small>{environment.number}</small><DisclosureCaret /></span>
    </button>
  );
}

function MusicControl({ genreId, onOpen }) {
  const selected = getScoreGenre(genreId);
  return (
    <button
      className="score-control"
      type="button"
      aria-haspopup="dialog"
      aria-label={`Music ${selected.label}, ${selected.family}. Tap to change`}
      onClick={onOpen}
    >
      <span className="control-label">MUSIC</span>
      <strong>{selected.label}</strong>
      <span className="control-disclosure" title={scoreSource(genreId).note}>
        <small>{scoreSource(genreId).mark} {selected.number}</small><DisclosureCaret />
      </span>
    </button>
  );
}

function VisualPicker({ environmentId, onChange, onClose }) {
  return (
    <section
      className="diagnostic-drawer score-drawer environment-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visual-picker-title"
    >
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close" />
      <div className="drawer-panel">
        <div className="drawer-heading">
          <div><small>FLUX VISUAL LIBRARY</small><h2 id="visual-picker-title">Visual</h2></div>
          <button type="button" onClick={onClose} aria-label="Close visual library">CLOSE</button>
        </div>
        <ul className="score-list">
          {FLUX_ENVIRONMENTS.map((entry) => {
            const active = entry.id === environmentId;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`score-entry${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => {
                    onChange(entry.id);
                    onClose();
                  }}
                >
                  <span className="score-entry-number">{entry.number}</span>
                  <span className="score-entry-body"><strong>{entry.label}</strong><span>{entry.rendererLabel}</span></span>
                  <span className="score-entry-state">{active ? "ACTIVE" : "SELECT"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/**
 * The score library panel.
 *
 * Every direction is shown, including the ones with nothing authored behind
 * them, and those say so on their own face. They are not hidden, because the
 * library is the roadmap; and they are not selectable, because the project rule
 * is explicit that an unimplemented genre may never be labelled as playing.
 */
function MusicPicker({ genreId, onChange, onClose }) {
  return (
    <section
      className="diagnostic-drawer score-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-picker-title"
    >
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close" />
      <div className="drawer-panel">
        <div className="drawer-heading">
          <div><small>FLUX MUSIC LIBRARY</small><h2 id="score-picker-title">Music</h2></div>
          <button type="button" onClick={onClose} aria-label="Close music library">CLOSE</button>
        </div>
        <ul className="score-list">
          {SCORE_GENRES.map((genre) => {
            const ready = genre.status === SCORE_STATUS.ready;
            const active = ready && genre.id === genreId;
            return (
              <li key={genre.id}>
                <button
                  type="button"
                  className={`score-entry${active ? " is-active" : ""}${ready ? "" : " is-preparing"}`}
                  disabled={!ready}
                  aria-pressed={active}
                  onClick={() => {
                    if (!ready) return;
                    onChange(genre.id);
                    onClose();
                  }}
                >
                  <span className="score-entry-number">{genre.number}</span>
                  <span className="score-entry-body">
                    <strong>
                      {genre.label}
                      <em className={`score-source is-${genre.source}`}>
                        <span aria-hidden="true">{scoreSource(genre.id).mark}</span>
                        {scoreSource(genre.id).label}
                      </em>
                    </strong>
                    <span>{genre.family} · {genre.note}</span>
                  </span>
                  <span className="score-entry-state">
                    {active ? "PLAYING" : ready ? "SELECT" : "IN PREPARATION"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="privacy-note">
          Only finished music can be selected. The rest
          name a direction and the rhythmic family it will be built from.
        </p>
      </div>
    </section>
  );
}

/**
 * Palette.
 *
 * Ten finishes in the cell that held five: the vehicle's own colours on the top
 * row, the five no car is painted in below. The housing keeps its single
 * border; the swatches inside no longer carry one of their own, which was two
 * lines doing one line's work and dulled every colour it framed. A theme that
 * genuinely uses two colours shows both, because showing one and hiding the
 * other misrepresents what selecting it does.
 */
function PaletteControl({ themeId, onChange }) {
  const selected = getFluxTheme(themeId);
  return (
    <fieldset className="palette-control">
      <legend>PALETTE</legend>
      <strong>{selected.label}</strong>
      <div className="swatch-housing">
        {FLUX_THEMES.map((theme) => (
          <button
            key={theme.id}
            className={theme.id === themeId ? "is-selected" : ""}
            type="button"
            aria-label={`Use the ${theme.label.toLowerCase()} palette`}
            aria-pressed={theme.id === themeId}
            onClick={() => onChange(theme.id)}
          >
            <span style={theme.swatchSecondary
              ? { background: `linear-gradient(105deg, ${theme.swatch} 0 52%, ${theme.swatchSecondary} 52% 100%)` }
              : { background: theme.swatch }}
            />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function App() {
  const initialPreferences = useMemo(readPreferences, []);
  const [phase, setPhase] = useState("idle");
  const [speed, setSpeed] = useState(QA_SPEED);
  const [source, setSource] = useState(QA_SPEED > 0 ? "QA" : "GPS");
  const [gpsState, setGpsState] = useState("not tested");
  const [accuracy, setAccuracy] = useState(null);
  const [renderer, setRenderer] = useState("checking…");
  const [muted, setMuted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [controlsAwake, setControlsAwake] = useState(true);
  const [brakeFlash, setBrakeFlash] = useState(0);
  const [diagnostics, setDiagnostics] = useState(null);
  const [sendState, setSendState] = useState("idle");
  const [sendErrorCode, setSendErrorCode] = useState(null);
  const [pulseFlash, setPulseFlash] = useState(0);
  const [activeEffect, setActiveEffect] = useState(null);
  const [scoreTempo, setScoreTempo] = useState(162);
  const [scoreScene, setScoreScene] = useState("REST");
  const scoreStateRef = useRef(null);
  const [keyboardHint, setKeyboardHint] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [flightRecorderRevision, setFlightRecorderRevision] = useState(0);
  const [themeId, setThemeId] = useState(initialPreferences.themeId);
  const [environmentId, setEnvironmentId] = useState(initialPreferences.environmentId);
  const [genreId, setGenreId] = useState(initialPreferences.genreId);
  const [environmentPickerOpen, setEnvironmentPickerOpen] = useState(false);
  const [scorePickerOpen, setScorePickerOpen] = useState(false);
  const [rawReportOpen, setRawReportOpen] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
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
  const sourceRef = useRef(QA_SPEED > 0 ? "QA" : "GPS");
  const speedRef = useRef(QA_SPEED);
  const lastGpsSampleAtRef = useRef(null);
  const lastGpsEventAtRef = useRef(null);
  const gpsSpeedLockedRef = useRef(false);
  const audioMeterTimerRef = useRef(null);
  const flightRecorderTimerRef = useRef(null);
  const performanceSamplerTimerRef = useRef(null);
  const viewportCaptureTimerRef = useRef(null);
  const gpsTelemetryRef = useRef(createGpsTelemetry(performance.now()));
  const driveTelemetryRef = useRef(createDriveTelemetry(performance.now()));
  const frameTelemetryRef = useRef(createFrameTelemetry(performance.now()));
  const phasePerformanceTelemetryRef = useRef(createPhasePerformanceTelemetry(performance.now()));
  const performancePhaseRef = useRef("splash:idle");
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
  const mapPositionUpdatedAtRef = useRef(0);
  const sessionStartedAtRef = useRef(performance.now());
  const gpsStateRef = useRef(gpsState);
  const accuracyRef = useRef(accuracy);
  const audioLevelRef = useRef(audioLevel);
  const environmentIdRef = useRef(environmentId);
  const genreIdRef = useRef(genreId);
  const rendererRef = useRef(renderer);
  const drawerOpenRef = useRef(drawerOpen);

  const theme = getFluxTheme(themeId);
  const environment = getFluxEnvironment(environmentId);
  const energy = speedToEnergy(speed);
  // The tempo shown is the transport's own, reported by the score. Deriving it
  // from speed again would print a number the music never plays.
  const bpm = scoreTempo;
  speedRef.current = speed;
  gpsStateRef.current = gpsState;
  accuracyRef.current = accuracy;
  audioLevelRef.current = audioLevel;
  environmentIdRef.current = environmentId;
  genreIdRef.current = genreId;
  rendererRef.current = renderer;
  drawerOpenRef.current = drawerOpen;
  performancePhaseRef.current = phase === "running"
    ? `drive:${environmentId}:${genreId}:${drawerOpen ? "diagnostics" : "visual"}`
      + (environmentId === "aperture" && speed <= 40 ? ":wall-retreat" : "")
    : `splash:${phase}`;

  const logDiagnosticEvent = useCallback((type, detail = {}) => {
    diagnosticEventsRef.current = [...diagnosticEventsRef.current, {
      at: new Date().toISOString(),
      elapsedMs: Math.round((performance.now() - sessionStartedAtRef.current) * 10) / 10,
      type,
      detail,
    }].slice(-240);
  }, []);

  const recordRenderedFrame = useCallback((capturedAtMs, targetFrameMs, frameRenderer, canvasWidth, canvasHeight) => {
    const sample = {
      phase: performancePhaseRef.current,
      capturedAtMs,
      targetFrameMs,
      renderer: frameRenderer,
      canvasWidth,
      canvasHeight,
    };
    recordPhaseFrame(phasePerformanceTelemetryRef.current, sample);
    if (!diagnosticsActiveRef.current) return;
    frameTelemetryRef.current = recordFrameSample(frameTelemetryRef.current, sample);
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

  // The score reports its own arrangement about ten times a second. The full
  // snapshot lives in a ref so the flight recorder can read it without forcing a
  // render; only the two values the interface shows become state, and only when
  // they actually change.
  const triggerPulse = useCallback((snapshot) => {
    if (!snapshot) return;
    scoreStateRef.current = snapshot;
    const tempo = Math.round(snapshot.tempo ?? 0);
    setScoreTempo((current) => (current === tempo ? current : tempo));
    const scene = String(snapshot.sceneId ?? "rest").toUpperCase();
    setScoreScene((current) => (current === scene ? current : scene));
  }, []);

  const triggerBrake = useCallback(() => {
    const now = performance.now();
    audioRef.current?.brake();
    window.clearTimeout(brakeFlashTimerRef.current);
    setBrakeFlash(1);
    // The engine is told every time the input goes down, but the log and the
    // flash stay rate-limited so a held brake does not flood either.
    if (now - brakeCooldownRef.current < 900) return;
    brakeCooldownRef.current = now;
    logDiagnosticEvent("brake.triggered", { source: sourceRef.current });
  }, [logDiagnosticEvent]);

  const startGps = useCallback(() => {
    gpsTelemetryRef.current = createGpsTelemetry(performance.now());
    lastGpsSampleAtRef.current = null;
    lastGpsEventAtRef.current = null;
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
        const accuracyM = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null;
        setAccuracy(Number.isFinite(accuracyM) ? Math.round(accuracyM) : null);
        const kmh = normalizeGpsSpeed(position.coords.speed);
        latestGpsObservationRef.current = { capturedAtMs, speedKmh: kmh };
        gpsTelemetryRef.current = recordGpsSample(gpsTelemetryRef.current, {
          capturedAtMs,
          speedKmh: kmh,
          accuracyM,
        });
        const shouldLogSample = lastGpsEventAtRef.current == null
          || capturedAtMs - lastGpsEventAtRef.current >= 2000
          || kmh == null
          || (Number.isFinite(accuracyM) && accuracyM > 250);
        if (kmh == null) {
          if (shouldLogSample) {
            lastGpsEventAtRef.current = capturedAtMs;
            logDiagnosticEvent("gps.sample", {
              speedKmh: null,
              filteredSpeedKmh: null,
              accuracyM: Number.isFinite(accuracyM) ? Math.round(accuracyM * 10) / 10 : null,
            });
          }
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
        // Preserve the last trusted motion value through isolated GPS accuracy
        // collapses. The real Tesla report contained one 10 km-radius sample
        // between normal 2–3 m readings; it should be evidence, not a musical
        // or visual structural command.
        const unreliable = Number.isFinite(accuracyM) && accuracyM > 250;
        if (!unreliable
          && Number.isFinite(position.coords.latitude)
          && Number.isFinite(position.coords.longitude)
          && capturedAtMs - mapPositionUpdatedAtRef.current >= 2500) {
          mapPositionUpdatedAtRef.current = capturedAtMs;
          setMapPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: Number.isFinite(position.coords.heading) ? position.coords.heading : null,
          });
        }
        if (unreliable && gpsSpeedLockedRef.current) {
          if (shouldLogSample) {
            lastGpsEventAtRef.current = capturedAtMs;
            logDiagnosticEvent("gps.sample", {
              speedKmh: Math.round(kmh * 10) / 10,
              filteredSpeedKmh: Math.round(smoothedSpeedRef.current * 10) / 10,
              elapsedMs: Math.round(elapsedSeconds * 1000),
              accuracyM: Math.round(accuracyM * 10) / 10,
              heldForConfidence: true,
            });
          }
          setGpsState("live");
          return;
        }
        gpsSpeedLockedRef.current = true;
        smoothedSpeedRef.current = next;
        if (shouldLogSample) {
          lastGpsEventAtRef.current = capturedAtMs;
          logDiagnosticEvent("gps.sample", {
            speedKmh: Math.round(kmh * 10) / 10,
            filteredSpeedKmh: Math.round(next * 10) / 10,
            elapsedMs: Math.round(elapsedSeconds * 1000),
            accuracyM: Number.isFinite(accuracyM) ? Math.round(accuracyM * 10) / 10 : null,
          });
        }
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
    audioRef.current?.releaseBrake();
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
      audioRef.current.setScore(genreId);
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
  }, [genreId, logDiagnosticEvent, reducedMotion, startGps, triggerPulse, wakeControls]);

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
    const captureMemory = () => {
      const memory = performance.memory;
      const audioState = audioRef.current?.getState() ?? null;
      recordPhaseMemorySample(phasePerformanceTelemetryRef.current, {
        phase: performancePhaseRef.current,
        capturedAtMs: performance.now(),
        usedJsHeapBytes: memory?.usedJSHeapSize,
        totalJsHeapBytes: memory?.totalJSHeapSize,
        jsHeapLimitBytes: memory?.jsHeapSizeLimit,
        audioDecodedPcmBytes: audioState?.decodedPcmBytes,
        audioBankBytes: audioState?.bankBytes,
      });
    };
    captureMemory();
    performanceSamplerTimerRef.current = window.setInterval(captureMemory, DRIVE_TRACE_INTERVAL_MS);
    return () => {
      window.clearInterval(performanceSamplerTimerRef.current);
      performanceSamplerTimerRef.current = null;
    };
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
      const meterState = audioRef.current?.getMeterState?.() ?? null;
      const gpsAgeMs = Number.isFinite(latestGps.capturedAtMs)
        ? Math.max(0, capturedAtMs - latestGps.capturedAtMs)
        : null;
      recordDriveTelemetrySample(driveTelemetryRef.current, {
        capturedAtMs,
        speedKmh: speedRef.current,
        rawGpsSpeedKmh: latestGps.speedKmh,
        gpsAgeMs,
        gpsState: gpsStateRef.current,
        accuracyM: accuracyRef.current,
        source: sourceRef.current,
        driveInput: brakeHeldRef.current ? "service-brake" : demoDriveInputRef.current,
        energy: speedToEnergy(speedRef.current),
        bpm: scoreStateRef.current?.tempo ?? null,
        averageFps: frame.averageFps,
        p95FrameMs: frame.p95FrameMs,
        audioLevel: audioLevelRef.current,
        audioPeak: meterState?.peak,
        visualId: environmentIdRef.current,
        musicId: genreIdRef.current,
        audioSection: audioState?.section,
        audioFamily: audioState?.musicalFamily,
        audioTakes: audioState?.sectionTakes,
        audioBankLoaded: audioState?.bankLoaded,
        gpsConfidence: classifyGpsConfidence({
          gpsState: gpsStateRef.current,
          gpsAgeMs,
          accuracyM: accuracyRef.current,
        }),
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
  useEffect(() => { audioRef.current?.setScore(genreId); }, [genreId]);
  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ themeId, environmentId, genreId }));
    } catch {
      // Preference persistence is optional.
    }
  }, [environmentId, genreId, themeId]);

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
      // Escape closes whatever is open. Clicking the field outside a panel
      // already dismisses it; this is the same gesture from the keyboard.
      if (event.key === "Escape") {
        if (!(drawerOpen || previewOpen || environmentPickerOpen || scorePickerOpen)) return;
        event.preventDefault();
        setPreviewOpen(false);
        setEnvironmentPickerOpen(false);
        setScorePickerOpen(false);
        setDrawerOpen(false);
        return;
      }
      if (event.repeat) return;
      if (event.key === "ArrowUp") {
        event.preventDefault();
        startKeyboardAcceleration();
      } else if (event.key === "ArrowDown" || event.code === "Space") {
        // Both are held service-brake inputs. Every key that presses the brake
        // must have a matching release below, or the brake latches on.
        event.preventDefault();
        startKeyboardBrake();
      }
    };
    const handleKeyUp = (event) => {
      if (event.key === "ArrowUp") {
        if (canUseKeyboardTarget(event.target)) event.preventDefault();
        releaseKeyboardAcceleration();
      } else if (event.key === "ArrowDown" || event.code === "Space") {
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
    drawerOpen,
    environmentPickerOpen,
    previewOpen,
    scorePickerOpen,
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
    window.clearInterval(performanceSamplerTimerRef.current);
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
      commit: APP_COMMIT,
      mode: "flux",
      environment: environmentId,
      pageUrl: window.location.href,
      source,
      displayedSpeedKmh: Math.round(speed * 10) / 10,
      bpm: Math.round(bpm * 10) / 10,
      energy: Math.round(energy * 1000) / 1000,
      energyCeilingKmh: ROAD_SPEED_CEILING_KMH,
      paletteTheme: themeId,
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
      phasePerformanceTelemetryRef.current,
      longTaskTelemetryRef.current,
      sessionStartedAtRef.current,
    ),
    flightRecorder: createDriveTelemetryReport(driveTelemetryRef.current, performance.now()),
    runtimeIssues: runtimeIssuesRef.current,
    events: diagnosticEventsRef.current,
    privacy: {
      // These three legacy fields describe the diagnostic payload itself. ATLAS
      // location use is disclosed separately without ever serializing a point.
      coordinatesCollected: false,
      coordinatesStored: false,
      coordinatesTransmitted: false,
      atlasLocationFeatureActive: environmentId === "atlas",
      atlasLocationHeldInMemory: Boolean(mapPosition),
      atlasThirdPartyRequestsActive: environmentId === "atlas" && Boolean(mapPosition),
      automaticRemoteTelemetry: false,
      transmissionRequiresExplicitGesture: true,
      recorderStorage: "bounded-session-memory-only",
    },
  } : null, [diagnostics, drawerOpen, environmentId, flightRecorderRevision, mapPosition]);
  const currentPerformancePhase = diagnosticReport?.performance.phases?.[performancePhaseRef.current] ?? null;
  const currentUsedHeapMb = Number.isFinite(currentPerformancePhase?.memory.latestUsedJsHeapBytes)
    ? Math.round(currentPerformancePhase.memory.latestUsedJsHeapBytes / 104857.6) / 10
    : null;
  const currentDecodedAudioMb = Number.isFinite(currentPerformancePhase?.memory.latestAudioDecodedPcmBytes)
    ? Math.round(currentPerformancePhase.memory.latestAudioDecodedPcmBytes / 104857.6) / 10
    : null;
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
      className={`app phase-${phase} ${controlsAwake || drawerOpen || environmentPickerOpen || scorePickerOpen ? "controls-awake" : "controls-resting"}`}
      data-theme={themeId}
      data-environment={environmentId}
      onPointerDown={handleSurfacePointerDown}
      onPointerMove={wakeControls}
    >
      {environment.renderer === "vertigo" ? (
        <Interstate7Field
          speed={speed}
          theme={theme}
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
      ) : environment.renderer === "atlas" ? (
        <Suspense fallback={<div className="atlas-waiting"><strong>ATLAS</strong><span>Loading city field</span></div>}>
          <AtlasField
            speed={speed}
            theme={theme}
            position={mapPosition}
            reducedMotion={reducedMotion}
            onRenderer={setRenderer}
            onFrame={recordRenderedFrame}
          />
        </Suspense>
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
        <SplashSignalGate
          active={phase !== "running"}
          reducedMotion={reducedMotion}
          onFrame={recordRenderedFrame}
        />
        {/* The build stamp, and nothing else. It is generated at build time as
            YYYYMMDD-HHMM and is the identifier quoted whenever a build is
            published. VERSION stays the only SemVer source of truth and is
            reported separately in the diagnostics. The active environment is
            still named in the live header. */}
        <small className="splash-status">BUILD {APP_BUILD}</small>
        <div className="splash-action">
          <button className="launch-button" type="button" onClick={runHarness} disabled={phase === "testing"}>
            <span className="launch-brand">sedicivalvole</span>
            <span className="launch-command">
              <span>{phase === "testing" ? "STARTING" : "PLAY THE ROAD"}</span>
            </span>
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
          <div className="readout-group">
            <strong>{Math.round(speed)}</strong>
            <div className="readout-labels"><span>km/h</span><small>{source}</small></div>
          </div>
          <div className="readout-divider" />
          <div className="readout-group">
            <strong>{Math.round(bpm)}</strong>
            <div className="readout-labels"><span>bpm</span><small>tempo</small></div>
          </div>
          <div className="readout-divider" />
          <div className="readout-group">
            <strong>{Math.round(energy * 100)}</strong>
            <div className="readout-labels"><span>%</span><small>energy</small></div>
          </div>
          {activeEffect && <div className="effect-badge">{activeEffect}</div>}
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
            aria-label={muted ? "Unmute audio" : "Mute audio"}
          >
            <span className="mute-icon" aria-hidden="true">
              {muted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
                  <path d="m16 9 5 6M21 9l-5 6" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
                </svg>
              )}
            </span>
          </button>
          <VisualControl environment={environment} onOpen={() => setEnvironmentPickerOpen(true)} />
          <MusicControl genreId={genreId} onOpen={() => setScorePickerOpen(true)} />
          <PaletteControl themeId={themeId} onChange={setThemeId} />
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

            {/*
              Grouped by what a reader is actually asking. The panel was one
              undifferentiated grid of eight tiles followed by a raw JSON dump,
              which made the two questions it answers — is the vehicle coping,
              and what is the score doing — impossible to tell apart at a glance.
            */}
            <h3 className="diagnostic-group">Music</h3>
            <div className="diagnostic-grid">
              <article>
                <small>PLAYING</small>
                <strong>{getScoreGenre(genreId).label}</strong>
                <span>{getScoreGenre(genreId).family}</span>
              </article>
              <article>
                <small>ARRANGEMENT</small>
                <strong>{scoreScene}</strong>
                <span>{scoreStateRef.current?.rhythmLabel ?? (scoreStateRef.current?.halfTime ? "half-time" : "full break")} · {scoreStateRef.current?.section ?? "—"}</span>
              </article>
              <article>
                <small>TRANSPORT</small>
                <strong>{Math.round(bpm)} BPM</strong>
                <span>{scoreStateRef.current?.chord ?? "—"} · {scoreStateRef.current?.activeLanes?.length ?? 0} lanes</span>
              </article>
              <article>
                <small>WEB AUDIO</small>
                <strong>{diagnostics?.audio.state || "—"}</strong>
                <span>{muted ? "muted" : `energy ${Math.round(energy * 100)}%`}</span>
              </article>
            </div>
            <div className="drawer-inline-actions">
              <button type="button" onClick={() => setPreviewOpen(true)}>AUDITION VOICES</button>
            </div>

            <h3 className="diagnostic-group">Device</h3>
            <div className="diagnostic-grid diagnostic-grid-device">
              <article>
                <small>VIEWPORT</small>
                <strong>{diagnostics ? `${diagnostics.display.innerWidth} × ${diagnostics.display.innerHeight}` : "—"}</strong>
                <span>{diagnostics ? `${diagnostics.display.mode} · DPR ${diagnostics.display.dpr}` : "—"}</span>
              </article>
              <article>
                <small>RENDERER</small>
                <strong>{renderer}</strong>
                <span>{reducedMotion ? "reduced motion" : "motion active"}</span>
              </article>
              <article>
                <small>FRAME PACING</small>
                <strong>{diagnosticReport?.performance.frame.averageFps ?? "—"} FPS</strong>
                <span>{diagnosticReport?.performance.frame.p95FrameMs ?? "—"} ms p95</span>
              </article>
              <article>
                <small>MEMORY</small>
                <strong>{currentUsedHeapMb == null ? "UNAVAILABLE" : `${currentUsedHeapMb} MB`}</strong>
                <span>{currentDecodedAudioMb == null ? "audio PCM unavailable" : `${currentDecodedAudioMb} MB decoded audio`}</span>
              </article>
              <article>
                <small>PERFORMANCE PHASES</small>
                <strong>{Object.keys(diagnosticReport?.performance.phases ?? {}).length}</strong>
                <span>{performancePhaseRef.current}</span>
              </article>
              <article>
                <small>GPS SPEED</small>
                <strong>{gpsState}</strong>
                <span>{accuracy == null ? "accuracy unavailable" : `accuracy ±${accuracy} m`}</span>
              </article>
              <article>
                <small>NETWORK</small>
                <strong>{diagnosticReport?.network.current.effectiveType || (diagnosticReport?.network.current.online ? "online" : "offline") || "—"}</strong>
                <span>{diagnosticReport?.network.current.roundTripTimeMs ?? "—"} ms RTT</span>
              </article>
              <article>
                <small>RUNTIME ISSUES</small>
                <strong>{diagnosticReport?.runtimeIssues.length ?? "—"}</strong>
                <span>errors · rejections · WebGL loss</span>
              </article>
            </div>

            <h3 className="diagnostic-group">Report</h3>
            <div className="diagnostic-grid">
              <article>
                <small>FLIGHT RECORDER</small>
                <strong>{diagnosticReport?.flightRecorder.summary.retainedSamples ?? "—"} SAMPLES</strong>
                <span>{Math.round((diagnosticReport?.flightRecorder.summary.sessionDurationMs ?? 0) / 1000)} s recorded</span>
              </article>
              <article>
                <small>PAYLOAD</small>
                <strong>{Math.round(diagnosticPayloadBytes / 1024)} KB</strong>
                <span>sent only on request</span>
              </article>
            </div>
            <p className="privacy-note">
              This diagnostic contains no coordinates. ATLAS keeps the current position
              only in session memory and, while selected, requests map tiles from
              OpenFreeMap and nearby reading from Wikimedia. SEND DIAGNOSTIC never
              includes the position. Keep this page open until the report is sent.
            </p>

            <div className="drawer-actions">
              <p className={`send-state send-state-${sendState}`} role="status" aria-live="polite">
                {sendState === "sent" ? "Accepted by the server mail transport. Inbox delivery still needs confirmation." : null}
                {sendState === "error" ? `${DIAGNOSTIC_SEND_ERROR_COPY[sendErrorCode] ?? "The report could not be sent."} No diagnostic data was stored by the app.` : null}
              </p>
              <button className="send-diagnostic-button" type="button" onClick={sendDiagnostic} disabled={sendState === "sending"}>
                {sendState === "sending" ? "SENDING…" : sendState === "sent" ? "SENT" : "SEND DIAGNOSTIC"}
              </button>
              <button type="button" onClick={() => navigator.clipboard?.writeText(diagnosticText)}>COPY REPORT</button>
              <button type="button" onClick={toggleSource}>{source === "GPS" ? "TRY DEMO MODE" : "RETURN TO GPS"}</button>
              <button type="button" onClick={() => setRawReportOpen((open) => !open)} aria-expanded={rawReportOpen}>
                {rawReportOpen ? "HIDE RAW" : "SHOW RAW"}
              </button>
            </div>
            {/* The raw report is evidence, not a readout: it is available, not in the way. */}
            {rawReportOpen ? <pre>{diagnosticText}</pre> : null}
          </div>
        </section>
      ) : null}

      {environmentPickerOpen ? (
        <VisualPicker
          environmentId={environmentId}
          onChange={(nextEnvironmentId) => {
            setEnvironmentId(nextEnvironmentId);
            logDiagnosticEvent("environment.changed", { environment: nextEnvironmentId });
          }}
          onClose={() => setEnvironmentPickerOpen(false)}
        />
      ) : null}

      {scorePickerOpen ? (
        <MusicPicker
          genreId={genreId}
          onChange={(nextGenreId) => {
            setGenreId(nextGenreId);
            logDiagnosticEvent("score.changed", { score: nextGenreId });
          }}
          onClose={() => setScorePickerOpen(false)}
        />
      ) : null}

      {previewOpen ? (
        <section className="diagnostic-drawer preview-drawer" role="dialog" aria-modal="true" aria-labelledby="preview-title">
          <button className="drawer-backdrop" type="button" onClick={() => setPreviewOpen(false)} aria-label="Close" />
          <div className="drawer-panel">
            <div className="drawer-heading">
              <div><small>FLUX SCORE ENGINE</small><h2 id="preview-title">Voices</h2></div>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close voice preview">CLOSE</button>
            </div>

            <div className="preview-content">
              <h3>{getScoreGenre(genreId).label} · {getScoreGenre(genreId).family}</h3>
              <p>
                Each block plays one lane of the running score with its own voicing,
                at the current point in the harmonic cycle. A lane the arrangement
                has silent can still be heard here.
              </p>

              <div className="preview-grid">
                {SCORE_VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    className="preview-btn"
                    onClick={() => audioRef.current?.audition(voice.id)}
                  >
                    <strong>{voice.label}</strong>
                    <span>{voice.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

    </main>
  );
}
