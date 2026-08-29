import assert from "node:assert/strict";
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
  assert.match(actionStyles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(actionStyles, /position: sticky/);
  assert.doesNotMatch(actionStyles, /bottom: 0/);
});

test("the operational surface is an aligned mono instrument", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /diagnostic-health/);
  assert.match(app, /Motion and location/);
  assert.match(app, /Runtime and rendering/);
  assert.match(app, /Audio and resources/);
  assert.match(app, /Session and transport/);
  assert.match(styles, /--font-data: "IBM Plex Mono"/);
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
  assert.match(app, /AGPL-3\.0-or-later/);
  assert.match(app, /THIRD-PARTY NOTICES/);
  assert.match(app, /DIAGNOSTIC ARCHITECTURE/);
});

test("raw JSON uses the drawer's single scroll context at readable size", () => {
  const styles = read("styles.css");
  const rawStart = styles.indexOf(".diagnostic-report-drawer .raw-report pre {");
  const rawStyles = styles.slice(rawStart, styles.indexOf(".diagnostic-readme {", rawStart));

  assert.match(rawStyles, /overflow: visible/);
  assert.match(rawStyles, /max-height: none/);
  assert.match(rawStyles, /font-size: 12px/);
  assert.doesNotMatch(rawStyles, /overflow: auto/);
});

test("IBM Plex Mono is packaged with its unmodified OFL notice", () => {
  const regular = resolve(PUBLIC_ROOT, "fonts/ibm-plex-mono-regular.ttf");
  const semibold = resolve(PUBLIC_ROOT, "fonts/ibm-plex-mono-semibold.ttf");
  const license = readFileSync(resolve(PUBLIC_ROOT, "fonts/OFL-IBM-Plex-Mono.txt"), "utf8");

  assert.equal(statSync(regular).size, 135580);
  assert.equal(statSync(semibold).size, 140216);
  assert.match(license, /Copyright © 2017 IBM Corp/);
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
});
