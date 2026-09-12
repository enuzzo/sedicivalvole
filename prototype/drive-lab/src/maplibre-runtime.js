import * as maplibre from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Vite bundles the worker's shared imports and gives it a same-origin, hashed URL.
// All map consumers load this module lazily before constructing their first map.
maplibre.setWorkerUrl(workerUrl);

export * from 'maplibre-gl';
