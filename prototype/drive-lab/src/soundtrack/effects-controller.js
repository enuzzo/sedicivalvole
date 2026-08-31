import bloomProcessorUrl from "../score/worklet/bloom-processor.js?audio-worklet";
import repeatProcessorUrl from "./soundtrack-repeat-processor.js?audio-worklet";
import {
  SOUNDTRACK_PLAYBACK_INVARIANTS,
} from "./playback-boundary.js";
import {
  normalizeSoundtrackManualEffects,
  normalizeSoundtrackVehicleMacros,
  soundtrackEffectParameters,
} from "./effects-model.js";

export {
  normalizeSoundtrackManualEffects,
  normalizeSoundtrackVehicleMacros,
  soundtrackEffectParameters,
} from "./effects-model.js";

export const SOUNDTRACK_EFFECTS_SCHEMA = "sedicivalvole.soundtrack-effects.v1";

const setParam = (param, value, context, seconds = 0.045) => {
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

function makeImpulse(context, seconds = 1.7) {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    let seed = 0x6d2b79f5 ^ (channel * 0x9e3779b9);
    for (let index = 0; index < length; index += 1) {
      seed = Math.imul(seed ^ (seed >>> 15), seed | 1);
      seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61);
      const noise = (((seed ^ (seed >>> 14)) >>> 0) / 0xffffffff) * 2 - 1;
      data[index] = noise * (1 - index / length) ** 2.8;
    }
  }
  return buffer;
}

function createUnavailableController(reason = "web-audio-unavailable") {
  let vehicleMaster = false;
  let vehicleMacros = normalizeSoundtrackVehicleMacros();
  let manualEffects = normalizeSoundtrackManualEffects();
  let destroyed = false;
  const getSnapshot = () => Object.freeze({
    schema: SOUNDTRACK_EFFECTS_SCHEMA,
    status: destroyed ? "destroyed" : "unavailable",
    reason,
    vehicleMaster,
    vehicleMacros,
    manualEffects,
    attachedMediaElements: 0,
    playbackRate: SOUNDTRACK_PLAYBACK_INVARIANTS.playbackRate,
  });
  return Object.freeze({
    attachMedia: () => getSnapshot(),
    detachMedia: () => getSnapshot(),
    resume: async () => getSnapshot(),
    setVehicleMaster(value) { vehicleMaster = value === true; return getSnapshot(); },
    setVehicleMacros(values) { vehicleMacros = normalizeSoundtrackVehicleMacros(values); return getSnapshot(); },
    setManualEffects(values) { manualEffects = normalizeSoundtrackManualEffects(values); return getSnapshot(); },
    getSnapshot,
    destroy() { destroyed = true; return getSnapshot(); },
  });
}

export function createSoundtrackEffectsController({
  AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext,
} = {}) {
  if (typeof AudioContextClass !== "function") return createUnavailableController();
  let context;
  try {
    context = new AudioContextClass({ latencyHint: "interactive" });
  } catch (error) {
    return createUnavailableController(String(error?.message || "audio-context-failed").slice(0, 80));
  }

  const input = context.createGain();
  const openScoop = context.createBiquadFilter();
  const openAir = context.createBiquadFilter();
  const openFocus = context.createBiquadFilter();
  const openFocusGain = context.createGain();
  const openSum = context.createGain();
  const underwaterOne = context.createBiquadFilter();
  const underwaterTwo = context.createBiquadFilter();
  const postVehicle = context.createGain();
  const flangerDry = context.createGain();
  const flangerDelay = context.createDelay(0.02);
  const flangerWet = context.createGain();
  const flangerSum = context.createGain();
  const chorusDry = context.createGain();
  const chorusDelay = context.createDelay(0.05);
  const chorusWet = context.createGain();
  const chorusSum = context.createGain();
  const reverbDry = context.createGain();
  const reverb = context.createConvolver();
  const reverbWet = context.createGain();
  const reverbSum = context.createGain();
  const output = context.createGain();
  const limiter = context.createDynamicsCompressor();
  const analyser = context.createAnalyser();
  const master = context.createGain();
  const flangerLfo = context.createOscillator();
  const flangerDepth = context.createGain();
  const chorusLfo = context.createOscillator();
  const chorusDepth = context.createGain();

  openScoop.type = "peaking";
  openScoop.frequency.value = 320;
  openScoop.Q.value = 0.78;
  openAir.type = "highshelf";
  openAir.frequency.value = 5_800;
  openFocus.type = "bandpass";
  openFocus.frequency.value = 520;
  openFocus.Q.value = 0.82;
  underwaterOne.type = "lowpass";
  underwaterTwo.type = "lowpass";
  reverb.buffer = makeImpulse(context);
  limiter.threshold.value = -2.5;
  limiter.knee.value = 8;
  limiter.ratio.value = 10;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.14;
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.58;
  master.gain.value = 0.92;

  input.connect(openScoop);
  openScoop.connect(openAir);
  openAir.connect(openSum);
  openAir.connect(openFocus);
  openFocus.connect(openFocusGain);
  openFocusGain.connect(openSum);
  openSum.connect(underwaterOne);
  underwaterOne.connect(underwaterTwo);
  underwaterTwo.connect(postVehicle);
  postVehicle.connect(flangerDry);
  postVehicle.connect(flangerDelay);
  flangerDry.connect(flangerSum);
  flangerDelay.connect(flangerWet);
  flangerWet.connect(flangerSum);
  flangerSum.connect(chorusDry);
  flangerSum.connect(chorusDelay);
  chorusDry.connect(chorusSum);
  chorusDelay.connect(chorusWet);
  chorusWet.connect(chorusSum);
  chorusSum.connect(reverbDry);
  chorusSum.connect(reverb);
  reverbDry.connect(reverbSum);
  reverb.connect(reverbWet);
  reverbWet.connect(reverbSum);
  reverbSum.connect(output);
  output.connect(limiter);
  limiter.connect(analyser);
  analyser.connect(master);
  master.connect(context.destination);

  flangerLfo.type = "sine";
  flangerLfo.frequency.value = 0.19;
  flangerLfo.connect(flangerDepth);
  flangerDepth.connect(flangerDelay.delayTime);
  chorusLfo.type = "sine";
  chorusLfo.frequency.value = 0.43;
  chorusLfo.connect(chorusDepth);
  chorusDepth.connect(chorusDelay.delayTime);
  flangerLfo.start();
  chorusLfo.start();

  const mediaSources = new Map();
  const meterBuffer = new Float32Array(analyser.fftSize);
  let vehicleMaster = false;
  let vehicleMacros = normalizeSoundtrackVehicleMacros();
  let manualEffects = normalizeSoundtrackManualEffects();
  let destroyed = false;
  let bloomNode = null;
  let repeatNode = null;
  let bloomActive = false;
  let workletStatus = typeof context.audioWorklet?.addModule === "function" ? "loading" : "unavailable";
  let workletError = null;

  const apply = () => {
    const values = soundtrackEffectParameters({ vehicleMaster, vehicleMacros, manualEffects });
    setParam(openScoop.gain, values.openScoopDb, context);
    setParam(openAir.gain, values.openAirDb, context);
    setParam(openFocusGain.gain, values.openFocusGain, context);
    setParam(underwaterOne.frequency, values.underwaterCutoffHz, context, 0.08);
    setParam(underwaterTwo.frequency, values.underwaterCutoffHz * 1.1, context, 0.08);
    setParam(underwaterOne.Q, values.underwaterResonance, context);
    setParam(underwaterTwo.Q, Math.max(0.7, values.underwaterResonance * 0.62), context);
    setParam(flangerDry.gain, 1 - values.flangerWet * 0.5, context);
    setParam(flangerWet.gain, values.flangerWet, context);
    setParam(flangerDelay.delayTime, values.flangerDelaySeconds, context);
    setParam(flangerDepth.gain, values.flangerWet * 0.0025, context);
    setParam(chorusDry.gain, 1 - values.chorusWet * 0.35, context);
    setParam(chorusWet.gain, values.chorusWet, context);
    setParam(chorusDelay.delayTime, values.chorusDelaySeconds, context);
    setParam(chorusDepth.gain, values.chorusWet * 0.006, context);
    setParam(reverbDry.gain, 1 - values.reverbWet * 0.32, context);
    setParam(reverbWet.gain, values.reverbWet, context);
    repeatNode?.port.postMessage({ type: "SET_AMOUNT", amount: values.beatRepeat });
    const shouldBloom = values.bloom > 0.06;
    if (bloomNode && shouldBloom !== bloomActive) {
      bloomNode.port.postMessage({ type: shouldBloom ? "TRIGGER" : "RELEASE" });
      bloomActive = shouldBloom;
    }
  };
  apply();

  const ready = (async () => {
    if (workletStatus === "unavailable") return;
    try {
      await Promise.all([
        context.audioWorklet.addModule(bloomProcessorUrl),
        context.audioWorklet.addModule(repeatProcessorUrl),
      ]);
      if (destroyed) return;
      bloomNode = new AudioWorkletNode(context, "bloom-processor", { outputChannelCount: [2] });
      repeatNode = new AudioWorkletNode(context, "soundtrack-repeat-processor", { outputChannelCount: [2] });
      postVehicle.disconnect();
      postVehicle.connect(bloomNode);
      bloomNode.connect(flangerDry);
      bloomNode.connect(flangerDelay);
      reverbSum.disconnect();
      reverbSum.connect(repeatNode);
      repeatNode.connect(output);
      const bypass = (node, upstream, downstreams) => {
        node.onprocessorerror = () => {
          try { upstream.disconnect(); } catch { /* already disconnected */ }
          try { node.disconnect(); } catch { /* already disconnected */ }
          for (const downstream of downstreams) upstream.connect(downstream);
          workletStatus = "degraded";
          workletError = "processor-error";
        };
      };
      bypass(bloomNode, postVehicle, [flangerDry, flangerDelay]);
      bypass(repeatNode, reverbSum, [output]);
      workletStatus = "ready";
      apply();
    } catch (error) {
      workletStatus = "degraded";
      workletError = String(error?.message || "worklet-load-failed").slice(0, 80);
    }
  })();

  const getLevel = () => {
    if (destroyed) return 0;
    analyser.getFloatTimeDomainData(meterBuffer);
    let sum = 0;
    for (const sample of meterBuffer) sum += sample * sample;
    return Math.min(1, Math.sqrt(sum / meterBuffer.length) * 2.2);
  };
  const getSnapshot = () => Object.freeze({
    schema: SOUNDTRACK_EFFECTS_SCHEMA,
    status: destroyed ? "destroyed" : context.state,
    workletStatus,
    workletError,
    vehicleMaster,
    vehicleMacros,
    manualEffects,
    attachedMediaElements: mediaSources.size,
    playbackRate: SOUNDTRACK_PLAYBACK_INVARIANTS.playbackRate,
    level: getLevel(),
  });

  const controller = {
    context,
    ready,
    attachMedia(key, media) {
      if (destroyed || !key || !media || mediaSources.has(key)) return getSnapshot();
      try {
        const source = context.createMediaElementSource(media);
        source.connect(input);
        mediaSources.set(key, { media, source });
      } catch (error) {
        workletError = String(error?.message || "media-source-failed").slice(0, 80);
      }
      return getSnapshot();
    },
    detachMedia(key) {
      const record = mediaSources.get(key);
      if (record) {
        try { record.source.disconnect(); } catch { /* teardown is best effort */ }
        mediaSources.delete(key);
      }
      return getSnapshot();
    },
    async resume() {
      await ready;
      if (!destroyed && context.state === "suspended") await context.resume();
      return getSnapshot();
    },
    setVehicleMaster(value) { vehicleMaster = value === true; apply(); return getSnapshot(); },
    setVehicleMacros(values) { vehicleMacros = normalizeSoundtrackVehicleMacros(values); apply(); return getSnapshot(); },
    setManualEffects(values) { manualEffects = normalizeSoundtrackManualEffects(values); apply(); return getSnapshot(); },
    getLevel,
    getSnapshot,
    destroy() {
      if (destroyed) return getSnapshot();
      destroyed = true;
      for (const key of [...mediaSources.keys()]) controller.detachMedia(key);
      try { flangerLfo.stop(); } catch { /* already stopped */ }
      try { chorusLfo.stop(); } catch { /* already stopped */ }
      void context.close?.();
      return getSnapshot();
    },
  };
  return Object.freeze(controller);
}
