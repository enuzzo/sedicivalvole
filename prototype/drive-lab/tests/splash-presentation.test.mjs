import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { isControlLayerFocused } from "../src/control-visibility.js";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = resolve(TEST_DIR, "../src");
const PROJECT_ROOT = resolve(TEST_DIR, "..");

function read(relativePath) {
  return readFileSync(resolve(SOURCE_ROOT, relativePath), "utf8");
}

test("keyboard focus keeps the retracting control planes awake", () => {
  const app = read("App.jsx");
  assert.equal(isControlLayerFocused({ closest: (selector) => selector === ".control-layer" }), true);
  assert.equal(isControlLayerFocused({ closest: () => null }), false);
  assert.equal(isControlLayerFocused(null), false);
  assert.match(app, /if \(isControlLayerFocused\(document\.activeElement\)\)/);
  assert.match(app, /window\.setTimeout\(restWhenIdle, 800\)/);
  assert.match(app, /onFocusCapture=\{wakeControls\}/);
});

test("launch surface contains only product and action copy", () => {
  const app = read("App.jsx");
  const launchMarkup = app.slice(
    app.indexOf('className="launch-button"'),
    app.indexOf("</button>", app.indexOf('className="launch-button"')),
  );

  assert.match(launchMarkup, /launch-brand">sedicivalvole/);
  assert.match(launchMarkup, /PLAY THE ROAD/);
  assert.doesNotMatch(launchMarkup, /launch-(?:index|vent|safety|latch)/);
});

test("the selected Instrument Deck resolves Music and Visual before START", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");
  const selector = app.slice(app.indexOf("function LaunchSelector"), app.indexOf("export function App"));

  assert.match(app, /setPhase\("choosing"\)/);
  assert.match(selector, /<legend>MUSIC<\/legend>/);
  assert.match(selector, /<legend>VISUAL<\/legend>/);
  assert.match(selector, /FLUX_ENVIRONMENTS\.map/);
  assert.match(selector, /disabled=\{!ready\}/);
  assert.match(selector, /musicId && environmentId/);
  assert.match(selector, /choice\.launchDescription/);
  assert.match(app, /Adaptive scores shaped by the drive/);
  assert.match(app, /Independent artist recordings/);
  assert.match(app, /Visual experience without music/);
  assert.doesNotMatch(selector, /ILLOBO FEATURED/i);
  assert.match(styles, /\.launch-selector-body \{[\s\S]*?grid-template-columns: minmax\(0, \.9fr\) minmax\(0, 1\.25fr\)/);
  assert.match(styles, /\.launch-visual-grid \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /--ui-radius: 6px/);
  for (const selectorName of [
    ".launch-selector",
    ".launch-selector-heading",
    ".launch-selector-heading button",
    ".launch-selector-body",
    ".launch-choice-button",
    ".launch-start-button",
  ]) {
    const escapedSelector = selectorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(styles, new RegExp(`${escapedSelector} \\{[\\s\\S]*?border-radius: var\\(--ui-radius\\)`));
  }
});

test("SOUNDTRACK stays visible but cannot start before its real player exists", () => {
  const app = read("App.jsx");
  const soundtrack = app.slice(app.indexOf('id: "soundtrack"'), app.indexOf('id: "mute"'));

  assert.match(soundtrack, /label: "SOUNDTRACK"/);
  assert.match(soundtrack, /available: false/);
  assert.match(app, /disabled=\{!choice\.available\}/);
  assert.match(app, /COMING NEXT/);
});

test("splash credits the collaborator and links the public source", () => {
  const app = read("App.jsx");

  assert.match(app, /A project by\{" "\}/);
  assert.match(app, /href="https:\/\/github\.com\/enuzzo"/);
  assert.match(app, /aria-label="enuzzo on GitHub"/);
  assert.match(app, />\s*enuzzo\s*<\/a>/);
  assert.doesNotMatch(app, new RegExp(["net", "milk"].join(""), "i"));
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

test("Buy Me a Coffee opens a real, accessible support panel", () => {
  const app = read("App.jsx");
  const envExample = readFileSync(resolve(PROJECT_ROOT, ".env.example"), "utf8");

  assert.match(app, /const DEFAULT_SUPPORT_URL = "https:\/\/buymeacoffee\.com\/enuzzo"/);
  assert.match(app, /parseSupportUrl\(import\.meta\.env\.VITE_SUPPORT_URL\) \|\| DEFAULT_SUPPORT_URL/);
  assert.match(app, /url\.protocol === "https:"/);
  assert.match(app, /buymeacoffee\\\.com/);
  assert.match(app, /className="splash-support-trigger"/);
  assert.match(app, /aria-label="Open Buy Me a Coffee support panel"/);
  assert.match(app, /function DialogSurface\(/);
  assert.match(app, /role="dialog"/);
  assert.match(app, /aria-modal="true"/);
  assert.match(app, /className="support-overlay"[\s\S]*?labelledBy="support-title"/);
  assert.match(app, /src=\{buyMeCoffeeQr\}/);
  assert.match(app, /href=\{SUPPORT_URL\}/);
  assert.match(app, /PROJECT SPARKS/);
  assert.match(app, /PLAYFUL SIGNAL · NOT PURCHASES/);
  assert.match(app, /decodeSuggestionAddress\(\)/);
  assert.doesNotMatch(app, /enuzzo@gmail\.com/);
  assert.match(envExample, /VITE_SUPPORT_URL=https:\/\/buymeacoffee\.com\/your-handle/);
});

test("closing the voice audition returns to diagnostics instead of losing focus", () => {
  const app = read("App.jsx");
  assert.match(app, /const closeVoicePreview = useCallback\(\(\) => \{\s*setPreviewOpen\(false\);\s*setDrawerOpen\(true\);/);
  assert.match(app, /labelledBy="preview-title"[\s\S]*?onClose=\{closeVoicePreview\}/);
  assert.match(app, /onClick=\{closeVoicePreview\} aria-label="Close voice preview"/);
});

test("the support control is top-left and its panel stays compact", () => {
  const styles = read("styles.css");

  assert.match(styles, /\.splash-support-trigger \{[\s\S]*?position: absolute;[\s\S]*?left: clamp\(22px, 4vw, 42px\)/);
  assert.match(styles, /\.support-panel \{[\s\S]*?width: min\(390px, calc\(100vw - 44px\)\)/);
  assert.match(styles, /\.support-overlay \{[\s\S]*?z-index: 8/);
});

test("launch surface stays above every preloaded experience overlay", () => {
  const styles = read("styles.css");
  const splash = styles.slice(styles.indexOf(".splash {"), styles.indexOf(".splash-signal-field"));

  assert.match(splash, /z-index: 20/);
  assert.match(styles, /\.atlas-waiting \{[\s\S]*?z-index: 5/);
  assert.match(styles, /\.atlas-panel \{[\s\S]*?z-index: 6/);
});

test("local exact-viewport QA can keep the Web Audio graph inaudible", () => {
  const app = read("App.jsx");
  assert.match(app, /const QA_MUTED = import\.meta\.env\.DEV && QA_PARAMS\.get\("qaMute"\) === "1"/);
  assert.match(app, /const \[muted, setMuted\] = useState\(QA_MUTED\)/);
  assert.match(app, /const launchMuted = QA_MUTED \|\| musicId === "mute"/);
  assert.match(app, /audioRef\.current\.setMuted\(launchMuted\)/);
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

test("product chrome keeps Orbitron while DIAG owns its readable mono face", () => {
  const styles = read("styles.css");
  const index = readFileSync(resolve(PROJECT_ROOT, "index.html"), "utf8");
  const font = readFileSync(resolve(PROJECT_ROOT, "public/fonts/orbitron-latin-variable.woff2"));

  assert.match(styles, /font-family: "Orbitron";/);
  assert.match(styles, /font-weight: 400 900;/);
  assert.match(styles, /--font-weight-text: 450;/);
  assert.match(styles, /--font-ui: "Orbitron"/);
  assert.match(styles, /--font-data: "IBM Plex Mono"/);
  assert.match(styles, /\.diagnostic-report-drawer \.drawer-panel \{[\s\S]*?font-family: var\(--font-data\)/);
  assert.match(styles, /body \{[\s\S]*?font-family: var\(--font-ui\)/);
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

test("compact viewports keep the mode switch separate and preserve a resting mode marker", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /className="active-mode-marker"[^>]*>FLUX<\/span>/);
  assert.match(styles, /\.controls-resting \.active-mode-marker \{ opacity: \.82; \}/);
  assert.match(styles, /@media \(max-width: 650px\) \{[\s\S]*?grid-template-columns: minmax\(90px, 1fr\) 116px 220px 52px/);
  assert.match(styles, /@media \(max-width: 480px\) \{[\s\S]*?\.wordmark \{ display: none; \}[\s\S]*?\.mode-selector \{ grid-column: 1; \}/);
});
