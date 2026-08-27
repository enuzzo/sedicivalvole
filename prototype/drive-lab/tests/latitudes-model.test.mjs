import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceLatitudesHistory,
  createLatitudesHistory,
  historyCurvature,
  historyLagMetres,
  LATITUDES_HISTORY_SAMPLES,
  LATITUDES_IDLE_CRAWL_MPS,
  LATITUDES_SAMPLE_INTERVAL_SECONDS,
  LATITUDES_WINDOW_SECONDS,
  readLatitudesHistory,
  speedToFieldStructure,
  speedToRestPhaseRate,
  speedToTravelMps,
} from "../src/environments/latitudes/latitudes-model.js";
import { ROAD_SPEED_CEILING_KMH } from "../src/signal-model.js";

const FRAME = 1 / 60;

/** Runs a speed profile through the history at a fixed frame rate. */
function drive(history, speedKmh, seconds) {
  for (let step = 0; step < Math.round(seconds / FRAME); step += 1) {
    advanceLatitudesHistory(history, speedKmh, FRAME);
  }
  return history;
}

/** Runs a linear speed ramp through the history. */
function ramp(history, fromKmh, toKmh, seconds) {
  const steps = Math.round(seconds / FRAME);
  for (let step = 0; step < steps; step += 1) {
    advanceLatitudesHistory(history, fromKmh + (toKmh - fromKmh) * (step / steps), FRAME);
  }
  return history;
}

test("spans a bounded window of real time", () => {
  assert.equal(LATITUDES_HISTORY_SAMPLES, 240);
  assert.ok(Math.abs(LATITUDES_WINDOW_SECONDS - 8) < 1e-9);
  assert.ok(Math.abs(
    LATITUDES_HISTORY_SAMPLES * LATITUDES_SAMPLE_INTERVAL_SECONDS - LATITUDES_WINDOW_SECONDS,
  ) < 1e-9);
});

test("keeps the field alive at a standstill without implying movement", () => {
  assert.equal(speedToTravelMps(0), LATITUDES_IDLE_CRAWL_MPS);
  assert.equal(speedToTravelMps(-20), LATITUDES_IDLE_CRAWL_MPS);
  assert.equal(speedToTravelMps(Number.NaN), LATITUDES_IDLE_CRAWL_MPS);
  assert.ok(speedToTravelMps(130) > speedToTravelMps(0) * 10);

  // The resting drift is what breathes; it recedes once real travel takes over.
  assert.ok(speedToRestPhaseRate(0) > 0);
  assert.ok(speedToRestPhaseRate(ROAD_SPEED_CEILING_KMH) < 1e-12);
  assert.ok(speedToRestPhaseRate(40) < speedToRestPhaseRate(0));
});

test("accumulates distance monotonically and never rewinds", () => {
  const history = createLatitudesHistory();
  let previous = 0;
  for (const speed of [0, 40, 80, 115, 60, 115, 0]) {
    for (let step = 0; step < 120; step += 1) {
      advanceLatitudesHistory(history, speed, FRAME);
      assert.ok(history.travelledMetres >= previous, "travelled distance must never rewind");
      previous = history.travelledMetres;
    }
  }
});

test("clamps malformed timing instead of replaying the whole stack", () => {
  const history = createLatitudesHistory();
  const before = history.travelledMetres;
  advanceLatitudesHistory(history, 100, Number.NaN);
  assert.equal(history.travelledMetres, before);
  advanceLatitudesHistory(history, 100, -8);
  assert.equal(history.travelledMetres, before);

  // A long stall advances at most the clamped frame, not the stalled duration.
  advanceLatitudesHistory(history, 100, 600);
  assert.ok(history.travelledMetres - before < speedToTravelMps(100) * 0.26);
});

test("orders the stack newest first and oldest last", () => {
  const history = drive(createLatitudesHistory(), 100, LATITUDES_WINDOW_SECONDS * 1.5);
  const newest = readLatitudesHistory(history, 0);
  const oldest = readLatitudesHistory(history, 1);
  assert.ok(newest > oldest, "row 0 must be the most recent moment");
  assert.equal(historyLagMetres(history, 0), Math.max(0, history.travelledMetres - newest));
  assert.ok(historyLagMetres(history, 1) > historyLagMetres(history, 0));
});

test("holds the resting stack flat so the strata stay parallel", () => {
  const history = drive(createLatitudesHistory(), 0, LATITUDES_WINDOW_SECONDS * 1.5);
  const lagAtOldest = historyLagMetres(history, 1);
  // Only the idle crawl separates the rows, so the stack is effectively flat.
  assert.ok(
    lagAtOldest < LATITUDES_IDLE_CRAWL_MPS * LATITUDES_WINDOW_SECONDS * 1.05,
    `resting lag should stay near the idle crawl, got ${lagAtOldest}`,
  );
  assert.ok(lagAtOldest > 0, "the resting field must still breathe");
});

test("shears the stack proportionally to steady speed", () => {
  const slow = drive(createLatitudesHistory(), 40, LATITUDES_WINDOW_SECONDS * 1.5);
  const fast = drive(createLatitudesHistory(), 120, LATITUDES_WINDOW_SECONDS * 1.5);
  assert.ok(
    historyLagMetres(fast, 1) > historyLagMetres(slow, 1) * 2.5,
    "faster travel must rake the field further",
  );
});

test("rakes evenly at steady speed and bends under changing speed", () => {
  const steady = drive(createLatitudesHistory(), 100, LATITUDES_WINDOW_SECONDS * 1.5);
  const steadyCurvature = historyCurvature(steady);

  const accelerating = ramp(
    drive(createLatitudesHistory(), 20, LATITUDES_WINDOW_SECONDS),
    20, 125, LATITUDES_WINDOW_SECONDS,
  );
  const decelerating = ramp(
    drive(createLatitudesHistory(), 125, LATITUDES_WINDOW_SECONDS),
    125, 20, LATITUDES_WINDOW_SECONDS,
  );

  assert.ok(
    Math.abs(steadyCurvature) < 5,
    `steady speed must rake evenly, got ${steadyCurvature}`,
  );
  assert.ok(
    Math.abs(historyCurvature(accelerating)) > 50,
    "acceleration must curve the rake",
  );
  assert.ok(
    Math.abs(historyCurvature(decelerating)) > 50,
    "deceleration must curve the rake",
  );
  assert.ok(
    historyCurvature(accelerating) * historyCurvature(decelerating) < 0,
    "acceleration and deceleration must bend the stack in opposite directions",
  );
});

test("retains the high-speed history while decelerating, then releases it", () => {
  const history = drive(createLatitudesHistory(), 125, LATITUDES_WINDOW_SECONDS * 1.5);
  const cruisingLag = historyLagMetres(history, 1);

  // A brief drop must not erase the stack: the fast history is still on screen.
  drive(history, 20, 1.5);
  const shortlyAfter = historyLagMetres(history, 1);
  assert.ok(
    shortlyAfter > cruisingLag * 0.8,
    `a brief slowdown must retain the raked history, got ${shortlyAfter} of ${cruisingLag}`,
  );

  // Sustained low speed scrolls that history out of the window.
  drive(history, 20, LATITUDES_WINDOW_SECONDS * 1.2);
  assert.ok(
    historyLagMetres(history, 1) < cruisingLag * 0.35,
    "sustained low speed must release the raked history",
  );
});

test("opens the field structure continuously from rest to the road ceiling", () => {
  const rest = speedToFieldStructure(0);
  assert.ok(rest.lateralWeight < 0.1, "resting strata are effectively parallel bands");
  assert.equal(rest.fineWeight, 0, "no fine registers at rest");

  let previousLateral = -Infinity;
  let previousFine = -Infinity;
  for (let speed = 0; speed <= ROAD_SPEED_CEILING_KMH; speed += 2) {
    const structure = speedToFieldStructure(speed);
    assert.equal(structure.bandFrequency, rest.bandFrequency, "band frequency must not slide");
    assert.ok(structure.lateralWeight >= previousLateral);
    assert.ok(structure.fineWeight >= previousFine);
    assert.ok(structure.lateralWeight <= 1 && structure.fineWeight <= 1);
    previousLateral = structure.lateralWeight;
    previousFine = structure.fineWeight;
  }
  assert.ok(speedToFieldStructure(ROAD_SPEED_CEILING_KMH).lateralWeight > 0.8);
  assert.ok(Math.abs(speedToFieldStructure(ROAD_SPEED_CEILING_KMH).fineWeight - 1) < 1e-12);
});

test("produces the same stack for the same drive regardless of frame rate", () => {
  const sixty = createLatitudesHistory();
  for (let step = 0; step < 60 * 6; step += 1) advanceLatitudesHistory(sixty, 90, 1 / 60);

  const thirty = createLatitudesHistory();
  for (let step = 0; step < 30 * 6; step += 1) advanceLatitudesHistory(thirty, 90, 1 / 30);

  assert.ok(Math.abs(sixty.travelledMetres - thirty.travelledMetres) < 1e-6);
  for (const age of [0, 0.25, 0.5, 0.75, 1]) {
    assert.ok(
      Math.abs(historyLagMetres(sixty, age) - historyLagMetres(thirty, age)) < 1.5,
      `frame rate must not change the stack at age ${age}`,
    );
  }
});

test("opens on a plausible resting stack rather than a frozen band", () => {
  const fresh = createLatitudesHistory();
  // A brand new history already describes a stationary vehicle: a small,
  // even rake rather than one uniform lag across the whole frame.
  assert.equal(historyLagMetres(fresh, 0), 0);
  const primedOldest = historyLagMetres(fresh, 1);
  assert.ok(primedOldest > 0, "the opening stack must not be perfectly flat");
  assert.ok(
    Math.abs(primedOldest - LATITUDES_IDLE_CRAWL_MPS * LATITUDES_WINDOW_SECONDS) < 0.2,
    `the opening stack must match a standstill, got ${primedOldest}`,
  );
  // Evenly graded, not one flat region: check the midpoint sits between.
  const midpoint = historyLagMetres(fresh, 0.5);
  assert.ok(midpoint > 0 && midpoint < primedOldest);

  // Pulling away from that standstill reads as an acceleration: the recent rows
  // carry the new speed while the older primed rows still carry the standstill,
  // which is exactly what happened.
  const history = createLatitudesHistory();
  drive(history, 120, 2);
  assert.ok(
    historyLagMetres(history, 1) > historyLagMetres(history, 0.5),
    "the stack must stay ordered while the window refills",
  );
  assert.ok(
    Math.abs(historyCurvature(history)) > 5,
    "pulling away from rest must curve the rake",
  );

  // Once the window has filled with steady travel, the oldest row spans it.
  drive(history, 120, LATITUDES_WINDOW_SECONDS + 1);
  assert.ok(
    historyLagMetres(history, 1) > speedToTravelMps(120) * LATITUDES_WINDOW_SECONDS * 0.9,
    "a filled window must span the full history",
  );
  assert.ok(
    Math.abs(historyCurvature(history)) < 5,
    "steady travel must straighten the rake again",
  );
});
