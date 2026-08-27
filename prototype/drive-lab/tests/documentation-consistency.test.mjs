import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { FLUX_ENVIRONMENTS } from "../src/flux-environments.js";
import { FLUX_THEMES } from "../src/flux-themes.js";
import { SCORE_GENRES, SCORE_STATUS } from "../src/score/genres.js";
import { SECTIONS } from "../src/score/jungle-score.js";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(TEST_DIR, "../../..");

function read(relativePath) {
  return readFileSync(resolve(REPOSITORY_ROOT, relativePath), "utf8");
}

test("current-state documentation names every implemented catalog entry", () => {
  const currentState = read("docs/CURRENT-STATE.md");

  for (const environment of FLUX_ENVIRONMENTS) {
    assert.match(currentState, new RegExp(`\\b${environment.label}\\b`));
  }
  for (const score of SCORE_GENRES) {
    assert.match(currentState, new RegExp(`\\b${score.label}\\b`));
  }
  assert.match(currentState, new RegExp(`\\b${FLUX_THEMES.length} themes\\b`));
  assert.match(currentState, new RegExp(`\\b${SECTIONS.length} four-bar sections\\b`));
  assert.equal(
    SCORE_GENRES.filter((score) => score.status === SCORE_STATUS.ready).length,
    1,
    "the current-state wording assumes exactly one selectable score",
  );
});

test("active overview documents do not restore superseded audio claims", () => {
  const activeOverview = [
    "README.md",
    "docs/CURRENT-STATE.md",
    "docs/MODES.md",
    "docs/PRODUCT-SPEC.md",
    "docs/ROADMAP.md",
    "docs/SESSION-HANDOFF.md",
    "docs/TECHNICAL-DIRECTION.md",
    "prototype/drive-lab/README.md",
  ].map(read).join("\n");

  const supersededClaims = [
    "current browser prototype still uses its earlier independent scheduler",
    "four-section authored audio spike",
    "current shared audio score is still rejected",
    "main-thread lookahead scheduler for rapid validation",
    "textstep-worklet.js",
  ];
  for (const claim of supersededClaims) {
    assert.ok(!activeOverview.toLowerCase().includes(claim), `superseded claim returned: ${claim}`);
  }
});

test("relative Markdown document links resolve", () => {
  const documents = [
    "README.md",
    "docs/CURRENT-STATE.md",
    "docs/MODES.md",
    "docs/PRODUCT-SPEC.md",
    "docs/ROADMAP.md",
    "docs/SESSION-HANDOFF.md",
    "docs/SESSION_HANDOFF.md",
    "docs/TECHNICAL-DIRECTION.md",
    "prototype/drive-lab/README.md",
  ];
  const linkPattern = /\[[^\]]+\]\(([^)]+\.md)(?:#[^)]+)?\)/g;

  for (const document of documents) {
    const source = read(document);
    const documentDirectory = dirname(resolve(REPOSITORY_ROOT, document));
    for (const match of source.matchAll(linkPattern)) {
      const target = match[1];
      if (/^[a-z]+:/i.test(target)) continue;
      assert.ok(existsSync(resolve(documentDirectory, target)), `${document} links to missing ${target}`);
    }
  }
});
