import assert from "node:assert/strict";
import test from "node:test";
import {
  APPEARANCE_MODES,
  APPEARANCE_PREFERENCE_KEY,
  APPEARANCE_SOLAR_THRESHOLDS,
  DEFAULT_APPEARANCE_MODE,
  normalizeAppearanceMode,
  readAppearancePreference,
  resetAppearancePreference,
  resolveAppearance,
  solarAppearancePhase,
  solarElevationDegrees,
  writeAppearancePreference,
} from "../src/appearance-model.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    entries: () => [...values.entries()],
  };
}

test("appearance preferences are explicit, independent and resettable", () => {
  assert.deepEqual(APPEARANCE_MODES, ["light", "dark", "auto"]);
  assert.equal(DEFAULT_APPEARANCE_MODE, "light");
  assert.equal(normalizeAppearanceMode("dark"), "dark");
  assert.equal(normalizeAppearanceMode("unknown"), "light");

  const storage = memoryStorage();
  assert.equal(readAppearancePreference(storage), "light");
  assert.equal(writeAppearancePreference("auto", storage), true);
  assert.equal(readAppearancePreference(storage), "auto");
  assert.deepEqual(storage.entries(), [[APPEARANCE_PREFERENCE_KEY, "auto"]]);
  assert.equal(JSON.stringify(storage.entries()).includes("latitude"), false);
  assert.equal(JSON.stringify(storage.entries()).includes("longitude"), false);
  assert.equal(writeAppearancePreference("invalid", storage), false);
  assert.equal(readAppearancePreference(storage), "auto");
  assert.equal(resetAppearancePreference(storage), true);
  assert.equal(readAppearancePreference(storage), "light");
});

test("appearance persistence fails safely when storage is unavailable", () => {
  const unavailable = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  assert.equal(readAppearancePreference(unavailable), "light");
  assert.equal(writeAppearancePreference("dark", unavailable), false);
  assert.equal(resetAppearancePreference(unavailable), false);
  assert.equal(writeAppearancePreference("dark", null), false);
  assert.equal(resetAppearancePreference(null), false);
});

test("solar context separates day, twilight and night without a network request", () => {
  assert.deepEqual(APPEARANCE_SOLAR_THRESHOLDS, {
    dayElevationDegrees: 2,
    nightElevationDegrees: -6,
  });
  const equator = { latitude: 0, longitude: 0 };
  const noon = Date.parse("2026-03-20T12:00:00Z");
  const midnight = Date.parse("2026-03-20T00:00:00Z");
  assert.ok(solarElevationDegrees(equator, noon) > 85);
  assert.ok(solarElevationDegrees(equator, midnight) < -85);
  assert.equal(solarAppearancePhase(equator, noon), "day");
  assert.equal(solarAppearancePhase(equator, midnight), "night");

  let twilightAt = null;
  for (let minutes = 0; minutes < 24 * 60; minutes += 2) {
    const timestamp = midnight + minutes * 60000;
    if (solarAppearancePhase(equator, timestamp) === "twilight") {
      twilightAt = timestamp;
      break;
    }
  }
  assert.ok(twilightAt != null);
  assert.equal(solarAppearancePhase(equator, twilightAt), "twilight");
  assert.equal(solarAppearancePhase({ latitude: 95, longitude: 0 }, noon), null);
  assert.equal(solarElevationDegrees(equator, Number.NaN), null);
  assert.doesNotMatch(solarElevationDegrees.toString(), /fetch|XMLHttpRequest|https?:/);
});

test("AUTO prefers the system signal, then solar context, with gesture and twilight holds", () => {
  assert.equal(resolveAppearance({ mode: "light", systemColorScheme: "dark" }), "light");
  assert.equal(resolveAppearance({ mode: "dark", systemColorScheme: "light" }), "dark");
  assert.equal(resolveAppearance({ mode: "auto", systemColorScheme: "dark", solarPhase: "day" }), "dark");
  assert.equal(resolveAppearance({ mode: "auto", systemColorScheme: "light", solarPhase: "night" }), "light");
  assert.equal(resolveAppearance({ mode: "auto", solarPhase: "day", currentAppearance: "dark" }), "light");
  assert.equal(resolveAppearance({ mode: "auto", solarPhase: "night", currentAppearance: "light" }), "dark");
  assert.equal(resolveAppearance({ mode: "auto", solarPhase: "twilight", currentAppearance: "dark" }), "dark");
  assert.equal(resolveAppearance({ mode: "auto", solarPhase: "day", currentAppearance: "dark", interactionActive: true }), "dark");
  assert.equal(resolveAppearance({ mode: "auto", solarPhase: "night", currentAppearance: "light", interactionActive: true }), "light");
  assert.equal(resolveAppearance({ mode: "auto", currentAppearance: "dark" }), "dark");
});
