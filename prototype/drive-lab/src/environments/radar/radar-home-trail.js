import {validAtlasPosition} from '../atlas/atlas-model.js';
import {discoverDistanceMetres} from '../../discover/discover-model.js';

export const HOME_TRAIL_AGE_MS = 120000;
export const HOME_TRAIL_DISTANCE_M = 1000;

/** Session-only measured GPS trail. Coarse fixes locate the dot, never draw a journey. */
export function appendHomeObservation(history, position, now) {
  const time = position?.capturedAtMs;
  if (!validAtlasPosition(position) || !Number.isFinite(time) || now < time || now - time > 15000
    || !Number.isFinite(position.accuracyM) || position.accuracyM > 250) return [];
  const last = history.at(-1);
  if (last && time <= last.capturedAtMs) return history;
  const point = {latitude:position.latitude, longitude:position.longitude, capturedAtMs:time};
  if (!last || time - last.capturedAtMs > 30000) return [point];
  const distance = discoverDistanceMetres(last, point);
  if (distance / ((time - last.capturedAtMs) / 1000) > 70) return [point];
  if (!Number.isFinite(position.speedKmh)) return [point];
  if (position.speedKmh < 1 || distance < 3) return history.filter(p => time - p.capturedAtMs <= HOME_TRAIL_AGE_MS);
  const next = [...history.filter(p => time - p.capturedAtMs <= HOME_TRAIL_AGE_MS), point].slice(-128);
  let length = 0;
  for (let i = next.length - 1; i > 0; i--) {
    length += discoverDistanceMetres(next[i], next[i - 1]);
    if (length > HOME_TRAIL_DISTANCE_M) return next.slice(i);
  }
  return next;
}

export function homeTrailFeature(history, now) {
  const points = history.filter(p => now - p.capturedAtMs <= HOME_TRAIL_AGE_MS);
  return {type:'FeatureCollection', features:points.length > 1 ? [{type:'Feature', properties:{},
    geometry:{type:'LineString', coordinates:points.map(p => [p.longitude,p.latitude])}}] : []};
}
