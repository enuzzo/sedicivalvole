// Product setup is stricter than a connected transport. No UI state renews data.
export const SETUP_LABELS = ['Sensors', 'Connect', 'Position', 'ZERO', 'Awake'];
export const ended = state => ['closed', 'expired', 'error', 'suspended', 'unavailable'].includes(state);
const result = (active, title, hint, action = null, extra = {}) => ({ active, title, hint, action, ready: false, ...extra });
export function phoneSetup({ sensor = {}, link = {}, hasPair = false, attempted = false } = {}) {
  if (hasPair && ended(link.state)) return result(1, 'Connection ended.', 'On the display, create a new QR. Scan it with your phone camera to restart setup.', null, { restart: true });
  const s = sensor.sensorState;
  if (s !== 'live') {
    if (s === 'requesting') return result(0, 'Allow your sensors.', 'On your phone, allow motion and orientation.', null);
    if (s === 'waiting' && sensor.waitingMs < 5000) return result(0, 'Waiting for sensors…', 'Keep this page visible while readings arrive.');
    return result(0, s === 'stale' ? 'Sensor data paused.' : s === 'denied' ? 'Sensor access needed.' : ['unavailable', 'error', 'incomplete'].includes(s) ? 'Check your sensors.' : 'Start with your sensors.',
      s === 'denied' ? 'On your phone, retry and tap Allow. If blocked, check browser site permissions.' : ['unavailable', 'error', 'incomplete'].includes(s) ? 'Open this HTTPS page in a browser that provides motion and orientation. Check sensor permissions and retry.' : s === 'stale' ? 'Keep this page visible. Retry sensors, then set ZERO again.' : 'On your phone, enable motion and orientation.', 'sensors');
  }
  if (!hasPair) return result(1, 'Connect to your display.', 'On the display, open Connect your phone. Scan its QR with your phone camera. Local sensors alone are not connected.');
  if (link.state !== 'connected') return result(1, attempted ? 'Connecting…' : 'Connect your phone.', attempted ? 'Keep both pages visible. On the display, wait for your phone.' : 'On your phone, tap CONNECT TO DISPLAY.', attempted ? null : 'connect');
  if (!(sensor.placementConfirmed ?? sensor.mountSelected)) return result(2, 'Place your phone.', 'While parked: rest the phone securely, flat, upright or inclined, in portrait or landscape. ZERO will use this pose.', 'position');
  if (sensor.tareState === 'settling') return result(3, 'Keep your phone still.', 'Lift your finger. ZERO needs half a second of steady readings.');
  if (!sensor.tared) return result(3, 'Set your starting point.',
    sensor.tareState === 'hold-still' ? 'ZERO needs steady readings. Rest the phone, tap ZERO again and lift your finger.' : 'Any orientation works. Tap ZERO, lift your finger and keep the phone still.', 'zero');
  if (!sensor.wakeLock || sensor.wakeState !== 'active') return result(4, sensor.wakeState === 'released' ? 'Screen lock was released.' : 'Keep your screen on.',
    sensor.wakeState === 'unsupported' ? 'This browser cannot keep the screen awake. Try a browser with screen-wake support, then restart setup.' : sensor.wakeState === 'denied' ? 'Screen wake was not granted. Keep this page visible, check power-saving settings and retry.' : sensor.wakeState === 'error' ? 'Screen wake failed. Keep this page visible and retry, or restart setup.' : 'On your phone, tap below. Keep this page open.', sensor.wakeState === 'requesting' || sensor.wakeState === 'unsupported' ? null : 'awake');
  if (!link.receiverConfirmed) return result(4, 'Waiting for fresh receipt.', 'Phone connected. The display has not confirmed fresh motion. Keep both pages visible; restart setup if this persists.');
  return result(5, 'Motion is live.', 'Display receiving fresh motion.', null, { ready: true });
}
export function receiverSetup(s = {}, pendingStep = 1) {
  if (s.state === 'idle' || ended(s.state)) return result(-1, s.state === 'idle' ? 'Start with a QR.' : 'Connection ended.', 'On this display, create a new QR. Scan it with your phone camera to restart setup.', 'qr', { restart: true });
  if (s.state === 'preparing') return result(-1, 'Preparing your QR…', 'Keep this display open.');
  if (s.state === 'pairing') return result(-1, 'Scan to connect.', 'Scan this QR with your phone camera. Open the link, then enable local sensors.');
  if (s.state === 'connecting') return result(1, 'Connecting your phone…', 'Keep both pages open. Follow the next action on your phone.');
  if (s.state === 'stale' || s.dataFresh !== true) return result(pendingStep, 'Waiting for your phone.', 'Keep both pages visible. This step resumes when fresh status arrives. GPS remains in control.');
  if (s.sensorState !== 'live') return result(0, 'Enable sensors on your phone.', 'On your phone, tap ENABLE LOCAL SENSORS and allow motion and orientation.');
  if (!(s.placementConfirmed ?? s.mountSelected)) return result(2, 'Position your phone.', 'Rest the phone securely in any orientation. Confirm placement on your phone.');
  if (!s.tared || s.tareState === 'settling' || !s.referenceReceived) return result(3, 'Set ZERO on your phone.', 'Any orientation works. Tap ZERO, lift your finger and keep the phone still.');
  if (!s.wakeLock || s.wakeState !== 'active') return result(4, 'Keep your phone awake.', s.wakeState === 'released' ? 'Screen wake was released. On your phone, retry KEEP SCREEN AWAKE or restart setup.' : 'On your phone, tap KEEP SCREEN AWAKE. Wait for confirmation.');
  if (!s.receiverConfirmed) return result(4, 'Checking fresh motion…', 'Waiting for confirmation on both screens. Restart setup if this persists.');
  return result(5, 'Connected · Screen awake', 'Fresh motion received.', null, { ready: true });
}
export function motionLiveStatus(s = {}, phone = false) {
  const connected = s.state === 'connected';
  const fresh = connected && s.sensorState === 'live' && s.tared === true && s.tareState !== 'settling' && s.receiverConfirmed === true && (phone || s.dataFresh === true && s.referenceReceived === true);
  const setupPending = connected && (phone || s.dataFresh === true) && s.sensorState !== 'stale' && (!s.tared || s.tareState === 'settling');
  return { connected, fresh, quality: fresh ? 'Fresh' : setupPending ? 'Waiting' : connected ? 'Delayed' : ended(s.state) ? 'Stopped' : 'Waiting',
    rtt: !phone && connected && s.dataFresh === true && s.received > 0 && Number.isFinite(s.rttMs) ? Math.round(s.rttMs) : null,
    title: !connected ? ended(s.state) ? 'Connection ended' : s.state === 'idle' ? 'Not connected' : s.state === 'pairing' ? 'Waiting for your phone' : 'Connecting' : setupPending ? 'Connected · Finish setup' : !fresh ? 'Connected · Data delayed' : !s.wakeLock ? 'Connected · Screen may sleep' : 'Connected · Screen awake',
    hint: !connected ? ended(s.state) ? 'Restart setup with a new QR on the display.' : s.state === 'pairing' ? 'On your phone, scan this QR and follow setup.' : s.state === 'idle' ? 'Create a QR on the display to begin.' : 'Keep both pages visible while connecting.' : setupPending ? 'On your phone, finish sensors, placement and ZERO.' : !fresh ? 'Keep the phone page visible. Restart setup if data does not return.' : !s.wakeLock ? 'On your phone, retry screen wake or restart setup.' : phone ? 'Display receiving fresh motion.' : 'Fresh motion received.' };
}

export function setupEvidence(s = {}, phone = false) {
  const current = !ended(s.state) && (phone || s.dataFresh === true);
  return [current && s.sensorState === 'live', s.state === 'connected', current && (s.placementConfirmed ?? s.mountSelected) === true,
    current && s.tared === true && s.tareState !== 'settling', current && s.wakeLock === true && s.wakeState === 'active'];
}

// Completion belongs to the pairing attempt, not to a render or the latest
// transport deadline. Only an accepted status can revise an action's evidence.
// Current health/values still expire independently in the protocol.
export function createReceiverSetupProgress() {
  let steps = [false, false, false, false, false], pendingStep = 1, complete = false, received = -1;
  return {
    update(s) {
      if (["idle", "preparing", "pairing"].includes(s.state) || ended(s.state)) {
        steps = [false, false, false, false, false]; pendingStep = 1; complete = false; received = -1;
      } else if (s.dataFresh === true && s.received !== received) {
        received = s.received;
        steps = setupEvidence(s);
        const guide = receiverSetup(s, pendingStep);
        if (guide.active >= 0 && guide.active < 5) pendingStep = guide.active;
        if (guide.ready) complete = true;
      }
      return { setupProgress: { steps, pendingStep, complete } };
    },
  };
}
