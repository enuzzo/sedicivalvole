import assert from "node:assert/strict";
import test from "node:test";
import {
  SOURCE_CAPABILITY,
  allowsSoundtrackEffects,
  creativeCommonsPolicy,
  directGrantPolicy,
  evaluateIlloboTrack,
  evaluateJamendoTrack,
} from "../src/soundtrack/source-policy.js";

const JAMENDO_TRACK = Object.freeze({
  id: "1848357",
  name: "Road Test",
  artist_id: "421168",
  artist_name: "Independent Artist",
  album_name: "Open Roads",
  license_ccurl: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
  audio: "https://prod-1.storage.jamendo.com/?trackid=1848357&format=mp32",
  shareurl: "https://www.jamendo.com/track/1848357",
  image: "https://usercontent.jamendo.com?type=album&id=368084&width=300",
  audiodownload: "https://prod-1.storage.jamendo.com/download/track/1848357/mp32/",
  audiodownload_allowed: true,
});

test("unknown licences fail closed across every source capability", () => {
  const policy = creativeCommonsPolicy("https://example.test/licence");
  assert.equal(policy.admitted, false);
  assert.deepEqual(Object.values(policy.capabilities), ["unknown", "unknown", "unknown", "unknown"]);
  assert.equal(allowsSoundtrackEffects(policy), false);
});

test("NoDerivatives tracks are excluded rather than routed around the effects bus", () => {
  for (const code of ["by-nd", "by-nc-nd"]) {
    const policy = creativeCommonsPolicy(`https://creativecommons.org/licenses/${code}/4.0/`);
    assert.equal(policy.admitted, false);
    assert.equal(policy.capabilities.inAppSelection, SOURCE_CAPABILITY.DENY);
    assert.equal(policy.capabilities.sourceStreaming, SOURCE_CAPABILITY.DENY);
    assert.equal(policy.capabilities.audioEffects, SOURCE_CAPABILITY.DENY);
    assert.deepEqual(policy.reasons, ["no-derivatives-excluded"]);
  }
});

test("known adaptation licences preserve their obligations and allow effects", () => {
  const cases = [
    ["by", ["attribution"]],
    ["by-sa", ["attribution", "share-adaptations-alike"]],
    ["by-nc", ["attribution", "noncommercial-only"]],
    ["by-nc-sa", ["attribution", "noncommercial-only", "share-adaptations-alike"]],
  ];
  for (const [code, obligations] of cases) {
    const policy = creativeCommonsPolicy(`https://creativecommons.org/licenses/${code}/3.0/`);
    assert.equal(policy.admitted, true);
    assert.equal(policy.capabilities.hostedCopy, SOURCE_CAPABILITY.UNKNOWN);
    assert.equal(allowsSoundtrackEffects(policy), true);
    assert.deepEqual(policy.obligations, obligations);
  }
  assert.equal(
    creativeCommonsPolicy("http://creativecommons.org/licenses/by-nc/3.0/").licence.url,
    "https://creativecommons.org/licenses/by-nc/3.0/",
  );
});

test("a Jamendo item retains only playback and credit fields, never download data", () => {
  const policy = evaluateJamendoTrack(JAMENDO_TRACK);
  assert.equal(policy.admitted, true);
  assert.equal(policy.providerCredit, "Provided by Jamendo");
  assert.equal(policy.directBacklinkRequired, true);
  assert.equal(policy.item.albumName, "Open Roads");
  assert.equal(policy.item.shareUrl, JAMENDO_TRACK.shareurl);
  assert.equal(JSON.stringify(policy).includes("audiodownload"), false);
  assert.equal(policy.capabilities.hostedCopy, SOURCE_CAPABILITY.UNKNOWN);
});

test("Jamendo discovery metadata keeps normalized genres and a non-reactive catalogue pace", () => {
  const policy = evaluateJamendoTrack({
    ...JAMENDO_TRACK,
    musicinfo: {
      speed: " HIGH ",
      tags: { genres: ["Rock", "rock", " Funk ", ""] },
    },
  });
  assert.equal(policy.item.pace, "high");
  assert.deepEqual(policy.item.genres, ["rock", "funk"]);

  const unsupported = evaluateJamendoTrack({
    ...JAMENDO_TRACK,
    musicinfo: { speed: "extreme", tags: { genres: "rock" } },
  });
  assert.equal(unsupported.item.pace, null);
  assert.deepEqual(unsupported.item.genres, []);
});

test("Jamendo admission requires complete credit metadata and provider-owned HTTPS URLs", () => {
  assert.equal(evaluateJamendoTrack({ ...JAMENDO_TRACK, artist_name: "" }).admitted, false);
  assert.equal(evaluateJamendoTrack({ ...JAMENDO_TRACK, audio: "http://prod-1.storage.jamendo.com/a" }).admitted, false);
  assert.equal(evaluateJamendoTrack({ ...JAMENDO_TRACK, audio: "https://example.test/a" }).admitted, false);
  assert.equal(evaluateJamendoTrack({ ...JAMENDO_TRACK, shareurl: "https://example.test/track" }).admitted, false);
});

test("direct grants require an explicit decision for every capability", () => {
  const incomplete = directGrantPolicy({
    source: "illobo",
    evidenceRef: "owner-attestation-2026-08-30",
    capabilities: { inAppSelection: "allow" },
  });
  assert.equal(incomplete.admitted, false);

  const complete = directGrantPolicy({
    source: "illobo",
    evidenceRef: "owner-attestation-2026-08-30",
    capabilities: {
      inAppSelection: "allow",
      sourceStreaming: "allow",
      audioEffects: "allow",
      hostedCopy: "allow",
    },
  });
  assert.equal(complete.admitted, true);
  assert.equal(allowsSoundtrackEffects(complete), true);
  assert.equal(complete.licence.code, "direct-grant");
});

test("Illobo web masters are admitted only through the complete owner grant", () => {
  const policy = evaluateIlloboTrack({
    id: "floating-stars",
    title: "Floating Stars",
    filename: "floating-stars.mp3",
  });
  assert.equal(policy.admitted, true);
  assert.equal(policy.source, "illobo");
  assert.equal(policy.item.artistName, "Illobo");
  assert.equal(policy.item.playbackUrl, "/audio/illobo/floating-stars.mp3");
  assert.equal(policy.item.imageUrl, "/artwork/illobo/floating-stars.png");
  assert.equal(policy.item.shareUrl, "https://soundcloud.com/illobo");
  assert.equal(policy.capabilities.hostedCopy, SOURCE_CAPABILITY.ALLOW);
  assert.equal(allowsSoundtrackEffects(policy), true);

  assert.equal(evaluateIlloboTrack({
    id: "unsafe",
    title: "Unsafe",
    filename: "../unsafe.mp3",
  }).admitted, false);
});
