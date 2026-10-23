import test from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createVedutaBuildQueue } from '../src/environments/veduta/veduta-build.js';
import { bakeVedutaGeometry, createVedutaGeometryBaker } from '../src/environments/veduta/veduta-geometry.js';
import { createVedutaSceneryJob, disposeVedutaTree } from '../src/environments/veduta/veduta-layer.js';

function harness() {
  const callbacks = new Map(), errors = []; let id = 0, clock = 0, visible = true;
  const queue = createVedutaBuildQueue({ schedule: fn => { callbacks.set(++id, fn); return id; },
    cancel: handle => callbacks.delete(handle), now: () => clock++, visible: () => visible,
    onError: error => errors.push(error), budgetMs: 3 });
  return { queue, callbacks, errors, hide: () => { visible = false; },
    tick(deadline) { const [key, fn] = callbacks.entries().next().value ?? []; if (!fn) return false; callbacks.delete(key); fn(deadline); return true; } };
}
const microtasks = async () => { await Promise.resolve(); await Promise.resolve(); };

test('finite scenery work yields within its budget and never polls a pending worker', async () => {
  const h = harness(); let release, units = 0, committed = null;
  const pending = new Promise(resolve => { release = resolve; });
  h.queue.start(function* () { for (let i = 0; i < 10; i++) { units++; yield; } return yield pending; },
    { valid: () => true, commit: value => { committed = value; } });
  h.tick(); assert.ok(units > 0 && units < 10); assert.equal(h.callbacks.size, 1);
  while (h.tick()) {} assert.equal(units, 10); assert.equal(committed, null); assert.equal(h.callbacks.size, 0);
  release('complete'); await microtasks(); assert.equal(h.callbacks.size, 1);
  h.tick(); assert.equal(committed, 'complete'); assert.equal(h.callbacks.size, 0); assert.deepEqual(h.errors, []);
});

test('hidden, superseded and removed jobs dispose once and ignore late worker completion', async () => {
  for (const action of ['hide', 'supersede', 'remove']) {
    const h = harness(); let release, cleaned = 0, commits = 0, aborted = false;
    h.queue.start(function* (signal) {
      signal.addEventListener('abort', () => { aborted = true; });
      try { yield new Promise(resolve => { release = resolve; }); } finally { cleaned++; }
    }, { valid: () => true, commit: () => commits++ });
    h.tick();
    if (action === 'hide') { h.hide(); h.queue.cancel(); }
    if (action === 'remove') h.queue.dispose();
    if (action === 'supersede') h.queue.start(function* () { return 1; }, { valid: () => true, commit: () => commits++ });
    release('late'); await microtasks(); while (h.tick()) {}
    assert.equal(cleaned, 1); assert.equal(aborted, true); assert.equal(commits, action === 'supersede' ? 1 : 0); assert.deepEqual(h.errors, []);
  }
});

test('a failed promise or commit releases job ownership and reports one error', async () => {
  for (const phase of ['promise', 'commit']) {
    const h = harness(); let discarded = 0;
    h.queue.start(function* () { if (phase === 'promise') yield Promise.reject(new Error('worker')); return 1; },
      { valid: () => true, discard: () => discarded++, commit: () => { throw new Error('commit'); } });
    h.tick(); await microtasks(); assert.equal(discarded, 1); assert.equal(h.errors.length, 1); assert.equal(h.callbacks.size, 0);
  }
});

test('worker bake preserves the pinned merged normals and edge arrays exactly', () => {
  const merged = new THREE.BufferGeometry();
  const a = new THREE.BoxGeometry(12, 9, 8).toNonIndexed(), b = new THREE.BoxGeometry(5, 7, 4).toNonIndexed().translate(3, 8, 7);
  const position = new Float32Array([...a.attributes.position.array, ...b.attributes.position.array]);
  merged.setAttribute('position', new THREE.BufferAttribute(position, 3)); merged.computeVertexNormals();
  const edges = new THREE.EdgesGeometry(merged, 25);
  const result = bakeVedutaGeometry(position.slice(), true);
  assert.deepEqual(result.position, position); assert.deepEqual(result.normal, merged.attributes.normal.array);
  merged.computeBoundingSphere(); edges.computeBoundingSphere();
  assert.deepEqual(result.bounds, { centre: merged.boundingSphere.center.toArray(), radius: merged.boundingSphere.radius });
  assert.deepEqual(result.edgeBounds, { centre: edges.boundingSphere.center.toArray(), radius: edges.boundingSphere.radius });
  assert.deepEqual(result.edges, edges.attributes.position.array); assert.equal(bakeVedutaGeometry(position.slice(), false).edges, null);
  for (const geometry of [a, b, merged, edges]) geometry.dispose();
});

test('worker bridge transfers arrays, rejects aborted work and fails future work after worker failure', async () => {
  const worker = { sent: [], postMessage(message, transfer) { this.sent.push({ message, transfer }); }, terminate() { this.terminated = true; } };
  const baker = createVedutaGeometryBaker(worker), abort = new AbortController();
  const data = new Float32Array(9), pending = baker.bake(data, true, abort.signal);
  assert.equal(worker.sent[0].transfer[0], data.buffer); const late = worker.onmessage;
  const rejected = assert.rejects(pending, { name: 'AbortError' }); abort.abort(); await rejected;
  late({ data: { id: 1, result: {} } });
  const pending2 = baker.bake(new Float32Array(9), false); const rejected2 = assert.rejects(pending2, /unavailable/);
  worker.onmessageerror(); await rejected2; await assert.rejects(baker.bake(new Float32Array(9), false), /unavailable/);
  baker.dispose(); assert.equal(worker.terminated, true); late({ data: { id: 2, result: {} } });
});

const world = 40075016.68557849;
const maplibre = { MercatorCoordinate: { fromLngLat([lng, lat]) { return { x: (lng + 180) / 360, y: (1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / Math.PI) / 2, meterInMercatorCoordinateUnits: () => 1 / (world * Math.cos(lat * Math.PI / 180)) }; } } };
function fixture(style) {
  const point = { longitude: 8.96, latitude: 46.0 }, origin = maplibre.MercatorCoordinate.fromLngLat([point.longitude, point.latitude]);
  const ring = (x, y, size) => [[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]];
  const polygon = (id, rings, properties) => ({ id, properties, geometry: { type: 'Polygon', coordinates: rings } });
  const sources = {
    building: [polygon(1, [ring(8.9601, 46.0001, .00012)], { render_height: 8 }), polygon(2, [ring(8.9604, 46.0002, .0003), ring(8.9605, 46.0003, .00006)], { render_height: 17, render_min_height: 2 })],
    landcover: [polygon(3, [ring(8.957, 45.997, .006)], { class: 'wood' })], park: [],
    landuse: [polygon(4, [ring(8.959, 45.999, .0004)], { class: 'pitch' })],
    transportation: [{ properties: { class: 'primary' }, geometry: { type: 'LineString', coordinates: [[8.957,46], [8.963,46]] } }],
  };
  const map = { querySourceFeatures: (_, { sourceLayer }) => sources[sourceLayer], queryTerrainElevation: ([lng, lat]) => 300 + (lng - 8.96) * 40 + (lat - 46) * 30 };
  const materials = new Map(), retainedMaterials = new Set();
  return { map, maplibre, point, origin, scale: origin.meterInMercatorCoordinateUnits(), style, retainedMaterials,
    worldMaterial: (role, medium, make) => { const key = `${role}:${medium}`; if (!materials.has(key)) { const value = make(); materials.set(key, value); retainedMaterials.add(value); } return materials.get(key); },
    bakeGeometry: async (position, edges) => bakeVedutaGeometry(position, edges) };
}
function fingerprint(group) {
  return group.children.map(object => ({ type: object.type, count: object.count,
    attributes: Object.fromEntries(Object.entries(object.geometry.attributes).map(([key, value]) => [key, Array.from(value.array)])),
    index: object.geometry.index ? Array.from(object.geometry.index.array) : null,
    matrices: object.instanceMatrix ? Array.from(object.instanceMatrix.array) : null,
    colors: object.instanceColor ? Array.from(object.instanceColor.array) : null }));
}
async function buildDirect(config) {
  const job = createVedutaSceneryJob(config, new AbortController().signal); let input;
  for (;;) { const step = job.next(input); if (step.done) return step.value; input = await step.value; }
}

test('single-unit and large scenery slices produce identical mesh, edge and tree buffers in every medium', async () => {
  for (const style of ['Anime', 'Manga', 'Watercolor']) {
    const directConfig = fixture(style), slicedConfig = fixture(style), direct = await buildDirect(directConfig);
    const h = harness(); let sliced;
    h.queue.start(signal => createVedutaSceneryJob(slicedConfig, signal), { valid: () => true, commit: value => { sliced = value; } });
    for (let i = 0; i < 10000 && !sliced; i++) { h.tick(); await microtasks(); }
    // Independently extracted from the original synchronous 4969ee2 builder.
    const originalHashes = { Anime: '2c470273650760cfb728156fb378ab06fbcd50efe0191a511d39f5ed122b49d2',
      Manga: 'b026ef9532376dae9e3ddd727ba5d87c2862d0a93380627011ef61d0db9f1013',
      Watercolor: 'd48c738e52901d45338f16db3acb21b92ce02c761ddad169cfdb93239a9dfc84' };
    assert.equal(createHash('sha256').update(JSON.stringify(fingerprint(direct.group))).digest('hex'), originalHashes[style]);
    assert.ok(sliced); assert.deepEqual(h.errors, []); assert.deepEqual(fingerprint(sliced.group), fingerprint(direct.group));
    assert.ok(sliced.group.children.some(object => object.isInstancedMesh && object.count > 100));
    for (const [value, config] of [[sliced, slicedConfig], [direct, directConfig]]) { disposeVedutaTree(value.group, config.retainedMaterials); config.retainedMaterials.forEach(material => material.dispose()); }
  }
});

test('cancelling during tree population frees partial instance geometry without disposing cached paints', async () => {
  const config = fixture('Anime'), job = createVedutaSceneryJob(config, new AbortController().signal);
  let created = 0, released = 0, materialReleased = 0, input;
  const original = THREE.InstancedMesh.prototype.setMatrixAt;
  THREE.InstancedMesh.prototype.setMatrixAt = function (...args) {
    if (!this.userData.observed) { this.userData.observed = true; created++; this.geometry.addEventListener('dispose', () => released++); this.material.addEventListener('dispose', () => materialReleased++); }
    return original.apply(this, args);
  };
  try {
    for (let i = 0; i < 10000; i++) { const step = job.next(input); input = await step.value; if (created === 2) break; assert.equal(step.done, false); }
    job.return(); assert.equal(created, 2); assert.equal(released, 2); assert.equal(materialReleased, 0);
  } finally { THREE.InstancedMesh.prototype.setMatrixAt = original; config.retainedMaterials.forEach(material => material.dispose()); }
});

test('timed-out idle callbacks make bounded progress even when the browser reports zero idle time', () => {
  const h = harness(); let units = 0;
  h.queue.start(function* () { while (units < 100) { units++; yield; } }, { valid: () => true, commit() {} });
  h.tick({ didTimeout: true, timeRemaining: () => 0 });
  assert.ok(units > 1 && units < 10, `${units} units within the soft CPU budget`); h.queue.dispose();
});
