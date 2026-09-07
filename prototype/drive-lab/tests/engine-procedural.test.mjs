import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { EngineSynth } from '../src/engine/procedural-dsp.js';

const root = new URL('../', import.meta.url).pathname;
function bundle(entry) {
  return buildSync({ entryPoints: [root + entry], bundle: true, format: 'cjs', platform: 'node', write: false }).outputFiles[0].text;
}
const profileModule = { exports: {} };
vm.runInNewContext(bundle('src/engine/profiles.js'), { module: profileModule, exports: profileModule.exports });
const profiles = profileModule.exports.ENGINE_PROFILES.filter(profile => profile.voice);
const configuration = profile => ({ ...profile.voice, limiter: profile.configuration.engine.limiter });
function render(profile, { rate = 48000, rpm = 3000, load = 1, seconds = 2, overrides = {} } = {}) {
  const synth = new EngineSynth(rate, { ...configuration(profile), ...overrides });
  const samples = new Float32Array(rate * seconds); let energy = 0;
  for (let i = 0; i < samples.length; i++) {
    const output = synth.sample(rpm, load, profile.voice.turbo || profile.voice.turbine ? load : 0, 1);
    samples[i] = (output[0] + output[1]) * .5; energy += samples[i] ** 2;
  }
  return { synth, samples, rms: Math.sqrt(energy / samples.length) };
}
function amplitude(samples, rate, hz) {
  let sine = 0, cosine = 0;
  // Inspect the final second after the pressure paths have settled.
  const start = samples.length - rate;
  for (let i = 0; i < rate; i++) {
    const value = samples[start + i] * (.5 - .5 * Math.cos(2 * Math.PI * i / (rate - 1)));
    sine += value * Math.sin(2 * Math.PI * hz * i / rate);
    cosine += value * Math.cos(2 * Math.PI * hz * i / rate);
  }
  return Math.hypot(sine, cosine) * 4 / rate;
}

test('four-stroke firing counts follow the audio sample clock at both output rates', () => {
  for (const rate of [44100, 48000]) for (const profile of profiles.filter(profile => !profile.singleSpeed)) {
    for (const rpm of [600, 3000, profile.configuration.engine.limiter]) {
      const { synth } = render(profile, { rate, rpm, seconds: 1 });
      const expected = rpm * profile.voice.cylinders / 120;
      assert.ok(Math.abs(synth.firings - expected) <= 1, `${profile.id} ${rate} Hz ${rpm} RPM: ${synth.firings}/${expected}`);
    }
  }
});

test('piston voices expose distinct measured firing orders instead of one pitch-shifted tone', () => {
  for (const [id, wanted, absent] of [['mono', 100, 125], ['otto', 200, 125], ['cinque', 125, 100]]) {
    const { samples } = render(profiles.find(profile => profile.id === id));
    const fundamental = amplitude(samples, 48000, wanted), unrelated = amplitude(samples, 48000, absent);
    assert.ok(fundamental > .005, `${id}: audible ${wanted} Hz order`);
    assert.ok(fundamental > unrelated * 4, `${id}: ${wanted} Hz ${fundamental} vs ${absent} Hz ${unrelated}`);
  }
});

test('uneven crossplane bank spacing survives the paired exhaust paths', () => {
  const profile = profiles.find(profile => profile.id === 'otto');
  const native = render(profile).samples;
  const alternating = render(profile, { overrides: { banks: [0, 1, 0, 1, 0, 1, 0, 1] } }).samples;
  const uneven = amplitude(native, 48000, 75) + amplitude(native, 48000, 125);
  const even = amplitude(alternating, 48000, 75) + amplitude(alternating, 48000, 125);
  assert.ok(uneven > .005 && uneven > even * 4, `crossplane bank orders ${uneven} vs alternating ${even}`);
});

test('finite pressure pulses meet zero at both ends without a truncation step', () => {
  for (const rate of [44100, 48000]) for (const profile of profiles.filter(profile => !profile.singleSpeed)) {
    const { pulse } = new EngineSynth(rate, configuration(profile));
    assert.equal(Math.abs(pulse[0]), 0); assert.equal(Math.abs(pulse.at(-1)), 0);
    assert.ok(Math.abs(pulse.at(-2)) < .00001);
    assert.ok(pulse.every(Number.isFinite));
  }
});

test('steady piston levels remain comparable when browser output changes from 44.1 to 48 kHz', () => {
  for (const profile of profiles.filter(profile => !profile.singleSpeed)) {
    const a = render(profile, { rate: 44100 }).rms, b = render(profile, { rate: 48000 }).rms;
    assert.ok(Math.abs(20 * Math.log10(a / b)) < .6, `${profile.id}: ${a}/${b}`);
  }
});

test('turbo releases once on a loaded lift and cannot turn evidence loss into a valve event', () => {
  const synth = new EngineSynth(48000, configuration(profiles.find(profile => profile.id === 'cinque')));
  const run = (frames, load, boost, active = 1, events = 1) => { for (let i = 0; i < frames; i++) synth.sample(4500, load, boost, active, events); };
  run(96000, 1, 1); assert.equal(synth.releaseArmed, true); assert.ok(synth.spool > .5);
  run(1, 0, 0, 1, 0); assert.equal(synth.blowOff, 0); assert.equal(synth.releaseArmed, false);
  run(24000, 0, 0); assert.equal(synth.blowOff, 0, 'returning evidence alone cannot trigger a stored valve event');
  run(96000, 1, 1); run(1, 0, 0); assert.ok(synth.blowOff > .3); assert.equal(synth.releaseArmed, false);
  const released = synth.blowOff;
  run(4800, 0, 0); assert.ok(synth.blowOff < released * .5, 'one decaying event during continued coast');
  run(1, 0, 0, 0); assert.equal(synth.blowOff, 0); assert.equal(synth.releaseArmed, false);
});

test('turbine is an airflow and shaft voice with no combustion firing events or DC offset', () => {
  const profile = profiles.find(profile => profile.singleSpeed);
  const { synth, samples } = render(profile, { seconds: 4 });
  assert.equal(synth.firings, 0); assert.ok(samples.some(value => Math.abs(value) > .05));
  const tail = samples.subarray(48000);
  assert.ok(Math.abs(tail.reduce((sum, value) => sum + value, 0) / tail.length) < .002);
});

const processorCode = bundle('src/engine/procedural-processor.js');
function processor(rate = 48000) {
  let Constructor;
  class AudioWorkletProcessor { port = { onmessage: null }; }
  vm.runInNewContext(processorCode, { module: { exports: {} }, exports: {}, AudioWorkletProcessor, sampleRate: rate,
    registerProcessor: (_name, klass) => { Constructor = klass; } });
  const node = new Constructor({ processorOptions: configuration(profiles.find(profile => profile.id === 'cinque')) });
  const channels = [new Float32Array(128), new Float32Array(128)];
  const params = { rpm: new Float32Array([3000]), load: new Float32Array([1]), boost: new Float32Array([1]),
    active: new Float32Array([0]), events: new Float32Array([1]) };
  return { node, channels, params, process: () => node.process([], [channels], params) };
}

test('muted worklet performs no synthesis after a bounded fade and resumes without an immediate full-level step', () => {
  for (const rate of [44100, 48000]) {
    const f = processor(rate);
    for (let i = 0; i < 50; i++) f.process();
    assert.equal(f.node.synth.frames, 0); assert.ok(f.channels.every(channel => channel.every(value => value === 0)));
    f.params.active[0] = 1;
    for (let i = 0; i < 50; i++) f.process();
    assert.equal(f.node.fade, 1); assert.ok(f.channels[0].some(value => value !== 0));
    f.params.active[0] = 0;
    for (let i = 0; i < Math.ceil(rate * .008 / 128) + 1; i++) f.process();
    assert.equal(f.node.fade, 0); const frozen = f.node.synth.frames;
    for (let i = 0; i < 50; i++) f.process();
    assert.equal(f.node.synth.frames, frozen); assert.equal(f.node.synth.blowOff, 0); assert.equal(f.node.synth.spool, 0);
    f.params.active[0] = 1; f.process();
    assert.ok(Math.abs(f.channels[0][0]) < .005); assert.ok(f.node.fade > 0 && f.node.fade < 1);
  }
});

test('worklet applies per-sample RPM automation and stops permanently after disposal', () => {
  const varied = processor(), flat = processor();
  varied.params.active[0] = flat.params.active[0] = 1;
  flat.params.rpm[0] = 1000;
  varied.params.rpm = Float32Array.from({ length: 128 }, (_, index) => 1000 + 8000 * index / 127);
  for (let i = 0; i < 100; i++) { varied.process(); flat.process(); }
  assert.ok(varied.node.synth.firings > flat.node.synth.firings * 3);
  varied.node.port.onmessage({ data: 'dispose' });
  const frames = varied.node.synth.frames;
  assert.equal(varied.process(), false); assert.equal(varied.node.synth.frames, frames);
});
