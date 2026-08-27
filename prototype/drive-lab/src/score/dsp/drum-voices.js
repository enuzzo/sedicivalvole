// Drum voices translated from textStep.
//
// Upstream project: illobo/textStep — https://github.com/illobo/textStep
// Author:           Lobo (illobo)
// Upstream commit:  cb107d198b730db60cff4a87c7fd5b8d1fae3fb2
// Upstream file:    src/audio/drum_voice.rs
// Public license:   GNU GPL version 2.0
// Reuse basis:      Lobo's direct, unrestricted authorization, accepted by the
//                   project maintainer. See docs/LICENSING.md.
//
// Ported voices: KickVoice, SnareVoice, ClosedHiHatVoice, OpenHiHatVoice,
// ClapVoice. RideVoice, CowbellVoice and TomVoice are not ported yet; the
// Jungle score does not use them.
//
// Modifications for sedicivalvole:
//   - Rust structs and the DrumVoiceDsp trait become JavaScript classes with the
//     same trigger/choke/tick surface;
//   - f32 arithmetic becomes doubles, so output is not bit-identical to the
//     upstream build while the synthesis structure is unchanged;
//   - parameter records are plain objects using the upstream field names
//     (tune, sweep, color, snap, shape, attack, filter, drive, decay, volume);
//   - no allocation happens after construction, so a voice is safe to run inside
//     an AudioWorklet render quantum.

import {
  applyDrive,
  CombFilter,
  CYMBAL_RATIOS,
  decayCoefficient,
  Noise,
  OnePoleHighPass,
  OnePoleLowPass,
  StateVariableFilter,
  TAU,
} from "./primitives.js";

/** Upstream per-voice parameter record, with upstream defaults. */
export function drumParams(overrides = {}) {
  return {
    tune: 0.3, sweep: 0.5, color: 0.3, snap: 0.5, shape: 0.5, attack: 0,
    filter: 0.5, drive: 0.1, decay: 0.4, volume: 0.8,
    ...overrides,
  };
}

/** TR-909 inspired kick: sine body, click impulse, and a subharmonic. */
export class KickVoice {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.noise = new Noise(42);
    this.bodyFilter = new StateVariableFilter();
    this.clickFilter = new StateVariableFilter();
    this.active = false;
    this.phase = 0;
    this.subPhase = 0;
    this.clickPulsePhase = 0;
  }

  trigger(p) {
    this.phase = 0;
    this.clickPulsePhase = 0;

    this.baseFrequency = 20 + p.tune * 100;
    this.startFrequency = this.baseFrequency + p.sweep * 500;

    // Dual-stage pitch envelope: an always-fast transient stage, then a
    // colour-controlled stage while the body tone forms.
    this.pitchEnvelope = 1;
    this.pitchStageTwo = false;
    const shapeInverse = 1 - p.shape;
    this.pitchDecayFast = decayCoefficient(0.0025, this.sampleRate);
    this.pitchDecaySlow = decayCoefficient(
      (0.005 + p.color * 0.195) * (1 + shapeInverse * 0.5), this.sampleRate,
    );
    this.pitchDecay = this.pitchDecayFast;

    this.bodyEnvelope = 1;
    this.bodyDecay = decayCoefficient(
      (0.08 + p.decay * 0.52) * (1 + shapeInverse * 0.4), this.sampleRate,
    );

    this.bodyLowPassBase = 40 + p.filter * 760;
    this.bodyFilter.setFrequency(this.bodyLowPassBase, 0.1 + p.filter * 0.5, this.sampleRate);
    this.bodyFilter.reset();

    this.attackEnvelope = 0;
    this.attackIncrement = 1 / Math.max(1, p.attack * 0.01 * this.sampleRate);

    this.clickLevel = (0.3 + p.snap * 0.7) * (0.5 + p.shape * 0.5);
    this.clickEnvelope = 1;
    this.clickDecay = decayCoefficient(0.004, this.sampleRate);
    this.clickFilter.setFrequency(
      2000 + p.color * 5000 + p.snap * 1000, 0.1 + p.color * 0.2, this.sampleRate,
    );
    this.clickFilter.reset();

    this.subFrequency = this.baseFrequency * 0.5;
    this.subPhase = 0;
    this.subEnvelope = (0.1 + shapeInverse * 0.3) * (1 - p.color * 0.5);
    this.subDecay = decayCoefficient(0.1 + p.decay * 0.3, this.sampleRate);

    this.drive = p.drive;
    this.color = p.color;
    this.active = true;
  }

  tick() {
    if (!this.active) return 0;

    if (!this.pitchStageTwo && this.pitchEnvelope < 0.55) {
      this.pitchStageTwo = true;
      this.pitchDecay = this.pitchDecaySlow;
    }
    const shapedPitch = this.pitchEnvelope * this.pitchEnvelope;
    const frequency = this.baseFrequency
      + (this.startFrequency - this.baseFrequency) * shapedPitch;
    this.pitchEnvelope *= this.pitchDecay;

    this.phase += frequency / this.sampleRate;
    if (this.phase >= 1) this.phase -= 1;
    const sine = Math.sin(this.phase * TAU);
    const harmonicAmount = 0.05 + this.color * 0.2 + this.drive * 0.25;
    const harmonic = Math.sin(this.phase * 2 * TAU) * harmonicAmount;

    const attackAmplitude = Math.min(1, this.attackEnvelope);
    if (this.attackEnvelope < 1) this.attackEnvelope += this.attackIncrement;

    // The body filter follows the pitch envelope, giving the spectral sweep.
    const dynamicCutoff = this.bodyLowPassBase + (frequency - this.baseFrequency) * 0.5;
    this.bodyFilter.setFrequency(
      Math.max(20, dynamicCutoff), 0.1 + this.drive * 0.3, this.sampleRate,
    );
    this.bodyFilter.tick(sine + harmonic);
    const body = this.bodyFilter.lowPass * this.bodyEnvelope * attackAmplitude;
    this.bodyEnvelope *= this.bodyDecay;

    this.clickPulsePhase += 30 / this.sampleRate;
    const impulse = this.clickPulsePhase < 0.5 ? 1 : 0;
    this.clickFilter.tick(impulse + this.noise.next() * 0.15);
    const click = (this.clickFilter.bandPass * 0.7 + this.clickFilter.lowPass * 0.3)
      * this.clickEnvelope * this.clickLevel;
    this.clickEnvelope *= this.clickDecay;

    this.subPhase += this.subFrequency / this.sampleRate;
    if (this.subPhase >= 1) this.subPhase -= 1;
    const sub = Math.sin(this.subPhase * TAU) * this.subEnvelope;
    this.subEnvelope *= this.subDecay;

    const driven = applyDrive(body + click + sub, this.drive);
    if (this.bodyEnvelope < 1e-6 && this.clickEnvelope < 1e-6 && this.subEnvelope < 1e-6) {
      this.active = false;
    }
    return driven;
  }
}

/** Snare: sine body, high-passed noise through a shell comb, impact transient. */
export class SnareVoice {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.noise = new Noise(123);
    this.highPass = new OnePoleHighPass();
    this.lowPass = new OnePoleLowPass();
    this.comb = new CombFilter();
    this.active = false;
    this.phase = 0;
  }

  trigger(p) {
    this.phase = 0;
    this.frequency = 120 + p.tune * 160;
    this.pitchEnvelope = p.sweep;
    this.pitchDecay = decayCoefficient(0.02, this.sampleRate);

    this.bodyEnvelope = 1;
    this.bodyDecay = decayCoefficient(0.02 + p.color * 0.04 + p.decay * 0.08, this.sampleRate);

    this.noiseEnvelope = 1;
    this.noiseDecay = decayCoefficient(0.04 + p.decay * 0.35, this.sampleRate);

    this.toneNoiseMix = 0.3 + p.color * 0.4 + p.shape * 0.1;

    this.impactRemaining = Math.trunc(this.sampleRate * 0.003);
    this.impactAmplitude = 0.5 + p.snap * 0.5;

    this.tightness = p.filter;
    this.overallEnvelope = 1;
    this.overallDecay = decayCoefficient(
      0.05 + p.decay * 0.45 + p.shape * 0.1, this.sampleRate,
    );

    this.attackEnvelope = 0;
    this.attackIncrement = 1 / Math.max(1, p.attack * 0.01 * this.sampleRate);

    this.highPass.setFrequency(2000 + p.tune * 6000, this.sampleRate);
    this.highPass.reset();
    this.lowPass.setFrequency(6000 + p.tune * 12000, this.sampleRate);
    this.lowPass.reset();

    this.comb.set(
      (120 + p.tune * 160) * 2,
      this.sampleRate,
      (0.3 + p.color * 0.3) * (0.6 + p.shape * 0.4),
    );

    this.drive = p.drive;
    this.active = true;
  }

  tick() {
    if (!this.active) return 0;

    const frequency = this.frequency * (1 + this.pitchEnvelope * 0.5);
    this.pitchEnvelope *= this.pitchDecay;
    this.phase += frequency / this.sampleRate;
    if (this.phase >= 1) this.phase -= 1;
    const body = Math.sin(this.phase * TAU) * this.bodyEnvelope;
    this.bodyEnvelope *= this.bodyDecay;

    const resonated = this.comb.tick(this.highPass.tick(this.noise.next()));
    const noiseOut = resonated * this.noiseEnvelope;
    this.noiseEnvelope *= this.noiseDecay;

    let impact = 0;
    if (this.impactRemaining > 0) {
      this.impactRemaining -= 1;
      impact = this.noise.next() * this.impactAmplitude;
    }

    const toneGain = 1 - this.toneNoiseMix;
    const raw = body * toneGain * 0.6 + noiseOut * this.toneNoiseMix + impact;
    const driven = applyDrive(this.lowPass.tick(raw), this.drive);

    const attackAmplitude = Math.min(1, this.attackEnvelope);
    if (this.attackEnvelope < 1) this.attackEnvelope += this.attackIncrement;

    this.overallEnvelope *= this.overallDecay;
    const tightEnvelope = this.overallEnvelope ** (1 + this.tightness * 3);
    if (this.overallEnvelope < 1e-6) this.active = false;
    return driven * tightEnvelope * attackAmplitude;
  }
}

/** Closed hat: six-oscillator metallic bank with cross-FM, plus noise. */
export class ClosedHiHatVoice {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.sampleRateReciprocal = 1 / sampleRate;
    this.phases = new Float64Array(6);
    this.noise = new Noise(456);
    this.transientNoise = new Noise(789);
    this.highPass = new OnePoleHighPass();
    this.filter = new StateVariableFilter();
    this.sizzleState = 0;
    const rc = 1 / (TAU * 10000);
    const dt = 1 / sampleRate;
    this.sizzleCoefficient = dt / (rc + dt);
    this.active = false;
  }

  trigger(p) {
    this.phases.fill(0);
    this.baseFrequency = 300 + p.tune * 600;
    this.fmIntensity = p.color * 1.5 + p.shape * 0.5;
    this.noiseMix = 0.3 + p.sweep * 0.7;

    this.envelope = 1;
    this.envelopeDecay = decayCoefficient(0.01 + p.decay * 0.07, this.sampleRate);

    this.snapEnvelope = p.snap * 0.8;
    this.snapDecay = decayCoefficient(0.002, this.sampleRate);

    this.highPass.setFrequency(3000 + p.filter * 5000, this.sampleRate);
    this.highPass.reset();
    this.filter.setFrequency(6000 + p.filter * 12000, 0.05, this.sampleRate);
    this.filter.reset();

    this.transientEnvelope = 0.5 + p.snap * 0.5;
    this.transientDecay = decayCoefficient(0.002, this.sampleRate);

    this.attackEnvelope = 0;
    this.attackIncrement = 1 / Math.max(1, p.attack * 0.01 * this.sampleRate);

    this.drive = p.drive;
    this.active = true;
  }

  tick() {
    if (!this.active) return 0;

    const attackAmplitude = Math.min(1, this.attackEnvelope);
    if (this.attackEnvelope < 1) this.attackEnvelope += this.attackIncrement;

    let mix = 0;
    let lastSignal = 0;
    for (let index = 0; index < 6; index += 1) {
      const frequency = this.baseFrequency * CYMBAL_RATIOS[index];
      const fmOffset = lastSignal * this.fmIntensity;
      this.phases[index] += frequency * this.sampleRateReciprocal + fmOffset * 0.01;
      if (this.phases[index] >= 1) this.phases[index] -= 1;
      const square = this.phases[index] < 0.5 ? 1 : -1;
      // Alternating add and multiply builds a dense inharmonic spectrum.
      if (index % 2 === 0) mix += square;
      else mix *= 0.5 + square * 0.5;
      lastSignal = square;
    }
    mix *= 0.5;

    const noiseSample = this.noise.next() * this.noiseMix;
    const snap = this.noise.next() * this.snapEnvelope;
    this.snapEnvelope *= this.snapDecay;

    this.filter.tick(this.highPass.tick(mix + noiseSample + snap));
    const driven = applyDrive(this.filter.lowPass, this.drive);

    const transient = this.transientNoise.next() * this.transientEnvelope;
    this.transientEnvelope *= this.transientDecay;

    const sizzleInput = driven + transient;
    this.sizzleState += this.sizzleCoefficient * (sizzleInput - this.sizzleState);
    const highContent = sizzleInput - this.sizzleState;
    const out = (sizzleInput + highContent * 0.4) * this.envelope * attackAmplitude;

    this.envelope *= this.envelopeDecay;
    if (this.envelope < 1e-6) this.active = false;
    return out;
  }
}

/** Open hat: white noise ring-modulated by the metallic bank, with a choke. */
export class OpenHiHatVoice {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.sampleRateReciprocal = 1 / sampleRate;
    this.phases = new Float64Array(6);
    this.noise = new Noise(2468);
    this.phaseNoise = new Noise(1357);
    this.transientNoise = new Noise(4321);
    this.highPass = new OnePoleHighPass();
    this.filter = new StateVariableFilter();
    this.sizzleState = 0;
    const rc = 1 / (TAU * 10000);
    const dt = 1 / sampleRate;
    this.sizzleCoefficient = dt / (rc + dt);
    this.choking = false;
    this.chokeEnvelope = 1;
    this.chokeDecay = 0;
    this.active = false;
  }

  trigger(p) {
    for (let index = 0; index < 6; index += 1) {
      this.phases[index] = (this.phaseNoise.next() + 1) * 0.5;
    }
    this.baseFrequency = 200 + p.tune * 600;
    this.phaseModulationDepth = p.color * 1.5 + p.shape * 0.5;
    this.ringModulationDepth = p.sweep;

    const bodyTime = 0.1 + p.decay * 0.7;
    this.bodyEnvelope = 1;
    this.bodyDecay = decayCoefficient(bodyTime, this.sampleRate);
    this.highEnvelope = 1;
    this.highDecay = decayCoefficient(bodyTime / 3, this.sampleRate);

    this.attackEnvelope = 0;
    const attackTime = Math.max(p.attack * 0.01, 1 / this.sampleRate);
    this.attackIncrement = 1 / (attackTime * this.sampleRate);

    this.snapEnvelope = p.snap;
    this.snapDecay = decayCoefficient(0.003, this.sampleRate);

    this.chokeEnvelope = 1;
    this.choking = false;

    this.highPass.setFrequency(4000 + p.filter * 6000, this.sampleRate);
    this.highPass.reset();

    // The low pass sweeps downward, so the tail darkens like a real cymbal.
    this.lowPassFrequency = 10000 + p.filter * 8000;
    this.lowPassTarget = 5000 + p.filter * 5000;
    this.lowPassSweep = decayCoefficient(bodyTime * 0.6, this.sampleRate);
    this.filter.setFrequency(this.lowPassFrequency, 0.1, this.sampleRate);
    this.filter.reset();

    this.transientEnvelope = 0.4 + p.snap * 0.6;
    this.transientDecay = decayCoefficient(0.003, this.sampleRate);

    this.drive = p.drive;
    this.active = true;
  }

  choke() {
    this.choking = true;
    this.chokeDecay = decayCoefficient(0.01, this.sampleRate);
  }

  tick() {
    if (!this.active) return 0;

    if (this.attackEnvelope < 1) {
      this.attackEnvelope = Math.min(1, this.attackEnvelope + this.attackIncrement);
    }

    let metallic = 0;
    let previous = 0;
    for (let index = 0; index < 6; index += 1) {
      const frequency = this.baseFrequency * CYMBAL_RATIOS[index];
      const modulation = previous * this.phaseModulationDepth * 0.15;
      this.phases[index] += frequency * this.sampleRateReciprocal;
      if (this.phases[index] >= 1) this.phases[index] -= 1;
      const oscillator = Math.sin((this.phases[index] + modulation) * TAU);
      metallic += oscillator;
      previous = oscillator;
    }
    metallic /= 6;

    const noise = this.noise.next();
    // Ring modulation stamps the metallic spectrum onto the noise, which is what
    // produces a hiss with shimmer instead of audible tones.
    const ring = noise * metallic;
    const blend = (
      ring * this.ringModulationDepth
      + noise * (1 - this.ringModulationDepth) * 0.6
    ) * 2.5;

    const snap = this.noise.next() * this.snapEnvelope;
    this.snapEnvelope *= this.snapDecay;

    const extraHigh = this.noise.next() * 0.3 * this.highEnvelope;
    const raw = blend * this.bodyEnvelope + extraHigh + snap;

    this.lowPassFrequency = this.lowPassTarget
      + (this.lowPassFrequency - this.lowPassTarget) * this.lowPassSweep;
    this.filter.setFrequency(this.lowPassFrequency, 0.1, this.sampleRate);
    this.filter.tick(this.highPass.tick(raw));
    const driven = applyDrive(this.filter.lowPass, this.drive);

    const transient = this.transientNoise.next() * this.transientEnvelope;
    this.transientEnvelope *= this.transientDecay;

    const sizzleInput = driven + transient;
    this.sizzleState += this.sizzleCoefficient * (sizzleInput - this.sizzleState);
    const highContent = sizzleInput - this.sizzleState;
    const out = (sizzleInput + highContent * 0.4) * this.attackEnvelope;

    this.bodyEnvelope *= this.bodyDecay;
    this.highEnvelope *= this.highDecay;

    if (this.choking) {
      this.chokeEnvelope *= this.chokeDecay;
      if (this.chokeEnvelope < 1e-5) {
        this.active = false;
        return 0;
      }
      return out * this.chokeEnvelope;
    }

    if (this.bodyEnvelope < 1e-6 && this.highEnvelope < 1e-6) this.active = false;
    return out;
  }
}

/** Clap: band-passed noise gated into a burst train, then a tail. */
export class ClapVoice {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.noise = new Noise(9871);
    this.pinkState = 0;
    // Upstream pins the pink-tilt low pass at roughly 2 kHz.
    const rc = 1 / (TAU * 2000);
    const dt = 1 / sampleRate;
    this.pinkCoefficient = dt / (rc + dt);
    this.filterBuffer = 0;
    this.filterLowPass = 0;
    this.active = false;
  }

  trigger(p) {
    const centre = 800 + p.tune * 3200;
    this.filterCutoff = 2 * Math.sin((Math.PI * centre) / this.sampleRate);
    const resonance = p.filter * 0.95;
    this.filterFeedback = resonance + resonance / Math.max(0.01, 1 - this.filterCutoff);
    this.filterBuffer = 0;
    this.filterLowPass = 0;

    this.noiseColor = p.color;
    this.pinkState = 0;

    this.envelope = 1;
    this.envelopeDecay = decayCoefficient(0.05 + p.decay * 0.25, this.sampleRate);

    this.burstCount = 3 + Math.round(p.snap * 3);
    const spacing = 0.003 + p.shape * 0.003;
    this.burstOnSamples = Math.trunc(this.sampleRate * spacing);
    this.burstOffSamples = Math.trunc(this.sampleRate * spacing);
    this.burstIndex = 0;
    this.burstSample = 0;
    this.burstOn = true;
    this.inBurstPhase = true;

    this.punch = p.sweep;
    this.punchRemaining = Math.trunc(this.sampleRate * 0.01);

    this.attackEnvelope = 0;
    this.attackIncrement = 1 / Math.max(1, p.attack * 0.01 * this.sampleRate);

    this.drive = p.drive;
    this.active = true;
  }

  tick() {
    if (!this.active) return 0;

    const attackAmplitude = Math.min(1, this.attackEnvelope);
    if (this.attackEnvelope < 1) this.attackEnvelope += this.attackIncrement;

    const white = this.noise.next();
    this.pinkState += this.pinkCoefficient * (white - this.pinkState);
    const mixed = white * (1 - this.noiseColor) + this.pinkState * this.noiseColor;

    const highPass = mixed - this.filterBuffer;
    const bandPass = this.filterBuffer - this.filterLowPass;
    this.filterBuffer += this.filterCutoff * (highPass + this.filterFeedback * bandPass);
    this.filterLowPass += this.filterCutoff * (this.filterBuffer - this.filterLowPass);
    const filtered = this.filterBuffer;

    let burstGate = 1;
    if (this.inBurstPhase) {
      this.burstSample += 1;
      if (this.burstOn) {
        if (this.burstSample >= this.burstOnSamples) {
          this.burstSample = 0;
          this.burstOn = false;
        }
        burstGate = 1;
      } else {
        if (this.burstSample >= this.burstOffSamples) {
          this.burstSample = 0;
          this.burstOn = true;
          this.burstIndex += 1;
          if (this.burstIndex >= this.burstCount) this.inBurstPhase = false;
        }
        burstGate = 0;
      }
    }

    let punchGain = 1;
    if (this.punchRemaining > 0) {
      this.punchRemaining -= 1;
      punchGain = this.punch > 0.5
        ? 1 + (this.punch - 0.5) * 4
        : 0.2 + this.punch * 1.6;
    }

    const driven = applyDrive(filtered * punchGain, this.drive);
    const out = driven * this.envelope * burstGate * attackAmplitude;

    if (!this.inBurstPhase) {
      this.envelope *= this.envelopeDecay;
      if (this.envelope < 1e-6) this.active = false;
    }
    return out;
  }
}

export function createDrumVoices(sampleRate) {
  return {
    kick: new KickVoice(sampleRate),
    snare: new SnareVoice(sampleRate),
    closedHat: new ClosedHiHatVoice(sampleRate),
    openHat: new OpenHiHatVoice(sampleRate),
    clap: new ClapVoice(sampleRate),
  };
}
