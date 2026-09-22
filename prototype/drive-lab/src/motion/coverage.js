// Bounded aggregates only. No vectors, timestamps, addresses or sample histories
// leave this model. Durations describe observed input, never audible playback.
const consumers = ['engine-demand', 'flux-braking', 'aperture-curve'];
export function createMotionCoverage(now = () => performance.now()) {
  const totals = { observedMs: 0, unobservedMs: 0, connectedMs: 0, freshMs: 0, confirmedMs: 0,
    roadEligibleMs: 0, httpsMs: 0, directMs: 0, forwardSamples: 0, slowingSamples: 0, turnSamples: 0 };
  let previous = null, lastKey = null;
  const usage = Object.fromEntries(consumers.map(name => [name, { observedMs: 0, until: 0, at: null }]));
  function settle(at) {
    if (!previous) return;
    const dt = Math.max(0, at - previous.at);
    if (dt > 5000) totals.unobservedMs += dt;
    else {
      totals.observedMs += dt;
      if (previous.connected) {
        totals.connectedMs += dt;
        if (previous.transport === 'direct') totals.directMs += dt;
        if (previous.transport === 'https') totals.httpsMs += dt;
      }
      const fresh = Math.min(dt, Math.max(0, previous.until - previous.at));
      totals.freshMs += fresh;
      if (previous.confirmed) totals.confirmedMs += fresh;
      if (previous.road) totals.roadEligibleMs += fresh;
    }
    previous.at = at;
  }
  return {
    update(s = {}, values = null) {
      const at = now(); settle(at);
      const connected = s.state === 'connected';
      const age = Number.isFinite(s.ageUpperMs) ? s.ageUpperMs : values?.ageMs;
      const fresh = connected && s.networkState !== 'offline' && s.dataFresh === true && Number.isFinite(age) && age >= 0 && age <= 250;
      const road = fresh && s.tared && s.sensorState === 'live' && s.roadState === 'calibrated' && Boolean(values?.road);
      previous = { at, connected, transport: s.transport, until: fresh ? at + 250 - age : at,
        confirmed: fresh && s.receiverConfirmed === true, road };
      const key = `${s.transport}:${s.received}:${values?.generation}`;
      if (road && key !== lastKey) {
        lastKey = key;
        if (values.road.longitudinalMps2 > 0.12) totals.forwardSamples++;
        if (values.road.longitudinalMps2 < -0.12) totals.slowingSamples++;
        if (Math.abs(values.road.yawRate) > 0.6) totals.turnSamples++;
      }
    },
    consumer(name, sample) {
      const item = usage[name]; if (!item) return;
      const at = now();
      // Count only intervals bounded by consecutive consumer reads and the
      // original sample expiry. A stopped renderer cannot accrue usage time.
      if (item.at !== null && at - item.at <= 250) item.observedMs += Math.max(0, Math.min(at, item.until) - item.at);
      item.at = at;
      item.until = sample?.road && Number.isFinite(sample.ageMs) && sample.ageMs >= 0 && sample.ageMs <= 250 ? at + 250 - sample.ageMs : at;
    },
    snapshot() {
      settle(now());
      return { ...Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round(value)])),
        consumerInputMs: Object.fromEntries(consumers.map(name => [name, Math.round(usage[name].observedMs)])),
        timeBasis: 'observed-monotonic-intervals', freshLimitMs: 250, maximumObservedGapMs: 5000,
        consumerMeaning: 'Eligible samples requested by the active consumer; not audible output or physical acceptance' };
    },
  };
}
