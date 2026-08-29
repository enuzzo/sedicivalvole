// FRACTURE's stopped-vehicle ambience.
//
// PARK is deliberately independent of the sequencer. Its six rootless upper
// voicings move on unequal, multi-second spans, so a red light hears breathing
// harmony rather than a transport-synchronised pad or one oscillator held
// forever. Two four-voice banks overlap through every change. The score core
// still owns the bus, chorus, room and limiter; this module only authors and
// renders the quiet dry field.

import { RampedParam } from "./dsp/effects.js";
import {
  synthParams,
  SynthVoice,
  WAVEFORM,
} from "./dsp/synth-voice.js";

const TAU = Math.PI * 2;
const VOICES_PER_BANK = 4;

/**
 * One slow, cyclic voice-leading path inside F natural minor.
 *
 * `allowedPitchClasses` names the complete chord; `notes` is its deliberately
 * root-light upper voicing. Keeping the notes at C4 and above leaves PARK free
 * of bass while the chord name remains musically truthful.
 */
export const FRACTURE_PARK_VOICINGS = Object.freeze([
  Object.freeze({
    id: "Fm9",
    notes: Object.freeze([60, 63, 67, 68]),
    allowedPitchClasses: Object.freeze([0, 3, 5, 7, 8]),
  }),
  Object.freeze({
    id: "Dbmaj9",
    notes: Object.freeze([60, 63, 65, 68]),
    allowedPitchClasses: Object.freeze([0, 1, 3, 5, 8]),
  }),
  Object.freeze({
    id: "Ab6/9",
    notes: Object.freeze([60, 63, 65, 70]),
    allowedPitchClasses: Object.freeze([0, 3, 5, 8, 10]),
  }),
  Object.freeze({
    id: "Eb6/9",
    notes: Object.freeze([60, 65, 67, 70]),
    allowedPitchClasses: Object.freeze([0, 3, 5, 7, 10]),
  }),
  Object.freeze({
    id: "Cm7",
    notes: Object.freeze([60, 63, 67, 70]),
    allowedPitchClasses: Object.freeze([0, 3, 7, 10]),
  }),
  Object.freeze({
    id: "Fm11",
    notes: Object.freeze([60, 63, 68, 70]),
    allowedPitchClasses: Object.freeze([0, 3, 5, 7, 8, 10]),
  }),
]);

/** Unequal clockless holds; the complete path takes 46.2 seconds to recur. */
export const FRACTURE_PARK_HOLD_SECONDS = Object.freeze([6.7, 8.3, 7.1, 9.2, 6.1, 8.8]);

/** The ambience stays well below the moving score even while two banks overlap. */
export const FRACTURE_PARK_OUTPUT_GAIN = 0.23;

/** Slow enough to hide the voice hand-off, short enough to reveal the new colour. */
export const FRACTURE_PARK_FADE_SECONDS = Object.freeze({ in: 2.4, out: 2.8 });

/**
 * A dark sine-and-air voice, not an exposed test oscillator.
 *
 * The noise partial is intentionally tiny. It gives the filter and room a
 * moving surface while the pitched component remains soft and consonant.
 */
export const FRACTURE_PARK_PATCH = Object.freeze(synthParams({
  osc1Waveform: WAVEFORM.sine,
  osc1Level: 0.60,
  osc1Tune: 0.5,
  osc1Pwm: 0,
  osc2Waveform: WAVEFORM.noise,
  osc2Level: 0.045,
  osc2Tune: 0.5,
  osc2Detune: 0.5,
  osc2Pwm: 0.30,
  subLevel: 0,
  ampAttack: 0.96,
  ampDecay: 0.86,
  ampSustain: 0.58,
  ampRelease: 0.94,
  filterEnvAttack: 0.96,
  filterEnvDecay: 0.88,
  filterEnvSustain: 0.34,
  filterEnvRelease: 0.94,
  filterCutoff: 0.60,
  filterResonance: 0.035,
  filterType: 0,
  filterEnvAmount: 0.018,
  filterKeyFollow: 0.08,
  glide: 0,
  volume: 0.12,
}));

function panGains(position) {
  const angle = (Math.min(1, Math.max(-1, position)) + 1) * 0.25 * Math.PI;
  return [Math.cos(angle), Math.sin(angle)];
}

const VOICE_PAN = Object.freeze([-0.62, -0.2, 0.24, 0.64].map((position) => (
  Object.freeze(panGains(position))
)));

/**
 * Creates the allocation-free PARK renderer used by the offline core and the
 * AudioWorklet. Call `tick()` once per output frame, then read `.left/.right`.
 */
export function createFractureParkAmbience({ sampleRate } = {}) {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new TypeError(`[park ambience] a real sample rate is required, received ${sampleRate}`);
  }

  const banks = [
    Array.from({ length: VOICES_PER_BANK }, () => new SynthVoice(sampleRate)),
    Array.from({ length: VOICES_PER_BANK }, () => new SynthVoice(sampleRate)),
  ];
  const settings = [
    { ...FRACTURE_PARK_PATCH, filterCutoff: 0.592, osc2Level: 0.038 },
    { ...FRACTURE_PARK_PATCH, filterCutoff: 0.608, osc2Level: 0.052 },
  ];
  const gain = new RampedParam(1);
  const fadeInSamples = Math.max(1, Math.round(FRACTURE_PARK_FADE_SECONDS.in * sampleRate));
  const fadeOutSamples = Math.max(1, Math.round(FRACTURE_PARK_FADE_SECONDS.out * sampleRate));

  let active = true;
  let activeBank = 0;
  let voicingIndex = 0;
  let changes = 0;
  let framesUntilChange = Math.round(FRACTURE_PARK_HOLD_SECONDS[0] * sampleRate);
  let frame = 0;
  let driftSin = 0;
  let driftCos = 1;
  const driftStepSin = Math.sin(TAU / (47 * sampleRate));
  const driftStepCos = Math.cos(TAU / (47 * sampleRate));

  function releaseBank(bankIndex) {
    for (const voice of banks[bankIndex]) voice.release();
  }

  function triggerBank(bankIndex, nextVoicingIndex) {
    const voicing = FRACTURE_PARK_VOICINGS[nextVoicingIndex];
    for (let index = 0; index < VOICES_PER_BANK; index += 1) {
      banks[bankIndex][index].trigger(settings[bankIndex], voicing.notes[index]);
    }
  }

  function advanceVoicing() {
    releaseBank(activeBank);
    activeBank = 1 - activeBank;
    voicingIndex = (voicingIndex + 1) % FRACTURE_PARK_VOICINGS.length;
    triggerBank(activeBank, voicingIndex);
    framesUntilChange = Math.round(
      FRACTURE_PARK_HOLD_SECONDS[voicingIndex] * sampleRate,
    );
    changes += 1;
  }

  triggerBank(activeBank, voicingIndex);

  return {
    left: 0,
    right: 0,

    setActive(nextActive) {
      const shouldBeActive = Boolean(nextActive);
      if (shouldBeActive === active) return;
      active = shouldBeActive;
      gain.set(active ? 1 : 0, active ? fadeInSamples : fadeOutSamples);
      if (active) {
        // A new stop continues the harmonic path instead of always restarting
        // the same chord, so repeated traffic lights do not repeat one entrance.
        advanceVoicing();
      } else {
        releaseBank(activeBank);
      }
    },

    tick() {
      if (active) {
        framesUntilChange -= 1;
        if (framesUntilChange <= 0) advanceVoicing();
      }

      const nextSin = driftSin * driftStepCos + driftCos * driftStepSin;
      driftCos = driftCos * driftStepCos - driftSin * driftStepSin;
      driftSin = nextSin;
      frame += 1;

      // Updating at roughly 47 Hz is fast enough to breathe and avoids forcing
      // every voice's filter to recalculate its coefficients every sample.
      if (frame % 1024 === 0) {
        settings[0].filterCutoff = 0.592 + driftSin * 0.012;
        settings[1].filterCutoff = 0.608 - driftSin * 0.014;
      }

      let left = 0;
      let right = 0;
      for (let bankIndex = 0; bankIndex < banks.length; bankIndex += 1) {
        for (let voiceIndex = 0; voiceIndex < VOICES_PER_BANK; voiceIndex += 1) {
          const sample = banks[bankIndex][voiceIndex].tick(settings[bankIndex]);
          const direction = voiceIndex % 2 === 0 ? 1 : -1;
          const drift = driftSin * direction * 0.055;
          left += sample * VOICE_PAN[voiceIndex][0] * (1 + drift);
          right += sample * VOICE_PAN[voiceIndex][1] * (1 - drift);
        }
      }

      const level = gain.next() * FRACTURE_PARK_OUTPUT_GAIN;
      this.left = left * level;
      this.right = right * level;
    },

    state() {
      return {
        active,
        voicing: FRACTURE_PARK_VOICINGS[voicingIndex].id,
        voicingIndex,
        changes,
        secondsUntilChange: framesUntilChange / sampleRate,
      };
    },
  };
}
