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

function relativeLuminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function propertyHex(styles, selector, property) {
  const start = styles.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `missing ${selector}`);
  const block = styles.slice(start, styles.indexOf("}", start));
  const match = block.match(new RegExp(`${property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*#([0-9a-f]{6})`, "i"));
  assert.ok(match, `missing ${property} in ${selector}`);
  return match[1];
}

test("the top rail exposes the selected icon-and-label appearance menu", () => {
  const app = read("App.jsx");
  const control = read("appearance-control.jsx");
  const topbar = app.slice(app.indexOf('<header className={`topbar'), app.indexOf("</header>", app.indexOf('<header className={`topbar')));

  assert.ok(topbar.indexOf('className={`network-state') < topbar.indexOf("<AppearanceControl"));
  assert.ok(topbar.indexOf("<AppearanceControl") < topbar.indexOf('className={`gps-state'));
  assert.match(control, /id: "light", label: "LIGHT", icon: "\/third-party\/tabler-icons\/sun\.svg"/);
  assert.match(control, /id: "dark", label: "DARK", icon: "\/third-party\/tabler-icons\/moon\.svg"/);
  assert.match(control, /id: "auto", label: "AUTO", icon: "\/third-party\/tabler-icons\/sun-moon\.svg"/);
  assert.match(control, /aria-haspopup="menu"/);
  assert.match(control, /role="menuitemradio"/);
  assert.match(control, /aria-checked=\{mode === option\.id\}/);
  assert.match(control, /document\.addEventListener\("pointerdown", closeOnOutsidePointer, true\)/);
  assert.match(control, /event\.key !== "Escape"/);
  assert.match(control, /ArrowDown: 1/);
  assert.match(control, /ArrowUp: -1/);
  assert.match(control, /tabIndex=\{mode === option\.id \? 0 : -1\}/);
  assert.match(control, /onBlurCapture=\{\(event\) => \{[\s\S]*?!event\.currentTarget\.contains\(event\.relatedTarget\)[\s\S]*?onOpenChange\(false\)/);
  assert.match(control, /triggerRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
});

test("appearance persistence, runtime resolution and diagnostics remain palette-independent", () => {
  const app = read("App.jsx");
  const runtime = read("appearance-runtime.js");

  assert.match(app, /const initialAppearanceMode = useMemo\(readAppearancePreference, \[\]\)/);
  assert.match(app, /const initialSystemAppearance = useMemo\(readSystemAppearanceSnapshot, \[\]\)/);
  assert.match(app, /subscribeSystemAppearance\(setSystemAppearance\)/);
  assert.match(app, /solarAppearancePhase\(\{[\s\S]*?latitude: mapPosition\.latitude,[\s\S]*?longitude: mapPosition\.longitude,[\s\S]*?\}, Date\.now\(\)\)/);
  assert.doesNotMatch(app, /requestSolarAppearancePhase/);
  assert.match(app, /writeAppearancePreference\(preference\)/);
  assert.match(app, /resetAppearancePreference\(\)/);
  assert.match(app, /data-palette=\{themeId\}/);
  assert.match(app, /data-appearance=\{appearanceResolution\.appearance\}/);
  assert.match(app, /data-appearance-mode=\{appearanceMode\}/);
  assert.match(app, /const holdAppearanceDuringPointer = useCallback\(\(\) => \{[\s\S]*?appearanceModeRef\.current === "auto"[\s\S]*?setAppearanceInteractionActive\(true\)/);
  assert.match(app, /onPointerDownCapture=\{holdAppearanceDuringPointer\}/);
  assert.match(app, /if \(appearanceMode !== "auto"\) \{[\s\S]*?setAppearanceInteractionActive\(false\);[\s\S]*?return undefined/);
  assert.match(app, /const focusNeedsRecovery = restoredControlFocus[\s\S]*?activeElement === document\.body[\s\S]*?activeElement === document\.documentElement/);
  assert.doesNotMatch(app, /appearanceRetainedFocus/);
  assert.match(app, /const changeAppearanceMenuOpen = useCallback\(\(open\) => \{[\s\S]*?if \(open\) setGpsHelpOpen\(false\)/);
  assert.match(app, /const toggleGpsHelp = useCallback\(\(\) => \{[\s\S]*?setAppearanceMenuOpen\(false\);[\s\S]*?setGpsHelpOpen\(\(current\) => !current\)/);
  assert.match(app, /!appearanceMenuOpen[\s\S]*?atlasGpsPresentation\(gpsState, accuracy, source\)\.requiresHelp\) \{[\s\S]*?setGpsHelpOpen\(true\)/);
  assert.match(app, /appearancePreference: appearanceModeRef\.current/);
  assert.match(app, /appearanceSource: appearanceResolutionRef\.current\.source/);
  assert.doesNotMatch(runtime, /data-palette|themeId|--accent/);
  assert.doesNotMatch(app.slice(app.indexOf("appearancePreference:"), app.indexOf("particleType:")), /latitude|longitude|mapPosition/);
});

test("Road Sheet appearance tokens preserve Tesla geometry and visual colour ownership", () => {
  const styles = read("styles.css");

  assert.match(styles, /\.app\[data-appearance="light"\] \{[\s\S]*?--ui-surface: var\(--road-sheet-light-surface\);[\s\S]*?--ui-text: var\(--road-sheet-light-ink\)/);
  assert.match(styles, /\.app\[data-appearance="dark"\] \{[\s\S]*?--ui-surface: var\(--road-sheet-dark-surface\);[\s\S]*?--ui-text: var\(--road-sheet-dark-ink\)/);
  assert.match(styles, /@media \(max-width: 900px\) \{[\s\S]*?grid-template-columns: 164px 104px 112px 86px 84px 116px minmax\(107px, 1fr\)/);
  assert.match(styles, /@media \(min-width: 651px\) and \(max-width: 772px\) \{[\s\S]*?grid-template-columns: 21\.216% 13\.454% 14\.489% 11\.125% 10\.867% 15\.006% 13\.843%/);
  assert.match(styles, /@media \(min-width: 651px\) and \(max-width: 772px\) \{[\s\S]*?grid-template-columns: 11\.384% 11\.384% 23\.933% 27\.167% 10\.349% 15\.783%/);
  assert.match(styles, /\.appearance-option \{[\s\S]*?min-height: var\(--touch-target\)/);
  assert.match(styles, /\.app\[data-appearance\] :is\(\.stop-button > span, \.stop-button::after, \.effects-button::after, \.mix-button small\) \{ color: var\(--ui-muted\); \}/);
  assert.match(styles, /\.app\[data-appearance\] \.visual-render-toggle\[aria-pressed="true"\] \{[\s\S]*?color: var\(--ui-selected-text\);[\s\S]*?background: var\(--ui-selected-surface\);/);
  assert.match(styles, /\.app\[data-appearance\] \.launch-button \{[\s\S]*?color: var\(--ui-text\);[\s\S]*?background: var\(--ui-surface\);/);
  assert.match(styles, /\.app\[data-appearance\] \.support-panel \{[\s\S]*?color: var\(--ui-text\);[\s\S]*?background: var\(--ui-surface\);/);
  assert.match(styles, /\.app\[data-appearance\] \.mode-selector button\.is-active::after \{ background: var\(--ui-accent-text\); \}/);
  assert.match(styles, /\.app\[data-appearance\] \.launch-start-button:focus-visible \{[\s\S]*?box-shadow: inset 0 0 0 2px var\(--ui-accent-text\)/);
  assert.match(styles, /\.app\[data-appearance\] \.play-road-library \.score-entry\.is-active \.score-entry-title b \{ color: var\(--ui-accent-text\); \}/);
  assert.match(styles, /\.app\[data-appearance\] \.diagnostic-grid small \{ color: var\(--ui-muted\); \}/);
  assert.match(styles, /\.app\[data-appearance\] \.diagnostic-grid span \{ color: var\(--ui-subtle\); \}/);
  assert.match(styles, /\.app\[data-appearance\] \.appearance-menu \{[^}]*box-shadow: none/);
  assert.match(styles, /\.app\[data-appearance\] \.atlas-field \.maplibregl-ctrl\.maplibregl-ctrl-attrib \{[\s\S]*?color: var\(--ui-text\);[\s\S]*?opacity: 1/);
  assert.match(styles, /\.app\[data-appearance\] \.discover-navigation-trigger\[aria-expanded="true"\] \{ color: var\(--ui-selected-text\); background: var\(--ui-accent-text\); \}/);
  assert.doesNotMatch(styles, /\.app\[data-appearance="(?:light|dark)"\][^{]*\{[^}]*--accent\s*:/);
  assert.match(styles, /Canvas, iframe and authored visual[\s\S]*?continue to use their own palette/);
  assert.match(styles, /--road-sheet-light-subtle: rgba\(23, 26, 32, \.6\)/);
});

test("appearance-owned signal tokens remain contrast-safe across the colour cycle", () => {
  const styles = read("styles.css");
  const lightSurface = propertyHex(styles, ":root", "--road-sheet-light-surface");
  const darkSurface = propertyHex(styles, ":root", "--road-sheet-light-ink");
  const lightAccent = propertyHex(styles, '.app[data-appearance="light"]', "--ui-accent-text");
  const darkAccent = propertyHex(styles, '.app[data-appearance="dark"]', "--ui-accent-text");
  const lightWaveStops = ["soft", "mid", "deep"].map((name) => (
    propertyHex(styles, '.app[data-appearance="light"]', `--ui-command-wave-${name}`)
  ));
  const darkWaveStops = ["soft", "mid", "deep"].map((name) => (
    propertyHex(styles, '.app[data-appearance="dark"]', `--ui-command-wave-${name}`)
  ));

  assert.ok(contrastRatio(lightAccent, lightSurface) >= 4.5);
  assert.ok(contrastRatio(darkAccent, darkSurface) >= 4.5);
  for (const stop of lightWaveStops) assert.ok(contrastRatio(stop, darkSurface) >= 3);
  for (const stop of darkWaveStops) assert.ok(contrastRatio(stop, lightSurface) >= 3);
});
