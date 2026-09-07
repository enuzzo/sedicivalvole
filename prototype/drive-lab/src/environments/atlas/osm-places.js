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
    const category = String(p.subclass || p.class || 'Place').replaceAll('_', ' ');
    unique.set(id, { id, title: title.slice(0, 180), longitude, latitude, source: 'OpenStreetMap',
      summary: category, rank: Number(p.rank) || 100,
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
  return result;
}
