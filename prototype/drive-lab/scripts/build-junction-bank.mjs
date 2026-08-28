import { execFile } from "node:child_process";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { JUNCTION_BANK_MAGIC } from "../src/junction-bank.js";
import {
  JUNCTION_ARRANGEMENT,
  JUNCTION_BARS_PER_SECTION,
  JUNCTION_TAKES,
  junctionSectionFrames,
} from "./junction-form.mjs";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");
const SAMPLE_RATE = 48000;

const wavPath = resolve(PROJECT_ROOT, "renders/junction-sketch-adaptive.wav");
const renderReportPath = resolve(PROJECT_ROOT, "renders/junction-sketch-adaptive.json");
const bankPath = resolve(PROJECT_ROOT, "public/audio/junction.svb");

await run(process.execPath, [
  resolve(HERE, "render-junction-sketch.mjs"),
], { cwd: PROJECT_ROOT, maxBuffer: 1 << 20 });
const renderReport = JSON.parse(await readFile(renderReportPath, "utf8"));

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
const filters = [];
const outputs = [];
const encodedPaths = [];
for (let index = 0; index < renderedSections.length; index += 1) {
  const entry = renderedSections[index];
  filters.push(
    `[0:a]atrim=start=${entry.renderedStartSeconds.toFixed(9)}`
    + `:duration=${entry.durationSeconds.toFixed(9)}`
    + `,asetpts=PTS-STARTPTS[a${index}]`,
  );
  const encodedPath = resolve("/tmp", `sedicivalvole-junction-${process.pid}-${index}.ogg`);
  encodedPaths.push(encodedPath);
  outputs.push(
    "-map", `[a${index}]`,
    "-c:a", "libopus",
    "-b:a", "144k",
    "-vbr", "on",
    "-application", "audio",
    encodedPath,
  );
}
await run("ffmpeg", [
  "-v", "error",
  "-y",
  "-i", wavPath,
  "-filter_complex", filters.join(";"),
  ...outputs,
], { maxBuffer: 1 << 20 });

for (let index = 0; index < renderedSections.length; index += 1) {
  const entry = renderedSections[index];
  const source = entry.section;
  const assetId = `${source.id}-${source.take + 1}`;
  const audio = await readFile(encodedPaths[index]);
  await unlink(encodedPaths[index]);
  assets.push({
    id: assetId,
    mime: "audio/ogg; codecs=opus",
    audioBytes: audio.byteLength,
    durationSeconds: entry.durationSeconds,
    decodedPcmBytes: Math.round(entry.durationSeconds * SAMPLE_RATE * 2 * 4),
  });
  encodedAssets.push(audio);
  sections.push({
    id: source.id,
    assetId,
    take: source.take + 1,
    family: source.family,
    bpm: source.bpm,
    startSeconds: 0,
    durationSeconds: entry.durationSeconds,
    activeLanes: source.beatSource === null
      ? ["harmony", "atmosphere"]
      : source.bass
        ? ["breaks", "bass", "harmony"]
        : ["breaks", "harmony", "atmosphere"],
  });
}

const manifest = {
  format: "sedicivalvole.music-bank.v3",
  score: "junction",
  source: "rendered-production",
  mixing: "live-two-deck",
  tempoMode: "authored-sections",
  bpmRange: [127, 168],
  bars: JUNCTION_ARRANGEMENT.length * JUNCTION_BARS_PER_SECTION,
  barsPerSection: JUNCTION_BARS_PER_SECTION,
  takes: JUNCTION_TAKES,
  musicalFamilies: 5,
  durationSeconds: cursorFrames / SAMPLE_RATE,
  sourceRecordingsUsed: renderReport.sourceRecordingsUsed,
  maxDecodedClips: 6,
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
  + `${manifest.sections.length} authored clips · ${assets.length} lazy mix blocks`
  + ` · ${totalAudioBytes} encoded audio bytes\n`,
);
