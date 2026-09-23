import { useMemo } from "react";
import { MotionIcon, MotionSteps, SetupMark } from "../motion/motion-ui.jsx";
import { createRemoteQr, remoteReceiverStatus } from "./receiver-presentation.js";
import "./receiver.css";

const STEPS = ["Scan", "Connect", "Ready"];

export function RemoteReceiverPanel({ snapshot, onStart, onStop, onClose }) {
  const qr = useMemo(() => createRemoteQr(snapshot.qrUrl), [snapshot.qrUrl]);
  const qrError = snapshot.state === "pairing" && qr === null;
  const status = remoteReceiverStatus(snapshot, { qrError });
  const pairing = snapshot.state === "pairing" && !qrError;
  const connected = snapshot.state === "connected";
  const connecting = snapshot.state === "connecting";
  const active = ["preparing", "pairing", "connecting", "connected"].includes(snapshot.state);
  const restart = () => { onStop(); onStart(); };

  return <div className="remote-receiver">
    <header className="remote-receiver-heading">
      <div><small>PASSENGER REMOTE</small><h2 id="remote-title">Connect your phone</h2></div>
      <button type="button" className="remote-receiver-close" data-dialog-initial-focus onClick={onClose} aria-label="Close remote pairing"><SetupMark kind="close"/>CLOSE</button>
    </header>
    <p className="remote-receiver-intro">Music, visuals and effects from your phone.<br/>GPS stays on this display.</p>
    <MotionSteps labels={STEPS} active={pairing ? 0 : connecting ? 1 : -1} done={[connecting || connected, connected, connected]}/>
    <div className="remote-receiver-body" data-pairing={pairing}>
      <div className="remote-receiver-instruction">
        <div className="remote-receiver-status" data-tone={status.tone} role="status" aria-live="polite">
          <strong><span aria-hidden="true"/>{status.label}</strong>
          <p>{status.hint}</p>
        </div>
        <div className="remote-receiver-actions">
          {status.retry ? <button type="button" className="remote-receiver-primary" onClick={restart}>CREATE NEW QR</button>
            : !active ? <button type="button" className="remote-receiver-primary" onClick={() => onStart()}>CREATE QR</button>
              : <button type="button" onClick={() => onStop("closed")}>{connected ? "DISCONNECT PHONE" : "CANCEL PAIRING"}</button>}
        </div>
        {pairing ? <p className="remote-receiver-note">No app or sensor permission needed.</p> : null}
      </div>
      {pairing ? <svg className="remote-receiver-qr" width="240" height="240" viewBox={`0 0 ${qr.size} ${qr.size}`} role="img" aria-label="Scan this QR with the passenger phone" shapeRendering="crispEdges"><rect width={qr.size} height={qr.size} fill="#fff"/><path d={qr.path} fill="#000"/></svg>
        : <div className="remote-receiver-symbol" data-tone={status.tone} aria-hidden="true"><MotionIcon state={connected ? "paired" : "pairing"}/></div>}
    </div>
    <details className="remote-receiver-details">
      <summary><span>Connection details</span><SetupMark kind="chevron"/></summary>
      <p>Keep both pages open and connected to the Internet. You can close this panel after pairing.</p>
      <p>The encrypted connection retries automatically. Pairing lasts up to one hour; an unused QR expires after three minutes. No motion sensors are requested.</p>
    </details>
  </div>;
}
