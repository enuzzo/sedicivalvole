import { discoverDistanceMetres, discoverBearingDegrees, discoverEstimatedDrivingMinutes, formatDiscoverDistance } from './discover-model.js';

function articleKey(value) {
  try { const url = new URL(value); return `${url.hostname.replace('.m.wikipedia.', '.wikipedia.')}${decodeURIComponent(url.pathname).replaceAll('_', ' ')}`.toLocaleLowerCase(); }
  catch { return null; }
}

/** Blend nearby OSM points with articles; search only the already fetched OSM set. */
export function combineDiscoverPlaces(wikipedia, osm, position, query = '') {
  const wiki = wikipedia.map(place => ({ ...place, source: 'Wikipedia' }));
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const other = osm.filter(place => terms.every(term => `${place.title} ${place.summary}`.toLocaleLowerCase().includes(term)))
    .filter(place => !wiki.some(article =>
      (place.wikipediaUrl && articleKey(place.wikipediaUrl) === articleKey(article.url)) ||
      (place.title.toLocaleLowerCase() === article.title.toLocaleLowerCase() && (discoverDistanceMetres(place, article) ?? Infinity) < 100)))
    .map(place => {
      const distanceMetres = discoverDistanceMetres(position, place);
      return { ...place, url: place.mapUrl, distanceMetres, distanceLabel: formatDiscoverDistance(distanceMetres),
        bearing: discoverBearingDegrees(position, place), estimatedMinutes: discoverEstimatedDrivingMinutes(distanceMetres) };
    }).sort((a, b) => (a.distanceMetres ?? Infinity) - (b.distanceMetres ?? Infinity));
  return Array.from({ length: Math.max(wiki.length, other.length) }, (_, i) => [wiki[i], other[i]]).flat().filter(Boolean).slice(0, 40);
}
