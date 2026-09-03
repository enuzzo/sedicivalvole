import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveSoundtrackPlaybackBoundary,
  SOUNDTRACK_MANUAL_EFFECT_IDS,
  SOUNDTRACK_PLAYBACK_BOUNDARY_SCHEMA,
  SOUNDTRACK_PLAYBACK_INVARIANTS,
  SOUNDTRACK_VEHICLE_MACROS,
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

test("fixed recordings remain authored while only their effects path may react", () => {
  const result = deriveSoundtrackPlaybackBoundary({ policy: makePolicy() });

  assert.equal(result.schema, SOUNDTRACK_PLAYBACK_BOUNDARY_SCHEMA);
  assert.equal(result.playbackAllowed, true);
  assert.equal(result.playbackRate, 1);
  assert.equal(result.drivingCanChangeTrack, false);
  assert.equal(result.drivingCanRetimeRecording, false);
  assert.equal(result.trackChangesAreManual, true);
  assert.deepEqual(SOUNDTRACK_PLAYBACK_INVARIANTS, {
    playbackRate: 1,
    drivingCanChangeTrack: false,
    drivingCanRetimeRecording: false,
    trackChangesAreManual: true,
  });
});

test("the footer master may enable braking UNDERWATER only", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy("by-nc-sa"),
    vehicleEffectsRequested: true,
    controlSource: "main-ui",
  });

  assert.deepEqual(SOUNDTRACK_VEHICLE_MACROS, ["underwater"]);
  assert.deepEqual(result.vehicleEffects, {
    requested: true,
    enabled: true,
    reactsToDriving: true,
    macros: SOUNDTRACK_VEHICLE_MACROS,
    controlSource: "main-ui",
    masterChangesAreManual: true,
    licenceAllowsEffects: true,
    blockedReason: null,
  });
  assert.equal(result.playbackRate, 1);
  assert.equal(result.drivingCanChangeTrack, false);
});

test("the eight separate performance controls are manual normalized amounts", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy(),
    manualEffects: {
      flanger: 0.25,
      reverb: 1.4,
      underwater: -0.2,
      phaser: 0.4,
      bitcrush: 0.5,
      bassDrive: 0.6,
      radioCut: 0.7,
      highCut: 0.75,
      invented: 1,
    },
  });

  assert.deepEqual(SOUNDTRACK_MANUAL_EFFECT_IDS, [
    "flanger",
    "reverb",
    "underwater",
    "phaser",
    "bitcrush",
    "bassDrive",
    "radioCut",
    "highCut",
  ]);
  assert.deepEqual(result.manualEffects.requestedValues, {
    flanger: 0.25,
    reverb: 1,
    underwater: 0,
    phaser: 0.4,
    bitcrush: 0.5,
    bassDrive: 0.6,
    radioCut: 0.7,
    highCut: 0.75,
  });
  assert.deepEqual(result.manualEffects.appliedValues, result.manualEffects.requestedValues);
  assert.equal(result.manualEffects.enabled, true);
  assert.equal(result.manualEffects.changesAreManual, true);
});

test("an authorized passenger may control both effect families", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy(),
    vehicleEffectsRequested: true,
    manualEffects: { underwater: 0.6 },
    controlSource: "authorized-passenger",
  });

  assert.equal(result.vehicleEffects.enabled, true);
  assert.equal(result.manualEffects.enabled, true);
  assert.equal(result.vehicleEffects.controlSource, "authorized-passenger");
  assert.equal(result.manualEffects.controlSource, "authorized-passenger");
  assert.equal(result.playbackRate, 1);
});

test("an unknown controller cannot change either effect family", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy(),
    vehicleEffectsRequested: true,
    manualEffects: { flanger: 1 },
    controlSource: "remote-stranger",
  });

  assert.equal(result.vehicleEffects.enabled, false);
  assert.equal(result.vehicleEffects.controlSource, null);
  assert.equal(result.vehicleEffects.blockedReason, "unauthorized-control");
  assert.equal(result.manualEffects.enabled, false);
  assert.deepEqual(result.manualEffects.appliedValues, {
    flanger: 0,
    reverb: 0,
    underwater: 0,
    phaser: 0,
    bitcrush: 0,
    bassDrive: 0,
    radioCut: 0,
    highCut: 0,
  });
  assert.equal(result.manualEffects.blockedReason, "unauthorized-control");
});

test("vehicle effects stay off until the footer master is explicitly enabled", () => {
  const result = deriveSoundtrackPlaybackBoundary({ policy: makePolicy() });

  assert.equal(result.vehicleEffects.requested, false);
  assert.equal(result.vehicleEffects.enabled, false);
  assert.equal(result.vehicleEffects.reactsToDriving, false);
  assert.equal(result.vehicleEffects.blockedReason, null);
});

test("unadmitted recordings cannot play or enter either effects path", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy("by-nd"),
    vehicleEffectsRequested: true,
    manualEffects: { reverb: 1 },
  });

  assert.equal(result.playbackAllowed, false);
  assert.equal(result.vehicleEffects.enabled, false);
  assert.equal(result.vehicleEffects.blockedReason, "track-not-admitted");
  assert.equal(result.manualEffects.enabled, false);
  assert.equal(result.manualEffects.blockedReason, "track-not-admitted");
});

test("the boundary contains no driving-derived selection or retiming state", () => {
  const result = deriveSoundtrackPlaybackBoundary({
    policy: makePolicy(),
    vehicleEffectsRequested: true,
    manualEffects: { highCut: 0.5 },
  });
  const keys = JSON.stringify(result).toLowerCase();

  for (const forbidden of ["speed", "acceleration", "energy", "bpm", "tempo", "hysteresis", "automatic"]) {
    assert.equal(keys.includes(forbidden), false, `unexpected selection/retiming field: ${forbidden}`);
  }
});
