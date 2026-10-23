import test from 'node:test';
import assert from 'node:assert/strict';
import { createVedutaPolygonIndex } from '../src/environments/veduta/veduta-spatial.js';
import { pointInVedutaPolygon } from '../src/environments/veduta/veduta-model.js';

const square = (x, y, size) => [[[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]]];
test('spatial exclusions preserve every exact placement decision with fewer polygon predicates', () => {
  const polygons = [];
  for (let x = -10; x < 10; x++) for (let y = -10; y < 10; y++) polygons.push(square(x * 35, y * 35, 18));
  polygons[210].push(square(2, 2, 6)[0]);
  const index = createVedutaPolygonIndex(polygons, p => p);
  let linearCalls = 0, indexedCalls = 0;
  const linear = [], indexed = [];
  for (let x = -370; x <= 370; x += 7) for (let y = -370; y <= 370; y += 11) {
    const p = [x, y];
    linear.push(polygons.some(poly => { linearCalls++; return pointInVedutaPolygon(p, poly); }));
    indexed.push(index.candidates(p).some(poly => { indexedCalls++; return pointInVedutaPolygon(p, poly); }));
  }
  assert.deepEqual(indexed, linear);
  assert.ok(indexedCalls < linearCalls / 20, `${indexedCalls} versus ${linearCalls} exact predicates`);
});

test('boundaries, holes, large exclusions and exhausted index capacity retain exact semantics', () => {
  const outer = square(-100, -100, 200); outer.push(square(-20, -20, 40)[0]);
  const polygons = [outer, square(70, 70, 20), square(-10000, -10000, 20000)];
  for (const maxEntries of [0, 1, 100000]) {
    const index = createVedutaPolygonIndex(polygons, p => [p[0] * 2, p[1] * 3], { maxEntries });
    for (const p of [[0, 0], [20, 20], [-100, -100], [64, 64], [70, 90], [10001, 0]]) {
      assert.equal(index.candidates([p[0] * 2, p[1] * 3]).some(poly => pointInVedutaPolygon(p, poly)), polygons.some(poly => pointInVedutaPolygon(p, poly)));
    }
    assert.deepEqual(index.candidates([NaN, 0]), polygons);
  }
});
