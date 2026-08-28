import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const analyzerUrl = new URL("../scripts/analyse-sample-harmony.py", import.meta.url);
const requirementsUrl = new URL("../analysis/requirements.txt", import.meta.url);
const ignoreUrl = new URL("../../../.gitignore", import.meta.url);

test("the harmony pilot covers the four reachable JUNCTION labels", async () => {
  const source = await readFile(analyzerUrl, "utf8");
  assert.match(source, /JUNCTION_CHORDS = frozenset\(\{"Emin9", "Cmaj7", "Amin7", "Bmin9"\}\)/);
  assert.match(source, /declared_from_filename\(path\)\["label"\] in JUNCTION_CHORDS/);
});

test("automatic transcription remains a proposal until the arbiter is validated", async () => {
  const source = await readFile(analyzerUrl, "utf8");
  assert.match(source, /"status": "proposal_only"/);
  assert.match(source, /"pitch_set_midi": None/);
  assert.match(source, /"value": "unknown"/);
  assert.match(source, /"harmonic_arbiter_not_implemented"/);
  assert.match(source, /"role": "human_visualisation_only", "votes": False/);
});

test("the development environment is pinned and cannot enter Git", async () => {
  const [requirements, ignore] = await Promise.all([
    readFile(requirementsUrl, "utf8"),
    readFile(ignoreUrl, "utf8"),
  ]);
  assert.match(requirements, /^basic-pitch==0\.4\.0$/m);
  assert.match(requirements, /^llvmlite==0\.43\.0$/m);
  assert.match(requirements, /^numba==0\.60\.0$/m);
  assert.match(ignore, /\/prototype\/drive-lab\/\.sample-analysis-venv\//);
});
