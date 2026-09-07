import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const [key, ...rest] = value.replace(/^--/, '').split('='); return [key, rest.join('=') || true];
}));
const source = path.resolve(args.source || path.join(project, 'src/engine'));
const { EngineSynth } = await import(pathToFileURL(path.join(source, 'procedural-dsp.js')));
const { ENGINE_PROFILES } = await import(pathToFileURL(path.join(source, 'profiles.js')));
const output = path.resolve(args.output || '/tmp/sv-engine-campaign/dsp');
await fs.mkdir(output, { recursive: true });

// Original radix-2 Fourier analysis; analysis code never enters the audio graph.
function spectrum(samples, rate) {
  const n = samples.length, real = new Float64Array(n), imaginary = new Float64Array(n);
  for (let i = 0, j = 0; i < n; i++) {
    real[j] = samples[i] * (.5 - .5 * Math.cos(2 * Math.PI * i / (n - 1)));
    let bit = n >> 1; while (j & bit) { j ^= bit; bit >>= 1; } j ^= bit;
  }
  for (let length = 2; length <= n; length *= 2) {
    const half = length / 2;
    for (let start = 0; start < n; start += length) for (let offset = 0; offset < half; offset++) {
      const phase = -2 * Math.PI * offset / length, c = Math.cos(phase), s = Math.sin(phase);
      const even = start + offset, odd = even + half;
      const r = real[odd] * c - imaginary[odd] * s, im = real[odd] * s + imaginary[odd] * c;
      real[odd] = real[even] - r; imaginary[odd] = imaginary[even] - im;
      real[even] += r; imaginary[even] += im;
    }
  }
  const magnitudes = Array.from({ length: n / 2 }, (_, bin) => Math.hypot(real[bin], imaginary[bin]));
  const localPeaks = [];
  for (let bin = 2; bin < magnitudes.length - 1; bin++) if (magnitudes[bin] > magnitudes[bin - 1] && magnitudes[bin] > magnitudes[bin + 1]) {
    localPeaks.push({ hz: bin * rate / n, amplitude: magnitudes[bin] * 4 / n });
  }
  const total = magnitudes.reduce((sum, value) => sum + value ** 2, 0);
  const energy = (lo, hi) => magnitudes.reduce((sum, value, bin) => sum + (bin * rate / n >= lo && bin * rate / n < hi ? value ** 2 : 0), 0) / total;
  const peaks = localPeaks.sort((a, b) => b.amplitude - a.amplitude).slice(0, 10);
  return { resolutionHz: rate / n, peaks, bands: { below250: energy(0, 250), lowMid: energy(250, 1000), mid: energy(1000, 4000), high: energy(4000, rate / 2) } };
}
const results = [];
for (const sampleRate of [44100, 48000]) for (const profile of ENGINE_PROFILES.filter(profile => profile.voice)) {
  const cfg = { ...profile.voice, limiter: profile.configuration.engine.limiter };
  for (const rpm of [600, 3000, Math.min(6000, cfg.limiter * .9)]) for (const load of [.15, 1]) {
    const synth = new EngineSynth(sampleRate, cfg), frames = sampleRate * 6;
    const last = new Float32Array(32768); let energy = 0, peak = 0, dc = 0, nonFinite = 0, maxStep = 0, previous = 0;
    const before = performance.now(), cpuBefore = process.cpuUsage();
    for (let frame = 0; frame < frames; frame++) {
      const stereo = synth.sample(rpm, load, cfg.turbo || cfg.turbine ? load : 0, 1);
      const mono = (stereo[0] + stereo[1]) * .5;
      for (const value of stereo) { if (!Number.isFinite(value)) nonFinite++; peak = Math.max(peak, Math.abs(value)); }
      energy += mono ** 2; dc += mono; maxStep = Math.max(maxStep, Math.abs(mono - previous)); previous = mono;
      if (frame >= frames - last.length) last[frame - frames + last.length] = mono;
    }
    const cpu = process.cpuUsage(cpuBefore), wallMs = performance.now() - before;
    const expectedFirings = cfg.turbine ? 0 : rpm * cfg.cylinders / 120 * 6;
    assert.equal(nonFinite, 0, `${profile.id}: finite DSP`);
    assert.ok(Math.abs(synth.firings - expectedFirings) <= 1, `${profile.id}: sample-clock firing count ${synth.firings} vs ${expectedFirings}`);
    assert.ok(peak > .005 && peak < 10, `${profile.id}: bounded active voice`);
    const row = { profile: profile.id, sampleRate, rpm, load, seconds: 6, sourceLevelBeforeHostMix: true,
      peak, rms: Math.sqrt(energy / frames), dc: dc / frames, maximumSampleStep: maxStep, nonFinite,
      firings: synth.firings, expectedFirings, firingOrderHz: cfg.turbine ? null : rpm * cfg.cylinders / 120,
      wallMs, processCpuMs: (cpu.user + cpu.system) / 1000, cpuToAudioRatio: (cpu.user + cpu.system) / 6000000,
      spectrum: spectrum(last, sampleRate) };
    results.push(row);
  }
  console.log(`${profile.id} ${sampleRate} Hz: six steady states passed`);
}
// Repeated acceleration/lift cycles exercise state longevity, turbo release and
// limiter behavior for one uninterrupted virtual minute per original voice.
const sustained = [];
for (const profile of ENGINE_PROFILES.filter(profile => profile.voice)) {
  const rate = 48000, cfg = { ...profile.voice, limiter: profile.configuration.engine.limiter };
  const synth = new EngineSynth(rate, cfg); let peak = 0, nonFinite = 0, releases = 0, previousRelease = 0;
  const at = performance.now(), cpuAt = process.cpuUsage();
  for (let frame = 0; frame < rate * 60; frame++) {
    const phase = (frame / rate) % 6, load = phase < 3.8 ? 1 : .05;
    const rpm = 600 + (cfg.limiter - 600) * Math.min(1, phase / 3.6);
    const values = synth.sample(rpm, load, cfg.turbo || cfg.turbine ? load : 0, 1);
    if (synth.blowOff > previousRelease + .01) releases++;
    previousRelease = synth.blowOff;
    for (const value of values) { if (!Number.isFinite(value)) nonFinite++; peak = Math.max(peak, Math.abs(value)); }
  }
  const cpu = process.cpuUsage(cpuAt);
  assert.equal(nonFinite, 0); assert.ok(peak < 10);
  if (cfg.turbo) assert.equal(releases, 10, 'one pressure release per loaded lift');
  sustained.push({ profile: profile.id, seconds: 60, sampleRate: rate, peak, nonFinite, pressureReleases: releases,
    wallMs: performance.now() - at, processCpuMs: (cpu.user + cpu.system) / 1000, cpuToAudioRatio: (cpu.user + cpu.system) / 60000000 });
}
const report = { generatedAt: new Date().toISOString(), source,
  dspSha256: createHash('sha256').update(await fs.readFile(path.join(source, 'procedural-dsp.js'))).digest('hex'),
  methodology: 'Direct original production DSP, deterministic sample-clock cases and repeated throttle cycles. Node process CPU includes QA accumulation overhead and is a Mac reference, not AudioWorklet or Tesla CPU utilization. Spectral peaks are measurements, not claims of perceived quality or real vehicle authenticity.',
  results, sustained };
await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`ENGINE DSP CAMPAIGN PASS: ${results.length} steady cases, ${sustained.length} sustained cases; ${path.join(output, 'report.json')}`);
