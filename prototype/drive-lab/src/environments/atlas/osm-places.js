import { discoverDistanceMetres } from '../../discover/discover-model.js';

/** Named point geometry from already loaded OpenFreeMap tiles, never label positions or centroids. */
export function normalizeOsmPlaces(features, origin, language = 'en') {
  const unique = new Map();
  for (const feature of features) {
    const p = feature.properties ?? {};
    const title = p[`name:${language}`] || p.name || p.name_en;
    if (typeof title !== 'string' || !title.trim() || feature.geometry?.type !== 'Point') continue;
    const [longitude, latitude] = feature.geometry.coordinates;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) continue;
    const id = `osm:${title}:${longitude.toFixed(5)}:${latitude.toFixed(5)}`;
    const category = String(p.subclass || p.class || p.tourism || p.historic || p.amenity || 'Place').replaceAll('_', ' ');
    const wiki = typeof p.wikipedia === 'string' ? /^([a-z]{2,12}(?:-[a-z]+)?):(.+)$/.exec(p.wikipedia) : null;
    unique.set(id, { id, title: title.slice(0, 180), longitude, latitude, source: 'OpenStreetMap',
      summary: category, rank: Number(p.rank) || 100,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${latitude},${longitude}`)}`,
      wikipediaUrl: wiki ? `https://${wiki[1]}.wikipedia.org/wiki/${encodeURIComponent(wiki[2].replaceAll(' ', '_'))}` : null,
      mapUrl: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}` });
  }
  return [...unique.values()].sort((a, b) => (discoverDistanceMetres(origin, a) ?? Infinity) - (discoverDistanceMetres(origin, b) ?? Infinity) || a.rank - b.rank).slice(0, 80);
}

export function combineAtlasPlaces(wikipedia, osm) {
  const result = wikipedia.map(p => ({ ...p, source: 'Wikipedia' }));
  for (const place of osm) {
    if (result.some(p => p.title.toLocaleLowerCase() === place.title.toLocaleLowerCase() && (discoverDistanceMetres(p, place) ?? Infinity) < 100)) continue;
    result.push(place);
  }
  // Alternate providers before collision filtering so Wikipedia cannot monopolize pins.
  const wiki = result.filter(p => p.source === 'Wikipedia');
  const other = result.filter(p => p.source !== 'Wikipedia');
  return Array.from({ length: Math.max(wiki.length, other.length) }, (_, i) => [other[i], wiki[i]]).flat().filter(Boolean);
}

export function nearbyOsmUrl(position) {
  if (!Number.isFinite(position?.latitude) || !Number.isFinite(position?.longitude)
    || Math.abs(position.latitude) > 90 || Math.abs(position.longitude) > 180) return null;
  const area = `around:2000,${position.latitude.toFixed(2)},${position.longitude.toFixed(2)}`;
  const query = `[out:json][timeout:20];(node(${area})[name][tourism~"^(museum|attraction|viewpoint|artwork|gallery)$"];node(${area})[name][historic];node(${area})[name][amenity~"^(cafe|restaurant|theatre|place_of_worship|library)$"];);out body 100;`;
  return `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
}

export function normalizeNearbyOsm(payload, origin, language) {
  if (!Array.isArray(payload?.elements) || payload.remark) throw new Error('Incomplete nearby places');
  return normalizeOsmPlaces(payload.elements.filter(p => p.type === 'node').slice(0,100).map(p => ({
    geometry: { type: 'Point', coordinates: [p.lon, p.lat] }, properties: p.tags,
  })), origin, language);
}
