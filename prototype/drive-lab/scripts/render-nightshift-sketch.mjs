// NIGHTSHIFT — one authored synth-pop grammar around native 1980s drum takes.
//
// The ignored MusicRadar source WAVs are decoded only during development. The
// renderer prints complete, self-contained eight-bar mixes; no source loop or
// isolated stem can be recovered from the production bank.

import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decode } from "./sample-library.mjs";
import {
  NIGHTSHIFT_ARRANGEMENT,
  NIGHTSHIFT_BARS_PER_PERFORMANCE,
  NIGHTSHIFT_HARMONIC_IDENTITY,
  NIGHTSHIFT_HARMONY,
  nightshiftPerformanceFrames,
} from "./nightshift-form.mjs";
import {
  LookaheadLimiter,
  StereoChorus,
  StereoReverb,
  StereoWidth,
  TubeSaturator,
} from "../src/score/dsp/effects.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");
const SOURCE_ROOT = resolve(PROJECT_ROOT, "../../_references/audio/samples/80s/80s Pop Drums");
const SAMPLE_RATE = 48000;
const EDGE_FADE_FRAMES = Math.round(SAMPLE_RATE * 0.012);
const TAU = Math.PI * 2;

function writeWav(path, left, right) {
  const body = Buffer.alloc(left.length * 4);
  for (let frame = 0; frame < left.length; frame += 1) {
    body.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[frame])) * 32767), frame * 4);
    body.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[frame])) * 32767), frame * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + body.byteLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(body.byteLength, 40);
  return new Promise((done, reject) => {
    const stream = createWriteStream(path);
    stream.on("error", reject);
    stream.on("finish", done);
    stream.end(Buffer.concat([header, body]));
  });
}

function midiHz(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function chordAtBar(bar) {
  let cursor = 0;
  for (const chord of NIGHTSHIFT_HARMONY) {
    cursor += chord.bars;
    if (bar < cursor) return chord;
  }
  return NIGHTSHIFT_HARMONY.at(-1);
}

function oscillator(phase, warmth = 0.5) {
  return Math.sin(phase) * 0.76
    + Math.sin(phase * 2) * 0.16 * warmth
    + Math.sin(phase * 3) * 0.08 * warmth;
}

function sourcePath(bpm, role, variant) {
  const stem = role === "fill" ? "Fill" : "Beat";
  return resolve(SOURCE_ROOT, `${bpm}bpm/80PD_${stem}[${bpm}]-${String(variant).padStart(2, "0")}.wav`);
}

function bufferRms(buffer) {
  let power = 0;
  for (let index = 0; index < buffer.frames; index += 1) {
    power += buffer.left[index] ** 2 + buffer.right[index] ** 2;
  }
  return Math.sqrt(power / Math.max(1, buffer.frames * 2));
}

async function main() {
  const sourceBuffers = new Map();
  for (const section of NIGHTSHIFT_ARRANGEMENT) {
    for (const cell of section.drumCells) {
      const key = `${section.bpm}:${cell.role}:${cell.variant}`;
      if (sourceBuffers.has(key)) continue;
      const buffer = await decode(sourcePath(section.bpm, cell.role, cell.variant), SAMPLE_RATE);
      sourceBuffers.set(key, { ...buffer, normalizer: Math.min(2.5, 0.16 / Math.max(0.001, bufferRms(buffer))) });
    }
  }

  const timeline = [];
  let totalFrames = 0;
  for (const section of NIGHTSHIFT_ARRANGEMENT) {
    const frames = nightshiftPerformanceFrames(section.bpm, SAMPLE_RATE);
    timeline.push({ section, startFrame: totalFrames, frames });
    totalFrames += frames;
  }
  const left = new Float32Array(totalFrames);
  const right = new Float32Array(totalFrames);

  for (const { section, startFrame, frames } of timeline) {
    const beatFrames = SAMPLE_RATE * 60 / section.bpm;
    const barFrames = beatFrames * 4;
    const cellFrames = barFrames * 2;
    const limiter = new LookaheadLimiter(SAMPLE_RATE, 0.68);
    const saturatorLeft = new TubeSaturator(SAMPLE_RATE);
    const saturatorRight = new TubeSaturator(SAMPLE_RATE);
    saturatorLeft.setDrive(0.14 + section.bass * 0.8);
    saturatorRight.setDrive(0.14 + section.bass * 0.8);
    const chorus = new StereoChorus(SAMPLE_RATE);
    const reverb = new StereoReverb(SAMPLE_RATE);
    const width = new StereoWidth(SAMPLE_RATE);
    reverb.set(section.space, 0.54);
    const detune = (section.take - 2) * 0.0017;

    for (let localFrame = 0; localFrame < frames; localFrame += 1) {
      const time = localFrame / SAMPLE_RATE;
      const bar = Math.min(7, Math.floor(localFrame / barFrames));
      const beat = (localFrame / beatFrames) % 4;
      const chord = chordAtBar(bar);
      const cellIndex = Math.min(3, Math.floor(localFrame / cellFrames));
      const cell = section.drumCells[cellIndex];
      const drum = sourceBuffers.get(`${section.bpm}:${cell.role}:${cell.variant}`);
      const frameInCell = Math.max(0, Math.floor(localFrame - cellIndex * cellFrames));
      const drumFrame = Math.min(drum.frames - 1, frameInCell);
      const drumEnvelope = Math.min(1, frameInCell / 180, (cellFrames - frameInCell) / 180);
      let drumLeft = drum.left[drumFrame] * drum.normalizer * section.drum * drumEnvelope;
      let drumRight = drum.right[drumFrame] * drum.normalizer * section.drum * drumEnvelope;

      // A wide, gently breathing poly-synth. The voicing changes every one or
      // two complete bars while its modulation remains free of a clock.
      const breath = 0.82 + 0.18 * Math.sin(TAU * (0.071 + section.take * 0.003) * time + section.take);
      let padMono = 0;
      for (let noteIndex = 0; noteIndex < chord.notes.length; noteIndex += 1) {
        const hz = midiHz(chord.notes[noteIndex]);
        const phase = TAU * hz * time;
        padMono += oscillator(phase * (1 + detune * (noteIndex - 2)), 0.34) / chord.notes.length;
      }
      padMono *= 0.115 * breath;
      const [chorusLeft, chorusRight] = chorus.tickStereo(padMono);
      let synthLeft = padMono * 0.52 + chorusLeft * 0.88;
      let synthRight = padMono * 0.52 + chorusRight * 0.88;

      // Bass appears only after the initial 85 BPM lane. Its one-bar phrase
      // leaves two deliberate rests, so road energy never means constant notes.
      if (section.bass > 0) {
        const bassStep = Math.floor(beat * 2);
        const bassPattern = [1, 0, 0.55, 0, 0.72, 0, 0.48, 0];
        const inStep = (beat * 2) % 1;
        const envelope = bassPattern[bassStep] * Math.exp(-inStep * 4.2);
        const bass = oscillator(TAU * midiHz(chord.root) * time, 0.18) * envelope * section.bass;
        synthLeft += bass;
        synthRight += bass;
      }

      // The arp grows from eighth-notes to sixteenths only above 80 km/h.
      if (section.arp > 0) {
        const division = section.bpm >= 120 ? 4 : 2;
        const arpStep = Math.floor((localFrame / beatFrames) * division);
        const note = chord.notes[(arpStep + section.take) % chord.notes.length] + 12;
        const inStep = ((localFrame / beatFrames) * division) % 1;
        const gate = inStep < 0.62 ? Math.sin(Math.PI * inStep / 0.62) : 0;
        const arp = oscillator(TAU * midiHz(note) * time, 0.22) * gate * section.arp;
        synthLeft += arp * (arpStep % 2 ? 0.68 : 0.3);
        synthRight += arp * (arpStep % 2 ? 0.3 : 0.68);
      }

      if (section.lead > 0 && bar >= 6) {
        const phrase = [69, 72, 76, 74, 72, 69, 67, 64];
        const noteStep = Math.floor((localFrame / beatFrames) * 2) % phrase.length;
        const inStep = ((localFrame / beatFrames) * 2) % 1;
        const gate = inStep < 0.44 ? Math.sin(Math.PI * inStep / 0.44) : 0;
        const lead = oscillator(TAU * midiHz(phrase[noteStep]) * time, 0.1) * gate * section.lead;
        synthLeft += lead * 0.72;
        synthRight += lead * 0.56;
      }

      const saturatedLeft = saturatorLeft.tick(synthLeft);
      const saturatedRight = saturatorRight.tick(synthRight);
      const [wetLeft, wetRight] = reverb.tickStereo(saturatedLeft * 0.14, saturatedRight * 0.14);
      const [wideLeft, wideRight] = width.tickStereo(
        drumLeft + saturatedLeft + wetLeft * section.space,
        drumRight + saturatedRight + wetRight * section.space,
        1.28,
      );
      const edge = Math.min(1, (localFrame + 1) / EDGE_FADE_FRAMES, (frames - localFrame) / EDGE_FADE_FRAMES);
      [drumLeft, drumRight] = limiter.tickStereo(wideLeft * edge, wideRight * edge);
      left[startFrame + localFrame] = drumLeft;
      right[startFrame + localFrame] = drumRight;
    }
  }

  const output = resolve(PROJECT_ROOT, "renders/nightshift-sketch-adaptive.wav");
  await mkdir(dirname(output), { recursive: true });
  await writeWav(output, left, right);
  let peak = 0;
  let power = 0;
  for (let frame = 0; frame < totalFrames; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
    power += left[frame] ** 2 + right[frame] ** 2;
  }
  const report = {
    sourceRecordingsUsed: sourceBuffers.size,
    selfContainedSections: true,
    mixing: "single-synchronous-performance",
    harmonicIdentity: NIGHTSHIFT_HARMONIC_IDENTITY,
    harmonicGrammar: NIGHTSHIFT_HARMONY.map(({ id }) => id),
    rawSourceAssetsPublished: false,
    barsPerPerformance: NIGHTSHIFT_BARS_PER_PERFORMANCE,
    sectionEdgeFadeMilliseconds: EDGE_FADE_FRAMES / SAMPLE_RATE * 1000,
    samplePeakDbfs: 20 * Math.log10(peak),
    rmsDbfs: 20 * Math.log10(Math.sqrt(power / (totalFrames * 2))),
  };
  await writeFile(resolve(PROJECT_ROOT, "renders/nightshift-sketch-adaptive.json"), JSON.stringify(report, null, 2));
  process.stdout.write(
    `NIGHTSHIFT — ${NIGHTSHIFT_ARRANGEMENT.length} complete eight-bar performances`
    + ` · ${sourceBuffers.size} native drum recordings · ${(totalFrames / SAMPLE_RATE).toFixed(1)}s\n`
    + `85–140 BPM · ${report.rmsDbfs.toFixed(2)} dBFS RMS · ${report.samplePeakDbfs.toFixed(2)} dBFS peak\n`,
  );
}

await main();
