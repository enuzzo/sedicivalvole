// JUNCTION — a listening sketch for the sample-sourced score.
//
// Development-time only, outside every build. It composes with the local
// MusicRadar libraries, which are royalty-free to use in music and explicitly
// not redistributable. Nothing here is copied into the repository; what would
// ship is the rendered arrangement. See THIRD_PARTY_NOTICES.md.
//
// Performed break, bass and chord loops are arranged at their native rate. The
// nested rave multisample library is deliberately absent: JUNCTION prints one
// stable E-minor bed with controlled vertical rhythm and low-end layers, not an
// automatic lead or a roulette of tonal identities.
//
// Everything plays at its own native rate. The tempo folder is chosen, never a
// stretch factor, so a tempo change is a change of recording. The arrangement,
// break phrasing, dynamics and processing are ours.
//
// Usage:
//   node scripts/render-junction-sketch.mjs

import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  decode,
  libraryAvailable,
  loadBonusBeatsAtTempo,
  loadChordHits,
  loopsAtTempo,
  LOOP_BARS,
} from "./sample-library.mjs";
import {
  JUNCTION_ARRANGEMENT,
  JUNCTION_BARS_PER_SECTION,
  JUNCTION_HARMONIC_IDENTITY,
  JUNCTION_HARMONY,
  junctionSectionFrames,
} from "./junction-form.mjs";
import {
  LookaheadLimiter,
  StereoReverb,
  StereoWidth,
  TubeSaturator,
} from "../src/score/dsp/effects.js";
import { OnePoleHighPass } from "../src/score/dsp/primitives.js";
import { InstrumentChannel, noteVariation } from "../src/score/dsp/instrument-channel.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");
const SAMPLE_RATE = 48000;
const STEPS_PER_BAR = 16;
const SECTION_EDGE_FADE_FRAMES = Math.round(SAMPLE_RATE * 0.008);

/**
 * The progression, in E minor — the one key the jungle pack provides at every
 * tempo, so a tempo change can never become a key change.
 *
 * Each entry names a chord the pack actually contains, already voiced and
 * already performed. `bar` is which bar of the eight-bar cycle it lands on.
 * Everything here is diatonic to E minor, so the basslines sit under any of it.
 */
const ALL_PROGRESSION_STEPS = JUNCTION_HARMONY;

function writeWav(path, left, right, sampleRate) {
  const frames = left.length;
  const dataBytes = frames * 4;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataBytes, 40);
  const body = Buffer.alloc(dataBytes);
  for (let frame = 0; frame < frames; frame += 1) {
    body.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[frame])) * 32767), frame * 4);
    body.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[frame])) * 32767), frame * 4 + 2);
  }
  return new Promise((resolvePromise, reject) => {
    const stream = createWriteStream(path);
    stream.on("error", reject);
    stream.on("finish", resolvePromise);
    stream.write(header);
    stream.write(body);
    stream.end();
  });
}

/** One sounding note: a buffer, a read position, a rate, and a release tail. */
class SamplerVoice {
  constructor(buffer, rate, gain, holdFrames) {
    this.buffer = buffer;
    this.rate = rate;
    this.gain = gain;
    this.position = 0;
    this.hold = holdFrames;
    this.release = 1;
    // A short fade in, because a sample started at a zero crossing it does not
    // have will click, and this material is full of steep attacks.
    this.attack = 0;
  }

  done() {
    return this.position >= this.buffer.frames - 1 || this.release < 0.0005;
  }

  tick() {
    if (this.done()) return [0, 0];
    const index = Math.floor(this.position);
    const blend = this.position - index;
    const next = Math.min(index + 1, this.buffer.frames - 1);
    const left = this.buffer.left[index] * (1 - blend) + this.buffer.left[next] * blend;
    const right = this.buffer.right[index] * (1 - blend) + this.buffer.right[next] * blend;

    this.position += this.rate;
    if (this.attack < 1) this.attack = Math.min(1, this.attack + 0.004);
    if (this.hold > 0) this.hold -= 1;
    else this.release *= 0.99985;

    const level = this.gain * this.attack * this.release;
    return [left * level, right * level];
  }
}

async function main() {
  if (!await libraryAvailable()) {
    throw new Error("the local sample library is not present; this sketch needs _references/");
  }

  const beatBuffers = new Map();
  const bassBuffers = new Map();
  const jungleTempos = new Set(
    JUNCTION_ARRANGEMENT
      .filter((section) => section.beatSource === "jungle" || section.bass)
      .map((section) => section.bpm),
  );
  for (const tempo of jungleTempos) {
    const loops = await loopsAtTempo(tempo);
    for (const entry of loops) {
      if (entry.kind === "beat") {
        beatBuffers.set(
          `${tempo}:jungle:${entry.set}:${entry.variant}`,
          await decode(entry.path, SAMPLE_RATE),
        );
      } else if (entry.kind === "bass") {
        bassBuffers.set(`${tempo}:${entry.key}`, await decode(entry.path, SAMPLE_RATE));
      }
    }
    for (const progression of ALL_PROGRESSION_STEPS) {
      if (!progression.bassKeys.some((key) => bassBuffers.has(`${tempo}:${key}`))) {
        throw new Error(`no consonant bass for ${progression.chord} at ${tempo} BPM`);
      }
    }
  }

  const bonusTempos = new Set(
    JUNCTION_ARRANGEMENT
      .filter((section) => section.beatSource === "bonus")
      .map((section) => section.bpm),
  );
  for (const tempo of bonusTempos) {
    for (const entry of await loadBonusBeatsAtTempo(tempo, SAMPLE_RATE)) {
      beatBuffers.set(`${tempo}:bonus:${entry.id}`, entry.buffer);
    }
  }

  // Every chord the progression asks for, in every voicing the pack ships, so
  // the harmony can change instrument without a note changing.
  const hits = await loadChordHits(SAMPLE_RATE);
  const chords = new Map();
  for (const step of ALL_PROGRESSION_STEPS) {
    if (chords.has(step.chord)) continue;
    const voicings = hits.filter((entry) => entry.chord === step.chord);
    if (voicings.length === 0) throw new Error(`the pack has no ${step.chord}`);
    chords.set(step.chord, voicings);
  }
  let nextStartFrame = 0;
  const timeline = JUNCTION_ARRANGEMENT.map((section, index) => {
    const barFrames = Math.round((60 / section.bpm) * 4 * SAMPLE_RATE);
    const sectionFrames = junctionSectionFrames(section, SAMPLE_RATE);
    const entry = { section, index, startFrame: nextStartFrame, barFrames, sectionFrames };
    nextStartFrame += sectionFrames;
    return entry;
  });
  const totalFrames = nextStartFrame;
  const left = new Float32Array(totalFrames);
  const right = new Float32Array(totalFrames);

  let saturator;
  let channel;
  let reverb;
  let width;
  let limiter;
  let breakHighPassLeft;
  let breakHighPassRight;

  /** Notes currently sounding. Melodic lines and pad hits both live here. */
  let voices = [];
  let smoothedLevel = JUNCTION_ARRANGEMENT[0].level;
  let smoothedDrive = JUNCTION_ARRANGEMENT[0].drive;
  let smoothedSpace = JUNCTION_ARRANGEMENT[0].space;
  const used = new Set();

  for (const timelineEntry of timeline) {
    const { section, index: sectionIndex, startFrame, barFrames, sectionFrames } = timelineEntry;
    const progression = JUNCTION_HARMONY;
    // Runtime can choose any clip after any other clip. Reset every stateful DSP
    // component and every held voice here so a rendered block cannot begin with
    // the reverb tail or chord release of its development-time neighbour.
    saturator = new TubeSaturator(SAMPLE_RATE);
    channel = new InstrumentChannel(SAMPLE_RATE);
    reverb = new StereoReverb(SAMPLE_RATE);
    width = new StereoWidth(SAMPLE_RATE);
    limiter = new LookaheadLimiter(SAMPLE_RATE);
    breakHighPassLeft = new OnePoleHighPass();
    breakHighPassRight = new OnePoleHighPass();
    breakHighPassLeft.setFrequency(110, SAMPLE_RATE);
    breakHighPassRight.setFrequency(110, SAMPLE_RATE);
    voices = [];
    smoothedLevel = section.level;
    smoothedDrive = section.drive;
    smoothedSpace = section.space;
    const loopFrames = barFrames * LOOP_BARS;
    const stepFrames = Math.round(barFrames / STEPS_PER_BAR);
    const phraseFrames = barFrames * LOOP_BARS;
    for (let localFrame = 0; localFrame < sectionFrames; localFrame += 1) {
      const frame = startFrame + localFrame;
      const barInCycle = Math.floor(localFrame / barFrames);
      const inLoop = localFrame % loopFrames;

      // Structural triggers land exactly on a step. The only thing decided here
      // is which supplied recording plays and when — never what it plays.
      if (localFrame % stepFrames === 0) {
        const step = Math.floor(inLoop / stepFrames) % (STEPS_PER_BAR * LOOP_BARS);
        if (step === 0 && section.pad > 0) {
          const entry = progression.find((chord) => chord.bar === barInCycle);
          const chordAllowed = !section.chordBars || section.chordBars.includes(barInCycle);
          if (entry && chordAllowed) {
            const choices = chords.get(entry.chord);
            const selected = choices[(section.voicing + sectionIndex) % choices.length];
            const variation = noteVariation(sectionIndex * 101 + barInCycle * 7 + section.voicing);
            voices.push(new SamplerVoice(
              selected.buffer,
              variation.rate,
              section.pad * 0.46 * variation.gain,
              barFrames * 2,
            ));
            used.add(`${selected.instrument} ${entry.chord}`);
          }
        }

        const held = [...progression].reverse().find((chord) => chord.bar <= barInCycle);

        // An off-beat restatement of the chord already sounding. Classic jungle
        // punctuation, and it costs one extra trigger.
        if (section.stab && step === 22 && barInCycle % 2 === 1) {
          if (held) {
            const choices = chords.get(held.chord);
            const selected = choices[(section.voicing + sectionIndex + barInCycle + 1) % choices.length];
            const variation = noteVariation(sectionIndex * 131 + barInCycle * 13 + 5);
            voices.push(new SamplerVoice(
              selected.buffer,
              variation.rate,
              section.pad * 0.22 * variation.gain,
              Math.round(barFrames * 0.4),
            ));
          }
        }

      }

      smoothedLevel += (section.level - smoothedLevel) * 0.00005;
      smoothedDrive += (section.drive - smoothedDrive) * 0.00005;
      smoothedSpace += (section.space - smoothedSpace) * 0.00005;

      const phraseIndex = Math.min(
        section.beatPhrases.length - 1,
        Math.floor(barInCycle / LOOP_BARS),
      );
      const phraseProgress = (localFrame % phraseFrames) / phraseFrames;
      const currentBeatLevel = section.beatLevels[phraseIndex];
      const nextBeatLevel = section.beatLevels[Math.min(phraseIndex + 1, section.beatLevels.length - 1)];
      const beatLevel = currentBeatLevel + (nextBeatLevel - currentBeatLevel) * phraseProgress;
      let breakLeft = 0;
      let breakRight = 0;
      const phraseBreaks = section.beatPhrases[phraseIndex];
      for (let layerIndex = 0; layerIndex < phraseBreaks.length; layerIndex += 1) {
        const id = phraseBreaks[layerIndex];
        const key = section.beatSource === "bonus"
          ? `${section.bpm}:bonus:${id}`
          : `${section.bpm}:jungle:${id}`;
        const layer = beatBuffers.get(key);
        if (!layer) throw new Error(`missing authored beat ${key}`);
        used.add(`beat ${key}`);
        // Extra layers provide width and detail, never another full-level break.
        const layerGain = layerIndex === 0 ? 1 : 0.2;
        const pan = layerIndex === 0 ? 0 : (layerIndex % 2 === 1 ? -0.4 : 0.4);
        breakLeft += layer.left[inLoop % layer.frames] * layerGain * (1 - Math.max(0, pan));
        breakRight += layer.right[inLoop % layer.frames] * layerGain * (1 + Math.min(0, pan));
      }
      breakLeft *= beatLevel;
      breakRight *= beatLevel;

      let melodicLeft = 0;
      let melodicRight = 0;
      for (let voiceIndex = 0; voiceIndex < voices.length; voiceIndex += 1) {
        const [voiceLeft, voiceRight] = voices[voiceIndex].tick();
        melodicLeft += voiceLeft;
        melodicRight += voiceRight;
      }
      if (frame % 4096 === 0) voices = voices.filter((voice) => !voice.done());

    // The chords go through a channel strip: saturation, tone, drifting width,
    // and a pre-delayed filtered send into the shared room. Played flat they sat
    // dead centre and bone dry, which is what a cheap keyboard sounds like.
      channel.set({
        space: 0.36 + smoothedSpace * 0.45,
        drive: 0.18 + smoothedDrive * 0.5,
        width: 1.4,
        tone: 0.5,
        body: 0.6,
      });
      channel.refresh();
      const chordOut = channel.tick(melodicLeft, melodicRight, reverb);
      melodicLeft = chordOut[0];
      melodicRight = chordOut[1];

      saturator.setDrive(smoothedDrive);
      const driven = saturator.tick((breakLeft + breakRight) * 0.5);
      const bodyLeft = breakHighPassLeft.tick(breakLeft) + driven * 0.22;
      const bodyRight = breakHighPassRight.tick(breakRight) + driven * 0.22;

    // The breaks share the same room as the chords, at a much shorter send. One
    // space for the whole arrangement is what makes it one performance.
      reverb.set(smoothedSpace, 0.42);
      const [wetLeft, wetRight] = reverb.tickStereo(
        bodyLeft * smoothedSpace * 0.14, bodyRight * smoothedSpace * 0.14,
      );

      const bassStep = progression[Math.floor(barInCycle / LOOP_BARS)];
      const bassKey = bassStep.bassKeys.find((key) => bassBuffers.has(`${section.bpm}:${key}`));
      const bass = section.bass ? bassBuffers.get(`${section.bpm}:${bassKey}`) : null;
      if (bass) used.add(`bass ${section.bpm}:${bassKey}`);
      const bassLeft = bass ? bass.left[inLoop % bass.frames] * 0.68 : 0;
      const bassRight = bass ? bass.right[inLoop % bass.frames] * 0.68 : 0;

      const [wideLeft, wideRight] = width.tickStereo(
        (bodyLeft + bassLeft + melodicLeft + wetLeft) * smoothedLevel,
        (bodyRight + bassRight + melodicRight + wetRight) * smoothedLevel,
        1.3,
      );

      const [outLeft, outRight] = limiter.tickStereo(wideLeft * 0.95, wideRight * 0.95);
      const edgeGain = Math.min(
        1,
        (localFrame + 1) / SECTION_EDGE_FADE_FRAMES,
        (sectionFrames - localFrame) / SECTION_EDGE_FADE_FRAMES,
      );
      left[frame] = outLeft * edgeGain;
      right[frame] = outRight * edgeGain;
    }
  }

  const out = resolve(PROJECT_ROOT, "renders/junction-sketch-adaptive.wav");
  await mkdir(dirname(out), { recursive: true });
  await writeWav(out, left, right, SAMPLE_RATE);
  await writeFile(
    resolve(PROJECT_ROOT, "renders/junction-sketch-adaptive.json"),
    JSON.stringify({
      sourceRecordingsUsed: used.size,
      selfContainedSections: true,
      mixing: "single-synchronous-performance",
      harmonicIdentity: JUNCTION_HARMONIC_IDENTITY,
      tonalDecks: 1,
      automaticLead: false,
      raveMultisamples: false,
      sectionEdgeFadeMilliseconds: SECTION_EDGE_FADE_FRAMES / SAMPLE_RATE * 1000,
    }),
  );

  let peak = 0;
  for (let frame = 0; frame < totalFrames; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
  }
  process.stdout.write(
    `\nJUNCTION — ${out}\n`
    + `${JUNCTION_ARRANGEMENT.length * JUNCTION_BARS_PER_SECTION} bars at native 127–168 BPM in E minor`
    + ` · ${(totalFrames / SAMPLE_RATE).toFixed(1)}s`
    + ` · peak ${(20 * Math.log10(peak)).toFixed(1)} dB\n`
    + `${beatBuffers.size} native beat recordings · ${bassBuffers.size} matched bass recordings\n`
    + `${used.size} distinct source recordings used\n\n`,
  );
}

await main();
