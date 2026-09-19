import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { receiverOnboarding } from "./onboarding.js";

export function MotionIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 17h2M4 8l-2 4 2 4M20 8l2 4-2 4"/></svg>;
}

function Guide({ step }) {
  return <svg viewBox="0 0 140 76" fill="none" stroke="var(--ui-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {step === 1 ? <>
      <rect x="12" y="16" width="62" height="44" rx="3" stroke="var(--ui-chart-secondary)"/><path d="M22 26h12v12H22zM45 26h12v12H45zM22 47h12m11 0h12"/>
      <g stroke="var(--ui-accent-text)"><rect x="99" y="7" width="27" height="62" rx="4"/><path d="M109 61h7M89 24l-9 14 9 14M108 25h9v19h-9z"/></g>
    </> : step === 2 ? <>
      <rect x="38" y="5" width="48" height="66" rx="5" stroke="var(--ui-chart-secondary)"/><path d="M57 63h10"/>
      <g stroke="var(--ui-accent-text)"><rect x="47" y="17" width="30" height="32" rx="2"/><path d="m53 28 6 6 12-12M47 42h30M104 39l-7 10-7-10m7-16v26"/></g>
    </> : <>
      <path d="M19 65h101M60 57l-7 8h36l-7-8" stroke="var(--ui-chart-secondary)"/><rect x="56" y="6" width="30" height="48" rx="4"/>
      <g stroke="var(--ui-accent-text)"><circle cx="71" cy="30" r="8"/><path d="M71 16v6m0 16v6M57 30h6m16 0h6M109 16v28m-5-5 5 5 5-5"/></g>
    </>}
  </svg>;
}

export function MotionSteps({ active, compact = false }) {
  return <ol className={`motion-guide${compact ? " motion-guide-compact" : ""}`} aria-label="Connection steps">
    {["Scan", "Connect", "Zero"].map((title, i) => <li key={title} data-active={active === i} data-done={active > i} aria-current={active === i ? "step" : undefined}>
      <Guide step={i + 1}/><strong><span aria-label={active > i ? "Complete" : `Step ${i + 1}`}>{active > i ? "✓" : i + 1}</span> {title}</strong>
    </li>)}
  </ol>;
}

export function MotionNext({ guide }) {
  return <div className="motion-next" data-ready={guide.ready} role="status">
    <strong>{guide.ready && <span aria-hidden="true">✓ </span>}{guide.title}</strong><p>{guide.hint}</p>
  </div>;
}

export function MotionPanel({ snapshot, onStart, onStop, onClose }) {
  const [qr, setQr] = useState(null);
  const [qrError, setQrError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => {
    let active = true; setQr(null); setQrError(false);
    if (snapshot.qrUrl) {
      try {
        const { modules } = QRCode.create(snapshot.qrUrl, { errorCorrectionLevel: "M" });
        const cells = [];
        for (let y = 0; y < modules.size; y++) for (let x = 0; x < modules.size; x++) {
          if (modules.data[y * modules.size + x]) cells.push(`M${x + 4} ${y + 4}h1v1h-1z`);
        }
        if (active) setQr({ size: modules.size + 8, path: cells.join("") });
      } catch { if (active) setQrError(true); }
    }
    return () => { active = false; };
  }, [snapshot.qrUrl]);
  const guide = snapshot.state === "pairing" && !qr
    ? { active: 0, ready: false, restart: qrError, title: qrError ? "QR could not be drawn" : "Drawing QR…", hint: qrError ? "Retry to create a new QR." : "The connection is prepared. Please wait." }
    : receiverOnboarding(snapshot);
  return <div className="motion-panel-content">
    <header><div><small>PHONE COMPANION · EXPERIMENTAL</small><h2 id="motion-title">Connect your phone</h2></div><button data-dialog-initial-focus onClick={onClose}>CLOSE</button></header>
    <div className="motion-benefits"><p>Your phone, a motion sensor.</p><p>Acceleration. Rotation. Live.</p><p>See every move in TRACE.</p></div>
    <MotionSteps active={guide.active}/>
    <div className="motion-pairing"><div>
      <MotionNext guide={guide}/>
      <div className="motion-actions">
        {guide.ready ? <button className="motion-primary" onClick={onClose}>DONE</button> : guide.restart ? <button className="motion-primary motion-nudge" onClick={() => { onStop(); onStart(); }}>CREATE QR</button> : null}
        {["preparing", "pairing", "connecting", "connected", "stale"].includes(snapshot.state) && <button onClick={onStop}>{guide.ready ? "DISCONNECT" : "CANCEL"}</button>}
      </div>
      {qrError && <p role="alert">QR unavailable. Cancel, then create a new QR.</p>}
    </div>{qr ? <svg className="motion-qr motion-nudge" viewBox={`0 0 ${qr.size} ${qr.size}`} role="img" aria-label="Scan to pair this session with your phone" shapeRendering="crispEdges"><rect width={qr.size} height={qr.size} fill="#fff"/><path d={qr.path} fill="#000"/></svg> : <div className="motion-qr-placeholder" data-ready={guide.ready}><MotionIcon/><span>{guide.ready ? "✓ CONNECTED" : snapshot.state === "preparing" ? "PREPARING QR…" : "PHONE COMPANION"}</span></div>}</div>
    <div className="motion-connection-details"><button className="motion-connection-toggle" aria-expanded={detailsOpen} aria-controls="motion-connection-details-content" onClick={() => setDetailsOpen(open => !open)}>Connection details</button>
      <div id="motion-connection-details-content" hidden={!detailsOpen}>
      <MotionQuality summary={snapshot}/>
      <button onClick={() => { onStop(); onStart("direct"); }}>CREATE LOCAL WEBRTC QR</button>
      <p>HTTPS connects through sedicivalvole.app, even on different networks. Encrypted motion envelopes are held briefly; only your two screens have the key. A local connection is also available when the network allows it.</p>
      <p>To replace a pending QR, tap CANCEL, then CREATE QR. Hiding either page, disconnecting or reaching one hour ends the session; scan a new QR to reconnect. CLOSE only closes this panel.</p>
      <p>GPS/Demo still supplies speed. Fresh, zeroed phone rotation bends Aperture. Keep the phone fixed in its holder. REPORT includes connection and sensor-quality summaries, never sensor streams or pairing keys.</p>
      </div>
    </div>
  </div>;
}

export function MotionQuality({ summary = {} }) {
  return <dl className="motion-quality">
    <div><dt>Acceleration / Gyro</dt><dd>{summary.accelerometer ? "YES" : "—"} / {summary.gyroscope ? "YES" : "—"}<small>{summary.sensorState ?? "not connected"}</small></dd></div>
    <div><dt>Zero</dt><dd>{summary.tared ? "SET" : "REQUIRED"}</dd></div>
    <div><dt>Cadence</dt><dd>{summary.cadenceHz > 0 ? `${summary.cadenceHz.toFixed(1)} Hz` : "—"}</dd></div>
    <div><dt>Transport</dt><dd>{summary.transport === "https" ? "HTTPS · ENCRYPTED" : summary.transport === "direct" ? "LOCAL · WEBRTC" : "THIS DEVICE"}</dd></div>
    <div><dt>Round trip</dt><dd>{summary.received > 0 ? `${summary.rttMs?.toFixed(1)} ms` : "—"}</dd></div>
  </dl>;
}
