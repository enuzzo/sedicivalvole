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
//   node scripts/render-junction-sketch.mjs [--tempo 168] [--bars 64]

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
const PAD_VOICES = ["WaveStrings", "EmmPad", "JayPad", "V-String", "ModStrings", "FifthHit"];

/**
 * Eight sections of eight bars. Density climbs and releases; which break sets
 * are layered and which synth carries the chords turn over as it goes.
 */
const SECTIONS = [
  { id: "open", breaks: [], bass: true, pad: 1, padVoice: 0, stab: false, drive: 0.04, space: 0.55, level: 0.54 },
  { id: "enter", breaks: ["A"], bass: true, pad: 0.95, padVoice: 1, stab: false, drive: 0.1, space: 0.46, level: 0.72 },
  { id: "build", breaks: ["A"], bass: true, pad: 0.85, padVoice: 2, stab: true, drive: 0.18, space: 0.38, level: 0.84 },
  { id: "break", breaks: ["A", "C"], bass: true, pad: 0.7, padVoice: 3, stab: true, drive: 0.26, space: 0.32, level: 0.92 },
  { id: "full", breaks: ["A", "C", "B"], bass: true, pad: 0.62, padVoice: 4, stab: true, drive: 0.34, space: 0.28, level: 1 },
  { id: "turn", breaks: ["A", "D"], bass: true, pad: 0.7, padVoice: 5, stab: true, drive: 0.3, space: 0.32, level: 0.94 },
  { id: "ease", breaks: ["A"], bass: true, pad: 0.9, padVoice: 2, stab: false, drive: 0.14, space: 0.46, level: 0.78 },
  { id: "rest", breaks: [], bass: true, pad: 1, padVoice: 0, stab: false, drive: 0.05, space: 0.58, level: 0.58 },
];

function parseArguments(argv) {
  const options = { tempo: 168, bars: 64 };
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
    const entry = loops.find((loop) => (
      loop.kind === "beat" && loop.set === set && loop.variant === "01"
    ));
    if (entry) breaks.set(set, await decode(entry.path, SAMPLE_RATE));
  }
  const bassEntry = loops.find((loop) => loop.kind === "bass" && loop.key === "E");
  if (!bassEntry) throw new Error(`no bass loop in E at ${options.tempo} BPM`);
  const bass = await decode(bassEntry.path, SAMPLE_RATE);

  // Every chord the progression asks for, in every voicing the pack ships, so
  // the harmony can change instrument without a note changing.
  const hits = await loadChordHits(SAMPLE_RATE);
  const chords = new Map();
  for (const step of PROGRESSION) {
    const anyVoicing = hits.find((entry) => entry.chord === step.chord);
    if (!anyVoicing) throw new Error(`the pack has no ${step.chord}`);
    for (const voice of PAD_VOICES) {
      // A voicing this synth does not have falls back to one that does, rather
      // than dropping the chord out of the progression.
      const hit = hits.find((entry) => entry.chord === step.chord && entry.instrument === voice);
      chords.set(`${voice}:${step.chord}`, (hit ?? anyVoicing).buffer);
    }
  }

  const loopFrames = Math.round((60 / options.tempo) * 4 * LOOP_BARS * SAMPLE_RATE);
  const barFrames = Math.round(loopFrames / LOOP_BARS);
  const stepFrames = Math.round(barFrames / STEPS_PER_BAR);
  const totalFrames = barFrames * options.bars;
  const barsPerSection = Math.max(1, Math.floor(options.bars / SECTIONS.length));

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
  let smoothedLevel = SECTIONS[0].level;
  let smoothedDrive = SECTIONS[0].drive;
  let smoothedSpace = SECTIONS[0].space;
  const used = new Set();

  for (let frame = 0; frame < totalFrames; frame += 1) {
    const bar = Math.floor(frame / barFrames);
    const section = SECTIONS[Math.min(Math.floor(bar / barsPerSection), SECTIONS.length - 1)];
    const inLoop = frame % loopFrames;

    // Structural triggers land exactly on a step. The only thing decided here is
    // *which* recording plays and *when* — never what it plays.
    if (frame % stepFrames === 0) {
      const step = Math.floor(inLoop / stepFrames) % (STEPS_PER_BAR * LOOP_BARS);
      const barInCycle = bar % 8;
      const voice = PAD_VOICES[section.padVoice % PAD_VOICES.length];

      if (step === 0 && section.pad > 0) {
        const entry = PROGRESSION.find((chord) => chord.bar === barInCycle);
        if (entry) {
          const variation = noteVariation(bar * 7 + section.padVoice);
          voices.push(new SamplerVoice(
            chords.get(`${voice}:${entry.chord}`),
            variation.rate,
            section.pad * 0.46 * variation.gain,
            barFrames * 2,
          ));
          used.add(`${voice} ${entry.chord}`);
        }
      }

      // An off-beat restatement of the chord already sounding. Classic jungle
      // punctuation, and it costs one extra trigger.
      if (section.stab && step === 22 && barInCycle % 2 === 1) {
        const held = [...PROGRESSION].reverse().find((chord) => chord.bar <= barInCycle);
        if (held) {
          const variation = noteVariation(bar * 13 + 5);
          voices.push(new SamplerVoice(
            chords.get(`${voice}:${held.chord}`),
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
    for (let index = 0; index < section.breaks.length; index += 1) {
      const layer = breaks.get(section.breaks[index]);
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
