import { useCallback, useEffect, useRef, useState } from "react";
import { createPhoneSensors } from "./sensors.js";
import { createMotionSession } from "./session.js";
import { getFluxTheme } from "../flux-themes.js";
import { resolveSemanticTheme } from "../semantic-theme.js";

import { MotionQuality, MotionSteps, MotionNext } from "./motion-ui.jsx";
import { phoneStatus } from "./phone-status.js";
import { MotionTrace } from "./trace-view.jsx";
import { motionPresentationFromSearch } from "./presentation.js";
import { phoneOnboarding } from "./onboarding.js";
const initialPresentation = motionPresentationFromSearch(window.location.search);

// The bearer capability stays in memory; remove it from history before UI/logging.
const match = /^#pair=([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(window.location.hash);
const initialPair = match ? { id: match[1], token: match[2] } : null;
if (window.location.hash) history.replaceState(null, "", `${location.pathname}?motion=phone`);
const number = value => !Number.isFinite(value) ? "—" : Math.abs(value) >= 10000 ? value.toExponential(0)
  : value.toFixed(Math.abs(value) < 10 ? 2 : Math.abs(value) < 100 ? 1 : 0);

export function MotionPhone() {
  const sensorsRef = useRef(null), sessionRef = useRef(null);
  const traceRef = useRef({});
  const attemptedRef = useRef(false);
  const zeroStepRef = useRef(null), revealZeroRef = useRef(false);
  const [presentation, setPresentation] = useState(initialPresentation);
  const phoneTheme = resolveSemanticTheme(getFluxTheme(presentation.palette), presentation.appearance);
  const [viewReset, setViewReset] = useState(0);
  const getSample = useCallback(() => sensorsRef.current?.latest() ?? null, []);
  const traceTelemetry = useCallback(detail => {
    if (traceRef.current.traceRenderer !== detail.traceRenderer) sessionRef.current?.event("trace", detail);
    traceRef.current = detail;
  }, []);
  const [snapshot, setSnapshot] = useState({ state: "idle" });
  const [sensor, setSensor] = useState({ sensorState: "idle" });
  const [values, setValues] = useState(null);
  const [activity, setActivity] = useState(null);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Phone companion — sedicivalvole";
    let previousLink = "idle";
    const session = createMotionSession({ role: "phone", onChange: next => {
      // A lost/ended pairing also invalidates the phone reference and wake owner.
      const changed = previousLink !== next.state; previousLink = next.state;
      if (changed && ["closed", "expired", "error", "suspended", "unavailable"].includes(next.state)
        && !["stopped", "suspended", "idle"].includes(sensorsRef.current?.summary().sensorState)) sensorsRef.current?.stop();
      if (next.presentation) setPresentation(previous => previous.palette === next.presentation.palette && previous.appearance === next.presentation.appearance ? previous : next.presentation);
      setSnapshot(next);
    },
      getPhone: () => ({ summary: { ...sensorsRef.current?.summary(), ...traceRef.current }, values: sensorsRef.current?.latest() ?? null }) });
    const sensors = createPhoneSensors({ onEvent: (type, detail) => session.event(type, detail) });
    sensorsRef.current = sensors; sessionRef.current = session;
    const timer = setInterval(() => { setSensor(sensors.summary()); setValues(sensors.latest()); setActivity(sensors.activity()); session.refresh(); }, 100);
    return () => { document.title = previousTitle; clearInterval(timer); sensors.dispose(); session.dispose(); sensorsRef.current = null; sessionRef.current = null; };
  }, []);
  useEffect(() => {
    if (revealZeroRef.current && sensor.sensorState === "live" && !sensor.tared && (!initialPair || snapshot.state === "connected")) {
      revealZeroRef.current = false;
      zeroStepRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
    }
  }, [sensor.sensorState, sensor.tared, snapshot.state]);
  const start = () => {
    revealZeroRef.current = true;
    void sensorsRef.current?.start();
    if (status.canJoin && !attemptedRef.current) {
      attemptedRef.current = true;
      void sessionRef.current?.start(initialPair);
    }
    setSensor(sensorsRef.current?.summary() ?? {});
  };
  const tare = () => {
    sensorsRef.current?.requestTare();
    setSensor(sensorsRef.current?.summary() ?? {});
  };
  const stop = () => { sensorsRef.current?.stop(); sessionRef.current?.stop(); setSensor(sensorsRef.current?.summary() ?? {}); setValues(null); setActivity(null); };
  const status = phoneStatus({ link: snapshot, sensor, hasPair: Boolean(initialPair), attempted: attemptedRef.current });
  const guide = phoneOnboarding({ link: snapshot, sensor, hasPair: Boolean(initialPair), attempted: attemptedRef.current });
  const download = () => {
    const report = { schema: "sedicivalvole.motion-phone-report.v1", generatedAt: new Date().toISOString(),
      build: __APP_BUILD__, commit: __APP_COMMIT__, platform: navigator.userAgent,
      motion: sessionRef.current?.report() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "sedicivalvole-phone-motion.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <main className="motion-phone" data-palette={presentation.palette} data-appearance={presentation.appearance} style={{ ...phoneTheme.css, colorScheme: presentation.appearance }}>
    <div className="motion-phone-lead">
    <header className="motion-phone-brand">
      <img src={`/brand/pistons-v1/mark-512.png?build=${encodeURIComponent(__APP_BUILD__)}`} width="48" height="48" alt=""/>
      <div><span className="motion-wordmark">sedicivalvole</span><span className="motion-phone-kicker">PHONE COMPANION</span></div>
    </header>
    <div className="motion-phone-heading"><h1>Motion instrument</h1><span>TRACE</span></div>
    <section className="motion-phone-controls" aria-label="Connection and sensor controls">
      {initialPair && <MotionSteps active={guide.active} compact/>}
      <MotionNext guide={guide}/>
      {(!status.running || sensor.sensorState === "requesting") && <div className="motion-actions"><button key={status.action} className="motion-primary motion-nudge" onClick={start} disabled={sensor.sensorState === "requesting"}>{sensor.sensorState === "requesting" ? "AWAITING PERMISSION…" : status.action}</button></div>}
      {(["incomplete", "stale"].includes(sensor.sensorState) || sensor.sensorState === "waiting" && sensor.waitingMs > 5000) && <div className="motion-actions"><button className="motion-primary motion-nudge" onClick={() => { sensorsRef.current?.stop(); start(); }}>RETRY SENSORS</button></div>}
      {["released", "denied", "error"].includes(sensor.wakeState) && <button className="motion-wake-retry" onClick={() => void sensorsRef.current?.retryWake()}>KEEP SCREEN AWAKE</button>}
    </section>
    </div>
    <section className="motion-instrument" aria-label="Live motion readings">
      {!sensor.tared && <div className="motion-input-proof" aria-label="Sensor activity before zero">
        <strong>{activity ? "SENSORS LIVE · SET ZERO TO DRAW" : "WAITING FOR SENSORS"}</strong>
        <div><span>Acceleration</span><span className="motion-input-value">{number(activity?.acceleration)} m/s²</span></div>
        <div><span>Rotation</span><span className="motion-input-value">{number(activity?.rotation)} °/s</span></div>
      </div>}
      <MotionTrace getSample={getSample} onTelemetry={traceTelemetry} resetKey={viewReset} themeKey={`${presentation.palette}:${presentation.appearance}`}/>
      <div className="motion-zero-row"><button className={`motion-zero${guide.active === 2 && !sensor.tared && sensor.tareState !== "settling" ? " motion-nudge" : ""}`} onClick={tare} disabled={sensor.tareState === "settling" || sensor.sensorState !== "live"}>{sensor.tareState === "settling" ? "HOLD STILL" : "ZERO"}<small>recalibrate</small></button></div>
      <p ref={zeroStepRef} className="motion-phone-message">{sensor.tareState === "settling" ? "Keep still…" : ["hold-still", "unavailable"].includes(sensor.tareState) ? (sensor.tared ? "Previous ZERO kept · try again" : "Not set · rest the phone and retry") : sensor.tared ? "✓ ZERO SET" : sensor.sensorState === "live" ? "Tap ZERO · lift your finger · keep still" : "Enable sensors to set ZERO"}</p>
      <div className="motion-section-label"><span>ACCELERATION</span><span>m/s²</span></div>
      <div className="motion-readings">{["X", "Y", "Z"].map((axis,i) => <div key={axis}><small>{axis}</small><strong>{number(values?.acceleration[i])}</strong></div>)}</div>
      <div className="motion-section-label"><span>ROTATION</span><span>°/s</span></div>
      <div className="motion-readings motion-gyro-readings">{["X", "Y", "Z"].map((axis,i) => <div key={axis}><small>{axis}</small><strong>{number(values?.rotation[i])}</strong></div>)}</div>
      <div className="motion-reference"><span data-tared={Boolean(sensor.tared)}>{sensor.tared ? "REFERENCE SET" : "ZERO REQUIRED"}</span><span>{sensor.wakeLock ? "SCREEN AWAKE" : sensor.wakeState === "requesting" ? "WAKE REQUESTED" : !sensor.wakeState || sensor.wakeState === "idle" ? "WAKE ON START" : "SCREEN MAY SLEEP"}</span></div>
      <div className="motion-view-actions"><button onClick={() => setViewReset(n => n + 1)}>RECENTER VIEW</button><button onClick={stop}>STOP</button></div>
    </section>
    <details className="motion-phone-guide"><summary>Placement & your zero</summary>
      <div className="motion-mount-guide">
        <svg viewBox="0 0 140 110" fill="none" stroke="currentColor" strokeWidth="2" role="img" aria-label="Phone upright in a holder tilted about 45 degrees">
          <path d="M14 94h112M40 94l54-54 22 54M53 94a28 28 0 0 1 8-20"/>
          <rect x="37" y="15" width="38" height="72" rx="5" transform="rotate(45 56 51)"/>
          <path d="m41 69 7 7"/><text x="81" y="83" fill="currentColor" stroke="none" fontSize="14">45°</text>
        </svg>
        <p><strong>Your holder is your zero.</strong> Portrait at about 45°, flat or upright: place the phone, keep it steady, then tap ZERO. No need to level it.</p>
      </div>
      <p>ZERO sets this pose as zero, not the car's forward direction. Movement in your hand also counts. Recalibrate after remounting.</p>
      <p>The cube shows acceleration in m/s² over the last three seconds, not a position or road path. Axis scales expand together when needed and reset with ZERO. Drag sideways to turn the view; RECENTER VIEW restores the camera without changing your zero. The phone icon shows orientation relative to your reference.</p>
      <p>Keep this page visible. Screen wake is {sensor.wakeLock ? "active" : sensor.wakeState ?? "not requested"}. Hiding the page ends the connection.</p>
    </details>
    <details className="motion-phone-diagnostics"><summary>Connection & sensor details</summary><MotionQuality summary={{ ...snapshot, ...sensor }}/><p>{status.connection}. {status.recovery}</p><p>{status.instruction}</p><p>Quality, permission, tare and connection events only. No raw sensor history, location or pairing keys. Download this report if the phone cannot connect; the Tesla report cannot contain events it never received.</p><button onClick={download}>DOWNLOAD PHONE REPORT</button><pre>{JSON.stringify({ ...snapshot, qrUrl: undefined, values: undefined, ...sensor }, null, 2)}</pre></details>
    <footer className="motion-phone-footer"><span>A project by enuzzo</span><span>{__APP_BUILD__}</span></footer>
  </main>;
}
