const clamp01 = (value) => Number.isFinite(value)
  ? Math.min(1, Math.max(0, value))
  : 0;

export const MANUAL_EFFECT_IDS = Object.freeze([
  "flanger",
  "reverb",
  "echo",
  "underwater",
  "phaser",
  "bitcrush",
  "bassDrive",
  "radioCut",
]);

export const normalizeManualEffects = (values = {}) => Object.freeze(Object.fromEntries(
  MANUAL_EFFECT_IDS.map((id) => [id, clamp01(values[id])]),
));

const performanceCurve = (value) => Math.pow(value, 0.58);
const exponentialRange = (start, end, amount) => start * Math.pow(end / start, amount);

export function manualEffectParameters(values = {}) {
  const manual = normalizeManualEffects(values);
  const shaped = Object.freeze(Object.fromEntries(
    MANUAL_EFFECT_IDS.map((id) => [id, performanceCurve(manual[id])]),
  ));
  const {
    flanger, reverb, echo, underwater, phaser, bitcrush, bassDrive, radioCut,
  } = shaped;
  return Object.freeze({
    manual,
    shaped,
    flangerDry: 1 - flanger * 0.18,
    flangerWet: flanger * 0.88,
    flangerDelaySeconds: 0.0012 + flanger * 0.0048,
    flangerModulationSeconds: flanger * 0.0038,
    flangerFeedback: flanger * 0.56,
    flangerRateHz: 0.18 + flanger * 0.34,
    reverbDry: 1 - reverb * 0.26,
    reverbWet: reverb * 0.9,
    echoDry: 1 - echo * 0.05,
    echoWet: echo * 0.78,
    echoDelaySeconds: 0.22 + echo * 0.2,
    echoFeedback: echo * 0.58,
    manualUnderwaterDry: 1 - underwater * 0.92,
    manualUnderwaterWet: underwater * 0.72,
    manualUnderwaterCutoffHz: exponentialRange(18_000, 460, underwater),
    manualUnderwaterSecondCutoffHz: exponentialRange(20_000, 720, underwater),
    manualUnderwaterResonance: 0.7 + underwater * 3.8,
    manualUnderwaterPressureGainDb: underwater * 8,
    manualUnderwaterMakeupGain: 0.9 + underwater * 0.12,
    phaserDry: 1 - phaser * 0.24,
    phaserWet: phaser * 0.96,
    phaserCenterHz: 420 + phaser * 380,
    phaserModulationHz: phaser * 980,
    phaserRateHz: 0.12 + phaser * 0.72,
    phaserFeedback: phaser * 0.48,
    bitcrushDry: 1 - bitcrush * 0.92,
    bitcrushWet: bitcrush,
    bitcrushLevels: Math.max(8, Math.round(64 - bitcrush * 56)),
    bitcrushToneHz: exponentialRange(16_000, 3_400, bitcrush),
    bassDriveDry: 1 - bassDrive * 0.34,
    bassDriveWet: bassDrive * 0.72,
    bassDriveShelfDb: bassDrive * 18,
    bassDriveAmount: 1 + bassDrive * 10,
    bassDriveMakeup: 0.58 - bassDrive * 0.18,
    radioCutDry: 1 - radioCut * 0.96,
    radioCutWet: radioCut * 0.52,
    radioCutHighpassHz: 30 + radioCut * 650,
    radioCutLowpassHz: exponentialRange(20_000, 3_200, radioCut),
    radioCutPresenceDb: radioCut * 10,
    radioCutDrive: 1 + radioCut * 3.2,
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
  const normalizer = Math.tanh(amount);
  for (let index = 0; index < curve.length; index += 1) {
    const value = index / (curve.length - 1) * 2 - 1;
    curve[index] = Math.tanh(value * amount) / normalizer;
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

  const echoDry = context.createGain();
  const echoDelay = context.createDelay(0.8);
  const echoTone = context.createBiquadFilter();
  const echoWet = context.createGain();
  const echoFeedback = context.createGain();
  const echoSum = context.createGain();

  const underwaterDry = context.createGain();
  const underwaterOne = context.createBiquadFilter();
  const underwaterTwo = context.createBiquadFilter();
  const underwaterPressure = context.createBiquadFilter();
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
  const bassDriveShelf = context.createBiquadFilter();
  const bassDriveShaper = context.createWaveShaper();
  const bassDriveTone = context.createBiquadFilter();
  const bassDriveWet = context.createGain();
  const bassDriveSum = context.createGain();

  const radioCutDry = context.createGain();
  const radioCutHighpass = context.createBiquadFilter();
  const radioCutLowpass = context.createBiquadFilter();
  const radioCutPresence = context.createBiquadFilter();
  const radioCutShaper = context.createWaveShaper();
  const radioCutWet = context.createGain();
  const radioCutSum = context.createGain();

  const limiter = context.createDynamicsCompressor();
  const output = context.createGain();

  reverb.buffer = makeImpulse(context);
  reverb.normalize = true;
  reverbPreDelay.delayTime.value = 0.034;
  reverbHighpass.type = "highpass";
  reverbHighpass.frequency.value = 120;
  reverbTone.type = "lowpass";
  reverbTone.frequency.value = 7_200;
  echoTone.type = "lowpass";
  echoTone.frequency.value = 4_200;
  underwaterOne.type = "lowpass";
  underwaterTwo.type = "lowpass";
  underwaterPressure.type = "lowshelf";
  underwaterPressure.frequency.value = 180;
  phaserStages.forEach((stage, index) => {
    stage.type = "allpass";
    stage.frequency.value = 420 * (1 + index * 0.34);
    stage.Q.value = 0.9 + index * 0.18;
  });
  bitcrushShaper.oversample = "none";
  bitcrushTone.type = "lowpass";
  bassDriveShelf.type = "lowshelf";
  bassDriveShelf.frequency.value = 180;
  bassDriveShaper.oversample = "4x";
  bassDriveTone.type = "lowpass";
  bassDriveTone.frequency.value = 1_100;
  radioCutHighpass.type = "highpass";
  radioCutHighpass.Q.value = 0.9;
  radioCutLowpass.type = "lowpass";
  radioCutLowpass.Q.value = 0.85;
  radioCutPresence.type = "peaking";
  radioCutPresence.frequency.value = 1_650;
  radioCutPresence.Q.value = 1.2;
  radioCutShaper.oversample = "2x";
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
    echoWet.gain, echoFeedback.gain, underwaterWet.gain, phaserWet.gain,
    phaserFeedback.gain, ...phaserDepths.map((depth) => depth.gain),
    bitcrushWet.gain, bassDriveWet.gain, radioCutWet.gain,
  ]) gain.value = 0;

  input.connect(flangerDry).connect(flangerSum);
  input.connect(flangerDelay).connect(flangerWet).connect(flangerSum);
  flangerDelay.connect(flangerFeedback).connect(flangerDelay);
  flangerLfo.connect(flangerDepth).connect(flangerDelay.delayTime);

  flangerSum.connect(reverbDry).connect(reverbSum);
  flangerSum.connect(reverbPreDelay).connect(reverb).connect(reverbHighpass).connect(reverbTone).connect(reverbWet).connect(reverbSum);

  reverbSum.connect(echoDry).connect(echoSum);
  reverbSum.connect(echoDelay).connect(echoTone).connect(echoWet).connect(echoSum);
  echoTone.connect(echoFeedback).connect(echoDelay);

  echoSum.connect(underwaterDry).connect(underwaterSum);
  echoSum.connect(underwaterOne).connect(underwaterTwo).connect(underwaterPressure).connect(underwaterWet).connect(underwaterSum);

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
  bitcrushSum.connect(bassDriveShelf).connect(bassDriveShaper).connect(bassDriveTone).connect(bassDriveWet).connect(bassDriveSum);

  bassDriveSum.connect(radioCutDry).connect(radioCutSum);
  bassDriveSum.connect(radioCutHighpass).connect(radioCutLowpass).connect(radioCutPresence).connect(radioCutShaper).connect(radioCutWet).connect(radioCutSum);
  radioCutSum.connect(limiter).connect(output);

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
    setParam(echoDry.gain, parameters.echoDry, context);
    setParam(echoWet.gain, parameters.echoWet, context);
    setParam(echoDelay.delayTime, parameters.echoDelaySeconds, context);
    setParam(echoFeedback.gain, parameters.echoFeedback, context);
    setParam(underwaterDry.gain, parameters.manualUnderwaterDry, context);
    setParam(underwaterWet.gain, parameters.manualUnderwaterWet * parameters.manualUnderwaterMakeupGain, context, 0.06);
    setParam(underwaterOne.frequency, parameters.manualUnderwaterCutoffHz, context, 0.06);
    setParam(underwaterTwo.frequency, parameters.manualUnderwaterSecondCutoffHz, context, 0.06);
    setParam(underwaterOne.Q, parameters.manualUnderwaterResonance, context);
    setParam(underwaterTwo.Q, parameters.manualUnderwaterResonance * 0.82, context);
    setParam(underwaterPressure.gain, parameters.manualUnderwaterPressureGainDb, context);
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
    setParam(bassDriveWet.gain, parameters.bassDriveWet * parameters.bassDriveMakeup, context);
    setParam(bassDriveShelf.gain, parameters.bassDriveShelfDb, context);
    bassDriveShaper.curve = makeDriveCurve(parameters.bassDriveAmount);
    setParam(radioCutDry.gain, parameters.radioCutDry, context);
    setParam(radioCutWet.gain, parameters.radioCutWet, context);
    setParam(radioCutHighpass.frequency, parameters.radioCutHighpassHz, context);
    setParam(radioCutLowpass.frequency, parameters.radioCutLowpassHz, context);
    setParam(radioCutPresence.gain, parameters.radioCutPresenceDb, context);
    radioCutShaper.curve = makeDriveCurve(parameters.radioCutDrive);
    return Object.freeze({ values: current, parameters });
  };
  apply();

  const nodes = [
    input, flangerDry, flangerDelay, flangerWet, flangerFeedback, flangerSum,
    flangerLfo, flangerDepth, reverbDry, reverbPreDelay, reverb, reverbHighpass,
    reverbTone, reverbWet, reverbSum, echoDry, echoDelay, echoTone, echoWet,
    echoFeedback, echoSum, underwaterDry, underwaterOne, underwaterTwo,
    underwaterPressure, underwaterWet, underwaterSum, phaserDry, ...phaserStages,
    phaserWet, phaserFeedback, phaserSum, phaserLfo, ...phaserDepths, bitcrushDry,
    bitcrushShaper, bitcrushTone, bitcrushWet, bitcrushSum, bassDriveDry,
    bassDriveShelf, bassDriveShaper, bassDriveTone, bassDriveWet, bassDriveSum,
    radioCutDry, radioCutHighpass, radioCutLowpass, radioCutPresence,
    radioCutShaper, radioCutWet, radioCutSum, limiter, output,
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
