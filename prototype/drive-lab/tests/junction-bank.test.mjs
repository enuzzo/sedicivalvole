import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  chooseJunctionPerformance,
  junctionDecodedLimit,
  junctionPerformanceParameters,
  junctionSectionForDrive,
  parseJunctionBank,
} from "../src/junction-bank.js";
import {
  JUNCTION_HARMONIC_IDENTITY,
  JUNCTION_HARMONY,
  JUNCTION_SECTIONS,
  JUNCTION_TAKES,
} from "../scripts/junction-form.mjs";
import { noteVariation } from "../src/score/dsp/instrument-channel.js";

test("JUNCTION maps the representative road sequence onto authored native-tempo states", () => {
  const sequence = [0, 15, 40, 60, 90, 130, 90, 60, 40, 15, 0];
  assert.deepEqual(
    sequence.map((speed) => junctionSectionForDrive(speed / 130)),
    ["rest", "open", "open", "enter", "break", "full", "break", "enter", "open", "open", "rest"],
  );
  assert.equal(junctionSectionForDrive(0.8, true), "turn");
  assert.equal(junctionSectionForDrive(0.4, true), "ease");
  assert.equal(junctionSectionForDrive(0.08, true), "rest");
});

test("JUNCTION enforces the six-clip decoded-memory ceiling against bank metadata", async () => {
  assert.equal(junctionDecodedLimit(2), 2);
  assert.equal(junctionDecodedLimit(6), 6);
  assert.equal(junctionDecodedLimit(50), 6);
  assert.equal(junctionDecodedLimit(undefined), 6);

  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  const malicious = Buffer.from(bank);
  const marker = Buffer.from('"maxDecodedClips":6');
  const at = malicious.indexOf(marker);
  assert.ok(at >= 0);
  malicious[at + marker.length - 1] = "9".charCodeAt(0);
  assert.throws(
    () => parseJunctionBank(malicious.buffer.slice(malicious.byteOffset, malicious.byteOffset + malicious.byteLength)),
    /decoded-memory contract/,
  );

  const missingAsset = Buffer.from(bank);
  const manifestLength = missingAsset.readUInt32LE(8);
  const manifestText = missingAsset.subarray(12, 12 + manifestLength).toString("utf8");
  const sectionsAt = manifestText.indexOf('"sections"');
  const reference = /"assetId":"([^"]+)"/.exec(manifestText.slice(sectionsAt));
  assert.ok(sectionsAt >= 0 && reference);
  const referenceAt = 12 + sectionsAt + reference.index + reference[0].indexOf(reference[1]);
  missingAsset.write("x".repeat(reference[1].length), referenceAt, "utf8");
  assert.throws(
    () => parseJunctionBank(
      missingAsset.buffer.slice(
        missingAsset.byteOffset,
        missingAsset.byteOffset + missingAsset.byteLength,
      ),
    ),
    /section asset reference/,
  );
});

test("JUNCTION has one harmonic grammar, no automatic lead and one tonal identity", () => {
  assert.equal(JUNCTION_HARMONIC_IDENTITY, "emin-afterdark");
  assert.deepEqual(JUNCTION_HARMONY.map((entry) => entry.chord), ["Emin9", "Cmaj7", "Amin7", "Bmin9"]);
  assert.equal(JUNCTION_TAKES, 3);
  for (const section of JUNCTION_SECTIONS) {
    assert.equal(section.harmonicIdentity, JUNCTION_HARMONIC_IDENTITY);
    assert.equal(section.automaticLead, false);
    assert.equal(section.tonalDecks, 1);
    assert.equal(section.takes.length, JUNCTION_TAKES);
    assert.ok(section.takes.every((take) => (
      take.harmonicIdentity === JUNCTION_HARMONIC_IDENTITY
      && take.automaticLead === false
      && take.tonalDecks === 1
    )));
  }
});

test("JUNCTION keeps ambient rest, native urban pacing and the 168 BPM ceiling", () => {
  const byId = Object.fromEntries(JUNCTION_SECTIONS.map((section) => [section.id, section]));
  assert.equal(byId.rest.beatSource, null);
  assert.deepEqual(byId.rest.beatLevels, [0, 0, 0, 0]);
  assert.deepEqual(
    ["open", "enter", "build", "break", "full"].map((id) => byId[id].bpm),
    [127, 135, 158, 164, 168],
  );
  assert.ok(Math.max(...JUNCTION_SECTIONS.map((section) => section.bpm)) <= 168);
  assert.ok(Math.max(...JUNCTION_SECTIONS.flatMap((section) => section.beatLevels)) <= 0.55);
});

test("JUNCTION chooses one complete performance and avoids immediate primary repetition", () => {
  const sections = [
    { id: "build", take: 1 },
    { id: "build", take: 2 },
    { id: "build", take: 3 },
    { id: "rest", take: 1 },
  ];
  assert.deepEqual(chooseJunctionPerformance(sections, "build", 1, () => 0), sections[1]);
  assert.deepEqual(chooseJunctionPerformance(sections, "build", 1, () => 0.99), sections[2]);
  assert.deepEqual(chooseJunctionPerformance(sections, "rest", 1, () => 0.5), sections[3]);
  assert.deepEqual(
    chooseJunctionPerformance(sections, "build", sections[0], () => 0, [sections[1]]),
    sections[2],
  );
});

test("JUNCTION live processing is deterministic, bounded and grows with performance drive", () => {
  const calm = junctionPerformanceParameters(0, 127);
  const fast = junctionPerformanceParameters(1, 168);
  assert.ok(calm.delaySeconds >= 0.12 && calm.delaySeconds <= 0.5);
  assert.ok(fast.delaySeconds >= 0.12 && fast.delaySeconds <= 0.5);
  assert.ok(fast.feedback > calm.feedback);
  assert.ok(fast.wet > calm.wet);
  assert.ok(fast.cutoff > calm.cutoff);
  assert.deepEqual(junctionPerformanceParameters(0.6, 135), junctionPerformanceParameters(0.6, 135));
});

test("the active JUNCTION renderer cannot use rave multisamples or lead motifs", async () => {
  const [renderer, form, builder] = await Promise.all([
    readFile(new URL("../scripts/render-junction-sketch.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/junction-form.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/build-junction-bank.mjs", import.meta.url), "utf8"),
  ]);
  const activeSource = `${renderer}\n${form}\n${builder}`;
  assert.doesNotMatch(activeSource, /loadExactInstrumentNotes|Rave_Lead|RavePiano|JUNCTION_FAMILIES|leadInstrument|melodyVariant/);
  assert.doesNotMatch(activeSource, /two-deck|tonalDecks:\s*2|automaticLead:\s*true/);
});

test("JUNCTION chord voices receive their authored two-bar hold", async () => {
  const renderer = await readFile(
    new URL("../scripts/render-junction-sketch.mjs", import.meta.url),
    "utf8",
  );
  assert.match(
    renderer,
    /new SamplerVoice\(\s*selected\.buffer,\s*variation\.rate,\s*section\.pad \* 0\.46 \* variation\.gain,\s*barFrames \* 2,\s*\)/,
  );
  assert.doesNotMatch(
    renderer,
    /section\.pad \* 0\.46 \* variation\.gain,\s*section\.pad \* 0\.46 \* variation\.gain/,
  );
});

test("sample variation declares only the gain and detune dimensions the renderer applies", () => {
  const variation = noteVariation(42);
  assert.deepEqual(Object.keys(variation).sort(), ["gain", "rate"]);
  assert.ok(variation.gain >= 0.88 && variation.gain <= 1.12);
  assert.ok(variation.rate >= 0.9989 && variation.rate <= 1.0011);
});

test("the published JUNCTION bank is a small single-performance production bank", async () => {
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  const parsed = parseJunctionBank(bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength));
  assert.equal(parsed.manifest.source, "rendered-production");
  assert.equal(parsed.manifest.format, "sedicivalvole.music-bank.v4");
  assert.equal(parsed.manifest.mixing, "single-synchronous-performance");
  assert.equal(parsed.manifest.transitionMode, "complete-eight-bar-boundary");
  assert.equal(parsed.manifest.selfContainedSections, true);
  assert.equal(parsed.manifest.harmonicIdentity, JUNCTION_HARMONIC_IDENTITY);
  assert.equal(parsed.manifest.tonalDecks, 1);
  assert.equal(parsed.manifest.automaticLead, false);
  assert.equal(parsed.manifest.raveMultisamples, false);
  assert.deepEqual(parsed.manifest.harmonicGrammar, ["Emin9", "Cmaj7", "Amin7", "Bmin9"]);
  assert.ok(parsed.manifest.sectionEdgeFadeMilliseconds >= 6);
  assert.equal(parsed.manifest.sections.length, 24);
  assert.equal(parsed.manifest.takes, 3);
  assert.equal(parsed.manifest.musicalIdentities, 1);
  assert.equal(parsed.manifest.barsPerSection, 8);
  assert.equal(parsed.manifest.tempoMode, "authored-sections");
  assert.deepEqual(parsed.manifest.bpmRange, [127, 168]);
  assert.equal(parsed.assets.size, 24);
  assert.equal(parsed.manifest.maxDecodedClips, 6);
  assert.ok(parsed.audioBytes < 8_000_000);
  for (const id of ["rest", "open", "enter", "build", "break", "full", "turn", "ease"]) {
    const variations = parsed.manifest.sections.filter((section) => section.id === id);
    assert.deepEqual(variations.map((section) => section.take).sort(), [1, 2, 3]);
    assert.ok(variations.every((section) => section.durationSeconds > 11));
    assert.ok(variations.every((section) => section.startSeconds === 0));
    assert.ok(variations.every((section) => section.harmonicIdentity === JUNCTION_HARMONIC_IDENTITY));
    assert.ok(variations.every((section) => section.tonalDecks === 1 && section.automaticLead === false));
  }
  assert.ok(parsed.manifest.sections.filter((section) => section.id === "rest").every(
    (section) => section.bpm === 127 && !section.activeLanes.includes("breaks"),
  ));
  assert.ok(parsed.manifest.sections.filter((section) => section.id === "full").every(
    (section) => section.bpm === 168 && section.activeLanes.includes("breaks"),
  ));
  assert.equal(
    [...parsed.assets.values()].reduce((total, asset) => total + asset.audio.size, 0),
    parsed.audioBytes,
  );
  assert.ok([...parsed.assets.values()].every((asset) => asset.decodedPcmBytes < 7_000_000));
});
