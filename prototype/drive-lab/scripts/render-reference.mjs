// Offline reference render of the Flux score.
//
// The score core has no AudioContext and no DOM dependency, so the identical
// code that runs inside the AudioWorklet can be driven here at whatever rate
// Node manages. That makes listening review and objective measurement possible
// without a vehicle, a browser, or a microphone.
//
// Usage:
//   node scripts/render-reference.mjs [--out path.wav] [--rate 48000] [--drive name]
//
// Drives are named speed programmes declared in DRIVES below. Each leg is
// `[targetKmh, seconds]` and the speed ramps linearly to the target across the
// leg, which is close enough to a real drive for the arrangement to be exercised
// through every scene, both directions, including a sustained release.

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createScoreCore } from "../src/score/score-core.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");

/** Speed programmes. `[targetKmh, seconds]` legs, ramped linearly. */
const DRIVES = {
  // The commissioned review drive: every scene, up and down, with a real
  // sustained release in the middle and a full stop at the end.
  reference: [
    [0, 6],
    [40, 12],
    [40, 10],
    [80, 14],
    [80, 10],
    [115, 14],
    [115, 12],
    [60, 10],
    [60, 14],
    [115, 12],
    [115, 10],
    [0, 16],
    [0, 8],
  ],
  // A short loop for quick iteration on the arrangement.
  short: [
    [0, 4],
    [60, 8],
    [115, 10],
    [115, 8],
    [0, 10],
  ],
  // Holds each scene long enough to hear it settle, with no transitions to hide
  // behind. This is the one to use when judging the material itself.
  scenes: [
    [0, 12],
    [18, 16],
    [38, 16],
    [70, 16],
    [115, 20],
    [0, 10],
  ],
  // Two full turns of the form at a steady speed, so all ten melodies and all
  // five theme voices are heard without the arrangement moving underneath them.
  form: [
    [0, 3],
    [110, 8],
    [110, 115],
  ],
  // The low band on its own: a standstill and then a slow crawl. This is where
  // the arrangement is easiest to get wrong, because there is almost nothing in
  // it and every choice is audible.
  crawl: [
    [0, 14],
    [8, 14],
    [16, 16],
    [24, 16],
    [30, 16],
    [0, 12],
  ],
  // Urban driving only: the range a driver actually spends most time in.
  urban: [
    [0, 5],
    [30, 12],
    [12, 10],
    [45, 14],
    [20, 12],
    [50, 14],
    [0, 10],
  ],
};

/** The block size an AudioWorklet uses, so the control rate matches the browser. */
const BLOCK = 128;

function parseArguments(argv) {
  const options = { out: null, rate: 48000, drive: "reference" };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--out") options.out = argv[index + 1];
    else if (flag === "--rate") options.rate = Number.parseInt(argv[index + 1], 10);
    else if (flag === "--drive") options.drive = argv[index + 1];
  }
  if (!DRIVES[options.drive]) {
    throw new Error(`unknown drive "${options.drive}". Known: ${Object.keys(DRIVES).join(", ")}`);
  }
  if (!Number.isFinite(options.rate) || options.rate < 8000) {
    throw new Error(`unusable sample rate ${options.rate}`);
  }
  options.out ??= resolve(PROJECT_ROOT, `renders/fracture-${options.drive}.wav`);
  return options;
}

/** Speed of the programme at a given moment, ramped linearly between legs. */
function speedAt(legs, seconds) {
  let elapsed = 0;
  let previous = 0;
  for (const [target, duration] of legs) {
    if (seconds < elapsed + duration) {
      const position = duration <= 0 ? 1 : (seconds - elapsed) / duration;
      return previous + (target - previous) * position;
    }
    elapsed += duration;
    previous = target;
  }
  return previous;
}

function drivenSeconds(legs) {
  return legs.reduce((total, [, duration]) => total + duration, 0);
}

/** Interleaved 16-bit PCM WAV. */
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

function decibels(value) {
  return value <= 1e-9 ? -Infinity : 20 * Math.log10(value);
}

function formatDecibels(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} dB` : "silent";
}

export async function renderDrive({ rate, drive, out }) {
  const legs = DRIVES[drive];
  const totalSeconds = drivenSeconds(legs);
  const totalFrames = Math.ceil(totalSeconds * rate);
  const core = createScoreCore({ sampleRate: rate });

  const left = new Float32Array(totalFrames);
  const right = new Float32Array(totalFrames);
  const blockLeft = new Float32Array(BLOCK);
  const blockRight = new Float32Array(BLOCK);
  const blockSeconds = BLOCK / rate;

  // Per-second observations, so the timeline can be reported against the drive.
  const timeline = [];
  let secondIndex = 0;
  let secondPeak = 0;
  let secondSum = 0;
  let secondCount = 0;

  for (let start = 0; start < totalFrames; start += BLOCK) {
    const seconds = start / rate;
    core.observe(speedAt(legs, seconds), blockSeconds);
    const frames = Math.min(BLOCK, totalFrames - start);
    core.process(blockLeft, blockRight, frames);

    for (let frame = 0; frame < frames; frame += 1) {
      const l = blockLeft[frame];
      const r = blockRight[frame];
      left[start + frame] = l;
      right[start + frame] = r;
      const magnitude = Math.max(Math.abs(l), Math.abs(r));
      if (magnitude > secondPeak) secondPeak = magnitude;
      secondSum += (l * l + r * r) * 0.5;
      secondCount += 1;
    }

    if (Math.floor(seconds) > secondIndex || start + BLOCK >= totalFrames) {
      const snapshot = core.snapshot();
      timeline.push({
        second: secondIndex,
        speedKmh: speedAt(legs, secondIndex),
        scene: snapshot.sceneId,
        tempo: snapshot.tempo,
        halfTime: snapshot.halfTime,
        deceleration: snapshot.decelerationState,
        lanes: snapshot.activeLanes,
        peak: secondPeak,
        rms: secondCount > 0 ? Math.sqrt(secondSum / secondCount) : 0,
      });
      secondIndex = Math.floor(seconds);
      secondPeak = 0;
      secondSum = 0;
      secondCount = 0;
    }
  }

  await mkdir(dirname(out), { recursive: true });
  await writeWav(out, left, right, rate);

  let peak = 0;
  let sum = 0;
  let clipped = 0;
  for (let frame = 0; frame < totalFrames; frame += 1) {
    const magnitude = Math.max(Math.abs(left[frame]), Math.abs(right[frame]));
    if (magnitude > peak) peak = magnitude;
    if (magnitude >= 0.999) clipped += 1;
    sum += (left[frame] ** 2 + right[frame] ** 2) * 0.5;
  }

  return {
    out,
    rate,
    drive,
    seconds: totalSeconds,
    frames: totalFrames,
    peak,
    rms: Math.sqrt(sum / totalFrames),
    clipped,
    timeline,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await renderDrive(options);

  process.stdout.write(`\nFRACTURE — drive "${report.drive}" at ${report.rate} Hz\n`);
  process.stdout.write(`${report.out}\n`);
  process.stdout.write(
    `${report.seconds.toFixed(1)} s · peak ${formatDecibels(decibels(report.peak))}`
    + ` · rms ${formatDecibels(decibels(report.rms))}`
    + ` · ${report.clipped} clipped frames\n\n`,
  );

  process.stdout.write("  t   km/h  scene  bpm  feel   deceleration  peak     lanes\n");
  let previous = null;
  for (const row of report.timeline) {
    const signature = `${row.scene}|${row.lanes.join(",")}|${row.deceleration}`;
    // Only print where something audible about the arrangement changed, plus a
    // heartbeat every ten seconds, so the table stays readable.
    if (signature === previous && row.second % 10 !== 0) continue;
    previous = signature;
    process.stdout.write(
      `${String(row.second).padStart(3)}`
      + `${row.speedKmh.toFixed(0).padStart(7)}`
      + `  ${row.scene.padEnd(6)}`
      + `${row.tempo.toFixed(0).padStart(4)}`
      + `  ${(row.halfTime ? "half" : "full").padEnd(5)}`
      + `  ${row.deceleration.padEnd(12)}`
      + `  ${formatDecibels(decibels(row.peak)).padStart(8)}`
      + `  ${row.lanes.join(" ")}\n`,
    );
  }
  process.stdout.write("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
