import test from "node:test";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import { CURATED_EXPERIENCES, applyExperienceSettings, matchingExperience, chooseCuratedRecommendations } from "../src/curated-experiences.js";
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
  assert.equal(CURATED_EXPERIENCES.length, 10);
  assert.equal(applyExperienceSettings({}, "night-glass").soundtrackSelection.id, "lounge");
  const lively = applyExperienceSettings({}, "neon-groove");
  assert.equal(lively.soundtrackSelection.id, "funk");
  assert.equal(matchingExperience(lively)?.id, "neon-groove");
  assert.equal(matchingExperience({ ...lively, soundtrackSelection: { kind: "genre", id: "lounge" } }), null);
});

test("every preset has a shipped image and a unique identity", () => {
  assert.equal(new Set(CURATED_EXPERIENCES.map(item => item.id)).size, CURATED_EXPERIENCES.length);
  for (const item of CURATED_EXPERIENCES) {
    assert.ok(existsSync(new URL(`../public${item.image}`, import.meta.url)), item.id);
    assert.equal(matchingExperience(item.settings)?.id, item.id);
  }
});

test("recommendations sample two distinct presets and preserve an existing selection", () => {
  const first = chooseCuratedRecommendations({ random: () => 0 });
  const last = chooseCuratedRecommendations({ random: () => 1 });
  assert.equal(first.length, 2);
  assert.equal(new Set(first.map(item => item.id)).size, 2);
  assert.notDeepEqual(first, last);
  assert.ok(Object.isFrozen(first));
  for (const selected of CURATED_EXPERIENCES) {
    const choices = chooseCuratedRecommendations({ selectedId: selected.id, random: () => 0.5 });
    assert.equal(choices[0], selected);
    assert.equal(choices.length, 2);
    assert.notEqual(choices[0], choices[1]);
  }
  assert.equal(CURATED_EXPERIENCES[0].id, "night-glass");
  assert.equal(CURATED_EXPERIENCES[1].id, "neon-groove");
});

test("invalid selection or randomness cannot leave recommendations empty or duplicated", () => {
  for (const random of [() => NaN, () => Infinity, () => -4, () => { throw new Error("Unavailable"); }]) {
    const choices = chooseCuratedRecommendations({ selectedId: "missing", random });
    assert.equal(choices.length, 2);
    assert.notEqual(choices[0], choices[1]);
  }
});

test("refreshing recommendations avoids previous suggestions and preserves the selected preset", () => {
 const before=chooseCuratedRecommendations({random:()=>0});
 const next=chooseCuratedRecommendations({excludeIds:before.map(item=>item.id),random:()=>0});
 assert.ok(next.every(item=>!before.includes(item)));
 const selected=chooseCuratedRecommendations({selectedId:before[0].id,excludeIds:before.map(item=>item.id),random:()=>0});
 assert.equal(selected[0],before[0]);assert.ok(!before.includes(selected[1]));
});
