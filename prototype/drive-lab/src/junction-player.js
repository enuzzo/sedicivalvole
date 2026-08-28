import {
  chooseJunctionMix,
  junctionLiveMixParameters,
  junctionMovementGain,
  junctionSectionForEnergy,
  parseJunctionBank,
} from "./junction-bank.js";

const BANK_URL = `/audio/junction.svb?build=${encodeURIComponent(__APP_BUILD__)}`;
const REVIEW_INTERVAL_MS = 50;
const SCHEDULE_AHEAD_SECONDS = 0.8;
const LIVE_MIX_LEVEL = 0.61;
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
  let preparedMix = null;
  let preparingId = null;
  let scheduling = false;
  let bankBytes = 0;
  let mixCutoff = 18000;
  const decoded = new Map();
  const decoding = new Map();
  const activeSources = new Set();
  const recentPrimaries = [];

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
    const primary = activePerformance?.mix.primary ?? null;
    const sceneIndex = primary && bank ? bank.manifest.sections.indexOf(primary) : -1;
    return {
      scoreId: "junction",
      scoreLabel: "JUNCTION",
      scene: Math.max(0, sceneIndex),
      sceneId: sectionId,
      section: sectionId.toUpperCase(),
      sectionTake: primary?.take ?? null,
      sectionTakes: activePerformance
        ? [activePerformance.mix.primary.take, activePerformance.mix.secondary.take]
        : [],
      sectionRhythms: activePerformance
        ? [activePerformance.mix.primary.rhythmId, activePerformance.mix.secondary.rhythmId]
        : [],
      musicalFamily: primary?.family ?? null,
      rhythmId: primary?.rhythmId ?? null,
      rhythmTransition: activePerformance
        ? rhythmTransitionAt(activePerformance, context.currentTime)
        : "idle",
      rhythmFadeSeconds: JUNCTION_RHYTHM_FADE_SECONDS,
      halfTime: false,
      rhythmLabel: sectionId === "rest"
        ? "ambient"
        : (primary?.bpm ?? 127) < 158 ? "slow break" : "full break",
      tempo: primary?.bpm ?? bank?.manifest.bpmRange?.[0] ?? 127,
      energy,
      movementGain: junctionMovementGain(energy),
      decelerationState: brake > 0.2 ? "release" : "cruise",
      activeLanes: primary?.activeLanes
        ?? (sectionId === "rest" ? ["harmony", "atmosphere"] : ["breaks", "harmony"]),
      source: "sampled-production",
      mixing: "live-rhythm-locked-two-deck",
      transitionMode: "complete-eight-bar-boundary",
      liveMix: activePerformance ? {
        from: Number(activePerformance.mix.mixStart.toFixed(3)),
        to: Number(activePerformance.mix.mixEnd.toFixed(3)),
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
      currentPerformance?.mix.primary.assetId,
      currentPerformance?.mix.secondary.assetId,
      pendingPerformance?.mix.primary.assetId,
      pendingPerformance?.mix.secondary.assetId,
      preparedMix?.mix.primary.assetId,
      preparedMix?.mix.secondary.assetId,
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
    if (!asset) throw new Error(`JUNCTION mix block is missing: ${id}`);
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
    if (preparedMix?.id === id || preparingId === id) return;
    const mix = chooseJunctionMix(
      bank.manifest.sections,
      id,
      currentPerformance?.mix.primary ?? null,
      Math.random,
      recentPrimaries,
    );
    if (!mix) return;
    preparingId = id;
    Promise.all([
      ensureDecoded(mix.primary.assetId),
      ensureDecoded(mix.secondary.assetId),
    ]).then(() => {
      if (active && junctionSectionForEnergy(energy, brake > 0.2) === id) {
        preparedMix = { id, mix };
      }
    }).catch((error) => {
      console.warn("[junction] could not pre-decode the next mix pair", error);
    }).finally(() => {
      if (preparingId === id) preparingId = null;
    });
  }

  async function schedulePerformance(id, requestedTime, previousPrimary = null, previousId = null) {
    const prepared = preparedMix?.id === id
      && preparedMix.mix.primary.take !== previousPrimary?.take
      && preparedMix.mix.primary.family !== previousPrimary?.family
      ? preparedMix.mix
      : null;
    preparedMix = null;
    const mix = prepared
      ?? chooseJunctionMix(
        bank.manifest.sections,
        id,
        previousPrimary,
        Math.random,
        recentPrimaries,
      );
    if (!mix) throw new Error(`JUNCTION needs at least two takes for live mixing: ${id}`);
    const [primaryBuffer, secondaryBuffer] = await Promise.all([
      ensureDecoded(mix.primary.assetId),
      ensureDecoded(mix.secondary.assetId),
    ]);
    if (!active) return null;
    const startAt = Math.max(requestedTime, context.currentTime + 0.035);
    const duration = Math.min(mix.primary.durationSeconds, mix.secondary.durationSeconds);
    const endAt = startAt + duration;
    const effects = junctionLiveMixParameters(energy, mix.primary.bpm);
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
      mix,
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
    const deckSpecs = [
      { section: mix.primary, buffer: primaryBuffer, from: 1 - mix.mixStart, to: 1 - mix.mixEnd, pan: -0.06 },
      { section: mix.secondary, buffer: secondaryBuffer, from: mix.mixStart, to: mix.mixEnd, pan: 0.06 },
    ];
    for (const deck of deckSpecs) {
      const source = context.createBufferSource();
      const tone = context.createBiquadFilter();
      const panner = context.createStereoPanner();
      const deckGain = context.createGain();
      source.buffer = deck.buffer;
      tone.type = "lowpass";
      tone.Q.value = 0.55;
      tone.frequency.setValueAtTime(
        Math.min(20000, effects.cutoff + (Math.random() - 0.5) * 900),
        startAt,
      );
      panner.pan.setValueAtTime(deck.pan + (Math.random() - 0.5) * 0.035, startAt);
      const startLevel = Math.sqrt(deck.from) * LIVE_MIX_LEVEL;
      const endLevel = Math.sqrt(deck.to) * LIVE_MIX_LEVEL;
      deckGain.gain.setValueAtTime(0, startAt);
      deckGain.gain.linearRampToValueAtTime(
        startLevel,
        Math.min(endAt, startAt + CLIP_EDGE_FADE_SECONDS),
      );
      deckGain.gain.linearRampToValueAtTime(
        endLevel,
        Math.max(startAt, endAt - CLIP_EDGE_FADE_SECONDS),
      );
      deckGain.gain.linearRampToValueAtTime(0, endAt);
      source.connect(tone).connect(panner).connect(deckGain).connect(rhythmGain);
      source.start(startAt, deck.section.startSeconds, duration);
      source.stop(endAt + 0.01);
      performanceRecord.sources.add(source);
      activeSources.add(source);
      source.onended = () => {
        activeSources.delete(source);
        performanceRecord.sources.delete(source);
        source.disconnect();
        tone.disconnect();
        panner.disconnect();
        deckGain.disconnect();
        if (performanceRecord.sources.size === 0) rhythmGain.disconnect();
      };
    }
    recentPrimaries.push(mix.primary);
    while (recentPrimaries.length > 4) recentPrimaries.shift();
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
        currentPerformance.mix.primary,
        currentPerformance.id,
      );
    } catch (error) {
      console.error("[junction] the next live mix could not be scheduled", error);
    } finally {
      scheduling = false;
    }
  }

  const timer = window.setInterval(() => {
    if (!active) return;
    if (pendingPerformance && context.currentTime >= pendingPerformance.startAt - 0.015) {
      currentPerformance = pendingPerformance;
      pendingPerformance = null;
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
        preparedMix = null;
        recentPrimaries.length = 0;
        return;
      }
      await load();
      const id = junctionSectionForEnergy(energy, brake > 0.2);
      currentPerformance = await schedulePerformance(id, context.currentTime + 0.04);
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
      recentPrimaries.length = 0;
    },
  };
}
