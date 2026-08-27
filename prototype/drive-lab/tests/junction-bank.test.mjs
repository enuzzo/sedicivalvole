import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
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

test("the published JUNCTION blob contains one rendered production, not loose samples", async () => {
  const bank = await readFile(new URL("../public/audio/junction.svb", import.meta.url));
  const parsed = parseJunctionBank(bank.buffer.slice(bank.byteOffset, bank.byteOffset + bank.byteLength));
  assert.equal(parsed.manifest.source, "rendered-production");
  assert.equal(parsed.manifest.sections.length, 8);
  assert.equal(parsed.manifest.bpm, 168);
  assert.ok(parsed.audioBytes > 1_000_000);
  assert.ok(parsed.audioBytes < 5_000_000, "the Tesla payload must stay compact");
});
