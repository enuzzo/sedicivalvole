import assert from "node:assert/strict";
import test from "node:test";

import {
  catmullRomPoint,
  WAKE_RIBBONS,
  wakeMotionProfile,
  wakeRibbonMotion,
  wakeStreamPosition,
  wakeToneColor,
} from "../src/environments/wake/wake-model.js";
import { getFluxTheme } from "../src/flux-themes.js";

test("WAKE keeps the approved seven broad authored ribbons", () => {
  assert.equal(WAKE_RIBBONS.length, 7);
  assert.ok(WAKE_RIBBONS.filter((ribbon) => ribbon.tone.startsWith("accent")).length >= 3);
  assert.ok(WAKE_RIBBONS.filter((ribbon) => ribbon.tone === "graphite" || ribbon.tone.endsWith("Shadow")).length >= 3);
  assert.ok(WAKE_RIBBONS.every((ribbon) => ribbon.widthStart >= 0.025));
  assert.ok(WAKE_RIBBONS.every((ribbon) => ribbon.widthEnd >= 0.025));
  assert.ok(WAKE_RIBBONS.every((ribbon) => ribbon.points.length >= 4));
});

test("WAKE splines preserve exact authored endpoints", () => {
  for (const ribbon of WAKE_RIBBONS) {
    assert.deepEqual(catmullRomPoint(ribbon.points, 0), ribbon.points[0]);
    const end = catmullRomPoint(ribbon.points, 1);
    assert.ok(Math.abs(end[0] - ribbon.points.at(-1)[0]) < 1e-9);
    assert.ok(Math.abs(end[1] - ribbon.points.at(-1)[1]) < 1e-9);
  }
});

test("WAKE effects belong to ribbon width, separation, light and folds", () => {
  const idle = wakeMotionProfile(20);
  const open = wakeMotionProfile(20, "OPEN");
  const underwater = wakeMotionProfile(20, "UNDERWATER");
  const bloom = wakeMotionProfile(20, "BLOOM");
  assert.ok(open.widthScale > idle.widthScale && open.separation > idle.separation);
  assert.ok(underwater.lightScale < idle.lightScale && underwater.foldScale < idle.foldScale);
  assert.ok(bloom.lightScale > open.lightScale && bloom.foldScale > idle.foldScale);
});

test("WAKE moves its geometry progressively from velvet drape to temporary knots", () => {
  const slow = wakeMotionProfile(20);
  const urban = wakeMotionProfile(60);
  const fast = wakeMotionProfile(130);
  assert.ok(slow.timeRate > 0 && urban.timeRate > slow.timeRate && fast.timeRate > urban.timeRate);
  assert.ok(slow.streamRate > 0 && urban.streamRate > slow.streamRate && fast.streamRate > urban.streamRate);
  assert.ok(slow.drape > urban.drape && urban.drape > fast.drape);
  assert.equal(slow.tangle, 0);
  assert.ok(urban.tangle > 0 && fast.tangle > urban.tangle);
  assert.ok(fast.sway > slow.sway * 2);

  const ribbon = WAKE_RIBBONS[3];
  const distanceAfterOneSecond = (profile) => {
    const start = wakeRibbonMotion(ribbon, 0.56, 0, profile);
    const end = wakeRibbonMotion(ribbon, 0.56, profile.timeRate, profile);
    return Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
  };
  assert.ok(distanceAfterOneSecond(slow) > 0.001);
  assert.ok(distanceAfterOneSecond(fast) > distanceAfterOneSecond(slow) * 3);

  const streamed = wakeRibbonMotion(ribbon, 0.56, fast.timeRate, fast);
  assert.ok(Math.abs(streamed.along) > 0.005);
  assert.ok(Math.abs(streamed.widthScale - 1) > 0.02);
});

test("WAKE advects real ribbon geometry longitudinally like a road", () => {
  const ribbon = WAKE_RIBBONS[0];
  const parked = wakeMotionProfile(0);
  const slow = wakeMotionProfile(20);
  const fast = wakeMotionProfile(130);
  assert.ok(parked.streamRate < slow.streamRate);
  assert.ok(fast.streamRate > slow.streamRate * 5);

  const startPosition = wakeStreamPosition(ribbon, 0);
  const oneSecondPosition = wakeStreamPosition(ribbon, fast.streamRate);
  const travelled = (oneSecondPosition - startPosition + 1) % 1;
  assert.ok(Math.abs(travelled - fast.streamRate) < 1e-9);

  const first = wakeRibbonMotion(ribbon, 0.42, 0, fast, 0);
  const later = wakeRibbonMotion(ribbon, 0.42, 0, fast, fast.streamRate * 0.4);
  assert.ok(Math.abs(later.along - first.along) > 0.015);
  assert.ok(Math.abs(later.z - first.z) > 0.005);
  assert.ok(Math.abs(later.widthScale - first.widthScale) > 0.04);
  assert.equal(wakeMotionProfile(130, null, true).streamRate, 0);
});

test("WAKE uses the complete theme accent and a restrained graphite companion", () => {
  const palette = getFluxTheme("red").palette;
  const accent = wakeToneColor(palette, "accent");
  const graphite = wakeToneColor(palette, "graphite");
  assert.ok(accent[0] > 0.9 && accent[1] < 0.1);
  assert.ok(graphite.every((channel, index) => channel >= palette.base[index]));
  assert.ok(graphite[0] < accent[0] * 0.2);
});
