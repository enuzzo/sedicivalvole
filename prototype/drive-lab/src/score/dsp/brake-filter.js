// The underwater brake effect.
//
// Original sedicivalvole code. It lives outside the worklet shell so its level
// behaviour can be measured rather than judged by ear: `tests/score-brake.test.mjs`
// drives real signal through it and asserts how much level actually survives.

import { StateVariableFilter } from "./primitives.js";

/**
 * Brake filter — the underwater effect.
 *
 * Two cascaded state-variable low passes per channel, swept down as the brake
 * engages, with resonance opening at the corner and a saturator after it.
 *
 * The balance here is the whole point and it was wrong: sweeping to 200 Hz
 * removes so much of the signal's energy that the effect reads as the volume
 * being cut rather than as the mix going under. It should be almost entirely a
 * change of *character* — the level may drop a little, and no more.
 *
 * So three things hold the level up while the tone collapses. The corner stops
 * well above the break's fundamentals; the resonant peak at the corner returns
 * some of what the slope takes; and a measured makeup gain, applied under the
 * saturator so it drives rather than simply amplifies, restores the rest. The
 * result loses roughly a tenth of its level at full brake and gains the
 * distortion that makes it sound like pressure instead of absence.
 *
 * The transport is untouched: the piece keeps playing in time underneath, which
 * is what makes releasing the brake feel like surfacing rather than restarting.
 */

/** Level remaining at full brake. The effect is character, not attenuation. */
const BRAKE_RESIDUAL_GAIN = 0.9;

/** The corner never goes below this: under it the break simply disappears. */
const BRAKE_FLOOR_HZ = 430;

/**
 * Output trim at full brake.
 *
 * Not a taste value: it is calibrated against real score output by
 * `tests/score-brake.test.mjs`, which drives six seconds of the piece through
 * the filter and asserts that the wet level changes by no more than about one
 * decibel while the top end loses more than nine. Change it and that test says
 * whether the effect still is one.
 */
const BRAKE_TRIM_AT_FULL = 0.62;

export class BrakeFilter {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.stages = [
      [new StateVariableFilter(), new StateVariableFilter()],
      [new StateVariableFilter(), new StateVariableFilter()],
    ];
    this.amount = 0;
    this.smoothed = 0;
    this.trim = 1;
    this.drive = 0;
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
    const depth = this.smoothed;
    const cutoff = (18000 - BRAKE_FLOOR_HZ) * (1 - depth) ** 2.2 + BRAKE_FLOOR_HZ;
    // Resonance opens with depth, which puts energy back at the corner exactly
    // where the slope is taking it away. Modest: the score is bass-heavy, and a
    // tall peak this low makes the effect *louder* than the signal it filters.
    const resonance = 0.12 + depth * 0.18;
    for (const channel of this.stages) {
      for (const filter of channel) {
        filter.setFrequency(cutoff, resonance, this.sampleRate);
      }
    }
    // Trim is measured, not guessed: tests/score-brake.test.mjs drives real
    // score output through this and asserts what actually survives.
    this.trim = 1 - depth * BRAKE_TRIM_AT_FULL;
    this.drive = depth;
    return true;
  }

  tick(channelIndex, input) {
    const [first, second] = this.stages[channelIndex];
    first.tick(input);
    second.tick(first.lowPass);
    const filtered = second.lowPass;
    // Driven hard into a soft shaper and trimmed after, so the character is
    // saturation rather than attenuation: under load the mix should sound
    // compressed and pushed, the way a loud system does through water.
    const shaped = Math.tanh(filtered * (1 + this.drive * 2.4)) * this.trim;
    return filtered * (1 - this.drive) + shaped * this.drive;
  }

  /** Level trim under the filter. At full brake this loses a tenth, not a half. */
  gain() {
    return 1 - this.smoothed * (1 - BRAKE_RESIDUAL_GAIN);
  }
}
