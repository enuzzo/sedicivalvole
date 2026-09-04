import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  advanceDepartureGate,
  createDepartureGate,
  JUNCTION_CREEP_BPM,
  lowSpeedPolicy,
  NATIVE_GROOVE_SPEED_KMH,
  perceivedFractureBpm,
  perceivedTempoFromSnapshot,
} from "../src/low-speed-score.js";
import {
  junctionSectionForSpeed,
} from "../src/junction-bank.js";
import { speedToArrangementDrive } from "../src/signal-model.js";
import { junctionStepFrame } from "../scripts/junction-form.mjs";
import { createScoreCore } from "../src/score/score-core.js";
import { arrangementSnapshot, createArrangerState } from "../src/score/arranger.js";
import { nextVehicleRate, VEHICLE_RATE_STALE_MS } from "../src/vehicle-rate.js";
import {
  createScoreCrossfadeState,
  equalPowerCrossfade,
  scheduleEqualPowerGain,
  scheduleScoreCrossfade,
  scheduleScoreCrossfadeCompletion,
  shouldCompleteScoreCrossfade,
  scoreCrossfadeAtTime,
  SCORE_SWITCH_CROSSFADE_SECONDS,
} from "../src/score-crossfade.js";
import {
  createJunctionLowSpeedBed,
  JUNCTION_DEPARTURE_GESTURE,
  JUNCTION_LOW_SPEED_CHORDS,
  JUNCTION_LOW_SPEED_LEVELS,
  JUNCTION_PARK_CROSSFADE_SECONDS,
  JUNCTION_PARK_HOLD_SECONDS,
} from "../src/junction-low-speed-bed.js";

class BedParam {
  constructor() { this.activeCurveUntil = -Infinity; this.events = []; this.value = 0; }
  cancelScheduledValues(time) {
    this.activeCurveUntil = Math.min(this.activeCurveUntil, time);
    this.events.push({ type: "cancel", time });
  }
  cancelAndHoldAtTime(time) {
    this.activeCurveUntil = Math.min(this.activeCurveUntil, time);
    this.events.push({ type: "hold", time, value: this.value });
  }
  linearRampToValueAtTime(value, time) { this.value = value; this.events.push({ type: "ramp", value, time }); }
  setTargetAtTime(value, time) { this.value = value; this.events.push({ type: "target", value, time }); }
  setValueAtTime(value, time) { this.value = value; this.events.push({ type: "set", value, time }); }
  setValueCurveAtTime(curve, time, duration) {
    if (time < this.activeCurveUntil) throw new Error("overlapping value curve");
    this.activeCurveUntil = time + duration;
    this.value = curve[curve.length - 1];
    this.events.push({ type: "curve", curve, time, duration });
  }
}

class BedNode {
  connect(target) { return target; }
  disconnect() {}
}

function createBedContext() {
  const gains = [];
  return {
    gains,
    currentTime: 0,
    createBiquadFilter() {
      return Object.assign(new BedNode(), { frequency: new BedParam(), Q: new BedParam(), gain: new BedParam() });
    },
    createDelay() { return Object.assign(new BedNode(), { delayTime: new BedParam() }); },
    createGain() {
      const gain = Object.assign(new BedNode(), { gain: new BedParam() });
      gains.push(gain);
      return gain;
    },
    createOscillator() {
      return Object.assign(new BedNode(), {
        detune: new BedParam(),
        frequency: new BedParam(),
        start() {},
        stop() {},
      });
    },
  };
}

const SPEED_CASES = [
  [0, "park", null],
  [0.5, "park", null],
  [1.2, "depart", null],
  [4, "creep", JUNCTION_CREEP_BPM],
  [10, "roll", JUNCTION_CREEP_BPM],
  [19.9, "roll", JUNCTION_CREEP_BPM],
  [20, "roll", JUNCTION_CREEP_BPM],
  [NATIVE_GROOVE_SPEED_KMH, "native", null],
  [30, "native", null],
];

test("the agreed 0-30 km/h policy is deterministic and sub-100 before native groove", () => {
  for (const [speed, id, perceivedBpm] of SPEED_CASES) {
    const policy = lowSpeedPolicy(speed);
    assert.equal(policy.id, id, `${speed} km/h`);
    assert.equal(policy.perceivedBpm, perceivedBpm, `${speed} km/h perceived BPM`);
    if (speed < NATIVE_GROOVE_SPEED_KMH) {
      assert.equal(policy.bass, false, `${speed} km/h has no bass`);
      assert.ok(policy.perceivedBpm == null || policy.perceivedBpm <= 100);
    }
  }
  assert.equal(lowSpeedPolicy(0).harmony, "ambient-field");
  assert.equal(lowSpeedPolicy(0).beat, false);
});

test("FRACTURE reports listener tactus separately from its private transport", () => {
  assert.equal(perceivedFractureBpm(0, 162), null);
  assert.equal(perceivedFractureBpm(4, 166), 83);
  assert.equal(perceivedFractureBpm(19.9, 176), 88);
  assert.equal(perceivedFractureBpm(20, 172, true), 86);
  assert.equal(perceivedFractureBpm(20, 172, false), 86);
  assert.equal(perceivedFractureBpm(87.9, 176, true), 176);
  assert.equal(perceivedFractureBpm(81.9, 176, true), 88);
  assert.equal(perceivedFractureBpm(88, 176, false), 88);
});

test("FRACTURE never reports an inaudible native beat, bass or double-time tactus", () => {
  const state = createArrangerState();
  state.observedSpeedKmh = NATIVE_GROOVE_SPEED_KMH;
  state.committedTempo = 162;
  const sparseNative = arrangementSnapshot(state, {
    fullTime: false,
    profileId: "silk",
    label: "SILK PULSE",
  });
  assert.equal(sparseNative.sceneId, "roll");
  assert.equal(sparseNative.perceivedTempo, 81);
  assert.equal(sparseNative.beat, true);
  assert.equal(sparseNative.bass, false);
  assert.deepEqual(sparseNative.activeLanes, ["atmosphere", "rhythm:silk"]);

  state.scene = 2;
  state.laneGoals.sub = 1;
  state.laneGoals.kick = 1;
  state.laneGoals.closedHat = 1;
  state.laneGoals.snare = 1;
  state.laneGoals.reese = 1;
  state.observedSpeedKmh = 90;
  const breakScene = arrangementSnapshot(state, {
    fullTime: true,
    profileId: "native",
    label: "FULL BREAK",
  });
  assert.equal(breakScene.sceneId, "break");
  assert.equal(breakScene.perceivedTempo, 162);
  assert.equal(breakScene.beat, true);
  assert.equal(breakScene.bass, true);
});

test("an explicit clockless snapshot stays clockless in the driver UI", () => {
  assert.equal(perceivedTempoFromSnapshot({ perceivedTempo: null, halfTime: true }, 162), null);
  assert.equal(perceivedTempoFromSnapshot({ perceivedTempo: null, halfTime: false }, 127), null);
  assert.equal(perceivedTempoFromSnapshot({ perceivedTempo: 84.666 }, 127), 84.666);
  assert.equal(perceivedTempoFromSnapshot({ halfTime: true }, 162), 81);
});

test("the two-event departure gesture cannot retrigger until PARK re-arms", () => {
  const gate = createDepartureGate();
  assert.equal(advanceDepartureGate(gate, 1.2, 0.1), 2);
  for (const speed of [1.3, 1.1, 1.25, 0.7, 1.4]) {
    assert.equal(advanceDepartureGate(gate, speed, 0.25), 0);
  }
  assert.equal(advanceDepartureGate(gate, 0.5, 2.9), 0);
  assert.equal(gate.armed, false);
  assert.equal(advanceDepartureGate(gate, 0.5, 0.1), 0);
  assert.equal(gate.armed, true);
  assert.equal(advanceDepartureGate(gate, 1.2, 0.1), 2);
  assert.equal(gate.launches, 2);
});

test("departure is a forward threshold crossing, never a first high-speed fix or braking event", () => {
  const gate = createDepartureGate();
  assert.equal(advanceDepartureGate(gate, 30, 0), 0);
  assert.equal(gate.armed, false);
  assert.equal(advanceDepartureGate(gate, 1.2, 0.5), 0);
  assert.equal(advanceDepartureGate(gate, 0.5, 3), 0);
  assert.equal(advanceDepartureGate(gate, 1.2, 0.1), 2);
});

test("a known PARK state still produces one gesture when telemetry jumps straight to 5 km/h", () => {
  const gate = createDepartureGate();
  assert.equal(advanceDepartureGate(gate, 0, 0.1), 0);
  assert.equal(advanceDepartureGate(gate, 5, 0.1), 2);
  assert.equal(advanceDepartureGate(gate, 6, 0.1), 0);
});

test("the CREEP micro-progression continues through ROLL without restarting", () => {
  const context = createBedContext();
  const bed = createJunctionLowSpeedBed(context, new BedNode());
  bed.setActive(true);
  bed.setSpeed(4, 0.1);
  context.currentTime = (60 / JUNCTION_CREEP_BPM) * 8 + 0.01;
  bed.tick();
  assert.equal(bed.snapshot().lowSpeedHarmony, "Cmaj7");
  bed.setSpeed(10, 0.1);
  assert.equal(bed.snapshot().lowSpeedHarmony, "Cmaj7");
  bed.destroy();
});

test("JUNCTION PARK reaches six consonant voicings without a clock or immediate repetition", () => {
  const context = createBedContext();
  const bed = createJunctionLowSpeedBed(context, new BedNode());
  bed.setActive(true);
  bed.setSpeed(0);
  const visited = [bed.snapshot().parkVoicing];
  for (const holdSeconds of JUNCTION_PARK_HOLD_SECONDS.slice(0, -1)) {
    context.currentTime += holdSeconds + 0.01;
    bed.tick();
    visited.push(bed.snapshot().parkVoicing);
  }
  assert.equal(new Set(visited).size, JUNCTION_LOW_SPEED_CHORDS.length);
  for (let index = 1; index < visited.length; index += 1) {
    assert.notEqual(visited[index], visited[index - 1]);
  }
  assert.equal(bed.snapshot().perceivedTempo, null);
  assert.equal(bed.snapshot().beat, false);
  assert.equal(bed.snapshot().bass, false);
  assert.equal(bed.snapshot().parkVoicingChanges, JUNCTION_LOW_SPEED_CHORDS.length - 1);
  assert.ok(context.gains.some((gain) => gain.gain.events.filter((event) => event.type === "ramp").length >= 5));
  bed.destroy();
});

test("JUNCTION re-arms DEPART from elapsed PARK time without new speed samples", () => {
  const context = createBedContext();
  const bed = createJunctionLowSpeedBed(context, new BedNode());
  bed.setActive(true);
  bed.setSpeed(0);
  bed.setSpeed(1.2);
  assert.equal(bed.snapshot().departureEventsPlayed, 2);
  bed.setSpeed(0);
  context.currentTime += 3.01;
  bed.tick();
  assert.equal(bed.snapshot().departureArmed, true);
  bed.setSpeed(1.2);
  assert.equal(bed.snapshot().departureEventsPlayed, 4);
  bed.destroy();
});

test("JUNCTION low-speed automation holds active ramps and ignores unchanged levels", () => {
  const context = createBedContext();
  const bed = createJunctionLowSpeedBed(context, new BedNode());
  const master = context.gains[0].gain;
  bed.setActive(true);
  const activationEventCount = master.events.length;

  context.currentTime = 0.2;
  bed.setSpeed(0.2);
  assert.equal(
    master.events.length,
    activationEventCount,
    "an unchanged PARK level restarted its active gain ramp",
  );

  context.currentTime = 0.4;
  bed.setSpeed(4);
  assert.deepEqual(master.events.slice(-2).map((event) => event.type), ["hold", "target"]);
  assert.equal(master.events.some((event) => event.type === "cancel"), false);

  const chordHold = 0.4 + (60 / JUNCTION_CREEP_BPM) * 8 + 0.01;
  context.currentTime = chordHold;
  bed.tick();
  context.currentTime = chordHold + 0.2;
  bed.setSpeed(0);
  for (const chordGain of context.gains.slice(3, 5)) {
    assert.ok(chordGain.gain.events.some((event) => event.type === "hold"));
    assert.equal(chordGain.gain.events.some((event) => event.type === "cancel"), false);
  }
  bed.destroy();
});

test("the score hand-off uses one equal-power envelope with no gain-floor hole", () => {
  for (const progress of [0, 0.125, 0.25, 0.5, 0.75, 0.875, 1]) {
    const gains = equalPowerCrossfade(progress);
    assert.ok(Math.abs(gains.outgoing ** 2 + gains.incoming ** 2 - 1) < 1e-12);
    assert.ok(gains.outgoing + gains.incoming >= 1);
  }

  const parameter = new BedParam();
  const envelope = scheduleEqualPowerGain(
    parameter,
    "out",
    2,
    SCORE_SWITCH_CROSSFADE_SECONDS,
  );
  const curveEvent = parameter.events.find((event) => event.type === "curve");
  assert.equal(envelope.startAt, 2);
  assert.equal(envelope.endAt, 6);
  assert.equal(curveEvent.curve[0], 1);
  assert.ok(Math.abs(curveEvent.curve.at(-1)) < 1e-6);
});

test("an equal-power score hand-off can reverse while its first curve is active", () => {
  const fracture = new BedParam();
  const junction = new BedParam();
  let state = createScoreCrossfadeState("fracture", 0);
  state = scheduleScoreCrossfade({
    fractureParam: fracture,
    junctionParam: junction,
    state,
    targetScoreId: "junction",
    startAt: 0,
  });
  assert.equal(state.endAt, 4);
  const quarter = scoreCrossfadeAtTime(state, 1);
  assert.ok(Math.abs(quarter.fracture ** 2 + quarter.junction ** 2 - 1) < 1e-12);

  assert.doesNotThrow(() => {
    state = scheduleScoreCrossfade({
      fractureParam: fracture,
      junctionParam: junction,
      state,
      targetScoreId: "fracture",
      startAt: 1,
    });
  });
  assert.equal(state.endAt, 2, "a quarter-complete transition should reverse in one second");
  assert.equal(fracture.events.filter((event) => event.type === "cancel").length, 2);
  assert.equal(junction.events.filter((event) => event.type === "cancel").length, 2);
  const restored = scoreCrossfadeAtTime(state, 2);
  assert.ok(Math.abs(restored.fracture - 1) < 1e-12);
  assert.ok(Math.abs(restored.junction) < 1e-12);
});

test("score selection resolves when the fade is scheduled, not four seconds later", async () => {
  let deferredCleanup = null;
  let scheduledDelay = null;
  let cleaned = false;
  let audioTime = 5;
  const selection = scheduleScoreCrossfadeCompletion({
    transition: { endAt: 9 },
    currentTime: () => audioTime,
    schedule(callback, delay) {
      deferredCleanup = callback;
      scheduledDelay = delay;
    },
    onComplete() { cleaned = true; },
    result: "junction",
  });

  assert.equal(await selection, "junction");
  assert.equal(cleaned, false, "selection was held until cleanup");
  assert.equal(scheduledDelay, 4000);
  deferredCleanup();
  assert.equal(cleaned, false, "wall time cleaned a crossfade on a suspended audio clock");
  assert.equal(scheduledDelay, 4000);
  audioTime = 9;
  deferredCleanup();
  assert.equal(cleaned, true);
});

test("score cleanup stops polling when its audio owner is destroyed", async () => {
  const scheduled = [];
  let running = true;
  let completed = false;
  scheduleScoreCrossfadeCompletion({
    transition: { endAt: 4 },
    currentTime: () => 0,
    schedule(callback, delay) { scheduled.push({ callback, delay }); },
    shouldContinue: () => running,
    onComplete() { completed = true; },
    result: "junction",
  });

  assert.equal(scheduled.length, 1);
  running = false;
  scheduled.shift().callback();
  assert.equal(scheduled.length, 0, "a frozen closed clock scheduled another cleanup timer");
  assert.equal(completed, false);
});

test("only the current requested score may complete deferred crossfade cleanup", () => {
  const current = {
    running: true,
    requestedScoreId: "junction",
    targetScoreId: "junction",
    revision: 7,
    currentRevision: 7,
  };
  assert.equal(shouldCompleteScoreCrossfade(current), true);
  assert.equal(shouldCompleteScoreCrossfade({ ...current, running: false }), false);
  assert.equal(shouldCompleteScoreCrossfade({ ...current, requestedScoreId: "fracture" }), false);
  assert.equal(shouldCompleteScoreCrossfade({ ...current, revision: 6 }), false);
});

test("FRACTURE-only startup does not construct the JUNCTION oscillator graph", async () => {
  const source = await readFile(new URL("../src/audio-engine.js", import.meta.url), "utf8");
  const constructorAt = source.indexOf("junction = createJunctionPlayer(");
  const lazyFactoryAt = source.indexOf("function ensureJunction()");
  assert.match(source, /let junction = null;/);
  assert.ok(lazyFactoryAt >= 0 && constructorAt > lazyFactoryAt);
  assert.equal(source.match(/createJunctionPlayer\(/g)?.length, 1);
  assert.match(source, /junction\?\.setSpeed/);
  assert.match(source, /junction\?\.setBrake/);
});

test("FRACTURE selection waits for a connected worklet and has an audible fallback", async () => {
  const source = await readFile(new URL("../src/audio-engine.js", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const readinessAt = source.indexOf("function prepareFracture()");
  const connectedAt = source.indexOf("node.connect(fractureGain)", readinessAt);
  const readyAt = source.indexOf('fractureReadyState = "ready"', readinessAt);
  assert.ok(readinessAt >= 0 && connectedAt > readinessAt && readyAt > connectedAt);
  assert.match(source, /typeof context\.audioWorklet\?\.addModule !== "function"/);
  assert.match(source, /return prepareFracture\(\)\.then\(async \(ready\) =>/);
  assert.match(source, /await ensureJunction\(\)\.setActive\(true, \{ externalEntranceFade: true \}\)/);
  assert.match(source, /if \(fractureReadyState !== "ready"\) \{/);
  assert.match(source, /FRACTURE is not yet audible/);
  assert.match(app, /try \{\s*audioRef\.current = createAudioEngine[\s\S]*?audio\.start-failed/);
  assert.match(
    app,
    /createAudioEngine\(\s*triggerPulse,\s*\(nextEffect\) => setActiveEffect\(QA_EFFECT \?\? nextEffect\),\s*handleScoreRecovery,/,
  );
  assert.match(app, /score\.runtime-recovered/);
});

test("the persistent music control exposes loading and restored fallback states", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /status: "loading", requestedScoreId/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /const selectedName = displayLabel\(selected\)/);
  assert.match(source, /`\$\{selectedName\} · Loading`/);
  assert.match(source, /`\$\{selectedName\} · Restored`/);
  assert.match(source, /`\$\{selectedName\} · Unavailable`/);
  assert.match(source, /score\.change-failed/);
});

test("music selection never reports a silent missing engine as ready", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /const engine = audioRef\.current;/);
  assert.match(source, /if \(!engine\) \{[\s\S]*?status: "unavailable"/);
  assert.match(source, /await engine\.setScore\(requestedScoreId\)/);
  assert.match(source, /catch \(error\) \{[\s\S]*?status: "unavailable"/);
  assert.doesNotMatch(source, /audioRef\.current\?\.setScore\(requestedScoreId\)/);
});

test("JUNCTION keeps displayed 20 sub-100 and begins OPEN at unity-rate territory", () => {
  for (const speed of [0, 0.5, 1.2, 4, 10, 19.9, 20]) {
    assert.equal(junctionSectionForSpeed(speed, speedToArrangementDrive(speed)), "rest");
  }
  assert.equal(
    junctionSectionForSpeed(
      NATIVE_GROOVE_SPEED_KMH,
      speedToArrangementDrive(NATIVE_GROOVE_SPEED_KMH),
    ),
    "open",
  );
  assert.equal(junctionSectionForSpeed(30, speedToArrangementDrive(30)), "enter");
});

test("every JUNCTION chord boundary closes within one rendered frame", () => {
  for (const bpm of [127, 135, 158, 160, 164, 168]) {
    const barFrames = Math.round((60 / bpm) * 4 * 48000);
    for (let bar = 0; bar < 8; bar += 1) {
      for (let step = 0; step < 16; step += 1) {
        const actual = junctionStepFrame(barFrames, bar, step);
        const expected = Math.round((bar + step / 16) * barFrames);
        assert.ok(
          Math.abs(actual - expected) <= 1,
          `${bpm} BPM bar ${bar} step ${step}: ${actual - expected} frames`,
        );
      }
    }
  }
});

test("the native JUNCTION player never changes an encoded performance playback rate", async () => {
  const source = await readFile(new URL("../src/junction-player.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\.playbackRate\s*[.=]/);
  assert.match(source, /NATIVE|native/i);
});

test("the JUNCTION low-speed synthesis is consonant, high-register and softly produced", () => {
  const pitchClass = (frequency) => Math.round(69 + 12 * Math.log2(frequency / 440)) % 12;
  const allowedByChord = {
    Emin9: new Set([4, 7, 11, 2, 6]),
    Cmaj7: new Set([0, 4, 7, 11]),
    Amin7: new Set([9, 0, 4, 7]),
    Bmin9: new Set([11, 2, 6, 9, 1]),
  };
  for (const chord of JUNCTION_LOW_SPEED_CHORDS) {
    assert.ok(Math.min(...chord.frequencies) >= 261, `${chord.id} entered the bass register`);
    for (const frequency of chord.frequencies) {
      assert.ok(allowedByChord[chord.chord].has(pitchClass(frequency)), `${chord.id}: ${frequency} Hz`);
    }
  }
  assert.equal(new Set(JUNCTION_PARK_HOLD_SECONDS).size, JUNCTION_LOW_SPEED_CHORDS.length);
  assert.ok(Math.min(...JUNCTION_PARK_HOLD_SECONDS) >= JUNCTION_PARK_CROSSFADE_SECONDS * 2.5);
  assert.ok(Math.max(
    JUNCTION_LOW_SPEED_LEVELS.park,
    JUNCTION_LOW_SPEED_LEVELS.depart,
    JUNCTION_LOW_SPEED_LEVELS.creep,
    JUNCTION_LOW_SPEED_LEVELS.roll,
  ) <= 0.045);
  assert.ok(JUNCTION_LOW_SPEED_LEVELS.ambienceWet <= 0.2);
  assert.ok(JUNCTION_LOW_SPEED_LEVELS.ambienceFeedback <= 0.15);
  assert.equal(JUNCTION_DEPARTURE_GESTURE.length, 2);
  for (const event of JUNCTION_DEPARTURE_GESTURE) {
    assert.ok(event.attackSeconds >= 0.4, "departure attack is exposed as a ping");
    assert.ok(event.releaseSeconds >= 2.5, "departure has no produced tail");
    assert.ok(event.peak <= 0.11, "departure gesture is too prominent");
    assert.ok(allowedByChord.Emin9.has(pitchClass(event.frequency)));
  }
});

test("JUNCTION PARK's unfiltered reference stays extremely polite and clip-safe", (context) => {
  const sampleRate = 12000;
  const durationSeconds = JUNCTION_PARK_HOLD_SECONDS.reduce((sum, value) => sum + value, 0);
  let sumSquares = 0;
  let peak = 0;
  let elapsed = 0;
  let boundary = JUNCTION_PARK_HOLD_SECONDS[0];
  let voicingIndex = 0;
  const voiceWeights = [0.9, 0.78, 0.66, 0.54];
  for (let frame = 0; frame < Math.round(durationSeconds * sampleRate); frame += 1) {
    const time = frame / sampleRate;
    while (time >= boundary && voicingIndex < JUNCTION_LOW_SPEED_CHORDS.length - 1) {
      elapsed = boundary;
      voicingIndex += 1;
      boundary += JUNCTION_PARK_HOLD_SECONDS[voicingIndex];
    }
    const transition = Math.min(1, Math.max(0, (time - elapsed) / JUNCTION_PARK_CROSSFADE_SECONDS));
    const expressionPhase = Math.min(1, Math.max(0, (time - elapsed) / JUNCTION_PARK_HOLD_SECONDS[voicingIndex]));
    const expression = 0.84 + Math.sin(expressionPhase * Math.PI) * 0.12;
    const renderVoicing = (index) => JUNCTION_LOW_SPEED_CHORDS[index].frequencies.reduce((sum, frequency, voiceIndex) => {
      const phase = time * frequency * Math.PI * 2 + voiceIndex * 0.37;
      const oscillator = voiceIndex % 2 === 0
        ? Math.sin(phase)
        : (2 / Math.PI) * Math.asin(Math.sin(phase));
      return sum + oscillator * voiceWeights[voiceIndex];
    }, 0);
    const current = renderVoicing(voicingIndex);
    const previous = voicingIndex > 0 ? renderVoicing(voicingIndex - 1) : current;
    const mixed = previous * (1 - transition) + current * transition;
    const sample = mixed * expression * JUNCTION_LOW_SPEED_LEVELS.voice
      * JUNCTION_LOW_SPEED_LEVELS.park * 0.9;
    sumSquares += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  const rms = Math.sqrt(sumSquares / Math.round(durationSeconds * sampleRate));
  const rmsDb = 20 * Math.log10(rms);
  const peakDb = 20 * Math.log10(peak);
  context.diagnostic(`JUNCTION PARK reference: ${rmsDb.toFixed(3)} dBFS RMS, ${peakDb.toFixed(3)} dBFS peak`);
  assert.ok(rmsDb >= -55 && rmsDb <= -38, `PARK reference level escaped its polite window (${rmsDb.toFixed(2)} dBFS RMS)`);
  assert.ok(peakDb <= -30, `PARK reference peak became intrusive (${peakDb.toFixed(2)} dBFS)`);
  assert.ok(peak < 1, "PARK reference clipped");
});

test("FRACTURE renders evolving PARK harmony, then the quiet two-chord low-speed form", () => {
  const sampleRate = 8000;
  const render = (core, speed, seconds) => {
    core.observe(speed, 0.5);
    const frames = Math.round(sampleRate * seconds);
    const left = new Float32Array(frames);
    const right = new Float32Array(frames);
    core.process(left, right, frames);
    return { left, snapshot: core.snapshot() };
  };

  const parkedCore = createScoreCore({ sampleRate });
  const parked = render(parkedCore, 0, 8);
  assert.equal(parked.snapshot.motionLane, "PARK");
  assert.equal(parked.snapshot.chord, parked.snapshot.parkVoicing);
  assert.ok(parked.snapshot.parkVoicingChanges >= 1);
  assert.equal(parked.snapshot.perceivedTempo, null);
  assert.equal(parked.snapshot.beat, false);
  assert.equal(parked.snapshot.bass, false);
  assert.deepEqual(parked.snapshot.activeLanes, ["atmosphere"]);
  assert.ok(parked.left.some((sample) => Math.abs(sample) > 1e-5), "PARK harmony must remain audible");

  const departingCore = createScoreCore({ sampleRate });
  const departing = render(departingCore, 1.2, 1.6);
  assert.equal(departing.snapshot.motionLane, "DEPART");
  assert.equal(departing.snapshot.departureEventsPlayed, 2);
  render(departingCore, 1.1, 1);
  assert.equal(departingCore.snapshot().departureEventsPlayed, 2, "jitter retriggered departure");

  const creepCore = createScoreCore({ sampleRate });
  const creep = render(creepCore, 4, 3.3);
  assert.equal(creep.snapshot.motionLane, "CREEP");
  assert.equal(creep.snapshot.chord, "Dbmaj7");
  assert.ok(creep.snapshot.perceivedTempo <= 100);
  assert.equal(creep.snapshot.bass, false);

  const rollCore = createScoreCore({ sampleRate });
  const roll = render(rollCore, 19.9, 1);
  assert.equal(roll.snapshot.motionLane, "ROLL");
  assert.ok(roll.snapshot.perceivedTempo <= 100);
  assert.equal(roll.snapshot.bass, false);

  const exactThresholdCore = createScoreCore({ sampleRate });
  exactThresholdCore.observe(20, 0.04);
  assert.equal(exactThresholdCore.snapshot().motionLane, "ROLL");
  assert.ok(exactThresholdCore.snapshot().perceivedTempo <= 100);
  exactThresholdCore.observe(NATIVE_GROOVE_SPEED_KMH, 0.04);
  assert.equal(exactThresholdCore.snapshot().motionLane, "ROLL");
  assert.ok(exactThresholdCore.snapshot().perceivedTempo <= 100);

  const fastCore = createScoreCore({ sampleRate });
  const belowFast = render(fastCore, 87.9, 8);
  assert.equal(belowFast.snapshot.motionLane, "ROLL");
  assert.equal(belowFast.snapshot.halfTime, true);
  assert.ok(belowFast.snapshot.perceivedTempo <= 100);
  const full = render(fastCore, 100, 10);
  assert.equal(full.snapshot.motionLane, "DRIVE");
  assert.equal(full.snapshot.rhythmLabel, "FULL BREAK");
  assert.equal(full.snapshot.halfTime, false);
  assert.ok(full.snapshot.perceivedTempo >= 160);
});

test("a stale speed interval clears acceleration instead of refreshing it", () => {
  const fresh = nextVehicleRate({
    previousRateMps2: 0,
    previousSpeedKmh: 10,
    nextSpeedKmh: 12,
    elapsedMs: 200,
  });
  assert.ok(fresh.rateMps2 > 0);
  assert.equal(fresh.stale, false);

  const stale = nextVehicleRate({
    previousRateMps2: fresh.rateMps2,
    previousSpeedKmh: 12,
    nextSpeedKmh: 30,
    elapsedMs: VEHICLE_RATE_STALE_MS + 1,
  });
  assert.deepEqual(stale, { rateMps2: 0, stale: true });
});
