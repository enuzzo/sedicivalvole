import { focusedCrossfade, referenceCrossfade } from "./sample-mix.js";
import { Engine } from "./upstream/Engine.ts";
import { Drivetrain } from "./upstream/Drivetrain.ts";
import { matchEngineLoopLevels } from "./sample-levels.js";
import { createShowOff } from "./show-off.js";
import { createIdleBlip } from "./idle-blip.js";
import { drivelineAudibility } from "./driveline-audio.js";
import { prepareEngineLoopSeam } from "./loop-seam.js";
import { engineProfile } from "./profiles.js";
import { boundedRpm, decideAutomaticGear, virtualRpm, engineRoadSpeed, selectRoadGear } from "./gearbox.js";
import { engineSampleCents } from "./sample-pitch.js";
import { advanceEngineDemand, planEngineShift, sampleEngineShift, transmissionCents, boostDemand } from "./powertrain.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MAX_DECODED_BYTES = 64 * 1024 * 1024;
const MAX_TRANSITION_BYTES = 128 * 1024 * 1024;
function reserveDecodedWav(bytes, rate) {
  const view = new DataView(bytes);
  let channels, nativeRate, blockAlign, dataBytes;
  for (let at = 12; at + 8 <= view.byteLength;) {
    const id = String.fromCharCode(...new Uint8Array(bytes, at, 4)), size = view.getUint32(at + 4, true);
    if (id === "fmt " && size >= 16 && at + 24 <= view.byteLength) {
      channels = view.getUint16(at + 10, true); nativeRate = view.getUint32(at + 12, true); blockAlign = view.getUint16(at + 20, true);
    }
    if (id === "data") dataBytes = size;
    at += 8 + size + (size % 2);
  }
  if (!channels || !nativeRate || !blockAlign || !dataBytes) throw new Error("Engine WAV format cannot be budgeted");
  return Math.ceil(dataBytes / blockAlign * rate / nativeRate + 128) * channels * 4;
}
const sha256 = async (bytes) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(v => v.toString(16).padStart(2, "0")).join("");
const hold = (param, when) => {
  if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(when);
  else { const value = param.value; param.cancelScheduledValues(when); param.setValueAtTime(value, when); }
};

/** Original host orchestration around declared MIT engine-audio primitives. */
export function createGeapsRuntime({ context, destination, motion, now = () => performance.now(), onEvent = () => {}, fetcher = fetch, allowManual = false, resolveProfile = engineProfile }) {
  const master = context.createGain();
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -8; limiter.knee.value = 4; limiter.ratio.value = 20;
  limiter.attack.value = 0.003; limiter.release.value = 0.15;
  master.gain.value = 0;
  master.connect(limiter).connect(destination);
  let nodes = [], voice = null, engine = null, drivetrain = null, profile = null;
  let demandState = null, roadCoupled = false, motionGeneration = null;
  const retiringVoices = new Set();
  const prepared = () => nodes.length > 0 || (voice != null && !voice.failed);
  let generation = 0, abort = null, disposed = false, enabled = false;
  let state = { status: "idle", profileId: "mono", rpm: 1000, gear: 1, shift: null, drive: 0, deceleration: 0, motion: "lost", trustedStationary: false, revving: false, decodedBytes: 0, error: null };
  let previousTime = context.currentTime, selectedAt = context.currentTime, shift = null;
  let quietStop = false;
  let lastMotionKey = null;
  const manualAvailable = evidence => enabled && prepared() && context.state === "running"
    && globalThis.document?.visibilityState !== "hidden"
    && !(Number.isFinite(evidence.speedKmh) && Math.round(evidence.speedKmh) > 0);
  let heldSince = null, retryTimer = null, retryStarted = null, retryCount = 0;
  let lastRequested = "mono", requestedRevision = 0, loadingTask = Promise.resolve();
  let timer = null, transmissionMode = "AUTO", manualGear = null;
  const retiringNodes = new Set();
  const stopNodes = (entries) => entries.forEach(({ source, gain }) => { try { source.stop(); } catch {} source.disconnect(); gain.disconnect(); });
  const stopVoices = () => { voice?.stop(); voice = null; for (const old of retiringVoices) old.stop(); retiringVoices.clear(); };
  const clearRetry = () => { clearTimeout(retryTimer); retryTimer = null; };
  const idleBlip = createIdleBlip();
  const showOff = createShowOff();
  const releaseRev = () => { heldSince = null; showOff.reset(); state.revving = false; state.showOffPhase = null; };
  const releaseGestures = () => { releaseRev(); idleBlip.reset(); state.idleBlip = false; };
  const cancelShift = (at = context.currentTime) => {
    if (shift) {
      for (const node of nodes) { hold(node.gain.gain, at); hold(node.source.detune, at); }
      if (voice) for (const key of ["rpm", "load", "boost"]) hold(voice.params.get(key), at);
      onEvent("engine.shift.cancelled", { fromGear: shift.fromGear, toGear: shift.toGear, contextTime: at });
    }
    shift = null; state.shift = null; state.shiftPhase = null;
    if (drivetrain) { drivetrain.pendingGear = null; drivetrain.gear = state.gear; }
  };
  const setEnabled = (value) => {
    enabled = Boolean(value) && !disposed;
    if (!enabled) {
      releaseGestures(); state.trustedStationary = false; state.canRev = false; abort?.abort(); clearRetry(); generation++; requestedRevision++;
      clearInterval(timer); timer = null; state.status = prepared() ? "ready" : "idle";
      cancelShift();
      roadCoupled = false;
    } else if (!timer) timer = setInterval(tick, 25);
    const at = context.currentTime;
    hold(master.gain, at); master.gain.setTargetAtTime(enabled && prepared() ? 0.16 * (quietStop ? 0.7 : 1) : 0, at, 0.04);
    if (voice) { hold(voice.params.get("active"), at); voice.params.get("active").setValueAtTime(enabled ? 1 : 0, at); }
    previousTime = at;
  };
  function gainsFor(rpm, drive) {
    const crossfade = profile.sampleBlend === "reference" ? referenceCrossfade : focusedCrossfade;
    const { gain1: high, gain2: low } = crossfade(rpm, ...profile.crossover);
    const { gain1: on, gain2: off } = crossfade(drive, 0, 1);
    return { on_low: on * low, off_low: off * low, on_high: on * high, off_high: off * high,
      limiter: clamp((rpm - profile.configuration.engine.soft_limiter * 0.93) / (profile.configuration.engine.limiter * 0.07), 0, 1) * 0.4,
      tranny_on: on * 0.25 * (state.drivelineLevel ?? 0), tranny_off: off * 0.25 * (state.drivelineLevel ?? 0) };
  }
  function targets(rpm, drive) {
    const gains = gainsFor(rpm, drive);
    return nodes.map(node => ({ node,
      gain: (gains[node.asset.role] ?? 0) * (node.levelGain ?? node.asset.volume ?? 1) * (voice && !voice.failed && /^(on|off)_/.test(node.asset.role) ? profile.textureLevel : 1),
      cents: node.asset.role === "limiter" ? 0 : node.asset.role.startsWith("tranny")
        ? transmissionCents(state.motionSpeedKmh ?? 0, profile)
        : engineSampleCents(rpm, node.asset, profile),
    }));
  }
  function applyContinuous(rpm, drive, at) {
    for (const { node, gain, cents } of targets(rpm, drive)) {
      hold(node.gain.gain, at); hold(node.source.detune, at);
      node.gain.gain.setTargetAtTime(gain, at, 0.035);
      node.source.detune.setTargetAtTime(cents, at, 0.035);
    }
    if (voice) {
      for (const [key, value] of Object.entries({ rpm, load: drive, boost: boostDemand({ rpm, load: drive }, profile) })) {
        const param = voice.params.get(key); hold(param, at); param.setTargetAtTime(value, at, .035);
      }
    }
  }
  function scheduleShift(decision, evidence, at) {
    const fromGear = state.gear;
    const nextRpm = boundedRpm(virtualRpm(evidence.speedKmh ?? 0, decision.gear, drivetrain), profile);
    const effective = at + 0.015;
    const plan = planEngineShift({ at: effective, fromGear, toGear: decision.gear, fromRpm: engine.rpm,
      toRpm: nextRpm, fromLoad: state.drive, toLoad: demandState?.load ?? evidence.drive, reason: decision.reason, profile, duration: profile.duration });
    for (const node of nodes) { hold(node.gain.gain, effective); hold(node.source.detune, effective); }
    if (voice) for (const key of ["rpm", "load", "boost"]) hold(voice.params.get(key), effective);
    for (const point of plan.points) {
      for (const { node, gain, cents } of targets(point.rpm, point.load)) {
        node.source.detune.linearRampToValueAtTime(cents, point.at);
        node.gain.gain.linearRampToValueAtTime(gain, point.at);
      }
      if (voice) for (const [key, value] of Object.entries({ rpm: point.rpm, load: point.load, boost: boostDemand({ rpm: point.rpm, load: point.load }, profile) })) {
        voice.params.get(key).linearRampToValueAtTime(value, point.at);
      }
    }
    drivetrain.changeGear(decision.gear);
    shift = { ...plan, fromGear, toGear: decision.gear, reason: decision.reason, rpm: nextRpm, committed: false };
    state.shift = decision.reason;
    onEvent("engine.shift.scheduled", { fromGear, toGear: decision.gear, reason: decision.reason, effectiveContextTime: effective, duration: profile.duration,
      releaseAt: plan.releaseAt, syncAt: plan.syncAt, endAt: plan.endAt });
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
    state.canRev = Boolean(manualAvailable(evidence));
    state.motionReason = evidence.reason; state.motionSpeedKmh = evidence.speedKmh; state.motionAgeMs = evidence.ageMs;
    const motionKey = `${evidence.freshness}/${evidence.reason}`;
    if (motionKey !== lastMotionKey) {
      lastMotionKey = motionKey;
      onEvent("engine.motion.changed", { freshness: evidence.freshness, reason: evidence.reason, ageMs: evidence.ageMs,
        speedKmh: evidence.speedKmh, timestampPolicy: evidence.timestampPolicy });
    }
    state.motion = evidence.freshness; state.deceleration = evidence.deceleration;
    state.drivelineLevel = drivelineAudibility({ ...evidence,
      rawSpeedKmh: evidence.rawSpeedKmh ?? evidence.speedKmh, gear: state.gear, neutral: heldSince != null });
    state.trustedStationary = enabled && prepared() && evidence.trustedStationary && context.state === "running" && globalThis.document?.visibilityState !== "hidden";
    if (state.trustedStationary) quietStop = true;
    else if (evidence.freshness === "fresh" && evidence.rawSpeedKmh >= 1) quietStop = false;
    if (!state.canRev || (heldSince != null && now() - heldSince >= 8000)) releaseRev();
    if (!enabled || !engine || context.state !== "running") { previousTime = context.currentTime; return; }
    const at = context.currentTime;
    if (voice) {
      const visible = globalThis.document?.visibilityState !== "hidden";
      voice.params.get("active").setValueAtTime(visible ? 1 : 0, at);
      voice.params.get("events").setValueAtTime(visible && (evidence.freshness === "fresh" || heldSince != null) ? 1 : 0, at);
    }
    const elapsed = at - previousTime; previousTime = at;
    if (elapsed <= 0) return;
    if (elapsed > 0.5) {
      cancelShift(at);
      releaseGestures(); state.trustedStationary = false; motion.reset("audio-clock-gap"); selectedAt = at;
      if (voice) voice.params.get("events").setValueAtTime(0, at);
    }
    const sourceChanged = Number.isInteger(evidence.generation) && motionGeneration != null && evidence.generation !== motionGeneration;
    if (Number.isInteger(evidence.generation)) motionGeneration = evidence.generation;
    if (evidence.freshness === "lost" || elapsed > 0.5 || sourceChanged) {
      roadCoupled = false;
      cancelShift(at);
    }
    if (shift) {
      if (!shift.committed && at >= shift.commitAt) {
        drivetrain.commitGear(); state.gear = shift.toGear;
        engine.rpm = shift.rpm; engine.omega = shift.rpm * 2 * Math.PI / 60;
        shift.committed = true; selectedAt = at;
        onEvent("engine.shift.committed", { gear: state.gear, reason: shift.reason });
      }
      if (at < shift.endAt) {
        const acoustic = sampleEngineShift(shift, at);
        state.rpm = Math.round(acoustic.rpm); state.drive = acoustic.load; state.shiftPhase = acoustic.phase;
        updateMaster(at); return;
      }
      shift = null; state.shift = null; state.shiftPhase = null;
    }
    const activeEvidence = elapsed > 0.5 ? motion.snapshot(now()) : evidence;
    // Acquire the road ratio without replaying imaginary first-to-sixth shifts.
    // This is initialization after load/loss, never a pedal or real-gear reading.
    if (!roadCoupled && ["fresh", "degraded"].includes(activeEvidence.freshness) && Number.isFinite(activeEvidence.speedKmh)) {
      if (transmissionMode === "AUTO") {
        state.gear = selectRoadGear(activeEvidence.speedKmh, activeEvidence.drive, profile);
        drivetrain.gear = state.gear; selectedAt = at;
      }
      roadCoupled = true;
    }
    const gesture = heldSince != null && state.canRev ? showOff.sample(at) : null;
    if (heldSince != null && !gesture) releaseRev();
    const revving = Boolean(gesture);
    state.showOffPhase = gesture?.phase ?? null;
    state.revving = revving;
    const blipRpm = idleBlip.sample(at, state.trustedStationary && !revving && !shift);
    state.idleBlip = blipRpm > 0;
    const dt = Math.min(0.08, elapsed);
    demandState = advanceEngineDemand(demandState, activeEvidence, profile, dt, { throttleOverride: gesture?.throttle ?? null });
    const demand = gesture ? gesture.throttle : demandState.load;
    state.drive = demand; state.throttle = demandState.throttle; state.roadLoad = demandState.roadLoad; state.coast = demandState.coast;
    engine.throttle = demand;
    engine.integrate(drivetrain.inertia, at * 1000, dt);
    const coupledRpm = activeEvidence.freshness === "lost" ? (quietStop ? 600 : 1000)
      : boundedRpm(profile.singleSpeed ? 1000 + engineRoadSpeed(activeEvidence.speedKmh) / 130 * 7000 : virtualRpm(activeEvidence.speedKmh ?? 0, state.gear, drivetrain), profile);
    if (!revving) {
      drivetrain.omega = coupledRpm * 2 * Math.PI / 60;
      engine.solveVel(drivetrain, dt);
    }
    if (gesture) engine.omega = gesture.rpm * 2 * Math.PI / 60;
    if (state.trustedStationary && !revving) engine.omega = (600 + blipRpm) * 2 * Math.PI / 60;
    engine.rpm = boundedRpm(Math.max(quietStop || revving ? 600 : 1000, engine.omega * 60 / (2 * Math.PI)), profile);
    engine.omega = engine.rpm * 2 * Math.PI / 60;
    state.rpm = Math.round(engine.rpm);
    const decision = profile.singleSpeed ? null : !revving && transmissionMode === "MANUAL" && manualGear != null && activeEvidence.canShift && !shift
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
    const loadStartedAt = now();
    lastRequested = profileId;
    if (retry) onEvent("engine.bank.retry", { profileId, attempt: retryCount });
    if (!retry) { clearRetry(); retryStarted = null; retryCount = 0; }
    const revision = ++generation;
    abort?.abort(); abort = new AbortController();
    const controller = abort;
    const timeout = setTimeout(() => controller.abort(), 20000);
    state.status = "loading"; state.error = null;
    const next = allowManual ? resolveProfile(profileId) : engineProfile(profileId);
    const freshNodes = [];
    let freshVoice = null;
    try {
      const assets = [];
      let decodedBytes = 0, transferMs = 0, decodeMs = 0, peakUnionBytes = state.decodedBytes;
      for (const asset of next.assets) {
        if (disposed || revision !== generation || controller.signal.aborted) throw new Error("Engine bank load cancelled");
        const transferStart = now();
        const response = await fetcher(asset.url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Engine audio HTTP ${response.status}`);
        const bytes = await response.arrayBuffer();
        if (await sha256(bytes) !== asset.sha256) throw new Error("Engine audio integrity mismatch");
        transferMs += now() - transferStart;
        // Exact admitted WAV frame/channel metadata bounds the browser-rate PCM.
        // Account for old/new buffers and transfer; native decoder overhead is separate.
        const reserve = reserveDecodedWav(bytes, context.sampleRate ?? 48000);
        const retainedBytes = [...retiringNodes].reduce((sum, node) => sum + (node.decodedBytes ?? 0), 0);
        if (decodedBytes + reserve > MAX_DECODED_BYTES || state.decodedBytes + retainedBytes + decodedBytes + bytes.byteLength + reserve > MAX_TRANSITION_BYTES) throw new Error("Engine bank exceeds accounted memory budget");
        const decodeStart = now();
        const buffer = await context.decodeAudioData(bytes);
        decodeMs += now() - decodeStart;
        decodedBytes += buffer.length * buffer.numberOfChannels * 4;
        peakUnionBytes = Math.max(peakUnionBytes, state.decodedBytes + retainedBytes + decodedBytes + asset.bytes);
        if (decodedBytes > MAX_DECODED_BYTES || peakUnionBytes > MAX_TRANSITION_BYTES) throw new Error("Engine bank exceeds accounted memory budget");
        assets.push({ asset, buffer });
      }
      if (disposed || revision !== generation) return false;
      if (controller.signal.aborted) throw new Error("Engine bank load cancelled or timed out");
      if (next.voice) {
        if (context.audioWorklet) {
          const module = await new Promise((resolve, reject) => {
            const cancelled = () => reject(new Error("Engine renderer load cancelled or timed out"));
            if (controller.signal.aborted) { cancelled(); return; }
            controller.signal.addEventListener("abort", cancelled, { once: true });
            import("./procedural-voice.js").then(value => { controller.signal.removeEventListener("abort", cancelled); resolve(value); }, error => { controller.signal.removeEventListener("abort", cancelled); reject(error); });
          });
          freshVoice = await module.prepareProceduralVoice(context, { ...next.voice, limiter: next.configuration.engine.limiter }, master, controller.signal);
        } else if (!assets.length) throw new Error("Engine synthesis requires AudioWorklet");
      }
      if (disposed || revision !== generation || controller.signal.aborted) { freshVoice?.stop(); return false; }
      for (const entry of assets) {
        if (/^(on|off)_(low|high)$/.test(entry.asset.role)) entry.seam = prepareEngineLoopSeam(entry.buffer);
      }
      const levelGains = matchEngineLoopLevels(assets);
      const at = context.currentTime + 0.025;
      for (const { asset, buffer, seam } of assets) {
        const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
        if (seam?.applied) { source.loopStart = seam.loopStart; source.loopEnd = seam.loopEnd; }
        const gain = context.createGain(); gain.gain.value = 0;
        source.connect(gain).connect(master); source.start(at);
        freshNodes.push({ source, gain, asset, decodedBytes: buffer.length * buffer.numberOfChannels * 4, levelGain: levelGains.get(asset.role) });
      }
      for (const old of nodes) {
        retiringNodes.add(old);
        hold(old.gain.gain, context.currentTime);
        old.gain.gain.linearRampToValueAtTime(0, at + 0.06);
        old.source.onended = () => { old.source.disconnect(); old.gain.disconnect(); retiringNodes.delete(old); };
        old.source.stop(at + 0.08);
      }
      if (voice) {
        const old = voice; retiringVoices.add(old);
        hold(old.gain.gain, context.currentTime); old.gain.gain.linearRampToValueAtTime(0, at + .06);
        setTimeout(() => { old.stop(); retiringVoices.delete(old); }, 160);
      }
      nodes = freshNodes;
      voice = freshVoice;
      if (voice) {
        const loadedVoice = voice;
        voice.source.onprocessorerror = () => {
          if (disposed || voice !== loadedVoice) return;
          voice.failed = true; voice.gain.gain.setTargetAtTime(0, context.currentTime, .02);
          releaseGestures(); cancelShift(); state.status = "retrying"; state.error = "Engine synthesis interrupted";
          onEvent("engine.renderer.failed", { profileId: profile.id });
          retryStarted ??= now(); clearRetry();
          if (enabled && now() - retryStarted < 300000) retryTimer = setTimeout(wake, Math.min(30000, 5000 * 2 ** Math.min(retryCount++, 3)));
          else state.status = "error";
        };
        voice.params.get("active").setValueAtTime(enabled ? 1 : 0, at);
        voice.gain.gain.setValueAtTime(0, at); voice.gain.gain.linearRampToValueAtTime(next.voice.mix ?? 1, at + .08);
      }
      profile = next; engine = new Engine(); engine.init(next.configuration.engine);
      engine.rpm = 1000; engine.omega = 1000 * 2 * Math.PI / 60;
      drivetrain = new Drivetrain(); drivetrain.init(next.configuration.drivetrain); drivetrain.gear = 1;
      shift = null; demandState = null; roadCoupled = false; motionGeneration = null; selectedAt = context.currentTime; previousTime = context.currentTime;
      releaseGestures(); state = { ...state, status: "ready", profileId, decodedBytes, peakUnionBytes, transferMs: Math.round(transferMs), decodeMs: Math.round(decodeMs), bankBytes: next.assets.reduce((sum, asset) => sum + asset.bytes, 0), gear: 1, shift: null, shiftPhase: null, singleSpeed: Boolean(profile.singleSpeed), error: null };
      retryStarted = null; retryCount = 0;
      onEvent("engine.bank.ready", { profileId, decodedBytes, peakUnionBytes, transferMs: state.transferMs, decodeMs: state.decodeMs, clips: nodes.length, renderer: voice ? nodes.length ? "hybrid" : "procedural" : "sample", loadMs: Math.round(now() - loadStartedAt),
        preparedLoopRoles: assets.filter(entry => entry.seam?.applied).map(entry => entry.asset.role) });
      return true;
    } catch (error) {
      stopNodes(freshNodes);
      freshVoice?.stop();
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
  const cancelAcousticEvents = () => {
    roadCoupled = false;
    cancelShift();
    if (voice) {
      const at = context.currentTime;
      for (const key of ["boost", "events"]) { hold(voice.params.get(key), at); voice.params.get(key).setValueAtTime(0, at); }
      if (globalThis.document?.visibilityState === "hidden" || context.state !== "running") voice.params.get("active").setValueAtTime(0, at);
    }
  };
  const lifecycle = () => { releaseGestures(); cancelAcousticEvents(); motion.reset("visibility-change"); wake(); };
  const contextChange = () => { releaseGestures(); cancelAcousticEvents(); motion.reset("audio-context-change"); };
  globalThis.window?.addEventListener("online", wake);
  globalThis.window?.addEventListener("blur", releaseGestures);
  globalThis.document?.addEventListener("visibilitychange", lifecycle);
  context.addEventListener?.("statechange", contextChange);
  return {
    load, setEnabled, releaseRev,
    unload() {
      setEnabled(false); stopNodes(nodes); stopNodes([...retiringNodes]); retiringNodes.clear(); nodes = []; stopVoices();
      engine = null; drivetrain = null; shift = null; manualGear = null;
      state = { ...state, status: "idle", decodedBytes: 0, bankBytes: 0, shift: null, error: null };
    },
    setRevHeld(held) {
      if (!held) releaseRev();
      else if (manualAvailable(motion.snapshot(now())) && heldSince == null) {
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
      if (!allowManual || profile?.singleSpeed || transmissionMode !== "MANUAL" || !enabled || !drivetrain || shift || !motion.snapshot(now()).canShift
        || !Number.isInteger(gear) || gear < 1 || gear > drivetrain.gears.length || gear === state.gear) return false;
      if (virtualRpm(motion.snapshot(now()).speedKmh ?? 0, gear, drivetrain) > profile.configuration.engine.limiter * 0.95) return false;
      manualGear = gear; return true;
    },
    getState: () => ({ ...state, enabled, prepared: prepared(), playing: enabled && prepared() && context.state === "running",
      requestedProfileId: lastRequested, source: voice && !voice.failed ? nodes.length ? "hybrid" : "procedural" : "sample", transmissionMode, version: "geaps.v2" }),
    destroy() {
      if (disposed) return;
      setEnabled(false); disposed = true; clearInterval(timer); clearRetry(); abort?.abort(); stopNodes(nodes); stopNodes([...retiringNodes]); retiringNodes.clear(); nodes = []; stopVoices();
      master.disconnect(); limiter.disconnect();
      globalThis.window?.removeEventListener("online", wake);
      globalThis.window?.removeEventListener("blur", releaseGestures);
      globalThis.document?.removeEventListener("visibilitychange", lifecycle);
      context.removeEventListener?.("statechange", contextChange);
    },
  };
}
