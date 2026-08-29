// Authored Flux environments.
//
// This registry is data only. Each entry names a renderer that App resolves to
// a field component, so adding an environment never changes the speed, energy,
// palette, safety, persistence, or diagnostic contracts that every environment
// shares.
//
// `aperture` stays the stable default and fallback until the user selects a
// replacement direction that has passed visual acceptance.

export const DEFAULT_FLUX_ENVIRONMENT_ID = "aperture";

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
  {
    id: "wake",
    label: "WAKE",
    number: "05",
    rendererLabel: "Wake",
    renderer: "wake",
    themed: true,
  },
  {
    id: "drivey",
    label: "DRIVEY",
    number: "06",
    rendererLabel: "Drivey",
    renderer: "drivey",
    themed: true,
    tunable: true,
  },
];

export function getFluxEnvironment(environmentId) {
  return FLUX_ENVIRONMENTS.find((environment) => environment.id === environmentId)
    ?? FLUX_ENVIRONMENTS.find((environment) => environment.id === DEFAULT_FLUX_ENVIRONMENT_ID);
}

/**
 * Preserve every implemented preference. Rejected or retired identifiers,
 * including a locally previewed visual that never shipped, resolve to the
 * accepted Aperture fallback.
 */
export function migrateLegacyEnvironmentPreference(environmentId) {
  return FLUX_ENVIRONMENTS.some((environment) => environment.id === environmentId)
    ? environmentId
    : DEFAULT_FLUX_ENVIRONMENT_ID;
}

export function nextFluxEnvironmentId(environmentId) {
  const index = FLUX_ENVIRONMENTS.findIndex((environment) => environment.id === environmentId);
  if (index < 0) return DEFAULT_FLUX_ENVIRONMENT_ID;
  return FLUX_ENVIRONMENTS[(index + 1 + FLUX_ENVIRONMENTS.length) % FLUX_ENVIRONMENTS.length].id;
}
