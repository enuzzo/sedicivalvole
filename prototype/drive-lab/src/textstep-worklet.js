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

const KICK_PAT = decodeHex("88208020"); 
const SNARE_PAT = decodeHex("08080808");
const HAT_PAT = decodeHex("aaaaaaaa");
const PAD_PAT = decodeHex("80008000");
const ARP_PAT = decodeHex("88888888"); // 8th notes

function randomNoise() {
  return Math.random() * 2.0 - 1.0;
}

class DelayLine {
  constructor(maxSize) {
    this.buffer = new Float32Array(maxSize);
    this.ptr = 0;
  }
  process(input, delaySamples, feedback) {
    let readPtr = this.ptr - Math.floor(delaySamples);
    if (readPtr < 0) readPtr += this.buffer.length;
    const out = this.buffer[readPtr];
    this.buffer[this.ptr] = input + out * feedback;
    this.ptr = (this.ptr + 1) % this.buffer.length;
    return out;
  }
}

// Simple State Variable Filter (SVF)
class SVF {
  constructor() {
    this.ic1eq = 0;
    this.ic2eq = 0;
  }
  process(input, fc, res) {
    const g = Math.tan(Math.PI * fc);
    const k = 2.0 - 2.0 * res;
    const a1 = 1.0 / (1.0 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    
    const v3 = input - this.ic2eq;
    const v1 = a1 * this.ic1eq + a2 * v3;
    const v2 = this.ic2eq + a2 * this.ic1eq + a3 * v3;
    
    this.ic1eq = 2.0 * v1 - this.ic1eq;
    this.ic2eq = 2.0 * v2 - this.ic2eq;
    
    return v2; // Lowpass output
  }
}

class TextStepWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.speedKmh = 0;
    this.instantEnergy = 0;
    this.brake = 0;
    this.muted = false;

    // Deceleration Memory
    this.arrangementEnergy = 0;

    this.port.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "SPEED") {
        this.speedKmh = payload.speed;
        this.instantEnergy = payload.energy;
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
    
    this.padPhase1 = 0;
    this.padPhase2 = 0;
    this.padPhase3 = 0;
    this.padEnv = 0;

    this.arpPhase = 0;
    this.arpEnv = 0;
    this.arpNote = 0;

    // Sidechain
    this.sidechainEnv = 0;
    
    // Effects
    this.delay = new DelayLine(48000 * 2); // up to 2 seconds
    this.svf = new SVF();
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
    
    // Hysteresis & Deceleration Memory
    // If instant energy is higher, arrangement catches up fast.
    // If instant energy is lower, arrangement decays very slowly.
    if (this.instantEnergy >= this.arrangementEnergy) {
      this.arrangementEnergy += (this.instantEnergy - this.arrangementEnergy) * 0.005;
    } else {
      this.arrangementEnergy += (this.instantEnergy - this.arrangementEnergy) * 0.0001; // Slower decay
    }

    const targetBpm = 100 + this.arrangementEnergy * 74;
    this.bpm += (targetBpm - this.bpm) * 0.005;

    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerStep = secondsPerBeat / 4.0;
    const samplesPerStep = secondsPerStep * sampleRate;

    const playKick = this.arrangementEnergy > 0.15;
    const playSnare = this.arrangementEnergy > 0.4;
    const playHat = this.arrangementEnergy > 0.3;
    const playBass = this.arrangementEnergy > 0.2;
    const playArp = this.arrangementEnergy > 0.6;
    const padVolume = Math.min(1.0, this.arrangementEnergy * 5.0);
    
    const arpNotes = [196.00, 246.94, 293.66, 329.63]; // G3, B3, D4, E4 (Em7 pentatonic-ish)

    for (let i = 0; i < channel0.length; i++) {
      if (this.sampleCounter >= samplesPerStep) {
        this.sampleCounter -= samplesPerStep;
        
        if (playKick && KICK_PAT[this.step]) {
          this.kickEnv = 1.0;
          this.kickPhase = 0.0;
          this.sidechainEnv = 1.0; // Trigger sidechain ducking
        }
        if (playSnare && SNARE_PAT[this.step]) {
          this.snareEnv = 1.0;
        }
        if (playHat && HAT_PAT[this.step]) {
          this.hatEnv = 1.0;
        }
        if (playBass && KICK_PAT[this.step]) { 
          this.bassEnv = 1.0;
        }
        if (PAD_PAT[this.step]) {
          this.padEnv = 1.0;
        }
        if (playArp && ARP_PAT[this.step]) {
          this.arpEnv = 1.0;
          this.arpNote = arpNotes[Math.floor(this.step / 2) % arpNotes.length];
        }
        
        this.step = (this.step + 1) % 32;
      }

      // SIDECHAIN
      this.sidechainEnv *= 0.9992; 
      const ducking = 1.0 - (this.sidechainEnv * 0.7); // Volume drops to 30% on kick

      // KICK
      this.kickEnv *= 0.9992;
      const kickFreq = 50.0 + this.kickEnv * 150.0; 
      this.kickPhase += (kickFreq / sampleRate) * Math.PI * 2.0;
      let kickOut = Math.sin(this.kickPhase) * this.kickEnv * 0.9; // Louder kick

      // SNARE
      this.snareEnv *= 0.999;
      let snareOut = randomNoise() * this.snareEnv * 0.4;

      // HAT
      this.hatEnv *= 0.996;
      let hatOut = randomNoise() * this.hatEnv * 0.2;

      // BASS
      this.bassEnv *= 0.9995;
      this.bassPhase += (41.20 / sampleRate) * Math.PI * 2.0; 
      let bassOut = ((this.bassPhase / Math.PI) % 2.0 - 1.0) * this.bassEnv * 0.5;
      bassOut = Math.tanh(bassOut * 2.5) * ducking; // Thick bass, ducked

      // PAD
      this.padEnv *= 0.9999; 
      this.padPhase1 += (164.81 / sampleRate) * Math.PI * 2.0;
      this.padPhase2 += (196.00 / sampleRate) * Math.PI * 2.0;
      this.padPhase3 += (246.94 / sampleRate) * Math.PI * 2.0;
      let padOut = (Math.sin(this.padPhase1) + Math.sin(this.padPhase2) + Math.sin(this.padPhase3)) * 0.333 * this.padEnv * 0.4 * padVolume;
      padOut *= ducking;

      // ARP
      this.arpEnv *= 0.998;
      this.arpPhase += (this.arpNote / sampleRate) * Math.PI * 2.0;
      let arpOut = Math.sin(this.arpPhase) * this.arpEnv * 0.25;

      // DELAY (Echoing Snare, Hat, Arp)
      const delayInput = snareOut * 0.4 + hatOut * 0.2 + arpOut * 0.6;
      const delayTimeSamples = (60.0 / this.bpm) * 0.75 * sampleRate; // Dotted 8th note delay
      let delayOut = this.delay.process(delayInput, delayTimeSamples, 0.4);
      delayOut *= ducking; // Delay ducks too!

      let mix = kickOut + snareOut + hatOut + bassOut + padOut + arpOut + delayOut;

      // BRAKE SVF (Lowpass)
      // Brake goes 0.0 -> 1.0. At 0.0, freq is high (0.45 of Nyquist). At 1.0, freq is low (0.02)
      const cutoff = 0.45 - this.brake * 0.43;
      mix = this.svf.process(mix, cutoff, 0.2); // slight resonance
      
      // Soft Limit Master
      mix = Math.tanh(mix);

      channel0[i] = mix;
      if (channel1) channel1[i] = mix;

      this.sampleCounter++;
    }

    return true;
  }
}

registerProcessor("textstep-worklet", TextStepWorklet);
