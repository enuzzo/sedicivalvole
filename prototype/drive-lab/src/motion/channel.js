import { waitForMotionIce } from "./ice-gathering.js";
import { safeMotionSummary } from "./telemetry.js";
import { vectorValid } from "./reference.js";
import { safeMotionPresentation, safeReceiverContext, DEFAULT_MOTION_PRESENTATION } from "./presentation.js";
import { safeRoadValues } from "./road-input.js";
const VERSION = "sv-motion-1";
const LABEL = "sedicivalvole-motion";
const finite = (n) => typeof n === "number" && Number.isFinite(n);
const integer = (n) => Number.isSafeInteger(n) && n >= 0;
function decode(text) {
  if (typeof text !== "string" || text.length > 4096) return null;
  try { return JSON.parse(text); } catch { return null; }
}
export function safeMotionValues(value) {
  if (!value || value.frame !== "tare-relative" || !integer(value.generation)) return null;
  if (!["acceleration", "rotation", "tilt"].every((key) => vectorValid(value[key]))) return null;
  if (value.acceleration.some((n) => Math.abs(n) > 100) || value.rotation.some((n) => Math.abs(n) > 2000)
    || value.tilt.some((n) => Math.abs(n) > 181) || !finite(value.turnRate) || Math.abs(value.turnRate) > 2000) return null;
  return { frame: "tare-relative", generation: value.generation,
    acceleration: value.acceleration.map((n) => Math.round(n * 100) / 100),
    rotation: value.rotation.map((n) => Math.round(n * 10) / 10),
    tilt: value.tilt.map((n) => Math.round(n * 10) / 10), turnRate: Math.round(value.turnRate * 10) / 10,
    ...(safeRoadValues(value.road) ? { road: safeRoadValues(value.road) } : {}) };
}

export function createMotionProtocol({ role, now = () => performance.now(), getPhone = () => ({}), getPresentation = () => DEFAULT_MOTION_PRESENTATION, onSummary = () => {}, maxPending = 1 }) {
  let request = 0, sequence = 0, lastSequence = -1;
  const pending = new Map();
  const pendingLimit = Math.max(1, Math.min(8, Math.floor(maxPending) || 1));
  let last = null;
  let remoteSummary = {};
  let receiverContext = null, contextAt = null;
  const sentSamples = new Map();
  const freshSample = () => last && now() >= last.at && now() - last.at + last.age <= 250;
  const referenceReceived = () => Boolean(freshSample() && last.values && remoteSummary.tared && remoteSummary.sensorState === "live");
  const receiverConfirmed = (phone = getPhone()) => {
    const sent = sentSamples.get(receiverContext?.acceptedSequence);
    // Receipt age uses the phone's own send clock, including the return journey.
    return Boolean(sent && contextAt !== null && now() >= contextAt && now() - contextAt <= 250
      && now() >= sent.at && now() - sent.at + sent.age <= 250
      && phone.summary?.tared && phone.summary?.sensorState === "live" && phone.values
      && sent.generation === phone.values.generation && receiverContext?.acceptedGeneration === phone.values.generation);
  };
  const counters = { received: 0, sent: 0, rejected: 0, expiredRequests: 0, latencyDrops: 0, rttMs: 0, rttMaxMs: 0 };
  return {
    resetTransport() {
      // Preserve sequence monotonicity and local ZERO, but never carry a receipt
      // or an outstanding challenge across a known transport interruption.
      pending.clear(); sentSamples.clear(); last = null; receiverContext = null; contextAt = null;
    },
    poll() {
      for (const [id, at] of pending) if (now() - at > 250) { counters.expiredRequests += 1; pending.delete(id); }
      if (pending.size >= pendingLimit) return null;
      const id = request++;
      pending.set(id, now());
      // Older phones keep receiving the exact legacy envelope until they advertise support.
      const presentation = safeMotionPresentation(getPresentation()) ?? DEFAULT_MOTION_PRESENTATION;
      return JSON.stringify({ v: VERSION, kind: "poll", request: id,
        ...(remoteSummary.supportsUiContext ? { context: { ...presentation, acceptedGeneration: referenceReceived() ? last.values.generation : null, acceptedSequence: referenceReceived() ? lastSequence : null } } : {}) });
    },
    receive(text) {
      const packet = decode(text);
      if (packet?.v !== VERSION || !integer(packet.request)) { counters.rejected += 1; return null; }
      if (role === "phone") {
        const context = packet.context === undefined ? null : safeReceiverContext(packet.context);
        if (packet.kind !== "poll" || Object.keys(packet).length !== (context ? 4 : 3)
          || packet.context !== undefined && !context || packet.request <= lastSequence) { counters.rejected += 1; return null; }
        lastSequence = packet.request;
        receiverContext = context; contextAt = context ? now() : null;
        const phone = getPhone();
        const values = safeMotionValues(phone.values);
        const ageMs = values && finite(phone.values.ageMs) && phone.values.ageMs >= 0 ? phone.values.ageMs : 0;
        const confirmed = receiverConfirmed(phone);
        if (values) sentSamples.set(sequence, { at: now(), age: ageMs, generation: values.generation });
        while (sentSamples.size > 8) sentSamples.delete(sentSamples.keys().next().value);
        counters.sent += 1;
        return JSON.stringify({ v: VERSION, kind: "sample", request: packet.request, sequence: sequence++,
          ageMs,
          values, summary: safeMotionSummary({ ...phone.summary, supportsUiContext: true, receiverConfirmed: confirmed }) });
      }
      const requestedAt = pending.get(packet.request);
      const rtt = requestedAt === undefined ? null : now() - requestedAt;
      if (packet.kind !== "sample" || Object.keys(packet).length !== 7 || rtt === null
        || !integer(packet.sequence) || packet.sequence <= lastSequence || !finite(packet.ageMs) || packet.ageMs < 0
        || rtt < 0) { counters.rejected += 1; return null; }
      counters.rttMs = rtt; counters.rttMaxMs = Math.max(counters.rttMaxMs, rtt);
      if (rtt + packet.ageMs > 250) { counters.rejected += 1; counters.latencyDrops += 1; return null; }
      const values = packet.values === null ? null : safeMotionValues(packet.values);
      if (packet.values !== null && !values) { counters.rejected += 1; return null; }
      pending.delete(packet.request); lastSequence = packet.sequence;
      counters.received += 1; counters.rttMs = rtt; counters.rttMaxMs = Math.max(counters.rttMaxMs, rtt);
      remoteSummary = safeMotionSummary(packet.summary);
      last = { at: now(), age: rtt + packet.ageMs, values };
      onSummary(remoteSummary);
      return null;
    },
    sample() {
      return referenceReceived() ? { ...last.values, ageMs: now() - last.at + last.age } : null;
    },
    presentation: () => safeMotionPresentation(receiverContext),
    summary() {
      const age = last ? now() - last.at + last.age : null;
      const fresh = last && age >= 0 && age <= 250;
      return { ...remoteSummary, ...counters, ageUpperMs: age !== null && age >= 0 ? age : null,
        ...(role === "receiver" ? { referenceReceived: referenceReceived(), receiverConfirmed: referenceReceived() && remoteSummary.receiverConfirmed === true,
          ...(!fresh ? { tared: false, sensorState: "stale" } : {}) } : { supportsUiContext: true, receiverConfirmed: receiverConfirmed() }),
        ...(role === "receiver" ? { dataFresh: Boolean(fresh) } : {}), state: fresh ? "connected" : "stale" };
    },
  };
}

export function createMotionPeer({ role, host = window, now = () => performance.now(), getPhone, getPresentation, onEvent = () => {}, onSummary }) {
  if (!host.isSecureContext || !host.RTCPeerConnection) throw new Error("rtc_unavailable");
  const pc = new host.RTCPeerConnection({ iceServers: [] });
  const protocol = createMotionProtocol({ role, now, getPhone, getPresentation, onSummary });
  let channel = null, closed = false, tick = null;
  let online = host.navigator?.onLine !== false;
  const available = () => online && pc.connectionState !== "disconnected";
  let backpressureDrops = 0, sendErrors = 0;
  const started = now();
  const cleanups = new Set();
  function close(reason = "closed") {
    if (closed) return;
    closed = true; clearInterval(tick);
    for (const cleanup of cleanups) cleanup();
    channel?.close(); pc.close(); onEvent(reason === "expired" ? "expired" : "stop", { state: reason });
  }
  function send(text) {
    if (!text || channel?.readyState !== "open") return;
    if (channel.bufferedAmount > 4096) { backpressureDrops += 1; return; }
    try { channel.send(text); } catch { sendErrors += 1; }
  }
  function bind(candidate) {
    if (closed || channel || candidate.label !== LABEL || candidate.ordered !== false || candidate.maxRetransmits !== 0) { candidate.close(); return; }
    channel = candidate;
    channel.addEventListener("open", () => onEvent("channel-open", { state: "connected" }));
    channel.addEventListener("message", ({ data }) => { if (!closed && available()) send(protocol.receive(data)); });
    channel.addEventListener("close", () => close());
    channel.addEventListener("error", () => close("error"));
  }
  pc.addEventListener("datachannel", ({ channel: candidate }) => bind(candidate));
  pc.addEventListener("iceconnectionstatechange", () => onEvent("connection", { iceState: pc.iceConnectionState, peerState: pc.connectionState }));
  pc.addEventListener("connectionstatechange", () => {
    onEvent("connection", { iceState: pc.iceConnectionState, peerState: pc.connectionState });
    if (pc.connectionState === "disconnected") protocol.resetTransport();
    if (["failed", "closed"].includes(pc.connectionState)) close();
  });
  if (role === "receiver") {
    try { bind(pc.createDataChannel(LABEL, { ordered: false, maxRetransmits: 0 })); }
    catch { close(); throw new Error("rtc_unavailable"); }
  }
  tick = setInterval(() => {
    if (now() - started >= 3600000) { close("expired"); return; }
    if (available() && channel?.readyState === "open" && role === "receiver") send(protocol.poll());
  }, 50);
  async function local(type) {
    if (closed) throw new Error("closed");
    await pc.setLocalDescription(type === "offer" ? await pc.createOffer() : await pc.createAnswer());
    if (closed) throw new Error("closed");
    await waitForMotionIce(pc, { cleanups, onEvidence: detail => onEvent("ice", detail) });
    if (closed) throw new Error("closed");
    return pc.localDescription.sdp;
  }
  return {
    offer: () => local("offer"),
    async answer(sdp) { await pc.setRemoteDescription({ type: "offer", sdp }); return local("answer"); },
    async accept(sdp) { if (closed) throw new Error("closed"); await pc.setRemoteDescription({ type: "answer", sdp }); },
    close,
    setOnline(value) { if (online !== value) { online = value; protocol.resetTransport(); } },
    presentation: () => closed ? null : protocol.presentation(),
    sample: () => closed || !available() ? null : protocol.sample(),
    summary: () => ({ ...protocol.summary(), role, backpressureDrops, sendErrors, rtc: true,
      ...(!available() ? { dataFresh: false, receiverConfirmed: false, referenceReceived: false } : {}),
      networkState: !online ? "offline" : !available() ? "retrying" : "online",
      state: closed ? "closed" : channel?.readyState === "open" ? "connected" : "connecting" }),
  };
}
