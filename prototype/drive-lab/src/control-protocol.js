export const CONTROL_PROTOCOL_SCHEMA = "sedicivalvole.control.v1";
export const CONTROL_MESSAGE_KINDS = Object.freeze(["param", "command", "state"]);

const ID_PATTERN = /^[a-z][A-Za-z0-9]*(?:[.-][A-Za-z0-9]+)*$/;

function assertRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function safeId(value, label) {
  if (typeof value !== "string" || !ID_PATTERN.test(value) || value.length > 80) {
    throw new TypeError(`${label} must be a bounded dotted identifier`);
  }
  return value;
}

function safeInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer`);
  }
  return number;
}

function cloneJson(value, label) {
  try {
    const encoded = JSON.stringify(value);
    if (encoded === undefined || encoded.length > 131072) throw new TypeError();
    return JSON.parse(encoded);
  } catch {
    throw new TypeError(`${label} must be bounded JSON data`);
  }
}

function baseMessage({ kind, clientId, sequence, capturedAt }) {
  if (!CONTROL_MESSAGE_KINDS.includes(kind)) throw new TypeError("unknown control message kind");
  const timestamp = typeof capturedAt === "string" ? capturedAt : new Date().toISOString();
  if (Number.isNaN(Date.parse(timestamp))) throw new TypeError("capturedAt must be ISO-8601");
  return {
    schema: CONTROL_PROTOCOL_SCHEMA,
    kind,
    clientId: safeId(clientId, "clientId"),
    sequence: safeInteger(sequence, "sequence"),
    capturedAt: timestamp,
  };
}

export function createParamMessage({ clientId, sequence, id, value, capturedAt }) {
  return Object.freeze({
    ...baseMessage({ kind: "param", clientId, sequence, capturedAt }),
    id: safeId(id, "parameter id"),
    value: cloneJson(value, "parameter value"),
  });
}

export function createCommandMessage({ clientId, sequence, id, args = {}, capturedAt }) {
  assertRecord(args, "command args");
  return Object.freeze({
    ...baseMessage({ kind: "command", clientId, sequence, capturedAt }),
    id: safeId(id, "command id"),
    args: cloneJson(args, "command args"),
  });
}

export function createStateMessage({ clientId, sequence, revision, values, capturedAt }) {
  assertRecord(values, "state values");
  return Object.freeze({
    ...baseMessage({ kind: "state", clientId, sequence, capturedAt }),
    revision: safeInteger(revision, "revision"),
    values: cloneJson(values, "state values"),
  });
}

export function validateControlMessage(message) {
  assertRecord(message, "control message");
  if (message.schema !== CONTROL_PROTOCOL_SCHEMA) throw new TypeError("unsupported control schema");
  if (message.kind === "param") return createParamMessage(message);
  if (message.kind === "command") return createCommandMessage(message);
  if (message.kind === "state") return createStateMessage(message);
  throw new TypeError("unknown control message kind");
}

export function applyParamMessage(state, message, manifest) {
  const accepted = validateControlMessage(message);
  if (accepted.kind !== "param") throw new TypeError("only param messages can update parameter state");
  assertRecord(state, "parameter state");
  assertRecord(manifest, "parameter manifest");
  const definition = manifest[accepted.id];
  if (!definition) throw new RangeError("parameter is not declared");
  const value = definition.normalize(accepted.value);
  return Object.freeze({ ...state, [accepted.id]: value });
}
