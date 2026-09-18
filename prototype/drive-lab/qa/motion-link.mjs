// Synthetic metadata only. Never connect this probe to DeviceMotion samples.
export const LINK_TTL_MS = 300000;
export const MAX_AGE_MS = 250;
const VERSION = "sv-motion-probe-1";
const integer = (n) => Number.isSafeInteger(n) && n >= 0;
const number = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0;
const sessionValid = (id) => typeof id === "string" && /^[a-f0-9]{32}$/.test(id);
const keysAre = (object, keys) => object && Object.keys(object).sort().join() === keys.sort().join();
function decode(text) {
  if (typeof text !== "string" || text.length > 512) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export function syntheticReply(text, { session, sequence, ageMs }) {
  const poll = decode(text);
  if (!keysAre(poll, ["v", "kind", "session", "request"]) || poll.v !== VERSION || poll.kind !== "poll"
    || !sessionValid(session) || poll.session !== session || !integer(poll.request)
    || !integer(sequence) || !number(ageMs)) return null;
  return JSON.stringify({ v: VERSION, kind: "synthetic", session, request: poll.request, sequence, ageMs });
}

export function createLinkReceiver({ session, now = () => performance.now() }) {
  if (!sessionValid(session)) throw new Error("Invalid probe session");
  const start = now();
  let revoked = false;
  let counter = 0;
  let pending = null;
  let last = null;
  let lastSequence = -1;
  const rtts = [];
  const arrivals = [];
  const counts = { accepted: 0, rejected: 0, expiredRequests: 0, skippedSourceTicks: 0 };
  const active = () => !revoked && now() >= start && now() - start < LINK_TTL_MS;
  function expire() {
    if (pending && now() - pending.at > MAX_AGE_MS) { counts.expiredRequests += 1; pending = null; }
  }
  return {
    poll() {
      expire();
      if (!active() || pending) return null;
      pending = { request: counter++, at: now() };
      return JSON.stringify({ v: VERSION, kind: "poll", session, request: pending.request });
    },
    receive(text) {
      const reply = decode(text);
      const rtt = pending ? now() - pending.at : null;
      if (!active() || !pending || !keysAre(reply, ["v", "kind", "session", "request", "sequence", "ageMs"])
        || reply.v !== VERSION || reply.kind !== "synthetic" || reply.session !== session
        || reply.request !== pending.request || !integer(reply.sequence) || reply.sequence <= lastSequence
        || !number(reply.ageMs) || rtt < 0 || rtt + reply.ageMs > MAX_AGE_MS) {
        counts.rejected += 1;
        expire();
        return false;
      }
      // Receiver-clock round trip plus sender-local age is a conservative upper
      // bound, not synchronized one-way latency or sensor acquisition age.
      const receivedAt = now();
      if (last) arrivals.push(receivedAt - last.receivedAt);
      if (lastSequence >= 0) counts.skippedSourceTicks += Math.max(0, reply.sequence - lastSequence - 1);
      lastSequence = reply.sequence;
      last = { receivedAt, ageUpperAtReceiptMs: rtt + reply.ageMs };
      pending = null;
      rtts.push(rtt);
      if (rtts.length > 240) rtts.shift();
      if (arrivals.length > 240) arrivals.shift();
      counts.accepted += 1;
      return true;
    },
    revoke() { revoked = true; pending = null; last = null; },
    summary() {
      expire();
      const ageUpperMs = last ? last.ageUpperAtReceiptMs + now() - last.receivedAt : null;
      const mean = (values) => values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null;
      const arrivalMean = mean(arrivals);
      return { state: !active() ? "expired-or-revoked" : !last ? "waiting" : ageUpperMs <= MAX_AGE_MS && ageUpperMs >= 0 ? "fresh-synthetic" : "stale",
        ageUpperMs, rttMeanMs: mean(rtts), rttMaxMs: rtts.length ? Math.max(...rtts) : null,
        arrivalJitterMs: arrivalMean === null ? null : Math.sqrt(mean(arrivals.map((n) => (n - arrivalMean) ** 2))),
        ...counts };
    },
  };
}

function gather(pc) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const finish = (error) => {
      clearTimeout(timeout);
      pc.removeEventListener("icegatheringstatechange", changed);
      pc.removeEventListener("connectionstatechange", changed);
      if (error) reject(error); else resolve();
    };
    const changed = () => {
      if (pc.signalingState === "closed") finish(new Error("Probe closed"));
      else if (pc.iceGatheringState === "complete") finish();
    };
    const timeout = setTimeout(() => finish(new Error("ICE gathering timed out")), 10000);
    pc.addEventListener("icegatheringstatechange", changed);
    pc.addEventListener("connectionstatechange", changed);
  });
}

export function createSyntheticPeer({ role, session, host = window, now = () => performance.now() }) {
  if (!["receiver", "sender"].includes(role) || !sessionValid(session)) throw new Error("Invalid probe role/session");
  if (!host.isSecureContext || typeof host.RTCPeerConnection !== "function") throw new Error("Secure WebRTC unavailable");
  // No STUN, TURN, WebSocket, media capture or external signaling endpoint.
  const pc = new host.RTCPeerConnection({ iceServers: [] });
  const receiver = role === "receiver" ? createLinkReceiver({ session, now }) : null;
  const start = now();
  let channel = null;
  let timer = null;
  let closed = false;
  let droppedForBackpressure = 0;
  let sendErrors = 0;
  let channelOpened = false;
  function close() {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    receiver?.revoke();
    channel?.close();
    pc.close();
  }
  function send(text) {
    if (!text || channel?.readyState !== "open") return;
    if (channel.bufferedAmount > 4096) { droppedForBackpressure += 1; return; }
    try { channel.send(text); } catch { sendErrors += 1; }
  }
  function bind(candidate) {
    if (closed || channel || candidate.label !== "synthetic-motion-probe" || candidate.ordered !== false || candidate.maxRetransmits !== 0) {
      candidate.close();
      return;
    }
    channel = candidate;
    channel.addEventListener("open", () => { channelOpened = true; });
    channel.addEventListener("message", ({ data }) => {
      if (closed || now() - start >= LINK_TTL_MS) { close(); return; }
      if (receiver) receiver.receive(data);
      else {
        const elapsed = Math.max(0, now() - start);
        send(syntheticReply(data, { session, sequence: Math.floor(elapsed / 20), ageMs: elapsed % 20 }));
      }
    });
    channel.addEventListener("close", close);
  }
  pc.addEventListener("datachannel", ({ channel: candidate }) => bind(candidate));
  pc.addEventListener("connectionstatechange", () => {
    if (["failed", "disconnected", "closed"].includes(pc.connectionState) && !closed) close();
  });
  if (receiver) {
    try { bind(pc.createDataChannel("synthetic-motion-probe", { ordered: false, maxRetransmits: 0 })); }
    catch (error) { close(); throw error; }
  }
  timer = setInterval(() => {
    if (now() - start >= LINK_TTL_MS || now() < start) { close(); return; }
    if (channel?.readyState === "open" && receiver) send(receiver.poll());
  }, 50);
  async function description(type) {
    if (closed) throw new Error("Probe closed");
    await pc.setLocalDescription(type === "offer" ? await pc.createOffer() : await pc.createAnswer());
    await gather(pc);
    if (closed) throw new Error("Probe closed");
    return { type: pc.localDescription.type, sdp: pc.localDescription.sdp };
  }
  return {
    offer: () => description("offer"),
    async answer(offer) { await pc.setRemoteDescription(offer); return description("answer"); },
    async accept(answer) { if (closed) throw new Error("Probe closed"); await pc.setRemoteDescription(answer); },
    close,
    summary: () => ({ role, connection: pc.connectionState, channel: channel?.readyState ?? "unavailable", channelOpened,
      droppedForBackpressure, sendErrors, synthetic: true, ...receiver?.summary() }),
  };
}
