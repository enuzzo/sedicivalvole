import { BufferGeometry, BufferAttribute, EdgesGeometry } from 'three';

/** Exact pinned Three geometry operations; no GL context, map or approximation. */
export function bakeVedutaGeometry(position, withEdges) {
  if (!(position instanceof Float32Array) || position.length % 9) throw new Error('Invalid Veduta triangles');
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.computeVertexNormals();
  const edges = withEdges ? new EdgesGeometry(geometry, 25) : null;
  const result = { position, normal: geometry.getAttribute('normal').array,
    edges: edges?.getAttribute('position').array ?? null };
  geometry.dispose(); edges?.dispose();
  return result;
}

/** One owned CPU worker; cancellation rejects ownership before a late response. */
export function createVedutaGeometryBaker(worker) {
  let sequence = 0, disposed = false, failed = false;
  const pending = new Map();
  const abortError = () => Object.assign(new Error('Veduta geometry cancelled'), { name: 'AbortError' });
  const settle = (id, action, value) => {
    const item = pending.get(id); if (!item) return;
    pending.delete(id); item.signal?.removeEventListener('abort', item.abort); item[action](value);
  };
  worker.onmessage = ({ data }) => {
    if (disposed) return;
    if (data.error) settle(data.id, 'reject', new Error('Veduta geometry worker failed'));
    else settle(data.id, 'resolve', data.result);
  };
  worker.onerror = worker.onmessageerror = () => {
    failed = true; for (const id of [...pending.keys()]) settle(id, 'reject', new Error('Veduta geometry worker unavailable'));
  };
  return {
    bake(position, withEdges, signal) {
      if (failed) return Promise.reject(new Error('Veduta geometry worker unavailable'));
      if (disposed || signal?.aborted) return Promise.reject(abortError());
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        const abort = () => settle(id, 'reject', abortError());
        pending.set(id, { resolve, reject, signal, abort }); signal?.addEventListener('abort', abort, { once: true });
        try { worker.postMessage({ id, position, withEdges }, [position.buffer]); }
        catch (error) { settle(id, 'reject', error); }
      });
    },
    dispose() {
      disposed = true; for (const id of [...pending.keys()]) settle(id, 'reject', abortError());
      worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null; worker.terminate();
    },
  };
}
