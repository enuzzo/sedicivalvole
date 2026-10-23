import { OPENFREEMAP_VECTOR_URL, interpolateAtlasPosition, validAtlasPosition } from '../atlas/atlas-model.js';

export const VEDUTA_STYLES = Object.freeze(['Anime', 'Manga', 'Watercolor']);
export const VEDUTA_VEHICLES = Object.freeze([
  { id: 'highland', label: 'Model 3 Highland' },
  { id: 'model-y', label: 'Model Y' },
  { id: 'point', label: 'Simple point' },
]);
// Illustrative body colours, not an assertion about a regional Tesla catalogue.
export const VEDUTA_COLORS = Object.freeze([
  { id: 'white', label: 'White', hex: '#e9e9e2' },
  { id: 'black', label: 'Black', hex: '#252931' },
  { id: 'grey', label: 'Grey', hex: '#777e85' },
  { id: 'silver', label: 'Silver', hex: '#b9c2c7' },
  { id: 'blue', label: 'Blue', hex: '#385c96' },
  { id: 'red', label: 'Red', hex: '#b94141' },
]);
export const VEDUTA_DEFAULTS = Object.freeze({ style: 'Anime', vehicle: 'point', color: 'white' });
export const VEDUTA_PREFERENCE_KEY = 'sedicivalvole.veduta.v1';
export function vedutaStatus({ online, tileFailure, terrain, point }) {
  if (!online) return point?.stale ? 'Offline · GPS interrupted · position held' : 'Offline · cached map';
  if (tileFailure) return 'Map interrupted · retrying';
  if (!terrain) return 'Loading 3D terrain';
  if (point?.stale) return 'GPS interrupted · last position held';
  return Number.isFinite(point?.heading) ? 'GPS follow' : 'GPS position · waiting for heading';
}
export function normalizeVedutaPreferences(value) {
  return {
    style: VEDUTA_STYLES.includes(value?.style) ? value.style : VEDUTA_DEFAULTS.style,
    vehicle: VEDUTA_VEHICLES.some(item => item.id === value?.vehicle) ? value.vehicle : VEDUTA_DEFAULTS.vehicle,
    color: VEDUTA_COLORS.some(item => item.id === value?.color) ? value.color : VEDUTA_DEFAULTS.color,
  };
}

/** Reuse the admitted geographic observations. Speed never creates a position. */
export function vedutaPosition(position, samples, now) {
  return interpolateAtlasPosition(samples, now)
    ?? (validAtlasPosition(position) ? { ...position, stale: true, interpolating: false } : null);
}
export function vedutaCamera(speed = 0, zoomOffset = 0) {
  const energy = Math.min(130, Math.max(0, Number(speed) || 0)) / 130;
  return { zoom: 17.25 - energy * 0.65 + Math.max(-1, Math.min(1, zoomOffset)), pitch: 73 };
}
/** Look ahead with the camera only. The vehicle and observations stay put. */
export function vedutaCameraCentre(point, distanceM = 65) {
  if (!Number.isFinite(point?.heading)) return { latitude: point.latitude, longitude: point.longitude };
  const bearing = point.heading * Math.PI / 180;
  return { latitude: Math.max(-85, Math.min(85, point.latitude + Math.cos(bearing) * distanceM / 111320)),
    longitude: ((point.longitude + Math.sin(bearing) * distanceM / (111320 * Math.max(0.09, Math.cos(point.latitude * Math.PI / 180))) + 540) % 360) - 180 };
}

export const VEDUTA_PAINT = Object.freeze({
  Anime: { ground: '#dfd8b1', grass: '#99b56a', forest: '#4b815e', water: '#439fb5', road: '#7c8881', casing: '#ece6ce', wall: '#ecdbac', roof: '#bd8658', ink: '#495f56', sky: '#82c6e9', horizon: '#d5e6d9' },
  Manga: { ground: '#f4f1e7', grass: '#d8d7c9', forest: '#b0b4a6', water: '#d4dcd8', road: '#faf8ef', casing: '#777b70', wall: '#f3f0e5', roof: '#b7b7aa', ink: '#3b423d', sky: '#e0e5df', horizon: '#f2f0e5' },
  Watercolor: { ground: '#ede5cc', grass: '#b4c58b', forest: '#86a88a', water: '#8dc5ce', road: '#e9dfca', casing: '#a5a78f', wall: '#ede0c8', roof: '#c7a28c', ink: '#8a9688', sky: '#b8d8e6', horizon: '#eee9d6' },
});

/** Existing disclosed providers only. No labels, POIs, route or navigation UI. */
export function createVedutaStyle(styleName = 'Anime', palette) {
  const name = VEDUTA_STYLES.includes(styleName) ? styleName : 'Anime';
  const c = VEDUTA_PAINT[name];
  // Draped terrain caches the first transition frame in pinned MapLibre 6.7.
  // Switch illustrative media atomically instead of caching a halfway palette.
  const style = { version: 8, transition: { duration: 0, delay: 0 } };
  style.sources = { openfreemap: { type: 'vector', url: OPENFREEMAP_VECTOR_URL,
    attribution: '<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' }, 'veduta-terrain': {
    type: 'raster-dem', tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'],
    tileSize: 512, encoding: 'terrarium', maxzoom: 12,
    attribution: '© <a href="https://mapterhorn.com/attribution/" target="_blank" rel="noopener noreferrer">Mapterhorn</a>',
  } };
  // Separate DEM consumers avoid MapLibre's terrain/hillshade sampling conflict.
  // Both use the same already admitted elevation tiles and provider.
  style.sources['veduta-shading'] = { ...style.sources['veduta-terrain'] };
  style.terrain = { source: 'veduta-terrain', exaggeration: 1 };
  style.sky = { 'sky-color': c.sky, 'horizon-color': c.horizon, 'fog-color': c.horizon,
    'sky-horizon-blend': 0.7, 'horizon-fog-blend': 0.6, 'fog-ground-blend': 0.72 };
  const vegetation = ['match', ['get', 'class'], ['wood', 'forest'], c.forest,
    ['grass', 'park', 'recreation_ground', 'garden', 'farmland', 'meadow', 'scrub'], c.grass, c.ground];
  style.layers = [
    { id: 'veduta-ground', type: 'background', paint: { 'background-color': c.ground } },
    { id: 'veduta-landcover', type: 'fill', source: 'openfreemap', 'source-layer': 'landcover', paint: { 'fill-color': vegetation, 'fill-opacity': 1 } },
    { id: 'veduta-landuse', type: 'fill', source: 'openfreemap', 'source-layer': 'landuse', paint: { 'fill-color': vegetation, 'fill-opacity': 0.8 } },
    { id: 'veduta-park', type: 'fill', source: 'openfreemap', 'source-layer': 'park', paint: { 'fill-color': c.grass } },
    { id: 'veduta-relief', type: 'hillshade', source: 'veduta-shading', paint: { 'hillshade-exaggeration': name === 'Manga' ? 0.28 : 0.45, 'hillshade-shadow-color': c.forest, 'hillshade-highlight-color': c.ground, 'hillshade-accent-color': c.ink } },
    { id: 'veduta-water', type: 'fill', source: 'openfreemap', 'source-layer': 'water', paint: { 'fill-color': c.water } },
    { id: 'veduta-road-casing', type: 'line', source: 'openfreemap', 'source-layer': 'transportation', filter: ['!=', ['get', 'class'], 'rail'], paint: { 'line-color': c.casing, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 9, 20, 38], 'line-opacity': 0.7 } },
    { id: 'veduta-roads', type: 'line', source: 'openfreemap', 'source-layer': 'transportation', filter: ['!=', ['get', 'class'], 'rail'], paint: { 'line-color': c.road, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 17, 7, 20, 34] } },
    { id: 'veduta-buildings', type: 'fill-extrusion', source: 'openfreemap', 'source-layer': 'building', minzoom: 13,
      paint: { 'fill-extrusion-color': c.wall, 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 5], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 1 } },
    { id: 'veduta-roofs', type: 'fill-extrusion', source: 'openfreemap', 'source-layer': 'building', minzoom: 13,
      paint: { 'fill-extrusion-color': c.roof, 'fill-extrusion-height': ['+', ['coalesce', ['get', 'render_height'], 5], 0.2], 'fill-extrusion-base': ['coalesce', ['get', 'render_height'], 5], 'fill-extrusion-opacity': 1 } },
  ];
  return style;
}

/** Deterministic cartographic decoration: global metre grid, never frame noise. */
export function vedutaHash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
export function pointInVedutaRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
export function pointInVedutaPolygon(point, rings) {
  return Boolean(rings?.length) && pointInVedutaRing(point, rings[0]) && !rings.slice(1).some(ring => pointInVedutaRing(point, ring));
}

export const VEDUTA_WORLD_METRES = 40075016.68557849;
export function vedutaGridCoordinate(x, y, step) {
  const mx = (x + 0.2 + vedutaHash(x, y) * 0.6) * step / VEDUTA_WORLD_METRES;
  const my = (y + 0.2 + vedutaHash(y, x) * 0.6) * step / VEDUTA_WORLD_METRES;
  return [mx * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * my))) * 180 / Math.PI];
}

/** An illustrative gable for simple convex footprints, not surveyed roof data. */
export function vedutaRoofFacets(ring, top) {
  if (ring.length < 3 || ring.length > 8) return null;
  let sign = 0, longest = 0, axis;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], c = ring[(i + 2) % ring.length];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) > 1e-6) { if (sign && Math.sign(cross) !== sign) return null; sign = Math.sign(cross); }
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length > longest) { longest = length; axis = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length]; }
  }
  if (!axis) return null;
  const projection = p => p[0] * axis[0] + p[1] * axis[1];
  const values = ring.map(projection), low = Math.min(...values), high = Math.max(...values), width = high - low;
  if (width < 4 || width > 30 || longest > 70) return null;
  const ridge = (low + high) / 2, rise = Math.min(3.2, width * 0.28);
  const height = p => top + Math.max(0, 1 - Math.abs(projection(p) - ridge) / (width / 2)) * rise;
  const halves = [-1, 1].map(side => {
    const out = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], da = projection(a) - ridge, db = projection(b) - ridge;
      if (da * side >= -1e-6) out.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out.map(p => [p[0], p[1], height(p)]);
  });
  const gables = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], da = projection(a) - ridge, db = projection(b) - ridge;
    if (da * db < 0) { const t = da / (da - db); gables.push([[...a, top], [...b, top], [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, top + rise]]); }
  }
  return { halves, gables };
}
