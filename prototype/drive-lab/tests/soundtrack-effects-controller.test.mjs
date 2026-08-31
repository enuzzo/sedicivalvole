import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeSoundtrackManualEffects,
  soundtrackEffectParameters,
} from "../src/soundtrack/effects-model.js";

test("vehicle effects remain silent until the fresh-session master is enabled", () => {
  const off = soundtrackEffectParameters({
    vehicleMaster: false,
    vehicleMacros: { open: 1, underwater: 1, bloom: 1 },
  });
  const on = soundtrackEffectParameters({
    vehicleMaster: true,
    vehicleMacros: { open: 1, underwater: 1, bloom: 1 },
  });
  assert.equal(off.openAirDb, 0);
  assert.equal(off.underwaterCutoffHz, 18_000);
  assert.equal(off.bloom, 0);
  assert.equal(on.openAirDb, 6.5);
  assert.equal(on.underwaterCutoffHz, 520);
  assert.equal(on.bloom, 1);
});

test("UNDERWATER is already audible at the visual engage threshold", () => {
  const threshold = soundtrackEffectParameters({
    vehicleMaster: true,
    vehicleMacros: { underwater: 0.4 },
  });
  const full = soundtrackEffectParameters({
    vehicleMaster: true,
    vehicleMacros: { underwater: 1 },
  });

  assert.ok(threshold.underwaterCutoffHz < 5_000, threshold.underwaterCutoffHz);
  assert.ok(threshold.underwaterCutoffHz > full.underwaterCutoffHz);
  assert.equal(full.underwaterCutoffHz, 520);
});

test("manual controls are clamped and never expose a playback-rate control", () => {
  assert.deepEqual(normalizeSoundtrackManualEffects({
    flanger: 2,
    reverb: -1,
    chorus: 0.4,
    "beat-repeat": Number.NaN,
  }), { flanger: 1, reverb: 0, chorus: 0.4, "beat-repeat": 0 });
  assert.equal("playbackRate" in soundtrackEffectParameters(), false);
});
