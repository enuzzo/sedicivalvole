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

export function createMotionRelay({ role, cipher, exchange, now = () => performance.now(), getPhone, getPresentation, onEvent = () => {}, onSummary }) {
  // HTTP exchanges stay serial, but a poll need not wait for its multi-hop reply.
  // The bounded protocol window accepts only matching, fresh, monotonic replies.
  const protocol = createMotionProtocol({ role, now, getPhone, getPresentation, onSummary, maxPending: 8 });
  let closed = false, timer = null, opened = false, lastSequence = 0, outgoing = null, failures = 0;
  let lastReceipt = null;
  const started = now();
  const opposite = role === 'receiver' ? 'phone' : 'receiver';
  async function tick() {
    if (closed) return;
    if (now() - started >= 3600000) { close('expired'); return; }
    const cycleStarted = now();
    let exchanged = false;
    try {
      if (role === 'receiver') outgoing = protocol.poll() ?? outgoing;
      const packet = outgoing ? await cipher.seal(outgoing, role) : null;
      if (closed) return;
      outgoing = null;
      const result = await exchange(packet);
      if (closed) return;
      failures = 0;
      if (Number.isSafeInteger(result.sequence) && result.sequence > lastSequence && typeof result.packet === 'string') {
        const text = await cipher.open(result.packet, opposite);
        if (closed) return;
        exchanged = true;
        lastSequence = result.sequence;
        outgoing = protocol.receive(text);
        lastReceipt = now();
        if (!opened) { opened = true; onEvent('channel-open', { state: 'connected', transport: 'https' }); }
      }
      if (opened && now() - lastReceipt > 5000) { close('error'); return; }
    } catch (error) {
      if (closed) return;
      failures += 1;
      if ([403, 410].includes(error?.status) || failures >= 3) { close('error'); return; }
    }
    // Include HTTP time in pacing, but leave a small post-response floor: request-start
    // spacing alone cannot respect PHP's 20 ms arrival limit when network delay varies.
    if (!closed) timer = setTimeout(tick, Math.max(22, (exchanged ? 24 : 40) - (now() - cycleStarted)));
  }
  function close(reason = 'closed') {
    if (closed) return;
    closed = true; clearTimeout(timer);
    onEvent(reason === 'expired' ? 'expired' : 'stop', { state: reason, transport: 'https' });
  }
  // Defer the first request until the session has assigned its peer owner.
  timer = setTimeout(tick, 0);
  return { close, sample: () => closed ? null : protocol.sample(), presentation: () => closed ? null : protocol.presentation(),
    summary: () => ({ ...protocol.summary(), role, transport: 'https', rtc: false,
      transportAgeMs: lastReceipt === null ? null : Math.max(0, now() - lastReceipt),
      state: closed ? 'closed' : !opened ? 'connecting' : 'connected' }) };
}
