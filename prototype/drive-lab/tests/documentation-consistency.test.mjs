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
  const readyScores = SCORE_GENRES.filter((score) => score.status === SCORE_STATUS.ready);
  assert.deepEqual(readyScores.map((score) => score.id), ["junction", "fracture", "nightshift"]);
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
  assert.ok(!activeOverview.includes("LATITUDES 04"), "rejected Latitudes returned to an active overview");
  assert.ok(!activeOverview.includes("ATLAS 05"), "Atlas retained its superseded catalog number");
});

test("active product identity names enuzzo without a studio attribution", () => {
  const activeIdentity = [
    "README.md",
    "LICENSE-SCOPE.md",
    "NOTICE",
    "docs/BRAND-ASSET-POLICY.md",
    "docs/CURRENT-STATE.md",
    "docs/LICENSING.md",
    "docs/PRODUCT-SPEC.md",
    "prototype/drive-lab/AGENTS.md",
    "prototype/drive-lab/README.md",
    "prototype/drive-lab/package.json",
    "prototype/drive-lab/src/App.jsx",
  ].map(read).join("\n");
  const obsoleteStudioToken = ["net", "milk"].join("");

  assert.ok(!activeIdentity.toLowerCase().includes(obsoleteStudioToken));
  assert.match(activeIdentity, /Copyright \(C\) 2026 enuzzo/);
  assert.match(activeIdentity, /A project by/);
  assert.match(activeIdentity, /https:\/\/github\.com\/enuzzo/);
});

test("operative licensing stays noncommercial without relicensing third-party work", () => {
  const license = read("LICENSE");
  const scope = read("LICENSE-SCOPE.md");
  const notice = read("NOTICE");
  const packageMetadata = JSON.parse(read("prototype/drive-lab/package.json"));
  const packageLock = JSON.parse(read("prototype/drive-lab/package-lock.json"));
  const normalizedScope = scope.replace(/\s+/g, " ");

  assert.match(license, /^# PolyForm Noncommercial License 1\.0\.0/m);
  assert.equal(packageMetadata.license, "PolyForm-Noncommercial-1.0.0");
  assert.equal(packageLock.packages[""].license, packageMetadata.license);
  assert.match(normalizedScope, /source-visible/i);
  assert.match(normalizedScope, /not an open-source project/i);
  assert.match(normalizedScope, /already distributed under `AGPL-3\.0-or-later` retain/i);
  assert.match(notice, /Third-party material keeps its original licence or direct permission/);
  assert.match(notice, /not open source/);
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
