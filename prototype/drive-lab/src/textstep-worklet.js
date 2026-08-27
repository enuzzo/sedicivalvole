
function decodeHex(hexStr) {
  const arr = new Float32Array(hexStr.length * 4);
  for (let i = 0; i < hexStr.length; i++) {
    const val = parseInt(hexStr[i], 16);
    arr[i * 4 + 0] = (val & 8) ? 1.0 : 0.0;
    arr[i * 4 + 1] = (val & 4) ? 1.0 : 0.0;
    arr[i * 4 + 2] = (val & 2) ? 1.0 : 0.0;
    arr[i * 4 + 3] = (val & 1) ? 1.0 : 0.0;
  }
  return arr;
}

// 64-step (4 bar) Jungle patterns
const KICK_PAT  = decodeHex("8000802080008220" + "8000802088008020"); 
const SNARE_PAT = decodeHex("0800080008000800" + "0800080008000808");
const GHOST_PAT = decodeHex("0020000400240000" + "0020000400200020");
const HAT_PAT   = decodeHex("aaaaaaaaaaaaaaaa" + "aaaaaaaaaaaaaaaa");
const BASS_PAT  = decodeHex("8000002000800000" + "8000002000800000"); // Syncopated rolling bass
const PAD_PAT   = decodeHex("8000000000000000" + "8000000000000000"); // Chords every 2 bars
const ARP_PAT   = decodeHex("8888888888888888" + "8888888888888888");
const LEAD_PAT  = decodeHex("0000800000800080" + "0000800000800080");

function mtof(midi) {
  if (midi === 0) return 0;
  return 440.0 * Math.pow(2.0, (midi - 69.0) / 12.0);
}

// 4-bar progression: Em9, Cmaj9, Am9, Bm7
const PROGRESSION = [
  { root: 40, pad: [55, 59, 62, 66], arp: [55, 59, 62, 66, 71, 66, 62, 59] }, // Em9
  { root: 36, pad: [52, 59, 62, 67], arp: [52, 55, 59, 64, 67, 64, 59, 55] }, // Cmaj9
  { root: 45, pad: [48, 55, 60, 64], arp: [48, 52, 55, 60, 64, 60, 55, 52] }, // Am9 (A2=45)
  { root: 47, pad: [50, 57, 62, 66], arp: [50, 54, 57, 62, 66, 62, 57, 54] }, // Bm7 (B2=47)
];

const LEAD_MELODY = [
  [74, 71, 66, 62],
  [76, 71, 67, 64],
  [72, 67, 64, 60],
  [74, 69, 66, 62]
];

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
    
    return v2;
  }
}

class TextStepWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.speedKmh = 0;
    this.instantEnergy = 0;
    this.brake = 0;
    this.muted = false;
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
    this.step = 0;         // 0 to 63 (4 bars)
    this.sampleCounter = 0;

    // Envelopes
    this.kickEnv = 0;
    this.kickPhase = 0;
    this.snareEnv = 0;
    this.ghostEnv = 0;
    this.hatEnv = 0;
    
    this.bassEnv = 0;
    this.bassPhase = 0;
    this.bassNote = 0;
    
    this.padEnv = 0;
    this.padPhases = [0, 0, 0, 0];
    this.padNotes = [0, 0, 0, 0];

    this.arpEnv = 0;
    this.arpPhase = 0;
    this.arpNote = 0;
    
    this.leadEnv = 0;
    this.leadPhase = 0;
    this.leadNote = 0;

    // Ducking
    this.sidechainEnv = 0;
    
    // Effects
    this.delay = new DelayLine(48000 * 2);
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
    
    if (this.instantEnergy >= this.arrangementEnergy) {
      this.arrangementEnergy += (this.instantEnergy - this.arrangementEnergy) * 0.005;
    } else {
      this.arrangementEnergy += (this.instantEnergy - this.arrangementEnergy) * 0.0001;
    }

    const targetBpm = 110 + this.arrangementEnergy * 64; // 110 to 174 BPM
    this.bpm += (targetBpm - this.bpm) * 0.005;

    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerStep = secondsPerBeat / 4.0;
    const samplesPerStep = secondsPerStep * sampleRate;

    // Layer activation
    const playKick = this.arrangementEnergy > 0.15;
    const playSnare = this.arrangementEnergy > 0.25;
    const playHat = this.arrangementEnergy > 0.2;
    const playBass = this.arrangementEnergy > 0.3;
    const playArp = this.arrangementEnergy > 0.45;
    const playLead = this.arrangementEnergy > 0.8;
    const padVolume = Math.min(1.0, this.arrangementEnergy * 4.0);

    const bar = Math.floor(this.step / 16); // 0 to 3
    const currentChord = PROGRESSION[bar];
    const currentLead = LEAD_MELODY[bar];

    for (let i = 0; i < channel0.length; i++) {
      if (this.sampleCounter >= samplesPerStep) {
        this.sampleCounter -= samplesPerStep;
        
        if (playKick && KICK_PAT[this.step]) {
          this.kickEnv = 1.0;
          this.kickPhase = 0.0;
          this.sidechainEnv = 1.0;
        }
        if (playSnare && SNARE_PAT[this.step]) this.snareEnv = 1.0;
        if (playSnare && GHOST_PAT[this.step]) this.ghostEnv = 1.0;
        if (playHat && HAT_PAT[this.step]) this.hatEnv = (this.step % 4 === 0) ? 1.0 : 0.6; // Accent on downbeats
        
        if (playBass && BASS_PAT[this.step]) { 
          this.bassEnv = 1.0;
          this.bassNote = currentChord.root;
        }
        
        if (PAD_PAT[this.step]) {
          this.padEnv = 1.0;
          this.padNotes = currentChord.pad;
        }
        
        if (playArp && ARP_PAT[this.step]) {
          this.arpEnv = 1.0;
          this.arpNote = currentChord.arp[this.step % 8];
        }
        
        if (playLead && LEAD_PAT[this.step]) {
          this.leadEnv = 1.0;
          // Pick note from lead melody based on step
          this.leadNote = currentLead[Math.floor((this.step % 16) / 4)];
        }
        
        this.step = (this.step + 1) % 64;
      }

      this.sidechainEnv *= 0.9992; 
      const ducking = 1.0 - (this.sidechainEnv * 0.7);

      // KICK
      this.kickEnv *= 0.9992;
      const kickFreq = 45.0 + this.kickEnv * 120.0; 
      this.kickPhase += (kickFreq / sampleRate) * Math.PI * 2.0;
      let kickOut = Math.sin(this.kickPhase) * this.kickEnv * 1.1; 

      // SNARE & GHOST
      this.snareEnv *= 0.999;
      this.ghostEnv *= 0.997;
      let snareNoise = randomNoise();
      let snareOut = snareNoise * this.snareEnv * 0.45;
      snareOut += snareNoise * this.ghostEnv * 0.15; // Soft ghost snare

      // HAT
      this.hatEnv *= 0.996;
      let hatOut = randomNoise() * this.hatEnv * 0.18;

      // BASS (Reese style rolling bass)
      this.bassEnv *= 0.9996;
      const bassFreq = mtof(this.bassNote);
      this.bassPhase += (bassFreq / sampleRate) * Math.PI * 2.0; 
      // Sawtooth-ish
      let bassOut = ((this.bassPhase / Math.PI) % 2.0 - 1.0) * this.bassEnv * 0.4;
      bassOut = Math.tanh(bassOut * 3.0) * ducking; 
      // Lowpass on bass
      bassOut *= (0.2 + this.bassEnv * 0.8);

      // PAD (Warm 4-voice chords)
      this.padEnv *= 0.99995; // Long sustain
      let padOut = 0;
      for(let p=0; p<4; p++) {
         this.padPhases[p] += (mtof(this.padNotes[p]) / sampleRate) * Math.PI * 2.0;
         padOut += Math.sin(this.padPhases[p]);
      }
      padOut = (padOut * 0.15) * this.padEnv * padVolume * ducking;

      // ARP (Pluck)
      this.arpEnv *= 0.997; // Short pluck
      this.arpPhase += (mtof(this.arpNote) / sampleRate) * Math.PI * 2.0;
      // Triangle wave
      let arpOut = Math.asin(Math.sin(this.arpPhase)) * (2.0/Math.PI) * this.arpEnv * 0.12;
      arpOut *= ducking;

      // LEAD (Soaring melody)
      this.leadEnv *= 0.9998;
      this.leadPhase += (mtof(this.leadNote) / sampleRate) * Math.PI * 2.0;
      // Square wave with glide/filter emulation
      let leadOut = (Math.sin(this.leadPhase) > 0 ? 1.0 : -1.0) * this.leadEnv * 0.08;
      // Soften the square
      leadOut = Math.sin(this.leadPhase) * 0.5 + leadOut * 0.5;
      leadOut *= ducking;

      // DELAY (Snare, Hat, Arp, Lead)
      const delayInput = snareOut * 0.3 + hatOut * 0.2 + arpOut * 0.5 + leadOut * 0.6;
      const delayTimeSamples = (60.0 / this.bpm) * 0.75 * sampleRate; 
      let delayOut = this.delay.process(delayInput, delayTimeSamples, 0.4);
      delayOut *= ducking; 

      // Mix it down
      // Reduce kick and bass slightly to let melody breathe
      let mix = (kickOut * 0.8) + snareOut + hatOut + (bassOut * 0.8) + padOut + arpOut + leadOut + delayOut;

      // BRAKE SVF
      const cutoff = 0.45 - this.brake * 0.43;
      mix = this.svf.process(mix, cutoff, 0.2); 
      
      // Master limit
      mix = Math.tanh(mix * 1.2);

      channel0[i] = mix;
      if (channel1) channel1[i] = mix;

      this.sampleCounter++;
    }

    return true;
  }
}

registerProcessor("textstep-worklet", TextStepWorklet);
