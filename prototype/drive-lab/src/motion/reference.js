// Original relative-pose math. This frame is the phone's tare pose, not vehicle axes.
export const MOTION_FRESH_MS = 250;
const rad = Math.PI / 180;
const deg = 180 / Math.PI;
const finite = (n) => typeof n === "number" && Number.isFinite(n);
export const vectorValid = (v) => Array.isArray(v) && v.length === 3 && v.every(finite);
const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
const norm = (v) => Math.hypot(...v);
const transpose = (m) => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
export const applyRotation = (m, v) => [dot(m.slice(0, 3), v), dot(m.slice(3, 6), v), dot(m.slice(6, 9), v)];
const multiply = (a, b) => {
  const t = transpose(b);
  return Array.from({ length: 9 }, (_, i) => dot(a.slice(Math.floor(i / 3) * 3, Math.floor(i / 3) * 3 + 3), t.slice((i % 3) * 3, (i % 3) * 3 + 3)));
};

export function advanceOrientation(matrix, angularRate, seconds) {
  if (!matrix || !vectorValid(angularRate) || !finite(seconds) || seconds < 0 || seconds > 0.25) return null;
  const angle = norm(angularRate) * rad * seconds;
  if (angle < 1e-10) return [...matrix];
  const [x, y, z] = angularRate.map((n) => n / norm(angularRate));
  const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  return multiply(matrix, [t*x*x+c, t*x*y-s*z, t*x*z+s*y,
    t*x*y+s*z, t*y*y+c, t*y*z-s*x, t*x*z-s*y, t*y*z+s*x, t*z*z+c]);
}

// W3C intrinsic Z-X'-Y'' device orientation, independent of screen rotation.
export function orientationMatrix({ alpha, beta, gamma } = {}) {
  if (![alpha, beta, gamma].every(finite)) return null;
  const [a, b, g] = [alpha * rad, beta * rad, gamma * rad];
  const [ca, sa, cb, sb, cg, sg] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), Math.cos(g), Math.sin(g)];
  return [ca * cg - sa * sb * sg, -sa * cb, ca * sg + sa * sb * cg,
    sa * cg + ca * sb * sg, ca * cb, sa * sg - ca * sb * cg,
    -cb * sg, sb, cb * cg];
}

// A bounded axis-angle vector avoids Euler wrap jumps near 0/360 and gimbal lock.
export function rotationVector(m) {
  const angle = Math.acos(Math.max(-1, Math.min(1, (m[0] + m[4] + m[8] - 1) / 2)));
  if (angle < 1e-7) return [0, 0, 0];
  if (Math.PI - angle < 1e-5) {
    const axis = [Math.sqrt(Math.max(0, (m[0] + 1) / 2)), Math.sqrt(Math.max(0, (m[4] + 1) / 2)), Math.sqrt(Math.max(0, (m[8] + 1) / 2))];
    const largest = axis.indexOf(Math.max(...axis));
    if (largest === 0) { axis[1] = Math.sign(m[1] + m[3] || 1) * axis[1]; axis[2] = Math.sign(m[2] + m[6] || 1) * axis[2]; }
    if (largest === 1) { axis[0] = Math.sign(m[1] + m[3] || 1) * axis[0]; axis[2] = Math.sign(m[5] + m[7] || 1) * axis[2]; }
    if (largest === 2) { axis[0] = Math.sign(m[2] + m[6] || 1) * axis[0]; axis[1] = Math.sign(m[5] + m[7] || 1) * axis[1]; }
    return axis.map((n) => n * angle * deg);
  }
  return [m[7] - m[5], m[2] - m[6], m[3] - m[1]].map((n) => n * angle * deg / (2 * Math.sin(angle)));
}

// Shared by immediate reference capture and the user-triggered settling window.
export function zeroReadiness(sample, now) {
  const fresh = sample && [sample.at, sample.orientationAt, now].every(finite)
    && now - sample.at >= 0 && now - sample.at <= MOTION_FRESH_MS
    && now - sample.orientationAt >= 0 && now - sample.orientationAt <= MOTION_FRESH_MS;
  if (!fresh || !sample.orientation || !vectorValid(sample.acceleration) || !vectorValid(sample.rotation) || !vectorValid(sample.gravity)) return "unavailable";
  if (norm(sample.gravity) < 7 || norm(sample.gravity) > 12) return "gravity";
  if (norm(sample.acceleration) > 0.7) return "acceleration";
  if (norm(sample.rotation) > 5) return "rotation";
  return "ready";
}

export function createPoseReference() {
  let reference = null;
  let up = null;
  let generation = 0;
  return {
    clear() { reference = null; up = null; generation += 1; },
    tare(sample, now) {
      const readiness = zeroReadiness(sample, now);
      if (readiness === "unavailable") return "unavailable";
      if (readiness !== "ready") return "hold-still";
      reference = [...sample.orientation];
      // Core Motion may report downward gravity. Use orientation only to choose
      // its polarity; retain the measured vertical, without guessing car heading.
      const polarity = dot(sample.gravity, sample.orientation.slice(6)) < 0 ? -1 : 1;
      up = sample.gravity.map((n) => polarity * n / norm(sample.gravity));
      generation += 1;
      return "tared";
    },
    project(sample, now) {
      if (!reference || !sample?.orientation || !vectorValid(sample.acceleration) || !vectorValid(sample.rotation)
        || ![now, sample.at, sample.orientationAt].every(finite)
        || now < sample.at || now - sample.at > MOTION_FRESH_MS
        || now < sample.orientationAt || now - sample.orientationAt > MOTION_FRESH_MS) return null;
      const delta = multiply(transpose(reference), sample.orientation);
      const acceleration = applyRotation(delta, sample.acceleration);
      const rotation = applyRotation(delta, sample.rotation);
      return { frame: "tare-relative", generation, acceleration, rotation,
        tilt: rotationVector(delta), turnRate: dot(rotation, up), ageMs: Math.max(now - sample.at, now - sample.orientationAt) };
    },
    get tared() { return reference !== null; },
    get generation() { return generation; },
  };
}
