import { CombustionEngine } from "./dsp.js";
import { combustionEngine } from "./engines.js";

// Same parameter contract as the earlier procedural voice, so the runtime drives
// both identically: virtual acoustic rpm/load/boost, plus active and events.
class CombustionProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "rpm", defaultValue: 1000, minValue: 0, maxValue: 12000, automationRate: "a-rate" },
      { name: "load", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "a-rate" },
      { name: "boost", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "a-rate" },
      { name: "active", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
      { name: "events", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
    ];
  }
  constructor(options) {
    super();
    const { engine, overrides } = options.processorOptions ?? {};
    this.engine = new CombustionEngine(sampleRate, { ...combustionEngine(engine), ...overrides });
    this.alive = true;
    this.port.onmessage = event => { if (event.data === "dispose") this.alive = false; };
  }
  process(_inputs, outputs, params) {
    if (!this.alive) return false;
    const channels = outputs[0];
    if (!channels?.length) return true;
    const left = channels[0], right = channels[1] ?? channels[0];
    const active = params.active[0];
    if (active < 0.5) this.engine.quiet();
    if (active < 0.5 && this.engine.fade === 0) { left.fill(0); if (right !== left) right.fill(0); return true; }
    this.engine.process(left, right, left.length, params.rpm, params.load, params.boost, active, params.events[0]);
    return true;
  }
}
registerProcessor("sedicivalvole-combustion", CombustionProcessor);
