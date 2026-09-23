import { useEffect, useState } from "react";
import QRCode from "qrcode";

function remoteStatus(snapshot) {
  if (snapshot.state === "pairing") return { label: "Scan to pair", tone: "pairing" };
  if (snapshot.state === "connected") return snapshot.networkState === "online"
    ? { label: "Remote connected", tone: "connected" }
    : { label: "Reconnecting", tone: "retrying" };
  if (snapshot.state === "connecting") return { label: "Connecting remote", tone: "connecting" };
  if (snapshot.state === "preparing") return { label: "Preparing QR", tone: "preparing" };
  if (snapshot.state === "expired") return { label: "Pairing expired", tone: "error" };
  return { label: "No remote paired", tone: "idle" };
}

export function RemoteReceiverPanel({ snapshot, onStart, onStop, onClose }) {
  const [qr, setQr] = useState(null);
  const [qrError, setQrError] = useState(false);
  const status = remoteStatus(snapshot);
  useEffect(() => {
    setQr(null);
    setQrError(false);
    if (!snapshot.qrUrl) return;
    try {
      const { modules } = QRCode.create(snapshot.qrUrl, { errorCorrectionLevel: "M" });
      const cells = [];
      for (let y = 0; y < modules.size; y += 1) {
        for (let x = 0; x < modules.size; x += 1) {
          if (modules.data[y * modules.size + x]) cells.push(`M${x + 4} ${y + 4}h1v1h-1z`);
        }
      }
      setQr({ size: modules.size + 8, path: cells.join("") });
    } catch {
      setQrError(true);
    }
  }, [snapshot.qrUrl]);

  const restart = () => { onStop(); onStart(); };
  return <div className="remote-panel-content">
    <header className="remote-panel-heading">
      <div><small>PASSENGER REMOTE</small><h2 id="remote-title">Connect a phone</h2></div>
      <button type="button" className="remote-close" data-dialog-initial-focus onClick={onClose} aria-label="Close remote pairing">CLOSE</button>
    </header>
    <p className="remote-panel-intro">One scan pairs a phone to this display. The phone controls music, mode, visual and effects; GPS stays on the car screen.</p>
    <div className="remote-status" data-tone={status.tone} role="status"><span aria-hidden="true"/><strong>{status.label}</strong><small>{snapshot.networkState === "retrying" ? "Pairing is kept while the network recovers." : snapshot.state === "connected" ? "Commands are ready." : ""}</small></div>
    {qr && snapshot.state === "pairing" ? <div className="remote-qr-wrap"><svg className="remote-qr" viewBox={`0 0 ${qr.size} ${qr.size}`} role="img" aria-label="Scan this QR with the passenger phone" shapeRendering="crispEdges"><rect width={qr.size} height={qr.size} fill="#fff"/><path d={qr.path} fill="#000"/></svg><p>Open the link after scanning. No sensor permission is needed.</p></div> : null}
    {qrError && <p className="remote-error" role="alert">The QR could not be drawn. Create a new one.</p>}
    <div className="remote-panel-actions">
      {snapshot.state === "idle" || snapshot.state === "closed" || snapshot.state === "expired" || snapshot.state === "error" ? <button type="button" className="remote-primary" onClick={() => onStart()}>CREATE QR</button> : null}
      {snapshot.state === "pairing" || snapshot.state === "connecting" || snapshot.state === "connected" ? <button type="button" onClick={() => onStop("closed")}>STOP PAIRING</button> : null}
      {snapshot.state === "expired" || snapshot.state === "error" ? <button type="button" onClick={restart}>NEW QR</button> : null}
    </div>
    <details className="remote-details">
      <summary>Connection details</summary>
      <p>Transport: encrypted HTTPS mailbox. Browser certificate validation stays strict; the pairing token is scoped to this same-origin endpoint. Network interruptions retry until the one-hour lease expires.</p>
      <p>No accelerometer, gyroscope, compass permission or high-frequency samples are requested by the companion.</p>
    </details>
  </div>;
}
