import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  createDriveyAutomaticInput,
  createDriveyLoadDeadline,
  DEFAULT_DRIVEY_SETTINGS,
  DRIVEY_CAMERAS,
  DRIVEY_LOAD_TIMEOUT_MS,
  DRIVEY_RENDER_MODES,
  DRIVEY_UPSTREAM_COMMIT,
  DRIVEY_UPSTREAM_ENTRY,
  driveyRuntimeUrl,
  driveyMotionProfile,
  nextDriveyCameraId,
  nextDriveyRenderModeId,
  normalizeDriveySettings,
  stabilizeDriveyRoadFollower,
  themeToDriveyPalette,
} from "../src/environments/drivey/drivey-model.js";
import { getFluxTheme } from "../src/flux-themes.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const fieldSource = await read("../src/environments/drivey/drivey-field.jsx");
const shellSource = await read("../public/third-party/drivey/sedicivalvole.html");
const upstreamDriveySource = await read("../public/third-party/drivey/js/Drivey.js");
const upstreamLicence = await read("../public/third-party/drivey/LICENSE");
const dependencyLicences = await read("../public/third-party/drivey/THIRD_PARTY_LICENSES.md");
const viteConfigSource = await read("../vite.config.mjs");
const appSource = await read("../src/App.jsx");
const stylesSource = await read("../src/styles.css");
const harnessSource = await read("../qa/field-harness.jsx");

test("DRIVEY exposes only the selected cameras plus bounded traffic and render modes", () => {
  assert.deepEqual(Object.keys(DRIVEY_CAMERAS), ["hood", "rear", "aerial"]);
  assert.deepEqual(Object.keys(DRIVEY_RENDER_MODES), ["normal", "wireframe"]);
  assert.deepEqual(normalizeDriveySettings(null), DEFAULT_DRIVEY_SETTINGS);
  assert.deepEqual(normalizeDriveySettings({ camera: "rear", traffic: 999 }), {
    camera: "rear",
    traffic: 24,
    renderMode: "normal",
  });
  assert.deepEqual(normalizeDriveySettings({ camera: "unknown", traffic: -1 }), {
    camera: "hood",
    traffic: 0,
    renderMode: "normal",
  });
  assert.deepEqual(normalizeDriveySettings({
    camera: "aerial",
    structure: 100,
    renderMode: "wireframe",
  }), {
    camera: "aerial",
    traffic: 24,
    renderMode: "wireframe",
  });
  assert.deepEqual(normalizeDriveySettings({ camera: "driver", renderMode: "technicolor" }), {
    camera: "hood",
    traffic: 16,
    renderMode: "normal",
  });
});

test("DRIVEY camera and render text controls cycle through every admitted state", () => {
  assert.equal(nextDriveyCameraId("hood"), "rear");
  assert.equal(nextDriveyCameraId("rear"), "aerial");
  assert.equal(nextDriveyCameraId("aerial"), "hood");
  assert.equal(nextDriveyCameraId("driver"), "hood");
  assert.equal(nextDriveyRenderModeId("normal"), "wireframe");
  assert.equal(nextDriveyRenderModeId("wireframe"), "normal");
  assert.equal(nextDriveyRenderModeId("technicolor"), "normal");
});

test("road speed owns the original cruise while music only owns colour energy", () => {
  const rest = driveyMotionProfile({ speedKmh: 0, audioLevel: 0 });
  const road = driveyMotionProfile({ speedKmh: 100, audioLevel: 0 });
  const music = driveyMotionProfile({ speedKmh: 0, audioLevel: 0.7 });
  assert.equal(rest.cruiseSpeed, 0);
  assert.ok(road.cruiseSpeed > rest.cruiseSpeed);
  assert.ok(road.npcSpeedScale > rest.npcSpeedScale);
  assert.equal(road.colourEnergy, 0);
  assert.equal(music.cruiseSpeed, rest.cruiseSpeed);
  assert.ok(music.colourEnergy > rest.colourEnergy);
});

test("the integration uses the upstream automatic Input and removes random player weaving", () => {
  class UpstreamInput {
    constructor() {
      this.upstream = true;
      this.manualSteerSensitivity = 1;
      this.autoSteerSensitivity = 0;
      this.weaving = 1;
    }

    update() {}
  }

  const input = createDriveyAutomaticInput(UpstreamInput);
  assert.ok(input instanceof UpstreamInput);
  assert.equal(input.upstream, true);
  assert.equal(input.steer, 0);
  assert.equal(input.handbrake, 0);
  assert.equal(input.manualSteerSensitivity, 0);
  assert.equal(input.autoSteerSensitivity, 1);
  assert.equal(input.cruiseSpeedMultiplier, 1);

  const car = { weaving: 0.75 };
  stabilizeDriveyRoadFollower(car);
  assert.equal(car.weaving, 0);
  assert.doesNotThrow(() => stabilizeDriveyRoadFollower(null));
});

test("OPEN, UNDERWATER, BLOOM and reduced motion use distinct bounded mappings", () => {
  const normal = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4 });
  const open = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4, effect: "OPEN" });
  const underwater = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4, effect: "UNDERWATER" });
  const bloom = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4, effect: "BLOOM" });
  const reduced = driveyMotionProfile({
    speedKmh: 130,
    audioLevel: 1,
    effect: "BLOOM",
    reducedMotion: true,
  });
  assert.ok(open.fov > normal.fov);
  assert.ok(underwater.fov < normal.fov);
  assert.ok(underwater.cruiseSpeed < normal.cruiseSpeed);
  assert.ok(bloom.lightGain > open.lightGain);
  assert.equal(reduced.cruiseSpeed, 0);
  assert.equal(reduced.npcSpeedScale, 0);
  assert.equal(reduced.colourEnergy, 0);
  for (const profile of [normal, open, underwater, bloom, reduced]) {
    assert.ok(profile.fov >= 78 && profile.fov <= 112);
  }
});

test("every theme keeps both native colours separate in the Drivey material palette", () => {
  const quiet = driveyMotionProfile({ speedKmh: 65, audioLevel: 0.1 });
  const musical = driveyMotionProfile({ speedKmh: 65, audioLevel: 0.9, effect: "BLOOM" });
  for (const themeId of ["pearl", "graphite", "red", "blue", "silver", "neon", "mint", "acid", "signal", "sulphur"]) {
    const theme = getFluxTheme(themeId);
    for (const profile of [quiet, musical]) {
      const palette = themeToDriveyPalette(theme, profile);
      for (const color of Object.values(palette)) {
        assert.equal(color.length, 3);
        assert.ok(color.every((channel) => channel >= 0 && channel <= 1));
      }
      assert.deepEqual(palette.full, theme.palette.accent, `${themeId} primary`);
      assert.deepEqual(palette.secondary, theme.palette.secondary, `${themeId} secondary`);
      assert.notDeepEqual(palette.full, palette.secondary, `${themeId} pair`);
    }
  }
  assert.notDeepEqual(
    themeToDriveyPalette(getFluxTheme("red"), quiet).light,
    themeToDriveyPalette(getFluxTheme("red"), musical).light,
  );
});

test("the Drivey load deadline fails once and clears on load or cleanup", () => {
  const scheduled = [];
  const cancelled = [];
  let failures = 0;
  const createDeadline = () => createDriveyLoadDeadline({
    schedule(callback, delay) {
      const timer = { callback, delay };
      scheduled.push(timer);
      return timer;
    },
    cancel(timer) {
      cancelled.push(timer);
    },
    onTimeout() {
      failures += 1;
    },
  });

  const timedOut = createDeadline();
  assert.equal(scheduled[0].delay, DRIVEY_LOAD_TIMEOUT_MS);
  scheduled[0].callback();
  scheduled[0].callback();
  assert.equal(failures, 1);
  assert.equal(timedOut.clear(), false);

  const loaded = createDeadline();
  const loadTimer = scheduled.at(-1);
  assert.equal(loaded.clear(), true);
  assert.equal(cancelled.at(-1), loadTimer);
  loadTimer.callback();
  assert.equal(failures, 1);
});

test("every admitted Drivey runtime file remains byte-identical to the pinned commit", async () => {
  const manifest = await read("../public/third-party/drivey/UPSTREAM-SHA256SUMS.txt");
  const entries = manifest
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const match = line.match(/^([a-f0-9]{64})\s{2}(.+)$/);
      assert.ok(match, line);
      return { expected: match[1], path: match[2] };
    });
  assert.equal(entries.length, 51);
  for (const { expected, path } of entries) {
    const source = await readFile(
      new URL(`../public/third-party/drivey/${path}`, import.meta.url),
    );
    assert.equal(createHash("sha256").update(source).digest("hex"), expected, path);
  }
  assert.equal(DRIVEY_UPSTREAM_COMMIT, "5104cdade2a3158786b05b9b0680a50e942830cf");
});

test("the bridge embeds the original runtime and excludes unneeded image and legacy trees", async () => {
  assert.equal(DRIVEY_UPSTREAM_ENTRY, "third-party/drivey/sedicivalvole.html");
  assert.equal(
    driveyRuntimeUrl("https://sedicivalvole.app", "20260829-2332"),
    "https://sedicivalvole.app/third-party/drivey/sedicivalvole.html?build=20260829-2332",
  );
  assert.match(fieldSource, /driveyRuntimeUrl\(window\.location\.origin, __APP_BUILD__\)/);
  assert.match(shellSource, /import Drivey from "\.\/js\/Drivey\.js"/);
  assert.match(shellSource, /import \{ Input \} from "\.\/js\/Input\.js"/);
  assert.match(shellSource, /window\.__SEDICIVALVOLE_DRIVEY__/);
  assert.match(shellSource, /removeEmbeddedPlaylist/);
  assert.match(fieldSource, /<iframe/);
  assert.match(fieldSource, /WebGL · Original Drivey/);
  assert.match(fieldSource, /canvasFramebufferSize\(screen\.renderer\?\.domElement\)/);
  assert.match(fieldSource, /drivey\.setCameraMount\(settings\.camera\)/);
  assert.match(fieldSource, /drivey\.setNumOtherCars\(settings\.traffic\)/);
  assert.match(fieldSource, /drivey\.screen\.setWireframe\(wireframe\)/);
  assert.match(fieldSource, /drivey\.screen\.setCycleColors\(false\)/);
  assert.match(fieldSource, /silhouetteMaterial\.uniforms\.isWireframe\.value = wireframe/);
  assert.match(fieldSource, /transparentMaterial\.uniforms\.isWireframe\.value = wireframe/);
  assert.match(shellSource, /backgroundTint/);
  assert.match(shellSource, /lineTint/);
  assert.match(shellSource, /highlightTint/);
  assert.match(shellSource, /pairedLine = mix\(highlightTint, lineTint, paletteBlend\)/);
  assert.match(shellSource, /paletteWireframe/);
  assert.match(shellSource, /secondaryTint/);
  assert.match(shellSource, /shade < 0\.68/);
  assert.match(fieldSource, /createDriveyAutomaticInput\(Input\)/);
  assert.match(fieldSource, /stabilizeDriveyRoadFollower\(drivey\.myCar\)/);
  assert.match(appSource, /className="visual-cycle-button visual-view-cycle"/);
  assert.match(appSource, /className="visual-cycle-button visual-render-toggle"/);
  assert.match(appSource, /aria-pressed=\{wireframe\}/);
  assert.match(appSource, /nextDriveyCameraId\(camera\.id\)/);
  assert.match(appSource, /nextDriveyRenderModeId\(renderMode\.id\)/);
  assert.match(stylesSource, /grid-template-columns: repeat\(2, 94px\)/);
  assert.doesNotMatch(appSource, /id="drivey-tune-panel"/);
  assert.doesNotMatch(stylesSource, /\.visual-tune-panel|\.visual-render-icon/);
  assert.match(harnessSource, /renderMode: parameters\.get\("render"\) \?\? "normal"/);
  assert.doesNotMatch(fieldSource, /getContext\("2d"|drawRoad|projectDriveyPoint/);
  assert.match(viteConfigSource, /entries: \["index\.html", "qa-field\.html"\]/);
  await assert.rejects(access(new URL("../public/third-party/drivey/readme_assets", import.meta.url)));
  await assert.rejects(access(new URL("../public/third-party/drivey/legacy", import.meta.url)));
});

test("licence evidence preserves both the GPL grant and the older conflicting header", () => {
  assert.match(upstreamLicence, /GNU GENERAL PUBLIC LICENSE/);
  assert.match(upstreamDriveySource, /Free to use and modify for non-profit purposes only/);
  assert.match(upstreamDriveySource, /GPLv3 license is being actively considered/);
  assert.match(dependencyLicences, /three\.js r115/);
  assert.match(dependencyLicences, /expr-eval 2\.0\.2/);
  assert.match(dependencyLicences, /Hundred Rabbits Themes/);
});
