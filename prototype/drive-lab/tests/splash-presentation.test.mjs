import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = resolve(TEST_DIR, "../src");
const PROJECT_ROOT = resolve(TEST_DIR, "..");

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

test("splash credits the collaborator and links the public source", () => {
  const app = read("App.jsx");

  assert.match(app, /href="https:\/\/netmilk\.ch"/);
  assert.match(app, /aria-label="Netmilk Studio website"/);
  assert.match(app, /href="https:\/\/github\.com\/illobo"/);
  assert.match(app, /with Illobo/);
  assert.match(app, /href="https:\/\/github\.com\/enuzzo\/sedicivalvole"/);
  assert.match(app, /github\.com\/enuzzo\/sedicivalvole/);
  assert.match(app, /className="splash-github-mark"/);
  assert.match(app, /target="_blank"[\s\S]*?rel="noreferrer"/);
});

test("splash links keep light hover contrast and the GitHub mark follows text colour", () => {
  const styles = read("styles.css");

  assert.match(styles, /\.splash-action a:hover \{ color: var\(--paper\)/);
  assert.doesNotMatch(styles, /\.splash-action a:hover \{ color: var\(--ink\)/);
  assert.match(styles, /\.splash-github-mark \{[\s\S]*?fill: currentColor/);
});

test("splash metadata is legible and the complete group sits higher", () => {
  const styles = read("styles.css");

  assert.match(styles, /\.splash-action \{[\s\S]*?bottom: 24px/);
  assert.match(styles, /\.splash-action > small \{[\s\S]*?text-shadow: 0 1px 2px #000, 0 0 8px #000/);
  assert.match(styles, /\.splash-credit \{[\s\S]*?font-size: 12\.5px/);
  assert.match(styles, /\.splash-repository \{[\s\S]*?font-size: 11\.5px/);
  assert.match(styles, /\.splash-privacy \{[\s\S]*?font-size: 10\.5px/);
});

test("Buy Me a Coffee support is ready but remains hidden without a verified URL", () => {
  const app = read("App.jsx");
  const envExample = readFileSync(resolve(PROJECT_ROOT, ".env.example"), "utf8");

  assert.match(app, /const SUPPORT_URL = parseSupportUrl\(import\.meta\.env\.VITE_SUPPORT_URL\)/);
  assert.match(app, /url\.protocol === "https:"/);
  assert.match(app, /buymeacoffee\\\.com/);
  assert.match(app, /\{SUPPORT_URL \? \(/);
  assert.match(app, /href=\{SUPPORT_URL\}/);
  assert.match(app, /BUY ME A COFFEE/);
  assert.match(envExample, /VITE_SUPPORT_URL=https:\/\/buymeacoffee\.com\/your-handle/);
});

test("launch surface stays above every preloaded experience overlay", () => {
  const styles = read("styles.css");
  const splash = styles.slice(styles.indexOf(".splash {"), styles.indexOf(".splash-signal-field"));

  assert.match(splash, /z-index: 20/);
  assert.match(styles, /\.atlas-waiting \{[\s\S]*?z-index: 5/);
  assert.match(styles, /\.atlas-panel \{[\s\S]*?z-index: 6/);
});

test("launch copy has a continuous white-to-red travelling wave", () => {
  const styles = read("styles.css");

  assert.match(styles, /@keyframes launch-text-wave/);
  assert.match(styles, /animation: launch-text-wave 4\.2s linear infinite/);
  assert.match(styles, /background-image: repeating-linear-gradient\(/);
  assert.match(styles, /background-size: 360px 100%/);
  assert.match(styles, /from \{ background-position: 0 50%; \}/);
  assert.match(styles, /to \{ background-position: -360px 50%; \}/);
  assert.match(styles, /#f2eee5/);
  assert.match(styles, /#bd111d/);
});

test("launch typography follows the approved Orbitron hierarchy", () => {
  const styles = read("styles.css");
  const brand = styles.slice(styles.indexOf(".launch-brand {"), styles.indexOf(".launch-command {"));
  const command = styles.slice(styles.indexOf(".launch-command > span:last-child {"), styles.indexOf("@keyframes launch-text-wave"));

  assert.match(brand, /justify-content: center/);
  assert.match(brand, /font-size: clamp\(32px, 5vw, 40px\)/);
  assert.match(brand, /font-weight: 750/);
  assert.match(brand, /letter-spacing: 0/);
  assert.match(brand, /text-align: center/);
  assert.match(command, /font-weight: 600/);
  assert.match(command, /letter-spacing: 0/);
  assert.doesNotMatch(command, /text-indent/);
  assert.match(styles, /grid-template-rows: 68px 1fr/);
  assert.match(styles, /min-height: 78px/);
});

test("Signal Gate phases every travelling gap independently", () => {
  const field = read("splash-signal-gate.jsx");

  assert.match(field, /laneKey = float\(laneIndex\) \+ float\(sideIndex\) \* 19\.0/);
  assert.match(field, /float gapWidth =/);
  assert.match(field, /float signal = \(1\.0 - gap\)/);
  assert.match(field, /for \(int rayIndex = 0; rayIndex < 8; rayIndex \+= 1\)/);
});

test("the complete product UI uses the local Orbitron variable font", () => {
  const styles = read("styles.css");
  const index = readFileSync(resolve(PROJECT_ROOT, "index.html"), "utf8");
  const font = readFileSync(resolve(PROJECT_ROOT, "public/fonts/orbitron-latin-variable.woff2"));

  assert.match(styles, /font-family: "Orbitron";/);
  assert.match(styles, /font-weight: 400 900;/);
  assert.match(styles, /--font-weight-text: 450;/);
  assert.doesNotMatch(styles, /ui-monospace|SFMono|Roboto Mono|IBM Plex Mono|Menlo|Consolas/);
  assert.match(index, /rel="preload" href="\/fonts\/orbitron-latin-variable\.woff2"/);
  assert.ok(font.length > 10_000, "the packaged font should not be an empty placeholder");
});

test("Orbitron telemetry units sit below and align to the value edge", () => {
  const styles = read("styles.css");
  const groups = styles.slice(
    styles.indexOf(".readout-group {"),
    styles.indexOf(".readout-divider {"),
  );

  assert.match(groups, /\.readout-group \{[\s\S]*?flex-direction: column/);
  assert.match(groups, /\.readout-group \{[\s\S]*?align-items: flex-end/);
  assert.match(groups, /\.readout-labels \{[\s\S]*?flex-direction: row-reverse/);
  assert.match(groups, /\.readout-labels \{[\s\S]*?justify-content: flex-start/);
  assert.match(groups, /white-space: nowrap/);
});
