export const SCORE_SWITCH_CROSSFADE_SECONDS = 4;
const CURVE_SAMPLES = 65;
const FRACTURE_ANGLE = 0;
const JUNCTION_ANGLE = Math.PI * 0.5;

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
  const angle = activeScoreId === "junction" ? JUNCTION_ANGLE : FRACTURE_ANGLE;
  return { fromAngle: angle, toAngle: angle, startAt: at, endAt: at };
}

export function scoreCrossfadeAtTime(state, at) {
  const duration = state.endAt - state.startAt;
  const progress = duration > 0
    ? Math.min(1, Math.max(0, (at - state.startAt) / duration))
    : 1;
  const angle = state.fromAngle + (state.toAngle - state.fromAngle) * progress;
  return {
    angle,
    fracture: Math.cos(angle),
    junction: Math.sin(angle),
  };
}

function scoreGainCurve(fromAngle, toAngle, channel, samples = CURVE_SAMPLES) {
  const length = Math.max(2, Math.floor(Number(samples) || CURVE_SAMPLES));
  const curve = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const progress = index / (length - 1);
    const angle = fromAngle + (toAngle - fromAngle) * progress;
    curve[index] = channel === "fracture" ? Math.cos(angle) : Math.sin(angle);
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
  state,
  targetScoreId,
  startAt,
  durationSeconds = SCORE_SWITCH_CROSSFADE_SECONDS,
}) {
  const current = scoreCrossfadeAtTime(state, startAt);
  const targetAngle = targetScoreId === "junction" ? JUNCTION_ANGLE : FRACTURE_ANGLE;
  const angularDistance = Math.abs(targetAngle - current.angle);
  const duration = durationSeconds * angularDistance / JUNCTION_ANGLE;
  const fractureCurve = scoreGainCurve(current.angle, targetAngle, "fracture");
  const junctionCurve = scoreGainCurve(current.angle, targetAngle, "junction");
  replaceGainAutomation(fractureParam, current.fracture, fractureCurve, startAt, duration);
  replaceGainAutomation(junctionParam, current.junction, junctionCurve, startAt, duration);
  return {
    fromAngle: current.angle,
    toAngle: targetAngle,
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
