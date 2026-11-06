import { COMBUSTION_ENGINES } from "./combustion/engines.js";

// One public catalogue; these are fictional acoustic instruments, not car replicas.
export const ENGINE_CATALOGUE = Object.freeze([
  { id: "mono", label: "Mono", description: "Raw four-cylinder" },
  { id: "rosso", label: "Rosso", description: "Bright and expressive" },
  { id: "touring", label: "Touring", description: "Deep and relaxed" },
]);
export const isEngineProfile = id => ENGINE_CATALOGUE.some(profile => profile.id === id);
// Protected LAB only: original combustion-synthesizer candidates (November 6).
export const ENGINE_LAB_CANDIDATES = Object.freeze(Object.entries(COMBUSTION_ENGINES)
  .map(([id, spec]) => Object.freeze({ id, label: spec.label, description: spec.description })));
export const isLabEngine = id => isEngineProfile(id) || ENGINE_LAB_CANDIDATES.some(profile => profile.id === id);
export const isCombustionCandidate = id => ENGINE_LAB_CANDIDATES.some(profile => profile.id === id);
