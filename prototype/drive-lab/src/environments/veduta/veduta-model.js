import { OPENFREEMAP_VECTOR_URL, atlasContrastRatio, interpolateAtlasPosition, validAtlasPosition } from '../atlas/atlas-model.js';

export const VEDUTA_STYLES = Object.freeze(['Anime', 'Manga', 'Watercolor']);
// `short` is the VIEW key value; `label` names the option in the VIEW popover.
export const VEDUTA_VEHICLES = Object.freeze([
  { id: 'point', label: 'GPS dot', short: 'Dot' },
  { id: 'highland', label: 'Model 3 Highland', short: 'Model 3' },
  { id: 'model-y', label: 'Model Y', short: 'Model Y' },
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

/**
 * A medium is a style, optionally at night (" Night" suffix). DARK appearance
 * selects the night medium; it switches atomically like a style change.
 */
export const VEDUTA_NIGHT_SUFFIX = ' Night';
export function vedutaMedium(style, night = false) {
  const base = VEDUTA_STYLES.includes(style) ? style : VEDUTA_DEFAULTS.style;
  return night ? `${base}${VEDUTA_NIGHT_SUFFIX}` : base;
}
export function vedutaBaseStyle(medium) {
  const base = String(medium ?? '').replace(/ Night$/, '');
  return VEDUTA_STYLES.includes(base) ? base : VEDUTA_DEFAULTS.style;
}
export function vedutaIsNight(medium) { return / Night$/.test(String(medium ?? '')); }
/** A per-medium image id, e.g. veduta-foliage-pigment-anime-night. */
export function vedutaImageId(kind, medium) { return `veduta-${kind}-${String(medium).toLowerCase().replace(/\s+/g, '-')}`; }

/** Warm street-lamp light shared by every night medium. */
export const VEDUTA_LAMP = '#ffd27e';

export const VEDUTA_PAINT = Object.freeze({
  Anime: { ground: '#dfd8b1', grass: '#99b56a', forest: '#4b815e', water: '#439fb5', road: '#7c8881', casing: '#ece6ce', wall: '#ecdbac', roof: '#bd8658', ink: '#495f56', sky: '#82c6e9', horizon: '#d5e6d9' },
  Manga: { ground: '#f4f1e7', grass: '#d8d7c9', forest: '#84897f', water: '#aeb7b3', road: '#faf8ef', casing: '#777b70', wall: '#f3f0e5', roof: '#90948c', ink: '#3b423d', sky: '#e0e5df', horizon: '#f2f0e5' },
  Watercolor: { ground: '#ede5cc', grass: '#b4c58b', forest: '#86a88a', water: '#8dc5ce', road: '#f7f2e6', casing: '#9a9883', wall: '#ede0c8', roof: '#c7a28c', ink: '#8a9688', sky: '#b8d8e6', horizon: '#eee9d6' },
  // Lanterne (owner-selected October 24): Codex composition, Magnific ground
  // luminance. Dark streets and plazas; light comes from windows and lamp pools.
  'Anime Night': { ground: '#232839', grass: '#1f3029', forest: '#16251f', water: '#111a33', road: '#2e344a', casing: '#1a1e2e', wall: '#363a52', roof: '#33242a', ink: '#0b0f1c', sky: '#0d1230', horizon: '#2b2652' },
  'Manga Night': { ground: '#1b1d22', grass: '#24262b', forest: '#33363b', water: '#2a2d33', road: '#25282d', casing: '#585c64', wall: '#2c2f35', roof: '#3a3e45', ink: '#c9cdd3', sky: '#0e0f12', horizon: '#24262c' },
  'Watercolor Night': { ground: '#272a3a', grass: '#25332e', forest: '#1d2a24', water: '#18243c', road: '#323648', casing: '#454859', wall: '#36384a', roof: '#382a2e', ink: '#131624', sky: '#121831', horizon: '#33304f' },
});

/** The GPS dot carries the PALETTE accent, darkened until it holds 3:1 against the medium's ground. */
export function vedutaDotColor(palette, styleName = 'Anime') {
  const hex = value => value.match(/\w\w/g).map(pair => parseInt(pair, 16) / 255);
  const ground = hex((VEDUTA_PAINT[styleName] ?? VEDUTA_PAINT.Anime).ground);
  const darkGround = atlasContrastRatio(ground, [0, 0, 0]) < 4;
  let color = Array.isArray(palette?.accent) ? palette.accent.map(value => Math.min(1, Math.max(0, value))) : hex('#347eb4');
  // Darken on a light ground; lighten towards white on a night ground.
  for (let step = 0; step < 16 && atlasContrastRatio(color, ground) < 3; step++) {
    color = darkGround ? color.map(value => value + (1 - value) * 0.14) : color.map(value => value * 0.86);
  }
  return `#${color.map(value => Math.round(value * 255).toString(16).padStart(2, '0')).join('')}`;
}

/** Existing disclosed providers only. No labels, POIs, route or navigation UI. */
export function createVedutaStyle(styleName = 'Anime', palette) {
  const medium = VEDUTA_PAINT[styleName] ? styleName : 'Anime', name = vedutaBaseStyle(medium), night = vedutaIsNight(medium);
  const c = VEDUTA_PAINT[medium];
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
  // One constant colour per class group. A data-driven `match` colour is baked
  // into tile buffers, so a medium switch showed the previous medium's vegetation.
  const forest = ['wood', 'forest'], grass = ['grass', 'park', 'recreation_ground', 'garden', 'farmland', 'meadow', 'scrub'];
  const classIn = classes => ['in', ['get', 'class'], ['literal', classes]];
  const fill = (id, sourceLayer, filter, color, opacity) => ({ id, type: 'fill', source: 'openfreemap', 'source-layer': sourceLayer, filter, paint: { 'fill-color': color, 'fill-opacity': opacity } });
  style.layers = [
    { id: 'veduta-ground', type: 'background', paint: { 'background-color': c.ground } },
    fill('veduta-landcover-forest', 'landcover', classIn(forest), c.forest, 1),
    fill('veduta-landcover-grass', 'landcover', classIn(grass), c.grass, 1),
    fill('veduta-landuse-other', 'landuse', ['!', classIn([...forest, ...grass])], c.ground, 0.8),
    fill('veduta-landuse-forest', 'landuse', classIn(forest), c.forest, 0.8),
    fill('veduta-landuse-grass', 'landuse', classIn(grass), c.grass, 0.8),
    { id: 'veduta-park', type: 'fill', source: 'openfreemap', 'source-layer': 'park', paint: { 'fill-color': c.grass } },
    { id: 'veduta-relief', type: 'hillshade', source: 'veduta-shading', paint: { 'hillshade-exaggeration': name === 'Manga' ? 0.28 : 0.45, 'hillshade-shadow-color': c.forest, 'hillshade-highlight-color': c.ground, 'hillshade-accent-color': c.ink } },
    { id: 'veduta-water', type: 'fill', source: 'openfreemap', 'source-layer': 'water', paint: { 'fill-color': c.water } },
    { id: 'veduta-road-casing', type: 'line', source: 'openfreemap', 'source-layer': 'transportation', filter: ['!=', ['get', 'class'], 'rail'], paint: { 'line-color': c.casing, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 9, 20, 38], 'line-opacity': 0.7 } },
    { id: 'veduta-roads', type: 'line', source: 'openfreemap', 'source-layer': 'transportation', filter: ['!=', ['get', 'class'], 'rail'], paint: { 'line-color': c.road, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 17, 7, 20, 34] } },
    // Street-lamp light: map-aligned pools on the asphalt plus a small lamp head,
    // placed by MapLibre along streets. Day keeps them present but transparent so
    // a medium switch only changes paint. Both images are radially symmetric:
    // viewport rotation avoids MapLibre re-projecting line-placed icons every frame.
    ...['veduta-lamp-pools', 'veduta-lamp-heads'].map(id => ({ id, type: 'symbol', source: 'openfreemap', 'source-layer': 'transportation', minzoom: 14,
      filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'minor', 'service']]],
      layout: { 'symbol-placement': 'line', 'symbol-spacing': 150, 'icon-image': id === 'veduta-lamp-pools' ? 'veduta-lamp-pool' : 'veduta-lamp-head',
        'icon-pitch-alignment': id === 'veduta-lamp-pools' ? 'map' : 'viewport', 'icon-rotation-alignment': 'viewport',
        'icon-size': id === 'veduta-lamp-pools' ? ['interpolate', ['linear'], ['zoom'], 14, 0.5, 17, 1.5, 19, 3.4] : ['interpolate', ['linear'], ['zoom'], 14, 0.25, 17, 0.45, 19, 0.7],
        'icon-allow-overlap': true, 'icon-ignore-placement': true, 'icon-keep-upright': false },
      paint: { 'icon-opacity': night ? (id === 'veduta-lamp-pools' ? 0.7 : 0.9) : 0 } })),
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
export function vedutaDistanceToSegment(point, a, b) {
  const dx = b[0]-a[0], dy = b[1]-a[1], length2 = dx*dx+dy*dy;
  const t = length2 ? Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/length2)) : 0;
  return Math.hypot(point[0]-a[0]-dx*t,point[1]-a[1]-dy*t);
}
export function vedutaGridCoordinate(x, y, step) {
  const mx = (x + 0.2 + vedutaHash(x, y) * 0.6) * step / VEDUTA_WORLD_METRES;
  const my = (y + 0.2 + vedutaHash(y, x) * 0.6) * step / VEDUTA_WORLD_METRES;
  return [mx * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * my))) * 180 / Math.PI];
}

/** Tile rings arrive clockwise. Walls and roof facets need counter-clockwise rings to face outward and up. */
export function vedutaCounterClockwiseRing(ring) {
  let area = 0;
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a[0] * b[1] - b[0] * a[1]; }
  return area < 0 ? ring.slice().reverse() : ring;
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
