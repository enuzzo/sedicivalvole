export const SOUNDTRACK_TRANSITION_SCHEMA = "sedicivalvole.soundtrack-transition.v1";
export const SOUNDTRACK_SKIP_CROSSFADE_SECONDS = 0.45;
export const SOUNDTRACK_TRANSITION_TRACK_LIMIT = 3;

const CURVE_SAMPLES = 65;
const MAX_TRANSITION_ANGLE = Math.PI * 0.5;
const GAIN_EPSILON = 1e-9;

const asKey = (value) => typeof value === "string" ? value.trim() : "";

const asTime = (value, fallback = 0) => Number.isFinite(value)
  ? Math.max(0, value)
  : fallback;

const freezeGains = (gains) => Object.freeze(Object.fromEntries(
  Object.entries(gains)
    .filter(([key, value]) => asKey(key) && Number.isFinite(value))
    .map(([key, value]) => [key, Math.max(0, value)]),
));

const gainKeys = (...vectors) => [...new Set(
  vectors.flatMap((vector) => Object.keys(vector ?? {})),
)];

const vectorPower = (gains) => Object.values(gains).reduce(
  (sum, gain) => sum + gain ** 2,
  0,
);

function normalizeGains(gains) {
  const power = vectorPower(gains);
  if (power <= GAIN_EPSILON) return null;
  const scale = 1 / Math.sqrt(power);
  return Object.fromEntries(
    Object.entries(gains).map(([key, gain]) => [key, gain * scale]),
  );
}

function sphericalGains(fromGains, toGains, progress) {
  const position = Math.min(1, Math.max(0, Number(progress) || 0));
  const keys = gainKeys(fromGains, toGains);
  const dot = keys.reduce(
    (sum, key) => sum + (fromGains[key] ?? 0) * (toGains[key] ?? 0),
    0,
  );
  const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
  if (angle < GAIN_EPSILON) return { ...toGains };
  const denominator = Math.sin(angle);
  const outgoing = Math.sin((1 - position) * angle) / denominator;
  const incoming = Math.sin(position * angle) / denominator;
  return Object.fromEntries(keys.map((key) => [
    key,
    (fromGains[key] ?? 0) * outgoing + (toGains[key] ?? 0) * incoming,
  ]));
}

function freezeTransition({
  fromGains,
  toGains,
  targetKey,
  startAt,
  endAt,
  revision,
}) {
  return Object.freeze({
    schema: SOUNDTRACK_TRANSITION_SCHEMA,
    fromGains: freezeGains(fromGains),
    toGains: freezeGains(toGains),
    targetKey,
    startAt,
    endAt,
    durationSeconds: Math.max(0, endAt - startAt),
    revision: Math.max(0, Math.trunc(revision)),
    trackLimit: SOUNDTRACK_TRANSITION_TRACK_LIMIT,
    transitionKind: "equal-power",
    automaticModeFallback: false,
    persistentAudioStorage: false,
  });
}

export function createSoundtrackTransitionState(activeKey, at = 0) {
  const key = asKey(activeKey);
  if (!key) return null;
  const startAt = asTime(at);
  return freezeTransition({
    fromGains: { [key]: 1 },
    toGains: { [key]: 1 },
    targetKey: key,
    startAt,
    endAt: startAt,
    revision: 0,
  });
}

export function sampleSoundtrackTransition(state, at) {
  if (state?.schema !== SOUNDTRACK_TRANSITION_SCHEMA) {
    return Object.freeze({
      status: "invalid",
      targetKey: null,
      dominantKey: null,
      progress: 0,
      gains: Object.freeze({}),
      powerSquared: 0,
      automaticModeFallback: false,
    });
  }
  const time = asTime(at, state.startAt);
  const duration = state.endAt - state.startAt;
  const progress = duration > 0
    ? Math.min(1, Math.max(0, (time - state.startAt) / duration))
    : 1;
  const gains = freezeGains(sphericalGains(state.fromGains, state.toGains, progress));
  const dominantKey = Object.entries(gains).reduce(
    (winner, candidate) => candidate[1] > (winner?.[1] ?? -1) ? candidate : winner,
    null,
  )?.[0] ?? null;
  return Object.freeze({
    status: time < state.startAt
      ? "scheduled"
      : time < state.endAt ? "active" : "complete",
    targetKey: state.targetKey,
    dominantKey,
    progress,
    gains,
    powerSquared: vectorPower(gains),
    automaticModeFallback: false,
  });
}

export function scheduleSoundtrackTransition({
  state,
  targetKey,
  startAt,
  durationSeconds = SOUNDTRACK_SKIP_CROSSFADE_SECONDS,
} = {}) {
  if (state?.schema !== SOUNDTRACK_TRANSITION_SCHEMA) {
    return Object.freeze({ state, blockedReason: "invalid-transition-state" });
  }
  const target = asKey(targetKey);
  if (!target) return Object.freeze({ state, blockedReason: "invalid-target" });

  const at = asTime(startAt, state.endAt);
  const sampled = sampleSoundtrackTransition(state, at);
  const nonZeroGains = Object.fromEntries(
    Object.entries(sampled.gains).filter(([, gain]) => gain > GAIN_EPSILON),
  );
  const normalizedFrom = normalizeGains(nonZeroGains);
  if (!normalizedFrom) return Object.freeze({ state, blockedReason: "no-active-track" });

  const keys = gainKeys(normalizedFrom, { [target]: 1 });
  if (keys.length > SOUNDTRACK_TRANSITION_TRACK_LIMIT) {
    return Object.freeze({ state, blockedReason: "transition-track-limit" });
  }

  const toGains = Object.fromEntries(keys.map((key) => [key, key === target ? 1 : 0]));
  const fromGains = Object.fromEntries(keys.map((key) => [key, normalizedFrom[key] ?? 0]));
  const dot = keys.reduce(
    (sum, key) => sum + fromGains[key] * toGains[key],
    0,
  );
  const angularDistance = Math.acos(Math.min(1, Math.max(-1, dot)));
  const baseDuration = Number.isFinite(durationSeconds)
    ? Math.max(0.01, durationSeconds)
    : SOUNDTRACK_SKIP_CROSSFADE_SECONDS;
  const duration = baseDuration * angularDistance / MAX_TRANSITION_ANGLE;
  const nextState = freezeTransition({
    fromGains,
    toGains,
    targetKey: target,
    startAt: at,
    endAt: at + duration,
    revision: state.revision + 1,
  });
  return Object.freeze({ state: nextState, blockedReason: null });
}

function gainCurve(state, key, samples = CURVE_SAMPLES) {
  const length = Math.max(2, Math.floor(Number(samples) || CURVE_SAMPLES));
  const curve = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const gains = sphericalGains(
      state.fromGains,
      state.toGains,
      index / (length - 1),
    );
    curve[index] = gains[key] ?? 0;
  }
  return curve;
}

const validParam = (param) => param
  && typeof param.cancelScheduledValues === "function"
  && typeof param.setValueAtTime === "function";

export function applySoundtrackTransitionGains(state, paramsByKey) {
  if (state?.schema !== SOUNDTRACK_TRANSITION_SCHEMA) {
    return Object.freeze({ ok: false, reason: "invalid-transition-state", schedules: Object.freeze([]) });
  }
  const keys = gainKeys(state.fromGains, state.toGains);
  if (!paramsByKey || keys.some((key) => !validParam(paramsByKey[key]))) {
    return Object.freeze({ ok: false, reason: "missing-gain-param", schedules: Object.freeze([]) });
  }
  if (state.durationSeconds > 0.001 && keys.some((key) => (
    typeof paramsByKey[key].setValueCurveAtTime !== "function"
      && typeof paramsByKey[key].linearRampToValueAtTime !== "function"
  ))) {
    return Object.freeze({ ok: false, reason: "missing-gain-ramp", schedules: Object.freeze([]) });
  }

  const schedules = [];
  for (const key of keys) {
    const param = paramsByKey[key];
    const curve = gainCurve(state, key);
    param.cancelScheduledValues(state.startAt);
    if (state.durationSeconds <= 0.001) {
      param.setValueAtTime(curve[curve.length - 1], state.startAt);
    } else if (typeof param.setValueCurveAtTime === "function") {
      param.setValueCurveAtTime(curve, state.startAt, state.durationSeconds);
    } else {
      param.setValueAtTime(curve[0], state.startAt);
      for (let index = 1; index < curve.length; index += 1) {
        param.linearRampToValueAtTime(
          curve[index],
          state.startAt + state.durationSeconds * index / (curve.length - 1),
        );
      }
    }
    schedules.push(Object.freeze({
      key,
      from: curve[0],
      to: curve[curve.length - 1],
      startAt: state.startAt,
      endAt: state.endAt,
    }));
  }
  return Object.freeze({ ok: true, reason: null, schedules: Object.freeze(schedules) });
}

export function shouldCompleteSoundtrackTransition({
  state,
  at,
  requestedKey,
  currentRevision,
} = {}) {
  return state?.schema === SOUNDTRACK_TRANSITION_SCHEMA
    && asTime(at, 0) >= state.endAt
    && asKey(requestedKey) === state.targetKey
    && Math.trunc(currentRevision) === state.revision;
}

export function settleSoundtrackTransition(options = {}) {
  const { state } = options;
  if (!shouldCompleteSoundtrackTransition(options)) {
    return Object.freeze({ state, completed: false });
  }
  const settled = freezeTransition({
    fromGains: { [state.targetKey]: 1 },
    toGains: { [state.targetKey]: 1 },
    targetKey: state.targetKey,
    startAt: state.endAt,
    endAt: state.endAt,
    revision: state.revision,
  });
  return Object.freeze({ state: settled, completed: true });
}
