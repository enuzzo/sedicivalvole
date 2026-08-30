import { StrictMode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { PrtclField } from "../environments/prtcl/prtcl-field.jsx";
import { PRTCL_TYPES } from "../environments/prtcl/prtcl-model.js";
import { getFluxTheme } from "../flux-themes.js";
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
  Object.freeze({ id: "fracture", label: "FRACTURE" }),
  Object.freeze({ id: "junction", label: "JUNCTION" }),
  Object.freeze({ id: "nightshift", label: "NIGHTSHIFT" }),
]);

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
  const revisionRef = useRef(0);
  const sequenceRef = useRef(0);
  const fileRef = useRef(null);
  const { onFrame, summary } = useFramePacing();
  const smoothSpeed = useSmoothedValue(
    values["context.speedKmh"],
    values["response.attackMs"],
    values["response.releaseMs"],
  );

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
  }), [values]);

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
    };
  }, [preset, renderer, summary, values]);

  return (
    <main className={`lab-shell${drawerOpen ? " is-drawer-open" : ""}`}>
      <header className="lab-header">
        <div className="lab-wordmark">sedicivalvole <span>/ LAB</span></div>
        <SelectControl
          label="Visual and PRTCL family"
          value={values["context.prtclType"]}
          options={Object.values(PRTCL_TYPES).map((entry) => ({ id: entry.id, label: `PRTCL / ${entry.label}` }))}
          onChange={(value) => setParam("context.prtclType", value)}
        />
        <SelectControl
          label="Music context"
          value={values["context.music"]}
          options={MUSIC}
          onChange={(value) => setParam("context.music", value)}
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

      <section className="lab-stage" aria-label="Live PRTCL preview">
        <PrtclField
          speed={smoothSpeed}
          audioLevel={values["context.audioLevel"]}
          theme={theme}
          effect={activeMacro}
          settings={{ type: values["context.prtclType"] }}
          calibration={calibration}
          reducedMotion={false}
          onRenderer={setRenderer}
          onFrame={onFrame}
          onRuntimeError={(error) => setNotice(`Renderer unavailable · ${error.message}`)}
        />
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
        <label className="lab-signal">
          <span className="sr-only">Manual speed in kilometres per hour</span>
          <strong>{Math.round(values["context.speedKmh"])}</strong><span>KM/H</span>
          <input type="range" min="0" max="130" step="1" value={values["context.speedKmh"]} onChange={(event) => setParam("context.speedKmh", Number(event.target.value))} />
        </label>
        <label className="lab-signal">
          <span className="sr-only">Music tempo in beats per minute</span>
          <strong>{Math.round(values["context.bpm"])}</strong><span>BPM</span>
          <input type="range" min="40" max="200" step="1" value={values["context.bpm"]} onChange={(event) => setParam("context.bpm", Number(event.target.value))} />
        </label>
        <div className={`lab-status is-${sendState}`} role="status">{notice}</div>
        <input ref={fileRef} className="sr-only" type="file" accept="application/json,.json" onChange={importJson} />
        <button className="lab-action" type="button" onClick={() => fileRef.current?.click()}>IMPORT</button>
        <button className="lab-action" type="button" onClick={copyJson}>COPY JSON</button>
        <button className="lab-action is-primary" type="button" onClick={sendJson} disabled={sendState === "sending"}>
          {sendState === "sending" ? "SENDING" : "SEND JSON"}
        </button>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("lab-root")).render(
  <StrictMode><LabApp /></StrictMode>,
);
