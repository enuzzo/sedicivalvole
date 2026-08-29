import { execFile } from "node:child_process";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { NIGHTSHIFT_BANK_MAGIC } from "../src/nightshift-bank.js";
import {
  NIGHTSHIFT_ARRANGEMENT,
  NIGHTSHIFT_BARS_PER_PERFORMANCE,
  NIGHTSHIFT_HARMONIC_IDENTITY,
  NIGHTSHIFT_HARMONY,
  NIGHTSHIFT_TAKES,
  nightshiftPerformanceFrames,
} from "./nightshift-form.mjs";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");
const SAMPLE_RATE = 48000;
const wavPath = resolve(PROJECT_ROOT, "renders/nightshift-sketch-adaptive.wav");
const reportPath = resolve(PROJECT_ROOT, "renders/nightshift-sketch-adaptive.json");
const bankPath = resolve(PROJECT_ROOT, "public/audio/nightshift.svb");

await run(process.execPath, [resolve(HERE, "render-nightshift-sketch.mjs")], {
  cwd: PROJECT_ROOT,
  maxBuffer: 1 << 20,
});
const report = JSON.parse(await readFile(reportPath, "utf8"));

let cursorFrames = 0;
const rendered = NIGHTSHIFT_ARRANGEMENT.map((section) => {
  const frames = nightshiftPerformanceFrames(section.bpm, SAMPLE_RATE);
  const entry = { section, startSeconds: cursorFrames / SAMPLE_RATE, durationSeconds: frames / SAMPLE_RATE };
  cursorFrames += frames;
  return entry;
});

const filters = [];
const outputs = [];
const tempPaths = [];
for (let index = 0; index < rendered.length; index += 1) {
  const entry = rendered[index];
  filters.push(
    `[0:a]atrim=start=${entry.startSeconds.toFixed(9)}:duration=${entry.durationSeconds.toFixed(9)}`
    + `,asetpts=PTS-STARTPTS[a${index}]`,
  );
  const tempPath = resolve("/tmp", `sedicivalvole-nightshift-${process.pid}-${index}.ogg`);
  tempPaths.push(tempPath);
  outputs.push("-map", `[a${index}]`, "-c:a", "libopus", "-b:a", "128k", "-vbr", "on", "-application", "audio", tempPath);
}
await run("ffmpeg", ["-v", "error", "-y", "-i", wavPath, "-filter_complex", filters.join(";"), ...outputs], {
  maxBuffer: 1 << 20,
});

const assets = [];
const sections = [];
const encoded = [];
for (let index = 0; index < rendered.length; index += 1) {
  const entry = rendered[index];
  const audio = await readFile(tempPaths[index]);
  await unlink(tempPaths[index]);
  const assetId = entry.section.performanceId;
  encoded.push(audio);
  assets.push({
    id: assetId,
    mime: "audio/ogg; codecs=opus",
    audioBytes: audio.byteLength,
    durationSeconds: entry.durationSeconds,
    decodedPcmBytes: Math.round(entry.durationSeconds * SAMPLE_RATE * 2 * 4),
  });
  sections.push({
    id: entry.section.id,
    assetId,
    take: entry.section.take,
    performanceId: entry.section.performanceId,
    harmonicIdentity: NIGHTSHIFT_HARMONIC_IDENTITY,
    bpm: entry.section.bpm,
    enterKmh: entry.section.enterKmh,
    exitKmh: entry.section.exitKmh,
    durationSeconds: entry.durationSeconds,
    activeLanes: [
      "drums",
      "harmony",
      ...(entry.section.bass > 0 ? ["bass"] : []),
      ...(entry.section.arp > 0 ? ["arpeggio"] : []),
      ...(entry.section.lead > 0 ? ["punctuation"] : []),
    ],
  });
}

const manifest = {
  format: "sedicivalvole.music-bank.v1",
  score: "nightshift",
  source: "rendered-production",
  sourceRights: "MusicRadar royalty-free music use; source redistribution prohibited",
  rawSourceAssetsPublished: false,
  mixing: report.mixing,
  transitionMode: "complete-eight-bar-boundary",
  harmonicIdentity: NIGHTSHIFT_HARMONIC_IDENTITY,
  harmonicGrammar: NIGHTSHIFT_HARMONY.map(({ id }) => id),
  primaryGrooves: 1,
  tempoMode: "native-recorded-drum-families",
  bpmRange: [85, 140],
  fastDrumsEnterKmh: 82,
  barsPerPerformance: NIGHTSHIFT_BARS_PER_PERFORMANCE,
  takes: NIGHTSHIFT_TAKES,
  sourceRecordingsUsed: report.sourceRecordingsUsed,
  maxDecodedClips: 6,
  sectionEdgeFadeMilliseconds: report.sectionEdgeFadeMilliseconds,
  assets,
  sections,
};
const manifestBytes = Buffer.from(JSON.stringify(manifest));
const header = Buffer.alloc(12);
header.write(NIGHTSHIFT_BANK_MAGIC, 0, "ascii");
header.writeUInt32LE(manifestBytes.byteLength, 8);
await mkdir(dirname(bankPath), { recursive: true });
await writeFile(bankPath, Buffer.concat([header, manifestBytes, ...encoded]));
process.stdout.write(
  `NIGHTSHIFT bank: ${bankPath}\n${sections.length} complete performances`
  + ` · ${encoded.reduce((sum, value) => sum + value.byteLength, 0)} encoded audio bytes\n`,
);
