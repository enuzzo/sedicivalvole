// Authored Flux environments.
//
// This registry is data only. Each entry names a renderer that App resolves to
// a field component, so adding an environment never changes the speed, energy,
// palette, safety, persistence, or diagnostic contracts that every environment
// shares.
//
// `aperture` must stay first: it is the default selection and the fallback for
// an unknown identifier.

export const FLUX_ENVIRONMENTS = [
  {
    id: "aperture",
    label: "APERTURE",
    number: "01",
    rendererLabel: "Aperture",
    renderer: "aperture",
    /** Body-colour themes drive this environment's palette. */
    themed: true,
  },
  {
    id: "vertigo",
    label: "VERTIGO",
    number: "02",
    rendererLabel: "Vertigo",
    renderer: "vertigo",
    // The source tree stays byte-identical; the external integration bridge
    // maps themes onto the original runtime's existing colour channels.
    themed: true,
  },
  {
    id: "meridian",
    label: "MERIDIAN",
    number: "03",
    rendererLabel: "Meridian",
    renderer: "meridian",
    themed: true,
  },
  {
    id: "atlas",
    label: "ATLAS",
    number: "04",
    rendererLabel: "Atlas",
    renderer: "atlas",
    themed: true,
  },
];

export function getFluxEnvironment(environmentId) {
  return FLUX_ENVIRONMENTS.find((environment) => environment.id === environmentId)
    ?? FLUX_ENVIRONMENTS[0];
}

export function nextFluxEnvironmentId(environmentId) {
  const index = FLUX_ENVIRONMENTS.findIndex((environment) => environment.id === environmentId);
  return FLUX_ENVIRONMENTS[(index + 1 + FLUX_ENVIRONMENTS.length) % FLUX_ENVIRONMENTS.length].id;
}
