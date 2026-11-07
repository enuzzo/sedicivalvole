// Acoustic QA for the combustion voices, in Node (no browser, no dev server).
//
//   npm run qa:engine-acoustics -- drive [options]
//     Full-chain drive replay (runtime + motion + synthesizer + master
//     compressor model) on a Tesla-like GPS route. Per engine: upshifts, pops
//     and bangs, level dip / overrun / tip-in bark through upshifts, fuel-cut
//     entries and >3 dB dips in steady cruise, peak compressor reduction.
//   npm run qa:engine-acoustics -- noise [options]
//     A-weighted share of the aperiodic noise against the whole voice at idle,
//     town, highway, accelerating, lifting and flat out (steady scenes).
//
// Options
//   --engines a,b       combustion voices (default: all eight)
//   --baseline <ref>    also measure the source tree at a Git ref, e.g. a
//                       pre-combustion-* rollback tag, and print it first
//   --route <json>      drive: [[seconds, km/h], ...] (default: 100 s town/highway)
//   --gps-noise <km/h>  drive: speed noise before whole-km/h rounding (default 0.25)
//   --wav               drive: write the whole replay per engine and tree
//   --excerpt a-b,c-d   drive: with --baseline, one before/after WAV per engine
//   --trace a-b         drive: print the 50 ms trace between a and b seconds
//   --out <dir>         WAV directory (default output/engine-acoustics)
//   --sources           noise: break the share down per source
//
// Evidence of November 7: v6 noise (`noise --baseline pre-combustion-v6-20261107`)
// and v7 cut-outs (`drive --baseline pre-combustion-v7-20261107`).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DRIVE_ROUTE, RATE, NOISE_SOURCES, aWeightedDb, cruiseSegments, silenceNoise, teslaGps, writeWav } from "./engine-acoustics/measure.mjs";
import { driveMetrics, loadEngineSources, replayDrive } from "./engine-acoustics/replay.mjs";

// Steady scenes as the runtime drives them: load = 0.08 + 0.92 × throttle.
const SCENES = [["idle", spec => spec.idleRpm, 0.08], ["50 km/h", () => 1800, 0.25], ["110 km/h", () => 2700, 0.45],
  ["accelerating", () => 3000, 0.7], ["lift", () => 3000, 0.08], ["flat out", () => 4200, 0.95]];

const drivelab = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const repository = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: drivelab, encoding: "utf8" }).trim();

function parse(argv) {
  const [mode, ...rest] = argv, options = { mode };
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i].replace(/^--/, "");
    if (["wav", "sources"].includes(key)) options[key] = true;
    else options[key] = rest[++i];
  }
  return options;
}
const range = text => text.split(",").map(part => part.split("-").map(Number));

/** Source trees to measure: the baseline ref (extracted with git archive) first, then this checkout. */
function trees(baseline) {
  const list = [], cleanups = [];
  if (baseline) {
    const sha = execFileSync("git", ["rev-parse", "--short", `${baseline}^{commit}`], { cwd: repository, encoding: "utf8" }).trim();
    const directory = mkdtempSync(join(tmpdir(), "engine-acoustics-"));
    execFileSync("sh", ["-c", `git archive ${sha} prototype/drive-lab/src | tar -x -C "${directory}"`], { cwd: repository });
    list.push({ label: `${baseline} (${sha})`, short: "before", root: `${directory}/prototype/drive-lab` });
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
  }
  list.push({ label: "current checkout", short: "after", root: drivelab });
  return { list, cleanup: () => cleanups.forEach(fn => fn()) };
}

async function drive(options, tree, ids) {
  const route = options.route ? JSON.parse(options.route) : DRIVE_ROUTE;
  const gps = teslaGps(route, { noise: Number(options["gps-noise"] ?? 0.25) }), seconds = route[route.length - 1][0], cruise = cruiseSegments(route);
  const sources = await loadEngineSources(tree.root), table = [], outputs = new Map();
  for (const id of ids) {
    const replay = await replayDrive(sources, { profileId: id, gps, seconds });
    table.push({ engine: id, ...driveMetrics(replay, cruise) });
    outputs.set(id, replay.output);
    if (options.wav) writeWav(join(options.out, `${id}-${tree.short}.wav`), replay.output, { gain: 1.4 });
    if (options.trace) {
      const [[from, to]] = range(options.trace);
      console.log(`\n${id} · ${tree.label} · trace ${from}-${to} s`);
      for (const row of replay.rows) if (row.t >= from && row.t <= to) console.log(JSON.stringify(row));
    }
  }
  console.log(`\nDrive replay · ${tree.label} · ${seconds} s route, GPS 10 Hz whole km/h`);
  console.table(table);
  return outputs;
}

async function noise(options, tree, ids) {
  const sources = await loadEngineSources(tree.root), table = [];
  for (const id of ids) {
    const spec = sources.COMBUSTION_ENGINES[id], profile = sources.ENGINE_PROFILES.find(item => item.id === id);
    const render = (definition, rpm, load) => {
      const engine = new sources.CombustionEngine(RATE, definition), left = new Float32Array(128), right = new Float32Array(128);
      const kept = new Float32Array(Math.round(3 * RATE / 128) * 128);
      for (let block = 0, at = 0; block < Math.round(5 * RATE / 128); block++) {
        engine.process(left, right, 128, [rpm], [load], [sources.boostDemand({ rpm, load }, profile)], 1, 0);
        if (block >= Math.round(2 * RATE / 128)) { kept.set(left.map((value, k) => (value + right[k]) / 2), at); at += 128; }
      }
      return kept;
    };
    for (const [scene, rpmOf, load] of SCENES) {
      const rpm = rpmOf(spec), full = render(spec, rpm, load), total = aWeightedDb(full);
      const share = definition => { const quiet = render(definition, rpm, load); return +(aWeightedDb(full.map((value, i) => value - quiet[i])) - total).toFixed(1); };
      const row = { engine: id, scene, rpm: Math.round(rpm), "noise dBA": share(silenceNoise(spec)) };
      if (options.sources) for (const [name, silence] of Object.entries(NOISE_SOURCES)) { const definition = silence(spec); row[name] = definition ? share(definition) : ""; }
      table.push(row);
    }
  }
  console.log(`\nNoise share (A-weighted, against the whole voice) · ${tree.label}`);
  console.table(table);
}

const options = parse(process.argv.slice(2));
if (!["drive", "noise"].includes(options.mode)) {
  console.error("Usage: qa-engine-acoustics.mjs drive|noise [--engines a,b] [--baseline <ref>] [--route <json>] [--gps-noise <km/h>] [--wav] [--excerpt a-b,c-d] [--trace a-b] [--out <dir>] [--sources]");
  process.exit(2);
}
options.out ??= join(drivelab, "output/engine-acoustics");
if (options.wav || options.excerpt) mkdirSync(options.out, { recursive: true });
const { list, cleanup } = trees(options.baseline);
try {
  const ids = options.engines ? options.engines.split(",") : Object.keys((await loadEngineSources(drivelab)).COMBUSTION_ENGINES);
  const outputs = [];
  for (const tree of list) outputs.push(options.mode === "drive" ? await drive(options, tree, ids) : await noise(options, tree, ids));
  if (options.mode === "drive" && options.excerpt && outputs.length === 2) {
    const spans = range(options.excerpt), silence = new Float32Array(RATE);
    for (const id of ids) {
      const parts = outputs.flatMap(output => [...spans.flatMap(([from, to]) => [output.get(id).subarray(Math.round(from * RATE), Math.round(to * RATE)), new Float32Array(RATE * 0.3)]), silence]);
      const joined = new Float32Array(parts.reduce((sum, part) => sum + part.length, 0));
      parts.reduce((at, part) => { joined.set(part, at); return at + part.length; }, 0);
      const path = join(options.out, `${id}-before-after.wav`);
      writeWav(path, joined, { gain: 1.4 });
      console.log(`before → after: ${path}`);
    }
  }
} finally {
  cleanup();
}
