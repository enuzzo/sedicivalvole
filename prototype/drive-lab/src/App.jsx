import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyKeyboardDelta,
  clamp,
  normalizeGpsSpeed,
  smoothSpeed,
  speedToBpm,
  speedToEnergy,
} from "./signal-model.js";
import { createAudioEngine } from "./audio-engine.js";
import {
  appendViewportHistory,
  createGpsTelemetry,
  inferViewportMode,
  recordGpsSample,
  summarizeGpsTelemetry,
} from "./diagnostics-model.js";

const APP_VERSION = __APP_VERSION__;

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
    visualScale: visual ? visual.scale : null,
    visualOffsetLeft: visual ? visual.offsetLeft : null,
    visualOffsetTop: visual ? visual.offsetTop : null,
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
  return {
    ...snapshot,
    mode: inferViewportMode(snapshot),
  };
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

function canUseKeyboardTarget(target) {
  if (!(target instanceof HTMLElement)) return true;
  return !target.closest("input, textarea, select, button, [contenteditable='true'], [role='slider']");
}

function FieldCanvas({ speed, hue, reducedMotion, brakeFlash, onRenderer }) {
  const canvasRef = useRef(null);
  const valuesRef = useRef({ speed, hue, brakeFlash });
  valuesRef.current = { speed, hue, brakeFlash };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "high-performance" });
    if (!gl) {
      onRenderer("CSS fallback");
      return undefined;
    }

    const vertexSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_uv;
      void main() { v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }
    `;
    const fragmentSource = `#version 300 es
      precision highp float;
      uniform sampler2D u_texture;
      uniform float u_time;
      uniform float u_energy;
      uniform float u_hue;
      uniform float u_flash;
      in vec2 v_uv;
      out vec4 outColor;
      vec3 hueShift(vec3 color, float angle) {
        const mat3 toYiq = mat3(0.299,0.587,0.114, 0.596,-0.275,-0.321, 0.212,-0.523,0.311);
        const mat3 toRgb = mat3(1.0,0.956,0.621, 1.0,-0.272,-0.647, 1.0,-1.106,1.703);
        vec3 yiq = toYiq * color;
        float originalHue = atan(yiq.z, yiq.y);
        float chroma = length(yiq.yz);
        float shifted = originalHue + angle;
        return clamp(toRgb * vec3(yiq.x, chroma*cos(shifted), chroma*sin(shifted)), 0.0, 1.0);
      }
      void main() {
        vec2 uv = v_uv;
        vec2 center = vec2(0.665, 0.515);
        vec2 ray = uv - center;
        float radius = length(ray);
        float motion = u_time * (0.035 + u_energy * 0.22);
        float ripple = sin(radius * 31.0 - motion * 6.0) * (0.0015 + u_energy * 0.004);
        uv = center + ray * (1.0 + ripple + sin(motion * 0.8) * 0.002);
        uv.x += sin(uv.y * 18.0 + motion * 1.3) * 0.0018 * u_energy;
        float split = 0.0014 + u_energy * 0.0022;
        vec3 color;
        color.r = texture(u_texture, uv + normalize(ray + 0.0001) * split).r;
        color.g = texture(u_texture, uv).g;
        color.b = texture(u_texture, uv - normalize(ray + 0.0001) * split).b;
        color = hueShift(color, (u_hue - 0.5) * 1.45);
        float axis = exp(-abs(uv.y - 0.515) * 26.0) * (0.04 + u_energy * 0.11);
        float vignette = smoothstep(0.95, 0.22, length((v_uv - 0.5) * vec2(0.84, 1.0)));
        color = color * (0.72 + vignette * 0.38) + axis + u_flash * vec3(0.08,0.035,0.11);
        outColor = vec4(color, 1.0);
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };

    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch {
      onRenderer("CSS fallback");
      return undefined;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const image = new Image();
    image.src = `${import.meta.env.BASE_URL}assets/luminous-axis.png`;
    let ready = false;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      ready = true;
      onRenderer("WebGL2");
    };
    image.onerror = () => onRenderer("CSS fallback");

    const uniforms = {
      time: gl.getUniformLocation(program, "u_time"),
      energy: gl.getUniformLocation(program, "u_energy"),
      hue: gl.getUniformLocation(program, "u_hue"),
      flash: gl.getUniformLocation(program, "u_flash"),
    };
    let frame = 0;
    let stopped = false;
    const startedAt = performance.now();
    const render = (now) => {
      if (stopped) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      if (ready) {
        gl.useProgram(program);
        gl.uniform1f(uniforms.time, reducedMotion ? 0 : (now - startedAt) / 1000);
        gl.uniform1f(uniforms.energy, reducedMotion ? 0.08 : speedToEnergy(valuesRef.current.speed));
        gl.uniform1f(uniforms.hue, valuesRef.current.hue);
        gl.uniform1f(uniforms.flash, valuesRef.current.brakeFlash);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [reducedMotion, onRenderer]);

  return <canvas className="field-canvas" ref={canvasRef} aria-hidden="true" />;
}

function RangeControl({ label, value, onChange, accent }) {
  return (
    <label className="range-control">
      <span>{label}</span>
      <input aria-label={label} type="range" min="0" max="100" value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        style={{ "--value": `${value * 100}%`, "--accent": accent }} />
    </label>
  );
}

export function App() {
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
  const [mix, setMix] = useState({ atmosphere: 0.66, harmonics: 0.48, pulse: 0.52, hue: 0.58 });
  const [pulseFlash, setPulseFlash] = useState(0);
  const [keyboardHint, setKeyboardHint] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const reducedMotion = useMemo(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false, []);
  const audioRef = useRef(null);
  const watchRef = useRef(null);
  const wakeTimerRef = useRef(null);
  const smoothedSpeedRef = useRef(0);
  const demoTimerRef = useRef(null);
  const brakeCooldownRef = useRef(0);
  const keyboardHintTimerRef = useRef(null);
  const keyboardLeaseTimerRef = useRef(null);
  const sourceRef = useRef("GPS");
  const audioMeterTimerRef = useRef(null);
  const viewportCaptureTimerRef = useRef(null);
  const gpsTelemetryRef = useRef(createGpsTelemetry(performance.now()));
  const diagnosticEventsRef = useRef([]);
  const sessionStartedAtRef = useRef(performance.now());

  const logDiagnosticEvent = useCallback((type, detail = {}) => {
    diagnosticEventsRef.current = [...diagnosticEventsRef.current, {
      at: new Date().toISOString(),
      elapsedMs: Math.round((performance.now() - sessionStartedAtRef.current) * 10) / 10,
      type,
      detail,
    }].slice(-120);
  }, []);

  const wakeControls = useCallback(() => {
    setControlsAwake(true);
    window.clearTimeout(wakeTimerRef.current);
    wakeTimerRef.current = window.setTimeout(() => setControlsAwake(false), 3600);
  }, []);

  const triggerPulse = useCallback(() => {
    setPulseFlash(1);
    window.setTimeout(() => setPulseFlash(0), 150);
  }, []);

  const triggerBrake = useCallback(() => {
    const now = performance.now();
    if (now - brakeCooldownRef.current < 900) return;
    brakeCooldownRef.current = now;
    logDiagnosticEvent("brake.triggered", { source: sourceRef.current });
    audioRef.current?.brake();
    setBrakeFlash(1);
    window.setTimeout(() => setBrakeFlash(0), 520);
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
        const previous = smoothedSpeedRef.current;
        const next = smoothSpeed(previous, kmh);
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
    wakeControls();
    if (source === "GPS") {
      logDiagnosticEvent("speed-source.changed", { source: "DEMO" });
      sourceRef.current = "DEMO";
      setSource("DEMO");
      stopDemo();
      let direction = 1;
      demoTimerRef.current = window.setInterval(() => {
        setSpeed((previous) => {
          let next = previous + direction * 2.4;
          if (next >= 128) direction = -1;
          if (next <= 18) direction = 1;
          return clamp(next, 0, 130);
        });
      }, 180);
    } else {
      logDiagnosticEvent("speed-source.changed", { source: "GPS" });
      stopDemo();
      sourceRef.current = "GPS";
      setSource("GPS");
      setSpeed(smoothedSpeedRef.current);
    }
  }, [logDiagnosticEvent, source, stopDemo, wakeControls]);

  const runHarness = useCallback(async () => {
    sessionStartedAtRef.current = performance.now();
    diagnosticEventsRef.current = [];
    logDiagnosticEvent("harness.started");
    setPhase("testing");
    wakeControls();
    const graphics = readGraphicsCapabilities();
    let storage = false;
    try {
      const key = "__sv_probe__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      storage = true;
    } catch { storage = false; }

    audioRef.current = createAudioEngine(triggerPulse);
    if (audioRef.current) {
      await audioRef.current.resume();
      audioRef.current.setMuted(false);
      audioRef.current.setMix(mix);
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
    window.setTimeout(() => {
      setPhase("running");
      wakeControls();
    }, reducedMotion ? 260 : 900);
  }, [logDiagnosticEvent, mix, reducedMotion, startGps, triggerPulse, wakeControls]);

  useEffect(() => { audioRef.current?.setSpeed(speed); }, [speed]);
  useEffect(() => { audioRef.current?.setMix(mix); }, [mix]);
  useEffect(() => { audioRef.current?.setMuted(muted); }, [muted]);

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
    window.clearTimeout(wakeTimerRef.current);
    window.clearTimeout(keyboardHintTimerRef.current);
    window.clearTimeout(keyboardLeaseTimerRef.current);
    window.clearInterval(audioMeterTimerRef.current);
    window.clearTimeout(viewportCaptureTimerRef.current);
    stopDemo();
    if (watchRef.current != null) navigator.geolocation?.clearWatch(watchRef.current);
    audioRef.current?.destroy();
  }, [stopDemo]);

  const energy = speedToEnergy(speed);
  const bpm = speedToBpm(speed);
  const diagnosticReport = useMemo(() => diagnostics ? {
    schema: "sedicivalvole.tesla-diagnostic.v2",
    generatedAt: new Date().toISOString(),
    app: {
      version: APP_VERSION,
      pageUrl: window.location.href,
      source,
      displayedSpeedKmh: Math.round(speed * 10) / 10,
      bpm: Math.round(bpm * 10) / 10,
      energy: Math.round(energy * 1000) / 1000,
      muted,
      mix,
    },
    display: diagnostics.display,
    viewportHistory: diagnostics.viewportHistory,
    graphics: {
      ...diagnostics.graphics,
      activeRenderer: renderer,
    },
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
    environment: diagnostics.environment,
    events: diagnosticEventsRef.current,
    privacy: {
      coordinatesCollected: false,
      coordinatesStored: false,
      coordinatesTransmitted: false,
    },
  } : null, [accuracy, audioLevel, bpm, diagnostics, energy, gpsState, mix, muted, renderer, source, speed]);
  const diagnosticText = diagnosticReport
    ? JSON.stringify(diagnosticReport, null, 2)
    : "Test not run yet";

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
    <main className={`app phase-${phase} ${controlsAwake || drawerOpen ? "controls-awake" : "controls-resting"}`}
      onPointerDown={wakeControls} onPointerMove={wakeControls}>
      <div className="fallback-field" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/luminous-axis.png)` }} aria-hidden="true" />
      <FieldCanvas speed={speed} hue={mix.hue} reducedMotion={reducedMotion} brakeFlash={brakeFlash} onRenderer={setRenderer} />
      <div className="field-shade" aria-hidden="true" />
      <div className="pulse-flare" style={{ opacity: pulseFlash * (0.08 + energy * 0.15) }} aria-hidden="true" />
      {keyboardHint && <div className="keyboard-hint" role="status">{keyboardHint}</div>}

      <section className="splash" aria-hidden={phase === "running"}>
        <div className="splash-mark"><span>sedicivalvole</span><small>drive lab · {APP_VERSION}</small></div>
        <div className="splash-action">
          <p>One gesture. Then listen to the road.</p>
          <button className="launch-button" type="button" onClick={runHarness} disabled={phase === "testing"}>
            <span className="launch-icon">{phase === "testing" ? "···" : "→"}</span>
            <span>{phase === "testing" ? "TESTING" : "TEST & START"}</span>
          </button>
          <small>Audio, display, motion, and GPS are checked locally.</small>
        </div>
      </section>

      <section className="experience" aria-hidden={phase !== "running"}>
        <header className="topbar">
          <button className="wordmark" type="button" onClick={() => setDrawerOpen(true)} aria-label="Open diagnostic report">
            <span>sedicivalvole</span><small>DRIVE LAB</small>
          </button>
          <div className="topbar-actions">
            <button className="diag-button" type="button" onClick={() => setDrawerOpen(true)} aria-label="Open device diagnostics">
              <span>i</span><small>DIAG</small>
            </button>
            <button className="source-pill" type="button" onClick={toggleSource} aria-label={`Speed source ${source}. Tap to switch`}>
              <span className={`status-dot ${gpsState === "live" || source === "DEMO" ? "is-live" : ""}`} />
              <span><strong>{source}</strong><small>{source === "DEMO" ? "AUTO · TAP FOR GPS" : gpsState}</small></span>
              <b>{Math.round(speed)}<em>km/h</em></b>
            </button>
          </div>
        </header>

        <div className="axis-readout" aria-hidden="true">
          <span style={{ transform: `scaleX(${0.45 + energy * 0.55})` }} />
          <small>{Math.round(bpm)} BPM · ENERGY {Math.round(energy * 100)}</small>
        </div>

        <footer className="control-dock control-layer" aria-label="Audio and visual controls">
          <button className={`stop-button ${muted ? "is-muted" : ""}`} type="button"
            onClick={async () => {
              if (muted) await audioRef.current?.resume();
              setMuted((value) => !value);
            }} aria-pressed={muted}>
            <span>{muted ? "▶" : "■"}</span><small>{muted ? "RESUME" : "STOP"}</small>
          </button>
          <div className="mix-controls">
            <RangeControl label="ATMOS" value={mix.atmosphere} accent="#8d70ff" onChange={(value) => setMix((current) => ({ ...current, atmosphere: value }))} />
            <RangeControl label="HARMONICS" value={mix.harmonics} accent="#dc66ff" onChange={(value) => setMix((current) => ({ ...current, harmonics: value }))} />
            <RangeControl label="PULSE" value={mix.pulse} accent="#ff8fc9" onChange={(value) => setMix((current) => ({ ...current, pulse: value }))} />
            <RangeControl label="HUE" value={mix.hue} accent="#67b8ff" onChange={(value) => setMix((current) => ({ ...current, hue: value }))} />
          </div>
          <button className="brake-button" type="button" onClick={triggerBrake}><span>↙</span><small>BRAKE</small></button>
          <button className="info-button" type="button" onClick={() => setDrawerOpen(true)} aria-label="Show test report">i</button>
        </footer>
      </section>

      {drawerOpen && (
        <section className="diagnostic-drawer" role="dialog" aria-modal="true" aria-labelledby="diagnostic-title">
          <button className="drawer-backdrop" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close" />
          <div className="drawer-panel">
            <div className="drawer-heading">
              <div><small>TESLA CAPABILITY HARNESS</small><h2 id="diagnostic-title">Device report</h2></div>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close report">×</button>
            </div>
            <div className="diagnostic-grid">
              <article><small>VIEWPORT</small><strong>{diagnostics ? `${diagnostics.display.innerWidth} × ${diagnostics.display.innerHeight}` : "—"}</strong><span>{diagnostics ? `${diagnostics.display.mode} · DPR ${diagnostics.display.dpr}` : "—"}</span></article>
              <article><small>RENDERER</small><strong>{renderer}</strong><span>{reducedMotion ? "reduced motion" : "motion active"}</span></article>
              <article><small>WEB AUDIO</small><strong>{diagnostics?.audio.state || "—"}</strong><span>{muted ? "muted" : `signal ${Math.round(audioLevel * 100)}%`}</span></article>
              <article><small>GPS SPEED</small><strong>{gpsState}</strong><span>{accuracy == null ? "accuracy unavailable" : `accuracy ±${accuracy} m`}</span></article>
            </div>
            <p className="privacy-note">No coordinates are displayed, stored, or transmitted. The report contains only technical capabilities and speed-field status.</p>
            <pre>{diagnosticText}</pre>
            <div className="drawer-actions">
              <button className="send-diagnostic-button" type="button" onClick={sendDiagnostic} disabled={sendState === "sending"}>
                {sendState === "sending" ? "SENDING…" : sendState === "sent" ? "SENT ✓" : "SEND DIAGNOSTIC"}
              </button>
              <button type="button" onClick={() => navigator.clipboard?.writeText(diagnosticText)}>COPY REPORT</button>
              <button type="button" onClick={toggleSource}>{source === "GPS" ? "TRY DEMO MODE" : "RETURN TO GPS"}</button>
            </div>
            <p className={`send-state send-state-${sendState}`} role="status" aria-live="polite">
              {sendState === "sent" && "Accepted by the server mail transport. Inbox delivery still needs confirmation."}
              {sendState === "error" && "The report could not be sent. No diagnostic data was stored by the app."}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
