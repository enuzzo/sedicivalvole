// Shared low-speed musical policy for both Flux scores.
//
// The transport may keep a faster private clock, but the listener only hears the
// tactus reported here. PARK is deliberately clockless: a quiet ambient field,
// no bass and no percussion. FRACTURE voice-leads that field slowly; JUNCTION
// may hold its authored safety-bed harmony. Neither establishes a tactus.

// Keep the displayed 20 km/h state inside the restrained sub-100-BPM layer.
// Native material may enter only once the vehicle has moved beyond it.
export const NATIVE_GROOVE_SPEED_KMH = 21;
export const DEPART_ARM_SPEED_KMH = 1.2;
export const DEPART_END_SPEED_KMH = 4;
export const DEPART_REARM_SPEED_KMH = 0.5;
export const DEPART_REARM_SECONDS = 3;
export const JUNCTION_CREEP_BPM = 127 * (2 / 3);

const POLICY = Object.freeze({
  park: Object.freeze({
    id: "park",
    label: "PARK",
    perceivedBpm: null,
    transportBpm: null,
    harmony: "ambient-field",
    beat: false,
    bass: false,
    departureEvents: 0,
  }),
  depart: Object.freeze({
    id: "depart",
    label: "DEPART",
    perceivedBpm: null,
    transportBpm: null,
    harmony: "constant",
    beat: false,
    bass: false,
    departureEvents: 2,
  }),
  creep: Object.freeze({
    id: "creep",
    label: "CREEP",
    perceivedBpm: JUNCTION_CREEP_BPM,
    transportBpm: JUNCTION_CREEP_BPM,
    harmony: "micro-progression",
    beat: false,
    bass: false,
    departureEvents: 0,
  }),
  roll: Object.freeze({
    id: "roll",
    label: "ROLL",
    perceivedBpm: JUNCTION_CREEP_BPM,
    transportBpm: JUNCTION_CREEP_BPM,
    harmony: "micro-progression",
    beat: true,
    bass: false,
    departureEvents: 0,
  }),
  native: Object.freeze({
    id: "native",
    label: "NATIVE",
    perceivedBpm: null,
    transportBpm: null,
    harmony: "authored-form",
    beat: true,
    bass: true,
    departureEvents: 0,
  }),
});

/** Deterministic musical state for the agreed 0–30 km/h map. */
export function lowSpeedPolicy(speedKmh) {
  const speed = Math.max(0, Number(speedKmh) || 0);
  if (speed < 0.8) return POLICY.park;
  if (speed < 4) return POLICY.depart;
  if (speed < 10) return POLICY.creep;
  if (speed < NATIVE_GROOVE_SPEED_KMH) return POLICY.roll;
  return POLICY.native;
}

export function createDepartureGate() {
  return {
    armed: true,
    belowRearmSeconds: 0,
    hasObservation: false,
    launches: 0,
    previousSpeedKmh: 0,
  };
}

/**
 * One launch produces exactly one bounded two-event gesture. GPS noise cannot
 * retrigger it: the gate must remain below 0.5 km/h for three seconds first.
 */
export function advanceDepartureGate(state, speedKmh, deltaSeconds) {
  const speed = Math.max(0, Number(speedKmh) || 0);
  const delta = Math.max(0, Number(deltaSeconds) || 0);
  const firstObservation = !state.hasObservation;
  const crossedDepartureThreshold = state.previousSpeedKmh < DEPART_ARM_SPEED_KMH
    && speed >= DEPART_ARM_SPEED_KMH
    && (!firstObservation || speed < DEPART_END_SPEED_KMH);
  if (speed <= DEPART_REARM_SPEED_KMH) {
    state.belowRearmSeconds += delta;
    if (state.belowRearmSeconds >= DEPART_REARM_SECONDS) state.armed = true;
  } else {
    state.belowRearmSeconds = 0;
  }

  state.hasObservation = true;
  state.previousSpeedKmh = speed;
  if (state.armed && crossedDepartureThreshold) {
    state.armed = false;
    state.belowRearmSeconds = 0;
    state.launches += 1;
    return POLICY.depart.departureEvents;
  }

  // A first observation already above DEPART describes a moving car, not a
  // launch. Disarm it so braking back through 1.2 km/h cannot play the gesture
  // backwards; PARK must explicitly re-arm the next genuine pull-away.
  if (speed >= DEPART_END_SPEED_KMH) state.armed = false;
  return 0;
}

/** FRACTURE reports the audible tactus, including half-time native scenes. */
export function perceivedFractureBpm(speedKmh, transportBpm, nativeHalfTime = false) {
  const policy = lowSpeedPolicy(speedKmh);
  if (policy.id === "park" || policy.id === "depart") return null;
  const transport = Math.max(0, Number(transportBpm) || 0);
  return policy.id === "native" && !nativeHalfTime ? transport : transport * 0.5;
}

/**
 * Resolve the listener-facing tempo without turning an explicit clockless
 * state into zero or a guessed half-time number. Older snapshots that omit the
 * field still receive the historical half-time fallback.
 */
export function perceivedTempoFromSnapshot(snapshot, transportTempo = 0) {
  const hasExplicitTempo = Object.prototype.hasOwnProperty.call(
    snapshot ?? {},
    "perceivedTempo",
  );
  if (hasExplicitTempo) {
    return Number.isFinite(snapshot.perceivedTempo) ? snapshot.perceivedTempo : null;
  }
  const transport = Math.max(0, Number(transportTempo) || 0);
  return snapshot?.halfTime ? transport * 0.5 : transport;
}
