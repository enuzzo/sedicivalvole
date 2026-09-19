import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function MotionIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 17h2M4 8l-2 4 2 4M20 8l2 4-2 4"/></svg>;
}

function Guide({ step }) {
  return <svg viewBox="0 0 140 76" fill="none" stroke="var(--ui-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {step === 1 ? <>
      <rect x="12" y="16" width="62" height="44" rx="3"/><path d="M22 26h12v12H22zM45 26h12v12H45zM22 47h12m11 0h12"/>
      <g stroke="var(--ui-accent-text)"><rect x="99" y="7" width="27" height="62" rx="4"/><path d="M109 61h7M89 24l-9 14 9 14M108 25h9v19h-9z"/></g>
    </> : step === 2 ? <>
      <rect x="38" y="5" width="48" height="66" rx="5"/><path d="M57 63h10"/>
      <g stroke="var(--ui-accent-text)"><rect x="47" y="17" width="30" height="32" rx="2"/><path d="m53 28 6 6 12-12M47 42h30M104 39l-7 10-7-10m7-16v26"/></g>
    </> : <>
      <path d="M19 65h101M60 57l-7 8h36l-7-8"/><rect x="56" y="6" width="30" height="48" rx="4"/>
      <g stroke="var(--ui-accent-text)"><circle cx="71" cy="30" r="8"/><path d="M71 16v6m0 16v6M57 30h6m16 0h6M109 16v28m-5-5 5 5 5-5"/></g>
    </>}
  </svg>;
}

export const motionStateText = (state) => ({ idle: "Ready to pair", preparing: "Preparing connection…", pairing: "Scan with iPhone", connecting: "Opening direct connection…", connected: "Phone connected", stale: "Waiting for fresh phone data", closed: "Disconnected · create a new QR", expired: "Pairing expired · create a new QR", error: "Connection unavailable · create a new QR", suspended: "Page was hidden · create a new QR", unavailable: "WebRTC unavailable in this browser" }[state] ?? "Not connected");

export function MotionPanel({ snapshot, onStart, onStop, onClose }) {
  const [qr, setQr] = useState(null);
  const [qrError, setQrError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => {
    let active = true; setQr(null); setQrError(false);
    if (snapshot.qrUrl) void QRCode.toDataURL(snapshot.qrUrl, { width: 280, margin: 4, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }).then((value) => { if (active) setQr(value); }).catch(() => { if (active) setQrError(true); });
    return () => { active = false; };
  }, [snapshot.qrUrl]);
  return <div className="motion-panel-content">
    <header><div><small>PHONE COMPANION · EXPERIMENTAL</small><h2 id="motion-title">Connect your phone</h2></div><button data-dialog-initial-focus onClick={onClose}>CLOSE</button></header>
    <p className="motion-guide-intro">Scan here. Enable sensors on your phone. Set ZERO.</p>
    <ol className="motion-guide">{[["Scan", "Use iPhone Camera."], ["Connect", "ENABLE & CONNECT → Allow."], ["Zero", "Rest the phone. Tap ZERO. Keep still."]].map(([title, copy], i) => <li key={title}><Guide step={i + 1}/><strong>{i + 1} · {title}</strong><p>{copy}</p></li>)}</ol>
    <div className="motion-pairing"><div>
      <strong role="status">{motionStateText(snapshot.state)}</strong>
      <p>{snapshot.state === "connected" ? (snapshot.tared ? "Ready. CLOSE keeps the phone connected." : "Link open. On your phone, enable sensors and set ZERO.") : snapshot.state === "stale" ? "Phone data paused. Keep its page visible and check the sensor message." : snapshot.state === "pairing" ? "Scan the QR with your phone camera." : ["preparing", "connecting"].includes(snapshot.state) ? "Keep both pages visible. DISCONNECT cancels this attempt." : "Tap CREATE QR for a fresh connection."}</p>
      <p>Same Wi-Fi to start · keep both pages visible.</p>
      <div className="motion-actions"><button onClick={onStart} disabled={["preparing", "pairing", "connecting", "connected", "stale"].includes(snapshot.state)}>CREATE QR</button><button onClick={onStop}>DISCONNECT</button></div>
      {qrError && <p role="alert">QR could not be displayed. Tap DISCONNECT, then CREATE QR to retry.</p>}
      <p className="motion-meta">One phone · QR expires in 3 minutes</p>
    </div>{qr ? <img className="motion-qr" src={qr} alt="Scan to pair this session with your iPhone"/> : <div className="motion-qr-placeholder"><MotionIcon/><span>{snapshot.state === "connected" ? "PAIRED" : "PHONE MOTION"}</span></div>}</div>
    <MotionQuality summary={snapshot}/>
    <div className="motion-connection-details"><button className="motion-connection-toggle" aria-expanded={detailsOpen} aria-controls="motion-connection-details-content" onClick={() => setDetailsOpen(open => !open)}>Connection details</button>
      <div id="motion-connection-details-content" hidden={!detailsOpen}>
      <p>Both devices need a direct network path; Wi-Fi can block traffic between devices. There is no relay fallback. Setup ends after 30 seconds if unreachable.</p>
      <p>To replace a pending QR, tap DISCONNECT, then CREATE QR. Hiding either page, disconnecting or reaching one hour ends the session; scan a new QR to reconnect. CLOSE only closes this panel.</p>
      <p>GPS/Demo still supplies speed. Phone motion does not steer visuals yet. REPORT includes connection and sensor-quality summaries, never sensor streams or pairing keys.</p>
      </div>
    </div>
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
