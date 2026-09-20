import { createMotionPeer } from './channel.js';
import { createMotionRelay } from './relay.js';

const ENVELOPE = 'sv-motion-upgrade-1';
const validSignal = signal => signal && Number.isSafeInteger(signal.attempt) && signal.attempt > 0
  && ['offer', 'answer'].includes(signal.type) && typeof signal.sdp === 'string'
  && signal.sdp.startsWith('v=0') && signal.sdp.length <= 2600 && Object.keys(signal).length === 3;

// One admitted HTTPS owner, with an optional authenticated, host-only data path.
// SDP stays inside the QR-key ciphertext. No ICE/signaling provider is added.
export function createAdaptiveMotionPeer({ role, host = globalThis, now = () => performance.now(), getPhone = () => ({}),
  getPresentation, cipher, exchange, expiresAt = now() + 3600000, onEvent = () => {}, onSummary,
  directFactory = createMotionPeer, relayFactory = createMotionRelay }) {
  const capable = Boolean(host.isSecureContext && host.RTCPeerConnection);
  let closed = false, online = host.navigator?.onLine !== false, supported = false;
  let direct = null, selected = false, signal = null, attempt = 0, epoch = 0;
  let started = 0, retryAt = 0, progressAt = 0, confirmedAt = null, accepted = false;
  let opened = false;
  const owner = () => selected && direct ? direct : relay;
  function discard() {
    epoch += 1;
    const previous = direct; direct = null; selected = false; signal = null;
    accepted = false; confirmedAt = null; retryAt = now() + 10000;
    relay.setStandby(false);
    previous?.close();
  }
  function makeDirect() {
    const token = ++epoch;
    started = now(); progressAt = now(); confirmedAt = null; accepted = false;
    direct = directFactory({ role, host, now, getPhone, getPresentation,
      onSummary: summary => { if (!closed && token === epoch && selected) onSummary?.(summary); },
      onEvent: (type, detail) => {
        if (closed || token !== epoch) return;
        // Child failure only abandons the optional path, never QR/ZERO ownership.
        if (type === 'stop' || type === 'expired') discard();
        else if (type === 'connection' || type === 'ice') onEvent(type, detail);
      },
    });
    direct.setOnline?.(online);
    return { token, peer: direct };
  }
  async function offer() {
    const token = epoch + 1;
    try {
      const { peer } = makeDirect();
      const id = ++attempt;
      const sdp = await peer.offer();
      if (closed || token !== epoch) return;
      const next = { attempt: id, type: 'offer', sdp };
      if (!validSignal(next)) { discard(); return; }
      signal = next;
    } catch { if (!closed && token === epoch) discard(); }
  }
  async function receiveSignal(value) {
    if (closed || !online || !capable || !validSignal(value)) return;
    if (role === 'phone' && value.type === 'offer' && value.attempt > attempt) {
      discard(); attempt = value.attempt;
      const token = epoch + 1;
      try {
        const { peer } = makeDirect();
        const sdp = await peer.answer(value.sdp);
        if (closed || token !== epoch) return;
        const next = { attempt, type: 'answer', sdp };
        if (!validSignal(next)) { discard(); return; }
        signal = next;
      } catch { if (!closed && token === epoch) discard(); }
    } else if (role === 'receiver' && value.type === 'answer' && value.attempt === attempt && direct && !accepted) {
      accepted = true;
      const token = epoch;
      try { await direct.accept(value.sdp); }
      catch { if (!closed && token === epoch) discard(); }
    }
  }
  const relay = relayFactory({ role, host, now, cipher, exchange, expiresAt, getPresentation,
    getPhone: () => {
      const phone = getPhone();
      return { ...phone, summary: { ...phone.summary, supportsDirectUpgrade: capable } };
    },
    onSummary: summary => {
      supported = summary.supportsDirectUpgrade === true;
      if (!selected) onSummary?.(summary);
    },
    onEvent: (type, detail) => {
      if (closed) return;
      if (type === 'stop' || type === 'expired') { close(detail.state); return; }
      if (type === 'channel-open') { if (opened) return; opened = true; }
      onEvent(type, detail);
    },
    wrapPacket: motion => {
      if (!signal) return motion;
      const text = JSON.stringify({ v: ENVELOPE, motion, signal });
      // Never truncate SDP or expand the existing encrypted mailbox limits.
      return text.length <= 4096 ? text : motion;
    },
    unwrapPacket: text => {
      let packet;
      try { packet = JSON.parse(text); } catch { return text; }
      if (packet?.v !== ENVELOPE) return text;
      if (Object.keys(packet).length !== 3 || packet.motion !== null && typeof packet.motion !== 'string') return null;
      void receiveSignal(packet.signal).catch(() => { /* Unsupported direct path keeps HTTPS. */ });
      return packet.motion;
    },
  });
  const monitor = setInterval(() => {
    if (closed) return;
    if (now() >= expiresAt) { close('expired'); return; }
    if (direct) {
      const summary = direct.summary();
      // Sending polls/replies is not evidence of a bidirectional data path.
      // A one-way failure must wake BOTH relay loops, including the phone's.
      if (summary.receiverConfirmed === true) { confirmedAt = now(); progressAt = now(); }
      const usable = summary.state === 'connected' && summary.networkState !== 'offline'
        && summary.networkState !== 'retrying' && confirmedAt !== null && now() - confirmedAt <= 1000;
      // Transport selection is independent of one sample/receipt expiring.
      selected = usable;
      relay.setStandby(usable);
      if (usable) signal = null;
      const waitingForZero = summary.state === 'connected'
        && (role === 'phone' ? getPhone().summary?.tared !== true : relay.summary().tared !== true);
      if (!usable && !waitingForZero && now() - started > 20000 && now() - progressAt > 1000) discard();
    } else if (role === 'receiver' && capable && supported && online && now() >= retryAt) void offer();
  }, 100);
  function close(reason = 'closed') {
    if (closed) return;
    closed = true; clearInterval(monitor); discard(); relay.close(reason);
    onEvent(reason === 'expired' ? 'expired' : 'stop', { state: reason, transport: 'https' });
  }
  return {
    close,
    setOnline(value) {
      if (closed) return;
      online = value; relay.setOnline(value); direct?.setOnline?.(value);
      if (!value) { selected = false; relay.setStandby(false); }
      else retryAt = 0;
    },
    sample: () => closed || now() >= expiresAt ? null : owner().sample(),
    presentation: () => closed ? null : owner().presentation(),
    summary() {
      if (!closed && now() >= expiresAt) close('expired');
      const summary = owner().summary();
      return { ...summary, transport: selected ? 'direct' : 'https',
        // HTTP admission remains the lifetime authority even after an upgrade.
        state: closed ? 'closed' : opened ? 'connected' : summary.state };
    },
  };
}
