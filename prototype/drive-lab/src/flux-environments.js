export const FLUX_ENVIRONMENTS = [
  {
    id: "aperture",
    label: "APERTURE",
    number: "01",
    rendererLabel: "Aperture",
  },
  {
    id: "vertigo",
    label: "VERTIGO",
    number: "02",
    rendererLabel: "Vertigo",
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
