// Shared acoustic measurements for Engine QA: scripts/qa-engine-acoustics.mjs
// and the combustion tests use the same A-weighting, noise silencing, master
// compressor model, Tesla-like GPS and WAV writer.
import { writeFileSync } from "node:fs";

export const RATE = 48000;

/** In-place radix-2 FFT. */
export function fft(re, im) {
  const size = re.length;
  for (let i = 1, j = 0; i < size; i++) {
    let bit = size >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let span = 2; span <= size; span <<= 1) {
    const angle = -2 * Math.PI / span, wr = Math.cos(angle), wi = Math.sin(angle);
    for (let i = 0; i < size; i += span) {
      let cr = 1, ci = 0;
      for (let k = 0; k < span / 2; k++) {
        const h = i + k + span / 2, ar = re[h] * cr - im[h] * ci, ai = re[h] * ci + im[h] * cr;
        re[h] = re[i + k] - ar; im[h] = im[i + k] - ai; re[i + k] += ar; im[i + k] += ai;
        const next = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = next;
      }
    }
  }
}

/** IEC 61672 A-weighting as a power ratio (unnormalized; only differences between levels are used). */
const aWeight = hz => {
  const f2 = hz * hz, ra = 12194 ** 2 * f2 * f2 / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
  return ra * ra;
};

/** A-weighted energy in dB (Hann windows of 8,192 samples, half overlap): the level as the ear weighs it. */
export function aWeightedDb(samples, rate = RATE) {
  const size = 8192;
  let energy = 0;
  for (let start = 0; start + size <= samples.length; start += size / 2) {
    const re = new Float64Array(size), im = new Float64Array(size);
    for (let i = 0; i < size; i++) re[i] = samples[start + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / size));
    fft(re, im);
    for (let k = 1; k < size / 2; k++) energy += (re[k] * re[k] + im[k] * im[k]) * aWeight(k * rate / size);
  }
  return 10 * Math.log10(energy + 1e-30);
}

/**
 * Per-source silencers for a combustion engine definition. Gains go to zero but
 * every random draw keeps its order, so a render minus the silenced render is
 * exactly that source. `hiss` covers definitions from before v6.
 */
export const NOISE_SOURCES = Object.freeze({
  grit: spec => ({ ...spec, pulse: { ...spec.pulse, grit: 0, flowGrit: 0 } }),
  roar: spec => ({ ...spec, intake: { ...spec.intake, roar: 0, ...(spec.intake?.hiss != null ? { hiss: 0 } : {}) } }),
  flow: spec => ({ ...spec, pulse: { ...spec.pulse, turbulence: 0 } }),
  turbo: spec => spec.forced ? { ...spec, forced: { ...spec.forced, whoosh: 0, whistle: 0 } } : null,
});

/** The engine with every aperiodic source silenced. */
export function silenceNoise(spec) {
  return Object.values(NOISE_SOURCES).reduce((current, silence) => silence(current) ?? current, spec);
}

/**
 * Sample-by-sample model of the master DynamicsCompressor: peak detector, soft
 * knee, attack and release on the gain reduction. It leaves out Chromium's
 * lookahead and fixed make-up gain, so it measures reduction, not output level.
 */
export function createCompressorModel({ threshold = -8, knee = 4, ratio = 20, attack = 0.003, release = 0.15 } = {}, rate = RATE) {
  const kAttack = Math.exp(-1 / (rate * attack)), kRelease = Math.exp(-1 / (rate * release));
  const curve = level => {
    const over = level - threshold;
    if (2 * over < -knee) return 0;
    if (2 * Math.abs(over) <= knee) return (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee);
    return over - over / ratio;
  };
  let reduction = 0;
  return {
    process(x) {
      const want = curve(20 * Math.log10(Math.abs(x) + 1e-9));
      reduction = want + (reduction - want) * (want > reduction ? kAttack : kRelease);
      return x * 10 ** (-reduction / 20);
    },
    get reductionDb() { return reduction; },
  };
}

/**
 * Default drive (seconds, km/h): a stop, a pull-away through three upshifts,
 * town cruise, a lift, a pull to the highway, highway cruise, a long braking
 * with downshifts and a slow stretch.
 */
export const DRIVE_ROUTE = Object.freeze([[0, 0], [6, 0], [12, 56], [16, 73], [28, 73], [33, 54], [42, 54], [50, 117], [56, 139], [70, 139], [86, 52], [92, 39], [100, 39]]);

/** Speed (km/h) along a route of [seconds, km/h] breakpoints, linear between them (the engine-render route format). */
export function speedAt(route, seconds) {
  if (seconds <= route[0][0]) return route[0][1];
  for (let i = 1; i < route.length; i++) {
    const [b, vb] = route[i];
    if (seconds <= b) { const [a, va] = route[i - 1]; return va + (vb - va) * (seconds - a) / (b - a); }
  }
  return route[route.length - 1][1];
}

/** Steady-speed stretches of a route (equal consecutive speeds above zero). */
export function cruiseSegments(route) {
  const segments = [];
  for (let i = 1; i < route.length; i++) if (route[i][1] === route[i - 1][1] && route[i][1] > 0) segments.push([route[i - 1][0], route[i][0]]);
  return segments;
}

/**
 * Tesla-like GPS callbacks: 10 Hz, whole km/h, a little seeded noise before
 * rounding. A standstill stays an exact zero, as the car reports it.
 */
export function teslaGps(route, { hz = 10, noise = 0.25, seed = 7 } = {}) {
  let state = seed;
  const random = () => { state = (state * 16807) % 2147483647; return state / 2147483647; };
  const gauss = () => Math.sqrt(-2 * Math.log(random() + 1e-12)) * Math.cos(2 * Math.PI * random());
  const samples = [], end = route[route.length - 1][0];
  for (let i = 0; i * (1 / hz) <= end + 1e-9; i++) {
    const t = i / hz, speed = speedAt(route, t);
    samples.push({ t, speed: speed <= 0 ? 0 : Math.max(0, Math.round(speed + noise * gauss())) });
  }
  return samples;
}

/** Mono 16-bit WAV. */
export function writeWav(path, samples, { gain = 1, rate = RATE } = {}) {
  const frames = samples.length, buffer = Buffer.alloc(44 + frames * 2);
  buffer.write("RIFF", 0); buffer.writeUInt32LE(36 + frames * 2, 4); buffer.write("WAVEfmt ", 8); buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(frames * 2, 40);
  for (let i = 0; i < frames; i++) buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i] * gain)) * 32767), 44 + i * 2);
  writeFileSync(path, buffer);
}
