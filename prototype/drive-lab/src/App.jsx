import { useLaunchPreload } from "./use-launch-preload.js";
import { preloadLaunchEngine, preloadLaunchVisual } from "./launch-preload.js";
import { MediaGlyph } from "./media-glyph.jsx";
import { RecoveringArtwork, useRecoveringArtwork } from "./recovering-artwork.jsx";
import { createAutomaticDiagnosticClock, readDiagnosticPreferences, DIAGNOSTIC_PREFERENCES_KEY } from "./automatic-diagnostics.js";
import { PhoneRotationNotice, usePhoneLayout } from "./phone-cockpit.jsx";
import { observeSessionStats } from "./environments/atlas/session-stats.js";
import { createTerrainElevation, terrainElevationCell } from "./environments/atlas/terrain-elevation.js";
import { SupportButton } from "./support-button.jsx";
import { LaunchCockpit } from "./launch-cockpit.jsx";
import { initialLaunchSoundtrack, luckySoundtrackGenre, luckyLaunchVisual, soundtrackLaunchReady, prepareExactSoundtrackStart } from "./launch-model.js";
import { startStationaryRefresh } from "./engine/stationary-refresh.js";
import { createEngineMotion } from "./engine/motion.js";
import { useEngine } from "./engine/use-engine.js";
import { ENGINE_CATALOGUE, isEngineProfile } from "./engine/catalogue.js";
import { EngineTelemetry } from "./engine/telemetry-field.jsx";
import { createLoadRecovery } from "./load-recovery.js";
import { ExperienceCard } from "./experience-card.jsx";
import { CURATED_EXPERIENCES, applyExperienceSettings, matchingExperience } from "./curated-experiences.js";
import { resolveSemanticTheme } from "./semantic-theme.js";
import { RailIcon } from "./rail-icon.jsx";
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
// Keep the support QR inside the already-loaded application bundle so opening
// the panel does not depend on a later image request over a weak connection.
import buyMeCoffeeQr from "./assets/bmc_qr.png?inline";
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
  diagnosticMusicIdentity,
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
import { AppearanceControl } from "./appearance-control.jsx";
import {
  DEFAULT_APPEARANCE_MODE,
  normalizeAppearanceMode,
  readAppearancePreference,
  resetAppearancePreference,
  solarAppearancePhase,
  writeAppearancePreference,
} from "./appearance-model.js";
import {
  readSystemAppearanceSnapshot,
  resolveAppearanceState,
  subscribeSystemAppearance,
} from "./appearance-runtime.js";
import {
  clearMediaSessionPresentation,
  createMediaTransportIntentQueue,
  installMediaSessionTransport,
  mediaSessionArtwork,
  playRoadMediaObservation,
  soundtrackMediaIsPlaying,
  soundtrackMediaPositionState,
} from "./media-session.js";
import { createAudioMacroSnapshot } from "./response-mapping.js";
import { createSoundtrackPreviewController } from "./soundtrack/preview-controller.js";
import { createSoundtrackEffectsController } from "./soundtrack/effects-controller.js";
import {
  DEFAULT_PAGE_TITLE,
  soundtrackPageTitle,
} from "./soundtrack/page-title.js";
import {
  retainJamendoPreviewEntries,
  normalizeSoundtrackSelection,
  SOUNDTRACK_GENRE_OPTIONS,
  SOUNDTRACK_PACE_OPTIONS,
} from "./soundtrack/library-model.js";
import { FluxField } from "./flux-field.jsx";
import {
  DEFAULT_FLUX_ENVIRONMENT_ID,
  DISCOVER_VISUAL_CHOICE,
  FLUX_VISUAL_CHOICES,
  getFluxEnvironment,
  isShaderGradientEnvironmentId,
  migrateLegacyEnvironmentPreference,
  nextShaderGradientEnvironmentId,
  SHADERGRADIENT_ENVIRONMENTS,
} from "./flux-environments.js";
import { FLUX_THEMES, getFluxTheme } from "./flux-themes.js";
import {
  DEFAULT_GENRE_ID,
  getScoreGenre,
  SCORE_GENRES,
  SCORE_SOURCE,
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
  ATLAS_DEMO_POSITION,
  appendAtlasJourneySample,
  appendAtlasPositionSample,
  appendAtlasSessionJourneySample,
  appendAtlasTravelPoint,
  atlasGpsPresentation,
  normalizeAtlasMapAppearance,
  resolveAtlasHeading,
} from "./environments/atlas/atlas-model.js";
import {
  DISCOVER_INITIAL_VISIBLE_RESULTS,
  DISCOVER_LANGUAGE_OPTIONS,
  discoverGoogleMapsUrl,
  discoverPreferredLanguage,
  discoverVisibleResultCapacity,
  discoverViewPages,
  discoverWikipediaArticleUrl,
  discoverWikipediaContinuationUrl,
  discoverWikipediaUrl,
  discoverWikipediaSearchUrl,
  normalizeDiscoverPages,
} from "./discover/discover-model.js";
import {
  advanceDemoMotion,
  MODEL_3_AWD_REFERENCE,
  normalizeGpsSpeed,
  ROAD_SPEED_CEILING_KMH,
  smoothGpsSpeed,
  speedToAperturePressure,
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

/**
 * The lanes the voice preview can audition.
 *
 * Identifiers are the score's own lane names, so a block here plays exactly what
 * the arrangement plays. The previous list named voices the engine does not
 * have and described a synth it no longer runs.
 */
const StatsPanel = lazy(() => import("./environments/atlas/stats-panel.jsx"));
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
const SOUNDTRACK_MANUAL_CONTROLS = Object.freeze([
  Object.freeze({ id: "flanger", label: "FLANGER", displayLabel: "Flanger", note: "Jet comb sweep", performanceAmount: 0.78 }),
  Object.freeze({ id: "reverb", label: "REVERB", displayLabel: "Reverb", note: "Long pressure chamber", performanceAmount: 0.72 }),
  Object.freeze({ id: "underwater", label: "UNDERWATER", displayLabel: "Underwater", note: "Dive and surface", performanceAmount: 0.76 }),
  Object.freeze({ id: "phaser", label: "PHASER", displayLabel: "Phaser", note: "Deep phase orbit", performanceAmount: 0.78 }),
  Object.freeze({ id: "bitcrush", label: "BITCRUSH", displayLabel: "Bitcrush", note: "Digital fracture", performanceAmount: 0.72 }),
  Object.freeze({ id: "bassDrive", label: "BASS DRIVE", displayLabel: "Bass Drive", note: "Driven low-end weight", performanceAmount: 0.74, family: "tone" }),
  Object.freeze({ id: "radioCut", label: "RADIO CUT", displayLabel: "Radio Cut", note: "Hard mid-band focus", performanceAmount: 0.76, family: "tone" }),
  Object.freeze({ id: "highCut", label: "HIGH CUT", displayLabel: "High Cut", note: "Clean top-end shave", performanceAmount: 0.76, family: "tone" }),
]);
const EMPTY_SOUNDTRACK_MANUAL_EFFECTS = Object.freeze(Object.fromEntries(
  SOUNDTRACK_MANUAL_CONTROLS.map(({ id }) => [id, 0]),
));
function normalizeManualEffectPreferences(value) {
  return Object.fromEntries(SOUNDTRACK_MANUAL_CONTROLS.map(({ id }) => [
    id,
    Math.min(1, Math.max(0, Number(value?.[id]) || 0)),
  ]));
}
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
  ? Math.min(260, Math.max(0, Number(QA_PARAMS.get("qaSpeed")) || 0))
  : 0;
// A local-only QA latch lets exact-viewport browser checks exercise every
// running state without sending Web Audio to the user's speakers.
const QA_MUTED = import.meta.env.DEV && QA_PARAMS.get("qaMute") === "1";
const QA_EFFECT = import.meta.env.DEV
  && ["UNDERWATER"].includes(QA_PARAMS.get("qaEffect"))
  ? QA_PARAMS.get("qaEffect")
  : null;
const QA_NETWORK = import.meta.env.DEV
  && ["offline", "limited", "medium", "online"].includes(QA_PARAMS.get("qaNetwork"))
  ? QA_PARAMS.get("qaNetwork")
  : null;
const QA_ATLAS_DEMO = import.meta.env.DEV && QA_PARAMS.get("qaAtlasDemo") === "1";
const QA_ATLAS_MAP_APPEARANCE = import.meta.env.DEV && QA_PARAMS.get("qaAtlasMap") === "standard"
  ? "standard"
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
      atlasMapAppearance: normalizeAtlasMapAppearance(value?.atlasMapAppearance ?? "standard"),
      musicMode: value?.musicMode === "soundtrack" ? "soundtrack" : "play-road",
      soundtrackSelection: normalizeSoundtrackSelection(value?.soundtrackSelection),
      lastLaunchVisualId: value?.lastLaunchVisualId,
      launchSoundtrackMode: ["lucky", "precise"].includes(value?.launchSoundtrackMode) ? value.launchSoundtrackMode
        : normalizeSoundtrackSelection(value?.soundtrackSelection).kind === "library" ? "lucky" : "precise",
      manualEffects: normalizeManualEffectPreferences(value?.manualEffects),
      vehicleEffectsEnabled: value?.vehicleEffectsEnabled !== false,
      muted: value?.muted === true,
    };
  } catch {
    return {
      themeId: "red",
      environmentId: DEFAULT_FLUX_ENVIRONMENT_ID,
      genreId: DEFAULT_GENRE_ID,
      driveySettings: DEFAULT_DRIVEY_SETTINGS,
      prtclSettings: DEFAULT_PRTCL_SETTINGS,
      atlasMapAppearance: "standard",
      musicMode: "play-road",
      soundtrackSelection: normalizeSoundtrackSelection(),
      launchSoundtrackMode: "lucky",
      manualEffects: EMPTY_SOUNDTRACK_MANUAL_EFFECTS,
      vehicleEffectsEnabled: true,
      muted: false,
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

function readNetworkUiNotice(reason = "ui", traffic = null, generatedAtMs = performance.now()) {
  if (QA_NETWORK === "offline") {
    return deriveNetworkNoticeState({ connection: { online: false }, traffic, generatedAtMs });
  }
  if (QA_NETWORK === "limited") {
    return deriveNetworkNoticeState({
      connection: { online: true, effectiveType: "2g", downlinkMbps: 0.4, roundTripTimeMs: 1100 },
      traffic,
      generatedAtMs,
    });
  }
  if (QA_NETWORK === "medium") {
    return deriveNetworkNoticeState({
      connection: { online: true, effectiveType: "3g", downlinkMbps: 2, roundTripTimeMs: 450 },
      traffic,
      generatedAtMs,
    });
  }
  if (QA_NETWORK === "online") {
    return deriveNetworkNoticeState({
      connection: { online: true, effectiveType: "4g", downlinkMbps: 10, roundTripTimeMs: 50 },
      traffic,
      generatedAtMs,
    });
  }
  return deriveNetworkNoticeState({ connection: readConnectionSnapshot(reason), traffic, generatedAtMs });
}

function networkUiCopy(notice) {
  if (notice?.status === "offline") return "OFFLINE";
  if (["limited", "request-failed"].includes(notice?.status)) return "LIMITED";
  if (notice?.status === "recovered") return "RECOVERED";
  if (notice?.status === "transferring") return "LOADING";
  return "CONNECTED";
}

function networkUiDetail(notice) {
  if (notice?.status === "offline") return "0 Mb/s";
  const observedBytesPerSecond = notice?.currentDownloadBytesPerSecond > 0
    ? notice.currentDownloadBytesPerSecond
    : notice?.lastObservedDownloadBytesPerSecond;
  if (observedBytesPerSecond > 0) {
    return `${Math.max(0.01, observedBytesPerSecond * 8 / 1_000_000).toFixed(2)} Mb/s OBS`;
  }
  if (Number.isFinite(notice?.downlinkMbps)) {
    return `${notice.downlinkMbps.toFixed(1)} Mb/s EST`;
  }
  return "— Mb/s";
}

const NETWORK_HISTORY_WINDOW_MS = 15 * 60 * 1000;
const NETWORK_HISTORY_SAMPLE_LIMIT = NETWORK_HISTORY_WINDOW_MS / DRIVE_TRACE_INTERVAL_MS;

function networkRateCopy(bytesPerSecond) {
  const value = Math.max(0, Number(bytesPerSecond) || 0);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB/s`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} KB/s`;
  return `${Math.round(value)} B/s`;
}

function networkQualityScore(notice) {
  if (notice?.status === "offline" || notice?.status === "request-failed") return 0;
  if (notice?.tone === "alert") return 0.18;
  if (notice?.tone === "caution") return 0.52;
  if (notice?.status === "transferring") return 0.86;
  if (notice?.tone === "good") return 1;
  return 0.7;
}

function appendNetworkQualitySample(samples, notice, capturedAtMs = performance.now()) {
  const cutoff = capturedAtMs - NETWORK_HISTORY_WINDOW_MS;
  const retained = samples.filter((sample) => sample.capturedAtMs >= cutoff);
  retained.push({
    capturedAtMs,
    downloadRate: (notice?.currentDownloadBytesPerSecond ?? 0) / 1000,
    uploadRate: (notice?.currentUploadBytesPerSecond ?? 0) / 1000,
    score: networkQualityScore(notice),
    tone: notice?.tone ?? "quiet",
  });
  return retained.slice(-NETWORK_HISTORY_SAMPLE_LIMIT);
}

function NetworkControl({ notice, history, open, onOpenChange }) {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const width = 248;
  const height = 48;
  const graphPoints = history.length > 1
    ? history.map((sample, index) => {
      const x = index / (history.length - 1) * width;
      const y = height - sample.score * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ")
    : `0,${(height * 0.3).toFixed(1)} ${width},${(height * 0.3).toFixed(1)}`;

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!containerRef.current?.contains(event.target)) onOpenChange(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      onOpenChange(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onOpenChange, open]);

  return (
    <div className={`network-control${open ? " is-open" : ""}`} ref={containerRef}>
      <button
        ref={triggerRef}
        className={`network-state is-${notice.tone}${notice.status === "transferring" ? " is-loading" : ""}`}
        type="button"
        aria-controls="network-popover"
        aria-expanded={open}
        aria-label={`Network ${networkUiCopy(notice)}. Open 15 minute connection detail.`}
        title={`Network ${networkUiCopy(notice)}`}
        onClick={() => onOpenChange(!open)}
      >
        <span className="network-state-dot" aria-hidden="true" />
      </button>
      {open ? (
        <aside id="network-popover" className="network-popover" role="dialog" aria-modal="false" aria-labelledby="network-popover-title">
          <header>
            <div><small>APPLICATION NETWORK</small><strong id="network-popover-title">{networkUiCopy(notice)}</strong></div>
            <button type="button" onClick={() => onOpenChange(false)}>CLOSE</button>
          </header>
          <dl>
            <div><dt>DOWNLOAD</dt><dd>{networkRateCopy(notice.currentDownloadBytesPerSecond)}</dd></div>
            <div><dt>UPLOAD</dt><dd>{networkRateCopy(notice.currentUploadBytesPerSecond)}</dd></div>
            <div><dt>CONNECTION</dt><dd>{notice.effectiveType?.toUpperCase() || "UNAVAILABLE"}</dd></div>
            <div><dt>LATENCY</dt><dd>{notice.roundTripTimeMs == null ? "UNAVAILABLE" : `${Math.round(notice.roundTripTimeMs)} ms`}</dd></div>
          </dl>
          <figure>
            <figcaption>QUALITY · LAST 15 MIN</figcaption>
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Network quality history with ${history.length} retained samples`}>
              <line x1="0" y1={height / 2} x2={width} y2={height / 2} />
              <polyline points={graphPoints} />
            </svg>
          </figure>
          <p>Browser connection hints and traffic observed by this app only.</p>
        </aside>
      ) : null}
    </div>
  );
}

function boundedDiagnosticText(value, limit = 96) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, limit) : "";
}

function mediaSessionInvocationDiagnostic(invocation) {
  return invocation ? {
    nativeInvocationId: invocation.id ?? null,
    nativeInvocationSequence: invocation.sequence ?? null,
    nativeInvokedAtMs: invocation.invokedAtMs ?? null,
  } : {};
}

function diagnosticControlDetail(target, event) {
  const control = target instanceof Element
    ? target.closest("button, a, input, select, textarea, [role='button'], [role='slider'], [role='switch']")
    : null;
  if (!control) return null;
  const tag = control.tagName.toLowerCase();
  const type = boundedDiagnosticText(control.getAttribute("type") || control.getAttribute("role") || tag, 32);
  const label = boundedDiagnosticText(
    control.getAttribute("aria-label")
      || control.getAttribute("title")
      || control.textContent
      || control.getAttribute("name")
      || control.id
      || tag,
  );
  return {
    tag,
    type,
    label,
    disabled: control.matches(":disabled, [aria-disabled='true']"),
    expanded: control.hasAttribute("aria-expanded") ? control.getAttribute("aria-expanded") === "true" : null,
    pressed: control.hasAttribute("aria-pressed") ? control.getAttribute("aria-pressed") === "true" : null,
    activation: event?.detail === 0 ? "keyboard-or-assistive" : "pointer",
    pointerType: boundedDiagnosticText(event?.nativeEvent?.pointerType, 16) || null,
    trusted: event?.nativeEvent?.isTrusted === true,
  };
}

function diagnosticControlChangeDetail(target) {
  const control = target instanceof Element
    ? target.closest("input, select, textarea, [role='slider'], [role='switch']")
    : null;
  if (!control) return null;
  const type = boundedDiagnosticText(control.getAttribute("type") || control.tagName.toLowerCase(), 32);
  const isTextEntry = ["text", "search", "email", "url", "tel", "password"].includes(type)
    || control.tagName === "TEXTAREA";
  return {
    tag: control.tagName.toLowerCase(),
    type,
    label: boundedDiagnosticText(control.getAttribute("aria-label") || control.getAttribute("name") || control.id || type),
    value: isTextEntry ? null : boundedDiagnosticText(control.value, 64),
    textLength: isTextEntry ? String(control.value || "").length : null,
    checked: typeof control.checked === "boolean" ? control.checked : null,
  };
}

function soundtrackDiagnosticSnapshot(snapshot) {
  const media = snapshot?.media;
  const summarizeRole = (role) => role ? {
    key: role.key ?? null,
    state: role.state ?? null,
    readyState: role.readyState ?? null,
    networkState: role.networkState ?? null,
    bufferedAheadSeconds: role.bufferedAheadSeconds ?? null,
    paused: role.paused ?? null,
    ended: role.ended ?? null,
    currentTimeSeconds: role.currentTimeSeconds ?? null,
    durationSeconds: role.durationSeconds ?? null,
    errorCode: role.errorCode ?? null,
    lastEvent: role.lastEvent ?? null,
  } : null;
  return {
    status: snapshot?.status ?? "unavailable",
    error: boundedDiagnosticText(snapshot?.error, 120) || null,
    current: snapshot?.current ? {
      key: snapshot.current.key,
      title: boundedDiagnosticText(snapshot.current.title, 120),
      artist: boundedDiagnosticText(snapshot.current.artistName, 120),
    } : null,
    previousKey: snapshot?.previous?.key ?? null,
    nextKey: snapshot?.next?.key ?? null,
    transition: snapshot?.transition ? {
      phase: snapshot.transition.phase ?? null,
      targetKey: snapshot.transition.targetKey ?? null,
      progress: roundMetric(snapshot.transition.progress),
    } : null,
    media: media ? {
      currentAudibleKey: media.currentAudibleKey ?? null,
      audibleKeys: media.audibleKeys ?? [],
      preparedMediaElements: media.preparedMediaElements ?? 0,
      playableMediaElements: media.playableMediaElements ?? 0,
      controllerError: media.controllerError ?? null,
      previous: summarizeRole(media.roles?.previous),
      current: summarizeRole(media.roles?.current),
      next: summarizeRole(media.roles?.next),
    } : null,
  };
}

function soundtrackPlaybackConfirmed(snapshot) {
  return snapshot?.status === "playing"
    && Boolean(snapshot?.current?.key)
    && snapshot.media?.currentAudibleKey === snapshot.current.key;
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
  inert,
  labelledBy,
  onClose,
  backdropClass = "drawer-backdrop",
  panelClass = "drawer-panel",
  dismissDirection = "right",
  children,
}) {
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);
  const dragRef = useRef(null);

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

  const finishDrag = useCallback((shouldClose = false) => {
    const panel = panelRef.current;
    const drag = dragRef.current;
    if (panel) {
      panel.style.removeProperty("--drawer-drag-x");
      panel.style.removeProperty("--drawer-drag-y");
      panel.classList.remove("is-dragging");
    }
    if (drag?.pointerId != null) panel?.releasePointerCapture?.(drag.pointerId);
    dragRef.current = null;
    if (shouldClose) onClose();
  }, [onClose]);

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target instanceof HTMLElement
      && event.target.closest("button, a, input, select, textarea, [role='slider'], [contenteditable='true']")) return;
    const panel = panelRef.current;
    if (!panel) return;
    if (dismissDirection === "right" && event.clientX < 28) return;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollTop: panel.scrollTop,
      startedAt: performance.now(),
      active: false,
    };
    panel.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !panel) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    const primary = dismissDirection === "down" ? Math.max(0, deltaY) : Math.max(0, deltaX);
    const cross = dismissDirection === "down" ? Math.abs(deltaX) : Math.abs(deltaY);
    const scrollAllowed = dismissDirection !== "down" || (drag.scrollTop <= 1 && panel.scrollTop <= 1);
    const travel = scrollAllowed && primary > cross * 1.18 ? primary : 0;
    if (!drag.active && travel < 12) return;
    drag.active = true;
    panel.classList.add("is-dragging");
    const elasticTravel = Math.min(190, travel * (travel < 90 ? 0.9 : 0.72));
    panel.style.setProperty("--drawer-drag-x", `${dismissDirection === "right" ? elasticTravel : 0}px`);
    panel.style.setProperty("--drawer-drag-y", `${dismissDirection === "down" ? elasticTravel : 0}px`);
    event.preventDefault();
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = Math.max(0, event.clientX - drag.x);
    const deltaY = Math.max(0, event.clientY - drag.y);
    const travel = dismissDirection === "down" ? deltaY : deltaX;
    const elapsed = Math.max(16, performance.now() - drag.startedAt);
    const velocity = travel / elapsed;
    const distanceThreshold = Math.min(150, Math.max(76, panelRef.current.clientWidth * 0.18));
    finishDrag(drag.active && (travel >= distanceThreshold || (travel >= 44 && velocity >= 0.62)));
  };

  return (
    <section
      className={className}
      inert={inert}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      data-dismiss-direction={dismissDirection}
      onKeyDown={handleKeyDown}
    >
      <button className={backdropClass} type="button" tabIndex={-1} onClick={onClose} aria-label="Close" />
      <div
        ref={panelRef}
        className={panelClass}
        role="document"
        tabIndex={-1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => finishDrag(false)}
      >
        {children}
      </div>
    </section>
  );
}

const DISCOVER_VIEWS = Object.freeze([
  { id: "nearby", label: "NEARBY" },
  { id: "ahead", label: "AHEAD" },
  { id: "region", label: "REGION" },
]);

function DiscoverPanel({ position, onClose, onRetryLocation, onDemoLocation }) {
  const [language, setLanguage] = useState(() => discoverPreferredLanguage(
    typeof navigator === "undefined" ? ["en"] : (navigator.languages ?? [navigator.language]),
  ));
  const [view, setView] = useState("nearby");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pages, setPages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [visibleResultCapacity, setVisibleResultCapacity] = useState(DISCOVER_INITIAL_VISIBLE_RESULTS);
  const [reloadToken, setReloadToken] = useState(0);
  const [status, setStatus] = useState(position ? "loading" : "location");
  const [error, setError] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [mapsQrUrl, setMapsQrUrl] = useState("");
  const resultsRef = useRef(null);

  const globalSearchActive = Boolean(debouncedQuery);
  const queryPending = query.trim() !== debouncedQuery;
  const requestUrl = useMemo(() => (
    globalSearchActive
      ? discoverWikipediaSearchUrl(debouncedQuery, { language, requestLimit: 35 })
      : discoverWikipediaUrl(position, { language, view, requestLimit: 35 })
  ), [debouncedQuery, globalSearchActive, language, position?.latitude, position?.longitude, view]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    const timeout = window.setTimeout(() => setDebouncedQuery(normalizedQuery), 320);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setPages([]);
    setSelectedId(null);
  }, [language]);

  useEffect(() => {
    if (!requestUrl) {
      setStatus("location");
      setPages([]);
      setSelectedId(null);
      return undefined;
    }
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setPages([]);
    setSelectedId(null);
    (async () => {
      const mergedPages = new Map();
      let nextUrl = requestUrl;
      for (let requestIndex = 0; requestIndex < 4 && nextUrl; requestIndex += 1) {
        const response = await fetch(nextUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
        const payload = await response.json();
        for (const page of payload?.query?.pages ?? []) {
          const key = String(page?.pageid ?? page?.title ?? mergedPages.size);
          mergedPages.set(key, { ...(mergedPages.get(key) ?? {}), ...page });
        }
        const candidatePages = normalizeDiscoverPages(
          { query: { pages: [...mergedPages.values()] } },
          position,
          15,
          { searchRanked: globalSearchActive },
        );
        if (candidatePages.length >= 15) break;
        const continuationUrl = discoverWikipediaContinuationUrl(requestUrl, payload?.continue);
        nextUrl = continuationUrl && continuationUrl !== nextUrl ? continuationUrl : null;
      }
      return normalizeDiscoverPages(
        { query: { pages: [...mergedPages.values()] } },
        position,
        15,
        { searchRanked: globalSearchActive },
      );
    })()
      .then((nextPages) => {
        setPages(nextPages);
        setSelectedId((current) => (
          nextPages.some((page) => page.id === current) ? current : nextPages[0]?.id ?? null
        ));
        setStatus(nextPages.length ? "ready" : "empty");
      })
      .catch((nextError) => {
        if (nextError?.name === "AbortError") return;
        setPages([]);
        setSelectedId(null);
        setError(nextError?.message || "Wikipedia is unavailable right now.");
        setStatus("error");
      });
    return () => controller.abort();
  }, [globalSearchActive, reloadToken, requestUrl]);

  const filteredPages = useMemo(() => {
    if (queryPending) return [];
    if (globalSearchActive) return pages;
    return discoverViewPages(pages, { view, heading: position?.heading });
  }, [globalSearchActive, pages, position?.heading, queryPending, view]);
  const selected = filteredPages.find((page) => page.id === selectedId) ?? filteredPages[0] ?? null;
  const visiblePages = filteredPages.slice(0, visibleResultCapacity);
  const remainingPages = filteredPages.slice(visibleResultCapacity);
  const hiddenCount = remainingPages.length;
  const mapsUrl = discoverGoogleMapsUrl(selected);
  const languageLabel = DISCOVER_LANGUAGE_OPTIONS.find((item) => item.id === language)?.label ?? language;
  const articleUrl = useMemo(() => discoverWikipediaArticleUrl(selected?.title, { language }), [language, selected?.title]);

  useEffect(() => {
    let active = true;
    setNavigationOpen(false);
    setMapsQrUrl("");
    if (!mapsUrl) return () => { active = false; };
    import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(mapsUrl, {
      width: 320,
      margin: 1,
      color: { dark: "#070909", light: "#EEEAE0" },
      errorCorrectionLevel: "M",
    })).then((dataUrl) => {
      if (active) setMapsQrUrl(dataUrl);
    }).catch(() => {
      if (active) setMapsQrUrl("");
    });
    return () => { active = false; };
  }, [mapsUrl]);

  useEffect(() => {
    const element = resultsRef.current;
    if (!element) return undefined;
    const updateCapacity = () => {
      const nextCapacity = discoverVisibleResultCapacity(element.clientHeight, filteredPages.length);
      setVisibleResultCapacity((current) => (current === nextCapacity ? current : nextCapacity));
    };
    updateCapacity();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateCapacity);
      return () => window.removeEventListener("resize", updateCapacity);
    }
    const observer = new ResizeObserver(updateCapacity);
    observer.observe(element);
    return () => observer.disconnect();
  }, [filteredPages.length]);

  useEffect(() => {
    resultsRef.current?.scrollTo({ top: 0 });
  }, [language, query, view]);

  const renderResult = (page, index) => (
    <button
      key={page.id}
      data-discover-result-index={index}
      type="button"
      className={selected?.id === page.id ? "is-selected" : ""}
      aria-pressed={selected?.id === page.id}
      onClick={() => setSelectedId(page.id)}
    >
      {page.thumbnail ? <img src={page.thumbnail} alt="" /> : <img className="is-placeholder" src="/third-party/tabler-icons/brand-wikipedia.svg" alt="" aria-hidden="true" />}
      <span>
        <strong>{page.title}</strong>
        <em>{globalSearchActive
          ? (Number.isFinite(page.distanceMetres) ? page.distanceLabel : "GLOBAL RESULT")
          : `${page.distanceLabel} · ≈ ${page.estimatedMinutes} min`}</em>
      </span>
    </button>
  );

  const revealRemainingResults = () => {
    const firstRemaining = resultsRef.current?.querySelector(`[data-discover-result-index="${visibleResultCapacity}"]`);
    if (!firstRemaining) return;
    firstRemaining.focus({ preventScroll: true });
    firstRemaining.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <DialogSurface className="diagnostic-drawer discover-drawer" labelledBy="discover-title" onClose={onClose}>
      <header className="discover-heading">
        <div>
          <h2 id="discover-title">Discover</h2>
          <small>Passenger Index</small>
        </div>
        <div className="discover-heading-actions">
          <button data-dialog-initial-focus type="button" onClick={onClose}>CLOSE</button>
        </div>
      </header>

      <div className="discover-workspace">
        <aside className="discover-index" aria-label="Places index">
          <div className="discover-tools">
            <label>
              <span className="visually-hidden">Wikipedia language</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Wikipedia language">
                {DISCOVER_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="discover-search">
              <span className="visually-hidden">Search places</span>
              <img src="/third-party/tabler-icons/search.svg" alt="" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search Wikipedia worldwide" />
            </label>
          </div>

          <div className="discover-view-tabs" aria-label="Discover scope">
            {DISCOVER_VIEWS.map((item) => (
              <button key={item.id} type="button" className={view === item.id ? "is-active" : ""} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>
            ))}
          </div>

          <div ref={resultsRef} className="discover-results" aria-live="polite" aria-busy={status === "loading"}>
            {visiblePages.map(renderResult)}
            {hiddenCount ? (
              <button className="discover-more" type="button" onClick={revealRemainingResults} aria-label={`Show ${hiddenCount} more places`}>
                +{hiddenCount} MORE <span aria-hidden="true" />
              </button>
            ) : null}
            {remainingPages.map((page, index) => renderResult(page, visibleResultCapacity + index))}
            {status === "loading" || queryPending ? (
              <p className="discover-status"><span aria-hidden="true" />{query.trim() ? `Searching Wikipedia globally in ${languageLabel}…` : `Finding places in ${languageLabel}…`}</p>
            ) : null}
            {status === "location" ? (
              <div className="discover-empty-state">
                <strong>Location required</strong>
                <p>Location is required for nearby scopes. You can still search Wikipedia globally above.</p>
                <div><button type="button" onClick={onRetryLocation}>RETRY GPS</button><button type="button" onClick={onDemoLocation}>MILAN DEMO</button></div>
              </div>
            ) : null}
            {status === "error" ? (
              <div className="discover-empty-state"><strong>Source unavailable</strong><p>{error}</p><button type="button" onClick={() => setReloadToken((current) => current + 1)}>TRY AGAIN</button></div>
            ) : null}
            {status === "empty" || (status === "ready" && !filteredPages.length) ? (
              <div className="discover-empty-state"><strong>No matching places</strong><p>{globalSearchActive ? "Try another global Wikipedia search or language." : "Try another scope, language, or global search."}</p></div>
            ) : null}
          </div>
          <p className="discover-privacy">Wikipedia · {languageLabel} · {globalSearchActive ? "global search" : "session-only location"}</p>
        </aside>

        <article className="discover-reader" aria-live="polite">
          {selected ? (
            <>
              <header>
                <div>
                  <small>SELECTED PLACE</small>
                  <h3>{selected.title}</h3>
                  <span className="discover-reader-meta">{globalSearchActive
                    ? (Number.isFinite(selected.distanceMetres) ? `${selected.distanceLabel} away` : "Global Wikipedia result")
                    : `${selected.distanceLabel} · ≈ ${selected.estimatedMinutes} min drive`}</span>
                </div>
                {mapsUrl ? (
                  <button
                    type="button"
                    className="discover-navigation-trigger"
                    aria-expanded={navigationOpen}
                    aria-controls="discover-navigation-handoff"
                    onClick={() => setNavigationOpen((open) => !open)}
                  >
                    <span>SEND TO NAVIGATION</span>
                    <RailIcon name="navigation" />
                  </button>
                ) : null}
              </header>
              <div className="discover-reader-body">
                {articleUrl ? (
                  <iframe
                    key={articleUrl}
                    className="discover-article-frame"
                    title={`${selected.title} — complete Wikipedia article`}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                    referrerPolicy="origin"
                    src={articleUrl}
                  />
                ) : (
                  <div className="discover-article-fallback" aria-live="polite">
                    {selected.thumbnail ? <img src={selected.thumbnail} alt="" /> : <img className="is-placeholder" src="/third-party/tabler-icons/brand-wikipedia.svg" alt="" aria-hidden="true" />}
                    <div>
                      <strong>Complete article unavailable</strong>
                      <p>{selected.summary || "Wikipedia has no short introduction for this place."}</p>
                    </div>
                  </div>
                )}
                {navigationOpen ? (
                  <section id="discover-navigation-handoff" className="discover-navigation-handoff" aria-labelledby="discover-navigation-title">
                    <div className="discover-navigation-card">
                      <header>
                        <div><small>PHONE → TESLA</small><h4 id="discover-navigation-title">Send this place to the car</h4></div>
                        <button type="button" onClick={() => setNavigationOpen(false)} aria-label="Close navigation handoff">CLOSE</button>
                      </header>
                      <div>
                        {mapsQrUrl ? <img src={mapsQrUrl} width="176" height="176" alt={`Google Maps QR code for ${selected.title}`} /> : <span className="discover-navigation-qr-placeholder">BUILDING QR…</span>}
                        <ol>
                          <li>Scan the QR code to open this place in Google Maps without starting navigation.</li>
                          <li>Refine the pin, explore nearby, or choose Directions when you are ready.</li>
                          <li>Use Share and choose the Tesla app to send your final choice.</li>
                          <li>Tesla can then pass that destination to the car navigation.</li>
                        </ol>
                        <p>Official alternative: Tesla app → Locations → Navigate → Send to Car.</p>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
              <footer className="discover-reader-source">
                <span><img src="/third-party/tabler-icons/brand-wikipedia.svg" alt="" aria-hidden="true" />WIKIPEDIA · {language.toUpperCase()}</span>
                <a href={selected.url} target="_blank" rel="noreferrer">OPEN ON WIKIPEDIA <img src="/third-party/tabler-icons/external-link.svg" alt="" aria-hidden="true" /></a>
              </footer>
            </>
          ) : (
            <div className="discover-reader-placeholder">
              <img src="/third-party/tabler-icons/brand-wikipedia.svg" alt="" aria-hidden="true" />
              <strong>Passenger reading, ready when the road is.</strong>
              <span>Select a place from the index to keep its story open here.</span>
            </div>
          )}
        </article>
      </div>
    </DialogSurface>
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
          <li>No third-party analytics are enabled. Dev automatic reports are ON by default during this development phase; the visible switch turns them OFF.</li>
          <li>Coordinates are not collected, stored, copied, or included in a diagnostic.</li>
          <li>GPS evidence is limited to status, speed confidence, accuracy, and bounded counts.</li>
          <li>Dev can automatically send coordinate-free reports every 15 minutes of active session time. Standard sends only with SEND DIAGNOSTIC. Automatic sending has a visible OFF switch.</li>
          <li>The accepted report is attached as compressed JSON; server acceptance is not inbox delivery.</li>
        </ul>
      </section>

      <section>
        <h4>ATLAS location boundary</h4>
        <p>
          ATLAS may keep the latest reliable position in session memory while the map is
          selected. OpenFreeMap receives the tile area needed for the map and Wikimedia may
          receive a coarse nearby-search cell. OpenStreetMap Overpass receives a rounded area for nearby places. Opening Google Maps or Wikipedia shares the selected place with that service. These lookups never enter automatic technical reports.
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

function FieldFailure({ label, recovery }) {
  return (
    <div className="field-failure" role="status">
      <strong>{label}</strong>
      <span>{recovery === "waiting" ? "Waiting for connection · retrying automatically"
        : recovery === "retrying" || recovery === "loading" ? "Retrying visual · controls remain active"
          : recovery === "exhausted" ? "Retry paused · switch away and back to retry"
            : "Visual unavailable · controls remain active"}</span>
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
      return <FieldFailure label={this.props.label} recovery={this.props.recovery} />;
    }
    return this.props.children;
  }
}

function ModeSelector({ mode = "flux", onChange }) {
  return (
    <nav className="mode-selector" aria-label="Experience mode">
      <button type="button" className={mode === "engine" ? "is-active" : ""} aria-pressed={mode === "engine"} onClick={() => onChange?.("engine")}>ENGINE</button>
      <button className={mode === "flux" ? "is-active" : ""} type="button" aria-pressed={mode === "flux"} onClick={() => onChange?.("flux")}>MUSIC</button>
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

function VisualPicker({ environmentId, onChange, onOpenDiscover, onOpenStats, onSelectGradient, onClose, onExperience, experienceId }) {
  return (
    <DialogSurface
      className="diagnostic-drawer score-drawer environment-drawer"
      labelledBy="visual-picker-title"
      onClose={onClose}
    >
      <div className="drawer-heading">
        <div><small>MUSIC VISUAL LIBRARY</small><h2 id="visual-picker-title">Visual</h2></div>
        <button data-dialog-initial-focus type="button" onClick={onClose} aria-label="Close visual library">CLOSE</button>
      </div>
      <div className="experience-list">{CURATED_EXPERIENCES.map(({ id }) => <ExperienceCard key={id} id={id} selected={experienceId === id} onSelect={onExperience} />)}</div>
      <ul className="score-list">
        {FLUX_VISUAL_CHOICES.map((entry) => {
          const destination = entry.kind === "destination";
          const family = entry.kind === "family";
          const active = family
            ? isShaderGradientEnvironmentId(environmentId)
            : !destination && entry.id === environmentId;
          return (
            <li key={entry.id}>
              <button
                type="button"
                className={`score-entry${active ? " is-active" : ""}${destination ? " is-destination" : ""}`}
                aria-pressed={destination ? undefined : active}
                onClick={() => {
                  if (entry.id === "stats") onOpenStats();
                  else if (destination) onOpenDiscover();
                  else if (family) onSelectGradient();
                  else onChange(entry.id);
                  onClose();
                }}
              >
                <span className="score-entry-body">
                  <strong>{displayLabel(entry)}</strong>
                  <span>{entry.launchDescription}</span>
                </span>
                <span className="score-entry-state">
                  {active ? "ACTIVE" : <span aria-hidden="true">↗</span>}
                </span>
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
      className="visual-cycle-control drivey-cycle-control"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="visual-cycle-rail drivey-cycle-rail">
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
      className="visual-cycle-control prtcl-cycle-control"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="visual-cycle-rail prtcl-cycle-rail">
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

function ShaderGradientCycleControl({ environment, onChange }) {
  const nextEnvironment = getFluxEnvironment(nextShaderGradientEnvironmentId(environment.id));
  return (
    <div
      className="visual-cycle-control gradient-cycle-control"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="visual-cycle-rail gradient-cycle-rail">
        <button
          className="visual-cycle-button visual-gradient-cycle"
          type="button"
          aria-label={`Gradient variant ${displayLabel(environment)}. Next ${displayLabel(nextEnvironment)}`}
          onClick={() => onChange(nextEnvironment.id)}
        >
          <span>VARIANT</span>
          <small>{environment.variantLabel}</small>
        </button>
      </div>
    </div>
  );
}

/** The driving surface lists only scores that can play now. */
function ScoreLibraryContent({ genreId, onChange }) {
  const readyScores = readyScoreGenres();
  const displayScores = [
    ...readyScores.filter((genre) => genre.source === SCORE_SOURCE.sampled),
    ...readyScores.filter((genre) => genre.source === SCORE_SOURCE.generative),
  ];
  return (
    <div className="play-road-library">
      <section className="play-road-intro">
        <h3>THE ROAD BECOMES THE ARRANGEMENT</h3>
        <p>Speed builds the layers. Braking pulls them underwater. Stillness leaves room to breathe.</p>
      </section>
      <ul className="score-list">
        {displayScores.map((genre) => {
          const active = genre.id === genreId;
          return (
            <li key={genre.id} className={`score-list-item is-${genre.source}`}>
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
                      {genre.source === SCORE_SOURCE.generative ? "Responsive generative" : scoreSource(genre.id).label}
                    </em>
                  </strong>
                  <span className="score-entry-family">{genre.family}</span>
                  <span className="score-entry-description">{genre.description}</span>
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
  retrying = false,
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
  const genreRows = [
    SOUNDTRACK_GENRE_OPTIONS.slice(0, 5),
    SOUNDTRACK_GENRE_OPTIONS.slice(5, 10),
    SOUNDTRACK_GENRE_OPTIONS.slice(10, 15),
  ];
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
            <small className="is-featured-artist">FEATURED ARTIST</small>
            <strong>Lobo Playlist</strong>
            <span>Original music written and performed by Illobo.</span>
          </span>
          <span className="soundtrack-choice-action"><MediaGlyph name="play" /><span className="visually-hidden">Play Lobo Playlist</span></span>
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
          <span className="soundtrack-choice-action"><MediaGlyph name="play" /><span className="visually-hidden">Open Jamendo library</span></span>
        </button>
      </div>

      <section className="jamendo-library" aria-labelledby="soundtrack-library-title">
        <div className={`music-library-section-heading${featuredSelected ? "" : " is-jamendo-browser"}`}>
          {featuredSelected ? <div><small>FEATURED ARTIST · ILLOBO</small><h3 id="soundtrack-library-title">Lobo Playlist</h3></div> : <h3 id="soundtrack-library-title" className="visually-hidden">Jamendo soundtrack browser</h3>}
          <div className="soundtrack-library-status">
            {featuredSelected ? <span>ORIGINAL RECORDINGS · 1×</span> : null}
            <strong>{library?.refreshCopy ?? "Fresh mix · changes every 30 min"}</strong>
          </div>
        </div>
        {!featuredSelected ? <div className="soundtrack-filter-layout">
          <div className="soundtrack-filter-group soundtrack-pace-rail">
            <span>PACE</span>
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
          </div>
          <div className="soundtrack-filter-group soundtrack-genre-board">
            <span>GENRE</span>
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
          </div>
        </div> : null}
        <div className="soundtrack-track-list" aria-live="polite">
          {entries.slice(0, 6).map((entry) => (
            <button key={entry.key} type="button" className={entry.key === current?.key ? "is-current" : ""} onClick={() => onTrack(entry.key)}>
              <RecoveringArtwork src={entry.imageUrl} width={48} height={48} />
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
        <section className={`soundtrack-now-playing${snapshot?.attribution?.transitioning ? " is-transitioning" : ""}`} aria-live="polite">
          <RecoveringArtwork src={current?.imageUrl} width={80} height={80} fallback={featuredSelected ? "LO" : "JM"} />
          <div>
            <small className={`soundtrack-now-label${playing ? " is-playing" : ""}`}><MediaGlyph name="levels" />{snapshot?.status === "error" ? (retrying ? "RETRYING" : "LOAD FAILED") : ["loading", "buffering", "prepared"].includes(snapshot?.status) ? "LOADING" : playing ? "NOW PLAYING" : "PAUSED"}</small>
            <strong>{current?.title ?? `Preparing ${featuredSelected ? "Illobo playlist" : "Jamendo catalog"}`}</strong>
            <span>{current?.artistName ?? snapshot?.status ?? "idle"}</span>
            {snapshot?.attribution?.transitioning ? <span className="soundtrack-transition-status">Crossfading</span> : null}
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
                <span>{item.isTarget ? "Current" : "Fading"}</span>
                <strong>{item.credit.title} — {item.credit.artistName}</strong>
                <a href={item.credit.directContentUrl} target="_blank" rel="noreferrer">{item.credit.providerCredit} ↗</a>
                {item.credit.licence.url ? <a href={item.credit.licence.url} target="_blank" rel="noreferrer">{item.credit.licence.label} ↗</a> : <span>{item.credit.licence.label}</span>}
              </div>
            )) : (
              <div className="is-target">
                <span>Current</span>
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
  retrying = false,
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
        <div><small>MUSIC LIBRARY</small><h2 id="music-library-title">Music</h2></div>
        <button data-dialog-initial-focus type="button" onClick={onClose}>CLOSE</button>
      </div>
      <div className="music-drawer-workspace">
        <nav className="music-source-switch" aria-label="Music source">
          <button type="button" className={musicMode === "play-road" ? "is-active" : ""} aria-pressed={musicMode === "play-road"} onClick={() => onModeChange("play-road")}><strong>PLAY THE ROAD</strong></button>
          <button type="button" className={musicMode === "soundtrack" ? "is-active" : ""} aria-pressed={musicMode === "soundtrack"} onClick={() => onModeChange("soundtrack")}><strong>SOUNDTRACK</strong></button>
        </nav>
        <main className="music-drawer-content">
          {loadingMode === musicMode ? (
            <p className="music-mode-loading" role="status" aria-live="polite">
              <span aria-hidden="true" />
              Loading {musicMode === "soundtrack" ? "Soundtrack" : "Play the Road"}…
            </p>
          ) : null}
          {musicMode === "soundtrack" ? (
            <SoundtrackLibraryContent
              snapshot={snapshot}
              retrying={retrying}
              jamendoPreviewEntries={jamendoPreviewEntries}
              onFeatured={onFeatured}
              onBrowseSelection={onBrowseSelection}
              onTrack={onTrack}
              onPrevious={onPrevious}
              onPlayPause={onPlayPause}
              onNext={onNext}
            />
          ) : <ScoreLibraryContent genreId={genreId} onChange={onScoreChange} />}
        </main>
      </div>
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
    <div className="manual-effects-overlay">
      <button className="manual-effects-backdrop" type="button" tabIndex={-1} onClick={onClose} aria-label="Close Performance FX" />
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
        <span>{activeCount}/8 ACTIVE</span>
        <button type="button" onClick={() => SOUNDTRACK_MANUAL_CONTROLS.forEach(({ id }) => onChange(id, 0))}>RESET</button>
        <button type="button" autoFocus onClick={onClose}>CLOSE</button>
      </header>
      <div className="manual-effects-grid">
        {SOUNDTRACK_MANUAL_CONTROLS.map((effect) => {
          const amount = values[effect.id];
          const active = amount > 0.01;
          return (
            <article
              key={effect.id}
              className={`${active ? "is-active" : ""}${effect.family ? ` is-family-${effect.family}` : ""}`.trim()}
            >
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
    </div>
  );
}

/** A full-cell palette preview opens ten independently reachable touch targets. */
function PaletteControl({ themeId, onChange, open, onOpenChange }) {
  const containerRef = useRef(null);
  const selected = getFluxTheme(themeId);
  useEffect(() => {
    if (!open) return undefined;
    const dismiss = (event) => {
      if (event.type === "keydown" ? event.key === "Escape" : !containerRef.current?.contains(event.target)) onOpenChange(false);
    };
    document.addEventListener("pointerdown", dismiss, true);
    document.addEventListener("keydown", dismiss);
    containerRef.current?.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("pointerdown", dismiss, true);
      document.removeEventListener("keydown", dismiss);
    };
  }, [open, onOpenChange]);
  const swatch = (theme) => ({ background: theme.swatchSecondary
    ? `linear-gradient(105deg, ${theme.swatch} 0 52%, ${theme.swatchSecondary} 52% 100%)`
    : theme.swatch });
  return (
    <div className="palette-control" ref={containerRef} onBlurCapture={(event) => {
      if (open && !event.currentTarget.contains(event.relatedTarget)) onOpenChange(false);
    }}>
      <button className="palette-trigger" type="button" aria-label={`Palette ${selected.label}. Choose palette`}
        aria-expanded={open} aria-controls="palette-menu" onClick={() => onOpenChange(!open)}>
        <span className="palette-glyph" aria-hidden="true" />
        <span>Palette</span>
      </button>
      {open ? <div className="palette-menu" id="palette-menu" role="group" aria-label="Colour palettes">
        {FLUX_THEMES.map((theme) => <button key={theme.id} type="button" aria-pressed={theme.id === themeId}
          aria-label={`Use the ${theme.label.toLowerCase()} palette`} onClick={() => { onChange(theme.id); onOpenChange(false); }}>
          <span style={swatch(theme)} aria-hidden="true" /><strong>{theme.label.replace(/\s+\d+$/, "").toLowerCase().replace(/^./, character => character.toUpperCase())}</strong>
        </button>)}
      </div> : null}
    </div>
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
          >
            BUY ME A COFFEE <span aria-hidden="true">→</span>
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

export function App() {
  const [experienceMode, setExperienceMode] = useState("flux");
  const experienceModeRef = useRef("flux");
  experienceModeRef.current = experienceMode;
  const [engineProfileId, setEngineProfileId] = useState("mono");
  const engineMotionRef = useRef(null);
  engineMotionRef.current ??= createEngineMotion();
  const initialPreferences = useMemo(readPreferences, []);
  const initialAppearanceMode = useMemo(readAppearancePreference, []);
  const initialSystemAppearance = useMemo(readSystemAppearanceSnapshot, []);
  const [phase, setPhase] = useState("idle");
  const phoneLayout = usePhoneLayout();
  const phonePortrait = phase === "running" && phoneLayout === "portrait";
  const launchStartedRef = useRef(false);
  const [launchSoundtrackSelection, setLaunchSoundtrackSelection] = useState(() => initialLaunchSoundtrack(initialPreferences.soundtrackSelection));
  const [launchLucky, setLaunchLucky] = useState(true);
  const [launchExperienceId, setLaunchExperienceId] = useState(null);
  const [launchMusicId, setLaunchMusicId] = useState(initialPreferences.musicMode);
  const [launchEnvironmentId, setLaunchEnvironmentId] = useState(() => luckyLaunchVisual(initialPreferences.lastLaunchVisualId ?? initialPreferences.environmentId));
  const [speed, setSpeed] = useState(QA_SPEED);
  const [source, setSource] = useState(QA_SPEED > 0 ? "QA" : "GPS");
  const [gpsState, setGpsState] = useState("not tested");
  const [accuracy, setAccuracy] = useState(null);
  const [renderer, setRenderer] = useState("checking…");
  const [muted, setMuted] = useState(QA_MUTED || initialPreferences.muted);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [controlsAwake, setControlsAwake] = useState(true);
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);
  const [brakeFlash, setBrakeFlash] = useState(0);
  const [diagnostics, setDiagnostics] = useState(null);
  const [sendState, setSendState] = useState("idle");
  const [diagnosticPreferences, setDiagnosticPreferences] = useState(() => {
    try { return readDiagnosticPreferences(localStorage); } catch { return { mode: "dev", automatic: true }; }
  });
  const diagnosticPreferencesRef = useRef(diagnosticPreferences);
  diagnosticPreferencesRef.current = diagnosticPreferences;
  const automaticClockRef = useRef(null);
  automaticClockRef.current ??= createAutomaticDiagnosticClock();
  const [automaticSnapshot, setAutomaticSnapshot] = useState(() => automaticClockRef.current.snapshot());
  const diagnosticTransferRef = useRef(null);
  const sendDiagnosticRef = useRef(null);
  useEffect(() => {
    try { localStorage.setItem(DIAGNOSTIC_PREFERENCES_KEY, JSON.stringify(diagnosticPreferences)); } catch {}
    if (diagnosticPreferences.mode !== "dev" || !diagnosticPreferences.automatic) {
      if (diagnosticTransferRef.current?.trigger === "automatic") diagnosticTransferRef.current.controller.abort();
    }
  }, [diagnosticPreferences]);
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
  const [atlasMapAppearance, setAtlasMapAppearance] = useState(
    QA_ATLAS_MAP_APPEARANCE ?? initialPreferences.atlasMapAppearance,
  );
  const [environmentRuntimeError, setEnvironmentRuntimeError] = useState(null);
  const [environmentAttempt, setEnvironmentAttempt] = useState(0);
  const [environmentRecovery, setEnvironmentRecovery] = useState("idle");
  // React.lazy caches rejected promises: a new attempt needs a fresh lazy owner.
  const AtlasField = useMemo(() => lazy(() => import("./environments/atlas/atlas-field.jsx")), [environmentAttempt]);
  const ShaderGradientField = useMemo(() => lazy(() => import("./environments/shadergradient/shadergradient-field.jsx")), [environmentAttempt]);
  const environmentRecoveryRef = useRef(null);
  const [genreId, setGenreId] = useState(initialPreferences.genreId);
  const [environmentPickerOpen, setEnvironmentPickerOpen] = useState(false);
  const [soundtrackPanelOpen, setSoundtrackPanelOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [manualEffectsDeckOpen, setManualEffectsDeckOpen] = useState(false);
  const [musicMode, setMusicMode] = useState(initialPreferences.musicMode);
  const [musicModeLoading, setMusicModeLoading] = useState(null);
  const [soundtrackSnapshot, setSoundtrackSnapshot] = useState(null);
  const [jamendoPreviewEntries, setJamendoPreviewEntries] = useState([]);
  const [vehicleEffectsEnabled, setVehicleEffectsEnabled] = useState(initialPreferences.vehicleEffectsEnabled);
  const [soundtrackManualEffects, setSoundtrackManualEffects] = useState(initialPreferences.manualEffects);
  const [networkNotice, setNetworkNotice] = useState(() => readNetworkUiNotice("app-start"));
  const [passengerAtlasOpen, setPassengerAtlasOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [atlasPlace, setAtlasPlace] = useState(null);
  const [networkPopoverOpen, setNetworkPopoverOpen] = useState(false);
  const [controlNotice, setControlNotice] = useState(null);
  const [playRoadPaused, setPlayRoadPaused] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [rawReportOpen, setRawReportOpen] = useState(false);
  const [diagnosticReadmeOpen, setDiagnosticReadmeOpen] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [gpsHelpOpen, setGpsHelpOpen] = useState(false);
  const [appearanceMode, setAppearanceMode] = useState(initialAppearanceMode);
  const [appearanceResolution, setAppearanceResolution] = useState(() => ({
    appearance: initialAppearanceMode === "auto"
      ? initialSystemAppearance.colorScheme ?? DEFAULT_APPEARANCE_MODE
      : initialAppearanceMode,
    source: initialAppearanceMode === "auto" && initialSystemAppearance.supported
      ? "system"
      : initialAppearanceMode === "auto" ? "fallback" : "manual",
    holdReason: null,
  }));
  const [appearanceMenuOpen, setAppearanceMenuOpen] = useState(false);
  const [appearanceInteractionActive, setAppearanceInteractionActive] = useState(false);
  const [systemAppearance, setSystemAppearance] = useState(initialSystemAppearance.colorScheme);
  const [systemAppearanceSupported, setSystemAppearanceSupported] = useState(
    initialSystemAppearance.supported,
  );
  const [solarAppearancePhase, setSolarAppearancePhase] = useState(null);
  const [atlasDemoRequest, setAtlasDemoRequest] = useState(QA_ATLAS_DEMO ? 1 : 0);
  const [atlasDemoActive, setAtlasDemoActive] = useState(QA_ATLAS_DEMO);
  const reducedMotion = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    [],
  );

  const audioRef = useRef(null);
  const soundtrackRef = useRef(null);
  const soundtrackWarmupPromiseRef = useRef(null);
  const soundtrackWarmupAttemptedRef = useRef(false);
  const sessionMusicModeRef = useRef(null);
  const musicModeRevisionRef = useRef(0);
  const preferredSoundtrackSelectionRef = useRef(launchSoundtrackSelection);
  const appRef = useRef(null);
  const watchRef = useRef(null);
  const gpsPositionRef = useRef(null);
  const lifetimeEpochRef = useRef(0);
  const dismissFrameRef = useRef(0);
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
  const transportActionQueueRef = useRef(null);
  if (!transportActionQueueRef.current) {
    transportActionQueueRef.current = createMediaTransportIntentQueue();
  }
  const mediaSessionActionsRef = useRef({ move: null, toggle: null });
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
  const networkQualityHistoryRef = useRef([]);
  const diagnosticEventsRef = useRef(createDiagnosticEventLedger());
  const diagnosticEventSequenceRef = useRef(0);
  const mediaActionSequenceRef = useRef(0);
  const runtimeIssuesRef = useRef([]);
  const latestGpsObservationRef = useRef({ capturedAtMs: null, speedKmh: null });
  const atlasPositionSamplesRef = useRef([]);
  const atlasSessionJourneyRef = useRef({
    recentSamples: [],
    sessionSamples: [],
    travelPoints: [],
    startedAtMs: null,
    updatedAtMs: null,
  });
  const readStatsSystem = useCallback(() => {
    const performanceSnapshot = readPerformanceSnapshot(frameTelemetryRef.current, phasePerformanceTelemetryRef.current, longTaskTelemetryRef.current, sessionStartedAtRef.current);
    const engine = geaps.runtimeRef.current?.getState();
    const events = diagnosticEventsRef.current.significant;
    return {
      network: summarizeNetworkTelemetry(networkTelemetryRef.current, performance.now()),
      frame: performanceSnapshot.frame,
      longTasks: performanceSnapshot.longTasks,
      audio: audioRef.current?.context?.state ?? "unavailable",
      engine: { active: experienceModeRef.current === "engine", status: engine?.status ?? "unavailable", playing: engine?.playing, rpm: engine?.rpm, gear: engine?.revving ? 0 : engine?.gear, load: engine?.drive },
      events: { retryCount: events.filter(event => /retry/.test(event.type)).length,
        audioModeChanges: events.filter(event => ["experience.mode.changed", "music.mode.changed"].includes(event.type)).length, scope: "retained" },
    };
  }, []);
  const mapPositionUpdatedAtRef = useRef(Number.NEGATIVE_INFINITY);
  const terrainElevationRef = useRef(null);
  const sessionStartedAtRef = useRef(performance.now());
  const gpsStateRef = useRef(gpsState);
  const accuracyRef = useRef(accuracy);
  const audioLevelRef = useRef(audioLevel);
  const environmentIdRef = useRef(environmentId);
  const lastGradientVariantRef = useRef(
    isShaderGradientEnvironmentId(initialPreferences.environmentId)
      ? initialPreferences.environmentId
      : SHADERGRADIENT_ENVIRONMENTS[0].id,
  );
  const prtclSettingsRef = useRef(prtclSettings);
  const genreIdRef = useRef(genreId);
  const rendererRef = useRef(renderer);
  const drawerOpenRef = useRef(drawerOpen);
  const themeIdRef = useRef(themeId);
  const mutedRef = useRef(muted);
  const playRoadPausedRef = useRef(playRoadPaused);
  const vehicleEffectsEnabledRef = useRef(vehicleEffectsEnabled);
  const bpmRef = useRef(null);
  const transportBpmRef = useRef(scoreTransportTempo);
  const mapPositionRef = useRef(mapPosition);
  const appearanceModeRef = useRef(appearanceMode);
  const appearanceResolutionRef = useRef(appearanceResolution);
  const previousAppearanceDiagnosticRef = useRef(null);

  const theme = getFluxTheme(themeId);
  const semanticTheme = resolveSemanticTheme(theme, appearanceResolution.appearance);
  const environment = getFluxEnvironment(environmentId);
  const aperturePressure = speedToAperturePressure(speed);
  const gpsPresentation = atlasGpsPresentation(gpsState, accuracy, source);
  const modalOpen = phonePortrait || drawerOpen
    || previewOpen
    || environmentPickerOpen
    || soundtrackPanelOpen
    || discoverOpen
    || supportOpen
    || passengerAtlasOpen
    || statsOpen
    || Boolean(atlasPlace);
  const controlsPinned = modalOpen
    || manualEffectsDeckOpen
    || gpsHelpOpen
    || appearanceMenuOpen
    || networkPopoverOpen
    || paletteMenuOpen;
  const controlsPinnedRef = useRef(controlsPinned);
  const previousControlsPinnedRef = useRef(controlsPinned);
  controlsPinnedRef.current = controlsPinned;
  playRoadPausedRef.current = playRoadPaused;
  const logDiagnosticEvent = useCallback((type, detail = {}) => {
    const interaction = type.startsWith("ui.")
      || type.startsWith("media.action.")
      || type.startsWith("media-session.action.");
    recordDiagnosticEvent(diagnosticEventsRef.current, {
      at: new Date().toISOString(),
      elapsedMs: Math.round((performance.now() - sessionStartedAtRef.current) * 10) / 10,
      sequence: ++diagnosticEventSequenceRef.current,
      type,
      detail,
    }, { sample: type === "gps.sample", interaction });
  }, []);

  useEffect(() => {
    const subscription = subscribeSystemAppearance(setSystemAppearance);
    setSystemAppearance(subscription.supported ? subscription.initialColorScheme : null);
    setSystemAppearanceSupported(subscription.supported);
    return subscription.dispose;
  }, []);

  useEffect(() => {
    if (appearanceMode !== "auto" || systemAppearanceSupported !== false) {
      setSolarAppearancePhase(null);
      return undefined;
    }
    if (!mapPosition) {
      setSolarAppearancePhase(null);
      return undefined;
    }
    const sample = () => {
      setSolarAppearancePhase(solarAppearancePhase({
        latitude: mapPosition.latitude,
        longitude: mapPosition.longitude,
      }, Date.now()));
    };
    sample();
    const timer = window.setInterval(sample, 5 * 60 * 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [appearanceMode, mapPosition, systemAppearanceSupported]);

  useEffect(() => {
    setAppearanceResolution((current) => {
      const next = resolveAppearanceState({
        mode: appearanceMode,
        systemColorScheme: systemAppearance,
        solarPhase: solarAppearancePhase,
        currentAppearance: current.appearance,
        interactionActive: appearanceInteractionActive || appearanceMenuOpen,
      });
      return next.appearance === current.appearance
        && next.source === current.source
        && next.holdReason === current.holdReason
        ? current
        : next;
    });
  }, [
    appearanceInteractionActive,
    appearanceMenuOpen,
    appearanceMode,
    solarAppearancePhase,
    systemAppearance,
  ]);

  useEffect(() => {
    const resolutionMatchesPreference = appearanceMode === "auto"
      ? appearanceResolution.source !== "manual"
      : appearanceResolution.source === "manual"
        && appearanceResolution.appearance === appearanceMode;
    if (!resolutionMatchesPreference) return;
    const detail = {
      preference: appearanceMode,
      effective: appearanceResolution.appearance,
      source: appearanceResolution.source,
      holdReason: appearanceResolution.holdReason,
      systemSignalSupported: systemAppearanceSupported === true,
    };
    const signature = JSON.stringify(detail);
    if (previousAppearanceDiagnosticRef.current === signature) return;
    previousAppearanceDiagnosticRef.current = signature;
    logDiagnosticEvent("appearance.resolved", detail);
  }, [appearanceMode, appearanceResolution, logDiagnosticEvent, systemAppearanceSupported]);

  useEffect(() => {
    const effectiveAppearance = appearanceResolution.appearance;
    document.documentElement.style.colorScheme = effectiveAppearance;
    document.documentElement.dataset.appearance = effectiveAppearance;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute("content", effectiveAppearance === "dark" ? "#090b0b" : "#eee9de");
  }, [appearanceResolution.appearance]);

  useEffect(() => {
    if (appearanceMode !== "auto") {
      setAppearanceInteractionActive(false);
      return undefined;
    }
    const releaseAppearanceHold = () => setAppearanceInteractionActive(false);
    window.addEventListener("pointerup", releaseAppearanceHold, true);
    window.addEventListener("pointercancel", releaseAppearanceHold, true);
    window.addEventListener("blur", releaseAppearanceHold);
    return () => {
      window.removeEventListener("pointerup", releaseAppearanceHold, true);
      window.removeEventListener("pointercancel", releaseAppearanceHold, true);
      window.removeEventListener("blur", releaseAppearanceHold);
    };
  }, [appearanceMode]);

  const holdAppearanceDuringPointer = useCallback(() => {
    if (appearanceModeRef.current === "auto") setAppearanceInteractionActive(true);
  }, []);

  const changeAppearance = useCallback((nextMode) => {
    const preference = normalizeAppearanceMode(nextMode);
    const persisted = writeAppearancePreference(preference);
    setAppearanceMode(preference);
    logDiagnosticEvent("appearance.preference.changed", { preference, persisted });
  }, [logDiagnosticEvent]);

  const changeAppearanceMenuOpen = useCallback((open) => {
    setAppearanceMenuOpen(open);
    if (open) {
      setGpsHelpOpen(false);
      setNetworkPopoverOpen(false);
    }
  }, []);

  const changeNetworkPopoverOpen = useCallback((open) => {
    setNetworkPopoverOpen(open);
    if (open) {
      setAppearanceMenuOpen(false);
      setGpsHelpOpen(false);
    }
  }, []);

  const toggleGpsHelp = useCallback(() => {
    setAppearanceMenuOpen(false);
    setNetworkPopoverOpen(false);
    setGpsHelpOpen((current) => !current);
  }, []);

  const closeVoicePreview = useCallback(() => {
    setPreviewOpen(false);
    setDrawerOpen(true);
  }, []);
  const updateSoundtrackSnapshot = useCallback((nextSnapshot) => {
    setSoundtrackSnapshot(nextSnapshot);
    if (nextSnapshot?.library?.selection && launchStartedRef.current) {
      preferredSoundtrackSelectionRef.current = normalizeSoundtrackSelection(nextSnapshot.library.selection);
    }
    setJamendoPreviewEntries((current) => retainJamendoPreviewEntries(current, nextSnapshot));
  }, []);
  const geaps = useEngine({ active: phase === "running" && experienceMode === "engine", muted, profileId: engineProfileId,
    audioRef, motion: engineMotionRef.current, onEvent: logDiagnosticEvent });
  useLaunchPreload(phase !== "running", engineProfileId, preloadLaunchEngine);
  useLaunchPreload(phase !== "running", launchEnvironmentId, preloadLaunchVisual);
  const releaseEngineRev = useCallback(() => geaps.runtimeRef.current?.releaseRev(), [geaps.runtimeRef]);
  const holdEngineRev = useCallback(() => geaps.runtimeRef.current?.setRevHeld(true), [geaps.runtimeRef]);
  const chooseEngineProfile = useCallback((id) => {
    if (!isEngineProfile(id)) return;
    setEngineProfileId(id);
    logDiagnosticEvent("engine.profile.selected", { profileId: id });
  }, [logDiagnosticEvent]);

  const soundtrackController = useCallback(() => {
    if (soundtrackRef.current) return soundtrackRef.current;
    const controller = createSoundtrackPreviewController({
      effectsFactory: () => createSoundtrackEffectsController({
        audioContext: audioRef.current?.context ?? null,
      }),
      onState: updateSoundtrackSnapshot,
      onTelemetry: logDiagnosticEvent,
    });
    controller.setVehicleMaster(vehicleEffectsEnabled);
    controller.setManualEffects(soundtrackManualEffects);
    soundtrackRef.current = controller;
    updateSoundtrackSnapshot(controller.getSnapshot());
    return controller;
  }, [logDiagnosticEvent, soundtrackManualEffects, updateSoundtrackSnapshot, vehicleEffectsEnabled]);

  const prepareSoundtrack = useCallback(({ force = false } = {}) => {
    const controller = soundtrackController();
    const snapshot = controller.getSnapshot();
    if (["loading", "prepared", "paused", "playing", "buffering"].includes(snapshot.status)) {
      return soundtrackWarmupPromiseRef.current ?? Promise.resolve(snapshot);
    }
    if (!force && soundtrackWarmupAttemptedRef.current) return Promise.resolve(snapshot);
    if (soundtrackWarmupPromiseRef.current) return soundtrackWarmupPromiseRef.current;
    soundtrackWarmupAttemptedRef.current = true;
    logDiagnosticEvent("soundtrack.warmup.requested", {
      source: phase === "idle" ? "signal-gate" : "launch-selector",
      selection: preferredSoundtrackSelectionRef.current,
    });
    const request = controller.load({ selection: preferredSoundtrackSelectionRef.current })
      .finally(() => {
        if (soundtrackWarmupPromiseRef.current === request) soundtrackWarmupPromiseRef.current = null;
      });
    soundtrackWarmupPromiseRef.current = request;
    return request;
  }, [logDiagnosticEvent, phase, soundtrackController]);

  const chooseLaunchSoundtrack = useCallback((selection, lucky = false) => {
    const next = normalizeSoundtrackSelection(selection);
    setLaunchExperienceId(null);
    setLaunchLucky(lucky);
    setLaunchSoundtrackSelection(next);
    preferredSoundtrackSelectionRef.current = next;
  }, []);
  const prepareLaunchSoundtrack = useCallback((selection) => {
    preferredSoundtrackSelectionRef.current = selection;
    const controller = soundtrackController();
    const snapshot = controller.getSnapshot();
    if (soundtrackLaunchReady(snapshot, selection)
      || (snapshot.status === "loading" && snapshot.library?.selection?.kind === selection.kind && snapshot.library?.selection?.id === selection.id)) return;
    const request = controller.load({ selection });
    soundtrackWarmupPromiseRef.current = request;
    void request.finally(() => {
      if (soundtrackWarmupPromiseRef.current === request) soundtrackWarmupPromiseRef.current = null;
    });
  }, [soundtrackController]);
  useEffect(() => {
    if (phase !== "idle" || networkNotice.status === "offline" || !navigator.onLine) return;
    prepareLaunchSoundtrack(launchSoundtrackSelection);
  }, [networkNotice.status, phase, experienceMode, launchMusicId, launchSoundtrackSelection, prepareLaunchSoundtrack]);

  const selectLaunchMusic = useCallback((nextMusicId) => {
    setLaunchMusicId(nextMusicId);
    if (nextMusicId !== "soundtrack") {
      if (soundtrackRef.current?.getSnapshot().current) soundtrackRef.current.pause();
      return;
    }
    prepareLaunchSoundtrack(launchSoundtrackSelection);
  }, [launchSoundtrackSelection, prepareLaunchSoundtrack]);
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
  appearanceModeRef.current = appearanceMode;
  appearanceResolutionRef.current = appearanceResolution;
  performancePhaseRef.current = phase === "running"
    ? `drive:${experienceMode === "engine" ? "engine" : environmentId}:${experienceMode === "engine" ? (muted ? "mute" : "engine") : diagnosticMusicIdentity({ mode: musicMode, muted, scoreId: genreId })}:${drawerOpen ? "diagnostics" : "visual"}`
      + (environmentId === "aperture" && speed <= 40 ? ":wall-retreat" : "")
    : `splash:${phase}`;

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
    if (experienceModeRef.current === "flux" && sessionMusicModeRef.current === "soundtrack") {
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
    environmentRecoveryRef.current?.succeed();
    recordPhaseFrame(phasePerformanceTelemetryRef.current, sample);
    if (!diagnosticsActiveRef.current) return;
    frameTelemetryRef.current = recordFrameSample(frameTelemetryRef.current, sample);
  }, []);

  // Only an open surface can pin chrome. DOM focus never extends its lifetime.
  const restControls = useCallback(() => {
    if (controlsPinnedRef.current) return;
    window.clearTimeout(wakeTimerRef.current);
    if (isControlLayerFocused(document.activeElement)) appRef.current?.focus({ preventScroll: true });
    setControlsAwake(false);
  }, []);

  const wakeControls = useCallback(() => {
    window.cancelAnimationFrame(dismissFrameRef.current);
    window.clearTimeout(wakeTimerRef.current);
    setControlsAwake(true);
    wakeTimerRef.current = window.setTimeout(restControls, 6000);
  }, [restControls]);

  const queueExperienceFocus = useCallback((activationTarget = null) => {
    window.cancelAnimationFrame(dismissFrameRef.current);
    dismissFrameRef.current = window.requestAnimationFrame(() => {
      if (phase !== "running" || controlsPinnedRef.current) return;
      if (activationTarget && !shouldReleaseControlFocus(activationTarget, false)) return;
      appRef.current?.focus({ preventScroll: true });
      restControls();
    });
  }, [phase, restControls]);

  const handleControlActivation = useCallback((event) => {
    if (diagnosticsActiveRef.current) {
      const detail = diagnosticControlDetail(event.target, event);
      if (detail) logDiagnosticEvent("ui.control.activated", detail);
    }
    queueExperienceFocus(event.target);
  }, [logDiagnosticEvent, queueExperienceFocus]);

  const handleControlChange = useCallback((event) => {
    if (!diagnosticsActiveRef.current) return;
    const detail = diagnosticControlChangeDetail(event.target);
    if (detail) logDiagnosticEvent("ui.control.changed", detail);
  }, [logDiagnosticEvent]);

  useEffect(() => {
    const wasPinned = previousControlsPinnedRef.current;
    previousControlsPinnedRef.current = controlsPinned;
    if (wasPinned && !controlsPinned) queueExperienceFocus();
  }, [controlsPinned, queueExperienceFocus]);

  const vehicleMoving = speed >= 0.8;
  useEffect(() => {
    // Departure retracts chrome once. Subsequent speed samples must not cancel
    // an explicit pointer/keyboard wake while the vehicle remains in motion.
    if (vehicleMoving) restControls();
  }, [vehicleMoving, restControls]);

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

  useEffect(() => {
    if (phase !== "running" || experienceMode !== "engine" || muted) return;
    return startStationaryRefresh({
      geolocation: navigator.geolocation,
      eligible: () => sourceRef.current === "GPS" && watchRef.current != null
        && latestGpsObservationRef.current.speedKmh === 0 && document.visibilityState !== "hidden"
        && (engineMotionRef.current.snapshot(performance.now()).ageMs ?? Infinity) >= 750,
      onPosition: position => gpsPositionRef.current?.(position, false),
    });
  }, [phase, experienceMode, muted]);

  useEffect(() => {
    if (phase !== "running") return;
    const terrain = createTerrainElevation({
      now: () => performance.now(),
      canRequest: () => sourceRef.current === "GPS" && document.visibilityState !== "hidden"
        && navigator.onLine !== false && performance.now() - (latestGpsObservationRef.current.capturedAtMs ?? -Infinity) <= 15000,
      onResult: result => {
        const journey = atlasSessionJourneyRef.current;
        const backfill = samples => samples.map(sample => sample.terrainCell === result.cell
          && !Number.isFinite(sample.altitudeM) ? { ...sample, groundElevationM: result.elevationM } : sample);
        atlasSessionJourneyRef.current = { ...journey,
          recentSamples: backfill(journey.recentSamples), sessionSamples: backfill(journey.sessionSamples),
          terrain: result };
      },
    });
    terrainElevationRef.current = terrain;
    const position = atlasPositionSamplesRef.current.at(-1);
    if (position && Number.isFinite(position.accuracyM) && position.accuracyM >= 0 && position.accuracyM <= 250
      && position.capturedAtMs === latestGpsObservationRef.current.capturedAtMs
      && performance.now() - position.capturedAtMs <= 15000) {
      terrain.observe(position, { needed: position.altitudeM == null });
    }
    const recover = () => document.visibilityState === "hidden" || navigator.onLine === false
      ? terrain.pause() : terrain.recover();
    window.addEventListener("online", recover); window.addEventListener("offline", recover);
    document.addEventListener("visibilitychange", recover);
    return () => {
      window.removeEventListener("online", recover); window.removeEventListener("offline", recover);
      document.removeEventListener("visibilitychange", recover);
      terrain.destroy(); terrainElevationRef.current = null;
    };
  }, [phase]);

  useEffect(() => {
    if (source === "GPS") terrainElevationRef.current?.recover();
    else terrainElevationRef.current?.pause();
  }, [source]);

  const startGps = useCallback(() => {
    gpsTelemetryRef.current = createGpsTelemetry(performance.now());
    lastGpsSampleAtRef.current = null;
    lastGpsEventAtRef.current = null;
    gpsSpeedLockedRef.current = false;
    atlasPositionSamplesRef.current = [];
    atlasSessionJourneyRef.current = {
      recentSamples: [],
      sessionSamples: [],
      travelPoints: [],
      startedAtMs: null,
      updatedAtMs: null,
    };
    mapPositionUpdatedAtRef.current = Number.NEGATIVE_INFINITY;
    if (!navigator.geolocation) {
      setGpsState("unavailable");
      logDiagnosticEvent("gps.unavailable");
      return;
    }
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    setGpsState("permission requested");
    logDiagnosticEvent("gps.requested", { highAccuracy: true });
    gpsPositionRef.current = (position, liveWatch = true) => {
        const capturedAtMs = performance.now();
        const accuracyM = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null;
        const altitudeM = Number.isFinite(position.coords.altitude) && position.coords.altitude >= -500
          && position.coords.altitude <= 10000 ? position.coords.altitude : null;
        const altitudeAccuracyM = Number.isFinite(position.coords.altitudeAccuracy) && position.coords.altitudeAccuracy >= 0
          ? position.coords.altitudeAccuracy : null;
        setAccuracy(Number.isFinite(accuracyM) ? Math.round(accuracyM) : null);
        const kmh = normalizeGpsSpeed(position.coords.speed);
        if (sourceRef.current === "GPS") engineMotionRef.current.observe({ source: "GPS", rawSpeedKmh: kmh,
          sourceTimestampMs: position.timestamp, receivedMs: capturedAtMs, epochNowMs: Date.now(), accuracyM, liveWatch });
        latestGpsObservationRef.current = { capturedAtMs, speedKmh: kmh };
        const terrainPosition = accuracyM != null && accuracyM >= 0 && accuracyM <= 250
          && Number.isFinite(position.coords.latitude) && Number.isFinite(position.coords.longitude)
          ? { latitude: position.coords.latitude, longitude: position.coords.longitude } : null;
        const terrain = terrainElevationRef.current?.observe(terrainPosition,
          { needed: sourceRef.current === "GPS" && altitudeM == null });
        gpsTelemetryRef.current = recordGpsSample(gpsTelemetryRef.current, {
          capturedAtMs,
          speedKmh: kmh,
          accuracyM,
          altitudeAvailable: altitudeM != null,
          altitudeAccuracyKnown: altitudeM != null && altitudeAccuracyM != null,
          altitudeGainEligible: altitudeM != null && altitudeAccuracyM != null && altitudeAccuracyM <= 15
            && accuracyM != null && accuracyM >= 0 && accuracyM <= 50 && kmh != null && kmh <= 250,
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
          // A retained map point is not evidence of uninterrupted reception.
          // Re-arm exhausted recovery when a real watch resumes after a long gap.
          if (previousPosition && capturedAtMs - previousPosition.capturedAtMs > 15000) {
            environmentRecoveryRef.current?.wake();
          }
          const nextMapPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: resolveAtlasHeading(previousPosition, position.coords, position.coords.heading),
            speedKmh: kmh,
            altitudeM,
            altitudeAccuracyM,
            accuracyM,
            capturedAtMs,
          };
          atlasPositionSamplesRef.current = appendAtlasPositionSample(
            atlasPositionSamplesRef.current,
            nextMapPosition,
            capturedAtMs,
          );
          const previousJourney = atlasSessionJourneyRef.current;
          const recentSamples = appendAtlasJourneySample(previousJourney.recentSamples, {
            capturedAtMs,
            speedKmh: Number.isFinite(accuracyM) && accuracyM <= 50 ? kmh : null,
            // Plot reported height independently of the stricter ascent/descent filter.
            altitudeM: nextMapPosition.altitudeM,
            groundElevationM: altitudeM == null ? terrain?.elevationM ?? null : null,
            terrainCell: altitudeM == null ? terrainElevationCell(terrainPosition) : null,
            headingDegrees: nextMapPosition.heading,
          });
          const latestJourneySample = recentSamples.at(-1);
          const sessionSamples = latestJourneySample?.capturedAtMs !== previousJourney.recentSamples.at(-1)?.capturedAtMs
            ? appendAtlasSessionJourneySample(previousJourney.sessionSamples, latestJourneySample)
            : previousJourney.sessionSamples;
          atlasSessionJourneyRef.current = {
            ...previousJourney,
            totals: observeSessionStats(previousJourney.totals, nextMapPosition),
            recentSamples,
            sessionSamples,
            travelPoints: appendAtlasTravelPoint(previousJourney.travelPoints, nextMapPosition),
            startedAtMs: previousJourney.startedAtMs ?? capturedAtMs,
            updatedAtMs: capturedAtMs,
            terrain: terrain ?? previousJourney.terrain,
          };
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
      };
    watchRef.current = navigator.geolocation.watchPosition(
      gpsPositionRef.current,
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
      && !appearanceMenuOpen
      && atlasGpsPresentation(gpsState, accuracy, source).requiresHelp) {
      setGpsHelpOpen(true);
    }
    if (mapPosition) {
      setAtlasDemoActive(false);
      setGpsHelpOpen(false);
    }
  }, [accuracy, appearanceMenuOpen, atlasDemoActive, environmentId, gpsState, mapPosition, phase, source]);

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
  }, [logDiagnosticEvent, startDemo, triggerBrake]);

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
  }, [logDiagnosticEvent, startDemo]);

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
  }, [logDiagnosticEvent, startDemo]);

  const releaseKeyboardAcceleration = useCallback(() => {
    if (!acceleratorHeldRef.current) return;
    startKeyboardRegeneration("accelerator-release");
  }, [startKeyboardRegeneration]);

  const runHarness = useCallback(async ({ musicId, selectedEnvironmentId, experienceId = null }) => {
    if (launchStartedRef.current) return;
    launchStartedRef.current = true;
    const launchEngine = experienceModeRef.current === "engine";
    if (launchEngine) musicId = "play-road";
    const launchMuted = QA_MUTED || mutedRef.current || (!launchEngine && musicId === "mute");
    const launchVehicleEffects = vehicleEffectsEnabledRef.current;
    const selectedDiscover = selectedEnvironmentId === DISCOVER_VISUAL_CHOICE.id;
    const launchDiscover = !launchEngine && selectedDiscover;
    const launchStats = selectedEnvironmentId === "stats";
    const runtimeEnvironmentId = selectedDiscover || launchStats
      ? DEFAULT_FLUX_ENVIRONMENT_ID
      : selectedEnvironmentId;
    sessionStartedAtRef.current = performance.now();
    diagnosticsActiveRef.current = true;
    diagnosticEventsRef.current = createDiagnosticEventLedger();
    diagnosticEventSequenceRef.current = 0;
    mediaActionSequenceRef.current = 0;
    transportActionQueueRef.current.invalidate();
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
    logDiagnosticEvent("harness.launch.requested", {
      experienceId,
      musicMode: musicId,
      environment: runtimeEnvironmentId,
      muted: launchMuted,
      vehicleEffectsEnabled: launchVehicleEffects,
      online: navigator.onLine,
      visibility: document.visibilityState,
    });
    sessionMusicModeRef.current = musicId;
    setMusicMode(musicId === "soundtrack" ? "soundtrack" : "play-road");
    soundtrackRef.current?.setVehicleMaster(launchVehicleEffects);
    const launchMediaActionId = musicId === "soundtrack"
      ? `transport-${++mediaActionSequenceRef.current}`
      : null;
    if (launchMediaActionId) {
      logDiagnosticEvent("media.action.requested", {
        actionId: launchMediaActionId,
        action: "play",
        source: "launch-start",
        musicMode: "soundtrack",
        muted: launchMuted,
        online: navigator.onLine,
        visibility: document.visibilityState,
        before: soundtrackDiagnosticSnapshot(soundtrackRef.current?.getSnapshot?.()),
      });
    }
    const soundtrackStart = musicId === "soundtrack" && !launchMuted
      ? prepareExactSoundtrackStart(soundtrackController(), preferredSoundtrackSelectionRef.current)
      : null;
    setSupportOpen(false);
    setMuted(launchMuted);
    setVehicleEffectsEnabled(launchVehicleEffects);
    setDiscoverOpen(false);
    setEnvironmentId(runtimeEnvironmentId);
    logDiagnosticEvent("harness.started", {
      musicMode: musicId,
      environment: runtimeEnvironmentId,
      launchDestination: launchStats ? "stats" : launchDiscover ? DISCOVER_VISUAL_CHOICE.id : null,
    });
    setPhase("testing");
    wakeControls();
    window.setTimeout(() => {
      setPhase("running");
      if (launchStats) setStatsOpen(true);
      if (launchDiscover) {
        setDiscoverOpen(true);
        logDiagnosticEvent("discover.opened", { source: "launch-selector" });
      }
      wakeControls();
      window.requestAnimationFrame(() => appRef.current?.focus({ preventScroll: true }));
    }, reducedMotion ? 180 : 620);
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
        {
          audioContext: launchEngine || musicId === "soundtrack"
            ? soundtrackRef.current?.getAudioContext?.() ?? null
            : null,
          deferScoreWorklets: launchEngine || musicId === "soundtrack",
        },
      );
      if (!audioRef.current) throw new Error("Web Audio is unavailable");
      audioRef.current.setSourceMode(launchEngine ? "engine" : "flux");
      await audioRef.current.resume();
      audioRef.current.setMuted(launchMuted || musicId === "soundtrack");
      audioRef.current.setVehicleEffectsEnabled(launchVehicleEffects);
      audioRef.current.setManualEffects(soundtrackManualEffects);
      // The speed effect may have run before the audio engine existed (notably
      // for an exact qaSpeed launch). Seed the engine from the current signal
      // before choosing a score so its first complete section is the right one.
      audioRef.current.setSpeed(speedRef.current);
      if (musicId === "play-road" && !launchEngine) {
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
        logDiagnosticEvent("media.action.completed", {
          actionId: launchMediaActionId,
          action: "play",
          source: "launch-start",
          durationMs: roundMetric(performance.now() - sessionStartedAtRef.current),
          playbackConfirmed: soundtrackPlaybackConfirmed(started),
          after: soundtrackDiagnosticSnapshot(started),
        });
        if (!launchMuted && started?.status !== "playing") {
          const message = started?.error || "Soundtrack will start when the connection is ready";
          setScoreSelection({ status: "waiting", requestedScoreId: null, message });
          logDiagnosticEvent("audio.start-deferred", { message });
        }
      }
      window.clearInterval(audioMeterTimerRef.current);
      audioMeterTimerRef.current = window.setInterval(() => {
        const engine = audioRef.current;
        setAudioLevel(
          experienceModeRef.current === "flux" && sessionMusicModeRef.current === "soundtrack"
            ? soundtrackRef.current?.getLevel() ?? 0
            : engine?.getLevel() ?? 0,
        );
        const snapshot = engine?.getMacroSnapshot() ?? createAudioMacroSnapshot({
          capturedAtMs: performance.now(),
        });
        setAudioMacros(QA_EFFECT ? createAudioMacroSnapshot({
          capturedAtMs: snapshot.capturedAtMs,
          underwater: QA_EFFECT === "UNDERWATER" ? 1 : 0,
        }) : snapshot);
      }, 180);
    } catch (error) {
      audioRef.current?.destroy();
      audioRef.current = null;
      const message = String(error?.message || "Audio engine unavailable").slice(0, 160);
      setScoreSelection({ status: "unavailable", requestedScoreId: null, message });
      logDiagnosticEvent("audio.start-failed", { message });
      if (launchMediaActionId) {
        logDiagnosticEvent("media.action.failed", {
          actionId: launchMediaActionId,
          action: "play",
          source: "launch-start",
          durationMs: roundMetric(performance.now() - sessionStartedAtRef.current),
          reason: message,
          after: soundtrackDiagnosticSnapshot(soundtrackRef.current?.getSnapshot?.()),
        });
      }
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
        mediaSession: "mediaSession" in navigator,
        mediaMetadata: "MediaMetadata" in window,
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
  }, [genreId, handleScoreRecovery, logDiagnosticEvent, reducedMotion, soundtrackManualEffects, soundtrackController, startGps, triggerPulse, wakeControls]);

  const selectScore = useCallback(async (requestedScoreId, { preserveQueuedNavigation = false } = {}) => {
    if (!preserveQueuedNavigation) transportActionQueueRef.current.invalidate();
    const revision = ++scoreSelectionRevisionRef.current;
    const engine = audioRef.current;
    if (!engine) {
      const message = "Audio engine unavailable";
      setScoreSelection({ status: "unavailable", requestedScoreId: null, message });
      logDiagnosticEvent("score.change-failed", {
        requested: requestedScoreId,
        reason: "engine-unavailable",
      });
      return Object.freeze({ ok: false, requestedScoreId, activeScoreId: null, reason: "engine-unavailable" });
    }
    setScoreSelection({ status: "loading", requestedScoreId, message: null });
    try {
      const activeScoreId = await engine.setScore(requestedScoreId);
      if (revision !== scoreSelectionRevisionRef.current) {
        return Object.freeze({ ok: false, requestedScoreId, activeScoreId: null, reason: "stale-selection" });
      }
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
      return Object.freeze({ ok: true, requestedScoreId, activeScoreId, fallback, reason: null });
    } catch (error) {
      if (revision !== scoreSelectionRevisionRef.current) {
        return Object.freeze({ ok: false, requestedScoreId, activeScoreId: null, reason: "stale-selection" });
      }
      const reason = String(error?.message || "Music selection failed").slice(0, 160);
      setScoreSelection({
        status: "unavailable",
        requestedScoreId: null,
        message: reason,
      });
      logDiagnosticEvent("score.change-failed", { requested: requestedScoreId });
      return Object.freeze({ ok: false, requestedScoreId, activeScoreId: null, reason });
    }
  }, [logDiagnosticEvent]);

  const chooseExperienceMode = useCallback((nextMode) => {
    if (!["engine", "flux"].includes(nextMode) || nextMode === experienceModeRef.current) return;
    transportActionQueueRef.current.invalidate();
    musicModeRevisionRef.current++;
    scoreSelectionRevisionRef.current++;
    experienceModeRef.current = nextMode;
    engineMotionRef.current.reset("experience-changed");
    geaps.runtimeRef.current?.setEnabled(false);
    setExperienceMode(nextMode);
    setEnvironmentPickerOpen(false); setSoundtrackPanelOpen(false); setManualEffectsDeckOpen(false);
    audioRef.current?.setSourceMode(nextMode);
    audioRef.current?.resume().catch(() => {});
    soundtrackRef.current?.pause();
    if (nextMode === "engine") {
      audioRef.current?.setMuted(mutedRef.current);
    } else if (phase === "running") {
      if (sessionMusicModeRef.current === "soundtrack") {
        audioRef.current?.setMuted(true);
        if (!mutedRef.current) void soundtrackRef.current?.resume();
      } else {
        void audioRef.current?.setScore(genreIdRef.current).then(() => {
          if (experienceModeRef.current === "flux") audioRef.current?.setMuted(mutedRef.current);
        }).catch(error => logDiagnosticEvent("audio.mode.failed", { reason: String(error?.message || error).slice(0, 120) }));
      }
    }
    logDiagnosticEvent("experience.mode.changed", { mode: nextMode });
    wakeControls();
  }, [geaps.runtimeRef, logDiagnosticEvent, phase, wakeControls]);

  const switchMusicMode = useCallback(async (nextMode) => {
    if (!["play-road", "soundtrack"].includes(nextMode)) return;
    transportActionQueueRef.current.invalidate();
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
        await prepareSoundtrack({ force: true });
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
  }, [logDiagnosticEvent, prepareSoundtrack, soundtrackController]);

  useEffect(() => {
    const soundtrackStatus = soundtrackSnapshot?.status;
    if (phase !== "running"
      || experienceMode !== "flux"
      || musicMode !== "soundtrack"
      || muted
      || !["idle", "error", "prepared"].includes(soundtrackStatus)) return undefined;
    let cancelled = false;
    let retrying = false;
    const retry = async () => {
      if (cancelled || retrying || document.visibilityState === "hidden") return;
      if (soundtrackStatus !== "prepared"
        && (networkNotice.status === "offline" || !navigator.onLine)) return;
      retrying = true;
      const controller = soundtrackController();
      const result = soundtrackStatus === "prepared"
        ? await controller.resume()
        : await controller.load({
          selection: preferredSoundtrackSelectionRef.current,
          autoplay: true,
        });
      retrying = false;
      if (!cancelled && result?.status === "playing") {
        setScoreSelection({ status: "ready", requestedScoreId: null, message: null });
        logDiagnosticEvent("audio.start-recovered", { source: "automatic-network-retry" });
      }
    };
    const timer = soundtrackStatus === "prepared"
      ? window.setTimeout(() => void retry(), 0)
      : window.setTimeout(() => void retry(), 8000);
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", retry);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", retry);
    };
  }, [experienceMode, logDiagnosticEvent, musicMode, muted, networkNotice.status, phase, soundtrackController, soundtrackSnapshot?.status]);

  const resetSavedState = useCallback(() => {
    setDiagnosticPreferences({ mode: "dev", automatic: true });
    setLaunchExperienceId(null);
    transportActionQueueRef.current.invalidate();
    musicModeRevisionRef.current += 1;
    scoreSelectionRevisionRef.current += 1;
    try {
      localStorage.removeItem(PREFERENCES_KEY);
      localStorage.removeItem(LEGACY_PREFERENCES_KEY);
      localStorage.removeItem(DIAGNOSTIC_PREFERENCES_KEY);
      localStorage.removeItem("sedicivalvole.session-report-recipient.v1");
    } catch {
      // Reset remains useful even when storage access is unavailable.
    }
    const forgetController = new AbortController();
    const forgetTimeout = window.setTimeout(() => forgetController.abort(), 5000);
    void fetch("/api/session-report.php", { method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "forget" }), signal: forgetController.signal })
      .catch(() => {}).finally(() => window.clearTimeout(forgetTimeout));
    resetAppearancePreference();
    setAppearanceMode(DEFAULT_APPEARANCE_MODE);
    setAppearanceMenuOpen(false);
    const resetSelection = initialLaunchSoundtrack();
    preferredSoundtrackSelectionRef.current = resetSelection;
    setLaunchSoundtrackSelection(resetSelection);
    setLaunchLucky(true);
    setLaunchMusicId("play-road");
    setLaunchEnvironmentId(DEFAULT_FLUX_ENVIRONMENT_ID);
    setThemeId("red");
    setEnvironmentId(DEFAULT_FLUX_ENVIRONMENT_ID);
    setGenreId(DEFAULT_GENRE_ID);
    setDriveySettings(DEFAULT_DRIVEY_SETTINGS);
    setPrtclSettings(DEFAULT_PRTCL_SETTINGS);
    setAtlasMapAppearance("standard");
    setSoundtrackManualEffects(EMPTY_SOUNDTRACK_MANUAL_EFFECTS);
    setVehicleEffectsEnabled(true);
    setMuted(QA_MUTED);
    if (phase === "running") {
      void switchMusicMode("play-road");
      showControlNotice("SAVED STATE RESET", true);
    } else {
      soundtrackRef.current?.pause();
      setMusicMode("play-road");
    }
    logDiagnosticEvent("preferences.reset", { scope: "local-product-state" });
  }, [logDiagnosticEvent, phase, showControlNotice, switchMusicMode]);

  const playSoundtrackSelection = useCallback(async (selection, source = "music-library") => {
    setLaunchLucky(false);
    transportActionQueueRef.current.invalidate();
    musicModeRevisionRef.current += 1;
    scoreSelectionRevisionRef.current += 1;
    const actionId = `soundtrack-${++mediaActionSequenceRef.current}`;
    const startedAtMs = performance.now();
    const before = soundtrackDiagnosticSnapshot(soundtrackRef.current?.getSnapshot?.());
    logDiagnosticEvent("media.action.requested", {
      actionId,
      action: "select-library",
      source,
      selection: { kind: selection?.kind ?? "library", id: selection?.id ?? "all" },
      online: navigator.onLine,
      visibility: document.visibilityState,
      before,
    });
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
    logDiagnosticEvent("media.action.completed", {
      actionId,
      action: "select-library",
      source,
      durationMs: roundMetric(performance.now() - startedAtMs),
      playbackConfirmed: soundtrackPlaybackConfirmed(result),
      after: soundtrackDiagnosticSnapshot(result),
    });
    return result;
  }, [logDiagnosticEvent, showControlNotice, soundtrackController]);

  const chooseExperience = useCallback((id, { launch = false } = {}) => {
    const settings = applyExperienceSettings({}, id);
    if (!settings) return;
    setLaunchLucky(false);
    setThemeId(settings.themeId);
    changeAppearance(settings.appearanceMode);
    if (launch) {
      setLaunchExperienceId(id);
      setLaunchMusicId(settings.musicMode);
      setLaunchSoundtrackSelection(normalizeSoundtrackSelection(settings.soundtrackSelection));
      setLaunchLucky(false);
      setLaunchEnvironmentId(settings.environmentId);
      // Silent preparation stays cancellable by the controller's existing request
      // revision. START remains the only launch playback gesture.
      const request = soundtrackController().load({ selection: settings.soundtrackSelection });
      soundtrackWarmupPromiseRef.current = request;
      void request.finally(() => {
        if (soundtrackWarmupPromiseRef.current === request) soundtrackWarmupPromiseRef.current = null;
      });
    } else {
      setEnvironmentId(settings.environmentId);
      setEnvironmentPickerOpen(false);
      void playSoundtrackSelection(settings.soundtrackSelection, "curated-experience");
    }
    preferredSoundtrackSelectionRef.current = settings.soundtrackSelection;
    logDiagnosticEvent("experience.selected", { id, source: launch ? "launch-selector" : "visual-library" });
  }, [changeAppearance, logDiagnosticEvent, playSoundtrackSelection, soundtrackController]);

  const playSoundtrackTrack = useCallback(async (key, source = "music-library") => {
    transportActionQueueRef.current.invalidate();
    musicModeRevisionRef.current += 1;
    scoreSelectionRevisionRef.current += 1;
    const actionId = `soundtrack-${++mediaActionSequenceRef.current}`;
    const startedAtMs = performance.now();
    logDiagnosticEvent("media.action.requested", {
      actionId,
      action: "select-track",
      source,
      requestedKey: key,
      online: navigator.onLine,
      visibility: document.visibilityState,
      before: soundtrackDiagnosticSnapshot(soundtrackRef.current?.getSnapshot?.()),
    });
    if (mutedRef.current) {
      setMuted(false);
      showControlNotice("VOLUME", true);
    }
    audioRef.current?.setMuted(true);
    sessionMusicModeRef.current = "soundtrack";
    setMusicMode("soundtrack");
    const result = await soundtrackController().select(key);
    logDiagnosticEvent("soundtrack.track.played", { key, status: result?.status ?? "unknown" });
    logDiagnosticEvent("media.action.completed", {
      actionId,
      action: "select-track",
      source,
      requestedKey: key,
      durationMs: roundMetric(performance.now() - startedAtMs),
      playbackConfirmed: soundtrackPlaybackConfirmed(result),
      after: soundtrackDiagnosticSnapshot(result),
    });
    return result;
  }, [logDiagnosticEvent, showControlNotice, soundtrackController]);

  const moveTransport = useCallback(async (direction, source = "on-screen-transport", invocation = null) => {
    if (experienceModeRef.current === "engine") {
      setEngineProfileId(current => {
        const profiles = ENGINE_CATALOGUE.map(profile => profile.id);
        return profiles[(profiles.indexOf(current) + (direction === "previous" ? profiles.length - 1 : 1)) % profiles.length];
      });
      logDiagnosticEvent("engine.transport.profile", { direction, source });
      return;
    }
    const actionId = `transport-${++mediaActionSequenceRef.current}`;
    const queuedAtMs = performance.now();
    logDiagnosticEvent("media.action.queued", {
      actionId,
      action: direction === "previous" ? "previous" : "next",
      source,
      ...mediaSessionInvocationDiagnostic(invocation),
    });
    return transportActionQueueRef.current.run(async () => {
      const startedAtMs = performance.now();
      const before = sessionMusicModeRef.current === "soundtrack"
        ? soundtrackDiagnosticSnapshot(soundtrackRef.current?.getSnapshot?.())
        : { status: playRoadPausedRef.current ? "paused" : "playing", currentScore: genreIdRef.current };
      logDiagnosticEvent("media.action.requested", {
        actionId,
        action: direction === "previous" ? "previous" : "next",
        source,
        musicMode: sessionMusicModeRef.current,
        muted: mutedRef.current,
        online: navigator.onLine,
        visibility: document.visibilityState,
        queuedForMs: roundMetric(startedAtMs - queuedAtMs),
        ...mediaSessionInvocationDiagnostic(invocation),
        before,
      });
      if (sessionMusicModeRef.current === "soundtrack") {
        try {
          const result = await soundtrackRef.current?.move(direction);
          logDiagnosticEvent("soundtrack.transport.moved", {
            direction,
            source,
            status: result?.status ?? "unavailable",
            error: result?.error ?? null,
            currentKey: result?.current?.key ?? null,
          });
          logDiagnosticEvent("media.action.completed", {
            actionId,
            action: direction,
            source,
            durationMs: roundMetric(performance.now() - startedAtMs),
            playbackConfirmed: soundtrackPlaybackConfirmed(result),
            currentChanged: before.current?.key !== result?.current?.key,
            after: soundtrackDiagnosticSnapshot(result),
          });
          return result;
        } catch (error) {
          logDiagnosticEvent("media.action.failed", {
            actionId,
            action: direction,
            source,
            durationMs: roundMetric(performance.now() - startedAtMs),
            reason: boundedDiagnosticText(String(error?.message || error || "unknown"), 160),
            after: soundtrackDiagnosticSnapshot(soundtrackRef.current?.getSnapshot?.()),
          });
          return null;
        }
      }
      const scores = readyScoreGenres();
      const currentIndex = Math.max(0, scores.findIndex((entry) => entry.id === genreIdRef.current));
      const offset = direction === "previous" ? -1 : 1;
      const nextIndex = (currentIndex + offset + scores.length) % scores.length;
      const result = await selectScore(scores[nextIndex].id, { preserveQueuedNavigation: true });
      const contextState = audioRef.current?.context?.state ?? "unavailable";
      const observation = playRoadMediaObservation({
        selectionResult: result,
        previousScoreId: before.currentScore,
        audioContextState: contextState,
        paused: playRoadPausedRef.current,
        muted: mutedRef.current,
      });
      if (!result?.ok) {
        logDiagnosticEvent("media.action.failed", {
          actionId,
          action: direction,
          source,
          durationMs: roundMetric(performance.now() - startedAtMs),
          reason: result?.reason ?? "score-selection-failed",
          after: observation.after,
        });
        return result;
      }
      logDiagnosticEvent("media.action.completed", {
        actionId,
        action: direction,
        source,
        durationMs: roundMetric(performance.now() - startedAtMs),
        playbackConfirmed: observation.playbackConfirmed,
        currentChanged: observation.currentChanged,
        after: observation.after,
      });
      return result;
    }, {
      onCancelled: ({ queuedGeneration, currentGeneration }) => {
        logDiagnosticEvent("media.action.cancelled", {
          actionId,
          action: direction === "previous" ? "previous" : "next",
          source,
          reason: "superseded-by-newer-intent",
          queuedGeneration,
          currentGeneration,
          queuedForMs: roundMetric(performance.now() - queuedAtMs),
          ...mediaSessionInvocationDiagnostic(invocation),
        });
        return sessionMusicModeRef.current === "soundtrack"
          ? soundtrackRef.current?.getSnapshot?.() ?? null
          : null;
      },
    });
  }, [logDiagnosticEvent, selectScore]);

  const toggleTransport = useCallback(async (forcePlaying = null, source = "on-screen-transport", invocation = null) => {
    if (experienceModeRef.current === "engine") {
      const play = forcePlaying == null ? mutedRef.current : forcePlaying;
      if (play) await audioRef.current?.resume();
      setMuted(!play);
      geaps.runtimeRef.current?.setEnabled(play);
      logDiagnosticEvent("engine.transport", { action: play ? "play" : "pause", source, ...mediaSessionInvocationDiagnostic(invocation), audioContextState: audioRef.current?.context.state, muted: !play });
      return;
    }

    transportActionQueueRef.current.invalidate();
    const actionId = `transport-${++mediaActionSequenceRef.current}`;
    const startedAtMs = performance.now();
    const soundtrackBefore = soundtrackRef.current?.getSnapshot?.();
    const beforePlaying = sessionMusicModeRef.current === "soundtrack"
      ? soundtrackMediaIsPlaying(soundtrackBefore, { muted: mutedRef.current })
      : audioRef.current?.context?.state === "running" && !playRoadPausedRef.current;
    const shouldPlay = forcePlaying == null ? !beforePlaying : forcePlaying;
    logDiagnosticEvent("media.action.requested", {
      actionId,
      action: shouldPlay ? "play" : "pause",
      source,
      musicMode: sessionMusicModeRef.current,
      muted: mutedRef.current,
      online: navigator.onLine,
      visibility: document.visibilityState,
      ...mediaSessionInvocationDiagnostic(invocation),
      before: sessionMusicModeRef.current === "soundtrack"
        ? soundtrackDiagnosticSnapshot(soundtrackBefore)
        : { status: beforePlaying ? "playing" : "paused", audioContextState: audioRef.current?.context?.state ?? "unavailable" },
    });
    if (sessionMusicModeRef.current === "soundtrack") {
      try {
        let result;
        if (shouldPlay) {
          if (mutedRef.current) setMuted(false);
          result = await soundtrackRef.current?.resume();
        } else {
          result = soundtrackRef.current?.pause();
        }
        logDiagnosticEvent("media.action.completed", {
          actionId,
          action: shouldPlay ? "play" : "pause",
          source,
          durationMs: roundMetric(performance.now() - startedAtMs),
          playbackConfirmed: shouldPlay ? soundtrackPlaybackConfirmed(result) : result?.status === "paused",
          after: soundtrackDiagnosticSnapshot(result),
        });
        return result;
      } catch (error) {
        logDiagnosticEvent("media.action.failed", {
          actionId,
          action: shouldPlay ? "play" : "pause",
          source,
          durationMs: roundMetric(performance.now() - startedAtMs),
          reason: boundedDiagnosticText(String(error?.message || error || "unknown"), 160),
          after: soundtrackDiagnosticSnapshot(soundtrackRef.current?.getSnapshot?.()),
        });
        return null;
      }
    }
    const context = audioRef.current?.context;
    if (!context) {
      logDiagnosticEvent("media.action.failed", {
        actionId,
        action: shouldPlay ? "play" : "pause",
        source,
        reason: "audio-context-unavailable",
      });
      return null;
    }
    if (shouldPlay) {
      if (mutedRef.current) setMuted(false);
      await context.resume();
      setPlayRoadPaused(false);
    } else {
      await context.suspend();
      setPlayRoadPaused(true);
    }
    logDiagnosticEvent("media.action.completed", {
      actionId,
      action: shouldPlay ? "play" : "pause",
      source,
      durationMs: roundMetric(performance.now() - startedAtMs),
      playbackConfirmed: shouldPlay ? context.state === "running" : context.state === "suspended",
      after: { status: shouldPlay ? "playing" : "paused", audioContextState: context.state },
    });
    return context.state;
  }, [logDiagnosticEvent]);

  const currentTrack = useMemo(() => {
    if (experienceMode === "engine") return {
      key: `engine:${geaps.snapshot.profileId || engineProfileId}`,
      title: `Engine / ${(geaps.snapshot.profileId || engineProfileId).replace(/^./, c => c.toUpperCase())}`,
      album: "Telemetry", artist: "sedicivalvole", artwork: null,
    };
    if (musicMode === "soundtrack") {
      const current = soundtrackSnapshot?.current;
      return current ? {
        key: `soundtrack:${current.key}`,
        title: current.title,
        album: current.albumName || (soundtrackSnapshot?.library?.selection?.kind === "featured" ? "Lobo Playlist" : "Jamendo Library"),
        artist: current.artistName,
        artwork: current.imageUrl || null,
      } : null;
    }
    const current = getScoreGenre(genreId);
    return {
      key: `play-road:${current.id}`,
      title: `${displayLabel(current)} ${current.number}`,
      album: "Play the Road",
      artist: "16 Road",
      artwork: current.coverUrl,
    };
  }, [
    experienceMode, engineProfileId, geaps.snapshot.profileId,
    genreId,
    musicMode,
    soundtrackSnapshot?.current?.albumName,
    soundtrackSnapshot?.current?.artistName,
    soundtrackSnapshot?.current?.imageUrl,
    soundtrackSnapshot?.current?.key,
    soundtrackSnapshot?.current?.title,
    soundtrackSnapshot?.library?.selection?.kind,
  ]);
  const currentArtwork = useRecoveringArtwork(currentTrack?.artwork);
  useRecoveringArtwork(phase !== "running" ? soundtrackSnapshot?.current?.imageUrl : null);
  useRecoveringArtwork(soundtrackSnapshot?.previous?.imageUrl);
  useRecoveringArtwork(soundtrackSnapshot?.next?.imageUrl);
  const transportTrack = currentTrack ?? { title: "Preparing Soundtrack", artist: "Loading library", album: "Soundtrack" };
  const transportLabel = musicMode === "soundtrack"
    ? soundtrackSnapshot?.status === "error" ? (muted ? "LOAD FAILED" : "RETRYING")
      : ["idle", "loading", "buffering", "prepared"].includes(soundtrackSnapshot?.status) || !currentTrack ? "LOADING"
        : soundtrackMediaIsPlaying(soundtrackSnapshot) ? "NOW PLAYING" : "PAUSED"
    : playRoadPaused ? "PAUSED" : "NOW PLAYING";
  useEffect(() => {
    if (phase === "running" && currentTrack?.artwork) logDiagnosticEvent("media-session.artwork.state", { key: currentTrack.key, status: currentArtwork.status });
  }, [currentTrack?.key, currentTrack?.artwork, currentArtwork.status, phase, logDiagnosticEvent]);
  const immersiveEnvironment = environment.renderer === "atlas";
  const showNowPlaying = experienceMode === "flux" && phase === "running" && !modalOpen && !immersiveEnvironment && !controlsPinned;

  const transportPlaying = !muted && (experienceMode === "engine" ? geaps.snapshot.playing === true : musicMode === "soundtrack"
    ? soundtrackMediaIsPlaying(soundtrackSnapshot)
    : !playRoadPaused);

  mediaSessionActionsRef.current = { move: moveTransport, toggle: toggleTransport };

  useEffect(() => {
    if (phase !== "running") return undefined;
    const mediaSessionAvailable = "mediaSession" in navigator;
    if (!mediaSessionAvailable) {
      logDiagnosticEvent("media-session.capabilities", {
        mediaSessionAvailable,
        mediaMetadataAvailable: "MediaMetadata" in window,
        actions: {},
      });
      return undefined;
    }
    const runtime = installMediaSessionTransport({
      mediaSession: navigator.mediaSession,
      handlers: {
        play: (invocation) => mediaSessionActionsRef.current.toggle?.(true, "media-session", invocation),
        pause: (invocation) => mediaSessionActionsRef.current.toggle?.(false, "media-session", invocation),
        stop: (invocation) => mediaSessionActionsRef.current.toggle?.(false, "media-session", invocation),
        previoustrack: (invocation) => mediaSessionActionsRef.current.move?.("previous", "media-session", invocation),
        nexttrack: (invocation) => mediaSessionActionsRef.current.move?.("next", "media-session", invocation),
      },
      onInvocation: (invocation) => {
        logDiagnosticEvent("media-session.action.invoked", {
          invocationId: invocation.id,
          invocationSequence: invocation.sequence,
          action: invocation.action,
          invokedAtMs: invocation.invokedAtMs,
          musicMode: sessionMusicModeRef.current,
          muted: mutedRef.current,
          online: navigator.onLine,
          visibility: document.visibilityState,
          before: sessionMusicModeRef.current === "soundtrack"
            ? soundtrackDiagnosticSnapshot(soundtrackRef.current?.getSnapshot?.())
            : {
                status: playRoadPausedRef.current ? "paused" : "playing",
                audioContextState: audioRef.current?.context?.state ?? "unavailable",
              },
        });
      },
      onHandlerError: (action, invocation, error) => {
        logDiagnosticEvent("media-session.action.handler-failed", {
          invocationId: invocation.id,
          invocationSequence: invocation.sequence,
          action,
          reason: boundedDiagnosticText(String(error?.name || error?.message || error || "unknown"), 120),
        });
      },
    });
    logDiagnosticEvent("media-session.actions.registered", {
      actionRegistration: runtime.actionRegistration,
    });
    return () => {
      runtime.cleanup();
      clearMediaSessionPresentation(navigator.mediaSession);
      logDiagnosticEvent("media-session.actions.cleared", {
        actions: Object.keys(runtime.actionRegistration)
          .filter((action) => runtime.actionRegistration[action].registered),
      });
    };
  }, [logDiagnosticEvent, phase]);

  useEffect(() => {
    const mediaSessionAvailable = "mediaSession" in navigator;
    const mediaMetadataAvailable = "MediaMetadata" in window;
    if (!mediaSessionAvailable) return;
    if (phase !== "running" || !currentTrack || !mediaMetadataAvailable) {
      const cleared = clearMediaSessionPresentation(navigator.mediaSession);
      logDiagnosticEvent("media-session.presentation.cleared", {
        reason: phase !== "running"
          ? "experience-not-running"
          : !currentTrack ? "current-track-unavailable" : "metadata-constructor-unavailable",
        ...cleared,
      });
      return;
    }
    const artworkDescriptor = mediaSessionArtwork(currentArtwork.src, {
      baseUrl: window.location.href,
    });
    const artwork = artworkDescriptor ? [artworkDescriptor] : [];
    let metadataPublished = false;
    let playbackStatePublished = false;
    let positionStatePublished = false;
    let positionStateCleared = false;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork,
      });
      metadataPublished = true;
    } catch (error) {
      logDiagnosticEvent("media-session.metadata.failed", {
        key: currentTrack.key,
        reason: boundedDiagnosticText(String(error?.name || error?.message || error || "unknown"), 120),
      });
    }
    try {
      navigator.mediaSession.playbackState = transportPlaying ? "playing" : "paused";
      playbackStatePublished = true;
    } catch (error) {
      logDiagnosticEvent("media-session.playback-state.failed", {
        key: currentTrack.key,
        reason: boundedDiagnosticText(String(error?.name || error?.message || error || "unknown"), 120),
      });
    }
    if (typeof navigator.mediaSession.setPositionState === "function") {
      const positionState = experienceMode === "flux" && musicMode === "soundtrack"
        ? soundtrackMediaPositionState(soundtrackSnapshot)
        : null;
      try {
        if (positionState) {
          navigator.mediaSession.setPositionState(positionState);
          positionStatePublished = true;
        } else {
          navigator.mediaSession.setPositionState();
          positionStateCleared = true;
        }
      } catch (error) {
        logDiagnosticEvent("media-session.position-state.failed", {
          key: currentTrack.key,
          musicMode,
          reason: boundedDiagnosticText(String(error?.name || error?.message || error || "unknown"), 120),
        });
      }
    }
    logDiagnosticEvent("media-session.published", {
      key: currentTrack.key,
      title: boundedDiagnosticText(currentTrack.title, 120),
      artist: boundedDiagnosticText(currentTrack.artist, 120),
      album: boundedDiagnosticText(currentTrack.album, 120),
      hasArtwork: artwork.length > 0,
      artworkType: artwork[0]?.type ?? null,
      artworkSizes: artwork[0]?.sizes ?? null,
      requestedPlaybackState: transportPlaying ? "playing" : "paused",
      metadataPublished,
      playbackStatePublished,
      positionStatePublished,
      positionStateCleared,
      actionRegistration: "stable-session-handlers",
    });
  }, [
    currentTrack,
    currentArtwork.src,
    currentArtwork.revision,
    experienceMode,
    logDiagnosticEvent,
    musicMode,
    phase,
    soundtrackSnapshot?.media?.roles?.current?.currentTimeSeconds,
    soundtrackSnapshot?.media?.roles?.current?.durationSeconds,
    soundtrackSnapshot?.playbackRate,
    transportPlaying,
  ]);


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
        audioDecodedPcmBytes: experienceModeRef.current === "engine" ? geaps.runtimeRef.current?.getState().decodedBytes : audioState?.decodedPcmBytes,
        audioBankBytes: experienceModeRef.current === "engine" ? geaps.runtimeRef.current?.getState().bankBytes : audioState?.bankBytes,
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
      const generatedAtMs = performance.now();
      const snapshot = readConnectionSnapshot(reason);
      const traffic = summarizeNetworkTelemetry(networkTelemetryRef.current, generatedAtMs);
      setNetworkNotice(readNetworkUiNotice(reason, traffic, generatedAtMs));
      if (!diagnosticsActiveRef.current) return;
      recordNetworkOnlineState(networkTelemetryRef.current, {
        online: snapshot.online,
        capturedAtMs: generatedAtMs,
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
      for (const entry of list.getEntries()) {
        recordNetworkResourceEntry(networkTelemetryRef.current, entry);
      }
      const generatedAtMs = performance.now();
      const traffic = summarizeNetworkTelemetry(networkTelemetryRef.current, generatedAtMs);
      setNetworkNotice(readNetworkUiNotice("resource-observed", traffic, generatedAtMs));
    });
    observer.observe({ type: "resource", buffered: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const refresh = () => {
      const generatedAtMs = performance.now();
      const traffic = summarizeNetworkTelemetry(networkTelemetryRef.current, generatedAtMs);
      const notice = readNetworkUiNotice("ui-sample", traffic, generatedAtMs);
      networkQualityHistoryRef.current = appendNetworkQualitySample(
        networkQualityHistoryRef.current,
        notice,
        generatedAtMs,
      );
      setNetworkNotice(notice);
    };
    refresh();
    const timer = window.setInterval(refresh, DRIVE_TRACE_INTERVAL_MS);
    return () => window.clearInterval(timer);
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
      const scoreActive = experienceModeRef.current === "flux" && sessionMusicModeRef.current === "play-road" && !mutedRef.current;
      const audioState = scoreActive ? audioRef.current?.getState() ?? null : null;
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
        bpm: scoreActive ? scoreStateRef.current?.tempo ?? null : null,
        averageFps: frame.averageFps,
        p95FrameMs: frame.p95FrameMs,
        audioLevel: audioLevelRef.current,
        audioPeak: meterState?.peak,
        visualId: experienceModeRef.current === "engine" ? "engine-telemetry" : environmentIdRef.current,
        musicId: experienceModeRef.current === "engine" ? (mutedRef.current ? "mute" : "engine") : diagnosticMusicIdentity({ mode: sessionMusicModeRef.current, muted: mutedRef.current, scoreId: genreIdRef.current }),
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
        engine: experienceModeRef.current === "engine" ? geaps.runtimeRef.current?.getState() ?? null : null,
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

  useEffect(() => { engineMotionRef.current.reset("speed-source-changed"); }, [source]);
  useEffect(() => { audioRef.current?.setSpeed(speed); }, [speed]);
  useEffect(() => {
    if (phase !== "running") return;
    const sample = () => {
      if (sourceRef.current !== "GPS") engineMotionRef.current.observe({ source: "Demo", rawSpeedKmh: speedRef.current,
        receivedMs: performance.now(), driveInput: demoDriveInputRef.current, brakeHeld: brakeHeldRef.current });
    };
    sample(); const timer = window.setInterval(sample, 100);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    audioRef.current?.setMuted(muted || (experienceModeRef.current === "flux" && sessionMusicModeRef.current === "soundtrack"));
  }, [muted]);
  useEffect(() => {
    audioRef.current?.setVehicleEffectsEnabled(vehicleEffectsEnabled);
    soundtrackRef.current?.setVehicleMaster(vehicleEffectsEnabled);
  }, [vehicleEffectsEnabled]);
  useEffect(() => {
    soundtrackRef.current?.setVehicleEffects({
      underwater: audioMacros.values.underwater,
    });
  }, [audioMacros]);
  useEffect(() => {
    soundtrackRef.current?.setManualEffects(soundtrackManualEffects);
    audioRef.current?.setManualEffects(soundtrackManualEffects);
  }, [soundtrackManualEffects]);
  useEffect(() => {
    document.title = experienceMode === "engine" ? "Engine / sedicivalvole" : musicMode === "soundtrack"
      ? soundtrackPageTitle(soundtrackSnapshot)
      : DEFAULT_PAGE_TITLE;
    return () => {
      document.title = DEFAULT_PAGE_TITLE;
    };
  }, [
    experienceMode, musicMode,
    soundtrackSnapshot?.current?.artistName,
    soundtrackSnapshot?.current?.title,
    soundtrackSnapshot?.status,
  ]);
  useEffect(() => {
    if (!soundtrackPanelOpen || musicMode !== "soundtrack") return undefined;
    const rotationWindow = soundtrackSnapshot?.library?.rotationWindow;
    const selection = soundtrackSnapshot?.library?.selection ?? { kind: "library", id: "all" };
    const refreshAtMs = rotationWindow?.endsAtMs;
    if (!Number.isFinite(refreshAtMs)) return undefined;
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
        atlasMapAppearance: normalizeAtlasMapAppearance(atlasMapAppearance),
        musicMode,
        lastLaunchVisualId: launchEnvironmentId,
        launchSoundtrackMode: launchLucky ? "lucky" : "precise",
        soundtrackSelection: {
          kind: preferredSoundtrackSelectionRef.current.kind,
          id: preferredSoundtrackSelectionRef.current.id,
        },
        manualEffects: normalizeManualEffectPreferences(soundtrackManualEffects),
        vehicleEffectsEnabled,
        muted,
      }));
    } catch {
      // Preference persistence is optional.
    }
  }, [
    driveySettings,
    atlasMapAppearance,
    environmentId,
    genreId,
    musicMode,
    muted,
    prtclSettings,
    soundtrackManualEffects,
    soundtrackSnapshot?.library?.selection?.id,
    soundtrackSnapshot?.library?.selection?.kind,
    launchLucky,
    launchEnvironmentId,
    launchSoundtrackSelection,
    themeId,
    vehicleEffectsEnabled,
  ]);

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

  useEffect(() => {
    const epoch = ++lifetimeEpochRef.current;
    return () => queueMicrotask(() => {
      // React Strict Mode immediately retains the same session after its trial
      // cleanup. Dispose only a final unmount, preserving the in-flight warmup.
      if (lifetimeEpochRef.current !== epoch) return;
      diagnosticsActiveRef.current = false;
      window.cancelAnimationFrame(dismissFrameRef.current);
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
      atlasSessionJourneyRef.current = {
        recentSamples: [],
        sessionSamples: [],
        travelPoints: [],
        startedAtMs: null,
        updatedAtMs: null,
      };
      audioRef.current?.destroy();
      soundtrackRef.current?.destroy();
      soundtrackRef.current = null;
    });
  }, [stopDemo]);

  const buildDiagnosticReport = useCallback(() => diagnostics ? {
    schema: "sedicivalvole.tesla-diagnostic.v4",
    generatedAt: new Date().toISOString(),
    app: {
      version: APP_VERSION,
      build: APP_BUILD,
      commit: APP_COMMIT,
      mode: experienceModeRef.current,
      engine: experienceModeRef.current === "engine" ? geaps.runtimeRef.current?.getState() ?? null : null,
      musicMode: experienceModeRef.current === "engine" ? "engine" : sessionMusicModeRef.current,
      rememberedScoreId: genreIdRef.current,
      environment: experienceModeRef.current === "engine" ? "engine-telemetry" : environmentIdRef.current,
      pageUrl: window.location.href,
      source: sourceRef.current,
      displayedSpeedKmh: Math.round(speedRef.current * 10) / 10,
      bpm: experienceModeRef.current === "engine" || bpmRef.current == null ? null : Math.round(bpmRef.current * 10) / 10,
      transportBpm: experienceModeRef.current === "engine" ? null : Math.round(transportBpmRef.current * 10) / 10,
      responseCeilingKmh: ROAD_SPEED_CEILING_KMH,
      paletteTheme: themeIdRef.current,
      appearancePreference: appearanceModeRef.current,
      appearance: appearanceResolutionRef.current.appearance,
      appearanceSource: appearanceResolutionRef.current.source,
      appearanceHoldReason: appearanceResolutionRef.current.holdReason,
      particleType: environmentIdRef.current === "prtcl"
        ? normalizePrtclSettings(prtclSettingsRef.current).type
        : null,
      muted: mutedRef.current,
      vehicleAudioEffectsEnabled: vehicleEffectsEnabledRef.current,
      arrangement: experienceModeRef.current === "flux" && sessionMusicModeRef.current === "play-road" && !mutedRef.current
        ? audioRef.current?.getState() ?? null : null,
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
      soundtrack: sessionMusicModeRef.current === "soundtrack" ? (() => {
        const soundtrack = soundtrackRef.current?.getSnapshot?.();
        return {
          status: soundtrack?.status ?? "unavailable",
          error: soundtrack?.error ?? null,
          currentKey: soundtrack?.current?.key ?? null,
          contextTopology: audioRef.current?.context
            && audioRef.current.context === soundtrackRef.current?.getAudioContext?.()
            ? "shared"
            : "separate-or-unavailable",
          media: soundtrack?.media ?? null,
          effects: soundtrack?.effects ?? null,
        };
      })() : null,
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
    diagnosticDelivery: { mode: diagnosticPreferencesRef.current.mode, automaticEnabled: diagnosticPreferencesRef.current.mode === "dev" && diagnosticPreferencesRef.current.automatic, ...automaticClockRef.current.snapshot() },
    privacy: {
      // These three legacy fields describe the diagnostic payload itself. ATLAS
      // location use is disclosed separately without ever serializing a point.
      coordinatesCollected: false,
      coordinatesStored: false,
      coordinatesTransmitted: false,
      atlasLocationFeatureActive: environmentIdRef.current === "atlas",
      atlasLocationHeldInMemory: Boolean(mapPositionRef.current),
      atlasThirdPartyRequestsActive: environmentIdRef.current === "atlas" && Boolean(mapPositionRef.current),
      terrainElevationFallbackUsesRoundedArea: true,
      terrainElevationFallbackProvider: "Open-Meteo / Copernicus",
      automaticRemoteTelemetry: diagnosticPreferencesRef.current.mode === "dev" && diagnosticPreferencesRef.current.automatic,
      transmissionRequiresExplicitGesture: !(diagnosticPreferencesRef.current.mode === "dev" && diagnosticPreferencesRef.current.automatic),
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

  const sendDiagnostic = useCallback(async (requestedTrigger = "manual") => {
    const trigger = requestedTrigger === "automatic" ? "automatic" : "manual";
    const freshReport = buildDiagnosticReport();
    if (!freshReport || diagnosticTransferRef.current) return { ok: false, retryable: true };
    if (trigger === "automatic" && (diagnosticPreferencesRef.current.mode !== "dev" || !diagnosticPreferencesRef.current.automatic)) return { ok: false, retryable: false };
    const controller = new AbortController();
    diagnosticTransferRef.current = { controller, trigger };
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    const transferId = `diagnostic-${Date.now()}`;
    setSendState("sending");
    setSendErrorCode(null);
    logDiagnosticEvent("diagnostic-send.requested", { trigger });
    const eventReport = createDiagnosticEventReport(diagnosticEventsRef.current);
    try {
      const reportToSend = fitDiagnosticReportForTransport({
        ...freshReport,
        diagnosticDelivery: { ...freshReport.diagnosticDelivery, trigger },
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
        signal: controller.signal,
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        const error = new Error("diagnostic_send_failed");
        error.retryable = response.status === 429 || response.status >= 500;
        error.code = typeof result?.status === "string" ? result.status : "network_error";
        throw error;
      }
      finishAppNetworkTransfer(networkTelemetryRef.current, {
        id: transferId,
        endedAtMs: performance.now(),
        success: true,
      });
      setSendState("sent");
      logDiagnosticEvent("diagnostic-send.accepted", { status: result.status, trigger });
      return { ok: true };
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
      logDiagnosticEvent("diagnostic-send.failed", { code: errorCode, trigger });
      return { ok: false, retryable: error?.retryable !== false };
    } finally {
      window.clearTimeout(timeout);
      if (diagnosticTransferRef.current?.controller === controller) diagnosticTransferRef.current = null;
    }
  }, [buildDiagnosticReport, logDiagnosticEvent]);
  sendDiagnosticRef.current = sendDiagnostic;
  useEffect(() => {
    if (phase !== "running") return;
    const clock = automaticClockRef.current;
    let disposed = false, lastPaint = 0, dueLogged = false;
    const tick = async () => {
      if (disposed) return;
      const now = performance.now();
      const prefs = diagnosticPreferencesRef.current;
      const due = clock.update({ running: true, enabled: prefs.mode === "dev" && prefs.automatic,
        visible: document.visibilityState !== "hidden", online: navigator.onLine !== false,
      }, now);
      const snapshot = clock.snapshot();
      const pending = snapshot.activeMs >= snapshot.intervalActiveMs;
      if (pending && !dueLogged) {
        logDiagnosticEvent("diagnostic-send.due", { trigger: "automatic", timeBasis: snapshot.timeBasis, activeMs: snapshot.activeMs, online: navigator.onLine !== false });
      }
      dueLogged = pending;
      if (due && !diagnosticTransferRef.current) {
        clock.begin(); setAutomaticSnapshot(clock.snapshot());
        const result = await sendDiagnosticRef.current?.("automatic");
        clock.complete(result?.ok === true, performance.now(), result?.retryable !== false);
      }
      if (!disposed && (due || now - lastPaint >= 5000)) { lastPaint = now; setAutomaticSnapshot(clock.snapshot()); }
    };
    void tick();
    const timer = window.setInterval(tick, 1000);
    window.addEventListener("online", tick); document.addEventListener("visibilitychange", tick);
    return () => { disposed = true; window.clearInterval(timer); window.removeEventListener("online", tick); document.removeEventListener("visibilitychange", tick); if (diagnosticTransferRef.current?.trigger === "automatic") diagnosticTransferRef.current.controller.abort(); };
  }, [phase, logDiagnosticEvent]);

  const handleEnvironmentError = useCallback((error) => {
    const message = String(error?.message || "Unknown visual runtime error").slice(0, 500);
    setEnvironmentRuntimeError(message);
    environmentRecoveryRef.current?.fail();
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
    if (phase !== "running" || (experienceMode !== "flux" && !passengerAtlasOpen)) return undefined;
    const recovery = createLoadRecovery({
      now: () => performance.now(),
      schedule: (callback, delay) => window.setTimeout(callback, delay),
      cancel: (timer) => window.clearTimeout(timer),
      canRetry: () => navigator.onLine !== false && document.visibilityState !== "hidden",
      onState: setEnvironmentRecovery,
      retry: (attempt) => {
        logDiagnosticEvent("visual.recovery.retry", { environment: environmentId, attempt });
        setEnvironmentRuntimeError(null);
        setEnvironmentAttempt(value => value + 1);
      },
    });
    environmentRecoveryRef.current = recovery;
    setEnvironmentRecovery("idle");
    const wake = () => recovery.wake();
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      recovery.dispose();
      environmentRecoveryRef.current = null;
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [experienceMode, environmentId, phase, passengerAtlasOpen, logDiagnosticEvent]);

  const hasAtlasPosition = Boolean(mapPosition);
  useEffect(() => {
    if (hasAtlasPosition && gpsState === "live") environmentRecoveryRef.current?.wake();
  }, [hasAtlasPosition, gpsState]);

  useEffect(() => {
    if (environmentRuntimeError) environmentRecoveryRef.current?.fail();
  }, [environmentRuntimeError]);

  useEffect(() => {
    setEnvironmentRuntimeError(null);
    if (isShaderGradientEnvironmentId(environmentId)) {
      lastGradientVariantRef.current = environmentId;
    }
  }, [environmentId]);

  return (
    <><main
      ref={appRef}
      tabIndex={-1}
      inert={phonePortrait ? true : undefined}
      aria-hidden={phonePortrait ? true : undefined}
      data-phone-layout={phoneLayout ?? undefined}
      className={`app phase-${phase} ${controlsAwake || controlsPinned ? "controls-awake" : "controls-resting"}${modalOpen ? " modal-open" : ""}${showNowPlaying ? " has-now-playing" : ""}`}
      style={semanticTheme.css}
      data-moving={speed >= 0.8}
      data-palette={themeId}
      data-appearance={appearanceResolution.appearance}
      data-appearance-mode={appearanceMode}
      data-environment={experienceMode === "engine" ? "engine" : environmentId}
      onPointerDownCapture={holdAppearanceDuringPointer}
      onPointerDown={handleSurfacePointerDown}
      onClickCapture={handleControlActivation}
      onChangeCapture={handleControlChange}
      onKeyDownCapture={(event) => {
        if (event.key === "Tab") wakeControls();
        if (event.key === "Escape" && !controlsPinned) restControls();
      }}
    >
      {phase === "running" ? (
        <EnvironmentErrorBoundary
          key={`${experienceMode}:${environmentId}:${environmentAttempt}`}
          label={environment.label}
          recovery={environmentRecovery}
          onError={handleEnvironmentError}
        >
          {statsOpen || passengerAtlasOpen ? null : experienceMode === "engine" ? (
            <EngineTelemetry state={geaps.snapshot} profileId={engineProfileId} onProfile={chooseEngineProfile} onRev={holdEngineRev} onRelease={releaseEngineRev} speed={speed} onFrame={recordRenderedFrame} />
          ) : environmentRuntimeError ? (
            <FieldFailure label={environment.label} recovery={environmentRecovery} />
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
                sessionJourneyRef={atlasSessionJourneyRef}
                reducedMotion={reducedMotion}
                effect={activeEffect}
                keyboardShortcutsEnabled={!modalOpen}
                demoRequestToken={atlasDemoRequest}
                mapAppearance={atlasMapAppearance}
                appearance={appearanceResolution.appearance}
                onReadPlace={setAtlasPlace}
                onMapAppearanceChange={(value) => setAtlasMapAppearance(normalizeAtlasMapAppearance(value))}
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
          ) : environment.renderer === "shadergradient" ? (
            <Suspense fallback={<div className="atlas-waiting"><strong>{environment.label}</strong><span>Loading gradient field</span></div>}>
              <ShaderGradientField
                studyId={environment.studyId}
                speed={speed}
                audioLevel={audioLevel}
                musicMode={musicMode}
                macroSnapshot={audioMacros}
                theme={theme}
                reducedMotion={reducedMotion}
                effect={activeEffect}
                onRenderer={setRenderer}
                onFrame={recordRenderedFrame}
                onRuntimeError={handleEnvironmentError}
              />
            </Suspense>
          ) : (
            <FluxField
              pressure={aperturePressure}
              speed={speed}
              theme={theme}
              reducedMotion={reducedMotion}
              brake={activeEffect === "UNDERWATER" ? 1 : brakeFlash}
              effect={activeEffect}
              onRenderer={setRenderer}
              onFrame={recordRenderedFrame}
              onRuntimeError={handleEnvironmentError}
            />
          )}
        </EnvironmentErrorBoundary>
      ) : null}
      {phase === "running" && experienceMode === "flux" && environment.renderer === "drivey" ? (
        <DriveyCycleControl
          settings={driveySettings}
          onChange={(value) => setDriveySettings(normalizeDriveySettings(value))}
        />
      ) : null}
      {phase === "running" && experienceMode === "flux" && environment.renderer === "prtcl" ? (
        <PrtclCycleControl
          settings={prtclSettings}
          onChange={(value) => setPrtclSettings(normalizePrtclSettings(value))}
        />
      ) : null}
      {phase === "running" && experienceMode === "flux" && environment.renderer === "shadergradient" ? (
        <ShaderGradientCycleControl
          environment={environment}
          onChange={(nextEnvironmentId) => {
            lastGradientVariantRef.current = nextEnvironmentId;
            setEnvironmentId(nextEnvironmentId);
            logDiagnosticEvent("environment.variant.changed", {
              environment: nextEnvironmentId,
              family: "gradient-08",
            });
          }}
        />
      ) : null}
      {keyboardHint ? <div className="keyboard-hint" role="status">{keyboardHint}</div> : null}

      {phase !== "running" ? (
      <section className="splash" aria-hidden="false" inert={supportOpen ? true : undefined}>
        <button className="intro-diagnostics" type="button" aria-label={`Automatic diagnostics ${diagnosticPreferences.mode === "dev" && diagnosticPreferences.automatic ? "ON. Turn off" : "OFF. Turn on"}`} onClick={() => setDiagnosticPreferences(p => ({ mode: "dev", automatic: !(p.mode === "dev" && p.automatic) }))}>
          <strong>{diagnosticPreferences.mode.toUpperCase()} · AUTO REPORT {diagnosticPreferences.mode === "dev" && diagnosticPreferences.automatic ? "ON" : "OFF"}</strong><small>Coordinate-free · every 15 active min</small>
        </button>
        <small className="intro-build">BUILD {APP_BUILD}</small>
        <SplashSignalGate
          active={phase !== "running"}
          reducedMotion={reducedMotion}
          onFrame={recordRenderedFrame}
        />
        {phase === "idle" || phase === "choosing" ? <LaunchCockpit
          mode={experienceMode} onMode={chooseExperienceMode}
          musicId={launchMusicId} onMusic={(id) => { setLaunchExperienceId(null); selectLaunchMusic(id); }}
          selection={launchSoundtrackSelection} lucky={launchLucky}
          soundtrackArtworkUrl={soundtrackLaunchReady(soundtrackSnapshot, launchSoundtrackSelection) ? soundtrackSnapshot.current?.imageUrl : null}
          onSelection={chooseLaunchSoundtrack}
          onLucky={() => chooseLaunchSoundtrack(luckySoundtrackGenre(launchSoundtrackSelection.id), true)}
          onRandomVisual={() => { setLaunchExperienceId(null); setLaunchEnvironmentId(luckyLaunchVisual(launchEnvironmentId)); }}
          environmentId={launchEnvironmentId} onVisual={(id) => { setLaunchExperienceId(null); setLaunchEnvironmentId(id); }}
          scoreId={genreId} onScore={(id) => { setLaunchExperienceId(null); setGenreId(id); }}
          engineProfileId={engineProfileId} onEngineProfile={chooseEngineProfile}
          experienceId={launchExperienceId} onExperience={(id) => chooseExperience(id, { launch: true })}
          markUrl={`/brand/sedicivalvole-mark-transparent${appearanceResolution.appearance === "dark" ? "-dark" : ""}.svg?build=${APP_BUILD}`}
          build={APP_BUILD} onSupport={() => setSupportOpen(true)} onReset={resetSavedState}
          muted={muted} onUnmute={() => setMuted(false)} Dialog={DialogSurface}
          ready={Boolean(launchMusicId && launchEnvironmentId)}
          pending={launchMusicId === "soundtrack" && !soundtrackLaunchReady(soundtrackSnapshot, launchSoundtrackSelection)}
          onStart={() => runHarness({ musicId: launchMusicId, selectedEnvironmentId: launchEnvironmentId, experienceId: launchExperienceId })}
        /> : <p className="cockpit-starting" role="status">Starting {experienceMode === "engine" ? "Engine" : FLUX_VISUAL_CHOICES.find(entry => entry.id === launchEnvironmentId)?.displayLabel || environment.displayLabel}…</p>}
      </section>
      ) : null}

      <section
        className="experience"
        aria-hidden={phase !== "running" || modalOpen}
        inert={phase !== "running" || modalOpen ? true : undefined}
      >
        <header className={`topbar control-layer${musicMode === "soundtrack" ? " is-soundtrack" : ""}`}>
          <button
            className="topbar-mark"
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open session report"
            aria-haspopup="dialog"
          >
            <img
              src={appearanceResolution.appearance === "light" ? BRAND_MARK_URL : TOPBAR_MARK_URL}
              alt=""
              aria-hidden="true"
            />
          </button>
          <ModeSelector mode={experienceMode} onChange={chooseExperienceMode} />
          <span className="speed-spacer" aria-hidden="true" />
          <NetworkControl
            notice={networkNotice}
            history={networkQualityHistoryRef.current}
            open={networkPopoverOpen}
            onOpenChange={changeNetworkPopoverOpen}
          />
          <AppearanceControl
            mode={appearanceMode}
            effectiveAppearance={appearanceResolution.appearance}
            open={appearanceMenuOpen}
            onOpenChange={changeAppearanceMenuOpen}
            onChange={changeAppearance}
          />
          <button
            className={`gps-state is-${gpsPresentation.tone}`}
            type="button"
            aria-controls="gps-help-popover"
            aria-expanded={gpsHelpOpen}
            aria-label={`GPS ${gpsPresentation.status}, accuracy ${gpsPresentation.accuracy}`}
            onClick={toggleGpsHelp}
          >
            <RailIcon name="navigation" />
            <span className="visually-hidden">GPS</span>
            <small className="visually-hidden">{gpsPresentation.accuracy}</small>
          </button>
          <button
            className="discover-button"
            type="button"
            onClick={() => setDiscoverOpen(true)}
            aria-label="Open Discover passenger index"
            aria-haspopup="dialog"
          >
            <RailIcon name="map-search" />
          </button>
          <button
            className="report-button"
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open session report"
            aria-haspopup="dialog"
          >
            <RailIcon name="report-analytics" />
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

        <button className={`source-readout${musicMode === "soundtrack" ? " is-soundtrack" : ""}`} type="button" onClick={toggleSource} aria-label={`Speed source ${source}. Tap to switch`}>
          <div className="readout-group">
            <strong>{Math.round(speed)}</strong>
            <span className="readout-unit">km/h</span>
          </div>
          <div className={`effect-badge${experienceMode === "flux" && activeEffect ? " is-active" : ""}`} aria-hidden={experienceMode !== "flux" || !activeEffect}>{experienceMode === "flux" ? activeEffect || "UNDERWATER" : ""}</div>
        </button>

        {controlNotice ? (
          <div className="control-status-notice" role="status" aria-live="polite" aria-atomic="true">
            {controlNotice}
          </div>
        ) : null}

        {experienceMode === "flux" && manualEffectsDeckOpen ? (
          <ManualEffectsDeck
            values={soundtrackManualEffects}
            onChange={updateManualEffect}
            onClose={() => setManualEffectsDeckOpen(false)}
          />
        ) : null}

        <div className="footer-stack control-layer" inert={!(controlsAwake || controlsPinned) ? true : undefined}>
      {showNowPlaying ? (
        <div className="now-playing-dock persistent-transport" aria-label="Now playing and music transport">
          <div className="now-playing-summary" role="status" aria-live="polite" aria-atomic="true">
            {currentArtwork.src ? <img src={currentArtwork.src} alt="" width="72" height="72" /> : <span className="now-playing-artwork" aria-hidden="true">16</span>}
            <span className="now-playing-copy">
              <small>{transportLabel}</small>
              <strong>{transportTrack.title}</strong>
              <em>{transportTrack.artist} · {transportTrack.album}</em>
            </span>
          </div>
          <div className="now-playing-transport" aria-label="Music transport">
            <button type="button" disabled={musicMode === "soundtrack" && !soundtrackSnapshot?.hasPrevious} onClick={() => void moveTransport("previous", "persistent-transport")} aria-label="Previous track"><MediaGlyph name="previous" /></button>
            <button type="button" disabled={musicMode === "soundtrack" && !currentTrack} onClick={() => void toggleTransport(null, "persistent-transport")} aria-label={transportPlaying ? "Pause" : "Play"}><MediaGlyph name={transportPlaying ? "pause" : "play"} /></button>
            <button type="button" disabled={musicMode === "soundtrack" && !soundtrackSnapshot?.hasNext} onClick={() => void moveTransport("next", "persistent-transport")} aria-label="Next track"><MediaGlyph name="next" /></button>
          </div>
        </div>
      ) : null}

        <footer className={`control-slab${experienceMode === "flux" && musicMode === "soundtrack" ? " is-soundtrack" : ""}`} aria-label={`${experienceMode === "engine" ? "Engine" : "Music"} performance controls`}>
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
          {experienceMode === "flux" ? <button
            className={`effects-button${vehicleEffectsEnabled ? " is-active" : ""}`}
            type="button"
            aria-pressed={vehicleEffectsEnabled}
            aria-label={`${vehicleEffectsEnabled ? "Disable" : "Enable"} vehicle-reactive audio effects`}
            title="Braking UNDERWATER audio processing"
            onClick={() => updateVehicleEffects(!vehicleEffectsEnabled)}
          >
            <span>FX</span>
            <strong>{vehicleEffectsEnabled ? "ON" : "OFF"}</strong>
          </button> : null}
          {experienceMode === "engine" ? <><button type="button" className="engine-return-flux" onClick={() => { chooseExperienceMode("flux"); setEnvironmentPickerOpen(true); }}><span>MUSIC</span><strong>Visuals</strong></button><button type="button" className="engine-return-flux" onClick={() => { chooseExperienceMode("flux"); setSoundtrackPanelOpen(true); }}><span>MUSIC</span><strong>Music</strong></button></> : <><VisualControl environment={environment} onOpen={() => {
            if (experienceMode === "engine") chooseExperienceMode("flux");
            setEnvironmentPickerOpen(true);
          }} />
          <MusicControl
            genreId={genreId}
            selection={scoreSelection}
            musicMode={musicMode}
            soundtrackSnapshot={soundtrackSnapshot}
            onOpen={() => { if (experienceMode === "engine") chooseExperienceMode("flux"); setSoundtrackPanelOpen(true); }}
          /></>}
          {experienceMode === "flux" ? <button
            className={`mix-button${manualEffectsDeckOpen ? " is-open" : ""}${SOUNDTRACK_MANUAL_CONTROLS.some(({ id }) => soundtrackManualEffects[id] > 0.01) ? " is-active" : ""}`}
            type="button"
            aria-label="Open Performance FX"
            aria-expanded={manualEffectsDeckOpen}
            aria-controls="manual-effects-deck"
            onClick={() => setManualEffectsDeckOpen((open) => !open)}
          >
            <span>FX</span>
            <strong aria-hidden="true">↑</strong>
            <small>{SOUNDTRACK_MANUAL_CONTROLS.filter(({ id }) => soundtrackManualEffects[id] > 0.01).length}/8 ACTIVE</small>
          </button> : null}
          <PaletteControl themeId={themeId} onChange={setThemeId} open={paletteMenuOpen} onOpenChange={setPaletteMenuOpen} />
        </footer>
        </div>
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
          inert={supportOpen ? true : undefined}
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
                <SupportButton onClick={() => setSupportOpen(true)} />
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

            <section className="diagnostic-auto-controls" aria-label="Diagnostic delivery settings">
              <div><button type="button" aria-pressed={diagnosticPreferences.mode === "standard"} onClick={() => setDiagnosticPreferences(p => ({ ...p, mode: "standard" }))}>Standard</button>
              <button type="button" aria-pressed={diagnosticPreferences.mode === "dev"} onClick={() => setDiagnosticPreferences(p => ({ ...p, mode: "dev" }))}>Dev</button>
              <button type="button" disabled={diagnosticPreferences.mode !== "dev"} aria-pressed={diagnosticPreferences.automatic && diagnosticPreferences.mode === "dev"} onClick={() => setDiagnosticPreferences(p => ({ ...p, automatic: !p.automatic }))}>AUTO SEND {diagnosticPreferences.automatic && diagnosticPreferences.mode === "dev" ? "ON" : "OFF"}</button></div>
              <p>Dev sends coordinate-free reports to the project mailbox every 15 minutes of active session time. Stops, GPS loss and offline time count while the app stays active. Offline reports wait for reconnection. OFF stops future automatic sends. Standard keeps manual reports.</p>
              <small>{Math.floor(automaticSnapshot.activeMs / 60000)} / 15 active min · {automaticSnapshot.accepted} accepted · {automaticSnapshot.status.toUpperCase()} · hidden gaps excluded</small>
            </section>
            <button className="stats-report-entry" onClick={() => { setDrawerOpen(false); setStatsOpen(true); }}>Open Stats for Nerds · journey, motion and network</button>
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
                    <small>{muted ? "output muted" : `level ${Math.round(audioLevel * 100)}%`}</small>
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
                      <InstrumentMetric label="MOTION STATE" value={scoreStateRef.current?.decelerationState ?? "cruise"} detail={`${Math.round(speed)} km/h · ${demoDriveInputRef.current}`} />
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
                    Coordinate-free technical reports go to the project diagnostic mailbox. Dev with AUTO ON sends every 15 minutes of active session time; Standard and AUTO OFF require SEND DIAGNOSTIC.
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
                    <button type="button" onClick={resetSavedState}>RESET SAVED STATE</button>
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
          onExperience={chooseExperience}
          experienceId={matchingExperience({ environmentId, themeId, appearanceMode, musicMode,
            soundtrackSelection: soundtrackSnapshot?.library?.selection })?.id}
          environmentId={environmentId}
          onChange={(nextEnvironmentId) => {
            setEnvironmentId(nextEnvironmentId);
            logDiagnosticEvent("environment.changed", { environment: nextEnvironmentId });
          }}
          onOpenStats={() => setStatsOpen(true)}
          onOpenDiscover={() => {
            setDiscoverOpen(true);
            logDiagnosticEvent("discover.opened", { source: "visual-library" });
          }}
          onSelectGradient={() => {
            const nextEnvironmentId = lastGradientVariantRef.current;
            setEnvironmentId(nextEnvironmentId);
            logDiagnosticEvent("environment.changed", {
              environment: nextEnvironmentId,
              family: "gradient-08",
            });
          }}
          onClose={() => setEnvironmentPickerOpen(false)}
        />
      ) : null}

      {statsOpen ? <DialogSurface className="stats-dialog" labelledBy="stats-title" onClose={() => setStatsOpen(false)}>
        <Suspense fallback={<p>Loading session statistics…</p>}><StatsPanel journeyRef={atlasSessionJourneyRef} networkHistoryRef={networkQualityHistoryRef}
          readSystem={readStatsSystem} onClose={() => setStatsOpen(false)} /></Suspense>
      </DialogSurface> : null}
      {atlasPlace ? <DialogSurface className="atlas-article-dialog" labelledBy="atlas-article-title" onClose={() => setAtlasPlace(null)}>
        <header className="stats-heading"><div><small>DISCOVER · WIKIPEDIA</small><h2 id="atlas-article-title">{atlasPlace.title}</h2></div><button data-dialog-initial-focus onClick={() => setAtlasPlace(null)}>Back to Atlas</button></header>
        <iframe className="discover-article-frame" title={`${atlasPlace.title} — complete Wikipedia article`} sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerPolicy="origin" src={discoverWikipediaArticleUrl(atlasPlace.title, {language:atlasPlace.language})} />
      </DialogSurface> : null}

      {passengerAtlasOpen && !statsOpen ? <DialogSurface className="passenger-atlas-dialog" inert={Boolean(atlasPlace)} labelledBy="passenger-atlas-title" onClose={() => setPassengerAtlasOpen(false)}>
        <h2 id="passenger-atlas-title" className="visually-hidden">Atlas passenger map</h2><button className="passenger-atlas-close" data-dialog-initial-focus onClick={() => setPassengerAtlasOpen(false)}>Back to Engine</button>
        <Suspense fallback={<p>Loading Atlas…</p>}><AtlasField key={environmentAttempt} speed={speed} theme={theme} position={mapPosition} positionSamplesRef={atlasPositionSamplesRef} sessionJourneyRef={atlasSessionJourneyRef} reducedMotion={reducedMotion} effect={null} demoRequestToken={atlasDemoRequest} mapAppearance={atlasMapAppearance} appearance={appearanceResolution.appearance} onMapAppearanceChange={setAtlasMapAppearance} onReadPlace={setAtlasPlace} onRenderer={setRenderer} onFrame={recordRenderedFrame} onRuntimeError={handleEnvironmentError} /></Suspense>
      </DialogSurface> : null}
      {discoverOpen ? (
        <DiscoverPanel
          position={mapPosition ?? (atlasDemoActive ? ATLAS_DEMO_POSITION : null)}
          onRetryLocation={startGps}
          onDemoLocation={runAtlasDemo}
          onClose={() => setDiscoverOpen(false)}
        />
      ) : null}

      {soundtrackPanelOpen ? (
        <MusicLibraryPanel
          musicMode={musicMode}
          loadingMode={musicModeLoading}
          genreId={genreId}
          snapshot={soundtrackSnapshot}
          retrying={!muted && soundtrackSnapshot?.status === "error"}
          jamendoPreviewEntries={jamendoPreviewEntries}
          onModeChange={switchMusicMode}
          onScoreChange={selectScore}
          onFeatured={() => void playSoundtrackSelection({ kind: "featured", id: "signal-border" })}
          onBrowseSelection={(selection) => void playSoundtrackSelection(selection)}
          onTrack={(key) => void playSoundtrackTrack(key)}
          onPrevious={() => void moveTransport("previous", "music-library")}
          onPlayPause={() => void toggleTransport(null, "music-library")}
          onNext={() => void moveTransport("next", "music-library")}
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

    </main><PhoneRotationNotice active={phonePortrait} /></>
  );
}
