import { createMotionProtocol } from './channel.js';

// The QR fragment carries this key; only encrypted, latest-only envelopes reach PHP.
export function createRelayKey(crypto = globalThis.crypto) {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
}
export async function createMotionCipher(secret, crypto = globalThis.crypto) {
  if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error('invalid_pairing');
  const bytes = Uint8Array.from(secret.match(/../g), n => parseInt(n, 16));
  const key = await crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
  const encoder = new TextEncoder(), decoder = new TextDecoder();
  return {
    async seal(text, role) {
      if (text.length > 4096) throw new Error('invalid_packet');
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const body = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(role) }, key, encoder.encode(text));
      return btoa(String.fromCharCode(...iv, ...new Uint8Array(body)));
    },
    async open(packet, role) {
      if (typeof packet !== 'string' || packet.length > 6144) throw new Error('invalid_packet');
      const bytes = Uint8Array.from(atob(packet), c => c.charCodeAt(0));
      return decoder.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: encoder.encode(role) }, key, bytes.slice(12)));
    },
  };
}

export function createMotionRelay({ role, host = globalThis, cipher, exchange, now = () => performance.now(), getPhone, getPresentation, onEvent = () => {}, onSummary }) {
  // Serial HTTP requests and a bounded challenge window. Transport recovery does
  // not extend the 250 ms sample deadline or the original one-hour session lease.
  const protocol = createMotionProtocol({ role, now, getPhone, getPresentation, onSummary, maxPending: 8 });
  let closed = false, timer = null, opened = false, lastSequence = 0, outgoing = null, outgoingAt = 0;
  let failures = 0, lastReceipt = null, relayBackoffs = 0, consecutiveBackoffs = 0;
  let online = host.navigator?.onLine !== false, running = false, epoch = 0, wakeRequested = false;
  const started = now();
  const opposite = role === 'receiver' ? 'phone' : 'receiver';
  const receiptAge = () => Math.max(0, now() - (lastReceipt ?? started));
  const networkState = () => !online ? 'offline' : failures || consecutiveBackoffs || receiptAge() > 1000 ? 'retrying' : 'online';
  function schedule(delay) { clearTimeout(timer); if (!closed) timer = setTimeout(tick, delay); }
  async function tick() {
    if (closed || running) return;
    if (now() - started >= 3600000) { close('expired'); return; }
    if (!online) { schedule(1000); return; }
    running = true;
    const cycleStarted = now(), attempt = epoch;
    let exchanged = false, backoff = 0;
    try {
      if (role === 'receiver') outgoing = protocol.poll();
      else if (now() - outgoingAt > 250) outgoing = null;
      const packet = outgoing ? await cipher.seal(outgoing, role) : null;
      if (closed || attempt !== epoch) return;
      const result = await exchange(packet);
      if (closed || attempt !== epoch) return;
      outgoing = null;
      failures = 0; consecutiveBackoffs = 0;
      if (Number.isSafeInteger(result.sequence) && result.sequence > lastSequence && typeof result.packet === 'string') {
        const text = await cipher.open(result.packet, opposite);
        if (closed || attempt !== epoch) return;
        exchanged = true;
        lastSequence = result.sequence;
        outgoing = protocol.receive(text); outgoingAt = now();
        lastReceipt = now();
        if (!opened) { opened = true; onEvent('channel-open', { state: 'connected', transport: 'https' }); }
      }
    } catch (error) {
      if (closed || attempt !== epoch) return;
      if ([400, 403, 404, 410, 413, 415].includes(error?.status)) { close(error.status === 410 ? 'expired' : 'error'); return; }
      if (error?.status === 429) {
        // Allow short arrival jitter, then ease sustained server backpressure.
        relayBackoffs += 1; consecutiveBackoffs += 1;
        backoff = consecutiveBackoffs <= 3 ? 22 : Math.min(2000, 250 * 2 ** Math.min(3, consecutiveBackoffs - 4));
      } else {
        failures += 1;
        backoff = Math.min(2000, 250 * 2 ** Math.min(3, failures - 1));
      }
    } finally {
      running = false;
      // An absent remote peer must not cause continuous high-rate polling. Online
      // events wake this same owner; they never start a concurrent exchange loop.
      // Keep successful idle polls below the two-second mailbox TTL (which is
      // checked with integer server seconds), so opposite phases cannot miss forever.
      const quietBackoff = receiptAge() > 1000 ? Math.min(500, 250 * 2 ** Math.min(3, Math.floor(receiptAge() / 1000) - 1)) : 0;
      const delay = wakeRequested && online ? 0 : !online ? 1000 : Math.max(backoff, quietBackoff, (exchanged ? 24 : 40) - (now() - cycleStarted));
      wakeRequested = false;
      schedule(delay);
    }
  }
  function setOnline(value) {
    if (closed || online === value) return;
    online = value; epoch += 1; outgoing = null;
    protocol.resetTransport();
    failures = 0; consecutiveBackoffs = 0;
    if (running) wakeRequested = true;
    else schedule(online ? 0 : 1000);
  }
  function close(reason = 'closed') {
    if (closed) return;
    closed = true; clearTimeout(timer); outgoing = null; protocol.resetTransport();
    onEvent(reason === 'expired' ? 'expired' : 'stop', { state: reason, transport: 'https' });
  }
  // Defer the first request until the session has assigned its peer owner.
  schedule(0);
  return { close, setOnline, sample: () => closed || !online ? null : protocol.sample(), presentation: () => closed ? null : protocol.presentation(),
    summary: () => ({ ...protocol.summary(), role, transport: 'https', rtc: false,
      ...(!online ? { dataFresh: false, receiverConfirmed: false, referenceReceived: false } : {}),
      networkState: networkState(), relayBackoffs, transportAgeMs: lastReceipt === null ? null : receiptAge(),
      state: closed ? 'closed' : !opened ? 'connecting' : 'connected' }) };
}
