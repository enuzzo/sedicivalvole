import * as THREE from 'three';
import { createVedutaRepaintScheduler } from './veduta-repaint.js';
import { createVedutaPolygonIndexJob } from './veduta-spatial.js';
import { createVedutaBuildQueue, vedutaBuildScheduling } from './veduta-build.js';
import { createVedutaGeometryBaker } from './veduta-geometry.js';
import { VEDUTA_COLORS, VEDUTA_PAINT, VEDUTA_STYLES, VEDUTA_WORLD_METRES, vedutaBaseStyle, vedutaIsNight, pointInVedutaPolygon, vedutaCounterClockwiseRing, vedutaDistanceToSegment, vedutaGridCoordinate, vedutaHash, vedutaRoofFacets } from './veduta-model.js';

const VERTEX = `varying vec3 vNormal; varying vec3 vWorld; varying vec2 vUv;
varying vec3 vColor;
void main(){vNormal=normalize(mat3(modelMatrix)*normal);vWorld=(modelMatrix*vec4(position,1.)).xyz;
vUv=uv;vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FRAGMENT = `precision highp float; uniform vec3 base; uniform vec3 eye; uniform vec3 mist; uniform float medium; uniform float facade;
uniform vec2 inkOffset; uniform float inkScale; uniform float night;
varying vec3 vNormal; varying vec3 vWorld; varying vec2 vUv; varying vec3 vColor;
float grain(vec2 p){return fract(sin(dot(mod(floor(p),64.),vec2(12.9898,78.233)))*43758.5453);}
float pigment(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(grain(i),grain(i+vec2(1.,0.)),f.x),mix(grain(i+vec2(0.,1.)),grain(i+vec2(1.)),f.x),f.y);}
void main(){vec3 ink=vec3(vWorld.xy*inkScale+inkOffset,vWorld.z);
vec3 n=normalize(vNormal);float light=dot(n,normalize(vec3(-.4,-.6,1.)))*.5+.5;
float lit=smoothstep(.48,.55,light);
float shade=medium<.5?mix(.29,1.10,lit):mix(.55,1.04,smoothstep(.32,.65,light));vec3 c=base*vColor*shade;
if(facade<-.5){float leaves=pigment(ink.xy*.7+ink.z*.9)*.7+pigment(ink.xy*2.+ink.z*.9)*.3;
c*=.75+leaves*.48;c=mix(c,c*vec3(1.14,1.1,.78),smoothstep(.58,.82,leaves)*light*.45);}
float edge=1.-smoothstep(.08,.28,abs(dot(n,normalize(eye-vWorld))));
float lamp=0.;
if(facade>.5&&abs(n.z)<.25){vec2 cell=fract(vUv/vec2(3.5,3.2));
float w=step(.29,cell.x)*step(cell.x,.67)*step(.28,cell.y)*step(cell.y,.7)*step(2.,vUv.y);
if(night>.5){vec2 id=floor(vUv/vec2(3.5,3.2))+floor(vColor.rg*vec2(997.,613.));
lamp=w*step(.5,fract(sin(dot(id,vec2(41.3,289.1)))*43758.5453));c=mix(c,c*.55,w-lamp);}
else c=mix(c,vec3(.22,.3,.29),w*.75);}
if(medium>1.5){vec2 paper=ink.xy+ink.z*.47;
float wash=pigment(paper*.16)*.65+pigment(paper*.73)*.25+pigment(paper*2.2)*.1;
c=mix(c,night>.5?vec3(.13,.14,.21):vec3(.96,.91,.78),smoothstep(.58,.87,wash)*.32);
c*=.88+wash*.24;c*=1.-edge*(.12+pigment(paper*1.7)*.14);}
else if(medium>.5){float l=dot(c,vec3(.3,.58,.12));
vec2 p=ink.xy+ink.z*.5;
float hatch=1.-smoothstep(.07,.2,abs(fract((p.x+p.y)*1.8)-.5));
float aa=max(fwidth((p.x+p.y)*1.8),.1);hatch*=1.-smoothstep(.5,1.5,aa);
c=vec3(mix(l*.93+.035,l*.35,hatch*(1.-light)*.68));
if(facade<.5)c*=1.-edge*.7;}
else {c*=mix(vec3(.66,.83,1.2),vec3(1.08,1.025,.87),lit);if(facade<.5)c*=1.-edge*.19;
c*=.96+pigment((ink.xy+ink.z*.4)*.45)*.08;}
// Lit windows are emissive: applied after the medium response and before mist.
c=mix(c,vec3(1.,.8,.47),lamp*.95);
c=mix(c,mist,smoothstep(600.,1800.,distance(eye,vWorld))*.2);
gl_FragColor=vec4(clamp(c,0.,1.),1.);
#include <colorspace_fragment>
}`;

function material(color, style, facade = false) {
  return new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, vertexColors: true,
    uniforms: { base: { value: new THREE.Color(color) }, eye: { value: new THREE.Vector3(0, -300, 150) }, mist: { value: new THREE.Color((VEDUTA_PAINT[style] ?? VEDUTA_PAINT.Anime).horizon) }, medium: { value: VEDUTA_STYLES.indexOf(vedutaBaseStyle(style)) }, night: { value: vedutaIsNight(style) ? 1 : 0 }, facade: { value: typeof facade === 'number' ? facade : facade ? 1 : 0 }, inkOffset: { value: new THREE.Vector2() }, inkScale: { value: 1 } } });
}
function mesh(geometry, paint, parent, position, scale) {
  const object = new THREE.Mesh(geometry, paint);
  if (position) object.position.set(...position);
  if (scale) object.scale.set(...scale);
  parent.add(object);
  return object;
}

/** Original low-poly vehicle symbols. No branded model, texture or logo asset. */
export function createVedutaVehicle(vehicle, color, style, dotColor = '#347eb4') {
  const group = new THREE.Group();
  if (vehicle === 'point') {
    // A fixed 12 CSS-pixel GPS dot stays readable without occupying a street:
    // palette core, white ring and a dark hairline that also holds on Manga paper.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.5], 3));
    const paint = new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false,
      uniforms: { pixelRatio: { value: 1 }, dotColor: { value: new THREE.Color(dotColor) } },
      vertexShader: 'uniform float pixelRatio; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=12.*pixelRatio;}',
      fragmentShader: `uniform vec3 dotColor; void main(){float r=length(gl_PointCoord-vec2(.5));
        float alpha=1.-smoothstep(.46,.5,r);if(alpha<=0.)discard;
        vec3 c=mix(dotColor,vec3(1.),smoothstep(.25,.29,r));
        gl_FragColor=vec4(mix(c,vec3(.09,.11,.12),smoothstep(.38,.42,r)),alpha);
        #include <colorspace_fragment>
      }` });
    const dot = new THREE.Points(geometry, paint); dot.frustumCulled = false; dot.renderOrder = 100; group.add(dot);
    return group;
  }
  const bodyColor = VEDUTA_COLORS.find(item => item.id === color)?.hex ?? '#e9e9e2';
  const body = material(bodyColor, style), glass = material('#34444d', style), rubber = material('#24282b', style);
  const tall = vehicle === 'model-y';
  const footprint = new THREE.Shape();
  footprint.moveTo(-0.82, -2.25); footprint.lineTo(0.82, -2.25);
  footprint.quadraticCurveTo(1.01, -2.1, 1.01, -1.6); footprint.lineTo(0.95, 1.8);
  footprint.quadraticCurveTo(0.88, 2.25, 0.6, 2.3); footprint.lineTo(-0.6, 2.3);
  footprint.quadraticCurveTo(-0.88, 2.25, -0.95, 1.8); footprint.lineTo(-1.01, -1.6);
  footprint.quadraticCurveTo(-1.01, -2.1, -0.82, -2.25);
  mesh(new THREE.ExtrudeGeometry(footprint, { depth: tall ? 0.7 : 0.55, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.12, bevelThickness: 0.1, curveSegments: 4 }), body, group, [0, 0, 0.42]);
  const cabin = new THREE.BoxGeometry(tall ? 1.84 : 1.72, tall ? 3.1 : 2.8, tall ? 0.88 : 0.64);
  const cabinVertices = cabin.getAttribute('position');
  for (let i = 0; i < cabinVertices.count; i++) if (cabinVertices.getZ(i) > 0) {
    cabinVertices.setX(i, cabinVertices.getX(i) * 0.84);
    cabinVertices.setY(i, cabinVertices.getY(i) * 0.57 - 0.02);
  }
  cabin.computeVertexNormals();
  mesh(cabin, glass, group, [0, tall ? -0.2 : -0.05, tall ? 1.2 : 1.06]).name = 'cabin';
  // Body-coloured pillars retain a distinct sedan / crossover silhouette.
  for (const x of [-0.86, 0.86]) mesh(new THREE.BoxGeometry(0.09, 1.6, 0.1), body, group, [x, -0.1, tall ? 1.47 : 1.25]);
  const wheel = new THREE.CylinderGeometry(0.36, 0.36, 0.22, 12);
  wheel.rotateZ(Math.PI / 2);
  for (const x of [-1.01, 1.01]) for (const y of [-1.48, 1.45]) mesh(wheel, rubber, group, [x, y, 0.42]);
  const rear = material('#b53c39', style), front = material('#dce8d8', style);
  for (const x of [-0.6, 0.6]) {
    mesh(new THREE.BoxGeometry(0.49, 0.08, 0.09), rear, group, [x, -2.3, 0.93]);
    mesh(new THREE.BoxGeometry(0.48, 0.08, 0.05), front, group, [x, 2.21, 0.78]);
  }
  mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: '#17251e', transparent: true, opacity: 0.16, depthWrite: false }), group, [0, 0, 0.015], [1.3, 2.5, 1]);
  return group;
}

export function disposeVedutaTree(root, retainedMaterials = new Set()) {
  const geometries = new Set(), materials = new Set();
  root.traverse(object => {
    if (object.isInstancedMesh) object.dispose();
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) for (const item of Array.isArray(object.material) ? object.material : [object.material]) materials.add(item);
  });
  geometries.forEach(item => item.dispose()); materials.forEach(item => { if (!retainedMaterials.has(item)) item.dispose(); });
}

/** Same ordered geometry as the synchronous builder; every yield retains private ownership. */
export function* createVedutaSceneryJob({ map, maplibre, point, origin, scale, style, worldMaterial, retainedMaterials, bakeGeometry }, signal) {
  const local = coordinate => { const p = maplibre.MercatorCoordinate.fromLngLat(coordinate); return [(p.x-origin.x)/scale, -(p.y-origin.y)/scale]; };
  const nextScenery = new THREE.Group();
  let complete = false;
  try {
    // Source features are already loaded by the single MapLibre tile owner. Filters
    // drop classes the builder ignores before MapLibre creates their GeoJSON features.
    const snapshot = {}, treeClasses = ['wood', 'forest', 'park', 'recreation_ground', 'garden', 'grass', 'meadow'];
    const filters = { transportation: ['!=', ['get', 'class'], 'rail'], landcover: ['in', ['get', 'class'], ['literal', treeClasses]],
      landuse: ['in', ['get', 'class'], ['literal', [...treeClasses, 'pitch', 'playground']]], park: ['in', ['get', 'class'], ['literal', treeClasses]] };
    for (const layer of ['building','landuse','transportation','landcover','park']) {
      yield; try { snapshot[layer] = map.querySourceFeatures('openfreemap', { sourceLayer: layer, filter: filters[layer] }); } catch { snapshot[layer] = []; }
    }
    const features = layer => snapshot[layer];
    const c = VEDUTA_PAINT[style], centre = local([point.longitude, point.latitude]);
    const near = xy => Math.hypot(xy[0] - centre[0], xy[1] - centre[1]) < 650;
    const buildings = [], unique = new Set(), position = [], uv = [], colors = [];
    const push = (p, texture, color) => { position.push(...p); uv.push(...texture); colors.push(color.r, color.g, color.b); };
    const rankedBuildings = [];
    for (const feature of features('building')) {
      yield;
      const coordinates = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates[0]?.[0] : feature.geometry.coordinates[0];
      const p = coordinates?.[0];
      rankedBuildings.push({ feature, distance: p ? Math.hypot(...local(p).map((v, i) => v - centre[i])) : Infinity });
    }
    yield; rankedBuildings.sort((a, b) => a.distance - b.distance);
    for (const { feature } of rankedBuildings) {
      const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [];
      for (const rings of polygons) {
        yield;
        const key = `${feature.id ?? ''}:${rings[0]?.[0]?.join(',')}`;
        if (unique.has(key) || buildings.length >= 450 || !rings[0]?.length) continue;
        unique.add(key);
        const ring = vedutaCounterClockwiseRing(rings[0].slice(0, -1).map(local));
        if (!ring.length || !near(ring[0])) continue;
        const geo = rings[0][0], elevation = map.queryTerrainElevation(geo);
        if (!Number.isFinite(elevation)) continue;
        buildings.push(rings);
        const height = Math.max(2, Math.min(250, Number(feature.properties?.render_height) || 5));
        const base = Math.max(0, Number(feature.properties?.render_min_height) || 0) + elevation;
        const top = elevation + height + 0.28;
        const variation = 0.9 + vedutaHash(geo[0] * 1000, geo[1] * 1000) * 0.18;
        const wall = new THREE.Color(c.wall).multiplyScalar(variation), roof = new THREE.Color(c.roof).multiplyScalar(variation);
        for (let i = 0; i < ring.length; i++) {
          if (i % 32 === 0) yield;
          const a = ring[i], b = ring[(i + 1) % ring.length], width = Math.hypot(b[0] - a[0], b[1] - a[1]);
          for (const [xy, z, tex] of [[a, base, [0, 0]], [b, base, [width, 0]], [a, top, [0, height]], [a, top, [0, height]], [b, base, [width, 0]], [b, top, [width, height]]]) push([xy[0], xy[1], z], tex, wall);
        }
        const outer = ring.map(p => new THREE.Vector2(...p));
        const holes = rings.slice(1).map(hole => hole.slice(0, -1).map(p => new THREE.Vector2(...local(p))));
        const vertices = [...outer, ...holes.flat()];
        let triangles = 0;
        for (const triangle of THREE.ShapeUtils.triangulateShape(outer, holes)) {
          if (++triangles % 32 === 0) yield;
          for (const index of triangle) { const v = vertices[index]; push([v.x, v.y, top], [0, 0], roof); }
        }
        const pitched = rings.length === 1 ? vedutaRoofFacets(ring, top + 0.02) : null;
        if (pitched) {
          for (const half of pitched.halves) for (let i = 1; i < half.length - 1; i++) for (const p of [half[0], half[i], half[i + 1]]) push(p, [0, 0], roof);
          for (const triangle of pitched.gables) for (const p of triangle) push(p, [0, 0], wall);
        }
      }
    }
    if (position.length) {
      const baked = yield bakeGeometry(new Float32Array(position), vedutaBaseStyle(style) !== 'Watercolor', signal);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(baked.position, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(baked.normal, 3));
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(...baked.bounds.centre), baked.bounds.radius);
      const walls = worldMaterial('facades', style, () => material('#ffffff', style, true)); walls.side = THREE.DoubleSide;
      walls.polygonOffset = true; walls.polygonOffsetFactor = -1; walls.polygonOffsetUnits = -2;
      mesh(geometry, walls, nextScenery);
      if (baked.edges) {
        const edges = new THREE.BufferGeometry(); edges.setAttribute('position', new THREE.BufferAttribute(baked.edges, 3));
        edges.boundingSphere = new THREE.Sphere(new THREE.Vector3(...baked.edgeBounds.centre), baked.edgeBounds.radius);
        nextScenery.add(new THREE.LineSegments(edges, worldMaterial('edges', style, () => new THREE.LineBasicMaterial({ color: c.ink, transparent: true, opacity: vedutaBaseStyle(style) === 'Manga' ? 0.52 : 0.16 }))));
      }
      yield;
    }
    // Illustrative tree symbols belong only to source-mapped vegetation. Their
    // exact species/count are not observations. A global grid prevents reseeding.
    const treePlaces = [], seen = new Set();
    const clearedAreas = [];
    for (const feature of features('landuse')) {
      yield; if (!['pitch','playground'].includes(feature.properties?.class)) continue;
      clearedAreas.push(...(feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : []));
    }
    const noTreeAreas = [...buildings,...clearedAreas], roads = new Map(), bucketSize = 64;
    const exclusions = yield* createVedutaPolygonIndexJob(noTreeAreas, local);
    let roadSegments = 0, roadEntries = 0;
    for (const feature of features('transportation')) {
      yield;
      if (roadSegments >= 12000 || roadEntries >= 100000) break;
      if (feature.properties?.class === 'rail') continue;
      const lines = feature.geometry.type === 'LineString' ? [feature.geometry.coordinates] : feature.geometry.type === 'MultiLineString' ? feature.geometry.coordinates : [];
      const clearance = feature.properties?.class === 'path' ? 2.5 : ['motorway','trunk'].includes(feature.properties?.class) ? 11 : 5;
      for (const line of lines) for (let i=1;i<line.length;i++) {
        yield;
        if (++roadSegments > 12000 || roadEntries >= 100000) break;
        const a=local(line[i-1]),b=local(line[i]);
        const left=Math.floor(Math.max(Math.min(a[0],b[0])-clearance,centre[0]-650)/bucketSize),right=Math.floor(Math.min(Math.max(a[0],b[0])+clearance,centre[0]+650)/bucketSize);
        const bottom=Math.floor(Math.max(Math.min(a[1],b[1])-clearance,centre[1]-650)/bucketSize),top=Math.floor(Math.min(Math.max(a[1],b[1])+clearance,centre[1]+650)/bucketSize);
        for(let x=left;x<=right&&roadEntries<100000;x++)for(let y=bottom;y<=top&&roadEntries<100000;y++){const key=`${x}:${y}`;if(!roads.has(key))roads.set(key,[]);roads.get(key).push({a,b,clearance});roadEntries++;}
      }
    }
    const centreMercator = maplibre.MercatorCoordinate.fromLngLat([point.longitude, point.latitude]);
    const cx = centreMercator.x * VEDUTA_WORLD_METRES, cy = centreMercator.y * VEDUTA_WORLD_METRES;
    const radius = Math.min(5000, 650 / Math.cos(point.latitude * Math.PI / 180));
    let candidates = 0;
    for (const feature of [...features('landcover'), ...features('park'), ...features('landuse')]) {
      yield;
      if (treePlaces.length >= 1400 || candidates >= 8000) break;
      if (!treeClasses.includes(feature.properties?.class)) continue;
      const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [];
      for (const rings of polygons) {
        yield;
        if (treePlaces.length >= 1400 || candidates >= 8000) break;
        let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
        let vertices = 0;
        for (const p of rings[0]) { if (++vertices % 32 === 0) yield; const m = maplibre.MercatorCoordinate.fromLngLat(p); left = Math.min(left, m.x * VEDUTA_WORLD_METRES); right = Math.max(right, m.x * VEDUTA_WORLD_METRES); top = Math.min(top, m.y * VEDUTA_WORLD_METRES); bottom = Math.max(bottom, m.y * VEDUTA_WORLD_METRES); }
        const step = ['wood', 'forest'].includes(feature.properties.class) ? 26 : 50;
        const minX = Math.floor(Math.max(left, cx - radius) / step), maxX = Math.ceil(Math.min(right, cx + radius) / step);
        const minY = Math.floor(Math.max(top, cy - radius) / step), maxY = Math.ceil(Math.min(bottom, cy + radius) / step);
        for (let x = minX; x <= maxX && treePlaces.length < 1400 && candidates < 8000; x++) for (let y = minY; y <= maxY && treePlaces.length < 1400 && candidates < 8000; y++) {
          yield; candidates++;
          const key = `${step}:${x}:${y}`;
          if (seen.has(key)) continue;
          const geo = vedutaGridCoordinate(x, y, step);
          const xy = local(geo);
          if (!near(xy) || !pointInVedutaPolygon(geo, rings) || exclusions.candidates(xy).some(polygon => pointInVedutaPolygon(geo, polygon))) continue;
          if (roads.get(`${Math.floor(xy[0]/bucketSize)}:${Math.floor(xy[1]/bucketSize)}`)?.some(road => vedutaDistanceToSegment(xy,road.a,road.b)<road.clearance)) continue;
          const z = map.queryTerrainElevation(geo);
          if (!Number.isFinite(z)) continue;
          seen.add(key); treePlaces.push({ xy, z, seed: vedutaHash(x, y), size: 4 + vedutaHash(x + 7, y) * 4 });
        }
      }
    }
    if (treePlaces.length) {
      const canopy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), worldMaterial('foliage', style, () => material(c.forest, style,-1)), treePlaces.length * 3);
      const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 1, 5).rotateX(Math.PI / 2), worldMaterial('trunks', style, () => material('#7d7057', style)), treePlaces.length);
      nextScenery.add(canopy, trunks);
      const dummy = new THREE.Object3D();
      for (const [i, tree] of treePlaces.entries()) {
        yield;
        dummy.position.set(...tree.xy, tree.z + tree.size * 0.42); dummy.scale.set(1, 1, tree.size * 0.84); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
        for (let lobe = 0; lobe < 3; lobe++) {
          const slender = tree.seed > .72;
          dummy.position.set(tree.xy[0] + (slender ? 0 : (lobe - 1) * tree.size * 0.24), tree.xy[1] + (slender ? 0 : lobe === 1 ? 0.8 : -0.5), tree.z + tree.size * (slender ? 1.+lobe*.25 : lobe === 1 ? 1.12 : 0.93));
          dummy.scale.set(tree.size * (slender ? .23 : .42 + tree.seed * .2), tree.size * (slender ? .23 : .4 + tree.seed * .14), tree.size * (slender ? .85 : lobe === 1 ? .7 : .52)); dummy.rotation.z = tree.seed * Math.PI * 2 + lobe; dummy.updateMatrix(); canopy.setMatrixAt(i * 3 + lobe, dummy.matrix);
          canopy.setColorAt(i * 3 + lobe, new THREE.Color().setRGB(0.85 + tree.seed * 0.4, 0.93 + tree.seed * 0.22, 0.86 + tree.seed * 0.25));
        }
      }
      // Shader world positions must include the instance transform.
      for (const object of [canopy, trunks]) {
        object.material.vertexShader = VERTEX.replace('vNormal=normalize(mat3(modelMatrix)*normal);vWorld=(modelMatrix*vec4(position,1.)).xyz;', 'mat3 basis=mat3(instanceMatrix);vec3 inverseScale=vec3(dot(basis[0],basis[0]),dot(basis[1],basis[1]),dot(basis[2],basis[2]));vNormal=normalize(mat3(modelMatrix)*basis*(normal/max(inverseScale,vec3(.0001))));vWorld=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;').replace('projectionMatrix*modelViewMatrix*vec4(position,1.)', 'projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.)');
        if (object === canopy) object.material.vertexShader = object.material.vertexShader.replace('vColor=color;', 'vColor=color*instanceColor;');
        object.frustumCulled = false;
      }
    }
    complete = true; return { group: nextScenery, origin, scale, centre, style, point };
  } finally { if (!complete) disposeVedutaTree(nextScenery, retainedMaterials); }
}

/** The map owns this GL context. Never clear it, create a second canvas or lose it. */
export function createVedutaLayer(maplibre, preferences, readPoint, onError, onStyleReady = () => {}) {
  let map, renderer, origin, scale, car, fallback, ground = null, lastGroundAt = 0, lastSceneryAt = -Infinity;
  let disposed = false, requestedRevision = 1, committedRevision = 0, epoch = 0, jobContext = null, baker = null;
  let displayedStyle = preferences.style, markerKey;
  let lastSceneryCentre = null, carPose = null, lastPoseAt = 0, groundDirty = true, lastGroundPoint = '';
  const repaint = createVedutaRepaintScheduler({ repaint: () => map?.triggerRepaint(), visible: () => !document.hidden,
    now: () => performance.now(), setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: id => clearTimeout(id) });
  const stopBaker = () => { baker?.dispose(); baker = null; };
  const queue = createVedutaBuildQueue({ ...vedutaBuildScheduling(), now: () => performance.now(),
    visible: () => !document.hidden, onError });
  // The geometry worker survives invalidation: aborts reject pending bakes and late replies are dropped.
  const invalidate = () => { epoch++; queue.cancel(); jobContext = null; requestedRevision++; };
  const visibility = () => {
    repaint.cancel(); invalidate();
    if (!document.hidden) { lastSceneryAt = -Infinity; map?.triggerRepaint(); }
  };
  const scene = new THREE.Scene(), camera = new THREE.Camera();
  let scenery = new THREE.Group();
  const worldMaterials = new Map(), retainedMaterials = new Set();
  const worldMaterial = (role, style, make) => {
    const key = `${role}:${style}`;
    if (!worldMaterials.has(key)) { const value = make(); worldMaterials.set(key,value); retainedMaterials.add(value); }
    return worldMaterials.get(key);
  };
  scene.add(scenery);
  const projection = new THREE.Matrix4(), transform = new THREE.Matrix4();
  const inverse = new THREE.Matrix4(), eye = new THREE.Vector4(), axes = new THREE.Vector3();
  // Uniform owners are collected when the scene changes, never searched per frame.
  let shadedMaterials = [], pointMaterials = [];
  const collectMaterials = () => {
    const seen = new Set(); shadedMaterials = []; pointMaterials = [];
    scene.traverse(object => {
      const paint = object.material;
      if (!paint?.uniforms || seen.has(paint)) return;
      seen.add(paint);
      if (paint.uniforms.eye) shadedMaterials.push(paint);
      if (paint.uniforms.pixelRatio) pointMaterials.push(paint);
    });
  };
  const requestScenery = event => {
    if (['openfreemap', 'veduta-terrain'].includes(event.sourceId) && event.tile?.state === 'loaded') {
      requestedRevision++;
      if (event.sourceId === 'veduta-terrain') groundDirty = true;
      repaint.schedule(performance.now());
    }
  };
  const local = coordinate => {
    const p = maplibre.MercatorCoordinate.fromLngLat(coordinate);
    return [(p.x - origin.x) / scale, -(p.y - origin.y) / scale];
  };
  const replaceMarker = () => {
    const key = `${preferences.vehicle}:${preferences.color}:${displayedStyle}:${preferences.dotColor}`;
    if (markerKey === key) return;
    markerKey = key;
    for (const object of [car, fallback]) if (object) { scene.remove(object); disposeVedutaTree(object); }
    car = createVedutaVehicle(preferences.vehicle, preferences.color, displayedStyle, preferences.dotColor); scene.add(car);
    // A car symbol without a heading falls back to the dot; the dot needs no fallback.
    fallback = preferences.vehicle === 'point' ? null : createVedutaVehicle('point', preferences.color, displayedStyle, preferences.dotColor);
    if (fallback) scene.add(fallback);
    collectMaterials();
  };
  const distanceFrom = (point, reference) => {
    const coordinate = maplibre.MercatorCoordinate.fromLngLat([point.longitude, point.latitude]);
    return Math.hypot(coordinate.x - reference.x, coordinate.y - reference.y) / reference.meterInMercatorCoordinateUnits();
  };
  const beginScenery = point => {
    const coordinate = maplibre.MercatorCoordinate.fromLngLat([point.longitude, point.latitude]);
    const candidateOrigin = distanceFrom(point, origin) > 2000 ? coordinate : origin;
    const context = { epoch, revision: requestedRevision, style: preferences.style, coordinate,
      origin: candidateOrigin, scale: candidateOrigin.meterInMercatorCoordinateUnits(), point: { ...point } };
    jobContext = context; lastSceneryAt = performance.now();
    queue.start(signal => createVedutaSceneryJob({ map, maplibre, ...context, worldMaterial, retainedMaterials,
      bakeGeometry: (position, edges, abort) => {
        if (!baker) baker = createVedutaGeometryBaker(new Worker(new URL('./veduta-geometry.worker.js', import.meta.url), { type: 'module' }));
        // A failed worker is replaced on the next bake; a cancelled bake keeps it.
        return baker.bake(position, edges, abort).catch(error => { if (error?.name !== 'AbortError') stopBaker(); throw error; });
      } }, signal), {
      valid: () => !disposed && epoch === context.epoch && preferences.style === context.style,
      discard: () => { if (jobContext === context) jobContext = null; },
      commit: result => {
        if (disposed || document.hidden || epoch !== context.epoch) { disposeVedutaTree(result.group, retainedMaterials); return; }
        // Native paints, finish, marker, geometry and the geographic origin switch together.
        try { onStyleReady(result.style); }
        catch (error) { disposeVedutaTree(result.group, retainedMaterials); throw error; }
        displayedStyle = result.style;
        const previous = scenery; scenery = result.group; scene.remove(previous); scene.add(scenery);
        if (origin !== result.origin) carPose = null;
        origin = result.origin; scale = result.scale; lastSceneryCentre = context.coordinate;
        committedRevision = context.revision; jobContext = null;
        disposeVedutaTree(previous, retainedMaterials); replaceMarker(); collectMaterials(); map.triggerRepaint();
        if (requestedRevision > committedRevision) repaint.schedule(lastSceneryAt + 1800);
      },
    });
  };
  return {
    id: 'veduta-illustration', type: 'custom', renderingMode: '3d',
    updatePreferences(next) {
      if (disposed) return;
      const changedMedium = preferences.style !== next.style;
      preferences = { ...next };
      if (car) replaceMarker();
      if (changedMedium) { invalidate(); lastSceneryAt = -Infinity; }
      map?.triggerRepaint();
    },
    onAdd(owner, gl) {
      map = owner;
      renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl }); renderer.autoClear = false;
      replaceMarker();
      map.on('sourcedata', requestScenery);
      document.addEventListener('visibilitychange', visibility);
    },
    render(gl, args) {
      if (disposed || document.hidden) return;
      const point = readPoint(); if (!point) return;
      try {
        const now = performance.now();
        const coordinate = maplibre.MercatorCoordinate.fromLngLat([point.longitude, point.latitude]);
        if (!origin) { origin = coordinate; scale = origin.meterInMercatorCoordinateUnits(); }
        // A moving request has one centre. Tile arrivals coalesce a compatible follow-up.
        if (jobContext && distanceFrom(point, jobContext.coordinate) > 180) { invalidate(); lastSceneryAt = -Infinity; }
        if (!jobContext && lastSceneryCentre && distanceFrom(point, lastSceneryCentre) > 180 && requestedRevision === committedRevision) requestedRevision++;
        const groundPoint = `${point.longitude.toFixed(7)}:${point.latitude.toFixed(7)}`;
        if (groundPoint !== lastGroundPoint) groundDirty = true;
        if (groundDirty && now - lastGroundAt >= 250) {
          const value = map.queryTerrainElevation([point.longitude, point.latitude]);
          if (Number.isFinite(value)) ground = value;
          lastGroundAt = now; groundDirty = false; lastGroundPoint = groundPoint;
        }
        if (groundDirty) repaint.schedule(lastGroundAt + 250);
        const xy = local([point.longitude, point.latitude]);
        if (!jobContext && requestedRevision > committedRevision && !document.hidden) {
          if (now - lastSceneryAt >= 1800) beginScenery(point);
          else repaint.schedule(lastSceneryAt + 1800);
        }
        const alpha = 1 - Math.exp(-Math.min(64, Math.max(0, now - (lastPoseAt || now))) / 180);
        lastPoseAt = now;
        if (!carPose || point.stale || point.reducedMotion) carPose = { x: xy[0], y: xy[1], heading: point.heading ?? 0 };
        else {
          carPose.x += (xy[0] - carPose.x) * alpha; carPose.y += (xy[1] - carPose.y) * alpha;
          carPose.heading += (((point.heading ?? carPose.heading) - carPose.heading + 540) % 360 - 180) * alpha;
        }
        if (!point.stale && !point.reducedMotion && (Math.hypot(xy[0] - carPose.x, xy[1] - carPose.y) > 0.005
          || Math.abs(((point.heading ?? carPose.heading) - carPose.heading + 540) % 360 - 180) > 0.01)) repaint.schedule(now + 16);
        car.position.set(carPose.x, carPose.y, (ground ?? 0) + 0.06); car.rotation.z = -carPose.heading * Math.PI / 180;
        // Optional silhouettes use their authored approximate metre dimensions.
        car.scale.setScalar(1);
        car.visible = Number.isFinite(ground) && (Number.isFinite(point.heading) || preferences.vehicle === 'point');
        if (fallback) { fallback.visible = Number.isFinite(ground) && !car.visible; fallback.position.copy(car.position); }
        // MapLibre's own ratio avoids a per-frame layout read of the canvas.
        const pixelRatio = map.getPixelRatio();
        for (const paint of pointMaterials) paint.uniforms.pixelRatio.value = pixelRatio;
        transform.makeTranslation(origin.x, origin.y, 0).scale(axes.set(scale, -scale, scale));
        projection.fromArray(args.defaultProjectionData.mainMatrix).multiply(transform); camera.projectionMatrix.copy(projection);
        inverse.copy(projection).invert(); eye.set(0, 0, 1, 0).applyMatrix4(inverse);
        const visibleEye = Math.abs(eye.w) > 1e-12;
        if (visibleEye) eye.multiplyScalar(1 / eye.w);
        const inkX = (origin.x * VEDUTA_WORLD_METRES) % 6400, inkY = (-origin.y * VEDUTA_WORLD_METRES) % 6400, inkScale = scale * VEDUTA_WORLD_METRES;
        for (const paint of shadedMaterials) {
          if (visibleEye) paint.uniforms.eye.value.set(eye.x, eye.y, eye.z);
          paint.uniforms.inkOffset.value.set(inkX, inkY); paint.uniforms.inkScale.value = inkScale;
        }
        renderer.resetState(); renderer.render(scene, camera); renderer.resetState();
      } catch (error) { onError(error); }
    },
    onRemove() {
      disposed = true; epoch++; queue.dispose(); stopBaker(); jobContext = null; repaint.dispose(); document.removeEventListener('visibilitychange', visibility); map.off('sourcedata', requestScenery);
      disposeVedutaTree(scene,retainedMaterials); scene.clear(); retainedMaterials.forEach(value => value.dispose()); retainedMaterials.clear(); worldMaterials.clear(); renderer?.dispose();
    },
  };
}
