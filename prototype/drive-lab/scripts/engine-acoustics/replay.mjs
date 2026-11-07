// Full-chain drive replay of a combustion voice, without a browser: the real
// Engine runtime (bundled from a source tree, driven through a mock
// AudioContext whose parameters follow Web Audio automation), the real motion
// model fed with GPS callbacks, the combustion synthesizer rendering what the
// runtime scheduled, then the master gain and a model of the master compressor
// with the runtime's own settings. A QA instrument, not car acceptance.
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { RATE, createCompressorModel } from "./measure.mjs";

const BLOCK = 128, TICK = 0.025, ROW_SAMPLES = 2400; // 50 ms trace rows

/** An AudioParam with Web Audio automation semantics: set, setTarget, linear ramp, cancelAndHold. */
export class AutomatedParam {
  constructor(value = 0) { this.initial = value; this.events = []; }
  get value() { return this.events.length ? this.events[this.events.length - 1].value : this.initial; }
  set value(value) { this.initial = value; this.events = []; }
  at(time) {
    let value = this.initial, last = 0, target = null;
    const follow = when => target.value + (target.from - target.value) * Math.exp(-Math.max(0, when - target.time) / target.tau);
    for (const event of this.events) {
      if (event.type === "ramp") {
        if (event.time <= time) { value = event.value; last = event.time; target = null; continue; }
        const start = target ? follow(last) : value;
        return start + (event.value - start) * (time - last) / Math.max(1e-9, event.time - last);
      }
      if (event.time > time) break;
      if (target) value = follow(event.time);
      if (event.type === "set") { value = event.value; target = null; }
      else target = { from: value, value: event.value, time: event.time, tau: event.tau };
      last = event.time;
    }
    return target ? follow(time) : value;
  }
  add(event) { this.events.push(event); this.events.sort((a, b) => a.time - b.time); }
  setValueAtTime(value, time) { this.add({ type: "set", value, time }); }
  setTargetAtTime(value, time, tau) { this.add({ type: "target", value, time, tau }); }
  linearRampToValueAtTime(value, time) { this.add({ type: "ramp", value, time }); }
  cancelScheduledValues(time) { this.events = this.events.filter(event => event.time < time); }
  cancelAndHoldAtTime(time) { const value = this.at(time); this.cancelScheduledValues(time); this.add({ type: "set", value, time }); }
  /** Collapse history before `time` (keeps evaluation cheap on long replays). */
  prune(time) { const value = this.at(time); this.events = [{ type: "set", value, time }, ...this.events.filter(event => event.time > time)]; }
}

const sourceCache = new Map();
/** Runtime, motion, synthesizer and engine definitions of one drive-lab source tree. */
export async function loadEngineSources(root) {
  if (sourceCache.has(root)) return sourceCache.get(root);
  const bundled = await build({
    stdin: { contents: ['export { createGeapsRuntime } from "./src/engine/runtime.js";', 'export { createEngineMotion } from "./src/engine/motion.js";',
      'export { ENGINE_PROFILES } from "./src/engine/profiles.js";', 'export { boostDemand } from "./src/engine/powertrain.js";'].join("\n"), resolveDir: root },
    bundle: true, format: "cjs", platform: "node", write: false, logLevel: "silent",
    nodePaths: [new URL("../../node_modules", import.meta.url).pathname],
    plugins: [{ name: "audio-worklet-url", setup(plugin) {
      plugin.onResolve({ filter: /\?audio-worklet$/ }, args => ({ path: args.path, namespace: "audio-worklet-url" }));
      plugin.onLoad({ filter: /.*/, namespace: "audio-worklet-url" }, () => ({ contents: 'export default "/replay-worklet.js";', loader: "js" }));
    } }],
  });
  const { CombustionEngine } = await import(pathToFileURL(`${root}/src/engine/combustion/dsp.js`).href);
  const { COMBUSTION_ENGINES } = await import(pathToFileURL(`${root}/src/engine/combustion/engines.js`).href);
  const code = bundled.outputFiles[0].text, exports = {}, module = { exports };
  vm.runInNewContext(code, { module, exports, console });
  const sources = { code, CombustionEngine, COMBUSTION_ENGINES, ENGINE_PROFILES: module.exports.ENGINE_PROFILES, boostDemand: module.exports.boostDemand };
  sourceCache.set(root, sources);
  return sources;
}

/**
 * Replays one drive. `gps` is a list of { t, speed } callbacks. Returns 50 ms
 * trace rows, runtime events and the mono output after the compressor model.
 */
export async function replayDrive(sources, { profileId, gps, seconds }) {
  let time = 0, serial = 0;
  const timers = new Map();
  const surface = () => { const listeners = new Map(); return {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); } }; };
  const node = extra => ({ connect(target) { this.target = target; return target; }, disconnect() {}, ...extra });
  const gains = [], compressors = [];
  let voice = null;
  const context = { ...surface(), currentTime: 0, sampleRate: RATE, state: "running", audioWorklet: { async addModule() {} },
    createGain() { const gain = node({ gain: new AutomatedParam(1) }); gains.push(gain); return gain; },
    createDynamicsCompressor() { const compressor = node(Object.fromEntries(["threshold", "knee", "ratio", "attack", "release"].map(key => [key, new AutomatedParam()]))); compressors.push(compressor); return compressor; } };
  class AudioWorkletNode {
    constructor(audioContext, name, options) {
      this.parameters = new Map(["rpm", "load", "boost", "active", "events"].map(key => [key, new AutomatedParam(key === "rpm" ? 1000 : 0)]));
      this.options = options; this.port = { postMessage() {}, close() {} }; voice = this;
    }
    connect(target) { this.target = target; return target; }
    disconnect() {}
  }
  const exports = {};
  const sandbox = { exports, module: { exports }, console, crypto: webcrypto, AbortController, performance: { now: () => time },
    document: { ...surface(), visibilityState: "visible" }, window: surface(), navigator: { onLine: true }, AudioWorkletNode,
    setInterval: fn => { const id = ++serial; timers.set(id, { fn, interval: true }); return id; }, clearInterval: id => timers.delete(id),
    setTimeout: (fn, delay = 0) => { const id = ++serial; timers.set(id, { fn, due: time + delay }); return id; }, clearTimeout: id => timers.delete(id),
    fetch: async () => { throw new Error("The drive replay renders combustion voices only"); } };
  vm.runInNewContext(sources.code, sandbox);
  const motion = sandbox.module.exports.createEngineMotion();
  const events = [];
  const runtime = sandbox.module.exports.createGeapsRuntime({ context, destination: {}, motion, now: () => time,
    onEvent: (type, detail) => events.push({ t: context.currentTime, type, ...detail }) });
  await runtime.load(profileId);
  if (!voice) throw new Error(`${profileId} did not load a combustion voice`);
  runtime.setEnabled(true);
  const [limiter] = compressors, master = gains[0], voiceGain = voice.target;
  const compressor = createCompressorModel(Object.fromEntries(["threshold", "knee", "ratio", "attack", "release"].map(key => [key, limiter[key].value])));
  const engine = new sources.CombustionEngine(RATE, sources.COMBUSTION_ENGINES[voice.options.processorOptions.engine]);
  const left = new Float32Array(BLOCK), right = new Float32Array(BLOCK), params = voice.parameters;
  const output = new Float32Array(Math.ceil(seconds * RATE));
  const rows = [];
  let written = 0, next = 0, row = { energy: 0, raw: 0, count: 0, reduction: 0 };
  while (context.currentTime < seconds) {
    while (next < gps.length && gps[next].t <= time / 1000) {
      const sample = gps[next++], at = 1e6 + sample.t * 1000;
      motion.observe({ source: "GPS", rawSpeedKmh: sample.speed, sourceTimestampMs: at, epochNowMs: at, receivedMs: sample.t * 1000, accuracyM: 8 });
    }
    time += TICK * 1000;
    for (const timer of [...timers.values()]) if (timer.interval) timer.fn();
    for (const [id, timer] of [...timers]) if (!timer.interval && timer.due <= time) { timers.delete(id); timer.fn(); }
    const until = Math.min(output.length, Math.round((context.currentTime + TICK) * RATE));
    while (written < until) {
      const at = written / RATE;
      engine.process(left, right, BLOCK, [params.get("rpm").at(at)], [params.get("load").at(at)], [params.get("boost").at(at)], params.get("active").at(at), params.get("events").at(at));
      const gain = master.gain.at(at) * voiceGain.gain.at(at);
      for (let k = 0; k < BLOCK && written < output.length; k++) {
        const raw = (left[k] + right[k]) / 2 * gain, out = compressor.process(raw);
        output[written++] = out;
        row.energy += out * out; row.raw += raw * raw; row.count++; row.reduction = Math.max(row.reduction, compressor.reductionDb);
        if (row.count === ROW_SAMPLES) {
          const state = runtime.getState();
          rows.push({ t: +(written / RATE).toFixed(2), db: +(10 * Math.log10(row.energy / row.count + 1e-12)).toFixed(1),
            reductionDb: +row.reduction.toFixed(2), rpm: Math.round(params.get("rpm").at(at)), load: +params.get("load").at(at).toFixed(2),
            events: params.get("events").at(at), gear: state.gear, motion: state.motion, shift: state.shift ?? "",
            overrun: +engine.overrun.toFixed(2), tip: +engine.tip.toFixed(2), pops: engine.popCount, bangs: engine.bangs });
          row = { energy: 0, raw: 0, count: 0, reduction: 0 };
        }
      }
    }
    context.currentTime += TICK;
    for (const param of [...params.values(), master.gain, voiceGain.gain]) if (param.events.length > 64) param.prune(context.currentTime - 0.05);
  }
  runtime.setEnabled(false);
  return { rows, events, output };
}

/**
 * Drive metrics. Upshift windows run 0.45 s from scheduling; cruise windows
 * are the route's steady stretches, where the true acceleration is zero.
 */
export function driveMetrics({ rows, events }, cruise) {
  const upshifts = events.filter(event => event.type === "engine.shift.scheduled" && event.toGear > event.fromGear);
  let dip = 0, overrun = 0, tip = 0;
  for (const shift of upshifts) {
    const before = rows.filter(row => row.t > shift.t - 0.4 && row.t <= shift.t), during = rows.filter(row => row.t > shift.t && row.t < shift.t + 0.45);
    if (!before.length || !during.length) continue;
    const reference = 10 * Math.log10(before.reduce((sum, row) => sum + 10 ** (row.db / 10), 0) / before.length);
    dip = Math.min(dip, Math.min(...during.map(row => row.db)) - reference);
    overrun = Math.max(overrun, ...during.map(row => row.overrun)); tip = Math.max(tip, ...during.map(row => row.tip));
  }
  let fuelCuts = 0, dips = 0;
  for (let i = 10; i < rows.length; i++) {
    const row = rows[i], previous = rows[i - 1];
    if (!cruise.some(([from, to]) => row.t >= from && row.t < to)) continue;
    if (row.overrun >= 0.5 && previous.overrun < 0.5) fuelCuts++;
    const median = rows.slice(i - 10, i).map(item => item.db).sort((a, b) => a - b)[5];
    if (row.db < median - 3 && previous.db >= median - 3) dips++;
  }
  const last = rows[rows.length - 1];
  return { upshifts: upshifts.length, pops: last.pops, bangs: last.bangs, upshiftDipDb: +dip.toFixed(1), upshiftOverrun: +overrun.toFixed(2),
    upshiftTip: +tip.toFixed(2), cruiseFuelCuts: fuelCuts, cruiseDips: dips, maxReductionDb: +Math.max(...rows.map(row => row.reductionDb)).toFixed(1) };
}
