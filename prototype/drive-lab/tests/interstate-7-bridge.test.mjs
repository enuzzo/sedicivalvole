import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createInterstateLoadDeadline,
  INTERSTATE7_ENTRY_PHASE_SECONDS,
  INTERSTATE7_LOAD_TIMEOUT_MS,
  interstate7EffectTargets,
  speedToInterstate7Targets,
  themeToInterstate7Palette,
} from "../src/interstate-7-bridge.js";
import { getFluxTheme } from "../src/flux-themes.js";
import {
  canvasFramebufferSize,
  SIXTY_FPS_FRAME_INTERVAL_MS,
} from "../src/render-telemetry.js";

const fieldSource = await readFile(new URL("../src/interstate-7-field.jsx", import.meta.url), "utf8");

const UPSTREAM_FILES = new Map([
  ["index7.html", "6f6737865d80580ace61c7dea61c9b93c217724e7547ce1cf3c6dcd5adf6fb7b"],
  ["js/InfiniteLights.js", "683fc98dac19460d478307bebe92751858456a5414c4834ac8d9caf9741e015e"],
  ["js/Distortions.js", "ab84f9ba32bae503ad59dc5361ba244942a82ecc9842d54e74aa87f9c3d14390"],
  ["js/three.min.js", "5ae6b42ec42418311e2246e604d8e3f70713849879b820fa47cfb9610857bde4"],
  ["js/postprocessing.min.js", "e97d27621fd9f9ee1201039437deaf9743918f003b9efd935798ef76e120adfa"],
  ["css/base.css", "4d124d90b35ac97571d526061333a729f4ad111e8cebe7e9e4fe0c0956e8fd23"],
  ["README.md", "2fee7e688511081d324fc34f99b971a4e06bc0b2670063ab306819f14678d4a6"],
]);

test("maps road speed to the original Interstate 7 time and FOV controls", () => {
  assert.deepEqual(speedToInterstate7Targets(0), {
    normalizedSpeed: 0,
    playbackRate: 0,
    speedUpTarget: -1,
    fovTarget: 90,
  });
  assert.deepEqual(speedToInterstate7Targets(65), {
    normalizedSpeed: 0.5,
    playbackRate: 0.25,
    speedUpTarget: -0.75,
    fovTarget: 105,
  });
  assert.deepEqual(speedToInterstate7Targets(130), {
    normalizedSpeed: 1,
    playbackRate: 1,
    speedUpTarget: 0,
    fovTarget: 150,
  });
  assert.deepEqual(speedToInterstate7Targets(260), speedToInterstate7Targets(130));
});

test("maps only UNDERWATER through the original time, FOV, and colour controls", () => {
  const idle = interstate7EffectTargets(65, null);
  const open = interstate7EffectTargets(65, "OPEN");
  const underwater = interstate7EffectTargets(65, "UNDERWATER");
  const bloom = interstate7EffectTargets(65, "BLOOM");
  assert.deepEqual(open, idle);
  assert.ok(underwater.fovTarget < idle.fovTarget);
  assert.deepEqual(bloom, idle);
});

test("keeps urban motion grounded and enters on the composed road phase", () => {
  const forty = speedToInterstate7Targets(40);
  const sixty = speedToInterstate7Targets(60);
  assert.ok(forty.playbackRate < 0.1);
  assert.ok(sixty.playbackRate > 0.2 && sixty.playbackRate < 0.22);
  assert.ok(forty.fovTarget < 96);
  assert.ok(sixty.fovTarget < 103);
  assert.equal(INTERSTATE7_ENTRY_PHASE_SECONDS, 2.1);
});

test("keeps the original Interstate 7 runtime byte-identical to upstream", async () => {
  for (const [relativePath, expectedHash] of UPSTREAM_FILES) {
    const source = await readFile(
      new URL(`../public/third-party/infinite-lights/${relativePath}`, import.meta.url),
    );
    const actualHash = createHash("sha256").update(source).digest("hex");
    assert.equal(actualHash, expectedHash, relativePath);
  }
});

test("reports ready Interstate 7 frames against a 60 FPS target using its framebuffer", () => {
  assert.equal(SIXTY_FPS_FRAME_INTERVAL_MS, 1000 / 60);
  assert.deepEqual(canvasFramebufferSize({
    width: 1546,
    height: 1202,
    clientWidth: 773,
    clientHeight: 601,
  }), { width: 1546, height: 1202 });
  assert.equal(canvasFramebufferSize({ width: 0, height: 1202 }), null);
  assert.match(
    fieldSource,
    /canvasFramebufferSize\(\s*frameWindow\.document\.querySelector\("#app canvas"\),?\s*\)/,
  );
  assert.match(fieldSource, /SIXTY_FPS_FRAME_INTERVAL_MS,/);
  assert.match(fieldSource, /const result = originalUpdate\.call\(this, delta\);/);
  assert.doesNotMatch(fieldSource, /frame\.clientWidth|frame\.clientHeight/);
});

test("bounds bridge installation and warning without retrying from requestAnimationFrame", () => {
  const renderBody = fieldSource.slice(
    fieldSource.indexOf("const render = (now) =>"),
    fieldSource.indexOf("const onLoad = () =>"),
  );
  assert.doesNotMatch(renderBody, /installBridge\(\)/);
  assert.doesNotMatch(renderBody, /valuesRef\.current\.onFrame/);
  assert.match(fieldSource, /bridgeState !== "waiting"/);
  assert.match(fieldSource, /style\[data-sedicivalvole-integration='true'\]/);
  assert.match(fieldSource, /sedicivalvoleBridgeWarningReported/);
  assert.match(fieldSource, /originalUpdate\.__sedicivalvoleBridge/);
});

test("Interstate 7 load deadline fails once and clears on load or cleanup", () => {
  const scheduled = [];
  const cancelled = [];
  let failures = 0;
  const createDeadline = () => createInterstateLoadDeadline({
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
  assert.equal(scheduled[0].delay, INTERSTATE7_LOAD_TIMEOUT_MS);
  scheduled[0].callback();
  scheduled[0].callback();
  assert.equal(failures, 1, "the stalled iframe reported more than one fallback");
  assert.equal(timedOut.clear(), false, "a late load reopened the timed-out iframe");

  const loaded = createDeadline();
  const loadTimer = scheduled.at(-1);
  assert.equal(loaded.clear(), true);
  assert.equal(cancelled.at(-1), loadTimer);
  loadTimer.callback();
  assert.equal(failures, 1, "a cleared load timer still failed the ready iframe");

  const unmounted = createDeadline();
  const cleanupTimer = scheduled.at(-1);
  assert.equal(unmounted.clear(), true);
  assert.equal(cancelled.at(-1), cleanupTimer);
  cleanupTimer.callback();
  assert.equal(failures, 1, "a cleared cleanup timer failed an unmounted iframe");

  assert.match(fieldSource, /const loadDeadline = createInterstateLoadDeadline/);
  assert.match(fieldSource, /onTimeout: \(\) => fail\(new Error\("Interstate 7 load timed out"\)\)/);
  assert.match(fieldSource, /const onLoad = \(\) => \{\s*if \(!loadDeadline\.clear\(\)\) return;/);
  assert.match(fieldSource, /return \(\) => \{\s*stopped = true;\s*loadDeadline\.clear\(\);/);
});

test("Interstate runtime and bridge updates fail once into the shared fallback", () => {
  assert.match(fieldSource, /const fail = \(error\) => \{/);
  assert.match(fieldSource, /const result = originalUpdate\.call\(this, delta\);[\s\S]*?catch \(error\) \{\s*fail\(error\);/);
  assert.match(fieldSource, /frameWindow\.__SEDICIVALVOLE_THEME__ = valuesRef\.current\.theme;[\s\S]*?catch \(error\) \{\s*fail\(error\);/);
  assert.match(fieldSource, /frame\.classList\.remove\("is-ready"\)/);
  assert.match(fieldSource, /onRuntimeError\?\.\(error instanceof Error/);
});

test("maps every body-colour theme onto all original scene colour groups", () => {
  const palette = themeToInterstate7Palette(getFluxTheme("acid"));
  assert.equal(palette.leftCars.length, 3);
  assert.equal(palette.rightCars.length, 3);
  assert.equal(palette.sticks.length, 2);
  assert.deepEqual(palette.leftCars[0], [1, 0.055, 0.58]);
  assert.deepEqual(palette.rightCars[1], [0.33, 1, 0.16]);
  for (const colors of Object.values(palette)) {
    const entries = Array.isArray(colors[0]) ? colors : [colors];
    for (const color of entries) {
      assert.equal(color.length, 3);
      assert.ok(color.every((channel) => channel >= 0 && channel <= 1));
    }
  }
});
