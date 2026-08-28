import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceBloomLaunchHistory,
  isBloomHardLaunch,
} from "../src/bloom-macro.js";

test("BLOOM requires a rapid 1.5 to 4 m/s2 crossing while OPEN is active", () => {
  let history = [];
  history = advanceBloomLaunchHistory(history, 1.2, 1000);
  history = advanceBloomLaunchHistory(history, 2.8, 1100);
  history = advanceBloomLaunchHistory(history, 4.2, 1200);
  assert.equal(isBloomHardLaunch(history, { openActive: true, nowMs: 1200 }), true);
  assert.equal(isBloomHardLaunch(history, { openActive: false, nowMs: 1200 }), false);
});

test("BLOOM rejects slow, inaccurate, braking, and refractory launches", () => {
  let history = [];
  history = advanceBloomLaunchHistory(history, 1, 1000);
  history = advanceBloomLaunchHistory(history, 4.2, 1400);
  assert.equal(isBloomHardLaunch(history, { openActive: true, nowMs: 1400 }), false);

  history = [];
  history = advanceBloomLaunchHistory(history, 1, 2000);
  history = advanceBloomLaunchHistory(history, 4.2, 2200);
  assert.equal(isBloomHardLaunch(history, { openActive: true, accuracyM: 11, nowMs: 2200 }), false);
  assert.equal(isBloomHardLaunch(history, { openActive: true, braking: true, nowMs: 2200 }), false);
  assert.equal(isBloomHardLaunch(history, {
    openActive: true,
    nowMs: 2200,
    refractoryUntilMs: 3000,
  }), false);
});
