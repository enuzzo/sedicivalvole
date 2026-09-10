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
  Object.freeze({
    id: "mist-study",
    title: "Mist Study",
    description: "Ambient recordings. A slow chromatic tide.",
    detail: "Japanese Mist · Mint · Ambient",
    image: "/artwork/visuals/japanese-mist.png",
    settings: Object.freeze({
      environmentId: "japanese-mist",
      themeId: "mint",
      appearanceMode: "dark",
      musicMode: "soundtrack",
      soundtrackSelection: Object.freeze({ kind: "genre", id: "ambient" }),
    }),
  }),
  Object.freeze({
    id: "blue-hour",
    title: "Blue Hour",
    description: "Jazz recordings. A low blue corridor.",
    detail: "Meridian · Blue · Jazz",
    image: "/artwork/visuals/meridian.png",
    settings: Object.freeze({
      environmentId: "meridian",
      themeId: "blue",
      appearanceMode: "dark",
      musicMode: "soundtrack",
      soundtrackSelection: Object.freeze({ kind: "genre", id: "jazz" }),
    }),
  }),
  Object.freeze({
    id: "open-country",
    title: "Open Country",
    description: "Songwriter recordings. An open generative road.",
    detail: "Drivey · Pearl · Songwriter",
    image: "/artwork/visuals/drivey.png",
    settings: Object.freeze({
      environmentId: "drivey",
      themeId: "pearl",
      appearanceMode: "dark",
      musicMode: "soundtrack",
      soundtrackSelection: Object.freeze({ kind: "genre", id: "songwriter" }),
    }),
  }),
  Object.freeze({
    id: "electric-orchard",
    title: "Electric Orchard",
    description: "Electronic recordings. Folding colour and motion.",
    detail: "Acid Orchard · Acid · Electronic",
    image: "/artwork/visuals/acid-orchard.png",
    settings: Object.freeze({
      environmentId: "acid-orchard",
      themeId: "acid",
      appearanceMode: "dark",
      musicMode: "soundtrack",
      soundtrackSelection: Object.freeze({ kind: "genre", id: "electronic" }),
    }),
  }),
  Object.freeze({
    id: "silk-cinema",
    title: "Silk Cinema",
    description: "Soundtrack recordings. Sculptural colour in depth.",
    detail: "Chromatic Silk · Silver · Soundtrack",
    image: "/artwork/visuals/chromatic-silk.png",
    settings: Object.freeze({
      environmentId: "chromatic-silk",
      themeId: "silver",
      appearanceMode: "dark",
      musicMode: "soundtrack",
      soundtrackSelection: Object.freeze({ kind: "genre", id: "soundtrack" }),
    }),
  }),
  Object.freeze({
    id: "particle-pop",
    title: "Particle Pop",
    description: "Pop recordings. A lively particle field.",
    detail: "Prtcl · Signal · Pop",
    image: "/artwork/visuals/prtcl.png",
    settings: Object.freeze({
      environmentId: "prtcl",
      themeId: "signal",
      appearanceMode: "dark",
      musicMode: "soundtrack",
      soundtrackSelection: Object.freeze({ kind: "genre", id: "pop" }),
    }),
  }),
  Object.freeze({id: "sky-radio", title: "Sky Radio", description: "Sky Radio: ambient recordings and air-atlas.", detail: "air-atlas · ambient", image: "/artwork/visuals/air-atlas.png", settings: Object.freeze({environmentId: "air-atlas", themeId: "blue", appearanceMode: "dark", musicMode: "soundtrack", soundtrackSelection: Object.freeze({kind: "genre", id: "ambient"})})}),
  Object.freeze({id: "city-jazz", title: "City Jazz", description: "City Jazz: jazz recordings and atlas.", detail: "atlas · jazz", image: "/artwork/visuals/atlas.png", settings: Object.freeze({environmentId: "atlas", themeId: "graphite", appearanceMode: "dark", musicMode: "soundtrack", soundtrackSelection: Object.freeze({kind: "genre", id: "jazz"})})}),
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

// Call once when Intro mounts, then retain the result in component state.
// Keep an existing selected experience visible alongside one new suggestion.
export function chooseCuratedRecommendations({ selectedId = null, excludeIds = [], random = Math.random } = {}) {
  const selected = curatedExperience(selectedId);
  const candidates = CURATED_EXPERIENCES.filter(item => item !== selected && !excludeIds.includes(item.id));
  const result = selected ? [selected] : [];
  while (result.length < 2 && candidates.length) {
    let sample = 0;
    try { sample = Number(random()); } catch { /* A failed random source keeps a usable recommendation. */ }
    const unit = Number.isFinite(sample) ? Math.min(0.999999999, Math.max(0, sample)) : 0;
    const [next] = candidates.splice(Math.floor(unit * candidates.length), 1);
    result.push(next);
  }
  return Object.freeze(result);
}
