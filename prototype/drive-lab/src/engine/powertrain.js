const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
const lerp = (from, to, progress) => from + (to - from) * progress;
const smooth = (from, to, dt, seconds) => lerp(from, to, 1 - Math.exp(-dt / seconds));
const tuning = (profile) => profile?.powertrain ?? {};

/** Original acoustic demand: GPS supplies speed/acceleration, never pedal or torque. */
export function estimateEngineDemand(evidence = {}, profile = {}, { throttleOverride = null } = {}) {
  const options = tuning(profile);
  const override = Number.isFinite(throttleOverride) ? clamp(throttleOverride) : null;
  const trusted = evidence.freshness === "fresh";
  const speed = clamp(finite(evidence.speedKmh, 0), 0, 260);
  const acceleration = clamp(finite(evidence.accelerationMps2, 0), -10, 6);
  const rolling = clamp(finite(options.rollingLoad, 0.12), 0, 0.4);
  const drag = clamp(finite(options.dragLoad, 0.4), 0, 0.8);
  // An authored normalized road load, not estimated vehicle mass, grade or wind.
  const roadLoad = trusted && speed > 0 ? clamp(rolling + drag * (speed / 130) ** 2) : 0;
  const accelerationScale = clamp(finite(options.accelerationForFullLoad, 2.8), 0.5, 8);
  const inferred = Number.isFinite(evidence.accelerationMps2)
    ? clamp(roadLoad + acceleration / accelerationScale)
    : clamp(finite(evidence.drive, 0));
  // Preserve explicit accelerator/regen extremes already resolved by the receiver.
  const requested = evidence.brakeHeld || evidence.driveInput === "regen" || evidence.drive === 0 ? 0
    : evidence.driveInput === "accelerator" || evidence.drive === 1 ? 1 : inferred;
  const throttle = override ?? (trusted ? requested : 0);
  const idleLoad = clamp(finite(options.idleLoad, 0.08), 0, 0.25);
  const load = clamp(idleLoad + (1 - idleLoad) * throttle);
  return { throttle, load, coast: override == null && trusted && speed > 0 ? 1 - throttle : 0, roadLoad };
}

/** Exponential response is independent of the controller's tick subdivision. */
export function advanceEngineDemand(previous, evidence, profile, dt, options = {}) {
  const target = estimateEngineDemand(evidence, profile, options);
  const config = tuning(profile);
  const elapsed = clamp(finite(dt, 0), 0, 0.5);
  const initial = previous ?? { throttle: 0, load: clamp(finite(config.idleLoad, 0.08), 0, 0.25), coast: 0, roadLoad: 0 };
  const response = target.throttle > finite(initial.throttle, 0)
    ? clamp(finite(config.loadAttackSeconds, 0.11), 0.015, 1)
    : clamp(finite(config.loadReleaseSeconds, 0.16), 0.015, 1.5);
  return Object.fromEntries(Object.entries(target).map(([key, value]) => [key,
    smooth(clamp(finite(initial[key], value)), value, elapsed, response),
  ]));
}

/** Transmission sample rate follows road speed; a crank-speed blip cannot pitch it. */
export function transmissionCents(speedKmh, profile = {}) {
  const config = tuning(profile);
  const reference = clamp(finite(config.transmissionReferenceKmh, 65), 10, 200);
  const base = clamp(finite(config.transmissionBaseCents, -150), -1200, 1200);
  const speed = clamp(finite(speedKmh, 0), 0.01, 260);
  return clamp(base + 1200 * Math.log2(speed / reference), -2400, 2400);
}

/**
 * Immutable audible shift contract, ready for matching AudioParam ramps.
 * Load changes crossfade drive/coast tone; this plan never changes master gain.
 */
export function planEngineShift({ at, fromRpm, toRpm, fromLoad = 0.5, toLoad = fromLoad,
  fromGear, toGear, duration, reason, profile = {} }) {
  if (!Number.isFinite(at) || at < 0 || !Number.isFinite(fromRpm) || !Number.isFinite(toRpm)
    || !Number.isInteger(fromGear) || !Number.isInteger(toGear) || fromGear < 1 || toGear < 1 || fromGear === toGear) {
    throw new RangeError("An Engine shift needs finite audio time, RPM and distinct positive gears");
  }
  const config = tuning(profile);
  const seconds = clamp(finite(duration, finite(profile.duration, 0.26)), 0.12, 0.9);
  const limiter = clamp(finite(profile.configuration?.engine?.limiter, 12000), 1000, 30000);
  const from = clamp(fromRpm, 600, limiter), to = clamp(toRpm, 600, limiter);
  const initialLoad = clamp(finite(fromLoad, 0.5)), destinationLoad = clamp(finite(toLoad, initialLoad));
  const releaseFraction = clamp(finite(config.shiftReleaseFraction, 0.2), 0.1, 0.35);
  const syncFraction = clamp(finite(config.shiftSyncFraction, 0.65), releaseFraction + 0.2, 0.85);
  const releaseAt = at + seconds * releaseFraction, syncAt = at + seconds * syncFraction, endAt = at + seconds;
  const downward = toGear < fromGear;
  const releasedLoad = Math.min(initialLoad, 0.06);
  const releasedRpm = Math.max(600, from * 0.985);
  const blipLoad = downward ? clamp(finite(config.revMatchLoad, 0.7), 0.25, 0.95) : releasedLoad;
  const points = [
    { at, rpm: from, load: initialLoad, clutch: 1, phase: "release" },
    { at: releaseAt, rpm: releasedRpm, load: releasedLoad, clutch: 0, phase: "synchronize" },
    { at: (releaseAt + syncAt) / 2, rpm: lerp(releasedRpm, to, 0.5), load: blipLoad, clutch: 0, phase: "synchronize" },
    { at: syncAt, rpm: to, load: releasedLoad, clutch: 0.12, phase: "engage" },
    { at: endAt, rpm: to, load: destinationLoad, clutch: 1, phase: "complete" },
  ].map(Object.freeze);
  return Object.freeze({ fromGear, toGear, reason: reason ?? (downward ? "downshift" : "upshift"),
    startAt: at, releaseAt, syncAt, commitAt: syncAt, endAt, duration: seconds, points: Object.freeze(points) });
}

/** Sample the same linear segments that the renderer schedules on the audio clock. */
export function sampleEngineShift(plan, at) {
  const time = finite(at, plan.startAt);
  const points = plan.points;
  let index = 0;
  while (index < points.length - 1 && time >= points[index + 1].at) index++;
  const from = points[index], to = points[Math.min(index + 1, points.length - 1)];
  const progress = to.at > from.at ? clamp((time - from.at) / (to.at - from.at)) : 1;
  return { phase: time < plan.startAt ? "pending" : from.phase,
    rpm: lerp(from.rpm, to.rpm, progress), load: lerp(from.load, to.load, progress),
    clutch: lerp(from.clutch, to.clutch, progress), committed: time >= plan.commitAt, done: time >= plan.endAt };
}

/** One pending event, exact timestamps and one commit even if a polling tick is late. */
export function createEngineShiftController() {
  let pending = null, committed = false;
  return {
    schedule(input) {
      if (pending) return null;
      pending = planEngineShift(input); committed = false;
      return pending;
    },
    sample(at) {
      if (!pending) return null;
      const result = sampleEngineShift(pending, at), events = [];
      if (result.committed && !committed) {
        committed = true;
        events.push({ type: "commit", at: pending.commitAt, gear: pending.toGear });
      }
      if (result.done) { events.push({ type: "complete", at: pending.endAt, gear: pending.toGear }); pending = null; }
      return { ...result, events };
    },
    cancel() { const cancelled = pending; pending = null; committed = false; return cancelled; },
    get pending() { return pending; },
  };
}

/** Authored exhaust-energy proxy; normalized pressure is not measured boost. */
export function boostDemand({ rpm = 0, load = 0 } = {}, profile = {}) {
  const config = profile.boost;
  if (!config || config.enabled === false) return 0;
  const threshold = clamp(finite(config.thresholdRpm, 1800), 600, 20000);
  const full = Math.max(threshold + 500, finite(config.fullRpm, 4700));
  const revEnergy = clamp((finite(rpm, 0) - threshold) / (full - threshold));
  const exhaustEnergy = clamp((finite(load, 0) - 0.16) / 0.84);
  return clamp(revEnergy * exhaustEnergy);
}

/**
 * Deterministic reference envelope for exports/control traces. Render audible
 * spool and valve events on the sample clock, using these same targets/seconds.
 */
export function createEngineBoost(profile = {}) {
  const config = profile.boost ?? {};
  const attack = clamp(finite(config.spoolSeconds, 0.65), 0.1, 3);
  const decay = clamp(finite(config.decaySeconds, 0.42), 0.08, 3);
  const valveSeconds = clamp(finite(config.valveSeconds, 0.28), 0.08, 0.7);
  let lastAt = null, spool = 0, valveAt = null, valveLevel = 0, armed = false;
  const reset = () => { lastAt = null; spool = 0; valveAt = null; valveLevel = 0; armed = false; };
  return {
    reset,
    sample({ at, rpm = 0, load = 0, active = true, shiftRelease = false } = {}) {
      if (!active || !Number.isFinite(at) || at < 0 || !profile.boost || config.enabled === false) {
        reset(); return { spool: 0, target: 0, blowOff: 0, event: null };
      }
      if (lastAt != null && at < lastAt) reset();
      const dt = lastAt == null ? 0 : at - lastAt;
      // Lifecycle gaps are cancellation, never a backlog of imaginary boost events.
      if (dt > 0.5) { reset(); lastAt = at; return { spool: 0, target: 0, blowOff: 0, event: null }; }
      const demand = clamp(finite(load, 0)), target = boostDemand({ rpm, load: demand }, profile);
      let event = null;
      if (armed && spool >= 0.16 && (demand <= 0.22 || shiftRelease)) {
        valveAt = at; valveLevel = spool; armed = false;
        event = { type: "blow-off", at, level: valveLevel, duration: valveSeconds };
      }
      spool = smooth(spool, target, dt, target > spool ? attack : decay);
      const valveProgress = valveAt == null ? 1 : clamp((at - valveAt) / valveSeconds);
      const blowOff = valveLevel * (1 - valveProgress) ** 2;
      if (valveProgress === 1) { valveAt = null; valveLevel = 0; }
      if (!shiftRelease && demand >= 0.55 && spool >= 0.22 && valveAt == null) armed = true;
      lastAt = at;
      return { spool: clamp(spool), target, blowOff: clamp(blowOff), event };
    },
  };
}
