import {
  advanceDepartureGate,
  createDepartureGate,
  JUNCTION_CREEP_BPM,
  lowSpeedPolicy,
  NATIVE_GROOVE_SPEED_KMH,
} from "./low-speed-score.js";

const HARMONIC_HOLD_SECONDS = (60 / JUNCTION_CREEP_BPM) * 8;
const CHORD_CROSSFADE_SECONDS = 1.1;
export const JUNCTION_PARK_CROSSFADE_SECONDS = 3.6;
export const JUNCTION_PARK_HOLD_SECONDS = Object.freeze([11.3, 14.7, 9.8, 13.1, 10.6, 15.4]);

export const JUNCTION_LOW_SPEED_LEVELS = Object.freeze({
  park: 0.025,
  depart: 0.032,
  creep: 0.036,
  roll: 0.041,
  voice: 0.1,
  ambienceWet: 0.16,
  ambienceFeedback: 0.12,
});

// No voice enters the bass register. These are root-light inversions of the
// same E minor / C major / A minor / B minor grammar as the native score. PARK
// can therefore breathe through a real form without creating a second piece or
// making the later transition harmonically false.
export const JUNCTION_LOW_SPEED_CHORDS = Object.freeze([
  Object.freeze({ id: "Emin9", chord: "Emin9", cutoffHz: 1320, frequencies: Object.freeze([391.995, 493.883, 587.330, 739.989]) }),
  Object.freeze({ id: "Cmaj7", chord: "Cmaj7", cutoffHz: 1540, frequencies: Object.freeze([329.628, 391.995, 523.251, 987.767]) }),
  Object.freeze({ id: "Amin7/E", chord: "Amin7", cutoffHz: 1180, frequencies: Object.freeze([329.628, 391.995, 440.000, 523.251]) }),
  Object.freeze({ id: "Bmin9/D", chord: "Bmin9", cutoffHz: 1420, frequencies: Object.freeze([293.665, 369.994, 440.000, 554.365]) }),
  Object.freeze({ id: "Emin9/E", chord: "Emin9", cutoffHz: 1080, frequencies: Object.freeze([329.628, 493.883, 587.330, 783.991]) }),
  Object.freeze({ id: "Cmaj7/C", chord: "Cmaj7", cutoffHz: 1660, frequencies: Object.freeze([261.626, 391.995, 493.883, 659.255]) }),
]);

export const JUNCTION_DEPARTURE_GESTURE = Object.freeze([
  Object.freeze({ delaySeconds: 0.12, frequency: 987.767, peak: 0.105, attackSeconds: 0.46, releaseSeconds: 2.7 }),
  Object.freeze({ delaySeconds: 1.34, frequency: 739.989, peak: 0.082, attackSeconds: 0.52, releaseSeconds: 2.85 }),
]);

function setTarget(param, value, time, seconds) {
  // `cancelScheduledValues` can restore the value from before an active
  // automation and create a discontinuity. Hold the computed value at this
  // audio-clock instant before steering toward the new target. The fallback
  // snapshots AudioParam.value for older engines that lack cancelAndHoldAtTime.
  if (typeof param.cancelAndHoldAtTime === "function") {
    param.cancelAndHoldAtTime(time);
  } else if (typeof param.cancelScheduledValues === "function") {
    const heldValue = param.value;
    param.cancelScheduledValues(time);
    param.setValueAtTime?.(heldValue, time);
  }
  param.setTargetAtTime(value, time, Math.max(0.01, seconds / 4));
}

export function createJunctionLowSpeedBed(context, destination) {
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const ambienceDelay = context.createDelay(0.5);
  const ambienceFeedback = context.createGain();
  const ambienceWet = context.createGain();
  const chordGains = JUNCTION_LOW_SPEED_CHORDS.map(() => context.createGain());
  const expression = context.createGain();
  const groupFilters = [];
  const oscillators = [];
  const gestureNodes = new Set();
  const departureGate = createDepartureGate();
  let active = false;
  let nativeReady = false;
  let speed = 0;
  let policy = lowSpeedPolicy(0);
  let progressionStartedAt = context.currentTime;
  let nextParkChangeAt = context.currentTime + JUNCTION_PARK_HOLD_SECONDS[0];
  let parkVoiceScheduled = false;
  let parkVoicingChanges = 0;
  let lastDepartureUpdateAt = context.currentTime;
  let chordIndex = 0;
  let departureEventsPlayed = 0;
  let currentLevel = 0;

  master.gain.value = 0;
  filter.type = "lowpass";
  filter.frequency.value = 1450;
  filter.Q.value = 0.35;
  ambienceDelay.delayTime.value = 0.21;
  ambienceFeedback.gain.value = JUNCTION_LOW_SPEED_LEVELS.ambienceFeedback;
  ambienceWet.gain.value = JUNCTION_LOW_SPEED_LEVELS.ambienceWet;
  expression.gain.value = 0.88;
  master.connect(expression).connect(filter);
  filter.connect(destination);
  filter.connect(ambienceDelay);
  ambienceDelay.connect(ambienceWet).connect(destination);
  ambienceDelay.connect(ambienceFeedback).connect(ambienceDelay);

  for (let groupIndex = 0; groupIndex < JUNCTION_LOW_SPEED_CHORDS.length; groupIndex += 1) {
    const group = chordGains[groupIndex];
    const groupFilter = context.createBiquadFilter();
    group.gain.value = groupIndex === 0 ? 1 : 0;
    groupFilter.type = "lowpass";
    groupFilter.frequency.value = JUNCTION_LOW_SPEED_CHORDS[groupIndex].cutoffHz;
    groupFilter.Q.value = 0.28 + (groupIndex % 3) * 0.08;
    group.connect(groupFilter).connect(master);
    groupFilters.push(groupFilter);
    for (let voiceIndex = 0; voiceIndex < JUNCTION_LOW_SPEED_CHORDS[groupIndex].frequencies.length; voiceIndex += 1) {
      const oscillator = context.createOscillator();
      const voiceGain = context.createGain();
      oscillator.type = voiceIndex % 2 === 0 ? "sine" : "triangle";
      oscillator.frequency.value = JUNCTION_LOW_SPEED_CHORDS[groupIndex].frequencies[voiceIndex];
      if (oscillator.detune) oscillator.detune.value = voiceIndex % 2 === 0 ? -2 : 2;
      voiceGain.gain.value = JUNCTION_LOW_SPEED_LEVELS.voice * [0.9, 0.78, 0.66, 0.54][voiceIndex];
      oscillator.connect(voiceGain).connect(group);
      oscillator.start();
      oscillators.push(oscillator);
    }
  }

  function scheduleParkBreath(time = context.currentTime) {
    const holdSeconds = JUNCTION_PARK_HOLD_SECONDS[chordIndex];
    if (typeof expression.gain.cancelAndHoldAtTime === "function") {
      expression.gain.cancelAndHoldAtTime(time);
    } else {
      expression.gain.cancelScheduledValues?.(time);
      expression.gain.setValueAtTime?.(expression.gain.value, time);
    }
    // Value curves cannot be interrupted reliably in Chromium: scheduling a
    // new curve while the previous curve's duration is still active throws.
    // Plain ramps preserve the same breath and remain cancellable on an early
    // stop/re-entry or delayed scheduler tick.
    const breath = [0.84, 0.93, 0.88, 0.98, 0.87];
    for (let index = 0; index < breath.length; index += 1) {
      expression.gain.linearRampToValueAtTime(
        breath[index],
        time + ((index + 1) / breath.length) * Math.max(1, holdSeconds - 0.12),
      );
    }
    setTarget(filter.frequency, JUNCTION_LOW_SPEED_CHORDS[chordIndex].cutoffHz, time, 4.8);
    parkVoiceScheduled = true;
  }

  function applyChord(nextIndex, time = context.currentTime, parkTransition = false) {
    if (nextIndex === chordIndex) return;
    chordIndex = nextIndex;
    for (let index = 0; index < chordGains.length; index += 1) {
      setTarget(
        chordGains[index].gain,
        index === chordIndex ? 1 : 0,
        time,
        parkTransition ? JUNCTION_PARK_CROSSFADE_SECONDS : CHORD_CROSSFADE_SECONDS,
      );
    }
    if (parkTransition) scheduleParkBreath(time);
  }

  function triggerDeparture(time = context.currentTime) {
    for (const event of JUNCTION_DEPARTURE_GESTURE) {
      const at = time + event.delaySeconds;
      const firstLayer = context.createOscillator();
      const secondLayer = context.createOscillator();
      const firstLayerGain = context.createGain();
      const secondLayerGain = context.createGain();
      const colour = context.createBiquadFilter();
      const envelope = context.createGain();
      firstLayer.type = "sine";
      secondLayer.type = "triangle";
      firstLayer.frequency.value = event.frequency;
      secondLayer.frequency.value = event.frequency;
      if (firstLayer.detune) firstLayer.detune.value = -4;
      if (secondLayer.detune) secondLayer.detune.value = 4;
      firstLayerGain.gain.value = 0.58;
      secondLayerGain.gain.value = 0.34;
      colour.type = "lowpass";
      colour.frequency.value = Math.min(2400, event.frequency * 1.65);
      colour.Q.value = 0.42;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(event.peak, at + event.attackSeconds);
      envelope.gain.linearRampToValueAtTime(
        event.peak * 0.68,
        at + event.attackSeconds + 0.72,
      );
      envelope.gain.linearRampToValueAtTime(0, at + event.releaseSeconds);
      firstLayer.connect(firstLayerGain).connect(colour);
      secondLayer.connect(secondLayerGain).connect(colour);
      colour.connect(envelope).connect(master);
      firstLayer.start(at);
      secondLayer.start(at);
      firstLayer.stop(at + event.releaseSeconds + 0.02);
      secondLayer.stop(at + event.releaseSeconds + 0.02);
      const nodes = [firstLayer, secondLayer, firstLayerGain, secondLayerGain, colour, envelope];
      gestureNodes.add(nodes);
      firstLayer.onended = () => {
        for (const node of nodes) node.disconnect();
        gestureNodes.delete(nodes);
      };
      secondLayer.onended = () => {
        // The first layer owns cleanup; keeping this handler empty makes both
        // scheduled voices explicit without disconnecting the shared filter twice.
      };
    }
    departureEventsPlayed += JUNCTION_DEPARTURE_GESTURE.length;
  }

  function advanceDepartureClock(time = context.currentTime) {
    const nextTime = Math.max(lastDepartureUpdateAt, Number(time) || 0);
    const elapsedSeconds = nextTime - lastDepartureUpdateAt;
    lastDepartureUpdateAt = nextTime;
    const departureEvents = advanceDepartureGate(
      departureGate,
      speed,
      elapsedSeconds,
    );
    if (active && departureEvents > 0) triggerDeparture(nextTime);
  }

  function applyLevel(time = context.currentTime) {
    const level = !active || (policy.id === "native" && nativeReady)
      ? 0
      : JUNCTION_LOW_SPEED_LEVELS[policy.id] ?? JUNCTION_LOW_SPEED_LEVELS.roll;
    if (Math.abs(level - currentLevel) < 1e-9) return;
    currentLevel = level;
    setTarget(master.gain, level, time, policy.id === "native" ? 0.55 : 0.8);
  }

  function tick(time = context.currentTime) {
    // Re-arming belongs to elapsed stopped time, not to the cadence of GPS or
    // React state updates. A stable 0 km/h reading may not change for minutes.
    advanceDepartureClock(time);
    if (policy.id === "park") {
      if (!parkVoiceScheduled) scheduleParkBreath(time);
      let nextIndex = chordIndex;
      if (time >= nextParkChangeAt) {
        nextIndex = (nextIndex + 1) % JUNCTION_LOW_SPEED_CHORDS.length;
        nextParkChangeAt = time + JUNCTION_PARK_HOLD_SECONDS[nextIndex];
        parkVoicingChanges += 1;
      }
      applyChord(nextIndex, time, true);
      return;
    }
    if (policy.harmony !== "micro-progression") {
      return;
    }
    const elapsed = Math.max(0, time - progressionStartedAt);
    applyChord(
      Math.floor(elapsed / HARMONIC_HOLD_SECONDS) % JUNCTION_LOW_SPEED_CHORDS.length,
      time,
    );
  }

  return {
    setActive(nextActive) {
      advanceDepartureClock();
      active = Boolean(nextActive);
      if (active && policy.id === "park" && !parkVoiceScheduled) {
        nextParkChangeAt = context.currentTime + JUNCTION_PARK_HOLD_SECONDS[chordIndex];
        scheduleParkBreath();
      }
      applyLevel();
    },

    setSpeed(nextSpeed, _deltaSeconds = 0, forceNative = false) {
      // First account for the time spent at the previous speed, then apply the
      // new observation with zero elapsed time so a threshold crossing remains
      // a single event and stationary time is never double-counted.
      advanceDepartureClock();
      speed = Math.max(0, Number(nextSpeed) || 0);
      const nextPolicy = forceNative
        ? lowSpeedPolicy(NATIVE_GROOVE_SPEED_KMH)
        : lowSpeedPolicy(speed);
      const previousPolicy = policy;
      if (policy.harmony !== "micro-progression" && nextPolicy.harmony === "micro-progression") {
        progressionStartedAt = context.currentTime;
        applyChord(0);
      }
      policy = nextPolicy;
      if (policy.id === "park" && previousPolicy.id !== "park") {
        parkVoiceScheduled = false;
        const nextParkIndex = (chordIndex + 1) % JUNCTION_LOW_SPEED_CHORDS.length;
        nextParkChangeAt = context.currentTime + JUNCTION_PARK_HOLD_SECONDS[nextParkIndex];
        parkVoicingChanges += 1;
        applyChord(nextParkIndex, context.currentTime, true);
      }
      if (policy.id !== "native") nativeReady = false;
      const departureEvents = advanceDepartureGate(
        departureGate,
        speed,
        0,
      );
      if (active && departureEvents > 0) triggerDeparture();
      applyLevel();
      tick();
    },

    setNativeReady(ready) {
      nativeReady = Boolean(ready);
      applyLevel();
    },

    tick,

    snapshot() {
      return {
        lowSpeedState: policy.id,
        perceivedTempo: policy.perceivedBpm,
        transportTempo: policy.transportBpm,
        beat: policy.id === "native" ? policy.beat : false,
        bass: policy.bass,
        parkHarmony: JUNCTION_LOW_SPEED_CHORDS[chordIndex].chord,
        parkVoicing: JUNCTION_LOW_SPEED_CHORDS[chordIndex].id,
        parkVoicingChanges,
        lowSpeedHarmony: JUNCTION_LOW_SPEED_CHORDS[chordIndex].id,
        lowSpeedLevel: currentLevel,
        departureEventsPlayed,
        departureArmed: departureGate.armed,
        speedKmh: speed,
      };
    },

    destroy() {
      for (const nodes of gestureNodes) {
        for (const node of nodes) {
          try { node.stop?.(); } catch {}
          node.disconnect();
        }
      }
      gestureNodes.clear();
      for (const oscillator of oscillators) {
        try { oscillator.stop(); } catch {}
        oscillator.disconnect();
      }
      for (const gain of chordGains) gain.disconnect();
      for (const groupFilter of groupFilters) groupFilter.disconnect();
      master.disconnect();
      expression.disconnect();
      filter.disconnect();
      ambienceDelay.disconnect();
      ambienceFeedback.disconnect();
      ambienceWet.disconnect();
    },
  };
}

export const JUNCTION_LOW_SPEED_HARMONIC_HOLD_SECONDS = HARMONIC_HOLD_SECONDS;
