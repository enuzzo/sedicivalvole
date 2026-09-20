import { motionLiveStatus } from './guided-setup.js';

// Presentation only: never returned to motion consumers or used as readiness.
// Each accepted sample contributes once to a bounded one-second display window.
export function createRecentMotionReadings(now = () => performance.now()) {
  let samples = [], generation = null, lastKey = null, nextPaint = 0;
  let view = { acceleration: null, rotation: null, road: false, rtt: null };
  const clear = () => { samples = []; generation = null; lastKey = null; nextPaint = 0;
    view = { acceleration: null, rotation: null, road: false, rtt: null }; return view; };
  return {
    update(summary, values, phone = false) {
      const at = now(), live = motionLiveStatus(summary, phone);
      // Receiver's derived stale/tared=false is not an explicit ZERO invalidation.
      const invalid = (phone || summary.dataFresh === true) && (summary.sensorState !== 'live' || !summary.tared || summary.tareState === 'settling');
      if (!live.connected || summary.networkState === 'offline' || invalid) return clear();
      if (values && generation !== values.generation) { clear(); generation = values.generation; }
      samples = samples.filter(sample => at - sample.at < 1000);
      if (live.fresh && values) {
        const key = `${generation}:${summary.transport}:${phone ? summary.motionEvents : summary.received}`;
        if (key !== lastKey) {
          const road = Boolean(values.road);
          if (samples.length && samples[0].road !== road) samples = [];
          samples.push({ at: at - Math.max(0, values.ageMs ?? 0), acceleration: road ? values.road.longitudinalMps2 : Math.hypot(...values.acceleration),
            rotation: road ? values.road.yawRate : values.turnRate, road, rtt: live.rtt });
          if (samples.length > 64) samples.shift();
          lastKey = key;
        }
      }
      if (!samples.length) return clear();
      if (at < nextPaint) return view;
      nextPaint = at + 250;
      const mean = key => samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length;
      view = { acceleration: mean('acceleration'), rotation: mean('rotation'), road: samples[0].road,
        rtt: phone ? null : Math.round(mean('rtt')) };
      return view;
    },
  };
}
