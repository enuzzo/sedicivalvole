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
  TempoDelay,
  TubeSaturator,
} from "./dsp/effects.js";
import { SynthVoice } from "./dsp/synth-voice.js";
import { harmonyForBar, SCORE } from "./jungle-score.js";

/** Bars a lane takes to fade in or out. Entries and exits are crossfades. */
const LANE_CROSSFADE_SECONDS = 0.35;

/** Master trim. The limiter protects the ceiling; this sets the working level. */
const MASTER_GAIN = 0.62;

const SYNTH_LANES = ["sub", "reese", "riff", "response", "atmosphere"];

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
  const limiter = new LookaheadLimiter(sampleRate);
  delay.setTime("eighthDotted", arranger.committedTempo, 0);

  let controls = continuousControls(arranger);
  let fillBar = false;
  let lastEvent = null;
  let stepsElapsed = 0;
  let structuralEvents = 0;

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

    synthSettings.riff.filterCutoff = 0.38 + 0.38 * brightness;
    synthSettings.riff.filterEnvAmount = 0.2 + 0.24 * brightness;
    synthSettings.riff.volume = score.synths.riff.volume * (0.75 + 0.25 * dynamics);

    synthSettings.response.filterCutoff = 0.5 + 0.32 * brightness;
    synthSettings.atmosphere.filterCutoff = 0.26 + 0.24 * filterPressure;

    drumSaturator.setDrive(drive);
    delay.setFeedback(controls.delayFeedback * 0.7);
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
    const chord = harmonyForBar(barInPhrase);

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
      if (synthRelease[lane] !== null && stepsElapsed >= synthRelease[lane]) {
        synths[lane].release();
        synthRelease[lane] = null;
      }
    }

    if (arranger.laneGoals.sub > 0) {
      for (const note of score.subNotes) {
        if (note.at !== patternStep) continue;
        if (halfTime && note.at % 2 !== 0) continue;
        triggerSynth("sub", chord.bassMidi, note.steps * lengthScale, stepsElapsed);
      }
    }

    if (arranger.laneGoals.reese > 0) {
      for (const note of score.reeseNotes) {
        if (note.at !== patternStep) continue;
        triggerSynth("reese", chord.bassMidi + 12 + note.offset, note.steps * lengthScale, stepsElapsed);
      }
    }

    if (arranger.laneGoals.riff > 0) {
      for (const note of score.theme) {
        if (note.at !== patternStep) continue;
        if (halfTime && note.at % 2 !== 0) continue;
        // Register rises with energy: the same theme, played higher and harder.
        const octave = controls.energy > 0.62 ? 12 : 0;
        triggerSynth(
          "riff",
          chord.bassMidi + 24 + chord.rootOffset + note.offset + octave,
          note.steps * lengthScale,
          stepsElapsed,
        );
      }
    }

    if (arranger.laneGoals.response > 0) {
      for (const note of score.response) {
        if (note.at !== patternStep) continue;
        triggerSynth(
          "response",
          chord.bassMidi + 24 + chord.rootOffset + note.offset,
          note.steps * lengthScale,
          stepsElapsed,
        );
      }
    }

    // The pad re-voices once per bar and holds, adding tension colour as energy
    // rises rather than changing chord.
    if (arranger.laneGoals.atmosphere > 0 && patternStep % STEPS_PER_BAR === 0) {
      const tension = controls.energy > 0.55 ? chord.colour[3] : chord.colour[2];
      triggerSynth("atmosphere", chord.bassMidi + 24 + tension, STEPS_PER_BAR * 2, stepsElapsed);
    }
  }

  return {
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

        // Drums.
        const kickSample = drums.kick.tick() * laneGain.kick.next();
        const snareSample = (drums.snare.tick() + drums.ghost.tick() * 0.8)
          * laneGain.snare.next();
        const breakSample = laneGain.breakDetail.next();
        const hatSample = drums.closedHat.tick() * laneGain.closedHat.next();
        const openSample = drums.openHat.tick() * laneGain.openHat.next();
        const clapSample = drums.clap.tick() * 0.7;

        const drumBus = drumSaturator.tick(
          kickSample + snareSample * (0.7 + 0.3 * breakSample) + hatSample + openSample + clapSample,
        );

        // Bass, ducked by the kick. The duck is what makes the low end breathe
        // with the beat instead of masking it.
        sidechain.tick(kickSample);
        const duck = sidechain.duckGain(controls.duckDepth);
        const bassBus = (
          synths.sub.tick(synthSettings.sub) * laneGain.sub.next()
          + synths.reese.tick(synthSettings.reese) * laneGain.reese.next()
        ) * duck;

        // Melodic material, which is what feeds the delay.
        const riffSample = synths.riff.tick(synthSettings.riff) * laneGain.riff.next();
        const responseSample = synths.response.tick(synthSettings.response)
          * laneGain.response.next();
        const padSample = synths.atmosphere.tick(synthSettings.atmosphere)
          * laneGain.atmosphere.next();
        const melodic = riffSample + responseSample + padSample;

        // Static width plus a ping-pong delay: depth without a reverb pass.
        const sendLevel = controls.spatialDepth * 0.5;
        const [delayLeft, delayRight] = delay.tickStereo(
          riffSample * sendLevel, responseSample * sendLevel + padSample * sendLevel * 0.5,
        );

        const dryLeft = drumBus + bassBus + melodic - responseSample * 0.35;
        const dryRight = drumBus + bassBus + melodic - riffSample * 0.35;

        const [outLeft, outRight] = limiter.tickStereo(
          (dryLeft + delayLeft) * MASTER_GAIN,
          (dryRight + delayRight) * MASTER_GAIN,
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
