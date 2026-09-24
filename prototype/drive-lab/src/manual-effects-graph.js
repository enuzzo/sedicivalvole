const clamp01 = (value) => Number.isFinite(value)
  ? Math.min(1, Math.max(0, value))
  : 0;

export const MANUAL_EFFECT_IDS = Object.freeze([
  "flanger",
  "reverb",
  "underwater",
  "phaser",
  "bitcrush",
  "bassDrive",
  "radioCut",
  "highCut",
]);

export const normalizeManualEffects = (values = {}) => Object.freeze(Object.fromEntries(
  MANUAL_EFFECT_IDS.map((id) => [id, clamp01(values[id])]),
));

const performanceCurve = (value) => Math.pow(value, 0.58);
// The three tone effects are clean fourth-order Butterworth filters: two
// cascaded biquads at the same cutoff with linear Q 0.5412 and 1.3066. They
// replace the earlier parallel dry/wet blend and waveshaper drive, which smeared
// phase and crackled instead of cutting a band. Web Audio interprets lowpass and
// highpass Q in decibels, so the values below are 20·log10 of those linear Qs.
export const BUTTERWORTH_FOURTH_ORDER_Q = Object.freeze([-5.3329, 2.3226]);
// Tone filters are serial. The dry path only exists as a bypass for exact zero,
// crossfaded over the first two slider percent while the cutoff is still out of band.
const toneEngage = (value) => {
  const normalized = clamp01(value / 0.02);
  return normalized * normalized * (3 - 2 * normalized);
};
const exponentialRange = (start, end, amount) => start * Math.pow(end / start, amount);
const stuntCurve = (value) => {
  const normalized = clamp01((value - 0.82) / 0.18);
  return normalized * normalized * (3 - 2 * normalized);
};

export function manualEffectParameters(values = {}) {
  const manual = normalizeManualEffects(values);
  const shaped = Object.freeze(Object.fromEntries(
    MANUAL_EFFECT_IDS.map((id) => [id, performanceCurve(manual[id])]),
  ));
  const stunt = Object.freeze(Object.fromEntries(
    MANUAL_EFFECT_IDS.map((id) => [id, stuntCurve(manual[id])]),
  ));
  const {
    flanger, reverb, underwater, phaser, bitcrush, bassDrive, radioCut, highCut,
  } = shaped;
  return Object.freeze({
    manual,
    shaped,
    stunt,
    flangerDry: Math.max(0.2, 1 - flanger * 0.18 - stunt.flanger * 0.62),
    flangerWet: flanger * 0.88 + stunt.flanger * 0.22,
    flangerDelaySeconds: 0.0012 + flanger * 0.0048,
    flangerModulationSeconds: flanger * 0.0038 + stunt.flanger * 0.0007,
    flangerFeedback: flanger * 0.56 + stunt.flanger * 0.12,
    flangerRateHz: 0.18 + flanger * 0.34 + stunt.flanger * 0.48,
    reverbDry: Math.max(0.29, 1 - reverb * 0.26 - stunt.reverb * 0.45),
    reverbWet: reverb * 0.9 + stunt.reverb * 0.2,
    manualUnderwaterDry: Math.max(0, 1 - underwater * 0.92 - stunt.underwater * 0.08),
    manualUnderwaterWet: underwater * 0.72 + stunt.underwater * 0.18,
    manualUnderwaterCutoffHz: exponentialRange(18_000, 460, underwater) * (1 - stunt.underwater * 0.52),
    manualUnderwaterSecondCutoffHz: exponentialRange(20_000, 720, underwater) * (1 - stunt.underwater * 0.52),
    manualUnderwaterResonance: 0.7 + underwater * 3.8 + stunt.underwater * 2.5,
    manualUnderwaterPressureGainDb: underwater * 8,
    manualUnderwaterMakeupGain: 0.9 + underwater * 0.12 - stunt.underwater * 0.52,
    manualUnderwaterTextureDrive: stunt.underwater * 4,
    phaserDry: Math.max(0.2, 1 - phaser * 0.24 - stunt.phaser * 0.56),
    phaserWet: phaser * 0.96 + stunt.phaser * 0.1,
    phaserCenterHz: 420 + phaser * 380,
    phaserModulationHz: phaser * 980 + stunt.phaser * 1_000,
    phaserRateHz: 0.12 + phaser * 0.72 + stunt.phaser * 0.7,
    phaserFeedback: phaser * 0.48 + stunt.phaser * 0.12,
    bitcrushDry: Math.max(0, 1 - bitcrush * 0.92 - stunt.bitcrush * 0.08),
    bitcrushWet: bitcrush,
    bitcrushLevels: Math.max(4, Math.round(64 - bitcrush * 56 - stunt.bitcrush * 4)),
    bitcrushToneHz: exponentialRange(16_000, 3_400, bitcrush) * (1 - stunt.bitcrush * 0.68),
    bassDriveDry: 1 - toneEngage(manual.bassDrive),
    bassDriveWet: toneEngage(manual.bassDrive),
    bassCutHz: exponentialRange(18, 720, bassDrive) * (1 + stunt.bassDrive * 1.5),
    bassCutResonance: BUTTERWORTH_FOURTH_ORDER_Q[1] + stunt.bassDrive * 4,
    radioCutDry: 1 - toneEngage(manual.radioCut),
    radioCutWet: toneEngage(manual.radioCut),
    radioCutHighpassHz: exponentialRange(18, 1_000, radioCut) * (1 + stunt.radioCut * 0.2),
    radioCutLowpassHz: exponentialRange(20_000, 2_600, radioCut) * (1 - stunt.radioCut * 0.3),
    radioCutPresenceDb: radioCut * 4 + stunt.radioCut * 2,
    radioCutResonance: BUTTERWORTH_FOURTH_ORDER_Q[1] + stunt.radioCut * 2,
    highCutDry: 1 - toneEngage(manual.highCut),
    highCutWet: toneEngage(manual.highCut),
    highCutCutoffHz: exponentialRange(20_000, 900, highCut) * (1 - stunt.highCut * 0.55),
    highCutResonance: BUTTERWORTH_FOURTH_ORDER_Q[1] + stunt.highCut * 4,
  });
}

const setParam = (param, value, context, seconds = 0.035) => {
  if (!param) return;
  const time = context?.currentTime ?? 0;
  try {
    param.cancelScheduledValues?.(time);
    param.setTargetAtTime?.(value, time, seconds);
    if (typeof param.setTargetAtTime !== "function") param.value = value;
  } catch {
    param.value = value;
  }
};

function makeImpulse(context, seconds = 2.65) {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    let seed = 0x6d2b79f5 ^ (channel * 0x9e3779b9);
    for (let index = 0; index < length; index += 1) {
      seed = Math.imul(seed ^ (seed >>> 15), seed | 1);
      seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61);
      const noise = (((seed ^ (seed >>> 14)) >>> 0) / 0xffffffff) * 2 - 1;
      const envelope = (1 - index / length) ** 2.35;
      data[index] = noise * envelope;
    }
  }
  return buffer;
}

function makeQuantizedCurve(levels) {
  const curve = new Float32Array(4_097);
  const steps = Math.max(2, levels - 1);
  for (let index = 0; index < curve.length; index += 1) {
    const value = index / (curve.length - 1) * 2 - 1;
    curve[index] = Math.round(value * steps) / steps;
  }
  return curve;
}

function makeDriveCurve(amount) {
  const curve = new Float32Array(4_097);
  const drive = Math.max(0, amount);
  const normalizer = drive > 0 ? Math.tanh(drive) : 1;
  for (let index = 0; index < curve.length; index += 1) {
    const value = index / (curve.length - 1) * 2 - 1;
    curve[index] = drive > 0 ? Math.tanh(value * drive) / normalizer : value;
  }
  return curve;
}

/** Creates one identical eight-effect performance chain in any AudioContext. */
export function createManualEffectsGraph(context) {
  const input = context.createGain();

  const flangerDry = context.createGain();
  const flangerDelay = context.createDelay(0.02);
  const flangerWet = context.createGain();
  const flangerFeedback = context.createGain();
  const flangerSum = context.createGain();
  const flangerLfo = context.createOscillator();
  const flangerDepth = context.createGain();

  const reverbDry = context.createGain();
  const reverbPreDelay = context.createDelay(0.08);
  const reverb = context.createConvolver();
  const reverbHighpass = context.createBiquadFilter();
  const reverbTone = context.createBiquadFilter();
  const reverbWet = context.createGain();
  const reverbSum = context.createGain();

  const underwaterDry = context.createGain();
  const underwaterOne = context.createBiquadFilter();
  const underwaterTwo = context.createBiquadFilter();
  const underwaterPressure = context.createBiquadFilter();
  const underwaterTexture = context.createWaveShaper();
  const underwaterWet = context.createGain();
  const underwaterSum = context.createGain();

  const phaserDry = context.createGain();
  const phaserStages = Array.from({ length: 4 }, () => context.createBiquadFilter());
  const phaserWet = context.createGain();
  const phaserFeedback = context.createGain();
  const phaserSum = context.createGain();
  const phaserLfo = context.createOscillator();
  const phaserDepths = phaserStages.map(() => context.createGain());

  const bitcrushDry = context.createGain();
  const bitcrushShaper = context.createWaveShaper();
  const bitcrushTone = context.createBiquadFilter();
  const bitcrushWet = context.createGain();
  const bitcrushSum = context.createGain();

  const bassDriveDry = context.createGain();
  const bassCutOne = context.createBiquadFilter();
  const bassCutTwo = context.createBiquadFilter();
  const bassDriveWet = context.createGain();
  const bassDriveSum = context.createGain();

  const radioCutDry = context.createGain();
  const radioCutHighpass = context.createBiquadFilter();
  const radioCutHighpassTwo = context.createBiquadFilter();
  const radioCutLowpass = context.createBiquadFilter();
  const radioCutLowpassTwo = context.createBiquadFilter();
  const radioCutPresence = context.createBiquadFilter();
  const radioCutWet = context.createGain();
  const radioCutSum = context.createGain();

  const highCutDry = context.createGain();
  const highCutOne = context.createBiquadFilter();
  const highCutTwo = context.createBiquadFilter();
  const highCutWet = context.createGain();
  const highCutSum = context.createGain();

  const limiter = context.createDynamicsCompressor();
  const output = context.createGain();

  reverb.buffer = makeImpulse(context);
  reverb.normalize = true;
  reverbPreDelay.delayTime.value = 0.034;
  reverbHighpass.type = "highpass";
  reverbHighpass.frequency.value = 120;
  reverbTone.type = "lowpass";
  reverbTone.frequency.value = 7_200;
  underwaterOne.type = "lowpass";
  underwaterTwo.type = "lowpass";
  underwaterPressure.type = "lowshelf";
  underwaterPressure.frequency.value = 180;
  underwaterTexture.oversample = "2x";
  phaserStages.forEach((stage, index) => {
    stage.type = "allpass";
    stage.frequency.value = 420 * (1 + index * 0.34);
    stage.Q.value = 0.9 + index * 0.18;
  });
  bitcrushShaper.oversample = "none";
  bitcrushTone.type = "lowpass";
  for (const [one, two, type, frequency] of [
    [bassCutOne, bassCutTwo, "highpass", 18],
    [radioCutHighpass, radioCutHighpassTwo, "highpass", 18],
    [radioCutLowpass, radioCutLowpassTwo, "lowpass", 20_000],
    [highCutOne, highCutTwo, "lowpass", 20_000],
  ]) {
    one.type = type;
    two.type = type;
    one.frequency.value = frequency;
    two.frequency.value = frequency;
    one.Q.value = BUTTERWORTH_FOURTH_ORDER_Q[0];
    two.Q.value = BUTTERWORTH_FOURTH_ORDER_Q[1];
  }
  radioCutPresence.type = "peaking";
  radioCutPresence.frequency.value = 1_400;
  radioCutPresence.Q.value = 0.8;
  flangerLfo.type = "sine";
  flangerLfo.frequency.value = 0.23;
  phaserLfo.type = "sine";
  phaserLfo.frequency.value = 0.24;
  limiter.threshold.value = -2.5;
  limiter.knee.value = 7;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.14;
  output.gain.value = 0.94;

  for (const gain of [
    flangerWet.gain, flangerFeedback.gain, flangerDepth.gain, reverbWet.gain,
    underwaterWet.gain, phaserWet.gain,
    phaserFeedback.gain, ...phaserDepths.map((depth) => depth.gain),
    bitcrushWet.gain, bassDriveWet.gain, radioCutWet.gain, highCutWet.gain,
  ]) gain.value = 0;

  input.connect(flangerDry).connect(flangerSum);
  input.connect(flangerDelay).connect(flangerWet).connect(flangerSum);
  flangerDelay.connect(flangerFeedback).connect(flangerDelay);
  flangerLfo.connect(flangerDepth).connect(flangerDelay.delayTime);

  flangerSum.connect(reverbDry).connect(reverbSum);
  flangerSum.connect(reverbPreDelay).connect(reverb).connect(reverbHighpass).connect(reverbTone).connect(reverbWet).connect(reverbSum);

  reverbSum.connect(underwaterDry).connect(underwaterSum);
  reverbSum.connect(underwaterOne).connect(underwaterTwo).connect(underwaterPressure).connect(underwaterTexture).connect(underwaterWet).connect(underwaterSum);

  underwaterSum.connect(phaserDry).connect(phaserSum);
  underwaterSum.connect(phaserStages[0]);
  phaserStages.forEach((stage, index) => {
    if (index < phaserStages.length - 1) stage.connect(phaserStages[index + 1]);
    phaserLfo.connect(phaserDepths[index]).connect(stage.frequency);
  });
  phaserStages.at(-1).connect(phaserWet).connect(phaserSum);
  phaserStages.at(-1).connect(phaserFeedback).connect(phaserStages[0]);

  phaserSum.connect(bitcrushDry).connect(bitcrushSum);
  phaserSum.connect(bitcrushShaper).connect(bitcrushTone).connect(bitcrushWet).connect(bitcrushSum);

  bitcrushSum.connect(bassDriveDry).connect(bassDriveSum);
  bitcrushSum.connect(bassCutOne).connect(bassCutTwo).connect(bassDriveWet).connect(bassDriveSum);

  bassDriveSum.connect(radioCutDry).connect(radioCutSum);
  bassDriveSum.connect(radioCutHighpass).connect(radioCutHighpassTwo).connect(radioCutLowpass).connect(radioCutLowpassTwo).connect(radioCutPresence).connect(radioCutWet).connect(radioCutSum);
  radioCutSum.connect(highCutDry).connect(highCutSum);
  radioCutSum.connect(highCutOne).connect(highCutTwo).connect(highCutWet).connect(highCutSum);
  highCutSum.connect(limiter).connect(output);

  flangerLfo.start();
  phaserLfo.start();

  let current = normalizeManualEffects();
  let destroyed = false;
  const apply = (values = current) => {
    current = normalizeManualEffects(values);
    const parameters = manualEffectParameters(current);
    setParam(flangerDry.gain, parameters.flangerDry, context);
    setParam(flangerWet.gain, parameters.flangerWet, context);
    setParam(flangerDelay.delayTime, parameters.flangerDelaySeconds, context);
    setParam(flangerDepth.gain, parameters.flangerModulationSeconds, context);
    setParam(flangerFeedback.gain, parameters.flangerFeedback, context);
    setParam(flangerLfo.frequency, parameters.flangerRateHz, context);
    setParam(reverbDry.gain, parameters.reverbDry, context);
    setParam(reverbWet.gain, parameters.reverbWet, context);
    setParam(underwaterDry.gain, parameters.manualUnderwaterDry, context);
    setParam(underwaterWet.gain, parameters.manualUnderwaterWet * parameters.manualUnderwaterMakeupGain, context, 0.06);
    setParam(underwaterOne.frequency, parameters.manualUnderwaterCutoffHz, context, 0.06);
    setParam(underwaterTwo.frequency, parameters.manualUnderwaterSecondCutoffHz, context, 0.06);
    setParam(underwaterOne.Q, parameters.manualUnderwaterResonance, context);
    setParam(underwaterTwo.Q, parameters.manualUnderwaterResonance * 0.82, context);
    setParam(underwaterPressure.gain, parameters.manualUnderwaterPressureGainDb, context);
    underwaterTexture.curve = makeDriveCurve(parameters.manualUnderwaterTextureDrive);
    setParam(phaserDry.gain, parameters.phaserDry, context);
    setParam(phaserWet.gain, parameters.phaserWet, context);
    setParam(phaserFeedback.gain, parameters.phaserFeedback, context);
    setParam(phaserLfo.frequency, parameters.phaserRateHz, context);
    phaserStages.forEach((stage, index) => {
      setParam(stage.frequency, parameters.phaserCenterHz * (1 + index * 0.34), context);
      setParam(phaserDepths[index].gain, parameters.phaserModulationHz * (1 + index * 0.2), context);
    });
    setParam(bitcrushDry.gain, parameters.bitcrushDry, context);
    setParam(bitcrushWet.gain, parameters.bitcrushWet, context);
    setParam(bitcrushTone.frequency, parameters.bitcrushToneHz, context);
    bitcrushShaper.curve = makeQuantizedCurve(parameters.bitcrushLevels);
    setParam(bassDriveDry.gain, parameters.bassDriveDry, context);
    setParam(bassDriveWet.gain, parameters.bassDriveWet, context);
    setParam(bassCutOne.frequency, parameters.bassCutHz, context, 0.05);
    setParam(bassCutTwo.frequency, parameters.bassCutHz, context, 0.05);
    setParam(bassCutTwo.Q, parameters.bassCutResonance, context);
    setParam(radioCutDry.gain, parameters.radioCutDry, context);
    setParam(radioCutWet.gain, parameters.radioCutWet, context);
    setParam(radioCutHighpass.frequency, parameters.radioCutHighpassHz, context, 0.05);
    setParam(radioCutHighpassTwo.frequency, parameters.radioCutHighpassHz, context, 0.05);
    setParam(radioCutLowpass.frequency, parameters.radioCutLowpassHz, context, 0.05);
    setParam(radioCutLowpassTwo.frequency, parameters.radioCutLowpassHz, context, 0.05);
    setParam(radioCutHighpassTwo.Q, parameters.radioCutResonance, context);
    setParam(radioCutLowpassTwo.Q, parameters.radioCutResonance, context);
    setParam(radioCutPresence.gain, parameters.radioCutPresenceDb, context);
    setParam(highCutDry.gain, parameters.highCutDry, context);
    setParam(highCutWet.gain, parameters.highCutWet, context);
    setParam(highCutOne.frequency, parameters.highCutCutoffHz, context, 0.05);
    setParam(highCutTwo.frequency, parameters.highCutCutoffHz, context, 0.05);
    setParam(highCutTwo.Q, parameters.highCutResonance, context);
    return Object.freeze({ values: current, parameters });
  };
  apply();

  const nodes = [
    input, flangerDry, flangerDelay, flangerWet, flangerFeedback, flangerSum,
    flangerLfo, flangerDepth, reverbDry, reverbPreDelay, reverb, reverbHighpass,
    reverbTone, reverbWet, reverbSum, underwaterDry, underwaterOne, underwaterTwo,
    underwaterPressure, underwaterTexture, underwaterWet, underwaterSum, phaserDry, ...phaserStages,
    phaserWet, phaserFeedback, phaserSum, phaserLfo, ...phaserDepths, bitcrushDry,
    bitcrushShaper, bitcrushTone, bitcrushWet, bitcrushSum, bassDriveDry,
    bassCutOne, bassCutTwo, bassDriveWet, bassDriveSum,
    radioCutDry, radioCutHighpass, radioCutHighpassTwo, radioCutLowpass, radioCutLowpassTwo,
    radioCutPresence, radioCutWet, radioCutSum, highCutDry, highCutOne, highCutTwo,
    highCutWet, highCutSum, limiter, output,
  ];

  return Object.freeze({
    input,
    output,
    set(values) { return destroyed ? null : apply(values); },
    getSnapshot: () => Object.freeze({ values: current, destroyed }),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      try { flangerLfo.stop(); } catch { /* already stopped */ }
      try { phaserLfo.stop(); } catch { /* already stopped */ }
      for (const node of nodes) {
        try { node.disconnect(); } catch { /* best-effort teardown */ }
      }
    },
  });
}
