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

test("vehicle motion and pointer hover never wake resting controls", () => {
  const app = read("App.jsx");
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
  const app = read("App.jsx");
  const controlAction = {
    closest: (selector) => selector.includes(".control-layer button") ? {} : null,
  };
  assert.equal(shouldReleaseControlFocus(controlAction, false), true);
  assert.equal(shouldReleaseControlFocus(controlAction, true), false);
  assert.equal(shouldReleaseControlFocus({ closest: () => null }, false), false);
  assert.equal(shouldReleaseControlFocus(null, false), false);
  assert.match(app, /const controlsPinned = modalOpen \|\| manualEffectsDeckOpen \|\| gpsHelpOpen/);
  assert.match(app, /const focusNeedsRecovery = !activeElement[\s\S]*?activeElement === document\.body[\s\S]*?activeElement === document\.documentElement/);
  assert.match(app, /if \(wasPinned && !controlsPinned && focusNeedsRecovery\) queueExperienceFocus\(\)/);
  assert.doesNotMatch(app, /appearanceRetainedFocus/);
  assert.match(app, /if \(phase !== "running" \|\| controlsPinnedRef\.current\) return/);
  assert.match(app, /if \(!activationTarget[\s\S]*?activeElement !== document\.body[\s\S]*?activeElement !== document\.documentElement[\s\S]*?activeElement !== appRef\.current\) return/);
  assert.match(app, /appRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(app, /onClickCapture=\{handleControlActivation\}/);
});

test("launch surface contains only product and action copy", () => {
  const app = read("App.jsx");
  const launchMarkup = app.slice(
    app.indexOf('className="launch-button"'),
    app.indexOf("</button>", app.indexOf('className="launch-button"')),
  );

  assert.match(launchMarkup, /launch-brand">[\s\S]*?appearanceResolution\.appearance === "dark" \? TOPBAR_MARK_URL : BRAND_MARK_URL[\s\S]*?<span>sedicivalvole<\/span>/);
  assert.match(launchMarkup, /alt=""[\s\S]*?aria-hidden="true"/);
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
  assert.match(selector, /className="launch-selector-mark"[\s\S]*?src=\{appearance === "dark" \? TOPBAR_MARK_URL : BRAND_MARK_URL\}[\s\S]*?alt=""[\s\S]*?aria-hidden="true"/);
  assert.match(selector, /FLUX_VISUAL_CHOICES\.map/);
  assert.match(selector, /isShaderGradientEnvironmentId\(environmentId\)/);
  assert.match(selector, /if \(family\) onSelectGradient\(\)/);
  assert.match(selector, /disabled=\{!ready\}/);
  assert.match(selector, /musicId && environmentId/);
  assert.match(selector, /choice\.launchDescription/);
  assert.match(selector, /<strong>\{choice\.displayLabel\}<\/strong>/);
  assert.match(selector, /<strong>\{displayLabel\(choice\)\}<\/strong>/);
  assert.doesNotMatch(selector, /choiceBadge|launch-choice-badge|launch-choice-number/);
  assert.match(app, /displayLabel: "Play the Road"/);
  assert.match(app, /displayLabel: "Soundtrack"/);
  assert.match(app, /displayLabel: "Mute"/);
  assert.match(app, /Adaptive music shaped by your drive/);
  assert.match(app, /Independent Jamendo artist recordings/);
  assert.match(app, /Visuals only\. No music\./);
  assert.doesNotMatch(selector, /ILLOBO FEATURED/i);
  assert.match(styles, /\.launch-selector \{[^}]*grid-template-rows: 64px minmax\(0, 1fr\) 64px;[^}]*height: min\(552px, calc\(100dvh - 24px\)\)/);
  assert.match(styles, /\.launch-selector-heading \{[^}]*grid-template-columns: 52px max-content minmax\(0, 1fr\) 64px/);
  assert.match(styles, /\.launch-selector-mark \{[^}]*width: 48px;[^}]*height: 48px/);
  assert.match(styles, /\.launch-selector-heading h1 \{[^}]*font-size: clamp\(24px, 4vw, 28px\)/);
  assert.match(styles, /\.launch-selector-heading button \{[^}]*width: 64px;[^}]*min-height: var\(--touch-target\)/);
  assert.match(styles, /\.launch-selector-body \{[\s\S]*?grid-template-columns: minmax\(0, \.8fr\) minmax\(0, 1\.2fr\)/);
  assert.match(styles, /\.launch-selector fieldset \{[\s\S]*?display: flex[\s\S]*?min-height: 0[\s\S]*?padding: 0 10px 8px[\s\S]*?overflow: hidden/);
  assert.match(selector, /className="launch-music-grid"/);
  assert.match(styles, /\.launch-music-grid,[\s\S]*?\.launch-visual-grid \{[\s\S]*?flex: 1 1 auto[\s\S]*?margin-top: 6px/);
  assert.match(styles, /\.launch-music-grid \{[^}]*grid-template-rows: repeat\(3, minmax\(0, 1fr\)\)[^}]*gap: 8px/);
  assert.match(styles, /\.launch-visual-grid \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)[\s\S]*?grid-template-rows: repeat\(var\(--launch-visual-row-count, 2\), minmax\(0, 1fr\)\)[\s\S]*?gap: 8px/);
  assert.match(selector, /--launch-visual-row-count[\s\S]*?Math\.max\(2, Math\.ceil\(FLUX_VISUAL_CHOICES\.length \/ 3\)\)/);
  assert.match(styles, /\.launch-choice-button \{[^}]*min-height: var\(--touch-target\);[^}]*padding: 8px 10px/);
  assert.match(styles, /\.launch-choice-button::before \{[\s\S]*?top: 7px;[\s\S]*?left: 10px;[\s\S]*?height: 3px/);
  assert.doesNotMatch(styles, /\.launch-choice-button\[aria-pressed="true"\] strong \{[^}]*padding-top/);
  assert.match(styles, /\.launch-choice-button strong \{ font-size: 17px/);
  assert.match(styles, /\.launch-choice-button small \{ font-size: var\(--type-body\)/);
  assert.match(styles, /\.launch-selector legend \{ font-size: var\(--type-label\)/);
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

test("the running Visual library uses a complete two-column Tesla catalogue", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");
  assert.match(app, /<span>\{entry\.launchDescription\}<\/span>/);
  assert.match(app, /function ShaderGradientCycleControl/);
  assert.match(app, /nextShaderGradientEnvironmentId\(environment\.id\)/);
  assert.match(app, /environment\.renderer === "shadergradient"[\s\S]*?<ShaderGradientCycleControl/);
  assert.match(app, /onSelectGradient=\{\(\) => setLaunchEnvironmentId\(lastGradientVariantRef\.current\)\}/);
  assert.match(styles, /\.environment-drawer \.score-list \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: 8px; margin-top: 12px; \}/);
  assert.match(styles, /\.environment-drawer \.score-entry \{ min-height: 68px/);
  assert.match(styles, /\.environment-drawer \.score-entry-number \{ font-size: var\(--type-meta\)/);
});

test("SOUNDTRACK stays visible while START remains independent from remote audio readiness", () => {
  const app = read("App.jsx");
  const soundtrack = app.slice(app.indexOf('id: "soundtrack"'), app.indexOf('id: "mute"'));

  assert.match(soundtrack, /label: "SOUNDTRACK"/);
  assert.match(soundtrack, /available: true/);
  assert.match(app, /disabled=\{!choice\.available\}/);
  assert.match(app, /musicReady=\{launchMusicId !== "soundtrack"/);
  assert.match(app, /\["prepared", "paused", "playing"\]\.includes\(soundtrackSnapshot\?\.status\)/);
  assert.match(app, /const ready = Boolean\(musicId && environmentId\)/);
  assert.match(app, /MUSIC JOINS WHEN READY/);
  assert.match(app, /MUSIC PENDING · JOINS WHEN READY/);
  assert.match(app, /audio\.start-deferred/);
  assert.match(app, /audio\.start-recovered/);
  assert.match(app, /soundtrackStatus === "prepared"[\s\S]*?await controller\.resume\(\)/);
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
  assert.match(styles, /\.splash-action > \.splash-credit,[\s\S]*?font-size: var\(--type-meta\)/);
  assert.match(styles, /\.splash-repository,[\s\S]*?font-size: var\(--type-meta\)/);
  assert.match(styles, /\.splash-privacy \{ font-size: var\(--type-meta\)/);
  assert.match(styles, /\.splash-privacy,[\s\S]*?\.splash-safety small \{ display: none; \}/);
});

test("Buy Me a Coffee opens a real, accessible support panel", () => {
  const app = read("App.jsx");
  const envExample = readFileSync(resolve(PROJECT_ROOT, ".env.example"), "utf8");

  assert.match(app, /import buyMeCoffeeQr from "\.\/assets\/bmc_qr\.png\?inline"/);
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
  assert.doesNotMatch(app.slice(app.indexOf('className="support-primary-link"'), app.indexOf("</a>", app.indexOf('className="support-primary-link"'))), /target="_blank"/);
  assert.match(app, /onPointerUp=\{\(event\) => \{[\s\S]*?event\.pointerType !== "mouse"[\s\S]*?setSupportOpen\(true\)/);
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
  assert.match(styles, /\.support-overlay \{[\s\S]*?z-index: 30/);
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
  const app = read("App.jsx");
  assert.match(app, /const QA_MUTED = import\.meta\.env\.DEV && QA_PARAMS\.get\("qaMute"\) === "1"/);
  assert.match(app, /const \[muted, setMuted\] = useState\(QA_MUTED \|\| initialPreferences\.muted\)/);
  assert.match(app, /const launchMuted = QA_MUTED \|\| mutedRef\.current \|\| musicId === "mute"/);
  assert.match(app, /audioRef\.current\.setMuted\(launchMuted \|\| musicId === "soundtrack"\)/);
});

test("the footer keeps a compact right palette and exposes one audio-effects master", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /const \[vehicleEffectsEnabled, setVehicleEffectsEnabled\] = useState\(initialPreferences\.vehicleEffectsEnabled\)/);
  assert.match(app, /const launchVehicleEffects = vehicleEffectsEnabledRef\.current/);
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
  assert.match(styles, /\.control-slab \{[\s\S]*?grid-template-columns: 79px 79px 190px 210px 79px minmax\(160px, 1fr\)/);
  assert.match(styles, /\.palette-control \{[\s\S]*?grid-column: 6;[\s\S]*?border-left: 1px solid var\(--line\)/);
  assert.match(styles, /@media \(max-width: 820px\) \{[\s\S]*?grid-template-columns: 69px 69px 160px 180px 69px minmax\(158px, 1fr\)/);
  assert.match(styles, /\.stop-button,[\s\S]*?\.effects-button,[\s\S]*?\.mix-button \{[\s\S]*?place-content: center/);
  assert.match(styles, /\.stop-button::after,[\s\S]*?\.effects-button::after \{[\s\S]*?content: "GLOBAL"/);
  assert.match(styles, /\.swatch-housing button \{[^}]*min-height: 15px/);
  assert.match(styles, /\.control-status-notice \{[\s\S]*?top: 50%;[\s\S]*?left: 50%;[\s\S]*?border-radius: var\(--ui-radius\)/);
});

test("the selected FX Deck is a global footer overlay with eight strong tap states", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");
  assert.match(app, /id="manual-effects-deck"/);
  assert.match(app, /GLOBAL · PLAY THE ROAD \+ SOUNDTRACK/);
  assert.match(app, /aria-controls="manual-effects-deck"/);
  assert.match(app, /const controlsPinned = modalOpen \|\| manualEffectsDeckOpen/);
  assert.doesNotMatch(app, /const modalOpen =[^;]*manualEffectsDeckOpen/);
  assert.match(app, /<span>FX<\/span>[\s\S]*?<strong aria-hidden="true">↑<\/strong>/);
  assert.match(app, /active \? 0 : effect\.performanceAmount/);
  assert.match(app, /performanceAmount: 0\.78/);
  assert.match(app, /performanceAmount: 0\.72/);
  assert.match(app, /performanceAmount: 0\.74/);
  assert.match(app, /id: "underwater"[\s\S]*?performanceAmount: 0\.76/);
  assert.match(app, /id: "phaser"[\s\S]*?performanceAmount: 0\.78/);
  assert.match(app, /id: "bitcrush"[\s\S]*?performanceAmount: 0\.72/);
  assert.match(app, /id: "bassDrive"[\s\S]*?performanceAmount: 0\.74/);
  assert.match(app, /id: "radioCut"[\s\S]*?performanceAmount: 0\.76/);
  assert.match(app, /id: "highCut"[\s\S]*?performanceAmount: 0\.76/);
  assert.match(app, /id: "bassDrive"[\s\S]*?family: "tone"[\s\S]*?id: "radioCut"[\s\S]*?family: "tone"[\s\S]*?id: "highCut"[\s\S]*?family: "tone"/);
  assert.doesNotMatch(app, /id: "echo"/);
  assert.doesNotMatch(app, /id: "chorus"/);
  assert.match(styles, /\.manual-effects-deck \{[\s\S]*?bottom: 76px/);
  assert.match(styles, /\.manual-effects-grid \{[^}]*repeat\(4/);
  assert.match(styles, /article\.is-family-tone::before[\s\S]*?width: 3px[\s\S]*?background: #59d7ff/);
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
  assert.ok(switcher.indexOf("transportActionQueueRef.current.invalidate()") < switcher.indexOf("const revision = ++musicModeRevisionRef.current"));
  assert.match(switcher, /revision !== musicModeRevisionRef\.current \|\| sessionMusicModeRef\.current !== nextMode/);
  assert.match(switcher, /scoreRevision !== scoreSelectionRevisionRef\.current/);
  assert.match(app, /Loading \{musicMode === "soundtrack" \? "Soundtrack" : "Play the Road"\}…/);
  assert.match(styles, /\.music-mode-loading \{/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.music-mode-loading span \{ animation: none; \}/);
});

test("newer media selections cancel queued navigation without cancelling deliberate skip chains", () => {
  const app = read("App.jsx");
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

test("the Tesla Music drawer uses whole-surface controls and scrolls instead of shrinking type", () => {
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
  assert.match(soundtrack, /third-party\/tabler-icons\/chart-bar\.svg/);
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
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /function displayLabel\(entry\)/);
  assert.match(app, /aria-label=\{`Visual \$\{name\} \$\{environment\.number\}\. Tap to change`\}/);
  assert.match(app, /className="control-value"[\s\S]*?<strong>\{name\}<\/strong>[\s\S]*?className="control-catalog-number">\{environment\.number\}/);
  assert.match(app, /className="control-catalog-number" title=\{scoreSource\(selected\.id\)\.note\}/);
  assert.match(app, /<strong>\{displayLabel\(entry\)\}<\/strong>/);
  assert.match(app, /\{displayLabel\(genre\)\}/);
  assert.match(styles, /\.control-value \{[^}]*font-size: var\(--type-active\)/);
  assert.match(styles, /\.control-catalog-number \{[^}]*font: inherit/);
  assert.match(styles, /\.score-entry-number,[\s\S]*?font-size: var\(--type-meta\)/);
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
  assert.match(styles, /--ui-command-wave-soft: #ff9b9e/);
  assert.match(styles, /--ui-command-wave-soft: #b51f20/);
  assert.match(styles, /var\(--ui-command-wave-deep\) 204px/);
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

test("safe product state persists locally and can be reset without storing GPS", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /localStorage\.setItem\(PREFERENCES_KEY, JSON\.stringify\(\{[\s\S]*?themeId/);
  assert.match(app, /soundtrackSelection: \{[\s\S]*?kind: preferredSoundtrackSelectionRef\.current\.kind/);
  assert.match(app, /manualEffects: normalizeManualEffectPreferences\(soundtrackManualEffects\)/);
  assert.match(app, /vehicleEffectsEnabled,[\s\S]*?muted/);
  assert.match(app, /const \[launchMusicId, setLaunchMusicId\] = useState\(initialPreferences\.musicMode\)/);
  assert.match(app, /const \[launchEnvironmentId, setLaunchEnvironmentId\] = useState\(initialPreferences\.environmentId\)/);
  assert.match(app, /const resetSavedState = useCallback/);
  assert.match(app, /localStorage\.removeItem\(PREFERENCES_KEY\)/);
  assert.match(app, /className="splash-reset-state"[\s\S]*?RESET SAVED STATE/);
  assert.match(app, /className="drawer-actions"[\s\S]*?onClick=\{resetSavedState\}>RESET SAVED STATE/);
  const preferenceWrite = app.slice(app.indexOf("localStorage.setItem(PREFERENCES_KEY"), app.indexOf("const captureViewport"));
  assert.doesNotMatch(preferenceWrite, /latitude|longitude|mapPosition|atlasPositionSamplesRef/);
  assert.match(app, /data-palette=\{themeId\}/);
  assert.doesNotMatch(app, /data-theme=\{themeId\}/);
  assert.match(styles, /\.app\[data-palette="red"\] \{ --accent: #ed2d24; \}/);
  assert.match(styles, /\.splash-reset-state \{/);
});

test("the vehicle gets persistent Now Playing, stable Media Session actions, and directional dismissal", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /className="now-playing-dock persistent-transport control-layer" aria-label="Now playing and music transport"/);
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
  assert.match(styles, /\.app\.modal-open \.persistent-transport\.now-playing-dock \{ bottom: 12px; \}/);
  assert.match(styles, /\.app\.modal-open\.has-now-playing \.drawer-panel \{ padding-bottom: 104px; \}/);
  assert.match(app, /phase === "running" && currentTrack \? \([\s\S]*?className="now-playing-dock persistent-transport control-layer"/);
  assert.match(styles, /\.controls-resting \.persistent-transport \{[\s\S]*?opacity: 0;[\s\S]*?pointer-events: none/);
  assert.match(app, /soundtrackSnapshot\?\.previous\?\.imageUrl/);
  assert.match(app, /soundtrackSnapshot\?\.next\?\.imageUrl/);
  assert.match(styles, /\.now-playing-copy strong \{[^}]*font-size: var\(--type-active\)/);
  assert.match(styles, /\.drawer-panel\.is-dragging/);
});

test("compact viewports keep mode, appearance, telemetry, and the resting marker distinct", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /className="active-mode-marker"[^>]*>FLUX<\/span>/);
  assert.match(styles, /\.controls-resting \.active-mode-marker \{ opacity: \.82; \}/);
  assert.match(styles, /grid-template-columns: 164px 156px 60px 86px 84px 116px minmax\(107px, 1fr\)/);
  assert.match(styles, /\.appearance-control \{ grid-column: 4; \}[\s\S]*?\.gps-state \{ grid-column: 5; \}/);
  assert.match(styles, /@media \(min-width: 651px\) and \(max-width: 772px\) \{[\s\S]*?grid-template-columns: 21\.216% 20\.181% 7\.762% 11\.125% 10\.867% 15\.006% 13\.843%/);
  assert.match(styles, /@media \(max-width: 650px\) \{[\s\S]*?grid-template-columns: 116px minmax\(0, 1fr\) 220px 72px 52px/);
  assert.match(styles, /@media \(max-width: 480px\) \{[\s\S]*?\.topbar-mark \{ display: none; \}[\s\S]*?\.mode-selector \{ grid-column: 1; \}/);
});

test("the source module is speed-only and network text appears only when actionable", () => {
  const app = read("App.jsx");
  const styles = read("styles.css");

  assert.match(app, /musicMode !== "soundtrack" \? <span className="active-mode-marker"/);
  assert.doesNotMatch(app, /<span>bpm<\/span>|<span>%<\/span>/);
  assert.match(app, /networkUiDetail\(networkNotice\) \? <strong>\{networkUiDetail\(networkNotice\)\}<\/strong> : null/);
  assert.match(app, /className="network-state-dot" aria-hidden="true"/);
  assert.match(app, /Browser connection quality is an estimate/);
  assert.match(styles, /\.source-readout\.is-soundtrack \{[\s\S]*?width: 190px/);
  assert.match(styles, /\.network-state\.is-caution \{ color: #f3a84c; \}/);
});
