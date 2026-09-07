import { Engine } from "./upstream/Engine.ts";
import { Drivetrain } from "./upstream/Drivetrain.ts";
import { AudioManager } from "./upstream/AudioManager.ts";
import { matchEngineLoopLevels } from "./sample-levels.js";
import { createShowOff } from "./show-off.js";
import { createIdleBlip } from "./idle-blip.js";
import { engineProfile } from "./profiles.js";
import { boundedRpm, decideAutomaticGear, virtualRpm } from "./gearbox.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MAX_DECODED_BYTES = 64 * 1024 * 1024;
const sha256 = async (bytes) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(v => v.toString(16).padStart(2, "0")).join("");
const hold = (param, when) => {
  if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(when);
  else { const value = param.value; param.cancelScheduledValues(when); param.setValueAtTime(value, when); }
};

/** Original host orchestration around declared MIT engine-audio primitives. */
export function createGeapsRuntime({ context, destination, motion, now = () => performance.now(), onEvent = () => {}, fetcher = fetch, allowManual = false }) {
  const master = context.createGain();
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -8; limiter.knee.value = 4; limiter.ratio.value = 20;
  limiter.attack.value = 0.003; limiter.release.value = 0.15;
  master.gain.value = 0;
  master.connect(limiter).connect(destination);
  let nodes = [], engine = null, drivetrain = null, profile = null;
  let generation = 0, abort = null, disposed = false, enabled = false;
  let state = { status: "idle", profileId: "mono", rpm: 1000, gear: 1, shift: null, drive: 0, deceleration: 0, motion: "lost", trustedStationary: false, revving: false, decodedBytes: 0, error: null };
  let previousTime = context.currentTime, selectedAt = context.currentTime, shift = null;
  let quietStop = false;
  let heldSince = null, retryTimer = null, retryStarted = null, retryCount = 0;
  let lastRequested = "mono", requestedRevision = 0, loadingTask = Promise.resolve();
  let timer = null, transmissionMode = "AUTO", manualGear = null;
  const retiringNodes = new Set();
  const stopNodes = (entries) => entries.forEach(({ source, gain }) => { try { source.stop(); } catch {} source.disconnect(); gain.disconnect(); });
  const clearRetry = () => { clearTimeout(retryTimer); retryTimer = null; };
  const idleBlip = createIdleBlip();
  const showOff = createShowOff();
  const releaseRev = () => { heldSince = null; showOff.reset(); state.revving = false; state.showOffPhase = null; };
  const releaseGestures = () => { releaseRev(); idleBlip.reset(); state.idleBlip = false; };
  const setEnabled = (value) => {
    enabled = Boolean(value) && !disposed;
    if (!enabled) {
      releaseGestures(); state.trustedStationary = false; abort?.abort(); clearRetry(); generation++; requestedRevision++;
      clearInterval(timer); timer = null; state.status = nodes.length ? "ready" : "idle";
    } else if (!timer) timer = setInterval(tick, 25);
    const at = context.currentTime;
    hold(master.gain, at); master.gain.setTargetAtTime(enabled && nodes.length ? 0.16 * (quietStop ? 0.7 : 1) : 0, at, 0.04);
    previousTime = at;
  };
  function gainsFor(rpm, drive) {
    const { gain1: high, gain2: low } = AudioManager.crossFade(rpm, 3000, 6500);
    const { gain1: on, gain2: off } = AudioManager.crossFade(drive, 0, 1);
    return { on_low: on * low, off_low: off * low, on_high: on * high, off_high: off * high,
      limiter: clamp((rpm - profile.configuration.engine.soft_limiter * 0.93) / (profile.configuration.engine.limiter * 0.07), 0, 1) * 0.4,
      tranny_on: on * 0.25, tranny_off: off * 0.25 };
  }
  function targets(rpm, drive) {
    const gains = gainsFor(rpm, drive);
    return nodes.map(node => ({ node,
      gain: (gains[node.asset.role] ?? 0) * (node.levelGain ?? node.asset.volume ?? 1),
      cents: node.asset.role === "limiter" ? 0 : node.asset.role.startsWith("tranny")
        ? clamp(rpm * 0.035 - 800, -2400, 2400)
        : clamp(engine.getRPMPitch(node.asset.rpm, 0.2), -2400, 2400),
    }));
  }
  function applyContinuous(rpm, drive, at) {
    for (const { node, gain, cents } of targets(rpm, drive)) {
      hold(node.gain.gain, at); hold(node.source.detune, at);
      node.gain.gain.setTargetAtTime(gain, at, 0.035);
      node.source.detune.setTargetAtTime(cents, at, 0.035);
    }
  }
  function scheduleShift(decision, evidence, at) {
    const fromGear = state.gear;
    const nextRpm = boundedRpm(virtualRpm(evidence.speedKmh ?? 0, decision.gear, drivetrain), profile);
    const duration = profile.duration;
    const effective = at + 0.015;
    const previousRpm = engine.rpm;
    engine.rpm = nextRpm;
    const nextTargets = targets(nextRpm, evidence.drive);
    engine.rpm = previousRpm;
    for (const { node, gain, cents } of nextTargets) {
      hold(node.gain.gain, effective); hold(node.source.detune, effective);
      node.source.detune.linearRampToValueAtTime(cents, effective + duration * 0.65);
      node.gain.gain.linearRampToValueAtTime(gain, effective + duration);
    }
    drivetrain.changeGear(decision.gear);
    shift = { fromGear, toGear: decision.gear, reason: decision.reason, rpm: nextRpm, commitAt: effective + duration * 0.65, endAt: effective + duration, committed: false };
    state.shift = decision.reason;
    onEvent("engine.shift.scheduled", { fromGear, toGear: decision.gear, reason: decision.reason, effectiveContextTime: effective, duration });
  }
  function updateMaster(at, revving = false) {
    state.outputLevel = quietStop && !revving ? 0.7 : 1;
    hold(master.gain, at);
    master.gain.setTargetAtTime(0.16 * state.outputLevel, at, 0.12);
    // Bound audio if the control thread freezes.
    master.gain.setTargetAtTime(0, at + 5, 0.35);
  }
  function tick() {
    if (disposed) return;
    const evidence = motion.snapshot(now());
    state.motion = evidence.freshness; state.drive = evidence.drive; state.deceleration = evidence.deceleration;
    state.trustedStationary = enabled && nodes.length > 0 && evidence.trustedStationary && context.state === "running" && globalThis.document?.visibilityState !== "hidden";
    if (state.trustedStationary) quietStop = true;
    else if (evidence.freshness === "fresh" && evidence.rawSpeedKmh >= 1) quietStop = false;
    if (!state.trustedStationary || (heldSince != null && now() - heldSince >= 8000)) releaseRev();
    if (!enabled || !engine || context.state !== "running") { previousTime = context.currentTime; return; }
    const at = context.currentTime;
    const elapsed = at - previousTime; previousTime = at;
    if (elapsed <= 0) return;
    if (elapsed > 0.5) {
      shift = null; state.shift = null; drivetrain.pendingGear = null; drivetrain.gear = state.gear;
      releaseGestures(); state.trustedStationary = false; motion.reset("audio-clock-gap"); selectedAt = at;
    }
    if (shift) {
      if (!shift.committed && at >= shift.commitAt) {
        drivetrain.commitGear(); state.gear = shift.toGear;
        engine.rpm = shift.rpm; engine.omega = shift.rpm * 2 * Math.PI / 60;
        shift.committed = true; selectedAt = at;
        onEvent("engine.shift.committed", { gear: state.gear, reason: shift.reason });
      }
      if (at < shift.endAt) { state.rpm = Math.round(engine.rpm); updateMaster(at); return; }
      shift = null; state.shift = null;
    }
    const activeEvidence = elapsed > 0.5 ? motion.snapshot(now()) : evidence;
    const gesture = heldSince != null && state.trustedStationary ? showOff.sample(at) : null;
    if (heldSince != null && !gesture) releaseRev();
    const revving = Boolean(gesture);
    state.showOffPhase = gesture?.phase ?? null;
    state.revving = revving;
    const blipRpm = idleBlip.sample(at, state.trustedStationary && !revving && !shift);
    state.idleBlip = blipRpm > 0;
    const dt = Math.min(0.08, elapsed);
    const demand = gesture ? gesture.throttle : activeEvidence.drive;
    if (gesture) state.drive = demand;
    engine.throttle = demand;
    engine.integrate(drivetrain.inertia, at * 1000, dt);
    const coupledRpm = activeEvidence.freshness === "lost" ? (quietStop ? 600 : 1000)
      : boundedRpm(virtualRpm(activeEvidence.speedKmh ?? 0, state.gear, drivetrain), profile);
    if (!revving) {
      drivetrain.omega = coupledRpm * 2 * Math.PI / 60;
      engine.solveVel(drivetrain, dt);
    }
    if (gesture) engine.omega = gesture.rpm * 2 * Math.PI / 60;
    if (state.trustedStationary && !revving) engine.omega = (600 + blipRpm) * 2 * Math.PI / 60;
    engine.rpm = boundedRpm(Math.max(quietStop || revving ? 600 : 1000, engine.omega * 60 / (2 * Math.PI)), profile);
    engine.omega = engine.rpm * 2 * Math.PI / 60;
    state.rpm = Math.round(engine.rpm);
    const decision = !revving && transmissionMode === "MANUAL" && manualGear != null && activeEvidence.canShift && !shift
      ? { gear: manualGear, reason: "manual" } : !revving && transmissionMode === "AUTO" ? decideAutomaticGear({ gear: state.gear, speedKmh: activeEvidence.speedKmh ?? 0,
      drive: demand, canShift: activeEvidence.canShift, heldSeconds: at - selectedAt }, profile, drivetrain) : null;
    if (decision) { manualGear = null; scheduleShift(decision, activeEvidence, at); }
    else applyContinuous(engine.rpm, demand, at);
    updateMaster(at, revving);
  }
  function load(profileId = "mono", options = {}) {
    abort?.abort();
    const request = ++requestedRevision;
    loadingTask = loadingTask.catch(() => false).then(() => request !== requestedRevision || disposed ? false : performLoad(profileId, options));
    return loadingTask;
  }
  async function performLoad(profileId, { retry = false } = {}) {
    if (disposed) return false;
    lastRequested = profileId;
    if (!retry) { clearRetry(); retryStarted = null; retryCount = 0; }
    const revision = ++generation;
    abort?.abort(); abort = new AbortController();
    const controller = abort;
    const timeout = setTimeout(() => controller.abort(), 20000);
    state.status = "loading"; state.error = null;
    const next = engineProfile(profileId);
    const freshNodes = [];
    try {
      const results = await Promise.allSettled(next.assets.map(async asset => {
        const response = await fetcher(asset.url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Engine audio HTTP ${response.status}`);
        const bytes = await response.arrayBuffer();
        if (await sha256(bytes) !== asset.sha256) throw new Error("Engine audio integrity mismatch");
        const buffer = await context.decodeAudioData(bytes);
        return { asset, buffer };
      }));
      if (disposed || revision !== generation) return false;
      const failure = results.find(result => result.status === "rejected");
      if (failure) throw failure.reason;
      if (controller.signal.aborted) throw new Error("Engine bank load cancelled or timed out");
      const assets = results.map(result => result.value);
      const decodedBytes = assets.reduce((sum, { buffer }) => sum + buffer.length * buffer.numberOfChannels * 4, 0);
      if (decodedBytes > MAX_DECODED_BYTES) throw new Error("Engine bank exceeds decoded memory budget");
      const levelGains = matchEngineLoopLevels(assets);
      const at = context.currentTime + 0.025;
      for (const { asset, buffer } of assets) {
        const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
        const gain = context.createGain(); gain.gain.value = 0;
        source.connect(gain).connect(master); source.start(at);
        freshNodes.push({ source, gain, asset, levelGain: levelGains.get(asset.role) });
      }
      for (const old of nodes) {
        retiringNodes.add(old);
        hold(old.gain.gain, context.currentTime);
        old.gain.gain.linearRampToValueAtTime(0, at + 0.06);
        old.source.onended = () => { old.source.disconnect(); old.gain.disconnect(); retiringNodes.delete(old); };
        old.source.stop(at + 0.08);
      }
      nodes = freshNodes;
      profile = next; engine = new Engine(); engine.init(next.configuration.engine);
      engine.rpm = 1000; engine.omega = 1000 * 2 * Math.PI / 60;
      drivetrain = new Drivetrain(); drivetrain.init(next.configuration.drivetrain); drivetrain.gear = 1;
      shift = null; selectedAt = context.currentTime; previousTime = context.currentTime;
      releaseGestures(); state = { ...state, status: "ready", profileId, decodedBytes, bankBytes: next.assets.reduce((sum, asset) => sum + asset.bytes, 0), gear: 1, shift: null, error: null };
      retryStarted = null; retryCount = 0;
      onEvent("engine.bank.ready", { profileId, decodedBytes, clips: nodes.length });
      return true;
    } catch (error) {
      stopNodes(freshNodes);
      if (disposed || revision !== generation) return false;
      state.status = "retrying"; state.error = String(error?.message || "Engine audio unavailable").slice(0, 140);
      onEvent("engine.bank.failed", { profileId, reason: state.error });
      retryStarted ??= now();
      if (enabled && now() - retryStarted < 300000) {
        clearRetry();
        retryTimer = setTimeout(() => {
          retryTimer = null;
          if (!enabled) return;
          if (globalThis.navigator?.onLine === false || globalThis.document?.visibilityState === "hidden") { armWake(); return; }
          void load(lastRequested, { retry: true });
        }, Math.min(30000, 5000 * 2 ** Math.min(retryCount++, 3)));
      } else state.status = "error";
      return false;
    } finally { clearTimeout(timeout); }
  }
  function armWake() {
    clearRetry();
    if (retryStarted != null && now() - retryStarted >= 300000) { state.status = "error"; return; }
    retryTimer = setTimeout(wake, 10000);
  }
  function wake() {
    if (retryStarted != null && now() - retryStarted >= 300000) { clearRetry(); state.status = "error"; return; }
    if (enabled && state.status === "retrying") {
      if (globalThis.navigator?.onLine === false || globalThis.document?.visibilityState === "hidden") armWake();
      else { clearRetry(); void load(lastRequested, { retry: true }); }
    }
  }
  const lifecycle = () => { releaseGestures(); motion.reset("visibility-change"); wake(); };
  const contextChange = () => { releaseGestures(); motion.reset("audio-context-change"); };
  globalThis.window?.addEventListener("online", wake);
  globalThis.window?.addEventListener("blur", releaseGestures);
  globalThis.document?.addEventListener("visibilitychange", lifecycle);
  context.addEventListener?.("statechange", contextChange);
  return {
    load, setEnabled, releaseRev,
    unload() {
      setEnabled(false); stopNodes(nodes); stopNodes([...retiringNodes]); retiringNodes.clear(); nodes = [];
      engine = null; drivetrain = null; shift = null; manualGear = null;
      state = { ...state, status: "idle", decodedBytes: 0, bankBytes: 0, shift: null, error: null };
    },
    setRevHeld(held) {
      if (!held) releaseRev();
      else if (enabled && nodes.length && context.state === "running" && globalThis.document?.visibilityState !== "hidden" && motion.snapshot(now()).trustedStationary && heldSince == null) {
        heldSince = now();
        showOff.start(context.currentTime, engine.rpm, profile.configuration.engine.limiter);
      }
      return heldSince != null;
    },
    setTransmissionMode(mode) {
      if (mode !== "AUTO" && !(allowManual && mode === "MANUAL")) return false;
      transmissionMode = mode; manualGear = null; return true;
    },
    requestGear(gear) {
      if (!allowManual || transmissionMode !== "MANUAL" || !enabled || !drivetrain || shift || !motion.snapshot(now()).canShift
        || !Number.isInteger(gear) || gear < 1 || gear > drivetrain.gears.length || gear === state.gear) return false;
      if (virtualRpm(motion.snapshot(now()).speedKmh ?? 0, gear, drivetrain) > profile.configuration.engine.limiter * 0.95) return false;
      manualGear = gear; return true;
    },
    getState: () => ({ ...state, enabled, source: "sample", transmissionMode, version: "geaps.v1" }),
    destroy() {
      if (disposed) return;
      setEnabled(false); disposed = true; clearInterval(timer); clearRetry(); abort?.abort(); stopNodes(nodes); stopNodes([...retiringNodes]); retiringNodes.clear(); nodes = [];
      master.disconnect(); limiter.disconnect();
      globalThis.window?.removeEventListener("online", wake);
      globalThis.window?.removeEventListener("blur", releaseGestures);
      globalThis.document?.removeEventListener("visibilitychange", lifecycle);
      context.removeEventListener?.("statechange", contextChange);
    },
  };
}
