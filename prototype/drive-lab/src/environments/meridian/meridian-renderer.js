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
// folded light galleries, low shoulder planes, and travelling light. Glow is
// produced analytically inside each primitive rather than by a bloom pass, which
// keeps the frame cost predictable on the target vehicle.

import {
  advanceMeridianVisualResponse,
  advanceTimeOffset,
  distortionAt,
  lookAtFromDistortion,
  MERIDIAN_TRAVEL_LENGTH,
  meridianDistortionGlsl,
  speedToDistortionField,
  speedToLayerDensity,
  speedToPeripheralDeformation,
  speedToProjection,
  speedToTimeRate,
} from "./meridian-model.js";
import { visualCurveTarget, advanceCurveSpring } from "../../motion/aperture-curve.js";

// Elements wrap past the camera rather than at it, so nothing pops out of
// existence in front of the viewer.
const CORRIDOR_OVERSHOOT = 40;
const RAIL_START_Z = 6;
const RAIL_SEGMENTS = 140;
// The corridor floor is a ruled surface rather than a filled plane: enough
// longitudinal lines that depth reads as a bending grid, drawn as one instanced
// draw call. The centre meridian is weighted so the travel axis stays legible.
const RAIL_HALF_WIDTH = 15;
const RAIL_LANES = [-14.2, -10.2, -6.1, 0, 6.1, 10.2, 14.2];
const RAIL_LANE_COUNT = RAIL_LANES.length;
const RAIL_CENTRE_INDEX = (RAIL_LANE_COUNT - 1) / 2;
const STATION_COUNT = 0;
const STATION_EDGE_X = 16;
const MARKER_COUNT = 32;
const MARKER_LANES = [-16.5, -12.5, 12.5, 16.5];

const RAIL_SCROLL_RATE = 0.085;
const STATION_SCROLL_RATE = 26;
const MARKER_SCROLL_MIN = 34;
const MARKER_SCROLL_MAX = 63;

const KIND_POST = 0;
const KIND_RULE = 1;
const KIND_MARKER = 2;
const ARCHITECTURE_PAIR_COUNT = 12;
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

/** Column-major projection of a world point to 0–1 screen coordinates, clamped. */
function projectToUv(matrix, [x, y, z]) {
  const clipX = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
  const clipY = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
  const clipW = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  if (!(clipW > 1e-4)) return [0.5, 0.42];
  return [
    Math.min(0.92, Math.max(0.08, clipX / clipW * 0.5 + 0.5)),
    Math.min(0.8, Math.max(0.2, clipY / clipW * 0.5 + 0.5)),
  ];
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
  uniform float u_depthCompression;
  uniform float u_peripheralStretch;
  uniform float u_peripheralParallax;
${meridianDistortionGlsl()}

  vec3 applySpeedLens(vec3 world, float progress) {
    float edge = smoothstep(5.0, 17.0, abs(world.x));
    float nearWeight = 1.0 - smoothstep(0.1, 0.92, progress);
    world.x *= mix(1.0, u_peripheralStretch, edge * nearWeight);
    world.x += sign(world.x) * u_peripheralParallax * edge * nearWeight * 2.4;
    world.z *= u_depthCompression;
    return world;
  }
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
    world = applySpeedLens(world, progress);
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
  uniform vec3 u_accent;
  uniform vec3 u_secondary;
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
    vec3 tint = v_tone > 2.5
      ? u_secondary
      : (v_tone > 1.5 ? u_accent : mix(u_mid, u_light, v_tone));
    // Additive blending contributes colour * alpha, so the colour stays
    // unscaled and the alpha alone carries intensity.
    float intensity = (body * 1.2 + body * pulse * 1.75) * u_railGlow * fog;
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
    world = applySpeedLens(world, progress);

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
  in vec2 a_shear; // x and z shear per unit height

  uniform float u_architectureFraction;

  out vec3 v_normal;
  out vec2 v_uv;
  out float v_progress;
  out float v_alpha;
  out float v_material;
  out float v_emissive;

  void main() {
    float travelled = mod(a_offset.z + u_time * a_meta.x, u_travelLength + u_overshoot);
    vec3 sheared = a_position;
    sheared.x += sheared.y * a_shear.x;
    sheared.z += sheared.y * a_shear.y;
    vec3 local = sheared * a_scale;
    float cy = cos(a_rotation.x);
    float sy = sin(a_rotation.x);
    local.xz = mat2(cy, -sy, sy, cy) * local.xz;
    float cr = cos(a_rotation.y);
    float sr = sin(a_rotation.y);
    local.xy = mat2(cr, -sr, sr, cr) * local.xy;
    vec3 world = local + vec3(a_offset.x, a_offset.y, -u_travelLength + travelled);
    float progress = clamp(-world.z / u_travelLength, 0.0, 1.0);
    world.xy += getDistortion(progress);
    world = applySpeedLens(world, progress);

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
  uniform vec3 u_fogColor;

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

    // Deep coloured faces and bright bevels give the blades thickness without
    // turning every surface into the same pale slab.
    vec3 solid = mix(u_mid * 0.38, mix(u_accent, u_light, 0.16), diffuse * 0.64);
    vec3 glass = mix(u_base, u_secondary, 0.14 + diffuse * 0.24);
    vec3 accentSolid = mix(u_accent * 0.38, u_accent, 0.34 + diffuse * 0.42);
    vec3 secondarySolid = mix(u_accent * 0.28, mix(u_accent, u_secondary, 0.42), 0.2 + diffuse * 0.48);
    vec3 material = v_material < 0.5
      ? solid
      : (v_material < 1.5 ? glass : (v_material < 2.5 ? accentSolid : secondarySolid));
    vec3 edgeTone = mix(u_light, u_accent, v_emissive);
    float bevel = 1.0 - smoothstep(0.0, max(0.022, fwidth(edgeDistance) * 1.5), edgeDistance);
    material += edgeTone * (edge * 0.45 + bevel * 1.1) * (0.3 + v_emissive) * u_volumeGlow;
    // An inset light seam and a broad satin sweep make each face read as a
    // crafted panel. Both are analytic, palette-owned and stable in local UVs.
    float seamDistance = abs(v_uv.x - (0.18 + v_uv.y * 0.08));
    float seam = exp(-seamDistance * 75.0) * smoothstep(0.0, 0.12, v_uv.y)
      * (1.0 - smoothstep(0.86, 1.0, v_uv.y));
    float satin = pow(max(0.0, 1.0 - abs(v_uv.x + v_uv.y * 0.26 - 0.65)), 8.0);
    material += mix(u_accent, u_secondary, 0.65) * (seam * 0.9 + satin * 0.09) * v_emissive;
    // Dark floor panels catch a restrained reflection of the two palette lights.
    if (v_material > 3.5 && v_material < 4.5) {
      float shoulderLight = pow(abs(v_uv.x * 2.0 - 1.0), 3.0);
      material = mix(u_base, u_mid, 0.1) + mix(u_accent, u_secondary, v_uv.x) * shoulderLight * 0.09;
    }
    // Portal frames: a lit core with brighter bevels, the corridor's rhythm.
    if (v_material > 4.5) {
      vec3 core = mix(u_accent, u_light, 0.26);
      material = core * (0.58 + diffuse * 0.28)
        + mix(u_light, u_accent, 0.25) * (edge * 0.5 + bevel * 1.25) * (0.4 + u_volumeGlow * 0.6);
    }

    // Distance dissolves into the dusk horizon rather than into black.
    float fog = exp(-v_progress * u_fogDensity) * (1.0 - smoothstep(0.62, 1.0, v_progress));
    vec3 colour = mix(u_fogColor, material, fog);
    float glassAlpha = v_material > 0.5 && v_material < 1.5 ? 0.92 : 1.0;
    // Portals passing overhead dissolve early instead of sweeping the frame.
    float nearFade = smoothstep(0.0, v_material > 4.5 ? 0.16 : 0.04, v_progress);
    outColor = vec4(colour, v_alpha * glassAlpha * nearFade);
  }
`;

const BACKGROUND_VERTEX = `#version 300 es
  precision highp float;
  out vec2 v_uv;
  void main() {
    vec2 position = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    v_uv = position;
    gl_Position = vec4(position * 2.0 - 1.0, 0.999, 1.0);
  }
`;

const BACKGROUND_FRAGMENT = `#version 300 es
  precision highp float;
  uniform vec3 u_base;
  uniform vec3 u_mid;
  uniform vec3 u_light;
  uniform vec3 u_accent;
  uniform float u_atmosphere;
  uniform float u_flow;
  uniform float u_aspect;
  uniform float u_sunScale;
  uniform float u_bank;
  uniform vec2 u_vanish;
  in vec2 v_uv;
  out vec4 outColor;
  void main() {
    // The sky banks with the camera around the corridor's vanishing point.
    vec2 local = vec2((v_uv.x - u_vanish.x) * u_aspect, v_uv.y - u_vanish.y);
    float bankCos = cos(u_bank);
    float bankSin = sin(u_bank);
    local = vec2(local.x * bankCos + local.y * bankSin, -local.x * bankSin + local.y * bankCos);
    vec2 uv = vec2(u_vanish.x + local.x / u_aspect, u_vanish.y + local.y);
    // The corridor's own vanishing point, projected from the 3D scene, anchors
    // the horizon; when the road bends the sun and its reflection travel with it.
    float horizon = u_vanish.y;
    float above = uv.y - horizon;
    vec3 horizonTone = mix(u_mid, u_accent, 0.55);
    vec3 sunTone = mix(u_accent, u_light, 0.42);

    // Sky: the palette's deepest tone overhead, warming toward the meridian.
    float skyT = clamp(above / max(0.05, 1.0 - horizon), 0.0, 1.0);
    vec3 sky = mix(horizonTone * (0.30 + u_atmosphere * 0.10), u_base, pow(skyT, 0.5));
    vec2 fromSun = vec2((uv.x - u_vanish.x) * u_aspect, above - 0.035);
    float radius = length(fromSun);
    float sunRadius = 0.07 * u_sunScale;
    float disc = 1.0 - smoothstep(sunRadius - 0.004, sunRadius, radius);
    float halo = exp(-radius * 5.5) * 0.4 + exp(-radius * 16.0) * 0.28;
    sky += sunTone * halo * (0.6 + u_atmosphere * 0.4);
    // The disc sets behind the meridian: only its upper part shows, lighter at
    // the crown and deepening toward the horizon.
    vec3 discTone = mix(u_accent * 0.9, mix(u_light, u_accent, 0.35), clamp(fromSun.y / sunRadius * 0.5 + 0.5, 0.0, 1.0));
    sky = mix(sky, discTone, disc * smoothstep(0.0, 0.004, above));

    // Road: dark, catching one soft vertical reflection beneath the sun.
    float below = -above;
    vec3 ground = mix(u_base, horizonTone * 0.22, exp(-below * 8.0));
    float streak = exp(-abs(uv.x - u_vanish.x) * u_aspect * 9.0) * exp(-below * 2.0);
    ground += sunTone * streak * 0.3;

    vec3 colour = above >= 0.0 ? sky : ground;
    // The meridian itself: one fine lit line with a restrained halo.
    float line = exp(-abs(above) * 900.0) * 0.85 + exp(-abs(above) * 55.0) * 0.16;
    colour += mix(u_light, u_accent, 0.35) * line;
    colour += u_mid * u_flow * exp(-length(vec2((uv.x - u_vanish.x) * u_aspect, above)) * 4.0) * 0.02;
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
        between(random, 0.35, 4.8),
        random() * (MERIDIAN_TRAVEL_LENGTH + CORRIDOR_OVERSHOOT),
      ],
      [0, between(random, 0.06, 0.15), between(random, 16, 42)],
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
      const [x, y, z] = face.c[index];
      // Shear is applied per instance, so portal frames stay square while the
      // outer blades keep their directional, skewed silhouette.
      positions.push(x, y, z);
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
  const shears = [];
  const push = (offset, scale, meta, rotation = [0, 0], shear = [0, 0]) => {
    offsets.push(...offset);
    scales.push(...scale);
    metas.push(...meta);
    rotations.push(...rotation);
    shears.push(...shear);
  };
  const span = MERIDIAN_TRAVEL_LENGTH + CORRIDOR_OVERSHOOT;
  const portal = (z, halfWidth, height, thickness, material, emissive, visibility) => {
    for (const side of [-1, 1]) {
      push([side * halfWidth, height / 2, z], [thickness, height, thickness], [ARCHITECTURE_SCROLL_RATE, visibility, material, emissive]);
    }
    push([0, height, z], [halfWidth * 2 + thickness, thickness, thickness], [ARCHITECTURE_SCROLL_RATE, visibility, material, emissive]);
  };
  for (let index = 0; index < ARCHITECTURE_PAIR_COUNT; index += 1) {
    const z = (index / ARCHITECTURE_PAIR_COUNT) * span;
    // One lit portal per station: the regular rhythm that makes both speed and
    // the bend of the road legible at a glance. Always present, even at rest.
    portal(z, 12.4, 10.4, 0.55, 5, 0.95, 0);
    // Every third station doubles the frame just behind it, in the secondary
    // tone, so the corridor reads as layered depth rather than a repeated sign.
    if (index % 3 === 0) portal(z - 3.4, 10.6, 8.6, 0.34, 3, 0.8, 0.06);
    // A dark soffit over alternate portals carries overhead parallax.
    if (index % 4 === 2) {
      push([0, 11.3, z - 4.2], [25.4, 0.16, 8.2], [ARCHITECTURE_SCROLL_RATE, 0.1, 1, 0.5]);
    }
    for (const side of [-1, 1]) {
      // Low shoulder walls close the corridor at road level with a lit top seam.
      push(
        [side * 16.2, 0.9, z + 0.9],
        [1.4, 1.8, 17.5],
        [ARCHITECTURE_SCROLL_RATE, 0.02, 1, 0.46],
        [side * between(random, 0.0, 0.04), 0],
      );
      // Three solid longitudinal bands make motorway optical flow visible.
      for (let band = 0; band < 3; band += 1) {
        push(
          [side * (8.9 + band * 2.0), 0.45 + band * 0.8, z - 1.0 - band * 1.4],
          [0.16 + band * 0.07, 0.10 + band * 0.025, 18 + band * 3],
          [ARCHITECTURE_SCROLL_RATE, 0.012 + band * 0.012, band === 0 ? 0 : band + 1, 0.98],
          [side * (0.04 + band * 0.026), 0],
        );
      }
    }
    // Sparse outer blades, alternating sides, keep Meridian's folded character
    // at the periphery without cluttering the travel axis.
    const side = index % 2 === 0 ? -1 : 1;
    const height = 13 + (index % 3) * 2.5;
    push(
      [side * (20.5 + (index % 3) * 1.4), height * 0.46, z + 6.5],
      [1.1, height, 4.8],
      [ARCHITECTURE_SCROLL_RATE, 0.08 + (index % 4) * 0.05, index % 4 === 0 ? 2 : 0, 0.6],
      [side * 0.12, side * 0.22],
      [-side * 0.34, 0.08],
    );
  }
  return {
    offsets: new Float32Array(offsets),
    scales: new Float32Array(scales),
    metas: new Float32Array(metas),
    rotations: new Float32Array(rotations),
    shears: new Float32Array(shears),
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
    antialias: true,
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
    "u_depthCompression", "u_peripheralStretch", "u_peripheralParallax", "u_roadCurve",
  ];
  const railUniforms = uniformsOf(gl, railProgram, [
    ...distortionUniforms, "u_mid", "u_light", "u_accent", "u_secondary",
    "u_railScroll", "u_railGlow", "u_fogDensity",
  ]);
  const markUniforms = uniformsOf(gl, markProgram, [
    ...distortionUniforms, "u_stationFraction", "u_markerFraction",
    "u_markerStretch", "u_windCurve", "u_fogDensity",
  ]);
  const architectureUniforms = uniformsOf(gl, architectureProgram, [
    ...distortionUniforms, "u_architectureFraction", "u_base", "u_mid", "u_light",
    "u_accent", "u_secondary", "u_fogDensity", "u_volumeGlow", "u_fogColor",
  ]);
  const backgroundUniforms = uniformsOf(gl, backgroundProgram, [
    "u_base", "u_mid", "u_light", "u_accent", "u_atmosphere", "u_flow", "u_aspect", "u_vanish", "u_sunScale", "u_bank",
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
        if (index === RAIL_CENTRE_INDEX) return 1;
        if (index === 0 || index === RAIL_LANES.length - 1) return 2;
        if (index === 1 || index === RAIL_LANES.length - 2) return 3;
        return 0.92;
      })),
      1,
    ),
    attachInstanced(
      gl, railProgram, "a_laneWeight",
      new Float32Array(RAIL_LANES.map(
        (_, index) => (index === RAIL_CENTRE_INDEX ? 0.09 : 0.17),
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
    attachInstanced(gl, architectureProgram, "a_shear", architecture.shears, 2),
  ];
  gl.bindVertexArray(null);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);

  let timeOffset = 0;
  let roadCurveSpring = { value: 0, velocity: 0 };
  let railScroll = 0;
  let visualResponse = null;
  // A recovered renderer may reuse a canvas whose backing size is already set.
  let width = Math.max(1, canvas.width);
  let height = Math.max(1, canvas.height);
  let disposed = false;

  const setDistortionUniforms = (uniforms, field, lens, viewProjection) => {
    gl.uniformMatrix4fv(uniforms.u_viewProjection, false, viewProjection);
    gl.uniform1f(uniforms.u_travelLength, MERIDIAN_TRAVEL_LENGTH);
    gl.uniform1f(uniforms.u_overshoot, CORRIDOR_OVERSHOOT);
    gl.uniform1f(uniforms.u_time, timeOffset);
    gl.uniform1f(uniforms.u_swayAmplitude, field.swayAmplitude);
    gl.uniform1f(uniforms.u_swayFrequency, field.swayFrequency);
    gl.uniform1f(uniforms.u_liftAmplitude, field.liftAmplitude);
    gl.uniform1f(uniforms.u_rollAmplitude, field.rollAmplitude);
    gl.uniform1f(uniforms.u_rollFrequency, field.rollFrequency);
    gl.uniform1f(uniforms.u_roadCurve, field.roadCurve);
    gl.uniform1f(uniforms.u_depthCompression, lens.depthCompression);
    gl.uniform1f(uniforms.u_peripheralStretch, lens.peripheralStretch);
    gl.uniform1f(uniforms.u_peripheralParallax, lens.peripheralParallax);
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

    render({ speedKmh, deltaSeconds, reducedMotion, effect, motionSample }) {
      if (disposed) return;
      // The road bend is a continuous spring over coarse GPS heading, slightly
      // stronger than the shared target so the portals visibly swing away.
      roadCurveSpring = advanceCurveSpring(roadCurveSpring, Math.max(-1, Math.min(1, visualCurveTarget(motionSample, speedKmh, reducedMotion) * 1.15)), deltaSeconds);
      const roadCurve = roadCurveSpring.value;

      visualResponse = advanceMeridianVisualResponse(
        visualResponse,
        reducedMotion ? Math.min(speedKmh, 20) : speedKmh,
        effect,
        deltaSeconds,
      );
      const { speedKmh: speed, effectProfile } = visualResponse;
      const rate = speedToTimeRate(speed) * effectProfile.rateScale;
      timeOffset = advanceTimeOffset(timeOffset, rate, deltaSeconds);
      railScroll += rate * RAIL_SCROLL_RATE * Math.max(0, Math.min(deltaSeconds, 0.25)) * 60;

      const baseField = speedToDistortionField(speed);
      const field = {
        ...baseField,
        roadCurve,
        swayAmplitude: baseField.swayAmplitude * effectProfile.swayScale,
        liftAmplitude: baseField.liftAmplitude * effectProfile.swayScale,
      };
      const density = speedToLayerDensity(speed);
      const projection = speedToProjection(speed);
      const peripheral = speedToPeripheralDeformation(speed);
      const lens = {
        depthCompression: projection.depthCompression,
        peripheralStretch: peripheral.stretch,
        peripheralParallax: peripheral.parallax,
      };
      // The camera follows only a third of the bend: the corridor must be seen
      // to curve, not be silently straightened by the view.
      const aim = lookAtFromDistortion(timeOffset, { ...field, roadCurve: roadCurve * 0.34 });
      const bank = reducedMotion ? 0 : roadCurve * 0.075;

      const eye = [0, projection.cameraLift, 0];
      const viewProjection = multiply(
        perspective(
          reducedMotion
            ? Math.min(projection.fovDegrees + effectProfile.fovDelta, 82)
            : projection.fovDegrees + effectProfile.fovDelta,
          width / height,
          0.1,
          MERIDIAN_TRAVEL_LENGTH * 1.6,
        ),
        lookAt(
          eye,
          [
            eye[0] + aim.x * 0.42,
            eye[1] + projection.horizonBias + aim.y * 0.35,
            eye[2] + aim.z,
          ],
          [Math.sin(bank), Math.cos(bank), 0],
        ),
      );
      // Project the far corridor to anchor the horizon, sun and reflection.
      const far = distortionAt(0.97, timeOffset, field);
      const vanish = projectToUv(viewProjection, [
        far.x * 0.97,
        projection.cameraLift + far.y,
        -MERIDIAN_TRAVEL_LENGTH * 0.97 * projection.depthCompression,
      ]);
      const horizonTone = palette.mid.map((value, index) => (value * 0.45 + palette.accent[index] * 0.55) * 0.34);

      gl.viewport(0, 0, width, height);
      gl.clearColor(palette.base[0], palette.base[1], palette.base[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.useProgram(backgroundProgram);
      gl.bindVertexArray(backgroundVao);
      gl.uniform3fv(backgroundUniforms.u_base, palette.base);
      gl.uniform3fv(backgroundUniforms.u_mid, palette.mid);
      gl.uniform3fv(backgroundUniforms.u_light, palette.light);
      gl.uniform3fv(backgroundUniforms.u_accent, palette.accent);
      gl.uniform1f(backgroundUniforms.u_aspect, width / height);
      gl.uniform2f(backgroundUniforms.u_vanish, vanish[0], vanish[1]);
      gl.uniform1f(backgroundUniforms.u_sunScale, 1 + effectProfile.atmosphereDelta * 0.4);
      gl.uniform1f(backgroundUniforms.u_bank, bank);
      gl.uniform1f(
        backgroundUniforms.u_atmosphere,
        Math.min(1, density.atmosphereFraction + effectProfile.atmosphereDelta),
      );
      gl.uniform1f(backgroundUniforms.u_flow, peripheral.parallax);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);

      gl.depthMask(true);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(architectureProgram);
      gl.bindVertexArray(architectureVao);
      setDistortionUniforms(architectureUniforms, field, lens, viewProjection);
      gl.uniform1f(architectureUniforms.u_architectureFraction, density.architectureFraction);
      gl.uniform3fv(architectureUniforms.u_base, palette.base);
      gl.uniform3fv(architectureUniforms.u_mid, palette.mid);
      gl.uniform3fv(architectureUniforms.u_light, palette.light);
      gl.uniform3fv(architectureUniforms.u_accent, palette.accent);
      gl.uniform3fv(architectureUniforms.u_secondary, palette.secondary);
      gl.uniform1f(architectureUniforms.u_fogDensity, 1.85 * effectProfile.fogScale);
      gl.uniform1f(architectureUniforms.u_volumeGlow, density.volumeGlow);
      gl.uniform3fv(architectureUniforms.u_fogColor, horizonTone);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, cube.vertexCount, architecture.count);

      gl.depthMask(false);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(railProgram);
      gl.bindVertexArray(railVao);
      setDistortionUniforms(railUniforms, field, lens, viewProjection);
      gl.uniform3fv(railUniforms.u_mid, palette.mid);
      gl.uniform3fv(railUniforms.u_light, palette.light);
      gl.uniform3fv(railUniforms.u_accent, palette.accent);
      gl.uniform3fv(railUniforms.u_secondary, palette.secondary);
      gl.uniform1f(railUniforms.u_railScroll, railScroll);
      gl.uniform1f(railUniforms.u_railGlow, density.railGlow * effectProfile.railGlowScale);
      gl.uniform1f(railUniforms.u_fogDensity, 2.5 * effectProfile.fogScale);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, rail.vertexCount, RAIL_LANES.length);

      gl.useProgram(markProgram);
      gl.bindVertexArray(markVao);
      setDistortionUniforms(markUniforms, field, lens, viewProjection);
      gl.uniform1f(markUniforms.u_stationFraction, density.gateFraction);
      gl.uniform1f(markUniforms.u_markerFraction, density.streakFraction);
      gl.uniform1f(markUniforms.u_markerStretch, density.streakStretch);
      gl.uniform1f(markUniforms.u_windCurve, density.atmosphereFraction);
      gl.uniform1f(markUniforms.u_fogDensity, 2.4 * effectProfile.fogScale);
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
