#!/usr/bin/env node

// Measure the listener-facing encoded assets in the tracked sampled-score
// banks. The report deliberately reads only public artifacts and never needs
// the development-only source sample library.

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, "..");
const BANK_NAMES = Object.freeze(["junction", "nightshift"]);

function round(value) {
  return Number(Number(value).toFixed(3));
}

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return round(sorted[index]);
}

function parseBank(buffer) {
  if (buffer.byteLength < 12) throw new Error("Sampled-score bank header is incomplete");
  const manifestLength = buffer.readUInt32LE(8);
  const audioOffset = 12 + manifestLength;
  const manifest = JSON.parse(buffer.subarray(12, audioOffset).toString("utf8"));
  let cursor = audioOffset;
  const assets = manifest.assets.map((asset) => {
    const end = cursor + asset.audioBytes;
    if (end > buffer.byteLength) throw new Error(`${asset.id} exceeds the sampled-score bank payload`);
    const parsed = { ...asset, bytes: buffer.subarray(cursor, end) };
    cursor = end;
    return parsed;
  });
  if (cursor !== buffer.byteLength) throw new Error("Sampled-score bank has unexpected trailing bytes");
  return { manifest, assets };
}

function parseLoudnorm(stderr, assetId) {
  const match = stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
  if (!match) throw new Error(`FFmpeg did not report loudness for ${assetId}`);
  const report = JSON.parse(match[0]);
  return {
    id: assetId,
    integratedLufs: round(report.input_i),
    loudnessRangeLu: round(report.input_lra),
    truePeakDbtp: round(report.input_tp),
  };
}

async function measureAsset(directory, score, asset) {
  const assetPath = path.join(directory, `${score}-${asset.id}.ogg`);
  await writeFile(assetPath, asset.bytes);
  const { stderr } = await run("ffmpeg", [
    "-hide_banner", "-nostats", "-i", assetPath,
    "-af", "loudnorm=I=-20:LRA=12:TP=-1.5:print_format=json",
    "-f", "null", "-",
  ], { maxBuffer: 1024 * 1024 * 4 });
  return parseLoudnorm(stderr, asset.id);
}

async function measureBank(directory, score) {
  const bankPath = path.join(PROJECT_ROOT, "public", "audio", `${score}.svb`);
  const { manifest, assets } = parseBank(await readFile(bankPath));
  const measurements = [];
  for (const asset of assets) measurements.push(await measureAsset(directory, score, asset));
  const integrated = measurements.map(({ integratedLufs }) => integratedLufs);
  const peaks = measurements.map(({ truePeakDbtp }) => truePeakDbtp);
  return {
    score,
    format: manifest.format,
    assets: measurements.length,
    integratedLufs: {
      minimum: percentile(integrated, 0),
      median: percentile(integrated, 0.5),
      p95: percentile(integrated, 0.95),
      maximum: percentile(integrated, 1),
    },
    maximumTruePeakDbtp: percentile(peaks, 1),
    measurements,
  };
}

const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "sedicivalvole-levels-"));
try {
  const banks = [];
  for (const score of BANK_NAMES) banks.push(await measureBank(temporaryDirectory, score));
  console.log(JSON.stringify({ method: "FFmpeg loudnorm first pass (EBU R128)", banks }, null, 2));
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
