import { clamp, speedToBpm, speedToEnergy, speedToWave } from "./signal-model.js";

const PATTERNS = {
  kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  bass:  [1,0,1,0, 0,0,1,0, 1,0,1,0, 0,0,1,0],
  hat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
  snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
  arp:   [1,0,1,1, 0,1,0,1, 1,0,1,1, 0,1,0,1],
};

const SCALE = [0, 3, 5, 7, 10];
const DEGREES = [0, 2, 4, 3, 0, 4, 2, 1];
const midiToHz = (midi) => 440 * 2 ** ((midi - 69) / 12);

function envelope(param, time, attack, decay, peak) {
  param.setValueAtTime(0.0001, time);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + attack);
  param.exponentialRampToValueAtTime(0.0001, time + attack + decay);
}

export function createAudioEngine(onPulse) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext({ latencyHint: "interactive" });
  const master = context.createGain();
  const analyser = context.createAnalyser();
  const limiter = context.createDynamicsCompressor();
  master.gain.value = 0.0001;
  analyser.fftSize = 256;
  limiter.threshold.value = -10;
  limiter.knee.value = 12;
  limiter.ratio.value = 10;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  master.connect(analyser).connect(limiter).connect(context.destination);

  const delayInput = context.createGain();
  const delay = context.createDelay(1.2);
  const delayFilter = context.createBiquadFilter();
  const feedback = context.createGain();
  const wet = context.createGain();
  delay.delayTime.value = 0.31;
  delayFilter.type = "lowpass";
  delayFilter.frequency.value = 2300;
  feedback.gain.value = 0.29;
  wet.gain.value = 0.26;
  delayInput.connect(delay).connect(delayFilter);
  delayFilter.connect(feedback).connect(delay);
  delayFilter.connect(wet).connect(master);

  const droneGain = context.createGain();
  const droneFilter = context.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 360;
  droneGain.gain.value = 0.0001;
  droneFilter.connect(droneGain).connect(master);
  const droneOscillators = [33, 40].map((midi, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = index === 0 ? "sawtooth" : "triangle";
    oscillator.frequency.value = midiToHz(midi) * (index ? 0.998 : 1);
    oscillator.connect(droneFilter);
    oscillator.start();
    return oscillator;
  });

  const energyWaveGain = context.createGain();
  const energyWaveFilter = context.createBiquadFilter();
  const energyWaveOvertoneGain = context.createGain();
  const initialWave = speedToWave(0);
  energyWaveGain.gain.value = initialWave.gain;
  energyWaveFilter.type = "lowpass";
  energyWaveFilter.frequency.value = 240;
  energyWaveFilter.Q.value = 0.7;
  energyWaveOvertoneGain.gain.value = 0.16;
  energyWaveFilter.connect(energyWaveGain).connect(master);

  const energyWaveOscillators = [
    { type: "sine", ratio: 1, detune: 0 },
    { type: "triangle", ratio: 2, detune: 3 },
  ].map(({ type, ratio, detune }, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = initialWave.frequencyHz * ratio;
    oscillator.detune.value = detune;
    if (index === 0) oscillator.connect(energyWaveFilter);
    else oscillator.connect(energyWaveOvertoneGain).connect(energyWaveFilter);
    oscillator.start();
    return { oscillator, ratio };
  });

  let speed = 0;
  let step = 0;
  let nextStep = context.currentTime + 0.08;
  let running = true;
  let muted = false;
  let lastSpeedAt = context.currentTime;
  let lastMotionCueAt = -10;
  let mix = { atmosphere: 0.66, harmonics: 0.48, pulse: 0.52 };

  const noise = (duration) => {
    const length = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    return source;
  };

  const kick = (time, gainValue) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(138, time);
    oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.055);
    envelope(gain.gain, time, 0.003, 0.3, gainValue);
    oscillator.connect(gain).connect(master);
    oscillator.start(time);
    oscillator.stop(time + 0.38);
  };

  const hat = (time, gainValue) => {
    const source = noise(0.08);
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "highpass";
    filter.frequency.value = 6800;
    envelope(gain.gain, time, 0.001, 0.045, gainValue);
    source.connect(filter).connect(gain).connect(master);
    source.start(time);
    source.stop(time + 0.085);
  };

  const snare = (time, gainValue) => {
    const source = noise(0.2);
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 1750;
    filter.Q.value = 0.65;
    envelope(gain.gain, time, 0.002, 0.13, gainValue);
    source.connect(filter).connect(gain).connect(master);
    source.start(time);
    source.stop(time + 0.19);
  };

  const bass = (time, gainValue, midi, duration) => {
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(190, time);
    filter.frequency.exponentialRampToValueAtTime(520 + gainValue * 1100, time + 0.055);
    filter.frequency.exponentialRampToValueAtTime(190, time + duration);
    ["sawtooth", "square"].forEach((type, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = midiToHz(midi) * (index ? 0.998 : 1);
      oscillator.connect(filter);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.04);
    });
    envelope(gain.gain, time, 0.008, duration, gainValue);
    filter.connect(gain).connect(master);
  };

  const arp = (time, gainValue, midi) => {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = midiToHz(midi);
    filter.type = "lowpass";
    filter.Q.value = 3.5;
    filter.frequency.value = 950 + gainValue * 2600;
    envelope(gain.gain, time, 0.005, 0.15, gainValue);
    oscillator.connect(filter).connect(gain);
    gain.connect(master);
    gain.connect(delayInput);
    oscillator.start(time);
    oscillator.stop(time + 0.2);
  };

  const pad = (time, gainValue, duration) => {
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 750 + gainValue * 1700;
    [0, 7, 12, 15].forEach((interval, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "triangle";
      oscillator.frequency.value = midiToHz(57 + interval) * (1 + (index - 1.5) * 0.0015);
      oscillator.connect(filter);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.05);
    });
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainValue, time + duration * 0.34);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    filter.connect(gain);
    gain.connect(master);
    gain.connect(delayInput);
  };

  const layerGain = (energy, threshold, scale) => clamp((energy - threshold) / 0.14, 0, 1) * scale;

  const playStep = (index, time) => {
    const energy = speedToEnergy(speed);
    const bpm = speedToBpm(speed);
    const sixteenth = 60 / bpm / 4;
    const pulseMix = 0.48 + mix.pulse * 0.52;
    const harmonicMix = 0.42 + mix.harmonics * 0.58;
    const degree = SCALE[DEGREES[index % DEGREES.length] % SCALE.length];

    const kickGain = layerGain(energy, 0.06, 0.27 * pulseMix);
    const bassGain = layerGain(energy, 0.22, 0.11 * harmonicMix);
    const hatGain = layerGain(energy, 0.38, 0.065 * pulseMix);
    const snareGain = layerGain(energy, 0.52, 0.11 * pulseMix);
    const arpGain = layerGain(energy, 0.67, 0.055 * harmonicMix);
    const padGain = layerGain(energy, 0.84, 0.035 * harmonicMix);
    const driveKickGain = layerGain(energy, 0.56, 0.075 * pulseMix);
    const fastHatGain = layerGain(energy, 0.64, 0.034 * pulseMix);

    if (PATTERNS.kick[index] && kickGain > 0.004) kick(time, kickGain);
    if (PATTERNS.bass[index] && bassGain > 0.004) bass(time, bassGain, 33 + degree, sixteenth * 5.2);
    if (PATTERNS.hat[index] && hatGain > 0.004) hat(time, hatGain);
    if (PATTERNS.snare[index] && snareGain > 0.004) snare(time, snareGain);
    if (PATTERNS.arp[index] && arpGain > 0.004) arp(time, arpGain, 69 + degree + (index % 4 === 3 ? 12 : 0));
    if (index === 0 && padGain > 0.004) pad(time, padGain, 60 / bpm * 4);
    if (index % 4 === 2 && driveKickGain > 0.004) kick(time, driveKickGain);
    if (index % 2 === 1 && fastHatGain > 0.004) hat(time, fastHatGain);
    if (index % (energy > 0.58 ? 2 : 4) === 0) onPulse?.();
  };

  const scheduler = window.setInterval(() => {
    if (!running || context.state !== "running") return;
    while (nextStep < context.currentTime + 0.12) {
      playStep(step, Math.max(nextStep, context.currentTime + 0.008));
      nextStep += 60 / speedToBpm(speed) / 4;
      step = (step + 1) % 16;
    }
  }, 25);

  const motionCue = (direction, strength) => {
    const time = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = direction === "up" ? "sawtooth" : "triangle";
    oscillator.frequency.setValueAtTime(direction === "up" ? 70 : 180, time);
    oscillator.frequency.exponentialRampToValueAtTime(direction === "up" ? 210 : 52, time + 0.48);
    envelope(gain.gain, time, 0.01, 0.5, 0.025 + strength * 0.035);
    oscillator.connect(gain);
    gain.connect(master);
    gain.connect(delayInput);
    oscillator.start(time);
    oscillator.stop(time + 0.56);
  };

  return {
    context,
    resume: async () => {
      await context.resume();
      nextStep = Math.max(nextStep, context.currentTime + 0.06);
    },
    setMuted(nextMuted) {
      muted = nextMuted;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(muted ? 0.0001 : 0.38, context.currentTime, 0.04);
    },
    setSpeed(nextSpeed) {
      const time = context.currentTime;
      const normalized = clamp(nextSpeed, 0, 260);
      const elapsed = Math.max(0.12, time - lastSpeedAt);
      const acceleration = (normalized - speed) / elapsed;
      if (time - lastMotionCueAt > 1.25 && Math.abs(acceleration) > 5 && Math.abs(normalized - speed) > 1.3) {
        motionCue(acceleration > 0 ? "up" : "down", clamp(Math.abs(acceleration) / 35, 0.2, 1));
        lastMotionCueAt = time;
      }
      speed = normalized;
      lastSpeedAt = time;
      const energy = speedToEnergy(speed);
      const wave = speedToWave(speed);
      energyWaveOscillators.forEach(({ oscillator, ratio }) => {
        oscillator.frequency.setTargetAtTime(wave.frequencyHz * ratio, time, 0.24);
      });
      energyWaveGain.gain.setTargetAtTime(wave.gain, time, 0.28);
      energyWaveFilter.frequency.setTargetAtTime(240 + energy * 720, time, 0.3);
      droneFilter.frequency.setTargetAtTime(260 + energy * 430, time, 0.3);
      droneGain.gain.setTargetAtTime((0.012 + mix.atmosphere * 0.026) * (1 - energy * 0.42), time, 0.35);
      wet.gain.setTargetAtTime(0.17 + energy * 0.16, time, 0.35);
    },
    setMix(nextMix) {
      mix = { ...mix, ...nextMix };
      const energy = speedToEnergy(speed);
      droneGain.gain.setTargetAtTime((0.012 + mix.atmosphere * 0.026) * (1 - energy * 0.42), context.currentTime, 0.2);
    },
    startCue() {
      const time = context.currentTime;
      [57, 64, 72].forEach((midi, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = midiToHz(midi);
        envelope(gain.gain, time + index * 0.06, 0.025, 0.72, [0.11, 0.07, 0.045][index]);
        oscillator.connect(gain);
        gain.connect(master);
        gain.connect(delayInput);
        oscillator.start(time + index * 0.06);
        oscillator.stop(time + 0.9 + index * 0.06);
      });
    },
    brake() {
      motionCue("down", 1);
      kick(context.currentTime, 0.24);
    },
    getLevel() {
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
      return clamp(rms * 6, 0, 1);
    },
    destroy() {
      if (!running) return;
      running = false;
      window.clearInterval(scheduler);
      droneOscillators.forEach((oscillator) => oscillator.stop());
      energyWaveOscillators.forEach(({ oscillator }) => oscillator.stop());
      if (context.state !== "closed") context.close().catch(() => {});
    },
  };
}
