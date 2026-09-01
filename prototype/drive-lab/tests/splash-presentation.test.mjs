import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  isControlLayerFocused,
  shouldReleaseControlFocus,
} from "../src/control-visibility.js";

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

test("completed control actions and closed surfaces return focus to the experience", () => {
  const app = read("App.jsx");
  const controlAction = {
    closest: (selector) => selector.includes(".control-layer button") ? {} : null,
  };
  assert.equal(shouldReleaseControlFocus(controlAction, false), true);
  assert.equal(shouldReleaseControlFocus(controlAction, true), false);
  assert.equal(shouldReleaseControlFocus({ closest: () => null }, false), false);
  assert.equal(shouldReleaseControlFocus(null, false), false);
  assert.match(app, /const controlsPinned = modalOpen \|\| manualEffectsDeckOpen \|\| gpsHelpOpen/);
  assert.match(app, /if \(wasPinned && !controlsPinned\) queueExperienceFocus\(\)/);
  assert.match(app, /if \(phase !== "running" \|\| controlsPinnedRef\.current\) return/);
  assert.match(app, /appRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(app, /onClickCapture=\{handleControlActivation\}/);
});

test("launch surface contains only product and action copy", () => {
  const app = read("App.jsx");
  const launchMarkup = app.slice(
    app.indexOf('className="launch-button"'),
    app.indexOf("</button>", app.indexOf('className="launch-button"')),
  );

  assert.match(launchMarkup, /launch-brand">[\s\S]*?BRAND_MARK_URL[\s\S]*?<span>sedicivalvole<\/span>/);
  assert.match(launchMarkup, /alt="" aria-hidden="true"/);
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
  assert.match(app, /const BRAND_MARK_URL = `\/brand\/sedicivalvole-mark\.svg\?build=\$\{encodeURIComponent\(APP_BUILD\)\}`/);
  assert.match(selector, /className="launch-selector-mark"[\s\S]*?src=\{BRAND_MARK_URL\}[\s\S]*?alt=""[\s\S]*?aria-hidden="true"/);
  assert.match(selector, /FLUX_ENVIRONMENTS\.map/);
  assert.match(selector, /disabled=\{!ready\}/);
  assert.match(selector, /musicId && environmentId/);
  assert.match(selector, /choice\.launchDescription/);
  assert.match(selector, /<strong>\{choice\.displayLabel\}<\/strong>/);
  assert.match(selector, /<strong>\{displayLabel\(choice\)\}<\/strong>/);
  assert.match(app, /displayLabel: "Play the Road"/);
  assert.match(app, /displayLabel: "Soundtrack"/);
  assert.match(app, /displayLabel: "Mute"/);
  assert.match(app, /Adaptive music shaped by your drive/);
  assert.match(app, /Independent Jamendo artist recordings/);
  assert.match(app, /Visuals only\. No music\./);
  assert.doesNotMatch(selector, /ILLOBO FEATURED/i);
  assert.match(styles, /\.launch-selector \{[\s\S]*?--sheet-surface: var\(--road-sheet-light-surface\)[\s\S]*?grid-template-rows: 72px minmax\(0, 1fr\) 58px[\s\S]*?width: min\(724px, calc\(100vw - 48px\)\)[\s\S]*?height: min\(552px, calc\(100dvh - 48px\)\)/);
  assert.match(styles, /\.launch-selector-heading \{[\s\S]*?grid-template-columns: 54px max-content minmax\(0, 1fr\) 68px[\s\S]*?column-gap: 10px/);
  assert.match(styles, /\.launch-selector-mark \{[\s\S]*?grid-column: 1[\s\S]*?width: 52px;[\s\S]*?height: 52px/);
  assert.match(styles, /\.launch-selector-heading h1 \{[\s\S]*?grid-column: 2[\s\S]*?justify-self: start[\s\S]*?font-size: clamp\(27px, 4\.2vw, 32px\)[\s\S]*?text-align: left/);
  assert.match(styles, /\.launch-selector-heading button \{[\s\S]*?grid-column: 4[\s\S]*?width: 68px[\s\S]*?min-height: 42px/);
  assert.match(styles, /\.launch-selector-body \{[\s\S]*?grid-template-columns: minmax\(0, \.8fr\) minmax\(0, 1\.2fr\)/);
  assert.match(styles, /\.launch-selector fieldset \{[\s\S]*?display: flex[\s\S]*?min-height: 0[\s\S]*?padding: 0 10px 8px[\s\S]*?overflow: hidden/);
  assert.match(selector, /className="launch-music-grid"/);
  assert.match(styles, /\.launch-music-grid,[\s\S]*?\.launch-visual-grid \{[\s\S]*?flex: 1 1 auto[\s\S]*?margin-top: 6px/);
  assert.match(styles, /\.launch-music-grid \{[^}]*grid-template-rows: repeat\(3, minmax\(0, 1fr\)\)[^}]*gap: 8px/);
  assert.match(styles, /\.launch-visual-grid \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)[\s\S]*?grid-template-rows: repeat\(var\(--launch-visual-row-count, 2\), minmax\(0, 1fr\)\)[\s\S]*?gap: 8px/);
  assert.match(selector, /--launch-visual-row-count[\s\S]*?Math\.max\(2, Math\.ceil\(FLUX_ENVIRONMENTS\.length \/ 3\)\)/);
  assert.match(styles, /\.launch-choice-button \{[\s\S]*?gap: 3px;[\s\S]*?padding: 10px/);
  assert.match(styles, /\.launch-choice-button::before \{[\s\S]*?top: 7px;[\s\S]*?left: 10px;[\s\S]*?height: 3px/);
  assert.doesNotMatch(styles, /\.launch-choice-button\[aria-pressed="true"\] strong \{[^}]*padding-top/);
  assert.match(styles, /\.launch-choice-button strong \{ font-size: 15px/);
  assert.match(styles, /\.launch-choice-button small \{ color: var\(--sheet-muted\); font-size: 12\.5px/);
  assert.match(styles, /\.launch-selector legend \{[\s\S]*?font-size: 19px/);
  assert.match(styles, /--ui-radius: 6px/);
  for (const selectorName of [
    ".launch-selector",
    ".launch-selector-heading button",
    ".launch-choice-button",
    ".launch-start-button",
  ]) {
    const escapedSelector = selectorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(styles, new RegExp(`${escapedSelector} \\{[\\s\\S]*?border-radius: var\\(--ui-radius\\)`));
  }
});

test("SOUNDTRACK stays visible and START waits for its prepared player", () => {
  const app = read("App.jsx");
  const soundtrack = app.slice(app.indexOf('id: "soundtrack"'), app.indexOf('id: "mute"'));

  assert.match(soundtrack, /label: "SOUNDTRACK"/);
  assert.match(soundtrack, /available: true/);
  assert.match(app, /disabled=\{!choice\.available\}/);
  assert.match(app, /musicReady=\{launchMusicId !== "soundtrack"/);
  assert.match(app, /\["prepared", "paused", "playing"\]\.includes\(soundtrackSnapshot\?\.status\)/);
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
  assert.match(app, /audioRef\.current\.setMuted\(launchMuted \|\| musicId === "soundtrack"\)/);
});

test("the footer keeps a compact right palette and exposes one audio-effects master", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /const \[vehicleEffectsEnabled, setVehicleEffectsEnabled\] = useState\(true\)/);
  assert.match(app, /const launchVehicleEffects = true/);
  assert.match(app, /audioRef\.current\.setVehicleEffectsEnabled\(launchVehicleEffects\)/);
  assert.match(app, /soundtrackRef\.current\?\.setVehicleMaster\(vehicleEffectsEnabled\)/);
  assert.doesNotMatch(app, /soundtrack-manual-disclosure/);
  assert.match(app, /CHOOSE A SOUNDTRACK PATH/);
  assert.match(app, /Fresh mix · changes every 30 min/);
  assert.match(app, /className=\{`effects-button\$\{vehicleEffectsEnabled \? " is-active" : ""\}`\}/);
  assert.match(app, /className=\{`stop-button\$\{muted \? " is-active" : ""\}`\}/);
  assert.match(app, /<span>MUTE<\/span>[\s\S]*?<strong>\{muted \? "ON" : "OFF"\}<\/strong>/);
  assert.match(app, /<span>FX<\/span>/);
  assert.match(app, /showControlNotice\("VOLUME", !nextMuted\)/);
  assert.match(app, /showControlNotice\("FX", enabled\)/);
  assert.match(app, /className="control-status-notice" role="status" aria-live="polite"/);
  assert.match(styles, /\.control-slab \{[\s\S]*?grid-template-columns: 79px 79px 190px 210px minmax\(0, 1fr\) 160px/);
  assert.match(styles, /\.palette-control \{[\s\S]*?grid-column: 6;[\s\S]*?border-left: 1px solid var\(--line\)/);
  assert.match(styles, /@media \(max-width: 820px\) \{[\s\S]*?grid-template-columns: 69px 69px 170px 190px minmax\(0, 1fr\) 138px/);
  assert.match(styles, /\.stop-button,[\s\S]*?\.effects-button,[\s\S]*?\.mix-button \{[\s\S]*?place-content: center/);
  assert.match(styles, /\.stop-button::after,[\s\S]*?\.effects-button::after \{[\s\S]*?content: "GLOBAL"/);
  assert.match(styles, /\.swatch-housing button \{[^}]*min-height: 15px/);
  assert.match(styles, /\.control-status-notice \{[\s\S]*?top: 50%;[\s\S]*?left: 50%;[\s\S]*?border-radius: var\(--ui-radius\)/);
});

test("the selected FX Deck is a global footer overlay with four strong tap states", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");
  assert.match(app, /id="manual-effects-deck"/);
  assert.match(app, /GLOBAL · PLAY THE ROAD \+ SOUNDTRACK/);
  assert.match(app, /aria-controls="manual-effects-deck"/);
  assert.match(app, /const controlsPinned = modalOpen \|\| manualEffectsDeckOpen/);
  assert.doesNotMatch(app, /const modalOpen =[^;]*manualEffectsDeckOpen/);
  assert.match(app, /<span>MIX<\/span>/);
  assert.match(app, /active \? 0 : effect\.performanceAmount/);
  assert.match(app, /performanceAmount: 0\.78/);
  assert.match(app, /performanceAmount: 0\.72/);
  assert.match(app, /performanceAmount: 0\.8/);
  assert.match(app, /performanceAmount: 0\.74/);
  assert.match(styles, /\.manual-effects-deck \{[\s\S]*?bottom: 76px/);
  assert.match(styles, /\.manual-effects-grid \{[^}]*repeat\(4/);
  assert.match(styles, /\.mix-button \{ grid-column: 5/);
});

test("vehicle macros and manual effects reach both audible engines", () => {
  const app = read("App.jsx");
  assert.match(app, /open: audioMacros\.values\.open/);
  assert.match(app, /underwater: audioMacros\.values\.underwater/);
  assert.match(app, /bloom: audioMacros\.values\.bloom/);
  assert.doesNotMatch(app, /underwater: audioMacros\.underwater/);
  assert.match(app, /soundtrackRef\.current\?\.setManualEffects\(soundtrackManualEffects\)/);
  assert.match(app, /audioRef\.current\?\.setManualEffects\(soundtrackManualEffects\)/);
  assert.match(app, /audioRef\.current\.setManualEffects\(soundtrackManualEffects\)/);
});

test("the running Soundtrack badge identifies Illobo Featured separately from Jamendo", () => {
  const app = read("App.jsx");
  assert.match(app, /const featured = soundtrackSnapshot\?\.library\?\.selection\?\.kind === "featured"/);
  assert.match(app, /const providerMark = featured \? "LO" : "JM"/);
  assert.match(app, /`Loading \$\{featured \? "Illobo" : "Jamendo"\}`/);
  assert.match(app, /control-catalog-number is-provider">\{providerMark\}/);
});

test("music source tabs switch immediately and ignore stale asynchronous loads", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");
  const switcher = app.slice(
    app.indexOf("const switchMusicMode = useCallback"),
    app.indexOf("const playSoundtrackSelection = useCallback"),
  );

  assert.ok(switcher.indexOf("setMusicMode(nextMode)") < switcher.indexOf("await controller.load()"));
  assert.ok(switcher.indexOf("setMusicModeLoading(nextMode)") < switcher.indexOf("await controller.load()"));
  assert.match(switcher, /const revision = \+\+musicModeRevisionRef\.current/);
  assert.match(switcher, /revision !== musicModeRevisionRef\.current \|\| sessionMusicModeRef\.current !== nextMode/);
  assert.match(switcher, /scoreRevision !== scoreSelectionRevisionRef\.current/);
  assert.match(app, /Loading \{musicMode === "soundtrack" \? "Soundtrack" : "Play the Road"\}…/);
  assert.match(styles, /\.music-mode-loading \{/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.music-mode-loading span \{ animation: none; \}/);
});

test("Soundtrack path cards round-trip between Illobo and Jamendo without losing covers", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");
  const soundtrack = app.slice(
    app.indexOf("function SoundtrackLibraryContent"),
    app.indexOf("function MusicLibraryPanel"),
  );

  assert.match(soundtrack, /<button type="button" className=\{`soundtrack-choice-card/);
  assert.match(soundtrack, /onClick=\{onFeatured\}/);
  assert.match(soundtrack, /onClick=\{\(\) => onBrowseSelection\(\{ kind: "library", id: "all" \}\)\}/);
  assert.match(soundtrack, /jamendoCoverEntries = featuredSelected \? jamendoPreviewEntries : entries/);
  assert.match(app, /retainJamendoPreviewEntries\(current, nextSnapshot\)/);
  assert.match(styles, /\.soundtrack-choice-card\.is-library \{ grid-template-columns: 84px minmax\(0, 1fr\) auto; \}/);
  assert.doesNotMatch(styles, /\.soundtrack-choice-card\.is-library \{ display: none; \}/);
});

test("the Tesla Music drawer uses whole-surface one-tap controls and a no-scroll compact composition", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");
  const scoreLibrary = app.slice(
    app.indexOf("function ScoreLibraryContent"),
    app.indexOf("function SoundtrackLibraryContent"),
  );
  const soundtrack = app.slice(
    app.indexOf("function SoundtrackLibraryContent"),
    app.indexOf("function MusicLibraryPanel"),
  );

  assert.match(scoreLibrary, /readyScoreGenres\(\)\.map/);
  assert.doesNotMatch(scoreLibrary, /SCORE_GENRES\.map/);
  assert.match(scoreLibrary, /className="score-entry-cover" src=\{genre\.coverUrl\}/);
  assert.match(scoreLibrary, /\{genre\.description\}/);
  assert.match(soundtrack, /SOUNDTRACK_GENRE_OPTIONS\.slice\(0, 5\)/);
  assert.match(soundtrack, /SOUNDTRACK_GENRE_OPTIONS\.slice\(5, 10\)/);
  assert.match(soundtrack, /SOUNDTRACK_GENRE_OPTIONS\.slice\(10, 15\)/);
  assert.match(soundtrack, /aria-pressed=\{selected\?\.kind === "pace"/);
  assert.match(soundtrack, /aria-pressed=\{selected\?\.kind === "genre"/);
  assert.match(soundtrack, /<MediaGlyph name="play" \/>/);
  assert.doesNotMatch(soundtrack, />PLAY<\/button>/);
  assert.match(app, /className="music-drawer-workspace"/);
  assert.match(app, /<nav className="music-source-switch"/);
  assert.match(soundtrack, /FEATURED ARTIST/);
  assert.match(soundtrack, /Original music written and performed by Illobo\./);
  assert.doesNotMatch(soundtrack, /curated by Illobo/);
  assert.match(soundtrack, /soundtrack-now-label/);
  assert.match(styles, /@media \(min-width: 651px\) and \(max-height: 650px\)/);
  assert.match(styles, /\.soundtrack-track-list \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); gap: 3px; \}/);
  assert.match(styles, /\.soundtrack-filter-layout \{ grid-template-columns: 88px minmax\(0, 1fr\); gap: 3px; \}/);
  assert.match(styles, /\.soundtrack-filter-row > button \{ min-height: 34px; padding: 0 6px; \}/);
  assert.match(styles, /\.soundtrack-panel-body > \.privacy-note \{ display: none; \}/);
});

test("catalog names use readable display labels and align their numbers on one baseline", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /function displayLabel\(entry\)/);
  assert.match(app, /aria-label=\{`Visual \$\{name\} \$\{environment\.number\}\. Tap to change`\}/);
  assert.match(app, /className="control-value"[\s\S]*?<strong>\{name\}<\/strong>[\s\S]*?className="control-catalog-number">\{environment\.number\}/);
  assert.match(app, /className="control-catalog-number" title=\{scoreSource\(selected\.id\)\.note\}/);
  assert.match(app, /<strong>\{displayLabel\(entry\)\}<\/strong>/);
  assert.match(app, /\{displayLabel\(genre\)\}/);
  assert.match(styles, /\.control-value \{[\s\S]*?display: flex;[\s\S]*?align-items: baseline;[\s\S]*?font-size: 17px/);
  assert.match(styles, /\.control-catalog-number \{[^}]*font: inherit/);
  assert.match(styles, /\.score-entry-number \{[^}]*font-size: 19px/);
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

test("the launch lockup uses the 16 Road mark and isolated Orbitron wordmark", () => {
  const styles = read("styles.css");
  const brand = styles.slice(styles.indexOf(".launch-brand {"), styles.indexOf(".launch-command {"));
  const command = styles.slice(styles.indexOf(".launch-command > span:last-child {"), styles.indexOf("@keyframes launch-text-wave"));

  assert.match(brand, /justify-content: center/);
  assert.match(brand, /font-family: var\(--font-brand\)/);
  assert.match(brand, /font-size: clamp\(26px, 4\.15vw, 32px\)/);
  assert.match(brand, /font-weight: 750/);
  assert.match(brand, /letter-spacing: -\.02em/);
  assert.match(brand, /text-align: center/);
  assert.match(styles, /\.splash-action \{[\s\S]*?width: min\(360px, calc\(100vw - 40px\)\)/);
  assert.match(styles, /\.launch-button \{[\s\S]*?height: 160px/);
  assert.match(styles, /\.launch-brand img \{[\s\S]*?width: 42px;[\s\S]*?height: 42px/);
  assert.match(command, /font-weight: 600/);
  assert.match(command, /letter-spacing: 0/);
  assert.doesNotMatch(command, /text-indent/);
  assert.match(styles, /grid-template-rows: 64px 1fr/);
  assert.match(styles, /min-height: 74px/);
});

test("Signal Gate phases every travelling gap independently", () => {
  const field = read("splash-signal-gate.jsx");

  assert.match(field, /laneKey = float\(laneIndex\) \+ float\(sideIndex\) \* 19\.0/);
  assert.match(field, /float gapWidth =/);
  assert.match(field, /float signal = \(1\.0 - gap\)/);
  assert.match(field, /for \(int rayIndex = 0; rayIndex < 8; rayIndex \+= 1\)/);
});

test("Space Grotesk remains the UI face while Orbitron is isolated to project wordmarks", () => {
  const styles = read("styles.css");
  const index = readFileSync(resolve(PROJECT_ROOT, "index.html"), "utf8");
  const font = readFileSync(resolve(PROJECT_ROOT, "public/fonts/space-grotesk-variable.ttf"));
  const brandFont = readFileSync(resolve(PROJECT_ROOT, "public/fonts/orbitron-latin-variable.woff2"));

  assert.match(styles, /font-family: "Space Grotesk";/);
  assert.match(styles, /font-weight: 300 700;/);
  assert.match(styles, /--font-weight-text: 400;/);
  assert.match(styles, /--font-ui: "Space Grotesk"/);
  assert.match(styles, /--font-data: "Space Grotesk"/);
  assert.match(styles, /--font-brand: "Orbitron"/);
  assert.match(styles, /\.launch-brand \{[\s\S]*?font-family: var\(--font-brand\)/);
  assert.match(styles, /\.launch-selector-heading h1 \{[\s\S]*?font-family: var\(--font-brand\)/);
  assert.doesNotMatch(styles, /\.topbar-mark \{[\s\S]*?font-family: var\(--font-brand\)/);
  assert.match(styles, /\.diagnostic-report-drawer \.drawer-panel \{[\s\S]*?font-family: var\(--font-data\)/);
  assert.match(styles, /body \{[\s\S]*?font-family: var\(--font-ui\)/);
  assert.match(index, /rel="preload" href="\/fonts\/space-grotesk-variable\.ttf"/);
  assert.match(index, /rel="preload" href="\/fonts\/orbitron-latin-variable\.woff2"/);
  assert.ok(font.length > 10_000, "the packaged font should not be an empty placeholder");
  assert.ok(brandFont.length > 10_000, "the packaged brand font should not be an empty placeholder");
});

test("Space Grotesk telemetry units sit below and align to the value edge", () => {
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

test("the visual palette owns the accent and persists as an optional local preference", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /localStorage\.setItem\(PREFERENCES_KEY, JSON\.stringify\(\{[\s\S]*?themeId/);
  assert.match(app, /data-palette=\{themeId\}/);
  assert.doesNotMatch(app, /data-theme=\{themeId\}/);
  assert.match(styles, /\.app\[data-palette="red"\] \{ --accent: #ed2d24; \}/);
});

test("compact viewports keep the mode switch separate and preserve a resting mode marker", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /className="active-mode-marker"[^>]*>FLUX<\/span>/);
  assert.match(styles, /\.controls-resting \.active-mode-marker \{ opacity: \.82; \}/);
  assert.match(styles, /@media \(max-width: 650px\) \{[\s\S]*?grid-template-columns: 58px 116px minmax\(220px, 1fr\) 52px/);
  assert.match(styles, /@media \(max-width: 480px\) \{[\s\S]*?\.topbar-mark \{ display: none; \}[\s\S]*?\.mode-selector \{ grid-column: 1; \}/);
});
