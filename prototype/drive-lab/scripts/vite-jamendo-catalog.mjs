import { fetchJamendoCatalog } from "../server/jamendo-catalog-core.mjs";
import {
  createJamendoAudioRegistry,
  handleJamendoAudioRelay,
  SOUNDTRACK_AUDIO_ROUTE,
} from "../server/jamendo-audio-relay.mjs";

const ROUTE = "/api/soundtrack-catalog.php";
const FRESH_METADATA_TTL_MS = 60_000;
const FALLBACK_METADATA_TTL_MS = 10 * 60_000;
const FIRST_PAGE_ATTEMPTS = 4;

const writeJson = (response, statusCode, payload) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "same-origin");
  response.end(JSON.stringify(payload));
};

const requestKey = ({ limit, offset }) => `${limit ?? ""}:${offset ?? ""}`;

export function createJamendoCatalogLoader({
  clientId,
  fetchCatalog = fetchJamendoCatalog,
  nowMs = Date.now,
  freshTtlMs = FRESH_METADATA_TTL_MS,
  fallbackTtlMs = FALLBACK_METADATA_TTL_MS,
} = {}) {
  let cached = null;

  return async ({ limit, offset, signal } = {}) => {
    const key = requestKey({ limit, offset });
    const ageMs = cached?.key === key ? nowMs() - cached.storedAtMs : Number.POSITIVE_INFINITY;
    if (cached && cached.key === key && ageMs <= freshTtlMs) return cached.payload;

    const requestCatalog = () => fetchCatalog({ clientId, limit, offset, signal });
    try {
      const firstPage = !Number.isFinite(Number(offset)) || Number(offset) === 0;
      const attempts = firstPage ? FIRST_PAGE_ATTEMPTS : 1;
      let payload = null;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        payload = await requestCatalog();
        if (payload.returned > 0) break;
      }

      if (payload.returned > 0) {
        cached = { key, payload, storedAtMs: nowMs() };
        return payload;
      }
      if (cached && cached.key === key && ageMs <= fallbackTtlMs) return cached.payload;
      return payload;
    } catch (error) {
      if (cached && cached.key === key && ageMs <= fallbackTtlMs) return cached.payload;
      throw error;
    }
  };
}

export function jamendoCatalogDevServer({ clientId }) {
  const loadCatalog = createJamendoCatalogLoader({ clientId });
  const audioRegistry = createJamendoAudioRegistry();
  return {
    name: "sedicivalvole:jamendo-catalog-dev-server",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        if (requestUrl.pathname === SOUNDTRACK_AUDIO_ROUTE) {
          await handleJamendoAudioRelay({ request, response, registry: audioRegistry });
          return undefined;
        }
        if (requestUrl.pathname !== ROUTE) return next();
        if (request.method !== "GET") {
          response.setHeader("Allow", "GET");
          writeJson(response, 405, { ok: false, status: "method_not_allowed" });
          return undefined;
        }
        if (!clientId) {
          writeJson(response, 503, { ok: false, status: "configuration_unavailable" });
          return undefined;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          const payload = await loadCatalog({
            limit: requestUrl.searchParams.get("limit"),
            offset: requestUrl.searchParams.get("offset"),
            signal: controller.signal,
          });
          audioRegistry.admitCatalog(payload);
          writeJson(response, 200, payload);
        } catch (error) {
          writeJson(response, 502, {
            ok: false,
            status: error?.name === "AbortError" ? "upstream_timeout" : "upstream_unavailable",
          });
        } finally {
          clearTimeout(timeout);
        }
        return undefined;
      });
    },
  };
}
