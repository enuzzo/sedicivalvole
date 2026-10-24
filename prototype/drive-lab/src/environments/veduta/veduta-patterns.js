import { VEDUTA_LAMP, vedutaBaseStyle, vedutaHash, vedutaImageId, vedutaIsNight } from './veduta-model.js';

// Each medium owns its image ids. Updating an image in place does not redraw
// tiles that already placed it, which left the previous medium's pigment behind.
function addOnce(map, id, size, fill) {
  if (map.hasImage(id)) return;
  const data = new Uint8Array(size * size * 4); fill(data, size);
  map.addImage(id, { width: size, height: size, data });
}

/**
 * Soft lamp light: a warm radial pool for the asphalt and a small bright head.
 * One image for every medium (Manga's finish renders it monochrome), so the
 * lamp layers never change image.
 */
function installVedutaLamps(map) {
  const [r, g, b] = VEDUTA_LAMP.match(/\w\w/g).map(pair => parseInt(pair, 16));
  for (const [id, size, falloff, peak] of [['veduta-lamp-pool', 64, 2.2, 130], ['veduta-lamp-head', 16, 1.2, 255]]) {
    addOnce(map, id, size, data => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4, d = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = Math.round(Math.max(0, 1 - d) ** falloff * peak);
      }
    });
  }
}


/** One small procedural pigment tile per medium; MapLibre anchors it to the map. */
export function installVedutaPatterns(map, medium) {
  const style = vedutaBaseStyle(medium), night = vedutaIsNight(medium);
  installVedutaLamps(map);
  for (const kind of ['ground', 'water', 'foliage']) {
    const id = vedutaImageId(`${kind}-pigment`, medium);
    if (!map.hasImage(id)) addOnce(map, id, 128, data => paintPigment(data, 128, kind, style, night));
    const sourceLayers = kind === 'water' ? ['water'] : ['landcover', 'landuse', 'park'];
    for (const sourceLayer of sourceLayers) {
      // Pinned MapLibre 6.7 keeps a tile's pattern atlas when fill-pattern or
      // the image changes, so a switched medium kept the previous pigment. Each
      // medium owns constant-pattern layers; only the current set is visible.
      const prefix = `veduta-${kind}-pigment-${sourceLayer}-`, layer = `${prefix}${id.slice(`veduta-${kind}-pigment-`.length)}`;
      for (const other of map.getStyle().layers) if (other.id.startsWith(prefix) && other.id !== layer && other.layout?.visibility !== 'none') map.setLayoutProperty(other.id, 'visibility', 'none');
      if (map.getLayer(layer)) { if (map.getLayoutProperty(layer, 'visibility') === 'none') map.setLayoutProperty(layer, 'visibility', 'visible'); }
      else map.addLayer({ id: layer, type: 'fill', source: 'openfreemap', 'source-layer': sourceLayer,
        ...(kind === 'foliage' ? { filter: ['in',['get','class'],['literal',['wood','forest','grass','park','recreation_ground','garden','meadow','scrub']]] } : {}), paint: { 'fill-pattern': id } }, 'veduta-road-casing');
    }
  }
}

function paintPigment(data, size, kind, style, night) {
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const broad = Math.sin(x * Math.PI / 32 + Math.sin(y * Math.PI / 64)) * Math.cos(y * Math.PI / 32);
    const fine = vedutaHash(x, y);
    let alpha;
    if (kind === 'water') {
      const wave = Math.abs(Math.sin((y + Math.sin(x * Math.PI / 64) * 2.5) * Math.PI / 16));
      const segment = Math.sin(x * Math.PI / 16 + Math.sin(y * Math.PI / 32));
      alpha = wave < 0.12 && segment > 0.25 ? (style === 'Manga' ? 70 : style === 'Anime' ? 76 : 44) : 0;
      data[i] = style === 'Manga' ? 93 : 230; data[i + 1] = style === 'Manga' ? 103 : 243; data[i + 2] = style === 'Manga' ? 98 : 233;
      // Night water carries short warm glints, the reflection of shore lights.
      if (night) { alpha = Math.round(alpha * 0.7); data[i] = 255; data[i + 1] = style === 'Manga' ? 250 : 214; data[i + 2] = style === 'Manga' ? 240 : 150; }
    } else if (kind === 'ground') {
      alpha = style === 'Watercolor' ? Math.max(0, broad * 22 + fine * 7) : style === 'Manga' ? (fine > 0.986 ? 30 : 0) : Math.max(0, broad * 10 + fine * 3);
      data[i] = night ? 14 : 123; data[i + 1] = night ? 16 : 111; data[i + 2] = night ? 26 : 91;
    } else alpha = 0;
    data[i + 3] = Math.round(alpha);
  }
  if (kind === 'foliage') {
    // Overlapping soft pigment marks, repeated in geographic map space.
    // Only source-mapped vegetation receives them; unknown ground stays bare.
    const dayColors = style === 'Manga' ? [[90,94,87],[151,153,139]] : style === 'Watercolor' ? [[83,124,103],[188,184,113]] : [[42,91,74],[177,185,98]];
    const colors = night ? dayColors.map(color => color.map(value => Math.round(value * 0.32))) : dayColors;
    for(let stroke=0;stroke<96;stroke++) {
      const seed=vedutaHash(stroke,31),cx=vedutaHash(stroke,7)*size,cy=vedutaHash(stroke,11)*size;
      const sx=8+seed*13,sy=3+vedutaHash(stroke,13)*5,angle=vedutaHash(stroke,17)*Math.PI;
      const co=Math.cos(angle),si=Math.sin(angle),extent=Math.ceil(sx+sy),color=colors[seed>.48?1:0];
      for(let dy=-extent;dy<=extent;dy++)for(let dx=-extent;dx<=extent;dx++) {
        const distance=((dx*co+dy*si)/sx)**2+((-dx*si+dy*co)/sy)**2;
        if(distance>=1)continue;
        const x=((Math.floor(cx)+dx)%size+size)%size,y=((Math.floor(cy)+dy)%size+size)%size,i=(y*size+x)*4;
        const alpha=Math.round((1-distance)**1.4*(style==='Manga'?55:90));
        if(alpha<=data[i+3])continue;
        data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];data[i+3]=alpha;
      }
    }
  }
}
