// The Flux audio facade.
//
// Everything musical lives behind the AudioWorklet in `src/score/`. This module
// owns only the browser-side lifecycle: the context, the worklet node, the
// speed feed, the brake detector, and the state the interface and the flight
// recorder read back.

import {
  model3AwdLiftOffDecelerationMps2,
  ROAD_SPEED_CEILING_KMH,
  speedToArrangementDrive,
} from "./signal-model.js";
import { createAudioMacroSnapshot } from "./response-mapping.js";
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
import { withReadinessTimeout } from "./promise-timeout.js";
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

/** Deceleration is only meaningful for a moment; a stale reading must expire. */
const RATE_STALE_MS = VEHICLE_RATE_STALE_MS;
export const AUDIO_WORKLET_READY_TIMEOUT_MS = 8000;

export function createAudioEngine(onPulse, onEffectChange, onScoreRecovery, {
  audioContext = null,
  deferScoreWorklets = false,
} = {}) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!audioContext && !AudioContext) return null;

  const ownsContext = !audioContext;
  const context = audioContext ?? new AudioContext({ latencyHint: "interactive" });
  const masterGain = context.createGain();
  const performanceBus = context.createGain();
  const fractureGain = context.createGain();
  const junctionGain = context.createGain();
  const nightshiftGain = context.createGain();
  const manualEffectsGraph = createManualEffectsGraph(context);
  const meter = context.createAnalyser();
  meter.fftSize = 256;
  meter.smoothingTimeConstant = 0.55;
  const meterBuffer = new Float32Array(meter.fftSize);
  let meterState = { level: 0, rms: 0, peak: 0 };
  performanceBus.connect(manualEffectsGraph.input);
  manualEffectsGraph.output.connect(masterGain);
  masterGain.connect(meter).connect(context.destination);
  fractureGain.gain.value = 1;
  junctionGain.gain.value = 0;
  nightshiftGain.gain.value = 0;
  fractureGain.connect(performanceBus);
  junctionGain.connect(performanceBus);
  nightshiftGain.connect(performanceBus);

  let node = null;
  let running = true;
  let muted = false;
  let vehicleEffectsEnabled = true;
  let speed = 0;
  let arrangementDrive = 0;
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
  let reportedEffect = null;

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
    arrangementDrive: 0,
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
    junction.setSpeed(speed, arrangementDrive, 0);
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
    nightshift.setSpeed(speed, arrangementDrive, 0);
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

  let fractureReady = null;
  function prepareFracture() {
    if (fractureReady) return fractureReady;
    fractureReadyState = "loading";
    fractureReady = (async () => {
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
      post("SPEED", { speed });
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
    return fractureReady;
  }

  // Soundtrack borrows this engine only for vehicle-macro detection. Starting
  // a silent Play the Road processor in that mode wastes real-time audio-thread
  // budget on embedded vehicle Chromium. Lazily promote the same engine if the
  // listener switches to Play the Road later in the session.
  if (!deferScoreWorklets) {
    void prepareFracture();
  }

  function post(type, payload) {
    node?.port.postMessage({ type, payload });
  }

  function reportActiveEffect() {
    const nextEffect = brakeReported ? "UNDERWATER" : null;
    if (nextEffect === reportedEffect) return;
    reportedEffect = nextEffect;
    onEffectChange?.(nextEffect);
  }

  function macroSnapshot(capturedAtMs = performance.now()) {
    return createAudioMacroSnapshot({
      capturedAtMs,
      underwater: brakeAmount,
    });
  }

  /** Reports effects only on real crossings, with braking taking priority. */
  function reviewEffectBadges() {
    if (!brakeReported && brakeAmount >= BRAKE_ENGAGE_AT) brakeReported = true;
    else if (brakeReported && brakeAmount <= BRAKE_RELEASE_AT) brakeReported = false;
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
    if (performance.now() - lastSpeedAt > RATE_STALE_MS && smoothedRateMps2 !== 0) {
      smoothedRateMps2 = 0;
      publishArrangement(arrangement);
    }
    const seconds = BRAKE_TICK_MS / 1000;
    const target = isBraking() ? 1 : 0;
    const constant = target > brakeAmount ? BRAKE_ATTACK_SECONDS : BRAKE_RELEASE_SECONDS;
    brakeAmount += (target - brakeAmount) * Math.min(1, seconds / constant);
    if (brakeAmount < 0.001) brakeAmount = 0;
    reviewEffectBadges();
    const audibleBrake = vehicleEffectsEnabled ? brakeAmount : 0;
    post("BRAKE", { brake: audibleBrake });
    junction?.setBrake(audibleBrake);
    nightshift?.setBrake(audibleBrake);
  }

  brakeTimer = window.setInterval(tickBrake, BRAKE_TICK_MS);

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

    /** Gates the sole vehicle-reactive effect: braking UNDERWATER. */
    setVehicleEffectsEnabled(nextEnabled) {
      vehicleEffectsEnabled = nextEnabled === true;
      const audibleBrake = vehicleEffectsEnabled ? brakeAmount : 0;
      post("BRAKE", { brake: audibleBrake });
      junction?.setBrake(audibleBrake);
      nightshift?.setBrake(audibleBrake);
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
        return prepareFracture().then(async (ready) => {
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
      arrangementDrive = speedToArrangementDrive(speed);
      post("SPEED", { speed });
      junction?.setSpeed(speed, arrangementDrive, elapsedMs / 1000);
      nightshift?.setSpeed(speed, arrangementDrive, elapsedMs / 1000);
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
          scoreWorklets: fractureReady ? "requested" : "deferred",
          requestedScoreId,
          scoreStatus,
          scoreError,
          responseCeilingKmh: ROAD_SPEED_CEILING_KMH,
          brake: Math.round(brakeAmount * 100) / 100,
          macros: macroSnapshot(),
          accelerationMps2: Math.round(smoothedRateMps2 * 1000) / 1000,
        };
      }
      return {
        score: arrangement.scoreId ?? "fracture",
        scoreLabel: arrangement.scoreLabel ?? "FRACTURE",
        scoreWorklets: fractureReady ? "requested" : "deferred",
        requestedScoreId,
        scoreStatus,
        scoreError,
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
        responseCeilingKmh: ROAD_SPEED_CEILING_KMH,
        motionPhase: arrangement.decelerationState,
        brake: Math.round(brakeAmount * 100) / 100,
        macros: macroSnapshot(),
        accelerationMps2: Math.round(smoothedRateMps2 * 1000) / 1000,
      };
    },

    destroy() {
      if (!running) return;
      running = false;
      scoreSwitchRevision += 1;
      window.clearInterval(brakeTimer);
      if (node) {
        node.port.onmessage = null;
        node.onprocessorerror = null;
        node.disconnect();
      }
      junction?.destroy();
      nightshift?.destroy();
      junctionGain.disconnect();
      nightshiftGain.disconnect();
      fractureGain.disconnect();
      performanceBus.disconnect();
      manualEffectsGraph.destroy();
      masterGain.disconnect();
      meter.disconnect();
      if (ownsContext && context.state !== "closed") context.close().catch(() => {});
    },
  };
}
