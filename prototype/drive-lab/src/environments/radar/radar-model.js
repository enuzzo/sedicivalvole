/** Original ADSB.lol snapshot model. Unknown measurements remain unknown. */
import { discoverDistanceMetres } from '../../discover/discover-model.js';

export const RADAR_SOURCE = 'ADSB.lol';
export const RADAR_LIMIT = 32;
export const RADAR_FRESH_MS = 30000;
export const RADAR_EXPIRE_MS = 120000;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const coordinate = point => finite(point?.latitude) && Math.abs(point.latitude) <= 90
  && finite(point?.longitude) && Math.abs(point.longitude) <= 180;

/** Public point query in nautical miles; coarse request centre, exact measured aircraft. */
export function radarPointUrl(center, radiusNm = 27) {
  if (!coordinate(center) || !finite(radiusNm) || radiusNm !== 27) return null;
  return `/api/radar-data.php?kind=nearby&lat=${center.latitude.toFixed(2)}&lon=${center.longitude.toFixed(2)}`;
}

/** ADSB.lol's envelope clock is milliseconds, unlike readsb aircraft.json seconds. */
export function normalizeRadarSnapshot(payload, { center, epochNowMs, receivedAtMs }) {
  if (!coordinate(center) || !finite(epochNowMs) || !finite(receivedAtMs)
    || !finite(payload?.now) || payload.now > epochNowMs + 5000
    || epochNowMs - payload.now > RADAR_EXPIRE_MS || !Array.isArray(payload.ac)) return [];
  const rows = new Map();
  for (const item of payload.ac.slice(0, 512)) {
    const id = typeof item?.hex === 'string' ? item.hex.toLowerCase() : '';
    const point = { latitude: item?.lat, longitude: item?.lon };
    if (!/^[0-9a-f]{6}$/.test(id) || !coordinate(point) || !finite(item.seen_pos) || item.seen_pos < 0) continue;
    const ageMs = Math.max(0, epochNowMs - payload.now) + item.seen_pos * 1000;
    if (ageMs > RADAR_EXPIRE_MS) continue;
    const previous = rows.get(id);
    if (previous && previous.ageMs <= ageMs) continue;
    rows.set(id, {
      id, ...point, source: RADAR_SOURCE, ageMs, observedAtMs: receivedAtMs - ageMs,
      stale: ageMs > RADAR_FRESH_MS,
      registration: typeof item.r === 'string' ? item.r.trim().slice(0,16) : '',
      typeCode: typeof item.t === 'string' ? item.t.trim().toUpperCase().slice(0,8) : '',
      category: typeof item.category === 'string' ? item.category.slice(0,3) : '',
      verticalRate: finite(item.baro_rate) ? item.baro_rate : null,
      callsign: typeof item.flight === 'string' ? item.flight.trim().slice(0, 12) : '',
      trackDegrees: finite(item.track) && item.track >= 0 && item.track < 360 ? item.track : null,
      altitudeFeet: finite(item.alt_baro) ? item.alt_baro : null,
      onGround: item.alt_baro === 'ground',
      groundSpeedKnots: finite(item.gs) && item.gs >= 0 ? item.gs : null,
      distanceMetres: discoverDistanceMetres(center, point),
    });
  }
  return [...rows.values()].sort((a, b) => a.distanceMetres - b.distanceMetres || a.id.localeCompare(b.id)).slice(0, RADAR_LIMIT);
}
