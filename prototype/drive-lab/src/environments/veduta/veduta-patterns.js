import { vedutaHash } from './veduta-model.js';

/** One small procedural pigment tile per medium; MapLibre anchors it to the map. */
export function installVedutaPatterns(map, style) {
  for (const kind of ['ground', 'water', 'foliage']) {
    const size = 128, data = new Uint8Array(size * size * 4);
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
      } else if (kind === 'ground') {
        alpha = style === 'Watercolor' ? Math.max(0, broad * 22 + fine * 7) : style === 'Manga' ? (fine > 0.986 ? 30 : 0) : Math.max(0, broad * 10 + fine * 3);
        data[i] = 123; data[i + 1] = 111; data[i + 2] = 91;
      } else alpha = 0;
      data[i + 3] = Math.round(alpha);
    }
    if (kind === 'foliage') {
      // Overlapping soft pigment marks, repeated in geographic map space.
      // Only source-mapped vegetation receives them; unknown ground stays bare.
      const colors = style === 'Manga' ? [[90,94,87],[151,153,139]] : style === 'Watercolor' ? [[83,124,103],[188,184,113]] : [[42,91,74],[177,185,98]];
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
    const id = `veduta-${kind}-pigment`;
    if (map.hasImage(id)) map.updateImage(id, { width: size, height: size, data });
    else map.addImage(id, { width: size, height: size, data });
    const sourceLayers = kind === 'water' ? ['water'] : ['landcover', 'landuse', 'park'];
    for (const sourceLayer of sourceLayers) if (!map.getLayer(`${id}-${sourceLayer}`)) map.addLayer({ id: `${id}-${sourceLayer}`, type: 'fill', source: 'openfreemap', 'source-layer': sourceLayer,
      ...(kind === 'foliage' ? { filter: ['in',['get','class'],['literal',['wood','forest','grass','park','recreation_ground','garden','meadow','scrub']]] } : {}), paint: { 'fill-pattern': id } }, 'veduta-road-casing');
  }
}
