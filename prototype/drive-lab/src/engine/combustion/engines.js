// Original engine definitions for the combustion synthesizer (./dsp.js).
//
// Firing orders, crank angles and bank layouts are public engineering facts of
// each engine architecture. Pipe lengths, resonances and every tuning value are
// Sedicivalvole's own, chosen by ear-informed measurement against recordings
// used only for analysis. These are architectures, not replicas of a car.

/** Evenly spaced firing events: order lists cylinders, bankOf maps cylinder → 0/1. */
function even(order, bankOf) {
  const interval = 720 / order.length;
  return order.map((cylinder, index) => [index * interval, cylinder, bankOf(cylinder)]);
}

export const COMBUSTION_ENGINES = Object.freeze({
  // Cross-plane V8, 1-8-7-2-6-5-4-3. Each bank fires unevenly
  // (90-180-270-180°), the source of the off-beat burble.
  "v8-crossplane": {
    label: "V8 Cross-plane", description: "6.2 L pushrod V8, dual exhaust",
    firing: even([1, 8, 7, 2, 6, 5, 4, 3], c => (c % 2 ? 0 : 1)),
    idleRpm: 720, redlineRpm: 6500, limiterRpm: 6650,
    header: { length: 0.86, spread: 0.162, collector: -0.36, lossHz: 3600 },
    bankMerge: 0.12,
    main: { length: 2.1, loop: 0.3, lossHz: 2100 },
    muffler: { chamber: 0.42, rho: 0.55, lowpassHz: 978, openHz: 2232, resonatorHz: 0, valveRpm: 2900, valveLoad: 0.4, quiet: 0.5 },
    tail: { lengths: [0.58, 0.61], loop: -0.42, lossHz: 2600 },
    pulse: { degrees: 50, widen: 0.5, attack: 0.091, displacement: 0.26, grit: 0.6, flowGrit: 0.21 },
    combustion: { cov: 0.06, idleCov: 0.182, memory: 0.55, trim: 0.189, misfire: 0.03, jitterDeg: 2.56, idleStrength: 0.36, wander: 0.016 },
    intake: { level: 0.2, plenumHz: 68, plenumQ: 2, roarHz: 640, roarQ: 0.8, roar: 0.3, hiss: 0.03, runner: 0.3 },
    mechanical: { level: 0.1, modes: [[690, 12, 0.5], [1320, 16, 0.4], [2250, 22, 0.3], [3800, 26, 0.18]], combustion: 0.7, valves: 0.3, whineOrder: 0, whine: 0, injector: 0 },
    overrun: { crackle: 0.45, pop: 0.55, burble: 0.32, bang: 0.35 },
    shiftCrack: 0.25, cabin: 0.32, bodyHz: 46, bodyDb: 3.5, width: 0.6, drive: 1.8, gain: 0.551,
  },
  // Flat-plane V8, 1-5-3-7-4-8-2-6: banks alternate every 90°, each bank an
  // even 180° four. Short equal headers, high revs: a hard wail.
  "v8-flatplane": {
    label: "V8 Flat-plane", description: "4.5 L, 9,000 rpm, equal headers",
    firing: even([1, 5, 3, 7, 4, 8, 2, 6], c => (c <= 4 ? 0 : 1)),
    idleRpm: 1000, redlineRpm: 9000, limiterRpm: 9200,
    header: { length: 0.58, spread: 0.054, collector: -0.34, lossHz: 5200 },
    bankMerge: 0.2,
    main: { length: 1.96, loop: 0.24, lossHz: 3200 },
    muffler: { chamber: 0.34, rho: 0.45, lowpassHz: 1530, openHz: 3844, resonatorHz: 0, valveRpm: 3000, valveLoad: 0.45, quiet: 0.5 },
    tail: { lengths: [0.42, 0.44], loop: -0.36, lossHz: 4200 },
    pulse: { degrees: 39, widen: 0.55, attack: 0.063, displacement: 0.2, grit: 0.3, flowGrit: 0.18 },
    combustion: { cov: 0.045, idleCov: 0.112, memory: 0.45, trim: 0.173, misfire: 0, jitterDeg: 1.6, idleStrength: 0.32, wander: 0.01, bankSpread: 0.13 },
    intake: { level: 0.3, plenumHz: 110, plenumQ: 2.4, roarHz: 1150, roarQ: 0.9, roar: 0.45, hiss: 0.05, runner: 0.22 },
    mechanical: { level: 0.12, modes: [[960, 14, 0.45], [1750, 18, 0.4], [2900, 24, 0.3], [4700, 30, 0.2]], combustion: 0.55, valves: 0.4, whineOrder: 0, whine: 0, injector: 0.4 },
    overrun: { crackle: 0.42, pop: 0.5, burble: 0.22, body: 0.4, bang: 0.15 },
    bankSkew: 0.09,
    shiftCrack: 0.5, cabin: 0.25, bodyHz: 58, bodyDb: 2.5, width: 0.5, drive: 1.7, gain: 0.601,
  },
  // Flat-six, 1-6-2-4-3-5, 120°. Cylinders 1-3 one bank, 4-6 the other.
  // Intake and valvetrain are a large part of its voice.
  "flat-six": {
    label: "Flat-Six", description: "4.0 L boxer six, 9,000 rpm",
    firing: even([1, 6, 2, 4, 3, 5], c => (c <= 3 ? 0 : 1)),
    idleRpm: 880, redlineRpm: 9000, limiterRpm: 9150,
    header: { length: 0.64, spread: 0.072, collector: -0.33, lossHz: 4800 },
    bankMerge: 0.35,
    main: { length: 1.55, loop: 0.25, lossHz: 3000 },
    muffler: { chamber: 0.36, rho: 0.48, lowpassHz: 1445, openHz: 3596, resonatorHz: 0, valveRpm: 2900, valveLoad: 0.45, quiet: 0.5 },
    tail: { lengths: [0.38, 0.39], loop: -0.38, lossHz: 4000 },
    pulse: { degrees: 41, widen: 0.55, attack: 0.07, displacement: 0.2, grit: 0.45, flowGrit: 0.195 },
    combustion: { cov: 0.045, idleCov: 0.126, memory: 0.5, trim: 0.135, misfire: 0, jitterDeg: 1.76, idleStrength: 0.33, wander: 0.012 },
    intake: { level: 0.38, plenumHz: 120, plenumQ: 2.6, roarHz: 1350, roarQ: 1, roar: 0.55, hiss: 0.06, runner: 0.2 },
    mechanical: { level: 0.15, modes: [[1100, 14, 0.4], [1900, 18, 0.45], [3200, 24, 0.35], [5200, 30, 0.22]], combustion: 0.5, valves: 0.55, whineOrder: 0, whine: 0, injector: 0.5 },
    overrun: { crackle: 0.32, pop: 0.42, burble: 0.18, body: 0.4 },
    shiftCrack: 0.4, cabin: 0.28, bodyHz: 62, bodyDb: 2, width: 0.45, drive: 1.6, gain: 0.551,
  },
  // V10, 1-6-5-10-2-7-3-8-4-9, even 72° firing. Bank 0 = 1-5.
  "v10": {
    label: "V10", description: "5.2 L, 8,700 rpm, even-firing",
    firing: even([1, 6, 5, 10, 2, 7, 3, 8, 4, 9], c => (c <= 5 ? 0 : 1)),
    idleRpm: 950, redlineRpm: 8700, limiterRpm: 8850,
    header: { length: 0.56, spread: 0.072, collector: -0.34, lossHz: 5000 },
    bankMerge: 0.2,
    main: { length: 1.6, loop: 0.24, lossHz: 3100 },
    muffler: { chamber: 0.36, rho: 0.46, lowpassHz: 1445, openHz: 3472, resonatorHz: 0, valveRpm: 2900, valveLoad: 0.45, quiet: 0.5 },
    tail: { lengths: [0.45, 0.47], loop: -0.37, lossHz: 4000 },
    pulse: { degrees: 39, widen: 0.55, attack: 0.063, displacement: 0.2, grit: 0.3, flowGrit: 0.18 },
    combustion: { cov: 0.045, idleCov: 0.112, memory: 0.45, trim: 0.121, misfire: 0, jitterDeg: 1.6, idleStrength: 0.32, wander: 0.01, bankSpread: 0.13 },
    intake: { level: 0.32, plenumHz: 105, plenumQ: 2.4, roarHz: 1250, roarQ: 0.9, roar: 0.45, hiss: 0.05, runner: 0.22 },
    mechanical: { level: 0.12, modes: [[1000, 14, 0.45], [1800, 18, 0.4], [3000, 24, 0.3], [4900, 30, 0.2]], combustion: 0.55, valves: 0.4, whineOrder: 0, whine: 0, injector: 0.35 },
    overrun: { crackle: 0.42, pop: 0.5, burble: 0.22, body: 0.42 },
    bankSkew: 0.09,
    shiftCrack: 0.45, cabin: 0.26, bodyHz: 56, bodyDb: 2.5, width: 0.5, drive: 1.7, gain: 0.735,
  },
  // 60° V12, 1-7-5-11-3-9-6-12-2-8-4-10: a firing every 60°, smooth and dense.
  "v12": {
    label: "V12", description: "6.5 L, 8,500 rpm, 60° vee",
    firing: even([1, 7, 5, 11, 3, 9, 6, 12, 2, 8, 4, 10], c => (c <= 6 ? 0 : 1)),
    idleRpm: 900, redlineRpm: 8500, limiterRpm: 8650,
    header: { length: 0.5, spread: 0.063, collector: -0.32, lossHz: 5200 },
    bankMerge: 0.2,
    main: { length: 2.16, loop: 0.22, lossHz: 3300 },
    muffler: { chamber: 0.34, rho: 0.45, lowpassHz: 1615, openHz: 3968, resonatorHz: 0, valveRpm: 2800, valveLoad: 0.45, quiet: 0.5 },
    tail: { lengths: [0.44, 0.45], loop: -0.35, lossHz: 4400 },
    pulse: { degrees: 37, widen: 0.5, attack: 0.07, displacement: 0.18, grit: 0.32, flowGrit: 0.15 },
    combustion: { cov: 0.038, idleCov: 0.098, memory: 0.45, trim: 0.152, misfire: 0, jitterDeg: 1.44, idleStrength: 0.32, wander: 0.008, bankSpread: 0.13 },
    intake: { level: 0.32, plenumHz: 115, plenumQ: 2.4, roarHz: 1450, roarQ: 1, roar: 0.45, hiss: 0.05, runner: 0.22 },
    mechanical: { level: 0.12, modes: [[1050, 14, 0.4], [1950, 18, 0.4], [3300, 24, 0.3], [5300, 30, 0.2]], combustion: 0.45, valves: 0.4, whineOrder: 0, whine: 0, injector: 0.3 },
    overrun: { crackle: 0.3, pop: 0.42, burble: 0.16, body: 0.45 },
    bankSkew: 0.09,
    shiftCrack: 0.35, cabin: 0.26, bodyHz: 58, bodyDb: 2.5, width: 0.5, drive: 1.6, gain: 0.802,
  },
  // Inline five, 1-2-4-5-3, a firing every 144°: the off-beat warble.
  // Turbocharged with a blow-off valve, single manifold, split tailpipes.
  "five-turbo": {
    label: "Five Turbo", description: "2.5 L inline-five turbo",
    firing: even([1, 2, 4, 5, 3], () => 0),
    idleRpm: 820, redlineRpm: 7000, limiterRpm: 7150,
    header: { length: 0.42, spread: 0.216, collector: -0.3, lossHz: 4200 },
    main: { length: 2.3, loop: 0.27, lossHz: 2500 },
    muffler: { chamber: 0.4, rho: 0.5, lowpassHz: 2000, openHz: 2976, resonatorHz: 0, valveRpm: 3200, valveLoad: 0.45, quiet: 0.55 },
    tail: { lengths: [0.52, 0.57], loop: -0.4, lossHz: 3400 },
    pulse: { degrees: 45, widen: 0.5, attack: 0.084, displacement: 0.22, grit: 0.675, flowGrit: 0.21 },
    combustion: { cov: 0.053, idleCov: 0.126, memory: 0.5, trim: 0.162, misfire: 0, jitterDeg: 1.92, idleStrength: 0.33, wander: 0.012 },
    intake: { level: 0.22, plenumHz: 95, plenumQ: 2.2, roarHz: 950, roarQ: 0.9, roar: 0.3, hiss: 0.05, runner: 0.3 },
    mechanical: { level: 0.12, modes: [[880, 14, 0.45], [1550, 18, 0.4], [2700, 22, 0.3], [4300, 28, 0.2]], combustion: 0.6, valves: 0.4, whineOrder: 0, whine: 0, injector: 0.5 },
    forced: { type: "turbo", spool: 0.85, turbineDamp: 0.28, whistleHz: 1500, whistleSpan: 3000, whistle: 0.45, whoosh: 0.14, blowOff: true, release: 0.3 },
    overrun: { crackle: 0.4, pop: 0.5, burble: 0.25, bang: 0.3 },
    shiftCrack: 0.4, cabin: 0.3, bodyHz: 54, bodyDb: 3, width: 0.4, drive: 1.7, gain: 0.296,
  },
  // Boxer four, 1-3-2-4, 180°, with unequal-length headers: pulses reach the
  // single collector unevenly, the source of the rumble. Turbo, no blow-off
  // valve, so lifting off surges the compressor (flutter).
  "boxer-rumble": {
    label: "Boxer Rumble", description: "2.5 L flat-four turbo, rumble",
    firing: [[0, 1, 0], [180, 3, 0], [360, 2, 0], [540, 4, 0]],
    idleRpm: 780, redlineRpm: 7000, limiterRpm: 7150,
    header: { lengths: [0.38, 0.97, 0.41, 0.93], collector: -0.32, lossHz: 3800 },
    main: { length: 2.2, loop: 0.29, lossHz: 2300 },
    muffler: { chamber: 0.42, rho: 0.55, lowpassHz: 1700, openHz: 2480, resonatorHz: 0, valveRpm: 3000, valveLoad: 0.4, quiet: 0.55 },
    tail: { lengths: [0.55, 0.6], loop: -0.42, lossHz: 3000 },
    pulse: { degrees: 51, widen: 0.5, attack: 0.091, displacement: 0.26, grit: 0.63, flowGrit: 0.225 },
    combustion: { cov: 0.068, idleCov: 0.168, memory: 0.55, trim: 0.216, misfire: 0.015, jitterDeg: 2.4, idleStrength: 0.36, wander: 0.015 },
    intake: { level: 0.2, plenumHz: 80, plenumQ: 2, roarHz: 800, roarQ: 0.8, roar: 0.28, hiss: 0.05, runner: 0.34 },
    mechanical: { level: 0.13, modes: [[780, 12, 0.5], [1400, 16, 0.4], [2400, 22, 0.3], [4000, 26, 0.2]], combustion: 0.65, valves: 0.45, whineOrder: 0, whine: 0, injector: 0.45 },
    forced: { type: "turbo", spool: 1.0, turbineDamp: 0.28, whistleHz: 1300, whistleSpan: 2900, whistle: 0.4, whoosh: 0.15, blowOff: false, release: 0.4 },
    overrun: { crackle: 0.35, pop: 0.45, burble: 0.3, bang: 0.3 },
    shiftCrack: 0.25, cabin: 0.32, bodyHz: 50, bodyDb: 3, width: 0.35, drive: 1.7, gain: 0.269,
  },
  // Inline six, 1-5-3-6-2-4, 120°, two 3-into-1 collectors (front 1-3, rear 4-6).
  // Naturally aspirated, silky, with a chain-driven twin-cam whine.
  "straight-six": {
    label: "Straight Six", description: "3.0 L inline-six, 8,000 rpm",
    firing: even([1, 5, 3, 6, 2, 4], c => (c <= 3 ? 0 : 1)),
    idleRpm: 760, redlineRpm: 8000, limiterRpm: 8150,
    header: { length: 0.66, spread: 0.072, collector: -0.33, lossHz: 4600 },
    bankMerge: 0.6,
    main: { length: 1.9, loop: 0.25, lossHz: 2800 },
    muffler: { chamber: 0.38, rho: 0.5, lowpassHz: 1360, openHz: 3224, resonatorHz: 0, valveRpm: 2800, valveLoad: 0.45, quiet: 0.52 },
    tail: { lengths: [0.5, 0.52], loop: -0.38, lossHz: 3800 },
    pulse: { degrees: 42, widen: 0.55, attack: 0.07, displacement: 0.2, grit: 0.36, flowGrit: 0.165 },
    combustion: { cov: 0.042, idleCov: 0.098, memory: 0.45, trim: 0.095, misfire: 0, jitterDeg: 1.6, idleStrength: 0.32, wander: 0.009 },
    intake: { level: 0.3, plenumHz: 100, plenumQ: 2.4, roarHz: 1200, roarQ: 0.9, roar: 0.42, hiss: 0.05, runner: 0.25 },
    mechanical: { level: 0.13, modes: [[950, 14, 0.4], [1700, 18, 0.4], [2900, 24, 0.3], [4700, 30, 0.2]], combustion: 0.5, valves: 0.45, whineOrder: 22, whine: 0.02, injector: 0.25 },
    overrun: { crackle: 0.3, pop: 0.42, burble: 0.16, body: 0.38 },
    shiftCrack: 0.35, cabin: 0.28, bodyHz: 56, bodyDb: 2.5, width: 0.45, drive: 1.6, gain: 0.542,
  },
});

export const COMBUSTION_ENGINE_IDS = Object.freeze(Object.keys(COMBUSTION_ENGINES));
export function combustionEngine(id) {
  const found = COMBUSTION_ENGINES[id];
  if (!found) throw new RangeError(`Unknown combustion engine: ${id}`);
  return found;
}
