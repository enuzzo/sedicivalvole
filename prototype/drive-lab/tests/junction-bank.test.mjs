import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  chooseJunctionVariation,
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

test("the published JUNCTION blob contains one rendered production, not loose samples", async () => {
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  const parsed = parseJunctionBank(bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength));
  assert.equal(parsed.manifest.source, "rendered-production");
  assert.equal(parsed.manifest.sections.length, 24);
  assert.equal(parsed.manifest.takes, 3);
  assert.equal(parsed.manifest.barsPerSection, 8);
  assert.equal(parsed.manifest.tempoMode, "authored-sections");
  assert.deepEqual(parsed.manifest.bpmRange, [127, 168]);
  assert.equal(new Set(parsed.manifest.sections.map((section) => section.take)).size, 3);
  for (const id of ["rest", "open", "enter", "build", "break", "full", "turn", "ease"]) {
    const variations = parsed.manifest.sections.filter((section) => section.id === id);
    assert.deepEqual(variations.map((section) => section.take).sort(), [1, 2, 3]);
    assert.ok(variations.every((section) => section.durationSeconds > 11));
  }
  assert.ok(parsed.manifest.sections.filter((section) => section.id === "rest").every(
    (section) => section.bpm === 127 && !section.activeLanes.includes("breaks"),
  ));
  assert.ok(parsed.manifest.sections.filter((section) => section.id === "full").every(
    (section) => section.bpm === 168 && section.activeLanes.includes("breaks"),
  ));
  for (let index = 1; index < parsed.manifest.sections.length; index += 1) {
    const previous = parsed.manifest.sections[index - 1];
    const current = parsed.manifest.sections[index];
    assert.ok(Math.abs(
      current.startSeconds - (previous.startSeconds + previous.durationSeconds),
    ) < 1e-9, "variable-tempo sections must remain gapless");
  }
  assert.ok(parsed.audioBytes > 1_000_000);
  assert.ok(parsed.audioBytes < 7_000_000, "the Tesla payload must stay compact");
});
