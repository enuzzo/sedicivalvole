import { createCommandProtocol } from "./command-protocol.js";

export function createCommandRelay({ role, host = globalThis, cipher, exchange, now = () => performance.now(), getState, onState, onCommand, onEvent = () => {}, expiresAt = now() + 3600000 } = {}) {
  const protocol = createCommandProtocol({ role, getState, onState, onCommand, now });
  let closed = false;
  let timer = null;
  let running = false;
  let epoch = 0;
  let online = host.navigator?.onLine !== false;
  let opened = false;
  let lastReceipt = null;
  let failures = 0;
  let relayBackoffs = 0;
  let consecutiveBackoffs = 0;
  let lastSequence = 0;
  let wakeRequested = false;
  const started = now();

  const receiptAge = () => Math.max(0, now() - (lastReceipt ?? started));
  const networkState = () => !online ? "offline" : failures || consecutiveBackoffs || receiptAge() > 2500 ? "retrying" : "online";
  function schedule(delay) { clearTimeout(timer); if (!closed) timer = setTimeout(tick, delay); }

  async function tick() {
    if (closed || running) return;
    if (now() >= expiresAt) { close("expired"); return; }
    if (!online) { schedule(1000); return; }
    running = true;
    const attempt = epoch;
    const cycleStarted = now();
    let exchanged = false;
    let backoff = 0;
    try {
      const outgoing = protocol.poll();
      const packet = outgoing ? await cipher.seal(outgoing, role) : null;
      if (closed || attempt !== epoch) return;
      const result = await exchange(packet);
      if (closed || attempt !== epoch) return;
      failures = 0;
      consecutiveBackoffs = 0;
      if (Number.isSafeInteger(result?.sequence) && result.sequence > lastSequence && typeof result.packet === "string") {
        lastSequence = result.sequence;
        const text = await cipher.open(result.packet, role === "receiver" ? "phone" : "receiver");
        if (closed || attempt !== epoch) return;
        protocol.receive(text);
        lastReceipt = now();
        exchanged = true;
        if (!opened) {
          opened = true;
          onEvent("channel-open", { state: "connected", transport: "https" });
        }
      }
    } catch (error) {
      if (closed || attempt !== epoch) return;
      if ([400, 403, 404, 410, 413, 415].includes(error?.status)) {
        close(error.status === 410 ? "expired" : "error");
        return;
      }
      if (error?.status === 429) {
        relayBackoffs += 1;
        consecutiveBackoffs += 1;
        backoff = consecutiveBackoffs <= 3 ? 22 : Math.min(2000, 250 * 2 ** Math.min(3, consecutiveBackoffs - 4));
      } else {
        failures += 1;
        backoff = Math.min(2000, 250 * 2 ** Math.min(3, failures - 1));
      }
    } finally {
      running = false;
      const quietBackoff = receiptAge() > 2500 ? Math.min(1000, 400 * 2 ** Math.min(3, Math.floor(receiptAge() / 2500) - 1)) : 0;
      const delay = wakeRequested && online ? 0 : !online ? 1000 : Math.max(backoff, quietBackoff, (exchanged ? 120 : 180) - (now() - cycleStarted));
      wakeRequested = false;
      schedule(delay);
    }
  }

  function close(reason = "closed") {
    if (closed) return;
    closed = true;
    epoch += 1;
    clearTimeout(timer);
    onEvent(reason === "expired" ? "expired" : "stop", { state: reason, transport: "https" });
  }
  function setOnline(value) {
    if (closed || online === value) return;
    online = value;
    epoch += 1;
    failures = 0;
    consecutiveBackoffs = 0;
    protocol.reset();
    if (running) wakeRequested = true;
    else schedule(online ? 0 : 1000);
  }
  function status() {
    return {
      state: closed ? (now() >= expiresAt ? "expired" : "closed") : opened ? "connected" : "connecting",
      networkState: networkState(),
      transport: "https",
      relayBackoffs,
      failures,
      transportAgeMs: lastReceipt == null ? null : receiptAge(),
      expiresAt,
      role,
      ...protocol.summary(),
    };
  }
  schedule(0);
  return {
    command: (value) => protocol.enqueue(value),
    state: () => protocol.state(),
    summary: status,
    close,
    setOnline,
  };
}
