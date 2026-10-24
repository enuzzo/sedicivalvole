import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVedutaPreferences, createVedutaStyle, vedutaCamera, vedutaCameraCentre, vedutaRoofFacets, vedutaCounterClockwiseRing, vedutaPosition, vedutaStatus, pointInVedutaPolygon, vedutaDistanceToSegment, vedutaGridCoordinate, VEDUTA_STYLES } from '../src/environments/veduta/veduta-model.js';
import { createVedutaRepaintScheduler } from '../src/environments/veduta/veduta-repaint.js';
import { appendAtlasPositionSample, advanceAtlasFollowCamera } from '../src/environments/atlas/atlas-model.js';
import { createVedutaVehicle, disposeVedutaTree } from '../src/environments/veduta/veduta-layer.js';
import * as THREE from 'three';

test('network loss does not claim that fresh GPS has stopped', () => {
  const fresh = { heading: 90, stale: false };
  assert.equal(vedutaStatus({ online: false, terrain: true, point: fresh }), 'Offline · cached map');
  assert.match(vedutaStatus({ online: false, terrain: true, point: { ...fresh, stale: true } }), /position held/);
  assert.match(vedutaStatus({ online: true, terrain: true, point: { ...fresh, stale: true } }), /GPS interrupted/);
});
test('parked deferred work schedules one render at the earliest deadline and then idles', () => {
  let now = 100, rendered = 0, serial = 0;
  const timers = new Map();
  const clock = { now: () => now, visible: () => true, repaint: () => rendered++,
    setTimer: (fn, delay) => { const id = ++serial; timers.set(id, { fn, at: now + delay }); return id; }, clearTimer: id => timers.delete(id) };
  const schedule = createVedutaRepaintScheduler(clock);
  schedule.schedule(1800); schedule.schedule(250); schedule.schedule(1800);
  assert.equal(timers.size, 1); assert.equal([...timers.values()][0].at, 250);
  now = 250; const pending = [...timers.values()][0]; timers.clear(); pending.fn();
  assert.equal(rendered, 1); assert.equal(timers.size, 0);
  schedule.schedule(1800); assert.equal(timers.size, 1);
  schedule.dispose(); assert.equal(timers.size, 0); schedule.schedule(1900); assert.equal(timers.size, 0);
});
test('hidden deferred work neither wakes the GL context nor survives cancellation', () => {
  let visible = true, callback, cleared = false, renders = 0;
  const schedule = createVedutaRepaintScheduler({ repaint: () => renders++, visible: () => visible, now: () => 0,
    setTimer: fn => { callback = fn; return 1; }, clearTimer: () => { cleared = true; } });
  schedule.schedule(250); visible = false; schedule.cancel(); callback();
  assert.equal(cleared, true); assert.equal(renders, 0);
  visible = true; schedule.schedule(1800); callback(); assert.equal(renders, 1); schedule.dispose();
});

test('Veduta stores only allowlisted presentation choices, never geographic input', () => {
  assert.deepEqual(normalizeVedutaPreferences({ style: 'Manga', vehicle: 'model-y', color: 'red', latitude: 10 }), { style: 'Manga', vehicle: 'model-y', color: 'red' });
  assert.deepEqual(normalizeVedutaPreferences({ style: 'unknown', vehicle: 'unknown' }), { style: 'Anime', vehicle: 'point', color: 'white' });
});
test('illustrative media keep the existing geographic providers and source geometry', () => {
  for (const medium of VEDUTA_STYLES) {
    const style = createVedutaStyle(medium, {});
    assert.deepEqual(Object.keys(style.sources), ['openfreemap', 'veduta-terrain', 'veduta-shading']);
    assert.deepEqual(style.sources['veduta-shading'].tiles, style.sources['veduta-terrain'].tiles);
    assert.equal(style.terrain.exaggeration, 1);
    assert.ok(style.sources['veduta-terrain'].attribution.includes('Mapterhorn'));
    // No labels or POIs: the only symbols are text-free street-lamp icons.
    const symbols = style.layers.filter(layer => layer.type === 'symbol');
    assert.deepEqual(symbols.map(layer => layer.id), ['veduta-lamp-pools', 'veduta-lamp-heads']);
    assert.ok(symbols.every(layer => !layer.layout['text-field'] && layer.paint['icon-opacity'] === 0));
    assert.deepEqual(style.layers.find(layer => layer.id === 'veduta-buildings').paint['fill-extrusion-height'], ['coalesce', ['get', 'render_height'], 5]);
  }
  assert.notEqual(createVedutaStyle('Anime', {}).layers[0].paint['background-color'], createVedutaStyle('Manga', {}).layers[0].paint['background-color']);
});
test('GPS holds stale observations and never derives translation from speed', () => {
  assert.equal(vedutaPosition(null, [], 500), null);
  let samples = [];
  for (const [at, longitude, heading] of [[100, 179.999, 359], [300, -179.999, 1]]) samples = appendAtlasPositionSample(samples, { latitude: 46, longitude, heading, speedKmh: 62 }, at);
  const sample = vedutaPosition(null, samples, 300);
  assert.ok(Math.abs(sample.longitude) > 179.99);
  assert.ok(sample.heading < 2 || sample.heading > 358);
  const held = vedutaPosition(null, samples, 3000);
  assert.equal(held.stale, true); assert.equal(held.longitude, -179.999);
  assert.equal(vedutaPosition({ latitude: 46, longitude: 8, speedKmh: 130 }, [], 3000).longitude, 8);
});
test('follow composition remains 3D at the shared road ceiling and takes the short heading arc', () => {
  assert.deepEqual(vedutaCamera(130), vedutaCamera(260));
  assert.ok(vedutaCamera(130).zoom > 16);
  assert.equal(vedutaCamera(60).pitch, 73);
  const result = advanceAtlasFollowCamera({ longitude: 8, latitude: 46, bearing: 359, zoom: 17, pitch: 68 }, { longitude: 8, latitude: 46, bearing: 1, zoom: 17, pitch: 68 }, 16);
  assert.ok(result.bearing > 359 && result.bearing < 361);
});
test('decorative vegetation respects polygon holes and fixed global grid cells', () => {
  const outer = [[0,0],[10,0],[10,10],[0,10],[0,0]], hole = [[3,3],[7,3],[7,7],[3,7],[3,3]];
  assert.equal(pointInVedutaPolygon([1,1], [outer,hole]), true);
  assert.equal(pointInVedutaPolygon([5,5], [outer,hole]), false);
  assert.equal(pointInVedutaPolygon([11,5], [outer,hole]), false);
  assert.deepEqual(vedutaGridCoordinate(123456, 98765, 42), vedutaGridCoordinate(123456, 98765, 42));
});
test('vegetation road clearance covers segment interiors, endpoints and zero-length roads', () => {
  assert.equal(vedutaDistanceToSegment([5,3],[0,0],[10,0]),3);
  assert.equal(vedutaDistanceToSegment([-3,4],[0,0],[10,0]),5);
  assert.equal(vedutaDistanceToSegment([13,4],[0,0],[10,0]),5);
  assert.equal(vedutaDistanceToSegment([3,4],[0,0],[0,0]),5);
});
test('Highland, Model Y and the point have distinct original bounded geometry across media', () => {
  for (const medium of VEDUTA_STYLES) {
    const sedan = createVedutaVehicle('highland', 'white', medium), suv = createVedutaVehicle('model-y', 'blue', medium), point = createVedutaVehicle('point', 'red', medium);
    assert.ok(sedan.children.length > 8); assert.ok(suv.children.length > 8); assert.equal(point.children.length, 1);
    assert.equal(point.children[0].isPoints, true);
    assert.ok(suv.getObjectByName('cabin').position.z > sedan.getObjectByName('cabin').position.z);
    for (const vehicle of [sedan,suv,point]) vehicle.traverse(item => { item.geometry?.dispose(); item.material?.dispose(); });
  }
});
test('scene replacement releases instance buffers and geometry while retaining shared world materials', () => {
  const parent = new THREE.Group(), geometry = new THREE.BoxGeometry(), material = new THREE.MeshBasicMaterial();
  const instances = new THREE.InstancedMesh(geometry,material,2); parent.add(instances);
  let instanceDisposals=0, geometryDisposals=0, materialDisposals=0;
  instances.addEventListener('dispose',()=>instanceDisposals++);
  geometry.addEventListener('dispose',()=>geometryDisposals++);
  material.addEventListener('dispose',()=>materialDisposals++);
  disposeVedutaTree(parent,new Set([material]));
  assert.equal(instanceDisposals,1); assert.equal(geometryDisposals,1); assert.equal(materialDisposals,0);
  material.dispose(); assert.equal(materialDisposals,1);
});
test('camera look-ahead never mutates observed position and wraps the dateline', () => {
  const point = Object.freeze({ latitude: 46, longitude: 179.9999, heading: 90 });
  const target = vedutaCameraCentre(point);
  assert.equal(point.longitude, 179.9999); assert.ok(target.longitude < -179.99);
  assert.ok(Math.abs(target.latitude - point.latitude) < 0.00001);
  assert.deepEqual(vedutaCameraCentre({ latitude: 46, longitude: 8, heading: null }), { latitude: 46, longitude: 8 });
});
test('illustrative gables preserve simple footprint bounds and refuse concave roofs', () => {
  const ring = [[0,0],[10,0],[10,20],[0,20]], roof = vedutaRoofFacets(ring, 12);
  assert.equal(roof.halves.length, 2); assert.equal(roof.gables.length, 2);
  for (const point of roof.halves.flat()) { assert.ok(point[0] >= 0 && point[0] <= 10); assert.ok(point[1] >= 0 && point[1] <= 20); assert.ok(point[2] >= 12 && point[2] <= 15.2); }
  assert.equal(vedutaRoofFacets([[0,0],[10,0],[5,5],[10,10],[0,10]], 12), null);
});
test('clockwise tile footprints still give upward roof facets and outward walls', () => {
  const clockwise = [[0,0],[0,20],[10,20],[10,0]], ring = vedutaCounterClockwiseRing(clockwise);
  assert.notEqual(ring, clockwise); assert.deepEqual(clockwise, [[0,0],[0,20],[10,20],[10,0]]);
  const counterClockwise = [[0,0],[10,0],[10,20],[0,20]];
  assert.equal(vedutaCounterClockwiseRing(counterClockwise), counterClockwise);
  const normalZ = ([a, b, c]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (const half of vedutaRoofFacets(ring, 12).halves) for (let i = 1; i < half.length - 1; i++) assert.ok(normalZ([half[0], half[i], half[i + 1]]) > 0);
  // A wall quad starts (a, base), (b, base), (a, top): its normal is (dy, -dx) and must leave the centroid.
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], mid = [(a[0] + b[0]) / 2 - 5, (a[1] + b[1]) / 2 - 10];
    assert.ok((b[1] - a[1]) * mid[0] - (b[0] - a[0]) * mid[1] > 0);
  }
});
test('the GPS dot carries the palette accent with at least 3:1 against every medium ground', async () => {
  const { vedutaDotColor, VEDUTA_PAINT } = await import('../src/environments/veduta/veduta-model.js');
  const { atlasContrastRatio } = await import('../src/environments/atlas/atlas-model.js');
  const { FLUX_THEMES } = await import('../src/flux-themes.js');
  const channels = hex => hex.match(/\w\w/g).map(pair => parseInt(pair, 16) / 255);
  for (const theme of FLUX_THEMES) for (const style of VEDUTA_STYLES) {
    const dot = vedutaDotColor(theme.palette, style);
    assert.match(dot, /^#[0-9a-f]{6}$/);
    assert.ok(atlasContrastRatio(channels(dot), channels(VEDUTA_PAINT[style].ground)) >= 3, `${theme.id} ${style} ${dot}`);
  }
  assert.equal(vedutaDotColor({ accent: [0.2, 0.3, 0.8] }, 'Anime'), '#334dcc');
  assert.match(vedutaDotColor(undefined, 'Manga'), /^#[0-9a-f]{6}$/);
});

test('DARK selects a night medium that switches paints, lamps and dot together', async () => {
  const { vedutaMedium, vedutaBaseStyle, vedutaIsNight, vedutaDotColor, VEDUTA_PAINT } = await import('../src/environments/veduta/veduta-model.js');
  const { atlasContrastRatio } = await import('../src/environments/atlas/atlas-model.js');
  const { FLUX_THEMES } = await import('../src/flux-themes.js');
  const channels = hex => hex.match(/\w\w/g).map(pair => parseInt(pair, 16) / 255);
  for (const style of VEDUTA_STYLES) {
    const medium = vedutaMedium(style, true);
    assert.equal(medium, `${style} Night`); assert.equal(vedutaBaseStyle(medium), style); assert.ok(vedutaIsNight(medium));
    assert.equal(vedutaMedium(style, false), style); assert.ok(!vedutaIsNight(style));
    const night = createVedutaStyle(medium, {}), day = createVedutaStyle(style, {});
    assert.deepEqual(night.layers.map(layer => layer.id), day.layers.map(layer => layer.id));
    assert.ok(night.layers.filter(layer => layer.type === 'symbol').every(layer => layer.paint['icon-opacity'] > 0));
    // Night ground is dark: relative luminance contrast with black stays low.
    assert.ok(atlasContrastRatio(channels(VEDUTA_PAINT[medium].ground), [0, 0, 0]) < 2);
    for (const theme of FLUX_THEMES) assert.ok(atlasContrastRatio(channels(vedutaDotColor(theme.palette, medium)), channels(VEDUTA_PAINT[medium].ground)) >= 3, `${theme.id} ${medium}`);
  }
  assert.equal(vedutaMedium('Unknown', true), 'Anime Night');
});
