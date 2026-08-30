const RESPONSE_SCHEMA = "sedicivalvole.response.v1";
export const AUDIO_MACRO_SCHEMA = "sedicivalvole.audio-macros.v1";
export const AUDIO_MACRO_IDS = Object.freeze(["open", "underwater", "bloom"]);

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positive(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeOutput(value, dimensions, label) {
  const values = Array.isArray(value) ? value.map(Number) : [Number(value)];
  if (values.length !== dimensions || values.some((entry) => !Number.isFinite(entry))) {
    throw new TypeError(`${label} must contain ${dimensions} finite value${dimensions === 1 ? "" : "s"}`);
  }
  return values;
}

function normalizeRate(value, dimensions, fallback) {
  const values = Array.isArray(value) ? value : Array(dimensions).fill(value ?? fallback);
  if (values.length !== dimensions) {
    throw new TypeError(`response rate must contain ${dimensions} value${dimensions === 1 ? "" : "s"}`);
  }
  return values.map((entry) => {
    const number = Number(entry);
    if (number === Number.POSITIVE_INFINITY) return number;
    if (!Number.isFinite(number)) throw new TypeError("response rate must be finite or positive infinity");
    return Math.max(0, number);
  });
}

/**
 * Define a scalar-input response with either one scalar or a vector output.
 * The definition owns mapping and timing mechanics, never scene semantics.
 */
export function createResponseDefinition({
  input = [0, 1],
  output = [0, 1],
  exponent = 1,
  attackSeconds = 0,
  releaseSeconds = attackSeconds,
  risePerSecond = Number.POSITIVE_INFINITY,
  fallPerSecond = risePerSecond,
} = {}) {
  if (!Array.isArray(input) || input.length !== 2) {
    throw new TypeError("response input must be a two-value range");
  }
  const inputMinimum = finite(input[0], Number.NaN);
  const inputMaximum = finite(input[1], Number.NaN);
  if (!Number.isFinite(inputMinimum) || !Number.isFinite(inputMaximum) || inputMaximum <= inputMinimum) {
    throw new RangeError("response input range must be finite and increasing");
  }

  const vectorOutput = Array.isArray(output[0]) || Array.isArray(output[1]);
  const dimensions = vectorOutput
    ? Math.max(Array.isArray(output[0]) ? output[0].length : 0, Array.isArray(output[1]) ? output[1].length : 0)
    : 1;
  if (dimensions < 1) throw new RangeError("response output must have at least one dimension");
  const outputMinimum = normalizeOutput(output[0], dimensions, "response output minimum");
  const outputMaximum = normalizeOutput(output[1], dimensions, "response output maximum");
  const safeExponent = positive(exponent, 1);
  if (!(safeExponent > 0)) throw new RangeError("response exponent must be greater than zero");

  return Object.freeze({
    schema: RESPONSE_SCHEMA,
    dimensions,
    scalar: dimensions === 1,
    input: Object.freeze([inputMinimum, inputMaximum]),
    output: Object.freeze([
      Object.freeze(outputMinimum),
      Object.freeze(outputMaximum),
    ]),
    exponent: safeExponent,
    attackSeconds: positive(attackSeconds, 0),
    releaseSeconds: positive(releaseSeconds, positive(attackSeconds, 0)),
    risePerSecond: Object.freeze(normalizeRate(risePerSecond, dimensions, Number.POSITIVE_INFINITY)),
    fallPerSecond: Object.freeze(normalizeRate(fallPerSecond, dimensions, Number.POSITIVE_INFINITY)),
  });
}

function assertDefinition(definition) {
  if (definition?.schema !== RESPONSE_SCHEMA) {
    throw new TypeError("invalid response definition");
  }
}

function present(definition, values) {
  return definition.scalar ? values[0] : Object.freeze(values);
}

export function mapResponseValue(definition, inputValue) {
  assertDefinition(definition);
  const [inputMinimum, inputMaximum] = definition.input;
  const normalized = clamp(
    (finite(inputValue, inputMinimum) - inputMinimum) / (inputMaximum - inputMinimum),
    0,
    1,
  ) ** definition.exponent;
  const values = definition.output[0].map((minimum, index) => (
    minimum + (definition.output[1][index] - minimum) * normalized
  ));
  return present(definition, values);
}

function stateValues(definition, value) {
  const values = definition.scalar ? [Number(value)] : Array.from(value ?? [], Number);
  if (values.length !== definition.dimensions || values.some((entry) => !Number.isFinite(entry))) {
    throw new TypeError("response state does not match its definition");
  }
  return values;
}

export function createResponseState(definition, inputValue = definition?.input?.[0], capturedAtMs = 0) {
  assertDefinition(definition);
  const value = mapResponseValue(definition, inputValue);
  return Object.freeze({
    value,
    target: value,
    capturedAtMs: finite(capturedAtMs, 0),
  });
}

/**
 * Advance with a frame-rate-invariant exponential response and an independent
 * hard slew ceiling. Both stages clamp to the target, so overshoot is impossible.
 */
export function advanceResponse(definition, previousState, inputValue, capturedAtMs) {
  assertDefinition(definition);
  const now = Math.max(finite(capturedAtMs, 0), finite(previousState?.capturedAtMs, 0));
  const elapsedSeconds = Math.max(0, (now - finite(previousState?.capturedAtMs, now)) / 1000);
  const current = stateValues(
    definition,
    previousState?.value ?? mapResponseValue(definition, inputValue),
  );
  const mappedTarget = mapResponseValue(definition, inputValue);
  const target = stateValues(definition, mappedTarget);
  const values = current.map((entry, index) => {
    const difference = target[index] - entry;
    if (difference === 0 || elapsedSeconds === 0) return entry;
    const rising = difference > 0;
    const timeConstant = rising ? definition.attackSeconds : definition.releaseSeconds;
    const exponentialAmount = timeConstant === 0
      ? Math.abs(difference)
      : Math.abs(difference) * (1 - Math.exp(-elapsedSeconds / timeConstant));
    const rate = rising ? definition.risePerSecond[index] : definition.fallPerSecond[index];
    const slewAmount = rate === Number.POSITIVE_INFINITY
      ? Math.abs(difference)
      : rate * elapsedSeconds;
    const amount = Math.min(Math.abs(difference), exponentialAmount, slewAmount);
    return entry + Math.sign(difference) * amount;
  });

  return Object.freeze({
    value: present(definition, values),
    target: present(definition, target),
    capturedAtMs: now,
  });
}

/**
 * Shared normalized attack/release shape for short audio gestures such as BLOOM.
 * `releaseElapsedSeconds` is null until an explicit release begins.
 */
export function sampleTimedGestureEnvelope({
  elapsedSeconds = 0,
  releaseElapsedSeconds = null,
  attackSeconds,
  automaticReleaseAtSeconds,
  releaseSeconds,
} = {}) {
  const elapsed = Math.max(0, finite(elapsedSeconds, 0));
  const attackDuration = Math.max(Number.EPSILON, positive(attackSeconds, 0));
  const automaticRelease = Math.max(0, elapsed - positive(automaticReleaseAtSeconds, 0));
  const explicitRelease = releaseElapsedSeconds == null
    ? 0
    : Math.max(0, finite(releaseElapsedSeconds, 0));
  const releaseDuration = Math.max(Number.EPSILON, positive(releaseSeconds, 0));
  const attack = Math.min(1, elapsed / attackDuration);
  const release = Math.max(0, 1 - Math.max(automaticRelease, explicitRelease) / releaseDuration);
  return clamp(attack * release, 0, 1);
}

export function createAudioMacroSnapshot({
  capturedAtMs = 0,
  open = 0,
  underwater = 0,
  bloom = 0,
} = {}) {
  return Object.freeze({
    schema: AUDIO_MACRO_SCHEMA,
    capturedAtMs: finite(capturedAtMs, 0),
    values: Object.freeze({
      open: clamp(finite(open, 0), 0, 1),
      underwater: clamp(finite(underwater, 0), 0, 1),
      bloom: clamp(finite(bloom, 0), 0, 1),
    }),
  });
}

export function audioMacroAmount(snapshot, macroId) {
  if (snapshot?.schema !== AUDIO_MACRO_SCHEMA || !AUDIO_MACRO_IDS.includes(macroId)) return 0;
  return clamp(finite(snapshot.values?.[macroId], 0), 0, 1);
}
