import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SETUP_LABELS, receiverSetup, motionLiveStatus, setupEvidence, ended } from "./guided-setup.js";

export function MotionIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 17h2M4 8l-2 4 2 4M20 8l2 4-2 4"/></svg>;
}

export function SetupMark({ kind }) {
  return <svg className="motion-setup-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={kind === "check" ? "m6 12 4 4 8-8" : kind === "close" ? "m6 6 12 12M18 6 6 18" : "m6 9 6 6 6-6"}/></svg>;
}

export function SetupDisclosure({ expanded, onClick }) {
  return <button className="motion-setup-disclosure" aria-expanded={expanded} onClick={onClick}><span className="motion-setup-complete"><SetupMark kind="check"/>Setup complete</span><span>{expanded ? "Hide steps" : "Review steps"}<SetupMark kind="chevron"/></span></button>;
}

export function MotionSteps({ active, done = [], labels = SETUP_LABELS }) {
  return <ol className="motion-setup-steps" aria-label="Setup progress">
    {labels.map((title, i) => <li key={title} data-active={active === i} data-done={done[i] === true} aria-current={active === i ? "step" : undefined}>
      <span className="motion-step-number" aria-label={done[i] ? `${title} complete` : `Step ${i + 1}`}>{done[i] ? <SetupMark kind="check"/> : i + 1}</span><span>{title}</span>
    </li>)}
  </ol>;
}
export function MotionReadings({ summary, values, phone = false }) {
  const live = motionLiveStatus(summary, phone);
  const road = live.fresh ? values?.road : null;
  const number = (n, digits) => Number.isFinite(n) ? `${n > 0 ? "+" : ""}${n.toFixed(digits)}` : "—";
  return <section className="motion-live-readings" aria-label="Live phone telemetry">
    <div className="motion-live-row"><span className="motion-reading-icon motion-reading-acceleration" aria-hidden="true"/><span>Acceleration<small>Forward / braking</small></span><strong>{number(road?.longitudinalMps2, 2)} <small>m/s²</small></strong></div>
    <div className="motion-live-row"><span className="motion-reading-icon motion-reading-rotation" aria-hidden="true"/><span>Rotation<small>Turn rate</small></span><strong>{number(road?.yawRate, 1)} <small>°/s</small></strong></div>
    <dl className="motion-live-metrics">{!phone && <div><dt>ROUND TRIP</dt><dd>{live.rtt ?? "—"} <small>ms</small></dd></div>}<div><dt>DATA QUALITY</dt><dd>{live.quality}</dd></div>{phone && <div><dt>SCREEN</dt><dd>{summary.wakeLock ? "Awake" : "May sleep"}</dd></div>}</dl>
  </section>;
}
export function MotionLiveStatus({ summary, phone = false, children }) {
  const live = motionLiveStatus(summary, phone);
  return <div className="motion-live-status" data-good={live.fresh && summary.wakeLock === true} role="status"><div><strong>{live.title}</strong><p>{live.hint}</p></div>{children}</div>;
}

export function MotionNext({ guide }) {
  return <div className="motion-next" data-ready={guide.ready} role="status">
    <strong>{guide.ready && <span aria-hidden="true">✓ </span>}{guide.title}</strong><p>{guide.hint}</p>
  </div>;
}

export function MotionPanel({ snapshot, onStart, onStop, onClose, responseLabel, children }) {
  const [qr, setQr] = useState(null), [qrError, setQrError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false), [review, setReview] = useState(false);
  const [completed, setCompleted] = useState(false);
  const guide = receiverSetup(snapshot);
  useEffect(() => {
    if (guide.ready && !completed) { setCompleted(true); setReview(false); }
    else if (["idle", "preparing", "pairing"].includes(snapshot.state) || ended(snapshot.state)) setCompleted(false);
  }, [guide.ready, snapshot.state, completed]);
  useEffect(() => {
    setQr(null); setQrError(false);
    if (snapshot.qrUrl) {
      try {
        const { modules } = QRCode.create(snapshot.qrUrl, { errorCorrectionLevel: "M" });
        const cells = [];
        for (let y = 0; y < modules.size; y++) for (let x = 0; x < modules.size; x++) {
          if (modules.data[y * modules.size + x]) cells.push(`M${x + 4} ${y + 4}h1v1h-1z`);
        }
        setQr({ size: modules.size + 8, path: cells.join("") });
      } catch { setQrError(true); }
    }
  }, [snapshot.qrUrl]);
  const needsAction = snapshot.dataFresh === true && (!snapshot.mountSelected || !snapshot.tared || snapshot.roadState !== "calibrated" || !snapshot.wakeLock);
  const showSetup = !completed || review || needsAction;
  const restart = () => { setCompleted(false); setReview(false); onStop(); onStart(); };
  return <div className="motion-panel-content motion-guided-panel">
    <header><h2 id="motion-title">Connect your phone</h2><button className="motion-close" data-dialog-initial-focus onClick={onClose}><SetupMark kind="close"/>CLOSE</button></header>
    <p className="motion-setup-intro">GPS for speed. Phone for acceleration + rotation.</p>
    {completed && !needsAction && <SetupDisclosure expanded={review} onClick={() => setReview(v => !v)}/>}
    {showSetup ? <>
      <MotionSteps active={guide.active} done={setupEvidence(snapshot)}/>
      <div className="motion-setup-pairing">
        <div className="motion-setup-instruction"><MotionNext guide={guide}/>
          {(guide.restart || qrError) && <button className="motion-primary" onClick={restart}>CREATE NEW QR</button>}
        </div>
        {qr && snapshot.state === "pairing" ? <svg className="motion-qr" viewBox={`0 0 ${qr.size} ${qr.size}`} role="img" aria-label="Scan to pair this session with your phone" shapeRendering="crispEdges"><rect width={qr.size} height={qr.size} fill="#fff"/><path d={qr.path} fill="#000"/></svg>
          : (!completed || needsAction) && <img className="motion-setup-art" src={`/brand/phone-guide/${guide.active < 1 ? "scan" : guide.active < 3 ? "connect" : guide.active === 3 ? "zero" : "awake"}.png`} alt=""/>}
      </div>
      {qrError && <p role="alert">QR could not be drawn. Create a new QR.</p>}
      {review && <ol className="motion-review-list"><li>On your phone: enable local sensors and allow access.</li><li>On your phone: tap CONNECT TO DISPLAY.</li><li>While parked: secure the phone, then confirm placement.</li><li>On your phone: tap ZERO and keep still.</li><li>On your phone: tap KEEP SCREEN AWAKE and wait for confirmation.</li></ol>}
    </> : <><h3 className="motion-readings-label">LIVE FROM YOUR PHONE</h3><MotionReadings summary={snapshot} values={snapshot.values}/></>}
    <MotionLiveStatus summary={snapshot}>{!["idle", "closed", "expired"].includes(snapshot.state) && <button onClick={onStop}>{completed ? "DISCONNECT" : "CANCEL"}</button>}</MotionLiveStatus>
    {completed && !guide.ready && <button className="motion-restart" onClick={restart}>RESTART SETUP · NEW QR</button>}
    <details className="motion-connection-details" open={detailsOpen} onToggle={e => setDetailsOpen(e.currentTarget.open)}><summary>Connection details<SetupMark kind="chevron"/></summary>
      {detailsOpen && <><MotionSourceStatus label={responseLabel}/><MotionQuality summary={snapshot}/><button onClick={() => { onStop(); onStart("direct"); }}>CREATE LOCAL WEBRTC QR</button><p>Round trip measures the request and reply, not one-way latency. Data quality follows fresh, calibrated samples confirmed by both screens. Delayed samples are excluded; GPS remains the speed source.</p><p>Keep both pages visible. Hiding a page ends this session; create a new QR to restart. CLOSE only closes this drawer. Encrypted motion uses the same-origin HTTPS relay. Reports contain quality summaries, never sensor streams or pairing keys.</p>{children}</>}
    </details>
  </div>;
}

export function MotionQuality({ summary = {} }) {
  return <dl className="motion-quality">
    <div><dt>Connection</dt><dd>{summary.state === "connected" ? "CONNECTED" : (summary.state ?? "idle").toUpperCase()}</dd></div>
    {summary.role === "receiver" && <div><dt>Sensor data</dt><dd>{summary.dataFresh ? "FRESH" : "WAITING / DELAYED"}<small>Only fresh calibrated motion can control response.</small></dd></div>}
    <div><dt>Acceleration / Gyro</dt><dd>{summary.accelerometer ? "YES" : "—"} / {summary.gyroscope ? "YES" : "—"}<small>{summary.sensorState ?? "not connected"}</small></dd></div>
    <div><dt>Zero</dt><dd>{summary.tared ? "SET" : "REQUIRED"}</dd></div>
    <div><dt>Cadence</dt><dd>{summary.cadenceHz > 0 ? `${summary.cadenceHz.toFixed(1)} Hz` : "—"}</dd></div>
    <div><dt>Transport</dt><dd>{summary.transport === "https" ? "HTTPS · ENCRYPTED" : summary.transport === "direct" ? "LOCAL · WEBRTC" : "THIS DEVICE"}</dd></div>
    <div><dt>Round trip</dt><dd>{summary.received > 0 ? `${summary.rttMs?.toFixed(1)} ms` : "—"}</dd></div>
  </dl>;
}

export function MountChoice({ selected, onChange }) {
  return <label className="motion-mount-choice"><input type="checkbox" checked={selected === true} onChange={event => onChange(event.target.checked)}/><span>Portrait in car holder<small>Top up · screen toward cabin · aligned straight ahead. Park, then ZERO. Uncheck when handheld.</small></span></label>;
}
export function MotionSourceStatus({ label }) {
  return <p className="local-source-status motion-effective-source" role="status">{label}</p>;
}
