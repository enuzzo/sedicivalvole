import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  chooseJunctionMix,
  chooseJunctionVariation,
  junctionLiveMixParameters,
  junctionMovementGain,
  junctionSectionForEnergy,
  parseJunctionBank,
} from "../src/junction-bank.js";
import {
  JUNCTION_FAMILIES,
  JUNCTION_SECTIONS,
  JUNCTION_TAKES,
  junctionFamilyMelodyNotes,
} from "../scripts/junction-form.mjs";
import { JUNGLE_ROOT, RAVE_ROOT } from "../scripts/sample-library.mjs";

test("the rave library resolves inside the supplied Jungle Samples folder", () => {
  assert.equal(RAVE_ROOT, `${JUNGLE_ROOT}/Rave Synths`);
});

test("JUNCTION chooses authored density and release sections from road energy", () => {
  assert.equal(junctionSectionForEnergy(0), "rest");
  assert.equal(junctionSectionForEnergy(0.08), "rest");
  assert.equal(junctionSectionForEnergy(0.1), "open");
  assert.equal(junctionSectionForEnergy(30 / 130), "open");
  assert.equal(junctionSectionForEnergy(40 / 130), "open");
  assert.equal(junctionSectionForEnergy(45 / 130), "enter");
  assert.equal(junctionSectionForEnergy(60 / 130), "enter");
  assert.equal(junctionSectionForEnergy(66 / 130), "build");
  assert.equal(junctionSectionForEnergy(0.7), "break");
  assert.equal(junctionSectionForEnergy(1), "full");
  assert.equal(junctionSectionForEnergy(0.8, true), "turn");
  assert.equal(junctionSectionForEnergy(0.4, true), "ease");
  assert.equal(junctionSectionForEnergy(0.08, true), "rest");
});

test("JUNCTION launch stays silent and fades in before the first break", () => {
  assert.equal(junctionMovementGain(0), 0);
  assert.equal(junctionMovementGain(4 / 130), 0);
  assert.ok(junctionMovementGain(7 / 130) > 0.45);
  assert.ok(junctionMovementGain(7 / 130) < 0.55);
  assert.equal(junctionMovementGain(10 / 130), 1);
  assert.equal(junctionMovementGain(1), 1);
});

test("JUNCTION leaves rest beatless and builds tempo and break level without racing", () => {
  const byId = Object.fromEntries(JUNCTION_SECTIONS.map((section) => [section.id, section]));
  assert.equal(byId.rest.beatSource, null);
  assert.deepEqual(byId.rest.beatLevels, [0, 0, 0, 0]);
  assert.equal(byId.open.bpm, 127);
  assert.ok(byId.open.beatLevels.every((level, index, levels) => index === 0 || level > levels[index - 1]));
  assert.deepEqual(
    ["open", "enter", "build", "break", "full"].map((id) => byId[id].bpm),
    [127, 135, 158, 164, 168],
  );
  assert.ok(Math.max(...JUNCTION_SECTIONS.flatMap((section) => section.beatLevels)) <= 0.55);
  assert.ok(new Set(byId.open.takes.flatMap((take) => take.beatPhrases.flat())).size >= 8);
  assert.equal(JUNCTION_TAKES, 20);
  assert.ok(JUNCTION_SECTIONS.every((section) => section.takes.length === 20));
  assert.ok(JUNCTION_SECTIONS.every((section) => (
    new Set(section.takes.map((take) => JSON.stringify(take))).size === 20
  )));
});

test("JUNCTION provides five genuinely distinct harmonic and colour families", () => {
  assert.equal(JUNCTION_FAMILIES.length, 5);
  assert.equal(new Set(JUNCTION_FAMILIES.map((family) => family.id)).size, 5);
  assert.equal(new Set(JUNCTION_FAMILIES.map((family) => (
    family.progression.map((step) => step.chord).join("-")
  ))).size, 5);
  assert.equal(new Set(JUNCTION_FAMILIES.map((family) => family.leadInstrument)).size, 5);
  assert.ok(JUNCTION_FAMILIES.every((family) => family.colorSteps.length >= 1));
  assert.ok(JUNCTION_FAMILIES.every((family) => family.motif.length >= 3));
  assert.ok(JUNCTION_FAMILIES.every((family) => junctionFamilyMelodyNotes(family).length >= 12));
  for (const family of JUNCTION_FAMILIES) {
    for (const step of family.progression) {
      for (const event of family.motif) {
        const midi = step.accentMidis[event.degree % step.accentMidis.length];
        assert.ok(step.accentMidis.includes(midi));
      }
    }
  }
  for (const section of JUNCTION_SECTIONS) {
    const familyCounts = section.takes.reduce((counts, take) => {
      counts[take.family] = (counts[take.family] ?? 0) + 1;
      return counts;
    }, {});
    assert.deepEqual(Object.values(familyCounts).sort((a, b) => a - b), [4, 4, 4, 4, 4]);
    for (const family of JUNCTION_FAMILIES) {
      const rhythms = Object.groupBy(
        section.takes.filter((take) => take.family === family.id),
        (take) => take.rhythmId,
      );
      assert.deepEqual(Object.values(rhythms).map((takes) => takes.length).sort(), [2, 2]);
      for (const takes of Object.values(rhythms)) {
        assert.equal(new Set(takes.map((take) => JSON.stringify(take.beatPhrases))).size, 1);
      }
    }
  }
});

test("JUNCTION changes take only at a section boundary and avoids an immediate repeat", () => {
  const sections = [
    { id: "build", take: 1 },
    { id: "build", take: 2 },
    { id: "build", take: 3 },
    { id: "rest", take: 1 },
  ];
  assert.deepEqual(chooseJunctionVariation(sections, "build", 1, () => 0), sections[1]);
  assert.deepEqual(chooseJunctionVariation(sections, "build", 1, () => 0.99), sections[2]);
  assert.deepEqual(chooseJunctionVariation(sections, "rest", 1, () => 0.5), sections[3]);
});

test("JUNCTION creates a distinct two-deck mix without repeating the primary take", () => {
  const sections = [
    { id: "build", take: 1 },
    { id: "build", take: 2 },
    { id: "build", take: 3 },
  ];
  const mix = chooseJunctionMix(sections, "build", 1, () => 0);
  assert.equal(mix.primary.take, 2);
  assert.equal(mix.secondary.take, 1);
  assert.notEqual(mix.primary.take, mix.secondary.take);
  assert.ok(mix.mixStart >= 0.12 && mix.mixStart <= 0.28);
  assert.ok(mix.mixEnd >= 0.3 && mix.mixEnd <= 0.48);
});

test("JUNCTION rotates musical families and mixes only harmony-compatible takes", () => {
  const sections = [
    { id: "build", take: 1, family: "afterdark" },
    { id: "build", take: 6, family: "afterdark" },
    { id: "build", take: 2, family: "lift" },
    { id: "build", take: 7, family: "lift" },
    { id: "build", take: 3, family: "signal" },
    { id: "build", take: 8, family: "signal" },
  ];
  const mix = chooseJunctionMix(sections, "build", sections[0], () => 0);
  assert.equal(mix.primary.family, "lift");
  assert.equal(mix.secondary.family, "lift");
  assert.notEqual(mix.primary.take, mix.secondary.take);
});

test("JUNCTION mixes only takes with the same rhythmic spine", () => {
  const sections = [
    { id: "build", take: 1, family: "afterdark", rhythmId: "afterdark-a" },
    { id: "build", take: 6, family: "afterdark", rhythmId: "afterdark-a" },
    { id: "build", take: 11, family: "afterdark", rhythmId: "afterdark-b" },
    { id: "build", take: 16, family: "afterdark", rhythmId: "afterdark-b" },
    { id: "build", take: 2, family: "lift", rhythmId: "lift-a" },
    { id: "build", take: 7, family: "lift", rhythmId: "lift-a" },
  ];
  const mix = chooseJunctionMix(sections, "build", sections[0], () => 0);
  assert.equal(mix.primary.family, "lift");
  assert.equal(mix.primary.rhythmId, mix.secondary.rhythmId);
});

test("JUNCTION prefers families and takes outside the recent listening window", () => {
  const sections = ["afterdark", "lift", "signal", "orbit", "return"].flatMap((family, index) => [
    { id: "build", take: index + 1, family, rhythmId: `${family}-a` },
    { id: "build", take: index + 6, family, rhythmId: `${family}-a` },
  ]);
  const recent = [sections[2], sections[4], sections[6]];
  const mix = chooseJunctionMix(sections, "build", sections[0], () => 0, recent);
  assert.equal(mix.primary.family, "return");
  assert.ok(!recent.some((entry) => entry.take === mix.primary.take));
});

test("JUNCTION live effects remain bounded and grow with road energy", () => {
  const calm = junctionLiveMixParameters(0, 127, () => 0);
  const fast = junctionLiveMixParameters(1, 168, () => 0);
  assert.ok(calm.delaySeconds >= 0.12 && calm.delaySeconds <= 0.5);
  assert.ok(fast.delaySeconds >= 0.12 && fast.delaySeconds <= 0.5);
  assert.ok(fast.feedback > calm.feedback);
  assert.ok(fast.wet > calm.wet);
  assert.ok(fast.cutoff > calm.cutoff);
});

test("the published JUNCTION blob contains lazy processed mix blocks, not loose samples", async () => {
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  const parsed = parseJunctionBank(bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength));
  assert.equal(parsed.manifest.source, "rendered-production");
  assert.equal(parsed.manifest.format, "sedicivalvole.music-bank.v3");
  assert.equal(parsed.manifest.mixing, "live-rhythm-locked-two-deck");
  assert.equal(parsed.manifest.transitionMode, "complete-eight-bar-boundary");
  assert.equal(parsed.manifest.selfContainedSections, true);
  assert.equal(parsed.manifest.rhythmLockedMixes, true);
  assert.ok(parsed.manifest.sectionEdgeFadeMilliseconds >= 6);
  assert.equal(parsed.manifest.sections.length, 160);
  assert.equal(parsed.manifest.takes, 20);
  assert.equal(parsed.manifest.musicalFamilies, 5);
  assert.ok(parsed.manifest.sourceRecordingsUsed >= 100);
  assert.equal(parsed.manifest.barsPerSection, 8);
  assert.equal(parsed.manifest.tempoMode, "authored-sections");
  assert.deepEqual(parsed.manifest.bpmRange, [127, 168]);
  assert.equal(new Set(parsed.manifest.sections.map((section) => section.take)).size, 20);
  assert.equal(new Set(parsed.manifest.sections.map((section) => section.family)).size, 5);
  assert.equal(parsed.assets.size, 160);
  assert.equal(parsed.manifest.maxDecodedClips, 6);
  for (const id of ["rest", "open", "enter", "build", "break", "full", "turn", "ease"]) {
    const variations = parsed.manifest.sections.filter((section) => section.id === id);
    assert.deepEqual(
      variations.map((section) => section.take).sort((a, b) => a - b),
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
    assert.ok(variations.every((section) => section.durationSeconds > 11));
    assert.ok(variations.every((section) => section.startSeconds === 0));
    assert.equal(new Set(variations.map((section) => section.assetId)).size, 20);
    const familyCounts = Object.values(Object.groupBy(variations, (section) => section.family))
      .map((group) => group.length)
      .sort((a, b) => a - b);
    assert.deepEqual(familyCounts, [4, 4, 4, 4, 4]);
    for (const group of Object.values(Object.groupBy(variations, (section) => section.rhythmId))) {
      assert.equal(group.length, 2);
    }
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
  const twoLargestClips = [...parsed.assets.values()]
    .map((asset) => asset.decodedPcmBytes)
    .sort((a, b) => b - a)
    .slice(0, 2);
  assert.ok(twoLargestClips.reduce((total, bytes) => total + bytes, 0) < 13_000_000);
  assert.equal(bank.includes(Buffer.from("Jungle_Beat")), false);
  assert.equal(bank.includes(Buffer.from("BonusBeat_")), false);
  assert.ok(parsed.audioBytes > 28_000_000);
  assert.ok(parsed.audioBytes < 50_000_000, "the cached Tesla payload must stay bounded");
});
