import { BeatRepeatEffect } from "./beat-repeat-effect.js";

class SoundtrackRepeatProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.effect = new BeatRepeatEffect(sampleRate);
    this.port.onmessage = (event) => {
      if (event.data?.type === "SET_AMOUNT") this.effect.set(event.data.amount);
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
      const repeated = this.effect.tick(left, right);
      outputLeft[frame] = repeated[0];
      outputRight[frame] = repeated[1];
    }
    return true;
  }
}

registerProcessor("soundtrack-repeat-processor", SoundtrackRepeatProcessor);
