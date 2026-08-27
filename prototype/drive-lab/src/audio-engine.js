import { ROAD_SPEED_CEILING_KMH, speedToEnergy, model3AwdLiftOffDecelerationMps2 } from "./signal-model.js";
import workletUrl from "./textstep-worklet.js?url";

export function createAudioEngine(onPulse) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext({ latencyHint: "interactive" });
  
  let node = null;
  let speed = 0;
  let energy = 0;
  let brakeValue = 0;
  let running = true;
  let muted = false;
  let lastSpeedTime = 0;
  let smoothedRateMps2 = 0;
  let manualBrakeActive = false;
  let manualBrakeTimeout = null;

  // We initialize the worklet asynchronously
  context.audioWorklet.addModule(workletUrl).then(() => {
    if (!running) return;
    
    node = new AudioWorkletNode(context, "textstep-worklet", {
      outputChannelCount: [2]
    });
    
    node.connect(context.destination);
    
    // Send initial state
    node.port.postMessage({ type: "MUTE", payload: { muted } });
    node.port.postMessage({ type: "SPEED", payload: { speed, energy } });
    node.port.postMessage({ type: "BRAKE", payload: { brake: brakeValue } });
  }).catch((err) => {
    console.error("Failed to load textstep-worklet:", err);
  });

  return {
    context,
    resume: async () => {
      await context.resume();
    },
    setMuted(nextMuted) {
      muted = nextMuted;
      if (node) node.port.postMessage({ type: "MUTE", payload: { muted } });
    },
    setSpeed(nextSpeed) {
      const now = performance.now();
      if (lastSpeedTime > 0) {
        const elapsed = (now - lastSpeedTime) / 1000;
        if (elapsed > 0 && elapsed < 1.0) {
           const rateMps2 = ((nextSpeed - speed) / 3.6) / elapsed;
           smoothedRateMps2 = smoothedRateMps2 * 0.8 + rateMps2 * 0.2;
           
           const regenMps2 = -model3AwdLiftOffDecelerationMps2(speed, 1.0);
           
           // If we are decelerating harder than natural lift-off (with some margin)
           const isHardBraking = (smoothedRateMps2 < regenMps2 * 1.05) && (smoothedRateMps2 < -0.3);
           
           if (isHardBraking) {
               brakeValue = Math.min(1.0, brakeValue + 0.15);
           } else {
               brakeValue = Math.max(0.0, brakeValue - 0.05); // gentle release
           }
        }
      }
      lastSpeedTime = now;
      speed = nextSpeed;
      energy = speedToEnergy(speed);
      
      const finalBrake = manualBrakeActive ? 1.0 : brakeValue;
      if (node) {
        node.port.postMessage({ type: "SPEED", payload: { speed, energy } });
        node.port.postMessage({ type: "BRAKE", payload: { brake: finalBrake } });
      }
    },
    startCue() {
      // Stub for backward compatibility
    },
    brake() {
      manualBrakeActive = true;
      if (node) node.port.postMessage({ type: "BRAKE", payload: { brake: 1.0 } });
      
      clearTimeout(manualBrakeTimeout);
      manualBrakeTimeout = setTimeout(() => {
          manualBrakeActive = false;
      }, 400);
    },
    getLevel() {
      // Stub for Phase 1
      return energy;
    },
    getState() {
      return {
        score: "textstep-worklet",
        energy,
        section: 0,
        energyCeilingKmh: ROAD_SPEED_CEILING_KMH,
        motionPhase: "steady",
        motionRateKmhPerSecond: 0,
        accelerationDrive: 0,
        decelerationRelease: 0,
      };
    },
    destroy() {
      running = false;
      if (node) node.disconnect();
      if (context.state !== "closed") context.close().catch(() => {});
    },
  };
}
