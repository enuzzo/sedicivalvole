import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTerrainElevation, terrainElevationCell, TERRAIN_CACHE_LIMIT,
  TERRAIN_REQUEST_INTERVAL_MS, TERRAIN_REQUEST_TIMEOUT_MS, TERRAIN_RECOVERY_WINDOW_MS,
} from '../src/environments/atlas/terrain-elevation.js';
import { normalizeOpenMeteoElevation } from '../src/environments/atlas/atlas-model.js';

const point = (latitude = 45.46421, longitude = 9.19003) => ({ latitude, longitude });
const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };

function harness({ cooperativeAbort = true, autoReply = null, initiallyOnline = true } = {}) {
  let time = 0, nextTimer = 0, online = initiallyOnline, activeRequests = 0, maximumActive = 0;
  const timers = new Map(), requests = [], results = [];
  const fetchImpl = (url, options) => new Promise((resolve, reject) => {
    activeRequests += 1; maximumActive = Math.max(maximumActive, activeRequests);
    const request = { url, options, at: time, settled: false,
      reply(payload = { elevation: [122] }, ok = true) {
        if (request.settled) return;
        request.settled = true; activeRequests -= 1;
        resolve({ ok, json: async () => payload });
      },
      fail() {
        if (request.settled) return;
        request.settled = true; activeRequests -= 1; reject(new Error('offline'));
      },
    };
    requests.push(request);
    if (cooperativeAbort) options.signal.addEventListener('abort', request.fail, { once: true });
    if (autoReply) autoReply(request, requests.length);
  });
  const controller = createTerrainElevation({ fetchImpl, now: () => time,
    setTimer: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, at: time + delay }); return id; },
    clearTimer: id => timers.delete(id), canRequest: () => online, onResult: result => results.push(result),
  });
  return { controller, requests, results, timers, setOnline: value => { online = value; },
    maximumActive: () => maximumActive,
    async advance(ms) {
      const target = time + ms;
      await flush();
      for (let safety = 0; safety < 1000; safety += 1) {
        const next = [...timers.entries()].filter(([, task]) => task.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) { time = target; await flush(); return; }
        const [id, task] = next; timers.delete(id); time = task.at; task.callback(); await flush();
      }
      assert.fail('timer loop exceeded its bound');
    },
  };
}

test('terrain cells use only finite geographic inputs and the existing 0.01-degree precision', () => {
  assert.equal(terrainElevationCell(point()), '45.46,9.19');
  assert.equal(terrainElevationCell(point(45.46301, 9.194)), '45.46,9.19');
  assert.equal(terrainElevationCell(point(-0.001, -0.001)), '0.00,0.00');
  assert.equal(terrainElevationCell(point(90, 180)), '90.00,180.00');
  for (const position of [null, {}, point('45.46'), point(Infinity), point(91), point(45, -181)]) {
    assert.equal(terrainElevationCell(position), null);
  }
});

test('elevation payloads preserve real zero and never coerce missing or string values into heights', () => {
  for (const value of [null, false, '', '120', undefined, Infinity, -501, 9001]) {
    assert.equal(normalizeOpenMeteoElevation({ elevation: [value] }), null);
  }
  for (const value of [0, -500, 120.5, 9000]) assert.equal(normalizeOpenMeteoElevation({ elevation: [value] }), value);
});

test('accepted terrain is cached for its exact coarse cell without sending a precise GPS fix', async () => {
  const h = harness();
  assert.deepEqual(h.controller.observe(point()), { cell: '45.46,9.19', elevationM: null, status: 'loading' });
  await flush();
  assert.equal(h.requests.length, 1);
  const url = new URL(h.requests[0].url);
  assert.equal(url.origin, 'https://api.open-meteo.com'); assert.equal(url.pathname, '/v1/elevation');
  assert.deepEqual([...url.searchParams], [['latitude', '45.46'], ['longitude', '9.19']]);
  assert.equal(h.requests[0].options.credentials, 'omit');
  assert.equal(h.requests[0].options.referrerPolicy, 'no-referrer');
  h.requests[0].reply(); await flush();
  assert.deepEqual(h.results, [{ cell: '45.46,9.19', elevationM: 122, status: 'live' }]);
  for (let i = 0; i < 10; i += 1) assert.equal(h.controller.observe(point(45.463, 9.194)).elevationM, 122);
  assert.deepEqual(h.controller.lookup(point(45.48)), { cell: '45.48,9.19', elevationM: null, status: 'unavailable' });
  await h.advance(90000); assert.equal(h.requests.length, 1); assert.equal(h.timers.size, 0);
  h.controller.destroy();
});

test('cell changes keep only the latest wanted request and reject late results without overlapping fetches', async () => {
  const h = harness({ cooperativeAbort: false });
  h.controller.observe(point()); await flush();
  h.controller.observe(point(45.48)); h.controller.observe(point(45.50));
  assert.equal(h.requests[0].options.signal.aborted, true);
  await h.advance(TERRAIN_REQUEST_INTERVAL_MS);
  assert.equal(h.requests.length, 1);
  h.requests[0].reply({ elevation: [999] }); await flush();
  assert.equal(h.results.length, 0); assert.equal(h.controller.lookup(point()).elevationM, null);
  assert.equal(h.requests.length, 2);
  assert.equal(new URL(h.requests[1].url).searchParams.get('latitude'), '45.5');
  h.requests[1].reply({ elevation: [125] }); await flush();
  assert.deepEqual(h.results, [{ cell: '45.50,9.19', elevationM: 125, status: 'live' }]);
  assert.equal(h.maximumActive(), 1); h.controller.destroy();
});

test('returning GPS altitude cancels terrain work and a late terrain result cannot overwrite it', async () => {
  const h = harness({ cooperativeAbort: false });
  h.controller.observe(point()); await flush();
  assert.equal(h.controller.observe(point(), { needed: false }).status, 'unavailable');
  assert.equal(h.requests[0].options.signal.aborted, true);
  h.requests[0].reply(); await flush(); await h.advance(600000);
  assert.equal(h.results.length, 0); assert.equal(h.requests.length, 1); assert.equal(h.timers.size, 0);
  h.controller.observe(point(), { needed: false }); await flush(); assert.equal(h.requests.length, 1);
  h.controller.observe(point()); await flush(); assert.equal(h.requests.length, 2);
  h.controller.destroy();
});

test('requests time out after eight seconds and retry only after the bounded cooldown', async () => {
  const h = harness(); h.controller.observe(point()); await flush();
  await h.advance(TERRAIN_REQUEST_TIMEOUT_MS);
  assert.equal(h.requests[0].options.signal.aborted, true);
  assert.equal(h.controller.lookup(point()).status, 'retrying');
  await h.advance(TERRAIN_REQUEST_INTERVAL_MS - 1); assert.equal(h.requests.length, 1);
  await h.advance(1); assert.equal(h.requests.length, 2);
  h.requests[1].reply({ elevation: [0] }); await flush();
  assert.equal(h.controller.lookup(point()).elevationM, 0);
  assert.equal(h.maximumActive(), 1); h.controller.destroy();
});

test('malformed or failing responses recover for several minutes then stop until explicit recovery', async () => {
  const h = harness({ autoReply: request => request.reply({ elevation: [null] }) });
  h.controller.observe(point()); await flush(); await h.advance(TERRAIN_RECOVERY_WINDOW_MS + 1);
  assert.equal(h.results.length, 0); assert.equal(h.controller.lookup(point()).elevationM, null);
  assert.equal(h.controller.lookup(point()).status, 'unavailable');
  assert.equal(h.requests.length, 6); assert.equal(h.timers.size, 0);
  for (let i = 1; i < h.requests.length; i += 1) assert.ok(h.requests[i].at - h.requests[i - 1].at >= TERRAIN_REQUEST_INTERVAL_MS);
  h.controller.observe(point()); await h.advance(600000); assert.equal(h.requests.length, 6);
  h.controller.recover(); await flush(); assert.equal(h.requests.length, 7);
  h.controller.destroy();
});

test('offline and paused sessions make no periodic requests and recover only the current wanted cell', async () => {
  const h = harness({ initiallyOnline: false });
  assert.equal(h.controller.observe(point()).status, 'waiting');
  await h.advance(600000); assert.equal(h.requests.length, 0); assert.equal(h.timers.size, 0);
  h.setOnline(true); h.controller.recover(); await flush(); assert.equal(h.requests.length, 1);
  h.controller.pause(); await flush(); h.controller.observe(point(45.50));
  await h.advance(600000); assert.equal(h.requests.length, 1); assert.equal(h.timers.size, 0);
  h.controller.recover(); await flush(); assert.equal(h.requests.length, 2);
  h.requests[1].reply(); await flush();
  assert.equal(h.results[0].cell, '45.50,9.19'); assert.equal(h.maximumActive(), 1);
  h.controller.destroy();
});

test('a result arriving after connectivity permission changes is not accepted or relabeled', async () => {
  const h = harness(); h.controller.observe(point()); await flush(); h.setOnline(false);
  h.requests[0].reply(); await flush();
  assert.equal(h.results.length, 0); assert.equal(h.controller.lookup(point()).status, 'waiting');
  h.setOnline(true); h.controller.recover(); await h.advance(TERRAIN_REQUEST_INTERVAL_MS);
  assert.equal(h.requests.length, 2); h.requests[1].reply(); await flush();
  assert.equal(h.results.length, 1); h.controller.destroy();
});

test('the session cache evicts old cells at 128 entries and destruction releases all cached terrain', async () => {
  const h = harness({ autoReply: (request, index) => request.reply({ elevation: [100 + index] }) });
  for (let i = 0; i <= TERRAIN_CACHE_LIMIT; i += 1) {
    h.controller.observe(point(40 + i * 0.02)); await flush();
    await h.advance(TERRAIN_REQUEST_INTERVAL_MS);
  }
  assert.equal(h.requests.length, TERRAIN_CACHE_LIMIT + 1);
  assert.equal(h.controller.lookup(point(40)).elevationM, null);
  assert.equal(h.controller.lookup(point(40.02)).elevationM, 102);
  assert.equal(h.maximumActive(), 1);
  h.controller.destroy();
  assert.equal(h.controller.lookup(point(40.02)).elevationM, null);
  h.controller.recover(); h.controller.observe(point(40)); await h.advance(600000);
  assert.equal(h.requests.length, TERRAIN_CACHE_LIMIT + 1); assert.equal(h.timers.size, 0);
});

test('invalid position and destruction cancel an in-flight request without accepting a late result', async () => {
  const h = harness({ cooperativeAbort: false });
  h.controller.observe(point()); await flush();
  assert.deepEqual(h.controller.observe(null), { cell: null, elevationM: null, status: 'unavailable' });
  assert.equal(h.requests[0].options.signal.aborted, true);
  h.controller.destroy(); h.requests[0].reply(); await flush(); await h.advance(600000);
  assert.equal(h.results.length, 0); assert.equal(h.requests.length, 1); assert.equal(h.timers.size, 0);
});
