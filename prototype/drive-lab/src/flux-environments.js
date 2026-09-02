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
    displayLabel: "Aperture",
    number: "01",
    rendererLabel: "Aperture",
    launchDescription: "Layered light tunnel",
    renderer: "aperture",
    /** Body-colour themes drive this environment's palette. */
    themed: true,
  },
  {
    id: "vertigo",
    label: "VERTIGO",
    displayLabel: "Vertigo",
    number: "02",
    rendererLabel: "Vertigo",
    launchDescription: "Infinite night highway",
    renderer: "vertigo",
    // The source tree stays byte-identical; the external integration bridge
    // maps themes onto the original runtime's existing colour channels.
    themed: true,
  },
  {
    id: "meridian",
    label: "MERIDIAN",
    displayLabel: "Meridian",
    number: "03",
    rendererLabel: "Meridian",
    launchDescription: "Low moving corridor",
    renderer: "meridian",
    themed: true,
  },
  {
    id: "atlas",
    label: "ATLAS",
    displayLabel: "Atlas",
    number: "04",
    rendererLabel: "Atlas",
    launchDescription: "Live map and drive telemetry",
    renderer: "atlas",
    themed: true,
  },
  {
    id: "drivey",
    label: "DRIVEY",
    displayLabel: "Drivey",
    number: "05",
    rendererLabel: "Original Drivey.js",
    launchDescription: "Generative open road",
    renderer: "drivey",
    themed: true,
    tunable: true,
  },
  {
    id: "prtcl",
    label: "PRTCL",
    displayLabel: "Prtcl",
    number: "06",
    rendererLabel: "Fractal particle fields",
    launchDescription: "Reactive particle field",
    renderer: "prtcl",
    themed: true,
    tunable: true,
  },
  {
    id: "japanese-mist",
    label: "JAPANESE MIST",
    displayLabel: "Japanese Mist",
    number: "08",
    variantLabel: "MIST",
    rendererLabel: "ShaderGradient water plane",
    launchDescription: "Soft water and slow chromatic tide",
    renderer: "shadergradient",
    studyId: "japanese-mist",
    themed: true,
  },
  {
    id: "acid-orchard",
    label: "ACID ORCHARD",
    displayLabel: "Acid Orchard",
    number: "08",
    variantLabel: "ORCHARD",
    rendererLabel: "ShaderGradient graphic plane",
    launchDescription: "Punchy speed-led graphic folding",
    renderer: "shadergradient",
    studyId: "acid-orchard",
    themed: true,
  },
  {
    id: "chromatic-silk",
    label: "CHROMATIC SILK",
    displayLabel: "Chromatic Silk",
    number: "08",
    variantLabel: "SILK",
    rendererLabel: "ShaderGradient cosmic sphere",
    launchDescription: "Luminous sculptural colour folds",
    renderer: "shadergradient",
    studyId: "chromatic-silk",
    themed: true,
  },
];

// DISCOVER belongs in the driver-facing Visual catalogue, but it is a
// passenger information surface rather than a field renderer. Keeping that
// distinction explicit prevents it from being persisted or diagnosed as a
// WebGL environment while still making it reachable from every Visual entry
// point.
export const DISCOVER_VISUAL_CHOICE = {
  id: "discover",
  label: "DISCOVER",
  displayLabel: "Discover",
  number: "07",
  rendererLabel: "Passenger place index",
  launchDescription: "Places, stories, and routes",
  kind: "destination",
};

// ShaderGradient is one authored visual family in the driver-facing catalogue.
// Its exact studies remain separate internal environments so persisted choices,
// diagnostics, and renderer recovery retain the selected variant.
export const SHADERGRADIENT_ENVIRONMENTS = FLUX_ENVIRONMENTS.filter(
  ({ renderer }) => renderer === "shadergradient",
);

export const SHADERGRADIENT_VISUAL_CHOICE = {
  id: "shadergradient",
  label: "GRADIENT",
  displayLabel: "Gradient",
  number: "08",
  rendererLabel: "ShaderGradient family",
  launchDescription: "Reactive gradient field",
  kind: "family",
};

export function isShaderGradientEnvironmentId(environmentId) {
  return SHADERGRADIENT_ENVIRONMENTS.some(({ id }) => id === environmentId);
}

export function nextShaderGradientEnvironmentId(environmentId) {
  const index = SHADERGRADIENT_ENVIRONMENTS.findIndex(({ id }) => id === environmentId);
  if (index < 0) return SHADERGRADIENT_ENVIRONMENTS[0].id;
  return SHADERGRADIENT_ENVIRONMENTS[
    (index + 1) % SHADERGRADIENT_ENVIRONMENTS.length
  ].id;
}

export const FLUX_VISUAL_CHOICES = [
  ...FLUX_ENVIRONMENTS.filter(({ renderer }) => renderer !== "shadergradient"),
  DISCOVER_VISUAL_CHOICE,
  SHADERGRADIENT_VISUAL_CHOICE,
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
  if (environmentId === "gradient") return "japanese-mist";
  return FLUX_ENVIRONMENTS.some((environment) => environment.id === environmentId)
    ? environmentId
    : DEFAULT_FLUX_ENVIRONMENT_ID;
}

export function nextFluxEnvironmentId(environmentId) {
  const index = FLUX_ENVIRONMENTS.findIndex((environment) => environment.id === environmentId);
  if (index < 0) return DEFAULT_FLUX_ENVIRONMENT_ID;
  return FLUX_ENVIRONMENTS[(index + 1 + FLUX_ENVIRONMENTS.length) % FLUX_ENVIRONMENTS.length].id;
}
