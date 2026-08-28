import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = resolve(TEST_DIR, "../src");

function read(relativePath) {
  return readFileSync(resolve(SOURCE_ROOT, relativePath), "utf8");
}

test("diagnostic send feedback remains inside the sticky action tray", () => {
  const app = read("App.jsx");
  const actionStart = app.indexOf('<div className="drawer-actions">');
  const actionEnd = app.indexOf("</div>", actionStart);
  const actionMarkup = app.slice(actionStart, actionEnd);

  assert.ok(actionStart >= 0);
  assert.match(actionMarkup, /className=\{`send-state send-state-\$\{sendState\}`\}/);
  assert.match(actionMarkup, /SEND DIAGNOSTIC/);
  assert.match(actionMarkup, /COPY REPORT/);
});

test("Tesla diagnostic actions use one compact four-control row", () => {
  const styles = read("styles.css");
  const actionStart = styles.lastIndexOf(".drawer-actions {");
  const actionStyles = styles.slice(
    actionStart,
    styles.indexOf("button:focus-visible", actionStart),
  );

  assert.match(actionStyles, /position: sticky/);
  assert.match(actionStyles, /bottom: 0/);
  assert.match(actionStyles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(actionStyles, /\.send-state \{ grid-column: 1 \/ -1/);
  assert.match(actionStyles, /\.send-state:empty \{ display: none; \}/);
});

test("secondary device evidence uses a denser four-column hierarchy", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /diagnostic-grid diagnostic-grid-device/);
  assert.match(styles, /\.diagnostic-grid-device \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.diagnostic-grid-device strong \{ margin-top: 4px; font-size: 14px/);
  assert.match(styles, /@media \(max-width: 480px\)[\s\S]*?\.diagnostic-grid-device \{ grid-template-columns: 1fr 1fr; \}/);
});
