import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

import {
  createJunctionBrakeCurve,
  JUNCTION_BRAKE_CALIBRATION,
  junctionBrakeParameters,
} from "../src/junction-brake.js";

const bankUrl = new URL("../public/audio/junction.svb", import.meta.url);
const calibrationUrl = new URL("../analysis/junction-brake-calibration.json", import.meta.url);
const analyzerUrl = new URL("../scripts/analyze-junction-brake.mjs", import.meta.url);
const run = promisify(execFile);

test("JUNCTION brake darkens through filter, resonance and saturation without pitch control", async () => {
  const idle = junctionBrakeParameters(0, 18000);
  const middle = junctionBrakeParameters(0.5, 18000);
  const full = junctionBrakeParameters(1, 18000);
  assert.equal(idle.cutoffHz, 18000);
  assert.equal(full.cutoffHz, JUNCTION_BRAKE_CALIBRATION.cutoffHz);
  assert.ok(idle.cutoffHz > middle.cutoffHz && middle.cutoffHz > full.cutoffHz);
  assert.equal(idle.q, JUNCTION_BRAKE_CALIBRATION.idleQ);
  assert.equal(full.q, JUNCTION_BRAKE_CALIBRATION.fullQ);
  assert.deepEqual([idle.cleanGain, idle.processedGain], [1, 0]);
  assert.deepEqual([full.cleanGain, full.processedGain], [0, 1]);
  assert.equal(full.filteredMix + full.residualMix, 1);

  const curve = createJunctionBrakeCurve();
  assert.equal(curve.length, 4097);
  assert.equal(curve[(curve.length - 1) / 2], 0);
  assert.ok(curve.at(-1) < 1 && curve.at(-1) > 0.9);

  const source = await readFile(new URL("../src/junction-player.js", import.meta.url), "utf8");
  assert.match(source, /createWaveShaper\(\)/);
  assert.match(source, /junctionBrakeParameters\(brake, openCutoff\)/);
  assert.doesNotMatch(source, /brake[\s\S]{0,200}playbackRate/);
});

test("JUNCTION brake calibration stays attached to the measured encoded bank", async () => {
  const [bank, reportText] = await Promise.all([
    readFile(bankUrl),
    readFile(calibrationUrl, "utf8"),
  ]);
  const report = JSON.parse(reportText);
  assert.equal(createHash("sha256").update(bank).digest("hex"), report.bank.sha256);
  assert.equal(report.bank.clipCount, 24);
  assert.equal(report.clips.length, 24);
  assert.deepEqual(report.parameters, {
    cutoffHz: JUNCTION_BRAKE_CALIBRATION.cutoffHz,
    idleQ: JUNCTION_BRAKE_CALIBRATION.idleQ,
    fullQ: JUNCTION_BRAKE_CALIBRATION.fullQ,
    drive: JUNCTION_BRAKE_CALIBRATION.drive,
    filteredMix: JUNCTION_BRAKE_CALIBRATION.filteredMix,
    residualMix: JUNCTION_BRAKE_CALIBRATION.residualMix,
    makeupDb: JUNCTION_BRAKE_CALIBRATION.makeupDb,
  });
  assert.ok(report.clips.every(({ deltaLu }) => deltaLu >= -3 && deltaLu <= 1));
  assert.ok(report.clips.every(({ highDb }) => highDb <= -5));
  assert.ok(report.clips.every(({ peakDbfs }) => peakDbfs <= -1));
  for (const id of ["open", "enter", "build", "break", "full", "turn", "ease", "rest"]) {
    assert.deepEqual(
      report.clips.filter((clip) => clip.id === id).map((clip) => clip.take),
      [1, 2, 3],
    );
  }
});

test("JUNCTION brake calibration is reproducible from the tracked encoded bank", async () => {
  const { stdout } = await run(process.execPath, [fileURLToPath(analyzerUrl), "--check"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    maxBuffer: 1 << 20,
  });
  assert.match(stdout, /JUNCTION brake calibration: PASS · 24 clips/);
  assert.match(stdout, /max metric drift 0\.00000[0-9]/);
});
