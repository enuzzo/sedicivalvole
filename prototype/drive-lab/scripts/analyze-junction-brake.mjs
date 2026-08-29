#!/usr/bin/env node

// Recompute the JUNCTION full-brake calibration from the tracked encoded bank.
//
// This is deliberately independent of the development-only sample library. It
// reads only public/audio/junction.svb, decodes each self-contained performance
// with FFmpeg, applies the browser graph's full-depth DSP and measures the same
// listener-facing quantities recorded in analysis/junction-brake-calibration.json.

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { parseJunctionBank } from "../src/junction-bank.js";
import {
  createJunctionBrakeCurve,
  JUNCTION_BRAKE_CALIBRATION,
} from "../src/junction-brake.js";

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, "..");
const DEFAULT_BANK = path.join(PROJECT_ROOT, "public/audio/junction.svb");
const DEFAULT_REPORT = path.join(PROJECT_ROOT, "analysis/junction-brake-calibration.json");
const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const HIGH_BAND_HZ = 2000;
const HIGH_BAND_SKIP_SECONDS = 0.5;
const CHECK_TOLERANCE = 0.025;

function finiteDb(value) {
  return 20 * Math.log10(Math.max(Math.abs(value), 1e-12));
}

function roundMetric(value) {
  return Number(value.toFixed(6));
}

function biquadTick(coefficients) {
  const { b0, b1, b2, a1, a2 } = coefficients;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (input) => {
    const output = b0 * input + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = input;
    y2 = y1;
    y1 = output;
    return output;
  };
}

/** RBJ low-pass coefficients used by Web Audio's BiquadFilterNode contract. */
export function lowPassCoefficients(frequencyHz, q, sampleRate = SAMPLE_RATE) {
  const omega = (2 * Math.PI * frequencyHz) / sampleRate;
  const cosine = Math.cos(omega);
  const alpha = Math.sin(omega) / (2 * q);
  const a0 = 1 + alpha;
  return {
    b0: ((1 - cosine) * 0.5) / a0,
    b1: (1 - cosine) / a0,
    b2: ((1 - cosine) * 0.5) / a0,
    a1: (-2 * cosine) / a0,
    a2: (1 - alpha) / a0,
  };
}

function shapeFromCurve(input, curve) {
  const clamped = Math.min(1, Math.max(-1, input));
  const position = ((clamped + 1) * 0.5) * (curve.length - 1);
  const index = Math.min(curve.length - 2, Math.floor(position));
  const fraction = position - index;
  return curve[index] * (1 - fraction) + curve[index + 1] * fraction;
}

export function applyFullBrake(left, right, sampleRate = SAMPLE_RATE) {
  if (left.length !== right.length) throw new Error("JUNCTION PCM channel lengths differ");
  const coefficients = lowPassCoefficients(
    JUNCTION_BRAKE_CALIBRATION.cutoffHz,
    JUNCTION_BRAKE_CALIBRATION.fullQ,
    sampleRate,
  );
  const filterLeft = biquadTick(coefficients);
  const filterRight = biquadTick(coefficients);
  const curve = createJunctionBrakeCurve();
  const processedLeft = new Float32Array(left.length);
  const processedRight = new Float32Array(right.length);
  const {
    filteredMix,
    residualMix,
    makeupGain,
  } = JUNCTION_BRAKE_CALIBRATION;

  for (let frame = 0; frame < left.length; frame += 1) {
    const summedLeft = filterLeft(left[frame]) * filteredMix + left[frame] * residualMix;
    const summedRight = filterRight(right[frame]) * filteredMix + right[frame] * residualMix;
    processedLeft[frame] = shapeFromCurve(summedLeft, curve) * makeupGain;
    processedRight[frame] = shapeFromCurve(summedRight, curve) * makeupGain;
  }
  return { left: processedLeft, right: processedRight };
}

/** ITU-R BS.1770 K-weighted integrated loudness at 48 kHz. */
export function integratedLoudness(left, right, sampleRate = SAMPLE_RATE) {
  if (sampleRate !== SAMPLE_RATE) throw new Error("JUNCTION calibration requires 48000 Hz PCM");
  const shelf = {
    b0: 1.53512485958697,
    b1: -2.69169618940638,
    b2: 1.19839281085285,
    a1: -1.69065929318241,
    a2: 0.73248077421585,
  };
  const highPass = {
    b0: 1,
    b1: -2,
    b2: 1,
    a1: -1.99004745483398,
    a2: 0.99007225036621,
  };
  const filterLeft = [biquadTick(shelf), biquadTick(highPass)];
  const filterRight = [biquadTick(shelf), biquadTick(highPass)];
  const windowFrames = Math.round(sampleRate * 0.4);
  const hopFrames = Math.round(sampleRate * 0.1);
  const energyWindow = new Float64Array(windowFrames);
  const blocks = [];
  let position = 0;
  let rollingEnergy = 0;

  for (let frame = 0; frame < left.length; frame += 1) {
    const weightedLeft = filterLeft[1](filterLeft[0](left[frame]));
    const weightedRight = filterRight[1](filterRight[0](right[frame]));
    const energy = weightedLeft ** 2 + weightedRight ** 2;
    rollingEnergy += energy - energyWindow[position];
    energyWindow[position] = energy;
    position = (position + 1) % windowFrames;
    const observed = frame + 1;
    if (observed >= windowFrames && (observed - windowFrames) % hopFrames === 0) {
      blocks.push(rollingEnergy / windowFrames);
    }
  }

  const toLufs = (energy) => -0.691 + 10 * Math.log10(Math.max(energy, 1e-24));
  const absoluteGated = blocks.filter((energy) => toLufs(energy) > -70);
  if (absoluteGated.length === 0) return -Infinity;
  const ungatedEnergy = absoluteGated.reduce((sum, energy) => sum + energy, 0)
    / absoluteGated.length;
  const relativeGate = toLufs(ungatedEnergy) - 10;
  const relativeGated = absoluteGated.filter((energy) => toLufs(energy) > relativeGate);
  const integratedEnergy = relativeGated.reduce((sum, energy) => sum + energy, 0)
    / relativeGated.length;
  return toLufs(integratedEnergy);
}

function onePoleHighPass(frequencyHz, sampleRate = SAMPLE_RATE) {
  const coefficient = Math.exp((-2 * Math.PI * frequencyHz) / sampleRate);
  let previousInput = 0;
  let previousOutput = 0;
  return (input) => {
    const output = coefficient * (previousOutput + input - previousInput);
    previousInput = input;
    previousOutput = output;
    return output;
  };
}

export function highBandDeltaDb(
  cleanLeft,
  cleanRight,
  processedLeft,
  processedRight,
  sampleRate = SAMPLE_RATE,
) {
  const cleanFilters = [
    onePoleHighPass(HIGH_BAND_HZ, sampleRate),
    onePoleHighPass(HIGH_BAND_HZ, sampleRate),
  ];
  const processedFilters = [
    onePoleHighPass(HIGH_BAND_HZ, sampleRate),
    onePoleHighPass(HIGH_BAND_HZ, sampleRate),
  ];
  const skipFrames = Math.round(HIGH_BAND_SKIP_SECONDS * sampleRate);
  let cleanEnergy = 0;
  let processedEnergy = 0;
  let observations = 0;
  for (let frame = 0; frame < cleanLeft.length; frame += 1) {
    const cleanL = cleanFilters[0](cleanLeft[frame]);
    const cleanR = cleanFilters[1](cleanRight[frame]);
    const processedL = processedFilters[0](processedLeft[frame]);
    const processedR = processedFilters[1](processedRight[frame]);
    if (frame < skipFrames) continue;
    cleanEnergy += cleanL ** 2 + cleanR ** 2;
    processedEnergy += processedL ** 2 + processedR ** 2;
    observations += 2;
  }
  const cleanRms = Math.sqrt(cleanEnergy / Math.max(1, observations));
  const processedRms = Math.sqrt(processedEnergy / Math.max(1, observations));
  return finiteDb(processedRms) - finiteDb(cleanRms);
}

function samplePeakDbfs(left, right) {
  let peak = 0;
  for (let frame = 0; frame < left.length; frame += 1) {
    peak = Math.max(peak, Math.abs(left[frame]), Math.abs(right[frame]));
  }
  return finiteDb(peak);
}

function splitStereo(interleaved) {
  if (interleaved.length % CHANNELS !== 0) throw new Error("FFmpeg returned malformed stereo PCM");
  const frames = interleaved.length / CHANNELS;
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    left[frame] = interleaved[frame * 2];
    right[frame] = interleaved[frame * 2 + 1];
  }
  return { left, right };
}

async function decodeAsset(asset, index, temporaryDirectory) {
  const encodedPath = path.join(temporaryDirectory, `${index}.ogg`);
  const pcmPath = path.join(temporaryDirectory, `${index}.f32le`);
  await writeFile(encodedPath, Buffer.from(await asset.audio.arrayBuffer()));
  await run("ffmpeg", [
    "-v", "error",
    "-y",
    "-i", encodedPath,
    "-ac", String(CHANNELS),
    "-ar", String(SAMPLE_RATE),
    "-f", "f32le",
    pcmPath,
  ], { maxBuffer: 1 << 20 });
  const pcm = await readFile(pcmPath);
  const copied = pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength);
  return splitStereo(new Float32Array(copied));
}

function calibrationParameters() {
  const {
    cutoffHz,
    idleQ,
    fullQ,
    drive,
    filteredMix,
    residualMix,
    makeupDb,
  } = JUNCTION_BRAKE_CALIBRATION;
  return { cutoffHz, idleQ, fullQ, drive, filteredMix, residualMix, makeupDb };
}

export async function analyzeJunctionBrake(bankPath = DEFAULT_BANK) {
  const bankBytes = await readFile(bankPath);
  const parsed = parseJunctionBank(
    bankBytes.buffer.slice(bankBytes.byteOffset, bankBytes.byteOffset + bankBytes.byteLength),
  );
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "sedicivalvole-junction-brake-"));
  const clips = [];
  try {
    for (let index = 0; index < parsed.manifest.sections.length; index += 1) {
      const section = parsed.manifest.sections[index];
      const asset = parsed.assets.get(section.assetId);
      if (!asset) throw new Error(`JUNCTION calibration asset is missing: ${section.assetId}`);
      const clean = await decodeAsset(asset, index, temporaryDirectory);
      const processed = applyFullBrake(clean.left, clean.right);
      clips.push({
        id: section.id,
        take: section.take,
        deltaLu: roundMetric(
          integratedLoudness(processed.left, processed.right)
            - integratedLoudness(clean.left, clean.right),
        ),
        highDb: roundMetric(highBandDeltaDb(
          clean.left,
          clean.right,
          processed.left,
          processed.right,
        )),
        peakDbfs: roundMetric(samplePeakDbfs(processed.left, processed.right)),
      });
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }

  return {
    format: "sedicivalvole.junction-brake-calibration.v1",
    bank: {
      path: path.relative(PROJECT_ROOT, bankPath).split(path.sep).join("/"),
      sha256: createHash("sha256").update(bankBytes).digest("hex"),
      clipCount: clips.length,
    },
    method: {
      decode: "FFmpeg to stereo Float32 PCM at 48000 Hz",
      level: "ITU-R BS.1770 K-weighted integrated loudness with absolute and relative gating",
      darkening: "RMS energy above a one-pole 2000 Hz high-pass after the first 500 ms",
      peak: "processed sample peak",
      listeningAuthority: false,
    },
    parameters: calibrationParameters(),
    summary: {
      minDeltaLu: Math.min(...clips.map(({ deltaLu }) => deltaLu)),
      maxDeltaLu: Math.max(...clips.map(({ deltaLu }) => deltaLu)),
      leastDarkHighDb: Math.max(...clips.map(({ highDb }) => highDb)),
      highestPeakDbfs: Math.max(...clips.map(({ peakDbfs }) => peakDbfs)),
    },
    clips,
  };
}

export function compareCalibration(actual, expected, tolerance = CHECK_TOLERANCE) {
  const failures = [];
  for (const field of ["format"]) {
    if (actual[field] !== expected[field]) failures.push(`${field} identity differs`);
  }
  if (actual.bank.sha256 !== expected.bank.sha256) failures.push("bank SHA-256 differs");
  if (actual.bank.clipCount !== expected.bank.clipCount) failures.push("bank clip count differs");
  if (JSON.stringify(actual.parameters) !== JSON.stringify(expected.parameters)) {
    failures.push("runtime parameter identity differs");
  }
  if (actual.clips.length !== expected.clips.length) failures.push("clip metric count differs");
  const differences = [];
  for (let index = 0; index < Math.min(actual.clips.length, expected.clips.length); index += 1) {
    const measured = actual.clips[index];
    const recorded = expected.clips[index];
    if (measured.id !== recorded.id || measured.take !== recorded.take) {
      failures.push(`clip identity differs at index ${index}`);
      continue;
    }
    for (const metric of ["deltaLu", "highDb", "peakDbfs"]) {
      const difference = Math.abs(measured[metric] - recorded[metric]);
      differences.push({ id: measured.id, take: measured.take, metric, difference });
      if (difference > tolerance) {
        failures.push(`${measured.id}-${measured.take} ${metric} differs by ${difference.toFixed(6)}`);
      }
    }
  }
  return {
    ok: failures.length === 0,
    tolerance,
    maximumDifference: differences.length
      ? Math.max(...differences.map(({ difference }) => difference))
      : Infinity,
    failures,
  };
}

function argumentValue(name, fallback) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? path.resolve(process.argv[at + 1]) : fallback;
}

async function main() {
  const bankPath = argumentValue("--bank", DEFAULT_BANK);
  const reportPath = argumentValue("--report", DEFAULT_REPORT);
  const actual = await analyzeJunctionBrake(bankPath);
  if (process.argv.includes("--check")) {
    const expected = JSON.parse(await readFile(reportPath, "utf8"));
    const comparison = compareCalibration(actual, expected);
    process.stdout.write(
      `JUNCTION brake calibration: ${comparison.ok ? "PASS" : "FAIL"}`
      + ` · ${actual.clips.length} clips`
      + ` · max metric drift ${comparison.maximumDifference.toFixed(6)}`
      + ` · bank ${actual.bank.sha256}\n`,
    );
    if (!comparison.ok) throw new Error(comparison.failures.join("; "));
    return;
  }
  const outputAt = process.argv.indexOf("--output");
  const serialized = `${JSON.stringify(actual, null, 2)}\n`;
  if (outputAt >= 0) await writeFile(path.resolve(process.argv[outputAt + 1]), serialized);
  else process.stdout.write(serialized);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
