const terminal = state => ["closed", "expired", "error", "suspended", "unavailable"].includes(state);
const step = (active, title, hint, extra = {}) => ({ active, title, hint, ready: false, ...extra });

export function receiverOnboarding(s = {}) {
  if (s.state === "error" && s.stage === "offer") return step(0, "Connection could not be prepared", s.failureReason === "ice_no_candidates" ? "This browser supplied no direct network route. Try connecting both devices to the same Wi-Fi, then retry." : "The browser could not prepare the phone connection. Retry to create a QR.", { restart: true });
  if (s.state === "unavailable") return step(0, "This browser cannot connect", "Use an HTTPS browser with secure connection support.");
  if (terminal(s.state) || s.state === "idle") return step(0, s.state === "idle" ? "Connect your phone" : "Reconnect your phone", "Create a new QR, then scan it.", { restart: s.state !== "unavailable" });
  if (s.state === "preparing") return step(0, "Getting QR ready…", "Keep both pages open.");
  if (s.state === "pairing") return step(0, "Scan with your phone camera", s.transport === "direct" ? "Same Wi-Fi · keep both pages open." : "Internet on both devices · keep both pages open.");
  if (s.state === "connecting") return step(1, "Connecting…", "On your phone, allow sensor access.");
  if (s.state === "stale" || s.sensorState === "stale") return step(1, "Phone data paused", s.state === "connected"
    ? "Phone connected. Waiting for fresh sensor data; GPS remains in control. Keep both pages open."
    : "Check the phone. Keep its page open.", { restart: s.state !== "connected" });
  if (s.sensorState !== "live") return step(1, "Allow sensors on your phone", "Tap Allow when your phone asks.");
  if (s.tareState === "settling") return step(2, "Keep the phone still", "ZERO is being set…");
  if (!s.tared || !s.referenceReceived) return step(2, "On your phone: tap ZERO", "Select the portrait holder for road response. Park, then ZERO.");
  if (!s.receiverConfirmed) return step(2, s.supportsUiContext ? "Checking both screens…" : "Receiving phone motion", s.supportsUiContext ? "Your ZERO has arrived." : "Reconnect with a new QR for the two-screen check.");
  return step(3, "Ready on both screens", "TRACE is live. Check the display for road response.", { ready: true });
}

export function phoneOnboarding({ link = {}, sensor = {}, hasPair = false, localOnly = false } = {}) {
  if (hasPair && terminal(link.state) && !localOnly) return step(0, "Scan a new QR", "On the display: open the phone menu → CREATE QR.");
  if (sensor.sensorState === "requesting") return step(1, "Tap Allow", "Allow motion and orientation.");
  if (sensor.sensorState === "denied") return step(1, "Sensor access needed", "Retry and tap Allow. Check site permissions if blocked.");
  if (["error", "unavailable"].includes(sensor.sensorState)) return step(1, "Sensors unavailable", "Retry in your phone browser over HTTPS.");
  if (sensor.sensorState === "incomplete") return step(1, "Some sensors are missing", "Tap RETRY SENSORS, then allow access.");
  if (sensor.sensorState === "stale") return step(1, "Sensor data paused", "Keep this page open. Set ZERO when readings return.");
  if (sensor.sensorState === "waiting") return step(1, "Waiting for sensors…", sensor.waitingMs > 5000 ? "No readings yet. Tap RETRY SENSORS." : "Keep this page open.");
  if (sensor.sensorState !== "live") return step(hasPair ? 1 : 0, hasPair ? "Connect & allow sensors" : "Your phone, a motion sensor", hasPair ? "One tap below. Then tap Allow." : "Scan the display’s QR to connect, or try sensors here.");
  if (hasPair && link.state !== "connected" && !localOnly) return step(1, "Connecting to the display…", "Keep both pages open. Sensors are ready.");
  if (sensor.tareState === "settling") return step(2, "Keep still…", "Lift your finger. ZERO sets after ½ second of stillness.");
  if (["hold-still", "unavailable"].includes(sensor.tareState)) return step(2, "Try ZERO again", sensor.tared ? "Previous ZERO kept. Rest the phone and retry." : sensor.tareReason === "gravity" ? "Gravity reading unavailable. Stop, then retry sensors." : "Rest the phone. Tap ZERO, then lift your finger.");
  if (!sensor.tared) return step(2, localOnly ? "Local sensors · set ZERO" : "Set your starting position", "Rest the phone. Tap ZERO below the graph.");
  if (!hasPair || localOnly) return step(3, "ZERO set · local only", hasPair ? "Scan a new QR to reconnect to the display." : "TRACE is live. Check the display for road response.", { ready: true });
  if (!link.receiverConfirmed) return step(2, "ZERO set · checking display…", "Keep both pages open.");
  return step(3, "Ready on both screens", "TRACE is live. Check the display for road response.", { ready: true });
}
