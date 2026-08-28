import { BloomEffect } from "../dsp/bloom-effect.js";

class BloomProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.effect = new BloomEffect(sampleRate);
    this.port.onmessage = (event) => {
      if (event.data?.type === "TRIGGER") this.effect.trigger();
      else if (event.data?.type === "RELEASE") this.effect.release();
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output?.[0]) return true;
    const inputLeft = input?.[0];
    const inputRight = input?.[1] ?? inputLeft;
    const outputLeft = output[0];
    const outputRight = output[1] ?? outputLeft;
    for (let frame = 0; frame < outputLeft.length; frame += 1) {
      const left = inputLeft?.[frame] ?? 0;
      const right = inputRight?.[frame] ?? left;
      if (!this.effect.active) {
        outputLeft[frame] = left;
        outputRight[frame] = right;
        continue;
      }
      const processed = this.effect.tick(left, right);
      outputLeft[frame] = processed[0];
      outputRight[frame] = processed[1];
    }
    return true;
  }
}

registerProcessor("bloom-processor", BloomProcessor);
