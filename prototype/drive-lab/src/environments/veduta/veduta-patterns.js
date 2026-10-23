import { vedutaHash } from './veduta-model.js';

/** One small procedural pigment tile per medium; MapLibre anchors it to the map. */
export function installVedutaPatterns(map, style) {
  for (const kind of ['ground', 'water']) {
    const size = 128, data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const broad = Math.sin(x * Math.PI / 32 + Math.sin(y * Math.PI / 64)) * Math.cos(y * Math.PI / 32);
      const fine = vedutaHash(x, y);
      let alpha;
      if (kind === 'water') {
        const wave = Math.abs(Math.sin((y + Math.sin(x * Math.PI / 64) * 2.5) * Math.PI / 16));
        alpha = wave < 0.12 ? (style === 'Manga' ? 26 : 22) : 0;
        data[i] = style === 'Manga' ? 93 : 230; data[i + 1] = style === 'Manga' ? 103 : 243; data[i + 2] = style === 'Manga' ? 98 : 233;
      } else {
        alpha = style === 'Watercolor' ? Math.max(0, broad * 22 + fine * 7) : style === 'Manga' ? (fine > 0.986 ? 30 : 0) : Math.max(0, broad * 10 + fine * 3);
        data[i] = 96; data[i + 1] = 117; data[i + 2] = 88;
      }
      data[i + 3] = Math.round(alpha);
    }
    const id = `veduta-${kind}-pigment`;
    if (map.hasImage(id)) map.updateImage(id, { width: size, height: size, data });
    else map.addImage(id, { width: size, height: size, data });
    const sourceLayers = kind === 'water' ? ['water'] : ['landcover', 'landuse', 'park'];
    for (const sourceLayer of sourceLayers) if (!map.getLayer(`${id}-${sourceLayer}`)) map.addLayer({ id: `${id}-${sourceLayer}`, type: 'fill', source: 'openfreemap', 'source-layer': sourceLayer, paint: { 'fill-pattern': id } }, 'veduta-road-casing');
  }
}
