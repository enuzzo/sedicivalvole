// Objective read-out of a rendered score, so mix problems can be found without
// a listening room. It reports octave-band balance, stereo width, transient
// density and crest factor over a window of a WAV produced by
// `render-reference.mjs`.
//
// Usage:
//   node scripts/analyse-render.mjs renders/fracture-reference.wav --from 60 --to 70

import { readFile } from "node:fs/promises";

const BANDS = [
  ["sub", 20, 60],
  ["low", 60, 120],
  ["lowmid", 120, 300],
  ["mid", 300, 900],
  ["upmid", 900, 2500],
  ["pres", 2500, 6000],
  ["air", 6000, 16000],
];

function parseArguments(argv) {
  const options = { path: argv[0], from: 0, to: null };
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === "--from") options.from = Number.parseFloat(argv[index + 1]);
    else if (argv[index] === "--to") options.to = Number.parseFloat(argv[index + 1]);
  }
  if (!options.path) throw new Error("a WAV path is required");
  return options;
}

/** Minimal 16-bit PCM WAV reader; only reads what render-reference.mjs writes. */
function readWav(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF") throw new Error("not a RIFF file");
  const channels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const bits = buffer.readUInt16LE(34);
  if (bits !== 16) throw new Error(`expected 16-bit PCM, found ${bits}`);

  let offset = 12;
  while (offset < buffer.length - 8) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "data") {
      const frames = Math.floor(size / (2 * channels));
      const left = new Float32Array(frames);
      const right = new Float32Array(frames);
      for (let frame = 0; frame < frames; frame += 1) {
        const base = offset + 8 + frame * 2 * channels;
        left[frame] = buffer.readInt16LE(base) / 32768;
        right[frame] = channels > 1 ? buffer.readInt16LE(base + 2) / 32768 : left[frame];
      }
      return { sampleRate, left, right };
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("no data chunk");
}

/** One Goertzel-style band power via a two-pole bandpass sweep of bin centres. */
function bandPower(signal, sampleRate, low, high) {
  // A small bank of biquad bandpasses summed in power is enough to compare
  // bands against each other, which is all this tool is for.
  const centres = [];
  for (let f = low * 1.2; f < high; f *= 1.35) centres.push(f);
  if (centres.length === 0) centres.push((low + high) / 2);

  let total = 0;
  for (const centre of centres) {
    const w = (2 * Math.PI * centre) / sampleRate;
    const q = 2.2;
    const alpha = Math.sin(w) / (2 * q);
    const cosw = Math.cos(w);
    const b0 = alpha;
    const b2 = -alpha;
    const a0 = 1 + alpha;
    const a1 = -2 * cosw;
    const a2 = 1 - alpha;
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    let power = 0;
    for (let index = 0; index < signal.length; index += 1) {
      const x0 = signal[index];
      const y0 = (b0 * x0 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x0; y2 = y1; y1 = y0;
      power += y0 * y0;
    }
    total += power / signal.length;
  }
  return total / centres.length;
}

function decibels(value) {
  return value <= 1e-12 ? -Infinity : 10 * Math.log10(value);
}

function format(value) {
  return Number.isFinite(value) ? value.toFixed(1).padStart(6) : "  -inf";
}

/** Counts onsets through a rectified envelope, as a density-per-second figure. */
function transientDensity(signal, sampleRate) {
  const window = Math.round(sampleRate * 0.005);
  let envelope = 0;
  let previous = 0;
  let onsets = 0;
  let sinceOnset = window;
  for (let index = 0; index < signal.length; index += 1) {
    const magnitude = Math.abs(signal[index]);
    envelope += (magnitude - envelope) * (magnitude > envelope ? 0.5 : 0.0008);
    sinceOnset += 1;
    if (envelope > previous * 1.9 && envelope > 0.02 && sinceOnset > window * 4) {
      onsets += 1;
      sinceOnset = 0;
    }
    previous = Math.max(previous * 0.9995, envelope);
  }
  return onsets / (signal.length / sampleRate);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const { sampleRate, left, right } = readWav(await readFile(options.path));
  const start = Math.max(0, Math.round(options.from * sampleRate));
  const end = Math.min(left.length, options.to == null
    ? left.length
    : Math.round(options.to * sampleRate));
  const l = left.subarray(start, end);
  const r = right.subarray(start, end);

  const mid = new Float32Array(l.length);
  const side = new Float32Array(l.length);
  let peak = 0;
  let sum = 0;
  for (let index = 0; index < l.length; index += 1) {
    mid[index] = (l[index] + r[index]) * 0.5;
    side[index] = (l[index] - r[index]) * 0.5;
    const magnitude = Math.max(Math.abs(l[index]), Math.abs(r[index]));
    if (magnitude > peak) peak = magnitude;
    sum += (l[index] ** 2 + r[index] ** 2) * 0.5;
  }
  const rms = Math.sqrt(sum / l.length);

  let midPower = 0;
  let sidePower = 0;
  for (let index = 0; index < mid.length; index += 1) {
    midPower += mid[index] ** 2;
    sidePower += side[index] ** 2;
  }

  process.stdout.write(`\n${options.path}  ${options.from}s → ${(end / sampleRate).toFixed(1)}s\n`);
  process.stdout.write(
    `peak ${(20 * Math.log10(peak)).toFixed(1)} dB`
    + `   rms ${(20 * Math.log10(rms)).toFixed(1)} dB`
    + `   crest ${(20 * Math.log10(peak / rms)).toFixed(1)} dB`
    + `   width ${(Math.sqrt(sidePower / Math.max(midPower, 1e-12)) * 100).toFixed(1)}%`
    + `   onsets ${transientDensity(mid, sampleRate).toFixed(1)}/s\n`,
  );

  const powers = BANDS.map(([name, low, high]) => [name, bandPower(mid, sampleRate, low, high)]);
  const loudest = Math.max(...powers.map(([, power]) => power));
  for (const [name, power] of powers) {
    const relative = decibels(power / loudest);
    const bar = "█".repeat(Math.max(0, Math.round(30 + relative / 1.4)));
    process.stdout.write(`${name.padEnd(7)}${format(relative)} dB  ${bar}\n`);
  }
  process.stdout.write("\n");
}

await main();
