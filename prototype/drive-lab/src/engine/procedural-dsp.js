// Original fictional engine acoustics. No recordings, impulse responses or
// third-party simulator code/constants. RPM is virtual crank speed, not CAN.
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : a));

class Pipe {
  constructor(rate, seconds, feedback) {
    this.samples = new Float32Array(Math.max(2, Math.round(rate * seconds)));
    this.index = 0; this.low = 0; this.feedback = feedback;
    this.damping = 1 - Math.exp(-TAU * 2950 / rate);
  }
  step(input) {
    const delayed = this.samples[this.index];
    this.low += this.damping * (delayed - this.low);
    this.samples[this.index] = input + this.low * this.feedback;
    this.index = (this.index + 1) % this.samples.length;
    return delayed;
  }
}

/** Sample-clock pressure pulses, paired exhaust paths, intake and compressor. */
export class EngineSynth {
  constructor(rate, configuration = {}) {
    this.rate = rate; this.config = configuration; this.phase = 0;
    this.seed = 0x6d2b79f5; this.frames = 0; this.firings = 0;
    this.spool = 0; this.blade = 0; this.blowOff = 0; this.releaseArmed = false;
    this.previousLoad = 0; this.noiseLow = 0; this.airLow = 0;
    this.valveLow = 0; this.valveEnvelope = 0;
    this.dc = [0, 0]; this.last = [0, 0]; this.low = [0, 0];
    this.outputs = [0, 0];
    this.cylinders = configuration.cylinders ?? 4;
    this.banks = configuration.banks ?? Array(this.cylinders).fill(0);
    this.offsets = configuration.offsets ?? Array.from({ length: this.cylinders }, (_, i) => i / this.cylinders);
    this.pulse = new Float32Array(Math.ceil(rate * .018));
    const pulseSeconds = configuration.pulseSeconds ?? .0038;
    for (let i = 0; i < this.pulse.length; i++) {
      const t = i / rate;
      // A finite attack removes an ideal impulse's unbounded high frequencies.
      this.pulse[i] = (1 - Math.exp(-t / .00024)) * Math.exp(-t / pulseSeconds)
        * (Math.cos(TAU * (configuration.pressureHz ?? 95) * t) + .28 * Math.cos(TAU * 2.43 * (configuration.pressureHz ?? 95) * t));
      const tail = clamp((this.pulse.length - 1 - i) / (rate * .003), 0, 1);
      this.pulse[i] *= .5 - .5 * Math.cos(Math.PI * tail);
    }
    this.pending = [new Float32Array(this.pulse.length + 4), new Float32Array(this.pulse.length + 4)];
    this.cursor = 0;
    this.pipes = [0, 1].map(bank => (configuration.pipeSeconds ?? [.0041, .0067, .0113]).map((seconds, i) => new Pipe(rate, seconds * (bank ? 1.037 : 1), .54 - i * .09)));
    this.intake = new Pipe(rate, configuration.intakeSeconds ?? .0028, .43);
    this.dcPole = Math.exp(-TAU * 24 / rate);
    this.noiseCoefficient = 1 - Math.exp(-TAU * 980 / rate);
    this.airCoefficient = 1 - Math.exp(-TAU * 352 / rate);
    this.valveCoefficient = 1 - Math.exp(-TAU * 3600 / rate);
  }
  noise() {
    let x = this.seed; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.seed = x; return (x >>> 0) / 2147483648 - 1;
  }
  fire(bank, amplitude, fraction) {
    const ring = this.pending[bank];
    for (let i = 0; i < this.pulse.length; i++) {
      const value = this.pulse[i] * amplitude;
      ring[(this.cursor + i) % ring.length] += value * (1 - fraction);
      ring[(this.cursor + i + 1) % ring.length] += value * fraction;
    }
    this.firings++;
  }
  sample(rpmValue, loadValue, boostValue = 0, active = 1, eventsAllowed = 1) {
    const rpm = clamp(rpmValue, 0, 10000), load = clamp(loadValue, 0, 1);
    const boost = active > .5 && eventsAllowed > .5 ? clamp(boostValue, 0, 1) : 0;
    const noise = this.noise();
    const tau = boost > this.spool ? (this.config.spoolSeconds ?? .72) : .42;
    this.spool += (boost - this.spool) * (1 - Math.exp(-1 / (this.rate * tau)));
    // Re-arm only under sustained load; one pressure-release event per lift.
    if (load > .58 && this.spool > .2) this.releaseArmed = true;
    if (active > .5 && eventsAllowed > .5 && this.config.turbo && this.releaseArmed && load < .2) {
      this.blowOff = this.spool * .8; this.releaseArmed = false;
    }
    if (active < .5 || eventsAllowed < .5) { this.blowOff = 0; this.releaseArmed = false; }
    this.blowOff *= Math.exp(-1 / (this.rate * .115));
    this.noiseLow += this.noiseCoefficient * (noise - this.noiseLow);
    const highNoise = noise - this.noiseLow;
    this.valveLow += this.valveCoefficient * (highNoise - this.valveLow);
    this.valveEnvelope += (1 - Math.exp(-1 / (this.rate * .004))) * (this.blowOff - this.valveEnvelope);
    this.blade = (this.blade + (this.config.turbine ? 420 + this.spool * 2700 : 1700 + this.spool * 2700) / this.rate) % 1;
    this.airLow += this.airCoefficient * (noise - this.airLow);
    if (this.config.turbine) {
      // Shaft/airflow voice: no fictional piston firings or transmission gears.
      const whine = Math.sin(TAU * this.blade) + .22 * Math.sin(TAU * this.blade * 2);
      const air = this.airLow * (1.2 + 3 * this.spool) + highNoise * .045;
      const raw = (whine * (.07 + .08 * this.spool) + air) * .8;
      this.dc[0] = raw - this.last[0] + this.dcPole * this.dc[0]; this.last[0] = raw;
      this.outputs[0] = this.dc[0]; this.outputs[1] = this.dc[0] * .98;
    } else {
      const delta = rpm / (120 * this.rate), previous = this.phase;
      this.phase = (previous + delta) % 1;
      // Cyclic timing is derived from the audio sample clock, never a 25 ms tick.
      for (let cylinder = 0; cylinder < this.cylinders; cylinder++) {
        let distance = this.offsets[cylinder] - previous;
        if (distance < 0) distance += 1;
        if (delta > 0 && distance < delta) {
          const flutter = rpm > (this.config.limiter ?? 9000) * .985 && this.firings % 5 === 0 ? .32 : 1;
          this.fire(this.banks[cylinder], (.28 + .58 * load) * (1 + noise * .018) * flutter, distance / delta);
        }
      }
      const intake = this.intake.step((this.pending[0][this.cursor] + this.pending[1][this.cursor]) * (.1 + load * .24));
      for (let bank = 0; bank < 2; bank++) {
        const pressure = this.pending[bank][this.cursor]; this.pending[bank][this.cursor] = 0;
        const pipes = this.pipes[bank];
        const exhaust = pressure * .2 + pipes[0].step(pressure) * .55 + pipes[1].step(pressure) * .3 + pipes[2].step(pressure) * .2;
        const raw = exhaust + intake * .32;
        this.dc[bank] = raw - this.last[bank] + this.dcPole * this.dc[bank]; this.last[bank] = raw;
        const cutoff = (this.config.cutoffHz ?? 1900) * (.45 + .55 * load);
        this.low[bank] += (1 - Math.exp(-TAU * cutoff / this.rate)) * (this.dc[bank] - this.low[bank]);
      }
      this.cursor = (this.cursor + 1) % this.pending[0].length;
      const compressor = this.config.turbo ? Math.sin(TAU * this.blade) * this.spool * .065 + this.valveLow * (this.spool * .035 + this.valveEnvelope * .18) : 0;
      const body = this.config.level ?? .85;
      this.outputs[0] = ((this.low[0] * .82 + this.low[1] * .58) * body + compressor);
      this.outputs[1] = ((this.low[1] * .82 + this.low[0] * .58) * body + compressor);
    }
    this.frames++;
    return this.outputs;
  }
}
