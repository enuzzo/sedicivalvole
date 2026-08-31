const clamp01 = (value) => Number.isFinite(value)
  ? Math.min(1, Math.max(0, value))
  : 0;

export const MANUAL_EFFECT_IDS = Object.freeze([
  "flanger",
  "reverb",
  "chorus",
  "echo",
]);

export const normalizeManualEffects = (values = {}) => Object.freeze(Object.fromEntries(
  MANUAL_EFFECT_IDS.map((id) => [id, clamp01(values[id])]),
));

const performanceCurve = (value) => Math.pow(value, 0.62);

export function manualEffectParameters(values = {}) {
  const manual = normalizeManualEffects(values);
  const flanger = performanceCurve(manual.flanger);
  const reverb = performanceCurve(manual.reverb);
  const chorus = performanceCurve(manual.chorus);
  const echo = performanceCurve(manual.echo);
  return Object.freeze({
    manual,
    shaped: Object.freeze({ flanger, reverb, chorus, echo }),
    flangerDry: 1 - flanger * 0.12,
    flangerWet: flanger * 0.82,
    flangerDelaySeconds: 0.0012 + flanger * 0.0043,
    flangerModulationSeconds: flanger * 0.0032,
    flangerFeedback: flanger * 0.52,
    flangerRateHz: 0.18 + flanger * 0.22,
    chorusDry: 1 - chorus * 0.18,
    chorusWet: chorus * 0.78,
    chorusDelaySeconds: 0.013 + chorus * 0.016,
    chorusModulationSeconds: chorus * 0.01,
    chorusRateHz: 0.22 + chorus * 0.18,
    reverbDry: 1 - reverb * 0.18,
    reverbWet: reverb * 0.78,
    echoDry: 1,
    echoWet: echo * 0.68,
    echoDelaySeconds: 0.24 + echo * 0.16,
    echoFeedback: echo * 0.52,
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

/** Creates one identical four-effect performance chain in any AudioContext. */
export function createManualEffectsGraph(context) {
  const input = context.createGain();
  const flangerDry = context.createGain();
  const flangerDelay = context.createDelay(0.02);
  const flangerWet = context.createGain();
  const flangerFeedback = context.createGain();
  const flangerSum = context.createGain();
  const chorusDry = context.createGain();
  const chorusDelay = context.createDelay(0.06);
  const chorusWet = context.createGain();
  const chorusSum = context.createGain();
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
  const limiter = context.createDynamicsCompressor();
  const output = context.createGain();
  const flangerLfo = context.createOscillator();
  const flangerDepth = context.createGain();
  const chorusLfo = context.createOscillator();
  const chorusDepth = context.createGain();

  reverb.buffer = makeImpulse(context);
  reverb.normalize = true;
  reverbPreDelay.delayTime.value = 0.034;
  reverbHighpass.type = "highpass";
  reverbHighpass.frequency.value = 120;
  reverbTone.type = "lowpass";
  reverbTone.frequency.value = 7_200;
  echoTone.type = "lowpass";
  echoTone.frequency.value = 4_200;
  flangerLfo.type = "sine";
  flangerLfo.frequency.value = 0.23;
  chorusLfo.type = "sine";
  chorusLfo.frequency.value = 0.41;
  limiter.threshold.value = -2.5;
  limiter.knee.value = 7;
  limiter.ratio.value = 10;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.13;

  input.connect(flangerDry).connect(flangerSum);
  input.connect(flangerDelay).connect(flangerWet).connect(flangerSum);
  flangerDelay.connect(flangerFeedback).connect(flangerDelay);
  flangerSum.connect(chorusDry).connect(chorusSum);
  flangerSum.connect(chorusDelay).connect(chorusWet).connect(chorusSum);
  chorusSum.connect(reverbDry).connect(reverbSum);
  chorusSum.connect(reverbPreDelay).connect(reverb).connect(reverbHighpass).connect(reverbTone).connect(reverbWet).connect(reverbSum);
  reverbSum.connect(echoDry).connect(echoSum);
  reverbSum.connect(echoDelay).connect(echoTone).connect(echoWet).connect(echoSum);
  echoSum.connect(limiter).connect(output);
  echoTone.connect(echoFeedback).connect(echoDelay);
  flangerLfo.connect(flangerDepth).connect(flangerDelay.delayTime);
  chorusLfo.connect(chorusDepth).connect(chorusDelay.delayTime);
  flangerLfo.start();
  chorusLfo.start();

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
    setParam(chorusDry.gain, parameters.chorusDry, context);
    setParam(chorusWet.gain, parameters.chorusWet, context);
    setParam(chorusDelay.delayTime, parameters.chorusDelaySeconds, context);
    setParam(chorusDepth.gain, parameters.chorusModulationSeconds, context);
    setParam(chorusLfo.frequency, parameters.chorusRateHz, context);
    setParam(reverbDry.gain, parameters.reverbDry, context);
    setParam(reverbWet.gain, parameters.reverbWet, context);
    setParam(echoDry.gain, parameters.echoDry, context);
    setParam(echoWet.gain, parameters.echoWet, context);
    setParam(echoDelay.delayTime, parameters.echoDelaySeconds, context);
    setParam(echoFeedback.gain, parameters.echoFeedback, context);
    return Object.freeze({ values: current, parameters });
  };
  apply();

  return Object.freeze({
    input,
    output,
    set(values) { return destroyed ? null : apply(values); },
    getSnapshot: () => Object.freeze({ values: current, destroyed }),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      try { flangerLfo.stop(); } catch { /* already stopped */ }
      try { chorusLfo.stop(); } catch { /* already stopped */ }
      for (const node of [
        input, flangerDry, flangerDelay, flangerWet, flangerFeedback, flangerSum,
        chorusDry, chorusDelay, chorusWet, chorusSum, reverbDry, reverbPreDelay,
        reverb, reverbHighpass, reverbTone, reverbWet, reverbSum, echoDry,
        echoDelay, echoTone, echoWet, echoFeedback,
        echoSum, limiter,
        output, flangerLfo, flangerDepth, chorusLfo, chorusDepth,
      ]) {
        try { node.disconnect(); } catch { /* best-effort teardown */ }
      }
    },
  });
}
