import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function MotionIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 17h2M4 8l-2 4 2 4M20 8l2 4-2 4"/></svg>;
}

function Guide({ step }) {
  return <svg viewBox="0 0 140 76" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    {step === 1 ? <><rect x="18" y="17" width="67" height="42" rx="4"/><path d="M28 27h14v14H28zM50 27h14v14H50zM28 46h8m8 0h20"/><rect x="97" y="7" width="25" height="60" rx="5"/><path d="M88 36h7m-5-4 5 4-5 4"/></> : step === 2 ? <><path d="M18 56h100M28 46l44-25 44 25-44 25z"/><rect x="52" y="22" width="32" height="27" rx="3" transform="rotate(-30 68 35)"/><path d="M68 8v8m-5-4 5 4 5-4M120 26v20m-5-5 5 5 5-5"/></> : <><path d="M70 9v58M24 38h92M40 61l60-45"/><circle cx="70" cy="38" r="15"/><path d="m64 38 4 4 9-10"/></>}
  </svg>;
}

export const motionStateText = (state) => ({ idle: "Ready to pair", preparing: "Preparing connection…", pairing: "Scan with iPhone", connecting: "Opening direct connection…", connected: "Phone connected", stale: "Waiting for fresh phone data", closed: "Disconnected · pair again", expired: "Pairing expired · try again", error: "Direct connection unavailable · retry on the same Wi-Fi", suspended: "Paused while hidden · pair again", unavailable: "WebRTC unavailable in this browser" }[state] ?? "Not connected");

export function MotionPanel({ snapshot, onStart, onStop, onClose }) {
  const [qr, setQr] = useState(null);
  useEffect(() => {
    let active = true; setQr(null);
    if (snapshot.qrUrl) void QRCode.toDataURL(snapshot.qrUrl, { width: 280, margin: 4, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }).then((value) => { if (active) setQr(value); }).catch(() => {});
    return () => { active = false; };
  }, [snapshot.qrUrl]);
  return <div className="motion-panel-content">
    <header><div><small>IPHONE COMPANION · EXPERIMENTAL</small><h2 id="motion-title">A new sense of motion</h2></div><button data-dialog-initial-focus onClick={onClose}>CLOSE</button></header>
    <p>Let your phone reveal acceleration and rotation. Pair it, place it, then set your zero. GPS still owns road speed; visual steering is a future experiment.</p>
    <ol className="motion-guide">{[["Scan", "Open the QR in iPhone Safari."], ["Place", "Flat or upright. Keep it steady; hand movement also counts."], ["Zero", "Allow sensors, then tap ZERO to set your reference."]].map(([title, copy], i) => <li key={title}><Guide step={i + 1}/><strong>{i + 1} · {title}</strong><p>{copy}</p></li>)}</ol>
    <div className="motion-pairing"><div>
      <strong role="status">{motionStateText(snapshot.state)}</strong>
      <p>Keep Safari visible. Start on the same Wi-Fi; direct connectivity depends on both browsers and the network. No relay is configured.</p>
      <div className="motion-actions"><button onClick={onStart} disabled={["preparing", "pairing", "connecting"].includes(snapshot.state)}>CREATE QR</button><button onClick={onStop}>DISCONNECT</button></div>
      <p className="motion-meta">QR expires in 3 minutes and joins one phone. Session ends on hiding, disconnect or after one hour. Connection and sensor-quality summaries appear in REPORT; sensor streams and pairing keys do not.</p>
    </div>{qr ? <img className="motion-qr" src={qr} alt="Scan to pair this session with your iPhone"/> : <div className="motion-qr-placeholder"><MotionIcon/><span>{snapshot.state === "connected" ? "PAIRED" : "PHONE MOTION"}</span></div>}</div>
    <MotionQuality summary={snapshot}/>
  </div>;
}

export function MotionQuality({ summary = {} }) {
  return <dl className="motion-quality">
    <div><dt>Acceleration / Gyro</dt><dd>{summary.accelerometer ? "YES" : "—"} / {summary.gyroscope ? "YES" : "—"}<small>{summary.sensorState ?? "not connected"}</small></dd></div>
    <div><dt>Zero</dt><dd>{summary.tared ? "SET" : "REQUIRED"}</dd></div>
    <div><dt>Cadence</dt><dd>{summary.cadenceHz > 0 ? `${summary.cadenceHz.toFixed(1)} Hz` : "—"}</dd></div>
    <div><dt>Round trip</dt><dd>{summary.received > 0 ? `${summary.rttMs?.toFixed(1)} ms` : "—"}</dd></div>
  </dl>;
}
