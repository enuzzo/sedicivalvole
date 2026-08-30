export const SOUNDTRACK_CATALOG_API_SCHEMA = "sedicivalvole.soundtrack-catalog-api.v1";
export const JAMENDO_TRACKS_ENDPOINT = "https://api.jamendo.com/v3.0/tracks/";
export const DEFAULT_JAMENDO_RESULT_LIMIT = 24;
export const MAX_JAMENDO_RESULT_LIMIT = 50;

const asText = (value) => typeof value === "string" ? value.trim() : "";

const boundedInteger = (value, fallback, minimum, maximum) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(numeric)));
};

const normalizedGenres = (values) => [
  ...new Set((Array.isArray(values) ? values : [])
    .map((value) => asText(value).toLowerCase())
    .filter(Boolean)),
].slice(0, 24);

export function buildJamendoTracksUrl(clientId, {
  limit = DEFAULT_JAMENDO_RESULT_LIMIT,
  offset = 0,
} = {}) {
  const credential = asText(clientId);
  if (!credential) throw new Error("jamendo-client-id-unavailable");
  const url = new URL(JAMENDO_TRACKS_ENDPOINT);
  url.searchParams.set("client_id", credential);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(boundedInteger(
    limit,
    DEFAULT_JAMENDO_RESULT_LIMIT,
    3,
    MAX_JAMENDO_RESULT_LIMIT,
  )));
  url.searchParams.set("offset", String(boundedInteger(offset, 0, 0, 10000)));
  url.searchParams.set("include", "musicinfo");
  url.searchParams.set("audioformat", "mp32");
  url.searchParams.set("order", "popularity_total");
  return url;
}

function sanitizeTrack(track) {
  if (!track || typeof track !== "object" || Array.isArray(track)) return null;
  return Object.freeze({
    id: asText(track.id),
    name: asText(track.name),
    artist_id: asText(track.artist_id),
    artist_name: asText(track.artist_name),
    album_name: asText(track.album_name),
    license_ccurl: asText(track.license_ccurl),
    audio: asText(track.audio),
    shareurl: asText(track.shareurl),
    image: asText(track.image),
    musicinfo: Object.freeze({
      tags: Object.freeze({
        genres: Object.freeze(normalizedGenres(track.musicinfo?.tags?.genres)),
      }),
    }),
  });
}

export function sanitizeJamendoPayload(payload, { fetchedAt = new Date().toISOString() } = {}) {
  const upstreamStatus = asText(payload?.headers?.status).toLowerCase();
  if (upstreamStatus !== "success" || !Array.isArray(payload?.results)) {
    throw new Error("jamendo-upstream-payload-invalid");
  }
  const tracks = payload.results.map(sanitizeTrack).filter((track) => (
    track
    && track.id
    && track.name
    && track.artist_name
    && track.audio
    && track.shareurl
    && track.license_ccurl
  ));
  return Object.freeze({
    schema: SOUNDTRACK_CATALOG_API_SCHEMA,
    fetchedAt,
    source: "jamendo",
    providerCredit: "Provided by Jamendo",
    tracks: Object.freeze(tracks),
    returned: tracks.length,
    persistentAudioStorage: false,
    automaticPlayback: false,
  });
}

export async function fetchJamendoCatalog({
  clientId,
  fetchImpl = globalThis.fetch,
  limit = DEFAULT_JAMENDO_RESULT_LIMIT,
  offset = 0,
  signal,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("fetch-unavailable");
  const response = await fetchImpl(buildJamendoTracksUrl(clientId, { limit, offset }), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response?.ok) throw new Error("jamendo-upstream-http-error");
  return sanitizeJamendoPayload(await response.json());
}
