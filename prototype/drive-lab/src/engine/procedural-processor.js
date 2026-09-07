import { EngineSynth } from "./procedural-dsp.js";

class EngineProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "rpm", defaultValue: 1000, minValue: 0, maxValue: 10000, automationRate: "a-rate" },
      { name: "load", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "a-rate" },
      { name: "boost", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "a-rate" },
      { name: "active", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
      { name: "events", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
    ];
  }
  constructor(options) {
    super(); this.synth = new EngineSynth(sampleRate, options.processorOptions); this.alive = true; this.fade = 0;
    this.port.onmessage = event => { if (event.data === "dispose") this.alive = false; };
  }
  process(_inputs, outputs, params) {
    if (!this.alive) return false;
    const channels = outputs[0];
    if (!channels?.length) return true;
    const active = params.active[0];
    if (active < .5) {
      this.synth.spool = 0; this.synth.blowOff = 0; this.synth.releaseArmed = false;
      this.synth.valveEnvelope = 0;
      if (this.fade === 0) { for (const channel of channels) channel.fill(0); return true; }
    }
    for (let i = 0; i < channels[0].length; i++) {
      const sample = this.synth.sample(params.rpm.length > 1 ? params.rpm[i] : params.rpm[0],
        params.load.length > 1 ? params.load[i] : params.load[0], params.boost.length > 1 ? params.boost[i] : params.boost[0], active, params.events[0]);
      this.fade = Math.max(0, Math.min(1, this.fade + (active > .5 ? 1 : -1) / (sampleRate * .008)));
      channels[0][i] = sample[0] * this.fade;
      if (channels[1]) channels[1][i] = sample[1] * this.fade;
    }
    return true;
  }
}
registerProcessor("sedicivalvole-engine", EngineProcessor);
