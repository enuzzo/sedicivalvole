// Synthesizer voice translated from textStep.
//
// Upstream project: illobo/textStep — https://github.com/illobo/textStep
// Author:           Lobo (illobo)
// Upstream commit:  cb107d198b730db60cff4a87c7fd5b8d1fae3fb2
// Upstream file:    src/audio/synth_voice.rs
// Public license:   GNU GPL version 2.0
// Reuse basis:      Lobo's direct, unrestricted authorization, accepted by the
//                   project maintainer. See docs/LICENSING.md.
//
// Ported: poly_blep, Oscillator (square, saw with supersaw spread, sine fold,
// noise), AdsrEnvelope, the Cytomic SVF pair behind Filter24dB, and the
// two-oscillator-plus-sub SynthVoice with its amplitude, second and filter
// envelopes, glide, and key follow.
//
// Modifications for sedicivalvole:
//   - translated from Rust to JavaScript classes;
//   - f32 arithmetic becomes doubles, so output is not bit-identical to the
//     upstream build while the synthesis structure is unchanged;
//   - oscillator sync is dropped; the Jungle score does not use it;
//   - `fast_semitone_ratio` and `fast_cent_ratio` lookup tables become direct
//     exponentials, which cost nothing at these voice counts and remove the
//     table's quantisation;
//   - a voice exposes `isIdle()` so the score can reuse a lane's voice without
//     allocating.

import { Noise, OnePoleLowPass, TAU } from "./primitives.js";

export const WAVEFORM = Object.freeze({
  square: 0, saw: 1, sine: 2, noise: 3,
});

/** Anti-aliasing correction applied near a waveform discontinuity. */
export function polyBlep(t, dt) {
  if (t < dt) {
    const x = t / dt;
    return 2 * x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + 2 * x + 1;
  }
  return 0;
}

export class Oscillator {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.phase = 0;
    this.phase2 = 0;
    this.phase3 = 0.33;
    this.phase4 = 0.67;
    this.noiseLowPass = new OnePoleLowPass();
  }

  tick(frequencyHz, waveform, param, noise) {
    const increment = frequencyHz / this.sampleRate;

    if (waveform === WAVEFORM.square) {
      const pulseWidth = 0.05 + param * 0.9;
      let out = this.phase < pulseWidth ? 1 : -1;
      out += polyBlep(this.phase, increment);
      let t = this.phase - pulseWidth;
      if (t < 0) t += 1;
      out -= polyBlep(t, increment);
      this.phase += increment;
      if (this.phase >= 1) this.phase -= 1;
      return out;
    }

    if (waveform === WAVEFORM.saw) {
      let saw1 = 2 * this.phase - 1;
      saw1 -= polyBlep(this.phase, increment);
      this.phase += increment;
      if (this.phase >= 1) this.phase -= 1;
      if (param < 0.001) return saw1;

      // Supersaw: three extra detuned saws, up to roughly 50 cents of spread.
      const spread = param * 0.04;

      const increment2 = (frequencyHz * (1 + spread)) / this.sampleRate;
      let saw2 = 2 * this.phase2 - 1;
      saw2 -= polyBlep(this.phase2, increment2);
      this.phase2 += increment2;
      if (this.phase2 >= 1) this.phase2 -= 1;

      const increment3 = (frequencyHz * (1 - spread * 0.7)) / this.sampleRate;
      let saw3 = 2 * this.phase3 - 1;
      saw3 -= polyBlep(this.phase3, increment3);
      this.phase3 += increment3;
      if (this.phase3 >= 1) this.phase3 -= 1;

      const increment4 = (frequencyHz * (1 + spread * 0.5)) / this.sampleRate;
      let saw4 = 2 * this.phase4 - 1;
      saw4 -= polyBlep(this.phase4, increment4);
      this.phase4 += increment4;
      if (this.phase4 >= 1) this.phase4 -= 1;

      return (saw1 + saw2 + saw3 + saw4) * 0.25;
    }

    if (waveform === WAVEFORM.sine) {
      const fold = 1 + param * 4;
      const out = Math.sin(this.phase * TAU * fold);
      this.phase += increment;
      if (this.phase >= 1) this.phase -= 1;
      return out;
    }

    // Noise: param sets the low-pass cutoff between 200 Hz and 20 kHz.
    this.noiseLowPass.setFrequency(200 * 100 ** param, this.sampleRate);
    const raw = noise.next();
    this.phase += increment;
    if (this.phase >= 1) this.phase -= 1;
    return this.noiseLowPass.tick(raw);
  }
}

const ADSR_IDLE = 0;
const ADSR_ATTACK = 1;
const ADSR_DECAY = 2;
const ADSR_SUSTAIN = 3;
const ADSR_RELEASE = 4;

export class AdsrEnvelope {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.state = ADSR_IDLE;
    this.level = 0;
    this.attack = 0.01;
    this.decay = 0.1;
    this.sustain = 0.5;
    this.releaseTime = 0.1;
  }

  /** Normalised 0..1 parameters, mapped exponentially for the time stages. */
  setParams(attack, decay, sustain, release) {
    this.attack = 0.001 * 2000 ** attack;
    this.decay = 0.01 * 500 ** decay;
    this.sustain = sustain;
    this.releaseTime = 0.01 * 500 ** release;
  }

  trigger() {
    this.state = ADSR_ATTACK;
  }

  release() {
    if (this.state !== ADSR_IDLE) this.state = ADSR_RELEASE;
  }

  isIdle() {
    return this.state === ADSR_IDLE;
  }

  tick() {
    switch (this.state) {
      case ADSR_ATTACK: {
        this.level += 1 / Math.max(1, this.attack * this.sampleRate);
        if (this.level >= 1) {
          this.level = 1;
          this.state = ADSR_DECAY;
        }
        break;
      }
      case ADSR_DECAY: {
        const rate = 1 / Math.max(1, this.decay * this.sampleRate);
        this.level += (this.sustain - this.level) * rate * 6;
        if (Math.abs(this.level - this.sustain) < 0.001) {
          this.level = this.sustain;
          this.state = ADSR_SUSTAIN;
        }
        break;
      }
      case ADSR_SUSTAIN:
        this.level = this.sustain;
        break;
      case ADSR_RELEASE: {
        const rate = 1 / Math.max(1, this.releaseTime * this.sampleRate);
        this.level -= this.level * rate * 6;
        if (this.level < 0.0001) {
          this.level = 0;
          this.state = ADSR_IDLE;
        }
        break;
      }
      default:
        this.level = 0;
    }
    return this.level;
  }
}

/** One Cytomic state-variable filter stage. */
class Svf {
  constructor() {
    this.ic1 = 0;
    this.ic2 = 0;
  }

  tick(input, g, k) {
    const v3 = input - this.ic2;
    const denominator = 1 / (1 + g * (g + k));
    const v1 = this.ic1 * denominator + v3 * (g * denominator);
    const v2 = this.ic2 + g * v1;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    return [v2, input - k * v1 - v2, v1];
  }
}

/** Four-pole filter built from a cascaded Cytomic SVF pair. */
export class Filter24dB {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.first = new Svf();
    this.second = new Svf();
    this.cachedCutoff = 1000;
    this.cachedResonance = 0;
    this.cachedG = Math.tan((Math.PI * 1000) / sampleRate);
    this.cachedK = 2;
  }

  /** filterType: 0 low pass, 1 high pass, 2 band pass. */
  tick(input, cutoffHz, resonance, filterType) {
    const cutoff = Math.min(20000, Math.max(5, cutoffHz));
    const reso = Math.min(0.99, Math.max(0, resonance));

    if (Math.abs(cutoff - this.cachedCutoff) > 0.01
      || Math.abs(reso - this.cachedResonance) > 0.0001) {
      this.cachedG = Math.tan((Math.PI * cutoff) / this.sampleRate);
      this.cachedK = 2 - 2 * reso;
      this.cachedCutoff = cutoff;
      this.cachedResonance = reso;
    }

    const stageOne = this.first.tick(input, this.cachedG, this.cachedK)[filterType] ?? 0;
    return this.second.tick(stageOne, this.cachedG, this.cachedK)[filterType] ?? 0;
  }
}

/** Default synth parameters, using upstream's field names. */
export function synthParams(overrides = {}) {
  return {
    osc1Waveform: WAVEFORM.saw, osc1Level: 0.7, osc1Tune: 0.5, osc1Pwm: 0,
    osc2Waveform: WAVEFORM.saw, osc2Level: 0.0, osc2Tune: 0.5, osc2Detune: 0.5, osc2Pwm: 0,
    subWaveform: 0, subLevel: 0,
    ampAttack: 0.0, ampDecay: 0.35, ampSustain: 0.6, ampRelease: 0.25,
    filterEnvAttack: 0.0, filterEnvDecay: 0.3, filterEnvSustain: 0.2, filterEnvRelease: 0.2,
    filterCutoff: 0.55, filterResonance: 0.15, filterType: 0,
    filterEnvAmount: 0.15, filterKeyFollow: 0,
    glide: 0, volume: 0.8,
    ...overrides,
  };
}

export const midiToHz = (midi) => 440 * 2 ** ((midi - 69) / 12);

export class SynthVoice {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.osc1 = new Oscillator(sampleRate);
    this.osc2 = new Oscillator(sampleRate);
    this.subOsc = new Oscillator(sampleRate);
    this.noise1 = new Noise(2001);
    this.noise2 = new Noise(2002);
    this.noiseSub = new Noise(2003);
    this.ampEnvelope = new AdsrEnvelope(sampleRate);
    this.filterEnvelope = new AdsrEnvelope(sampleRate);
    this.filter = new Filter24dB(sampleRate);
    this.noteFrequency = 220;
    this.currentFrequency = 220;
    this.glideCoefficient = 0;
  }

  trigger(params, midiNote) {
    this.noteFrequency = midiToHz(midiNote);
    if (params.glide < 0.001) this.currentFrequency = this.noteFrequency;
    this.glideCoefficient = params.glide < 0.001
      ? 0
      : Math.exp(-1 / Math.max(1, params.glide * 0.5 * this.sampleRate));

    this.ampEnvelope.setParams(
      params.ampAttack, params.ampDecay, params.ampSustain, params.ampRelease,
    );
    this.filterEnvelope.setParams(
      params.filterEnvAttack, params.filterEnvDecay,
      params.filterEnvSustain, params.filterEnvRelease,
    );
    this.ampEnvelope.trigger();
    this.filterEnvelope.trigger();
  }

  release() {
    this.ampEnvelope.release();
    this.filterEnvelope.release();
  }

  isIdle() {
    return this.ampEnvelope.isIdle();
  }

  tick(params) {
    this.currentFrequency = this.glideCoefficient > 0.0001
      ? this.noteFrequency + (this.currentFrequency - this.noteFrequency) * this.glideCoefficient
      : this.noteFrequency;
    const base = this.currentFrequency;

    const amp = this.ampEnvelope.tick();
    const filterEnv = this.filterEnvelope.tick();
    if (amp <= 0 && this.ampEnvelope.isIdle()) return 0;

    let mix = 0;
    if (params.osc1Level > 0.001) {
      const semitones = params.osc1Tune * 48 - 24;
      mix += this.osc1.tick(
        base * 2 ** (semitones / 12), params.osc1Waveform, params.osc1Pwm, this.noise1,
      ) * params.osc1Level;
    }

    if (params.osc2Level > 0.001) {
      const semitones = params.osc2Tune * 48 - 24;
      const cents = params.osc2Detune * 100 - 50;
      const frequency = base * 2 ** (semitones / 12) * 2 ** (cents / 1200);
      mix += this.osc2.tick(
        frequency, params.osc2Waveform, params.osc2Pwm, this.noise2,
      ) * params.osc2Level;

      if (params.subLevel > 0.001) {
        const subWaveform = params.subWaveform === 1
          ? WAVEFORM.sine
          : params.subWaveform === 2 ? WAVEFORM.saw : WAVEFORM.square;
        mix += this.subOsc.tick(frequency * 0.5, subWaveform, 0.5, this.noiseSub)
          * params.osc2Level * params.subLevel;
      }
    }

    const baseCutoff = 5 * 4000 ** params.filterCutoff;
    const keyFollow = params.filterKeyFollow > 0.001
      ? (base - 261.6) * params.filterKeyFollow * 2
      : 0;
    const cutoff = Math.min(20000, Math.max(
      5, baseCutoff + filterEnv * params.filterEnvAmount * 10000 + keyFollow,
    ));

    return this.filter.tick(mix, cutoff, params.filterResonance, params.filterType)
      * amp * params.volume;
  }
}
