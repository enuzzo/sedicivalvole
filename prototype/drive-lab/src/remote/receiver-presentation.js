import QRCode from "qrcode";

// The white quiet zone is part of the QR viewBox, never decoration outside it.
export function createRemoteQr(url) {
  if (!url) return null;
  try {
    const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
    const cells = [];
    for (let y = 0; y < modules.size; y += 1) {
      for (let x = 0; x < modules.size; x += 1) {
        if (modules.data[y * modules.size + x]) cells.push(`M${x + 4} ${y + 4}h1v1h-1z`);
      }
    }
    return { size: modules.size + 8, path: cells.join("") };
  } catch {
    return null;
  }
}

export function remoteReceiverStatus(snapshot, { qrError = false } = {}) {
  if (qrError) return { label: "QR unavailable", hint: "Create a new QR and scan it with your phone.", tone: "error", retry: true };
  if (snapshot.state === "pairing") return { label: "Scan to connect", hint: "Open your phone camera, scan the QR, then open the link.", tone: "pairing" };
  if (snapshot.state === "connected") return snapshot.networkState === "online"
    ? { label: "Phone connected", hint: "Your remote is ready. Choose music, visuals or effects on your phone.", tone: "connected" }
    : { label: "Reconnecting", hint: "Keep both pages open. Pairing is saved; commands resume when the connection returns.", tone: "retrying" };
  if (snapshot.state === "connecting") return { label: "Connecting phone", hint: "Keep the phone page open while the connection completes.", tone: "connecting" };
  if (snapshot.state === "preparing") return { label: "Preparing QR", hint: "Your connection code will appear here.", tone: "preparing" };
  if (snapshot.state === "expired") return { label: "Pairing expired", hint: "Create a new QR and scan it again to reconnect.", tone: "error", retry: true };
  if (["error", "unavailable", "invalid_pairing"].includes(snapshot.state)) return { label: "Could not connect", hint: "Check the Internet connection on both devices, then try a new QR.", tone: "error", retry: true };
  return { label: snapshot.state === "closed" ? "Phone disconnected" : "Connect a phone", hint: "Create a QR to pair your passenger remote.", tone: "idle" };
}
