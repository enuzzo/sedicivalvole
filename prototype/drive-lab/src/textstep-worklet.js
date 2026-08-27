function decodeHex(hexStr) {
  const arr = new Float32Array(32);
  for (let i = 0; i < 8; i++) {
    const val = parseInt(hexStr[i], 16);
    arr[i * 4 + 0] = (val & 8) ? 1.0 : 0.0;
    arr[i * 4 + 1] = (val & 4) ? 1.0 : 0.0;
    arr[i * 4 + 2] = (val & 2) ? 1.0 : 0.0;
    arr[i * 4 + 3] = (val & 1) ? 1.0 : 0.0;
  }
  return arr;
}

const KICK_PAT = decodeHex("88208020"); // Some syncopation
const SNARE_PAT = decodeHex("08080808");
const HAT_PAT = decodeHex("aaaaaaaa");
const PAD_PAT = decodeHex("80008000");

// Simple pseudo-random for noise
function randomNoise() {
  return Math.random() * 2.0 - 1.0;
}

class TextStepWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.speedKmh = 0;
    this.energy = 0;
    this.brake = 0;
    this.muted = false;

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

    this.bpm = 100;
    this.step = 0;
    this.sampleCounter = 0;

    // Synth states
    this.kickPhase = 0;
    this.kickEnv = 0;

    this.snareEnv = 0;

    this.hatEnv = 0;

    this.bassPhase = 0;
    this.bassEnv = 0;
    
    // Pad (Chords)
    this.padPhase1 = 0;
    this.padPhase2 = 0;
    this.padPhase3 = 0;
    this.padEnv = 0;
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

    // Adaptive Logic: BPM glides based on energy (100 -> 174 BPM for Jungle)
    const targetBpm = 100 + this.energy * 74;
    this.bpm += (targetBpm - this.bpm) * 0.005;

    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerStep = secondsPerBeat / 4.0;
    const samplesPerStep = secondsPerStep * sampleRate;

    // Arrangement layers based on energy
    const playKick = this.energy > 0.15;
    const playSnare = this.energy > 0.4;
    const playHat = this.energy > 0.3;
    const playBass = this.energy > 0.2;
    // Pad plays almost always, but fades out at absolute zero
    const padVolume = Math.min(1.0, this.energy * 5.0);

    for (let i = 0; i < channel0.length; i++) {
      if (this.sampleCounter >= samplesPerStep) {
        this.sampleCounter -= samplesPerStep;
        
        if (playKick && KICK_PAT[this.step]) {
          this.kickEnv = 1.0;
          this.kickPhase = 0.0;
        }
        if (playSnare && SNARE_PAT[this.step]) {
          this.snareEnv = 1.0;
        }
        if (playHat && HAT_PAT[this.step]) {
          this.hatEnv = 1.0;
        }
        if (playBass && KICK_PAT[this.step]) { // Bass follows kick for now
          this.bassEnv = 1.0;
        }
        if (PAD_PAT[this.step]) {
          this.padEnv = 1.0;
        }
        
        this.step = (this.step + 1) % 32;
      }

      // -- KICK DSP --
      this.kickEnv *= 0.9992; // Decay
      const kickFreq = 50.0 + this.kickEnv * 150.0; // Pitch envelope
      this.kickPhase += (kickFreq / sampleRate) * Math.PI * 2.0;
      let kickOut = Math.sin(this.kickPhase) * this.kickEnv * 0.7;

      // -- SNARE DSP --
      this.snareEnv *= 0.999;
      let snareOut = randomNoise() * this.snareEnv * 0.4;

      // -- HI-HAT DSP --
      this.hatEnv *= 0.996;
      let hatOut = randomNoise() * this.hatEnv * 0.2;

      // -- BASS DSP (Reese / Sub) --
      this.bassEnv *= 0.9995;
      this.bassPhase += (41.20 / sampleRate) * Math.PI * 2.0; // E1 note
      // Simple sawtooth-ish
      let bassOut = ( (this.bassPhase / Math.PI) % 2.0 - 1.0 ) * this.bassEnv * 0.4;
      // Soft clip the bass for thickness
      bassOut = Math.tanh(bassOut * 2.0);

      // -- PAD DSP (Minor 7th Chord: E, G, B, D) --
      // Envelope with slower attack/decay for pads
      this.padEnv *= 0.9999; 
      // Freqs for Em7: E3 (164.81), G3 (196.00), B3 (246.94)
      this.padPhase1 += (164.81 / sampleRate) * Math.PI * 2.0;
      this.padPhase2 += (196.00 / sampleRate) * Math.PI * 2.0;
      this.padPhase3 += (246.94 / sampleRate) * Math.PI * 2.0;
      let padOut = (
        Math.sin(this.padPhase1) + 
        Math.sin(this.padPhase2) + 
        Math.sin(this.padPhase3)
      ) * 0.333 * this.padEnv * 0.3 * padVolume;

      // -- MIX DOWN --
      let out = kickOut + snareOut + hatOut + bassOut + padOut;

      // -- UNDERWATER / BRAKE FILTER (Simple Lowpass Mock) --
      // Very basic 1-pole lowpass filter for the brake effect
      out = out * (1.0 - this.brake * 0.8); // Just volume for now to save CPU, actual SVF filter comes in Phase 3
      
      // Soft Limit Master
      out = Math.tanh(out);

      channel0[i] = out;
      if (channel1) channel1[i] = out;

      this.sampleCounter++;
    }

    return true;
  }
}

registerProcessor("textstep-worklet", TextStepWorklet);
