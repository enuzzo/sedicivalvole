// Original physically informed combustion-engine synthesizer.
//
// Written from first principles for Sedicivalvole: no recordings, impulse
// responses, or third-party simulator code, constants or car tables. Real
// firing orders and bank layouts are public engineering facts; every acoustic
// value in ./engines.js is our own tuning. RPM, load and boost are the virtual
// acoustic state authored by the runtime, never Tesla CAN data.
//
// Signal path, per sample:
//   crank angle (720° four-stroke cycle)
//   → per cylinder: exhaust flow pulse shaped in crank degrees (blowdown +
//     displacement), cycle-to-cycle combustion variation with memory, and
//     turbulent flow noise riding on the pulse
//   → per cylinder primary pipe (waveguide; lengths differ per cylinder)
//   → bank collectors (+ optional turbine damping, crossover pipe)
//   → main pipe waveguide → muffler (expansion chamber, drone resonator,
//     absorptive low-pass) with a load-opened bypass valve → tailpipes
//   → radiation (near-field flow + far-field derivative)
//   + intake (per-cylinder suction pulses, plenum resonance, induction roar,
//     closed-throttle hiss), mechanical layer (block modes excited by
//     combustion and valve events, cam-drive whine, injector ticks), forced
//     induction (turbo whistle/whoosh/blow-off or surge flutter, supercharger
//     whine), overrun afterfire, shift crack and limiter cut
//   → cabin perspective, DC block, soft saturation.
//
// Gas temperature follows sustained load and sets the speed of sound in the
// pipes, so their resonances drift upward as the engine works, as in a real car.

const TAU = Math.PI * 2;
const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
const finite = (x, fallback) => (Number.isFinite(x) ? x : fallback);
const smoothstep = x => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const coefficient = (rate, seconds) => 1 - Math.exp(-1 / (rate * Math.max(1e-5, seconds)));
const onePoleHz = (rate, hz) => 1 - Math.exp(-TAU * Math.min(hz, rate * 0.45) / rate);

/** xorshift32: deterministic and allocation free. */
class Random {
  constructor(seed) { this.state = (seed >>> 0) || 0x9e3779b9; }
  next() {
    let x = this.state;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 4294967296;
  }
  white() { return this.next() * 2 - 1; }
  gauss() { return (this.next() + this.next() + this.next() + this.next() - 2) * 1.7320508; }
}

/** RBJ biquad, transposed direct form II. */
class Biquad {
  constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
  design(type, rate, hz, q = 0.707, db = 0) {
    const w = TAU * clamp(hz, 10, rate * 0.45) / rate, cos = Math.cos(w), alpha = Math.sin(w) / (2 * Math.max(0.05, q));
    const A = Math.pow(10, db / 40);
    let b0, b1, b2, a0, a1, a2;
    if (type === "lowpass") { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
    else if (type === "highpass") { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
    else if (type === "bandpass") { b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
    else if (type === "notch") { b0 = 1; b1 = -2 * cos; b2 = 1; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; }
    else { // peaking
      b0 = 1 + alpha * A; b1 = -2 * cos; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cos; a2 = 1 - alpha / A;
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
    return this;
  }
  step(x) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

/** Power-of-two delay line with cubic Hermite fractional reads. */
class Delay {
  constructor(minimum) {
    let size = 64; while (size < minimum + 8) size <<= 1;
    this.buffer = new Float32Array(size); this.mask = size - 1; this.index = 0;
  }
  write(x) { this.index = (this.index + 1) & this.mask; this.buffer[this.index] = x; }
  /** Value written `delay` samples ago (delay >= 1). */
  read(delay) {
    const d = clamp(delay, 1, this.mask - 4), whole = d | 0, f = d - whole, b = this.buffer, m = this.mask, i = this.index - whole;
    const y0 = b[(i + 1) & m], y1 = b[i & m], y2 = b[(i - 1) & m], y3 = b[(i - 2) & m];
    const c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
    return ((c3 * f + c2) * f + c1) * f + y1;
  }
}

/**
 * One acoustic pipe: a forward wave travels its length, part of it reflects at
 * the far end, travels back, reflects again at the near end and rejoins. The
 * round trip forms the comb of resonances; `loop` is the product of both
 * reflection coefficients and `lossHz` the wall/turbulence damping per trip.
 */
class Pipe {
  constructor(rate, maxSeconds) { this.line = new Delay(Math.ceil(rate * maxSeconds * 2) + 8); this.delay = 8; this.loop = 0; this.low = 0; this.loss = 0.5; }
  tune(rate, seconds, loop, lossHz) {
    this.delay = Math.max(2, seconds * rate); this.loop = loop; this.loss = onePoleHz(rate, lossHz);
  }
  step(x) {
    this.low += this.loss * (this.line.read(2 * this.delay) - this.low);
    this.line.write(x + this.loop * this.low);
    return this.line.read(this.delay);
  }
}

/** Speed of sound in hot exhaust gas (m/s); gamma ≈ 1.34, R ≈ 288 J/kg·K. */
const soundSpeed = kelvin => 19.65 * Math.sqrt(kelvin);
const EXHAUST_OPENS = 132; // crank degrees after firing TDC (≈ 48° before BDC)
const EXHAUST_SPAN = 250;  // valve open duration, degrees
const INTAKE_OPENS = 348;  // ≈ 12° before overlap TDC
const INTAKE_SPAN = 236;

/** Shape of the blowdown pulse over its span t ∈ [0, 1): steep opening, long decay. */
function blowdownShape(t, attack) {
  if (t < attack) return 0.5 - 0.5 * Math.cos(Math.PI * t / attack);
  // Sonic blowdown: a sharp peak that sheds most of its pressure early.
  const q = (1 - t) / (1 - attack);
  return q * q * q * (0.35 + 0.65 * q) + 0.12 * q;
}

const DEFAULTS = Object.freeze({
  idleRpm: 800, redlineRpm: 7000, limiterRpm: 7200,
  header: { lengths: null, length: 0.7, spread: 0.06, collector: -0.32, lossHz: 4200 },
  bankMerge: 0.2,
  main: { length: 1.8, loop: 0.26, lossHz: 2600 },
  muffler: { chamber: 0.4, rho: 0.5, lowpassHz: 1500, openHz: 4200, resonatorHz: 0, resonatorQ: 3,
    valveRpm: 3500, valveLoad: 0.45, quiet: 0.55 },
  tail: { lengths: [0.6, 0.64], loop: -0.4, lossHz: 3000 },
  pulse: { degrees: 58, widen: 0.55, attack: 0.11, displacement: 0.22, grit: 0.6, flowGrit: 0.2, turbulence: 0.05 },
  combustion: { cov: 0.035, idleCov: 0.1, memory: 0.5, trim: 0.05, misfire: 0, jitterDeg: 1.2, idleStrength: 0.34, wander: 0.012, bankSpread: 0.06 },
  intake: { level: 0.25, plenumHz: 85, plenumQ: 2.2, roarHz: 900, roarQ: 0.9, roar: 0.35, hiss: 0.04, runner: 0.32 },
  mechanical: { level: 0.12, modes: [[820, 14, 0.5], [1450, 18, 0.4], [2500, 22, 0.3], [4100, 28, 0.2]],
    combustion: 0.6, valves: 0.35, whineOrder: 0, whine: 0, injector: 0 },
  forced: null,
  overrun: { crackle: 0.4, pop: 0.5, burble: 0.25, body: 0.3 },
  shiftCrack: 0.35,
  cabin: 0.3, bodyHz: 52, bodyDb: 3,
  bankSkew: 0.045, idleLift: 1.5, lightLift: 0.6, near: 0.85, far: 0.7, width: 0.55, drive: 1.6, gain: 0.5,
});

function merge(base, extra) {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra ?? {})) {
    out[key] = value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])
      ? { ...base[key], ...value } : value;
  }
  return out;
}

/**
 * Real-time engine voice. `process` renders one block from per-sample (or
 * single-value) rpm/load/boost arrays plus k-rate active/events flags.
 */
export class CombustionEngine {
  constructor(rate, specification = {}) {
    const spec = merge(DEFAULTS, specification);
    this.rate = rate; this.spec = spec;
    const firing = spec.firing?.length ? spec.firing : [[0, 1, 0], [180, 3, 0], [360, 4, 0], [540, 2, 0]];
    this.count = firing.length;
    // Real cylinders never exhaust at exactly the nominal angle: cam, rod and
    // port tolerances give each one a small fixed offset (the half orders).
    const phaseRandom = new Random((spec.seed ?? 0x5ed1c1a1) ^ 0xa5a5a5a5);
    this.angles = Float64Array.from(firing, ([angle]) => ((angle + (spec.combustion.phaseSpread ?? 2.4) * phaseRandom.gauss() + 720) % 720 + 720) % 720);
    this.banks = Uint8Array.from(firing, ([, , bank]) => (bank ? 1 : 0));
    this.dualBank = this.banks.some(bank => bank === 1);
    this.perBank = [0, 1].map(bank => Math.max(1, this.banks.filter(value => value === bank).length));
    const random = new Random(spec.seed ?? 0x5ed1c1a1);
    this.random = random;
    const header = spec.header;
    this.headerLengths = Float64Array.from(firing, (_, i) => header.lengths?.[i]
      ?? header.length * (1 + header.spread * (random.next() * 2 - 1)));
    this.trim = Float64Array.from(firing, () => 1 + spec.combustion.trim * random.gauss() * 0.6);
    // Per-cylinder state.
    this.memory = new Float64Array(this.count);
    this.exhaustAmp = new Float64Array(this.count);
    this.exhaustJitter = new Float64Array(this.count);
    this.exhaustAttack = new Float64Array(this.count).fill(spec.pulse.attack);
    this.displacementAmp = new Float64Array(this.count);
    this.gritAmp = new Float64Array(this.count);
    this.intakeAmp = new Float64Array(this.count);
    // Turbulence is coloured: its energy sits under ~1.4 kHz with the harmonics.
    this.noiseLow = new Float64Array(this.count);
    this.noiseColour = onePoleHz(rate, 1400);
    this.bankTrim = [1 + spec.combustion.bankSpread, 1 - spec.combustion.bankSpread];
    this.lastExhaust = new Float64Array(this.count).fill(719);
    this.lastIntake = new Float64Array(this.count).fill(719);
    this.lastFiring = new Float64Array(this.count).fill(719);
    this.primaries = Array.from(firing, () => new Pipe(rate, 0.02));
    this.mains = [new Pipe(rate, 0.03), new Pipe(rate, 0.03)];
    this.chambers = [new Pipe(rate, 0.01), new Pipe(rate, 0.01)];
    this.tails = [new Pipe(rate, 0.01), new Pipe(rate, 0.01)];
    this.runner = new Pipe(rate, 0.01);
    this.mufflerLow = [new Biquad(), new Biquad()];
    this.openLow = [new Biquad(), new Biquad()];
    this.resonator = [new Biquad(), new Biquad()];
    this.turbine = [0, 0];
    this.radiation = [0, 0];
    this.cabinLow = [new Biquad(), new Biquad()];
    this.body = [new Biquad(), new Biquad()];
    this.cabinMode = [new Biquad(), new Biquad()];
    this.plenum = new Biquad().design("bandpass", rate, spec.intake.plenumHz, spec.intake.plenumQ);
    this.roar = new Biquad().design("bandpass", rate, spec.intake.roarHz, spec.intake.roarQ);
    this.hiss = new Biquad().design("highpass", rate, 2600, 0.7);
    this.modes = spec.mechanical.modes.map(([hz, q]) => new Biquad().design("bandpass", rate, hz, q));
    this.modeGain = spec.mechanical.modes.map(([, , gain]) => gain);
    this.injectorMode = new Biquad().design("bandpass", rate, 6400, 9);
    this.whistle = new Biquad(); this.whoosh = new Biquad(); this.release = new Biquad();
    this.dc = [0, 0, 0, 0];
    // Global state.
    this.theta = random.next() * 720;
    this.rpm = spec.idleRpm; this.throttle = 0; this.throttleFast = 0; this.peakThrottle = 0;
    this.overrun = 0; this.valve = 0; this.cut = false; this.temperature = 620;
    this.drift = 0; this.wander = 0; this.wanderTarget = 0;
    this.spool = 0; this.releaseEnvelope = 0; this.releasePhase = 0; this.surge = 0;
    this.whinePhase = 0; this.whistlePhase = 0; this.whistleDrift = 0;
    this.pops = new Float64Array(16); // [age, amp, bank, decay] × 4
    // Afterfire comes in clusters: a hard run recharges it, each pop spends it.
    this.popReady = 0;
    this.popCount = 0;
    this.crackArmed = false; this.lastCrack = -1;
    this.excite = 0; this.injector = 0;
    this.frame = 0; this.retune = 0; this.fade = 0; this.cycles = 0;
    this.limiterHold = false; this.limiterClock = 0; this.limiterPeriod = 0.07;
    this.output = [0, 0];
    // Start mid-cycle without a burst of spurious events on the first sample.
    for (let i = 0; i < this.count; i++) {
      const fired = (this.theta - this.angles[i] + 720) % 720;
      this.lastFiring[i] = fired;
      this.lastExhaust[i] = (fired - EXHAUST_OPENS + 720) % 720;
      this.lastIntake[i] = (fired - INTAKE_OPENS + 720) % 720;
    }
    this.tune();
  }

  /** Slow-rate retuning of pipe delays and muffler filters (gas temperature, valve). */
  tune() {
    const { rate, spec } = this;
    const hot = soundSpeed(this.temperature), cooler = soundSpeed(this.temperature * 0.72 + 80);
    const header = spec.header;
    for (let i = 0; i < this.count; i++) {
      const loop = header.collector * 0.88; // collector reflection × mostly closed valve
      this.primaries[i].tune(rate, this.headerLengths[i] / hot, loop, header.lossHz);
    }
    const main = spec.main, muffler = spec.muffler, tail = spec.tail;
    for (let bank = 0; bank < 2; bank++) {
      const skew = bank ? 1 + spec.bankSkew : 1;
      this.mains[bank].tune(rate, main.length * skew / cooler, main.loop, main.lossHz);
      this.chambers[bank].tune(rate, muffler.chamber * skew / cooler, muffler.rho * muffler.rho, 5200);
      this.tails[bank].tune(rate, (tail.lengths[bank] ?? tail.lengths[0]) / soundSpeed(this.temperature * 0.55 + 140), tail.loop, tail.lossHz);
      const lowHz = muffler.lowpassHz * (0.85 + 0.3 * this.throttle);
      this.mufflerLow[bank].design("lowpass", rate, lowHz, 0.6);
      this.openLow[bank].design("lowpass", rate, muffler.openHz, 0.55);
      if (muffler.resonatorHz > 0) this.resonator[bank].design("notch", rate, muffler.resonatorHz * (cooler / 420), muffler.resonatorQ);
      const cabin = clamp(spec.cabin, 0, 1), cabinHz = 9000 * Math.pow(1400 / 9000, cabin);
      this.cabinLow[bank].design("lowpass", rate, cabinHz, 0.6);
      this.body[bank].design("peaking", rate, spec.bodyHz, 1.1, spec.bodyDb);
      this.cabinMode[bank].design("peaking", rate, spec.bodyHz * 2.15, 1.6, spec.bodyDb * 0.8);
    }
    this.runner.tune(rate, spec.intake.runner / 345, -0.5, 3000);
  }

  /** Called once per exhaust event of cylinder i: draws its combustion for this cycle. */
  combust(i, rpm) {
    const { spec, random } = this, c = spec.combustion, overrun = spec.overrun;
    this.cycles++;
    const throttle = this.throttle, idleness = (1 - smoothstep((rpm - spec.idleRpm) / (spec.idleRpm * 0.9))) * (1 - throttle);
    this.memory[i] = c.memory * this.memory[i] + Math.sqrt(1 - c.memory * c.memory) * random.gauss();
    const cov = c.cov + (c.idleCov - c.cov) * idleness;
    let strength;
    if (this.cut) strength = 0.04;
    else if (this.overrun > 0.05) {
      // Fuel cut on overrun; a sporting map lets a few cycles burn late.
      const burn = random.next() < overrun.burble * this.overrun * 0.7;
      // Pumping keeps a hollow pulse; a sporting map keeps the pipes burbling.
      strength = burn ? 0.35 + 0.45 * random.next() : overrun.body + 0.22 * (1 - this.overrun) * (c.idleStrength + 0.6 * throttle);
      if (burn && this.events && random.next() < 0.35 * this.popReady) this.firePop(this.banks[i], 0.25 + 0.45 * random.next(), 0.5);
    } else strength = c.idleStrength + (1 - c.idleStrength) * Math.pow(throttle, 0.8);
    let amp = strength * this.trim[i] * (1 + cov * (this.memory[i] + 0.6 * this.drift));
    if (c.misfire > 0 && random.next() < c.misfire * idleness) amp *= 0.12;
    this.exhaustAmp[i] = Math.max(0, amp);
    this.exhaustJitter[i] = c.jitterDeg * (0.4 + idleness) * random.gauss();
    // A stronger, faster burn also opens with a sharper edge.
    this.exhaustAttack[i] = spec.pulse.attack * clamp(1 - 0.22 * this.memory[i] - 0.25 * (throttle - 0.5), 0.55, 1.5);
    const speed = clamp(rpm / spec.redlineRpm, 0.05, 1.2);
    this.displacementAmp[i] = spec.pulse.displacement * (0.55 + 0.45 * Math.sqrt(speed));
    this.gritAmp[i] = spec.pulse.grit * (0.6 + 0.4 * throttle) * (1 + 0.5 * random.gauss() * cov);
    // Afterfire: unburnt mixture lighting off in the hot pipe.
    if (this.overrun > 0.2 && this.events && random.next() < overrun.crackle * 0.07 * this.overrun * speed * this.popReady) {
      this.firePop(this.banks[i], overrun.pop * (0.3 + 0.7 * random.next()), random.next());
    }
    if (this.cut && this.events && random.next() < overrun.crackle * 0.1 * this.popReady) this.firePop(this.banks[i], overrun.pop * 0.8, 0.8);
  }

  /** Muted or hidden: drop transient one-shots so nothing outlives the audio owner. */
  quiet() {
    this.spool = 0; this.releaseEnvelope = 0; this.popReady = 0; this.crackArmed = true;
    for (let p = 1; p < 16; p += 4) this.pops[p] = 0;
  }

  firePop(bank, amp, brightness) { this.popReady *= 0.7; this.pop(bank, amp, brightness); }

  pop(bank, amp, brightness) {
    const slot = (this.popCount++ % 4) * 4;
    this.pops[slot] = 0; this.pops[slot + 1] = amp; this.pops[slot + 2] = this.dualBank ? bank : (this.random.next() < 0.5 ? 0 : 1);
    this.pops[slot + 3] = 0.0012 + 0.0035 * (1 - brightness);
  }

  /** Renders `frames` samples into left/right. Param arrays may have length 1. */
  process(left, right, frames, rpmIn, loadIn, boostIn, active, events) {
    const { rate, spec, random } = this;
    const count = this.count, angles = this.angles, banks = this.banks;
    const pulse = spec.pulse, intake = spec.intake, mech = spec.mechanical, forced = spec.forced;
    const kRpm = coefficient(rate, 0.008), kThrottle = coefficient(rate, 0.02), kFast = coefficient(rate, 0.004);
    const kOverUp = coefficient(rate, 0.09), kOverDown = coefficient(rate, 0.35), kValve = coefficient(rate, 0.18), kValveClose = coefficient(rate, 3);
    const kFade = 1 / (rate * 0.01), dcPole = Math.exp(-TAU * 18 / rate);
    const mufflerQuiet = spec.muffler.quiet;
    this.events = events > 0.5 ? 1 : 0;
    for (let n = 0; n < frames; n++) {
      // --- Controls -------------------------------------------------------
      const rpmTarget = clamp(finite(rpmIn.length > 1 ? rpmIn[n] : rpmIn[0], spec.idleRpm), 0, 12000);
      const load = clamp(finite(loadIn.length > 1 ? loadIn[n] : loadIn[0], 0), 0, 1);
      const boost = clamp(finite(boostIn.length > 1 ? boostIn[n] : boostIn[0], 0), 0, 1);
      this.rpm += kRpm * (rpmTarget - this.rpm);
      const throttleTarget = clamp((load - 0.07) / 0.93, 0, 1);
      this.throttle += kThrottle * (throttleTarget - this.throttle);
      this.throttleFast += kFast * (throttleTarget - this.throttleFast);
      this.peakThrottle = Math.max(this.throttleFast, this.peakThrottle - 1 / (rate * 0.25));
      const rpm = this.rpm * (1 + this.wander);
      // Overrun depth in absolute rpm above idle: road lifts at 3,000–4,000 rpm
      // are full overrun for a 6,500 or a 9,000 rpm engine alike.
      const overrunTarget = this.throttleFast < 0.06 && rpm > spec.idleRpm * 1.6
        ? smoothstep((rpm - spec.idleRpm * 1.6) / 1800) : 0;
      this.overrun += (overrunTarget > this.overrun ? kOverUp : kOverDown) * (overrunTarget - this.overrun);
      // Rev limiter: the ECU cuts and restores ignition in bursts while the
      // engine sits on the limit, whatever the runtime does with the rpm.
      if (rpm >= spec.limiterRpm * 0.99) this.limiterHold = true; else if (rpm < spec.limiterRpm * 0.965) this.limiterHold = false;
      if (this.limiterHold) { this.limiterClock += 1 / rate; if (this.limiterClock > this.limiterPeriod) { this.limiterClock = 0; this.limiterPeriod = 0.055 + 0.04 * random.next(); } }
      else this.limiterClock = 0;
      this.cut = this.limiterHold && this.limiterClock < this.limiterPeriod * 0.5;
      // Sport exhaust valve: opens quickly under load, stays open on overrun
      // above its rpm (lifts keep their voice), closes slowly.
      const valveTarget = clamp((rpm - spec.muffler.valveRpm * 0.8) / (spec.muffler.valveRpm * 0.4), 0, 1)
        * Math.max(clamp((this.throttle - spec.muffler.valveLoad * 0.6) / (spec.muffler.valveLoad * 0.8), 0, 1), 0.8 * this.overrun);
      this.valve += (valveTarget > this.valve ? kValve : kValveClose) * (valveTarget - this.valve);
      // Shift crack: a full-throttle upshift cuts ignition for an instant.
      if (this.peakThrottle > 0.6 && this.throttleFast < 0.15 && rpm > spec.redlineRpm * 0.5 && !this.crackArmed) {
        this.crackArmed = true;
        if (this.events && random.next() < spec.shiftCrack) { this.pop(0, spec.overrun.pop * 1.3, 0.85); this.pop(1, spec.overrun.pop * 1.1, 0.8); }
      }
      if (this.throttleFast > 0.4) this.crackArmed = false;
      if (this.throttle > 0.55 && rpm > spec.redlineRpm * 0.4) this.popReady = Math.min(1, this.popReady + 1 / (rate * 1.5));

      // --- Slow state (every 64 samples) ---------------------------------
      if ((this.retune++ & 63) === 0) {
        const workTarget = 560 + 520 * Math.pow(this.throttle, 0.7) * (0.45 + 0.55 * clamp(rpm / spec.redlineRpm, 0, 1));
        this.temperature += (workTarget - this.temperature) * (1 - Math.exp(-64 / (rate * (workTarget > this.temperature ? 3.5 : 9))));
        this.drift += (random.gauss() * 0.7 - this.drift) * (1 - Math.exp(-64 / (rate * 0.4)));
        const idle = (1 - smoothstep((rpm - spec.idleRpm) / spec.idleRpm)) * (1 - this.throttle);
        if (random.next() < 64 / (rate * 0.7)) this.wanderTarget = random.gauss() * spec.combustion.wander * idle;
        this.wander += (this.wanderTarget - this.wander) * (1 - Math.exp(-64 / (rate * 0.35)));
        this.tune();
        if (forced) {
          const spoolTarget = forced.type === "super" ? this.throttle * clamp(rpm / spec.redlineRpm, 0, 1) : boost;
          const tau = spoolTarget > this.spool ? (forced.spool ?? 0.8) : (this.throttleFast < 0.15 ? 0.12 : 0.45);
          const before = this.spool;
          this.spool += (spoolTarget - this.spool) * (1 - Math.exp(-64 / (rate * tau)));
          if (forced.type === "turbo" && before > 0.45 && this.throttleFast < 0.12 && this.releaseEnvelope < 0.05 && this.events) {
            this.releaseEnvelope = before; this.releasePhase = 0;
            this.release.design("bandpass", rate, forced.blowOff ? 2600 : 1100, forced.blowOff ? 0.65 : 1.4);
          }
          this.whistle.design("bandpass", rate, (forced.whistleHz ?? 1600) + (forced.whistleSpan ?? 4200) * this.spool, 22);
          this.whoosh.design("bandpass", rate, 700 + 1600 * this.spool, 1.1);
        }
      }

      // --- Crank and cylinder events -------------------------------------
      const step = rpm * 6 / rate;
      this.theta += step; if (this.theta >= 720) this.theta -= 720;
      const blowSpan = pulse.degrees * (1 + pulse.widen * clamp(rpm / spec.redlineRpm, 0, 1.2));
      let bank0 = 0, bank1 = 0, suction = 0, excite = 0;
      for (let i = 0; i < count; i++) {
        let fired = this.theta - angles[i]; if (fired < 0) fired += 720;
        if (fired < this.lastFiring[i]) excite += mech.combustion * (0.25 + 0.75 * this.exhaustAmp[i]) * (this.cut ? 0.1 : 1);
        this.lastFiring[i] = fired;
        let a = fired - EXHAUST_OPENS; if (a < 0) a += 720;
        if (a < this.lastExhaust[i]) this.combust(i, rpm);
        if (this.lastExhaust[i] < EXHAUST_SPAN && a >= EXHAUST_SPAN) excite += mech.valves * 0.5; // valve seats
        this.lastExhaust[i] = a;
        let flow = 0;
        if (a < EXHAUST_SPAN) {
          const t = (a - this.exhaustJitter[i]) / blowSpan;
          const blow = t > 0 && t < 1 ? blowdownShape(t, this.exhaustAttack[i]) * this.exhaustAmp[i] : 0;
          const s = Math.sin(Math.PI * a / EXHAUST_SPAN);
          const displacement = s * s * this.displacementAmp[i];
          this.noiseLow[i] += this.noiseColour * (random.white() - this.noiseLow[i]);
          const turbulence = this.noiseLow[i] * 2.6 + random.white() * 0.35;
          flow = (blow + displacement + turbulence * (blow * this.gritAmp[i] + displacement * pulse.flowGrit)) * this.bankTrim[banks[i]];
        }
        // An open exhaust valve absorbs the returning wave; a closed one reflects it.
        this.primaries[i].loop = spec.header.collector * (a < EXHAUST_SPAN ? 0.15 : 0.9);
        const out = this.primaries[i].step(flow);
        if (banks[i]) bank1 += out; else bank0 += out;
        let b = fired - INTAKE_OPENS; if (b < 0) b += 720;
        if (b < this.lastIntake[i]) {
          this.intakeAmp[i] = (0.2 + 0.8 * this.throttle) * (0.4 + 0.6 * clamp(rpm / spec.redlineRpm, 0, 1));
          excite += mech.valves * 0.35;
          if (mech.injector) this.injector += mech.injector * (1 - smoothstep((rpm - spec.idleRpm) / (spec.idleRpm * 2.5)));
        }
        this.lastIntake[i] = b;
        if (b < INTAKE_SPAN) { const s = Math.sin(Math.PI * b / INTAKE_SPAN); suction += s * s * this.intakeAmp[i]; }
      }
      bank0 /= Math.sqrt(this.perBank[0]); bank1 /= Math.sqrt(this.perBank[1]);
      if (!this.dualBank) bank1 = bank0;

      // --- Exhaust system ------------------------------------------------
      const merge = this.dualBank ? spec.bankMerge * 0.5 : 0;
      // Broadband turbulence of the mean gas flow through the collector.
      const flowNoise = pulse.turbulence * Math.sqrt(clamp(rpm / spec.redlineRpm, 0, 1.2)) * (0.25 + 0.75 * this.throttle);
      let c0 = bank0 * (1 - merge) + bank1 * merge + random.white() * flowNoise;
      let c1 = bank1 * (1 - merge) + bank0 * merge + random.white() * flowNoise;
      if (forced?.type === "turbo") {
        const k = forced.turbineDamp ?? 0.5;
        this.turbine[0] += 0.12 * (c0 - this.turbine[0]); this.turbine[1] += 0.12 * (c1 - this.turbine[1]);
        c0 += k * (this.turbine[0] - c0); c1 += k * (this.turbine[1] - c1);
      }
      // Pops ignite in the main pipe ahead of the muffler.
      let pop0 = 0, pop1 = 0, crack = 0;
      for (let p = 0; p < 16; p += 4) {
        const amp = this.pops[p + 1]; if (amp <= 1e-4) continue;
        const age = this.pops[p]; this.pops[p] = age + 1 / rate;
        const env = Math.exp(-age / this.pops[p + 3]), thump = Math.exp(-age / 0.007);
        const value = amp * (env * random.white() * 1.4 + thump * 0.9);
        if (this.pops[p + 2]) pop1 += value; else pop0 += value;
        crack += amp * env * random.white();
        if (env < 1e-3 && thump < 1e-3) this.pops[p + 1] = 0;
      }
      const muffler = spec.muffler, valve = this.valve;
      for (let bank = 0; bank < 2; bank++) {
        const into = (bank ? c1 : c0) + (bank ? pop1 : pop0);
        const main = this.mains[bank].step(into);
        let quiet = this.chambers[bank].step(main);
        if (muffler.resonatorHz > 0) quiet = this.resonator[bank].step(quiet);
        quiet = this.mufflerLow[bank].step(quiet);
        const open = this.openLow[bank].step(main);
        const through = quiet * (mufflerQuiet + (1 - mufflerQuiet) * 0.4 * valve) * 1.6 + open * valve * 0.85 + crack * 0.18;
        const tail = this.tails[bank].step(through);
        // Near field keeps the pulse body; far field radiates its derivative.
        const radiated = spec.near * tail + spec.far * (tail - this.radiation[bank]);
        this.radiation[bank] = tail;
        this.output[bank] = this.cabinMode[bank].step(this.body[bank].step(this.cabinLow[bank].step(radiated)));
      }

      // --- Intake --------------------------------------------------------
      const throttle = this.throttle, speed = clamp(rpm / spec.redlineRpm, 0, 1.2);
      const runner = this.runner.step(suction);
      const plenum = this.plenum.step(runner);
      const roar = this.roar.step(random.white() * suction * (0.3 + throttle)) * intake.roar;
      const hiss = this.hiss.step(random.white()) * intake.hiss * (1 - throttle) * speed * (0.4 + this.overrun);
      const induction = (plenum * 0.55 + runner * 0.2 + roar * 3.2 + hiss) * intake.level * (0.35 + 0.65 * throttle);

      // --- Mechanical ----------------------------------------------------
      let mechanical = 0;
      const kick = excite > 0 ? excite * (0.5 + 0.5 * random.next()) * (0.4 + 0.6 * Math.sqrt(speed)) : 0;
      for (let m = 0; m < this.modes.length; m++) mechanical += this.modes[m].step(kick) * this.modeGain[m];
      if (mech.whineOrder > 0 && mech.whine > 0) {
        this.whinePhase += mech.whineOrder * rpm / 60 / rate; this.whinePhase -= Math.floor(this.whinePhase);
        mechanical += Math.sin(TAU * this.whinePhase) * mech.whine * (0.3 + 0.7 * speed) * (1 + 0.3 * this.drift);
      }
      if (this.injector > 1e-5) { mechanical += this.injectorMode.step(this.injector) * 0.8; this.injector = 0; }
      else mechanical += this.injectorMode.step(0) * 0.8;
      mechanical *= mech.level;

      // --- Forced induction ----------------------------------------------
      let forcedOut = 0;
      if (forced) {
        const spool = this.spool;
        if (forced.type === "super") {
          this.whistlePhase += (forced.order ?? 9) * rpm / 60 / rate; this.whistlePhase -= Math.floor(this.whistlePhase);
          forcedOut += (Math.sin(TAU * this.whistlePhase) + 0.35 * Math.sin(2 * TAU * this.whistlePhase)) * spool * (forced.whine ?? 0.06) * (0.3 + 0.7 * throttle);
        } else {
          this.whistleDrift += 0.002 * (random.gauss() - this.whistleDrift);
          forcedOut += this.whistle.step(random.white()) * Math.pow(spool, 1.5) * (forced.whistle ?? 0.5) * (0.35 + 0.65 * throttle) * (1 + 0.4 * this.whistleDrift);
          forcedOut += this.whoosh.step(random.white()) * spool * (forced.whoosh ?? 0.12) * (0.2 + 0.8 * throttle);
          if (this.releaseEnvelope > 1e-4) {
            this.releasePhase += 1 / rate;
            const attack = 1 - Math.exp(-this.releasePhase / 0.006);
            let env = this.releaseEnvelope * attack * Math.exp(-this.releasePhase / (forced.blowOff ? 0.24 : 0.32));
            if (!forced.blowOff) env *= 0.5 + 0.5 * Math.sin(TAU * (13 - 5 * Math.min(1, this.releasePhase * 2)) * this.releasePhase);
            forcedOut += this.release.step(random.white()) * env * (forced.release ?? 0.5);
            if (env < 1e-4 && this.releasePhase > 0.05) this.releaseEnvelope = 0;
          }
        }
      }

      // --- Mix, perspective, saturation ----------------------------------
      const spread = spec.width;
      const ex0 = this.output[0], ex1 = this.output[1];
      const centre = induction + mechanical + forcedOut;
      let l = (ex0 * (1 + spread) + ex1 * (1 - spread)) * 0.5 + centre;
      let r = (ex1 * (1 + spread) + ex0 * (1 - spread)) * 0.5 + centre;
      // Valve-shut exhaust is quieter overall (the muffler is doing its job).
      // Idle is lifted toward the cabin's working level: a Tesla cabin would
      // otherwise swallow it, and real idle is felt as much as heard.
      const idleness = (1 - smoothstep((rpm - spec.idleRpm) / spec.idleRpm)) * (1 - throttle);
      // Light load is lifted a little too, so town and lifts keep a voice.
      const light = 1 - throttle;
      const level = spec.gain * (0.72 + 0.28 * valve) * (1 + (spec.idleLift - 1) * idleness) * (1 + spec.lightLift * light * light);
      l *= level; r *= level;
      this.dc[0] = l - this.dc[1] + dcPole * this.dc[0]; this.dc[1] = l;
      this.dc[2] = r - this.dc[3] + dcPole * this.dc[2]; this.dc[3] = r;
      const drive = spec.drive;
      const sl = saturate(this.dc[0] * drive) / drive, sr = saturate(this.dc[2] * drive) / drive;
      this.fade = clamp(this.fade + (active > 0.5 ? kFade : -kFade), 0, 1);
      left[n] = sl * this.fade;
      right[n] = sr * this.fade;
      this.frame++;
    }
  }
}

/** Rational tanh: soft saturation without a hard edge. */
function saturate(x) {
  if (x > 3) return 1;
  if (x < -3) return -1;
  const x2 = x * x;
  return x * (27 + x2) / (27 + 9 * x2);
}

export const COMBUSTION_DEFAULTS = DEFAULTS;
