// The Flux audio facade.
//
// Everything musical lives behind the AudioWorklet in `src/score/`. This module
// owns only the browser-side lifecycle: the context, the worklet node, the
// speed feed, the brake detector, and the state the interface and the flight
// recorder read back.

import {
  model3AwdLiftOffDecelerationMps2,
  ROAD_SPEED_CEILING_KMH,
  speedToEnergy,
} from "./signal-model.js";
import {
  advanceAccelerationMacroAmount,
  accelerationMacroParameters,
  accelerationMacroTargetAmount,
  createAccelerationFocusCurve,
} from "./acceleration-macro.js";
import {
  BLOOM_ATTACK_SECONDS,
  BLOOM_GESTURE_MS,
  BLOOM_RELEASE_SECONDS,
  BLOOM_REFRACTORY_MS,
  BLOOM_SWEEP_SECONDS,
} from "./bloom-macro.js";
import {
  createAudioMacroSnapshot,
  sampleTimedGestureEnvelope,
} from "./response-mapping.js";
import {
  accelerationTrajectoryIsBloom,
  advanceAccelerationDetectorClock,
  createAccelerationDetectorState,
  observeAccelerationDetector,
} from "./acceleration-detector.js";
import { createJunctionPlayer } from "./junction-player.js";
import { createNightshiftPlayer } from "./nightshift-player.js";
import {
  createScoreCrossfadeState,
  scheduleScoreCrossfade,
  scheduleScoreCrossfadeCompletion,
  shouldCompleteScoreCrossfade,
  SCORE_SWITCH_CROSSFADE_SECONDS,
} from "./score-crossfade.js";
import { nextVehicleRate, VEHICLE_RATE_STALE_MS } from "./vehicle-rate.js";
import { installBypassableSerialProcessor } from "./audio-runtime-guard.js";
import { withReadinessTimeout } from "./promise-timeout.js";
import bloomProcessorUrl from "./score/worklet/bloom-processor.js?audio-worklet";
import processorUrl from "./score/worklet/score-processor.js?audio-worklet";
import { createManualEffectsGraph } from "./manual-effects-graph.js";

/**
 * Brake detection.
 *
 * The underwater effect belongs to braking, not to being stopped and not to
 * ordinary lift-off. It engages when the vehicle is decelerating measurably
 * harder than the documented regenerative curve for its current speed, or when
 * a service-brake input is actually held.
 *
 * Both thresholds matter. `MINIMUM_BRAKING_SPEED_KMH` is why a standstill never
 * triggers it: a stopped car has no deceleration to read, and any residual
 * jitter around zero would otherwise latch the effect on. The separate release
 * threshold is hysteresis, so a marginal deceleration cannot flicker the badge.
 */
const BRAKE_MARGIN = 1.25;
const MINIMUM_BRAKING_MPS2 = -0.6;
const MINIMUM_BRAKING_SPEED_KMH = 3;
const BRAKE_ENGAGE_AT = 0.4;
const BRAKE_RELEASE_AT = 0.15;
const BRAKE_ATTACK_SECONDS = 0.22;
const BRAKE_RELEASE_SECONDS = 0.55;

/**
 * The brake runs on its own clock rather than on speed updates.
 *
 * Tying it to speed changes was the defect that left the effect latched: a car
 * that is stopped, or holding a steady speed, produces no speed update at all,
 * so the release never ran and the badge stayed on indefinitely. Time, not
 * traffic, is what makes a brake let go.
 */
const BRAKE_TICK_MS = 40;
const ACCELERATION_TICK_MS = 40;
const ACCELERATION_BADGE_AT = 0.22;
const ACCELERATION_PARAM_SMOOTH_SECONDS = 0.015;

/** Deceleration is only meaningful for a moment; a stale reading must expire. */
const RATE_STALE_MS = VEHICLE_RATE_STALE_MS;
export const AUDIO_WORKLET_READY_TIMEOUT_MS = 8000;

export function createAudioEngine(onPulse, onEffectChange, onScoreRecovery, {
  audioContext = null,
} = {}) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!audioContext && !AudioContext) return null;

  const ownsContext = !audioContext;
  const context = audioContext ?? new AudioContext({ latencyHint: "interactive" });
  const masterGain = context.createGain();
  const performanceBus = context.createGain();
  const accelerationScoop = context.createBiquadFilter();
  const accelerationAir = context.createBiquadFilter();
  const accelerationFocus = context.createBiquadFilter();
  const accelerationFocusLimiter = context.createWaveShaper();
  const accelerationSplitter = context.createChannelSplitter(2);
  const accelerationMerger = context.createChannelMerger(2);
  const leftToLeft = context.createGain();
  const rightToLeft = context.createGain();
  const leftToRight = context.createGain();
  const rightToRight = context.createGain();
  const accelerationTrim = context.createGain();
  const fractureGain = context.createGain();
  const junctionGain = context.createGain();
  const nightshiftGain = context.createGain();
  const accelerationFocusGain = context.createGain();
  const manualEffectsGraph = createManualEffectsGraph(context);
  const meter = context.createAnalyser();
  meter.fftSize = 256;
  meter.smoothingTimeConstant = 0.55;
  const meterBuffer = new Float32Array(meter.fftSize);
  let meterState = { level: 0, rms: 0, peak: 0 };
  accelerationScoop.type = "peaking";
  accelerationScoop.frequency.value = 320;
  accelerationScoop.Q.value = 0.8;
  accelerationAir.type = "highshelf";
  accelerationAir.frequency.value = 6000;
  accelerationFocus.type = "bandpass";
  accelerationFocus.frequency.value = 480;
  accelerationFocus.Q.value = 0.9;
  accelerationFocusLimiter.curve = createAccelerationFocusCurve();
  accelerationFocusLimiter.oversample = "2x";
  accelerationFocusGain.gain.value = 0;
  leftToLeft.gain.value = 1;
  rightToLeft.gain.value = 0;
  leftToRight.gain.value = 0;
  rightToRight.gain.value = 1;
  performanceBus.connect(accelerationScoop).connect(accelerationAir).connect(accelerationSplitter);
  accelerationAir
    .connect(accelerationFocus)
    .connect(accelerationFocusLimiter)
    .connect(accelerationFocusGain)
    .connect(accelerationTrim);
  accelerationSplitter.connect(leftToLeft, 0);
  accelerationSplitter.connect(leftToRight, 0);
  accelerationSplitter.connect(rightToLeft, 1);
  accelerationSplitter.connect(rightToRight, 1);
  leftToLeft.connect(accelerationMerger, 0, 0);
  rightToLeft.connect(accelerationMerger, 0, 0);
  leftToRight.connect(accelerationMerger, 0, 1);
  rightToRight.connect(accelerationMerger, 0, 1);
  accelerationMerger.connect(accelerationTrim).connect(manualEffectsGraph.input);
  manualEffectsGraph.output.connect(masterGain);
  masterGain.connect(meter).connect(context.destination);
  fractureGain.gain.value = 1;
  junctionGain.gain.value = 0;
  nightshiftGain.gain.value = 0;
  fractureGain.connect(performanceBus);
  junctionGain.connect(performanceBus);
  nightshiftGain.connect(performanceBus);

  let node = null;
  let bloomNode = null;
  let bloomSerialLink = null;
  let running = true;
  let muted = false;
  let vehicleEffectsEnabled = true;
  let speed = 0;
  let energy = 0;
  let scoreId = "fracture";
  let requestedScoreId = "fracture";
  let scoreStatus = "loading";
  let scoreError = null;
  let scoreSwitchRevision = 0;
  let scoreMixState = createScoreCrossfadeState("fracture", context.currentTime);
  let fractureReadyState = "loading";
  let fractureReadyError = null;

  let brakeAmount = 0;
  let brakeReported = false;
  let manualBrakeHeld = false;
  let smoothedRateMps2 = 0;
  let lastSpeedAt = 0;
  let brakeTimer = null;
  let accelerationTimer = null;
  let accelerationAmount = 0;
  let accelerationActive = false;
  let accelerationReported = false;
  let accelerationDetector = createAccelerationDetectorState();
  let reportedEffect = null;
  let gpsAccuracyM = null;
  let bloomActiveUntil = 0;
  let bloomTriggeredAtMs = null;
  let bloomReleasedAtMs = null;
  let bloomRefractoryUntil = 0;
  let bloomSuppressedByBrake = false;
  let bloomAudioActive = false;

  // Last arrangement snapshot posted by the worklet. Read, never written, by
  // the interface and the diagnostics.
  let arrangement = {
    sceneId: "rest",
    scene: 0,
    halfTime: true,
    tempo: 162,
    transportTempo: 162,
    perceivedTempo: null,
    motionLane: "PARK",
    energy: 0,
    decelerationState: "cruise",
    activeLanes: [],
  };
  function publishArrangement(snapshot) {
    onPulse?.({
      ...snapshot,
      accelerationMps2: Math.round(smoothedRateMps2 * 1000) / 1000,
      brake: Math.round(brakeAmount * 1000) / 1000,
    });
  }
  let junction = null;
  let nightshift = null;

  function ensureJunction() {
    if (!running) throw new Error("Audio engine is closed");
    if (junction) return junction;
    junction = createJunctionPlayer(context, junctionGain, (snapshot) => {
      if (scoreId !== "junction") return;
      arrangement = snapshot;
      publishArrangement(arrangement);
    }, (status, error) => {
      if (scoreId !== "junction" && requestedScoreId !== "junction") return;
      scoreStatus = status;
      scoreError = error;
    });
    junction.setSpeed(speed, energy, 0);
    junction.setBrake(vehicleEffectsEnabled ? brakeAmount : 0);
    return junction;
  }

  function ensureNightshift() {
    if (!running) throw new Error("Audio engine is closed");
    if (nightshift) return nightshift;
    nightshift = createNightshiftPlayer(context, nightshiftGain, (snapshot) => {
      if (scoreId !== "nightshift") return;
      arrangement = snapshot;
      publishArrangement(arrangement);
    }, (status, error) => {
      if (scoreId !== "nightshift" && requestedScoreId !== "nightshift") return;
      scoreStatus = status;
      scoreError = error;
    });
    nightshift.setSpeed(speed, energy, 0);
    nightshift.setBrake(vehicleEffectsEnabled ? brakeAmount : 0);
    return nightshift;
  }

  function beginScoreCrossfade(targetScoreId) {
    if (!running) throw new Error("Audio engine is closed");
    scoreMixState = scheduleScoreCrossfade({
      fractureParam: fractureGain.gain,
      junctionParam: junctionGain.gain,
      nightshiftParam: nightshiftGain.gain,
      state: scoreMixState,
      targetScoreId,
      startAt: context.currentTime,
      durationSeconds: SCORE_SWITCH_CROSSFADE_SECONDS,
    });
    return scoreMixState;
  }

  function forceScoreMix(targetScoreId) {
    const at = context.currentTime;
    const fractureValue = targetScoreId === "fracture" ? 1 : 0;
    const junctionValue = targetScoreId === "junction" ? 1 : 0;
    const nightshiftValue = targetScoreId === "nightshift" ? 1 : 0;
    fractureGain.gain.cancelScheduledValues?.(at);
    junctionGain.gain.cancelScheduledValues?.(at);
    nightshiftGain.gain.cancelScheduledValues?.(at);
    fractureGain.gain.setValueAtTime(fractureValue, at);
    junctionGain.gain.setValueAtTime(junctionValue, at);
    nightshiftGain.gain.setValueAtTime(nightshiftValue, at);
    scoreMixState = createScoreCrossfadeState(targetScoreId, at);
  }

  function commitJunctionSafetyBed(message) {
    requestedScoreId = "junction";
    scoreId = "junction";
    scoreStatus = "error";
    scoreError = message;
    // There is no audible outgoing renderer in this recovery state. A four-
    // second crossfade from its nominal gain would only fade up from silence.
    forceScoreMix("junction");
    arrangement = ensureJunction().getState();
    publishArrangement(arrangement);
    return "junction";
  }

  function finishScoreCrossfade(targetScoreId, revision, transition, options = {}) {
    const {
      deactivateJunction = false,
      deactivateNightshift = false,
      preserveError = false,
    } = options;
    return scheduleScoreCrossfadeCompletion({
      transition,
      // Wall timers keep firing while an AudioContext is suspended. Cleanup
      // follows the audio clock so the outgoing graph cannot be removed before
      // its scheduled gain curve has actually finished.
      currentTime: () => context.currentTime,
      schedule: (callback, delay) => window.setTimeout(callback, delay),
      // Closing an AudioContext freezes its clock. Do not let a deferred
      // cleanup timer reschedule itself forever after the engine is destroyed.
      shouldContinue: () => running,
      onComplete: async () => {
        if (shouldCompleteScoreCrossfade({
          running,
          requestedScoreId,
          targetScoreId,
          revision,
          currentRevision: scoreSwitchRevision,
        })) {
          if (deactivateJunction) await junction?.setActive(false).catch(() => {});
          if (deactivateNightshift) await nightshift?.setActive(false).catch(() => {});
          if (!preserveError) {
            scoreStatus = "ready";
            scoreError = null;
          }
        }
      },
      result: scoreId,
    });
  }

  async function recoverFromFractureProcessorError(event) {
    if (!running || fractureReadyState === "error") return;
    const error = new Error("FRACTURE audio processor stopped unexpectedly");
    fractureReadyState = "error";
    fractureReadyError = error;
    const failedNode = node;
    node = null;
    if (failedNode) {
      failedNode.port.onmessage = null;
      failedNode.onprocessorerror = null;
      try { failedNode.disconnect(); } catch {}
    }
    console.error("[flux] FRACTURE processor failed", event);
    if (scoreId !== "fracture" && requestedScoreId !== "fracture") return;

    const revision = ++scoreSwitchRevision;
    requestedScoreId = "junction";
    scoreId = "junction";
    scoreStatus = "error";
    scoreError = error.message;
    try {
      const fallback = ensureJunction();
      const activation = fallback.setActive(true, { externalEntranceFade: true });
      // A dead processor is already silent. Restore the harmonic safety bed
      // immediately rather than stretching silence across a musical crossfade.
      forceScoreMix("junction");
      arrangement = fallback.getState();
      publishArrangement(arrangement);
      onScoreRecovery?.({
        failedScoreId: "fracture",
        activeScoreId: "junction",
        message: error.message,
      });
      await activation;
      if (!running || revision !== scoreSwitchRevision || requestedScoreId !== "junction") return;
      scoreStatus = "error";
      scoreError = error.message;
    } catch (fallbackError) {
      if (!running || revision !== scoreSwitchRevision) return;
      scoreStatus = "error";
      scoreError = `${error.message}; JUNCTION fallback failed: ${fallbackError?.message || fallbackError}`;
    }
  }

  const fractureReady = (async () => {
    if (typeof context.audioWorklet?.addModule !== "function") {
      throw new Error("AudioWorklet is unavailable");
    }
    await withReadinessTimeout(context.audioWorklet.addModule(processorUrl), {
      label: "FRACTURE AudioWorklet",
      timeoutMs: AUDIO_WORKLET_READY_TIMEOUT_MS,
      schedule: window.setTimeout ?? globalThis.setTimeout,
      cancel: window.clearTimeout ?? globalThis.clearTimeout,
    });
    if (!running) return false;
    node = new AudioWorkletNode(context, "score-processor", { outputChannelCount: [2] });
    node.onprocessorerror = (event) => {
      void recoverFromFractureProcessorError(event);
    };
    node.port.onmessage = (event) => {
      if (event.data?.type !== "SNAPSHOT" || scoreId !== "fracture") return;
      arrangement = event.data.payload;
      publishArrangement(arrangement);
    };
    node.connect(fractureGain);
    post("MUTE", { muted });
    post("SPEED", { speed, energy });
    post("BRAKE", { brake: vehicleEffectsEnabled ? brakeAmount : 0 });
    fractureReadyState = "ready";
    return true;
  })().catch((error) => {
    if (!running) return false;
    fractureReadyState = "error";
    fractureReadyError = error instanceof Error ? error : new Error(String(error));
    console.error("[flux] the score worklet did not load", fractureReadyError);
    return false;
  });

  if (typeof context.audioWorklet?.addModule === "function") {
    withReadinessTimeout(context.audioWorklet.addModule(bloomProcessorUrl), {
      label: "BLOOM AudioWorklet",
      timeoutMs: AUDIO_WORKLET_READY_TIMEOUT_MS,
      schedule: window.setTimeout ?? globalThis.setTimeout,
      cancel: window.clearTimeout ?? globalThis.clearTimeout,
    }).then(() => {
      if (!running) return;
      bloomNode = new AudioWorkletNode(context, "bloom-processor", { outputChannelCount: [2] });
      bloomSerialLink = installBypassableSerialProcessor({
        source: performanceBus,
        processor: bloomNode,
        destination: accelerationScoop,
        onProcessorError: (event) => {
          if (!running) return;
          bloomNode = null;
          bloomSerialLink = null;
          bloomActiveUntil = 0;
          bloomTriggeredAtMs = null;
          bloomReleasedAtMs = null;
          bloomSuppressedByBrake = false;
          bloomAudioActive = false;
          reportActiveEffect();
          console.error("[flux] BLOOM processor failed; direct score bus restored", event);
        },
      });
    }).catch((error) => {
      console.error("[flux] the BLOOM worklet did not load", error);
    });
  }

  function post(type, payload) {
    node?.port.postMessage({ type, payload });
  }

  function reportActiveEffect() {
    const bloomReported = performance.now() < bloomActiveUntil;
    const nextEffect = brakeReported
      ? "UNDERWATER"
      : bloomReported ? "BLOOM" : accelerationReported ? "OPEN" : null;
    if (nextEffect === reportedEffect) return;
    reportedEffect = nextEffect;
    onEffectChange?.(nextEffect);
  }

  function bloomMacroAmount(capturedAtMs) {
    if (bloomTriggeredAtMs == null || capturedAtMs >= bloomActiveUntil) return 0;
    return sampleTimedGestureEnvelope({
      elapsedSeconds: (capturedAtMs - bloomTriggeredAtMs) / 1000,
      releaseElapsedSeconds: bloomReleasedAtMs == null
        ? null
        : (capturedAtMs - bloomReleasedAtMs) / 1000,
      attackSeconds: BLOOM_ATTACK_SECONDS,
      automaticReleaseAtSeconds: BLOOM_SWEEP_SECONDS,
      releaseSeconds: BLOOM_RELEASE_SECONDS,
    });
  }

  function macroSnapshot(capturedAtMs = performance.now()) {
    return createAudioMacroSnapshot({
      capturedAtMs,
      open: accelerationAmount,
      underwater: brakeAmount,
      bloom: bloomMacroAmount(capturedAtMs),
    });
  }

  /** Reports effects only on real crossings, with braking taking priority. */
  function reviewEffectBadges() {
    if (!brakeReported && brakeAmount >= BRAKE_ENGAGE_AT) brakeReported = true;
    else if (brakeReported && brakeAmount <= BRAKE_RELEASE_AT) brakeReported = false;
    if (!accelerationReported && accelerationAmount >= ACCELERATION_BADGE_AT) accelerationReported = true;
    else if (accelerationReported && accelerationAmount <= 0.08) accelerationReported = false;
    reportActiveEffect();
  }

  /** True only while the vehicle is decelerating harder than an ordinary lift-off. */
  function isBraking() {
    if (manualBrakeHeld) return true;
    if (speed <= MINIMUM_BRAKING_SPEED_KMH) return false;
    // A deceleration reading older than the stale window describes a moment that
    // has passed, and must not hold the effect open.
    if (performance.now() - lastSpeedAt > RATE_STALE_MS) return false;
    // The regenerative curve is the baseline an ordinary lift-off produces. Only
    // deceleration clearly steeper than that counts as braking.
    const regenMps2 = -model3AwdLiftOffDecelerationMps2(speed, 1);
    return smoothedRateMps2 < MINIMUM_BRAKING_MPS2
      && smoothedRateMps2 < regenMps2 * BRAKE_MARGIN;
  }

  function tickBrake() {
    const seconds = BRAKE_TICK_MS / 1000;
    const target = isBraking() ? 1 : 0;
    if (target > 0 && performance.now() < bloomActiveUntil && !bloomSuppressedByBrake) {
      const releasedAtMs = performance.now();
      if (bloomAudioActive) bloomNode?.port.postMessage({ type: "RELEASE" });
      bloomAudioActive = false;
      bloomReleasedAtMs = releasedAtMs;
      bloomActiveUntil = releasedAtMs + BLOOM_RELEASE_SECONDS * 1000;
      bloomSuppressedByBrake = true;
    }
    const constant = target > brakeAmount ? BRAKE_ATTACK_SECONDS : BRAKE_RELEASE_SECONDS;
    brakeAmount += (target - brakeAmount) * Math.min(1, seconds / constant);
    if (brakeAmount < 0.001) brakeAmount = 0;
    reviewEffectBadges();
    if (target === 0 && bloomSuppressedByBrake && brakeAmount <= BRAKE_RELEASE_AT) {
      bloomSuppressedByBrake = false;
      bloomRefractoryUntil = performance.now() + BLOOM_REFRACTORY_MS;
    }
    const audibleBrake = vehicleEffectsEnabled ? brakeAmount : 0;
    post("BRAKE", { brake: audibleBrake });
    junction?.setBrake(audibleBrake);
    nightshift?.setBrake(audibleBrake);
  }

  brakeTimer = window.setInterval(tickBrake, BRAKE_TICK_MS);

  function applyAccelerationMacro(time = context.currentTime) {
    const parameters = accelerationMacroParameters(vehicleEffectsEnabled ? accelerationAmount : 0);
    accelerationScoop.gain.setTargetAtTime(parameters.midScoopDb, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    accelerationAir.frequency.setTargetAtTime(parameters.airShelfFrequencyHz, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    accelerationAir.gain.setTargetAtTime(parameters.airShelfDb, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    accelerationFocus.frequency.setTargetAtTime(parameters.focusFrequencyHz, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    accelerationFocus.Q.setTargetAtTime(parameters.focusQ, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    accelerationFocusGain.gain.setTargetAtTime(parameters.focusGain, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    accelerationTrim.gain.setTargetAtTime(parameters.trimGain, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    const direct = (1 + parameters.width) * 0.5;
    const cross = (1 - parameters.width) * 0.5;
    leftToLeft.gain.setTargetAtTime(direct, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    rightToRight.gain.setTargetAtTime(direct, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    leftToRight.gain.setTargetAtTime(cross, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    rightToLeft.gain.setTargetAtTime(cross, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
  }

  function tickAcceleration() {
    const now = performance.now();
    const stale = now - lastSpeedAt > RATE_STALE_MS;
    if (stale && smoothedRateMps2 !== 0) {
      smoothedRateMps2 = 0;
      publishArrangement(arrangement);
    }
    accelerationDetector = advanceAccelerationDetectorClock(accelerationDetector, {
      nowMs: now,
      braking: isBraking(),
    });
    accelerationActive = accelerationDetector.active;
    const target = accelerationMacroTargetAmount({
      active: accelerationActive,
      intensity: accelerationDetector.intensity,
      averageMps2: accelerationDetector.averageMps2,
    });
    accelerationAmount = advanceAccelerationMacroAmount(
      accelerationAmount,
      target,
      ACCELERATION_TICK_MS / 1000,
    );
    if (accelerationAmount < 0.001) accelerationAmount = 0;
    applyAccelerationMacro();
    reviewEffectBadges();
  }

  function observeAccelerationSample(nextSpeed, capturedAtMs, accuracyM) {
    const observation = observeAccelerationDetector(accelerationDetector, {
      speedKmh: nextSpeed,
      capturedAtMs,
      accuracyM,
      braking: isBraking(),
    });
    accelerationDetector = observation.state;
    accelerationActive = accelerationDetector.active;
    if (observation.triggered
      && bloomNode
      && accelerationTrajectoryIsBloom(accelerationDetector)
      && !isBraking()
      && capturedAtMs >= bloomRefractoryUntil) {
      bloomTriggeredAtMs = capturedAtMs;
      bloomReleasedAtMs = null;
      bloomActiveUntil = capturedAtMs + BLOOM_GESTURE_MS;
      bloomRefractoryUntil = capturedAtMs + BLOOM_REFRACTORY_MS;
      if (vehicleEffectsEnabled && bloomNode) {
        bloomNode.port.postMessage({ type: "TRIGGER" });
        bloomAudioActive = true;
      }
    }
    if (observation.triggered || observation.released) publishArrangement(arrangement);
    reviewEffectBadges();
    return observation;
  }

  accelerationTimer = window.setInterval(tickAcceleration, ACCELERATION_TICK_MS);

  function measureOutput() {
    meter.getFloatTimeDomainData(meterBuffer);
    let sumSquares = 0;
    let peak = 0;
    for (let index = 0; index < meterBuffer.length; index += 1) {
      const absolute = Math.abs(meterBuffer[index]);
      sumSquares += meterBuffer[index] * meterBuffer[index];
      peak = Math.max(peak, absolute);
    }
    const rms = Math.sqrt(sumSquares / meterBuffer.length);
    meterState = {
      rms,
      peak,
      level: Math.min(1, rms * 3.5),
    };
    return meterState;
  }

  return {
    context,

    async resume() {
      await context.resume();
    },

    setMuted(nextMuted) {
      muted = nextMuted;
      masterGain.gain.setTargetAtTime(muted ? 0 : 1, context.currentTime, 0.015);
      post("MUTE", { muted });
    },

    /**
     * Gates only the vehicle-reactive audio processing. Detection and macro
     * snapshots keep running so every visual retains the same road response.
     */
    setVehicleEffectsEnabled(nextEnabled) {
      vehicleEffectsEnabled = nextEnabled === true;
      const audibleBrake = vehicleEffectsEnabled ? brakeAmount : 0;
      applyAccelerationMacro();
      post("BRAKE", { brake: audibleBrake });
      junction?.setBrake(audibleBrake);
      nightshift?.setBrake(audibleBrake);
      if (!vehicleEffectsEnabled && bloomAudioActive) {
        bloomNode?.port.postMessage({ type: "RELEASE" });
        bloomAudioActive = false;
      } else if (vehicleEffectsEnabled
        && bloomNode
        && !bloomAudioActive
        && !bloomSuppressedByBrake
        && performance.now() < bloomActiveUntil) {
        bloomNode.port.postMessage({ type: "TRIGGER" });
        bloomAudioActive = true;
      }
      return vehicleEffectsEnabled;
    },

    /** Applies the same passenger-controlled effect chain to every adaptive score. */
    setManualEffects(values) {
      return manualEffectsGraph.set(values);
    },

    setScore(nextScoreId) {
      if (!running) return Promise.reject(new Error("Audio engine is closed"));
      requestedScoreId = nextScoreId === "junction"
        ? "junction"
        : nextScoreId === "nightshift" ? "nightshift" : "fracture";
      const revision = ++scoreSwitchRevision;
      scoreError = null;
      if (requestedScoreId === "fracture") {
        scoreStatus = fractureReadyState === "ready" ? "transitioning" : "loading";
        return fractureReady.then(async (ready) => {
          if (!running || requestedScoreId !== "fracture" || revision !== scoreSwitchRevision) return scoreId;
          if (!ready || fractureReadyState !== "ready") {
            const message = fractureReadyError?.message || "FRACTURE did not load";
            let fallbackError = null;
            try {
              await ensureJunction().setActive(true, { externalEntranceFade: true });
            } catch (error) {
              // At native speed a bank failure rejects readiness, but JUNCTION
              // intentionally keeps its zero-beat harmonic bed active.
              fallbackError = error;
            }
            if (!running || requestedScoreId !== "fracture" || revision !== scoreSwitchRevision) return scoreId;
            const detail = fallbackError
              ? `${message}; JUNCTION native unavailable: ${fallbackError?.message || fallbackError}`
              : message;
            return commitJunctionSafetyBed(detail);
          }

          scoreId = "fracture";
          const transition = beginScoreCrossfade("fracture");
          if ((!junction && !nightshift) || transition.endAt <= context.currentTime + 0.01) {
            scoreStatus = "ready";
            return Promise.allSettled([
              junction?.setActive(false),
              nightshift?.setActive(false),
            ]).then(() => "fracture");
          }
          scoreStatus = "transitioning";
          return finishScoreCrossfade("fracture", revision, transition, {
            deactivateJunction: true,
            deactivateNightshift: true,
          });
        });
      }

      if (requestedScoreId === "nightshift") {
        scoreStatus = "loading";
        return ensureNightshift().setActive(true).then(() => {
          if (!running || requestedScoreId !== "nightshift" || revision !== scoreSwitchRevision) return scoreId;
          scoreId = "nightshift";
          arrangement = ensureNightshift().getState();
          publishArrangement(arrangement);
          scoreStatus = "transitioning";
          const transition = beginScoreCrossfade("nightshift");
          return finishScoreCrossfade("nightshift", revision, transition, {
            deactivateJunction: true,
          });
        }).catch(async (error) => {
          if (!running || requestedScoreId !== "nightshift" || revision !== scoreSwitchRevision) return scoreId;
          if (fractureReadyState !== "ready") {
            return commitJunctionSafetyBed(
              `NIGHTSHIFT unavailable: ${error?.message || error}; FRACTURE is unavailable`,
            );
          }
          requestedScoreId = "fracture";
          scoreId = "fracture";
          scoreStatus = "error";
          scoreError = error instanceof Error ? error.message : "NIGHTSHIFT did not load";
          const fallbackTransition = beginScoreCrossfade("fracture");
          return finishScoreCrossfade("fracture", revision, fallbackTransition, {
            deactivateNightshift: true,
            preserveError: true,
          });
        });
      }

      // Keep FRACTURE audible while the compact bank crosses a slow vehicle
      // connection. The hand-off begins only after JUNCTION can really play,
      // so selecting a score never creates a loading-shaped hole in the music.
      scoreStatus = "loading";
      return ensureJunction().setActive(true, { externalEntranceFade: true }).then(() => {
        if (!running || requestedScoreId !== "junction" || revision !== scoreSwitchRevision) return scoreId;
        scoreId = "junction";
        scoreStatus = "transitioning";
        const transition = beginScoreCrossfade("junction");
        return finishScoreCrossfade("junction", revision, transition, {
          deactivateNightshift: true,
        });
      }).catch(async (error) => {
        if (!running || requestedScoreId !== "junction" || revision !== scoreSwitchRevision) return scoreId;
        // A loading FRACTURE worklet is not an audible fallback. Waiting for
        // its bounded deadline would leave JUNCTION's already-running safety
        // bed at zero gain for up to eight seconds, so recover immediately.
        if (fractureReadyState !== "ready") {
          const fractureDetail = fractureReadyState === "error"
            ? fractureReadyError?.message || "FRACTURE is unavailable"
            : "FRACTURE is not yet audible";
          return commitJunctionSafetyBed(
            `JUNCTION native unavailable: ${error?.message || error}; ${fractureDetail}`,
          );
        }
        requestedScoreId = "fracture";
        scoreId = "fracture";
        scoreStatus = "error";
        scoreError = error instanceof Error ? error.message : "JUNCTION did not load";
        const fallbackTransition = beginScoreCrossfade("fracture");
        return finishScoreCrossfade("fracture", revision, fallbackTransition, {
          deactivateJunction: true,
          preserveError: true,
        });
      });
    },

    setSpeed(nextSpeed) {
      const now = performance.now();
      const elapsedMs = lastSpeedAt > 0 ? now - lastSpeedAt : 0;
      const rate = nextVehicleRate({
        previousRateMps2: smoothedRateMps2,
        previousSpeedKmh: speed,
        nextSpeedKmh: nextSpeed,
        elapsedMs,
      });
      smoothedRateMps2 = rate.rateMps2;
      lastSpeedAt = now;
      speed = nextSpeed;
      energy = speedToEnergy(speed);
      post("SPEED", { speed, energy });
      junction?.setSpeed(speed, energy, elapsedMs / 1000);
      nightshift?.setSpeed(speed, energy, elapsedMs / 1000);
      // Demo and QA speed feeds have no GPS accuracy and are observed here.
      // Real GPS feeds provide their unsmoothed trusted sample through
      // setAccelerationSample so UI smoothing cannot hide the launch.
      if (gpsAccuracyM == null) observeAccelerationSample(speed, now, null);
    },

    setAccelerationSample(nextSpeed, {
      capturedAtMs = performance.now(),
      accuracyM = gpsAccuracyM,
    } = {}) {
      return observeAccelerationSample(nextSpeed, capturedAtMs, accuracyM);
    },

    setGpsAccuracy(accuracyM) {
      gpsAccuracyM = Number.isFinite(accuracyM) ? accuracyM : null;
    },

    /**
     * A held service brake. The interface calls this while the input is down and
     * `releaseBrake` when it comes up; nothing here times out, because a brake
     * that releases itself is exactly the defect this replaced.
     */
    brake() {
      manualBrakeHeld = true;
      tickBrake();
    },

    releaseBrake() {
      manualBrakeHeld = false;
    },

    /** Plays one lane of the score on its own, for the audio preview. */
    audition(voice) {
      post("AUDITION", { voice });
    },

    startCue() {},

    getLevel() {
      return measureOutput().level;
    },

    getMeterState() {
      return { ...meterState };
    },

    getMacroSnapshot() {
      return macroSnapshot();
    },

    getState() {
      if (scoreId === "junction" || scoreId === "nightshift") {
        const sampledState = scoreId === "nightshift"
          ? nightshift?.getState()
          : junction?.getState();
        return {
          ...sampledState,
          requestedScoreId,
          scoreStatus,
          scoreError,
          energy,
          energyCeilingKmh: ROAD_SPEED_CEILING_KMH,
          brake: Math.round(brakeAmount * 100) / 100,
          macros: macroSnapshot(),
          accelerationMps2: Math.round(smoothedRateMps2 * 1000) / 1000,
          accelerationMacro: Math.round(accelerationAmount * 1000) / 1000,
          accelerationTrajectory: {
            active: accelerationDetector.active,
            riseKmh: Math.round(accelerationDetector.riseKmh * 10) / 10,
            averageMps2: Math.round(accelerationDetector.averageMps2 * 1000) / 1000,
            intensity: Math.round(accelerationDetector.intensity * 1000) / 1000,
          },
        };
      }
      return {
        score: arrangement.scoreId ?? "fracture",
        scoreLabel: arrangement.scoreLabel ?? "FRACTURE",
        requestedScoreId,
        scoreStatus,
        scoreError,
        energy,
        scene: arrangement.scene,
        sceneId: arrangement.sceneId,
        halfTime: arrangement.halfTime,
        tempo: Math.round((arrangement.tempo ?? 0) * 10) / 10,
        transportTempo: Math.round((arrangement.transportTempo ?? arrangement.tempo ?? 0) * 10) / 10,
        perceivedTempo: arrangement.perceivedTempo == null
          ? null
          : Math.round(arrangement.perceivedTempo * 10) / 10,
        motionLane: arrangement.motionLane ?? "DRIVE",
        activeLanes: arrangement.activeLanes,
        energyCeilingKmh: ROAD_SPEED_CEILING_KMH,
        motionPhase: arrangement.decelerationState,
        brake: Math.round(brakeAmount * 100) / 100,
        macros: macroSnapshot(),
        accelerationMps2: Math.round(smoothedRateMps2 * 1000) / 1000,
        accelerationMacro: Math.round(accelerationAmount * 1000) / 1000,
        accelerationTrajectory: {
          active: accelerationDetector.active,
          riseKmh: Math.round(accelerationDetector.riseKmh * 10) / 10,
          averageMps2: Math.round(accelerationDetector.averageMps2 * 1000) / 1000,
          intensity: Math.round(accelerationDetector.intensity * 1000) / 1000,
        },
      };
    },

    destroy() {
      if (!running) return;
      running = false;
      scoreSwitchRevision += 1;
      window.clearInterval(brakeTimer);
      window.clearInterval(accelerationTimer);
      if (node) {
        node.port.onmessage = null;
        node.onprocessorerror = null;
        node.disconnect();
      }
      bloomSerialLink?.destroy();
      bloomNode?.disconnect();
      junction?.destroy();
      nightshift?.destroy();
      junctionGain.disconnect();
      nightshiftGain.disconnect();
      fractureGain.disconnect();
      performanceBus.disconnect();
      accelerationScoop.disconnect();
      accelerationAir.disconnect();
      accelerationSplitter.disconnect();
      leftToLeft.disconnect();
      rightToLeft.disconnect();
      leftToRight.disconnect();
      rightToRight.disconnect();
      accelerationMerger.disconnect();
      accelerationTrim.disconnect();
      manualEffectsGraph.destroy();
      masterGain.disconnect();
      meter.disconnect();
      if (ownsContext && context.state !== "closed") context.close().catch(() => {});
    },
  };
}
