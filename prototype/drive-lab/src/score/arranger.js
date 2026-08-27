// Flux arrangement logic: how driving becomes interpretation.
//
// Original sedicivalvole code. It sits above the ported textStep transport and
// synthesis and decides what the score plays, not how it sounds.
//
// The whole module exists to honour one perceptual rule: the music must never
// sound like a recording being slowed down or sped up. Two consequences shape
// everything here.
//
// First, tempo is almost fixed. It moves between 162 and 176 BPM with a sharp
// knee, so nearly all of that small range is spent by urban speed and the
// motorway range is effectively a plateau. A driver never hears the piece
// "speed up"; what changes is subdivision, density, orchestration, register and
// space. At rest the same material is played half-time, which is why a
// standstill sounds slow without the tempo being slow.
//
// Second, continuous and structural changes are strictly separated. Brightness,
// filter pressure, drive, spatial depth and dynamics follow smoothed energy
// every block. Lane entries and exits, scene changes and fills only ever happen
// on a bar or phrase boundary, behind hysteresis, asymmetric dwell, a minimum
// scene tenure, and a cancellable exit queue. GPS jitter can move the first set
// and cannot move the second.

import { clamp, ROAD_SPEED_CEILING_KMH, speedToEnergy } from "../signal-model.js";

export const TEMPO_REST_BPM = 162;
export const TEMPO_CEILING_BPM = 176;
const TEMPO_KNEE = 0.32;

/** Scenes are densities of one composition, not different pieces. */
export const SCENES = Object.freeze([
  { id: "rest", label: "REST", halfTime: true },
  { id: "roll", label: "ROLL", halfTime: true },
  { id: "break", label: "BREAK", halfTime: false },
  { id: "drive", label: "DRIVE", halfTime: false },
  { id: "full", label: "FULL", halfTime: false },
]);

const SCENE_ENTER = [0.1, 0.3, 0.55, 0.78];
const SCENE_EXIT = [0.05, 0.22, 0.45, 0.68];

/** Bars a scene must hold before it may change again. */
export const MINIMUM_SCENE_BARS = 4;

/** Seconds the energy must support a higher scene before the piece climbs. */
export const RISING_DWELL_SECONDS = 0.8;

/**
 * Scenes a single boundary may climb.
 *
 * One was too slow: pulling away to urban speed left the piece resting for ten
 * seconds. Unbounded was worse in the other direction — the arrangement arrived
 * all at once instead of building, and the announcing fill had nothing to
 * announce. Two keeps the climb a gesture with a shape while still reaching a
 * full break within a couple of phrases.
 */
export const MAXIMUM_SCENE_CLIMB = 2;

/** Seconds below the retained peak before the arrangement starts to thin. */
export const FALLING_DWELL_SECONDS = 6;

/**
 * A speed drop shorter than this changes pressure and space only. The transport,
 * the tempo and the principal groove are untouched, so ordinary braking never
 * dismantles the music.
 */
export const CATCH_WINDOW_SECONDS = 2.5;

/** How fast retained intensity fades once speed stops supporting it. */
const PEAK_MEMORY_DECAY_PER_SECOND = 0.045;

/** How far below the retained peak counts as a real drop rather than jitter. */
const BELOW_PEAK_MARGIN = 0.06;

/** A speed change smaller than this never reaches the arrangement at all. */
const SPEED_DEADBAND_KMH = 0.9;

/**
 * Lanes of the first authored score.
 *
 * `minScene` is where a lane belongs; `keepFromScene` is how far the arrangement
 * may thin before the lane leaves, which is what preserves the identity of the
 * piece. Atmosphere, sub and the principal riff belong to the resting scene, so
 * the theme, the low end and the harmonic identity survive at every speed.
 */
export const LANES = Object.freeze([
  { id: "atmosphere", minScene: 0, keepFromScene: 0, entryBoundary: "phrase" },
  { id: "sub", minScene: 0, keepFromScene: 0, entryBoundary: "bar" },
  { id: "riff", minScene: 0, keepFromScene: 0, entryBoundary: "phrase" },
  { id: "kick", minScene: 1, keepFromScene: 1, entryBoundary: "bar" },
  { id: "closedHat", minScene: 1, keepFromScene: 1, entryBoundary: "bar" },
  { id: "snare", minScene: 2, keepFromScene: 2, entryBoundary: "bar" },
  { id: "reese", minScene: 2, keepFromScene: 2, entryBoundary: "phrase" },
  { id: "breakDetail", minScene: 3, keepFromScene: 3, entryBoundary: "bar" },
  { id: "openHat", minScene: 3, keepFromScene: 3, entryBoundary: "bar" },
  { id: "response", minScene: 4, keepFromScene: 4, entryBoundary: "phrase" },
]);

/** Tempo with a knee: nearly all of the small range is spent by urban speed. */
export function energyToTempo(energy) {
  const safeEnergy = clamp(energy, 0, 1);
  const shaped = (1 - Math.exp(-safeEnergy / TEMPO_KNEE)) / (1 - Math.exp(-1 / TEMPO_KNEE));
  return TEMPO_REST_BPM + (TEMPO_CEILING_BPM - TEMPO_REST_BPM) * shaped;
}

/** Scene index for an energy, with separate enter and exit thresholds. */
export function energyToScene(energy, currentScene) {
  const safeEnergy = clamp(energy, 0, 1);
  const scene = Math.round(clamp(currentScene, 0, SCENES.length - 1));
  if (scene < SCENES.length - 1 && safeEnergy >= SCENE_ENTER[scene]) return scene + 1;
  if (scene > 0 && safeEnergy < SCENE_EXIT[scene - 1]) return scene - 1;
  return scene;
}

/**
 * The scene an energy fully supports, resolving `energyToScene` to a fixed
 * point rather than a single step.
 *
 * Stepping one scene per phrase was audibly wrong in both directions. Pulling
 * away at urban speed left the piece resting for ten seconds while the driver
 * was already moving, and coming to a stop left the full break running long
 * after the vehicle had. Hysteresis is preserved exactly — this only asks the
 * same thresholds where they finally settle, instead of stopping after one.
 */
export function energyToSupportedScene(energy, currentScene) {
  let scene = Math.round(clamp(currentScene, 0, SCENES.length - 1));
  for (let guard = 0; guard < SCENES.length; guard += 1) {
    const next = energyToScene(energy, scene);
    if (next === scene) break;
    scene = next;
  }
  return scene;
}

export function createArrangerState() {
  return {
    smoothedSpeedKmh: 0,
    energy: 0,
    peakEnergy: 0,
    scene: 0,
    pendingScene: 0,
    risingSeconds: 0,
    climbSeconds: 0,
    belowPeakSeconds: 0,
    decelerationState: "cruise",
    barsInScene: MINIMUM_SCENE_BARS,
    laneGoals: Object.fromEntries(LANES.map((lane) => [lane.id, lane.minScene === 0 ? 1 : 0])),
    queuedExits: [],
    cancelledExits: 0,
    committedTempo: TEMPO_REST_BPM,
    fillArmed: false,
  };
}

/**
 * Advances the arrangement's view of the vehicle.
 *
 * Smoothing is asymmetric and sits behind a deadband, so GPS jitter of a km/h or
 * so changes nothing at all. Nothing structural happens here: this only updates
 * what the arrangement believes, and boundaries decide what it does about it.
 */
export function observeSpeed(state, speedKmh, deltaSeconds) {
  const delta = clamp(Number.isFinite(deltaSeconds) ? deltaSeconds : 0, 0, 0.5);
  const target = clamp(
    Number.isFinite(speedKmh) ? Math.max(0, speedKmh) : 0, 0, ROAD_SPEED_CEILING_KMH * 2,
  );

  const difference = target - state.smoothedSpeedKmh;
  if (Math.abs(difference) > SPEED_DEADBAND_KMH) {
    const rate = difference > 0 ? 2.6 : 3.4;
    state.smoothedSpeedKmh += difference * Math.min(1, rate * delta);
  }

  const previousEnergy = state.energy;
  state.energy = speedToEnergy(state.smoothedSpeedKmh);

  // Retained intensity: the arrangement remembers how hard it was working and
  // lets that go slowly, so a dip does not erase the performance.
  state.peakEnergy = Math.max(
    state.energy,
    state.peakEnergy - PEAK_MEMORY_DECAY_PER_SECOND * delta,
  );

  const rising = state.energy > previousEnergy + 1e-6;
  state.risingSeconds = rising ? state.risingSeconds + delta : 0;

  advanceDecelerationState(state, rising, delta);
  reviewScene(state, delta);
  reviewLanes(state);
  return state;
}

/**
 * The three-stage deceleration memory.
 *
 * catch      a brief drop; pressure and space change, structure does not.
 * recovery   speed returned, so queued removals are cancelled.
 * release    the drop has been sustained past the falling dwell; the
 *            arrangement may now thin, one lane at a time, at a boundary.
 */
function advanceDecelerationState(state, rising, delta) {
  // The stage is decided by how far below its retained peak the performance has
  // been, and for how long. Testing "is speed still dropping" would be wrong:
  // braking and then holding a lower speed must still release eventually, and
  // speed stops falling the moment the driver settles.
  const belowPeak = state.peakEnergy - state.energy > BELOW_PEAK_MARGIN;

  // Only a real return of speed cancels queued removals. The retained peak also
  // decays on its own toward a settled lower speed, and that must not be
  // mistaken for recovery: it would abandon a release the driver actually asked
  // for by slowing down and staying slow.
  if (rising && state.risingSeconds > 0.25) {
    if (state.decelerationState === "catch" || state.decelerationState === "sustained_release") {
      cancelQueuedExits(state);
      state.decelerationState = "recovery";
    }
    state.belowPeakSeconds = 0;
    if (state.decelerationState === "recovery"
      && state.risingSeconds > RISING_DWELL_SECONDS
      && !belowPeak) {
      state.decelerationState = "cruise";
    }
    return;
  }

  if (belowPeak) {
    state.belowPeakSeconds += delta;
    state.decelerationState = state.belowPeakSeconds >= FALLING_DWELL_SECONDS
      ? "sustained_release"
      : "catch";
    return;
  }

  // Neither below the peak nor climbing. A release still settling is allowed to
  // finish: the retained peak decays toward a steady lower speed on its own, so
  // leaving the stage as soon as it catches up would strand the arrangement
  // halfway down, with lanes still queued and scenes still to shed.
  if (state.decelerationState === "sustained_release" && !arrangementSettled(state)) return;

  if (state.decelerationState !== "cruise") {
    state.belowPeakSeconds = 0;
    state.decelerationState = "cruise";
  }
}

/** True when the arrangement matches what the current energy asks for. */
function arrangementSettled(state) {
  if (state.queuedExits.length > 0) return false;
  if (energyToSupportedScene(state.energy, state.scene) !== state.scene) return false;
  return LANES.every(
    (lane) => state.laneGoals[lane.id] === (state.scene >= lane.minScene ? 1 : 0),
  );
}

function cancelQueuedExits(state) {
  if (state.queuedExits.length === 0) return;
  state.cancelledExits += state.queuedExits.length;
  state.queuedExits = [];
}

/** Queues a scene change once dwell, hysteresis and tenure all agree. */
function reviewScene(state, delta) {
  const supported = energyToSupportedScene(state.energy, state.scene);
  // Climbing is capped so the arrangement builds; thinning is not, because a
  // vehicle that has genuinely stopped should not keep playing a full break.
  const proposed = supported > state.scene
    ? Math.min(supported, state.scene + MAXIMUM_SCENE_CLIMB)
    : supported;

  if (proposed > state.scene) {
    // The dwell measures how long the energy has *supported* the higher scene,
    // not whether it is still increasing. Gating on "still rising" would freeze
    // the arrangement the moment the driver settled at a constant speed.
    state.climbSeconds += delta;
    if (state.climbSeconds >= RISING_DWELL_SECONDS) {
      state.pendingScene = proposed;
      // A climb is worth announcing; a fill is armed for the next phrase.
      state.fillArmed = true;
    }
    return;
  }

  state.climbSeconds = 0;

  if (proposed === state.scene) {
    state.pendingScene = state.scene;
    return;
  }

  // Downward moves additionally require the sustained-release stage, so a brief
  // lift or a short brake can never thin the arrangement.
  if (state.decelerationState !== "sustained_release") return;
  state.pendingScene = proposed;
}

/**
 * Queues the lane removals the current scene implies.
 *
 * Nothing is removed here: a queued exit is only applied at a boundary, and any
 * return of speed cancels the whole queue. That is what makes a removal
 * genuinely cancellable rather than merely delayed.
 */
function reviewLanes(state) {
  if (state.decelerationState !== "sustained_release") return;
  // Queued from the top of the arrangement down, so what leaves first is the
  // material the fullest scene added. Queuing in lane order removed the kick
  // while the break detail was still chattering over it, which reads as the
  // music breaking rather than thinning.
  const leaving = LANES.filter((lane) => (
    state.laneGoals[lane.id] !== 0 && state.scene < lane.keepFromScene
  )).sort((first, second) => second.keepFromScene - first.keepFromScene);
  for (const lane of leaving) {
    if (!state.queuedExits.includes(lane.id)) state.queuedExits.push(lane.id);
  }
}

/**
 * Continuous controls. These follow smoothed energy every block and are the only
 * things allowed to move between musical boundaries.
 */
export function continuousControls(state) {
  const { energy } = state;
  const retained = Math.max(energy, state.peakEnergy);
  const inCatch = state.decelerationState === "catch";
  const releasing = state.decelerationState === "sustained_release";

  return {
    energy,
    retainedEnergy: retained,
    // Brightness follows current energy, so a lift darkens the mix immediately
    // even though the notes do not change.
    brightness: 0.24 + 0.66 * energy ** 0.85,
    // Filter pressure leans on retained energy, which is what keeps a brief
    // brake sounding like the same performance under load.
    filterPressure: 0.2 + 0.75 * retained ** 0.9,
    drive: 0.06 + 0.5 * energy ** 1.05,
    // Space opens as the arrangement releases: the classic lift-off wash.
    spatialDepth: 0.18 + 0.3 * energy + (inCatch ? 0.22 : 0) + (releasing ? 0.3 : 0),
    delayFeedback: 0.22 + 0.24 * energy + (releasing ? 0.16 : 0),
    // Dynamics compress toward the top so the loud state has weight, not level.
    dynamics: 0.55 + 0.35 * energy ** 0.7,
    // Ducking deep enough to breathe, not so deep that the full arrangement
    // measures quieter than the half-time one it grew out of.
    duckDepth: 0.34 + 0.2 * energy,
    subDrive: 0.3 + 0.55 * retained,
    // Ghost weight and hat subdivision are continuous articulation, not
    // structure, so they may move between boundaries.
    //
    // Both start earlier than they did. Below thirty km/h the arrangement had
    // quarter-note hats and no ghost field at all, which is not a light texture
    // — it is an empty one. Eighths and a trace of ghost give the low band
    // something to be without making it busy.
    ghostWeight: clamp((energy - 0.1) / 0.5, 0, 1),
    hatSubdivision: energy < 0.2 ? 1 : energy < 0.6 ? 2 : 3,
  };
}

/** Tempo target. Structural, so the transport only reads it at a boundary. */
export function tempoTarget(state) {
  return energyToTempo(state.energy);
}

/**
 * Applies queued structural change at a musical boundary.
 *
 * `boundary` is `"bar"` or `"phrase"`. Scene changes and phrase-boundary lanes
 * wait for a phrase; bar-boundary lanes may move at a bar. Nothing structural
 * ever happens off a boundary.
 */
export function commitAtBoundary(state, boundary) {
  const applied = {
    sceneChanged: false,
    entered: [],
    exited: [],
    tempo: state.committedTempo,
    fill: false,
  };
  if (boundary !== "bar" && boundary !== "phrase") return applied;

  // A phrase boundary is also a bar boundary.
  state.barsInScene += 1;

  if (boundary === "phrase"
    && state.pendingScene !== state.scene
    && state.barsInScene >= MINIMUM_SCENE_BARS) {
    applied.fill = state.pendingScene > state.scene && state.fillArmed;
    state.scene = state.pendingScene;
    state.barsInScene = 0;
    state.fillArmed = false;
    applied.sceneChanged = true;
  }

  // Tempo only ever moves at a boundary, and only part of the way toward its
  // target, so it glides instead of tracking every speed sample.
  state.committedTempo += (tempoTarget(state) - state.committedTempo) * 0.34;
  applied.tempo = state.committedTempo;

  for (const lane of LANES) {
    const wanted = state.scene >= lane.minScene ? 1 : 0;
    if (wanted === state.laneGoals[lane.id]) continue;

    const boundaryAllows = lane.entryBoundary === "bar" ? true : boundary === "phrase";
    if (!boundaryAllows) continue;

    if (wanted === 1) {
      state.laneGoals[lane.id] = 1;
      applied.entered.push(lane.id);
      // An entry cancels any queued removal for the same lane.
      state.queuedExits = state.queuedExits.filter((queued) => queued !== lane.id);
      continue;
    }

    // Removals only ever come off the queue, one lane per boundary, so the
    // arrangement thins gradually rather than collapsing. What makes a stop
    // drain promptly is the scene resolving all the way down, which queues
    // every departing lane at once, and the order they were queued in.
    if (!state.queuedExits.includes(lane.id)) continue;
    if (applied.exited.length > 0) continue;
    state.laneGoals[lane.id] = 0;
    state.queuedExits = state.queuedExits.filter((queued) => queued !== lane.id);
    applied.exited.push(lane.id);
  }

  return applied;
}

/** Everything a renderer or a test needs to describe the current arrangement. */
export function arrangementSnapshot(state) {
  return {
    scene: state.scene,
    sceneId: SCENES[state.scene].id,
    halfTime: SCENES[state.scene].halfTime,
    tempo: state.committedTempo,
    decelerationState: state.decelerationState,
    activeLanes: LANES.filter((lane) => state.laneGoals[lane.id] > 0).map((lane) => lane.id),
    ...continuousControls(state),
  };
}
