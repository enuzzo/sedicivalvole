// JUNCTION — a listening sketch for the sample-sourced score.
//
// Development-time only, outside every build. It composes with the local
// MusicRadar libraries, which are royalty-free to use in music and explicitly
// not redistributable. Nothing here is copied into the repository; what would
// ship is the rendered arrangement. See THIRD_PARTY_NOTICES.md.
//
// The material is used two ways, and the difference is the point:
//
//   - the breaks and the bass are *loops*, played at their own native rate from
//     the tempo folder they belong to, never stretched and never pitched;
//   - the melodic instruments are *multisamples*, one file per chromatic note,
//     so the melodies are ours. Every note is played from its own sample at a
//     rate of exactly 1.0.
//
// Growth is orchestration: which breaks are layered, which instrument states
// the theme, whether the counter-line and the stabs are in. Nothing anywhere is
// time-stretched.
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
  loadInstrument,
  loopsAtTempo,
  LOOP_BARS,
  nearestNote,
} from "./sample-library.mjs";
import {
  LookaheadLimiter,
  StereoReverb,
  StereoWidth,
  TubeSaturator,
} from "../src/score/dsp/effects.js";
import { OnePoleHighPass } from "../src/score/dsp/primitives.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");
const SAMPLE_RATE = 48000;
const STEPS_PER_BAR = 16;

/**
 * The piece is in E minor, because E is the one key the jungle pack provides at
 * every tempo. A tempo change can then never become a key change.
 *
 * Themes are written as absolute pitches in that key, for the same reason
 * FRACTURE's are: a line that sits over the whole harmony reads as writing, and
 * a line dragged around by a chord root reads as arithmetic.
 */
const THEMES = {
  call: [
    { at: 0, midi: 71, steps: 4 },   // B4
    { at: 6, midi: 69, steps: 3 },   // A4
    { at: 10, midi: 67, steps: 4 },  // G4
    { at: 16, midi: 64, steps: 5 },  // E4
    { at: 24, midi: 67, steps: 3 },  // G4
    { at: 28, midi: 66, steps: 4 },  // F#4
  ],
  answer: [
    { at: 0, midi: 64, steps: 3 },   // E4
    { at: 5, midi: 67, steps: 3 },   // G4
    { at: 10, midi: 71, steps: 5 },  // B4
    { at: 18, midi: 69, steps: 3 },  // A4
    { at: 22, midi: 67, steps: 3 },  // G4
    { at: 26, midi: 64, steps: 6 },  // E4
  ],
  held: [
    { at: 0, midi: 71, steps: 8 },   // B4
    { at: 12, midi: 69, steps: 6 },  // A4
    { at: 20, midi: 67, steps: 8 },  // G4
  ],
  stabs: [
    { at: 2, midi: 76, steps: 2 },   // E5
    { at: 8, midi: 74, steps: 2 },   // D5
    { at: 14, midi: 71, steps: 2 },  // B4
    { at: 20, midi: 67, steps: 2 },  // G4
    { at: 26, midi: 69, steps: 2 },  // A4
  ],
};

/**
 * Eight sections of eight bars. Density climbs and then releases, and the
 * instrument stating the theme turns over as it goes, so a long listen hears
 * the same material through different voices rather than the same voice twice.
 */
const SECTIONS = [
  { id: "open", breaks: [], bass: true, pad: 1, lines: [], drive: 0.04, space: 0.6, level: 0.52 },
  { id: "enter", breaks: ["A"], bass: true, pad: 1, lines: [["RavePiano", "answer", 0.5]], drive: 0.1, space: 0.5, level: 0.7 },
  { id: "build", breaks: ["A"], bass: true, pad: 0.8, lines: [["Rave_Lead", "call", 0.42], ["RavePiano", "answer", 0.34]], drive: 0.18, space: 0.4, level: 0.82 },
  { id: "break", breaks: ["A", "C"], bass: true, pad: 0.6, lines: [["Rave_Lead", "call", 0.46], ["Short_String", "held", 0.34]], drive: 0.26, space: 0.32, level: 0.9 },
  { id: "full", breaks: ["A", "C", "B"], bass: true, pad: 0.5, lines: [["Rave_Lead", "call", 0.46], ["Stab_FX", "stabs", 0.3], ["Short_String", "held", 0.3]], drive: 0.34, space: 0.28, level: 1 },
  { id: "turn", breaks: ["A", "D"], bass: true, pad: 0.6, lines: [["Rave_Saw", "call", 0.42], ["Stab_FX", "stabs", 0.28]], drive: 0.3, space: 0.34, level: 0.94 },
  { id: "ease", breaks: ["A"], bass: true, pad: 0.9, lines: [["Short_String", "held", 0.4]], drive: 0.14, space: 0.5, level: 0.76 },
  { id: "rest", breaks: [], bass: true, pad: 1, lines: [], drive: 0.05, space: 0.62, level: 0.56 },
];

const INSTRUMENTS_USED = ["Rave_Lead", "RavePiano", "Short_String", "Rave_Saw", "Stab_FX"];

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

  const instruments = new Map();
  for (const name of INSTRUMENTS_USED) {
    instruments.set(name, await loadInstrument(name, SAMPLE_RATE));
  }

  const hits = await loadChordHits(SAMPLE_RATE);
  const pad = hits.find((hit) => hit.chord === "Emin9" && hit.instrument === "WaveStrings")
    ?? hits.find((hit) => hit.chord.startsWith("Emin"));
  if (!pad) throw new Error("no E minor chord one-shot found");

  const loopFrames = Math.round((60 / options.tempo) * 4 * LOOP_BARS * SAMPLE_RATE);
  const barFrames = Math.round(loopFrames / LOOP_BARS);
  const stepFrames = Math.round(barFrames / STEPS_PER_BAR);
  const totalFrames = barFrames * options.bars;
  const barsPerSection = Math.max(1, Math.floor(options.bars / SECTIONS.length));

  const left = new Float32Array(totalFrames);
  const right = new Float32Array(totalFrames);

  const saturator = new TubeSaturator(SAMPLE_RATE);
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

    // Structural triggers land exactly on a step; everything continuous glides.
    if (frame % stepFrames === 0) {
      const step = Math.floor(inLoop / stepFrames) % (STEPS_PER_BAR * LOOP_BARS);

      if (step === 0 && bar % 4 === 0 && section.pad > 0) {
        voices.push(new SamplerVoice(pad.buffer, 1, section.pad * 0.42, barFrames * 3));
      }
      for (const [name, themeId, gain] of section.lines) {
        const instrument = instruments.get(name);
        if (!instrument) continue;
        for (const note of THEMES[themeId]) {
          if (note.at !== step) continue;
          const { key, rate } = nearestNote(instrument, note.midi);
          used.add(name);
          voices.push(new SamplerVoice(
            instrument.notes.get(key), rate, gain, note.steps * stepFrames,
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

    saturator.setDrive(smoothedDrive);
    const driven = saturator.tick((breakLeft + breakRight) * 0.5);
    const bodyLeft = breakHighPassLeft.tick(breakLeft) + driven * 0.22;
    const bodyRight = breakHighPassRight.tick(breakRight) + driven * 0.22;

    reverb.set(smoothedSpace, 0.42);
    const [wetLeft, wetRight] = reverb.tickStereo(
      (bodyLeft * 0.3 + melodicLeft) * smoothedSpace * 0.6,
      (bodyRight * 0.3 + melodicRight) * smoothedSpace * 0.6,
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
    + `breaks ${[...breaks.keys()].join(", ")} · bass ${bassEntry.name}`
    + ` · pad ${pad.instrument} ${pad.chord}\n`
    + `instruments played: ${[...used].join(", ")}\n\n`,
  );
}

await main();
