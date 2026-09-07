import assert from "node:assert/strict";
import test from "node:test";
import { drivelineAudibility } from "../src/engine/driveline-audio.js";

const moving = overrides => drivelineAudibility({ rawSpeedKmh: 30, speedKmh: 30, freshness: "fresh", ...overrides });

test("transmission is silent at an actual stop even while filtered motion still decays", () => {
  assert.equal(moving({ rawSpeedKmh: 0, speedKmh: 8 }), 0);
  assert.equal(moving({ rawSpeedKmh: 0, speedKmh: 0 }), 0);
  assert.equal(moving({ rawSpeedKmh: 2, speedKmh: 0 }), 0);
});

test("neutral revs cannot drive the road transmission layer at any RPM", () => {
  for (const rpm of [600, 1800, 6000, 9000]) {
    assert.equal(moving({ neutral: true, rpm }), 0);
    assert.equal(moving({ gear: 0, rpm }), 0);
  }
});

test("missing or invalid motion and degraded or lost evidence silence transmission", () => {
  assert.equal(drivelineAudibility(), 0);
  for (const rawSpeedKmh of [undefined, null, NaN, Infinity, -1, 261, "30"]) assert.equal(moving({ rawSpeedKmh }), 0);
  for (const speedKmh of [null, NaN, Infinity, -1, 261, "30"]) assert.equal(moving({ speedKmh }), 0);
  for (const freshness of [undefined, "degraded", "lost"]) assert.equal(moving({ freshness }), 0);
  for (const gear of [null, -1, 0, 1.5, 7, "1"]) assert.equal(moving({ gear }), 0);
});

test("creep enters continuously and ordinary road speeds preserve the admitted whine trim", () => {
  let previous = 0;
  for (let rawSpeedKmh = 0; rawSpeedKmh <= 260; rawSpeedKmh += .1) {
    const gain = moving({ rawSpeedKmh, speedKmh: rawSpeedKmh });
    assert.ok(gain >= previous && gain >= 0 && gain <= 1);
    previous = gain;
  }
  assert.ok(moving({ rawSpeedKmh: .001, speedKmh: .001 }) < .000001);
  assert.ok(moving({ rawSpeedKmh: 2, speedKmh: 2 }) > 0);
  assert.ok(moving({ rawSpeedKmh: 2, speedKmh: 2 }) < moving({ rawSpeedKmh: 4, speedKmh: 4 }));
  for (const rawSpeedKmh of [5, 35, 65, 130, 260]) assert.equal(moving({ rawSpeedKmh }), 1);
});

test("the lower raw or filtered speed controls creep without gear-dependent loudness jumps", () => {
  const accelerating = moving({ rawSpeedKmh: 8, speedKmh: 2 });
  const braking = moving({ rawSpeedKmh: 2, speedKmh: 8 });
  assert.equal(accelerating, braking);
  for (let gear = 1; gear <= 6; gear++) assert.equal(moving({ gear }), 1);
});
