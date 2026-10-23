import { bakeVedutaGeometry } from './veduta-geometry.js';

self.onmessage = ({ data }) => {
  try {
    const result = bakeVedutaGeometry(data.position, data.withEdges);
    const transfer = [result.position.buffer, result.normal.buffer];
    if (result.edges) transfer.push(result.edges.buffer);
    self.postMessage({ id: data.id, result }, transfer);
  } catch { self.postMessage({ id: data.id, error: true }); }
};
