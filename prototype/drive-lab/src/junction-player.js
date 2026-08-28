import {
  chooseJunctionPerformance,
  junctionPerformanceParameters,
  junctionMovementGain,
  junctionSectionForEnergy,
  parseJunctionBank,
} from "./junction-bank.js";

const BANK_URL = `/audio/junction.svb?build=${encodeURIComponent(__APP_BUILD__)}`;
const REVIEW_INTERVAL_MS = 50;
const SCHEDULE_AHEAD_SECONDS = 0.8;
const PERFORMANCE_LEVEL = 0.72;
const OUTPUT_LEVEL = 0.9;
const CLIP_EDGE_FADE_SECONDS = 0.012;
export const JUNCTION_RHYTHM_FADE_SECONDS = 4;
const JUNCTION_RHYTHM_QUIET_LEVEL = 0.08;
const JUNCTION_AMBIENT_RECOVERY_SECONDS = 1.5;
const JUNCTION_RHYTHM_RECOVERY_SECONDS = 1.2;

export function createJunctionPlayer(context, destination, onSnapshot) {
  let active = false;
  let energy = 0;
  let brake = 0;
  let bank = null;
  let loading = null;
  let currentPerformance = null;
  let pendingPerformance = null;
  let preparedPerformance = null;
  let preparingId = null;
  let scheduling = false;
  let bankBytes = 0;
  let mixCutoff = 18000;
  let boundaryRevision = 0;
  const decoded = new Map();
  const decoding = new Map();
  const activeSources = new Set();
  const recentPerformances = [];

  const mixBus = context.createGain();
  const masterFilter = context.createBiquadFilter();
  const output = context.createGain();
  const delaySend = context.createGain();
  const delay = context.createDelay(0.6);
  const feedback = context.createGain();
  const wet = context.createGain();
  masterFilter.type = "lowpass";
  masterFilter.frequency.value = mixCutoff;
  masterFilter.Q.value = 0.65;
  output.gain.value = 0;
  delaySend.gain.value = 1;
  delay.delayTime.value = 0.25;
  feedback.gain.value = 0.1;
  wet.gain.value = 0.03;
  mixBus.connect(masterFilter);
  mixBus.connect(delaySend);
  delaySend.connect(delay);
  delay.connect(wet).connect(masterFilter);
  delay.connect(feedback).connect(delay);
  masterFilter.connect(output).connect(destination);

  function applyMovementGate(time = context.currentTime) {
    output.gain.setTargetAtTime(
      active ? junctionMovementGain(energy) * OUTPUT_LEVEL : 0,
      time,
      active ? 0.16 : 0.035,
    );
  }

  function applyMasterTone(time = context.currentTime) {
    const frequency = mixCutoff + (430 - mixCutoff) * brake;
    masterFilter.frequency.setTargetAtTime(
      frequency,
      time,
      brake > 0.2 ? 0.08 : 0.22,
    );
  }

  function decodedPcmBytes() {
    return [...decoded.keys()].reduce(
      (total, id) => total + (bank?.assets.get(id)?.decodedPcmBytes ?? 0),
      0,
    );
  }

  function snapshot() {
    const activePerformance = currentPerformance ?? pendingPerformance;
    const sectionId = activePerformance?.id ?? junctionSectionForEnergy(energy, brake > 0.2);
    const selected = activePerformance?.section ?? null;
    const sceneIndex = selected && bank ? bank.manifest.sections.indexOf(selected) : -1;
    return {
      scoreId: "junction",
      scoreLabel: "JUNCTION",
      scene: Math.max(0, sceneIndex),
      sceneId: sectionId,
      section: sectionId.toUpperCase(),
      sectionTake: selected?.take ?? null,
      sectionTakes: selected ? [selected.take] : [],
      sectionRhythms: selected ? [selected.performanceId] : [],
      musicalFamily: selected?.harmonicIdentity ?? bank?.manifest.harmonicIdentity ?? null,
      rhythmId: selected?.performanceId ?? null,
      rhythmTransition: activePerformance
        ? rhythmTransitionAt(activePerformance, context.currentTime)
        : "idle",
      rhythmFadeSeconds: JUNCTION_RHYTHM_FADE_SECONDS,
      halfTime: false,
      rhythmLabel: sectionId === "rest"
        ? "ambient"
        : (selected?.bpm ?? 127) < 158 ? "slow break" : "full break",
      tempo: selected?.bpm ?? bank?.manifest.bpmRange?.[0] ?? 127,
      energy,
      movementGain: junctionMovementGain(energy),
      decelerationState: brake > 0.2 ? "release" : "cruise",
      activeLanes: selected?.activeLanes
        ?? (sectionId === "rest" ? ["harmony", "atmosphere"] : ["breaks", "harmony"]),
      source: "sampled-production",
      mixing: "single-synchronous-performance",
      transitionMode: "complete-eight-bar-boundary",
      boundaryRevision,
      tonalDecks: selected?.tonalDecks ?? bank?.manifest.tonalDecks ?? 1,
      automaticLead: selected?.automaticLead ?? bank?.manifest.automaticLead ?? false,
      liveMix: activePerformance ? {
        wet: Number(activePerformance.effects.wet.toFixed(3)),
        feedback: Number(activePerformance.effects.feedback.toFixed(3)),
      } : null,
      bankLoaded: Boolean(bank),
      bankBytes,
      bankClips: bank?.manifest.sections.length ?? 0,
      sourceRecordingsUsed: bank?.manifest.sourceRecordingsUsed ?? 0,
      decodedClips: decoded.size,
      decodedPcmBytes: decodedPcmBytes(),
      playing: active && activeSources.size > 0,
    };
  }

  function rhythmTransitionAt(performance, time) {
    const envelope = performance?.rhythmEnvelope;
    if (!envelope) return "steady";
    if (time < envelope.endAt) return envelope.label;
    return envelope.to <= JUNCTION_RHYTHM_QUIET_LEVEL ? "quiet" : "steady";
  }

  function rhythmEnvelopeValue(performance, time) {
    const envelope = performance?.rhythmEnvelope;
    if (!envelope || time >= envelope.endAt) return envelope?.to ?? 1;
    if (time <= envelope.startAt || envelope.endAt <= envelope.startAt) return envelope.from;
    const progress = (time - envelope.startAt) / (envelope.endAt - envelope.startAt);
    return envelope.from + (envelope.to - envelope.from) * progress;
  }

  function setRhythmEnvelope(performance, target, requestedTime, duration, label) {
    if (!performance?.rhythmGain) return;
    const startAt = Math.max(performance.startAt, requestedTime);
    const endAt = Math.min(performance.endAt, startAt + duration);
    const from = rhythmEnvelopeValue(performance, startAt);
    const parameter = performance.rhythmGain.gain;
    parameter.cancelScheduledValues?.(startAt);
    parameter.setValueAtTime(from, startAt);
    parameter.linearRampToValueAtTime(target, endAt);
    performance.rhythmEnvelope = { from, to: target, startAt, endAt, label };
  }

  function applyRhythmDirection(time = context.currentTime) {
    if (!currentPerformance) return;
    const desiredId = junctionSectionForEnergy(energy, brake > 0.2);
    const transition = rhythmTransitionAt(currentPerformance, time);
    if (desiredId === "rest" && currentPerformance.id !== "rest" && transition !== "fade-out" && transition !== "quiet") {
      setRhythmEnvelope(
        currentPerformance,
        JUNCTION_RHYTHM_QUIET_LEVEL,
        time,
        JUNCTION_RHYTHM_FADE_SECONDS,
        "fade-out",
      );
    } else if (desiredId !== "rest" && currentPerformance.id !== "rest" && (transition === "fade-out" || transition === "quiet")) {
      setRhythmEnvelope(
        currentPerformance,
        1,
        time,
        JUNCTION_RHYTHM_RECOVERY_SECONDS,
        "fade-in",
      );
    }
  }

  function trimDecodedCache(extraKeep = []) {
    if (!bank) return;
    const limit = Math.max(2, bank.manifest.maxDecodedClips ?? 6);
    const keep = new Set([
      currentPerformance?.section.assetId,
      pendingPerformance?.section.assetId,
      preparedPerformance?.section.assetId,
      ...extraKeep,
    ].filter(Boolean));
    const removable = [...decoded.entries()]
      .filter(([id]) => !keep.has(id))
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    while (decoded.size > limit && removable.length > 0) {
      decoded.delete(removable.shift()[0]);
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
    if (!asset) throw new Error(`JUNCTION performance is missing: ${id}`);
    const promise = (async () => {
      const audioBytes = await asset.audio.arrayBuffer();
      const buffer = await context.decodeAudioData(audioBytes);
      decoded.set(id, { buffer, lastUsed: performance.now() });
      trimDecodedCache([id]);
      return buffer;
    })().finally(() => decoding.delete(id));
    decoding.set(id, promise);
    return promise;
  }

  async function load() {
    if (bank) return bank;
    if (loading) return loading;
    loading = (async () => {
      const response = await fetch(BANK_URL, { cache: "force-cache" });
      if (!response.ok) throw new Error(`JUNCTION bank request failed (${response.status})`);
      bank = parseJunctionBank(await response.arrayBuffer());
      bankBytes = bank.audioBytes;
      return bank;
    })().catch((error) => {
      loading = null;
      console.error("[junction] the live music bank did not load", error);
      throw error;
    });
    return loading;
  }

  function prewarmTarget() {
    if (!active || !bank) return;
    const id = junctionSectionForEnergy(energy, brake > 0.2);
    if (preparedPerformance?.id === id || preparingId === id) return;
    const section = chooseJunctionPerformance(
      bank.manifest.sections,
      id,
      currentPerformance?.section ?? null,
      Math.random,
      recentPerformances,
    );
    if (!section) return;
    preparingId = id;
    ensureDecoded(section.assetId).then(() => {
      if (active && junctionSectionForEnergy(energy, brake > 0.2) === id) {
        preparedPerformance = { id, section };
      }
    }).catch((error) => {
      console.warn("[junction] could not pre-decode the next performance", error);
    }).finally(() => {
      if (preparingId === id) preparingId = null;
    });
  }

  async function schedulePerformance(id, requestedTime, previousSection = null, previousId = null) {
    const prepared = preparedPerformance?.id === id
      && preparedPerformance.section.take !== previousSection?.take
      ? preparedPerformance.section
      : null;
    preparedPerformance = null;
    const section = prepared
      ?? chooseJunctionPerformance(
        bank.manifest.sections,
        id,
        previousSection,
        Math.random,
        recentPerformances,
      );
    if (!section) throw new Error(`JUNCTION has no complete performance for: ${id}`);
    const buffer = await ensureDecoded(section.assetId);
    if (!active) return null;
    const startAt = Math.max(requestedTime, context.currentTime + 0.035);
    const duration = section.durationSeconds;
    const endAt = startAt + duration;
    const effects = junctionPerformanceParameters(energy, section.bpm);
    mixCutoff = effects.cutoff;
    delay.delayTime.setTargetAtTime(effects.delaySeconds, startAt, 0.04);
    feedback.gain.setTargetAtTime(effects.feedback, startAt, 0.06);
    wet.gain.setTargetAtTime(effects.wet, startAt, 0.08);
    applyMasterTone(startAt);

    const rhythmGain = context.createGain();
    rhythmGain.connect(mixBus);
    const enteringFromZeroBeat = id !== "rest" && (previousId === null || previousId === "rest");
    const enteringAmbient = id === "rest" && previousId !== null && previousId !== "rest";
    const entranceLevel = enteringFromZeroBeat ? 0 : enteringAmbient ? JUNCTION_RHYTHM_QUIET_LEVEL : 1;
    const entranceDuration = enteringFromZeroBeat
      ? JUNCTION_RHYTHM_FADE_SECONDS
      : enteringAmbient ? JUNCTION_AMBIENT_RECOVERY_SECONDS : 0;
    rhythmGain.gain.setValueAtTime(entranceLevel, startAt);
    if (entranceDuration > 0) {
      rhythmGain.gain.linearRampToValueAtTime(1, Math.min(endAt, startAt + entranceDuration));
    }
    const performanceRecord = {
      id,
      section,
      effects,
      startAt,
      endAt,
      sources: new Set(),
      rhythmGain,
      rhythmEnvelope: {
        from: entranceLevel,
        to: 1,
        startAt,
        endAt: Math.min(endAt, startAt + entranceDuration),
        label: entranceDuration > 0 ? "fade-in" : "steady",
      },
    };
    const source = context.createBufferSource();
    const tone = context.createBiquadFilter();
    const performanceGain = context.createGain();
    source.buffer = buffer;
    tone.type = "lowpass";
    tone.Q.value = 0.55;
    tone.frequency.setValueAtTime(effects.cutoff, startAt);
    performanceGain.gain.setValueAtTime(0, startAt);
    performanceGain.gain.linearRampToValueAtTime(
      PERFORMANCE_LEVEL,
      Math.min(endAt, startAt + CLIP_EDGE_FADE_SECONDS),
    );
    performanceGain.gain.setValueAtTime(
      PERFORMANCE_LEVEL,
      Math.max(startAt, endAt - CLIP_EDGE_FADE_SECONDS),
    );
    performanceGain.gain.linearRampToValueAtTime(0, endAt);
    source.connect(tone).connect(performanceGain).connect(rhythmGain);
    source.start(startAt, section.startSeconds, duration);
    source.stop(endAt + 0.01);
    performanceRecord.sources.add(source);
    activeSources.add(source);
    source.onended = () => {
      activeSources.delete(source);
      performanceRecord.sources.delete(source);
      source.disconnect();
      tone.disconnect();
      performanceGain.disconnect();
      rhythmGain.disconnect();
    };
    recentPerformances.push(section);
    while (recentPerformances.length > 4) recentPerformances.shift();
    return performanceRecord;
  }

  async function scheduleNext() {
    if (scheduling || !active || !bank || !currentPerformance || pendingPerformance) return;
    scheduling = true;
    try {
      const id = junctionSectionForEnergy(energy, brake > 0.2);
      pendingPerformance = await schedulePerformance(
        id,
        currentPerformance.endAt,
        currentPerformance.section,
        currentPerformance.id,
      );
    } catch (error) {
      console.error("[junction] the next complete performance could not be scheduled", error);
    } finally {
      scheduling = false;
    }
  }

  const timer = window.setInterval(() => {
    if (!active) return;
    if (pendingPerformance && context.currentTime >= pendingPerformance.startAt - 0.015) {
      currentPerformance = pendingPerformance;
      pendingPerformance = null;
      boundaryRevision += 1;
      applyRhythmDirection();
      trimDecodedCache();
      prewarmTarget();
    }
    if (currentPerformance && context.currentTime >= currentPerformance.endAt - SCHEDULE_AHEAD_SECONDS) {
      scheduleNext();
    }
    onSnapshot?.(snapshot());
  }, REVIEW_INTERVAL_MS);

  return {
    async setActive(nextActive) {
      active = nextActive;
      applyMovementGate();
      if (!active) {
        for (const source of activeSources) {
          try { source.stop(); } catch {}
        }
        activeSources.clear();
        currentPerformance = null;
        pendingPerformance = null;
        preparedPerformance = null;
        recentPerformances.length = 0;
        return;
      }
      await load();
      const id = junctionSectionForEnergy(energy, brake > 0.2);
      currentPerformance = await schedulePerformance(id, context.currentTime + 0.04);
      boundaryRevision += 1;
      onSnapshot?.(snapshot());
      prewarmTarget();
    },
    setEnergy(nextEnergy) {
      energy = Math.min(1, Math.max(0, Number(nextEnergy) || 0));
      applyMovementGate();
      applyRhythmDirection();
      prewarmTarget();
    },
    setBrake(nextBrake) {
      brake = Math.min(1, Math.max(0, Number(nextBrake) || 0));
      applyMasterTone();
      applyRhythmDirection();
      prewarmTarget();
    },
    getState: snapshot,
    destroy() {
      window.clearInterval(timer);
      for (const source of activeSources) {
        try { source.stop(); } catch {}
      }
      activeSources.clear();
      mixBus.disconnect();
      masterFilter.disconnect();
      output.disconnect();
      delaySend.disconnect();
      delay.disconnect();
      feedback.disconnect();
      wet.disconnect();
      decoded.clear();
      recentPerformances.length = 0;
    },
  };
}
