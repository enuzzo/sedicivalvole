// Step-pattern encoding translated from textStep.
//
// Upstream project: illobo/textStep — https://github.com/illobo/textStep
// Author:           Lobo (illobo)
// Upstream commit:  cb107d198b730db60cff4a87c7fd5b8d1fae3fb2
// Upstream files:   src/presets/pattern_presets.rs, src/sequencer/drum_pattern.rs
// Public license:   GNU GPL version 2.0
// Reuse basis:      Lobo's direct, unrestricted authorization, accepted by the
//                   project maintainer. See docs/LICENSING.md.
//
// The encoding is upstream's: eight hex characters describe 32 steps, most
// significant bit first within each nibble.
//
// Modifications for sedicivalvole:
//   - decoding returns a Uint8Array of velocities rather than a Rust bitfield,
//     so the arrangement can scale a lane's dynamics without editing patterns;
//   - `ghost` marks a step as a quieter articulation, which the Jungle score
//     uses for snare ghost notes;
//   - upstream's preset names that reference specific commercial records are not
//     carried into the product.

import { STEPS_PER_PATTERN } from "./clock.js";

/**
 * Decodes eight hex characters into 32 on/off steps.
 * Throws on malformed input so an authored score cannot fail silently.
 */
export function decodeSteps(hex) {
  if (typeof hex !== "string" || !/^[0-9a-fA-F]{8}$/.test(hex)) {
    throw new TypeError(`[score] a pattern must be 8 hex characters, received ${hex}`);
  }
  const steps = new Uint8Array(STEPS_PER_PATTERN);
  for (let nibble = 0; nibble < 8; nibble += 1) {
    const value = Number.parseInt(hex[nibble], 16);
    for (let bit = 0; bit < 4; bit += 1) {
      steps[nibble * 4 + bit] = (value >> (3 - bit)) & 1;
    }
  }
  return steps;
}

/** Re-encodes 32 steps back to hex. Used by the tests to prove the round trip. */
export function encodeSteps(steps) {
  let hex = "";
  for (let nibble = 0; nibble < 8; nibble += 1) {
    let value = 0;
    for (let bit = 0; bit < 4; bit += 1) {
      if (steps[nibble * 4 + bit]) value |= 1 << (3 - bit);
    }
    hex += value.toString(16);
  }
  return hex;
}

/**
 * Builds a lane pattern: the hits themselves plus optional quieter ghost
 * articulations, which are what give a break its internal motion.
 */
export function lanePattern({ hits, ghosts = null, velocity = 1, ghostVelocity = 0.38 }) {
  const hitSteps = decodeSteps(hits);
  const ghostSteps = ghosts ? decodeSteps(ghosts) : null;
  const velocities = new Float32Array(STEPS_PER_PATTERN);
  for (let step = 0; step < STEPS_PER_PATTERN; step += 1) {
    if (hitSteps[step]) velocities[step] = velocity;
    else if (ghostSteps && ghostSteps[step]) velocities[step] = ghostVelocity;
  }
  return velocities;
}

/** Steps that carry any articulation, for tests and diagnostics. */
export function activeSteps(velocities) {
  const steps = [];
  for (let step = 0; step < velocities.length; step += 1) {
    if (velocities[step] > 0) steps.push(step);
  }
  return steps;
}
