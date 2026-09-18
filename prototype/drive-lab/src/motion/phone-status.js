// Derive guidance from current evidence, so old success copy cannot survive a gap.
export function phoneStatus({ link = {}, sensor = {}, hasPair = false, attempted = false } = {}) {
  const terminal = ["closed", "expired", "error", "suspended", "unavailable"].includes(link.state);
  const connected = link.state === "connected";
  const canJoin = hasPair && !attempted && !terminal;
  const running = ["waiting", "live", "incomplete", "stale", "requesting"].includes(sensor.sensorState);
  const action = canJoin ? "ENABLE & CONNECT" : terminal || !hasPair ? "ENABLE LOCAL SENSORS" : "RETRY SENSORS";
  let instruction = "Place the phone securely. Enable sensors, allow access, then tap ZERO while still.";
  if (sensor.sensorState === "requesting") instruction = "Allow both motion and orientation prompts. Use STOP to cancel this attempt.";
  else if (sensor.sensorState === "denied") instruction = `Sensor access was denied or only partly granted. Tap ${action}; if denied again, review Safari site permissions.`;
  else if (sensor.sensorState === "unavailable") instruction = "Motion or orientation is unavailable here. Open this page in iPhone Safari over HTTPS.";
  else if (sensor.sensorState === "error") instruction = "Sensors could not start. Retry sensors explicitly or use STOP.";
  else if (sensor.sensorState === "incomplete") instruction = "Sensor values are incomplete. ZERO is unavailable until motion and orientation arrive. Check Safari permissions; use STOP to retry.";
  else if (sensor.sensorState === "stale") instruction = "Sensor data stopped. Keep Safari visible. Wait for fresh readings and set ZERO again; use STOP if data does not return.";
  else if (sensor.sensorState === "waiting") instruction = sensor.waitingMs > 5000
    ? "No sensor readings yet. Check Safari motion permissions. Use STOP, then retry sensors; this browser may not supply them."
    : "Waiting for motion and orientation readings. Keep Safari visible.";
  else if (sensor.tareState === "hold-still") instruction = sensor.tared
    ? "New ZERO rejected: keep still and try again. Readings still use your previous reference."
    : "Hold still briefly, then tap ZERO again.";
  else if (sensor.tareState === "unavailable") instruction = sensor.tared
    ? "New ZERO needs complete, fresh data. Your previous reference has not changed."
    : "ZERO needs complete, fresh sensor readings. Enable sensors and allow motion and orientation first.";
  else if (sensor.tared) instruction = "Zero set. X/Y/Z refer to this pose. Recalibrate after moving the phone in its holder.";
  else if (sensor.sensorState === "live") instruction = "Fresh sensor readings available. Keep the phone still and tap ZERO.";
  const connection = !hasPair ? "Local only · not connected to Tesla"
    : terminal ? "Connection ended · new QR required"
    : connected ? "Connected to Tesla"
    : canJoin ? "QR ready · not connected yet"
    : hasPair && attempted ? "Connecting to Tesla…"
    : "Local only · not connected to Tesla";
  const recovery = link.state === "unavailable" && hasPair
    ? "Direct connections are unavailable in this browser. Open a new QR in a browser with WebRTC support. Local sensing alone cannot connect to Tesla."
    : terminal && hasPair
    ? link.state === "expired" ? "QR expired, already used, or connection timed out. On Tesla tap CREATE QR and scan the new code."
      : "On Tesla tap CREATE QR and scan the new code. Keep both pages visible and use a network that allows a direct connection."
    : !hasPair ? "For Tesla: open its phone icon, tap CREATE QR and scan with iPhone Camera."
    : connected ? "Check Tesla also shows fresh sensors and Zero SET. GPS/Demo still supplies speed."
    : canJoin ? "Tap ENABLE & CONNECT and allow motion and orientation. Keep both pages visible."
    : "Keep both pages visible. Connection setup lasts at most 30 seconds. STOP cancels this attempt.";
  return { connection, recovery, instruction, connected, canJoin, running, action };
}
