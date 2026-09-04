import {
  chooseNightshiftPerformance,
  nightshiftDecodedLimit,
  parseNightshiftBank,
} from "./nightshift-bank.js";
import { createNightshiftLowSpeedBed } from "./nightshift-low-speed-bed.js";
import { nightshiftStateForSpeed } from "./nightshift-model.js";
import { withReadinessTimeout } from "./promise-timeout.js";
import { SAMPLED_SCORE_PERFORMANCE_LEVEL } from "./sampled-score-levels.js";
import { SAMPLED_BANK_TRANSFER_TIMEOUT_MS } from "./sampled-bank-network.js";
import { underwaterEffectParameters } from "./underwater-model.js";

const BANK_URL = `/audio/nightshift.svb?build=${encodeURIComponent(__APP_BUILD__)}`;
const REVIEW_INTERVAL_MS = 50;
const SCHEDULE_AHEAD_SECONDS = 0.85;
const OUTPUT_LEVEL = 0.91;
export const NIGHTSHIFT_TRANSFER_TIMEOUT_MS = SAMPLED_BANK_TRANSFER_TIMEOUT_MS;
export const NIGHTSHIFT_DECODE_TIMEOUT_MS = 10000;
export const NIGHTSHIFT_NATIVE_RETRY_SECONDS = 10;

export function createNightshiftPlayer(context, destination, onSnapshot, onBankStatus) {
  let destroyed = false;
  let active = false;
  let speed = 0;
  let brake = 0;
  let bank = null;
  let loading = null;
  let bankStatus = "idle";
  let bankError = null;
  let current = null;
  let pending = null;
  let prepared = null;
  let preparing = null;
  let targetStateId = null;
  let bankBytes = 0;
  let boundaryFallbacks = 0;
  let nativeMode = false;
  let nativeStartPromise = null;
  let nativeRetryAt = 0;
  let nativeRevision = 0;
  let bankTransferController = null;
  const decoded = new Map();
  const decoding = new Map();
  const recent = [];
  const sources = new Set();

  const output = context.createGain();
  const nativeGain = context.createGain();
  const toneOne = context.createBiquadFilter();
  const toneTwo = context.createBiquadFilter();
  const pressure = context.createBiquadFilter();
  const brakeMakeup = context.createGain();
  output.gain.value = 0;
  nativeGain.gain.value = 0;
  toneOne.type = "lowpass";
  toneTwo.type = "lowpass";
  pressure.type = "lowshelf";
  const openBrake = underwaterEffectParameters(0);
  toneOne.frequency.value = openBrake.cutoffHz;
  toneTwo.frequency.value = openBrake.secondCutoffHz;
  toneOne.Q.value = openBrake.q;
  toneTwo.Q.value = openBrake.secondQ;
  pressure.frequency.value = openBrake.pressureFrequencyHz;
  pressure.gain.value = 0;
  brakeMakeup.gain.value = 1;
  nativeGain
    .connect(toneOne)
    .connect(toneTwo)
    .connect(pressure)
    .connect(brakeMakeup)
    .connect(output)
    .connect(destination);
  const parkBed = createNightshiftLowSpeedBed(context, output);

  function report(status, error = null) {
    bankStatus = status;
    bankError = error instanceof Error ? error.message : error ? String(error) : null;
    onBankStatus?.(bankStatus, bankError);
  }

  async function load() {
    if (bank) return bank;
    if (loading) return loading;
    report("loading");
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    bankTransferController = controller;
    loading = withReadinessTimeout((async () => {
      const response = await fetch(BANK_URL, {
        cache: "force-cache",
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (!response.ok) throw new Error(`NIGHTSHIFT bank request failed (${response.status})`);
      const parsed = parseNightshiftBank(await response.arrayBuffer());
      if (destroyed) throw new Error("NIGHTSHIFT player is closed");
      bank = parsed;
      bankBytes = parsed.audioBytes;
      report("ready");
      return bank;
    })(), {
      label: "NIGHTSHIFT bank transfer",
      timeoutMs: NIGHTSHIFT_TRANSFER_TIMEOUT_MS,
      schedule: window.setTimeout ?? globalThis.setTimeout,
      cancel: window.clearTimeout ?? globalThis.clearTimeout,
      onTimeout: () => controller?.abort(),
    }).catch((error) => {
      loading = null;
      throw error;
    }).finally(() => {
      if (bankTransferController === controller) bankTransferController = null;
    });
    return loading;
  }

  function retainedIds(extra = []) {
    return new Set([
      ...decoded.keys(),
      ...decoding.keys(),
      current?.section.assetId,
      pending?.section.assetId,
      prepared?.section.assetId,
      ...extra,
    ].filter(Boolean));
  }

  function trimDecoded(extra = []) {
    const keep = new Set([
      current?.section.assetId,
      pending?.section.assetId,
      prepared?.section.assetId,
      ...extra,
    ].filter(Boolean));
    const removable = [...decoded.entries()]
      .filter(([id]) => !keep.has(id))
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    while (retainedIds(extra).size > nightshiftDecodedLimit(bank?.manifest.maxDecodedClips)
      && removable.length > 0) decoded.delete(removable.shift()[0]);
  }

  function decodedPcmBytes() {
    return [...decoded.keys()].reduce(
      (total, id) => total + (bank?.assets.get(id)?.decodedPcmBytes ?? 0),
      0,
    );
  }

  function stopNative() {
    nativeMode = false;
    current = null;
    pending = null;
    prepared = null;
    preparing = null;
    for (const source of sources) {
      try { source.stop(context.currentTime + 0.42); } catch {}
    }
  }

  async function ensureDecoded(id) {
    const cached = decoded.get(id);
    if (cached) {
      cached.lastUsed = performance.now();
      return cached.buffer;
    }
    if (decoding.has(id)) return decoding.get(id);
    const asset = bank?.assets.get(id);
    if (!asset) throw new Error(`NIGHTSHIFT performance is missing: ${id}`);
    trimDecoded([id]);
    if (retainedIds([id]).size > nightshiftDecodedLimit(bank.manifest.maxDecodedClips)) {
      throw new Error(`NIGHTSHIFT decoded-slot limit is busy: ${id}`);
    }
    const promise = withReadinessTimeout((async () => {
      const bytes = await asset.audio.arrayBuffer();
      if (destroyed) throw new Error("NIGHTSHIFT player is closed");
      const buffer = await context.decodeAudioData(bytes);
      if (!destroyed) decoded.set(id, { buffer, lastUsed: performance.now() });
      return buffer;
    })(), {
      label: `NIGHTSHIFT decode ${id}`,
      timeoutMs: NIGHTSHIFT_DECODE_TIMEOUT_MS,
      schedule: window.setTimeout ?? globalThis.setTimeout,
      cancel: window.clearTimeout ?? globalThis.clearTimeout,
    }).finally(() => decoding.delete(id));
    decoding.set(id, promise);
    return promise;
  }

  function select(stateId, previous = current?.section ?? null) {
    return chooseNightshiftPerformance(bank.manifest.sections, stateId, previous, Math.random, recent);
  }

  async function prepare(stateId) {
    if (!active || !bank || !stateId || preparing === stateId) return null;
    if (prepared?.section.id === stateId && prepared.section.take !== current?.section.take) return prepared;
    const section = select(stateId);
    if (!section) return null;
    preparing = stateId;
    try {
      const buffer = await ensureDecoded(section.assetId);
      if (active && targetStateId === stateId) prepared = { section, buffer };
      return prepared;
    } finally {
      if (preparing === stateId) preparing = null;
    }
  }

  function startPrepared(selection, startAt, boundaryFallback = false) {
    const source = context.createBufferSource();
    source.buffer = selection.buffer;
    source.connect(nativeGain);
    source.start(startAt);
    source.stop(startAt + selection.section.durationSeconds + 0.02);
    const performance = {
      ...selection,
      source,
      startAt,
      endAt: startAt + selection.section.durationSeconds,
      boundaryFallback,
    };
    sources.add(source);
    source.onended = () => {
      sources.delete(source);
      source.disconnect();
    };
    recent.push(selection.section);
    while (recent.length > 5) recent.shift();
    return performance;
  }

  function startNative() {
    const state = nightshiftStateForSpeed(speed, targetStateId);
    targetStateId = state?.id ?? null;
    if (!active || !state || context.currentTime < nativeRetryAt) return Promise.resolve(null);
    if (current) return Promise.resolve(current);
    if (nativeStartPromise) return nativeStartPromise;
    nativeMode = true;
    const revision = ++nativeRevision;
    nativeStartPromise = (async () => {
      await load();
      const section = select(state.id, null);
      if (!section) throw new Error(`NIGHTSHIFT has no complete performance for: ${state.id}`);
      const buffer = await ensureDecoded(section.assetId);
      if (!active || revision !== nativeRevision || !nightshiftStateForSpeed(speed, targetStateId)) return null;
      nativeGain.gain.setTargetAtTime(SAMPLED_SCORE_PERFORMANCE_LEVEL, context.currentTime, 0.22);
      parkBed.setActive(false);
      current = startPrepared({ section, buffer }, context.currentTime + 0.04);
      prepared = null;
      nativeRetryAt = 0;
      report("ready");
      prepare(targetStateId).catch((error) => report("error", error));
      return current;
    })().catch((error) => {
      if (!destroyed && revision === nativeRevision) {
        nativeMode = false;
        nativeRetryAt = context.currentTime + NIGHTSHIFT_NATIVE_RETRY_SECONDS;
        parkBed.setActive(true);
        report("error", error);
      }
      throw error;
    }).finally(() => {
      if (revision === nativeRevision) nativeStartPromise = null;
    });
    return nativeStartPromise;
  }

  function review() {
    if (destroyed) return;
    parkBed.tick();
    if (!active) return;
    const desired = nightshiftStateForSpeed(speed, targetStateId);
    targetStateId = desired?.id ?? null;
    if (!desired) {
      parkBed.setActive(true);
      nativeGain.gain.setTargetAtTime(0, context.currentTime, 0.38);
      if (nativeMode) stopNative();
      return;
    }
    parkBed.setActive(!current);
    if (!nativeMode) {
      nativeMode = true;
      nativeGain.gain.setTargetAtTime(SAMPLED_SCORE_PERFORMANCE_LEVEL, context.currentTime, 0.22);
    }
    if (!current && !pending) {
      if (!nativeStartPromise && context.currentTime >= nativeRetryAt) {
        startNative().catch(() => {});
      }
      return;
    }
    if (pending && context.currentTime >= pending.startAt) {
      current = pending;
      pending = null;
      prepared = null;
      trimDecoded();
      prepare(targetStateId).catch((error) => report("error", error));
    }
    if (!pending && current && current.endAt - context.currentTime <= SCHEDULE_AHEAD_SECONDS) {
      if (prepared?.section.id === targetStateId) {
        pending = startPrepared(prepared, current.endAt);
      } else {
        // The current complete mix is always decoded, so a slow network/decode
        // cannot punch a hole at the boundary. This fallback is observable and
        // immediately gives the requested family another full phrase to load.
        pending = startPrepared({ section: current.section, buffer: current.buffer }, current.endAt, true);
        boundaryFallbacks += 1;
      }
    }
    onSnapshot?.(snapshot());
  }

  function snapshot() {
    const park = parkBed.snapshot();
    const section = targetStateId ? current?.section ?? pending?.section ?? null : null;
    return {
      scoreId: "nightshift",
      scoreLabel: "NIGHTSHIFT",
      scene: bank && section ? bank.manifest.sections.indexOf(section) : 0,
      sceneId: section?.id ?? "park",
      section: (section?.id ?? "park").toUpperCase(),
      sectionTake: section?.take ?? null,
      rhythmId: section?.performanceId ?? null,
      rhythmTransition: pending ? "boundary-ready" : "steady",
      rhythmLabel: section ? "synth-pop groove" : "ambient",
      boundaryFallback: Boolean(current?.boundaryFallback),
      boundaryFallbacks,
      tempo: section?.bpm ?? null,
      transportTempo: section?.bpm ?? null,
      perceivedTempo: section?.bpm ?? null,
      halfTime: false,
      motionLane: section?.id?.toUpperCase() ?? "PARK",
      decelerationState: brake > 0.2 ? "release" : "cruise",
      activeLanes: section?.activeLanes ?? ["harmony", "atmosphere"],
      source: section ? "sampled-production" : "code-synthesized",
      mixing: section ? "single-synchronous-performance" : "single-harmonic-bed",
      transitionMode: section ? "complete-eight-bar-boundary" : "clockless-park",
      musicalFamily: section?.harmonicIdentity ?? "amin-neon-road",
      bankLoaded: Boolean(bank),
      bankStatus,
      bankError,
      bankBytes,
      bankClips: bank?.manifest.sections.length ?? 0,
      decodedClips: decoded.size,
      decodingClips: decoding.size,
      decodedSlots: retainedIds().size,
      decodedPcmBytes: decodedPcmBytes(),
      liveSourceNodes: sources.size,
      playing: active && (park.active || sources.size > 0),
      parkVoicing: park.voicing,
      parkVoicingChanges: park.voicingChanges,
      lowSpeedLevel: park.level,
      beat: Boolean(section),
      bass: Boolean(section?.activeLanes?.includes("bass")),
    };
  }

  const reviewTimer = window.setInterval(review, REVIEW_INTERVAL_MS);
  return {
    async setActive(nextActive) {
      active = Boolean(nextActive);
      output.gain.setTargetAtTime(active ? OUTPUT_LEVEL : 0, context.currentTime, active ? 0.18 : 0.05);
      const state = nightshiftStateForSpeed(speed, targetStateId);
      targetStateId = state?.id ?? null;
      parkBed.setActive(active && !state);
      if (active && state && !current) await startNative();
      if (!active) {
        nativeRevision += 1;
        nativeStartPromise = null;
        nativeRetryAt = 0;
        nativeGain.gain.setTargetAtTime(0, context.currentTime, 0.08);
        stopNative();
      }
      return snapshot();
    },
    setSpeed(nextSpeed) {
      speed = Math.max(0, Number(nextSpeed) || 0);
      const state = nightshiftStateForSpeed(speed, targetStateId);
      targetStateId = state?.id ?? null;
      if (active && state) prepare(state.id).catch((error) => report("error", error));
      review();
    },
    setBrake(nextBrake) {
      brake = Math.min(1, Math.max(0, Number(nextBrake) || 0));
      const parameters = underwaterEffectParameters(brake);
      toneOne.frequency.setTargetAtTime(parameters.cutoffHz, context.currentTime, 0.08);
      toneTwo.frequency.setTargetAtTime(parameters.secondCutoffHz, context.currentTime, 0.08);
      toneOne.Q.setTargetAtTime(parameters.q, context.currentTime, 0.08);
      toneTwo.Q.setTargetAtTime(parameters.secondQ, context.currentTime, 0.08);
      pressure.gain.setTargetAtTime(parameters.pressureGainDb, context.currentTime, 0.08);
      brakeMakeup.gain.setTargetAtTime(parameters.makeupGain, context.currentTime, 0.08);
    },
    getState: snapshot,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      active = false;
      nativeRevision += 1;
      bankTransferController?.abort();
      bankTransferController = null;
      window.clearInterval(reviewTimer);
      for (const source of sources) {
        try { source.stop(); } catch {}
        source.disconnect();
      }
      sources.clear();
      parkBed.destroy();
      nativeGain.disconnect();
      toneOne.disconnect();
      toneTwo.disconnect();
      pressure.disconnect();
      brakeMakeup.disconnect();
      output.disconnect();
      decoded.clear();
      decoding.clear();
    },
  };
}
