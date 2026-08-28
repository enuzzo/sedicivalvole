const SUPPORT_EPOCH_UTC = Date.UTC(2026, 7, 28);
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
export const SUPPORT_COUNT_DURATION_MS = 4_000;
const SUGGESTION_ADDRESS_CODE_POINTS = Object.freeze([
  101, 110, 117, 122, 122, 111, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109,
]);

/**
 * A deliberately playful project-energy signal, not a donation total.
 *
 * It starts at 15 and advances by two points per UTC day, with one occasional
 * extra point. The interface labels this honestly so it cannot be mistaken for
 * fabricated social proof.
 */
export function supportMomentumCount(timestamp = Date.now()) {
  const elapsedDays = Math.max(
    0,
    Math.floor((Number(timestamp) - SUPPORT_EPOCH_UTC) / DAY_MILLISECONDS),
  );
  return 15 + elapsedDays * 2 + Math.floor(elapsedDays / 4);
}

/**
 * Map elapsed animation time to an integer count. Duration, rather than step
 * speed, is fixed so every target completes on the same four-second cadence.
 */
export function supportMomentumFrame(
  target,
  elapsedMilliseconds,
  durationMilliseconds = SUPPORT_COUNT_DURATION_MS,
) {
  const safeTarget = Math.max(0, Math.floor(Number(target) || 0));
  const safeElapsed = Math.max(0, Number(elapsedMilliseconds) || 0);
  const safeDuration = Number(durationMilliseconds) > 0
    ? Number(durationMilliseconds)
    : SUPPORT_COUNT_DURATION_MS;
  const progress = Math.min(1, safeElapsed / safeDuration);
  return Math.min(safeTarget, Math.floor(safeTarget * progress));
}

/**
 * Keep the public suggestion address out of static markup and plain-text
 * bundles. This deters basic address harvesters; it is not claimed as complete
 * protection against a crawler that executes and interacts with the app.
 */
export function decodeSuggestionAddress() {
  return String.fromCodePoint(...SUGGESTION_ADDRESS_CODE_POINTS);
}
