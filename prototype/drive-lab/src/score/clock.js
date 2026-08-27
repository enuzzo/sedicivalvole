// Sample-accurate sequencer clock translated from textStep.
//
// Upstream project: illobo/textStep — https://github.com/illobo/textStep
// Author:           Lobo (illobo)
// Upstream commit:  cb107d198b730db60cff4a87c7fd5b8d1fae3fb2
// Upstream file:    src/audio/clock.rs
// Public license:   GNU GPL version 2.0
// Reuse basis:      Lobo's direct, unrestricted authorization, accepted by the
//                   project maintainer. See docs/LICENSING.md.
//
// Modifications for sedicivalvole:
//   - translated from Rust to a JavaScript class;
//   - the Ableton Link re-stamping hooks are omitted; the vehicle is the only
//     tempo source here;
//   - `advance` additionally reports the position inside a 32-step pattern and
//     inside a four-bar phrase, because the arrangement quantises entries and
//     exits to bar and phrase boundaries;
//   - upstream's bar flag counts 16 steps; the same 16-step bar is kept so a
//     32-step pattern spans two bars, matching the upstream pattern length.
//
// The clock is a pure BPM-to-step-pulse converter and knows nothing about
// patterns or arrangement, so it stays trivially testable.

export const STEPS_PER_BAR = 16;
export const STEPS_PER_PATTERN = 32;
export const BARS_PER_PHRASE = 4;
export const STEPS_PER_PHRASE = STEPS_PER_BAR * BARS_PER_PHRASE;

export class SequencerClock {
  constructor() {
    this.samplesSinceLastStep = 0;
    this.currentStep = 0;
    this.firstStepPending = true;
  }

  /** Back to step zero. The next `advance` re-emits step 0. */
  reset() {
    this.samplesSinceLastStep = 0;
    this.currentStep = 0;
    this.firstStepPending = true;
  }

  /**
   * Call once per audio sample. Returns a step event when the sequencer moves
   * to a new step, otherwise null.
   *
   * `swing` runs 0.50 (straight) to 0.75 (heavy shuffle): even steps lengthen
   * and odd steps shorten proportionally.
   */
  advance(bpm, sampleRate, swing) {
    if (this.firstStepPending) {
      this.firstStepPending = false;
      this.samplesSinceLastStep = 0;
      return this.makeEvent();
    }

    const baseSamplesPerStep = (sampleRate * 60) / bpm / 4;
    const samplesPerStep = this.currentStep % 2 === 0
      ? baseSamplesPerStep * swing * 2
      : baseSamplesPerStep * (1 - swing) * 2;

    this.samplesSinceLastStep += 1;
    if (this.samplesSinceLastStep < samplesPerStep) return null;

    this.samplesSinceLastStep -= samplesPerStep;
    this.currentStep += 1;
    return this.makeEvent();
  }

  makeEvent() {
    const step = this.currentStep;
    return {
      globalStep: step,
      beat: Math.floor(step / 4) % 4,
      isBarStart: step % STEPS_PER_BAR === 0,
      isPhraseStart: step % STEPS_PER_PHRASE === 0,
      patternStep: step % STEPS_PER_PATTERN,
      barInPhrase: Math.floor(step / STEPS_PER_BAR) % BARS_PER_PHRASE,
    };
  }
}
