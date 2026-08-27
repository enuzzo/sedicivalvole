class TextStepWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.speedKmh = 0;
    this.energy = 0;
    this.brake = 0;
    this.muted = false;

    // Receive parameters from the main thread
    this.port.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "SPEED") {
        this.speedKmh = payload.speed;
        this.energy = payload.energy;
      } else if (type === "BRAKE") {
        this.brake = payload.brake;
      } else if (type === "MUTE") {
        this.muted = payload.muted;
      }
    };

    // Phase 1 Transport State
    this.bpm = 100;
    this.step = 0;
    this.sampleCounter = 0;
    this.clickLevel = 0.0;
    this.phase = 0.0;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output[0]) return true;

    const channel0 = output[0];
    const channel1 = output.length > 1 ? output[1] : null;

    if (this.muted) {
      for (let i = 0; i < channel0.length; i++) {
        channel0[i] = 0.0;
        if (channel1) channel1[i] = 0.0;
      }
      return true;
    }

    // Smoothly interpolate BPM towards the target based on energy
    const targetBpm = 100 + this.energy * 75;
    this.bpm += (targetBpm - this.bpm) * 0.001; // Glide per render block

    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerStep = secondsPerBeat / 4.0;
    const samplesPerStep = secondsPerStep * sampleRate;

    for (let i = 0; i < channel0.length; i++) {
      if (this.sampleCounter >= samplesPerStep) {
        this.sampleCounter -= samplesPerStep; // Retain fractional part for deterministic timing
        this.step = (this.step + 1) % 16;

        // Metronome click for testing Phase 1
        if (this.step % 4 === 0) {
          this.clickLevel = 0.8; // Downbeat
        } else {
          this.clickLevel = 0.2; // Offbeat
        }
      }

      this.clickLevel *= 0.998; // Decay envelope
      this.phase += 800.0 / sampleRate; // ~800Hz tone
      if (this.phase > 1.0) this.phase -= 1.0;
      
      const sine = Math.sin(this.phase * Math.PI * 2.0) * this.clickLevel;
      
      // Phase 1 underwater mock: just lower volume when braking
      const out = sine * (1.0 - this.brake * 0.8) * 0.2; // Keep volume reasonable

      channel0[i] = out;
      if (channel1) channel1[i] = out;

      this.sampleCounter++;
    }

    return true;
  }
}

registerProcessor("textstep-worklet", TextStepWorklet);
