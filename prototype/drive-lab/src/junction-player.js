import {
  chooseJunctionPerformance,
  junctionDecodedLimit,
  junctionPerformanceParameters,
  junctionSectionForSpeed,
  junctionSpeedForDrive,
  parseJunctionBank,
} from "./junction-bank.js";
import { createJunctionLowSpeedBed } from "./junction-low-speed-bed.js";
import {
  createJunctionBrakeCurve,
  JUNCTION_BRAKE_CALIBRATION,
  junctionBrakeParameters,
} from "./junction-brake.js";
import { lowSpeedPolicy } from "./low-speed-score.js";
import { withReadinessTimeout } from "./promise-timeout.js";
import { SAMPLED_SCORE_PERFORMANCE_LEVEL } from "./sampled-score-levels.js";
import { SAMPLED_BANK_TRANSFER_TIMEOUT_MS } from "./sampled-bank-network.js";
import {
  scheduleEqualPowerGain,
  SCORE_SWITCH_CROSSFADE_SECONDS,
} from "./score-crossfade.js";

const BANK_URL = `/audio/junction.svb?build=${encodeURIComponent(__APP_BUILD__)}`;
const REVIEW_INTERVAL_MS = 50;
const SCHEDULE_AHEAD_SECONDS = 0.8;
const OUTPUT_LEVEL = 0.9;
const CLIP_EDGE_FADE_SECONDS = 0.012;
export const JUNCTION_RHYTHM_FADE_SECONDS = SCORE_SWITCH_CROSSFADE_SECONDS;
const JUNCTION_RHYTHM_QUIET_LEVEL = 0.08;
const JUNCTION_AMBIENT_RECOVERY_SECONDS = 1.5;
const JUNCTION_RHYTHM_RECOVERY_SECONDS = 1.2;
// Keep a small half-kilometre hysteresis below the 21 km/h entrance while
// guaranteeing that every speed rendered as 20 km/h has returned to the
// sub-100-BPM low-speed bed.
export const JUNCTION_NATIVE_EXIT_SPEED_KMH = 20.5;
export const JUNCTION_NATIVE_RETRY_SECONDS = 10;
export const JUNCTION_TRANSFER_TIMEOUT_MS = SAMPLED_BANK_TRANSFER_TIMEOUT_MS;
export const JUNCTION_DECODE_TIMEOUT_MS = 10000;
export const JUNCTION_READINESS_TIMEOUT_MS = 56000;

export function createJunctionPlayer(context, destination, onSnapshot, onBankStatus) {
  let destroyed = false;
  let active = false;
  let performanceDrive = 0;
  let speed = 0;
  let brake = 0;
  let bank = null;
  let loading = null;
  let bankTransferController = null;
  let currentPerformance = null;
  let pendingPerformance = null;
  let preparedPerformance = null;
  let preparingId = null;
  let scheduling = false;
  let bankBytes = 0;
  let mixCutoff = 18000;
  let bankStatus = "idle";
  let bankError = null;
  let nativeEnabled = false;
  let nativeRequested = false;
  let nativeStartPromise = null;
  let nativeRevision = 0;
  let nativeRetryAt = 0;
  const decoded = new Map();
  const decoding = new Map();
  const activeSources = new Set();
  const retiringSources = new Set();
  const sourceAssetIds = new Map();
  const recentPerformances = [];

  const mixBus = context.createGain();
  const sampleGate = context.createGain();
  const preFilterBus = context.createGain();
  const masterFilter = context.createBiquadFilter();
  const brakeClean = context.createGain();
  const brakeFiltered = context.createGain();
  const brakeResidual = context.createGain();
  const brakeSum = context.createGain();
  const brakeSaturator = context.createWaveShaper();
  const brakeMakeup = context.createGain();
  const brakeProcessed = context.createGain();
  const output = context.createGain();
  const delaySend = context.createGain();
  const delay = context.createDelay(0.6);
  const feedback = context.createGain();
  const wet = context.createGain();
  masterFilter.type = "lowpass";
  masterFilter.frequency.value = mixCutoff;
  masterFilter.Q.value = JUNCTION_BRAKE_CALIBRATION.idleQ;
  brakeClean.gain.value = 1;
  brakeFiltered.gain.value = JUNCTION_BRAKE_CALIBRATION.filteredMix;
  brakeResidual.gain.value = JUNCTION_BRAKE_CALIBRATION.residualMix;
  brakeSaturator.curve = createJunctionBrakeCurve();
  brakeSaturator.oversample = "none";
  brakeMakeup.gain.value = JUNCTION_BRAKE_CALIBRATION.makeupGain;
  brakeProcessed.gain.value = 0;
  output.gain.value = 0;
  delaySend.gain.value = 1;
  delay.delayTime.value = 0.25;
  feedback.gain.value = 0.1;
  wet.gain.value = 0.03;
  sampleGate.gain.value = 0;
  mixBus.connect(sampleGate);
  sampleGate.connect(preFilterBus);
  sampleGate.connect(delaySend);
  delaySend.connect(delay);
  delay.connect(wet).connect(preFilterBus);
  delay.connect(feedback).connect(delay);
  preFilterBus.connect(masterFilter);
  masterFilter.connect(brakeClean).connect(output);
  masterFilter.connect(brakeFiltered).connect(brakeSum);
  preFilterBus.connect(brakeResidual).connect(brakeSum);
  brakeSum.connect(brakeSaturator).connect(brakeMakeup).connect(brakeProcessed).connect(output);
  output.connect(destination);
  const lowSpeedBed = createJunctionLowSpeedBed(context, preFilterBus);

  function applyMovementGate(time = context.currentTime) {
    output.gain.setTargetAtTime(
      active ? OUTPUT_LEVEL : 0,
      time,
      active ? 0.16 : 0.035,
    );
  }

  function applyMasterTone(time = context.currentTime, openCutoff = mixCutoff) {
    const parameters = junctionBrakeParameters(brake, openCutoff);
    const timeConstant = brake > 0.2 ? 0.08 : 0.22;
    masterFilter.frequency.setTargetAtTime(
      parameters.cutoffHz,
      time,
      timeConstant,
    );
    masterFilter.Q.setTargetAtTime(parameters.q, time, timeConstant);
    brakeClean.gain.setTargetAtTime(parameters.cleanGain, time, timeConstant);
    brakeProcessed.gain.setTargetAtTime(parameters.processedGain, time, timeConstant);
  }

  function decodedPcmBytes() {
    return [...new Set([...decoded.keys(), ...sourceAssetIds.values()])].reduce(
      (total, id) => total + (bank?.assets.get(id)?.decodedPcmBytes ?? 0),
      0,
    );
  }

  function retainedSlotIds(extraIds = []) {
    return new Set([
      ...decoded.keys(),
      ...decoding.keys(),
      ...sourceAssetIds.values(),
      ...extraIds,
    ].filter(Boolean));
  }

  function snapshot() {
    const lowSpeed = lowSpeedBed.snapshot();
    const nativePolicy = nativeRequested;
    const nativeAudible = nativePolicy && Boolean(currentPerformance);
    const activePerformance = nativeAudible ? currentPerformance ?? pendingPerformance : null;
    const sectionId = nativeAudible
      ? activePerformance?.id ?? junctionSectionForSpeed(speed, performanceDrive, brake > 0.2)
      : nativePolicy ? "native" : lowSpeed.lowSpeedState;
    const selected = nativeAudible ? activePerformance?.section ?? null : null;
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
      musicalFamily: selected?.harmonicIdentity ?? bank?.manifest.harmonicIdentity ?? "emin-afterdark",
      rhythmId: selected?.performanceId ?? null,
      rhythmTransition: activePerformance
        ? rhythmTransitionAt(activePerformance, context.currentTime)
        : "idle",
      boundaryFallback: Boolean(activePerformance?.boundaryFallback),
      rhythmFadeSeconds: JUNCTION_RHYTHM_FADE_SECONDS,
      halfTime: false,
      rhythmLabel: !nativeAudible
        ? "ambient"
        : (selected?.bpm ?? 127) < 158 ? "slow break" : "full break",
      tempo: nativeAudible ? selected?.bpm ?? 127 : lowSpeed.transportTempo,
      perceivedTempo: nativeAudible ? selected?.bpm ?? 127 : lowSpeed.perceivedTempo,
      transportTempo: nativeAudible ? selected?.bpm ?? null : lowSpeed.transportTempo,
      motionLane: nativePolicy ? "DRIVE" : lowSpeed.lowSpeedState.toUpperCase(),
      decelerationState: brake > 0.2 ? "release" : "cruise",
      activeLanes: nativeAudible
        ? selected?.activeLanes ?? ["breaks", "harmony"]
        : ["harmony", "atmosphere"],
      source: nativeAudible ? "sampled-production" : "code-synthesized",
      mixing: nativeAudible ? "single-synchronous-performance" : "single-harmonic-bed",
      transitionMode: nativeAudible ? "complete-eight-bar-boundary" : "low-speed-policy",
      tonalDecks: selected?.tonalDecks ?? bank?.manifest.tonalDecks ?? 1,
      automaticLead: selected?.automaticLead ?? bank?.manifest.automaticLead ?? false,
      liveMix: activePerformance ? {
        wet: Number(activePerformance.effects.wet.toFixed(3)),
        feedback: Number(activePerformance.effects.feedback.toFixed(3)),
      } : null,
      bankLoaded: Boolean(bank),
      bankStatus,
      bankError,
      bankBytes,
      bankClips: bank?.manifest.sections.length ?? 0,
      sourceRecordingsUsed: bank?.manifest.sourceRecordingsUsed ?? 0,
      decodedClips: decoded.size,
      decodingClips: decoding.size,
      liveSourceNodes: sourceAssetIds.size,
      liveSourceClips: new Set(sourceAssetIds.values()).size,
      decodedSlots: retainedSlotIds().size,
      decodedPcmBytes: decodedPcmBytes(),
      playing: active && (!nativeAudible || activeSources.size > 0),
      parkHarmony: lowSpeed.parkHarmony,
      parkVoicing: lowSpeed.parkVoicing,
      parkVoicingChanges: lowSpeed.parkVoicingChanges,
      lowSpeedHarmony: lowSpeed.lowSpeedHarmony,
      lowSpeedLevel: lowSpeed.lowSpeedLevel,
      departureEventsPlayed: lowSpeed.departureEventsPlayed,
      departureArmed: lowSpeed.departureArmed,
      beat: nativeAudible ? sectionId !== "rest" : false,
      bass: nativeAudible ? Boolean(selected?.activeLanes?.includes("bass")) : false,
    };
  }

  function reportBankStatus(status, error = null) {
    bankStatus = status;
    bankError = error instanceof Error ? error.message : error ? String(error) : null;
    onBankStatus?.(bankStatus, bankError);
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
    const desiredId = junctionSectionForSpeed(speed, performanceDrive, brake > 0.2);
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

  function decodedLimit() {
    return junctionDecodedLimit(bank?.manifest.maxDecodedClips);
  }

  function trimDecodedCache(extraKeep = [], targetSize = decodedLimit()) {
    if (!bank) return;
    const keep = new Set([
      currentPerformance?.section.assetId,
      currentPerformance?.companionSection?.assetId,
      pendingPerformance?.section.assetId,
      pendingPerformance?.companionSection?.assetId,
      preparedPerformance?.section.assetId,
      preparedPerformance?.companionSection?.assetId,
      ...sourceAssetIds.values(),
      ...extraKeep,
    ].filter(Boolean));
    const removable = [...decoded.entries()]
      .filter(([id]) => !keep.has(id))
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    while (retainedSlotIds(extraKeep).size > targetSize && removable.length > 0) {
      decoded.delete(removable.shift()[0]);
    }
  }

  function reserveDecodeSlot(id) {
    trimDecodedCache([id]);
    return retainedSlotIds([id]).size <= decodedLimit();
  }

  async function ensureDecoded(id) {
    if (destroyed) throw new Error("JUNCTION player is closed");
    const cached = decoded.get(id);
    if (cached) {
      cached.lastUsed = performance.now();
      return cached.buffer;
    }
    const existingReservation = decoding.get(id);
    if (existingReservation) return existingReservation.readiness;
    const asset = bank?.assets.get(id);
    if (!asset) throw new Error(`JUNCTION performance is missing: ${id}`);
    if (!reserveDecodeSlot(id)) {
      const error = new Error(`JUNCTION decoded-slot limit is busy: ${id}`);
      error.code = "JUNCTION_DECODE_CAPACITY";
      throw error;
    }
    const reservation = { readiness: null, lifetime: null };
    decoding.set(id, reservation);
    reservation.readiness = (async () => {
      const audioBytes = await asset.audio.arrayBuffer();
      // Blob extraction is asynchronous too. Teardown may clear this
      // reservation before the browser's non-abortable native decode begins;
      // do not spend CPU or transient PCM on a player that no longer exists.
      if (destroyed) throw new Error("JUNCTION player is closed");
      if (decoding.get(id) !== reservation) {
        throw new Error(`JUNCTION decode reservation expired: ${id}`);
      }
      const nativeDecode = Promise.resolve(context.decodeAudioData(audioBytes));
      reservation.lifetime = nativeDecode.then(
        (buffer) => {
          if (decoding.get(id) === reservation) {
            // Exchange the native in-flight reservation for the retained buffer
            // synchronously. A readiness timeout cannot release this slot because
            // decodeAudioData itself cannot be aborted.
            decoding.delete(id);
            if (!destroyed) {
              decoded.set(id, { buffer, lastUsed: performance.now() });
            }
          }
          return buffer;
        },
        (error) => {
          if (decoding.get(id) === reservation) decoding.delete(id);
          throw error;
        },
      );
      return withReadinessTimeout(
        reservation.lifetime,
        {
          label: `JUNCTION decode ${id}`,
          timeoutMs: JUNCTION_DECODE_TIMEOUT_MS,
          schedule: window.setTimeout ?? globalThis.setTimeout,
          cancel: window.clearTimeout ?? globalThis.clearTimeout,
        },
      );
    })().catch((error) => {
      // Failures before decodeAudioData begins have no native lifetime to retain.
      // Once it has begun, only its own settlement may release the reservation.
      if (!reservation.lifetime && decoding.get(id) === reservation) decoding.delete(id);
      throw error;
    });
    return reservation.readiness;
  }

  async function load() {
    if (bank) return bank;
    if (loading) return loading;
    reportBankStatus("loading");
    let transferController = null;
    loading = (async () => {
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      transferController = controller;
      bankTransferController = controller;
      const payload = await withReadinessTimeout(
        (async () => {
          const response = await fetch(BANK_URL, {
            cache: "force-cache",
            ...(controller ? { signal: controller.signal } : {}),
          });
          if (!response.ok) throw new Error(`JUNCTION bank request failed (${response.status})`);
          return response.arrayBuffer();
        })(),
        {
          label: "JUNCTION bank transfer",
          timeoutMs: JUNCTION_TRANSFER_TIMEOUT_MS,
          schedule: window.setTimeout ?? globalThis.setTimeout,
          cancel: window.clearTimeout ?? globalThis.clearTimeout,
          onTimeout: () => controller?.abort(),
        },
      );
      if (destroyed) throw new Error("JUNCTION player is closed");
      const parsedBank = parseJunctionBank(await payload);
      if (destroyed) throw new Error("JUNCTION player is closed");
      bank = parsedBank;
      bankBytes = bank.audioBytes;
      nativeRetryAt = 0;
      return bank;
    })().catch((error) => {
      loading = null;
      if (!destroyed) {
        bankError = error instanceof Error ? error.message : String(error);
        console.error("[junction] the live music bank did not load", error);
      }
      throw error;
    }).finally(() => {
      if (bankTransferController === transferController) bankTransferController = null;
    });
    return loading;
  }

  function prewarmTarget() {
    if (!active || !bank || !nativeEnabled || !currentPerformance) return;
    const id = junctionSectionForSpeed(speed, performanceDrive, brake > 0.2);
    if (preparedPerformance?.id === id || preparingId === id) return;
    const section = chooseJunctionPerformance(
      bank.manifest.sections,
      id,
      currentPerformance?.section ?? null,
      Math.random,
      recentPerformances,
    );
    if (!section) return;
    const companion = bank.manifest.sections.find((candidate) => (
      candidate.id === id
      && candidate.assetId !== section.assetId
      && candidate.assetId !== currentPerformance.section.assetId
    )) ?? bank.manifest.sections.find((candidate) => (
      candidate.id === id && candidate.assetId !== section.assetId
    ));
    if (!companion) return;
    preparingId = id;
    Promise.all([
      ensureDecoded(section.assetId),
      ensureDecoded(companion.assetId),
    ]).then(() => {
      if (active && nativeEnabled && junctionSectionForSpeed(speed, performanceDrive, brake > 0.2) === id) {
        preparedPerformance = { id, section, companionSection: companion };
      }
    }).catch((error) => {
      if (!destroyed) console.warn("[junction] could not pre-decode the next performance", error);
    }).finally(() => {
      if (preparingId === id) preparingId = null;
    });
  }

  function companionForSection(id, section, previousSection = null, decodedOnly = false) {
    const candidates = bank.manifest.sections.filter((candidate) => (
      candidate.id === id
      && candidate.assetId !== section?.assetId
      && (!decodedOnly || decoded.has(candidate.assetId))
    ));
    return candidates.find((candidate) => candidate.assetId !== previousSection?.assetId)
      ?? candidates[0]
      ?? null;
  }

  function selectPerformance(id, previousSection = null) {
    const prepared = preparedPerformance?.id === id
      && preparedPerformance.section.take !== previousSection?.take
      ? preparedPerformance
      : null;
    if (prepared) preparedPerformance = null;
    if (prepared) return prepared;
    const section = chooseJunctionPerformance(
      bank.manifest.sections,
      id,
      previousSection,
      Math.random,
      recentPerformances,
    );
    return section ? { id, section, companionSection: null } : null;
  }

  async function schedulePerformance(
    id,
    requestedTime,
    previousSection = null,
    previousId = null,
    options = {},
  ) {
    const selection = options.selection
      ?? (options.section ? null : selectPerformance(id, previousSection));
    const section = options.section ?? selection?.section;
    const companionSection = options.companionSection ?? selection?.companionSection;
    if (!section) throw new Error(`JUNCTION has no complete performance for: ${id}`);
    if (!companionSection
      || companionSection.assetId === section.assetId
      || !decoded.has(companionSection.assetId)) {
      throw new Error(`JUNCTION has no pinned decoded companion for: ${section.assetId}`);
    }
    const buffer = options.buffer ?? await ensureDecoded(section.assetId);
    if (!active) return null;
    const startAt = options.exactBoundary
      ? requestedTime
      : Math.max(requestedTime, context.currentTime + 0.035);
    const duration = section.durationSeconds;
    const endAt = startAt + duration;
    const effects = junctionPerformanceParameters(performanceDrive, section.bpm);
    delay.delayTime.setTargetAtTime(effects.delaySeconds, startAt, 0.04);
    feedback.gain.setTargetAtTime(effects.feedback, startAt, 0.06);
    wet.gain.setTargetAtTime(effects.wet, startAt, 0.08);
    // Schedule the next phrase's colour at its exact boundary without changing
    // the cutoff used by live brake gestures on the still-active phrase.
    applyMasterTone(startAt, effects.cutoff);

    const rhythmGain = context.createGain();
    rhythmGain.connect(mixBus);
    const enteringFromZeroBeat = !options.skipEntranceFade
      && id !== "rest"
      && (previousId === null || previousId === "rest");
    const enteringAmbient = id === "rest" && previousId !== null && previousId !== "rest";
    const entranceLevel = enteringFromZeroBeat ? 0 : enteringAmbient ? JUNCTION_RHYTHM_QUIET_LEVEL : 1;
    const entranceDuration = enteringFromZeroBeat
      ? JUNCTION_RHYTHM_FADE_SECONDS
      : enteringAmbient ? JUNCTION_AMBIENT_RECOVERY_SECONDS : 0;
    rhythmGain.gain.setValueAtTime(entranceLevel, startAt);
    if (entranceDuration > 0) {
      if (enteringFromZeroBeat) {
        scheduleEqualPowerGain(rhythmGain.gain, "in", startAt, entranceDuration);
      } else {
        rhythmGain.gain.linearRampToValueAtTime(1, Math.min(endAt, startAt + entranceDuration));
      }
    }
    const performanceRecord = {
      id,
      section,
      companionSection,
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
      boundaryFallback: Boolean(options.boundaryFallback),
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
      SAMPLED_SCORE_PERFORMANCE_LEVEL,
      Math.min(endAt, startAt + CLIP_EDGE_FADE_SECONDS),
    );
    performanceGain.gain.setValueAtTime(
      SAMPLED_SCORE_PERFORMANCE_LEVEL,
      Math.max(startAt, endAt - CLIP_EDGE_FADE_SECONDS),
    );
    performanceGain.gain.linearRampToValueAtTime(0, endAt);
    source.connect(tone).connect(performanceGain).connect(rhythmGain);
    source.start(startAt, section.startSeconds, duration);
    source.stop(endAt + 0.01);
    performanceRecord.sources.add(source);
    activeSources.add(source);
    sourceAssetIds.set(source, section.assetId);
    source.onended = () => {
      activeSources.delete(source);
      retiringSources.delete(source);
      sourceAssetIds.delete(source);
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

  function silenceRetiringSources(time = context.currentTime) {
    for (const source of retiringSources) {
      try { source.stop(time); } catch {}
    }
    retiringSources.clear();
  }

  async function scheduleNext() {
    if (scheduling || !active || !nativeEnabled || !bank || !currentPerformance || pendingPerformance) return;
    scheduling = true;
    try {
      const id = junctionSectionForSpeed(speed, performanceDrive, brake > 0.2);
      const selection = selectPerformance(id, currentPerformance.section);
      const selected = selection?.section ?? null;
      const selectedCompanion = selection?.companionSection
        ?? (selected ? companionForSection(id, selected, currentPerformance.section, true) : null);
      const cached = selected ? decoded.get(selected.assetId) : null;
      const cachedCompanion = selectedCompanion
        ? decoded.get(selectedCompanion.assetId)
        : null;
      if (selected && cached && selectedCompanion && cachedCompanion) {
        cached.lastUsed = performance.now();
        cachedCompanion.lastUsed = performance.now();
        pendingPerformance = await schedulePerformance(
          id,
          currentPerformance.endAt,
          currentPerformance.section,
          currentPerformance.id,
          {
            section: selected,
            companionSection: selectedCompanion,
            buffer: cached.buffer,
            exactBoundary: true,
          },
        );
      } else {
        // Decoding is allowed to finish for a later boundary, never to move this
        // one. Continue an already decoded complete performance at the exact
        // frame instead of starting the requested take late and opening a hole.
        const futureCompanion = selected
          ? companionForSection(id, selected, currentPerformance.section)
          : null;
        if (selected && futureCompanion) {
          Promise.all([
            ensureDecoded(selected.assetId),
            ensureDecoded(futureCompanion.assetId),
          ]).then(() => {
            if (active && junctionSectionForSpeed(speed, performanceDrive, brake > 0.2) === id) {
              preparedPerformance = {
                id,
                section: selected,
                companionSection: futureCompanion,
              };
            }
          }).catch((error) => {
            if (!destroyed && error?.code !== "JUNCTION_DECODE_CAPACITY") {
              console.warn("[junction] could not pre-decode the deferred performance", error);
            }
          });
        }
        const decodedAlternative = currentPerformance.companionSection;
        const continuationCompanion = currentPerformance.section;
        if (!decodedAlternative
          || !decoded.has(decodedAlternative.assetId)
          || !decoded.has(continuationCompanion.assetId)) {
          throw new Error("JUNCTION has no distinct decoded boundary continuation");
        }
        const fallbackSection = decodedAlternative;
        const fallbackId = fallbackSection.id;
        const fallback = decoded.get(fallbackSection.assetId);
        if (!fallback) throw new Error("JUNCTION has no decoded boundary continuation");
        fallback.lastUsed = performance.now();
        pendingPerformance = await schedulePerformance(
          fallbackId,
          currentPerformance.endAt,
          currentPerformance.section,
          currentPerformance.id,
          {
            section: fallbackSection,
            companionSection: continuationCompanion,
            buffer: fallback.buffer,
            exactBoundary: true,
            boundaryFallback: true,
          },
        );
      }
    } catch (error) {
      console.error("[junction] the next complete performance could not be scheduled", error);
    } finally {
      scheduling = false;
    }
  }

  function stopNativePerformance(time = context.currentTime) {
    nativeRevision += 1;
    nativeEnabled = false;
    nativeStartPromise = null;
    lowSpeedBed.setNativeReady(false);
    sampleGate.gain.cancelScheduledValues?.(time);
    sampleGate.gain.setTargetAtTime(0, time, 0.18);
    const stopAt = time + 1.2;
    for (const source of [...activeSources]) {
      try { source.stop(stopAt); } catch {}
      activeSources.delete(source);
      retiringSources.add(source);
    }
    currentPerformance = null;
    pendingPerformance = null;
    preparedPerformance = null;
    scheduling = false;
  }

  function startNativePerformance(options = {}) {
    if (!active || !nativeRequested || context.currentTime < nativeRetryAt) {
      return Promise.resolve(null);
    }
    if (nativeEnabled && currentPerformance) return Promise.resolve(currentPerformance);
    if (nativeStartPromise) return nativeStartPromise;
    nativeEnabled = true;
    const revision = ++nativeRevision;
    reportBankStatus("loading");
    nativeStartPromise = (async () => {
      await load();
      if (!active || !nativeEnabled || revision !== nativeRevision) return null;
      const id = junctionSectionForSpeed(speed, performanceDrive, brake > 0.2);
      const selection = selectPerformance(id);
      const section = selection?.section;
      if (!section) throw new Error(`JUNCTION has no complete performance for: ${id}`);
      const companion = selection.companionSection ?? companionForSection(id, section);
      if (!companion) throw new Error(`JUNCTION has no alternate performance for: ${id}`);
      // Stop threshold-release tails before reserving any new decode. Their
      // asset IDs remain counted until `onended`, so a source-held AudioBuffer
      // can never become an invisible seventh decoded slot.
      silenceRetiringSources(context.currentTime);
      const [buffer] = await Promise.all([
        ensureDecoded(section.assetId),
        ensureDecoded(companion.assetId),
      ]);
      if (!active || !nativeEnabled || revision !== nativeRevision) return null;
      const performance = await schedulePerformance(
        id,
        context.currentTime + 0.04,
        null,
        null,
        {
          section,
          companionSection: companion,
          buffer,
          skipEntranceFade: Boolean(options.externalEntranceFade),
        },
      );
      if (!active || !nativeEnabled || revision !== nativeRevision) {
        for (const source of performance?.sources ?? []) {
          try { source.stop(); } catch {}
        }
        return null;
      }
      currentPerformance = performance;
      mixCutoff = performance.effects.cutoff;
      lowSpeedBed.setNativeReady(true);
      sampleGate.gain.cancelScheduledValues?.(performance.startAt);
      sampleGate.gain.setValueAtTime(1, performance.startAt);
      prewarmTarget();
      reportBankStatus("ready");
      onSnapshot?.(snapshot());
      return performance;
    })().finally(() => {
      if (revision === nativeRevision) nativeStartPromise = null;
    });
    return nativeStartPromise;
  }

  function reviewNativeMode() {
    if (!active) return;
    if (nativeRequested) {
      // The 50 ms review loop may revisit a slow transfer or decode hundreds
      // of times. `startNativePerformance()` deliberately returns the same
      // in-flight promise, so attach exactly one rejection observer per
      // attempt instead of building a callback storm on that shared promise.
      if (nativeStartPromise || (nativeEnabled && currentPerformance)) return;
      startNativePerformance().catch((error) => {
        nativeEnabled = false;
        lowSpeedBed.setNativeReady(false);
        nativeRetryAt = context.currentTime + JUNCTION_NATIVE_RETRY_SECONDS;
        reportBankStatus("error", error);
        console.error("[junction] the native performance could not start", error);
        onSnapshot?.(snapshot());
      });
    } else if (nativeEnabled || currentPerformance || pendingPerformance) {
      stopNativePerformance();
    }
  }

  function updateNativeRequest() {
    if (nativeRequested) {
      if (speed < JUNCTION_NATIVE_EXIT_SPEED_KMH) nativeRequested = false;
    } else if (lowSpeedPolicy(speed).id === "native") {
      nativeRequested = true;
    }
  }

  const timer = window.setInterval(() => {
    if (!active) return;
    lowSpeedBed.tick(context.currentTime);
    reviewNativeMode();
    if (pendingPerformance && context.currentTime >= pendingPerformance.startAt - 0.015) {
      currentPerformance = pendingPerformance;
      pendingPerformance = null;
      mixCutoff = currentPerformance.effects.cutoff;
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
    async setActive(nextActive, options = {}) {
      active = nextActive;
      lowSpeedBed.setActive(active);
      applyMovementGate();
      if (!active) {
        nativeEnabled = false;
        nativeRevision += 1;
        nativeStartPromise = null;
        nativeRetryAt = 0;
        lowSpeedBed.setNativeReady(false);
        for (const source of activeSources) {
          try { source.stop(); } catch {}
        }
        for (const source of retiringSources) {
          try { source.stop(); } catch {}
        }
        activeSources.clear();
        retiringSources.clear();
        currentPerformance = null;
        pendingPerformance = null;
        preparedPerformance = null;
        recentPerformances.length = 0;
        return;
      }
      try {
        if (lowSpeedPolicy(speed).id === "native") {
          await withReadinessTimeout(startNativePerformance(options), {
            label: "JUNCTION native readiness",
            timeoutMs: JUNCTION_READINESS_TIMEOUT_MS,
            schedule: window.setTimeout ?? globalThis.setTimeout,
            cancel: window.clearTimeout ?? globalThis.clearTimeout,
          });
        }
      } catch (error) {
        // Keep the harmonic safety bed alive while the facade crossfades back
        // to FRACTURE. Silencing this player here would collapse the outgoing
        // side of that four-second equal-power transition into an audible hole.
        nativeEnabled = false;
        nativeRevision += 1;
        nativeStartPromise = null;
        nativeRetryAt = context.currentTime + JUNCTION_NATIVE_RETRY_SECONDS;
        lowSpeedBed.setNativeReady(false);
        applyMovementGate();
        reportBankStatus("error", error);
        onSnapshot?.(snapshot());
        throw error;
      }
      onSnapshot?.(snapshot());
      prewarmTarget();
    },
    setPerformanceDrive(nextDrive) {
      performanceDrive = Math.min(1, Math.max(0, Number(nextDrive) || 0));
      speed = junctionSpeedForDrive(performanceDrive);
      updateNativeRequest();
      lowSpeedBed.setSpeed(speed, 0, nativeRequested);
      applyMovementGate();
      applyRhythmDirection();
      reviewNativeMode();
      prewarmTarget();
    },
    setSpeed(nextSpeed, nextDrive = null, deltaSeconds = 0) {
      speed = Math.max(0, Number(nextSpeed) || 0);
      if (Number.isFinite(nextDrive)) {
        performanceDrive = Math.min(1, Math.max(0, Number(nextDrive) || 0));
      }
      updateNativeRequest();
      lowSpeedBed.setSpeed(speed, deltaSeconds, nativeRequested);
      applyMovementGate();
      applyRhythmDirection();
      reviewNativeMode();
      prewarmTarget();
    },
    setBrake(nextBrake) {
      brake = Math.min(1, Math.max(0, Number(nextBrake) || 0));
      applyMasterTone();
      if (pendingPerformance) {
        applyMasterTone(pendingPerformance.startAt, pendingPerformance.effects.cutoff);
      }
      applyRhythmDirection();
      prewarmTarget();
    },
    getState: snapshot,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      active = false;
      nativeEnabled = false;
      nativeRevision += 1;
      bankTransferController?.abort();
      bankTransferController = null;
      window.clearInterval(timer);
      for (const source of activeSources) {
        try { source.stop(); } catch {}
      }
      for (const source of retiringSources) {
        try { source.stop(); } catch {}
      }
      activeSources.clear();
      retiringSources.clear();
      mixBus.disconnect();
      masterFilter.disconnect();
      output.disconnect();
      preFilterBus.disconnect();
      brakeClean.disconnect();
      brakeFiltered.disconnect();
      brakeResidual.disconnect();
      brakeSum.disconnect();
      brakeSaturator.disconnect();
      brakeMakeup.disconnect();
      brakeProcessed.disconnect();
      delaySend.disconnect();
      delay.disconnect();
      feedback.disconnect();
      wet.disconnect();
      sampleGate.disconnect();
      lowSpeedBed.destroy();
      // Native decodes cannot be aborted. Dropping their reservations together
      // with the destroyed guard above prevents a late settlement from
      // repopulating retained PCM after teardown.
      decoding.clear();
      decoded.clear();
      sourceAssetIds.clear();
      bank = null;
      loading = null;
      bankBytes = 0;
      recentPerformances.length = 0;
    },
  };
}
