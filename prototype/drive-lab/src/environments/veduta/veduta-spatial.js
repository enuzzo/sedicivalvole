/** Conservative local-space buckets; exact geographic containment stays with the caller. */
export function createVedutaPolygonIndex(polygons, toLocal, { cellSize = 64, maxEntries = 100000 } = {}) {
  const job = createVedutaPolygonIndexJob(polygons, toLocal, { cellSize, maxEntries });
  let result; do { result = job.next(); } while (!result.done);
  return result.value;
}

/** Same buckets and insertion order, with cooperative boundaries for the scene job. */
export function* createVedutaPolygonIndexJob(polygons, toLocal, { cellSize = 64, maxEntries = 100000 } = {}) {
  const cells = new Map(), global = [], empty = [];
  let entries = 0, units = 0;
  for (const polygon of polygons) {
    yield;
    let left = Infinity, right = -Infinity, bottom = Infinity, top = -Infinity;
    for (const point of polygon[0] ?? []) {
      if (++units % 32 === 0) yield;
      const [x, y] = toLocal(point);
      left = Math.min(left, x); right = Math.max(right, x);
      bottom = Math.min(bottom, y); top = Math.max(top, y);
    }
    const x0 = Math.floor(left / cellSize), x1 = Math.floor(right / cellSize);
    const y0 = Math.floor(bottom / cellSize), y1 = Math.floor(top / cellSize);
    const count = (x1 - x0 + 1) * (y1 - y0 + 1);
    if (!Number.isFinite(count) || count <= 0 || count > 4096 || entries + count > maxEntries) {
      global.push(polygon); continue;
    }
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      if (++units % 32 === 0) yield;
      const key = `${x}:${y}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(polygon);
    }
    entries += count;
  }
  return {
    candidates([x, y]) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return polygons;
      const nearby = cells.get(`${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`) ?? empty;
      return global.length ? global.concat(nearby) : nearby;
    },
  };
}
