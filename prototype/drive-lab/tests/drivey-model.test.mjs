import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  configureDriveyOpposingTraffic,
  createDriveyAutomaticInput,
  createDriveyLoadDeadline,
  DEFAULT_DRIVEY_SETTINGS,
  DRIVEY_CAMERAS,
  DRIVEY_LOAD_TIMEOUT_MS,
  DRIVEY_NOMINAL_LEVEL_SPEED_MPS,
  DRIVEY_OPPOSING_TRAFFIC_COUNT,
  DRIVEY_RENDER_MODES,
  DRIVEY_ROAD_RESPONSE,
  DRIVEY_UPSTREAM_COMMIT,
  DRIVEY_UPSTREAM_ENTRY,
  driveyCruiseMultiplierForSpeed,
  driveyOpposingTrafficPlan,
  driveyRuntimeUrl,
  driveyMotionProfile,
  holdDriveyPlayerAtRest,
  nextDriveyCameraId,
  nextDriveyRenderModeId,
  normalizeDriveySettings,
  stabilizeDriveyRoadFollower,
  synchronizeDriveyRoadSpeed,
  themeToDriveyPalette,
} from "../src/environments/drivey/drivey-model.js";
import { speedToInterstate7Targets } from "../src/interstate-7-bridge.js";
import { getFluxTheme } from "../src/flux-themes.js";
import {
  advanceResponse,
  createAudioMacroSnapshot,
  createResponseState,
} from "../src/response-mapping.js";

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

test("DRIVEY exposes only the selected cameras and render modes while retiring traffic preferences", () => {
  assert.deepEqual(Object.keys(DRIVEY_CAMERAS), ["hood", "rear", "aerial"]);
  assert.deepEqual(Object.keys(DRIVEY_RENDER_MODES), ["normal", "wireframe"]);
  assert.deepEqual(normalizeDriveySettings(null), DEFAULT_DRIVEY_SETTINGS);
  assert.deepEqual(normalizeDriveySettings({ camera: "rear", traffic: 999 }), {
    camera: "rear",
    renderMode: "normal",
  });
  assert.deepEqual(normalizeDriveySettings({ camera: "unknown", traffic: -1 }), {
    camera: "hood",
    renderMode: "normal",
  });
  assert.deepEqual(normalizeDriveySettings({
    camera: "aerial",
    structure: 100,
    renderMode: "wireframe",
  }), {
    camera: "aerial",
    renderMode: "wireframe",
  });
  assert.deepEqual(normalizeDriveySettings({ camera: "driver", renderMode: "technicolor" }), {
    camera: "hood",
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

test("DRIVEY reuses VERTIGO's quadratic road curve and cancels the upstream square-root speed gain", () => {
  for (const speedKmh of [0, 5, 40, 90, 130]) {
    const profile = driveyMotionProfile({ speedKmh, audioLevel: 0 });
    const vertigo = speedToInterstate7Targets(speedKmh);
    assert.ok(Math.abs(profile.roadResponse - vertigo.playbackRate) < 1e-12, `${speedKmh} km/h curve`);
    assert.ok(Math.abs(profile.targetSpeedMps * 3.6 - speedKmh) < 1e-9, `${speedKmh} km/h target`);
    assert.ok(Math.abs(
      profile.cruiseSpeed
      - driveyCruiseMultiplierForSpeed(profile.targetSpeedMps, DRIVEY_NOMINAL_LEVEL_SPEED_MPS)
    ) < 1e-12, `${speedKmh} km/h cruise`);
  }
  const walking = driveyMotionProfile({ speedKmh: 5 });
  assert.ok(walking.cruiseSpeed < 0.002, "walking pace must not select the old fast cruise range");
});

test("DRIVEY road response is bounded, smooth, reversible, and stable across frame rates", () => {
  const run = (fps, target, seconds, initial = 0) => {
    let state = createResponseState(DRIVEY_ROAD_RESPONSE, initial, 0);
    for (let frame = 1; frame <= fps * seconds; frame += 1) {
      state = advanceResponse(DRIVEY_ROAD_RESPONSE, state, target, frame * 1000 / fps);
    }
    return state;
  };
  const rise = [30, 60, 120].map((fps) => run(fps, 100, 1).value);
  assert.ok(Math.max(...rise) - Math.min(...rise) < 1e-12, rise.join(", "));
  assert.ok(rise[0] > 0 && rise[0] < 1);
  const release = [30, 60, 120].map((fps) => run(fps, 0, 1, 100).value);
  assert.ok(Math.max(...release) - Math.min(...release) < 1e-12, release.join(", "));
  assert.ok(release[0] >= 0 && release[0] < rise[0]);
});

test("DRIVEY consumes the timestamped UNDERWATER amount", () => {
  const partial = driveyMotionProfile({
    speedKmh: 70,
    audioLevel: 0.8,
    effect: "BLOOM",
    macroSnapshot: createAudioMacroSnapshot({
      capturedAtMs: 100,
      open: 0.25,
      underwater: 0.5,
      bloom: 0.4,
    }),
  });
  assert.deepEqual(partial.macros, { underwater: 0.5 });
  assert.ok(partial.lightGain > 0.85 && partial.lightGain < 1);
  assert.ok(partial.cruiseSpeed > 0);
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

class Vector2Mock {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  copy(value) {
    this.x = value.x;
    this.y = value.y;
    return this;
  }

  clone() {
    return new Vector2Mock(this.x, this.y);
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const magnitude = this.length();
    if (magnitude > 0) {
      this.x /= magnitude;
      this.y /= magnitude;
    }
    return this;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  add(value) {
    this.x += value.x;
    this.y += value.y;
    return this;
  }

  multiplyScalar(value) {
    this.x *= value;
    this.y *= value;
    return this;
  }
}

test("the bridge removes the upstream launch overspeed from player and opposing traffic", () => {
  const player = {
    vel: new Vector2Mock(100, 0),
    lastVel: new Vector2Mock(100, 0),
    dir: () => new Vector2Mock(1, 0),
  };
  const opposing = {
    vel: new Vector2Mock(-100, 0),
    lastVel: new Vector2Mock(-100, 0),
    dir: () => new Vector2Mock(-1, 0),
  };
  const targetSpeedMps = 5 / 3.6;
  assert.equal(synchronizeDriveyRoadSpeed({ myCar: player, otherCars: [opposing] }, targetSpeedMps, true), true);
  assert.ok(Math.abs(player.vel.length() - targetSpeedMps) < 1e-12);
  assert.ok(Math.abs(opposing.vel.length() - targetSpeedMps) < 1e-12);
  assert.equal(Math.sign(player.vel.x), 1);
  assert.equal(Math.sign(opposing.vel.x), -1);
  assert.deepEqual([player.lastVel.x, player.lastVel.y], [player.vel.x, player.vel.y]);
  assert.deepEqual([opposing.lastVel.x, opposing.lastVel.y], [opposing.vel.x, opposing.vel.y]);
});

test("zero speed holds the player motionless at the lane centre and releases without a resume teleport", () => {
  const road = {
    getPoint: () => new Vector2Mock(10, 20),
    getNormal: () => new Vector2Mock(0, 1),
    getTangent: () => new Vector2Mock(1, 0),
  };
  const car = {
    road,
    approximation: { getNearest: () => 0.4 },
    pos: new Vector2Mock(99, 99),
    lastPos: new Vector2Mock(98, 98),
    vel: new Vector2Mock(8, 3),
    lastVel: new Vector2Mock(7, 2),
    roadDir: 1,
    laneOffset: 2,
    weaving: 0.5,
    steerTo: 0.2,
    spin: 1,
    sliding: true,
  };
  let exteriorUpdates = 0;
  const drivey = {
    myCar: car,
    myCarExterior: {},
    drivingSide: -1,
    updateCarExterior: () => { exteriorUpdates += 1; },
  };

  for (let frame = 0; frame < 600; frame += 1) {
    assert.equal(holdDriveyPlayerAtRest(drivey), true);
  }
  assert.deepEqual([car.pos.x, car.pos.y], [10, 18]);
  assert.deepEqual([car.lastPos.x, car.lastPos.y], [10, 18]);
  assert.deepEqual([car.vel.x, car.vel.y], [0, 0]);
  assert.deepEqual([car.lastVel.x, car.lastVel.y], [0, 0]);
  assert.equal(car.angle, 0);
  assert.equal(car.weaving, 0);
  assert.equal(car.steerTo, 0);
  assert.equal(car.spin, 0);
  assert.equal(car.sliding, false);
  assert.equal(exteriorUpdates, 600);

  const releasePosition = [car.pos.x, car.pos.y];
  car.vel.set(0.1, 0);
  assert.deepEqual([car.pos.x, car.pos.y], releasePosition, "release itself must not reposition the car");
});

test("traffic is opposing-only when road direction is provable and otherwise fails closed to zero", () => {
  const placements = [];
  const road = { getPoint() {}, getNormal() {} };
  const cars = Array.from({ length: DRIVEY_OPPOSING_TRAFFIC_COUNT }, () => ({
    place(_road, _approximation, along, _laneWidth, _numLanes, _side, roadDir) {
      this.roadDir = roadDir;
      placements.push({ along, roadDir });
    },
  }));
  const counts = [];
  const drivey = {
    myCar: { roadDir: 1 },
    drivingSide: -1,
    level: { mainRoad: road, laneWidth: 3.5, numLanes: 2, cruiseSpeed: 1 },
    autoSteerApproximation: {},
    otherCars: cars,
    setNumOtherCars(count) { counts.push(count); },
  };
  assert.deepEqual(driveyOpposingTrafficPlan(drivey), {
    mode: "opposing",
    count: DRIVEY_OPPOSING_TRAFFIC_COUNT,
    roadDirection: -1,
  });
  assert.deepEqual(configureDriveyOpposingTraffic(drivey, () => 0.25), {
    mode: "opposing",
    count: DRIVEY_OPPOSING_TRAFFIC_COUNT,
    roadDirection: -1,
  });
  assert.equal(counts[0], DRIVEY_OPPOSING_TRAFFIC_COUNT);
  assert.equal(placements.length, DRIVEY_OPPOSING_TRAFFIC_COUNT);
  assert.ok(placements.every(({ along, roadDir }) => along === 0.25 && roadDir === -1));
  assert.ok(cars.every((car) => car.weaving === 0));

  const unreliableCounts = [];
  const unreliable = {
    ...drivey,
    myCar: { roadDir: 0 },
    setNumOtherCars(count) { unreliableCounts.push(count); },
  };
  assert.equal(configureDriveyOpposingTraffic(unreliable).mode, "none");
  assert.deepEqual(unreliableCounts, [0]);
});

test("only UNDERWATER changes the bounded driving-effect mapping", () => {
  const normal = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4 });
  const open = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4, effect: "OPEN" });
  const underwater = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4, effect: "UNDERWATER" });
  const bloom = driveyMotionProfile({ speedKmh: 70, audioLevel: 0.4, effect: "BLOOM" });
  const reduced = driveyMotionProfile({
    speedKmh: 130,
    audioLevel: 1,
    effect: "UNDERWATER",
    reducedMotion: true,
  });
  assert.deepEqual(open, { ...normal, effect: "OPEN" });
  assert.ok(underwater.fov < normal.fov);
  assert.ok(underwater.cruiseSpeed < normal.cruiseSpeed);
  assert.deepEqual(bloom, { ...normal, effect: "BLOOM" });
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
  assert.match(fieldSource, /configureDriveyOpposingTraffic\(drivey\)/);
  assert.match(fieldSource, /holdDriveyPlayerAtRest\(drivey\)/);
  assert.doesNotMatch(fieldSource, /settings\.traffic/);
  assert.doesNotMatch(harnessSource, /parameters\.get\("traffic"\)/);
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
  assert.match(stylesSource, /\.visual-cycle-rail \{[\s\S]*?grid-auto-columns: 112px/);
  assert.match(stylesSource, /\.visual-cycle-button \{[\s\S]*?min-height: var\(--touch-target\)/);
  assert.doesNotMatch(appSource, /id="drivey-tune-panel"/);
  assert.doesNotMatch(stylesSource, /\.visual-tune-panel|\.visual-render-icon/);
  assert.match(harnessSource, /renderMode: parameters\.get\("render"\) \?\? "normal"/);
  assert.doesNotMatch(fieldSource, /getContext\("2d"|drawRoad|projectDriveyPoint/);
  assert.match(viteConfigSource, /entries: \["index\.html", "qa-field\.html", "lab\.html"\]/);
  assert.match(viteConfigSource, /outDir: "dist\/client",\s+emptyOutDir: true/);
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
