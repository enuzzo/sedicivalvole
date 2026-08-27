// JUNCTION — a listening sketch for the sample-sourced score.
//
// Development-time only, outside every build. It composes with the local
// MusicRadar libraries, which are royalty-free to use in music and explicitly
// not redistributable. Nothing here is copied into the repository; what would
// ship is the rendered arrangement. See THIRD_PARTY_NOTICES.md.
//
// **Nothing here is played by us.** Every riff, chord and phrase already exists
// in the pack, performed. This score arranges that material; it does not
// perform on it. An earlier version drove the rave multisamples with melodies
// of our own, which was the wrong idea twice over: it threw away the playing
// that is the reason to use a sample library at all, and it exposed a defect —
// notes were folded into range one at a time, so a line rising from B4 to D5
// came out of the piano as B3 falling to D3 and sounded out of tune, which it
// was.
//
// So the vocabulary is what Cyclick supplied and what its own readme describes:
// breakbeats, basslines, and synth one-shots grouped as chords "that can be
// used to make classic progressions".
//
// Everything plays at its own native rate. The tempo folder is chosen, never a
// stretch factor, so a tempo change is a change of recording. The one thing
// that is ours is the arrangement: which break is layered under which, which
// chord lands where, and the processing they all sit in.
//
// Usage:
//   node scripts/render-junction-sketch.mjs [--tempo 168] [--bars 192]

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  decode,
  libraryAvailable,
  loadChordHits,
  loopsAtTempo,
  LOOP_BARS,
} from "./sample-library.mjs";
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

/**
 * The progression, in E minor — the one key the jungle pack provides at every
 * tempo, so a tempo change can never become a key change.
 *
 * Each entry names a chord the pack actually contains, already voiced and
 * already performed. `bar` is which bar of the eight-bar cycle it lands on.
 * Everything here is diatonic to E minor, so the basslines sit under any of it.
 */
const PROGRESSION = [
  { bar: 0, chord: "Emin9" },
  { bar: 2, chord: "Cmaj7" },
  { bar: 4, chord: "Amin7" },
  { bar: 6, chord: "Bmin9" },
];

/**
 * Which pad instrument states the progression, per section.
 *
 * The pack ships the same chords voiced by several different synths, so the
 * harmony can change instrument without a note changing. That is the variety
 * this material offers, and it costs nothing to use.
 */
/**
 * Eight energy sections, each with three authored takes. A take changes its
 * break orchestration every two-bar phrase and rotates the supplied chord
 * voicings, but keeps the section's harmonic and dynamic purpose intact.
 */
const SECTIONS = [
  { id: "open", bass: true, pad: 1, drive: 0.04, space: 0.55, level: 0.54, takes: [
    { breakPhrases: [[], [], [], []], voicing: 0, stab: false },
    { breakPhrases: [[], [], ["D:01"], []], voicing: 3, stab: false },
    { breakPhrases: [[], ["A:02"], [], []], voicing: 6, stab: false },
  ] },
  { id: "enter", bass: true, pad: 0.95, drive: 0.1, space: 0.46, level: 0.72, takes: [
    { breakPhrases: [["A:01"], ["A:01"], ["A:02"], ["A:01"]], voicing: 1, stab: false },
    { breakPhrases: [["B:01"], ["B:02"], ["B:01"], ["A:02"]], voicing: 4, stab: false },
    { breakPhrases: [["D:01"], ["D:01"], ["C:01"], ["D:02"]], voicing: 7, stab: false },
  ] },
  { id: "build", bass: true, pad: 0.85, drive: 0.18, space: 0.38, level: 0.84, takes: [
    { breakPhrases: [["A:02"], ["A:02", "B:01"], ["B:01"], ["A:01", "B:02"]], voicing: 2, stab: true },
    { breakPhrases: [["C:01"], ["C:02", "A:01"], ["C:01", "B:02"], ["A:02", "C:02"]], voicing: 5, stab: true },
    { breakPhrases: [["D:02"], ["D:01", "B:01"], ["B:02", "D:02"], ["C:01", "D:01"]], voicing: 8, stab: true },
  ] },
  { id: "break", bass: true, pad: 0.7, drive: 0.26, space: 0.32, level: 0.92, takes: [
    { breakPhrases: [["B:02", "C:01"], ["B:01", "C:02"], ["C:01", "D:02"], ["B:02", "D:01"]], voicing: 3, stab: true },
    { breakPhrases: [["A:02", "D:01"], ["C:02", "D:02"], ["A:01", "B:02"], ["B:01", "C:01"]], voicing: 6, stab: true },
    { breakPhrases: [["D:02", "A:01"], ["B:02", "C:02"], ["D:01", "C:01"], ["A:02", "B:01"]], voicing: 9, stab: true },
  ] },
  { id: "full", bass: true, pad: 0.62, drive: 0.34, space: 0.28, level: 1, takes: [
    { breakPhrases: [["A:01", "C:02", "D:01"], ["A:02", "B:01", "D:02"], ["B:02", "C:01", "D:01"], ["A:01", "C:02", "D:02"]], voicing: 4, stab: true },
    { breakPhrases: [["B:01", "C:01", "D:02"], ["A:02", "C:02", "D:01"], ["A:01", "B:02", "C:01"], ["B:01", "C:02", "D:02"]], voicing: 7, stab: true },
    { breakPhrases: [["A:02", "B:02", "D:01"], ["A:01", "C:01", "D:02"], ["B:01", "C:02", "D:01"], ["A:02", "B:02", "C:01"]], voicing: 10, stab: true },
  ] },
  { id: "turn", bass: true, pad: 0.7, drive: 0.3, space: 0.32, level: 0.94, takes: [
    { breakPhrases: [["B:01", "D:02"], ["D:01"], ["B:02", "D:02"], ["C:01"]], voicing: 5, stab: true },
    { breakPhrases: [["C:02", "A:01"], ["A:02"], ["C:01", "D:01"], ["B:02"]], voicing: 8, stab: true },
    { breakPhrases: [["D:02", "C:01"], ["B:01"], ["A:02", "D:01"], ["C:02"]], voicing: 11, stab: true },
  ] },
  { id: "ease", bass: true, pad: 0.9, drive: 0.14, space: 0.46, level: 0.78, takes: [
    { breakPhrases: [["C:01", "A:02"], ["C:01"], ["A:01"], []], voicing: 6, stab: false },
    { breakPhrases: [["D:01", "B:02"], ["D:02"], ["B:01"], []], voicing: 9, stab: false },
    { breakPhrases: [["A:02", "C:02"], ["C:01"], ["D:01"], []], voicing: 12, stab: false },
  ] },
  { id: "rest", bass: true, pad: 1, drive: 0.05, space: 0.58, level: 0.58, takes: [
    { breakPhrases: [[], [], [], []], voicing: 7, stab: false },
    { breakPhrases: [[], [], [], ["D:02"]], voicing: 10, stab: false },
    { breakPhrases: [[], ["C:02"], [], []], voicing: 13, stab: false },
  ] },
];

const ARRANGEMENT = [0, 1, 2].flatMap((take) => SECTIONS.map((section) => ({
  ...section,
  ...section.takes[take],
  take,
})));

function parseArguments(argv) {
  const options = { tempo: 168, bars: ARRANGEMENT.length * 8 };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--tempo") options.tempo = Number.parseInt(argv[index + 1], 10);
    else if (argv[index] === "--bars") options.bars = Number.parseInt(argv[index + 1], 10);
  }
  return options;
}

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
  const options = parseArguments(process.argv.slice(2));
  if (!await libraryAvailable()) {
    throw new Error("the local sample library is not present; this sketch needs _references/");
  }

  const loops = await loopsAtTempo(options.tempo);
  const breaks = new Map();
  for (const set of ["A", "B", "C", "D"]) {
    for (const variant of ["01", "02"]) {
      const entry = loops.find((loop) => (
        loop.kind === "beat" && loop.set === set && loop.variant === variant
      ));
      if (entry) breaks.set(`${set}:${variant}`, await decode(entry.path, SAMPLE_RATE));
    }
  }
  const bassEntry = loops.find((loop) => loop.kind === "bass" && loop.key === "E");
  if (!bassEntry) throw new Error(`no bass loop in E at ${options.tempo} BPM`);
  const bass = await decode(bassEntry.path, SAMPLE_RATE);

  // Every chord the progression asks for, in every voicing the pack ships, so
  // the harmony can change instrument without a note changing.
  const hits = await loadChordHits(SAMPLE_RATE);
  const chords = new Map();
  for (const step of PROGRESSION) {
    const voicings = hits.filter((entry) => entry.chord === step.chord);
    if (voicings.length === 0) throw new Error(`the pack has no ${step.chord}`);
    chords.set(step.chord, voicings);
  }

  const loopFrames = Math.round((60 / options.tempo) * 4 * LOOP_BARS * SAMPLE_RATE);
  const barFrames = Math.round(loopFrames / LOOP_BARS);
  const stepFrames = Math.round(barFrames / STEPS_PER_BAR);
  const totalFrames = barFrames * options.bars;
  const left = new Float32Array(totalFrames);
  const right = new Float32Array(totalFrames);

  const saturator = new TubeSaturator(SAMPLE_RATE);
  const channel = new InstrumentChannel(SAMPLE_RATE);
  const reverb = new StereoReverb(SAMPLE_RATE);
  const width = new StereoWidth(SAMPLE_RATE);
  const limiter = new LookaheadLimiter(SAMPLE_RATE);
  const breakHighPassLeft = new OnePoleHighPass();
  const breakHighPassRight = new OnePoleHighPass();
  breakHighPassLeft.setFrequency(110, SAMPLE_RATE);
  breakHighPassRight.setFrequency(110, SAMPLE_RATE);

  /** Notes currently sounding. Melodic lines and pad hits both live here. */
  let voices = [];
  let smoothedLevel = ARRANGEMENT[0].level;
  let smoothedDrive = ARRANGEMENT[0].drive;
  let smoothedSpace = ARRANGEMENT[0].space;
  const used = new Set();

  for (let frame = 0; frame < totalFrames; frame += 1) {
    const bar = Math.floor(frame / barFrames);
    const section = ARRANGEMENT[Math.min(Math.floor(bar / 8), ARRANGEMENT.length - 1)];
    const inLoop = frame % loopFrames;

    // Structural triggers land exactly on a step. The only thing decided here is
    // *which* recording plays and *when* — never what it plays.
    if (frame % stepFrames === 0) {
      const step = Math.floor(inLoop / stepFrames) % (STEPS_PER_BAR * LOOP_BARS);
      const barInCycle = bar % 8;
      if (step === 0 && section.pad > 0) {
        const entry = PROGRESSION.find((chord) => chord.bar === barInCycle);
        if (entry) {
          const choices = chords.get(entry.chord);
          const selected = choices[(section.voicing + Math.floor(bar / 8)) % choices.length];
          const variation = noteVariation(bar * 7 + section.voicing);
          voices.push(new SamplerVoice(
            selected.buffer,
            variation.rate,
            section.pad * 0.46 * variation.gain,
            barFrames * 2,
          ));
          used.add(`${selected.instrument} ${entry.chord}`);
        }
      }

      // An off-beat restatement of the chord already sounding. Classic jungle
      // punctuation, and it costs one extra trigger.
      if (section.stab && step === 22 && barInCycle % 2 === 1) {
        const held = [...PROGRESSION].reverse().find((chord) => chord.bar <= barInCycle);
        if (held) {
          const choices = chords.get(held.chord);
          const selected = choices[(section.voicing + bar + 1) % choices.length];
          const variation = noteVariation(bar * 13 + 5);
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

    let breakLeft = 0;
    let breakRight = 0;
    const phraseBreaks = section.breakPhrases[Math.floor((bar % 8) / LOOP_BARS)];
    for (let index = 0; index < phraseBreaks.length; index += 1) {
      const layer = breaks.get(phraseBreaks[index]);
      if (!layer) continue;
      // Layers after the first sit back and to the sides: a thicker break, not
      // a louder one.
      const gain = index === 0 ? 1 : 0.4;
      const pan = index === 0 ? 0 : (index % 2 === 1 ? -0.4 : 0.4);
      breakLeft += layer.left[inLoop % layer.frames] * gain * (1 - Math.max(0, pan));
      breakRight += layer.right[inLoop % layer.frames] * gain * (1 + Math.min(0, pan));
    }

    let melodicLeft = 0;
    let melodicRight = 0;
    for (let index = 0; index < voices.length; index += 1) {
      const [voiceLeft, voiceRight] = voices[index].tick();
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

    const bassLeft = section.bass ? bass.left[inLoop % bass.frames] : 0;
    const bassRight = section.bass ? bass.right[inLoop % bass.frames] : 0;

    const [wideLeft, wideRight] = width.tickStereo(
      (bodyLeft + bassLeft + melodicLeft + wetLeft) * smoothedLevel,
      (bodyRight + bassRight + melodicRight + wetRight) * smoothedLevel,
      1.3,
    );

    const [outLeft, outRight] = limiter.tickStereo(wideLeft * 0.95, wideRight * 0.95);
    left[frame] = outLeft;
    right[frame] = outRight;
  }

  const out = resolve(PROJECT_ROOT, `renders/junction-sketch-${options.tempo}.wav`);
  await mkdir(dirname(out), { recursive: true });
  await writeWav(out, left, right, SAMPLE_RATE);

  let peak = 0;
  for (let frame = 0; frame < totalFrames; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
  }
  process.stdout.write(
    `\nJUNCTION — ${out}\n`
    + `${options.bars} bars at ${options.tempo} BPM in E minor`
    + ` · ${(totalFrames / SAMPLE_RATE).toFixed(1)}s`
    + ` · peak ${(20 * Math.log10(peak)).toFixed(1)} dB\n`
    + `breaks ${[...breaks.keys()].join(", ")} · bass ${bassEntry.name}\n`
    + `chords, all as supplied: ${[...used].join(", ")}\n\n`,
  );
}

await main();
