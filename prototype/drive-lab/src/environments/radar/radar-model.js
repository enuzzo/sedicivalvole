/** Original ADSB.lol snapshot model. Unknown measurements remain unknown. */
import { discoverDistanceMetres } from '../../discover/discover-model.js';

export const RADAR_SOURCE = 'ADSB.lol';
export const RADAR_LIMIT = 4096;
export const RADAR_FRESH_MS = 30000;
export const RADAR_EXPIRE_MS = 120000;
const bounded = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const coordinate = point => finite(point?.latitude) && Math.abs(point.latitude) <= 90
  && finite(point?.longitude) && Math.abs(point.longitude) <= 180;

/** Public point query in nautical miles; coarse request centre, exact measured aircraft. */
export function radarPointUrl(center, radiusNm = 27) {
  if (!coordinate(center) || !finite(radiusNm) || !Number.isInteger(radiusNm) || radiusNm < 1 || radiusNm > 250) return null;
  return `/api/radar-data.php?kind=nearby&lat=${center.latitude.toFixed(2)}&lon=${center.longitude.toFixed(2)}${radiusNm===27?'':`&radius=${radiusNm}`}`;
}

/** ADSB.lol's envelope clock is milliseconds, unlike readsb aircraft.json seconds. */
export function normalizeRadarSnapshot(payload, { center, epochNowMs, receivedAtMs }) {
  if (!coordinate(center) || !finite(epochNowMs) || !finite(receivedAtMs)
    || !finite(payload?.now) || payload.now > epochNowMs + 5000
    || epochNowMs - payload.now > RADAR_EXPIRE_MS || !Array.isArray(payload.ac)) return [];
  const rows = new Map();
  for (const item of payload.ac.slice(0, RADAR_LIMIT)) {
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
      signalAtMs: finite(item.seen)&&item.seen>=0?receivedAtMs-(Math.max(0,epochNowMs-payload.now)+item.seen*1000):null,
      registration: typeof item.r === 'string' ? item.r.trim().slice(0,16) : '',
      typeCode: typeof item.t === 'string' ? item.t.trim().toUpperCase().slice(0,8) : '',
      category: typeof item.category === 'string' ? item.category.slice(0,3) : '',
      verticalRate: bounded(item.baro_rate, -30000, 30000),
      geometricAltitudeFeet: bounded(item.alt_geom, -2000, 100000),
      geometricRate: bounded(item.geom_rate, -30000, 30000),
      indicatedSpeedKnots: bounded(item.ias, 0, 2000),
      trueSpeedKnots: bounded(item.tas, 0, 2000),
      mach: bounded(item.mach, 0, 5),
      magneticHeadingDegrees: bounded(item.mag_heading, 0, 359.999),
      trueHeadingDegrees: bounded(item.true_heading, 0, 359.999),
      rollDegrees: bounded(item.roll, -180, 180),
      selectedAltitudeFeet: bounded(item.nav_altitude_mcp, -2000, 100000),
      altimeterHpa: bounded(item.nav_qnh, 800, 1100),
      windDirectionDegrees: bounded(item.wd, 0, 359.999),
      windSpeedKnots: bounded(item.ws, 0, 300),
      outsideTemperatureC: bounded(item.oat, -100, 70),
      squawk: typeof item.squawk === 'string' && /^[0-7]{4}$/.test(item.squawk) ? item.squawk : null,
      positionSource: ['adsb_icao','adsb_icao_nt','adsr_icao','tisb_icao','adsc','mlat','other','mode_s'].includes(item.type) ? item.type : null,
      callsign: typeof item.flight === 'string' ? item.flight.trim().slice(0, 12) : '',
      trackDegrees: finite(item.track) && item.track >= 0 && item.track < 360 ? item.track : null,
      altitudeFeet: bounded(item.alt_baro, -2000, 100000),
      onGround: item.alt_baro === 'ground',
      groundSpeedKnots: bounded(item.gs, 0, 2000),
      distanceMetres: discoverDistanceMetres(center, point),
    });
  }
  return [...rows.values()].sort((a, b) => a.distanceMetres - b.distanceMetres || a.id.localeCompare(b.id)).slice(0, RADAR_LIMIT);
}

export function radarAircraftUrl(id){
  return /^[0-9a-f]{6}$/.test(id??'')?`/api/radar-data.php?kind=aircraft&hex=${id}`:null;
}
