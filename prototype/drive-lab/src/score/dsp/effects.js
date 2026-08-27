// Bus effects translated from textStep.
//
// Upstream project: illobo/textStep — https://github.com/illobo/textStep
// Author:           Lobo (illobo)
// Upstream commit:  cb107d198b730db60cff4a87c7fd5b8d1fae3fb2
// Upstream file:    src/audio/effects.rs
// Public license:   GNU GPL version 2.0
// Reuse basis:      Lobo's direct, unrestricted authorization, accepted by the
//                   project maintainer. See docs/LICENSING.md.
//
// Ported: RampedParam, TubeSaturator (with its 2x oversampler), SidechainEnvelope,
// LookaheadLimiter, and the musical delay subdivisions. Upstream's FDN reverb
// and glue compressor are not ported; StereoReverb, StereoChorus, StereoWidth
// and TempoDelay at the end of this file are original sedicivalvole code.
//
// Modifications for sedicivalvole:
//   - translated from Rust to JavaScript classes;
//   - the limiter's default threshold is lowered from 0.95 to 0.72, because the
//     score has to stay conservatively below the vehicle's alert level rather
//     than reach for loudness;
//   - the delay is an original sedicivalvole line rather than a port of
//     upstream's DelayEffect, but it uses upstream's `DelaySub::seconds` musical
//     subdivisions so echo timing stays tied to the transport.

const TAU = Math.PI * 2;

/** Click-free parameter ramp. Every continuous control is written through one. */
export class RampedParam {
  constructor(initial) {
    this.current = initial;
    this.target = initial;
    this.step = 0;
    this.remaining = 0;
  }

  set(target, rampSamples) {
    if (rampSamples <= 0) {
      this.current = target;
      this.target = target;
      this.remaining = 0;
      return;
    }
    this.target = target;
    this.step = (target - this.current) / rampSamples;
    this.remaining = rampSamples;
  }

  next() {
    if (this.remaining > 0) {
      this.current += this.step;
      this.remaining -= 1;
      if (this.remaining === 0) this.current = this.target;
    }
    return this.current;
  }

  value() {
    return this.current;
  }
}

/** Upstream's musical delay subdivisions, in seconds for a given tempo. */
export const DELAY_SUBDIVISIONS = Object.freeze({
  sixteenth: 0.25,
  sixteenthDotted: 0.375,
  eighthTriplet: 1 / 3,
  eighth: 0.5,
  eighthDotted: 0.75,
  quarterTriplet: 2 / 3,
  quarter: 1,
  quarterDotted: 1.5,
  half: 2,
});

export function subdivisionSeconds(subdivision, bpm) {
  const beat = 60 / bpm;
  return beat * (DELAY_SUBDIVISIONS[subdivision] ?? DELAY_SUBDIVISIONS.eighth);
}

/** 2x oversampler used by the saturator so the shaper's harmonics stay clean. */
class Oversampler2x {
  constructor() {
    this.previous = 0;
    this.filterState = 0;
  }

  tick(input, shape) {
    const midpoint = (this.previous + input) * 0.5;
    const first = shape(midpoint);
    const second = shape(input);
    this.previous = input;
    // Simple averaging decimator.
    this.filterState = (first + second) * 0.5;
    return this.filterState;
  }
}

/** Asymmetric tube-style saturation with an output transformer roll-off. */
export class TubeSaturator {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.drive = 0;
    this.bias = 0;
    this.biasSmooth = 0;
    this.lowPassState = 0;
    this.lowPassCoefficient = 0.3;
    this.dcBlock = 0;
    this.oversampler = new Oversampler2x();
  }

  setDrive(drive) {
    this.drive = Math.min(1, Math.max(0, drive));
    this.bias = this.drive * 0.15;
    const cutoff = 12000 - this.drive * 6000;
    const rc = 1 / (TAU * cutoff);
    const dt = 1 / this.sampleRate;
    this.lowPassCoefficient = dt / (rc + dt);
  }

  tick(input) {
    if (this.drive < 0.001) return input;

    this.biasSmooth += 0.0005 * (this.bias - this.biasSmooth);
    const gain = 1 + this.drive * 1.5;
    const x = (input + this.biasSmooth) * gain;
    const referenceLevel = gain > 1 ? gain / (1 + gain) : 1;

    const compensated = this.oversampler.tick(x, (s) => {
      const shaped = s >= 0
        ? s / (1 + Math.abs(s))
        : Math.tanh(s * 0.8) / Math.tanh(0.8);
      return shaped / referenceLevel;
    });

    this.lowPassState += this.lowPassCoefficient * (compensated - this.lowPassState);
    const output = this.lowPassState - this.dcBlock;
    this.dcBlock += ((5 * TAU) / this.sampleRate) * output;

    const wet = this.drive * 0.7;
    return input * (1 - wet) + output * wet;
  }
}

/** Envelope follower driving the kick-to-bass duck. */
export class SidechainEnvelope {
  constructor(sampleRate) {
    this.level = 0;
    this.attackCoefficient = Math.exp(-1 / (0.001 * sampleRate));
    this.releaseCoefficient = Math.exp(-1 / (0.08 * sampleRate));
  }

  tick(input) {
    const magnitude = Math.abs(input);
    const coefficient = magnitude > this.level
      ? this.attackCoefficient
      : this.releaseCoefficient;
    this.level = coefficient * this.level + (1 - coefficient) * magnitude;
    return this.level;
  }

  duckGain(depth) {
    return Math.max(0, 1 - this.level * depth);
  }
}

/**
 * Lookahead limiter. The threshold is deliberately conservative: the score must
 * stay clearly below the vehicle's own alert sounds.
 */
export class LookaheadLimiter {
  constructor(sampleRate, threshold = 0.72) {
    this.length = Math.max(1, Math.trunc(sampleRate * 0.001));
    this.bufferLeft = new Float32Array(this.length);
    this.bufferRight = new Float32Array(this.length);
    this.magnitudes = new Float32Array(this.length);
    this.position = 0;
    this.threshold = threshold;
    this.gain = 1;
    this.attackCoefficient = Math.exp(-1 / (0.0001 * sampleRate));
    this.releaseCoefficient = Math.exp(-1 / (0.05 * sampleRate));
    this.runningPeak = 0;
  }

  tickStereo(inputLeft, inputRight) {
    const magnitude = Math.max(Math.abs(inputLeft), Math.abs(inputRight));
    const outgoing = this.magnitudes[this.position];

    if (magnitude >= this.runningPeak) {
      this.runningPeak = magnitude;
    } else if (outgoing >= this.runningPeak - 1e-10) {
      // The departing sample was the peak, so the window has to be rescanned.
      let peak = magnitude;
      for (let index = 0; index < this.length; index += 1) {
        if (index !== this.position && this.magnitudes[index] > peak) {
          peak = this.magnitudes[index];
        }
      }
      this.runningPeak = peak;
    }

    const targetGain = this.runningPeak > this.threshold
      ? this.threshold / this.runningPeak
      : 1;
    const coefficient = targetGain < this.gain
      ? this.attackCoefficient
      : this.releaseCoefficient;
    this.gain = coefficient * this.gain + (1 - coefficient) * targetGain;

    const outLeft = this.bufferLeft[this.position] * this.gain;
    const outRight = this.bufferRight[this.position] * this.gain;

    this.bufferLeft[this.position] = inputLeft;
    this.bufferRight[this.position] = inputRight;
    this.magnitudes[this.position] = magnitude;
    this.position = (this.position + 1) % this.length;

    return [outLeft, outRight];
  }
}

/**
 * Tempo-synchronised stereo delay.
 *
 * Original sedicivalvole code; only the musical subdivision table comes from
 * upstream. Delay time is written through a ramp so a tempo move glides rather
 * than clicking, which matters because the score's tempo is always moving.
 */
export class TempoDelay {
  constructor(sampleRate, maximumSeconds = 2) {
    this.sampleRate = sampleRate;
    this.size = Math.max(2, Math.trunc(sampleRate * maximumSeconds));
    this.bufferLeft = new Float32Array(this.size);
    this.bufferRight = new Float32Array(this.size);
    this.writePosition = 0;
    this.delaySamples = new RampedParam(sampleRate * 0.25);
    this.feedback = 0.34;
    this.toneState = 0;
    this.toneCoefficient = 0.32;
  }

  setTime(subdivision, bpm, rampSamples = 4096) {
    const seconds = Math.min(subdivisionSeconds(subdivision, bpm), this.size / this.sampleRate - 0.01);
    this.delaySamples.set(seconds * this.sampleRate, rampSamples);
  }

  setFeedback(feedback) {
    this.feedback = Math.min(0.85, Math.max(0, feedback));
  }

  tickStereo(inputLeft, inputRight) {
    const delay = this.delaySamples.next();
    const readPosition = this.writePosition - delay;
    const wrapped = readPosition < 0 ? readPosition + this.size : readPosition;
    const lower = Math.floor(wrapped) % this.size;
    const upper = (lower + 1) % this.size;
    const blend = wrapped - Math.floor(wrapped);

    const delayedLeft = this.bufferLeft[lower] * (1 - blend) + this.bufferLeft[upper] * blend;
    const delayedRight = this.bufferRight[lower] * (1 - blend) + this.bufferRight[upper] * blend;

    // A gentle low pass in the feedback path keeps repeats from building fizz.
    this.toneState += this.toneCoefficient * (delayedLeft + delayedRight - 2 * this.toneState) * 0.5;

    this.bufferLeft[this.writePosition] = inputLeft + delayedRight * this.feedback;
    this.bufferRight[this.writePosition] = inputRight + delayedLeft * this.feedback;
    this.writePosition = (this.writePosition + 1) % this.size;

    return [delayedLeft, delayedRight];
  }
}

/**
 * Stereo plate reverb.
 *
 * Original sedicivalvole code, in the Schroeder/Freeverb arrangement: four
 * damped comb filters in parallel into two allpass diffusers per channel, with
 * the right channel's delays offset so the two sides decorrelate. Upstream's
 * FDN reverb was never ported; this is the space the score needs and nothing
 * more, because it has to run inside a render quantum on vehicle hardware.
 *
 * Delay lengths are the classic Freeverb primes, scaled from their 44.1 kHz
 * origin to the running sample rate so the character survives at 48 kHz.
 */
const REVERB_COMBS = [1116, 1188, 1277, 1356];
const REVERB_ALLPASSES = [556, 441];
const REVERB_STEREO_SPREAD = 23;

class DampedComb {
  constructor(length) {
    this.buffer = new Float32Array(Math.max(1, length));
    this.position = 0;
    this.store = 0;
  }

  tick(input, feedback, damping) {
    const output = this.buffer[this.position];
    this.store = output * (1 - damping) + this.store * damping;
    this.buffer[this.position] = input + this.store * feedback;
    this.position = (this.position + 1) % this.buffer.length;
    return output;
  }
}

class Allpass {
  constructor(length) {
    this.buffer = new Float32Array(Math.max(1, length));
    this.position = 0;
  }

  tick(input) {
    const buffered = this.buffer[this.position];
    this.buffer[this.position] = input + buffered * 0.5;
    this.position = (this.position + 1) % this.buffer.length;
    return buffered - input;
  }
}

export class StereoReverb {
  constructor(sampleRate) {
    const scale = sampleRate / 44100;
    const at = (length, offset) => Math.max(1, Math.round((length + offset) * scale));
    this.combsLeft = REVERB_COMBS.map((length) => new DampedComb(at(length, 0)));
    this.combsRight = REVERB_COMBS.map(
      (length) => new DampedComb(at(length, REVERB_STEREO_SPREAD)),
    );
    this.allpassesLeft = REVERB_ALLPASSES.map((length) => new Allpass(at(length, 0)));
    this.allpassesRight = REVERB_ALLPASSES.map(
      (length) => new Allpass(at(length, REVERB_STEREO_SPREAD)),
    );
    // A high pass on the input keeps the low end out of the tail, which is the
    // difference between a space and a wash.
    this.inputHighPassLeft = 0;
    this.inputHighPassRight = 0;
    this.highPassCoefficient = Math.exp(-TAU * 220 / sampleRate);
    this.feedback = 0.84;
    this.damping = 0.32;
  }

  /** `size` 0..1 sets the tail length, `damping` 0..1 how dark it is. */
  set(size, damping) {
    this.feedback = 0.7 + Math.min(1, Math.max(0, size)) * 0.22;
    this.damping = 0.16 + Math.min(1, Math.max(0, damping)) * 0.5;
  }

  tickStereo(inputLeft, inputRight) {
    this.inputHighPassLeft = this.highPassCoefficient * this.inputHighPassLeft
      + (1 - this.highPassCoefficient) * inputLeft;
    this.inputHighPassRight = this.highPassCoefficient * this.inputHighPassRight
      + (1 - this.highPassCoefficient) * inputRight;
    const driveLeft = (inputLeft - this.inputHighPassLeft) * 0.24;
    const driveRight = (inputRight - this.inputHighPassRight) * 0.24;

    let left = 0;
    let right = 0;
    for (let index = 0; index < this.combsLeft.length; index += 1) {
      left += this.combsLeft[index].tick(driveLeft, this.feedback, this.damping);
      right += this.combsRight[index].tick(driveRight, this.feedback, this.damping);
    }
    for (let index = 0; index < this.allpassesLeft.length; index += 1) {
      left = this.allpassesLeft[index].tick(left);
      right = this.allpassesRight[index].tick(right);
    }
    return [left, right];
  }
}

/**
 * Stereo chorus for the sustained lanes.
 *
 * Original sedicivalvole code. Two modulated delay taps read the same mono
 * source at different rates and land on opposite sides, so a pad occupies real
 * width instead of a phase trick that collapses on a mono speaker.
 */
export class StereoChorus {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.size = Math.max(4, Math.trunc(sampleRate * 0.05));
    this.buffer = new Float32Array(this.size);
    this.writePosition = 0;
    this.phaseLeft = 0;
    this.phaseRight = 0.37;
    this.rateLeft = 0.21 / sampleRate;
    this.rateRight = 0.29 / sampleRate;
    this.baseSamples = sampleRate * 0.014;
    this.depthSamples = sampleRate * 0.0042;
  }

  read(offset) {
    const readPosition = this.writePosition - offset;
    const wrapped = readPosition < 0 ? readPosition + this.size : readPosition;
    const lower = Math.floor(wrapped) % this.size;
    const upper = (lower + 1) % this.size;
    const blend = wrapped - Math.floor(wrapped);
    return this.buffer[lower] * (1 - blend) + this.buffer[upper] * blend;
  }

  tickStereo(input) {
    this.phaseLeft += this.rateLeft;
    if (this.phaseLeft >= 1) this.phaseLeft -= 1;
    this.phaseRight += this.rateRight;
    if (this.phaseRight >= 1) this.phaseRight -= 1;

    const left = this.read(this.baseSamples + Math.sin(this.phaseLeft * TAU) * this.depthSamples);
    const right = this.read(
      this.baseSamples * 1.31 + Math.sin(this.phaseRight * TAU) * this.depthSamples,
    );

    this.buffer[this.writePosition] = input;
    this.writePosition = (this.writePosition + 1) % this.size;
    return [left, right];
  }
}

/**
 * Mid/side width trim with a mono-below crossover.
 *
 * Width is only ever applied above the crossover: the low end stays summed, so
 * the car's two speakers reinforce the sub instead of cancelling it.
 */
export class StereoWidth {
  constructor(sampleRate, monoBelowHz = 140) {
    this.coefficient = Math.exp(-TAU * monoBelowHz / sampleRate);
    this.sideLowState = 0;
  }

  tickStereo(inputLeft, inputRight, width) {
    const mid = (inputLeft + inputRight) * 0.5;
    const side = (inputLeft - inputRight) * 0.5;
    this.sideLowState = this.coefficient * this.sideLowState + (1 - this.coefficient) * side;
    const sideHigh = side - this.sideLowState;
    const widened = sideHigh * width;
    return [mid + widened, mid - widened];
  }
}
