const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Visual encodings of existing engine/road evidence, never additional telemetry. */
export function telemetrySignals(state = {}, speed = 0, speedSource = 'GPS') {
  const speedKnown = Number.isFinite(speed) && (speedSource !== 'GPS' || ['fresh', 'degraded'].includes(state.motion));
  const speedLive = speedKnown && (speedSource !== 'GPS' || state.motion === 'fresh');
  const rpmKnown = Number.isFinite(state.rpm) && state.rpm >= 0;
  const engineLive = state.playing === true && state.enabled !== false && state.status === 'ready';
  const rpm = rpmKnown ? clamp(state.rpm, 0, 12000) : 0;
  const gear = !state.singleSpeed && !state.revving && Number.isInteger(state.gear) && state.gear >= 1 && state.gear <= 6 ? state.gear : null;
  const phase = engineLive && ['release', 'synchronize', 'engage'].includes(state.shiftPhase) ? state.shiftPhase : 'steady';
  return {
    speedKnown,
    rpmRunning: engineLive && rpmKnown && rpm > 0,
    speedRunning: speedLive && speed > 0,
    // Deliberately slowed visual cadence, proportional to the authored RPM.
    rpmSeconds: 2400 / Math.max(600, rpm),
    speedSeconds: 48 / Math.max(1, speedKnown ? clamp(speed, 0, 250) : 0),
    pulseHeight: .3 + .7 * clamp(Number.isFinite(state.drive) ? state.drive : 0, 0, 1),
    gear, phase,
    gearEngaged: engineLive && gear !== null,
  };
}
