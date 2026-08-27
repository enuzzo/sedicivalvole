// A listening sketch for the second, sample-sourced score.
//
// Development-time only, and deliberately not part of any build. It composes
// with the local MusicRadar libraries — which are royalty-free to use in music
// and not redistributable — and writes one rendered arrangement. Nothing it
// reads is copied into the repository. See THIRD_PARTY_NOTICES.md.
//
// The sketch exists to answer one question before any of it is built for real:
// does layering these breaks under our own processing, growing by orchestration
// rather than by stretching anything, sound like a piece worth having?
//
// Every loop plays at its own native rate. Nothing is time-stretched, nothing is
// pitched. Density is the only thing that changes.
//
// Usage:
//   node scripts/render-sample-sketch.mjs [--tempo 168] [--bars 32]

import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decode, libraryAvailable, loopsAtTempo, LOOP_BARS } from "./sample-library.mjs";
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

/**
 * The arrangement, as densities of one piece — the same idea FRACTURE uses.
 *
 * `beats` names which break sets are layered; `bass` whether the bass loop is
 * in; `drive`, `space` and `tilt` are the processing that separates a resting
 * reading of the material from a full one.
 */
const DENSITIES = [
  { id: "rest", beats: [], bass: true, drive: 0.05, space: 0.55, tilt: 0.35, level: 0.5 },
  { id: "roll", beats: ["A"], bass: true, drive: 0.12, space: 0.42, tilt: 0.6, level: 0.72 },
  { id: "break", beats: ["A", "C"], bass: true, drive: 0.24, space: 0.3, tilt: 0.85, level: 0.88 },
  { id: "full", beats: ["A", "C", "B"], bass: true, drive: 0.36, space: 0.24, tilt: 1, level: 1 },
];

function parseArguments(argv) {
  const options = { tempo: 168, bars: 32 };
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
    const l = Math.max(-1, Math.min(1, left[frame]));
    const r = Math.max(-1, Math.min(1, right[frame]));
    body.writeInt16LE(Math.round(l * 32767), frame * 4);
    body.writeInt16LE(Math.round(r * 32767), frame * 4 + 2);
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

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!await libraryAvailable()) {
    throw new Error("the local sample library is not present; this sketch needs _references/");
  }

  const loops = await loopsAtTempo(options.tempo);
  const beats = new Map();
  for (const set of ["A", "B", "C", "D"]) {
    const entry = loops.find((loop) => loop.kind === "beat" && loop.set === set && loop.variant === "01");
    if (entry) beats.set(set, await decode(entry.path, SAMPLE_RATE));
  }
  // E is the one key present at every tempo, so the piece is in E and a tempo
  // change never becomes a key change.
  const bassEntry = loops.find((loop) => loop.kind === "bass" && loop.key === "E");
  if (!bassEntry) throw new Error(`no bass loop in E at ${options.tempo} BPM`);
  const bass = await decode(bassEntry.path, SAMPLE_RATE);

  const loopFrames = Math.round((60 / options.tempo) * 4 * LOOP_BARS * SAMPLE_RATE);
  const barFrames = Math.round(loopFrames / LOOP_BARS);
  const totalFrames = barFrames * options.bars;

  const left = new Float32Array(totalFrames);
  const right = new Float32Array(totalFrames);

  const saturator = new TubeSaturator(SAMPLE_RATE);
  const reverb = new StereoReverb(SAMPLE_RATE);
  const width = new StereoWidth(SAMPLE_RATE);
  const limiter = new LookaheadLimiter(SAMPLE_RATE);
  const tiltLeft = new OnePoleHighPass();
  const tiltRight = new OnePoleHighPass();
  tiltLeft.setFrequency(120, SAMPLE_RATE);
  tiltRight.setFrequency(120, SAMPLE_RATE);

  // Density climbs a step every eight bars, then comes back down, so one pass
  // demonstrates the build and the release.
  const plan = [];
  for (let bar = 0; bar < options.bars; bar += 1) {
    const step = Math.floor(bar / 8);
    plan.push(DENSITIES[Math.min(step, DENSITIES.length - 1)]);
  }

  let smoothedLevel = DENSITIES[0].level;
  let smoothedDrive = DENSITIES[0].drive;
  let smoothedSpace = DENSITIES[0].space;

  for (let frame = 0; frame < totalFrames; frame += 1) {
    const bar = Math.floor(frame / barFrames);
    const density = plan[Math.min(bar, plan.length - 1)];
    const inLoop = frame % loopFrames;

    // Continuous controls glide; which loops are playing changes only on a bar.
    smoothedLevel += (density.level - smoothedLevel) * 0.00004;
    smoothedDrive += (density.drive - smoothedDrive) * 0.00004;
    smoothedSpace += (density.space - smoothedSpace) * 0.00004;

    let breakLeft = 0;
    let breakRight = 0;
    for (let index = 0; index < density.beats.length; index += 1) {
      const layer = beats.get(density.beats[index]);
      if (!layer) continue;
      // Layers after the first sit back and to the sides: the point is a thicker
      // break, not a louder one.
      const gain = index === 0 ? 1 : 0.42;
      const pan = index === 0 ? 0 : (index % 2 === 1 ? -0.35 : 0.35);
      const sampleLeft = layer.left[inLoop % layer.frames] * gain;
      const sampleRight = layer.right[inLoop % layer.frames] * gain;
      breakLeft += sampleLeft * (1 - Math.max(0, pan));
      breakRight += sampleRight * (1 + Math.min(0, pan));
    }

    const bassLeft = density.bass ? bass.left[inLoop % bass.frames] : 0;
    const bassRight = density.bass ? bass.right[inLoop % bass.frames] : 0;

    const driven = saturator.tick((breakLeft + breakRight) * 0.5);
    saturator.setDrive(smoothedDrive);

    // The break is high-passed so the bass loop keeps the bottom to itself.
    const bodyLeft = tiltLeft.tick(breakLeft) * density.tilt + driven * 0.25;
    const bodyRight = tiltRight.tick(breakRight) * density.tilt + driven * 0.25;

    reverb.set(smoothedSpace, 0.45);
    const [wetLeft, wetRight] = reverb.tickStereo(
      bodyLeft * smoothedSpace * 0.5, bodyRight * smoothedSpace * 0.5,
    );

    const [wideLeft, wideRight] = width.tickStereo(
      (bodyLeft + bassLeft + wetLeft) * smoothedLevel,
      (bodyRight + bassRight + wetRight) * smoothedLevel,
      1.25,
    );

    const [outLeft, outRight] = limiter.tickStereo(wideLeft * 0.95, wideRight * 0.95);
    left[frame] = outLeft;
    right[frame] = outRight;
  }

  const out = resolve(PROJECT_ROOT, `renders/sample-sketch-${options.tempo}.wav`);
  await mkdir(dirname(out), { recursive: true });
  await writeWav(out, left, right, SAMPLE_RATE);

  let peak = 0;
  for (let frame = 0; frame < totalFrames; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
  }
  process.stdout.write(
    `\n${out}\n${options.bars} bars at ${options.tempo} BPM, key E`
    + ` · ${(totalFrames / SAMPLE_RATE).toFixed(1)}s`
    + ` · peak ${(20 * Math.log10(peak)).toFixed(1)} dB`
    + `\nbreaks: ${[...beats.keys()].join(", ")} · bass: ${bassEntry.name}\n\n`,
  );
}

await main();
