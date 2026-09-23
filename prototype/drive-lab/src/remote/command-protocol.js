const VERSION = "sv-remote-1";
const MAX_COMMANDS = 12;
const MAX_PACKET_LENGTH = 4096;
const finite = (value) => Number.isFinite(value);
const integer = (value) => Number.isSafeInteger(value) && value >= 0;

const COMMAND_TYPES = new Set([
  "mode", "music-mode", "genre", "visual", "engine-profile", "transport",
  "mute", "vehicle-effects", "manual-effect", "theme", "soundtrack",
]);

function cleanText(value, maximum = 96) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text && text.length <= maximum ? text : null;
}

export function normalizeRemoteCommand(value) {
  if (!value || typeof value !== "object") return null;
  const type = cleanText(value.type, 32);
  if (!type || !COMMAND_TYPES.has(type)) return null;
  const id = cleanText(value.id, 48);
  if (!id) return null;
  const command = { v: VERSION, id, type };
  if (["mode", "music-mode", "genre", "visual", "engine-profile", "theme"].includes(type)) {
    const valueText = cleanText(value.value, 96);
    if (!valueText) return null;
    command.value = valueText;
  } else if (type === "transport") {
    const direction = cleanText(value.direction, 16);
    if (!direction || !["previous", "next", "toggle"].includes(direction)) return null;
    command.direction = direction;
  } else if (type === "mute" || type === "vehicle-effects") {
    if (typeof value.value !== "boolean") return null;
    command.value = value.value;
  } else if (type === "manual-effect") {
    const effect = cleanText(value.effect, 32);
    const amount = Number(value.value);
    if (!effect || !finite(amount) || amount < 0 || amount > 1) return null;
    command.effect = effect;
    command.value = Math.round(amount * 100) / 100;
  } else if (type === "soundtrack") {
    const key = cleanText(value.value, 160);
    if (!key) return null;
    command.value = key;
  }
  return command;
}

function encode(value) {
  const text = JSON.stringify(value);
  return text.length <= MAX_PACKET_LENGTH ? text : null;
}

function decode(text) {
  if (typeof text !== "string" || text.length > MAX_PACKET_LENGTH) return null;
  try {
    const value = JSON.parse(text);
    return value?.v === VERSION ? value : null;
  } catch {
    return null;
  }
}

function cleanState(value) {
  if (!value || typeof value !== "object") return {};
  const state = {};
  for (const key of ["mode", "musicMode", "genreId", "environmentId", "engineProfileId", "themeId"]) {
    const text = cleanText(value[key], 96);
    if (text) state[key] = text;
  }
  for (const key of ["muted", "vehicleEffectsEnabled", "playing"]) {
    if (typeof value[key] === "boolean") state[key] = value[key];
  }
  if (value.appearance === "light" || value.appearance === "dark") state.appearance = value.appearance;
  if (value.track && typeof value.track === "object") {
    const track = {};
    for (const key of ["title", "artist", "album", "artwork"]) {
      const text = cleanText(value.track[key], 240);
      if (text) track[key] = text;
    }
    if (Object.keys(track).length) state.track = track;
  }
  if (value.manualEffects && typeof value.manualEffects === "object") {
    const effects = {};
    for (const [key, amount] of Object.entries(value.manualEffects).slice(0, 8)) {
      if (cleanText(key, 32) && finite(Number(amount))) effects[key] = Math.max(0, Math.min(1, Number(amount)));
    }
    state.manualEffects = effects;
  }
  return state;
}

/**
 * Small latest-only protocol for passenger commands. The receiver emits a
 * state heartbeat and acknowledgements; the phone emits a bounded command
 * queue. Command IDs make retries safe when a mailbox reply is repeated.
 */
export function createCommandProtocol({ role, getState = () => ({}), onState = () => {}, onCommand = () => {}, now = () => performance.now() } = {}) {
  let nextSequence = 0;
  let lastSequence = -1;
  const pending = new Map();
  const seen = new Map();
  const acknowledgements = [];
  let state = {};

  function acknowledge(id, result) {
    const reply = { ok: result?.ok !== false };
    seen.set(id, reply);
    acknowledgements.push({ id, ...reply });
    while (acknowledgements.length > 32) acknowledgements.shift();
  }

  function enqueue(command) {
    const normalized = normalizeRemoteCommand(command);
    if (!normalized || role !== "phone" || pending.size >= MAX_COMMANDS) return false;
    pending.set(normalized.id, normalized);
    return true;
  }

  function poll() {
    const packet = role === "receiver"
      ? { v: VERSION, kind: "state", sequence: nextSequence++, state: cleanState(getState()), acknowledgements: acknowledgements.splice(0, MAX_COMMANDS) }
      : { v: VERSION, kind: "commands", sequence: nextSequence++, commands: [...pending.values()].slice(0, MAX_COMMANDS) };
    return encode(packet);
  }

  function receive(text) {
    const packet = decode(text);
    if (!packet || !integer(packet.sequence) || packet.sequence <= lastSequence) return null;
    lastSequence = packet.sequence;
    if (role === "receiver" && packet.kind === "commands" && Array.isArray(packet.commands)) {
      for (const raw of packet.commands.slice(0, MAX_COMMANDS)) {
        const command = normalizeRemoteCommand(raw);
        if (!command) continue;
        if (seen.has(command.id)) {
          const prior = seen.get(command.id);
          if (prior) acknowledge(command.id, prior);
          continue;
        }
        seen.set(command.id, null);
        while (seen.size > 32) seen.delete(seen.keys().next().value);
        try {
          const outcome = onCommand(command);
          if (outcome && typeof outcome.then === "function") {
            Promise.resolve(outcome).then(
              (result) => acknowledge(command.id, result),
              () => acknowledge(command.id, { ok: false }),
            );
          } else acknowledge(command.id, outcome);
        } catch {
          acknowledge(command.id, { ok: false });
        }
      }
      return true;
    }
    if (role === "phone" && packet.kind === "state") {
      state = cleanState(packet.state);
      onState(state);
      for (const acknowledgement of Array.isArray(packet.acknowledgements) ? packet.acknowledgements : []) {
        const id = cleanText(acknowledgement?.id, 48);
        if (id) pending.delete(id);
      }
      return true;
    }
    return null;
  }

  return {
    enqueue,
    poll,
    receive,
    state: () => state,
    reset() { lastSequence = -1; },
    summary: () => ({ pending: pending.size, acknowledgements: acknowledgements.length, lastSequence }),
  };
}

export { VERSION as REMOTE_PROTOCOL_VERSION };
