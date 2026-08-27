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
import { StateVariableFilter } from "../dsp/primitives.js";

/**
 * Brake filter.
 *
 * A pair of cascaded state-variable low passes, one per channel, swept down to
 * roughly 200 Hz as the brake engages. Two poles rather than one because a
 * single pole still lets the break's transients through, and the effect has to
 * read as the music going under water rather than as a tone control.
 *
 * The transport is untouched: the piece keeps playing in time underneath, which
 * is what makes releasing the brake feel like surfacing rather than restarting.
 */
class BrakeFilter {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.stages = [
      [new StateVariableFilter(), new StateVariableFilter()],
      [new StateVariableFilter(), new StateVariableFilter()],
    ];
    this.amount = 0;
    this.smoothed = 0;
  }

  set(amount) {
    this.amount = Math.min(1, Math.max(0, amount));
  }

  /** Coefficients move at control rate; the smoothing is what keeps it musical. */
  refresh() {
    // Asymmetric: engaging is quick and deliberate, surfacing is slower and
    // reads as the mix opening back up.
    const rate = this.amount > this.smoothed ? 0.16 : 0.05;
    this.smoothed += (this.amount - this.smoothed) * rate;
    if (this.smoothed < 0.001) {
      this.smoothed = 0;
      return false;
    }
    const cutoff = 18000 * (1 - this.smoothed) ** 2.6 + 200;
    const resonance = 0.12 + this.smoothed * 0.34;
    for (const channel of this.stages) {
      for (const filter of channel) {
        filter.setFrequency(cutoff, resonance, this.sampleRate);
      }
    }
    return true;
  }

  tick(channelIndex, input) {
    const [first, second] = this.stages[channelIndex];
    first.tick(input);
    second.tick(first.lowPass);
    return second.lowPass;
  }

  /** Level trim under the filter, so going under does not also get louder. */
  gain() {
    return 1 - this.smoothed * 0.3;
  }
}

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
