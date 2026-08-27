// The Flux score generator.
//
// Original sedicivalvole code. It binds three things together: the ported
// textStep transport and synthesis, the arranger's decisions, and the authored
// score data. It produces samples and nothing else — no AudioContext, no DOM —
// so the identical code runs inside an AudioWorklet and inside Node for offline
// rendering, and the rendered reference mix is genuinely the thing the vehicle
// will play.
//
// The per-sample loop is deliberately allocation-free. Everything it needs is
// built once in `createScoreCore`.

import {
  arrangementSnapshot,
  commitAtBoundary,
  continuousControls,
  createArrangerState,
  LANES,
  observeSpeed,
  SCENES,
} from "./arranger.js";
import {
  BARS_PER_PHRASE,
  SequencerClock,
  STEPS_PER_BAR,
  STEPS_PER_PATTERN,
  STEPS_PER_PHRASE,
} from "./clock.js";
import {
  ClapVoice,
  ClosedHiHatVoice,
  KickVoice,
  OpenHiHatVoice,
  SnareVoice,
} from "./dsp/drum-voices.js";
import {
  LookaheadLimiter,
  RampedParam,
  SidechainEnvelope,
  StereoChorus,
  StereoReverb,
  StereoWidth,
  TempoDelay,
  TubeSaturator,
} from "./dsp/effects.js";
import { OnePoleHighPass } from "./dsp/primitives.js";
import { SynthVoice } from "./dsp/synth-voice.js";
import { bassInterval, harmonyForBar, SCORE, sectionAt } from "./jungle-score.js";

/** Bars a lane takes to fade in or out. Entries and exits are crossfades. */
const LANE_CROSSFADE_SECONDS = 0.35;

/** Master trim. The limiter protects the ceiling; this sets the working level. */
const MASTER_GAIN = 0.92;

/**
 * How much quieter the resting arrangement is than the full one.
 *
 * Without this the piece hit the limiter at a standstill exactly as hard as it
 * did at the ceiling, so an arrangement that gains six lanes across a drive
 * gained no weight at all — the limiter simply gave back whatever was added.
 * Four and a half decibels is enough for the build to be felt and little enough
 * that the resting scene is still clearly playing.
 */
const RESTING_TRIM = 0.6;

const SYNTH_LANES = ["sub", "reese", "riff", "response", "atmosphere"];

/** Theme voices a section may name. The first is the default. */
const RIFF_VOICES = ["riff", "riffBell", "riffPluck", "riffReed"];

/**
 * Voices the pad runs.
 *
 * The pad was monophonic and played one note of each chord, so the harmony the
 * score is written around was never actually sounding: a bass root, a single
 * colour tone, and a melody. Four voices means the chord is heard as a chord,
 * which is most of what "the harmony is monotonous" was describing.
 */
const PAD_VOICES = 4;

/**
 * Below this the vehicle is stopped rather than moving slowly.
 *
 * `speedToEnergy` puts roughly four km/h here, which is walking pace: below it
 * the piece may leave silence between phrases, and above it there is a driver
 * to play to.
 */
const STANDSTILL_ENERGY = 0.07;

/**
 * Static placement of each element across the stereo field, -1 left to 1 right.
 *
 * The low end and the principal backbeat stay centred, because a car's two
 * speakers must reinforce them rather than smear them. Everything that carries
 * detail rather than weight is placed off-centre, which is what turns the mix
 * from a line into a field. Constant-power law, so nothing changes level as it
 * moves.
 */
const PLACEMENT = Object.freeze({
  kick: 0,
  snare: 0,
  ghost: -0.42,
  breakDetail: 0.5,
  closedHat: 0.34,
  openHat: -0.3,
  clap: 0.18,
  sub: 0,
  reese: 0,
  riff: -0.22,
  response: 0.36,
});

/** Constant-power pan gains for a position in -1..1. */
function panGains(position) {
  const angle = (Math.min(1, Math.max(-1, position)) + 1) * 0.25 * Math.PI;
  return [Math.cos(angle), Math.sin(angle)];
}

const PAN = Object.fromEntries(
  Object.entries(PLACEMENT).map(([lane, position]) => [lane, panGains(position)]),
);

export function createScoreCore({ sampleRate, score = SCORE, swing = 0.54 } = {}) {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new TypeError(`[score] a real sample rate is required, received ${sampleRate}`);
  }

  const clock = new SequencerClock();
  const arranger = createArrangerState();

  const drums = {
    kick: new KickVoice(sampleRate),
    snare: new SnareVoice(sampleRate),
    ghost: new SnareVoice(sampleRate),
    closedHat: new ClosedHiHatVoice(sampleRate),
    openHat: new OpenHiHatVoice(sampleRate),
    clap: new ClapVoice(sampleRate),
  };

  const synths = {};
  const synthSettings = {};
  const synthRelease = {};
  for (const lane of SYNTH_LANES) {
    synths[lane] = new SynthVoice(sampleRate);
    synthSettings[lane] = { ...score.synths[lane] };
    synthRelease[lane] = null;
  }

  // Which patch the theme lane is currently playing. The section names it, and
  // it only ever changes at a section boundary, which is a phrase boundary.
  let riffVoice = "riff";

  // The pad's remaining voices. `synths.atmosphere` is the first of them, so the
  // lane still has the one-voice surface every other lane has.
  const padVoices = [synths.atmosphere];
  for (let index = 1; index < PAD_VOICES; index += 1) {
    padVoices.push(new SynthVoice(sampleRate));
  }

  // Every lane's level is a ramp, so an entry or exit is always a crossfade and
  // never a discontinuity.
  const crossfadeSamples = Math.max(1, Math.round(LANE_CROSSFADE_SECONDS * sampleRate));
  const laneGain = {};
  for (const lane of LANES) {
    laneGain[lane.id] = new RampedParam(arranger.laneGoals[lane.id]);
  }

  const drumSaturator = new TubeSaturator(sampleRate);
  const sidechain = new SidechainEnvelope(sampleRate);
  const delay = new TempoDelay(sampleRate);
  const reverb = new StereoReverb(sampleRate);
  const padChorus = new StereoChorus(sampleRate);
  const width = new StereoWidth(sampleRate);
  const limiter = new LookaheadLimiter(sampleRate);
  // Everything except the kick and the sub is high-passed before it reaches the
  // bus. Without this the pad, the reese and the break all pile into the same
  // two octaves the low end needs, and the mix reads as mud at speed.
  const reeseHighPass = new OnePoleHighPass();
  const melodicHighPassLeft = new OnePoleHighPass();
  const melodicHighPassRight = new OnePoleHighPass();
  reeseHighPass.setFrequency(72, sampleRate);
  melodicHighPassLeft.setFrequency(150, sampleRate);
  melodicHighPassRight.setFrequency(150, sampleRate);
  delay.setTime("eighthDotted", arranger.committedTempo, 0);

  // An auditioned voice is heard even when the arrangement has it silent, so the
  // preview demonstrates the real voice rather than a separate demonstration
  // synth. The floor decays on its own; nothing latches.
  //
  // Keyed by *voice*, not by lane. Keying it by lane left the ghost snare and
  // the clap silent in the preview, because neither has a lane of its own: both
  // are voiced through the snare's level, which is zero at a standstill.
  const AUDITIONABLE = [...LANES.map((lane) => lane.id), "ghost", "clap"];
  const auditionSamples = Object.fromEntries(AUDITIONABLE.map((id) => [id, 0]));

  /** How long an audition holds a voice open, by voice. */
  function auditionSeconds(voiceId) {
    if (voiceId === "atmosphere") return 3.2;
    if (voiceId === "sub" || voiceId === "reese") return 2;
    if (drums[voiceId]) return 1;
    return 1.6;
  }

  /** Consumes one sample of an audition and reports whether it is running. */
  function auditioning(voiceId) {
    if (!(auditionSamples[voiceId] > 0)) return false;
    auditionSamples[voiceId] -= 1;
    return true;
  }

  /** Lane level, lifted to full while that lane's voice is being auditioned. */
  function levelOf(laneId) {
    const scheduled = laneGain[laneId].next();
    return auditioning(laneId) ? Math.max(scheduled, 1) : scheduled;
  }

  let controls = continuousControls(arranger);
  let masterGain = MASTER_GAIN * RESTING_TRIM;
  let fillBar = false;
  let lastEvent = null;
  let stepsElapsed = 0;
  let structuralEvents = 0;
  let sectionIndex = 0;
  let restingVoiced = true;

  /** Applies the block-rate controls to the voices that read parameters live. */
  function refreshVoiceSettings() {
    const { brightness, filterPressure, drive, dynamics } = controls;

    synthSettings.sub.filterCutoff = 0.18 + 0.1 * filterPressure;
    synthSettings.sub.volume = score.synths.sub.volume * (0.85 + 0.15 * dynamics);

    // The reese opens and churns with pressure: this is where most of the
    // perceived intensity at speed actually comes from.
    synthSettings.reese.filterCutoff = 0.26 + 0.34 * filterPressure;
    synthSettings.reese.filterResonance = 0.22 + 0.22 * brightness;
    synthSettings.reese.osc2Detune = 0.56 + 0.1 * brightness;
    synthSettings.reese.volume = score.synths.reese.volume * (0.7 + 0.3 * dynamics);

    // The theme's live controls are applied to whichever patch the section
    // named, on top of that patch's own values rather than the default's.
    const riffBase = score.synths[riffVoice] ?? score.synths.riff;
    synthSettings.riff.filterCutoff = riffBase.filterCutoff + 0.3 * brightness;
    synthSettings.riff.filterEnvAmount = riffBase.filterEnvAmount + 0.2 * brightness;
    synthSettings.riff.volume = riffBase.volume * (0.75 + 0.25 * dynamics);

    synthSettings.response.filterCutoff = 0.5 + 0.32 * brightness;
    synthSettings.atmosphere.filterCutoff = 0.26 + 0.24 * filterPressure;

    // The working level follows energy, so the arrangement gets louder as it
    // fills instead of handing the difference to the limiter.
    masterGain = MASTER_GAIN * (RESTING_TRIM + (1 - RESTING_TRIM) * controls.energy ** 0.5);

    drumSaturator.setDrive(drive);
    delay.setFeedback(controls.delayFeedback * 0.7);
    // The room grows and darkens as the arrangement releases, which is the
    // lift-off wash the brief asks for, and tightens again under load.
    reverb.set(controls.spatialDepth, 0.62 - 0.3 * brightness);
  }

  /** Triggers one melodic note on a lane. */
  function triggerSynth(lane, midi, lengthSteps, currentStep) {
    synths[lane].trigger(synthSettings[lane], midi);
    synthRelease[lane] = currentStep + Math.max(1, lengthSteps);
  }

  /** Everything that happens on a single sequencer step. */
  function handleStep(event) {
    stepsElapsed += 1;
    lastEvent = event;

    // 1. Boundaries first, so the step plays under the arrangement it belongs to.
    if (event.isPhraseStart) {
      const applied = commitAtBoundary(arranger, "phrase");
      if (applied.sceneChanged || applied.entered.length || applied.exited.length) {
        structuralEvents += 1;
      }
      for (const lane of LANES) {
        laneGain[lane.id].set(arranger.laneGoals[lane.id], crossfadeSamples);
      }
      delay.setTime("eighthDotted", applied.tempo, crossfadeSamples);
    } else if (event.isBarStart) {
      const applied = commitAtBoundary(arranger, "bar");
      if (applied.entered.length || applied.exited.length) structuralEvents += 1;
      for (const lane of LANES) {
        laneGain[lane.id].set(arranger.laneGoals[lane.id], crossfadeSamples);
      }
      delay.setTime("eighthDotted", applied.tempo, crossfadeSamples);
    }

    // A fill announces a coming climb, so it plays in the bar before the phrase
    // that introduces the new scene rather than after the fact.
    if (event.isBarStart) {
      const lastBarOfPhrase = event.barInPhrase === BARS_PER_PHRASE - 1;
      fillBar = lastBarOfPhrase && arranger.pendingScene > arranger.scene;
    }

    const scene = SCENES[arranger.scene];
    const patternStep = event.patternStep;
    const barInPhrase = event.barInPhrase;

    // The form advances one section per phrase, so forty bars pass before
    // anything repeats. Sections only ever turn over on a phrase boundary, like
    // every other structural change.
    if (event.isPhraseStart && stepsElapsed > 1) {
      sectionIndex += 1;
      // At a *standstill* the piece plays a phrase and then leaves one: holding a
      // resting arrangement continuously is the version that is unbearable at a
      // red light. Moving slowly is not a standstill, and gating the whole
      // half-time band this way emptied out everything below thirty.
      restingVoiced = controls.energy < STANDSTILL_ENERGY
        ? sectionIndex % 2 === 0
        : true;
    }
    const section = sectionAt(sectionIndex);
    const chord = harmonyForBar(sectionIndex, barInPhrase);

    // Adopt the section's theme voice. Everything the patch declares is copied
    // in; `refreshVoiceSettings` then writes the live controls over it.
    const namedVoice = RIFF_VOICES.includes(section.riffVoice) ? section.riffVoice : "riff";
    if (namedVoice !== riffVoice) {
      riffVoice = namedVoice;
      Object.assign(synthSettings.riff, score.synths[riffVoice]);
      refreshVoiceSettings();
    }

    // 2. Half-time reading: the transport keeps its tempo, the score takes only
    //    the strong placements and doubles its note lengths. This is how a
    //    standstill sounds slow without the clock being slow.
    const halfTime = scene.halfTime;
    const lengthScale = halfTime ? 2 : 1;
    const rhythmicStep = halfTime && patternStep % 2 !== 0 ? null : patternStep;

    // 3. Percussion.
    if (rhythmicStep !== null) {
      const kickVelocity = score.patterns.kick[rhythmicStep];
      if (kickVelocity > 0 && arranger.laneGoals.kick > 0) {
        drums.kick.trigger(score.kit.kick);
      }

      if (arranger.laneGoals.snare > 0) {
        const snareVelocity = score.patterns.snare[rhythmicStep];
        if (snareVelocity >= 0.9) drums.snare.trigger(score.kit.snare);
        else if (snareVelocity > 0 && controls.ghostWeight > 0.15) {
          drums.ghost.trigger(score.kit.ghost);
        }
        if (score.patterns.clap[rhythmicStep] > 0) drums.clap.trigger(score.kit.clap);
      }

      if (arranger.laneGoals.breakDetail > 0 && score.patterns.breakDetail[rhythmicStep] > 0) {
        drums.ghost.trigger(score.kit.ghost);
      }

      if (arranger.laneGoals.closedHat > 0) {
        // Hat subdivision is continuous articulation, not structure, so it may
        // change between boundaries.
        const hatPattern = controls.hatSubdivision >= 3
          ? score.patterns.closedHatSixteenths
          : score.patterns.closedHatEighths;
        const useStep = controls.hatSubdivision <= 1 && patternStep % 4 !== 0 ? -1 : rhythmicStep;
        if (useStep >= 0 && hatPattern[useStep] > 0) {
          drums.closedHat.trigger(score.kit.closedHat);
          drums.openHat.choke();
        }
      }

      if (arranger.laneGoals.openHat > 0 && score.patterns.openHat[rhythmicStep] > 0) {
        drums.openHat.trigger(score.kit.openHat);
      }
    }

    // A fill is a bounded gesture, not a new section: extra snare articulation
    // through the final bar only.
    if (fillBar && score.patterns.fillSnare[patternStep] > 0 && arranger.laneGoals.snare > 0) {
      drums.ghost.trigger(score.kit.ghost);
    }

    // 4. Melodic lanes, all transposed by the current chord so the theme moves
    //    with the harmony instead of fighting it.
    for (const lane of SYNTH_LANES) {
      if (synthRelease[lane] === null || stepsElapsed < synthRelease[lane]) continue;
      if (lane === "atmosphere") {
        for (const voice of padVoices) voice.release();
      } else {
        synths[lane].release();
      }
      synthRelease[lane] = null;
    }

    if (arranger.laneGoals.sub > 0 && restingVoiced) {
      for (const note of score.subNotes) {
        if (note.at !== patternStep) continue;
        if (halfTime && note.at % 2 !== 0) continue;
        triggerSynth("sub", chord.bassMidi, note.steps * lengthScale, stepsElapsed);
      }
    }

    if (arranger.laneGoals.reese > 0) {
      for (const note of score.reeseNotes) {
        if (note.at !== patternStep) continue;
        const interval = bassInterval(chord, note.degree);
        triggerSynth("reese", chord.bassMidi + 12 + interval, note.steps * lengthScale, stepsElapsed);
      }
    }

    // The theme and its response are absolute pitches in the key, not offsets
    // from the chord. Transposing them with the harmony is what made them clash:
    // the chord root already moves under a line that is written to sit over all
    // four chords, and moving the line too put it a semitone off twice a cycle.
    if (arranger.laneGoals.riff > 0 && restingVoiced) {
      for (const note of section.theme) {
        if (note.at !== patternStep) continue;
        if (halfTime && note.at % 2 !== 0) continue;
        // Register rises with energy: the same theme, played higher and harder.
        const octave = controls.energy > 0.62 ? 12 : 0;
        triggerSynth("riff", note.midi + octave, note.steps * lengthScale, stepsElapsed);
      }
    }

    if (arranger.laneGoals.response > 0) {
      for (const note of section.response) {
        if (note.at !== patternStep) continue;
        triggerSynth("response", note.midi, note.steps * lengthScale, stepsElapsed);
      }
    }

    // The pad re-voices once per bar and holds the whole chord. Which voices
    // sound is continuous articulation: at low energy it states the chord
    // plainly, and the upper extension arrives with the arrangement.
    if (arranger.laneGoals.atmosphere > 0 && restingVoiced && patternStep % STEPS_PER_BAR === 0) {
      const voiced = controls.energy > 0.5 ? PAD_VOICES : PAD_VOICES - 1;
      for (let index = 0; index < padVoices.length; index += 1) {
        if (index >= voiced) {
          padVoices[index].release();
          continue;
        }
        padVoices[index].trigger(synthSettings.atmosphere, chord.bassMidi + 24 + chord.colour[index]);
      }
      synthRelease.atmosphere = stepsElapsed + STEPS_PER_BAR * 2;
    }
  }

  return {
    /**
     * Plays one voice on its own, with the score's own kit and voicings, at the
     * current point in the harmonic cycle. This is what the audio preview
     * auditions, so what it demonstrates is genuinely what the piece uses.
     *
     * Auditioning is deliberately independent of the arrangement: a lane that
     * is silent at a standstill can still be heard here.
     */
    audition(voiceId) {
      // The form is addressed by section and bar; asking for a bar alone returns
      // nothing, and every synth voice then threw on an undefined chord.
      const bar = Math.floor((lastEvent?.globalStep ?? 0) / STEPS_PER_BAR);
      const chord = harmonyForBar(sectionIndex, bar);
      const section = sectionAt(sectionIndex);
      if (drums[voiceId]) {
        drums[voiceId].trigger(score.kit[voiceId] ?? score.kit.snare);
        auditionSamples[voiceId] = Math.round(sampleRate * auditionSeconds(voiceId));
        return true;
      }
      if (voiceId === "atmosphere") {
        for (let index = 0; index < padVoices.length; index += 1) {
          padVoices[index].trigger(synthSettings.atmosphere, chord.bassMidi + 24 + chord.colour[index]);
        }
        auditionSamples.atmosphere = Math.round(sampleRate * auditionSeconds("atmosphere"));
        return true;
      }
      if (!synths[voiceId]) return false;
      const midi = voiceId === "sub"
        ? chord.bassMidi
        : voiceId === "reese"
          ? chord.bassMidi + 12
          : (voiceId === "response" ? section.response[0].midi : section.theme[0].midi);
      synths[voiceId].trigger(synthSettings[voiceId], midi);
      auditionSamples[voiceId] = Math.round(sampleRate * auditionSeconds(voiceId));
      return true;
    },

    /** Feeds the arrangement one block's worth of vehicle speed. */
    observe(speedKmh, deltaSeconds) {
      observeSpeed(arranger, speedKmh, deltaSeconds);
      controls = continuousControls(arranger);
      refreshVoiceSettings();
    },

    /** Renders `frameCount` stereo frames into the supplied channel arrays. */
    process(left, right, frameCount) {
      for (let frame = 0; frame < frameCount; frame += 1) {
        const event = clock.advance(arranger.committedTempo, sampleRate, swing);
        if (event) handleStep(event);

        // 1. Percussion. The kick and the backbeat hold the centre; the ghost
        //    field, the break detail and the hats are placed across the field,
        //    which is what makes the break read as a room rather than a line.
        const kickSample = drums.kick.tick() * levelOf("kick");
        const snareLevel = levelOf("snare");
        const snareSample = drums.snare.tick() * snareLevel;
        const breakLevel = levelOf("breakDetail");
        // The ghost and the clap ride the snare's level, so each needs its own
        // audition lift or the preview cannot demonstrate them at a standstill.
        const ghostLevel = auditioning("ghost") ? 1 : snareLevel;
        const clapLevel = auditioning("clap") ? 1 : snareLevel;
        const ghostSample = drums.ghost.tick() * ghostLevel * (0.72 + 0.5 * breakLevel);
        const hatSample = drums.closedHat.tick() * levelOf("closedHat");
        const openSample = drums.openHat.tick() * levelOf("openHat");
        const clapSample = drums.clap.tick() * 0.7 * clapLevel;

        // The saturator runs on the centred backbeat only. Driving the placed
        // material through it would fold the field back to the middle.
        const drumCentre = drumSaturator.tick(kickSample + snareSample);
        let percussionLeft = drumCentre;
        let percussionRight = drumCentre;
        const placed = [
          [ghostSample, PAN.ghost],
          [ghostSample * breakLevel * 0.55, PAN.breakDetail],
          [hatSample, PAN.closedHat],
          [openSample, PAN.openHat],
          [clapSample, PAN.clap],
        ];
        for (let index = 0; index < placed.length; index += 1) {
          const [sample, pan] = placed[index];
          percussionLeft += sample * pan[0];
          percussionRight += sample * pan[1];
        }

        // 2. Bass, ducked by the kick. The duck is what makes the low end
        //    breathe with the beat instead of masking it.
        sidechain.tick(kickSample);
        const duck = sidechain.duckGain(controls.duckDepth);
        const subSample = synths.sub.tick(synthSettings.sub) * levelOf("sub");
        // The reese is high-passed above the sub's own octave: the two share a
        // root, and without this separation they cancel as often as they add.
        const reeseSample = reeseHighPass.tick(
          synths.reese.tick(synthSettings.reese) * levelOf("reese"),
        );
        const bassBus = (subSample + reeseSample) * duck;

        // 3. Melodic material. The pad goes through the chorus, so the harmony
        //    is the widest thing in the mix and the rhythm stays tight.
        const riffSample = synths.riff.tick(synthSettings.riff) * levelOf("riff");
        const responseSample = synths.response.tick(synthSettings.response)
          * levelOf("response");
        let padStack = 0;
        for (let index = 0; index < padVoices.length; index += 1) {
          padStack += padVoices[index].tick(synthSettings.atmosphere);
        }
        // Four voices at one voice's level would be four times as loud, so the
        // stack is trimmed back to roughly the weight a single note carried.
        const padSample = padStack * 0.42 * levelOf("atmosphere");
        const [padLeft, padRight] = padChorus.tickStereo(padSample);

        let melodicLeft = riffSample * PAN.riff[0] + responseSample * PAN.response[0]
          + padLeft * 0.9;
        let melodicRight = riffSample * PAN.riff[1] + responseSample * PAN.response[1]
          + padRight * 0.9;

        // 4. Sends. The delay carries the melodic lanes and the ghost field; the
        //    reverb carries everything with detail but nothing with weight.
        const sendLevel = controls.spatialDepth * 0.62;
        const [delayLeft, delayRight] = delay.tickStereo(
          (riffSample + ghostSample * 0.3) * sendLevel,
          (responseSample + padSample * 0.5 + openSample * 0.25) * sendLevel,
        );

        const reverbSend = 0.24 + controls.spatialDepth * 0.5;
        const [reverbLeft, reverbRight] = reverb.tickStereo(
          (percussionLeft - drumCentre + snareSample * 0.5 + melodicLeft * 0.7) * reverbSend,
          (percussionRight - drumCentre + snareSample * 0.5 + melodicRight * 0.7) * reverbSend,
        );

        // 5. Sum. Only the kick and the sub reach the bus with their low end
        //    intact, so the two octaves that carry weight stay uncontested.
        const busLeft = drumCentre
          + melodicHighPassLeft.tick(percussionLeft - drumCentre + melodicLeft)
          + bassBus + delayLeft + reverbLeft;
        const busRight = drumCentre
          + melodicHighPassRight.tick(percussionRight - drumCentre + melodicRight)
          + bassBus + delayRight + reverbRight;

        // 6. Width opens with energy, and never below the crossover.
        const [wideLeft, wideRight] = width.tickStereo(
          busLeft, busRight, 1 + controls.spatialDepth * 0.5,
        );

        const [outLeft, outRight] = limiter.tickStereo(
          wideLeft * masterGain, wideRight * masterGain,
        );

        left[frame] = outLeft;
        right[frame] = outRight;
      }
    },

    /** Current musical state, for diagnostics and tests. */
    snapshot() {
      return {
        ...arrangementSnapshot(arranger),
        scoreId: score.id,
        scoreLabel: score.label,
        section: sectionAt(sectionIndex).name,
        riffVoice,
        chord: harmonyForBar(sectionIndex, lastEvent?.barInPhrase ?? 0).name,
        restingVoiced,
        step: lastEvent?.globalStep ?? 0,
        patternStep: lastEvent?.patternStep ?? 0,
        stepsElapsed,
        structuralEvents,
        fillBar,
      };
    },

    /** Exposed so tests can assert transport identity across a whole drive. */
    transportStep: () => stepsElapsed,
    stepsPerPattern: STEPS_PER_PATTERN,
    stepsPerPhrase: STEPS_PER_PHRASE,
  };
}
