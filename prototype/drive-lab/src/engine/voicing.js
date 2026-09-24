const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;

/**
 * Engine voicing, September 24: fuller and more present without new recordings
 * or effects. The donor loops are narrow (most energy between 200 Hz and
 * 2–6 kHz, Mono nearly silent above 8 kHz; Rosso and Touring thin below
 * 200 Hz), so the chain adds three dry, original elements:
 *
 * - EQ: a low shelf for weight, a cut where a loop sounds nasal, a presence lift;
 * - air: harmonics regenerated from the loops' own upper band, above 3.6 kHz;
 * - body: a band-limited firing-order tone that follows the virtual crank
 *   exactly (cam-rate harmonics: 4-cylinder firing = 4th, flat-plane V8 = 8th,
 *   six = 6th), louder under load, so the low end moves with every RPM change.
 *
 * No reverb, delay or modulation: the output stays dry and phase-coherent.
 * A null voicing is exactly neutral (the earlier sound), for A/B listening.
 */
export const NEUTRAL_VOICING = Object.freeze({
  lowShelfHz: 110, lowShelfDb: 0, midHz: 450, midQ: 0.9, midDb: 0,
  presenceHz: 2800, presenceQ: 0.8, presenceDb: 0, air: 0, body: 0, bodyOrders: Object.freeze({ 4: 1 }), trimDb: 0,
});

export function bodyFrequencyHz(rpm) {
  // Cam rate: one cycle per two crank revolutions (four-stroke).
  return Math.max(0, finite(rpm, 0)) / 120;
}

/** Body level: present at idle, fuller under load, never louder than its authored cap. */
export function bodyLevel(voicing, rpm, load) {
  const level = clamp(finite(voicing?.body, 0), 0, 2);
  if (!level) return 0;
  const demand = clamp(finite(load, 0));
  const lift = clamp((finite(rpm, 0) - 500) / 900);
  // Standstill keeps a restrained rumble; the body opens up once the crank is working.
  return level * (0.35 + 0.65 * demand) * (0.3 + 0.7 * lift);
}

function airCurve(samples = 2048, drive = 2.4) {
  const curve = new Float32Array(samples);
  const norm = Math.tanh(drive);
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x) / norm;
  }
  return curve;
}

function orderWave(context, orders) {
  const entries = Object.entries(orders ?? {}).map(([order, gain]) => [Math.round(Number(order)), finite(gain, 0)])
    .filter(([order, gain]) => order >= 1 && order <= 32 && gain > 0);
  const size = Math.max(2, ...entries.map(([order]) => order + 1));
  const real = new Float32Array(size), imag = new Float32Array(size);
  for (const [order, gain] of entries) imag[order] = gain;
  return context.createPeriodicWave(real, imag, { disableNormalization: false });
}

export function createEngineVoicing(context, output) {
  const input = context.createGain();
  // One trim after all three paths: the voiced engine's overall level.
  const trim = context.createGain();
  trim.connect(output);
  const lowShelf = context.createBiquadFilter(); lowShelf.type = "lowshelf";
  const mid = context.createBiquadFilter(); mid.type = "peaking";
  const presence = context.createBiquadFilter(); presence.type = "peaking";
  input.connect(lowShelf).connect(mid).connect(presence).connect(trim);

  const airBand = context.createBiquadFilter(); airBand.type = "highpass"; airBand.frequency.value = 1800; airBand.Q.value = 0.7;
  const airDrive = context.createGain(); airDrive.gain.value = 5;
  const airShaper = context.createWaveShaper(); airShaper.curve = airCurve(); airShaper.oversample = "4x";
  const airFloor = context.createBiquadFilter(); airFloor.type = "highpass"; airFloor.frequency.value = 3600; airFloor.Q.value = 0.7;
  const airLevel = context.createGain(); airLevel.gain.value = 0;
  presence.connect(airBand).connect(airDrive).connect(airShaper).connect(airFloor).connect(airLevel).connect(trim);

  const body = context.createOscillator();
  const bodyTop = context.createBiquadFilter(); bodyTop.type = "lowpass"; bodyTop.frequency.value = 190; bodyTop.Q.value = 0.6;
  const bodyFloor = context.createBiquadFilter(); bodyFloor.type = "highpass"; bodyFloor.frequency.value = 28; bodyFloor.Q.value = 0.6;
  const bodyGain = context.createGain(); bodyGain.gain.value = 0;
  body.frequency.value = bodyFrequencyHz(1000);
  body.connect(bodyTop).connect(bodyFloor).connect(bodyGain).connect(trim);
  body.start();

  let voicing = NEUTRAL_VOICING;
  const hold = (param, at) => {
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(at);
    else { const value = param.value; param.cancelScheduledValues(at); param.setValueAtTime(value, at); }
  };
  return {
    input,
    get voicing() { return voicing; },
    setVoicing(next, at = context.currentTime) {
      voicing = { ...NEUTRAL_VOICING, ...(next ?? {}) };
      lowShelf.frequency.setValueAtTime(voicing.lowShelfHz, at); lowShelf.gain.setValueAtTime(voicing.lowShelfDb, at);
      mid.frequency.setValueAtTime(voicing.midHz, at); mid.Q.setValueAtTime(voicing.midQ, at); mid.gain.setValueAtTime(voicing.midDb, at);
      presence.frequency.setValueAtTime(voicing.presenceHz, at); presence.Q.setValueAtTime(voicing.presenceQ, at); presence.gain.setValueAtTime(voicing.presenceDb, at);
      hold(airLevel.gain, at); airLevel.gain.setTargetAtTime(clamp(voicing.air, 0, 1), at, 0.05);
      hold(trim.gain, at); trim.gain.setTargetAtTime(10 ** (clamp(finite(voicing.trimDb, 0), -12, 6) / 20), at, 0.05);
      body.setPeriodicWave(orderWave(context, voicing.bodyOrders));
      if (!voicing.body) { hold(bodyGain.gain, at); bodyGain.gain.setTargetAtTime(0, at, 0.05); }
    },
    /** Continuous follow, matching the loops' own smoothing. */
    follow(rpm, load, at, seconds = 0.035) {
      hold(body.frequency, at); hold(bodyGain.gain, at);
      body.frequency.setTargetAtTime(bodyFrequencyHz(rpm), at, seconds);
      bodyGain.gain.setTargetAtTime(bodyLevel(voicing, rpm, load), at, seconds * 1.5);
    },
    /** A point of a scheduled shift, on the same audio clock as the loop ramps. */
    rampTo(rpm, load, at) {
      body.frequency.linearRampToValueAtTime(bodyFrequencyHz(rpm), at);
      bodyGain.gain.linearRampToValueAtTime(bodyLevel(voicing, rpm, load), at);
    },
    hold(at) { hold(body.frequency, at); hold(bodyGain.gain, at); },
    dispose() {
      try { body.stop(); } catch {}
      for (const node of [input, trim, lowShelf, mid, presence, airBand, airDrive, airShaper, airFloor, airLevel, body, bodyTop, bodyFloor, bodyGain]) node.disconnect();
    },
  };
}
