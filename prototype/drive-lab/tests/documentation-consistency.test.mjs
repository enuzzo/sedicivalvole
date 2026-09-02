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

test("the queued iPhone experience remains landscape-first and rotation-safe", () => {
  const plan = read("PIANO.md");
  const productSpec = read("docs/PRODUCT-SPEC.md");
  const roadmap = read("docs/ROADMAP.md");
  const currentState = read("docs/CURRENT-STATE.md");

  assert.match(plan, /landscape-first iPhone presentation/i);
  assert.match(productSpec, /phone experience is landscape-first/i);
  assert.match(productSpec, /full-viewport accessible notice asks the user to rotate/i);
  assert.match(productSpec, /portrait-like desktop windows and Tesla `773 × 601` remain unaffected/i);
  assert.match(roadmap, /representative `667 × 375` through\s+`932 × 430` Safari viewports/i);
  assert.match(roadmap, /without reloading or restarting the\s+current audio, selection, or renderer state/i);
  assert.match(currentState, /Build the queued landscape-first iPhone presentation/i);
});

test("future ideas preserve owner provenance and the motion-input truth boundary", () => {
  const readme = read("README.md");
  const futureIdeas = read("docs/FUTURE-IDEAS.md");
  const roadmap = read("docs/ROADMAP.md");
  const plan = read("PIANO.md");

  assert.match(readme, /canonical \[`docs\/FUTURE-IDEAS\.md`\]/);
  assert.match(futureIdeas, /`FI-001` \| Optional iPhone motion\/accelerometer input/);
  assert.match(futureIdeas, /OWNER \| 2026-08-30 \| CAPTURED/);
  assert.match(futureIdeas, /not automatically a more accurate absolute speed source/i);
  assert.match(futureIdeas, /no fabricated speed, no coordinate persistence, no automatic fallback/i);
  assert.match(futureIdeas, /AGENT PROPOSAL \| 2026-08-30 \| CAPTURED · not approved/);
  assert.match(roadmap, /tracked as `FI-001`/);
  assert.match(plan, /Prefer an honest motion-reactive first spike/);
});

test("the three ShaderGradient visuals replace Gradient and GPS journey continuity stays session-only", () => {
  const checklist = read("docs/MILESTONE-CHECKLIST-2026-08-31.md");
  const productSpec = read("docs/PRODUCT-SPEC.md");
  const testQueue = read("docs/TESLA-TEST-QUEUE-2026-08-31.md");

  assert.match(checklist, /JAPANESE MIST 08/);
  assert.match(checklist, /ACID ORCHARD 09/);
  assert.match(checklist, /CHROMATIC SILK 10/);
  assert.match(checklist, /retired and deleted the earlier project-owned `GRADIENT 08`/);
  assert.match(checklist, /app-level collector must continue for the whole running session/);
  assert.match(productSpec, /regardless of the selected visual/);
  assert.match(productSpec, /bounded route\/journey history only in session memory/);
  assert.match(testQueue, /R9-07/);
  assert.doesNotMatch(checklist, /owner must identify any intended eighth visual/);
  assert.doesNotMatch(checklist, /“position” must be clarified/);
});

test("relative Markdown document links resolve", () => {
  const documents = [
    "README.md",
    "docs/CURRENT-STATE.md",
    "docs/FUTURE-IDEAS.md",
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
