import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  chooseJunctionVariation,
  junctionSectionForEnergy,
  parseJunctionBank,
} from "../src/junction-bank.js";

test("JUNCTION chooses authored density and release sections from road energy", () => {
  assert.equal(junctionSectionForEnergy(0), "rest");
  assert.equal(junctionSectionForEnergy(0.1), "open");
  assert.equal(junctionSectionForEnergy(0.25), "enter");
  assert.equal(junctionSectionForEnergy(0.45), "build");
  assert.equal(junctionSectionForEnergy(0.7), "break");
  assert.equal(junctionSectionForEnergy(1), "full");
  assert.equal(junctionSectionForEnergy(0.8, true), "turn");
  assert.equal(junctionSectionForEnergy(0.4, true), "ease");
  assert.equal(junctionSectionForEnergy(0.1, true), "rest");
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
  assert.equal(new Set(parsed.manifest.sections.map((section) => section.take)).size, 3);
  for (const id of ["rest", "open", "enter", "build", "break", "full", "turn", "ease"]) {
    const variations = parsed.manifest.sections.filter((section) => section.id === id);
    assert.deepEqual(variations.map((section) => section.take).sort(), [1, 2, 3]);
    assert.ok(variations.every((section) => section.durationSeconds > 11));
  }
  assert.equal(parsed.manifest.bpm, 168);
  assert.ok(parsed.audioBytes > 1_000_000);
  assert.ok(parsed.audioBytes < 7_000_000, "the Tesla payload must stay compact");
});
