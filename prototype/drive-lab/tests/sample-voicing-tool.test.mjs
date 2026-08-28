import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const scriptUrl = new URL("../scripts/inspect-sample-voicings.py", import.meta.url);

const fixture = {
  source_report: "fixture.json",
  records: [
    {
      file: "V-String.wav",
      declared: { label: "Bmin9" },
      audio: { peak_dbfs: -9.5 },
      observed: { proposals: [
        { midi: 59, amplitude: 0.8 },
        { midi: 62, amplitude: 0.8 },
        { midi: 66, amplitude: 0.8 },
        { midi: 73, amplitude: 0.7 },
        { midi: 74, amplitude: 0.3 },
      ] },
    },
    {
      file: "WaveStrings.wav",
      declared: { label: "Bmin9" },
      audio: { peak_dbfs: -9.0 },
      observed: { proposals: [
        { midi: 42, amplitude: 0.2 },
        { midi: 47, amplitude: 0.6 },
        { midi: 50, amplitude: 0.5 },
        { midi: 54, amplitude: 0.6 },
        { midi: 61, amplitude: 0.5 },
        { midi: 62, amplitude: 0.7 },
      ] },
    },
  ],
};

test("voicing review flags proposed minor seconds without promoting them to verdicts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sedicivalvole-voicing-"));
  const input = join(directory, "input.json");
  const output = join(directory, "output.json");
  try {
    await writeFile(input, JSON.stringify(fixture));
    const result = spawnSync("python3", [scriptUrl.pathname, input, "--label", "Bmin9", "--output", output], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(await readFile(output, "utf8"));
    assert.equal(report.decision_status, "review_evidence_only");
    assert.equal(report.records[0].lowest_proposed_f_sharp.name, "F#4");
    assert.equal(report.records[1].lowest_proposed_f_sharp.name, "F#2");
    assert.deepEqual(
      report.records.map((record) => record.within_take_collisions.map((item) => item.interval_semitones)),
      [[1], [1]],
    );
    assert.ok(report.label_groups[0].transitions.every((transition) => (
      transition.decision_status === "review_evidence_only"
      && transition.missing_measurements.includes("roughness_ratio")
    )));
    assert.ok(report.label_groups[0].transitions.some((transition) => (
      transition.cross_boundary_collisions.length > 0
    )));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("voicing review source contains no automatic admission verdict", async () => {
  const source = await readFile(scriptUrl, "utf8");
  assert.doesNotMatch(source, /decision_status["']:\s*["'](?:accepted|rejected|voiced)/);
  assert.match(source, /Proposal timing and pitch are not authoritative/);
  assert.match(source, /"roughness_ratio": None/);
});
