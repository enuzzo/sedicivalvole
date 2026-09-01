import { advanceGradientResponse, gradientMotionProfile } from "./gradient-model.js";

const GRID_COLUMNS = 144;
const GRID_ROWS = 150;

const VERTEX_SHADER = `#version 300 es
  precision highp float;

  in vec3 a_position;
  in vec2 a_uv;

  uniform mat4 u_viewProjection;
  uniform float u_time;
  uniform float u_speedEnergy;
  uniform float u_foldMorph;
  uniform float u_audioEnergy;
  uniform float u_displacement;
  uniform float u_foldDepth;
  uniform float u_seamDepth;
  uniform float u_seamFocus;
  uniform float u_density;
  uniform float u_underwater;

  out vec3 v_worldPosition;
  out vec3 v_normal;
  out vec2 v_uv;
  out float v_height;
  out float v_seam;

  vec4 permute(vec4 value) {
    return mod(((value * 34.0) + 1.0) * value, 289.0);
  }

  vec4 inverseSqrt(vec4 value) {
    return 1.79284291400159 - 0.85373472095314 * value;
  }

  float coherentNoise(vec3 point) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(point + dot(point, C.yyy));
    vec3 x0 = point - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = inverseSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m *= m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    vec3 position = a_position;
    float depth = clamp((-position.z + 1.5) / 13.5, 0.0, 1.0);
    float localTime = u_time * mix(0.42, 1.0, u_speedEnergy);
    float theta = (position.x / 7.75) * 3.20;
    theta += sin(position.z * 0.12 - localTime * 0.18) * mix(0.06, 0.28, u_foldMorph);
    float broadNoise = coherentNoise(vec3(
      theta * u_density * 0.54,
      position.z * u_density * 0.19 - localTime * 0.15,
      localTime * 0.12
    ));
    float detailNoise = coherentNoise(vec3(
      theta * (0.78 + u_density * 0.28),
      position.z * 0.31 + localTime * 0.11,
      3.7 + localTime * 0.17
    ));
    float foldPhaseA = theta * 2.35 + position.z * 0.17 - localTime * 0.32;
    float foldPhaseB = theta * 4.75 - position.z * 0.095 + localTime * 0.21;
    float foldPhaseC = theta * 7.1 + position.z * 0.055 - localTime * 0.16;
    float foldWave = sin(foldPhaseA)
      + sin(foldPhaseB) * 0.46
      + sin(foldPhaseC) * 0.24;
    float foldSlope = cos(foldPhaseA) * 2.35
      + cos(foldPhaseB) * 2.185
      + cos(foldPhaseC) * 1.704;
    float seamWave = abs(sin(theta * 1.5 + position.z * 0.075 - localTime * 0.09));
    float seam = exp(-seamWave * u_seamFocus);
    float tension = broadNoise * u_displacement * mix(0.34, 0.08, u_foldMorph);
    float folds = foldWave * u_foldDepth * u_foldMorph;
    float audioRidge = detailNoise * u_audioEnergy * 0.34;
    float valley = -seam * u_seamDepth * mix(0.46, 0.82, u_foldMorph);
    float submerged = u_underwater * (0.28 + broadNoise * 0.11);
    float radius = mix(4.15, 3.42, u_foldMorph)
      + tension + folds + audioRidge + valley - submerged;
    float verticalScale = mix(0.82, 1.0, u_foldMorph);
    position.x = sin(theta) * radius;
    position.y = cos(theta) * radius * verticalScale;

    // The viewer travels inside one continuous folded surface. Its analytical
    // interior normal stays smooth at every tessellation density and prevents
    // the high-speed field from reading as low-poly terrain.
    vec3 radial = normalize(vec3(sin(theta), cos(theta) / verticalScale, 0.0));
    vec3 tangent = normalize(vec3(cos(theta), -sin(theta) * verticalScale, 0.0));
    float radialSlope = foldSlope * u_foldDepth * u_foldMorph / max(radius, 0.8);
    v_normal = normalize(-radial + tangent * radialSlope * 0.34 + vec3(0.0, 0.0, depth * 0.08));

    v_worldPosition = position;
    v_uv = a_uv;
    v_height = radius - 3.8;
    v_seam = seam;
    gl_Position = u_viewProjection * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `#version 300 es
  precision highp float;

  uniform float u_time;
  uniform float u_speedEnergy;
  uniform float u_foldMorph;
  uniform float u_audioEnergy;
  uniform float u_radiance;
  uniform float u_grain;
  uniform float u_underwater;
  uniform float u_open;
  uniform float u_bloom;
  uniform vec3 u_base;
  uniform vec3 u_mid;
  uniform vec3 u_light;
  uniform vec3 u_accent;
  uniform vec3 u_secondary;

  in vec3 v_worldPosition;
  in vec3 v_normal;
  in vec2 v_uv;
  in float v_height;
  in float v_seam;

  out vec4 outColour;

  float hash(vec2 point) {
    vec3 p3 = fract(vec3(point.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec3 normal = normalize(v_normal);

    vec3 lightDirection = normalize(vec3(-0.42, 0.88, 0.26));
    vec3 viewDirection = normalize(vec3(0.0, 2.8, 4.8) - v_worldPosition);
    vec3 halfway = normalize(lightDirection + viewDirection);
    float diffuse = mix(0.30, 0.52, u_foldMorph)
      + max(0.0, dot(normal, lightDirection)) * mix(0.82, 0.68, u_foldMorph);
    float specular = pow(max(0.0, dot(normal, halfway)), mix(34.0, 76.0, u_foldMorph));

    float colourPhase = 0.5 + 0.5 * sin(
      v_worldPosition.x * mix(0.45, 0.82, u_foldMorph)
      - v_worldPosition.z * 0.12
      + v_height * 0.68
      + u_time * 0.035
    );
    float crest = smoothstep(-1.1, 1.2, v_height);
    vec3 slowLower = mix(u_mid, u_accent, smoothstep(0.05, 0.64, colourPhase));
    vec3 fastLower = mix(u_accent, u_secondary, smoothstep(0.12, 0.86, colourPhase));
    vec3 lower = mix(slowLower, fastLower, u_foldMorph * 0.88);
    vec3 upper = mix(u_accent, u_secondary, smoothstep(0.36, 0.96, colourPhase));
    vec3 colour = mix(lower, upper, smoothstep(0.28, 0.78, colourPhase));
    colour = mix(colour, u_light, crest * (0.12 + specular * 0.46));
    colour *= diffuse * u_radiance;
    colour += u_light * specular * (0.18 + u_bloom * 0.32 + u_audioEnergy * 0.08);

    float seamInk = v_seam * mix(0.68, 0.86, u_speedEnergy);
    colour = mix(colour, u_base, seamInk);
    colour = mix(colour, u_light, v_seam * u_open * 0.18);
    colour = mix(colour, u_base, u_underwater * 0.32);

    float horizon = smoothstep(0.74, 1.0, v_uv.y);
    colour = mix(colour, u_base, horizon * 0.54);
    float vignette = smoothstep(0.95, 0.24, length(v_uv - vec2(0.5)));
    colour *= mix(mix(0.58, 0.76, u_foldMorph), 1.0, vignette);

    float grainFrame = floor(u_time * 11.0);
    float grain = hash(gl_FragCoord.xy + vec2(grainFrame, grainFrame * 1.71)) - 0.5;
    colour += grain * u_grain;
    outColour = vec4(max(colour, vec3(0.0)), 1.0);
  }
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "GRADIENT shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function link(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "GRADIENT program link failed";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function createGrid(columns = GRID_COLUMNS, rows = GRID_ROWS) {
  const positions = new Float32Array((columns + 1) * (rows + 1) * 3);
  const uvs = new Float32Array((columns + 1) * (rows + 1) * 2);
  const indices = new Uint32Array(columns * rows * 6);
  let vertexOffset = 0;
  let uvOffset = 0;
  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      positions[vertexOffset] = (u - 0.5) * 15.5;
      positions[vertexOffset + 1] = 0;
      positions[vertexOffset + 2] = 4.42 - v * 86.42;
      uvs[uvOffset] = u;
      uvs[uvOffset + 1] = v;
      vertexOffset += 3;
      uvOffset += 2;
    }
  }
  let indexOffset = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const topLeft = row * (columns + 1) + column;
      const bottomLeft = (row + 1) * (columns + 1) + column;
      indices.set([
        topLeft, bottomLeft, topLeft + 1,
        topLeft + 1, bottomLeft, bottomLeft + 1,
      ], indexOffset);
      indexOffset += 6;
    }
  }
  return { positions, uvs, indices };
}

function attach(gl, program, name, values, size) {
  const location = gl.getAttribLocation(program, name);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  return buffer;
}

function normalize(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function lookAt(eye, target, preferredUp = [0, 1, 0]) {
  const forward = normalize(subtract(eye, target));
  const right = normalize(cross(preferredUp, forward));
  const up = cross(forward, right);
  return new Float32Array([
    right[0], up[0], forward[0], 0,
    right[1], up[1], forward[1], 0,
    right[2], up[2], forward[2], 0,
    -dot(right, eye), -dot(up, eye), -dot(forward, eye), 1,
  ]);
}

function perspective(fovDegrees, aspect, near, far) {
  const f = 1 / Math.tan((fovDegrees * Math.PI) / 360);
  const range = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * range, -1,
    0, 0, 2 * far * near * range, 0,
  ]);
}

function multiply(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      result[column * 4 + row] = a[row] * b[column * 4]
        + a[4 + row] * b[column * 4 + 1]
        + a[8 + row] * b[column * 4 + 2]
        + a[12 + row] * b[column * 4 + 3];
    }
  }
  return result;
}

function uniformsOf(gl, program, names) {
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
}

export function gradientWebglAvailable() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

export function createGradientRenderer(canvas, initialPalette) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = link(gl, vertexShader, fragmentShader);
  const uniforms = uniformsOf(gl, program, [
    "u_viewProjection", "u_time", "u_speedEnergy", "u_foldMorph", "u_audioEnergy",
    "u_displacement", "u_foldDepth", "u_seamDepth", "u_seamFocus", "u_density",
    "u_radiance", "u_grain", "u_underwater", "u_open", "u_bloom",
    "u_base", "u_mid", "u_light", "u_accent", "u_secondary",
  ]);
  const geometry = createGrid();
  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);
  const buffers = [
    attach(gl, program, "a_position", geometry.positions, 3),
    attach(gl, program, "a_uv", geometry.uvs, 2),
  ];
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.BLEND);

  let width = 1;
  let height = 1;
  let time = 0;
  let palette = initialPalette;
  let response = null;
  let disposed = false;

  return {
    label: "WebGL2 · Gradient 3D field",
    resize(nextWidth, nextHeight) {
      width = Math.max(1, Math.floor(nextWidth));
      height = Math.max(1, Math.floor(nextHeight));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    },
    setPalette(nextPalette) {
      palette = nextPalette;
    },
    render({ speedKmh, audioLevel, musicMode, effect, reducedMotion, deltaSeconds }) {
      if (disposed) return;
      const frameSeconds = Math.max(0, Math.min(0.1, deltaSeconds));
      const target = gradientMotionProfile({
        speedKmh,
        audioLevel,
        musicMode,
        effect,
        reducedMotion,
      });
      response = advanceGradientResponse(response, target, frameSeconds);
      time += frameSeconds * response.flowRate;

      const fov = 52 + response.foldMorph * 12;
      const eye = [0, 0, 4.78];
      const targetPoint = [0, 0, -4.15];
      const viewProjection = multiply(
        perspective(fov, width / Math.max(1, height), 0.1, 110),
        lookAt(eye, targetPoint),
      );

      gl.viewport(0, 0, width, height);
      gl.clearColor(palette.base[0], palette.base[1], palette.base[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vertexArray);
      gl.uniformMatrix4fv(uniforms.u_viewProjection, false, viewProjection);
      gl.uniform1f(uniforms.u_time, time);
      for (const name of [
        "speedEnergy", "foldMorph", "audioEnergy", "displacement", "foldDepth",
        "seamDepth", "seamFocus", "density", "radiance", "grain", "underwater",
        "open", "bloom",
      ]) {
        gl.uniform1f(uniforms[`u_${name}`], response[name]);
      }
      gl.uniform3fv(uniforms.u_base, palette.base);
      gl.uniform3fv(uniforms.u_mid, palette.mid);
      gl.uniform3fv(uniforms.u_light, palette.light);
      gl.uniform3fv(uniforms.u_accent, palette.accent);
      gl.uniform3fv(uniforms.u_secondary, palette.secondary);
      gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_INT, 0);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      gl.deleteBuffer(indexBuffer);
      for (const buffer of buffers) gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vertexArray);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    },
  };
}
