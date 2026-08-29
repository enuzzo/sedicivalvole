export const SCORE_SWITCH_CROSSFADE_SECONDS = 4;
const CURVE_SAMPLES = 65;
const SCORE_IDS = Object.freeze(["fracture", "junction", "nightshift"]);
const MAX_SCORE_ANGLE = Math.PI * 0.5;

export function equalPowerCrossfade(progress) {
  const position = Math.min(1, Math.max(0, Number(progress) || 0));
  return {
    outgoing: Math.cos(position * Math.PI * 0.5),
    incoming: Math.sin(position * Math.PI * 0.5),
  };
}

export function equalPowerGainCurve(direction, samples = CURVE_SAMPLES) {
  const length = Math.max(2, Math.floor(Number(samples) || CURVE_SAMPLES));
  const curve = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const gains = equalPowerCrossfade(index / (length - 1));
    curve[index] = direction === "out" ? gains.outgoing : gains.incoming;
  }
  return curve;
}

export function scheduleEqualPowerGain(param, direction, startAt, durationSeconds) {
  const duration = Math.max(0.01, Number(durationSeconds) || SCORE_SWITCH_CROSSFADE_SECONDS);
  const curve = equalPowerGainCurve(direction);
  param.cancelScheduledValues?.(startAt);
  if (typeof param.setValueCurveAtTime === "function") {
    param.setValueCurveAtTime(curve, startAt, duration);
  } else {
    param.setValueAtTime(curve[0], startAt);
    param.linearRampToValueAtTime(curve[curve.length - 1], startAt + duration);
  }
  return {
    direction,
    from: curve[0],
    to: curve[curve.length - 1],
    startAt,
    endAt: startAt + duration,
  };
}

export function createScoreCrossfadeState(activeScoreId = "fracture", at = 0) {
  const gains = Object.fromEntries(SCORE_IDS.map((id) => [id, id === activeScoreId ? 1 : 0]));
  if (!SCORE_IDS.includes(activeScoreId)) gains.fracture = 1;
  return { fromGains: gains, toGains: gains, startAt: at, endAt: at };
}

function sphericalGains(from, to, progress) {
  const dot = SCORE_IDS.reduce((sum, id) => sum + from[id] * to[id], 0);
  const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
  if (angle < 1e-9) return { ...to };
  const denominator = Math.sin(angle);
  const outgoing = Math.sin((1 - progress) * angle) / denominator;
  const incoming = Math.sin(progress * angle) / denominator;
  return Object.fromEntries(SCORE_IDS.map((id) => [id, from[id] * outgoing + to[id] * incoming]));
}

export function scoreCrossfadeAtTime(state, at) {
  const duration = state.endAt - state.startAt;
  const progress = duration > 0
    ? Math.min(1, Math.max(0, (at - state.startAt) / duration))
    : 1;
  const gains = sphericalGains(state.fromGains, state.toGains, progress);
  return { ...gains, angle: Math.atan2(gains.junction, gains.fracture) };
}

function scoreGainCurve(fromGains, toGains, channel, samples = CURVE_SAMPLES) {
  const length = Math.max(2, Math.floor(Number(samples) || CURVE_SAMPLES));
  const curve = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const progress = index / (length - 1);
    curve[index] = sphericalGains(fromGains, toGains, progress)[channel];
  }
  return curve;
}

function replaceGainAutomation(param, value, curve, startAt, duration) {
  // The explicit cancel makes rapid reversals legal: Web Audio rejects a new
  // automation event that overlaps a still-active value curve.
  param.cancelScheduledValues?.(startAt);
  if (duration <= 0.01) {
    param.setValueAtTime(curve[curve.length - 1], startAt);
  } else if (typeof param.setValueCurveAtTime === "function") {
    param.setValueCurveAtTime(curve, startAt, duration);
  } else {
    param.setValueAtTime(value, startAt);
    param.linearRampToValueAtTime(curve[curve.length - 1], startAt + duration);
  }
}

export function scheduleScoreCrossfade({
  fractureParam,
  junctionParam,
  nightshiftParam = null,
  state,
  targetScoreId,
  startAt,
  durationSeconds = SCORE_SWITCH_CROSSFADE_SECONDS,
}) {
  const current = scoreCrossfadeAtTime(state, startAt);
  const fromGains = Object.fromEntries(SCORE_IDS.map((id) => [id, current[id]]));
  const resolvedTarget = SCORE_IDS.includes(targetScoreId) ? targetScoreId : "fracture";
  const toGains = Object.fromEntries(SCORE_IDS.map((id) => [id, id === resolvedTarget ? 1 : 0]));
  const dot = SCORE_IDS.reduce((sum, id) => sum + fromGains[id] * toGains[id], 0);
  const angularDistance = Math.acos(Math.min(1, Math.max(-1, dot)));
  const duration = durationSeconds * angularDistance / MAX_SCORE_ANGLE;
  const fractureCurve = scoreGainCurve(fromGains, toGains, "fracture");
  const junctionCurve = scoreGainCurve(fromGains, toGains, "junction");
  const nightshiftCurve = scoreGainCurve(fromGains, toGains, "nightshift");
  replaceGainAutomation(fractureParam, current.fracture, fractureCurve, startAt, duration);
  replaceGainAutomation(junctionParam, current.junction, junctionCurve, startAt, duration);
  if (nightshiftParam) {
    replaceGainAutomation(nightshiftParam, current.nightshift, nightshiftCurve, startAt, duration);
  }
  return {
    fromGains,
    toGains,
    startAt,
    endAt: startAt + duration,
  };
}

/**
 * Schedule transition cleanup without making the score-selection promise wait
 * for the audible fade. The caller can therefore leave Signal Gate or update
 * the persistent selector as soon as the score is ready and the automation has
 * been accepted, while revision guards remain inside `onComplete`.
 */
export function scheduleScoreCrossfadeCompletion({
  transition,
  currentTime,
  schedule,
  shouldContinue = () => true,
  onComplete,
  result,
}) {
  const readCurrentTime = typeof currentTime === "function"
    ? currentTime
    : () => Number(currentTime) || 0;
  const review = () => {
    if (!shouldContinue()) return;
    const remainingMs = Math.max(0, (transition.endAt - readCurrentTime()) * 1000);
    if (remainingMs > 5) {
      schedule(review, Math.max(16, remainingMs));
      return;
    }
    onComplete();
  };
  const remainingMs = Math.max(0, (transition.endAt - readCurrentTime()) * 1000);
  if (shouldContinue()) schedule(review, remainingMs);
  return Promise.resolve(result);
}

export function shouldCompleteScoreCrossfade({
  running,
  requestedScoreId,
  targetScoreId,
  revision,
  currentRevision,
}) {
  return Boolean(running)
    && requestedScoreId === targetScoreId
    && revision === currentRevision;
}
