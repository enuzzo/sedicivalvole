// DSP primitives translated from textStep.
//
// Upstream project: illobo/textStep — https://github.com/illobo/textStep
// Author:           Lobo (illobo)
// Upstream commit:  cb107d198b730db60cff4a87c7fd5b8d1fae3fb2
// Upstream file:    src/audio/drum_voice.rs
// Public license:   GNU GPL version 2.0
// Reuse basis:      Lobo's direct, unrestricted authorization to reuse this
//                   repository's content, accepted by the project maintainer.
//                   See docs/LICENSING.md and docs/REFERENCE-STUDY-TEXTSTEP.md.
//
// Modifications for sedicivalvole:
//   - translated from Rust to JavaScript classes;
//   - f32 arithmetic becomes JavaScript doubles, so results are not bit-identical
//     to the upstream build; the filter and envelope structures are unchanged;
//   - the xorshift32 generator uses Math.imul and >>> 0 to keep 32-bit semantics;
//   - Rust's `f32::MAX` normalisation becomes 0xffffffff;
//   - no `Send`/ownership plumbing, no terminal UI, no cpal platform code.
//
// This module contains no audio-graph or AudioContext dependency so it runs
// unchanged inside an AudioWorklet and inside Node for offline rendering.

const TAU = Math.PI * 2;

/**
 * Soft waveshaping driven by the drive parameter. Asymmetric: the positive side
 * clips harder than the negative, producing even harmonics.
 */
export function applyDrive(x, drive) {
  if (drive < 0.001) return x;
  const gain = 1 + drive * 8;
  const s = x * gain;
  const norm = Math.tanh(gain);
  return s >= 0 ? Math.tanh(s) / norm : (Math.tanh(s * 0.8) * 1.25) / norm;
}

/** xorshift32 noise, one instance per voice that needs it. */
export class Noise {
  constructor(seed) {
    this.state = (seed >>> 0) || 1;
  }

  /** Returns a sample in -1..1. */
  next() {
    let x = this.state;
    x ^= (x << 13) >>> 0;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= (x << 5) >>> 0;
    x >>>= 0;
    this.state = x;
    return (x / 4294967295) * 2 - 1;
  }
}

export class OnePoleHighPass {
  constructor() {
    this.previousInput = 0;
    this.previousOutput = 0;
    this.coefficient = 0.5;
  }

  setFrequency(frequencyHz, sampleRate) {
    const rc = 1 / (TAU * frequencyHz);
    const dt = 1 / sampleRate;
    this.coefficient = rc / (rc + dt);
  }

  reset() {
    this.previousInput = 0;
    this.previousOutput = 0;
  }

  tick(x) {
    const y = this.coefficient * (this.previousOutput + x - this.previousInput);
    this.previousInput = x;
    this.previousOutput = y;
    return y;
  }
}

export class OnePoleLowPass {
  constructor() {
    this.previousOutput = 0;
    this.coefficient = 0.5;
  }

  setFrequency(frequencyHz, sampleRate) {
    const rc = 1 / (TAU * frequencyHz);
    const dt = 1 / sampleRate;
    this.coefficient = dt / (rc + dt);
  }

  reset() {
    this.previousOutput = 0;
  }

  tick(x) {
    this.previousOutput += this.coefficient * (x - this.previousOutput);
    return this.previousOutput;
  }
}

/**
 * State-variable filter with low-pass, high-pass and band-pass outputs.
 * Upstream notes this was itself ported from zicbox EffectFilterData.
 */
export class StateVariableFilter {
  constructor() {
    this.cutoff = 0.5;
    this.feedback = 0;
    this.buffer = 0;
    this.lowPass = 0;
    this.highPass = 0;
    this.bandPass = 0;
  }

  setFrequency(frequencyHz, resonance, sampleRate) {
    const normalised = Math.min(frequencyHz / sampleRate, 0.45);
    this.cutoff = Math.min(0.9, Math.max(0, 2 * normalised));
    if (resonance <= 0 || this.cutoff >= 1) {
      this.feedback = 0;
      return;
    }
    const ratio = 1 - this.cutoff;
    const reso = resonance * 0.99;
    this.feedback = reso + reso / ratio;
  }

  tick(input) {
    this.highPass = input - this.buffer;
    this.bandPass = this.buffer - this.lowPass;
    this.buffer += this.cutoff * (this.highPass + this.feedback * this.bandPass);
    this.lowPass += this.cutoff * (this.buffer - this.lowPass);
  }

  reset() {
    this.buffer = 0;
    this.lowPass = 0;
    this.highPass = 0;
    this.bandPass = 0;
  }
}

/** Feedback comb filter modelling snare shell resonance. */
export class CombFilter {
  constructor() {
    this.buffer = new Float32Array(512);
    this.position = 0;
    this.delay = 100;
    this.feedback = 0;
  }

  set(frequencyHz, sampleRate, feedback) {
    this.delay = Math.min(511, Math.max(1, Math.trunc(sampleRate / frequencyHz)));
    this.feedback = Math.min(0.8, Math.max(0, feedback));
  }

  tick(input) {
    const readPosition = this.position >= this.delay
      ? this.position - this.delay
      : 512 - (this.delay - this.position);
    const delayed = this.buffer[readPosition];
    this.buffer[this.position] = input + delayed * this.feedback;
    this.position = (this.position + 1) % 512;
    return input + delayed * this.feedback;
  }
}

/** Inharmonic ratios giving the metallic cymbal spectrum. */
export const CYMBAL_RATIOS = Object.freeze([1.0, 1.304, 1.466, 1.787, 1.932, 2.536]);

/** Exponential decay coefficient reaching about -5 nepers over `seconds`. */
export function decayCoefficient(seconds, sampleRate) {
  return Math.exp(-5 / (Math.max(1e-6, seconds) * sampleRate));
}

export { TAU };
