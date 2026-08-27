// AudioWorklet shell around the score core.
//
// Original sedicivalvole code, and deliberately thin: every musical decision
// lives in `score-core.js` and `arranger.js`, which have no AudioContext
// dependency, so the identical code runs here and in the Node offline render.
// This file only owns what genuinely belongs to the audio thread — the render
// quantum, the message port, the mute gate, and the brake filter that sits
// after the master bus.

import { createScoreCore } from "../score-core.js";
import { SCORE } from "../jungle-score.js";
import { BrakeFilter } from "../dsp/brake-filter.js";

class ScoreProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.core = createScoreCore({ sampleRate, score: SCORE });
    this.brake = new BrakeFilter(sampleRate);
    this.speedKmh = 0;
    this.muted = false;
    this.muteGain = 1;
    this.blockSeconds = 128 / sampleRate;
    this.snapshotCountdown = 0;

    this.port.onmessage = (event) => {
      const { type, payload } = event.data ?? {};
      if (type === "SPEED") {
        this.speedKmh = Number(payload?.speed) || 0;
      } else if (type === "BRAKE") {
        this.brake.set(Number(payload?.brake) || 0);
      } else if (type === "MUTE") {
        this.muted = Boolean(payload?.muted);
      } else if (type === "AUDITION") {
        this.core.audition(String(payload?.voice ?? ""));
      }
    };
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output || !output[0]) return true;
    const left = output[0];
    const right = output.length > 1 ? output[1] : null;
    const frames = left.length;

    this.core.observe(this.speedKmh, frames / sampleRate);
    this.core.process(left, right ?? left, frames);

    const braking = this.brake.refresh();
    const brakeGain = this.brake.gain();
    // Mute is a short ramp rather than a switch, so STOP never clicks.
    const muteTarget = this.muted ? 0 : 1;

    for (let frame = 0; frame < frames; frame += 1) {
      this.muteGain += (muteTarget - this.muteGain) * 0.002;
      const gain = this.muteGain * (braking ? brakeGain : 1);
      const dryLeft = left[frame];
      const dryRight = right ? right[frame] : dryLeft;
      left[frame] = (braking ? this.brake.tick(0, dryLeft) : dryLeft) * gain;
      if (right) right[frame] = (braking ? this.brake.tick(1, dryRight) : dryRight) * gain;
    }

    // The arrangement is reported roughly ten times a second: enough for the
    // readouts and the flight recorder, far too little to cost anything.
    this.snapshotCountdown -= frames;
    if (this.snapshotCountdown <= 0) {
      this.snapshotCountdown = sampleRate * 0.1;
      this.port.postMessage({ type: "SNAPSHOT", payload: this.core.snapshot() });
    }

    return true;
  }
}

registerProcessor("score-processor", ScoreProcessor);
