import { COMBUSTION_ENGINES } from "./combustion/engines.js";

// One public catalogue; these are fictional acoustic instruments, not car replicas.
// Sample voices play the pinned MIT recordings; the combustion voices (November 6,
// public since the owner's November 7 decision) are the original synthesizer.
export const ENGINE_SAMPLE_VOICES = Object.freeze([
  { id: "mono", label: "Mono", description: "Raw four-cylinder" },
  { id: "rosso", label: "Rosso", description: "Bright and expressive" },
  { id: "touring", label: "Touring", description: "Deep and relaxed" },
]);
export const ENGINE_COMBUSTION_VOICES = Object.freeze(Object.entries(COMBUSTION_ENGINES)
  .map(([id, spec]) => Object.freeze({ id, label: spec.label, description: spec.description })));
export const ENGINE_CATALOGUE = Object.freeze([...ENGINE_SAMPLE_VOICES, ...ENGINE_COMBUSTION_VOICES]);
export const isEngineProfile = id => ENGINE_CATALOGUE.some(profile => profile.id === id);
export const isCombustionVoice = id => ENGINE_COMBUSTION_VOICES.some(profile => profile.id === id);
