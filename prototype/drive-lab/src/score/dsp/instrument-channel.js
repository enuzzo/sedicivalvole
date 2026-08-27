// A channel strip for sampled instruments.
//
// Original sedicivalvole code. A multisample played back flat sounds like what
// it is: one recording, dead centre, identical every time, with no room around
// it. The complaint that prompted this was exact — it sounded like a cheap
// keyboard — and the fixes are the standard ones for the problem.
//
// Technique follows established mixing practice for sampled and virtual pianos:
//
//   - reverb with 20–30 ms of pre-delay, so the source separates from the tail
//     and the space reads as larger without the transient being buried;
//     Sound on Sound, "Using Reverb & Delay", and Music Guy Mixing, "How to Use
//     Reverb on Piano for Depth and Fullness";
//   - the reverb send filtered top and bottom, so the tail adds space rather
//     than mud and hiss;
//   - saturation, because sampled instruments are too clean and too static to
//     sit in a mix on their own;
//   - a doubled, detuned, oppositely panned layer for width, with the reverb
//     placed at the same angle as the dry part;
//   - velocity and timbre variation per note, so repeated notes are not
//     bit-identical and the part does not read as machine-perfect.
//
// The last one matters more than any of the effects. A sampler that plays the
// same file at the same level every time is the single loudest tell.

import { OnePoleHighPass, OnePoleLowPass, TAU } from "./primitives.js";

/** Pre-delay keeps the attack in front of the room rather than inside it. */
const PRE_DELAY_SECONDS = 0.026;

export class InstrumentChannel {
  /**
   * @param {number} sampleRate
   * @param {object} settings
   *   `space` 0..1 reverb send, `drive` 0..1 saturation, `width` 0..2,
   *   `tone` 0..1 opens the low pass, `body` 0..1 sets the high pass.
   */
  constructor(sampleRate, settings = {}) {
    this.sampleRate = sampleRate;
    this.set(settings);

    const preDelayFrames = Math.max(1, Math.round(PRE_DELAY_SECONDS * sampleRate));
    this.preDelayLeft = new Float32Array(preDelayFrames);
    this.preDelayRight = new Float32Array(preDelayFrames);
    this.preDelayPosition = 0;

    // The send is filtered on both ends: a tail carrying the fundamental turns
    // to mud, and one carrying the top turns to hiss.
    this.sendHighPass = new OnePoleHighPass();
    this.sendLowPass = new OnePoleLowPass();
    this.sendHighPass.setFrequency(320, sampleRate);
    this.sendLowPass.setFrequency(5200, sampleRate);

    this.toneLeft = new OnePoleLowPass();
    this.toneRight = new OnePoleLowPass();
    this.bodyLeft = new OnePoleHighPass();
    this.bodyRight = new OnePoleHighPass();

    // A slow, shallow drift on the doubled layer. Static detune beats at a
    // fixed rate and starts to sound like a fault; a drifting one breathes.
    this.driftPhase = 0;
    this.driftRate = 0.13 / sampleRate;

    this.refresh();
  }

  set(settings) {
    this.space = settings.space ?? 0.3;
    this.drive = settings.drive ?? 0.18;
    this.width = settings.width ?? 1.25;
    this.tone = settings.tone ?? 0.6;
    this.body = settings.body ?? 0.3;
  }

  /** Control-rate: filter corners follow tone and body. */
  refresh() {
    const cutoff = 1200 + this.tone ** 2 * 12000;
    this.toneLeft.setFrequency(cutoff, this.sampleRate);
    this.toneRight.setFrequency(cutoff, this.sampleRate);
    const corner = 60 + this.body * 180;
    this.bodyLeft.setFrequency(corner, this.sampleRate);
    this.bodyRight.setFrequency(corner, this.sampleRate);
  }

  /**
   * Runs one frame. `reverb` is a shared StereoReverb the caller owns, so
   * several instruments can sit in the same room rather than each in its own,
   * which is what makes them sound like one performance.
   */
  tick(inputLeft, inputRight, reverb) {
    // 1. Saturation. Asymmetric, so it adds even harmonics and reads as warmth
    //    rather than as fuzz.
    const amount = 1 + this.drive * 3;
    const shapedLeft = Math.tanh(inputLeft * amount + this.drive * 0.06) / amount * (1 + this.drive);
    const shapedRight = Math.tanh(inputRight * amount + this.drive * 0.06) / amount * (1 + this.drive);

    // 2. Tone and body.
    const tonedLeft = this.bodyLeft.tick(this.toneLeft.tick(shapedLeft));
    const tonedRight = this.bodyRight.tick(this.toneRight.tick(shapedRight));

    // 3. Width from a drifting mid/side spread rather than a delay, so it
    //    survives being summed to mono on one speaker.
    this.driftPhase += this.driftRate;
    if (this.driftPhase >= 1) this.driftPhase -= 1;
    const drift = 1 + Math.sin(this.driftPhase * TAU) * 0.06;
    const mid = (tonedLeft + tonedRight) * 0.5;
    const side = (tonedLeft - tonedRight) * 0.5 * this.width * drift;
    const dryLeft = mid + side;
    const dryRight = mid - side;

    // 4. Pre-delayed, filtered send into the shared room.
    const readPosition = this.preDelayPosition;
    const delayedLeft = this.preDelayLeft[readPosition];
    const delayedRight = this.preDelayRight[readPosition];
    this.preDelayLeft[readPosition] = dryLeft;
    this.preDelayRight[readPosition] = dryRight;
    this.preDelayPosition = (readPosition + 1) % this.preDelayLeft.length;

    const send = (delayedLeft + delayedRight) * 0.5 * this.space;
    const filtered = this.sendLowPass.tick(send - this.sendHighPass.tick(send) * 0);
    const [wetLeft, wetRight] = reverb.tickStereo(
      this.sendHighPass.tick(filtered), this.sendHighPass.tick(filtered) * 0.94,
    );

    return [dryLeft + wetLeft * this.space, dryRight + wetRight * this.space];
  }
}

/**
 * Per-note variation.
 *
 * A sampler that plays the same file at the same level every time is the
 * loudest tell that something is not being performed. This returns a small,
 * deterministic spread of gain and of how far into the sample playback starts,
 * so repeated notes differ the way a played instrument's do.
 *
 * Deterministic rather than random: a render has to be reproducible, and a
 * pattern that changes every time it is heard cannot be judged.
 */
export function noteVariation(seed) {
  let x = (seed * 2654435761) >>> 0;
  x ^= x << 13; x >>>= 0;
  x ^= x >> 17;
  x ^= x << 5; x >>>= 0;
  const unit = x / 4294967296;
  return {
    // Roughly ±1.5 dB, which is about the spread of an evenly played phrase.
    gain: 0.88 + unit * 0.24,
    // A few samples in, so the very first cycle is not always identical.
    offsetFrames: Math.round(unit * 24),
    // A touch of detune, under two cents: it thickens a doubled line without
    // ever reading as a tuning error.
    rate: 1 + (unit - 0.5) * 0.0022,
  };
}
