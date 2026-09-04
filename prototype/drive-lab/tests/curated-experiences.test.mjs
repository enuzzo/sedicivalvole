import test from "node:test";
import assert from "node:assert/strict";
import { CURATED_EXPERIENCES, applyExperienceSettings, matchingExperience } from "../src/curated-experiences.js";
import { FLUX_ENVIRONMENTS } from "../src/flux-environments.js";
import { FLUX_THEMES } from "../src/flux-themes.js";
import { SOUNDTRACK_GENRE_OPTIONS } from "../src/soundtrack/library-model.js";

test("every curated experience names real, available visual, palette and music owners", () => {
  for (const { settings } of CURATED_EXPERIENCES) {
    assert.ok(FLUX_ENVIRONMENTS.some(e => e.id === settings.environmentId));
    assert.ok(FLUX_THEMES.some(t => t.id === settings.themeId));
    assert.equal(settings.musicMode, "soundtrack");
    assert.equal(settings.soundtrackSelection.kind, "genre");
    assert.ok(SOUNDTRACK_GENRE_OPTIONS.some(g => g.id === settings.soundtrackSelection.id));
  }
});

test("experience application is atomic and preserves unrelated preferences and its input snapshot", () => {
  const original = Object.freeze({ themeId: "red", environmentId: "atlas", musicMode: "play-road", appearanceMode: "auto", muted: true, vehicleEffectsEnabled: false, genreId: "fracture", manualEffects: Object.freeze({ bloom: .4 }) });
  const next = applyExperienceSettings(original, "night-glass");
  assert.equal(matchingExperience(next)?.id, "night-glass");
  for (const key of ["muted", "vehicleEffectsEnabled", "genreId", "manualEffects"]) assert.equal(next[key], original[key]);
  assert.equal(original.environmentId, "atlas");
  assert.equal(matchingExperience(original), null);
  assert.equal(applyExperienceSettings(original, "missing"), null);
});

test("an independently changed choice or a failed music request cannot claim a complete experience", () => {
  const complete = applyExperienceSettings({}, "night-glass");
  for (const [key, value] of Object.entries({ environmentId: "atlas", themeId: "red", appearanceMode: "light", musicMode: "play-road", soundtrackSelection: { kind: "genre", id: "jazz" } })) {
    assert.equal(matchingExperience({ ...complete, [key]: value }), null, key);
  }
  assert.equal(matchingExperience({ ...complete, soundtrackSelection: null }), null);
});

 test("curated music responds to the owner's song-oriented brief and each experience remains distinguishable", () => {
  assert.equal(CURATED_EXPERIENCES.length, 2);
  assert.equal(applyExperienceSettings({}, "night-glass").soundtrackSelection.id, "lounge");
  const lively = applyExperienceSettings({}, "neon-groove");
  assert.equal(lively.soundtrackSelection.id, "funk");
  assert.equal(matchingExperience(lively)?.id, "neon-groove");
  assert.equal(matchingExperience({ ...lively, soundtrackSelection: { kind: "genre", id: "lounge" } }), null);
});
