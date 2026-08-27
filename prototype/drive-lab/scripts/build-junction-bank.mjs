import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { JUNCTION_BANK_MAGIC } from "../src/junction-bank.js";
import {
  JUNCTION_ARRANGEMENT,
  JUNCTION_BARS_PER_SECTION,
  JUNCTION_SECTION_IDS,
  JUNCTION_TAKES,
  junctionSectionFrames,
} from "./junction-form.mjs";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");
const SAMPLE_RATE = 48000;

const wavPath = resolve(PROJECT_ROOT, "renders/junction-sketch-adaptive.wav");
const bankPath = resolve(PROJECT_ROOT, "public/audio/junction.svb");

await run(process.execPath, [
  resolve(HERE, "render-junction-sketch.mjs"),
], { cwd: PROJECT_ROOT, maxBuffer: 1 << 20 });

let cursorFrames = 0;
const renderedSections = JUNCTION_ARRANGEMENT.map((section) => {
  const sectionFrames = junctionSectionFrames(section, SAMPLE_RATE);
  const entry = {
    section,
    renderedStartSeconds: cursorFrames / SAMPLE_RATE,
    durationSeconds: sectionFrames / SAMPLE_RATE,
  };
  cursorFrames += sectionFrames;
  return entry;
});

const assets = [];
const sections = [];
const encodedAssets = [];
for (const id of JUNCTION_SECTION_IDS) {
  const performances = renderedSections.filter((entry) => entry.section.id === id);
  const filters = performances.map((entry, index) => (
    `[0:a]atrim=start=${entry.renderedStartSeconds.toFixed(9)}`
    + `:duration=${entry.durationSeconds.toFixed(9)}`
    + `,asetpts=PTS-STARTPTS[a${index}]`
  ));
  filters.push(
    performances.map((_, index) => `[a${index}]`).join("")
    + `concat=n=${performances.length}:v=0:a=1[out]`,
  );
  const encodedPath = resolve("/tmp", `sedicivalvole-junction-${process.pid}-${id}.ogg`);
  await run("ffmpeg", [
    "-v", "error",
    "-y",
    "-i", wavPath,
    "-filter_complex", filters.join(";"),
    "-map", "[out]",
    "-c:a", "libopus",
    "-b:a", "144k",
    "-vbr", "on",
    "-application", "audio",
    encodedPath,
  ], { maxBuffer: 1 << 20 });

  const audio = await readFile(encodedPath);
  const sectionDuration = performances[0].durationSeconds;
  assets.push({
    id,
    mime: "audio/ogg; codecs=opus",
    audioBytes: audio.byteLength,
    durationSeconds: sectionDuration * performances.length,
    decodedPcmBytes: Math.round(sectionDuration * performances.length * SAMPLE_RATE * 2 * 4),
  });
  encodedAssets.push(audio);

  for (let index = 0; index < performances.length; index += 1) {
    const source = performances[index].section;
    sections.push({
      id,
      assetId: id,
      take: source.take + 1,
      bpm: source.bpm,
      startSeconds: index * sectionDuration,
      durationSeconds: sectionDuration,
      activeLanes: source.beatSource === null
        ? ["harmony", "atmosphere"]
        : source.bass
          ? ["breaks", "bass", "harmony"]
          : ["breaks", "harmony", "atmosphere"],
    });
  }
}

const manifest = {
  format: "sedicivalvole.music-bank.v2",
  score: "junction",
  source: "rendered-production",
  mixing: "live-two-deck",
  tempoMode: "authored-sections",
  bpmRange: [127, 168],
  bars: JUNCTION_ARRANGEMENT.length * JUNCTION_BARS_PER_SECTION,
  barsPerSection: JUNCTION_BARS_PER_SECTION,
  takes: JUNCTION_TAKES,
  durationSeconds: cursorFrames / SAMPLE_RATE,
  maxDecodedStates: 2,
  assets,
  sections,
};
const manifestBytes = Buffer.from(JSON.stringify(manifest));
const header = Buffer.alloc(12);
header.write(JUNCTION_BANK_MAGIC, 0, "ascii");
header.writeUInt32LE(manifestBytes.byteLength, 8);

await mkdir(dirname(bankPath), { recursive: true });
await writeFile(bankPath, Buffer.concat([header, manifestBytes, ...encodedAssets]));
const totalAudioBytes = encodedAssets.reduce((total, audio) => total + audio.byteLength, 0);
process.stdout.write(
  `JUNCTION bank: ${bankPath}\n`
  + `${manifest.sections.length} authored sections · ${assets.length} lazy mix blocks`
  + ` · ${totalAudioBytes} encoded audio bytes\n`,
);
