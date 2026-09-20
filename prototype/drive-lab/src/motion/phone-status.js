// Derive guidance from current evidence, so old success copy cannot survive a gap.
export function phoneStatus({ link = {}, sensor = {}, hasPair = false, attempted = false } = {}) {
  const terminal = ["closed", "expired", "error", "suspended", "unavailable"].includes(link.state);
  const connected = link.state === "connected";
  const canJoin = hasPair && !attempted && !terminal;
  const running = ["waiting", "live", "incomplete", "stale", "requesting"].includes(sensor.sensorState);
  const action = canJoin ? "ENABLE & CONNECT" : terminal || !hasPair ? "ENABLE LOCAL SENSORS" : "RETRY SENSORS";
  let instruction = "Place the phone securely. Enable sensors, allow access, then tap ZERO while still.";
  if (sensor.sensorState === "requesting") instruction = "Allow both motion and orientation prompts. Use STOP to cancel this attempt.";
  else if (sensor.sensorState === "denied") instruction = `Sensor access was denied or only partly granted. Tap ${action}; if denied again, review browser site permissions.`;
  else if (sensor.sensorState === "unavailable") instruction = "Motion or orientation is unavailable here. Open this page in your phone browser over HTTPS.";
  else if (sensor.sensorState === "error") instruction = "Sensors could not start. Retry sensors explicitly or use STOP.";
  else if (sensor.sensorState === "incomplete") instruction = "Sensor values are incomplete. ZERO is unavailable until motion and orientation arrive. Check browser permissions; use STOP to retry.";
  else if (sensor.sensorState === "stale") instruction = "Sensor data stopped. Keep this page visible. Wait for fresh readings and set ZERO again; use STOP if data does not return.";
  else if (sensor.sensorState === "waiting") instruction = sensor.waitingMs > 5000
    ? "No sensor readings yet. Check browser motion permissions. Use STOP, then retry sensors; this browser may not supply them."
    : "Waiting for motion and orientation readings. Keep this page visible.";
  else if (sensor.tareState === "settling") instruction = sensor.tareReason === "gravity"
    ? "ZERO is waiting: gravity reading is outside range. Keep still; this attempt ends after 8 seconds."
    : "Keep still. ZERO captures after ½ second of steady readings; up to 8 seconds. " + (sensor.tared ? "Readings still use your previous reference." : "Then move the phone to see the trace.");
  else if (sensor.tareState === "hold-still") instruction = sensor.tared
    ? "New ZERO rejected: keep still and try again. Readings still use your previous reference."
    : sensor.tareReason === "gravity" ? "ZERO not set: gravity reading is outside range. Stop and retry sensors."
    : "ZERO not set: the phone did not settle. Rest it on a surface, tap ZERO and lift your finger.";
  else if (sensor.tareState === "unavailable") instruction = sensor.tared
    ? "New ZERO needs complete, fresh data. Your previous reference has not changed."
    : "ZERO needs complete, fresh sensor readings. Enable sensors and allow motion and orientation first.";
  else if (sensor.tared) instruction = "Zero set. X/Y/Z refer to this pose. Recalibrate after moving the phone in its holder.";
  else if (sensor.sensorState === "live") instruction = "Sensors are live. The graph starts after ZERO: rest the phone, tap ZERO, then lift your finger.";
  const connection = !hasPair ? "Local only · not connected to Tesla"
    : terminal ? "Connection ended · new QR required"
    : connected ? "Connected to Tesla"
    : canJoin ? "QR ready · not connected yet"
    : hasPair && attempted ? "Connecting to Tesla…"
    : "Local only · not connected to Tesla";
  const recovery = link.state === "unavailable" && hasPair
    ? "This connection is unavailable in this browser. On the display, tap CREATE QR for HTTPS and open it in your phone browser. Local sensing alone cannot connect to Tesla."
    : terminal && hasPair
    ? link.state === "expired" ? "QR expired, already used, or connection timed out. On Tesla tap CREATE QR and scan the new code."
      : "On Tesla tap CREATE QR and scan the new code. Keep both pages visible with Internet access; the default QR uses encrypted HTTPS."
    : !hasPair ? "For Tesla: open its phone icon and scan the QR with your phone camera."
    : connected ? "Check Tesla also shows fresh sensors and Zero SET. GPS/Demo still supplies speed."
    : canJoin ? "Tap ENABLE & CONNECT and allow motion and orientation. Keep both pages visible."
    : "Keep both pages visible. Connection setup lasts at most 30 seconds. STOP cancels this attempt.";
  return { connection, recovery, instruction, connected, canJoin, running, action };
}
