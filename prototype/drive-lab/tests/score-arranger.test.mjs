import assert from "node:assert/strict";
import test from "node:test";
import {
  arrangementSnapshot,
  CATCH_WINDOW_SECONDS,
  commitAtBoundary,
  continuousControls,
  createArrangerState,
  energyToScene,
  energyToTempo,
  FALLING_DWELL_SECONDS,
  LANES,
  MINIMUM_SCENE_BARS,
  observeSpeed,
  SCENES,
  TEMPO_CEILING_BPM,
  TEMPO_REST_BPM,
  tempoTarget,
} from "../src/score/arranger.js";
import { STEPS_PER_BAR, STEPS_PER_PHRASE } from "../src/score/clock.js";
import {
  model3AwdAccelerationMps2,
  model3AwdBrakeDecelerationMps2,
  model3AwdLiftOffDecelerationMps2,
  ROAD_SPEED_CEILING_KMH,
} from "../src/signal-model.js";

const TICK = 1 / 60;

/**
 * Drives the arranger with the project's own Model 3 reference dynamics and
 * runs the transport alongside, so structural changes are only ever applied on
 * a real bar or phrase boundary.
 */
function createRig() {
  const state = createArrangerState();
  const log = [];
  let elapsed = 0;
  let step = 0;
  let stepAccumulator = 0;

  const tick = (speedKmh) => {
    observeSpeed(state, speedKmh, TICK);
    elapsed += TICK;

    // Advance the transport at the arrangement's committed tempo.
    const secondsPerStep = 60 / Math.max(1, state.committedTempo) / 4;
    stepAccumulator += TICK;
    while (stepAccumulator >= secondsPerStep) {
      stepAccumulator -= secondsPerStep;
      step += 1;
      if (step % STEPS_PER_PHRASE === 0) {
        log.push({ at: elapsed, speedKmh, step, ...commitAtBoundary(state, "phrase") });
      } else if (step % STEPS_PER_BAR === 0) {
        log.push({ at: elapsed, speedKmh, step, ...commitAtBoundary(state, "bar") });
      }
    }
  };

  const hold = (speedKmh, seconds) => {
    for (let index = 0; index < Math.round(seconds / TICK); index += 1) tick(speedKmh);
    return speedKmh;
  };

  /** Accelerates using the documented reference curve. */
  const accelerateTo = (fromKmh, targetKmh) => {
    let speed = fromKmh;
    let guard = 0;
    while (speed < targetKmh && guard < 60 * 120) {
      speed = Math.min(targetKmh, speed + model3AwdAccelerationMps2(speed) * TICK * 3.6);
      tick(speed);
      guard += 1;
    }
    return speed;
  };

  /** Lifts off using the documented nominal regenerative curve. */
  const liftOffTo = (fromKmh, targetKmh) => {
    let speed = fromKmh;
    let released = 0;
    let guard = 0;
    while (speed > targetKmh && guard < 60 * 200) {
      released += TICK;
      speed = Math.max(
        targetKmh, speed - model3AwdLiftOffDecelerationMps2(speed, released) * TICK * 3.6,
      );
      tick(speed);
      guard += 1;
    }
    return speed;
  };

  /** Brakes using the documented held-brake estimate. */
  const brakeTo = (fromKmh, targetKmh) => {
    let speed = fromKmh;
    let held = 0;
    let guard = 0;
    while (speed > targetKmh && guard < 60 * 200) {
      held += TICK;
      speed = Math.max(
        targetKmh, speed - model3AwdBrakeDecelerationMps2(speed, held) * TICK * 3.6,
      );
      tick(speed);
      guard += 1;
    }
    return speed;
  };

  return {
    state,
    log,
    tick,
    hold,
    accelerateTo,
    liftOffTo,
    brakeTo,
    elapsed: () => elapsed,
    steps: () => step,
  };
}

// ── mapping ────────────────────────────────────────────────────────────────

test("keeps tempo inside a narrow, musically credible band with a knee", () => {
  assert.equal(energyToTempo(0), TEMPO_REST_BPM);
  assert.ok(Math.abs(energyToTempo(1) - TEMPO_CEILING_BPM) < 1e-9);

  // The whole range is 14 BPM: speed can never read as a record being sped up.
  assert.ok(TEMPO_CEILING_BPM - TEMPO_REST_BPM <= 16);

  // A knee, not a line: most of the small rise is spent early.
  const halfway = energyToTempo(0.5);
  const linearHalfway = (TEMPO_REST_BPM + TEMPO_CEILING_BPM) / 2;
  assert.ok(halfway > linearHalfway + 2, `expected a knee, got ${halfway}`);

  let previous = -Infinity;
  for (let energy = 0; energy <= 1; energy += 0.01) {
    const tempo = energyToTempo(energy);
    assert.ok(tempo >= previous, "tempo must be monotonic");
    assert.ok(tempo >= TEMPO_REST_BPM && tempo <= TEMPO_CEILING_BPM);
    previous = tempo;
  }
});

test("scene selection uses hysteresis rather than following a threshold", () => {
  // Rising through a threshold enters; falling back to the same value does not
  // immediately leave.
  assert.equal(energyToScene(0.31, 0), 1);
  assert.equal(energyToScene(0.24, 1), 1, "a small dip must not drop the scene");
  assert.equal(energyToScene(0.06, 1), 1, "hysteresis holds well below the entry point");
  assert.equal(energyToScene(0.04, 1), 0, "a real drop does leave the scene");
  assert.equal(energyToScene(0.99, 4), 4, "the top scene is stable");
  assert.equal(energyToScene(0, 0), 0);
});

test("continuous controls stay bounded and separate current from retained energy", () => {
  const state = createArrangerState();
  for (let index = 0; index < 60 * 30; index += 1) observeSpeed(state, 120, TICK);
  const loaded = continuousControls(state);
  assert.ok(loaded.brightness > 0.7 && loaded.brightness <= 1);
  assert.ok(loaded.filterPressure > 0.8);
  assert.equal(loaded.hatSubdivision, 3);

  // A brief lift darkens the mix immediately while pressure is still retained.
  for (let index = 0; index < 60 * 1.5; index += 1) observeSpeed(state, 40, TICK);
  const lifted = continuousControls(state);
  assert.ok(lifted.brightness < loaded.brightness, "brightness follows current energy");
  assert.ok(
    lifted.filterPressure > loaded.filterPressure * 0.85,
    "pressure leans on retained energy, so the performance still sounds loaded",
  );
  assert.ok(lifted.spatialDepth > loaded.spatialDepth, "lift-off opens space");
});

// ── the required deterministic scenario ────────────────────────────────────

test("0 -> 40 -> 80 -> 115 -> 60 -> 115 -> 0 km/h behaves as one performance", () => {
  const rig = createRig();
  const marks = {};

  rig.hold(0, 6);
  marks.rest = arrangementSnapshot(rig.state);

  let speed = rig.accelerateTo(0, 40);
  speed = rig.hold(40, 8);
  marks.urban = arrangementSnapshot(rig.state);

  speed = rig.accelerateTo(speed, 80);
  speed = rig.hold(80, 8);
  marks.open = arrangementSnapshot(rig.state);

  speed = rig.accelerateTo(speed, 115);
  // Long enough for the arrangement to reach its steady state: scenes may only
  // change on a phrase boundary and must hold a minimum tenure, so the climb is
  // deliberately gradual.
  speed = rig.hold(115, 40);
  marks.cruise = arrangementSnapshot(rig.state);

  // A short brake, then straight back on the accelerator.
  speed = rig.brakeTo(speed, 60);
  marks.afterBrake = arrangementSnapshot(rig.state);
  speed = rig.hold(60, 1.5);
  marks.briefDip = arrangementSnapshot(rig.state);

  speed = rig.accelerateTo(speed, 115);
  speed = rig.hold(115, 40);
  marks.recovered = arrangementSnapshot(rig.state);

  // A sustained stop.
  speed = rig.liftOffTo(speed, 0);
  speed = rig.hold(0, 40);
  marks.stopped = arrangementSnapshot(rig.state);

  // 1. Energy climbs with speed and the piece reaches its full arrangement.
  assert.ok(marks.cruise.scene >= 3, `cruise should be a full arrangement, got ${marks.cruise.scene}`);
  assert.ok(marks.urban.scene >= 1, "urban speed must already carry a groove");
  assert.ok(marks.cruise.scene > marks.urban.scene);

  // 2. No discontinuous tempo jump: every committed move is small and inside
  //    the authored band.
  let previousTempo = TEMPO_REST_BPM;
  for (const entry of rig.log) {
    assert.ok(
      entry.tempo >= TEMPO_REST_BPM - 1e-9 && entry.tempo <= TEMPO_CEILING_BPM + 1e-9,
      `tempo left the authored band: ${entry.tempo}`,
    );
    assert.ok(
      Math.abs(entry.tempo - previousTempo) < 5,
      `tempo jumped ${Math.abs(entry.tempo - previousTempo).toFixed(2)} BPM at step ${entry.step}`,
    );
    previousTempo = entry.tempo;
  }

  // 3. No global slowdown: the ratio between the slowest and fastest tempo the
  //    piece ever reaches is far too small to read as a pitch or rate change.
  assert.ok(TEMPO_CEILING_BPM / TEMPO_REST_BPM < 1.1);

  // 4. Leitmotif and harmonic identity survive: the theme, the low end and the
  //    kick are never removed once established.
  const everLostIdentity = rig.log.some(
    (entry) => entry.exited.some((lane) => ["riff", "sub"].includes(lane)),
  );
  assert.equal(everLostIdentity, false, "the principal theme and sub must never leave");

  // 5. Every orchestration change happened on a boundary.
  const structuralEvents = rig.log.filter(
    (entry) => entry.sceneChanged || entry.entered.length > 0 || entry.exited.length > 0,
  );
  assert.ok(structuralEvents.length > 0, "the arrangement must actually change");
  for (const entry of structuralEvents) {
    assert.equal(entry.step % STEPS_PER_BAR, 0, `structural change off a bar at ${entry.step}`);
  }
  for (const entry of rig.log.filter((item) => item.sceneChanged)) {
    assert.equal(entry.step % STEPS_PER_PHRASE, 0, "scene changes must land on a phrase");
  }

  // 6. The brief dip kept the groove: same scene, no lane left.
  assert.equal(
    marks.briefDip.scene, marks.cruise.scene,
    "a short brake must not change the scene",
  );
  assert.ok(
    marks.briefDip.activeLanes.length >= marks.cruise.activeLanes.length,
    "a short brake must not thin the arrangement",
  );

  // 7. A dip to 60 km/h is still a lot of energy: the arrangement must survive
  //    it completely, with nothing removed and nothing to restore.
  assert.deepEqual(
    marks.recovered.activeLanes, marks.cruise.activeLanes,
    "the piece must return to the same arrangement, not a new one",
  );
  assert.equal(marks.recovered.scene, marks.cruise.scene);
  const exitsDuringDip = rig.log.filter(
    (entry) => entry.at > 60 && entry.at < 130 && entry.exited.length > 0,
  );
  assert.equal(exitsDuringDip.length, 0, "a dip to 60 km/h must remove nothing");

  // 8. The sustained stop thinned the arrangement gradually and landed on a
  //    deliberate resting state rather than silence.
  assert.equal(marks.stopped.scene, 0);
  assert.ok(
    marks.stopped.activeLanes.length < marks.cruise.activeLanes.length,
    "a sustained stop must reduce the arrangement",
  );
  for (const lane of ["atmosphere", "sub", "riff"]) {
    assert.ok(
      marks.stopped.activeLanes.includes(lane),
      `the resting state must keep ${lane}: it is a reduced arrangement, not silence`,
    );
  }
  assert.ok(marks.stopped.halfTime, "the resting state plays the material half-time");

  // 9. Lanes left one at a time, never in a collapse.
  for (const entry of rig.log) {
    assert.ok(entry.exited.length <= 1, `${entry.exited.length} lanes left at once`);
  }

  // 10. The transport never restarted: steps only ever counted upward.
  assert.ok(rig.steps() > 0);
  let previousStep = -1;
  for (const entry of rig.log) {
    assert.ok(entry.step > previousStep, "the transport must never rewind");
    previousStep = entry.step;
  }
});

// ── individual guarantees ──────────────────────────────────────────────────

test("a brake shorter than the catch window changes pressure but not structure", () => {
  const rig = createRig();
  rig.accelerateTo(0, 115);
  // Long enough to actually settle: the climb is gradual by design, so a
  // shorter hold would still be rising when the brake arrives.
  rig.hold(115, 40);
  const before = arrangementSnapshot(rig.state);

  rig.hold(70, CATCH_WINDOW_SECONDS * 0.6);
  const during = arrangementSnapshot(rig.state);

  assert.equal(during.scene, before.scene);
  assert.deepEqual(during.activeLanes, before.activeLanes);
  assert.equal(during.decelerationState, "catch");
  assert.ok(during.spatialDepth > before.spatialDepth, "the catch must open space");
  assert.ok(during.brightness < before.brightness, "the catch must reduce brightness");
});

test("only a sustained fall reaches the release stage, and it then completes", () => {
  const rig = createRig();
  rig.accelerateTo(0, 115);
  rig.hold(115, 40);
  const cruise = arrangementSnapshot(rig.state);

  rig.hold(30, CATCH_WINDOW_SECONDS + 0.5);
  assert.notEqual(
    rig.state.decelerationState, "sustained_release",
    "the release must wait for the falling dwell, not just the catch window",
  );
  assert.deepEqual(
    arrangementSnapshot(rig.state).activeLanes, cruise.activeLanes,
    "nothing may leave before the release stage",
  );

  // Observe the stage continuously rather than sampling one instant: the stage
  // is transient by design and settles back to cruise once the release drains.
  let reachedRelease = false;
  for (let index = 0; index < Math.round((FALLING_DWELL_SECONDS + 30) / TICK); index += 1) {
    rig.tick(30);
    if (rig.state.decelerationState === "sustained_release") reachedRelease = true;
  }
  assert.ok(reachedRelease, "a sustained drop must reach the release stage");

  const released = arrangementSnapshot(rig.state);
  assert.ok(released.scene < cruise.scene, "the release must reduce the arrangement");
  assert.ok(
    released.activeLanes.length < cruise.activeLanes.length,
    "the release must actually remove lanes",
  );
  assert.equal(rig.state.queuedExits.length, 0, "the release must drain completely");
});

test("a scene holds its minimum tenure before it may change again", () => {
  const rig = createRig();
  rig.accelerateTo(0, 115);
  rig.hold(115, 30);

  const changes = rig.log.filter((entry) => entry.sceneChanged);
  assert.ok(changes.length >= 2, "the climb must pass through scenes");
  for (let index = 1; index < changes.length; index += 1) {
    const bars = (changes[index].step - changes[index - 1].step) / STEPS_PER_BAR;
    assert.ok(
      bars >= MINIMUM_SCENE_BARS,
      `scenes changed after only ${bars} bars`,
    );
  }
});

test("a climb is announced with a fill on the phrase that introduces it", () => {
  const rig = createRig();
  rig.accelerateTo(0, 115);
  rig.hold(115, 30);
  const fills = rig.log.filter((entry) => entry.fill);
  assert.ok(fills.length > 0, "climbing the arrangement must be announced");
  for (const fill of fills) {
    assert.equal(fill.step % STEPS_PER_PHRASE, 0, "a fill lands on a phrase");
    assert.equal(fill.sceneChanged, true);
  }
});

test("GPS jitter below the deadband changes nothing at all", () => {
  const rig = createRig();
  rig.hold(80, 45);
  const before = arrangementSnapshot(rig.state);
  const beforeSpeed = rig.state.smoothedSpeedKmh;

  for (let index = 0; index < 600; index += 1) {
    rig.tick(80 + (index % 2 === 0 ? 0.6 : -0.6));
  }
  const after = arrangementSnapshot(rig.state);

  // The deadband is measured against the smoothed value, so it may sit
  // anywhere inside the band; what matters is that jitter cannot walk it.
  assert.ok(
    Math.abs(rig.state.smoothedSpeedKmh - beforeSpeed) < 2,
    `jitter walked the signal by ${Math.abs(rig.state.smoothedSpeedKmh - beforeSpeed)}`,
  );
  assert.equal(after.scene, before.scene);
  assert.deepEqual(after.activeLanes, before.activeLanes);
});

test("every scene is a density of one piece and every lane belongs to one", () => {
  assert.equal(SCENES.length, 5);
  assert.equal(SCENES[0].id, "rest");
  assert.ok(SCENES[0].halfTime && SCENES[1].halfTime, "low scenes read half-time");
  assert.ok(!SCENES[4].halfTime, "the full scene is not half-time");

  for (const lane of LANES) {
    assert.ok(lane.minScene >= 0 && lane.minScene < SCENES.length, lane.id);
    assert.ok(lane.keepFromScene <= lane.minScene, lane.id);
    assert.ok(["bar", "phrase"].includes(lane.entryBoundary), lane.id);
  }

  // The identity lanes belong to the resting state, so they are always present.
  for (const id of ["atmosphere", "sub", "riff"]) {
    assert.equal(LANES.find((lane) => lane.id === id).minScene, 0, id);
  }
});

test("the tempo target follows energy and is only ever committed on a boundary", () => {
  const state = createArrangerState();
  assert.equal(state.committedTempo, TEMPO_REST_BPM);

  for (let index = 0; index < 60 * 20; index += 1) {
    observeSpeed(state, ROAD_SPEED_CEILING_KMH, TICK);
  }
  assert.ok(tempoTarget(state) > TEMPO_CEILING_BPM - 1);
  assert.equal(
    state.committedTempo, TEMPO_REST_BPM,
    "observing speed must never move the transport tempo by itself",
  );

  for (let bar = 0; bar < 40; bar += 1) commitAtBoundary(state, "bar");
  assert.ok(state.committedTempo > TEMPO_CEILING_BPM - 1);
});

test("a deep sustained drop queues removals that re-acceleration then cancels", () => {
  const rig = createRig();
  rig.accelerateTo(0, 115);
  rig.hold(115, 40);
  const cruise = arrangementSnapshot(rig.state);
  assert.equal(cruise.scene, 4, "the scenario needs the full arrangement first");

  // Deep enough that the release stage will actually queue a removal, which is
  // the only situation in which cancelling means anything. Wait for the queue
  // rather than guessing a duration: scene changes land on phrase boundaries.
  let waited = 0;
  while (rig.state.queuedExits.length === 0 && waited < 60) {
    rig.tick(25);
    waited += TICK;
  }
  assert.ok(rig.state.queuedExits.length > 0, "the release must have queued a removal");
  assert.equal(rig.state.decelerationState, "sustained_release");
  const cancelledBefore = rig.state.cancelledExits;

  // Back on the accelerator before the queue drains.
  rig.accelerateTo(25, 115);
  assert.ok(
    rig.state.cancelledExits > cancelledBefore,
    "returning to speed must cancel queued layer removals",
  );
  assert.equal(rig.state.queuedExits.length, 0);

  rig.hold(115, 40);
  const recovered = arrangementSnapshot(rig.state);
  assert.deepEqual(
    recovered.activeLanes, cruise.activeLanes,
    "the arrangement must come back whole",
  );
});
