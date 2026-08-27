import { ROAD_SPEED_CEILING_KMH, speedToEnergy } from "./signal-model.js";
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
      speed = nextSpeed;
      energy = speedToEnergy(speed);
      if (node) node.port.postMessage({ type: "SPEED", payload: { speed, energy } });
    },
    startCue() {
      // Stub for backward compatibility
    },
    brake() {
      // The brake is handled by u_brake prop in the parent component which will 
      // likely set it continuously. If this is a discrete trigger, we could
      // emulate a short filter sweep. But we'll leave it simple for Phase 1.
      if (node) {
          node.port.postMessage({ type: "BRAKE", payload: { brake: 1.0 } });
          // decay it back
          setTimeout(() => {
              if (node) node.port.postMessage({ type: "BRAKE", payload: { brake: 0.0 } });
          }, 400);
      }
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
