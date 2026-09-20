// Mounted-device axes remain attached to the car through yaw, unlike TRACE's tare frame.
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const unit = v => v.map(x => x / Math.hypot(...v));
const valid = v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function mountedBasis(gravity) {
  if (!valid(gravity) || Math.hypot(...gravity) < 7 || Math.hypot(...gravity) > 12) return null;
  const up = unit(gravity);
  // Portrait, top up, screen facing the cabin and tilted back. Flat/upright,
  // landscape and inverted poses cannot establish this declared mount reliably.
  if (Math.abs(up[0]) > 0.2 || up[1] < 0.25 || up[2] < 0.15) return null;
  const forward = unit([0, 0, -1].map((v, i) => v + up[2] * up[i]));
  return { up, forward };
}
export function mountedReading(basis, sample) {
  if (!basis || !valid(sample?.gravity) || !valid(sample.acceleration) || !valid(sample.rotation)) return null;
  const g = Math.hypot(...sample.gravity);
  if (g < 7 || g > 12 || dot(unit(sample.gravity), basis.up) < Math.cos(12 * Math.PI / 180)
    || Math.hypot(...sample.rotation) > 80 || Math.hypot(...sample.acceleration) > 15) return null;
  return { longitudinalMps2: dot(sample.acceleration, basis.forward), yawRate: dot(sample.rotation, basis.up) };
}
export function safeRoadValues(value) {
  if (!value || !Number.isFinite(value.longitudinalMps2) || Math.abs(value.longitudinalMps2) > 15
    || !Number.isFinite(value.yawRate) || Math.abs(value.yawRate) > 80) return null;
  return { longitudinalMps2: Math.round(value.longitudinalMps2 * 100) / 100, yawRate: Math.round(value.yawRate * 10) / 10 };
}
export function usableRoadSample(sample) {
  return sample?.frame === 'tare-relative' && Number.isSafeInteger(sample.generation)
    && Number.isFinite(sample.ageMs) && sample.ageMs >= 0 && sample.ageMs <= 250
    ? safeRoadValues(sample.road) : null;
}
// Each consumer owns its existing GPS derivative. Only the transition to/from
// mounted data is slew limited; repeated polling never renews sensor freshness.
export function createRoadResponse() {
  let at = null, value = 0, key = null, transitioning = false;
  return {
    reset() { at = null; value = 0; key = null; transitioning = false; },
    resolve(sample, fallback, now) {
      const road = usableRoadSample(sample);
      const nextKey = road ? `phone:${sample.generation}` : 'gps';
      const target = road ? clamp(Math.abs(road.longitudinalMps2) < 0.12 ? 0 : road.longitudinalMps2, -10, 6) : fallback;
      const dt = at === null ? 0 : clamp((now - at) / 1000, 0, 0.1);
      if (key !== nextKey) transitioning = key !== null || Boolean(road);
      if (at !== null && now - at > 250) { value = 0; transitioning = true; }
      value = transitioning || road ? value + clamp(target - value, -12 * dt, 12 * dt) : target;
      if (!road && Math.abs(value - target) < 0.001) transitioning = false;
      at = now; key = nextKey;
      return { accelerationMps2: value, responseSource: road ? 'phone-motion' : 'gps-motion' };
    },
  };
}
export function roadSourceLabel({ source, active, sample, gpsFresh = true, sensor = {}, link = {} }) {
  if (source !== 'GPS') return 'Demo motion · phone excluded';
  if (!active) return 'GPS motion · session inactive';
  if (!gpsFresh) return 'GPS motion · waiting for fresh speed';
  if (usableRoadSample(sample)) return 'Phone motion + GPS speed';
  if (['preparing', 'pairing', 'connecting'].includes(link.state)) return 'GPS motion · phone connecting';
  if (sensor.roadState === 'moved') return 'GPS motion · remount and ZERO';
  if (sensor.roadState === 'unsupported-pose') return 'GPS motion · check portrait mount';
  if (sensor.sensorState === 'stale' || link.state === 'stale') return 'GPS motion · phone stale';
  if (sensor.tareState === 'settling') return 'GPS motion · phone calibrating';
  if (sensor.mountSelected && (!sensor.tared || sensor.roadState === 'needs-zero')) return 'GPS motion · phone needs ZERO';
  if (sensor.sensorState === 'live') return 'GPS motion · mount not calibrated';
  return 'GPS motion · phone unavailable';
}
