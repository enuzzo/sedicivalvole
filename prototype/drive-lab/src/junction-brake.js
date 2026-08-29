// Musically controlled JUNCTION braking parameters.
//
// The full-depth values are calibrated against all 24 encoded performances in
// public/audio/junction.svb. Braking changes tone and density while playback
// rate, transport and pitch remain untouched.

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));

export const JUNCTION_BRAKE_CALIBRATION = Object.freeze({
  cutoffHz: 550,
  idleQ: 0.65,
  fullQ: 0.85,
  drive: 2,
  filteredMix: 0.84,
  residualMix: 0.16,
  makeupDb: -4.32,
  makeupGain: 10 ** (-4.32 / 20),
});

/** Continuous control values for the native Web Audio brake graph. */
export function junctionBrakeParameters(amount, openCutoffHz = 18000) {
  const depth = clamp01(amount);
  const openCutoff = Math.max(
    JUNCTION_BRAKE_CALIBRATION.cutoffHz,
    Number(openCutoffHz) || 18000,
  );
  // Frequency is perceived logarithmically. Exponential interpolation makes
  // the pressure increase evenly instead of saving almost all colour for the
  // last few percent of pedal travel.
  const cutoffHz = openCutoff * (
    JUNCTION_BRAKE_CALIBRATION.cutoffHz / openCutoff
  ) ** depth;
  return {
    depth,
    cutoffHz,
    q: JUNCTION_BRAKE_CALIBRATION.idleQ
      + (JUNCTION_BRAKE_CALIBRATION.fullQ - JUNCTION_BRAKE_CALIBRATION.idleQ) * depth,
    cleanGain: 1 - depth,
    processedGain: depth,
    filteredMix: JUNCTION_BRAKE_CALIBRATION.filteredMix,
    residualMix: JUNCTION_BRAKE_CALIBRATION.residualMix,
    drive: JUNCTION_BRAKE_CALIBRATION.drive,
    makeupGain: JUNCTION_BRAKE_CALIBRATION.makeupGain,
  };
}

/** Fixed soft-saturation curve; wet amount is controlled by the parallel mix. */
export function createJunctionBrakeCurve(points = 4097) {
  const length = Math.max(257, Math.trunc(points));
  const curve = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const input = (index / (length - 1)) * 2 - 1;
    curve[index] = Math.tanh(input * JUNCTION_BRAKE_CALIBRATION.drive);
  }
  return curve;
}
