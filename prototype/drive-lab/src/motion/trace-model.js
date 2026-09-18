// Original bounded visual history. Samples never enter diagnostic reports.
import { MOTION_FRESH_MS, vectorValid } from './reference.js';
export const TRACE_WINDOW_MS = 3000;
export const TRACE_CAPACITY = 180;
export function createMotionTrace() {
  let points = [], generation = null, lastSample = -Infinity, lastNow = -Infinity, range = 1, clipped = false;
  const clear = () => { points = []; generation = null; lastSample = -Infinity; range = 1; clipped = false; };
  return {
    clear,
    update(sample, now) {
      if (!Number.isFinite(now) || now < lastNow) { clear(); lastNow = -Infinity; return null; }
      lastNow = now;
      if (!sample || !vectorValid(sample.acceleration) || !vectorValid(sample.tilt)
        || !Number.isFinite(sample.sampleAt) || !Number.isFinite(sample.generation)
        || !Number.isFinite(sample.ageMs) || sample.ageMs < 0 || sample.ageMs > MOTION_FRESH_MS
        || now < sample.sampleAt || now - sample.sampleAt > MOTION_FRESH_MS) { clear(); return null; }
      if (sample.sampleAt < lastSample) { clear(); return null; }
      if (generation !== sample.generation || sample.sampleAt - lastSample > MOTION_FRESH_MS) clear();
      generation = sample.generation;
      points = points.filter(p => now - p.at <= TRACE_WINDOW_MS);
      if (sample.sampleAt > lastSample) {
        lastSample = sample.sampleAt;
        const magnitude = Math.max(...sample.acceleration.map(Math.abs));
        clipped = magnitude > 128;
        if (!clipped) {
          range = Math.max(range, 2 ** Math.max(0, Math.ceil(Math.log2(magnitude || 1))));
          points.push({ at: sample.sampleAt, value: [...sample.acceleration] });
          if (points.length > TRACE_CAPACITY) points.shift();
        } else points = [];
      }
      return { points, range, clipped, tilt: sample.tilt };
    },
  };
}
