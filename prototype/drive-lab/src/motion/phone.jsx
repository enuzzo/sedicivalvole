import { useEffect, useRef, useState } from "react";
import { createPhoneSensors } from "./sensors.js";
import { createMotionSession } from "./session.js";
import { getFluxTheme } from "../flux-themes.js";
import { resolveSemanticTheme } from "../semantic-theme.js";

const phoneTheme = resolveSemanticTheme(getFluxTheme("red"), "dark");
import { MotionQuality, motionStateText } from "./motion-ui.jsx";

// The bearer capability stays in memory; remove it from history before UI/logging.
const match = /^#pair=([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(window.location.hash);
const initialPair = match ? { id: match[1], token: match[2] } : null;
if (window.location.hash) history.replaceState(null, "", `${location.pathname}?motion=phone`);
const number = (value) => Number.isFinite(value) ? value.toFixed(2) : "—";

export function MotionPhone() {
  const sensorsRef = useRef(null), sessionRef = useRef(null);
  const [snapshot, setSnapshot] = useState({ state: "idle" });
  const [sensor, setSensor] = useState({ sensorState: "idle" });
  const [values, setValues] = useState(null);
  const [message, setMessage] = useState("Place your phone, enable sensors, then tap TARE.");
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Phone companion — sedicivalvole";
    const session = createMotionSession({ role: "phone", onChange: setSnapshot,
      getPhone: () => ({ summary: sensorsRef.current?.summary() ?? {}, values: sensorsRef.current?.latest() ?? null }) });
    const sensors = createPhoneSensors({ onEvent: (type, detail) => session.event(type, detail) });
    sensorsRef.current = sensors; sessionRef.current = session;
    const timer = setInterval(() => { setSensor(sensors.summary()); setValues(sensors.latest()); session.refresh(); }, 100);
    return () => { document.title = previousTitle; clearInterval(timer); sensors.dispose(); session.dispose(); sensorsRef.current = null; sessionRef.current = null; };
  }, []);
  const start = () => {
    void sensorsRef.current?.start();
    if (initialPair) void sessionRef.current?.start(initialPair);
    setMessage(initialPair ? "Allow motion and orientation. Then tap TARE while steady." : "Local sensor test. Scan a new Tesla QR to connect.");
  };
  const tare = () => {
    const result = sensorsRef.current?.tare();
    setMessage(result === "tared" ? "Zero set. X/Y/Z now refer to this pose." : result === "hold-still" ? "Hold still briefly, then tap TARE again." : "Waiting for complete, fresh motion and orientation data.");
  };
  const stop = () => { sensorsRef.current?.stop(); sessionRef.current?.stop(); setMessage("Stopped. Scan a new QR to reconnect."); };
  const download = () => {
    const report = { schema: "sedicivalvole.motion-phone-report.v1", generatedAt: new Date().toISOString(),
      build: __APP_BUILD__, commit: __APP_COMMIT__, platform: navigator.userAgent,
      motion: sessionRef.current?.report() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "sedicivalvole-phone-motion.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <main className="motion-phone" style={phoneTheme.css}>
    <header className="motion-phone-brand">
      <img src={`/brand/pistons-v1/mark-512.png?build=${encodeURIComponent(__APP_BUILD__)}`} width="48" height="48" alt=""/>
      <div><span className="motion-wordmark">sedicivalvole</span><span className="motion-phone-kicker">PHONE COMPANION</span></div>
    </header>
    <div className="motion-phone-heading"><h1>Motion instrument</h1><span>EXPERIMENTAL</span></div>
    <section className="motion-phone-controls" aria-label="Connection and sensor controls">
      <div className="motion-phone-status" role="status">
        <span className="motion-link-status" data-connected={snapshot.state === "connected"}>{motionStateText(snapshot.state)}</span>
        <span className="motion-sensor-status">Sensors <b>{sensor.sensorState}</b></span>
      </div>
      <p className="motion-phone-message" role="status">{message}</p>
      <div className="motion-actions"><button onClick={start} disabled={["requesting", "waiting", "live"].includes(sensor.sensorState)}>ENABLE & CONNECT</button><button onClick={stop}>STOP</button></div>
    </section>
    <section className="motion-instrument" aria-label="Live motion readings">
    <div className="motion-section-label"><span>ACCELERATION</span><span>m/s²</span></div>
    <div className="motion-cross" aria-label="Acceleration in your tare reference frame">
      <svg viewBox="0 0 320 260" fill="none" aria-hidden="true"><circle cx="160" cy="130" r="94" stroke="currentColor" strokeDasharray="2 10" opacity=".35"/><path d="M30 130h260M160 22v216M65 220l190-180" stroke="currentColor" strokeWidth="1.5"/><path d="m281 123 9 7-9 7M153 31l7-9 7 9m79 15 9-6-1 11" stroke="currentColor" strokeWidth="1.5"/><circle className="motion-sample-dot" visibility={values ? "visible" : "hidden"} cx={160 + Math.max(-100, Math.min(100, (values?.acceleration[0] ?? 0) * 20))} cy={130 - Math.max(-100, Math.min(100, (values?.acceleration[1] ?? 0) * 20))} r="7" fill="currentColor" opacity=".4"/></svg>
      <span className="motion-axis-x">X <b>{number(values?.acceleration[0])}</b></span>
      <span className="motion-axis-y">Y <b>{number(values?.acceleration[1])}</b></span>
      <span className="motion-axis-z">Z <b>{number(values?.acceleration[2])}</b></span>
      <button className="motion-tare" onClick={tare}>TARE<small>{sensor.tared ? "SET AGAIN" : "SET ZERO"}</small></button>
      <span className="motion-unit" data-tared={Boolean(sensor.tared)}>{sensor.tared ? "REFERENCE SET · TARE TO RESET" : "PLACE PHONE · SET YOUR ZERO"}</span>
    </div>
    <div className="motion-rotations">{["X", "Y", "Z"].map((axis, i) => <div key={axis}><small>Rotation {axis}</small><strong>{number(values?.tilt[i])}°</strong><span>{number(values?.rotation[i])}°/s</span></div>)}</div>
    </section>
    <section className="motion-phone-quality" aria-label="Sensor and connection quality"><MotionQuality summary={{ ...snapshot, ...sensor }}/></section>
    <details className="motion-phone-guide"><summary>Placement & your zero</summary>
      <div className="motion-mount-guide">
        <svg viewBox="0 0 140 110" fill="none" stroke="currentColor" strokeWidth="2" role="img" aria-label="Phone upright in a holder tilted about 45 degrees">
          <path d="M14 94h112M40 94l54-54 22 54M53 94a28 28 0 0 1 8-20"/>
          <rect x="37" y="15" width="38" height="72" rx="5" transform="rotate(45 56 51)"/>
          <path d="m41 69 7 7"/><text x="81" y="83" fill="currentColor" stroke="none" fontSize="14">45°</text>
        </svg>
        <p><strong>Your holder is your zero.</strong> Portrait at about 45°, flat or upright: place the phone, keep it steady, then tap TARE. No need to level it.</p>
      </div>
      <p>TARE sets this pose as zero, not the car's forward direction. Movement in your hand also counts. Retare after remounting.</p>
      <p>Keep Safari visible. Screen wake is {sensor.wakeLock ? "active" : "unavailable or not requested"}. Hiding the page ends the connection.</p>
    </details>
    <details className="motion-phone-diagnostics"><summary>Connection & sensor diagnostics</summary><p>Quality, permission, tare and connection events only. No raw sensor history, location or pairing keys. Download this report if the phone cannot connect; the Tesla report cannot contain events it never received.</p><button onClick={download}>DOWNLOAD PHONE REPORT</button><pre>{JSON.stringify({ ...snapshot, qrUrl: undefined, values: undefined, ...sensor }, null, 2)}</pre></details>
    <footer className="motion-phone-footer"><span>A project by enuzzo</span><span>{__APP_BUILD__}</span></footer>
  </main>;
}
