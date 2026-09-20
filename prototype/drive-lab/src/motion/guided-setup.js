// Product setup is stricter than a connected transport. No UI state renews data.
export const SETUP_LABELS = ['Sensors', 'Connect', 'Position', 'ZERO', 'Awake'];
export const ended = state => ['closed', 'expired', 'error', 'suspended', 'unavailable'].includes(state);
const result = (active, title, hint, action = null, extra = {}) => ({ active, title, hint, action, ready: false, ...extra });
export function phoneSetup({ sensor = {}, link = {}, hasPair = false, attempted = false } = {}) {
  if (hasPair && ended(link.state)) return result(1, 'Connection ended.', 'On the display, create a new QR. Scan it with iPhone Camera to restart setup.', null, { restart: true });
  const s = sensor.sensorState;
  if (s !== 'live') {
    if (s === 'requesting') return result(0, 'Allow your sensors.', 'On this iPhone, allow motion and orientation.', null);
    if (s === 'waiting' && sensor.waitingMs < 5000) return result(0, 'Waiting for sensors…', 'Keep this page visible while readings arrive.');
    return result(0, s === 'stale' ? 'Sensor data paused.' : s === 'denied' ? 'Sensor access needed.' : ['unavailable', 'error', 'incomplete'].includes(s) ? 'Check your sensors.' : 'Start with your sensors.',
      s === 'denied' ? 'On this iPhone, retry and tap Allow. If blocked, check Safari site permissions.' : ['unavailable', 'error', 'incomplete'].includes(s) ? 'Use iPhone Safari over HTTPS. Allow both motion and orientation.' : s === 'stale' ? 'Keep Safari visible. Retry sensors, then set ZERO again.' : 'On this iPhone, enable motion and orientation.', 'sensors');
  }
  if (!hasPair) return result(1, 'Connect to your display.', 'On the display, open Connect your phone. Scan its QR with iPhone Camera. Local sensors alone are not connected.');
  if (link.state !== 'connected') return result(1, attempted ? 'Connecting…' : 'Connect your phone.', attempted ? 'Keep both pages visible. On the display, wait for your phone.' : 'On this iPhone, tap CONNECT TO DISPLAY.', attempted ? null : 'connect');
  if (!sensor.mountSelected) return result(2, 'Place your phone.', 'While parked: secure it upright in the holder, top up, screen facing you, aligned with the car.', 'position');
  if (sensor.tareState === 'settling') return result(3, 'Keep your phone still.', 'Lift your finger. ZERO needs half a second of steady readings.');
  if (!sensor.tared || sensor.roadState !== 'calibrated') return result(3,
    sensor.roadState === 'unsupported-pose' ? 'Adjust the holder.' : sensor.roadState === 'moved' ? 'Your phone moved.' : 'Set your starting point.',
    sensor.roadState === 'unsupported-pose' ? 'Tilt the portrait phone back in its holder. Keep it still, then tap ZERO again.' : 'While parked: tap ZERO on this iPhone, lift your finger and keep still.', 'zero');
  if (!sensor.wakeLock || sensor.wakeState !== 'active') return result(4, sensor.wakeState === 'released' ? 'Screen lock was released.' : 'Keep your screen on.',
    sensor.wakeState === 'unsupported' ? 'This browser cannot keep the screen awake. Use a supported Safari version and restart setup.' : sensor.wakeState === 'denied' ? 'iOS did not allow screen wake. Keep Safari visible, check power-saving settings and retry.' : sensor.wakeState === 'error' ? 'Screen wake failed. Keep Safari visible and retry, or restart setup.' : 'On this iPhone, tap below. Keep Safari open.', sensor.wakeState === 'requesting' || sensor.wakeState === 'unsupported' ? null : 'awake');
  if (!link.receiverConfirmed) return result(4, 'Waiting for fresh receipt.', 'Phone connected. The display has not confirmed fresh motion. Keep both pages visible; restart setup if this persists.');
  return result(5, 'Motion is live.', 'Display receiving fresh motion.', null, { ready: true });
}
export function receiverSetup(s = {}) {
  if (s.state === 'idle' || ended(s.state)) return result(-1, s.state === 'idle' ? 'Connect your phone.' : 'Connection ended.', 'On this display, create a new QR. Scan it with iPhone Camera to restart setup.', 'qr', { restart: true });
  if (s.state === 'preparing') return result(-1, 'Preparing your QR…', 'Keep this display open.');
  if (s.state === 'pairing') return result(-1, 'Scan with iPhone Camera.', 'On iPhone, open the link and enable local sensors.');
  if (s.state === 'connecting') return result(1, 'Connecting your phone…', 'Keep both pages open. Follow the next action on iPhone.');
  if (s.state === 'stale' || s.dataFresh !== true) return result(1, 'Waiting for fresh phone data.', 'Check iPhone: keep Safari visible. Restart setup if data does not return. GPS remains in control.');
  if (s.sensorState !== 'live') return result(0, 'Enable sensors on iPhone.', 'On iPhone, tap ENABLE LOCAL SENSORS and allow motion and orientation.');
  if (!s.mountSelected) return result(2, 'Position your iPhone.', 'Secure the phone upright in its holder. Confirm placement on iPhone.');
  if (!s.tared || s.roadState !== 'calibrated' || s.tareState === 'settling' || !s.referenceReceived) return result(3, s.roadState === 'unsupported-pose' ? 'Check the phone holder.' : 'Set ZERO on iPhone.', 'While parked, keep the phone still and follow its ZERO instructions.');
  if (!s.wakeLock || s.wakeState !== 'active') return result(4, 'Keep iPhone awake.', s.wakeState === 'released' ? 'Screen wake was released. On iPhone, retry KEEP SCREEN AWAKE or restart setup.' : 'On iPhone, tap KEEP SCREEN AWAKE. Wait for confirmation.');
  if (!s.receiverConfirmed) return result(4, 'Checking fresh motion…', 'Waiting for confirmation on both screens. Restart setup if this persists.');
  return result(5, 'Connected · Screen awake', 'Fresh motion received.', null, { ready: true });
}
export function motionLiveStatus(s = {}, phone = false) {
  const connected = s.state === 'connected';
  const fresh = connected && s.sensorState === 'live' && s.tared === true && s.roadState === 'calibrated' && s.tareState !== 'settling' && s.receiverConfirmed === true && (phone || s.dataFresh === true && s.referenceReceived === true);
  return { connected, fresh, quality: fresh ? 'Fresh' : connected ? 'Delayed' : ended(s.state) ? 'Stopped' : 'Waiting',
    rtt: !phone && connected && s.dataFresh === true && s.received > 0 && Number.isFinite(s.rttMs) ? Math.round(s.rttMs) : null,
    title: !connected ? ended(s.state) ? 'Connection ended' : s.state === 'idle' ? 'Not connected' : s.state === 'pairing' ? 'Waiting for iPhone' : 'Connecting' : !fresh ? 'Connected · Data delayed' : !s.wakeLock ? 'Connected · Screen may sleep' : 'Connected · Screen awake',
    hint: !connected ? 'Restart setup with a new QR on the display.' : !fresh ? 'Keep iPhone Safari visible. Restart setup if data does not return.' : !s.wakeLock ? 'On iPhone, retry screen wake or restart setup.' : phone ? 'Display receiving fresh motion.' : 'Fresh motion received.' };
}

export function setupEvidence(s = {}, phone = false) {
  const current = !ended(s.state) && (phone || s.dataFresh === true);
  return [current && s.sensorState === 'live', s.state === 'connected', current && s.mountSelected === true,
    current && s.tared === true && s.roadState === 'calibrated' && s.tareState !== 'settling', current && s.wakeLock === true && s.wakeState === 'active'];
}
