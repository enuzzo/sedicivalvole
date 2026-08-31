export const DEFAULT_PAGE_TITLE = "sedicivalvole — Adaptive Music for the Road";

function cleanTitlePart(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 96);
}

export function soundtrackPageTitle(snapshot) {
  if (snapshot?.status !== "playing") return DEFAULT_PAGE_TITLE;

  const artistName = cleanTitlePart(snapshot.current?.artistName);
  const trackTitle = cleanTitlePart(snapshot.current?.title);
  if (!artistName || !trackTitle) return DEFAULT_PAGE_TITLE;

  return `16 - ${artistName} - ${trackTitle}`;
}
