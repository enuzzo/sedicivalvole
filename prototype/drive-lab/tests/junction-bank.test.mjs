import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  chooseJunctionMix,
  chooseJunctionVariation,
  junctionLiveMixParameters,
  junctionSectionForEnergy,
  parseJunctionBank,
} from "../src/junction-bank.js";
import { JUNCTION_SECTIONS } from "../scripts/junction-form.mjs";

test("JUNCTION chooses authored density and release sections from road energy", () => {
  assert.equal(junctionSectionForEnergy(0), "rest");
  assert.equal(junctionSectionForEnergy(0.08), "rest");
  assert.equal(junctionSectionForEnergy(0.1), "open");
  assert.equal(junctionSectionForEnergy(30 / 130), "open");
  assert.equal(junctionSectionForEnergy(40 / 130), "enter");
  assert.equal(junctionSectionForEnergy(60 / 130), "build");
  assert.equal(junctionSectionForEnergy(0.7), "break");
  assert.equal(junctionSectionForEnergy(1), "full");
  assert.equal(junctionSectionForEnergy(0.8, true), "turn");
  assert.equal(junctionSectionForEnergy(0.4, true), "ease");
  assert.equal(junctionSectionForEnergy(0.08, true), "rest");
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
  assert.equal(new Set(byId.open.takes.flatMap((take) => take.beatPhrases.flat())).size, 12);
  assert.ok(JUNCTION_SECTIONS.every((section) => section.takes.length === 13));
  assert.ok(JUNCTION_SECTIONS.every((section) => (
    new Set(section.takes.map((take) => JSON.stringify(take))).size === 13
  )));
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
  assert.ok(mix.mixStart >= 0.18 && mix.mixStart <= 0.48);
  assert.ok(mix.mixEnd >= 0.52 && mix.mixEnd <= 0.82);
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
  assert.equal(parsed.manifest.mixing, "live-two-deck");
  assert.equal(parsed.manifest.sections.length, 104);
  assert.equal(parsed.manifest.takes, 13);
  assert.ok(parsed.manifest.sourceRecordingsUsed >= 100);
  assert.equal(parsed.manifest.barsPerSection, 8);
  assert.equal(parsed.manifest.tempoMode, "authored-sections");
  assert.deepEqual(parsed.manifest.bpmRange, [127, 168]);
  assert.equal(new Set(parsed.manifest.sections.map((section) => section.take)).size, 13);
  assert.equal(parsed.assets.size, 104);
  assert.equal(parsed.manifest.maxDecodedClips, 6);
  for (const id of ["rest", "open", "enter", "build", "break", "full", "turn", "ease"]) {
    const variations = parsed.manifest.sections.filter((section) => section.id === id);
    assert.deepEqual(
      variations.map((section) => section.take).sort((a, b) => a - b),
      Array.from({ length: 13 }, (_, index) => index + 1),
    );
    assert.ok(variations.every((section) => section.durationSeconds > 11));
    assert.ok(variations.every((section) => section.startSeconds === 0));
    assert.equal(new Set(variations.map((section) => section.assetId)).size, 13);
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
  assert.ok(parsed.audioBytes > 15_000_000);
  assert.ok(parsed.audioBytes < 30_000_000, "the cached Tesla payload must stay bounded");
});
