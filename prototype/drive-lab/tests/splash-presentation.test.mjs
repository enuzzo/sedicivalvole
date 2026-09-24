// Current splash geometry, credits, warmup and START are exercised in scripts/qa-launch-cockpit.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  isControlLayerFocused,
  shouldReleaseControlFocus,
} from "../src/control-visibility.js";
import { readAppSurface } from "./app-surface.mjs";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = resolve(TEST_DIR, "../src");
const PROJECT_ROOT = resolve(TEST_DIR, "..");

function read(relativePath) {
  return readFileSync(resolve(SOURCE_ROOT, relativePath), "utf8");
}

test("keyboard focus cannot defeat the six-second inactivity deadline", () => {
  const app = readAppSurface();
  assert.equal(isControlLayerFocused({ closest: (selector) => selector === ".control-layer" }), true);
  assert.equal(isControlLayerFocused({ closest: () => null }), false);
  assert.equal(isControlLayerFocused(null), false);
  assert.match(app, /if \(isControlLayerFocused\(document\.activeElement\)\)/);
  assert.match(app, /window\.setTimeout\(restControls, 6000\)/);
  assert.doesNotMatch(app, /onFocusCapture=\{wakeControls\}/);
});

test("vehicle motion and pointer hover never wake resting controls", () => {
  const app = readAppSurface();
  const keyboardBrake = app.slice(
    app.indexOf("const startKeyboardBrake"),
    app.indexOf("const releaseKeyboardBrake"),
  );
  const keyboardAcceleration = app.slice(
    app.indexOf("const startKeyboardAcceleration"),
    app.indexOf("const releaseKeyboardAcceleration"),
  );

  assert.doesNotMatch(keyboardBrake, /wakeControls/);
  assert.doesNotMatch(keyboardAcceleration, /wakeControls/);
  assert.doesNotMatch(app, /onPointerMove=\{wakeControls\}/);
  assert.match(app, /onPointerDown=\{handleSurfacePointerDown\}/);
});

test("completed control actions and closed surfaces return focus to the experience", () => {
  const app = readAppSurface();
  const controlAction = {
    closest: (selector) => selector.includes(".control-layer button") ? {} : null,
  };
  assert.equal(shouldReleaseControlFocus(controlAction, false), true);
  assert.equal(shouldReleaseControlFocus(controlAction, true), false);
  assert.equal(shouldReleaseControlFocus({ closest: () => null }, false), false);
  assert.equal(shouldReleaseControlFocus(null, false), false);
  assert.match(app, /const controlsPinned = modalOpen[\s\S]*?\|\| manualEffectsDeckOpen[\s\S]*?\|\| gpsHelpOpen[\s\S]*?\|\| appearanceMenuOpen[\s\S]*?\|\| networkPopoverOpen/);
  assert.doesNotMatch(app, /appearanceRetainedFocus/);
  assert.match(app, /wasPinned && !controlsPinned\) queueExperienceFocus\(\)/);
  assert.match(app, /if \(phase !== "running" \|\| controlsPinnedRef\.current\) return/);
  assert.match(app, /appRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(app, /onClickCapture=\{handleControlActivation\}/);
});

test("the Tesla Music drawer keeps the accepted paired Soundtrack layout", () => {
  const app = readAppSurface();
  const styles = read("styles.css");
  const tabletRules = styles.slice(
    styles.lastIndexOf("@media (max-width: 900px)"),
    styles.indexOf("@media (min-width: 651px) and (max-height: 650px)", styles.lastIndexOf("@media (max-width: 900px)")),
  );

  assert.match(app, /deferScoreWorklets: launchEngine \|\| musicId === "soundtrack"/);
  assert.match(styles, /\.soundtrack-choice-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.soundtrack-filter-layout \{ display: grid; grid-template-columns: 112px minmax\(0, 1fr\)/);
  assert.match(styles, /\.soundtrack-choice-card\.is-library \{ grid-template-columns: 64px minmax\(0, 1fr\) 48px/);
  assert.match(styles, /\.soundtrack-cover-stack img \{ margin-left: -40px; \}/);
  assert.doesNotMatch(tabletRules, /soundtrack-choice-grid/);
  assert.doesNotMatch(tabletRules, /soundtrack-filter-layout/);
  assert.doesNotMatch(tabletRules, /soundtrack-genre-board/);
});

test("the running Visual library uses a complete two-column Tesla catalogue", () => {
  const app = readAppSurface();
  const styles = read("styles.css");
  assert.match(app, /<span>\{entry\.launchDescription\}<\/span>/);
  assert.match(read("ui/visual-cycle-controls.jsx"), /function ShaderGradientCycleControl/);
  assert.match(read("ui/visual-cycle-controls.jsx"), /nextShaderGradientEnvironmentId\(environment\.id\)/);
  assert.match(app, /environment\.renderer === "shadergradient"[\s\S]*?<ShaderGradientCycleControl/);
  assert.match(read("launch-cockpit.jsx"), /SHADERGRADIENT_ENVIRONMENTS\.map/);
  assert.match(styles, /\.environment-drawer \.score-list \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: 8px; margin-top: 12px; \}/);
  assert.match(styles, /\.environment-drawer \.score-entry \{ min-height: 68px/);
});

test("Buy Me a Coffee opens a real, accessible support panel", () => {
  const app = readAppSurface();
  const envExample = readFileSync(resolve(PROJECT_ROOT, ".env.example"), "utf8");

  assert.match(app, /import buyMeCoffeeQr from "\.\.\/assets\/bmc_qr\.png\?inline"/);
  assert.match(app, /const DEFAULT_SUPPORT_URL = "https:\/\/buymeacoffee\.com\/enuzzo"/);
  assert.match(app, /parseSupportUrl\(import\.meta\.env\.VITE_SUPPORT_URL\) \|\| DEFAULT_SUPPORT_URL/);
  assert.match(app, /url\.protocol === "https:"/);
  assert.match(app, /buymeacoffee\\\.com/);
  assert.match(read("launch-cockpit.jsx"), /onClick=\{onSupport\}/);
  assert.match(read("support-button.jsx"), /aria-label="Open Buy Me a Coffee support panel"/);
  assert.match(app, /function DialogSurface\(/);
  assert.match(app, /role="dialog"/);
  assert.match(app, /aria-modal="true"/);
  assert.match(app, /className="support-overlay"[\s\S]*?labelledBy="support-title"/);
  assert.match(app, /src=\{buyMeCoffeeQr\}/);
  assert.match(app, /href=\{SUPPORT_URL\}/);
  assert.doesNotMatch(app.slice(app.indexOf('className="support-primary-link"'), app.indexOf("</a>", app.indexOf('className="support-primary-link"'))), /target="_blank"/);
  assert.match(app, /PROJECT SPARKS/);
  assert.match(app, /PLAYFUL SIGNAL · NOT PURCHASES/);
  assert.match(app, /decodeSuggestionAddress\(\)/);
  assert.doesNotMatch(app, /enuzzo@gmail\.com/);
  assert.match(envExample, /VITE_SUPPORT_URL=https:\/\/buymeacoffee\.com\/your-handle/);
});

test("closing the voice audition returns to diagnostics instead of losing focus", () => {
  const app = readAppSurface();
  assert.match(app, /const closeVoicePreview = useCallback\(\(\) => \{\s*setPreviewOpen\(false\);\s*setDrawerOpen\(true\);/);
  assert.match(app, /labelledBy="preview-title"[\s\S]*?onClose=\{closeVoicePreview\}/);
  assert.match(app, /onClick=\{closeVoicePreview\} aria-label="Close voice preview"/);
});

test("launch surface stays above every preloaded experience overlay", () => {
  const styles = read("styles.css");
  const splash = styles.slice(styles.indexOf(".splash {"), styles.indexOf(".splash-signal-field"));

  assert.match(splash, /z-index: 20/);
  assert.match(styles, /\.atlas-waiting \{[\s\S]*?z-index: 5/);
  assert.match(styles, /\.atlas-panel \{[\s\S]*?z-index: 6/);
  assert.match(styles, /\.support-overlay \{[\s\S]*?z-index: 30/);
});

test("local exact-viewport QA can keep the Web Audio graph inaudible", () => {
  const app = readAppSurface();
  assert.match(app, /const QA_MUTED = import\.meta\.env\.DEV && QA_PARAMS\.get\("qaMute"\) === "1"/);
  assert.match(app, /flux: QA_MUTED \|\| initialPreferences\.muted, engine: QA_MUTED \|\| initialPreferences\.engineMuted === true/);
  assert.match(app, /const launchMuted = QA_MUTED \|\| mutedRef\.current \|\| \(!launchEngine && musicId === "mute"\)/);
  assert.match(app, /audioRef\.current\.setMuted\(launchMuted \|\| musicId === "soundtrack"\)/);
});

test("the footer keeps a compact right palette and exposes one audio-effects master", () => {
  const app = readAppSurface();
  const styles = read("styles.css");

  assert.match(app, /const \[vehicleEffectsEnabled, setVehicleEffectsEnabled\] = useState\(initialPreferences\.vehicleEffectsEnabled\)/);
  assert.match(app, /const launchVehicleEffects = vehicleEffectsEnabledRef\.current/);
  assert.match(app, /audioRef\.current\.setVehicleEffectsEnabled\(launchVehicleEffects\)/);
  assert.match(app, /soundtrackRef\.current\?\.setVehicleMaster\(vehicleEffectsEnabled\)/);
  assert.doesNotMatch(app, /soundtrack-manual-disclosure/);
  assert.match(app, /<span>SOURCE<\/span>/);
  assert.match(app, /Fresh mix · changes every 30 min/);
  assert.match(app, /className=\{`effects-button\$\{vehicleEffectsEnabled \? " is-active" : ""\}`\}/);
  assert.match(app, /className=\{`stop-button\$\{muted \? " is-active" : ""\}`\}/);
  assert.match(app, /<span>SOUND<\/span>[\s\S]*?<strong>\{muted \? "Off" : "On"\}<\/strong>/);
  assert.match(app, /<Led on=\{vehicleEffectsEnabled\} \/>[\s\S]*?<span>BRAKE FX<\/span>/);
  assert.match(app, /showControlNotice\("VOLUME", !nextMuted\)/);
  assert.match(app, /showControlNotice\("BRAKING FX", enabled\)/);
  assert.match(app, /className="control-status-notice" role="status" aria-live="polite"/);
  assert.match(styles, /\.control-slab \{[\s\S]*?grid-template-columns: 79px 79px 190px 210px 79px minmax\(160px, 1fr\)/);
  assert.match(styles, /\.palette-control \{[\s\S]*?grid-column: 6;[\s\S]*?border-left: 1px solid var\(--line\)/);
  assert.match(styles, /@media \(max-width: 820px\) \{[\s\S]*?grid-template-columns: 69px 69px 160px 180px 69px minmax\(158px, 1fr\)/);
  assert.match(styles, /\.stop-button,[\s\S]*?\.effects-button,[\s\S]*?\.mix-button \{[\s\S]*?place-content: center/);
  assert.match(styles, /\.stop-button::after,[\s\S]*?\.effects-button::after \{[\s\S]*?content: "GLOBAL"/);
  assert.match(styles, /\.palette-control \{[^}]*display: grid;[^}]*min-height: var\(--chrome-size\)/);
  assert.match(styles, /\.control-status-notice \{[\s\S]*?top: 50%;[\s\S]*?left: 50%;[\s\S]*?border-radius: var\(--ui-radius\)/);
  const instrument = read("night-instrument.css");
  assert.match(instrument, /:not\(\[data-phone-layout\]\) \.footer-stack \.control-slab \{ grid-template-columns: 72px 92px minmax\(0, 1fr\) minmax\(0, 1fr\) 88px 112px; \}/);
  assert.match(instrument, /\.palette-control \{ position: relative; display: block; height: 52px;/);
});

test("the selected FX Deck is a global footer overlay with eight strong tap states", () => {
  const app = readAppSurface();
  const controls = read("manual-effects-controls.js");
  assert.match(app, /MANUAL_EFFECT_CONTROLS as SOUNDTRACK_MANUAL_CONTROLS/);
  assert.match(read("remote/phone.jsx"), /MANUAL_EFFECT_CONTROLS/);
  const styles = read("styles.css");
  assert.match(app, /id="manual-effects-deck"/);
  assert.match(app, /MIX · PLAY THE ROAD \+ SOUNDTRACK/);
  assert.match(app, /aria-controls="manual-effects-deck"/);
  assert.match(app, /const controlsPinned = modalOpen[\s\S]*?\|\| manualEffectsDeckOpen/);
  assert.doesNotMatch(app, /const modalOpen =[^;]*manualEffectsDeckOpen/);
  assert.match(app, /<span>MIX<\/span>[\s\S]*?<LedRow states=\{SOUNDTRACK_MANUAL_CONTROLS\.map/);
  assert.match(app, /role="slider"[\s\S]*?aria-label=\{`\$\{effect\.displayLabel\} depth`\}/);
  assert.match(app, /active \? 0 : effect\.performanceAmount/);
  assert.match(controls, /performanceAmount: 0\.78/);
  assert.match(controls, /performanceAmount: 0\.72/);
  assert.match(controls, /performanceAmount: 0\.74/);
  assert.match(controls, /id: "underwater"[\s\S]*?performanceAmount: 0\.76/);
  assert.match(controls, /id: "phaser"[\s\S]*?performanceAmount: 0\.78/);
  assert.match(controls, /id: "bitcrush"[\s\S]*?performanceAmount: 0\.72/);
  assert.match(controls, /id: "bassDrive"[\s\S]*?performanceAmount: 0\.74/);
  assert.match(controls, /id: "radioCut"[\s\S]*?performanceAmount: 0\.76/);
  assert.match(controls, /id: "highCut"[\s\S]*?performanceAmount: 0\.76/);
  assert.match(controls, /id: "bassDrive"[\s\S]*?family: "tone"[\s\S]*?id: "radioCut"[\s\S]*?family: "tone"[\s\S]*?id: "highCut"[\s\S]*?family: "tone"/);
  assert.doesNotMatch(controls, /id: "echo"/);
  assert.doesNotMatch(controls, /id: "chorus"/);
  assert.match(styles, /\.manual-effects-deck \{[\s\S]*?bottom: 76px/);
  assert.match(styles, /\.manual-effects-grid \{[^}]*repeat\(4/);
  assert.match(read("night-instrument.css"), /\.fx-pad-grid \{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.mix-button \{ grid-column: 5/);
});

test("braking UNDERWATER and manual effects reach both audible engines", () => {
  const app = readAppSurface();
  assert.match(app, /underwater: audioMacros\.values\.underwater/);
  assert.doesNotMatch(app, /audioMacros\.values\.(?:open|bloom)/);
  assert.doesNotMatch(app, /underwater: audioMacros\.underwater/);
  assert.match(app, /soundtrackRef\.current\?\.setManualEffects\(soundtrackManualEffects\)/);
  assert.match(app, /audioRef\.current\?\.setManualEffects\(soundtrackManualEffects\)/);
  assert.match(app, /audioRef\.current\.setManualEffects\(soundtrackManualEffects\)/);
});

test("the running Soundtrack badge identifies Illobo Featured separately from Jamendo", () => {
  const app = readAppSurface();
  assert.match(app, /const featured = soundtrackSnapshot\?\.library\?\.selection\?\.kind === "featured"/);
  assert.match(app, /const providerMark = featured \? "LO" : "JM"/);
  assert.match(app, /`Loading \$\{featured \? "Illobo" : "Jamendo"\}`/);
  assert.match(app, /control-catalog-number is-provider">\{providerMark\}/);
});

test("music source tabs switch immediately and ignore stale asynchronous loads", () => {
  const app = readAppSurface();
  const styles = read("styles.css");
  const switcher = app.slice(
    app.indexOf("const switchMusicMode = useCallback"),
    app.indexOf("const playSoundtrackSelection = useCallback"),
  );

  assert.ok(switcher.indexOf("setMusicMode(nextMode)") < switcher.indexOf("await prepareSoundtrack({ force: true })"));
  assert.ok(switcher.indexOf("setMusicModeLoading(nextMode)") < switcher.indexOf("await prepareSoundtrack({ force: true })"));
  assert.match(switcher, /const revision = \+\+musicModeRevisionRef\.current/);
  assert.ok(switcher.indexOf("transportActionQueueRef.current.invalidate()") < switcher.indexOf("const revision = ++musicModeRevisionRef.current"));
  assert.match(switcher, /revision !== musicModeRevisionRef\.current \|\| sessionMusicModeRef\.current !== nextMode/);
  assert.match(switcher, /scoreRevision !== scoreSelectionRevisionRef\.current/);
  assert.match(app, /Loading \{musicMode === "soundtrack" \? "Soundtrack" : "Play the Road"\}…/);
  assert.match(styles, /\.music-mode-loading \{/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.music-mode-loading span \{ animation: none; \}/);
});

test("newer media selections cancel queued navigation without cancelling deliberate skip chains", () => {
  const app = readAppSurface();
  const selectScore = app.slice(
    app.indexOf("const selectScore = useCallback"),
    app.indexOf("const switchMusicMode = useCallback"),
  );
  const selectSoundtrack = app.slice(
    app.indexOf("const playSoundtrackSelection = useCallback"),
    app.indexOf("const moveTransport = useCallback"),
  );
  const moveTransport = app.slice(
    app.indexOf("const moveTransport = useCallback"),
    app.indexOf("const toggleTransport = useCallback"),
  );

  assert.match(selectScore, /\{ preserveQueuedNavigation = false \} = \{\}/);
  assert.match(selectScore, /if \(!preserveQueuedNavigation\) transportActionQueueRef\.current\.invalidate\(\)/);
  assert.equal((selectSoundtrack.match(/transportActionQueueRef\.current\.invalidate\(\)/g) ?? []).length, 2);
  assert.equal((selectSoundtrack.match(/musicModeRevisionRef\.current \+= 1/g) ?? []).length, 2);
  assert.equal((selectSoundtrack.match(/scoreSelectionRevisionRef\.current \+= 1/g) ?? []).length, 2);
  assert.match(moveTransport, /selectScore\(scores\[nextIndex\]\.id, \{ preserveQueuedNavigation: true \}\)/);
  assert.match(moveTransport, /reason: "superseded-by-newer-intent"/);
});

test("Soundtrack path cards round-trip between Illobo and Jamendo without losing covers", () => {
  const app = readAppSurface();
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

test("the Tesla Music drawer uses whole-surface controls and scrolls instead of shrinking type", () => {
  const app = readAppSurface();
  const styles = read("styles.css");
  const scoreLibrary = app.slice(
    app.indexOf("function ScoreLibraryContent"),
    app.indexOf("function SoundtrackLibraryContent"),
  );
  const soundtrack = app.slice(
    app.indexOf("function SoundtrackLibraryContent"),
    app.indexOf("function MusicLibraryPanel"),
  );

  assert.match(scoreLibrary, /const readyScores = readyScoreGenres\(\)/);
  assert.match(scoreLibrary, /SCORE_SOURCE\.sampled/);
  assert.match(scoreLibrary, /SCORE_SOURCE\.generative/);
  assert.doesNotMatch(scoreLibrary, /SCORE_GENRES\.map/);
  assert.match(scoreLibrary, /THE ROAD BECOMES THE ARRANGEMENT/);
  assert.match(scoreLibrary, /Speed builds the layers\. Braking pulls them underwater\. Stillness leaves room to breathe\./);
  assert.match(scoreLibrary, /Responsive generative/);
  assert.match(scoreLibrary, /className=\{`score-list-item is-\$\{genre\.source\}`\}/);
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
  assert.match(app, /<strong>PLAY THE ROAD<\/strong>/);
  assert.match(app, /<strong>SOUNDTRACK<\/strong>/);
  assert.match(soundtrack, /FEATURED ARTIST/);
  assert.match(soundtrack, /Original music written and performed by Illobo\./);
  assert.doesNotMatch(soundtrack, /curated by Illobo/);
  assert.match(soundtrack, /soundtrack-now-label/);
  assert.match(soundtrack, /MediaGlyph name="levels"/);
  assert.match(styles, /\.soundtrack-now-label \{[^}]*white-space: nowrap/);
  assert.match(styles, /\.soundtrack-now-label img \{[^}]*filter: brightness\(0\) invert\(1\)/);
  assert.match(styles, /@media \(min-width: 651px\) and \(max-height: 650px\)/);
  assert.match(styles, /\.music-drawer-workspace \{ grid-template-rows: 52px minmax\(0, 1fr\);/);
  assert.match(styles, /\.music-source-switch \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
  assert.match(styles, /\.play-road-library \.score-list \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(styles, /\.play-road-library \.score-list-item\.is-generative \{ grid-column: 1 \/ -1; \}/);
  assert.match(soundtrack, /className=\{`music-library-section-heading\$\{featuredSelected \? "" : " is-jamendo-browser"\}`\}/);
  assert.match(soundtrack, /Jamendo soundtrack browser/);
  assert.doesNotMatch(soundtrack, />JAMENDO LIBRARY<\/small><h3 id="soundtrack-library-title">Browse and play<\/h3>/);
  assert.match(styles, /\.music-drawer-content \{ overflow-y: auto !important; \}/);
  assert.match(styles, /\.soundtrack-track-list > button \{ min-height: 60px; \}/);
  assert.match(styles, /\.soundtrack-filter-row > button \{ min-height: var\(--touch-target\); \}/);
  assert.match(styles, /\.soundtrack-choice-copy > strong,[\s\S]*?font-size: var\(--type-active\)/);
  assert.match(styles, /\.soundtrack-panel-body > \.privacy-note \{ display: none; \}/);
});

test("catalog names use readable display labels and align their numbers on one baseline", () => {
  const app = readAppSurface();
  const styles = read("styles.css");

  assert.match(app, /function displayLabel\(entry\)/);
  assert.match(app, /aria-label=\{`Visual \$\{name\} \$\{environment\.number\}\. Tap to change`\}/);
  assert.match(app, /className="control-value"[\s\S]*?<strong>\{name\}<\/strong>[\s\S]*?className="control-catalog-number">\{environment\.number\}/);
  assert.match(app, /className="control-catalog-number" title=\{scoreSource\(selected\.id\)\.note\}/);
  assert.match(app, /<strong>\{displayLabel\(entry\)\}<\/strong>/);
  assert.match(app, /\{displayLabel\(genre\)\}/);
  assert.match(styles, /\.control-value \{[^}]*font-size: var\(--type-active\)/);
  assert.match(styles, /\.control-catalog-number \{[^}]*font: inherit/);
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
  assert.match(read("launch-cockpit.css"), /\.cockpit-heading h1\{font:600 26px var\(--font-brand\)/);
  assert.doesNotMatch(styles, /\.topbar-mark \{[\s\S]*?font-family: var\(--font-brand\)/);
  assert.match(styles, /\.diagnostic-report-drawer \.drawer-panel \{[\s\S]*?font-family: var\(--font-data\)/);
  assert.match(styles, /body \{[\s\S]*?font-family: var\(--font-ui\)/);
  assert.match(index, /rel="preload" href="\/fonts\/space-grotesk-variable\.ttf"/);
  assert.match(index, /rel="preload" href="\/fonts\/orbitron-latin-variable\.woff2"/);
  assert.ok(font.length > 10_000, "the packaged font should not be an empty placeholder");
  assert.ok(brandFont.length > 10_000, "the packaged brand font should not be an empty placeholder");
});

test("Space Grotesk speed and unit share one compact centered axis", () => {
  const app = readAppSurface();
  const styles = read("styles.css");
  const groups = styles.slice(
    styles.indexOf(".readout-group {"),
    styles.indexOf(".readout-divider {"),
  );

  assert.match(groups, /\.readout-group \{[\s\S]*?flex-direction: column/);
  assert.match(groups, /\.readout-group \{[\s\S]*?align-items: center/);
  assert.match(groups, /text-align: center/);
  assert.match(app, /<span className="readout-unit">km\/h\{source === "DEMO" \? " · SIM" : ""\}<\/span>/);
  assert.doesNotMatch(app, /<small>\{source\}<\/small>/);
});

test("safe product state persists locally and can be reset without storing GPS", () => {
  const app = readAppSurface();
  const styles = read("styles.css");

  assert.match(app, /localStorage\.setItem\(PREFERENCES_KEY, JSON\.stringify\(\{[\s\S]*?themeId/);
  assert.match(app, /soundtrackSelection: \{[\s\S]*?kind: preferredSoundtrackSelectionRef\.current\.kind/);
  assert.match(app, /manualEffects: normalizeManualEffectPreferences\(soundtrackManualEffects\)/);
  assert.match(app, /vehicleEffectsEnabled,[\s\S]*?muted/);
  assert.match(app, /const \[launchMusicId, setLaunchMusicId\] = useState\("soundtrack"\)/);
  assert.match(app, /const \[launchEnvironmentId, setLaunchEnvironmentId\] = useState\(\(\) => luckyLaunchVisual\(initialPreferences\.lastLaunchVisualId \?\? initialPreferences\.environmentId\)\)/);
  assert.match(app, /const resetSavedState = useCallback/);
  assert.match(app, /localStorage\.removeItem\(PREFERENCES_KEY\)/);
  assert.match(read("launch-cockpit.jsx"), /onClick=\{\(\)=>choose\(onReset\)\}>RESET SAVED STATE/);
  assert.match(app, /className="drawer-actions"[\s\S]*?onClick=\{resetSavedState\}>RESET SAVED STATE/);
  const preferenceWrite = app.slice(app.indexOf("localStorage.setItem(PREFERENCES_KEY"), app.indexOf("const captureViewport"));
  assert.doesNotMatch(preferenceWrite, /latitude|longitude|mapPosition|atlasPositionSamplesRef/);
  assert.match(app, /data-palette=\{themeId\}/);
  assert.doesNotMatch(app, /data-theme=\{themeId\}/);
  assert.match(styles, /\.app\[data-palette="red"\] \{ --accent: #ed2d24; \}/);
});

test("Now Playing shares the footer lifecycle with stable Media Session actions and directional dismissal", () => {
  const app = readAppSurface();
  const styles = read("styles.css");

  assert.match(app, /className="now-playing-dock persistent-transport" aria-label="Now playing and music transport"/);
  assert.match(app, /installMediaSessionTransport\(\{/);
  assert.match(app, /createMediaTransportIntentQueue\(\)/);
  assert.match(app, /transportActionQueueRef\.current\.invalidate\(\)/);
  assert.match(app, /media\.action\.cancelled/);
  assert.match(app, /previoustrack: \(invocation\) => mediaSessionActionsRef\.current\.move\?\.\("previous", "media-session", invocation\)/);
  assert.match(app, /nexttrack: \(invocation\) => mediaSessionActionsRef\.current\.move\?\.\("next", "media-session", invocation\)/);
  assert.match(app, /media-session\.action\.invoked/);
  assert.match(app, /nativeInvocationId: invocation\.id/);
  assert.match(app, /queuedForMs: roundMetric\(startedAtMs - queuedAtMs\)/);
  assert.match(app, /soundtrackMediaPositionState\(soundtrackSnapshot\)/);
  assert.match(app, /clearMediaSessionPresentation\(navigator\.mediaSession\)/);
  assert.match(app, /playRoadMediaObservation\(\{/);
  assert.doesNotMatch(app, /seekto:|seekbackward:|seekforward:/);
  assert.match(app, /media\.action\.requested/);
  assert.match(app, /media\.action\.completed/);
  assert.match(app, /soundtrackPlaybackConfirmed/);
  assert.match(app, /onClickCapture=\{handleControlActivation\}/);
  assert.match(app, /onChangeCapture=\{handleControlChange\}/);
  assert.match(app, /className="now-playing-summary" role="status" aria-live="polite"/);
  assert.match(app, /data-dismiss-direction=\{dismissDirection\}/);
  assert.match(app, /velocity >= 0\.62/);
  assert.match(app, /className=\{backdropClass\}[\s\S]*?onClick=\{onClose\}/);
  assert.match(app, /className="manual-effects-backdrop"[\s\S]*?onClick=\{onClose\}/);
  assert.match(styles, /\.drawer-panel \{[\s\S]*?touch-action: pan-y/);
  assert.match(styles, /\.persistent-transport\.now-playing-dock \{[^}]*bottom: var\(--chrome-size\)/);
  assert.match(styles, /\.persistent-transport\.now-playing-dock \{[\s\S]*?z-index: 35/);
  assert.doesNotMatch(styles, /\.app\.modal-open \.persistent-transport\.now-playing-dock/);
  assert.doesNotMatch(styles, /\.app\.modal-open\.has-now-playing \.drawer-panel/);
  assert.match(app, /const showNowPlaying = experienceMode === "flux" && phase === "running" && !modalOpen && !immersiveEnvironment/);
  assert.match(app, /\{showNowPlaying \? \([\s\S]*?className="now-playing-dock persistent-transport"/);
  assert.match(styles, /\.modal-open \.experience \.control-layer,[\s\S]*?visibility: hidden;[\s\S]*?pointer-events: none/);
  assert.match(styles, /\.controls-resting \.persistent-transport \{[\s\S]*?opacity: 0;[\s\S]*?pointer-events: none/);
  assert.match(app, /soundtrackSnapshot\?\.previous\?\.imageUrl/);
  assert.match(app, /soundtrackSnapshot\?\.next\?\.imageUrl/);
  assert.match(styles, /\.now-playing-copy strong \{[^}]*font-size: var\(--type-active\)/);
  assert.match(styles, /\.drawer-panel\.is-dragging/);
});

test("identity and speed share a stable grid before the contextual action lane", () => {
  const app = readAppSurface();
  const rail = read("contextual-rail.css");
  const header = app.slice(app.indexOf('<header className={`topbar'), app.indexOf('<GpsHelpPopover', app.indexOf('<header className={`topbar')));
  assert.ok(header.indexOf('className="topbar-mark"') < header.indexOf('className={`source-readout'));
  assert.ok(header.indexOf('className={`source-readout') < header.indexOf('<ModeSelector'));
  assert.doesNotMatch(header, /speed-spacer/);
  assert.match(rail, /grid-template-columns: var\(--rail-brand\) var\(--rail-speed\) var\(--rail-mode\)/);
  assert.match(rail, /left: calc\(var\(--rail-left, 0px\) \+ var\(--rail-identity, 160px\) \+ var\(--rail-gap, 8px\)\)/);
  assert.match(rail, /controls-resting \.topbar > :is\(\.topbar-mark, \.source-readout\) \{\s*visibility: visible/);
  assert.doesNotMatch(read("styles.css"), /:has\(\.atlas-framing[^\n]+\.topbar-mark/);
});

test("the source module stays compact and network detail moves behind one status icon", () => {
  const app = readAppSurface();
  const styles = read("styles.css");

  assert.match(app, /<span className="readout-unit">km\/h\{source === "DEMO" \? " · SIM" : ""\}<\/span>/);
  assert.doesNotMatch(app, /<small>\{source\}<\/small>|className="active-mode-marker"/);
  assert.doesNotMatch(app, /<span>bpm<\/span>|<span>%<\/span>/);
  assert.match(app, /function NetworkControl\(\{ notice, history, open, onOpenChange \}\)/);
  assert.match(app, /className="network-state-dot" aria-hidden="true"/);
  assert.match(app, /APPLICATION NETWORK/);
  assert.match(app, /QUALITY · LAST 15 MIN/);
  assert.match(app, /DOWNLOAD[\s\S]*?UPLOAD[\s\S]*?CONNECTION[\s\S]*?LATENCY/);
  assert.match(app, /notice\.status === "transferring" \? " is-loading"/);
  assert.match(styles, /left: 232px;[\s\S]*?width: 104px/);
  assert.match(styles, /\.network-state\.is-caution \{ color: #f3a84c; \}/);
});
