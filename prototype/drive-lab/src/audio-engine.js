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
  ACCELERATION_MACRO_MAX_HOLD_MS,
  ACCELERATION_MACRO_MIN_SPEED_KMH,
  ACCELERATION_MACRO_REFRACTORY_MS,
  ACCELERATION_MACRO_RELEASE_MPS2,
  advanceAccelerationArmSamples,
  advanceAccelerationMacroAmount,
  accelerationMacroAmount,
  accelerationMacroParameters,
} from "./acceleration-macro.js";
import {
  BLOOM_GESTURE_MS,
  BLOOM_REFRACTORY_MS,
  advanceBloomLaunchHistory,
  isBloomHardLaunch,
} from "./bloom-macro.js";
import { createJunctionPlayer } from "./junction-player.js";
import bloomProcessorUrl from "./score/worklet/bloom-processor.js?audio-worklet";
import processorUrl from "./score/worklet/score-processor.js?audio-worklet";

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
const RATE_STALE_MS = 700;

export function createAudioEngine(onPulse, onEffectChange) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext({ latencyHint: "interactive" });
  const masterGain = context.createGain();
  const performanceBus = context.createGain();
  const accelerationScoop = context.createBiquadFilter();
  const accelerationAir = context.createBiquadFilter();
  const accelerationSplitter = context.createChannelSplitter(2);
  const accelerationMerger = context.createChannelMerger(2);
  const leftToLeft = context.createGain();
  const rightToLeft = context.createGain();
  const leftToRight = context.createGain();
  const rightToRight = context.createGain();
  const accelerationTrim = context.createGain();
  const fractureGain = context.createGain();
  const meter = context.createAnalyser();
  meter.fftSize = 256;
  meter.smoothingTimeConstant = 0.55;
  const meterBuffer = new Float32Array(meter.fftSize);
  let meterState = { level: 0, rms: 0, peak: 0 };
  accelerationScoop.type = "peaking";
  accelerationScoop.frequency.value = 320;
  accelerationScoop.Q.value = 0.8;
  accelerationAir.type = "highshelf";
  accelerationAir.frequency.value = 9000;
  leftToLeft.gain.value = 1;
  rightToLeft.gain.value = 0;
  leftToRight.gain.value = 0;
  rightToRight.gain.value = 1;
  performanceBus.connect(accelerationScoop).connect(accelerationAir).connect(accelerationSplitter);
  accelerationSplitter.connect(leftToLeft, 0);
  accelerationSplitter.connect(leftToRight, 0);
  accelerationSplitter.connect(rightToLeft, 1);
  accelerationSplitter.connect(rightToRight, 1);
  leftToLeft.connect(accelerationMerger, 0, 0);
  rightToLeft.connect(accelerationMerger, 0, 0);
  leftToRight.connect(accelerationMerger, 0, 1);
  rightToRight.connect(accelerationMerger, 0, 1);
  accelerationMerger.connect(accelerationTrim).connect(masterGain);
  masterGain.connect(meter).connect(context.destination);
  fractureGain.connect(performanceBus);

  let node = null;
  let bloomNode = null;
  let running = true;
  let muted = false;
  let speed = 0;
  let energy = 0;
  let scoreId = "fracture";
  let scoreSwitchRevision = 0;

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
  let accelerationArmSamples = 0;
  let accelerationStartedAt = 0;
  let accelerationRefractoryUntil = 0;
  let reportedEffect = null;
  let gpsAccuracyM = null;
  let bloomLaunchHistory = [];
  let bloomActiveUntil = 0;
  let bloomRefractoryUntil = 0;
  let bloomSuppressedByBrake = false;

  // Last arrangement snapshot posted by the worklet. Read, never written, by
  // the interface and the diagnostics.
  let arrangement = {
    sceneId: "rest",
    scene: 0,
    halfTime: true,
    tempo: 162,
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
  const junction = createJunctionPlayer(context, performanceBus, (snapshot) => {
    if (scoreId !== "junction") return;
    arrangement = snapshot;
    publishArrangement(arrangement);
  });

  context.audioWorklet.addModule(processorUrl).then(() => {
    if (!running) return;
    node = new AudioWorkletNode(context, "score-processor", { outputChannelCount: [2] });
    node.port.onmessage = (event) => {
      if (event.data?.type !== "SNAPSHOT" || scoreId !== "fracture") return;
      arrangement = event.data.payload;
      publishArrangement(arrangement);
    };
    node.connect(fractureGain);
    post("MUTE", { muted });
    post("SPEED", { speed, energy });
    post("BRAKE", { brake: brakeAmount });
  }).catch((error) => {
    console.error("[flux] the score worklet did not load", error);
  });

  context.audioWorklet.addModule(bloomProcessorUrl).then(() => {
    if (!running) return;
    bloomNode = new AudioWorkletNode(context, "bloom-processor", { outputChannelCount: [2] });
    bloomNode.connect(accelerationScoop);
    performanceBus.disconnect(accelerationScoop);
    performanceBus.connect(bloomNode);
  }).catch((error) => {
    console.error("[flux] the BLOOM worklet did not load", error);
  });

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
    if (target > 0 && performance.now() < bloomActiveUntil) {
      bloomNode?.port.postMessage({ type: "RELEASE" });
      bloomActiveUntil = performance.now() + 250;
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
    post("BRAKE", { brake: brakeAmount });
    junction.setBrake(brakeAmount);
  }

  brakeTimer = window.setInterval(tickBrake, BRAKE_TICK_MS);

  function applyAccelerationMacro(time = context.currentTime) {
    const parameters = accelerationMacroParameters(accelerationAmount);
    accelerationScoop.gain.setTargetAtTime(parameters.midScoopDb, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
    accelerationAir.gain.setTargetAtTime(parameters.airShelfDb, time, ACCELERATION_PARAM_SMOOTH_SECONDS);
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
    const timedOut = accelerationActive && now - accelerationStartedAt >= ACCELERATION_MACRO_MAX_HOLD_MS;
    const mustRelease = stale
      || speed < ACCELERATION_MACRO_MIN_SPEED_KMH
      || smoothedRateMps2 < ACCELERATION_MACRO_RELEASE_MPS2
      || isBraking()
      || timedOut;
    if (accelerationActive && mustRelease) {
      accelerationActive = false;
      accelerationRefractoryUntil = now + ACCELERATION_MACRO_REFRACTORY_MS;
      accelerationArmSamples = 0;
    }
    const target = accelerationActive ? accelerationMacroAmount(smoothedRateMps2) : 0;
    accelerationAmount = advanceAccelerationMacroAmount(
      accelerationAmount,
      target,
      ACCELERATION_TICK_MS / 1000,
    );
    if (accelerationAmount < 0.001) accelerationAmount = 0;
    applyAccelerationMacro();
    reviewEffectBadges();
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

    setScore(nextScoreId) {
      scoreId = nextScoreId === "junction" ? "junction" : "fracture";
      const revision = ++scoreSwitchRevision;
      if (scoreId === "fracture") {
        fractureGain.gain.setTargetAtTime(1, context.currentTime, 0.035);
        junction.setActive(false).catch(() => {});
        return;
      }

      // Keep FRACTURE audible while the compact bank crosses a slow vehicle
      // connection. The hand-off begins only after JUNCTION can really play,
      // so selecting a score never creates a loading-shaped hole in the music.
      junction.setActive(true).then(() => {
        if (scoreId !== "junction" || revision !== scoreSwitchRevision) return;
        fractureGain.gain.setTargetAtTime(0, context.currentTime, 0.035);
      }).catch(() => {
        if (scoreId !== "junction" || revision !== scoreSwitchRevision) return;
        scoreId = "fracture";
        fractureGain.gain.setTargetAtTime(1, context.currentTime, 0.035);
      });
    },

    setSpeed(nextSpeed) {
      const now = performance.now();
      const elapsedSeconds = lastSpeedAt > 0 ? (now - lastSpeedAt) / 1000 : 0;
      if (elapsedSeconds > 0 && elapsedSeconds < 1) {
        const rateMps2 = ((nextSpeed - speed) / 3.6) / elapsedSeconds;
        smoothedRateMps2 = smoothedRateMps2 * 0.72 + rateMps2 * 0.28;
      }
      lastSpeedAt = now;
      speed = nextSpeed;
      energy = speedToEnergy(speed);
      bloomLaunchHistory = advanceBloomLaunchHistory(
        bloomLaunchHistory,
        smoothedRateMps2,
        now,
      );
      post("SPEED", { speed, energy });
      junction.setEnergy(energy);
      if (!accelerationActive) {
        accelerationArmSamples = advanceAccelerationArmSamples(
          accelerationArmSamples,
          smoothedRateMps2,
          now >= accelerationRefractoryUntil && speed >= ACCELERATION_MACRO_MIN_SPEED_KMH,
        );
        if (accelerationArmSamples >= 2) {
          accelerationActive = true;
          accelerationStartedAt = now;
        }
      }
      if (bloomNode && isBloomHardLaunch(bloomLaunchHistory, {
        openActive: accelerationActive,
        braking: isBraking(),
        accuracyM: gpsAccuracyM,
        nowMs: now,
        refractoryUntilMs: bloomRefractoryUntil,
      })) {
        bloomNode.port.postMessage({ type: "TRIGGER" });
        bloomActiveUntil = now + BLOOM_GESTURE_MS;
        bloomRefractoryUntil = now + BLOOM_REFRACTORY_MS;
        reviewEffectBadges();
      }
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

    getState() {
      if (scoreId === "junction") {
        return {
          ...junction.getState(),
          energy,
          energyCeilingKmh: ROAD_SPEED_CEILING_KMH,
          brake: Math.round(brakeAmount * 100) / 100,
          accelerationMps2: Math.round(smoothedRateMps2 * 1000) / 1000,
          accelerationMacro: Math.round(accelerationAmount * 1000) / 1000,
        };
      }
      return {
        score: arrangement.scoreId ?? "fracture",
        scoreLabel: arrangement.scoreLabel ?? "FRACTURE",
        energy,
        scene: arrangement.scene,
        sceneId: arrangement.sceneId,
        halfTime: arrangement.halfTime,
        tempo: Math.round((arrangement.tempo ?? 0) * 10) / 10,
        activeLanes: arrangement.activeLanes,
        energyCeilingKmh: ROAD_SPEED_CEILING_KMH,
        motionPhase: arrangement.decelerationState,
        brake: Math.round(brakeAmount * 100) / 100,
        accelerationMps2: Math.round(smoothedRateMps2 * 1000) / 1000,
        accelerationMacro: Math.round(accelerationAmount * 1000) / 1000,
      };
    },

    destroy() {
      running = false;
      window.clearInterval(brakeTimer);
      window.clearInterval(accelerationTimer);
      if (node) {
        node.port.onmessage = null;
        node.disconnect();
      }
      bloomNode?.disconnect();
      junction.destroy();
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
      masterGain.disconnect();
      meter.disconnect();
      if (context.state !== "closed") context.close().catch(() => {});
    },
  };
}
