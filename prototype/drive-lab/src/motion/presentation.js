import { FLUX_THEMES } from "../flux-themes.js";

const palettes = new Set(FLUX_THEMES.map(theme => theme.id));
export const DEFAULT_MOTION_PRESENTATION = Object.freeze({ palette: "red", appearance: "dark" });

// Exchange palette identifiers, never remote CSS, arbitrary colors or URLs.
export function safeMotionPresentation(value) {
  return value && palettes.has(value.palette) && ["light", "dark"].includes(value.appearance)
    ? { palette: value.palette, appearance: value.appearance } : null;
}

export function motionPresentationFromSearch(search) {
  const query = new URLSearchParams(search);
  return safeMotionPresentation({ palette: query.get("palette"), appearance: query.get("appearance") }) ?? DEFAULT_MOTION_PRESENTATION;
}

export function safeReceiverContext(value) {
  const presentation = safeMotionPresentation(value);
  if (!presentation || Object.keys(value).length !== 4
    || !(value.acceptedGeneration === null || Number.isSafeInteger(value.acceptedGeneration) && value.acceptedGeneration >= 0)
    || !(value.acceptedSequence === null || Number.isSafeInteger(value.acceptedSequence) && value.acceptedSequence >= 0)
    || (value.acceptedGeneration === null) !== (value.acceptedSequence === null)) return null;
  return { ...presentation, acceptedGeneration: value.acceptedGeneration, acceptedSequence: value.acceptedSequence };
}
