import { createRelayKey, createMotionCipher } from "../motion/relay.js";
import { safeMotionPresentation, DEFAULT_MOTION_PRESENTATION } from "../motion/presentation.js";
import { createCommandRelay } from "./command-relay.js";

export const REMOTE_PAIRING_STORAGE_KEY = "sedicivalvole.remote-pair.v1";

const HEX_ID = /^[a-f0-9]{32}$/;
const HEX_TOKEN = /^[a-f0-9]{64}$/;
const finite = (value) => Number.isFinite(value);

function validPair(pair) {
  return Boolean(pair && HEX_ID.test(pair.id) && HEX_TOKEN.test(pair.token) && HEX_TOKEN.test(pair.key));
}

function safePair(pair) {
  return validPair(pair) ? {
    id: pair.id,
    token: pair.token,
    key: pair.key,
    paired: pair.paired === true,
    expiresAt: finite(pair.expiresAt) ? pair.expiresAt : null,
  } : null;
}

export function parseRemotePair(value) {
  const match = String(value || "").match(/^pair=([a-f0-9]{32})\.([a-f0-9]{64})\.([a-f0-9]{64})$/i);
  return match ? { id: match[1], token: match[2], key: match[3] } : null;
}

export function createRemoteSession({ role, host = window, doc = document, fetcher = fetch, now = () => performance.now(), getPresentation = () => DEFAULT_MOTION_PRESENTATION, getState = () => ({}), onState = () => {}, onCommand = () => {}, onChange = () => {}, onEvent = () => {} } = {}) {
  let state = "idle";
  let stage = "idle";
  let generation = 0;
  let qrUrl = null;
  let credentials = null;
  let pair = null;
  let relay = null;
  let polling = null;
  let refresh = null;
  let deadline = 0;
  let leaseDeadline = 0;
  let failureReason = null;
  let startedAt = 0;
  let transport = "https";
  const requests = new Set();
  const signaling = { signalingStatus: 0, signalingRequests: 0, signalingErrors: 0 };

  function event(type, detail = {}) { onEvent(type, { ...detail, stage, role, transport }); }

  async function api(payload, keepalive = false) {
    const abort = new AbortController();
    requests.add(abort);
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; abort.abort(); }, payload.action === "exchange" ? 1500 : 10000);
    signaling.signalingRequests += 1;
    signaling.signalingStatus = 0;
    try {
      const response = await fetcher("/api/motion-pair.php", {
        method: "POST",
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        keepalive,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abort.signal,
      });
      if (!abort.signal.aborted) signaling.signalingStatus = response.status;
      if (!response.ok) throw Object.assign(new Error("signaling_unavailable"), { status: response.status });
      const text = await response.text();
      if (text.length > 32768) throw new Error("signaling_unavailable");
      return JSON.parse(text);
    } catch (error) {
      if (!abort.signal.aborted || timedOut) signaling.signalingErrors += 1;
      throw error;
    } finally {
      clearTimeout(timeout);
      requests.delete(abort);
    }
  }

  function snapshot() {
    const relaySummary = relay?.summary?.() ?? {};
    return {
      state: ["pairing", "preparing", "error", "expired", "closed", "unavailable"].includes(state)
        ? state : relaySummary.state ?? state,
      stage,
      role,
      transport,
      qrUrl,
      failureReason,
      networkState: relaySummary.networkState ?? (state === "pairing" ? "online" : "offline"),
      relayBackoffs: relaySummary.relayBackoffs ?? 0,
      failures: relaySummary.failures ?? 0,
      transportAgeMs: relaySummary.transportAgeMs ?? null,
      expiresAt: leaseDeadline || null,
      connected: relaySummary.state === "connected",
      ...signaling,
    };
  }

  function notify() { onChange(snapshot()); }

  function cleanup(next = "closed", { revoke = true } = {}) {
    generation += 1;
    clearTimeout(polling);
    clearInterval(refresh);
    for (const request of requests) request.abort();
    requests.clear();
    const previous = credentials;
    credentials = null;
    qrUrl = null;
    relay?.close(next);
    relay = null;
    state = next;
    if (revoke && previous) void api({ action: "delete", ...previous }, true).catch(() => {});
  }

  function fail(next = "error", error = null) {
    failureReason = next;
    cleanup(next);
    event("error", { state: next, reason: error?.message ?? next });
    notify();
  }

  function attachRelay(secret, expiresAt, token) {
    leaseDeadline = expiresAt;
    relay = createCommandRelay({
      role,
      host,
      now,
      expiresAt,
      cipher: secret,
      exchange: packet => api({ action: "exchange", ...token, packet }),
      getState,
      onState,
      onCommand,
      onEvent: (type, detail) => {
        event(type, detail);
        if (type === "channel-open") {
          state = "connected";
          stage = "connected";
          qrUrl = null;
          notify();
        } else if (["expired", "stop"].includes(type) && state !== "expired") {
          state = detail.state === "expired" ? "expired" : "closed";
          notify();
        }
      },
    });
    state = "connecting";
    stage = "relay";
    notify();
  }

  async function start(nextPair = null) {
    if (["preparing", "pairing", "connecting", "connected"].includes(state)) return;
    const normalizedPair = role === "phone" ? safePair(nextPair) : null;
    if (role === "phone" && !normalizedPair) {
      fail("invalid_pairing");
      return;
    }
    cleanup("preparing", { revoke: false });
    const token = generation;
    startedAt = now();
    stage = "prepare";
    state = "preparing";
    failureReason = null;
    pair = normalizedPair;
    event("start", { secureContext: Boolean(host.isSecureContext) });
    notify();
    try {
      if (!host.isSecureContext || !host.crypto?.subtle) { fail("unavailable"); return; }
      const secretText = role === "receiver" ? createRelayKey(host.crypto) : pair.key;
      const cipher = await createMotionCipher(secretText, host.crypto);
      if (token !== generation) return;
      leaseDeadline = startedAt + 3600000;
      if (role === "receiver") {
        stage = "create";
        const result = await api({ action: "create", transport: "https" });
        if (!HEX_ID.test(result.id) || !HEX_TOKEN.test(result.token) || !HEX_TOKEN.test(result.join)) throw new Error("invalid_pairing");
        if (token !== generation) { void api({ action: "delete", id: result.id, token: result.token }, true).catch(() => {}); return; }
        credentials = { id: result.id, token: result.token };
        const presentation = safeMotionPresentation(getPresentation()) ?? DEFAULT_MOTION_PRESENTATION;
        qrUrl = `${host.location.origin}/?remote=phone&palette=${presentation.palette}&appearance=${presentation.appearance}#pair=${result.id}.${result.join}.${secretText}`;
        state = "pairing";
        deadline = now() + 180000;
        event("offer-ready", { state });
        notify();
        const poll = async () => {
          try {
            stage = "poll";
            const joined = await api({ action: "poll", ...credentials });
            if (token !== generation) return;
            if (joined.status === "joined") {
              const lease = Number.isInteger(joined.expiresIn) && joined.expiresIn > 0 ? joined.expiresIn * 1000 : 3600000;
              attachRelay(cipher, Math.min(startedAt + 3600000, now() + lease), credentials);
              return;
            }
            if (now() >= deadline) { fail("expired"); return; }
            polling = setTimeout(poll, 700);
          } catch (error) { if (token === generation) fail(error?.status === 410 ? "expired" : "error", error); }
        };
        polling = setTimeout(poll, 500);
      } else {
        if (pair.paired === true && finite(pair.expiresAt) && pair.expiresAt > Date.now()) {
          const remainingMs = Math.min(3600000, pair.expiresAt - Date.now());
          credentials = { id: pair.id, token: pair.token };
          leaseDeadline = startedAt + remainingMs;
          event("restored", { expiresIn: Math.round(remainingMs / 1000) });
          attachRelay(cipher, leaseDeadline, credentials);
          return;
        }
        stage = "join";
        const joinedAt = now();
        const result = await api({ action: "join", id: pair.id, token: pair.token });
        if (token !== generation) {
          if (HEX_TOKEN.test(result.token)) void api({ action: "delete", id: pair.id, token: result.token }, true).catch(() => {});
          return;
        }
        if (!HEX_TOKEN.test(result.token) || result.transport !== "https") throw new Error("invalid_pairing");
        credentials = { id: pair.id, token: result.token };
        const remaining = Number.isInteger(result.expiresIn) && result.expiresIn > 0 && result.expiresIn <= 3600 ? result.expiresIn : 3420;
        leaseDeadline = Math.min(joinedAt + remaining * 1000, joinedAt + 3600000);
        onState({});
        event("joined", { expiresIn: Math.round((leaseDeadline - joinedAt) / 1000) });
        attachRelay(cipher, leaseDeadline, credentials);
        onChange({ ...snapshot(), credentials: safePair({ ...pair, token: result.token, paired: true, expiresAt: Date.now() + remaining * 1000 }) });
      }
    } catch (error) {
      if (token === generation) fail(error?.status === 410 ? "expired" : error?.message === "invalid_pairing" ? "invalid_pairing" : "error", error);
    }
  }

  function stop(next = "closed") { cleanup(next); event("stop", { state: next }); notify(); }
  const online = () => relay?.setOnline(true);
  const offline = () => relay?.setOnline(false);
  const visibility = () => { if (doc.visibilityState !== "visible") relay?.setOnline(false); else relay?.setOnline(host.navigator?.onLine !== false); };
  host.addEventListener("online", online);
  host.addEventListener("offline", offline);
  doc.addEventListener("visibilitychange", visibility);

  return {
    start,
    stop,
    snapshot,
    command: (value) => relay?.command?.(value) ?? false,
    state: () => relay?.state?.() ?? {},
    report: () => ({ schema: "sedicivalvole.remote-report.v1", state: snapshot(), generatedAt: new Date().toISOString() }),
    dispose() {
      cleanup("closed");
      host.removeEventListener("online", online);
      host.removeEventListener("offline", offline);
      doc.removeEventListener("visibilitychange", visibility);
    },
  };
}
