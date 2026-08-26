import { clamp, energyToSection, speedToBpm, speedToEnergy } from "./signal-model.js";

const SCALE = [0, 3, 5, 7, 10];
const BASS_DEGREES = [0, 0, 3, 0, 2, 0, 4, 3];
const MOTIF_DEGREES = [0, 2, 4, 3, 2, 1, 3, 4];
const KICK_PATTERNS = [
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  [1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1],
];

const midiToHz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function envelope(param, time, attack, release, peak) {
  param.cancelScheduledValues(time);
  param.setValueAtTime(0.0001, time);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + attack);
  param.exponentialRampToValueAtTime(0.0001, time + attack + release);
}

function createBus(context, destination, initialGain = 0.0001) {
  const gain = context.createGain();
  gain.gain.value = initialGain;
  gain.connect(destination);
  return gain;
}

export function createAudioEngine(onPulse) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext({ latencyHint: "interactive" });
  const analyser = context.createAnalyser();
  const limiter = context.createDynamicsCompressor();
  const master = context.createGain();
  analyser.fftSize = 256;
  limiter.threshold.value = -12;
  limiter.knee.value = 10;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.22;
  master.gain.value = 0.0001;
  master.connect(analyser).connect(limiter).connect(context.destination);

  const delay = context.createDelay(0.8);
  const delayFilter = context.createBiquadFilter();
  const delayFeedback = context.createGain();
  const delayReturn = context.createGain();
  delay.delayTime.value = 0.245;
  delayFilter.type = "lowpass";
  delayFilter.frequency.value = 2400;
  delayFeedback.gain.value = 0.28;
  delayReturn.gain.value = 0.13;
  delay.connect(delayFilter);
  delayFilter.connect(delayFeedback).connect(delay);
  delayFilter.connect(delayReturn).connect(master);

  const toneFilter = context.createBiquadFilter();
  toneFilter.type = "lowpass";
  toneFilter.frequency.value = 720;
  toneFilter.Q.value = 0.7;
  toneFilter.connect(master);

  const drumsBus = createBus(context, master);
  const lowBus = createBus(context, toneFilter);
  const harmonyBus = createBus(context, toneFilter);
  const motionBus = createBus(context, toneFilter);
  harmonyBus.connect(delay);
  motionBus.connect(delay);

  let speed = 0;
  let fullEnergyKmh = 120;
  let energy = 0;
  let section = 0;
  let pendingSection = 0;
  let pendingBars = 0;
  let step = 0;
  let nextStep = context.currentTime + 0.08;
  let running = true;
  let muted = false;
  let lastSpeedAt = context.currentTime;
  let lastTransitionAt = -10;

  const createNoise = (duration) => {
    const length = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) channel[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    return source;
  };

  const kick = (time, gainValue = 0.18) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(126, time);
    oscillator.frequency.exponentialRampToValueAtTime(43, time + 0.07);
    envelope(gain.gain, time, 0.003, 0.28, gainValue);
    oscillator.connect(gain).connect(drumsBus);
    oscillator.start(time);
    oscillator.stop(time + 0.34);
  };

  const hat = (time, gainValue = 0.024, open = false) => {
    const source = createNoise(open ? 0.16 : 0.065);
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "highpass";
    filter.frequency.value = open ? 5400 : 7200;
    envelope(gain.gain, time, 0.001, open ? 0.13 : 0.045, gainValue);
    source.connect(filter).connect(gain).connect(drumsBus);
    source.start(time);
    source.stop(time + (open ? 0.17 : 0.075));
  };

  const clap = (time, gainValue = 0.04) => {
    [0, 0.012, 0.026].forEach((offset, index) => {
      const source = createNoise(0.09);
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      filter.type = "bandpass";
      filter.frequency.value = 1250 + index * 280;
      filter.Q.value = 0.8;
      envelope(gain.gain, time + offset, 0.001, 0.065, gainValue / 3);
      source.connect(filter).connect(gain).connect(drumsBus);
      source.start(time + offset);
      source.stop(time + offset + 0.1);
    });
  };

  const bass = (time, midi, duration, gainValue = 0.075) => {
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.Q.value = 4.2;
    filter.frequency.setValueAtTime(180, time);
    filter.frequency.exponentialRampToValueAtTime(420 + energy * 820, time + 0.045);
    filter.frequency.exponentialRampToValueAtTime(170, time + duration);
    [{ type: "sawtooth", detune: -3 }, { type: "triangle", detune: 3 }].forEach(({ type, detune }) => {
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = midiToHz(midi);
      oscillator.detune.value = detune;
      oscillator.connect(filter);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.04);
    });
    envelope(gain.gain, time, 0.008, duration, gainValue);
    filter.connect(gain).connect(lowBus);
  };

  const chord = (time, rootMidi, duration, gainValue = 0.028) => {
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 820 + energy * 1750;
    filter.Q.value = 0.55;
    [0, 3, 7, 10, 14].forEach((interval, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index % 2 === 0 ? "triangle" : "sine";
      oscillator.frequency.value = midiToHz(rootMidi + interval);
      oscillator.detune.value = (index - 2) * 2.5;
      oscillator.connect(filter);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.08);
    });
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainValue, time + Math.min(0.16, duration * 0.18));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    filter.connect(gain).connect(harmonyBus);
  };

  const motif = (time, midi, duration, gainValue = 0.025) => {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = midiToHz(midi);
    filter.type = "bandpass";
    filter.frequency.value = 1250 + energy * 2100;
    filter.Q.value = 1.4;
    envelope(gain.gain, time, 0.012, duration, gainValue);
    oscillator.connect(filter).connect(gain).connect(motionBus);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.04);
  };

  const transition = (direction, strength = 0.6) => {
    const time = context.currentTime;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(direction === "up" ? 52 : 138, time);
    oscillator.frequency.exponentialRampToValueAtTime(direction === "up" ? 126 : 48, time + 0.46);
    filter.type = "lowpass";
    filter.frequency.value = 620;
    envelope(gain.gain, time, 0.018, 0.48, 0.018 + strength * 0.018);
    oscillator.connect(filter).connect(gain).connect(motionBus);
    oscillator.start(time);
    oscillator.stop(time + 0.54);
  };

  const sectionMix = [
    { drums: 0.16, low: 0.0001, harmony: 0.28, motion: 0.0001 },
    { drums: 0.36, low: 0.30, harmony: 0.34, motion: 0.13 },
    { drums: 0.52, low: 0.46, harmony: 0.40, motion: 0.25 },
    { drums: 0.66, low: 0.58, harmony: 0.48, motion: 0.36 },
  ];

  const applySectionMix = (nextSection, time) => {
    const mix = sectionMix[nextSection];
    const transitionTime = Math.max(0.16, 60 / speedToBpm(speed) * 0.7);
    drumsBus.gain.setTargetAtTime(mix.drums, time, transitionTime);
    lowBus.gain.setTargetAtTime(mix.low, time, transitionTime);
    harmonyBus.gain.setTargetAtTime(mix.harmony, time, transitionTime);
    motionBus.gain.setTargetAtTime(mix.motion, time, transitionTime);
  };

  const reviewSectionAtBar = (time) => {
    const candidate = energyToSection(energy, section);
    if (candidate === section) {
      pendingSection = section;
      pendingBars = 0;
      return;
    }
    if (candidate !== pendingSection) {
      pendingSection = candidate;
      pendingBars = 1;
      return;
    }
    pendingBars += 1;
    if (pendingBars < 2) return;
    const previous = section;
    section = candidate;
    pendingBars = 0;
    applySectionMix(section, time);
    chord(time, section >= previous ? 48 + section * 2 : 45, 60 / speedToBpm(speed) * 3.8, 0.022);
  };

  const playStep = (index, time) => {
    const bpm = speedToBpm(speed);
    const sixteenth = 60 / bpm / 4;
    if (index === 0) reviewSectionAtBar(time);
    if (KICK_PATTERNS[section][index]) kick(time, 0.14 + section * 0.018 + energy * 0.025);
    if (section >= 1 && [0, 3, 6, 10, 14].includes(index)) {
      const degree = SCALE[BASS_DEGREES[Math.floor(index / 2) % BASS_DEGREES.length] % SCALE.length];
      bass(time, 33 + degree, sixteenth * (index === 14 ? 1.6 : 3.2), 0.052 + energy * 0.028);
    }
    if (section >= 1 && index % (section >= 3 ? 2 : 4) === 2) hat(time, 0.018 + energy * 0.014, index === 14);
    if (section >= 2 && (index === 4 || index === 12)) clap(time, 0.032 + energy * 0.016);
    if (section >= 3 && index % 4 === 1) hat(time, 0.012 + energy * 0.009);
    if (index === 0) chord(time, [45, 45, 48, 50][section], sixteenth * 15.5, 0.018 + energy * 0.018);
    if (section >= 2 && [2, 5, 9, 13].includes(index)) {
      const degree = SCALE[MOTIF_DEGREES[index % MOTIF_DEGREES.length] % SCALE.length];
      motif(time, 69 + degree + (section === 3 && index === 13 ? 12 : 0), sixteenth * 1.7, 0.016 + energy * 0.018);
    }
    if (index % (section >= 2 ? 2 : 4) === 0) onPulse?.();
  };

  applySectionMix(0, context.currentTime);
  const scheduler = window.setInterval(() => {
    if (!running || context.state !== "running") return;
    while (nextStep < context.currentTime + 0.12) {
      playStep(step, Math.max(nextStep, context.currentTime + 0.008));
      nextStep += 60 / speedToBpm(speed) / 4;
      step = (step + 1) % 16;
    }
  }, 25);

  return {
    context,
    resume: async () => {
      await context.resume();
      nextStep = Math.max(nextStep, context.currentTime + 0.06);
    },
    setMuted(nextMuted) {
      muted = nextMuted;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(muted ? 0.0001 : 0.42, context.currentTime, 0.045);
    },
    setPerformance(nextPerformance) {
      fullEnergyKmh = clamp(nextPerformance?.fullEnergyKmh ?? fullEnergyKmh, 60, 180);
      energy = speedToEnergy(speed, fullEnergyKmh);
    },
    setSpeed(nextSpeed) {
      const time = context.currentTime;
      const normalized = clamp(nextSpeed, 0, 260);
      const elapsed = Math.max(0.12, time - lastSpeedAt);
      const acceleration = (normalized - speed) / elapsed;
      speed = normalized;
      energy = speedToEnergy(speed, fullEnergyKmh);
      lastSpeedAt = time;
      toneFilter.frequency.setTargetAtTime(520 + energy * 2900, time, acceleration >= 0 ? 0.16 : 0.44);
      delayReturn.gain.setTargetAtTime(0.08 + energy * 0.13, time, 0.38);
      delayFeedback.gain.setTargetAtTime(0.2 + energy * 0.16, time, 0.42);
      if (time - lastTransitionAt > 1.8 && Math.abs(acceleration) > 7 && normalized > 4) {
        transition(acceleration > 0 ? "up" : "down", clamp(Math.abs(acceleration) / 32, 0.25, 1));
        lastTransitionAt = time;
      }
    },
    startCue() {
      const time = context.currentTime;
      chord(time, 45, 1.8, 0.045);
      motif(time + 0.14, 69, 0.42, 0.025);
      motif(time + 0.28, 72, 0.5, 0.022);
    },
    brake() {
      const time = context.currentTime;
      const source = createNoise(0.38);
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, time);
      filter.frequency.exponentialRampToValueAtTime(180, time + 0.32);
      envelope(gain.gain, time, 0.004, 0.34, 0.035);
      source.connect(filter).connect(gain).connect(motionBus);
      source.start(time);
      source.stop(time + 0.4);
      kick(time + 0.02, 0.12);
    },
    getLevel() {
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += sample * sample;
      return clamp(Math.sqrt(sum / samples.length) * 6, 0, 1);
    },
    getState() {
      return { environment: "aperture", energy, section, fullEnergyKmh };
    },
    destroy() {
      if (!running) return;
      running = false;
      window.clearInterval(scheduler);
      if (context.state !== "closed") context.close().catch(() => {});
    },
  };
}
