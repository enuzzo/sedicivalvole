import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { JUNCTION_BANK_MAGIC } from "../src/junction-bank.js";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, "..");
const TEMPO = 168;
const TAKES = 3;
const SECTION_IDS = ["open", "enter", "build", "break", "full", "turn", "ease", "rest"];
const BARS_PER_SECTION = 8;
const BARS = SECTION_IDS.length * TAKES * BARS_PER_SECTION;
const secondsPerBar = (60 / TEMPO) * 4;

const wavPath = resolve(PROJECT_ROOT, `renders/junction-sketch-${TEMPO}.wav`);
const encodedPath = resolve("/tmp", `sedicivalvole-junction-${process.pid}.ogg`);
const bankPath = resolve(PROJECT_ROOT, "public/audio/junction.svb");

await run(process.execPath, [
  resolve(HERE, "render-junction-sketch.mjs"),
  "--tempo", String(TEMPO),
  "--bars", String(BARS),
], { cwd: PROJECT_ROOT, maxBuffer: 1 << 20 });

await run("ffmpeg", [
  "-v", "error",
  "-y",
  "-i", wavPath,
  "-c:a", "libopus",
  "-b:a", "144k",
  "-vbr", "on",
  "-application", "audio",
  encodedPath,
], { maxBuffer: 1 << 20 });

const audio = await readFile(encodedPath);
const sectionSeconds = BARS_PER_SECTION * secondsPerBar;
const manifest = {
  format: "sedicivalvole.music-bank.v1",
  score: "junction",
  source: "rendered-production",
  mime: "audio/ogg; codecs=opus",
  bpm: TEMPO,
  bars: BARS,
  barsPerSection: BARS_PER_SECTION,
  takes: TAKES,
  durationSeconds: BARS * secondsPerBar,
  sections: Array.from({ length: TAKES }, (_, take) => (
    SECTION_IDS.map((id, sectionIndex) => {
      const index = take * SECTION_IDS.length + sectionIndex;
      return {
        id,
        take: take + 1,
        startSeconds: index * sectionSeconds,
        durationSeconds: sectionSeconds,
      };
    })
  )).flat(),
};
const manifestBytes = Buffer.from(JSON.stringify(manifest));
const header = Buffer.alloc(12);
header.write(JUNCTION_BANK_MAGIC, 0, "ascii");
header.writeUInt32LE(manifestBytes.byteLength, 8);

await mkdir(dirname(bankPath), { recursive: true });
await writeFile(bankPath, Buffer.concat([header, manifestBytes, audio]));
process.stdout.write(
  `JUNCTION bank: ${bankPath}\n`
  + `${manifest.sections.length} authored sections · ${audio.byteLength} encoded audio bytes\n`,
);
