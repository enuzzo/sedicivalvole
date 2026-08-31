import { allowsSoundtrackEffects } from "./source-policy.js";
import { MANUAL_EFFECT_IDS, normalizeManualEffects } from "../manual-effects-graph.js";

export const SOUNDTRACK_PLAYBACK_BOUNDARY_SCHEMA = "sedicivalvole.soundtrack-playback-boundary.v1";

export const SOUNDTRACK_PLAYBACK_INVARIANTS = Object.freeze({
  playbackRate: 1,
  drivingCanChangeTrack: false,
  drivingCanRetimeRecording: false,
  trackChangesAreManual: true,
});

const CONTROL_SOURCES = new Set(["main-ui", "authorized-passenger"]);
export const SOUNDTRACK_VEHICLE_MACROS = Object.freeze(["open", "underwater", "bloom"]);
export const SOUNDTRACK_MANUAL_EFFECT_IDS = MANUAL_EFFECT_IDS;

const zeroManualEffects = () => Object.freeze(Object.fromEntries(
  SOUNDTRACK_MANUAL_EFFECT_IDS.map((id) => [id, 0]),
));

const effectBlockReason = ({ requested, admitted, authorizedControl, licenceAllowsEffects }) => {
  if (!requested) return null;
  if (!admitted) return "track-not-admitted";
  if (!authorizedControl) return "unauthorized-control";
  if (!licenceAllowsEffects) return "licence-denies-effects";
  return null;
};

export function deriveSoundtrackPlaybackBoundary({
  policy,
  vehicleEffectsRequested = false,
  manualEffects = {},
  controlSource = "main-ui",
} = {}) {
  const admitted = policy?.admitted === true;
  const authorizedControl = CONTROL_SOURCES.has(controlSource);
  const licenceAllowsEffects = allowsSoundtrackEffects(policy);
  const vehicleRequested = vehicleEffectsRequested === true;
  const requestedManualEffects = normalizeManualEffects(manualEffects);
  const manualRequested = Object.values(requestedManualEffects).some((value) => value > 0);
  const effectPathAllowed = admitted
    && authorizedControl
    && licenceAllowsEffects;

  return Object.freeze({
    schema: SOUNDTRACK_PLAYBACK_BOUNDARY_SCHEMA,
    playbackAllowed: admitted,
    playbackRate: SOUNDTRACK_PLAYBACK_INVARIANTS.playbackRate,
    drivingCanChangeTrack: SOUNDTRACK_PLAYBACK_INVARIANTS.drivingCanChangeTrack,
    drivingCanRetimeRecording: SOUNDTRACK_PLAYBACK_INVARIANTS.drivingCanRetimeRecording,
    trackChangesAreManual: SOUNDTRACK_PLAYBACK_INVARIANTS.trackChangesAreManual,
    vehicleEffects: Object.freeze({
      requested: vehicleRequested,
      enabled: vehicleRequested && effectPathAllowed,
      reactsToDriving: vehicleRequested && effectPathAllowed,
      macros: SOUNDTRACK_VEHICLE_MACROS,
      controlSource: authorizedControl ? controlSource : null,
      masterChangesAreManual: true,
      licenceAllowsEffects,
      blockedReason: effectBlockReason({
        requested: vehicleRequested,
        admitted,
        authorizedControl,
        licenceAllowsEffects,
      }),
    }),
    manualEffects: Object.freeze({
      requested: manualRequested,
      enabled: manualRequested && effectPathAllowed,
      ids: SOUNDTRACK_MANUAL_EFFECT_IDS,
      requestedValues: requestedManualEffects,
      appliedValues: effectPathAllowed ? requestedManualEffects : zeroManualEffects(),
      controlSource: authorizedControl ? controlSource : null,
      changesAreManual: true,
      licenceAllowsEffects,
      blockedReason: effectBlockReason({
        requested: manualRequested,
        admitted,
        authorizedControl,
        licenceAllowsEffects,
      }),
    }),
  });
}
