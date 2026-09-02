export const DISCOVER_RESULT_LIMIT = 15;
export const DISCOVER_INITIAL_VISIBLE_RESULTS = 5;
export const DISCOVER_RESULT_ROW_HEIGHT = 66;
export const DISCOVER_MORE_ROW_HEIGHT = 38;

export const DISCOVER_LANGUAGE_OPTIONS = Object.freeze([
  { id: "en", label: "English" },
  { id: "it", label: "Italiano" },
  { id: "de", label: "Deutsch" },
  { id: "fr", label: "Français" },
  { id: "es", label: "Español" },
  { id: "pt", label: "Português" },
  { id: "nl", label: "Nederlands" },
  { id: "pl", label: "Polski" },
  { id: "sv", label: "Svenska" },
  { id: "uk", label: "Українська" },
  { id: "ru", label: "Русский" },
  { id: "ar", label: "العربية" },
  { id: "ja", label: "日本語" },
  { id: "zh", label: "中文" },
]);

const SUPPORTED_LANGUAGES = new Set(DISCOVER_LANGUAGE_OPTIONS.map(({ id }) => id));
const VIEW_RADIUS_METRES = Object.freeze({ nearby: 3000, ahead: 10000, region: 10000 });

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function normalizeDiscoverLanguage(value) {
  const primary = String(value ?? "").trim().toLowerCase().split("-")[0];
  return SUPPORTED_LANGUAGES.has(primary) ? primary : null;
}

export function discoverPreferredLanguage(languages = []) {
  for (const value of Array.isArray(languages) ? languages : [languages]) {
    const language = normalizeDiscoverLanguage(value);
    if (language) return language;
  }
  return "en";
}

export function quantizeDiscoverPosition(position, stepDegrees = 0.05) {
  const latitude = Number(position?.latitude);
  const longitude = Number(position?.longitude);
  const step = Math.abs(Number(stepDegrees));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(step) || step === 0) return null;
  const precision = Math.min(8, String(step).split(".")[1]?.length ?? 0);
  return {
    latitude: Number((Math.round(latitude / step) * step).toFixed(precision)),
    longitude: Number((Math.round(longitude / step) * step).toFixed(precision)),
  };
}

export function discoverWikipediaUrl(position, { language = "en", view = "nearby", requestLimit = 25 } = {}) {
  const quantized = quantizeDiscoverPosition(position);
  const normalizedLanguage = normalizeDiscoverLanguage(language) ?? "en";
  if (!quantized) return null;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
    generator: "geosearch",
    ggscoord: `${quantized.latitude}|${quantized.longitude}`,
    ggsradius: String(VIEW_RADIUS_METRES[view] ?? VIEW_RADIUS_METRES.nearby),
    ggslimit: String(clamp(Math.round(Number(requestLimit) || 25), 1, 50)),
    ggsnamespace: "0",
    prop: "coordinates|extracts|info|pageimages",
    coprop: "type|dim|country|region|globe",
    exintro: "1",
    exlimit: "20",
    explaintext: "1",
    exsentences: "4",
    inprop: "url",
    piprop: "thumbnail",
    pilimit: "20",
    pithumbsize: "720",
    pilicense: "free",
  });
  return `https://${normalizedLanguage}.wikipedia.org/w/api.php?${params}`;
}

export function discoverWikipediaContinuationUrl(requestUrl, continuation) {
  if (!requestUrl || !continuation || typeof continuation !== "object") return null;
  const url = new URL(requestUrl);
  for (const [key, value] of Object.entries(continuation)) {
    if (!/^[a-z][a-z0-9_]*$/i.test(key) || !["string", "number"].includes(typeof value)) continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export function discoverWikipediaArticleUrl(title, { language = "en" } = {}) {
  const normalizedTitle = String(title ?? "").trim();
  const normalizedLanguage = normalizeDiscoverLanguage(language) ?? "en";
  if (!normalizedTitle) return null;
  const articlePath = encodeURIComponent(normalizedTitle.replace(/\s+/g, "_"))
    .replaceAll("%2F", "/");
  const params = new URLSearchParams({
    useskin: "minerva",
    minervanightmode: "1",
  });
  return `https://${normalizedLanguage}.wikipedia.org/wiki/${articlePath}?${params}`;
}

export function discoverVisibleResultCapacity(availableHeight, resultCount = DISCOVER_RESULT_LIMIT) {
  const normalizedCount = Math.max(0, Math.min(DISCOVER_RESULT_LIMIT, Math.floor(Number(resultCount) || 0)));
  if (!normalizedCount) return 0;
  const normalizedHeight = Number(availableHeight);
  if (!Number.isFinite(normalizedHeight) || normalizedHeight <= 0) {
    return Math.min(DISCOVER_INITIAL_VISIBLE_RESULTS, normalizedCount);
  }
  if (normalizedCount * DISCOVER_RESULT_ROW_HEIGHT <= normalizedHeight) return normalizedCount;
  const capacity = Math.floor((normalizedHeight - DISCOVER_MORE_ROW_HEIGHT) / DISCOVER_RESULT_ROW_HEIGHT);
  return Math.max(1, Math.min(normalizedCount - 1, capacity));
}

export function discoverDistanceMetres(origin, destination) {
  const firstLatitude = Number(origin?.latitude);
  const firstLongitude = Number(origin?.longitude);
  const secondLatitude = Number(destination?.latitude);
  const secondLongitude = Number(destination?.longitude);
  if (![firstLatitude, firstLongitude, secondLatitude, secondLongitude].every(Number.isFinite)) return null;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(secondLatitude - firstLatitude);
  const longitudeDelta = toRadians(secondLongitude - firstLongitude);
  const firstRadians = toRadians(firstLatitude);
  const secondRadians = toRadians(secondLatitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstRadians) * Math.cos(secondRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function discoverBearingDegrees(origin, destination) {
  const firstLatitude = Number(origin?.latitude);
  const firstLongitude = Number(origin?.longitude);
  const secondLatitude = Number(destination?.latitude);
  const secondLongitude = Number(destination?.longitude);
  if (![firstLatitude, firstLongitude, secondLatitude, secondLongitude].every(Number.isFinite)) return null;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeOne = toRadians(firstLatitude);
  const latitudeTwo = toRadians(secondLatitude);
  const longitudeDelta = toRadians(secondLongitude - firstLongitude);
  const y = Math.sin(longitudeDelta) * Math.cos(latitudeTwo);
  const x = Math.cos(latitudeOne) * Math.sin(latitudeTwo)
    - Math.sin(latitudeOne) * Math.cos(latitudeTwo) * Math.cos(longitudeDelta);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function discoverHeadingDelta(heading, bearing) {
  if (!Number.isFinite(Number(heading)) || !Number.isFinite(Number(bearing))) return null;
  return Math.abs(((Number(bearing) - Number(heading) + 540) % 360) - 180);
}

export function discoverEstimatedDrivingMinutes(distanceMetres) {
  if (!Number.isFinite(distanceMetres) || distanceMetres < 0) return null;
  const estimatedRoadKilometres = Math.max(0.2, (distanceMetres / 1000) * 1.28);
  return Math.max(1, Math.round((estimatedRoadKilometres / 24) * 60 + 1));
}

export function formatDiscoverDistance(distanceMetres) {
  if (!Number.isFinite(distanceMetres)) return "Distance unavailable";
  if (distanceMetres < 1000) return `${Math.max(10, Math.round(distanceMetres / 10) * 10)} m`;
  return `${(distanceMetres / 1000).toFixed(distanceMetres >= 10000 ? 0 : 1)} km`;
}

function safeThumbnail(page) {
  const source = String(page?.thumbnail?.source ?? "");
  if (source.startsWith("//")) return `https:${source}`;
  return /^https:\/\//i.test(source) ? source : "";
}

export function normalizeDiscoverPages(payload, origin, limit = DISCOVER_RESULT_LIMIT) {
  const pages = Array.isArray(payload?.query?.pages) ? payload.query.pages : [];
  return pages.flatMap((page) => {
    const coordinate = page?.coordinates?.find((item) => Number.isFinite(item?.lat) && Number.isFinite(item?.lon));
    if (!page?.title || !page?.fullurl || !coordinate) return [];
    const destination = { latitude: coordinate.lat, longitude: coordinate.lon };
    const distanceMetres = discoverDistanceMetres(origin, destination);
    return [{
      id: String(page.pageid),
      title: String(page.title),
      summary: String(page.extract ?? "").replace(/\s+/g, " ").trim(),
      url: String(page.fullurl),
      latitude: coordinate.lat,
      longitude: coordinate.lon,
      thumbnail: safeThumbnail(page),
      thumbnailWidth: Number.isFinite(page.thumbnail?.width) ? page.thumbnail.width : null,
      thumbnailHeight: Number.isFinite(page.thumbnail?.height) ? page.thumbnail.height : null,
      distanceMetres,
      distanceLabel: formatDiscoverDistance(distanceMetres),
      estimatedMinutes: discoverEstimatedDrivingMinutes(distanceMetres),
      bearing: discoverBearingDegrees(origin, destination),
    }];
  }).sort((first, second) => (first.distanceMetres ?? Infinity) - (second.distanceMetres ?? Infinity))
    .slice(0, Math.max(1, Math.min(DISCOVER_RESULT_LIMIT, Number(limit) || DISCOVER_RESULT_LIMIT)));
}

export function discoverViewPages(pages, { view = "nearby", heading = null } = {}) {
  const candidates = Array.isArray(pages) ? [...pages] : [];
  if (view !== "ahead" || !Number.isFinite(Number(heading))) return candidates;
  const ranked = candidates.map((page) => ({
    page,
    delta: discoverHeadingDelta(heading, page.bearing),
  })).sort((first, second) => (first.delta ?? Infinity) - (second.delta ?? Infinity)
    || (first.page.distanceMetres ?? Infinity) - (second.page.distanceMetres ?? Infinity));
  const forward = ranked.filter(({ delta }) => delta != null && delta <= 75).map(({ page }) => page);
  return forward.length >= 3 ? forward : ranked.map(({ page }) => page);
}

export function filterDiscoverPages(pages, query) {
  const needle = String(query ?? "").trim().toLocaleLowerCase();
  if (!needle) return Array.isArray(pages) ? pages : [];
  return (Array.isArray(pages) ? pages : []).filter((page) => (
    `${page.title} ${page.summary}`.toLocaleLowerCase().includes(needle)
  ));
}

export function discoverGoogleMapsUrl(place) {
  if (!Number.isFinite(place?.latitude) || !Number.isFinite(place?.longitude)) return null;
  const params = new URLSearchParams({
    api: "1",
    query: `${place.latitude},${place.longitude}`,
    utm_source: "sedicivalvole",
    utm_campaign: "discover_place",
  });
  return `https://www.google.com/maps/search/?${params}`;
}
