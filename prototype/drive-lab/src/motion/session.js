import { createMotionPeer } from "./channel.js";
import { createMotionTelemetry, safeMotionSummary } from "./telemetry.js";
import { safeMotionPresentation, DEFAULT_MOTION_PRESENTATION } from "./presentation.js";

export function createMotionSession({ role, host = window, doc = document, fetcher = fetch, now = () => performance.now(),
  getPhone = () => ({}), getPresentation = () => DEFAULT_MOTION_PRESENTATION, peerFactory = createMotionPeer, onChange = () => {}, onEvent = () => {} } = {}) {
  const telemetry = createMotionTelemetry(now);
  let peer = null, credentials = null, qrUrl = null;
  let state = "idle", generation = 0, polling = null, refresh = null;
  let deadline = 0, previousState = null, previousPhone = null;
  const requests = new Set();
  let stage = "idle", startedAt = 0, failureReason = null;
  let attemptedPair = null;
  const signaling = { signalingStatus: 0, signalingRequests: 0, signalingErrors: 0 };
  function event(type, detail = {}) { const safe = safeMotionSummary(detail); telemetry.event(type, safe); onEvent(type, safe); }
  async function api(payload, keepalive = false) {
    const abort = new AbortController(); requests.add(abort);
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; abort.abort(); }, 10000);
    signaling.signalingRequests += 1; signaling.signalingStatus = 0;
    try {
      const response = await fetcher("/api/motion-pair.php", { method: "POST", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer", keepalive,
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: abort.signal });
      if (!abort.signal.aborted) signaling.signalingStatus = response.status;
      if (!response.ok) throw Object.assign(new Error("signaling_unavailable"), { status: response.status });
      const text = await response.text();
      if (text.length > 32768) throw new Error("signaling_unavailable");
      return JSON.parse(text);
    } catch (error) { if (!abort.signal.aborted || timedOut) signaling.signalingErrors += 1; throw error; }
    finally { clearTimeout(timeout); requests.delete(abort); }
  }
  function notify() {
    const summary = { ...getPhone().summary, ...peer?.summary(), ...signaling, stage, failureReason, role, state: ["pairing", "preparing", "error", "suspended", "expired", "closed", "unavailable"].includes(state) ? state : peer?.summary().state ?? state };
    telemetry.update(summary);
    if (previousState !== summary.state) {
      if (summary.state === "stale") event("stale", summary);
      if (previousState === "stale" && summary.state === "connected") event("recovered", summary);
      previousState = summary.state;
    }
    onChange({ ...safeMotionSummary(summary), qrUrl, presentation: peer?.presentation?.() ?? null, values: role === "phone" ? getPhone().values : peer?.sample() ?? null });
  }
  function cleanup(next = "closed") {
    generation += 1;
    clearTimeout(polling); clearInterval(refresh);
    for (const request of requests) request.abort();
    requests.clear();
    const previous = credentials; credentials = null; qrUrl = null;
    peer?.close(); peer = null; state = next;
    if (previous) void api({ action: "delete", ...previous }, true).catch(() => {});
  }
  function stop(next = "closed") { cleanup(next); event(next === "suspended" ? "hidden" : next === "expired" ? "expired" : "stop", { state: next, stage, ...signaling }); notify(); }
  function createPeer(token) {
    return peerFactory({ role, host, now, getPhone, getPresentation,
      onSummary: (summary) => {
        if (token !== generation) return;
        if (summary.sensorState !== previousPhone?.sensorState) event("permission", summary);
        if (summary.tareCount !== previousPhone?.tareCount && summary.tareCount) event("tare", summary);
        if (summary.wakeState !== previousPhone?.wakeState && summary.wakeState) event("wake", summary);
        if (summary.traceRenderer !== previousPhone?.traceRenderer && summary.traceRenderer) event("trace", summary);
        previousPhone = summary;
      },
      onEvent: (type, detail) => {
        if (token !== generation) return;
        event(type, { ...detail, stage, ...signaling, ...(type === "channel-open" ? { connectMs: now() - startedAt } : {}) });
        if (type === "channel-open") {
          state = "connected"; stage = "connected"; qrUrl = null;
          if (role === "receiver" && credentials) {
            const finished = credentials; credentials = null;
            void api({ action: "finish", ...finished }).catch(() => {});
          }
        } else if (type === "stop" || type === "expired") {
          cleanup(type === "expired" ? "expired" : "closed");
        }
        notify();
      } });
  }
  async function start(pair = null) {
    // A second gesture cannot cancel setup, replace a live peer or reuse admission.
    if (["preparing", "pairing", "connecting", "connected"].includes(state)) return;
    if (role === "phone" && attemptedPair && attemptedPair.id === pair?.id && attemptedPair.token === pair?.token) return;
    if (role === "phone") attemptedPair = pair;
    cleanup("preparing");
    const token = generation; startedAt = now(); stage = "idle"; failureReason = null;
    previousPhone = null; event("start", { role, secureContext: Boolean(host.isSecureContext), rtc: Boolean(host.RTCPeerConnection) }); notify();
    try {
      if (!host.isSecureContext || !host.RTCPeerConnection) { state = "unavailable"; event("error", { state, stage, secureContext: Boolean(host.isSecureContext), rtc: Boolean(host.RTCPeerConnection) }); notify(); return; }
      peer = createPeer(token);
      deadline = now() + 30000;
      refresh = setInterval(() => {
        if (["preparing", "pairing", "connecting"].includes(state) && now() >= deadline) { stop("expired"); return; }
        notify();
      }, 200);
      if (role === "receiver") {
        stage = "offer";
        const sdp = await peer.offer(); if (token !== generation) return;
        stage = "create";
        const result = await api({ action: "create", sdp });
        if (!/^[a-f0-9]{32}$/.test(result.id) || !/^[a-f0-9]{64}$/.test(result.token) || !/^[a-f0-9]{64}$/.test(result.join)) throw new Error("invalid_pairing");
        if (token !== generation) { void api({ action: "delete", id: result.id, token: result.token }, true).catch(() => {}); return; }
        credentials = { id: result.id, token: result.token };
        deadline = now() + 180000;
        const presentation = safeMotionPresentation(getPresentation()) ?? DEFAULT_MOTION_PRESENTATION;
        qrUrl = `${host.location.origin}/?motion=phone&palette=${presentation.palette}&appearance=${presentation.appearance}#pair=${result.id}.${result.join}`;
        state = "pairing"; event("offer-ready", { state }); notify();
        let joined = false;
        const poll = async () => {
          try {
            stage = "poll";
            const result = await api({ action: "poll", ...credentials }); if (token !== generation) return;
            if (result.status === "joined" && !joined) { joined = true; state = "connecting"; qrUrl = null; deadline = now() + 30000; event("phone-joined", { state }); }
            if (result.status === "answered" && typeof result.sdp === "string") {
              state = "connecting"; stage = "accept"; qrUrl = null; if (!joined) deadline = now() + 30000; await peer.accept(result.sdp); if (token !== generation) return; notify(); return;
            }
            polling = setTimeout(poll, 1100);
          } catch (error) { if (token === generation) fail(error?.status === 410 ? "expired" : "error"); }
        };
        polling = setTimeout(poll, 1100);
      } else {
        if (!pair || !/^[a-f0-9]{32}$/.test(pair.id) || !/^[a-f0-9]{64}$/.test(pair.token)) throw new Error("invalid_pairing");
        stage = "join";
        const result = await api({ action: "join", ...pair });
        if (token !== generation) {
          if (/^[a-f0-9]{64}$/.test(result.token)) void api({ action: "delete", id: pair.id, token: result.token }, true).catch(() => {});
          return;
        }
        if (!/^[a-f0-9]{64}$/.test(result.token) || typeof result.sdp !== "string") throw new Error("invalid_pairing");
        credentials = { id: pair.id, token: result.token };
        stage = "answer";
        const sdp = await peer.answer(result.sdp); if (token !== generation) return;
        await api({ action: "answer", ...credentials, sdp }); if (token !== generation) return;
        state = peer.summary().state === "connected" ? "connected" : "connecting"; event("phone-joined", { state }); notify();
      }
    } catch (error) {
      if (token === generation) {
        failureReason = ["ice_no_candidates", "rtc_unavailable", "invalid_pairing"].includes(error?.message) ? error.message : stage === "offer" || stage === "answer" ? "rtc_setup_failed" : "signaling_unavailable";
        fail(stage === "join" && [403, 410].includes(error?.status) ? "expired" : "error");
      }
    }
  }
  function fail(next = "error") { const failure = { state: next, stage, failureReason, ...signaling }; cleanup(next); event("error", failure); notify(); }
  const hidden = () => { if (doc.visibilityState !== "visible") stop("suspended"); };
  const pagehide = () => stop("suspended");
  const offline = () => { if (["preparing", "pairing", "connecting", "connected"].includes(state)) fail(); };
  doc.addEventListener("visibilitychange", hidden); host.addEventListener("pagehide", pagehide);
  host.addEventListener("offline", offline);
  return { start, stop: () => stop(), event, refresh: notify, report: () => telemetry.snapshot(),
    dispose() { cleanup(); doc.removeEventListener("visibilitychange", hidden); host.removeEventListener("pagehide", pagehide); host.removeEventListener("offline", offline); } };
}
