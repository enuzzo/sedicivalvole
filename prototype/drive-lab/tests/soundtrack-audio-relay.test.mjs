import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough, Readable } from "node:stream";
import test from "node:test";
import {
  createJamendoAudioRegistry,
  handleJamendoAudioRelay,
  SOUNDTRACK_AUDIO_ROUTE,
} from "../server/jamendo-audio-relay.mjs";

const track = (id, licence = "by-nc-sa") => ({
  id: String(id),
  name: `Track ${id}`,
  artist_id: `artist-${id}`,
  artist_name: `Artist ${id}`,
  album_name: `Album ${id}`,
  license_ccurl: `https://creativecommons.org/licenses/${licence}/4.0/`,
  audio: `https://prod-1.storage.jamendo.com/?trackid=${id}&format=mp32`,
  shareurl: `https://www.jamendo.com/track/${id}`,
  image: `https://usercontent.jamendo.com?type=album&id=${id}&width=300`,
});

class FakeRequest extends EventEmitter {
  constructor({ method = "GET", url = `${SOUNDTRACK_AUDIO_ROUTE}?track=1`, headers = {} } = {}) {
    super();
    this.method = method;
    this.url = url;
    this.headers = headers;
    this.aborted = false;
  }
}

class FakeResponse extends PassThrough {
  constructor() {
    super();
    this.statusCode = 200;
    this.headersSent = false;
    this.headers = new Map();
  }

  setHeader(name, value) {
    this.headers.set(name.toLowerCase(), String(value));
  }
}

const readResponse = async (response) => {
  const chunks = [];
  for await (const chunk of response) chunks.push(chunk);
  return Buffer.concat(chunks);
};

test("the relay registry admits only effect-compatible catalog entries and expires them", () => {
  let clock = 1_000;
  const registry = createJamendoAudioRegistry({ nowMs: () => clock, ttlMs: 100 });
  registry.admitCatalog({ tracks: [track(1), track(2, "by-nc-nd")] });

  assert.match(registry.resolve("1"), /^https:\/\/prod-1\.storage\.jamendo\.com\//);
  assert.equal(registry.resolve("2"), null);
  assert.equal(registry.resolve("not-an-id"), null);
  clock += 101;
  assert.equal(registry.resolve("1"), null);
});

test("the relay forwards a bounded byte range without buffering or persistent cache headers", async () => {
  const registry = createJamendoAudioRegistry();
  registry.admitCatalog({ tracks: [track(1)] });
  const request = new FakeRequest({ headers: { range: "bytes=100-199" } });
  const response = new FakeResponse();
  let upstreamOptions = null;
  const responseBody = readResponse(response);

  await handleJamendoAudioRelay({
    request,
    response,
    registry,
    fetchImpl: async (url, options) => {
      upstreamOptions = { url: String(url), options };
      return {
        ok: true,
        status: 206,
        url: "https://prod-1.storage.jamendo.com/final.mp3",
        headers: new Headers({
          "content-type": "audio/mpeg",
          "content-length": "4",
          "content-range": "bytes 100-103/1000",
        }),
        body: Readable.toWeb(Readable.from([Buffer.from("test")])),
      };
    },
  });

  assert.match(upstreamOptions.url, /^https:\/\/prod-1\.storage\.jamendo\.com\//);
  assert.equal(upstreamOptions.options.headers.Range, "bytes=100-199");
  assert.equal(response.statusCode, 206);
  assert.equal(response.headers.get("content-range"), "bytes 100-103/1000");
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal((await responseBody).toString(), "test");
});

test("unknown tracks and mutation methods never reach the upstream", async () => {
  const registry = createJamendoAudioRegistry();
  let calls = 0;
  for (const request of [
    new FakeRequest({ url: `${SOUNDTRACK_AUDIO_ROUTE}?track=999` }),
    new FakeRequest({ method: "POST" }),
  ]) {
    const response = new FakeResponse();
    const body = readResponse(response);
    await handleJamendoAudioRelay({
      request,
      response,
      registry,
      fetchImpl: async () => { calls += 1; },
    });
    await body;
    assert.ok([404, 405].includes(response.statusCode));
  }
  assert.equal(calls, 0);
});
