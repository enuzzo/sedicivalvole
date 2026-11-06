// Offline render of the combustion synthesizer along a fixed 41-second scene:
// idle, neutral blips, limiter, full-throttle pull through four gears with
// upshifts, lift-off overrun, part-throttle cruise, kickdown, coast to idle.
//   node scripts/render-combustion.mjs [engine ...]   (default: every engine)
//   OUT=output/combustion-preview node scripts/render-combustion.mjs v10
// Writes 24-bit stereo 48 kHz WAVs plus a control trace per engine.
import { mkdir, writeFile } from "node:fs/promises";
import { CombustionEngine } from "../src/engine/combustion/dsp.js";
import { COMBUSTION_ENGINES, COMBUSTION_ENGINE_IDS } from "../src/engine/combustion/engines.js";

const RATE = 48000, BLOCK = 128;
const out = process.env.OUT || "output/combustion-preview";
const ids = process.argv.slice(2).length ? process.argv.slice(2) : COMBUSTION_ENGINE_IDS;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** Builds the control scene for one engine: arrays of rpm, load and boost per sample. */
export function scene(spec, seconds = 41) {
  const frames = Math.round(seconds * RATE);
  const rpm = new Float32Array(frames), load = new Float32Array(frames), boost = new Float32Array(frames);
  const idle = spec.idleRpm, red = spec.redlineRpm, limit = spec.limiterRpm;
  const ratios = [1, 0.68, 0.74, 0.79]; // rpm after each upshift, as a fraction
  let r = idle, l = 0.08, gear = 0, shift = 0, phase = "idle", bouncing = false;
  const dt = 1 / RATE;
  for (let n = 0; n < frames; n++) {
    const t = n / RATE;
    let targetLoad = 0.08, rate = 0;
    if (t < 4) { phase = "idle"; r += (idle - r) * 0.0005; }
    else if (t < 6.2) { // two neutral blips
      const local = (t - 4) % 1.1; phase = "blip";
      if (local < 0.18) { targetLoad = 0.95; rate = (red * 0.62 - r) * 9; }
      else { targetLoad = 0.07; rate = (idle - r) * 2.4; }
    } else if (t < 8.6) { // rev to the limiter and hold against it
      phase = "limiter";
      if (t < 7.9) { targetLoad = 1; if (r >= limit) bouncing = true; else if (r < limit - 260) bouncing = false; rate = bouncing ? -6000 : 7000; } // bounces off the cut
      else { targetLoad = 0.06; rate = (idle - r) * 1.8; }
    } else if (t < 11) { phase = "settle"; targetLoad = 0.08; rate = (idle - r) * 1.6; }
    else if (t < 26) { // full-throttle pull, 1st → 4th
      phase = `gear${gear + 1}`;
      if (shift > 0) { shift -= dt; targetLoad = 0.05; if (shift <= 0) { r *= ratios[gear]; } }
      else {
        targetLoad = 1;
        const climb = [5200, 2600, 1700, 1150][gear] * (0.7 + 0.5 * (r / red));
        if (t < 11.6) r += (2600 - r) * 0.0007; // clutch launch
        else rate = climb;
        if (r > red * 0.96 && gear < 3) { gear++; shift = 0.16; }
        if (gear === 3 && r > red * 0.9) rate = 0;
      }
    } else if (t < 31) { phase = "overrun"; targetLoad = 0.06; rate = -(r - red * 0.35) * 0.32; }
    else if (t < 36) { phase = "cruise"; targetLoad = 0.32; rate = (red * 0.4 - r) * 0.8; }
    else if (t < 38.5) { // kickdown: downshift with a throttle blip, then pull
      phase = "kickdown";
      if (t < 36.25) { targetLoad = 0.75; rate = (red * 0.62 - r) * 14; }
      else { targetLoad = 1; rate = 900; }
    } else { phase = "coast"; targetLoad = 0.06; rate = (idle - r) * 1.1; }
    r = clamp(r + rate * dt, idle * 0.9, limit + 120);
    l += (targetLoad - l) * (1 - Math.exp(-dt / 0.03));
    rpm[n] = r; load[n] = l;
    // Same shape as the runtime's boost demand: rpm threshold × exhaust energy.
    boost[n] = clamp((r - 2000) / (red * 0.55 - 2000), 0, 1) * clamp((l - 0.16) / 0.84, 0, 1);
  }
  return { rpm, load, boost, frames };
}

function wav24(left, right) {
  const frames = left.length, data = Buffer.alloc(frames * 6), header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(36 + data.length, 4); header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
  header.writeUInt32LE(RATE, 24); header.writeUInt32LE(RATE * 6, 28); header.writeUInt16LE(6, 32); header.writeUInt16LE(24, 34);
  header.write("data", 36); header.writeUInt32LE(data.length, 40);
  for (let i = 0; i < frames; i++) {
    data.writeIntLE(Math.round(clamp(left[i], -1, 1) * 8388607), i * 6, 3);
    data.writeIntLE(Math.round(clamp(right[i], -1, 1) * 8388607), i * 6 + 3, 3);
  }
  return Buffer.concat([header, data]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await mkdir(out, { recursive: true });
  for (const id of ids) {
    const spec = COMBUSTION_ENGINES[id];
    if (!spec) throw new RangeError(`Unknown engine ${id}`);
    const { rpm, load, boost, frames } = scene(spec);
    const engine = new CombustionEngine(RATE, spec);
    const left = new Float32Array(frames), right = new Float32Array(frames);
    const started = performance.now();
    for (let at = 0; at < frames; at += BLOCK) {
      const size = Math.min(BLOCK, frames - at);
      engine.process(left.subarray(at, at + size), right.subarray(at, at + size), size,
        rpm.subarray(at, at + size), load.subarray(at, at + size), boost.subarray(at, at + size), 1, 1);
    }
    const ms = performance.now() - started;
    let peak = 0, sum = 0;
    for (let i = 0; i < frames; i++) { peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i])); sum += left[i] * left[i]; }
    await writeFile(`${out}/${id}.wav`, wav24(left, right));
    const trace = []; for (let i = 0; i < frames; i += RATE / 20) trace.push([+(i / RATE).toFixed(2), Math.round(rpm[i]), +load[i].toFixed(3), +boost[i].toFixed(3)]);
    await writeFile(`${out}/${id}.trace.json`, JSON.stringify(trace));
    console.log(`${id.padEnd(14)} peak ${(20 * Math.log10(peak)).toFixed(1)} dBFS  rms ${(10 * Math.log10(sum / frames)).toFixed(1)} dBFS  realtime ×${(frames / RATE * 1000 / ms).toFixed(1)}`);
  }
}
