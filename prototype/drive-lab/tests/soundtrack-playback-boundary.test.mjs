import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveSoundtrackPlaybackBoundary,
  SOUNDTRACK_PLAYBACK_BOUNDARY_SCHEMA,
  SOUNDTRACK_PLAYBACK_INVARIANTS,
} from "../src/soundtrack/playback-boundary.js";
import { evaluateJamendoTrack } from "../src/soundtrack/source-policy.js";

const makePolicy = (licence = "by-nc") => evaluateJamendoTrack({
  id: "1848357",
  name: "Road Test",
  artist_id: "421168",
  artist_name: "Independent Artist",
  album_name: "Open Roads",
  license_ccurl: `https://creativecommons.org/licenses/${licence}/4.0/`,
  audio: "https://prod-1.storage.jamendo.com/?trackid=1848357&format=mp32",
  shareurl: "https://www.jamendo.com/track/1848357",
  image: "https://usercontent.jamendo.com?type=album&id=368084&width=300",
});

test("fixed recordings always remain at their authored playback rate", () => {
  const result = deriveSoundtrackPlaybackBoundary({ policy: makePolicy() });

  assert.equal(result.schema, SOUNDTRACK_PLAYBACK_BOUNDARY_SCHEMA);
  assert.equal(result.playbackAllowed, true);
  assert.equal(result.playbackRate, 1);
  assert.equal(result.reactsToDriving, false);
  assert.equal(result.trackChangesAreManual, true);
  assert.deepEqual(SOUNDTRACK_PLAYBACK_INVARIANTS, {
    playbackRate: 1,
    reactsToDriving: false,
    trackChangesAreManual: true,
    effectChangesAreManual: true,
  });
});

test("the main UI may manually enable a licence-compatible effect", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy("by-nc-sa"),
    effectsRequested: true,
    effectId: "underwater",
    controlSource: "main-ui",
  });

  assert.deepEqual(result.effects, {
    requested: true,
    enabled: true,
    effectId: "underwater",
    controlSource: "main-ui",
    changesAreManual: true,
    licenceAllowsEffects: true,
    blockedReason: null,
  });
});

test("an authorized passenger may use the same manual effects contract", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy(),
    effectsRequested: true,
    effectId: "bloom",
    controlSource: "authorized-passenger",
  });

  assert.equal(result.effects.enabled, true);
  assert.equal(result.effects.controlSource, "authorized-passenger");
  assert.equal(result.playbackRate, 1);
});

test("an unknown controller cannot change effects", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy(),
    effectsRequested: true,
    effectId: "bloom",
    controlSource: "remote-stranger",
  });

  assert.equal(result.effects.enabled, false);
  assert.equal(result.effects.effectId, null);
  assert.equal(result.effects.controlSource, null);
  assert.equal(result.effects.blockedReason, "unauthorized-control");
});

test("effects stay off until explicitly requested", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy(),
    effectId: "underwater",
  });

  assert.equal(result.effects.requested, false);
  assert.equal(result.effects.enabled, false);
  assert.equal(result.effects.effectId, null);
  assert.equal(result.effects.blockedReason, null);
});

test("unadmitted recordings cannot play or enter the effects chain", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy("by-nd"),
    effectsRequested: true,
    effectId: "underwater",
  });

  assert.equal(result.playbackAllowed, false);
  assert.equal(result.effects.enabled, false);
  assert.equal(result.effects.blockedReason, "track-not-admitted");
});

test("the public boundary carries no driving-derived musical input or state", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy(),
    effectsRequested: true,
    effectId: "bloom",
  });
  const keys = JSON.stringify(result).toLowerCase();

  for (const forbidden of ["speed", "acceleration", "energy", "bpm", "tempo", "hysteresis", "automatic"]) {
    assert.equal(keys.includes(forbidden), false, `unexpected driving-derived field: ${forbidden}`);
  }
});
