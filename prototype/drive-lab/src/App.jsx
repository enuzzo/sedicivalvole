import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import buyMeCoffeeQr from "./assets/bmc_qr.png";
import { createAudioEngine } from "./audio-engine.js";
import {
  appendConnectionHistory,
  appendViewportHistory,
  classifyGpsConfidence,
  createAudioLatencyTelemetry,
  createDiagnosticEventLedger,
  createDiagnosticEventReport,
  createDriveTelemetry,
  createDriveTelemetryReport,
  createFrameTelemetry,
  createGpsTelemetry,
  createLongTaskTelemetry,
  createNetworkTelemetry,
  createPhasePerformanceTelemetry,
  deriveNetworkNoticeState,
  DRIVE_TRACE_INTERVAL_MS,
  fitDiagnosticReportForTransport,
  inferViewportMode,
  finishAppNetworkTransfer,
  readAudioLatencySnapshot,
  recordAudioLatencySample,
  recordDiagnosticEvent,
  recordDriveTelemetrySample,
  recordFrameSample,
  recordLongTask,
  recordNetworkOnlineState,
  recordNetworkResourceEntry,
  recordPhaseFrame,
  recordPhaseMemorySample,
  recordGpsSample,
  summarizeFrameTelemetry,
  summarizeGpsTelemetry,
  summarizeAudioLatencyTelemetry,
  summarizeLongTaskTelemetry,
  summarizeNetworkTelemetry,
  summarizePhasePerformanceTelemetry,
  startAppNetworkTransfer,
} from "./diagnostics-model.js";
import { runStorageDiagnostics } from "./storage-diagnostics.js";
import { createAudioMacroSnapshot } from "./response-mapping.js";
import { createSoundtrackPreviewController } from "./soundtrack/preview-controller.js";
import { createSoundtrackEffectsController } from "./soundtrack/effects-controller.js";
import {
  DEFAULT_PAGE_TITLE,
  soundtrackPageTitle,
} from "./soundtrack/page-title.js";
import {
  retainJamendoPreviewEntries,
  SOUNDTRACK_GENRE_OPTIONS,
  SOUNDTRACK_PACE_OPTIONS,
} from "./soundtrack/library-model.js";
import { FluxField } from "./flux-field.jsx";
import {
  DEFAULT_FLUX_ENVIRONMENT_ID,
  FLUX_ENVIRONMENTS,
  getFluxEnvironment,
  migrateLegacyEnvironmentPreference,
} from "./flux-environments.js";
import { FLUX_THEMES, getFluxTheme } from "./flux-themes.js";
import {
  DEFAULT_GENRE_ID,
  getScoreGenre,
  SCORE_GENRES,
  SCORE_STATUS,
  readyScoreGenres,
  scoreSource,
} from "./score/genres.js";
import { SplashSignalGate } from "./splash-signal-gate.jsx";
import { Interstate7Field } from "./interstate-7-field.jsx";
import { MeridianField } from "./environments/meridian/meridian-field.jsx";
import { DriveyField } from "./environments/drivey/drivey-field.jsx";
import { PrtclField } from "./environments/prtcl/prtcl-field.jsx";
import {
  DEFAULT_DRIVEY_SETTINGS,
  DRIVEY_CAMERAS,
  DRIVEY_RENDER_MODES,
  nextDriveyCameraId,
  nextDriveyRenderModeId,
  normalizeDriveySettings,
} from "./environments/drivey/drivey-model.js";
import {
  DEFAULT_PRTCL_SETTINGS,
  PRTCL_TYPES,
  nextPrtclTypeId,
  normalizePrtclSettings,
} from "./environments/prtcl/prtcl-model.js";
import {
  appendAtlasPositionSample,
  atlasGpsPresentation,
  resolveAtlasHeading,
} from "./environments/atlas/atlas-model.js";
import {
  advanceDemoMotion,
  MODEL_3_AWD_REFERENCE,
  normalizeGpsSpeed,
  ROAD_SPEED_CEILING_KMH,
  smoothGpsSpeed,
  speedToEnergy,
} from "./signal-model.js";
import { perceivedTempoFromSnapshot } from "./low-speed-score.js";
import {
  isControlLayerFocused,
  shouldReleaseControlFocus,
} from "./control-visibility.js";
import {
  decodeSuggestionAddress,
  SUPPORT_COUNT_DURATION_MS,
  supportMomentumCount,
  supportMomentumFrame,
} from "./support-model.js";

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
const BRAND_MARK_URL = `/brand/sedicivalvole-mark.svg?build=${encodeURIComponent(APP_BUILD)}`;
const TOPBAR_MARK_URL = `/brand/product-icon-512.png?build=${encodeURIComponent(APP_BUILD)}`;
const ILLOBO_FEATURED_MARK_URLS = Object.freeze([
  `/brand/illobo-featured-solid.svg?build=${encodeURIComponent(APP_BUILD)}`,
  `/brand/illobo-featured-outline.svg?build=${encodeURIComponent(APP_BUILD)}`,
]);
const PREFERENCES_KEY = "sedicivalvole.preferences.v2";
const LEGACY_PREFERENCES_KEY = "sedicivalvole.preferences.v1";
const LAUNCH_MUSIC_CHOICES = Object.freeze([
  {
    id: "play-road",
    label: "PLAY THE ROAD",
    displayLabel: "Play the Road",
    description: "Adaptive music shaped by your drive",
    available: true,
  },
  {
    id: "soundtrack",
    label: "SOUNDTRACK",
    displayLabel: "Soundtrack",
    description: "Independent Jamendo artist recordings",
    available: true,
  },
  {
    id: "mute",
    label: "MUTE",
    displayLabel: "Mute",
    description: "Visuals only. No music.",
    available: true,
  },
]);
const SOUNDTRACK_MANUAL_CONTROLS = Object.freeze([
  Object.freeze({ id: "flanger", label: "FLANGER", displayLabel: "Flanger", note: "Jet comb sweep", performanceAmount: 0.78 }),
  Object.freeze({ id: "reverb", label: "REVERB", displayLabel: "Reverb", note: "Long pressure chamber", performanceAmount: 0.72 }),
  Object.freeze({ id: "chorus", label: "CHORUS", displayLabel: "Chorus", note: "Wide moving double", performanceAmount: 0.8 }),
  Object.freeze({ id: "echo", label: "ECHO", displayLabel: "Echo", note: "Dark feedback trail", performanceAmount: 0.74 }),
]);
const EMPTY_SOUNDTRACK_MANUAL_EFFECTS = Object.freeze(Object.fromEntries(
  SOUNDTRACK_MANUAL_CONTROLS.map(({ id }) => [id, 0]),
));
function parseSupportUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" && /(^|\.)buymeacoffee\.com$/i.test(url.hostname)
      ? url.href
      : "";
  } catch {
    return "";
  }
}
const DEFAULT_SUPPORT_URL = "https://buymeacoffee.com/enuzzo";
const SUPPORT_URL = parseSupportUrl(import.meta.env.VITE_SUPPORT_URL) || DEFAULT_SUPPORT_URL;
const QA_PARAMS = import.meta.env.DEV
  ? new URLSearchParams(window.location.search)
  : null;
const QA_SPEED = import.meta.env.DEV
  ? Math.min(130, Math.max(0, Number(QA_PARAMS.get("qaSpeed")) || 0))
  : 0;
// A local-only QA latch lets exact-viewport browser checks exercise every
// running state without sending Web Audio to the user's speakers.
const QA_MUTED = import.meta.env.DEV && QA_PARAMS.get("qaMute") === "1";
const QA_EFFECT = import.meta.env.DEV
  && ["OPEN", "UNDERWATER", "BLOOM"].includes(QA_PARAMS.get("qaEffect"))
  ? QA_PARAMS.get("qaEffect")
  : null;
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
    const currentValue = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "null");
    const legacyValue = currentValue == null
      ? JSON.parse(localStorage.getItem(LEGACY_PREFERENCES_KEY) || "null")
      : null;
    const value = currentValue ?? legacyValue;
    return {
      themeId: FLUX_THEMES.some((theme) => theme.id === value?.themeId) ? value.themeId : "red",
      environmentId: migrateLegacyEnvironmentPreference(
        value?.environmentId,
        legacyValue != null,
      ),
      // A stored genre is only honoured if it still has an authored score.
      genreId: SCORE_GENRES.some((genre) => (
        genre.id === value?.genreId && genre.status === SCORE_STATUS.ready
      )) ? value.genreId : DEFAULT_GENRE_ID,
      driveySettings: normalizeDriveySettings(value?.driveySettings),
      prtclSettings: normalizePrtclSettings(value?.prtclSettings),
    };
  } catch {
    return {
      themeId: "red",
      environmentId: DEFAULT_FLUX_ENVIRONMENT_ID,
      genreId: DEFAULT_GENRE_ID,
      driveySettings: DEFAULT_DRIVEY_SETTINGS,
      prtclSettings: DEFAULT_PRTCL_SETTINGS,
    };
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

function readNetworkDiagnosticReport(telemetry, history, generatedAtMs = performance.now()) {
  const current = readConnectionSnapshot("report-generated");
  const observedSessionTraffic = summarizeNetworkTelemetry(telemetry, generatedAtMs);
  return {
    current,
    history,
    rawCellularSignalStrengthAvailable: false,
    observedSessionTraffic,
    notice: deriveNetworkNoticeState({
      connection: current,
      traffic: observedSessionTraffic,
      generatedAtMs,
    }),
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
    longTasks: summarizeLongTaskTelemetry(longTaskTelemetry),
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

const DIALOG_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function DialogSurface({
  className,
  labelledBy,
  onClose,
  backdropClass = "drawer-backdrop",
  panelClass = "drawer-panel",
  children,
}) {
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const frameId = requestAnimationFrame(() => {
      const panel = panelRef.current;
      const initial = panel?.querySelector("[data-dialog-initial-focus]")
        ?? panel?.querySelector(DIALOG_FOCUSABLE_SELECTOR);
      if (initial instanceof HTMLElement) initial.focus({ preventScroll: true });
      else panel?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frameId);
      previousFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(panelRef.current?.querySelectorAll(DIALOG_FOCUSABLE_SELECTOR) ?? [])
      .filter((element) => element instanceof HTMLElement && element.tabIndex >= 0);
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus({ preventScroll: true });
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <section
      className={className}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onKeyDown={handleKeyDown}
    >
      <button className={backdropClass} type="button" tabIndex={-1} onClick={onClose} aria-label="Close" />
      <div ref={panelRef} className={panelClass} role="document" tabIndex={-1}>
        {children}
      </div>
    </section>
  );
}

function InstrumentMetric({ label, value, detail, tone = "neutral" }) {
  return (
    <div className={`instrument-metric is-${tone}`}>
      <dt>{label}</dt>
      <dd>
        <strong>{value}</strong>
        {detail ? <span>{detail}</span> : null}
      </dd>
    </div>
  );
}

function DiagnosticReadme() {
  return (
    <div className="diagnostic-readme" id="diagnostic-readme" aria-labelledby="diagnostic-readme-title">
      <header>
        <small>TECHNICAL AND DATA NOTES</small>
        <h3 id="diagnostic-readme-title">What this instrument measures</h3>
        <p>
          The session report is a local performance instrument for the running Sedici Valvole session.
          It records bounded technical evidence so rendering, audio, GPS confidence, and
          failures can be compared without retaining a route.
        </p>
      </header>

      <section>
        <h4>Telemetry and privacy</h4>
        <ul>
          <li>No analytics or automatic remote telemetry is enabled.</li>
          <li>Coordinates are not collected, stored, copied, or included in a diagnostic.</li>
          <li>GPS evidence is limited to status, speed confidence, accuracy, and bounded counts.</li>
          <li>A report leaves the browser only after the explicit SEND DIAGNOSTIC action.</li>
          <li>The accepted report is attached as compressed JSON; server acceptance is not inbox delivery.</li>
        </ul>
      </section>

      <section>
        <h4>ATLAS location boundary</h4>
        <p>
          ATLAS may keep the latest reliable position in session memory while the map is
          selected. OpenFreeMap receives the tile area needed for the map and Wikimedia may
          receive a coarse nearby-search cell. The point is never copied into the session report or local storage.
        </p>
      </section>

      <section>
        <h4>Audio provenance</h4>
        <p>
          FRACTURE is an original generative score. JUNCTION is an original mixed production
          authored from 76 royalty-free MusicRadar source recordings. The source packs are not
          owned by this project and are never redistributed; the browser receives complete
          produced performances, not loose loops, stems, or samples.
        </p>
      </section>

      <section>
        <h4>Licensing and source</h4>
        <p>
          Original project code and documentation default to the PolyForm Noncommercial
          License 1.0.0. This is source-visible noncommercial software, not open source.
          Brand, screenshots, original audio, and standalone media remain outside that grant
          unless stated otherwise. Third-party components retain their own licences.
          Product and diagnostic text use Space Grotesk under the SIL Open Font License 1.1.
        </p>
        <nav aria-label="Technical source links">
          <a href="https://github.com/enuzzo/sedicivalvole" target="_blank" rel="noreferrer">SOURCE REPOSITORY</a>
          <a href="https://github.com/enuzzo/sedicivalvole/blob/main/THIRD_PARTY_NOTICES.md" target="_blank" rel="noreferrer">THIRD-PARTY NOTICES</a>
          <a href="https://github.com/enuzzo/sedicivalvole/blob/main/LICENSE-SCOPE.md" target="_blank" rel="noreferrer">LICENSE SCOPE</a>
          <a href="https://github.com/enuzzo/sedicivalvole/blob/main/docs/DIAGNOSTICS.md" target="_blank" rel="noreferrer">DIAGNOSTIC ARCHITECTURE</a>
        </nav>
      </section>

      <footer>
        <span>VERSION {APP_VERSION}</span>
        <span>BUILD {APP_BUILD}</span>
        <span>COMMIT {APP_COMMIT}</span>
      </footer>
    </div>
  );
}

function FieldFailure({ label }) {
  return (
    <div className="field-failure" role="status">
      <strong>{label}</strong>
      <span>Visual unavailable · controls remain active</span>
    </div>
  );
}

class EnvironmentErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.failed) {
      return <FieldFailure label={this.props.label} />;
    }
    return this.props.children;
  }
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

function displayLabel(entry) {
  return entry?.displayLabel ?? entry?.label ?? "";
}

function VisualControl({ environment, onOpen }) {
  const name = displayLabel(environment);
  return (
    <button
      className="environment-control"
      type="button"
      aria-haspopup="dialog"
      aria-label={`Visual ${name} ${environment.number}. Tap to change`}
      onClick={onOpen}
    >
      <span className="control-label">VISUAL</span>
      <span className="control-value">
        <strong>{name}</strong>
        <span className="control-catalog-number">{environment.number}</span>
      </span>
      <span className="control-disclosure"><DisclosureCaret /></span>
    </button>
  );
}

function MusicControl({ genreId, selection, onOpen, musicMode, soundtrackSnapshot = null }) {
  if (musicMode === "soundtrack") {
    const current = soundtrackSnapshot?.current;
    const featured = soundtrackSnapshot?.library?.selection?.kind === "featured";
    const providerMark = featured ? "LO" : "JM";
    const stateLabel = current?.title ?? (
      soundtrackSnapshot?.status === "loading" ? `Loading ${featured ? "Illobo" : "Jamendo"}` : "Soundtrack"
    );
    return (
      <button
        className="score-control"
        type="button"
        aria-haspopup="dialog"
        aria-label={`Soundtrack ${stateLabel}. Tap for artist credit and effects`}
        onClick={onOpen}
      >
        <span className="control-label">MUSIC</span>
        <span className="control-value">
          <strong aria-live="polite">{stateLabel}</strong>
          <span className="control-catalog-number is-provider">{providerMark}</span>
        </span>
        <span className="control-disclosure"><DisclosureCaret /></span>
      </button>
    );
  }
  const pending = selection.status === "loading" ? selection.requestedScoreId : null;
  const selected = getScoreGenre(pending ?? genreId);
  const selectedName = displayLabel(selected);
  const stateLabel = selection.status === "loading"
    ? `${selectedName} · Loading`
    : selection.status === "restored"
      ? `${selectedName} · Restored`
      : selection.status === "unavailable"
        ? `${selectedName} · Unavailable`
        : selectedName;
  return (
    <button
      className="score-control"
      type="button"
      aria-haspopup="dialog"
      aria-label={`Music ${stateLabel}, ${selected.family}. Tap to change`}
      title={selection.message ?? undefined}
      onClick={onOpen}
    >
      <span className="control-label">MUSIC</span>
      <span className="control-value">
        <strong aria-live="polite">{stateLabel}</strong>
        <span className="control-catalog-number" title={scoreSource(selected.id).note}>
          {scoreSource(selected.id).mark} {selected.number}
        </span>
      </span>
      <span className="control-disclosure"><DisclosureCaret /></span>
    </button>
  );
}

function VisualPicker({ environmentId, onChange, onClose }) {
  return (
    <DialogSurface
      className="diagnostic-drawer score-drawer environment-drawer"
      labelledBy="visual-picker-title"
      onClose={onClose}
    >
      <div className="drawer-heading">
        <div><small>FLUX VISUAL LIBRARY</small><h2 id="visual-picker-title">Visual</h2></div>
        <button data-dialog-initial-focus type="button" onClick={onClose} aria-label="Close visual library">CLOSE</button>
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
                <span className="score-entry-body"><strong>{displayLabel(entry)}</strong><span>{entry.rendererLabel}</span></span>
                <span className="score-entry-state">{active ? "ACTIVE" : "SELECT"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </DialogSurface>
  );
}

function DriveyCycleControl({ settings, onChange }) {
  const camera = DRIVEY_CAMERAS[settings.camera] ?? DRIVEY_CAMERAS.hood;
  const wireframe = settings.renderMode === DRIVEY_RENDER_MODES.wireframe.id;
  const renderMode = wireframe
    ? DRIVEY_RENDER_MODES.wireframe
    : DRIVEY_RENDER_MODES.normal;
  const nextCamera = DRIVEY_CAMERAS[nextDriveyCameraId(camera.id)];
  const nextRenderMode = DRIVEY_RENDER_MODES[nextDriveyRenderModeId(renderMode.id)];
  return (
    <div
      className="drivey-cycle-control"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="drivey-cycle-rail">
        <button
          className="visual-cycle-button visual-view-cycle"
          type="button"
          aria-label={`DRIVEY view ${camera.label}. Next ${nextCamera.label}`}
          onClick={() => onChange({ ...settings, camera: nextCamera.id })}
        >
          <span>VIEW</span>
          <small>{camera.label}</small>
        </button>
        <button
          className="visual-cycle-button visual-render-toggle"
          type="button"
          aria-label={`DRIVEY render ${renderMode.label}. Next ${nextRenderMode.label}`}
          aria-pressed={wireframe}
          onClick={() => onChange({ ...settings, renderMode: nextRenderMode.id })}
        >
          <span>RENDER</span>
          <small>{renderMode.label}</small>
        </button>
      </div>
    </div>
  );
}

function PrtclCycleControl({ settings, onChange }) {
  const current = PRTCL_TYPES[settings.type] ?? PRTCL_TYPES.frequency;
  const next = PRTCL_TYPES[nextPrtclTypeId(current.id)];
  return (
    <div
      className="prtcl-cycle-control"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="prtcl-cycle-rail">
        <button
          className="visual-cycle-button visual-particle-cycle"
          type="button"
          aria-label={`PRTCL type ${current.fullLabel}. Next ${next.fullLabel}`}
          onClick={() => onChange({ type: next.id })}
        >
          <span>TYPE</span>
          <small>{current.label}</small>
        </button>
      </div>
    </div>
  );
}

function MediaGlyph({ name }) {
  return <span className={`media-glyph is-${name}`} aria-hidden="true" />;
}

/** The driving surface lists only scores that can play now. */
function ScoreLibraryContent({ genreId, onChange }) {
  return (
    <div className="play-road-library">
      <div className="music-library-section-heading">
        <div><small>ADAPTIVE SCORES</small><h3>Play the Road</h3></div>
        <span>ARRANGED BY THE DRIVE</span>
      </div>
      <ul className="score-list">
        {readyScoreGenres().map((genre) => {
          const active = genre.id === genreId;
          return (
            <li key={genre.id}>
              <button
                type="button"
                className={`score-entry${active ? " is-active" : ""}`}
                aria-pressed={active}
                onClick={() => onChange(genre.id)}
              >
                <img className="score-entry-cover" src={genre.coverUrl} alt="" width="72" height="72" />
                <span className="score-entry-body">
                  <strong>
                    <span className="score-entry-title">{displayLabel(genre)} <b>{genre.number}</b></span>
                    <em className={`score-source is-${genre.source}`}>
                      <span aria-hidden="true">{scoreSource(genre.id).mark}</span>
                      {scoreSource(genre.id).label}
                    </em>
                  </strong>
                  <span>{genre.family} · {genre.description}</span>
                </span>
                <span className="score-entry-state">
                  <MediaGlyph name={active ? "pause" : "play"} />
                  <span className="visually-hidden">{active ? "Playing" : "Play"}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="privacy-note">Play the Road contains complete adaptive scores. Vehicle motion arranges their authored material.</p>
    </div>
  );
}

function SoundtrackLibraryContent({
  snapshot,
  jamendoPreviewEntries,
  onFeatured,
  onBrowseSelection,
  onTrack,
  onPrevious,
  onPlayPause,
  onNext,
}) {
  const current = snapshot?.current;
  const [trackQrUrl, setTrackQrUrl] = useState("");
  const playing = snapshot?.status === "playing";
  const loading = snapshot?.status === "loading";
  const library = snapshot?.library;
  const entries = library?.entries ?? [];
  const selected = library?.selection;
  const featuredSelected = selected?.kind === "featured";
  const genreRows = [SOUNDTRACK_GENRE_OPTIONS.slice(0, 8), SOUNDTRACK_GENRE_OPTIONS.slice(8)];
  const jamendoCoverEntries = featuredSelected ? jamendoPreviewEntries : entries;
  const attributionItems = snapshot?.attribution
    ? [snapshot.attribution.primary, ...(snapshot.attribution.secondary ?? [])].filter(Boolean)
    : [];
  useEffect(() => {
    let active = true;
    setTrackQrUrl("");
    if (!current?.shareUrl) return () => { active = false; };
    import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(current.shareUrl, {
      width: 160,
      margin: 1,
      color: { dark: "#070909", light: "#EEEAE0" },
      errorCorrectionLevel: "M",
    })).then((dataUrl) => {
      if (active) setTrackQrUrl(dataUrl);
    }).catch(() => {
      if (active) setTrackQrUrl("");
    });
    return () => { active = false; };
  }, [current?.key, current?.shareUrl]);
  return (
    <div className="soundtrack-panel-body">
      <div className="soundtrack-choice-heading">
        <span>CHOOSE A SOUNDTRACK PATH</span>
        <strong>Two equal ways to start listening</strong>
      </div>
      <div className="soundtrack-choice-grid">
        <button type="button" className={`soundtrack-choice-card${selected?.kind === "featured" ? " is-selected" : ""}`} aria-pressed={selected?.kind === "featured"} onClick={onFeatured}>
          <span className="illobo-featured-cover" role="img" aria-label="Illobo Featured">
            {ILLOBO_FEATURED_MARK_URLS.map((source, index) => (
              <img key={source} src={source} alt="" aria-hidden="true" width="64" height="64" data-illobo-variant={index + 1} />
            ))}
          </span>
          <span className="soundtrack-choice-copy">
            <small>ILLOBO FEATURED</small>
            <strong>Signal Border</strong>
            <span>A rotating playlist curated by Illobo.</span>
          </span>
          <span className="soundtrack-choice-action">PLAY FEATURED</span>
        </button>
        <button type="button" className={`soundtrack-choice-card is-library${selected?.kind !== "featured" ? " is-selected" : ""}`} aria-pressed={selected?.kind !== "featured"} onClick={() => onBrowseSelection({ kind: "library", id: "all" })}>
          <span className="soundtrack-cover-stack" aria-hidden="true">
            {jamendoCoverEntries.filter((entry) => entry.imageUrl).slice(0, 3).map((entry) => (
              <img key={entry.key} src={entry.imageUrl} alt="" width="64" height="64" />
            ))}
            {!jamendoCoverEntries.some((entry) => entry.imageUrl) ? <span className="soundtrack-cover-placeholder">JM</span> : null}
          </span>
          <span className="soundtrack-choice-copy">
            <small>JAMENDO LIBRARY</small>
            <strong>Choose your route</strong>
            <span>Start by pace, genre, or an individual track.</span>
          </span>
          <span className="soundtrack-choice-action">OPEN LIBRARY</span>
        </button>
      </div>

      <section className="jamendo-library" aria-labelledby="soundtrack-library-title">
        <div className="music-library-section-heading">
          <div><small>{featuredSelected ? "ILLOBO FEATURED" : "JAMENDO LIBRARY"}</small><h3 id="soundtrack-library-title">{featuredSelected ? "Signal Border playlist" : "Browse and play"}</h3></div>
          <div className="soundtrack-library-status">
            <span>AUTHORED PLAYBACK · 1×</span>
            <strong>{library?.refreshCopy ?? "Fresh mix · changes every 30 min"}</strong>
          </div>
        </div>
        {!featuredSelected ? <div className="soundtrack-filter-group">
          <span>BY PACE</span>
          <div className="soundtrack-filter-row">
            {SOUNDTRACK_PACE_OPTIONS.map((pace) => (
              <button
                key={pace.id}
                type="button"
                className={selected?.kind === "pace" && selected.id === pace.id ? "is-selected" : ""}
                aria-pressed={selected?.kind === "pace" && selected.id === pace.id}
                disabled={loading}
                onClick={() => onBrowseSelection({ kind: "pace", id: pace.id })}
              >
                <strong>{pace.label}</strong>
                <MediaGlyph name="play" />
              </button>
            ))}
          </div>
        </div> : null}
        {!featuredSelected ? <div className="soundtrack-filter-group">
          <span>BY GENRE</span>
          <div className="soundtrack-filter-rows is-genres">
            {genreRows.map((row, rowIndex) => (
              <div key={rowIndex} className="soundtrack-filter-row" style={{ "--filter-columns": row.length }}>
                {row.map((genre) => (
                  <button
                    key={genre.id}
                    type="button"
                    className={selected?.kind === "genre" && selected.id === genre.id ? "is-selected" : ""}
                    aria-pressed={selected?.kind === "genre" && selected.id === genre.id}
                    disabled={loading}
                    onClick={() => onBrowseSelection({ kind: "genre", id: genre.id })}
                  >
                    <strong>{genre.label}</strong>
                    <MediaGlyph name="play" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div> : null}
        <div className="soundtrack-track-list" aria-live="polite">
          {entries.slice(0, 6).map((entry) => (
            <button key={entry.key} type="button" className={entry.key === current?.key ? "is-current" : ""} onClick={() => onTrack(entry.key)}>
              {entry.imageUrl ? <img src={entry.imageUrl} alt="" width="48" height="48" /> : <span className="soundtrack-track-placeholder" />}
              <span><strong>{entry.title}</strong><small>{entry.artistName}</small></span>
              <em>
                <MediaGlyph name={entry.key === current?.key && playing ? "pause" : "play"} />
                <span className="visually-hidden">{entry.key === current?.key && playing ? "Playing" : "Play"}</span>
              </em>
            </button>
          ))}
          {!entries.length ? <p>{loading ? `Loading ${featuredSelected ? "Illobo" : "a fresh Jamendo mix"}…` : "No eligible tracks in this selection."}</p> : null}
        </div>
      </section>

      <div className="soundtrack-playback-grid">
        <section className="soundtrack-now-playing" aria-live="polite">
          {current?.imageUrl ? <img src={current.imageUrl} alt="" width="80" height="80" /> : <span className="soundtrack-artwork-placeholder">{featuredSelected ? "LO" : "JM"}</span>}
          <div>
            <small>NOW PLAYING</small>
            <strong>{current?.title ?? `Preparing ${featuredSelected ? "Illobo playlist" : "Jamendo catalog"}`}</strong>
            <span>{current?.artistName ?? snapshot?.status ?? "idle"}</span>
            <span>{snapshot?.attribution?.transitioning ? "EQUAL-POWER TRANSITION · 450 MS" : "AUTHORED RECORDING · 1×"}</span>
          </div>
          <div className="soundtrack-transport" aria-label="Soundtrack transport">
            <button type="button" disabled={!snapshot?.hasPrevious} onClick={onPrevious} aria-label="Previous track"><MediaGlyph name="previous" /></button>
            <button type="button" disabled={!current} onClick={onPlayPause} aria-label={playing ? "Pause" : "Play"}><MediaGlyph name={playing ? "pause" : "play"} /></button>
            <button type="button" disabled={!snapshot?.hasNext} onClick={onNext} aria-label="Next track"><MediaGlyph name="next" /></button>
          </div>
        </section>

        {current ? <section className="soundtrack-credit-card" aria-label="Current Soundtrack credits and handoff">
          <div className="soundtrack-credit-copy">
            <small>{snapshot?.attribution?.transitioning ? "AUDIBLE CREDITS" : "TRACK CREDIT"}</small>
            {attributionItems.length ? attributionItems.map((item) => (
              <div key={item.key} className={item.isTarget ? "is-target" : ""}>
                <span>{item.isTarget ? "CURRENT" : "FADING"}</span>
                <strong>{item.credit.title} — {item.credit.artistName}</strong>
                <a href={item.credit.directContentUrl} target="_blank" rel="noreferrer">{item.credit.providerCredit} ↗</a>
                {item.credit.licence.url ? <a href={item.credit.licence.url} target="_blank" rel="noreferrer">{item.credit.licence.label} ↗</a> : <span>{item.credit.licence.label}</span>}
              </div>
            )) : (
              <div className="is-target">
                <span>CURRENT</span>
                <strong>{current.title} — {current.artistName}</strong>
                <a href={current.shareUrl} target="_blank" rel="noreferrer">{current.providerCredit} ↗</a>
                {current.licenceUrl ? <a href={current.licenceUrl} target="_blank" rel="noreferrer">{current.licenceLabel} ↗</a> : <span>{current.licenceLabel}</span>}
              </div>
            )}
          </div>
          <a className="soundtrack-qr-handoff" href={current.shareUrl} target="_blank" rel="noreferrer" aria-label={`Open ${current.title} by ${current.artistName}`}>
            {trackQrUrl ? <img src={trackQrUrl} alt={`QR code for ${current.title} by ${current.artistName}`} width="72" height="72" /> : <span>QR</span>}
            <small>OPEN TRACK</small>
          </a>
        </section> : null}
      </div>

      <p className="privacy-note">Three browser-owned media elements keep previous, current, and next ready. Playback streams from the selected source; no offline copy is retained.</p>
    </div>
  );
}

function MusicLibraryPanel({
  musicMode,
  loadingMode,
  genreId,
  snapshot,
  jamendoPreviewEntries,
  onModeChange,
  onScoreChange,
  onFeatured,
  onBrowseSelection,
  onTrack,
  onPrevious,
  onPlayPause,
  onNext,
  onClose,
}) {
  return (
    <DialogSurface className="diagnostic-drawer soundtrack-drawer" labelledBy="music-library-title" onClose={onClose}>
      <div className="drawer-heading music-library-heading">
        <div><small>FLUX MUSIC LIBRARY</small><h2 id="music-library-title">Music</h2></div>
        <button data-dialog-initial-focus type="button" onClick={onClose}>CLOSE</button>
      </div>
      <div className="music-source-switch" aria-label="Music source">
        <button type="button" className={musicMode === "play-road" ? "is-active" : ""} aria-pressed={musicMode === "play-road"} onClick={() => onModeChange("play-road")}>PLAY THE ROAD</button>
        <button type="button" className={musicMode === "soundtrack" ? "is-active" : ""} aria-pressed={musicMode === "soundtrack"} onClick={() => onModeChange("soundtrack")}>SOUNDTRACK</button>
      </div>
      {loadingMode === musicMode ? (
        <p className="music-mode-loading" role="status" aria-live="polite">
          <span aria-hidden="true" />
          Loading {musicMode === "soundtrack" ? "Soundtrack" : "Play the Road"}…
        </p>
      ) : null}
      {musicMode === "soundtrack" ? (
        <SoundtrackLibraryContent
          snapshot={snapshot}
          jamendoPreviewEntries={jamendoPreviewEntries}
          onFeatured={onFeatured}
          onBrowseSelection={onBrowseSelection}
          onTrack={onTrack}
          onPrevious={onPrevious}
          onPlayPause={onPlayPause}
          onNext={onNext}
        />
      ) : <ScoreLibraryContent genreId={genreId} onChange={onScoreChange} />}
    </DialogSurface>
  );
}

function ManualEffectsDeck({ values, onChange, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const activeCount = SOUNDTRACK_MANUAL_CONTROLS.filter(({ id }) => values[id] > 0.01).length;
  return (
    <section
      id="manual-effects-deck"
      className="manual-effects-deck control-layer"
      role="dialog"
      aria-modal="false"
      aria-labelledby="manual-effects-title"
    >
      <header>
        <div>
          <small>GLOBAL · PLAY THE ROAD + SOUNDTRACK</small>
          <h2 id="manual-effects-title">Performance FX</h2>
        </div>
        <span>{activeCount}/4 ACTIVE</span>
        <button type="button" onClick={() => SOUNDTRACK_MANUAL_CONTROLS.forEach(({ id }) => onChange(id, 0))}>RESET</button>
        <button type="button" autoFocus onClick={onClose}>CLOSE</button>
      </header>
      <div className="manual-effects-grid">
        {SOUNDTRACK_MANUAL_CONTROLS.map((effect) => {
          const amount = values[effect.id];
          const active = amount > 0.01;
          return (
            <article key={effect.id} className={active ? "is-active" : ""}>
              <button
                className="manual-effect-hit"
                type="button"
                aria-pressed={active}
                onClick={() => onChange(effect.id, active ? 0 : effect.performanceAmount)}
              >
                <span><strong>{effect.label}</strong><small>{effect.note}</small></span>
                <em>{active ? "ON" : "HIT"}</em>
              </button>
              <label>
                <span>DEPTH</span>
                <output>{Math.round(amount * 100)}</output>
                <input
                  aria-label={`${effect.displayLabel} depth`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={amount}
                  onInput={(event) => onChange(effect.id, Number(event.currentTarget.value))}
                />
              </label>
            </article>
          );
        })}
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

function SupportCupMark() {
  return (
    <svg className="support-cup-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 8.5h15l-1.6 14.2c-.2 2-1.9 3.5-3.9 3.5h-4c-2 0-3.7-1.5-3.9-3.5L8 8.5Z" />
      <path d="M22.7 11h2.1a3.7 3.7 0 0 1 0 7.4h-2.9" />
      <path d="M10.3 5.3c3.7-1.4 7.6-1.4 11.4 0" />
    </svg>
  );
}

function SupportMomentumCounter({ reducedMotion }) {
  const [momentumTarget] = useState(() => supportMomentumCount());
  const [momentumValue, setMomentumValue] = useState(0);
  const momentum = String(momentumValue).padStart(3, "0");
  const momentumLabel = String(momentumTarget).padStart(3, "0");

  useEffect(() => {
    if (reducedMotion) {
      setMomentumValue(momentumTarget);
      return undefined;
    }

    let frameId = 0;
    const startedAt = performance.now();
    const tick = (timestamp) => {
      const nextValue = supportMomentumFrame(momentumTarget, timestamp - startedAt);
      setMomentumValue((currentValue) => currentValue === nextValue ? currentValue : nextValue);
      if (nextValue < momentumTarget) {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [momentumTarget, reducedMotion]);

  return (
    <div
      className="support-momentum"
      aria-label={`Project sparks ${momentumLabel}, counted over ${SUPPORT_COUNT_DURATION_MS / 1000} seconds`}
    >
      <small>PROJECT SPARKS</small>
      <strong aria-hidden="true">{momentum}</strong>
      <span>PLAYFUL SIGNAL · NOT PURCHASES</span>
    </div>
  );
}

function SupportPanel({ onClose, reducedMotion }) {
  const suggestionAddress = decodeSuggestionAddress();
  const mailSubject = encodeURIComponent("sedicivalvole suggestion");

  return (
    <DialogSurface
      className="support-overlay"
      labelledBy="support-title"
      onClose={onClose}
      backdropClass="support-backdrop"
      panelClass="support-panel"
    >
      <header className="support-heading">
        <div><small>OPEN CHANNEL</small><h2 id="support-title">Fuel the experiment</h2></div>
        <button data-dialog-initial-focus type="button" onClick={onClose}>CLOSE</button>
      </header>
      <div className="support-body">
        <img
          className="support-qr"
          src={buyMeCoffeeQr}
          width="700"
          height="700"
          loading="lazy"
          decoding="async"
          alt="QR code for the sedicivalvole Buy Me a Coffee page"
        />
        <div className="support-copy">
          <p>If this strange little road instrument made your drive better, you can leave a coffee.</p>
          <a
            className="support-primary-link"
            href={SUPPORT_URL}
            target="_blank"
            rel="noreferrer"
          >
            BUY ME A COFFEE <span aria-hidden="true">↗</span>
          </a>
          <SupportMomentumCounter reducedMotion={reducedMotion} />
        </div>
        <p className="support-suggestions">
          Suggestions are super welcome — coffee or not. Write to{" "}
          <a href={`mailto:${suggestionAddress}?subject=${mailSubject}`}>{suggestionAddress}</a>
        </p>
      </div>
    </DialogSurface>
  );
}

function GpsHelpPopover({ open, status, accuracy, onClose, onRetry, onDemo }) {
  if (!open) return null;
  return (
    <aside
      id="gps-help-popover"
      className="gps-help-popover"
      role="dialog"
      aria-modal="false"
      aria-labelledby="gps-help-title"
    >
      <div className="gps-help-heading">
        <div><small>ATLAS LOCATION</small><strong id="gps-help-title">GPS needs attention</strong></div>
        <button type="button" onClick={onClose} aria-label="Close GPS help">CLOSE</button>
      </div>
      <dl>
        <div><dt>STATUS</dt><dd>{status}</dd></div>
        <div><dt>ACCURACY</dt><dd>{accuracy == null ? "unavailable" : `±${accuracy} m`}</dd></div>
      </dl>
      <p>
        Open this site's permissions in the Tesla browser, allow Location, then
        return here and retry. Menu wording can vary with vehicle software.
      </p>
      <div className="gps-help-actions">
        <button type="button" onClick={onRetry}>RETRY LOCATION</button>
        <button type="button" onClick={onDemo}>EXPLORE MILAN DEMO</button>
      </div>
      <small className="gps-help-privacy">Position stays in this ATLAS session and never enters the session report.</small>
    </aside>
  );
}

function LaunchSelector({
  musicId,
  environmentId,
  onMusicChange,
  onEnvironmentChange,
  onBack,
  onStart,
  musicReady = true,
}) {
  const ready = Boolean(musicId && environmentId && musicReady);
  return (
    <section className="launch-selector" aria-labelledby="launch-selector-title">
      <header className="launch-selector-heading">
        <img
          className="launch-selector-mark"
          src={BRAND_MARK_URL}
          alt=""
          aria-hidden="true"
        />
        <h1 id="launch-selector-title">sedicivalvole</h1>
        <button type="button" onClick={onBack}>BACK</button>
      </header>
      <div className="launch-selector-body">
        <fieldset className="launch-music-choices">
          <legend>MUSIC</legend>
          <div className="launch-music-grid">
            {LAUNCH_MUSIC_CHOICES.map((choice) => (
              <button
                key={choice.id}
                className="launch-choice-button"
                type="button"
                aria-pressed={musicId === choice.id}
                disabled={!choice.available}
                onClick={() => onMusicChange(choice.id)}
              >
                <strong>{choice.displayLabel}</strong>
                <small>{choice.description}</small>
                {!choice.available ? <em>COMING NEXT</em> : null}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="launch-visual-choices">
          <legend>VISUAL</legend>
          <div
            className="launch-visual-grid"
            style={{ "--launch-visual-row-count": Math.max(2, Math.ceil(FLUX_ENVIRONMENTS.length / 3)) }}
          >
            {FLUX_ENVIRONMENTS.map((choice) => (
              <button
                key={choice.id}
                className="launch-choice-button launch-visual-button"
                type="button"
                aria-pressed={environmentId === choice.id}
                onClick={() => onEnvironmentChange(choice.id)}
              >
                <strong>{displayLabel(choice)}</strong>
                <small>{choice.launchDescription}</small>
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <button
        className="launch-start-button"
        type="button"
        disabled={!ready}
        onClick={onStart}
      >
        START
      </button>
    </section>
  );
}

export function App() {
  const initialPreferences = useMemo(readPreferences, []);
  const [phase, setPhase] = useState("idle");
  const [launchMusicId, setLaunchMusicId] = useState(null);
  const [launchEnvironmentId, setLaunchEnvironmentId] = useState(null);
  const [speed, setSpeed] = useState(QA_SPEED);
  const [source, setSource] = useState(QA_SPEED > 0 ? "QA" : "GPS");
  const [gpsState, setGpsState] = useState("not tested");
  const [accuracy, setAccuracy] = useState(null);
  const [renderer, setRenderer] = useState("checking…");
  const [muted, setMuted] = useState(QA_MUTED);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [controlsAwake, setControlsAwake] = useState(true);
  const [brakeFlash, setBrakeFlash] = useState(0);
  const [diagnostics, setDiagnostics] = useState(null);
  const [sendState, setSendState] = useState("idle");
  const [sendErrorCode, setSendErrorCode] = useState(null);
  const [activeEffect, setActiveEffect] = useState(QA_EFFECT);
  const [scoreTransportTempo, setScoreTransportTempo] = useState(162);
  const [scorePerceivedTempo, setScorePerceivedTempo] = useState(null);
  const [scoreScene, setScoreScene] = useState("REST");
  const [scoreSelection, setScoreSelection] = useState({
    status: "ready",
    requestedScoreId: null,
    message: null,
  });
  const scoreStateRef = useRef(null);
  const scoreSelectionRevisionRef = useRef(0);
  const [keyboardHint, setKeyboardHint] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioMacros, setAudioMacros] = useState(() => createAudioMacroSnapshot({
    capturedAtMs: performance.now(),
  }));
  const [flightRecorderRevision, setFlightRecorderRevision] = useState(0);
  const [themeId, setThemeId] = useState(initialPreferences.themeId);
  const [environmentId, setEnvironmentId] = useState(initialPreferences.environmentId);
  const [driveySettings, setDriveySettings] = useState(initialPreferences.driveySettings);
  const [prtclSettings, setPrtclSettings] = useState(initialPreferences.prtclSettings);
  const [environmentRuntimeError, setEnvironmentRuntimeError] = useState(null);
  const [genreId, setGenreId] = useState(initialPreferences.genreId);
  const [environmentPickerOpen, setEnvironmentPickerOpen] = useState(false);
  const [soundtrackPanelOpen, setSoundtrackPanelOpen] = useState(false);
  const [manualEffectsDeckOpen, setManualEffectsDeckOpen] = useState(false);
  const [musicMode, setMusicMode] = useState("play-road");
  const [musicModeLoading, setMusicModeLoading] = useState(null);
  const [soundtrackSnapshot, setSoundtrackSnapshot] = useState(null);
  const [jamendoPreviewEntries, setJamendoPreviewEntries] = useState([]);
  const [vehicleEffectsEnabled, setVehicleEffectsEnabled] = useState(true);
  const [soundtrackManualEffects, setSoundtrackManualEffects] = useState(EMPTY_SOUNDTRACK_MANUAL_EFFECTS);
  const [controlNotice, setControlNotice] = useState(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [rawReportOpen, setRawReportOpen] = useState(false);
  const [diagnosticReadmeOpen, setDiagnosticReadmeOpen] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [gpsHelpOpen, setGpsHelpOpen] = useState(false);
  const [atlasDemoRequest, setAtlasDemoRequest] = useState(0);
  const [atlasDemoActive, setAtlasDemoActive] = useState(false);
  const reducedMotion = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    [],
  );

  const audioRef = useRef(null);
  const soundtrackRef = useRef(null);
  const sessionMusicModeRef = useRef(null);
  const musicModeRevisionRef = useRef(0);
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
  const controlNoticeTimerRef = useRef(null);
  const gpsTelemetryRef = useRef(createGpsTelemetry(performance.now()));
  const driveTelemetryRef = useRef(createDriveTelemetry(performance.now()));
  const frameTelemetryRef = useRef(createFrameTelemetry(performance.now()));
  const phasePerformanceTelemetryRef = useRef(createPhasePerformanceTelemetry(performance.now()));
  const performancePhaseRef = useRef("splash:idle");
  const connectionHistoryRef = useRef([]);
  const diagnosticsActiveRef = useRef(false);
  const longTaskTelemetryRef = useRef(createLongTaskTelemetry(false));
  const audioLatencyTelemetryRef = useRef(createAudioLatencyTelemetry());
  const networkTelemetryRef = useRef(createNetworkTelemetry(performance.now()));
  const diagnosticEventsRef = useRef(createDiagnosticEventLedger());
  const runtimeIssuesRef = useRef([]);
  const latestGpsObservationRef = useRef({ capturedAtMs: null, speedKmh: null });
  const atlasPositionSamplesRef = useRef([]);
  const mapPositionUpdatedAtRef = useRef(Number.NEGATIVE_INFINITY);
  const sessionStartedAtRef = useRef(performance.now());
  const gpsStateRef = useRef(gpsState);
  const accuracyRef = useRef(accuracy);
  const audioLevelRef = useRef(audioLevel);
  const environmentIdRef = useRef(environmentId);
  const prtclSettingsRef = useRef(prtclSettings);
  const genreIdRef = useRef(genreId);
  const rendererRef = useRef(renderer);
  const drawerOpenRef = useRef(drawerOpen);
  const themeIdRef = useRef(themeId);
  const mutedRef = useRef(muted);
  const vehicleEffectsEnabledRef = useRef(vehicleEffectsEnabled);
  const bpmRef = useRef(null);
  const transportBpmRef = useRef(scoreTransportTempo);
  const mapPositionRef = useRef(mapPosition);

  const theme = getFluxTheme(themeId);
  const environment = getFluxEnvironment(environmentId);
  const energy = speedToEnergy(speed);
  const gpsPresentation = atlasGpsPresentation(gpsState, accuracy, source);
  const modalOpen = drawerOpen
    || previewOpen
    || environmentPickerOpen
    || soundtrackPanelOpen
    || supportOpen;
  const controlsPinned = modalOpen || manualEffectsDeckOpen || gpsHelpOpen;
  const controlsPinnedRef = useRef(controlsPinned);
  const previousControlsPinnedRef = useRef(controlsPinned);
  controlsPinnedRef.current = controlsPinned;
  const closeVoicePreview = useCallback(() => {
    setPreviewOpen(false);
    setDrawerOpen(true);
  }, []);
  const updateSoundtrackSnapshot = useCallback((nextSnapshot) => {
    setSoundtrackSnapshot(nextSnapshot);
    setJamendoPreviewEntries((current) => retainJamendoPreviewEntries(current, nextSnapshot));
  }, []);
  const soundtrackController = useCallback(() => {
    if (soundtrackRef.current) return soundtrackRef.current;
    const controller = createSoundtrackPreviewController({
      effectsFactory: createSoundtrackEffectsController,
      onState: updateSoundtrackSnapshot,
    });
    controller.setVehicleMaster(vehicleEffectsEnabled);
    controller.setManualEffects(soundtrackManualEffects);
    soundtrackRef.current = controller;
    updateSoundtrackSnapshot(controller.getSnapshot());
    return controller;
  }, [soundtrackManualEffects, updateSoundtrackSnapshot, vehicleEffectsEnabled]);

  const selectLaunchMusic = useCallback((nextMusicId) => {
    setLaunchMusicId(nextMusicId);
    if (nextMusicId !== "soundtrack") {
      soundtrackRef.current?.pause();
      return;
    }
    const controller = soundtrackController();
    const status = controller.getSnapshot().status;
    if (!["loading", "prepared", "paused", "playing"].includes(status)) {
      void controller.load();
    }
  }, [soundtrackController]);
  // The driver-facing number describes the pulse they hear. PARK deliberately
  // has no pulse, while diagnostics retain the score's true transport clock.
  const bpm = speed < 0.8 ? null : scorePerceivedTempo;
  const transportBpm = scoreTransportTempo;
  speedRef.current = speed;
  gpsStateRef.current = gpsState;
  accuracyRef.current = accuracy;
  audioLevelRef.current = audioLevel;
  environmentIdRef.current = environmentId;
  prtclSettingsRef.current = prtclSettings;
  genreIdRef.current = genreId;
  rendererRef.current = renderer;
  drawerOpenRef.current = drawerOpen;
  themeIdRef.current = themeId;
  mutedRef.current = muted;
  vehicleEffectsEnabledRef.current = vehicleEffectsEnabled;
  bpmRef.current = bpm;
  transportBpmRef.current = transportBpm;
  mapPositionRef.current = mapPosition;
  performancePhaseRef.current = phase === "running"
    ? `drive:${environmentId}:${genreId}:${drawerOpen ? "diagnostics" : "visual"}`
      + (environmentId === "aperture" && speed <= 40 ? ":wall-retreat" : "")
    : `splash:${phase}`;

  const logDiagnosticEvent = useCallback((type, detail = {}) => {
    recordDiagnosticEvent(diagnosticEventsRef.current, {
      at: new Date().toISOString(),
      elapsedMs: Math.round((performance.now() - sessionStartedAtRef.current) * 10) / 10,
      type,
      detail,
    }, { sample: type === "gps.sample" });
  }, []);

  const showControlNotice = useCallback((label, enabled) => {
    window.clearTimeout(controlNoticeTimerRef.current);
    setControlNotice(`${label} ${enabled ? "ON" : "OFF"}`);
    controlNoticeTimerRef.current = window.setTimeout(() => {
      setControlNotice(null);
      controlNoticeTimerRef.current = null;
    }, 1500);
  }, []);

  const updateVehicleEffects = useCallback((nextEnabled) => {
    const enabled = nextEnabled === true;
    setVehicleEffectsEnabled(enabled);
    showControlNotice("FX", enabled);
    logDiagnosticEvent("audio.vehicle-effects.changed", { enabled });
  }, [logDiagnosticEvent, showControlNotice]);

  const updateManualEffect = useCallback((id, nextValue) => {
    if (!SOUNDTRACK_MANUAL_CONTROLS.some((effect) => effect.id === id)) return;
    const value = Math.min(1, Math.max(0, Number(nextValue) || 0));
    setSoundtrackManualEffects((current) => ({ ...current, [id]: value }));
  }, []);

  const toggleMuted = useCallback(async () => {
    const nextMuted = !muted;
    if (sessionMusicModeRef.current === "soundtrack") {
      if (nextMuted) soundtrackRef.current?.pause();
      else await soundtrackRef.current?.resume();
    } else if (!nextMuted) {
      await audioRef.current?.resume();
    }
    setMuted(nextMuted);
    showControlNotice("VOLUME", !nextMuted);
    logDiagnosticEvent("audio.mute.changed", { muted: nextMuted });
  }, [logDiagnosticEvent, muted, showControlNotice]);

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
    const restWhenIdle = () => {
      if (isControlLayerFocused(document.activeElement)) {
        wakeTimerRef.current = window.setTimeout(restWhenIdle, 800);
        return;
      }
      setControlsAwake(false);
    };
    wakeTimerRef.current = window.setTimeout(restWhenIdle, 4200);
  }, []);

  const queueExperienceFocus = useCallback((activationTarget = null) => {
    window.requestAnimationFrame(() => {
      if (phase !== "running" || controlsPinnedRef.current) return;
      if (activationTarget && !shouldReleaseControlFocus(activationTarget, false)) return;
      appRef.current?.focus({ preventScroll: true });
      wakeControls();
    });
  }, [phase, wakeControls]);

  const handleControlActivation = useCallback((event) => {
    queueExperienceFocus(event.target);
  }, [queueExperienceFocus]);

  useEffect(() => {
    const wasPinned = previousControlsPinnedRef.current;
    previousControlsPinnedRef.current = controlsPinned;
    if (wasPinned && !controlsPinned) queueExperienceFocus();
  }, [controlsPinned, queueExperienceFocus]);

  const handleSurfacePointerDown = useCallback((event) => {
    controlsHiddenAtPointerDownRef.current = !(controlsAwake || modalOpen);
    if (!modalOpen && (
      !(event.target instanceof Element)
      || !event.target.closest("button, input, textarea, select, [contenteditable='true'], [role='slider']")
    )) {
      appRef.current?.focus({ preventScroll: true });
    }
    wakeControls();
  }, [controlsAwake, modalOpen, wakeControls]);

  // The score reports its own arrangement about ten times a second. The full
  // snapshot lives in a ref so the flight recorder can read it without forcing a
  // render. Only listener-facing values become state, and only when they
  // actually change.
  const triggerPulse = useCallback((snapshot) => {
    if (!snapshot) return;
    scoreStateRef.current = snapshot;
    const transportTempo = Math.round(snapshot.transportTempo ?? snapshot.tempo ?? 0);
    setScoreTransportTempo((current) => (
      current === transportTempo ? current : transportTempo
    ));
    const inPark = String(snapshot.motionLane ?? snapshot.sceneId ?? "").toLowerCase() === "park"
      || speedRef.current < 0.8;
    const listenerTempo = perceivedTempoFromSnapshot(snapshot, transportTempo);
    const perceivedTempo = inPark || listenerTempo == null
      ? null
      : Math.round(listenerTempo * 10) / 10;
    setScorePerceivedTempo((current) => (
      current === perceivedTempo ? current : perceivedTempo
    ));
    const scene = String(snapshot.sceneId ?? "rest").toUpperCase();
    setScoreScene((current) => (current === scene ? current : scene));
  }, []);

  const handleScoreRecovery = useCallback(({ failedScoreId, activeScoreId, message }) => {
    setGenreId(activeScoreId);
    setScoreSelection({
      status: "restored",
      requestedScoreId: null,
      message: `${getScoreGenre(failedScoreId).label} unavailable · ${getScoreGenre(activeScoreId).label} restored`,
    });
    logDiagnosticEvent("score.runtime-recovered", {
      failed: failedScoreId,
      active: activeScoreId,
      message,
    });
  }, [logDiagnosticEvent]);

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
    atlasPositionSamplesRef.current = [];
    mapPositionUpdatedAtRef.current = Number.NEGATIVE_INFINITY;
    if (!navigator.geolocation) {
      setGpsState("unavailable");
      logDiagnosticEvent("gps.unavailable");
      return;
    }
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    setGpsState("permission requested");
    logDiagnosticEvent("gps.requested", { highAccuracy: true });
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const capturedAtMs = performance.now();
        const accuracyM = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null;
        audioRef.current?.setGpsAccuracy(accuracyM);
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
        // Preserve the last trusted motion value through isolated GPS accuracy
        // collapses. The real Tesla report contained one 10 km-radius sample
        // between normal 2–3 m readings; it should be evidence, not a musical
        // or visual structural command.
        const unreliable = Number.isFinite(accuracyM) && accuracyM > 250;
        if (!unreliable
          && Number.isFinite(position.coords.latitude)
          && Number.isFinite(position.coords.longitude)) {
          const previousPosition = atlasPositionSamplesRef.current.at(-1) ?? mapPositionRef.current;
          const nextMapPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: resolveAtlasHeading(previousPosition, position.coords, position.coords.heading),
            capturedAtMs,
          };
          atlasPositionSamplesRef.current = appendAtlasPositionSample(
            atlasPositionSamplesRef.current,
            nextMapPosition,
            capturedAtMs,
          );
          if (capturedAtMs - mapPositionUpdatedAtRef.current >= 2500) {
            mapPositionUpdatedAtRef.current = capturedAtMs;
            setMapPosition(nextMapPosition);
          }
        }
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
        if (!unreliable) {
          audioRef.current?.setAccelerationSample(kmh, { capturedAtMs, accuracyM });
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

  useEffect(() => {
    if (phase === "running" && environmentId === "atlas" && !mapPosition && !atlasDemoActive
      && atlasGpsPresentation(gpsState, accuracy, source).requiresHelp) {
      setGpsHelpOpen(true);
    }
    if (mapPosition) {
      setAtlasDemoActive(false);
      setGpsHelpOpen(false);
    }
  }, [accuracy, atlasDemoActive, environmentId, gpsState, mapPosition, phase, source]);

  useEffect(() => {
    if (!gpsHelpOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setGpsHelpOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [gpsHelpOpen]);

  const runAtlasDemo = useCallback(() => {
    setAtlasDemoActive(true);
    setAtlasDemoRequest((current) => current + 1);
    setGpsHelpOpen(false);
    logDiagnosticEvent("atlas.demo-started", { location: "fixed-milan-fixture" });
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

  const runHarness = useCallback(async ({ musicId, selectedEnvironmentId }) => {
    const launchMuted = QA_MUTED || musicId === "mute";
    const launchVehicleEffects = true;
    sessionMusicModeRef.current = musicId;
    setMusicMode(musicId === "soundtrack" ? "soundtrack" : "play-road");
    soundtrackRef.current?.setVehicleMaster(launchVehicleEffects);
    const soundtrackStart = musicId === "soundtrack"
      ? soundtrackRef.current?.resume()
      : null;
    setSupportOpen(false);
    setMuted(launchMuted);
    setVehicleEffectsEnabled(launchVehicleEffects);
    setEnvironmentId(selectedEnvironmentId);
    sessionStartedAtRef.current = performance.now();
    diagnosticsActiveRef.current = true;
    diagnosticEventsRef.current = createDiagnosticEventLedger();
    runtimeIssuesRef.current = [];
    frameTelemetryRef.current = createFrameTelemetry(performance.now());
    driveTelemetryRef.current = createDriveTelemetry(performance.now());
    networkTelemetryRef.current = createNetworkTelemetry(performance.now());
    recordNetworkOnlineState(networkTelemetryRef.current, {
      online: navigator.onLine,
      capturedAtMs: performance.now(),
    });
    audioLatencyTelemetryRef.current = createAudioLatencyTelemetry();
    latestGpsObservationRef.current = { capturedAtMs: null, speedKmh: null };
    setFlightRecorderRevision((revision) => revision + 1);
    connectionHistoryRef.current = [readConnectionSnapshot("harness-start")];
    longTaskTelemetryRef.current = createLongTaskTelemetry(longTaskTelemetryRef.current.supported);
    logDiagnosticEvent("harness.started", {
      musicMode: musicId,
      environment: selectedEnvironmentId,
    });
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

    try {
      audioRef.current = createAudioEngine(
        triggerPulse,
        (nextEffect) => setActiveEffect(QA_EFFECT ?? nextEffect),
        handleScoreRecovery,
      );
      if (!audioRef.current) throw new Error("Web Audio is unavailable");
      await audioRef.current.resume();
      audioRef.current.setMuted(launchMuted || musicId === "soundtrack");
      audioRef.current.setVehicleEffectsEnabled(launchVehicleEffects);
      audioRef.current.setManualEffects(soundtrackManualEffects);
      // The speed effect may have run before the audio engine existed (notably
      // for an exact qaSpeed launch). Seed the engine from the current signal
      // before choosing a score so its first complete section is the right one.
      audioRef.current.setSpeed(speedRef.current);
      if (musicId === "play-road") {
        const activeScoreId = await audioRef.current.setScore(genreId);
        if (typeof activeScoreId === "string" && activeScoreId !== genreId) {
          setGenreId(activeScoreId);
          setScoreSelection({
            status: "restored",
            requestedScoreId: null,
            message: `${getScoreGenre(genreId).label} unavailable · ${getScoreGenre(activeScoreId).label} restored`,
          });
          logDiagnosticEvent("score.fallback", { requested: genreId, active: activeScoreId });
        }
        audioRef.current.startCue();
      } else if (musicId === "soundtrack") {
        const started = await soundtrackStart;
        if (started?.status !== "playing") throw new Error(started?.error || "Soundtrack playback was blocked");
      }
      window.clearInterval(audioMeterTimerRef.current);
      audioMeterTimerRef.current = window.setInterval(() => {
        const engine = audioRef.current;
        setAudioLevel(
          sessionMusicModeRef.current === "soundtrack"
            ? soundtrackRef.current?.getLevel() ?? 0
            : engine?.getLevel() ?? 0,
        );
        const snapshot = engine?.getMacroSnapshot() ?? createAudioMacroSnapshot({
          capturedAtMs: performance.now(),
        });
        setAudioMacros(QA_EFFECT ? createAudioMacroSnapshot({
          capturedAtMs: snapshot.capturedAtMs,
          open: QA_EFFECT === "OPEN" ? 1 : 0,
          underwater: QA_EFFECT === "UNDERWATER" ? 1 : 0,
          bloom: QA_EFFECT === "BLOOM" ? 1 : 0,
        }) : snapshot);
      }, 180);
    } catch (error) {
      audioRef.current?.destroy();
      audioRef.current = null;
      const message = String(error?.message || "Audio engine unavailable").slice(0, 160);
      setScoreSelection({ status: "unavailable", requestedScoreId: null, message });
      logDiagnosticEvent("audio.start-failed", { message });
    }
    startGps();
    const display = readDisplaySnapshot("harness-start");
    const connection = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
    const context = audioRef.current?.context;
    const audioLatency = readAudioLatencySnapshot(context, performance.now());
    recordAudioLatencySample(audioLatencyTelemetryRef.current, audioLatency);
    setDiagnostics({
      display,
      viewportHistory: [display],
      graphics,
      audio: {
        available: Boolean(context),
        state: context?.state ?? "unavailable",
        sampleRate: context?.sampleRate ?? null,
        ...audioLatency,
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
    Promise.all([
      readExtendedCapabilities(),
      runStorageDiagnostics({
        identity: { version: APP_VERSION, build: APP_BUILD, commit: APP_COMMIT },
        requestPersistence: true,
      }),
    ]).then(([extendedCapabilities, storageDiagnostics]) => {
      setDiagnostics((current) => current ? {
        ...current,
        capabilities: { ...current.capabilities, ...extendedCapabilities, storageDiagnostics },
      } : current);
    });
    window.setTimeout(() => {
      setPhase("running");
      wakeControls();
      window.requestAnimationFrame(() => appRef.current?.focus({ preventScroll: true }));
    }, reducedMotion ? 180 : 620);
  }, [genreId, handleScoreRecovery, logDiagnosticEvent, reducedMotion, soundtrackManualEffects, startGps, triggerPulse, wakeControls]);

  const selectScore = useCallback(async (requestedScoreId) => {
    const revision = ++scoreSelectionRevisionRef.current;
    const engine = audioRef.current;
    if (!engine) {
      const message = "Audio engine unavailable";
      setScoreSelection({ status: "unavailable", requestedScoreId: null, message });
      logDiagnosticEvent("score.change-failed", {
        requested: requestedScoreId,
        reason: "engine-unavailable",
      });
      return;
    }
    setScoreSelection({ status: "loading", requestedScoreId, message: null });
    try {
      const activeScoreId = await engine.setScore(requestedScoreId);
      if (revision !== scoreSelectionRevisionRef.current) return;
      const fallback = activeScoreId !== requestedScoreId;
      setGenreId(activeScoreId);
      setScoreSelection(fallback ? {
        status: "restored",
        requestedScoreId: null,
        message: `${getScoreGenre(requestedScoreId).label} unavailable · ${getScoreGenre(activeScoreId).label} restored`,
      } : { status: "ready", requestedScoreId: null, message: null });
      logDiagnosticEvent("score.changed", {
        requested: requestedScoreId,
        active: activeScoreId,
        fallback,
      });
    } catch (error) {
      if (revision !== scoreSelectionRevisionRef.current) return;
      setScoreSelection({
        status: "unavailable",
        requestedScoreId: null,
        message: String(error?.message || "Music selection failed").slice(0, 160),
      });
      logDiagnosticEvent("score.change-failed", { requested: requestedScoreId });
    }
  }, [logDiagnosticEvent]);

  const switchMusicMode = useCallback(async (nextMode) => {
    if (!["play-road", "soundtrack"].includes(nextMode)) return;
    const revision = ++musicModeRevisionRef.current;
    const scoreRevision = ++scoreSelectionRevisionRef.current;
    sessionMusicModeRef.current = nextMode;
    setMusicMode(nextMode);
    setMusicModeLoading(nextMode);
    logDiagnosticEvent("music.mode.changed", { musicMode: nextMode });

    try {
      if (nextMode === "soundtrack") {
        audioRef.current?.setMuted(true);
        soundtrackRef.current?.setVehicleMaster(vehicleEffectsEnabledRef.current);
        const controller = soundtrackController();
        const state = controller.getSnapshot();
        if (!["prepared", "paused", "playing"].includes(state.status)) {
          await controller.load();
        }
        if (revision !== musicModeRevisionRef.current || sessionMusicModeRef.current !== nextMode) return;
        if (!mutedRef.current) {
          await controller.resume();
          if (revision !== musicModeRevisionRef.current || sessionMusicModeRef.current !== nextMode) {
            controller.pause();
            return;
          }
        }
      } else {
        soundtrackRef.current?.pause();
        const engine = audioRef.current;
        const requestedScoreId = genreIdRef.current;
        if (!engine) throw new Error("Audio engine unavailable");
        setScoreSelection({ status: "loading", requestedScoreId, message: null });
        engine.setMuted(true);
        await engine.resume();
        if (revision !== musicModeRevisionRef.current || scoreRevision !== scoreSelectionRevisionRef.current) return;
        const activeScoreId = await engine.setScore(requestedScoreId);
        if (revision !== musicModeRevisionRef.current || scoreRevision !== scoreSelectionRevisionRef.current) return;
        const fallback = activeScoreId !== requestedScoreId;
        setGenreId(activeScoreId);
        setScoreSelection(fallback ? {
          status: "restored",
          requestedScoreId: null,
          message: `${getScoreGenre(requestedScoreId).label} unavailable · ${getScoreGenre(activeScoreId).label} restored`,
        } : { status: "ready", requestedScoreId: null, message: null });
        engine.setMuted(mutedRef.current);
        engine.startCue();
      }
    } catch (error) {
      if (revision !== musicModeRevisionRef.current || sessionMusicModeRef.current !== nextMode) return;
      if (nextMode === "play-road") {
        setScoreSelection({
          status: "unavailable",
          requestedScoreId: null,
          message: String(error?.message || "Music source failed to load").slice(0, 160),
        });
      }
      setMusicModeLoading(null);
      logDiagnosticEvent("music.mode.load-failed", {
        musicMode: nextMode,
        reason: String(error?.message || "unknown").slice(0, 120),
      });
      return;
    }
    if (revision !== musicModeRevisionRef.current || sessionMusicModeRef.current !== nextMode) return;
    setMusicModeLoading(null);
    logDiagnosticEvent("music.mode.ready", { musicMode: nextMode });
  }, [logDiagnosticEvent, soundtrackController]);

  const playSoundtrackSelection = useCallback(async (selection) => {
    if (mutedRef.current) {
      setMuted(false);
      showControlNotice("VOLUME", true);
    }
    audioRef.current?.setMuted(true);
    sessionMusicModeRef.current = "soundtrack";
    setMusicMode("soundtrack");
    const result = await soundtrackController().load({ selection, autoplay: true });
    logDiagnosticEvent("soundtrack.selection.played", {
      kind: selection?.kind ?? "library",
      id: selection?.id ?? "all",
      status: result?.status ?? "unknown",
    });
  }, [logDiagnosticEvent, showControlNotice, soundtrackController]);

  const playSoundtrackTrack = useCallback(async (key) => {
    if (mutedRef.current) {
      setMuted(false);
      showControlNotice("VOLUME", true);
    }
    audioRef.current?.setMuted(true);
    sessionMusicModeRef.current = "soundtrack";
    setMusicMode("soundtrack");
    const result = await soundtrackController().select(key);
    logDiagnosticEvent("soundtrack.track.played", { key, status: result?.status ?? "unknown" });
  }, [logDiagnosticEvent, showControlNotice, soundtrackController]);

  useEffect(() => {
    const supported = typeof PerformanceObserver !== "undefined"
      && PerformanceObserver.supportedEntryTypes?.includes("longtask");
    longTaskTelemetryRef.current.supported = Boolean(supported);
    if (!supported) return undefined;
    const observer = new PerformanceObserver((list) => {
      if (!diagnosticsActiveRef.current) return;
      for (const entry of list.getEntries()) {
        const observedAtMs = performance.now();
        const gpsCapturedAtMs = latestGpsObservationRef.current.capturedAtMs;
        const connection = readConnectionSnapshot("long-task");
        recordLongTask(longTaskTelemetryRef.current, {
          startTimeMs: entry.startTime,
          durationMs: entry.duration,
          observedAtMs,
          phase: performancePhaseRef.current,
          renderer: rendererRef.current,
          visual: environmentIdRef.current,
          music: genreIdRef.current,
          speedKmh: speedRef.current,
          gpsState: gpsStateRef.current,
          gpsSampleAgeMs: Number.isFinite(gpsCapturedAtMs) ? observedAtMs - gpsCapturedAtMs : null,
          audioState: audioRef.current?.context?.state ?? null,
          online: connection.online,
          effectiveType: connection.effectiveType,
          visibility: document.visibilityState,
        });
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
      recordAudioLatencySample(
        audioLatencyTelemetryRef.current,
        readAudioLatencySnapshot(audioRef.current?.context, performance.now()),
      );
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
      recordNetworkOnlineState(networkTelemetryRef.current, {
        online: snapshot.online,
        capturedAtMs: performance.now(),
      });
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
    const supported = typeof PerformanceObserver !== "undefined"
      && PerformanceObserver.supportedEntryTypes?.includes("resource");
    if (!supported) return undefined;
    const observer = new PerformanceObserver((list) => {
      if (!diagnosticsActiveRef.current) return;
      for (const entry of list.getEntries()) {
        recordNetworkResourceEntry(networkTelemetryRef.current, entry);
      }
    });
    observer.observe({ type: "resource", buffered: true });
    return () => observer.disconnect();
  }, []);

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
        audioRhythm: audioState?.rhythmId,
        audioRhythmTransition: audioState?.rhythmTransition,
        audioTakes: audioState?.sectionTakes,
        audioRhythms: audioState?.sectionRhythms,
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
  useEffect(() => {
    audioRef.current?.setGpsAccuracy(source === "GPS" ? accuracy : null);
  }, [accuracy, source]);
  useEffect(() => {
    audioRef.current?.setMuted(muted || sessionMusicModeRef.current === "soundtrack");
  }, [muted]);
  useEffect(() => {
    audioRef.current?.setVehicleEffectsEnabled(vehicleEffectsEnabled);
    soundtrackRef.current?.setVehicleMaster(vehicleEffectsEnabled);
  }, [vehicleEffectsEnabled]);
  useEffect(() => {
    soundtrackRef.current?.setVehicleEffects({
      open: audioMacros.values.open,
      underwater: audioMacros.values.underwater,
      bloom: audioMacros.values.bloom,
    });
  }, [audioMacros]);
  useEffect(() => {
    soundtrackRef.current?.setManualEffects(soundtrackManualEffects);
    audioRef.current?.setManualEffects(soundtrackManualEffects);
  }, [soundtrackManualEffects]);
  useEffect(() => {
    document.title = musicMode === "soundtrack"
      ? soundtrackPageTitle(soundtrackSnapshot)
      : DEFAULT_PAGE_TITLE;
    return () => {
      document.title = DEFAULT_PAGE_TITLE;
    };
  }, [
    musicMode,
    soundtrackSnapshot?.current?.artistName,
    soundtrackSnapshot?.current?.title,
    soundtrackSnapshot?.status,
  ]);
  useEffect(() => {
    if (!soundtrackPanelOpen || musicMode !== "soundtrack") return undefined;
    const rotationWindow = soundtrackSnapshot?.library?.rotationWindow;
    const selection = soundtrackSnapshot?.library?.selection ?? { kind: "library", id: "all" };
    const refreshAtMs = rotationWindow?.endsAtMs ?? Date.now();
    const refresh = () => {
      const autoplay = soundtrackRef.current?.getSnapshot().status === "playing";
      void soundtrackController().load({ selection, autoplay });
    };
    if (refreshAtMs <= Date.now()) {
      refresh();
      return undefined;
    }
    const timer = window.setTimeout(refresh, Math.min(0x7fffffff, refreshAtMs - Date.now() + 50));
    return () => window.clearTimeout(timer);
  }, [
    musicMode,
    soundtrackController,
    soundtrackPanelOpen,
    soundtrackSnapshot?.library?.rotationWindow?.id,
    soundtrackSnapshot?.library?.selection?.kind,
    soundtrackSnapshot?.library?.selection?.id,
  ]);
  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({
        themeId,
        environmentId,
        genreId,
        driveySettings: normalizeDriveySettings(driveySettings),
        prtclSettings: normalizePrtclSettings(prtclSettings),
      }));
    } catch {
      // Preference persistence is optional.
    }
  }, [driveySettings, environmentId, genreId, prtclSettings, themeId]);

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
      // A modal owns the keyboard. It may be dismissed, but driving inputs can
      // never leak through it to the vehicle simulator or the ATLAS camera.
      if (modalOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          setSupportOpen(false);
          setPreviewOpen(false);
          setEnvironmentPickerOpen(false);
          setSoundtrackPanelOpen(false);
          setDrawerOpen(false);
        }
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
    modalOpen,
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
    window.clearTimeout(controlNoticeTimerRef.current);
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
    atlasPositionSamplesRef.current = [];
    audioRef.current?.destroy();
    soundtrackRef.current?.destroy();
    soundtrackRef.current = null;
  }, [stopDemo]);

  const buildDiagnosticReport = useCallback(() => diagnostics ? {
    schema: "sedicivalvole.tesla-diagnostic.v3",
    generatedAt: new Date().toISOString(),
    app: {
      version: APP_VERSION,
      build: APP_BUILD,
      commit: APP_COMMIT,
      mode: "flux",
      environment: environmentIdRef.current,
      pageUrl: window.location.href,
      source: sourceRef.current,
      displayedSpeedKmh: Math.round(speedRef.current * 10) / 10,
      bpm: bpmRef.current == null ? null : Math.round(bpmRef.current * 10) / 10,
      transportBpm: Math.round(transportBpmRef.current * 10) / 10,
      energy: Math.round(speedToEnergy(speedRef.current) * 1000) / 1000,
      energyCeilingKmh: ROAD_SPEED_CEILING_KMH,
      paletteTheme: themeIdRef.current,
      particleType: environmentIdRef.current === "prtcl"
        ? normalizePrtclSettings(prtclSettingsRef.current).type
        : null,
      muted: mutedRef.current,
      vehicleAudioEffectsEnabled: vehicleEffectsEnabledRef.current,
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
    graphics: { ...diagnostics.graphics, activeRenderer: rendererRef.current },
    audio: {
      ...diagnostics.audio,
      state: audioRef.current?.context.state ?? diagnostics.audio.state,
      level: Math.round(audioLevelRef.current * 1000) / 1000,
      latencyHistory: summarizeAudioLatencyTelemetry(audioLatencyTelemetryRef.current),
    },
    gps: {
      state: gpsStateRef.current,
      speedField: gpsStateRef.current === "live" ? "numeric" : "not-confirmed",
      accuracyM: accuracyRef.current,
      telemetry: summarizeGpsTelemetry(gpsTelemetryRef.current),
    },
    capabilities: diagnostics.capabilities,
    environment: {
      ...diagnostics.environment,
      currentVisibility: document.visibilityState,
    },
    network: readNetworkDiagnosticReport(
      networkTelemetryRef.current,
      connectionHistoryRef.current,
      performance.now(),
    ),
    performance: readPerformanceSnapshot(
      frameTelemetryRef.current,
      phasePerformanceTelemetryRef.current,
      longTaskTelemetryRef.current,
      sessionStartedAtRef.current,
    ),
    flightRecorder: createDriveTelemetryReport(driveTelemetryRef.current, performance.now()),
    runtimeIssues: runtimeIssuesRef.current,
    events: createDiagnosticEventReport(diagnosticEventsRef.current).events,
    eventRetention: createDiagnosticEventReport(diagnosticEventsRef.current).retention,
    privacy: {
      // These three legacy fields describe the diagnostic payload itself. ATLAS
      // location use is disclosed separately without ever serializing a point.
      coordinatesCollected: false,
      coordinatesStored: false,
      coordinatesTransmitted: false,
      atlasLocationFeatureActive: environmentIdRef.current === "atlas",
      atlasLocationHeldInMemory: Boolean(mapPositionRef.current),
      atlasThirdPartyRequestsActive: environmentIdRef.current === "atlas" && Boolean(mapPositionRef.current),
      automaticRemoteTelemetry: false,
      transmissionRequiresExplicitGesture: true,
      recorderStorage: "bounded-session-memory-only",
    },
  } : null, [diagnostics]);
  // Building and pretty-printing the complete report is intentionally cold.
  // The drive hot path updates bounded refs; only opening the session report or its two-second
  // recorder refresh creates a serializable snapshot.
  const diagnosticReport = useMemo(
    () => drawerOpen ? buildDiagnosticReport() : null,
    [buildDiagnosticReport, drawerOpen, flightRecorderRevision],
  );
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
    const freshReport = buildDiagnosticReport();
    if (!freshReport || sendState === "sending") return;
    const transferId = `diagnostic-${Date.now()}`;
    setSendState("sending");
    setSendErrorCode(null);
    logDiagnosticEvent("diagnostic-send.requested");
    const eventReport = createDiagnosticEventReport(diagnosticEventsRef.current);
    try {
      const reportToSend = fitDiagnosticReportForTransport({
        ...freshReport,
        generatedAt: new Date().toISOString(),
        flightRecorder: createDriveTelemetryReport(driveTelemetryRef.current, performance.now()),
        runtimeIssues: runtimeIssuesRef.current,
        events: eventReport.events,
        eventRetention: eventReport.retention,
      });
      const body = JSON.stringify({ schema: reportToSend.schema, report: reportToSend });
      startAppNetworkTransfer(networkTelemetryRef.current, {
        id: transferId,
        direction: "upload",
        startedAtMs: performance.now(),
        knownBytes: new TextEncoder().encode(body).byteLength,
        label: "send-diagnostic",
      });
      const response = await fetch(`${import.meta.env.BASE_URL}api/send-diagnostic.php`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        const error = new Error("diagnostic_send_failed");
        error.code = typeof result?.status === "string" ? result.status : "network_error";
        throw error;
      }
      finishAppNetworkTransfer(networkTelemetryRef.current, {
        id: transferId,
        endedAtMs: performance.now(),
        success: true,
      });
      setSendState("sent");
      logDiagnosticEvent("diagnostic-send.accepted", { status: result.status });
    } catch (error) {
      if (networkTelemetryRef.current.activeTransfers[transferId]) {
        finishAppNetworkTransfer(networkTelemetryRef.current, {
          id: transferId,
          endedAtMs: performance.now(),
          success: false,
        });
      }
      const errorCode = typeof error?.code === "string" ? error.code : "network_error";
      setSendState("error");
      setSendErrorCode(errorCode);
      logDiagnosticEvent("diagnostic-send.failed", { code: errorCode });
    }
  }, [buildDiagnosticReport, logDiagnosticEvent, sendState]);

  const handleEnvironmentError = useCallback((error) => {
    const message = String(error?.message || "Unknown visual runtime error").slice(0, 500);
    setEnvironmentRuntimeError(message);
    setRenderer(`${environment.label} unavailable`);
    if (diagnosticsActiveRef.current) {
      runtimeIssuesRef.current = [...runtimeIssuesRef.current, {
        at: new Date().toISOString(),
        elapsedMs: roundMetric(performance.now() - sessionStartedAtRef.current),
        type: "visual.runtime.error",
        detail: { environment: environment.id, message },
      }].slice(-24);
    }
    logDiagnosticEvent("visual.runtime.error", { environment: environment.id, message });
  }, [environment.id, environment.label, logDiagnosticEvent]);

  useEffect(() => {
    setEnvironmentRuntimeError(null);
  }, [environmentId]);

  return (
    <main
      ref={appRef}
      tabIndex={-1}
      className={`app phase-${phase} ${controlsAwake || controlsPinned ? "controls-awake" : "controls-resting"}`}
      data-palette={themeId}
      data-environment={environmentId}
      onPointerDown={handleSurfacePointerDown}
      onPointerMove={wakeControls}
      onClickCapture={handleControlActivation}
      onFocusCapture={wakeControls}
    >
      {phase === "running" ? (
        <EnvironmentErrorBoundary
          key={environmentId}
          label={environment.label}
          onError={handleEnvironmentError}
        >
          {environmentRuntimeError ? (
            <FieldFailure label={environment.label} />
          ) : environment.renderer === "vertigo" ? (
            <Interstate7Field
              speed={speed}
              theme={theme}
              reducedMotion={reducedMotion}
              effect={activeEffect}
              onRenderer={setRenderer}
              onFrame={recordRenderedFrame}
              onRuntimeError={handleEnvironmentError}
            />
          ) : environment.renderer === "meridian" ? (
            <MeridianField
              speed={speed}
              theme={theme}
              reducedMotion={reducedMotion}
              effect={activeEffect}
              onRenderer={setRenderer}
              onFrame={recordRenderedFrame}
              onRuntimeError={handleEnvironmentError}
            />
          ) : environment.renderer === "atlas" ? (
            <Suspense fallback={<div className="atlas-waiting"><strong>ATLAS</strong><span>Loading city field</span></div>}>
              <AtlasField
                speed={speed}
                theme={theme}
                position={mapPosition}
                positionSamplesRef={atlasPositionSamplesRef}
                reducedMotion={reducedMotion}
                effect={activeEffect}
                keyboardShortcutsEnabled={!modalOpen}
                demoRequestToken={atlasDemoRequest}
                onRenderer={setRenderer}
                onFrame={recordRenderedFrame}
                onRuntimeError={handleEnvironmentError}
              />
            </Suspense>
          ) : environment.renderer === "drivey" ? (
            <DriveyField
              speed={speed}
              audioLevel={audioLevel}
              macroSnapshot={audioMacros}
              theme={theme}
              settings={driveySettings}
              reducedMotion={reducedMotion}
              effect={activeEffect}
              onRenderer={setRenderer}
              onFrame={recordRenderedFrame}
              onRuntimeError={handleEnvironmentError}
            />
          ) : environment.renderer === "prtcl" ? (
            <PrtclField
              speed={speed}
              audioLevel={audioLevel}
              macroSnapshot={audioMacros}
              theme={theme}
              settings={prtclSettings}
              reducedMotion={reducedMotion}
              effect={activeEffect}
              onRenderer={setRenderer}
              onFrame={recordRenderedFrame}
              onRuntimeError={handleEnvironmentError}
            />
          ) : (
            <FluxField
              energy={energy}
              speed={speed}
              theme={theme}
              reducedMotion={reducedMotion}
              pulse={activeEffect === "OPEN" ? 1 : 0}
              brake={activeEffect === "UNDERWATER" ? 1 : brakeFlash}
              effect={activeEffect}
              onRenderer={setRenderer}
              onFrame={recordRenderedFrame}
              onRuntimeError={handleEnvironmentError}
            />
          )}
        </EnvironmentErrorBoundary>
      ) : null}
      {phase === "running" && environment.renderer === "drivey" ? (
        <DriveyCycleControl
          settings={driveySettings}
          onChange={(value) => setDriveySettings(normalizeDriveySettings(value))}
        />
      ) : null}
      {phase === "running" && environment.renderer === "prtcl" ? (
        <PrtclCycleControl
          settings={prtclSettings}
          onChange={(value) => setPrtclSettings(normalizePrtclSettings(value))}
        />
      ) : null}
      {keyboardHint ? <div className="keyboard-hint" role="status">{keyboardHint}</div> : null}

      {phase !== "running" ? (
      <section className="splash" aria-hidden="false" inert={supportOpen ? true : undefined}>
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
        {phase === "idle" ? (
          <button
            className="splash-support-trigger"
            type="button"
            aria-label="Open Buy Me a Coffee support panel"
            aria-haspopup="dialog"
            aria-expanded={supportOpen}
            onClick={() => setSupportOpen(true)}
          >
            <span className="support-logo"><SupportCupMark /></span>
            <span>BUY ME A COFFEE</span>
          </button>
        ) : null}
        {phase === "idle" ? <div className="splash-action">
          <button
            className="launch-button"
            type="button"
            onClick={() => {
              setSupportOpen(false);
              setPhase("choosing");
            }}
          >
            <span className="launch-brand">
              <img src={BRAND_MARK_URL} alt="" aria-hidden="true" />
              <span>sedicivalvole</span>
            </span>
            <span className="launch-command">
              <span>PLAY THE ROAD</span>
            </span>
          </button>
          <small className="splash-credit">
            A project by{" "}
            <a
              href="https://github.com/enuzzo"
              target="_blank"
              rel="noreferrer"
              aria-label="enuzzo on GitHub"
            >
              enuzzo
            </a>{" "}
            <span aria-hidden="true">·</span>{" "}
            <a
              href="https://github.com/illobo"
              target="_blank"
              rel="noreferrer"
              aria-label="Illobo on GitHub (@illobo)"
            >
              with Illobo
            </a>
          </small>
          <small className="splash-repository">
            Source <span aria-hidden="true">·</span>{" "}
            <a
              href="https://github.com/enuzzo/sedicivalvole"
              target="_blank"
              rel="noreferrer"
              aria-label="sedicivalvole source repository on GitHub"
            >
              <svg
                className="splash-github-mark"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.24c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.3c0 .32.22.7.82.58A12 12 0 0 0 12 .3Z" />
              </svg>
              github.com/enuzzo/sedicivalvole
            </a>
          </small>
          <small className="splash-privacy">Audio, display, motion, and GPS are checked locally.</small>
        </div> : null}
        {phase === "choosing" ? (
          <LaunchSelector
            musicId={launchMusicId}
            environmentId={launchEnvironmentId}
            musicReady={launchMusicId !== "soundtrack" || ["prepared", "paused", "playing"].includes(soundtrackSnapshot?.status)}
            onMusicChange={selectLaunchMusic}
            onEnvironmentChange={setLaunchEnvironmentId}
            onBack={() => setPhase("idle")}
            onStart={() => runHarness({
              musicId: launchMusicId,
              selectedEnvironmentId: launchEnvironmentId,
            })}
          />
        ) : null}
      </section>
      ) : null}

      <section
        className="experience"
        aria-hidden={phase !== "running" || modalOpen}
        inert={phase !== "running" || modalOpen ? true : undefined}
      >
        <header className="topbar control-layer">
          <button
            className="topbar-mark"
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open session report"
            aria-haspopup="dialog"
          >
            <img src={TOPBAR_MARK_URL} alt="" aria-hidden="true" />
          </button>
          <ModeSelector />
          <span className="speed-spacer" aria-hidden="true" />
          <button
            className={`gps-state is-${gpsPresentation.tone}`}
            type="button"
            aria-controls="gps-help-popover"
            aria-expanded={gpsHelpOpen}
            aria-label={`GPS ${gpsPresentation.status}, accuracy ${gpsPresentation.accuracy}`}
            onClick={() => setGpsHelpOpen((current) => !current)}
          >
            <span>GPS</span>
            <small>{gpsPresentation.accuracy}</small>
          </button>
          <button
            className="report-button"
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open session report"
            aria-haspopup="dialog"
          >
            <img
              src="/third-party/tabler-icons/report-analytics.svg"
              alt=""
              aria-hidden="true"
            />
            <span>REPORT</span>
          </button>
        </header>

        <GpsHelpPopover
          open={gpsHelpOpen}
          status={gpsState}
          accuracy={accuracy}
          onClose={() => setGpsHelpOpen(false)}
          onRetry={startGps}
          onDemo={runAtlasDemo}
        />

        <button className="source-readout" type="button" onClick={toggleSource} aria-label={`Speed source ${source}. Tap to switch`}>
          <span className="active-mode-marker" aria-hidden="true">FLUX</span>
          <div className="readout-group">
            <strong>{Math.round(speed)}</strong>
            <div className="readout-labels"><span>km/h</span><small>{source}</small></div>
          </div>
          <div className="readout-divider" />
          <div className="readout-group">
            <strong>{bpm == null ? "—" : Math.round(bpm)}</strong>
            <div className="readout-labels"><span>bpm</span><small>tempo</small></div>
          </div>
          <div className="readout-divider" />
          <div className="readout-group">
            <strong>{Math.round(energy * 100)}</strong>
            <div className="readout-labels"><span>%</span><small>energy</small></div>
          </div>
          {activeEffect && <div className="effect-badge">{activeEffect}</div>}
        </button>

        {controlNotice ? (
          <div className="control-status-notice" role="status" aria-live="polite" aria-atomic="true">
            {controlNotice}
          </div>
        ) : null}

        {manualEffectsDeckOpen ? (
          <ManualEffectsDeck
            values={soundtrackManualEffects}
            onChange={updateManualEffect}
            onClose={() => setManualEffectsDeckOpen(false)}
          />
        ) : null}

        <footer className={`control-slab control-layer${musicMode === "soundtrack" ? " is-soundtrack" : ""}`} aria-label="Flux performance controls">
          <button
            className={`stop-button${muted ? " is-active" : ""}`}
            type="button"
            onClick={toggleMuted}
            aria-pressed={muted}
            aria-label={muted ? "Unmute audio" : "Mute audio"}
          >
            <span>MUTE</span>
            <strong>{muted ? "ON" : "OFF"}</strong>
          </button>
          <button
            className={`effects-button${vehicleEffectsEnabled ? " is-active" : ""}`}
            type="button"
            aria-pressed={vehicleEffectsEnabled}
            aria-label={`${vehicleEffectsEnabled ? "Disable" : "Enable"} vehicle-reactive audio effects`}
            title="Global OPEN, UNDERWATER, and BLOOM audio processing"
            onClick={() => updateVehicleEffects(!vehicleEffectsEnabled)}
          >
            <span>FX</span>
            <strong>{vehicleEffectsEnabled ? "ON" : "OFF"}</strong>
          </button>
          <VisualControl environment={environment} onOpen={() => {
            setEnvironmentPickerOpen(true);
          }} />
          <MusicControl
            genreId={genreId}
            selection={scoreSelection}
            musicMode={musicMode}
            soundtrackSnapshot={soundtrackSnapshot}
            onOpen={() => setSoundtrackPanelOpen(true)}
          />
          <button
            className={`mix-button${manualEffectsDeckOpen ? " is-open" : ""}${SOUNDTRACK_MANUAL_CONTROLS.some(({ id }) => soundtrackManualEffects[id] > 0.01) ? " is-active" : ""}`}
            type="button"
            aria-expanded={manualEffectsDeckOpen}
            aria-controls="manual-effects-deck"
            onClick={() => setManualEffectsDeckOpen((open) => !open)}
          >
            <span>MIX</span>
            <strong>{SOUNDTRACK_MANUAL_CONTROLS.filter(({ id }) => soundtrackManualEffects[id] > 0.01).length}/4</strong>
            <small>{manualEffectsDeckOpen ? "CLOSE" : "PERFORM"}</small>
          </button>
          <PaletteControl themeId={themeId} onChange={setThemeId} />
        </footer>
      </section>

      {supportOpen ? (
        <SupportPanel
          reducedMotion={reducedMotion}
          onClose={() => setSupportOpen(false)}
        />
      ) : null}

      {drawerOpen ? (
        <DialogSurface
          className="diagnostic-drawer diagnostic-report-drawer"
          labelledBy="diagnostic-title"
          onClose={() => {
            setDrawerOpen(false);
            setDiagnosticReadmeOpen(false);
          }}
        >
            <div className="drawer-heading">
              <div>
                <small>LIVE SYSTEM INSTRUMENT</small>
                <h2 id="diagnostic-title">{diagnosticReadmeOpen ? "Technical README" : "Session report"}</h2>
              </div>
              <div className="drawer-heading-actions">
                <button
                  type="button"
                  aria-controls="diagnostic-readme"
                  aria-expanded={diagnosticReadmeOpen}
                  onClick={() => setDiagnosticReadmeOpen((open) => !open)}
                >
                  {diagnosticReadmeOpen ? "BACK TO METRICS" : "README"}
                </button>
                <button
                  data-dialog-initial-focus
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setDiagnosticReadmeOpen(false);
                  }}
                  aria-label="Close session report"
                >
                  CLOSE
                </button>
              </div>
            </div>

            {diagnosticReadmeOpen ? <DiagnosticReadme /> : (
              <div className="diagnostic-instrument">
                <section className="diagnostic-health" aria-label="Current system health">
                  <div className="is-primary">
                    <span>FRAME</span>
                    <strong>{diagnosticReport?.performance.frame.averageFps ?? "—"} FPS</strong>
                    <small>{diagnosticReport?.performance.frame.p95FrameMs ?? "—"} ms p95</small>
                  </div>
                  <div className={gpsState === "live" ? "is-good" : "is-caution"}>
                    <span>GPS</span>
                    <strong>{gpsState === "permission denied" ? "denied" : gpsState}</strong>
                    <small>{accuracy == null ? "accuracy unavailable" : `±${accuracy} m accuracy`}</small>
                  </div>
                  <div className={diagnostics?.audio.state === "running" ? "is-good" : "is-caution"}>
                    <span>AUDIO</span>
                    <strong>{diagnostics?.audio.state || "—"}</strong>
                    <small>{muted ? "output muted" : `energy ${Math.round(energy * 100)}%`}</small>
                  </div>
                  <div className={(diagnosticReport?.runtimeIssues.length ?? 0) === 0 ? "is-good" : "is-alert"}>
                    <span>ISSUES</span>
                    <strong>{diagnosticReport?.runtimeIssues.length ?? "—"}</strong>
                    <small>runtime events</small>
                  </div>
                </section>

                <div className="instrument-grid">
                  <section className="instrument-section" aria-labelledby="diag-motion-title">
                    <h3 id="diag-motion-title">Motion and location</h3>
                    <dl>
                      <InstrumentMetric label="SPEED SOURCE" value={source} detail={`${Math.round(speed)} km/h current`} />
                      <InstrumentMetric label="GPS STATUS" value={gpsState} detail={accuracy == null ? "accuracy unavailable" : `accuracy ±${accuracy} m`} tone={gpsState === "live" ? "good" : "caution"} />
                      <InstrumentMetric label="ROAD ENERGY" value={`${Math.round(energy * 100)}%`} detail="normalized to 130 km/h" />
                      <InstrumentMetric label="RECORDED POSITION" value="NONE" detail="coordinates excluded" tone="good" />
                    </dl>
                  </section>

                  <section className="instrument-section" aria-labelledby="diag-runtime-title">
                    <h3 id="diag-runtime-title">Runtime and rendering</h3>
                    <dl>
                      <InstrumentMetric label="VISUAL" value={environment.label} detail={renderer} />
                      <InstrumentMetric label="VIEWPORT" value={diagnostics ? `${diagnostics.display.innerWidth} × ${diagnostics.display.innerHeight}` : "—"} detail={diagnostics ? `${diagnostics.display.mode} · DPR ${diagnostics.display.dpr}` : "display unavailable"} />
                      <InstrumentMetric label="FRAME PACING" value={`${diagnosticReport?.performance.frame.averageFps ?? "—"} FPS`} detail={`${diagnosticReport?.performance.frame.p95FrameMs ?? "—"} ms p95`} tone="good" />
                      <InstrumentMetric label="PERFORMANCE PHASES" value={Object.keys(diagnosticReport?.performance.phases ?? {}).length} detail={performancePhaseRef.current.replaceAll(":", " · ")} />
                    </dl>
                  </section>

                  <section className="instrument-section" aria-labelledby="diag-audio-title">
                    <div className="instrument-section-heading">
                      <h3 id="diag-audio-title">Audio and resources</h3>
                      {genreId === "fracture" ? (
                        <button
                          className="instrument-action"
                          type="button"
                          onClick={() => {
                            setDrawerOpen(false);
                            setPreviewOpen(true);
                          }}
                        >
                          AUDITION VOICES
                        </button>
                      ) : null}
                    </div>
                    <dl>
                      <InstrumentMetric label="PLAYING" value={getScoreGenre(genreId).label} detail={getScoreGenre(genreId).family} />
                      <InstrumentMetric label="ARRANGEMENT" value={scoreScene} detail={`${scoreStateRef.current?.rhythmLabel ?? (scoreStateRef.current?.halfTime ? "half-time" : "full break")} · ${scoreStateRef.current?.section ?? "—"}`} />
                      <InstrumentMetric label="TACTUS / TRANSPORT" value={bpm == null ? "CLOCKLESS" : `${Math.round(bpm)} BPM`} detail={`${Math.round(transportBpm)} BPM transport · ${scoreStateRef.current?.chord ?? "—"}`} />
                      <InstrumentMetric label="WEB AUDIO" value={diagnostics?.audio.state || "—"} detail={muted ? "output muted" : `output level ${audioLevel}`} />
                      <InstrumentMetric
                        label="OUTPUT LATENCY"
                        value={diagnosticReport?.audio.latencyHistory.latest?.outputLatencyStatus === "reported-positive"
                          ? `${Math.round(diagnosticReport.audio.latencyHistory.latest.outputLatencyMs)} ms`
                          : diagnosticReport?.audio.latencyHistory.latest?.outputLatencyStatus?.toUpperCase() || "UNAVAILABLE"}
                        detail={`${diagnosticReport?.audio.latencyHistory.retainedSamples ?? 0} bounded readings · browser reported`}
                      />
                      <InstrumentMetric label="JAVASCRIPT HEAP" value={currentUsedHeapMb == null ? "UNAVAILABLE" : `${currentUsedHeapMb} MB`} detail="browser-exposed current phase" />
                      <InstrumentMetric label="DECODED AUDIO" value={currentDecodedAudioMb == null ? "UNAVAILABLE" : `${currentDecodedAudioMb} MB`} detail="bounded PCM cache" />
                    </dl>
                  </section>

                  <section className="instrument-section" aria-labelledby="diag-session-title">
                    <h3 id="diag-session-title">Session and transport</h3>
                    <dl>
                      <InstrumentMetric label="FLIGHT RECORDER" value={`${diagnosticReport?.flightRecorder.summary.retainedSamples ?? "—"} SAMPLES`} detail={`${Math.round((diagnosticReport?.flightRecorder.summary.sessionDurationMs ?? 0) / 1000)} s bounded session`} />
                      <InstrumentMetric label="NETWORK" value={diagnosticReport?.network.current.effectiveType || (diagnosticReport?.network.current.online ? "online" : "offline") || "—"} detail={`${diagnosticReport?.network.current.roundTripTimeMs ?? "—"} ms RTT`} />
                      <InstrumentMetric
                        label="OBSERVED DATA"
                        value={`${Math.round((diagnosticReport?.network.observedSessionTraffic.observedDownloadBytes ?? 0) / 104857.6) / 10} MB ↓ · ${Math.round((diagnosticReport?.network.observedSessionTraffic.observedUploadBytes ?? 0) / 104857.6) / 10} MB ↑`}
                        detail={`${diagnosticReport?.network.observedSessionTraffic.unobservableResourceEntries ?? 0} cache/opaque/unavailable entries excluded`}
                      />
                      <InstrumentMetric
                        label="CURRENT / PEAK"
                        value={`${Math.round((diagnosticReport?.network.observedSessionTraffic.currentDownloadBytesPerSecond ?? 0) / 1024)} / ${Math.round((diagnosticReport?.network.observedSessionTraffic.peakDownloadBytesPerSecond ?? 0) / 1024)} KB/s ↓`}
                        detail={`${Math.round((diagnosticReport?.network.observedSessionTraffic.currentUploadBytesPerSecond ?? 0) / 1024)} / ${Math.round((diagnosticReport?.network.observedSessionTraffic.peakUploadBytesPerSecond ?? 0) / 1024)} KB/s ↑ · app/session only`}
                      />
                      <InstrumentMetric
                        label="PERSISTENT CANARY"
                        value={diagnosticReport?.capabilities.storageDiagnostics?.indexedDbStatus?.toUpperCase() || "PENDING"}
                        detail={diagnosticReport?.capabilities.storageDiagnostics?.canary
                          ? `${diagnosticReport.capabilities.storageDiagnostics.canary.seenCount} visits · ${Math.round(diagnosticReport.capabilities.storageDiagnostics.canary.ageMs / 3600000)} h old · persist ${diagnosticReport.capabilities.storageDiagnostics.persistence.granted ? "granted" : "not granted"}`
                          : "IndexedDB read/write evidence unavailable"}
                      />
                      <InstrumentMetric
                        label="LONG TASKS"
                        value={diagnosticReport?.performance.longTasks.supported
                          ? `${diagnosticReport.performance.longTasks.count} OBSERVED`
                          : "UNAVAILABLE"}
                        detail={diagnosticReport?.performance.longTasks.maximumDurationMs == null
                          ? "phase attribution has no reading"
                          : `${Math.round(diagnosticReport.performance.longTasks.maximumDurationMs)} ms max · phase retained`}
                      />
                      <InstrumentMetric label="PAYLOAD" value={`${Math.round(diagnosticPayloadBytes / 1024)} KB`} detail="complete report before fitting" />
                      <InstrumentMetric label="IDENTITY" value={`v${APP_VERSION} · ${APP_COMMIT}`} detail={`build ${APP_BUILD}`} />
                    </dl>
                  </section>
                </div>

                <section className="diagnostic-submit" aria-labelledby="diagnostic-submit-title">
                  <h3 id="diagnostic-submit-title">Submit evidence</h3>
                  <p>
                    Coordinate-free technical report. Nothing is transmitted until SEND DIAGNOSTIC.
                    Keep this session open until the server responds; README explains the complete boundary.
                  </p>
                  <p className={`send-state send-state-${sendState}`} role="status" aria-live="polite">
                    {sendState === "sent" ? "Accepted by the server mail transport. Inbox delivery still needs confirmation." : null}
                    {sendState === "error" ? `${DIAGNOSTIC_SEND_ERROR_COPY[sendErrorCode] ?? "The report could not be sent."} No diagnostic data was stored by the app.` : null}
                  </p>
                  <div className="drawer-actions">
                    <button className="send-diagnostic-button" type="button" onClick={sendDiagnostic} disabled={sendState === "sending"}>
                      {sendState === "sending" ? "SENDING…" : sendState === "sent" ? "SENT" : "SEND DIAGNOSTIC"}
                    </button>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(diagnosticText)}>COPY REPORT</button>
                    <button type="button" onClick={toggleSource}>{source === "GPS" ? "TRY DEMO MODE" : "RETURN TO GPS"}</button>
                    <button type="button" onClick={() => setRawReportOpen((open) => !open)} aria-expanded={rawReportOpen} aria-controls="diagnostic-raw-report">
                      {rawReportOpen ? "HIDE RAW" : "SHOW RAW"}
                    </button>
                  </div>
                </section>

                {rawReportOpen ? (
                  <section className="raw-report" id="diagnostic-raw-report" aria-labelledby="diagnostic-raw-title">
                    <header>
                      <h3 id="diagnostic-raw-title">Complete raw report</h3>
                      <span>{Math.round(diagnosticPayloadBytes / 1024)} KB · JSON</span>
                    </header>
                    <pre>{diagnosticText}</pre>
                  </section>
                ) : null}
              </div>
            )}
        </DialogSurface>
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

      {soundtrackPanelOpen ? (
        <MusicLibraryPanel
          musicMode={musicMode}
          loadingMode={musicModeLoading}
          genreId={genreId}
          snapshot={soundtrackSnapshot}
          jamendoPreviewEntries={jamendoPreviewEntries}
          onModeChange={switchMusicMode}
          onScoreChange={selectScore}
          onFeatured={() => void playSoundtrackSelection({ kind: "featured", id: "signal-border" })}
          onBrowseSelection={(selection) => void playSoundtrackSelection(selection)}
          onTrack={(key) => void playSoundtrackTrack(key)}
          onPrevious={() => void soundtrackRef.current?.move("previous")}
          onPlayPause={() => {
            if (soundtrackSnapshot?.status === "playing") soundtrackRef.current?.pause();
            else void soundtrackRef.current?.resume();
          }}
          onNext={() => void soundtrackRef.current?.move("next")}
          onClose={() => setSoundtrackPanelOpen(false)}
        />
      ) : null}

      {previewOpen ? (
        <DialogSurface
          className="diagnostic-drawer preview-drawer"
          labelledBy="preview-title"
          onClose={closeVoicePreview}
        >
            <div className="drawer-heading">
              <div><small>FLUX SCORE ENGINE</small><h2 id="preview-title">Voices</h2></div>
              <button data-dialog-initial-focus type="button" onClick={closeVoicePreview} aria-label="Close voice preview">CLOSE</button>
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
        </DialogSurface>
      ) : null}

    </main>
  );
}
