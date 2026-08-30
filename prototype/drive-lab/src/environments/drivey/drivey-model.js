// DRIVEY 05 — narrow controls for the original Rezmason Drivey runtime.
//
// Geometry, levels, cameras, car simulation, materials, post-processing and
// rendering remain owned by the byte-identical upstream files under
// public/third-party/drivey. This module only clamps Sedici Valvole inputs and
// maps them onto controls the original runtime already exposes.

import { ROAD_SPEED_CEILING_KMH } from "../../signal-model.js";
import {
  audioMacroAmount,
  createResponseDefinition,
  mapResponseValue,
} from "../../response-mapping.js";

export const DRIVEY_UPSTREAM_COMMIT = "5104cdade2a3158786b05b9b0680a50e942830cf";
export const DRIVEY_UPSTREAM_ENTRY = "third-party/drivey/sedicivalvole.html";

export function driveyRuntimeUrl(origin, buildStamp) {
  const url = new URL(`/${DRIVEY_UPSTREAM_ENTRY}`, origin);
  const identity = String(buildStamp || "dev").trim() || "dev";
  url.searchParams.set("build", identity);
  return url.href;
}
export const DRIVEY_LOAD_TIMEOUT_MS = 15000;

export const DRIVEY_CAMERAS = Object.freeze({
  hood: Object.freeze({ id: "hood", label: "HOOD" }),
  rear: Object.freeze({ id: "rear", label: "REAR" }),
  aerial: Object.freeze({ id: "aerial", label: "AERIAL" }),
});

export const DRIVEY_RENDER_MODES = Object.freeze({
  normal: Object.freeze({ id: "normal", label: "NORMAL" }),
  wireframe: Object.freeze({ id: "wireframe", label: "WIRE" }),
});

export const DEFAULT_DRIVEY_SETTINGS = Object.freeze({
  camera: "hood",
  renderMode: "normal",
});
export const DRIVEY_OPPOSING_TRAFFIC_COUNT = 16;
export const DRIVEY_ROAD_RESPONSE = createResponseDefinition({
  input: [0, ROAD_SPEED_CEILING_KMH],
  output: [0, 1],
  exponent: 1.18,
  attackSeconds: 0.32,
  releaseSeconds: 0.24,
  risePerSecond: 2.5,
  fallPerSecond: 3.5,
});

const DRIVEY_CAMERA_SEQUENCE = Object.freeze(Object.keys(DRIVEY_CAMERAS));
const DRIVEY_RENDER_MODE_SEQUENCE = Object.freeze(Object.keys(DRIVEY_RENDER_MODES));

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function normalizeDriveySettings(value) {
  const camera = Object.hasOwn(DRIVEY_CAMERAS, value?.camera)
    ? value.camera
    : DEFAULT_DRIVEY_SETTINGS.camera;
  const renderMode = Object.hasOwn(DRIVEY_RENDER_MODES, value?.renderMode)
    ? value.renderMode
    : DEFAULT_DRIVEY_SETTINGS.renderMode;
  return { camera, renderMode };
}

function nextSequenceValue(sequence, current, fallback) {
  const index = sequence.indexOf(current);
  if (index < 0) return fallback;
  return sequence[(index + 1) % sequence.length];
}

export function nextDriveyCameraId(camera) {
  return nextSequenceValue(
    DRIVEY_CAMERA_SEQUENCE,
    camera,
    DEFAULT_DRIVEY_SETTINGS.camera,
  );
}

export function nextDriveyRenderModeId(renderMode) {
  return nextSequenceValue(
    DRIVEY_RENDER_MODE_SEQUENCE,
    renderMode,
    DEFAULT_DRIVEY_SETTINGS.renderMode,
  );
}

export function createDriveyLoadDeadline({
  schedule,
  cancel,
  onTimeout,
  timeoutMs = DRIVEY_LOAD_TIMEOUT_MS,
}) {
  let active = true;
  let timer = schedule(() => {
    if (!active) return;
    active = false;
    timer = null;
    onTimeout();
  }, timeoutMs);

  const clear = () => {
    if (!active) return false;
    active = false;
    if (timer !== null) cancel(timer);
    timer = null;
    return true;
  };

  return { clear };
}

export function driveyMotionProfile({
  speedKmh = 0,
  roadResponse = null,
  audioLevel = 0,
  effect = null,
  macroSnapshot = null,
  reducedMotion = false,
} = {}) {
  const speed = clamp(Number(speedKmh) || 0, 0, ROAD_SPEED_CEILING_KMH);
  const normalizedSpeed = speed / ROAD_SPEED_CEILING_KMH;
  const mappedRoadResponse = Number.isFinite(roadResponse)
    ? clamp(roadResponse, 0, 1)
    : mapResponseValue(DRIVEY_ROAD_RESPONSE, speed);
  const musicLevel = clamp(Number(audioLevel) || 0, 0, 1);
  const hasMacroSnapshot = macroSnapshot != null;
  const open = hasMacroSnapshot ? audioMacroAmount(macroSnapshot, "open") : effect === "OPEN" ? 1 : 0;
  const underwater = hasMacroSnapshot ? audioMacroAmount(macroSnapshot, "underwater") : effect === "UNDERWATER" ? 1 : 0;
  const bloom = hasMacroSnapshot ? audioMacroAmount(macroSnapshot, "bloom") : effect === "BLOOM" ? 1 : 0;
  const effectSpeedScale = 1 - underwater * 0.28;

  return Object.freeze({
    normalizedSpeed,
    roadResponse: mappedRoadResponse,
    cruiseSpeed: reducedMotion ? 0 : mappedRoadResponse * 4 * effectSpeedScale,
    npcSpeedScale: reducedMotion ? 0 : mappedRoadResponse * effectSpeedScale,
    fov: clamp(90 + normalizedSpeed * 8 + open * 8 - underwater * 6 + bloom * 4, 78, 112),
    colourEnergy: reducedMotion ? 0 : musicLevel * (0.68 + bloom * 0.32),
    lightGain: clamp(1 + bloom * 0.24 + open * 0.1 - underwater * 0.22, 0.7, 1.34),
    macros: Object.freeze({ open, underwater, bloom }),
    effect,
    reducedMotion,
  });
}

export function createDriveyAutomaticInput(InputClass) {
  if (typeof InputClass !== "function") {
    throw new TypeError("Drivey Input constructor is unavailable");
  }
  const input = new InputClass();
  input.slow = false;
  input.fast = false;
  input.gasPedal = 0;
  input.brakePedal = 0;
  input.handbrake = 0;
  input.steer = 0;
  input.minCruiseSpeed = 0;
  input.manualSteerSensitivity = 0;
  input.autoSteerSensitivity = 1;
  input.cruiseSpeedMultiplier = 1;
  input.laneShift = 0;
  return input;
}

export function stabilizeDriveyRoadFollower(car) {
  if (!car) return;
  car.weaving = 0;
}

function canPlaceDriveyCar(car) {
  return typeof car?.place === "function";
}

export function driveyOpposingTrafficPlan(drivey) {
  const playerDirection = Number(drivey?.myCar?.roadDir);
  const level = drivey?.level;
  const reliable = Number.isFinite(playerDirection)
    && Math.abs(playerDirection) === 1
    && Number.isFinite(drivey?.drivingSide)
    && Math.abs(drivey.drivingSide) === 1
    && Number.isFinite(level?.laneWidth)
    && level.laneWidth > 0
    && Number.isFinite(level?.numLanes)
    && level.numLanes > 0
    && typeof level?.mainRoad?.getPoint === "function"
    && typeof level?.mainRoad?.getNormal === "function"
    && drivey?.autoSteerApproximation != null
    && typeof drivey?.setNumOtherCars === "function";
  return Object.freeze({
    mode: reliable ? "opposing" : "none",
    count: reliable ? DRIVEY_OPPOSING_TRAFFIC_COUNT : 0,
    roadDirection: reliable ? -playerDirection : null,
  });
}

export function configureDriveyOpposingTraffic(drivey, random = Math.random) {
  const plan = driveyOpposingTrafficPlan(drivey);
  if (plan.mode === "none") {
    drivey?.setNumOtherCars?.(0);
    return plan;
  }
  try {
    drivey.setNumOtherCars(plan.count);
    const cars = drivey.otherCars?.slice(0, plan.count) ?? [];
    if (cars.length !== plan.count || cars.some((car) => !canPlaceDriveyCar(car))) {
      throw new Error("Drivey opposing traffic cars are unavailable");
    }
    cars.forEach((car) => {
      car.place(
        drivey.level.mainRoad,
        drivey.autoSteerApproximation,
        clamp(Number(random()) || 0, 0, 1),
        drivey.level.laneWidth,
        drivey.level.numLanes,
        drivey.drivingSide,
        plan.roadDirection,
        drivey.level.cruiseSpeed,
      );
      car.weaving = 0;
    });
    if (cars.some((car) => car.roadDir !== plan.roadDirection)) {
      throw new Error("Drivey opposing traffic direction is unverified");
    }
    return plan;
  } catch {
    drivey.setNumOtherCars(0);
    return Object.freeze({ mode: "none", count: 0, roadDirection: null });
  }
}

function zeroVector(vector) {
  vector?.set?.(0, 0);
}

/** Keep the player exactly stopped on its current lane centre without vendor edits. */
export function holdDriveyPlayerAtRest(drivey) {
  const car = drivey?.myCar;
  if (!car) return false;
  const road = car.road;
  const approximation = car.approximation;
  const direction = Number(car.roadDir);
  const laneOffset = Number(car.laneOffset);
  const drivingSide = Number(drivey?.drivingSide);
  if (
    typeof approximation?.getNearest !== "function"
    || typeof road?.getPoint !== "function"
    || typeof road?.getNormal !== "function"
    || typeof road?.getTangent !== "function"
    || !Number.isFinite(direction)
    || !Number.isFinite(laneOffset)
    || !Number.isFinite(drivingSide)
  ) return false;

  const along = approximation.getNearest(car.pos);
  const centre = road.getPoint(along);
  const normal = road.getNormal(along);
  const tangent = road.getTangent(along);
  if (!centre?.add || !normal?.multiplyScalar || !tangent?.multiplyScalar) return false;
  centre.add(normal.multiplyScalar(laneOffset * direction * drivingSide));
  tangent.multiplyScalar(direction);
  car.pos?.copy?.(centre);
  car.lastPos?.copy?.(centre);
  zeroVector(car.vel);
  zeroVector(car.lastVel);
  car.angle = Math.atan2(Number(tangent.y) || 0, Number(tangent.x) || 0);
  car.weaving = 0;
  car.roadPos = 0;
  car.steer = 0;
  car.steerPos = 0;
  car.steerTo = 0;
  car.steerV = 0;
  car.accelerate = 0;
  car.handbrake = 0;
  car.sliding = false;
  car.spin = 0;
  car.tilt = 0;
  car.pitch = 0;
  car.tiltV = 0;
  car.pitchV = 0;
  drivey.updateCarExterior?.(car, drivey.myCarExterior);
  return true;
}

function mixRgb(from, to, amount) {
  return from.map((value, index) => value + (to[index] - value) * amount);
}

function gainRgb(color, gain) {
  return color.map((value) => clamp(value * gain, 0, 1));
}

export function themeToDriveyPalette(theme, profile) {
  const { base, mid, light, accent, secondary } = theme.palette;
  const open = clamp(Number(profile.macros?.open) || 0, 0, 1);
  const underwater = clamp(Number(profile.macros?.underwater) || 0, 0, 1);
  const bloom = clamp(Number(profile.macros?.bloom) || 0, 0, 1);
  let dark = mixRgb(base, mid, 0.06);
  const full = [...accent];
  const partner = [...secondary];
  const colourLift = clamp(profile.colourEnergy * 0.12, 0, 0.12);
  let bright = mixRgb(
    light,
    secondary,
    0.04 + bloom * 0.14 + colourLift,
  );

  dark = mixRgb(dark, mixRgb(base, secondary, 0.12), underwater);
  bright = mixRgb(bright, secondary, underwater * 0.22);
  bright = mixRgb(bright, light, open * 0.12);

  bright = gainRgb(bright, profile.lightGain);
  return Object.freeze({
    background: gainRgb(dark, 0.9 - underwater * 0.16),
    dark,
    full,
    secondary: partner,
    light: bright,
  });
}
