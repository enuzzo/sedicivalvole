import { fetchJamendoCatalog } from "../server/jamendo-catalog-core.mjs";

const ROUTE = "/api/soundtrack-catalog.json";

const writeJson = (response, statusCode, payload) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "same-origin");
  response.end(JSON.stringify(payload));
};

export function jamendoCatalogDevServer({ clientId }) {
  return {
    name: "sedicivalvole:jamendo-catalog-dev-server",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
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
          const payload = await fetchJamendoCatalog({
            clientId,
            limit: requestUrl.searchParams.get("limit"),
            offset: requestUrl.searchParams.get("offset"),
            signal: controller.signal,
          });
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
