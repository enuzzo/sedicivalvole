import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const scriptUrl = new URL("../scripts/inspect-junction-voicing-selection.mjs", import.meta.url);

test("the selection audit exposes the current one-choice JUNCTION collapse", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sedicivalvole-selection-"));
  const output = join(directory, "selection.json");
  try {
    const result = spawnSync(process.execPath, [scriptUrl.pathname, "--output", output], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(await readFile(output, "utf8"));
    assert.equal(report.authority, "measurement");
    assert.equal(report.performance_count, 24);
    assert.equal(report.diversity_status, "collapsed_to_one_choice_per_chord");
    assert.ok(report.chord_coverage.every((entry) => (
      entry.available_count === 2 && entry.selected_count === 1
    )));
    assert.ok(report.performances.every((performance) => (
      performance.chord_selections.every((selection) => selection.choice_index === 0)
      && performance.stab_selections.every((selection) => selection.choice_index === 0)
    )));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the audit is read-only and mirrors the renderer formula explicitly", async () => {
  const source = await readFile(scriptUrl, "utf8");
  assert.match(source, /selection_observability/);
  assert.match(source, /section\.voicing \+ sectionIndex/);
  assert.doesNotMatch(source, /rename|unlink|copyFile|rm\(/);
});
