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

/** Deceleration is only meaningful for a moment; a stale reading must expire. */
const RATE_STALE_MS = 700;

export function createAudioEngine(onPulse, onEffectChange) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext({ latencyHint: "interactive" });

  let node = null;
  let running = true;
  let muted = false;
  let speed = 0;
  let energy = 0;

  let brakeAmount = 0;
  let brakeReported = false;
  let manualBrakeHeld = false;
  let smoothedRateMps2 = 0;
  let lastSpeedAt = 0;
  let brakeTimer = null;

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

  context.audioWorklet.addModule(processorUrl).then(() => {
    if (!running) return;
    node = new AudioWorkletNode(context, "score-processor", { outputChannelCount: [2] });
    node.port.onmessage = (event) => {
      if (event.data?.type !== "SNAPSHOT") return;
      arrangement = event.data.payload;
      onPulse?.(arrangement);
    };
    node.connect(context.destination);
    post("MUTE", { muted });
    post("SPEED", { speed, energy });
    post("BRAKE", { brake: brakeAmount });
  }).catch((error) => {
    console.error("[flux] the score worklet did not load", error);
  });

  function post(type, payload) {
    node?.port.postMessage({ type, payload });
  }

  /** Reports the effect only on a real crossing, with hysteresis both ways. */
  function reviewBrakeBadge() {
    if (!brakeReported && brakeAmount >= BRAKE_ENGAGE_AT) {
      brakeReported = true;
      onEffectChange?.("UNDERWATER");
      return;
    }
    if (brakeReported && brakeAmount <= BRAKE_RELEASE_AT) {
      brakeReported = false;
      onEffectChange?.(null);
    }
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
    const constant = target > brakeAmount ? BRAKE_ATTACK_SECONDS : BRAKE_RELEASE_SECONDS;
    brakeAmount += (target - brakeAmount) * Math.min(1, seconds / constant);
    if (brakeAmount < 0.001) brakeAmount = 0;
    reviewBrakeBadge();
    post("BRAKE", { brake: brakeAmount });
  }

  brakeTimer = window.setInterval(tickBrake, BRAKE_TICK_MS);

  return {
    context,

    async resume() {
      await context.resume();
    },

    setMuted(nextMuted) {
      muted = nextMuted;
      post("MUTE", { muted });
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
      post("SPEED", { speed, energy });
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
      return energy;
    },

    getState() {
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
      };
    },

    destroy() {
      running = false;
      window.clearInterval(brakeTimer);
      if (node) {
        node.port.onmessage = null;
        node.disconnect();
      }
      if (context.state !== "closed") context.close().catch(() => {});
    },
  };
}
