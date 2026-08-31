import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const analyzerUrl = new URL("../scripts/analyse-sample-harmony.py", import.meta.url);
const requirementsUrl = new URL("../analysis/requirements.txt", import.meta.url);
const arbiterUrl = new URL("../analysis/harmonic_arbiter.py", import.meta.url);
const sourceInspectorUrl = new URL("../scripts/inspect-independent-harmonic-sources.py", import.meta.url);
const ignoreUrl = new URL("../../../.gitignore", import.meta.url);
const evidenceValidatorUrl = new URL("../scripts/validate-junction-pitch-evidence.py", import.meta.url);
const evidenceArtifactUrl = new URL("../analysis/junction-pitch-evidence.json", import.meta.url);

test("the harmony pilot covers the four reachable JUNCTION labels", async () => {
  const source = await readFile(analyzerUrl, "utf8");
  assert.match(source, /JUNCTION_CHORDS = frozenset\(\{"Emin9", "Cmaj7", "Amin7", "Bmin9"\}\)/);
  assert.match(source, /declared_from_filename\(path\)\["label"\] in JUNCTION_CHORDS/);
});

test("independent source inspection never promotes its spectrum to a verdict", async () => {
  const source = await readFile(sourceInspectorUrl, "utf8");
  assert.match(source, /"role": "independent_lower_source_search"/);
  assert.match(source, /"status": "review_evidence_only"/);
  assert.match(source, /proposal_pitch_set_midi/);
  assert.match(source, /lowest_proposed_f_sharp/);
  assert.match(source, /"hypotheses"/);
  assert.doesNotMatch(source, /"verdict"/);
});

test("automatic transcription remains a proposal until the arbiter is validated", async () => {
  const [source, arbiter] = await Promise.all([
    readFile(analyzerUrl, "utf8"),
    readFile(arbiterUrl, "utf8"),
  ]);
  assert.match(source, /"status": "proposal_only"/);
  assert.match(source, /"pitch_set_midi": None/);
  assert.match(source, /"value": "unknown"/);
  assert.match(source, /"harmonic_arbiter_real_audio_requires_review"/);
  assert.match(source, /"proposal_conditioned_feature_not_decision_authority"/);
  assert.match(source, /"review_evidence_only"/);
  assert.match(source, /"role": "human_visualisation_only", "votes": False/);
  assert.match(arbiter, /lower_midis = tuple\(lower_midis\)/);
  assert.match(arbiter, /reason = "proposal_conditioned_feature_not_decision_authority"/);
  assert.match(arbiter, /def independent_harmonic_sources\(/);
  assert.match(arbiter, /observed_peak_frequency_hz/);
  assert.match(arbiter, /hypothesis_frequency_hz/);
  assert.match(arbiter, /def independent_harmonic_source_hypotheses\(/);
  assert.match(arbiter, /fundamental_detected/);
  assert.match(arbiter, /detection_floor_db_relative_to_candidate/);
  assert.match(arbiter, /implied_min_candidate_to_undetected_source_db/);
  assert.doesNotMatch(arbiter, /verdict = "voiced"/);
  assert.doesNotMatch(arbiter, /verdict = "harmonic_of"/);
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

test("the replacement pitch evidence covers every planned axis and abstains explicitly", async () => {
  const [source, artifactSource, packageSource] = await Promise.all([
    readFile(evidenceValidatorUrl, "utf8"),
    readFile(evidenceArtifactUrl, "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const artifact = JSON.parse(artifactSource);
  assert.deepEqual(artifact.result.required_axes, [
    "adsr",
    "filter",
    "phase_seed",
    "detune",
    "chorus",
    "spectral_slope",
    "saturation",
    "stereo_coherence",
  ]);
  assert.equal(artifact.legacy_shortcut.status, "rejected");
  assert.equal(artifact.result.synthetic_acceptance_passed, true);
  assert.equal(artifact.result.real_audio_pitch_gate_authorized, false);
  assert.equal(artifact.result.passed, true);
  assert.ok(
    artifact.cases.filter(({ valid }) => !valid)
      .every(({ verdict, invalidity_reasons: reasons }) => verdict === "unknown" && reasons.length > 0),
  );
  assert.match(source, /phase_aware_two_frequency_model_with_multiaxis_validity_gates/);
  assert.match(source, /sustain_shorter_than_300_ms/);
  assert.match(source, /multiple_unresolved_detuned_sources/);
  assert.match(source, /independent_chorus_modulation_breaks_phase_stationarity/);
  assert.match(packageSource, /"analyze:junction-pitch-evidence"/);
});
