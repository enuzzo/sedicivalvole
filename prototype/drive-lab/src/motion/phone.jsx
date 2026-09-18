import { useEffect, useRef, useState } from "react";
import { createPhoneSensors } from "./sensors.js";
import { createMotionSession } from "./session.js";
import { MotionIcon, MotionQuality, motionStateText } from "./motion-ui.jsx";

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
    const session = createMotionSession({ role: "phone", onChange: setSnapshot,
      getPhone: () => ({ summary: sensorsRef.current?.summary() ?? {}, values: sensorsRef.current?.latest() ?? null }) });
    const sensors = createPhoneSensors({ onEvent: (type, detail) => session.event(type, detail) });
    sensorsRef.current = sensors; sessionRef.current = session;
    const timer = setInterval(() => { setSensor(sensors.summary()); setValues(sensors.latest()); session.refresh(); }, 100);
    return () => { clearInterval(timer); sensors.dispose(); session.dispose(); sensorsRef.current = null; sessionRef.current = null; };
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
  return <main className="motion-phone">
    <header><MotionIcon/><div><small>SEDICIVALVOLE · EXPERIMENTAL</small><h1>Phone motion</h1></div><span className="motion-build">{__APP_BUILD__}</span></header>
    <p className="motion-phone-status" role="status">{motionStateText(snapshot.state)} · Sensors: {sensor.sensorState}</p>
    <p>{message}</p>
    <div className="motion-actions"><button onClick={start} disabled={["requesting", "waiting", "live"].includes(sensor.sensorState)}>ENABLE & CONNECT</button><button onClick={stop}>STOP</button></div>
    <div className="motion-cross" aria-label="Acceleration in your tare reference frame">
      <svg viewBox="0 0 320 260" fill="none" aria-hidden="true"><path d="M30 130h260M160 22v216M65 220l190-180" stroke="currentColor" strokeWidth="1.5"/><path d="m281 123 9 7-9 7M153 31l7-9 7 9m79 15 9-6-1 11" stroke="currentColor" strokeWidth="1.5"/><circle cx={160 + Math.max(-100, Math.min(100, (values?.acceleration[0] ?? 0) * 20))} cy={130 - Math.max(-100, Math.min(100, (values?.acceleration[1] ?? 0) * 20))} r="7" fill="currentColor" opacity=".4"/></svg>
      <span className="motion-axis-x">X <b>{number(values?.acceleration[0])}</b></span>
      <span className="motion-axis-y">Y <b>{number(values?.acceleration[1])}</b></span>
      <span className="motion-axis-z">Z <b>{number(values?.acceleration[2])}</b></span>
      <button className="motion-tare" onClick={tare}>TARE<small>{sensor.tared ? "SET AGAIN" : "SET ZERO"}</small></button>
      <span className="motion-unit">m/s² · tare-relative axes</span>
    </div>
    <div className="motion-rotations">{["X", "Y", "Z"].map((axis, i) => <div key={axis}><small>Rotation {axis}</small><strong>{number(values?.tilt[i])}°</strong><span>{number(values?.rotation[i])}°/s</span></div>)}</div>
    <MotionQuality summary={{ ...snapshot, ...sensor }}/>
    <p className="motion-meta">Flat or upright: TARE sets this pose as zero, not the car's forward direction. Movement in your hand also counts. Retare after remounting. Keep Safari visible; screen wake is {sensor.wakeLock ? "active" : "unavailable or not requested"}.</p>
    <details><summary>Connection & sensor diagnostics</summary><p>Quality, permission, tare and connection events only. No raw sensor history, location or pairing keys. Download this report if the phone cannot connect; the Tesla report cannot contain events it never received.</p><button onClick={download}>DOWNLOAD PHONE REPORT</button><pre>{JSON.stringify({ ...snapshot, qrUrl: undefined, values: undefined, ...sensor }, null, 2)}</pre></details>
  </main>;
}
