import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = resolve(TEST_DIR, "../src");
const PUBLIC_ROOT = resolve(TEST_DIR, "../public");

function read(relativePath) {
  return readFileSync(resolve(SOURCE_ROOT, relativePath), "utf8");
}

test("the top bar exposes the selected REPORT control with the pinned Tabler icon", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");
  const markStart = app.indexOf('<button\n            className="topbar-mark"');
  const markEnd = app.indexOf("</button>", markStart);
  const markMarkup = app.slice(markStart, markEnd);
  const reportStart = app.indexOf('<button\n            className="report-button"');
  const reportEnd = app.indexOf("</button>", reportStart);
  const reportMarkup = app.slice(reportStart, reportEnd);
  const topbarStart = app.indexOf('<header className="topbar');
  const topbarEnd = app.indexOf("</header>", topbarStart);
  const icon = readFileSync(resolve(PUBLIC_ROOT, "third-party/tabler-icons/report-analytics.svg"));
  const license = readFileSync(resolve(PUBLIC_ROOT, "third-party/tabler-icons/LICENSE"), "utf8");

  assert.ok(markStart >= 0);
  assert.match(app, /const TOPBAR_MARK_URL = `\/brand\/product-icon-512\.png\?build=\$\{encodeURIComponent\(APP_BUILD\)\}`/);
  assert.match(markMarkup, /aria-label="Open session report"/);
  assert.match(markMarkup, /src=\{appearanceResolution\.appearance === "light" \? BRAND_MARK_URL : TOPBAR_MARK_URL\}/);
  assert.match(markMarkup, /alt=""/);
  assert.match(markMarkup, /aria-hidden="true"/);
  assert.doesNotMatch(markMarkup, />\s*sedicivalvole\s*</);
  assert.ok(reportStart >= 0);
  assert.match(reportMarkup, /aria-label="Open session report"/);
  assert.match(reportMarkup, /aria-haspopup="dialog"/);
  assert.match(reportMarkup, /src="\/third-party\/tabler-icons\/report-analytics\.svg"/);
  assert.match(reportMarkup, /aria-hidden="true"/);
  assert.match(reportMarkup, /<span>REPORT<\/span>/);
  assert.doesNotMatch(app.slice(topbarStart, topbarEnd), />DIAG</);
  assert.match(styles, /\.report-button \{[^}]*grid-template-rows: 22px auto;[^}]*gap: 4px/);
  assert.match(styles, /\.report-button img \{[^}]*width: 21px;[^}]*height: 21px/);
  assert.match(styles, /\.topbar \{[^}]*grid-template-columns: 72px 184px minmax\(112px, 1fr\) 112px 86px 80px 112px 108px/);
  assert.match(styles, /\.topbar-mark img \{[\s\S]*?width: 46px;[\s\S]*?height: 46px/);
  assert.equal(icon.length, 618);
  assert.equal(createHash("sha256").update(icon).digest("hex"), "d58847492f890b8beedc7eff543860219e0f382e46d2c2695107d64ae434b9ba");
  assert.match(license, /Copyright \(c\) 2020-2026 Paweł Kuna/);
  assert.match(license, /MIT License/);
});

test("diagnostic submission keeps essential consent beside the action", () => {
  const app = read("App.jsx");
  const submitStart = app.indexOf('<section className="diagnostic-submit"');
  const submitEnd = app.indexOf('<section className="raw-report"', submitStart);
  const submitMarkup = app.slice(submitStart, submitEnd);

  assert.ok(submitStart >= 0);
  assert.match(submitMarkup, /Coordinate-free technical report/);
  assert.match(submitMarkup, /Nothing is transmitted until SEND DIAGNOSTIC/);
  assert.match(submitMarkup, /className=\{`send-state send-state-\$\{sendState\}`\}/);
  assert.match(submitMarkup, /SEND DIAGNOSTIC/);
  assert.match(submitMarkup, /COPY REPORT/);
});

test("Tesla diagnostic actions stay in flow instead of obscuring metrics", () => {
  const styles = read("styles.css");
  const actionStart = styles.indexOf(".diagnostic-report-drawer .drawer-actions {");
  const actionStyles = styles.slice(actionStart, styles.indexOf(".raw-report {", actionStart));

  assert.match(actionStyles, /position: static/);
  assert.match(actionStyles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(actionStyles, /position: sticky/);
  assert.doesNotMatch(actionStyles, /bottom: 0/);
});

test("the operational surface is an aligned Space Grotesk instrument", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /diagnostic-health/);
  assert.match(app, /Motion and location/);
  assert.match(app, /Runtime and rendering/);
  assert.match(app, /Audio and resources/);
  assert.match(app, /Session and transport/);
  assert.match(styles, /--font-data: "Space Grotesk"/);
  assert.match(styles, /\.instrument-grid \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.instrument-metric \{[\s\S]*?grid-template-columns: minmax\(94px, \.72fr\) minmax\(0, 1\.28fr\)/);
  assert.match(styles, /font-variant-numeric: tabular-nums slashed-zero/);
});

test("README carries privacy, provenance, licensing, and source details", () => {
  const app = read("App.jsx");

  assert.match(app, /aria-controls="diagnostic-readme"/);
  assert.match(app, /No analytics or automatic remote telemetry is enabled/);
  assert.match(app, /Coordinates are not collected, stored, copied, or included/);
  assert.match(app, /76 royalty-free MusicRadar source recordings/);
  assert.match(app, /source packs are not[\s\S]*?redistributed/);
  assert.match(app, /PolyForm Noncommercial\s+License 1\.0\.0/);
  assert.match(app, /not open source/);
  assert.match(app, /THIRD-PARTY NOTICES/);
  assert.match(app, /DIAGNOSTIC ARCHITECTURE/);
});

test("raw JSON uses the drawer's single scroll context at readable size", () => {
  const styles = read("styles.css");
  const rawStart = styles.indexOf(".diagnostic-report-drawer .raw-report pre {");
  const rawStyles = styles.slice(rawStart, styles.indexOf(".diagnostic-readme {", rawStart));

  assert.match(rawStyles, /overflow: visible/);
  assert.match(rawStyles, /max-height: none/);
  assert.match(rawStyles, /font-size: var\(--type-body\)/);
  assert.doesNotMatch(rawStyles, /overflow: auto/);
});

test("Space Grotesk is packaged with its unmodified OFL notice", () => {
  const variable = resolve(PUBLIC_ROOT, "fonts/space-grotesk-variable.ttf");
  const license = readFileSync(resolve(PUBLIC_ROOT, "fonts/OFL-Space-Grotesk.txt"), "utf8");

  assert.equal(statSync(variable).size, 136676);
  assert.match(license, /Copyright 2020 The Space Grotesk Project Authors/);
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
});
