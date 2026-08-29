// FRACTURE's listener-facing rhythm ladder.
//
// The transport remains in its narrow native range, but the percussion does
// not expose that clock all at once. Three authored half-time families rotate
// over an eight-bar form before the native break is permitted. This is a
// musical arrangement layer, not a displayed-tempo workaround: diagnostics
// report the same tactus the renderer is actually articulating.

import { STEPS_PER_PATTERN } from "./clock.js";

export const FRACTURE_RHYTHM_ENTER_KMH = Object.freeze({
  silk: 10,
  pulse: 32,
  weave: 58,
  native: 88,
});

export const FRACTURE_RHYTHM_RELEASE_KMH = Object.freeze({
  silk: 8,
  pulse: 27,
  weave: 52,
  native: 82,
});

export const FRACTURE_RHYTHM_PROFILES = Object.freeze([
  Object.freeze({ id: "none", label: "AIR" }),
  Object.freeze({ id: "silk", label: "SILK PULSE" }),
  Object.freeze({ id: "pulse", label: "BROKEN PULSE" }),
  Object.freeze({ id: "weave", label: "RHYTHM WEAVE" }),
  Object.freeze({ id: "native", label: "FULL BREAK" }),
]);

const PROFILE_INDEX = Object.freeze(Object.fromEntries(
  FRACTURE_RHYTHM_PROFILES.map((profile, index) => [profile.id, index]),
));

const ENTER = [
  -Infinity,
  FRACTURE_RHYTHM_ENTER_KMH.silk,
  FRACTURE_RHYTHM_ENTER_KMH.pulse,
  FRACTURE_RHYTHM_ENTER_KMH.weave,
  FRACTURE_RHYTHM_ENTER_KMH.native,
];

const RELEASE = [
  -Infinity,
  FRACTURE_RHYTHM_RELEASE_KMH.silk,
  FRACTURE_RHYTHM_RELEASE_KMH.pulse,
  FRACTURE_RHYTHM_RELEASE_KMH.weave,
  FRACTURE_RHYTHM_RELEASE_KMH.native,
];

function event(step, voice, level, accent = false) {
  return Object.freeze({ step, voice, level, accent });
}

// Four complementary two-bar cells make one eight-bar rotation. Empty spans
// are intentional rests. Levels are part of the composition: they distinguish
// accents from ghost articulations before the voices reach the mix bus.
export const FRACTURE_LOW_RHYTHM_PATTERNS = Object.freeze({
  silk: Object.freeze([
    Object.freeze([
      event(0, "hat", 0.34, true), event(7, "ghost", 0.12),
      event(12, "hat", 0.2), event(19, "kick", 0.18), event(27, "clap", 0.1),
    ]),
    Object.freeze([
      event(0, "kick", 0.2, true), event(6, "hat", 0.18),
      event(15, "ghost", 0.11), event(22, "hat", 0.28, true), event(30, "ghost", 0.09),
    ]),
    Object.freeze([
      event(3, "hat", 0.22), event(10, "clap", 0.1),
      event(16, "kick", 0.18, true), event(25, "hat", 0.2), event(29, "ghost", 0.1),
    ]),
    Object.freeze([
      event(0, "hat", 0.3, true), event(9, "ghost", 0.1),
      event(14, "kick", 0.17), event(23, "clap", 0.09), event(28, "hat", 0.18),
    ]),
  ]),
  pulse: Object.freeze([
    Object.freeze([
      event(0, "kick", 0.3, true), event(4, "hat", 0.22), event(9, "ghost", 0.13),
      event(14, "hat", 0.18), event(20, "kick", 0.21), event(25, "clap", 0.12),
      event(30, "ghost", 0.1),
    ]),
    Object.freeze([
      event(0, "hat", 0.3, true), event(5, "kick", 0.2), event(11, "ghost", 0.12),
      event(16, "hat", 0.2), event(19, "clap", 0.11), event(24, "kick", 0.28, true),
      event(29, "hat", 0.16),
    ]),
    Object.freeze([
      event(2, "ghost", 0.1), event(6, "hat", 0.22), event(12, "kick", 0.29, true),
      event(17, "clap", 0.11), event(21, "hat", 0.18), event(26, "ghost", 0.13),
      event(30, "kick", 0.2),
    ]),
    Object.freeze([
      event(0, "kick", 0.28, true), event(7, "clap", 0.1), event(10, "hat", 0.18),
      event(15, "ghost", 0.12), event(18, "kick", 0.2), event(24, "hat", 0.26, true),
      event(31, "ghost", 0.09),
    ]),
  ]),
  weave: Object.freeze([
    Object.freeze([
      event(0, "kick", 0.36, true), event(3, "hat", 0.19), event(6, "ghost", 0.14),
      event(10, "hat", 0.22), event(14, "clap", 0.13), event(18, "kick", 0.25),
      event(21, "ghost", 0.12), event(25, "hat", 0.24), event(29, "ghost", 0.1),
    ]),
    Object.freeze([
      event(0, "hat", 0.3, true), event(4, "kick", 0.25), event(7, "ghost", 0.12),
      event(11, "clap", 0.13), event(15, "hat", 0.2), event(18, "ghost", 0.1),
      event(22, "kick", 0.34, true), event(26, "hat", 0.22), event(30, "ghost", 0.13),
    ]),
    Object.freeze([
      event(1, "ghost", 0.1), event(5, "hat", 0.22), event(8, "kick", 0.34, true),
      event(12, "clap", 0.12), event(17, "hat", 0.2), event(20, "kick", 0.23),
      event(24, "ghost", 0.14), event(27, "hat", 0.25, true), event(31, "ghost", 0.09),
    ]),
    Object.freeze([
      event(0, "kick", 0.34, true), event(3, "ghost", 0.11), event(7, "hat", 0.21),
      event(13, "clap", 0.13), event(16, "hat", 0.27, true), event(20, "ghost", 0.12),
      event(23, "kick", 0.24), event(27, "hat", 0.19), event(30, "ghost", 0.1),
    ]),
  ]),
});

export function createFractureRhythmState() {
  return {
    committedIndex: 0,
    pendingIndex: 0,
    rotations: 0,
    lastPatternIndex: -1,
  };
}

/** Observe speed through asymmetric thresholds; no sound changes here. */
export function observeFractureRhythm(state, speedKmh) {
  const speed = Math.max(0, Number(speedKmh) || 0);
  let target = state.pendingIndex;

  while (target < FRACTURE_RHYTHM_PROFILES.length - 1 && speed >= ENTER[target + 1]) {
    target += 1;
  }
  while (target > 0 && speed < RELEASE[target]) target -= 1;
  state.pendingIndex = target;
  return FRACTURE_RHYTHM_PROFILES[target];
}

/** Move by one family at a bar boundary, so a GPS leap cannot skip the form. */
export function commitFractureRhythmAtBar(state) {
  if (state.pendingIndex > state.committedIndex) state.committedIndex += 1;
  else if (state.pendingIndex < state.committedIndex) state.committedIndex -= 1;
  return FRACTURE_RHYTHM_PROFILES[state.committedIndex];
}

export function fractureRhythmProfile(state) {
  return FRACTURE_RHYTHM_PROFILES[state.committedIndex];
}

/** The authored event at one sample-accurate step, or null for an intentional rest. */
export function fractureLowRhythmEvent(profileId, globalStep) {
  const bank = FRACTURE_LOW_RHYTHM_PATTERNS[profileId];
  if (!bank) return null;
  const safeStep = Math.max(0, Math.trunc(Number(globalStep) || 0));
  const patternIndex = Math.floor(safeStep / STEPS_PER_PATTERN) % bank.length;
  const patternStep = safeStep % STEPS_PER_PATTERN;
  return bank[patternIndex].find((candidate) => candidate.step === patternStep) ?? null;
}

export function fractureRhythmPatternIndex(globalStep) {
  const safeStep = Math.max(0, Math.trunc(Number(globalStep) || 0));
  return Math.floor(safeStep / STEPS_PER_PATTERN) % 4;
}

export function isFractureFullTime(state) {
  return state.committedIndex === PROFILE_INDEX.native;
}
