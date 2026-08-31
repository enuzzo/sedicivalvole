import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  allowsSoundtrackEffects,
  evaluateJamendoTrack,
} from "../src/soundtrack/source-policy.js";

export const SOUNDTRACK_AUDIO_ROUTE = "/api/soundtrack-audio.php";
export const JAMENDO_AUDIO_SOURCE_TTL_MS = 10 * 60_000;

const TRACK_ID = /^\d{1,20}$/;
const BYTE_RANGE = /^bytes=\d*-\d*$/i;

const trustedJamendoAudioUrl = (value) => {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:"
      && (host === "jamendo.com" || host.endsWith(".jamendo.com"))
      ? url
      : null;
  } catch {
    return null;
  }
};

const safeHeader = (headers, name, pattern = null) => {
  const value = headers?.get?.(name);
  if (!value || (pattern && !pattern.test(value))) return null;
  return value;
};

const writeRelayError = (response, statusCode, status) => {
  if (response.headersSent) {
    response.destroy?.();
    return;
  }
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(JSON.stringify({ ok: false, status }));
};

export function createJamendoAudioRegistry({
  nowMs = Date.now,
  ttlMs = JAMENDO_AUDIO_SOURCE_TTL_MS,
} = {}) {
  const sources = new Map();

  const purge = () => {
    const now = nowMs();
    for (const [id, source] of sources) {
      if (source.expiresAtMs <= now) sources.delete(id);
    }
  };

  return Object.freeze({
    admitCatalog(payload) {
      purge();
      for (const track of Array.isArray(payload?.tracks) ? payload.tracks : []) {
        const policy = evaluateJamendoTrack(track);
        if (!allowsSoundtrackEffects(policy)) continue;
        sources.set(policy.item.id, Object.freeze({
          url: policy.item.streamUrl,
          expiresAtMs: nowMs() + ttlMs,
        }));
      }
    },
    resolve(trackId) {
      purge();
      const id = typeof trackId === "string" ? trackId.trim() : "";
      if (!TRACK_ID.test(id)) return null;
      return sources.get(id)?.url ?? null;
    },
    clear() {
      sources.clear();
    },
  });
}

export async function handleJamendoAudioRelay({
  request,
  response,
  registry,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!request || !response || !registry || typeof fetchImpl !== "function") {
    throw new Error("jamendo-audio-relay-invalid-boundary");
  }
  if (!["GET", "HEAD"].includes(request.method)) {
    response.setHeader("Allow", "GET, HEAD");
    writeRelayError(response, 405, "method_not_allowed");
    return;
  }

  const requestUrl = new URL(request.url ?? SOUNDTRACK_AUDIO_ROUTE, "http://localhost");
  const sourceValue = registry.resolve(requestUrl.searchParams.get("track"));
  const sourceUrl = trustedJamendoAudioUrl(sourceValue);
  if (!sourceUrl) {
    writeRelayError(response, 404, "track_not_admitted");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const abort = () => controller.abort();
  request.once?.("aborted", abort);
  try {
    const range = typeof request.headers?.range === "string" && BYTE_RANGE.test(request.headers.range)
      ? request.headers.range
      : null;
    const upstream = await fetchImpl(sourceUrl, {
      method: request.method,
      headers: {
        Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.1",
        ...(range ? { Range: range } : {}),
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const finalUrl = trustedJamendoAudioUrl(upstream.url || sourceUrl.href);
    if (!upstream.ok || !finalUrl || (request.method === "GET" && !upstream.body)) {
      writeRelayError(response, 502, "audio_upstream_unavailable");
      return;
    }

    response.statusCode = upstream.status === 206 ? 206 : 200;
    response.setHeader("Content-Type", safeHeader(upstream.headers, "content-type", /^audio\//i) || "audio/mpeg");
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.setHeader("Accept-Ranges", "bytes");
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    response.setHeader("X-Content-Type-Options", "nosniff");
    const contentLength = safeHeader(upstream.headers, "content-length", /^\d+$/);
    const contentRange = safeHeader(upstream.headers, "content-range", /^bytes\s+\d+-\d+\/\d+$/i);
    if (contentLength) response.setHeader("Content-Length", contentLength);
    if (contentRange) response.setHeader("Content-Range", contentRange);
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    await pipeline(Readable.fromWeb(upstream.body), response, { signal: controller.signal });
  } catch (error) {
    const clientClosed = request.aborted === true || response.destroyed === true;
    if (!clientClosed) {
      writeRelayError(
        response,
        502,
        error?.name === "AbortError" ? "audio_upstream_timeout" : "audio_upstream_unavailable",
      );
    }
  } finally {
    clearTimeout(timeout);
    request.removeListener?.("aborted", abort);
  }
}
