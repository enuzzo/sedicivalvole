// MERIDIAN 03 — WebGL2 corridor renderer.
//
// Independently authored for sedicivalvole. No Three.js, no post-processing
// pipeline, and no code, geometry, palette, or scene content from either the
// Codrops/Tympanus Infinite Lights runtime or the existing Aperture renderer.
//
// What the upstream study contributed is grammar, recorded in meridian-model.js:
// a monotonic time rate instead of a position, one depth-parameterized
// displacement function shared by every element, a camera aimed along that
// field's local slope, several mutually incoherent scroll rates layered for
// parallax, and a widening projection carrying acceleration.
//
// The corridor contents are original: longitudinal meridian rails, abstract
// Euclidean portals and solids, high cloud slabs, and curved travelling wind. Glow is
// produced analytically inside each primitive rather than by a bloom pass, which
// keeps the frame cost predictable on the target vehicle.

import {
  advanceTimeOffset,
  lookAtFromDistortion,
  MERIDIAN_TRAVEL_LENGTH,
  meridianDistortionGlsl,
  speedToDistortionField,
  speedToLayerDensity,
  speedToProjection,
  speedToTimeRate,
} from "./meridian-model.js";

// Elements wrap past the camera rather than at it, so nothing pops out of
// existence in front of the viewer.
const CORRIDOR_OVERSHOOT = 40;
const RAIL_START_Z = 6;
const RAIL_SEGMENTS = 140;
// The corridor floor is a ruled surface rather than a filled plane: enough
// longitudinal lines that depth reads as a bending grid, drawn as one instanced
// draw call. The centre meridian is weighted so the travel axis stays legible.
const RAIL_HALF_WIDTH = 19;
const RAIL_LANE_COUNT = 21;
const RAIL_LANES = Array.from(
  { length: RAIL_LANE_COUNT },
  (_, index) => -RAIL_HALF_WIDTH + (index / (RAIL_LANE_COUNT - 1)) * RAIL_HALF_WIDTH * 2,
);
const RAIL_CENTRE_INDEX = (RAIL_LANE_COUNT - 1) / 2;
const STATION_COUNT = 72;
const STATION_EDGE_X = 17;
const MARKER_COUNT = 38;
const MARKER_LANES = [-13.4, -7.2, 7.2, 13.4];

const RAIL_SCROLL_RATE = 0.085;
const STATION_SCROLL_RATE = 26;
const MARKER_SCROLL_MIN = 34;
const MARKER_SCROLL_MAX = 63;

const KIND_POST = 0;
const KIND_RULE = 1;
const KIND_MARKER = 2;
const ARCHITECTURE_PAIR_COUNT = 24;
const CLOUD_PANEL_COUNT = 16;
const ARCHITECTURE_SCROLL_RATE = 26;

/** Deterministic generator so every session, capture, and QA pass matches. */
function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (random, minimum, maximum) => minimum + random() * (maximum - minimum);

function perspective(fovDegrees, aspect, near, far) {
  const f = 1 / Math.tan((fovDegrees * Math.PI) / 360);
  const range = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * range, -1,
    0, 0, near * far * range * 2, 0,
  ]);
}

function lookAt(eye, target, up) {
  const zx = eye[0] - target[0];
  const zy = eye[1] - target[1];
  const zz = eye[2] - target[2];
  let length = Math.hypot(zx, zy, zz) || 1;
  const z = [zx / length, zy / length, zz / length];

  let x = [
    up[1] * z[2] - up[2] * z[1],
    up[2] * z[0] - up[0] * z[2],
    up[0] * z[1] - up[1] * z[0],
  ];
  length = Math.hypot(x[0], x[1], x[2]) || 1;
  x = [x[0] / length, x[1] / length, x[2] / length];

  const y = [
    z[1] * x[2] - z[2] * x[1],
    z[2] * x[0] - z[0] * x[2],
    z[0] * x[1] - z[1] * x[0],
  ];

  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
    -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
    -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
    1,
  ]);
}

function multiply(a, b) {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) sum += a[k * 4 + row] * b[column * 4 + k];
      out[column * 4 + row] = sum;
    }
  }
  return out;
}

const SHARED_HEADER = `#version 300 es
  precision highp float;
  uniform mat4 u_viewProjection;
  uniform float u_travelLength;
  uniform float u_overshoot;
${meridianDistortionGlsl()}
`;

const RAIL_VERTEX = `${SHARED_HEADER}
  in vec3 a_position;
  in vec2 a_railUv;
  in float a_laneX;
  in float a_laneTone;
  in float a_laneWeight;

  out vec2 v_railUv;
  out float v_progress;
  out float v_tone;

  void main() {
    float progress = clamp(-a_position.z / u_travelLength, 0.0, 1.0);
    // Perspective shrinks apparent width by roughly the depth ratio, which
    // drives distant rails below one pixel and makes them shimmer and fade.
    // Widening with depth partly compensates so the ruled surface stays an
    // even technical drawing rather than dissolving into aliasing.
    float widen = 1.0 + 6.0 * progress;
    vec3 world = vec3(a_position.x * a_laneWeight * widen + a_laneX, a_position.y, a_position.z);
    world.xy += getDistortion(progress);
    gl_Position = u_viewProjection * vec4(world, 1.0);
    v_railUv = a_railUv;
    v_progress = progress;
    v_tone = a_laneTone;
  }
`;

const RAIL_FRAGMENT = `#version 300 es
  precision highp float;

  uniform vec3 u_mid;
  uniform vec3 u_light;
  uniform float u_railScroll;
  uniform float u_railGlow;
  uniform float u_fogDensity;

  in vec2 v_railUv;
  in float v_progress;
  in float v_tone;
  out vec4 outColor;

  void main() {
    float across = abs(v_railUv.x * 2.0 - 1.0);
    // Analytic edge width keeps the line from aliasing as it narrows.
    float edge = clamp(fwidth(across) * 1.5, 0.02, 1.0);
    float core = 1.0 - smoothstep(1.0 - edge, 1.0, across);
    float body = pow(core, 1.4);

    // Second, independent scroll rate: the rail texture advances at a different
    // rate from the stations and markers, which is what builds parallax from a
    // stationary camera.
    float tick = fract(v_railUv.y * 26.0 - u_railScroll);
    float pulse = smoothstep(0.86, 1.0, tick) * 0.85;

    float fog = exp(-v_progress * u_fogDensity) * (1.0 - smoothstep(0.38, 0.82, v_progress));
    vec3 tint = mix(u_mid, u_light, v_tone);
    // Additive blending contributes colour * alpha, so the colour stays
    // unscaled and the alpha alone carries intensity.
    float intensity = (body * 0.9 + body * pulse * 1.5) * u_railGlow * fog;
    outColor = vec4(tint, clamp(intensity, 0.0, 1.0));
  }
`;

const MARK_VERTEX = `${SHARED_HEADER}
  in vec2 a_corner;
  in vec3 a_offset;
  in vec3 a_size;
  in vec4 a_meta;     // kind, scrollSpeed, tone, visibilityKey
  in vec3 a_color;

  // u_time is declared by the shared displacement chunk in SHARED_HEADER.
  uniform float u_stationFraction;
  uniform float u_markerFraction;
  uniform float u_markerStretch;
  uniform float u_windCurve;

  out vec2 v_corner;
  out float v_progress;
  out float v_kind;
  out float v_alpha;
  out vec3 v_color;

  void main() {
    float kind = a_meta.x;
    float speed = a_meta.y;
    float visibilityKey = a_meta.w;

    // Layers arrive as a smooth threshold sweep rather than a pop, so the
    // corridor gains detail as one continuous world.
    float fraction = kind < 1.5 ? u_stationFraction : u_markerFraction;
    float alpha = smoothstep(visibilityKey, visibilityKey + 0.16, fraction);

    float stretch = kind > 1.5 ? u_markerStretch : 1.0;
    vec3 local = kind > 1.5
      ? vec3(0.0, a_corner.y * a_size.y, -a_corner.x * a_size.z * stretch)
      : vec3((a_corner.x - 0.5) * a_size.x, a_corner.y * a_size.y, 0.0);

    // Everything approaches on one wrapped corridor. Nothing is ever created or
    // destroyed, so no speed change can restart the world.
    float travelled = mod(a_offset.z + u_time * speed, u_travelLength + u_overshoot);
    vec3 world = vec3(a_offset.x, a_offset.y, 0.0) + local;
    world.z += -u_travelLength + travelled;

    if (kind > 1.5) {
      float windT = a_corner.x;
      float bendPhase = visibilityKey * 19.0;
      world.x += sin(windT * 3.14159265 + bendPhase) * u_windCurve * 3.8;
      world.y += (1.0 - cos(windT * 3.14159265)) * u_windCurve * 1.35;
    }

    float progress = clamp(-world.z / u_travelLength, 0.0, 1.0);
    world.xy += getDistortion(progress);

    gl_Position = u_viewProjection * vec4(world, 1.0);
    v_corner = a_corner;
    v_progress = progress;
    v_kind = kind;
    v_alpha = alpha;
    v_color = a_color;
  }
`;

const MARK_FRAGMENT = `#version 300 es
  precision highp float;

  uniform float u_fogDensity;

  in vec2 v_corner;
  in float v_progress;
  in float v_kind;
  in float v_alpha;
  in vec3 v_color;
  out vec4 outColor;

  void main() {
    float across = abs(v_corner.x * 2.0 - 1.0);
    float along = v_corner.y;

    float shape;
    if (v_kind > 1.5) {
      // Travelling marker: bright head, decaying tail, soft vertical falloff.
      float head = smoothstep(0.0, 0.55, 1.0 - v_corner.x);
      float thickness = 1.0 - smoothstep(0.0, 1.0, abs(along * 2.0 - 1.0));
      shape = pow(thickness, 1.8) * head;
    } else if (v_kind > 0.5) {
      // Phrase rule: an even transverse stroke.
      float thickness = 1.0 - smoothstep(0.0, 1.0, abs(along * 2.0 - 1.0));
      shape = pow(thickness, 2.2) * (1.0 - smoothstep(0.72, 1.0, across));
    } else {
      // Edge post: vertical stroke fading upward.
      float thickness = 1.0 - smoothstep(0.0, 1.0, across);
      shape = pow(thickness, 2.0) * (1.0 - smoothstep(0.15, 1.0, along) * 0.75);
    }

    float fog = exp(-v_progress * u_fogDensity) * (1.0 - smoothstep(0.38, 0.82, v_progress));
    // Elements passing the camera leave through a fade rather than sweeping
    // across the whole frame as a slash.
    float nearFade = smoothstep(0.0, 0.075, v_progress);
    float intensity = shape * v_alpha * fog * nearFade;
    if (intensity < 0.002) discard;
    outColor = vec4(v_color, clamp(intensity, 0.0, 1.0));
  }
`;

const ARCHITECTURE_VERTEX = `${SHARED_HEADER}
  in vec3 a_position;
  in vec3 a_normal;
  in vec2 a_uv;
  in vec3 a_offset;
  in vec3 a_scale;
  in vec4 a_meta; // scroll speed, visibility key, material, emissive amount
  in vec2 a_rotation; // yaw, roll

  uniform float u_architectureFraction;

  out vec3 v_normal;
  out vec2 v_uv;
  out float v_progress;
  out float v_alpha;
  out float v_material;
  out float v_emissive;

  void main() {
    float travelled = mod(a_offset.z + u_time * a_meta.x, u_travelLength + u_overshoot);
    vec3 local = a_position * a_scale;
    float cy = cos(a_rotation.x);
    float sy = sin(a_rotation.x);
    local.xz = mat2(cy, -sy, sy, cy) * local.xz;
    float cr = cos(a_rotation.y);
    float sr = sin(a_rotation.y);
    local.xy = mat2(cr, -sr, sr, cr) * local.xy;
    vec3 world = local + vec3(a_offset.x, a_offset.y, -u_travelLength + travelled);
    float progress = clamp(-world.z / u_travelLength, 0.0, 1.0);
    world.xy += getDistortion(progress);

    gl_Position = u_viewProjection * vec4(world, 1.0);
    vec3 normal = normalize(a_normal / max(a_scale, vec3(0.001)));
    normal.xz = mat2(cy, -sy, sy, cy) * normal.xz;
    normal.xy = mat2(cr, -sr, sr, cr) * normal.xy;
    v_normal = normal;
    v_uv = a_uv;
    v_progress = progress;
    v_alpha = smoothstep(a_meta.y, a_meta.y + 0.18, u_architectureFraction);
    v_material = a_meta.z;
    v_emissive = a_meta.w;
  }
`;

const ARCHITECTURE_FRAGMENT = `#version 300 es
  precision highp float;

  uniform vec3 u_base;
  uniform vec3 u_mid;
  uniform vec3 u_light;
  uniform vec3 u_accent;
  uniform vec3 u_secondary;
  uniform float u_fogDensity;
  uniform float u_volumeGlow;

  in vec3 v_normal;
  in vec2 v_uv;
  in float v_progress;
  in float v_alpha;
  in float v_material;
  in float v_emissive;
  out vec4 outColor;

  void main() {
    if (v_alpha < 0.002) discard;
    vec3 normal = normalize(v_normal);
    vec3 key = normalize(vec3(-0.45, 0.72, 0.48));
    vec3 fill = normalize(vec3(0.62, 0.18, 0.76));
    float diffuse = 0.18 + max(0.0, dot(normal, key)) * 0.70
      + max(0.0, dot(normal, fill)) * 0.16;
    float edgeDistance = min(min(v_uv.x, 1.0 - v_uv.x), min(v_uv.y, 1.0 - v_uv.y));
    float edge = 1.0 - smoothstep(0.0, 0.075, edgeDistance);

    vec3 solid = mix(u_mid * 0.48, mix(u_mid, u_light, 0.42), diffuse);
    vec3 glass = mix(u_base, u_secondary, 0.42 + diffuse * 0.22);
    vec3 cloudTone = mix(u_mid, u_light, 0.18 + diffuse * 0.16);
    vec3 material = v_material < 0.5 ? solid : (v_material < 1.5 ? glass : cloudTone);
    vec3 edgeTone = mix(u_light, u_accent, v_emissive);
    material += edgeTone * edge * (0.28 + 1.15 * v_emissive) * u_volumeGlow;

    float fog = exp(-v_progress * u_fogDensity) * (1.0 - smoothstep(0.62, 1.0, v_progress));
    vec3 colour = mix(u_base, material, fog);
    float glassAlpha = v_material < 0.5 ? 1.0 : (v_material < 1.5 ? 0.58 : 0.34);
    outColor = vec4(colour, v_alpha * glassAlpha * smoothstep(0.0, 0.04, v_progress));
  }
`;

const BACKGROUND_VERTEX = `#version 300 es
  precision highp float;
  out vec2 v_uv;
  void main() {
    vec2 position = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    v_uv = position * 0.5;
    gl_Position = vec4(position * 2.0 - 1.0, 0.999, 1.0);
  }
`;

const BACKGROUND_FRAGMENT = `#version 300 es
  precision highp float;
  uniform vec3 u_base;
  uniform vec3 u_mid;
  uniform vec3 u_accent;
  uniform float u_atmosphere;
  in vec2 v_uv;
  out vec4 outColor;
  void main() {
    vec2 centered = v_uv - vec2(0.5, 0.44);
    float horizon = exp(-pow(centered.y * 7.5, 2.0));
    float convergence = exp(-length(centered * vec2(1.25, 2.2)) * 4.2);
    float upperFalloff = smoothstep(1.05, 0.12, v_uv.y);
    vec3 colour = u_base;
    colour += u_mid * horizon * (0.12 + u_atmosphere * 0.24);
    colour += u_accent * convergence * horizon * u_atmosphere * 0.075;
    colour += u_mid * upperFalloff * 0.025;
    outColor = vec4(colour, 1.0);
  }
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`[meridian] shader compilation failed: ${log}`);
  }
  return shader;
}

function link(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`[meridian] program link failed: ${log}`);
  }
  return program;
}

function uniformsOf(gl, program, names) {
  const map = {};
  for (const name of names) map[name] = gl.getUniformLocation(program, name);
  return map;
}

function buildRailGeometry() {
  const positions = [];
  const uvs = [];
  for (let segment = 0; segment < RAIL_SEGMENTS; segment += 1) {
    const near = RAIL_START_Z - (segment / RAIL_SEGMENTS)
      * (MERIDIAN_TRAVEL_LENGTH + RAIL_START_Z);
    const far = RAIL_START_Z - ((segment + 1) / RAIL_SEGMENTS)
      * (MERIDIAN_TRAVEL_LENGTH + RAIL_START_Z);
    const vNear = segment / RAIL_SEGMENTS;
    const vFar = (segment + 1) / RAIL_SEGMENTS;
    const corners = [
      [-0.5, near, 0, vNear], [0.5, near, 1, vNear], [0.5, far, 1, vFar],
      [-0.5, near, 0, vNear], [0.5, far, 1, vFar], [-0.5, far, 0, vFar],
    ];
    for (const [x, z, u, v] of corners) {
      positions.push(x, 0, z);
      uvs.push(u, v);
    }
  }
  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    vertexCount: positions.length / 3,
  };
}

function buildMarkInstances(palette) {
  const random = createSeededRandom(0x5ed1c1a);
  const offsets = [];
  const sizes = [];
  const metas = [];
  const colors = [];

  const push = (offset, size, meta, color) => {
    offsets.push(offset[0], offset[1], offset[2]);
    sizes.push(size[0], size[1], size[2]);
    metas.push(meta[0], meta[1], meta[2], meta[3]);
    colors.push(color[0], color[1], color[2]);
  };

  const stationStep = (MERIDIAN_TRAVEL_LENGTH + CORRIDOR_OVERSHOOT) / STATION_COUNT;
  for (let station = 0; station < STATION_COUNT; station += 1) {
    const z = station * stationStep;
    // Keys start above zero so no layer can leak through at a standstill.
    const visibility = 0.02 + (station / STATION_COUNT) * 0.78;
    const isRule = station % 2 === 0;
    const isPhrase = station % 8 === 0;

    for (const side of [-1, 1]) {
      push(
        [side * STATION_EDGE_X, 0, z],
        [between(random, 0.16, 0.3), between(random, 1.5, 2.4), 0],
        [KIND_POST, STATION_SCROLL_RATE, 0, visibility],
        palette.accent,
      );
    }

    if (isRule) {
      push(
        [0, 0.03, z],
        [RAIL_HALF_WIDTH * 2, isPhrase ? 0.2 : 0.11, 0],
        [KIND_RULE, STATION_SCROLL_RATE, 0, visibility * 0.7],
        isPhrase ? palette.secondary : palette.mid,
      );
    }
  }

  for (let marker = 0; marker < MARKER_COUNT; marker += 1) {
    const lane = MARKER_LANES[marker % MARKER_LANES.length];
    const color = marker % 3 === 0 ? palette.accent : palette.light;
    push(
      [
        lane + between(random, -0.6, 0.6),
        between(random, 3.4, 10.8),
        random() * (MERIDIAN_TRAVEL_LENGTH + CORRIDOR_OVERSHOOT),
      ],
      [0, between(random, 0.08, 0.2), between(random, 10, 27)],
      [
        KIND_MARKER,
        between(random, MARKER_SCROLL_MIN, MARKER_SCROLL_MAX),
        0,
        0.05 + (marker / MARKER_COUNT) * 0.88,
      ],
      color,
    );
  }

  return {
    offsets: new Float32Array(offsets),
    sizes: new Float32Array(sizes),
    metas: new Float32Array(metas),
    colors: new Float32Array(colors),
    count: metas.length / 4,
  };
}

function buildCubeGeometry() {
  const positions = [];
  const normals = [];
  const uvs = [];
  const faces = [
    { n: [1, 0, 0], c: [[0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5]] },
    { n: [-1, 0, 0], c: [[-0.5, -0.5, 0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [-0.5, 0.5, 0.5]] },
    { n: [0, 1, 0], c: [[-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    { n: [0, -1, 0], c: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5]] },
    { n: [0, 0, 1], c: [[-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, -0.5, 0.5]] },
    { n: [0, 0, -1], c: [[0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5], [-0.5, -0.5, -0.5]] },
  ];
  const order = [0, 1, 2, 0, 2, 3];
  const faceUvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (const face of faces) {
    for (const index of order) {
      positions.push(...face.c[index]);
      normals.push(...face.n);
      uvs.push(...faceUvs[index]);
    }
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    vertexCount: positions.length / 3,
  };
}

function buildMarkStrip(segments = 12) {
  const corners = [];
  for (let segment = 0; segment < segments; segment += 1) {
    const x0 = segment / segments;
    const x1 = (segment + 1) / segments;
    corners.push(x0, 0, x1, 0, x1, 1, x0, 0, x1, 1, x0, 1);
  }
  return new Float32Array(corners);
}

function buildArchitectureInstances() {
  const random = createSeededRandom(0xa11ce7);
  const offsets = [];
  const scales = [];
  const metas = [];
  const rotations = [];
  const push = (offset, scale, meta, rotation = [0, 0]) => {
    offsets.push(...offset);
    scales.push(...scale);
    metas.push(...meta);
    rotations.push(...rotation);
  };
  const span = MERIDIAN_TRAVEL_LENGTH + CORRIDOR_OVERSHOOT;
  for (let index = 0; index < ARCHITECTURE_PAIR_COUNT; index += 1) {
    const z = (index / ARCHITECTURE_PAIR_COUNT) * span;
    // Reveal a deterministic cross-section of every depth band first. Tying
    // visibility to index alone made the resting city exist only at the horizon.
    const visibility = 0.025 + (index % 10) * 0.078;
    for (const side of [-1, 1]) {
      const family = index % 4;
      const x = side * between(random, 11.5, 17.5);
      const material = family === 2 ? 1 : 0;
      const emissive = family === 0 ? 0.82 : 0.2 + random() * 0.32;
      if (family === 0) {
        // Portal: two asymmetric piers and a floating lintel.
        const height = between(random, 8.5, 16.5);
        push([x - side * 2.4, height * 0.5, z], [1.2, height, 2.3], [ARCHITECTURE_SCROLL_RATE, visibility, 0, emissive], [0.06 * side, 0]);
        push([x + side * 2.0, height * 0.42, z + 0.7], [0.8, height * 0.84, 3.1], [ARCHITECTURE_SCROLL_RATE, visibility + 0.025, 1, emissive * 0.62], [-0.08 * side, 0.04 * side]);
        push([x, height, z], [6.2, 0.72, 2.0], [ARCHITECTURE_SCROLL_RATE, visibility + 0.04, 0, 0.72], [0.1 * side, 0.05 * side]);
      } else if (family === 1) {
        // Cantilevered cross: deliberately architectural without reading as a building.
        const height = between(random, 7, 14);
        push([x, height * 0.5, z], [1.5, height, between(random, 2, 4)], [ARCHITECTURE_SCROLL_RATE, visibility, 0, emissive], [0.14 * side, 0.08 * side]);
        push([x - side * 1.8, height * 0.72, z - 0.8], [6.8, 0.75, 2.1], [ARCHITECTURE_SCROLL_RATE, visibility + 0.035, 1, 0.56], [-0.16 * side, -0.04 * side]);
      } else if (family === 2) {
        // Faceted blade assembled from offset, rotated prisms.
        const height = between(random, 10, 20);
        push([x, height * 0.5, z], [between(random, 1.3, 2.5), height, 3.5], [ARCHITECTURE_SCROLL_RATE, visibility, material, emissive], [between(random, -0.32, 0.32), 0.13 * side]);
        push([x + side * 1.5, height * 0.34, z + 1.1], [0.8, height * 0.56, 5.2], [ARCHITECTURE_SCROLL_RATE, visibility + 0.05, 0, 0.44], [-0.25 * side, -0.09 * side]);
      } else {
        // Stepped monolith with suspended cap.
        const height = between(random, 6, 12);
        push([x, height * 0.5, z], [4.2, height, 3.3], [ARCHITECTURE_SCROLL_RATE, visibility, 0, emissive], [0.08 * side, 0]);
        push([x - side * 1.2, height + 2.2, z - 0.6], [2.4, 4.2, 2.1], [ARCHITECTURE_SCROLL_RATE, visibility + 0.035, 1, 0.68], [-0.12 * side, 0.06 * side]);
      }
    }
  }
  for (let index = 0; index < CLOUD_PANEL_COUNT; index += 1) {
    const z = (index / CLOUD_PANEL_COUNT) * span;
    push(
      [between(random, -8, 8), between(random, 19, 34), z],
      [between(random, 10, 25), between(random, 0.2, 0.58), between(random, 5, 14)],
      [ARCHITECTURE_SCROLL_RATE * 0.72, 0.18 + (index % 8) * 0.075, 2, index % 4 === 0 ? 0.46 : 0.12],
      [between(random, -0.28, 0.28), between(random, -0.05, 0.05)],
    );
  }
  return {
    offsets: new Float32Array(offsets),
    scales: new Float32Array(scales),
    metas: new Float32Array(metas),
    rotations: new Float32Array(rotations),
    count: metas.length / 4,
  };
}

function attachInstanced(gl, program, name, data, components) {
  const location = gl.getAttribLocation(program, name);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  if (location >= 0) {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, components, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(location, 1);
  }
  return buffer;
}

function attachVertex(gl, program, name, data, components) {
  const location = gl.getAttribLocation(program, name);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  if (location >= 0) {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, components, gl.FLOAT, false, 0, 0);
  }
  return buffer;
}

/**
 * Reports whether this browser can create a WebGL2 context at all.
 *
 * The caller must ask before `createMeridianRenderer`: requesting a WebGL2
 * context permanently fixes a canvas's context type, so a canvas that has been
 * handed to WebGL can never fall back to Canvas2D. The probe uses a throwaway
 * canvas so the real surface stays uncommitted.
 */
export function meridianWebglAvailable() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

/**
 * Creates the MERIDIAN renderer, or returns `null` when the context or the
 * programs cannot be created. A `null` here means the shaders failed, not that
 * Canvas2D is still available on this canvas — see `meridianWebglAvailable`.
 */
export function createMeridianRenderer(canvas, initialPalette) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  let palette = initialPalette;
  let railProgram;
  let markProgram;
  let architectureProgram;
  let backgroundProgram;
  try {
    railProgram = link(gl, RAIL_VERTEX, RAIL_FRAGMENT);
    markProgram = link(gl, MARK_VERTEX, MARK_FRAGMENT);
    architectureProgram = link(gl, ARCHITECTURE_VERTEX, ARCHITECTURE_FRAGMENT);
    backgroundProgram = link(gl, BACKGROUND_VERTEX, BACKGROUND_FRAGMENT);
  } catch (error) {
    console.warn(String(error));
    return null;
  }

  const distortionUniforms = [
    "u_viewProjection", "u_travelLength", "u_overshoot", "u_time", "u_swayAmplitude",
    "u_swayFrequency", "u_liftAmplitude", "u_rollAmplitude", "u_rollFrequency",
  ];
  const railUniforms = uniformsOf(gl, railProgram, [
    ...distortionUniforms, "u_mid", "u_light",
    "u_railScroll", "u_railGlow", "u_fogDensity",
  ]);
  const markUniforms = uniformsOf(gl, markProgram, [
    ...distortionUniforms, "u_stationFraction", "u_markerFraction",
    "u_markerStretch", "u_windCurve", "u_fogDensity",
  ]);
  const architectureUniforms = uniformsOf(gl, architectureProgram, [
    ...distortionUniforms, "u_architectureFraction", "u_base", "u_mid", "u_light",
    "u_accent", "u_secondary", "u_fogDensity", "u_volumeGlow",
  ]);
  const backgroundUniforms = uniformsOf(gl, backgroundProgram, [
    "u_base", "u_mid", "u_accent", "u_atmosphere",
  ]);
  const backgroundVao = gl.createVertexArray();

  const rail = buildRailGeometry();
  const railVao = gl.createVertexArray();
  gl.bindVertexArray(railVao);
  const railBuffers = [
    attachVertex(gl, railProgram, "a_position", rail.positions, 3),
    attachVertex(gl, railProgram, "a_railUv", rail.uvs, 2),
    attachInstanced(gl, railProgram, "a_laneX", new Float32Array(RAIL_LANES), 1),
    attachInstanced(
      gl, railProgram, "a_laneTone",
      new Float32Array(RAIL_LANES.map((_, index) => {
        const offset = Math.abs(index - RAIL_CENTRE_INDEX) / RAIL_CENTRE_INDEX;
        return index === RAIL_CENTRE_INDEX ? 1 : 0.5 - offset * 0.35;
      })),
      1,
    ),
    attachInstanced(
      gl, railProgram, "a_laneWeight",
      new Float32Array(RAIL_LANES.map(
        (_, index) => (index === RAIL_CENTRE_INDEX ? 0.105 : 0.065),
      )),
      1,
    ),
  ];

  let marks = buildMarkInstances(palette);
  const markVao = gl.createVertexArray();
  gl.bindVertexArray(markVao);
  const corner = buildMarkStrip();
  const markCornerBuffer = attachVertex(gl, markProgram, "a_corner", corner, 2);
  const markOffsetBuffer = attachInstanced(gl, markProgram, "a_offset", marks.offsets, 3);
  const markSizeBuffer = attachInstanced(gl, markProgram, "a_size", marks.sizes, 3);
  const markMetaBuffer = attachInstanced(gl, markProgram, "a_meta", marks.metas, 4);
  const markColorBuffer = attachInstanced(gl, markProgram, "a_color", marks.colors, 3);
  gl.bindVertexArray(null);

  const cube = buildCubeGeometry();
  const architecture = buildArchitectureInstances();
  const architectureVao = gl.createVertexArray();
  gl.bindVertexArray(architectureVao);
  const architectureBuffers = [
    attachVertex(gl, architectureProgram, "a_position", cube.positions, 3),
    attachVertex(gl, architectureProgram, "a_normal", cube.normals, 3),
    attachVertex(gl, architectureProgram, "a_uv", cube.uvs, 2),
    attachInstanced(gl, architectureProgram, "a_offset", architecture.offsets, 3),
    attachInstanced(gl, architectureProgram, "a_scale", architecture.scales, 3),
    attachInstanced(gl, architectureProgram, "a_meta", architecture.metas, 4),
    attachInstanced(gl, architectureProgram, "a_rotation", architecture.rotations, 2),
  ];
  gl.bindVertexArray(null);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);

  let timeOffset = 0;
  let railScroll = 0;
  let width = 1;
  let height = 1;
  let disposed = false;

  const setDistortionUniforms = (uniforms, field, viewProjection) => {
    gl.uniformMatrix4fv(uniforms.u_viewProjection, false, viewProjection);
    gl.uniform1f(uniforms.u_travelLength, MERIDIAN_TRAVEL_LENGTH);
    gl.uniform1f(uniforms.u_overshoot, CORRIDOR_OVERSHOOT);
    gl.uniform1f(uniforms.u_time, timeOffset);
    gl.uniform1f(uniforms.u_swayAmplitude, field.swayAmplitude);
    gl.uniform1f(uniforms.u_swayFrequency, field.swayFrequency);
    gl.uniform1f(uniforms.u_liftAmplitude, field.liftAmplitude);
    gl.uniform1f(uniforms.u_rollAmplitude, field.rollAmplitude);
    gl.uniform1f(uniforms.u_rollFrequency, field.rollFrequency);
  };

  return {
    label: "WebGL2 · Meridian corridor",

    setPalette(nextPalette) {
      palette = nextPalette;
      marks = buildMarkInstances(palette);
      gl.bindVertexArray(markVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, markColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, marks.colors, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
    },

    resize(nextWidth, nextHeight) {
      width = Math.max(1, Math.floor(nextWidth));
      height = Math.max(1, Math.floor(nextHeight));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    },

    render({ speedKmh, deltaSeconds, reducedMotion }) {
      if (disposed) return;

      const speed = reducedMotion ? Math.min(speedKmh, 20) : speedKmh;
      const rate = speedToTimeRate(speed);
      timeOffset = advanceTimeOffset(timeOffset, rate, deltaSeconds);
      railScroll += rate * RAIL_SCROLL_RATE * Math.max(0, Math.min(deltaSeconds, 0.25)) * 60;

      const field = speedToDistortionField(speed);
      const density = speedToLayerDensity(speed);
      const projection = speedToProjection(speed);
      const aim = lookAtFromDistortion(timeOffset, field);

      const eye = [0, projection.cameraLift, 0];
      const viewProjection = multiply(
        perspective(
          reducedMotion ? Math.min(projection.fovDegrees, 82) : projection.fovDegrees,
          width / height,
          0.1,
          MERIDIAN_TRAVEL_LENGTH * 1.6,
        ),
        lookAt(eye, [eye[0] + aim.x, eye[1] + aim.y, eye[2] + aim.z], [0, 1, 0]),
      );

      gl.viewport(0, 0, width, height);
      gl.clearColor(palette.base[0], palette.base[1], palette.base[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.useProgram(backgroundProgram);
      gl.bindVertexArray(backgroundVao);
      gl.uniform3fv(backgroundUniforms.u_base, palette.base);
      gl.uniform3fv(backgroundUniforms.u_mid, palette.mid);
      gl.uniform3fv(backgroundUniforms.u_accent, palette.accent);
      gl.uniform1f(backgroundUniforms.u_atmosphere, density.atmosphereFraction);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);

      gl.depthMask(true);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(architectureProgram);
      gl.bindVertexArray(architectureVao);
      setDistortionUniforms(architectureUniforms, field, viewProjection);
      gl.uniform1f(architectureUniforms.u_architectureFraction, density.architectureFraction);
      gl.uniform3fv(architectureUniforms.u_base, palette.base);
      gl.uniform3fv(architectureUniforms.u_mid, palette.mid);
      gl.uniform3fv(architectureUniforms.u_light, palette.light);
      gl.uniform3fv(architectureUniforms.u_accent, palette.accent);
      gl.uniform3fv(architectureUniforms.u_secondary, palette.secondary);
      gl.uniform1f(architectureUniforms.u_fogDensity, 1.85);
      gl.uniform1f(architectureUniforms.u_volumeGlow, density.volumeGlow);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, cube.vertexCount, architecture.count);

      gl.depthMask(false);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(railProgram);
      gl.bindVertexArray(railVao);
      setDistortionUniforms(railUniforms, field, viewProjection);
      gl.uniform3fv(railUniforms.u_mid, palette.mid);
      gl.uniform3fv(railUniforms.u_light, palette.light);
      gl.uniform1f(railUniforms.u_railScroll, railScroll);
      gl.uniform1f(railUniforms.u_railGlow, density.railGlow);
      gl.uniform1f(railUniforms.u_fogDensity, 2.5);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, rail.vertexCount, RAIL_LANES.length);

      gl.useProgram(markProgram);
      gl.bindVertexArray(markVao);
      setDistortionUniforms(markUniforms, field, viewProjection);
      gl.uniform1f(markUniforms.u_stationFraction, density.gateFraction);
      gl.uniform1f(markUniforms.u_markerFraction, density.streakFraction);
      gl.uniform1f(markUniforms.u_markerStretch, density.streakStretch);
      gl.uniform1f(markUniforms.u_windCurve, density.atmosphereFraction);
      gl.uniform1f(markUniforms.u_fogDensity, 2.4);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, corner.length / 2, marks.count);

      gl.bindVertexArray(null);
      gl.depthMask(true);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      for (const buffer of railBuffers) gl.deleteBuffer(buffer);
      for (const buffer of [
        markCornerBuffer, markOffsetBuffer, markSizeBuffer, markMetaBuffer, markColorBuffer,
      ]) gl.deleteBuffer(buffer);
      gl.deleteVertexArray(railVao);
      gl.deleteVertexArray(markVao);
      for (const buffer of architectureBuffers) gl.deleteBuffer(buffer);
      gl.deleteVertexArray(architectureVao);
      gl.deleteVertexArray(backgroundVao);
      gl.deleteProgram(railProgram);
      gl.deleteProgram(markProgram);
      gl.deleteProgram(architectureProgram);
      gl.deleteProgram(backgroundProgram);
    },
  };
}
