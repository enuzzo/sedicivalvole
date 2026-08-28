// LATITUDES 04 — speed response and motion-history model.
//
// LATITUDES is an original sedicivalvole environment. It shares no mechanic with
// APERTURE 01 (a square mosaic projected into a tunnel), with VERTIGO 02 or
// MERIDIAN 03 (depth corridors), or with road and light-trail imagery.
//
// The mechanic is temporal rather than spatial: the display is a vertical stack
// of horizontal strata, and the stratum at height `h` shows the field as it
// stood `h x WINDOW` seconds ago. Every pixel row is a different moment, so the
// image is a graph of the vehicle's own recent motion.
//
// Because the strata are driven by distance travelled rather than by wall time,
// three readings fall out of the same mechanic instead of being drawn on top of
// it:
//
//   - constant speed shears the field's lateral content into an even rake;
//   - acceleration makes that rake curve, because the lag between adjacent rows
//     is changing;
//   - deceleration is visible as the fast, heavily sheared history scrolling
//     upward and out of frame while calm new rows enter at the bottom.
//
// This module owns the history buffer and every mapping. It holds no WebGL
// state, so the whole behaviour is deterministically testable in Node.

import { clamp, ROAD_SPEED_CEILING_KMH } from "../../signal-model.js";

/** Rows of history. One texel per stratum. */
export const LATITUDES_HISTORY_SAMPLES = 240;

/** Wall-clock seconds between stored samples. */
export const LATITUDES_SAMPLE_INTERVAL_SECONDS = 1 / 30;

/** Total span the stack represents, from the newest row to the oldest. */
export const LATITUDES_WINDOW_SECONDS =
  LATITUDES_HISTORY_SAMPLES * LATITUDES_SAMPLE_INTERVAL_SECONDS;

/**
 * A standstill still creeps. Without this the history would be perfectly flat
 * and the field would freeze into a still image.
 */
export const LATITUDES_IDLE_CRAWL_MPS = 0.42;

/**
 * Lateral field displacement per metre of travel. Held constant, so the shear on
 * screen is a true reading of distance travelled rather than a styled effect
 * layered on top of it.
 *
 * Scaled so a mark travels roughly two screen widths from the newest stratum
 * to the oldest at the road ceiling. Much more and each streak wraps so often
 * it reads as vertical banding; much less and the rake never leaves vertical.
 */
export const LATITUDES_SHEAR_PER_METRE = 0.0095;

const normalizedSpeed = (speedKmh) =>
  clamp(Math.max(0, speedKmh) / ROAD_SPEED_CEILING_KMH, 0, 1);

/** Metres per second actually fed to the history, including the idle crawl. */
export function speedToTravelMps(speedKmh) {
  const safeSpeed = Number.isFinite(speedKmh) ? Math.max(0, speedKmh) : 0;
  return safeSpeed / 3.6 + LATITUDES_IDLE_CRAWL_MPS;
}

/**
 * A fresh history.
 *
 * The buffer is primed with the history a stationary vehicle would have had:
 * one sample interval of idle crawl per row, going backwards. Without this the
 * first eight seconds have no recorded past, and every unwritten row reports the
 * same lag — a large uniform band across the top of the frame that reads as a
 * frozen or glitched image rather than as a calm stack. Priming makes the
 * opening state correct instead of merely defensible: it is exactly the stack a
 * vehicle that had been standing still would produce.
 */
export function createLatitudesHistory() {
  const distances = new Float32Array(LATITUDES_HISTORY_SAMPLES);
  for (let index = 0; index < distances.length; index += 1) {
    distances[index] = -index * LATITUDES_SAMPLE_INTERVAL_SECONDS * LATITUDES_IDLE_CRAWL_MPS;
  }
  return {
    distances,
    travelledMetres: 0,
    sampleAccumulator: 0,
  };
}

/**
 * Advances the history by one frame.
 *
 * Distance accumulates continuously, but rows are stored on a fixed cadence so
 * every stratum represents the same span of time regardless of frame rate. The
 * buffer is ordered newest-first: index 0 is now, the last index is the oldest
 * moment still in the window.
 *
 * The state is mutated in place and returned; this runs every frame and must
 * not allocate.
 */
export function advanceLatitudesHistory(history, speedKmh, deltaSeconds) {
  const delta = clamp(Number.isFinite(deltaSeconds) ? deltaSeconds : 0, 0, 0.25);
  history.travelledMetres += speedToTravelMps(speedKmh) * delta;
  history.sampleAccumulator += delta;

  // A long stall must not replay hundreds of rows at once.
  let pending = Math.min(
    Math.floor(history.sampleAccumulator / LATITUDES_SAMPLE_INTERVAL_SECONDS),
    LATITUDES_HISTORY_SAMPLES,
  );
  history.sampleAccumulator -= pending * LATITUDES_SAMPLE_INTERVAL_SECONDS;
  if (history.sampleAccumulator < 0) history.sampleAccumulator = 0;

  const { distances } = history;
  while (pending > 0) {
    distances.copyWithin(1, 0, distances.length - 1);
    distances[0] = history.travelledMetres;
    pending -= 1;
  }
  return history;
}

/**
 * Distance recorded at a given age, where 0 is the newest row and 1 the oldest.
 * Interpolated so the stack does not band on texel boundaries.
 */
export function readLatitudesHistory(history, ageFraction) {
  const { distances } = history;
  const position = clamp(ageFraction, 0, 1) * (distances.length - 1);
  const lower = Math.floor(position);
  const upper = Math.min(lower + 1, distances.length - 1);
  const blend = position - lower;
  return distances[lower] * (1 - blend) + distances[upper] * blend;
}

/**
 * Metres travelled since the moment a given row represents. This is the value
 * that shears the field, so it is also the value the tests reason about.
 */
export function historyLagMetres(history, ageFraction) {
  return Math.max(0, history.travelledMetres - readLatitudesHistory(history, ageFraction));
}

/**
 * Field structure for the current speed.
 *
 * `lateralWeight` is near zero at rest, which is what makes the resting state a
 * stack of clean parallel strata: with no lateral content there is nothing for
 * the history to shear. As speed rises the lateral component fades in and the
 * accumulated lag rakes it over.
 *
 * `fineWeight` fades in a higher harmonic so the registers thin and multiply
 * with speed. The band frequency itself stays fixed, because changing it would
 * slide every stratum whenever speed changed.
 */
export function speedToFieldStructure(speedKmh) {
  const normalized = normalizedSpeed(speedKmh);
  return {
    bandFrequency: 9,
    lateralWeight: 0.06 + 0.82 * normalized ** 0.7,
    fineWeight: clamp((normalized - 0.12) / 0.7, 0, 1) ** 1.2,
    toneSpread: 0.82 + 0.18 * normalized,
    relief: 0.34 + 0.66 * normalized ** 0.76,
    contourGlow: 0.38 + 0.62 * normalized ** 1.08,
    particleWeight: clamp((normalized - 0.18) / 0.7, 0, 1) ** 1.25,
  };
}

/**
 * Lateral drift applied equally to every row. It keeps the resting field alive
 * without implying movement, and recedes as real travel takes over.
 */
export function speedToRestPhaseRate(speedKmh) {
  return 0.021 * (1 - normalizedSpeed(speedKmh)) ** 2;
}

/**
 * Curvature signature of the stack: the second difference of the lag profile.
 *
 * Lag over age is the integral of speed across the window, so its curvature is
 * the sign of acceleration, inverted: steady speed gives a straight rake and
 * zero curvature, acceleration bends it one way, deceleration the other.
 * Exposed so the on-screen reading can be asserted rather than described.
 */
export function historyCurvature(history, samples = 24) {
  const step = 1 / (samples - 1);
  let total = 0;
  let counted = 0;
  for (let index = 1; index < samples - 1; index += 1) {
    const before = historyLagMetres(history, (index - 1) * step);
    const here = historyLagMetres(history, index * step);
    const after = historyLagMetres(history, (index + 1) * step);
    // Normalised by the step so the result is a second derivative rather than
    // a number that changes with the sample count.
    total += (before - 2 * here + after) / (step * step);
    counted += 1;
  }
  return counted > 0 ? total / counted : 0;
}
