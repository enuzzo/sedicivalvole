import { engineAssetCache } from './engine/asset-cache.js';
import { isShaderGradientEnvironmentId } from './flux-environments.js';

// Fetch pinned iframe resources without constructing an iframe or running its code.
export async function preloadVisualDocument(entry, signal, fetcher = fetch) {
  const root = new URL('.', entry).href;
  const queue = [entry], seen = new Set();
  while (queue.length && seen.size < 160) {
    signal.throwIfAborted();
    const url = queue.shift();
    if (seen.has(url) || !url.startsWith(root)) continue;
    seen.add(url);
    const response = await fetcher(url, { signal });
    if (!response.ok) throw new Error(`Visual preparation HTTP ${response.status}`);
    const source = await response.text();
    const references = url.endsWith('.html')
      ? [...source.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g), ...source.matchAll(/\bfrom\s*["']([^"']+)["']/g)]
      : url.endsWith('.js') ? [...source.matchAll(/\b(?:from\s*|import\s*)["']([^"']+)["']/g)] : [];
    for (const match of references) {
      if (match[1].startsWith('.') || !match[1].includes(':')) queue.push(new URL(match[1], url).href);
    }
  }
}

export async function preloadLaunchVisual(id, signal) {
  if (isShaderGradientEnvironmentId(id)) {
    await import('./environments/shadergradient/shadergradient-field.jsx');
  } else if (id === 'atlas') {
    await Promise.all([import('./environments/atlas/atlas-field.jsx'), import('maplibre-gl')]);
  } else if (id === 'stats') {
    await import('./environments/atlas/stats-panel.jsx');
  } else if (id === 'vertigo' || id === 'drivey') {
    const path = id === 'drivey' ? 'drivey/sedicivalvole.html' : 'infinite-lights/index7.html';
    await preloadVisualDocument(new URL(`third-party/${path}`, document.baseURI).href, signal);
  }
  // Other public fields already travel in the initial application payload.
}

export async function preloadLaunchEngine(id, signal) {
  const { engineProfile } = await import('./engine/profiles.js');
  signal.throwIfAborted();
  for (const asset of engineProfile(id).assets) await engineAssetCache.read(asset, { signal });
}
