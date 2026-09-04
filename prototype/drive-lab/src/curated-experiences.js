// An experience composes existing owners. It never creates a transport or renderer.
export const CURATED_EXPERIENCES = Object.freeze([
  Object.freeze({
    id: "night-glass",
    title: "Night Glass",
    description: "Soft grooves. An endless night road.",
    detail: "Vertigo · Graphite · Lounge",
    image: "/experiences/night-glass.png",
    settings: Object.freeze({
      environmentId: "vertigo",
      themeId: "graphite",
      appearanceMode: "dark",
      musicMode: "soundtrack",
      soundtrackSelection: Object.freeze({ kind: "genre", id: "lounge" }),
    }),
  }),
  Object.freeze({
    id: "neon-groove",
    title: "Neon Groove",
    description: "A little funk. A tunnel full of colour.",
    detail: "Aperture · Neon · Funk",
    image: "/experiences/neon-groove.png",
    settings: Object.freeze({
      environmentId: "aperture",
      themeId: "neon",
      appearanceMode: "dark",
      musicMode: "soundtrack",
      soundtrackSelection: Object.freeze({ kind: "genre", id: "funk" }),
    }),
  }),
]);

export function curatedExperience(id) {
  return CURATED_EXPERIENCES.find((experience) => experience.id === id) ?? null;
}

// Return one coherent selection without mutating the user's snapshot. Unrelated
// preferences (mute, vehicle effects, score and tuning) remain owned by the user.
export function applyExperienceSettings(current, id) {
  const experience = curatedExperience(id);
  if (!experience) return null;
  return Object.freeze({ ...current, ...experience.settings });
}

export function matchingExperience(settings) {
  return CURATED_EXPERIENCES.find(({ settings: expected }) => (
    ["environmentId", "themeId", "appearanceMode", "musicMode"].every((key) => settings?.[key] === expected[key])
    && settings?.soundtrackSelection?.kind === expected.soundtrackSelection.kind
    && settings?.soundtrackSelection?.id === expected.soundtrackSelection.id
  )) ?? null;
}
