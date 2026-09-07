// One public catalogue; these are fictional acoustic instruments, not car replicas.
export const ENGINE_CATALOGUE = Object.freeze([
  { id: "mono", label: "Mono", description: "Raw four-cylinder" },
  { id: "rosso", label: "Rosso", description: "Bright and expressive" },
  { id: "touring", label: "Touring", description: "Deep and relaxed" },
  { id: "otto", label: "Otto", description: "Crossplane V8 · pulsing exhaust" },
  { id: "cinque", label: "Cinque", description: "Turbo five · spool and release" },
  { id: "turbine", label: "Turbine", description: "Spooling shaft · continuous thrust" },
]);
export const isEngineProfile = id => ENGINE_CATALOGUE.some(profile => profile.id === id);
