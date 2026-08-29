export const NIGHTSHIFT_PARK_LEVEL = 0.021;
export const NIGHTSHIFT_PARK_HOLD_SECONDS = Object.freeze([12.7, 15.1, 10.9, 13.8, 16.4, 11.6]);
export const NIGHTSHIFT_PARK_VOICINGS = Object.freeze([
  { id: "Amin9/E", frequencies: [329.628, 391.995, 440, 493.883] },
  { id: "Cmaj7/G", frequencies: [391.995, 493.883, 523.251, 659.255] },
  { id: "Emin7/G", frequencies: [391.995, 493.883, 587.330, 659.255] },
  { id: "G6/D", frequencies: [293.665, 391.995, 493.883, 659.255] },
  { id: "Amin9/C", frequencies: [261.626, 329.628, 440, 493.883] },
  { id: "Cmaj9/E", frequencies: [329.628, 391.995, 493.883, 587.330] },
]);

function target(param, value, time, seconds) {
  if (typeof param.cancelAndHoldAtTime === "function") param.cancelAndHoldAtTime(time);
  else {
    param.cancelScheduledValues?.(time);
    param.setValueAtTime?.(param.value, time);
  }
  param.setTargetAtTime(value, time, Math.max(0.01, seconds / 4));
}

export function createNightshiftLowSpeedBed(context, destination) {
  const master = context.createGain();
  const expression = context.createGain();
  const filter = context.createBiquadFilter();
  const delay = context.createDelay(0.7);
  const feedback = context.createGain();
  const wet = context.createGain();
  const groups = NIGHTSHIFT_PARK_VOICINGS.map(() => context.createGain());
  const oscillators = [];
  let active = false;
  let index = 0;
  let changes = 0;
  let nextChangeAt = context.currentTime + NIGHTSHIFT_PARK_HOLD_SECONDS[0];

  master.gain.value = 0;
  expression.gain.value = 0.86;
  filter.type = "lowpass";
  filter.frequency.value = 1280;
  filter.Q.value = 0.32;
  delay.delayTime.value = 0.31;
  feedback.gain.value = 0.11;
  wet.gain.value = 0.13;
  master.connect(expression).connect(filter);
  filter.connect(destination);
  filter.connect(delay);
  delay.connect(wet).connect(destination);
  delay.connect(feedback).connect(delay);

  NIGHTSHIFT_PARK_VOICINGS.forEach((voicing, groupIndex) => {
    groups[groupIndex].gain.value = groupIndex === 0 ? 1 : 0;
    groups[groupIndex].connect(master);
    voicing.frequencies.forEach((frequency, voiceIndex) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = voiceIndex % 2 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      if (oscillator.detune) oscillator.detune.value = [-3, 2, -1, 3][voiceIndex];
      gain.gain.value = [0.1, 0.078, 0.062, 0.047][voiceIndex];
      oscillator.connect(gain).connect(groups[groupIndex]);
      oscillator.start();
      oscillators.push(oscillator);
    });
  });

  function scheduleBreath(time) {
    const hold = NIGHTSHIFT_PARK_HOLD_SECONDS[index];
    expression.gain.cancelScheduledValues?.(time);
    expression.gain.setValueAtTime?.(expression.gain.value, time);
    [0.83, 0.94, 0.87, 0.97, 0.85].forEach((value, step) => {
      expression.gain.linearRampToValueAtTime(value, time + (step + 1) / 5 * (hold - 0.2));
    });
    target(filter.frequency, 1080 + (index % 3) * 180, time, 5.2);
  }

  function tick(time = context.currentTime) {
    if (!active || time < nextChangeAt) return;
    const previous = index;
    index = (index + 1) % NIGHTSHIFT_PARK_VOICINGS.length;
    target(groups[previous].gain, 0, time, 4.2);
    target(groups[index].gain, 1, time, 4.2);
    nextChangeAt = time + NIGHTSHIFT_PARK_HOLD_SECONDS[index];
    changes += 1;
    scheduleBreath(time);
  }

  return {
    setActive(nextActive) {
      const next = Boolean(nextActive);
      if (next === active) return;
      active = next;
      target(master.gain, active ? NIGHTSHIFT_PARK_LEVEL : 0, context.currentTime, active ? 2.4 : 0.7);
      if (active) {
        nextChangeAt = context.currentTime + NIGHTSHIFT_PARK_HOLD_SECONDS[index];
        scheduleBreath(context.currentTime);
      }
    },
    tick,
    snapshot() {
      return {
        active,
        beat: false,
        bass: false,
        voicing: NIGHTSHIFT_PARK_VOICINGS[index].id,
        voicingChanges: changes,
        level: active ? NIGHTSHIFT_PARK_LEVEL : 0,
      };
    },
    destroy() {
      for (const oscillator of oscillators) {
        try { oscillator.stop(); } catch {}
        oscillator.disconnect();
      }
      for (const group of groups) group.disconnect();
      master.disconnect();
      expression.disconnect();
      filter.disconnect();
      delay.disconnect();
      feedback.disconnect();
      wet.disconnect();
    },
  };
}
