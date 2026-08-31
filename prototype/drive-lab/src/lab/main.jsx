import { StrictMode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createAudioEngine } from "../audio-engine.js";
import { PrtclField } from "../environments/prtcl/prtcl-field.jsx";
import { PRTCL_TYPES } from "../environments/prtcl/prtcl-model.js";
import { getFluxTheme } from "../flux-themes.js";
import { advanceDemoMotion } from "../signal-model.js";
import { createSoundtrackPreviewController } from "../soundtrack/preview-controller.js";
import { createSoundtrackEffectsController } from "../soundtrack/effects-controller.js";
import { applyParamMessage, createCommandMessage, createParamMessage } from "../control-protocol.js";
import {
  DEFAULT_LAB_VALUES,
  LAB_CLIENT_ID,
  LAB_GROUPS,
  LAB_PARAMETER_MANIFEST,
  createLabPreset,
  importLabPreset,
} from "./lab-model.js";
import "./styles.css";

const APP = Object.freeze({
  version: typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev",
  build: typeof __APP_BUILD__ !== "undefined" ? __APP_BUILD__ : "local",
  commit: typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "dev",
});

const boot = window.__SEDICIVALVOLE_LAB_BOOT__ ?? Object.freeze({
  authenticated: false,
  csrfToken: "",
  sendPath: "/lab/send.php",
  logoutPath: "/lab/?logout=1",
});

const CONTROL_DEFINITIONS = Object.freeze({
  form: Object.freeze([
    Object.freeze({ id: "form.scale", label: "Scale", min: 0.5, max: 1.8, step: 0.01 }),
    Object.freeze({ id: "form.depth", label: "Depth", min: 0.5, max: 1.8, step: 0.01 }),
    Object.freeze({ id: "form.flow", label: "Flow", min: 0, max: 2, step: 0.01 }),
  ]),
  response: Object.freeze([
    Object.freeze({ id: "response.attackMs", label: "Attack", min: 0, max: 2000, step: 10, unit: "ms" }),
    Object.freeze({ id: "response.releaseMs", label: "Release", min: 0, max: 3000, step: 10, unit: "ms" }),
  ]),
  scene: Object.freeze([
    Object.freeze({ id: "scene.particleSize", label: "Particle size", min: 0.5, max: 2.5, step: 0.01 }),
    Object.freeze({ id: "scene.rainDensity", label: "Rain density", min: 0.1, max: 1, step: 0.01 }),
    Object.freeze({ id: "scene.drift", label: "Drift", min: 0, max: 2, step: 0.01 }),
    Object.freeze({ id: "scene.cameraDepth", label: "Camera depth", min: 0.7, max: 1.6, step: 0.01 }),
  ]),
});

const MACROS = Object.freeze([
  Object.freeze({ id: "macros.open", label: "OPEN" }),
  Object.freeze({ id: "macros.underwater", label: "UNDERWATER" }),
  Object.freeze({ id: "macros.bloom", label: "BLOOM" }),
]);

const MUSIC = Object.freeze([
  Object.freeze({ id: "mute", label: "MUTE" }),
  Object.freeze({ id: "fracture", label: "GENERATIVE / FRACTURE" }),
  Object.freeze({ id: "junction", label: "GENERATIVE / JUNCTION" }),
  Object.freeze({ id: "nightshift", label: "GENERATIVE / NIGHTSHIFT" }),
  Object.freeze({ id: "soundtrack", label: "SOUNDTRACK / JAMENDO" }),
]);

const SOUNDTRACK_MANUAL_CONTROLS = Object.freeze([
  Object.freeze({ id: "flanger", label: "FLANGER" }),
  Object.freeze({ id: "reverb", label: "REVERB" }),
  Object.freeze({ id: "chorus", label: "CHORUS" }),
  Object.freeze({ id: "beat-repeat", label: "BEAT REPEAT" }),
]);

const EMPTY_SOUNDTRACK_MANUAL_EFFECTS = Object.freeze(Object.fromEntries(
  SOUNDTRACK_MANUAL_CONTROLS.map(({ id }) => [id, 0]),
));

function canUseDriveKeyboard(target) {
  if (!(target instanceof HTMLElement)) return true;
  return !target.closest("input, textarea, select, button, [contenteditable='true'], [role='slider']");
}

function useSmoothedValue(target, attackMs, releaseMs) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    let frame = 0;
    let previousAt = performance.now();
    const step = (now) => {
      const current = valueRef.current;
      const destination = targetRef.current;
      const elapsed = Math.min(0.1, Math.max(0, (now - previousAt) / 1000));
      previousAt = now;
      const duration = destination >= current ? attackMs / 1000 : releaseMs / 1000;
      const amount = duration <= 0 ? 1 : 1 - Math.exp(-elapsed / duration);
      const next = Math.abs(destination - current) < 0.01
        ? destination
        : current + (destination - current) * amount;
      valueRef.current = next;
      setValue(next);
      if (next !== destination) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, attackMs, releaseMs]);
  return value;
}

function useFramePacing() {
  const samplesRef = useRef([]);
  const lastAtRef = useRef(null);
  const [summary, setSummary] = useState({ samples: 0, fps: 0, p95Ms: 0 });
  const onFrame = useCallback((capturedAtMs) => {
    if (lastAtRef.current != null) {
      samplesRef.current.push(capturedAtMs - lastAtRef.current);
      if (samplesRef.current.length > 360) samplesRef.current.shift();
    }
    lastAtRef.current = capturedAtMs;
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const samples = samplesRef.current;
      if (samples.length < 8) return;
      const sorted = [...samples].sort((a, b) => a - b);
      const mean = samples.reduce((sum, item) => sum + item, 0) / samples.length;
      setSummary({
        samples: samples.length,
        fps: 1000 / mean,
        p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
      });
    }, 750);
    return () => window.clearInterval(timer);
  }, []);
  return { onFrame, summary };
}

function Icon({ group }) {
  if (group === "form") return <svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="1.5"/><circle cx="17" cy="7" r="1.5"/><circle cx="7" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/></svg>;
  if (group === "response") return <svg viewBox="0 0 24 24"><path d="M3 13h4l2-7 4 12 2-6h6"/></svg>;
  if (group === "macros") return <svg viewBox="0 0 24 24"><path d="M7 5 3 9l4 4M17 5l4 4-4 4M9 19h6"/></svg>;
  return <svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v9m8-4.5L12 12 4 7.5"/></svg>;
}

function RangeControl({ definition, value, onChange }) {
  return (
    <label className="lab-range">
      <span className="lab-range-heading">
        <span>{definition.label}</span>
        <output>{value}{definition.unit ? ` ${definition.unit}` : ""}</output>
      </span>
      <input
        type="range"
        min={definition.min}
        max={definition.max}
        step={definition.step}
        value={value}
        onChange={(event) => onChange(definition.id, Number(event.target.value))}
      />
    </label>
  );
}

function SelectControl({ label, value, options, onChange }) {
  return (
    <label className="lab-select">
      <span className="sr-only">{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
  );
}

function runtimeContext(renderer, frame) {
  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    },
    userAgent: navigator.userAgent,
    language: navigator.language,
    reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    online: navigator.onLine,
    renderer,
    frame,
  };
}

function LabApp() {
  const [values, setValues] = useState(DEFAULT_LAB_VALUES);
  const [activeGroup, setActiveGroup] = useState("scene");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [renderer, setRenderer] = useState("Starting WebGL2");
  const [sendState, setSendState] = useState("idle");
  const [notice, setNotice] = useState("Preset complete · coordinate-free");
  const [testMusic, setTestMusic] = useState("mute");
  const [audioStatus, setAudioStatus] = useState("muted");
  const [liveAudioLevel, setLiveAudioLevel] = useState(null);
  const [soundtrackPreview, setSoundtrackPreview] = useState(null);
  const [soundtrackDriveFx, setSoundtrackDriveFx] = useState(false);
  const [soundtrackManualEffects, setSoundtrackManualEffects] = useState(EMPTY_SOUNDTRACK_MANUAL_EFFECTS);
  const revisionRef = useRef(0);
  const sequenceRef = useRef(0);
  const fileRef = useRef(null);
  const valuesRef = useRef(values);
  const driveInputRef = useRef("auto");
  const motionRef = useRef({ speed: values["context.speedKmh"], direction: 0 });
  const motionTimerRef = useRef(null);
  const audioRef = useRef(null);
  const soundtrackRef = useRef(null);
  const audioMeterTimerRef = useRef(null);
  const lastScoreRef = useRef("junction");
  const lastTestMusicRef = useRef("junction");
  valuesRef.current = values;
  const { onFrame, summary } = useFramePacing();
  const smoothSpeed = useSmoothedValue(
    values["context.speedKmh"],
    values["response.attackMs"],
    values["response.releaseMs"],
  );

  const stopAudioMeter = useCallback(() => {
    window.clearInterval(audioMeterTimerRef.current);
    audioMeterTimerRef.current = null;
  }, []);

  const startAudioMeter = useCallback(() => {
    if (audioMeterTimerRef.current != null) return;
    audioMeterTimerRef.current = window.setInterval(() => {
      setLiveAudioLevel(
        lastTestMusicRef.current === "soundtrack"
          ? soundtrackRef.current?.getLevel() ?? null
          : audioRef.current?.getLevel() ?? null,
      );
    }, 120);
  }, []);

  const startAudio = useCallback(async (scoreId) => {
    const requestedScoreId = scoreId === "mute" ? lastScoreRef.current : scoreId;
    setAudioStatus("loading");
    setNotice(`Loading ${requestedScoreId.toUpperCase()} test audio…`);
    try {
      let engine = audioRef.current;
      if (!engine) {
        engine = createAudioEngine();
        if (!engine) throw new Error("Web Audio is unavailable");
        audioRef.current = engine;
      }
      await engine.resume();
      engine.setSpeed(valuesRef.current["context.speedKmh"]);
      const activeScoreId = await engine.setScore(requestedScoreId);
      engine.setMuted(false);
      lastScoreRef.current = activeScoreId;
      setTestMusic(activeScoreId);
      setAudioStatus("playing");
      startAudioMeter();
      setNotice(`${activeScoreId.toUpperCase()} · independent test audio`);
    } catch (error) {
      audioRef.current?.destroy();
      audioRef.current = null;
      stopAudioMeter();
      setLiveAudioLevel(null);
      setTestMusic("mute");
      setAudioStatus("error");
      setNotice(`Audio unavailable · ${String(error?.message || error).slice(0, 120)}`);
    }
  }, [startAudioMeter, stopAudioMeter]);

  const soundtrackController = useCallback(() => {
    if (soundtrackRef.current) return soundtrackRef.current;
    soundtrackRef.current = createSoundtrackPreviewController({
      effectsFactory: createSoundtrackEffectsController,
      onState(state) {
        setSoundtrackPreview(state);
        if (state.status === "playing" && state.current) {
          setAudioStatus("playing");
          startAudioMeter();
          setNotice(`${state.current.title} · ${state.current.artistName} · Jamendo preview`);
        } else if (state.status === "loading") {
          setAudioStatus("loading");
          setNotice("Loading Jamendo catalog…");
        } else if (state.status === "prepared") {
          setAudioStatus("ready");
          setNotice("Three transient tracks prepared · press PLAY");
        } else if (state.status === "paused") {
          setAudioStatus("muted");
          setNotice("SOUNDTRACK paused · prepared media retained in browser memory");
        } else if (state.status === "error") {
          setAudioStatus("error");
          setNotice(`SOUNDTRACK unavailable · ${state.error ?? "unknown error"}`);
        }
      },
    });
    soundtrackRef.current.setVehicleMaster(soundtrackDriveFx);
    soundtrackRef.current.setVehicleEffects({
      open: valuesRef.current["macros.open"] ? 1 : 0,
      underwater: valuesRef.current["macros.underwater"] ? 1 : 0,
      bloom: valuesRef.current["macros.bloom"] ? 1 : 0,
    });
    soundtrackRef.current.setManualEffects(soundtrackManualEffects);
    return soundtrackRef.current;
  }, [soundtrackDriveFx, soundtrackManualEffects, startAudioMeter]);

  const startSoundtrack = useCallback(async () => {
    audioRef.current?.setMuted(true);
    stopAudioMeter();
    setLiveAudioLevel(null);
    setTestMusic("soundtrack");
    lastTestMusicRef.current = "soundtrack";
    const controller = soundtrackController();
    const current = controller.getSnapshot();
    if (current.status === "paused" || current.status === "prepared") {
      await controller.resume();
    } else if (current.status !== "playing") {
      await controller.load();
    }
  }, [soundtrackController, stopAudioMeter]);

  const selectMusic = useCallback((scoreId) => {
    if (scoreId === "mute") {
      audioRef.current?.setMuted(true);
      soundtrackRef.current?.pause();
      stopAudioMeter();
      setTestMusic("mute");
      setAudioStatus("muted");
      setLiveAudioLevel(null);
      setNotice("MUTE · visual preset unchanged");
      return;
    }
    if (scoreId === "soundtrack") {
      void startSoundtrack();
      return;
    }
    soundtrackRef.current?.pause();
    lastTestMusicRef.current = scoreId;
    lastScoreRef.current = scoreId;
    void startAudio(scoreId);
  }, [startAudio, startSoundtrack, stopAudioMeter]);

  const toggleAudio = useCallback(() => {
    if (audioStatus === "playing") {
      selectMusic("mute");
      return;
    }
    selectMusic(lastTestMusicRef.current);
  }, [audioStatus, selectMusic]);

  useEffect(() => {
    return () => {
      stopAudioMeter();
      audioRef.current?.destroy();
      audioRef.current = null;
      soundtrackRef.current?.destroy();
      soundtrackRef.current = null;
    };
  }, [stopAudioMeter]);

  useEffect(() => {
    audioRef.current?.setSpeed(smoothSpeed);
  }, [smoothSpeed]);

  useEffect(() => {
    const controller = soundtrackRef.current;
    if (!controller) return;
    controller.setVehicleMaster(soundtrackDriveFx);
    controller.setVehicleEffects({
      open: values["macros.open"] ? 1 : 0,
      underwater: values["macros.underwater"] ? 1 : 0,
      bloom: values["macros.bloom"] ? 1 : 0,
    });
  }, [soundtrackDriveFx, values]);

  useEffect(() => {
    soundtrackRef.current?.setManualEffects(soundtrackManualEffects);
  }, [soundtrackManualEffects]);

  const stopMotionTimer = useCallback(() => {
    window.clearInterval(motionTimerRef.current);
    motionTimerRef.current = null;
  }, []);

  const startMotionTimer = useCallback(() => {
    if (motionTimerRef.current != null) return;
    let previousAt = performance.now();
    motionTimerRef.current = window.setInterval(() => {
      const now = performance.now();
      const elapsedSeconds = (now - previousAt) / 1000;
      previousAt = now;
      const input = driveInputRef.current;
      const currentSpeed = valuesRef.current["context.speedKmh"];
      const nextMotion = advanceDemoMotion(
        { ...motionRef.current, speed: currentSpeed },
        elapsedSeconds,
        input === "brake",
        input,
      );
      motionRef.current = nextMotion;
      setValues((current) => ({
        ...current,
        "context.inputSource": "demo",
        "context.speedKmh": Math.round(nextMotion.speed * 10) / 10,
      }));
      if (input === "auto" || (nextMotion.speed <= 0 && input !== "accelerator")) {
        stopMotionTimer();
      }
    }, 50);
  }, [stopMotionTimer]);

  useEffect(() => {
    const begin = (input, copy) => {
      driveInputRef.current = input;
      motionRef.current = {
        speed: valuesRef.current["context.speedKmh"],
        direction: input === "accelerator" ? 1 : -1,
      };
      revisionRef.current += 1;
      setSendState("idle");
      setNotice(copy);
      if (input === "brake") audioRef.current?.brake();
      else audioRef.current?.releaseBrake();
      startMotionTimer();
    };
    const handleKeyDown = (event) => {
      if (!canUseDriveKeyboard(event.target) || event.repeat) return;
      if (event.key === "ArrowUp") {
        event.preventDefault();
        begin("accelerator", "ACCELERATE · keyboard simulation");
      } else if (event.key === "ArrowDown" || event.code === "Space") {
        event.preventDefault();
        begin("brake", "BRAKE · keyboard simulation");
      }
    };
    const handleKeyUp = (event) => {
      if (event.key === "ArrowUp" && driveInputRef.current === "accelerator") {
        if (canUseDriveKeyboard(event.target)) event.preventDefault();
        begin("regen", "REGEN · accelerator released");
      } else if ((event.key === "ArrowDown" || event.code === "Space") && driveInputRef.current === "brake") {
        if (canUseDriveKeyboard(event.target)) event.preventDefault();
        driveInputRef.current = "auto";
        audioRef.current?.releaseBrake();
        setNotice("BRAKE RELEASED · speed held");
      }
    };
    const handleBlur = () => {
      driveInputRef.current = "auto";
      audioRef.current?.releaseBrake();
      stopMotionTimer();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      stopMotionTimer();
    };
  }, [startMotionTimer, stopMotionTimer]);

  const setParam = useCallback((id, rawValue) => {
    const message = createParamMessage({
      clientId: LAB_CLIENT_ID,
      sequence: ++sequenceRef.current,
      id,
      value: rawValue,
    });
    setValues((current) => applyParamMessage(current, message, LAB_PARAMETER_MANIFEST));
    revisionRef.current += 1;
    setSendState("idle");
    setNotice("Preset changed · unsent");
  }, []);

  const activeMacro = MACROS.find((macro) => values[macro.id])?.label ?? null;
  const theme = getFluxTheme(values["context.theme"]);
  const calibration = useMemo(() => ({
    formScale: values["form.scale"],
    depthScale: values["form.depth"],
    flowScale: values["form.flow"],
    pointScale: values["scene.particleSize"],
    densityScale: values["scene.rainDensity"],
    driftScale: values["scene.drift"],
    cameraDepth: values["scene.cameraDepth"],
    attackMs: values["response.attackMs"],
    releaseMs: values["response.releaseMs"],
  }), [
    values["form.scale"],
    values["form.depth"],
    values["form.flow"],
    values["scene.particleSize"],
    values["scene.rainDensity"],
    values["scene.drift"],
    values["scene.cameraDepth"],
    values["response.attackMs"],
    values["response.releaseMs"],
  ]);
  const prtclSettings = useMemo(
    () => ({ type: values["context.prtclType"] }),
    [values["context.prtclType"]],
  );
  const handleRuntimeError = useCallback((error) => {
    setNotice(`Renderer unavailable · ${error.message}`);
  }, []);

  const preset = useCallback(() => createLabPreset({
    values,
    app: APP,
    runtime: runtimeContext(renderer, summary),
    revision: revisionRef.current,
  }), [renderer, summary, values]);

  const copyJson = useCallback(async () => {
    createCommandMessage({ clientId: LAB_CLIENT_ID, sequence: ++sequenceRef.current, id: "preset.copy" });
    const json = JSON.stringify(preset(), null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setNotice("JSON copied · complete preset");
    } catch {
      const area = document.createElement("textarea");
      area.value = json;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      setNotice(copied ? "JSON copied · complete preset" : "Copy unavailable · use IMPORT/EXPORT later");
    }
  }, [preset]);

  const importJson = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = importLabPreset(JSON.parse(await file.text()));
      setValues(imported);
      revisionRef.current += 1;
      createCommandMessage({ clientId: LAB_CLIENT_ID, sequence: ++sequenceRef.current, id: "preset.import" });
      setNotice("Preset imported · all options restored");
      setSendState("idle");
    } catch {
      setNotice("Import rejected · incompatible or unsafe preset");
    }
  }, []);

  const sendJson = useCallback(async () => {
    if (!boot.authenticated || !boot.csrfToken) {
      setSendState("error");
      setNotice("SEND requires the authenticated canonical LAB");
      return;
    }
    createCommandMessage({ clientId: LAB_CLIENT_ID, sequence: ++sequenceRef.current, id: "preset.send" });
    const body = { schema: "sedicivalvole.lab-mail.v1", preset: preset() };
    setSendState("sending");
    setNotice("Sending complete JSON preset…");
    try {
      const response = await fetch(boot.sendPath, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": boot.csrfToken },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.status || "send_failed");
      setSendState("sent");
      setNotice("SENT · transport accepted");
    } catch {
      setSendState("error");
      setNotice("Send failed · preset retained for retry");
    }
  }, [preset]);

  const controls = activeGroup === "macros" ? null : CONTROL_DEFINITIONS[activeGroup];
  const selectedType = PRTCL_TYPES[values["context.prtclType"]];

  useEffect(() => {
    window.__SEDICIVALVOLE_LAB__ = {
      get values() { return values; },
      get preset() { return preset(); },
      get renderer() { return renderer; },
      get frame() { return summary; },
      get soundtrack() { return soundtrackPreview; },
    };
  }, [preset, renderer, soundtrackPreview, summary, values]);

  return (
    <main className={`lab-shell${drawerOpen ? " is-drawer-open" : ""}`}>
      <header className="lab-header">
        <div className="lab-wordmark"><strong className="lab-brand-name">sedicivalvole</strong><span>/ LAB</span></div>
        <SelectControl
          label="Visual and PRTCL family"
          value={values["context.prtclType"]}
          options={Object.values(PRTCL_TYPES).map((entry) => ({ id: entry.id, label: `PRTCL / ${entry.label}` }))}
          onChange={(value) => setParam("context.prtclType", value)}
        />
        <SelectControl
          label="Independent test audio"
          value={testMusic}
          options={MUSIC}
          onChange={selectMusic}
        />
        <div className="lab-build">{APP.version} · {APP.build}</div>
        <div className="lab-connected">
          <span className="lab-connected-dot" aria-hidden="true" />
          <span className="lab-connected-copy">
            <strong>CONNECTED</strong>
            <small>{APP.version} · {APP.build}</small>
          </span>
        </div>
        <a className="lab-logout" href={boot.logoutPath}>LOG OUT</a>
      </header>

      <section
        className="lab-stage"
        aria-label="Live PRTCL preview; hold Arrow Up to accelerate and Arrow Down to brake"
        title="Hold Arrow Up to accelerate; hold Arrow Down or Space to brake"
        tabIndex={0}
      >
        <PrtclField
          speed={smoothSpeed}
          audioLevel={liveAudioLevel ?? values["context.audioLevel"]}
          theme={theme}
          effect={activeMacro}
          settings={prtclSettings}
          calibration={calibration}
          reducedMotion={false}
          onRenderer={setRenderer}
          onFrame={onFrame}
          onRuntimeError={handleRuntimeError}
        />
        {testMusic === "soundtrack" && soundtrackPreview?.current && (
          <section className="lab-soundtrack-card" aria-label="Jamendo Soundtrack preview">
            {soundtrackPreview.current.imageUrl && (
              <img src={soundtrackPreview.current.imageUrl} alt="" width="68" height="68" />
            )}
            <div className="lab-soundtrack-credit">
              <small>SOUNDTRACK · FX-READY PREVIEW</small>
              <strong>{soundtrackPreview.current.title}</strong>
              <span>{soundtrackPreview.current.artistName}</span>
              <a href={soundtrackPreview.current.shareUrl} target="_blank" rel="noreferrer">
                {soundtrackPreview.current.providerCredit} · {soundtrackPreview.current.licenceLabel}
              </a>
            </div>
            <div className="lab-soundtrack-actions">
              <button
                type="button"
                aria-label="Previous Jamendo track"
                disabled={!soundtrackPreview.hasPrevious || audioStatus === "loading"}
                onClick={() => void soundtrackRef.current?.move("previous")}
              >PREV</button>
              <button
                type="button"
                aria-label={audioStatus === "playing" ? "Pause Jamendo track" : "Resume Jamendo track"}
                onClick={() => audioStatus === "playing"
                  ? soundtrackRef.current?.pause()
                  : void soundtrackRef.current?.resume()}
              >{audioStatus === "playing" ? "PAUSE" : "PLAY"}</button>
              <button
                type="button"
                aria-label="Next Jamendo track"
                disabled={!soundtrackPreview.hasNext || audioStatus === "loading"}
                onClick={() => void soundtrackRef.current?.move("next")}
              >NEXT</button>
            </div>
            <div className="lab-soundtrack-effects" aria-label="Manual Soundtrack effects">
              {SOUNDTRACK_MANUAL_CONTROLS.map((effect) => (
                <label key={effect.id}>
                  <span>{effect.label}</span>
                  <output>{Math.round(soundtrackManualEffects[effect.id] * 100)}</output>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={soundtrackManualEffects[effect.id]}
                    onChange={(event) => setSoundtrackManualEffects((current) => ({
                      ...current,
                      [effect.id]: Number(event.target.value),
                    }))}
                  />
                </label>
              ))}
            </div>
          </section>
        )}
      </section>

      <nav className="lab-rail" aria-label="LAB control groups">
        {LAB_GROUPS.map((group) => (
          <button
            type="button"
            key={group.id}
            className={activeGroup === group.id && drawerOpen ? "is-active" : ""}
            onClick={() => {
              setActiveGroup(group.id);
              setDrawerOpen(true);
            }}
            aria-expanded={activeGroup === group.id && drawerOpen}
          >
            <Icon group={group.id} />
            <span>{group.label}</span>
          </button>
        ))}
      </nav>

      <aside className="lab-inspector" aria-label={`${activeGroup} controls`} aria-hidden={!drawerOpen}>
        <div className="lab-inspector-heading">
          <strong>{activeGroup.toUpperCase()} <span>/ {selectedType.label}</span></strong>
          <button type="button" aria-label="Close inspector" onClick={() => setDrawerOpen(false)}>×</button>
        </div>
        <div className="lab-inspector-controls">
          {controls?.map((definition) => (
            <RangeControl key={definition.id} definition={definition} value={values[definition.id]} onChange={setParam} />
          ))}
          {activeGroup === "macros" && (
            <div className="lab-macro-list">
              {MACROS.map((macro) => (
                <button
                  key={macro.id}
                  type="button"
                  className={values[macro.id] ? "is-active" : ""}
                  aria-pressed={values[macro.id]}
                  onClick={() => {
                    for (const item of MACROS) setParam(item.id, item.id === macro.id ? !values[macro.id] : false);
                  }}
                >{macro.label}</button>
              ))}
            </div>
          )}
        </div>
        <div className="lab-capture-count">All {Object.keys(LAB_PARAMETER_MANIFEST).length} options captured</div>
      </aside>

      <div className="lab-macro-strip" aria-label="Macro states">
        {MACROS.map((macro) => (
          <button
            type="button"
            key={macro.id}
            className={values[macro.id] ? "is-active" : ""}
            aria-pressed={values[macro.id]}
            onClick={() => {
              for (const item of MACROS) setParam(item.id, item.id === macro.id ? !values[macro.id] : false);
            }}
          >{macro.label}</button>
        ))}
      </div>

      <footer className="lab-footer">
        <label className="lab-signal" title="Hold Arrow Up to accelerate; hold Arrow Down or Space to brake">
          <span className="sr-only">Manual speed in kilometres per hour</span>
          <strong>{Math.round(values["context.speedKmh"])}</strong><span>KM/H</span>
          <input type="range" min="0" max="130" step="1" value={values["context.speedKmh"]} onChange={(event) => setParam("context.speedKmh", Number(event.target.value))} />
        </label>
        <label className="lab-signal">
          <span className="sr-only">Visual audio-level test signal</span>
          <strong>{Math.round((liveAudioLevel ?? values["context.audioLevel"]) * 100)}</strong><span>AUDIO</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={liveAudioLevel ?? values["context.audioLevel"]}
            disabled={liveAudioLevel != null}
            onChange={(event) => setParam("context.audioLevel", Number(event.target.value))}
          />
        </label>
        <div className={`lab-status is-${sendState}`} role="status">{notice}</div>
        <input ref={fileRef} className="sr-only" type="file" accept="application/json,.json" onChange={importJson} />
        <button className="lab-action is-audio" type="button" onClick={toggleAudio} disabled={audioStatus === "loading"}>
          {audioStatus === "loading" ? "LOADING" : audioStatus === "playing" ? "MUTE AUDIO" : "START AUDIO"}
        </button>
        <button
          className={`lab-action is-drive-fx${soundtrackDriveFx ? " is-active" : ""}`}
          type="button"
          disabled={testMusic !== "soundtrack"}
          aria-pressed={soundtrackDriveFx}
          onClick={() => setSoundtrackDriveFx((current) => !current)}
        >DRIVE FX</button>
        <button className="lab-action" type="button" onClick={() => fileRef.current?.click()}>IMPORT</button>
        <button className="lab-action" type="button" onClick={copyJson}>COPY JSON</button>
        <button className="lab-action is-primary" type="button" onClick={sendJson} disabled={sendState === "sending"}>
          {sendState === "sending" ? "SENDING" : "SEND JSON"}
        </button>
      </footer>
    </main>
  );
}

const labRootElement = document.getElementById("lab-root");
const labRoot = import.meta.hot?.data.labRoot ?? createRoot(labRootElement);
if (import.meta.hot) import.meta.hot.data.labRoot = labRoot;

labRoot.render(
  <StrictMode><LabApp /></StrictMode>,
);
