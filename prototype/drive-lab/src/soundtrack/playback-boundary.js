import { allowsSoundtrackEffects } from "./source-policy.js";

export const SOUNDTRACK_PLAYBACK_BOUNDARY_SCHEMA = "sedicivalvole.soundtrack-playback-boundary.v1";

export const SOUNDTRACK_PLAYBACK_INVARIANTS = Object.freeze({
  playbackRate: 1,
  reactsToDriving: false,
  trackChangesAreManual: true,
  effectChangesAreManual: true,
});

const CONTROL_SOURCES = new Set(["main-ui", "authorized-passenger"]);

const asText = (value) => typeof value === "string" ? value.trim() : "";

export function deriveSoundtrackPlaybackBoundary({
  policy,
  effectsRequested = false,
  effectId = null,
  controlSource = "main-ui",
} = {}) {
  const admitted = policy?.admitted === true;
  const authorizedControl = CONTROL_SOURCES.has(controlSource);
  const requested = effectsRequested === true;
  const licenceAllowsEffects = allowsSoundtrackEffects(policy);
  const effectsEnabled = admitted
    && requested
    && authorizedControl
    && licenceAllowsEffects;

  let effectsBlockedReason = null;
  if (requested && !admitted) effectsBlockedReason = "track-not-admitted";
  else if (requested && !authorizedControl) effectsBlockedReason = "unauthorized-control";
  else if (requested && !licenceAllowsEffects) effectsBlockedReason = "licence-denies-effects";

  return Object.freeze({
    schema: SOUNDTRACK_PLAYBACK_BOUNDARY_SCHEMA,
    playbackAllowed: admitted,
    playbackRate: SOUNDTRACK_PLAYBACK_INVARIANTS.playbackRate,
    reactsToDriving: SOUNDTRACK_PLAYBACK_INVARIANTS.reactsToDriving,
    trackChangesAreManual: SOUNDTRACK_PLAYBACK_INVARIANTS.trackChangesAreManual,
    effects: Object.freeze({
      requested,
      enabled: effectsEnabled,
      effectId: effectsEnabled ? asText(effectId) || null : null,
      controlSource: authorizedControl ? controlSource : null,
      changesAreManual: SOUNDTRACK_PLAYBACK_INVARIANTS.effectChangesAreManual,
      licenceAllowsEffects,
      blockedReason: effectsBlockedReason,
    }),
  });
}
