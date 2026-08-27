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

test("launch surface contains only product and action copy", () => {
  const app = read("App.jsx");
  const launchMarkup = app.slice(
    app.indexOf('<button className="launch-button"'),
    app.indexOf("</button>", app.indexOf('<button className="launch-button"')),
  );

  assert.match(launchMarkup, /launch-brand">sedicivalvole/);
  assert.match(launchMarkup, /PLAY THE ROAD/);
  assert.doesNotMatch(launchMarkup, /launch-(?:index|vent|safety|latch)/);
});

test("launch copy has a continuous white-to-red travelling wave", () => {
  const styles = read("styles.css");

  assert.match(styles, /@keyframes launch-text-wave/);
  assert.match(styles, /animation: launch-text-wave 4\.2s linear infinite/);
  assert.match(styles, /#f2eee5/);
  assert.match(styles, /#bd111d/);
});

test("Signal Gate phases every travelling gap independently", () => {
  const field = read("splash-signal-gate.jsx");

  assert.match(field, /laneKey = float\(laneIndex\) \+ float\(sideIndex\) \* 19\.0/);
  assert.match(field, /float gapWidth =/);
  assert.match(field, /float signal = \(1\.0 - gap\)/);
  assert.match(field, /for \(int rayIndex = 0; rayIndex < 8; rayIndex \+= 1\)/);
});
