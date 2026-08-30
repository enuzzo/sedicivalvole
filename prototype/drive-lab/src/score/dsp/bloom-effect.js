// BLOOM: a short acceleration gesture built from a swept feed-forward delay.
//
// The delayed signal replaces only the 300 Hz–8 kHz band. A global dry/wet
// crossfade would attenuate the sub even though the delay send is high-passed;
// subtracting the undelayed band before adding its delayed copy leaves content
// outside the send band unchanged by construction.

import { OnePoleHighPass, OnePoleLowPass } from "./primitives.js";
import { sampleTimedGestureEnvelope } from "../../response-mapping.js";
import {
  BLOOM_ATTACK_SECONDS,
  BLOOM_RELEASE_SECONDS,
  BLOOM_SWEEP_SECONDS,
} from "../../bloom-macro.js";
export { BLOOM_RELEASE_SECONDS, BLOOM_SWEEP_SECONDS } from "../../bloom-macro.js";

export const BLOOM_MAX_DELAY_SECONDS = 0.008;
export const BLOOM_MIN_DELAY_SECONDS = 0.0008;
export const BLOOM_DEPTH = 0.48;

function nextPowerOfTwo(value) {
  let result = 1;
  while (result < value) result *= 2;
  return result;
}

function hermite(buffer, position) {
  const size = buffer.length;
  const base = Math.floor(position);
  const fraction = position - base;
  const at = (offset) => buffer[(base + offset + size) % size];
  const before = at(-1);
  const current = at(0);
  const after = at(1);
  const far = at(2);
  const c1 = 0.5 * (after - before);
  const c2 = before - 2.5 * current + 2 * after - 0.5 * far;
  const c3 = 0.5 * (far - before) + 1.5 * (current - after);
  return ((c3 * fraction + c2) * fraction + c1) * fraction + current;
}

function createBand(sampleRate) {
  const highPasses = [new OnePoleHighPass(), new OnePoleHighPass()];
  const lowPasses = [new OnePoleLowPass(), new OnePoleLowPass()];
  for (const filter of highPasses) filter.setFrequency(300, sampleRate);
  for (const filter of lowPasses) filter.setFrequency(8000, sampleRate);
  return { highPasses, lowPasses };
}

function bandTick(filters, input) {
  let output = input;
  for (const filter of filters.highPasses) output = filter.tick(output);
  for (const filter of filters.lowPasses) output = filter.tick(output);
  return output;
}

export class BloomEffect {
  constructor(sampleRate, { depth = BLOOM_DEPTH } = {}) {
    this.sampleRate = sampleRate;
    this.depth = Math.min(1, Math.max(0, depth));
    this.leftBand = createBand(sampleRate);
    this.rightBand = createBand(sampleRate);
    const bufferSize = nextPowerOfTwo(Math.ceil(sampleRate * BLOOM_MAX_DELAY_SECONDS) + 8);
    this.leftDelay = new Float64Array(bufferSize);
    this.rightDelay = new Float64Array(bufferSize);
    this.writePosition = 0;
    this.elapsedSamples = 0;
    this.releaseStartSample = null;
    this.active = false;
  }

  trigger() {
    this.leftDelay.fill(0);
    this.rightDelay.fill(0);
    for (const filter of [...this.leftBand.highPasses, ...this.leftBand.lowPasses]) filter.reset();
    for (const filter of [...this.rightBand.highPasses, ...this.rightBand.lowPasses]) filter.reset();
    this.elapsedSamples = 0;
    this.releaseStartSample = null;
    this.active = true;
  }

  release() {
    if (this.active && this.releaseStartSample === null) {
      this.releaseStartSample = this.elapsedSamples;
    }
  }

  currentDepth() {
    if (!this.active) return 0;
    const elapsedSeconds = this.elapsedSamples / this.sampleRate;
    const explicitRelease = this.releaseStartSample === null
      ? null
      : (this.elapsedSamples - this.releaseStartSample) / this.sampleRate;
    return this.depth * sampleTimedGestureEnvelope({
      elapsedSeconds,
      releaseElapsedSeconds: explicitRelease,
      attackSeconds: BLOOM_ATTACK_SECONDS,
      automaticReleaseAtSeconds: BLOOM_SWEEP_SECONDS,
      releaseSeconds: BLOOM_RELEASE_SECONDS,
    });
  }

  currentDelaySamples() {
    const progress = Math.min(
      1,
      this.elapsedSamples / Math.max(1, BLOOM_SWEEP_SECONDS * this.sampleRate),
    );
    const seconds = BLOOM_MAX_DELAY_SECONDS
      + (BLOOM_MIN_DELAY_SECONDS - BLOOM_MAX_DELAY_SECONDS) * progress;
    return seconds * this.sampleRate;
  }

  tick(left, right = left) {
    const bandLeft = bandTick(this.leftBand, left);
    const bandRight = bandTick(this.rightBand, right);
    const readPosition = this.writePosition - this.currentDelaySamples();
    const wrapped = readPosition < 0 ? readPosition + this.leftDelay.length : readPosition;
    const delayedLeft = hermite(this.leftDelay, wrapped);
    const delayedRight = hermite(this.rightDelay, wrapped);
    this.leftDelay[this.writePosition] = bandLeft;
    this.rightDelay[this.writePosition] = bandRight;
    this.writePosition = (this.writePosition + 1) % this.leftDelay.length;

    const depth = this.currentDepth();
    const outputLeft = left + depth * (delayedLeft - bandLeft);
    const outputRight = right + depth * (delayedRight - bandRight);
    if (this.active) {
      this.elapsedSamples += 1;
      if (depth === 0 && this.elapsedSamples > BLOOM_SWEEP_SECONDS * this.sampleRate) {
        this.active = false;
      }
    }
    return [outputLeft, outputRight];
  }
}
