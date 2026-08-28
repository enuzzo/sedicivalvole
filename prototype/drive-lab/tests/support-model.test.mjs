import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { decodeSuggestionAddress, supportMomentumCount } from "../src/support-model.js";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const SUPPORT_EPOCH = Date.UTC(2026, 7, 28);
const DAY = 24 * 60 * 60 * 1000;

test("the transparent project-sparks signal starts at 15 and grows slowly by day", () => {
  assert.equal(supportMomentumCount(SUPPORT_EPOCH), 15);
  assert.equal(supportMomentumCount(SUPPORT_EPOCH + DAY), 17);
  assert.equal(supportMomentumCount(SUPPORT_EPOCH + 4 * DAY), 24);
  assert.equal(supportMomentumCount(SUPPORT_EPOCH - DAY), 15);
});

test("the suggestion address is reconstructed only at runtime", () => {
  const expected = ["enuzzo", "gmail.com"].join("@");
  assert.equal(decodeSuggestionAddress(), expected);
});

test("the supplied Buy Me a Coffee QR remains byte-identical", () => {
  const qr = readFileSync(resolve(TEST_DIR, "../src/assets/bmc_qr.png"));
  assert.equal(
    createHash("sha256").update(qr).digest("hex"),
    "2ea4f11b865e760efd41fb4654730f31bf6cc0d348db39c245f96dcf3aac80e6",
  );
});

