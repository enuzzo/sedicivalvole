import {
  catmullRomPoint,
  WAKE_RIBBONS,
  wakeMotionProfile,
  wakeRibbonMotion,
  wakeToneColor,
} from "./wake-model.js";

const SEGMENTS = 72;
const CROSS_SEGMENTS = 10;
const FLOATS_PER_VERTEX = 12;

const VERTEX_SHADER = `#version 300 es
  in vec3 a_position;
  in vec3 a_normal;
  in vec3 a_color;
  in vec3 a_surface;
  out vec3 v_position;
  out vec3 v_normal;
  out vec3 v_color;
  out vec3 v_surface;
  void main() {
    v_position = a_position;
    v_normal = a_normal;
    v_color = a_color;
    v_surface = a_surface;
    gl_Position = vec4(a_position, 1.0);
  }
`;

const FRAGMENT_SHADER = `#version 300 es
  precision highp float;
  uniform float u_time;
  uniform float u_lightScale;
  uniform float u_bloom;
  uniform float u_energy;
  in vec3 v_position;
  in vec3 v_normal;
  in vec3 v_color;
  in vec3 v_surface;
  out vec4 outColor;

  float hash21(vec2 point) {
    point = fract(point * vec2(127.1, 311.7));
    point += dot(point, point + 19.19);
    return fract(point.x * point.y);
  }

  void main() {
    vec3 normal = normalize(v_normal);
    vec3 light = normalize(vec3(-0.46, 0.72, 0.74));
    vec3 view = vec3(0.0, 0.0, 1.0);
    vec3 halfVector = normalize(light + view);
    float diffuse = max(0.0, dot(normal, light));
    float reverse = max(0.0, dot(-normal, light)) * 0.24;
    float specular = pow(max(0.0, dot(normal, halfVector)), mix(38.0, 20.0, u_energy));
    float edge = smoothstep(0.72, 1.0, abs(v_surface.x));
    float grazing = pow(1.0 - abs(dot(normal, view)), 2.4);
    float grain = hash21(gl_FragCoord.xy + vec2(v_surface.y * 113.0, u_time * 7.0)) - 0.5;
    float longitudinal = 0.94 + 0.06 * sin(v_surface.y * 18.0 + v_surface.z * 4.0);
    float surfaceSheen = pow(max(0.0, 1.0 - abs(v_surface.x + 0.12)), 8.0) * 0.12;
    float foldHighlight = exp(-pow((v_surface.y - 0.56) * 5.0, 2.0))
      * exp(-pow((v_surface.x + 0.18) * 4.0, 2.0)) * v_surface.z;
    float bloomBand = exp(-abs(fract(v_surface.y - u_time * 0.42) - 0.5) * 18.0) * u_bloom;
    float lighting = (0.21 + diffuse * 0.82 + reverse + specular * mix(0.42, 0.92, u_energy)) * u_lightScale;
    vec3 color = v_color * lighting * longitudinal;
    color += v_color * surfaceSheen;
    color += vec3(1.0, 0.91, 0.84) * foldHighlight * 0.24;
    color += v_color * grain * mix(0.075, 0.045, u_energy);
    color += vec3(1.0, 0.92, 0.84) * (edge * 0.08 + grazing * 0.10 + specular * mix(0.18, 0.34, u_energy) + bloomBand * 0.28);
    color *= 1.0 - smoothstep(0.86, 1.0, abs(v_position.y)) * 0.12;
    outColor = vec4(max(color, vec3(0.0)), 1.0);
  }
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "WAKE shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalize(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length);
}

function movingCenter(ribbon, progress, time, profile) {
  const motion = wakeRibbonMotion(ribbon, progress, time, profile);
  const point = catmullRomPoint(ribbon.points, Math.min(1, Math.max(0, progress + motion.along)));
  const breath = Math.sin(progress * Math.PI * 2.2 + ribbon.phase + time * 2.1) * profile.breathing;
  const separation = Math.sign(point[1] || Math.sin(ribbon.phase)) * profile.separation;
  return [
    point[0] + motion.x,
    point[1] + motion.y + breath + separation,
    ribbon.depth + motion.z + 0.025 * Math.sin(progress * 7 + ribbon.phase + time),
  ];
}

function ribbonPoint(ribbon, progress, time, profile, aspect) {
  const center = movingCenter(ribbon, progress, time, profile);
  const motion = wakeRibbonMotion(ribbon, progress, time, profile);
  const authoredPhase = ((time * 0.16 + ribbon.phase / (Math.PI * 2)) % 1 + 1) % 1;
  const travellingFold = 0.12 + authoredPhase * 0.76;
  const foldCenterA = 0.56 + (travellingFold - 0.56) * profile.energy;
  const foldCenterB = 0.82 + (((travellingFold + 0.34) % 0.76 + 0.12) - 0.82) * profile.energy;
  const foldA = Math.exp(-Math.pow((progress - foldCenterA) / 0.18, 2));
  const foldB = Math.exp(-Math.pow((progress - foldCenterB) / 0.11, 2));
  const twist = ribbon.twist + motion.twist
    + Math.sin(progress * Math.PI * 1.15 + ribbon.phase) * 0.07 * profile.foldScale
    + foldA * Math.sin(ribbon.phase * 1.7) * ribbon.fold * profile.foldScale
    + foldB * Math.cos(ribbon.phase) * ribbon.fold * 0.38 * profile.foldScale;
  const epsilon = 1 / SEGMENTS;
  const before = movingCenter(ribbon, Math.max(0, progress - epsilon), time, profile);
  const after = movingCenter(ribbon, Math.min(1, progress + epsilon), time, profile);
  const tangentScreen = normalize([(after[0] - before[0]) * aspect, after[1] - before[1], after[2] - before[2]]);
  const acrossScreen = normalize([-tangentScreen[1] * Math.cos(twist), tangentScreen[0] * Math.cos(twist), Math.sin(twist)]);
  const across = normalize([acrossScreen[0] / aspect, acrossScreen[1], acrossScreen[2]]);
  let normal = normalize(cross(tangentScreen, acrossScreen));
  if (normal[2] < 0) normal = normal.map((value) => -value);
  return {
    center,
    across,
    normal,
  };
}

function appendVertex(data, position, normal, color, side, progress, phase) {
  data.push(...position, ...normal, ...color, side, progress, phase);
}

function buildGeometry(palette, time, profile, aspect) {
  const data = [];
  for (const ribbon of WAKE_RIBBONS) {
    const color = wakeToneColor(palette, ribbon.tone);
    const shine = ribbon.phase > 4 && ribbon.phase < 5 ? 1 : ribbon.tone === "accent" ? 0.45 : 0.2;
    for (let segment = 0; segment < SEGMENTS; segment += 1) {
      const a = segment / SEGMENTS;
      const b = (segment + 1) / SEGMENTS;
      const points = [ribbonPoint(ribbon, a, time, profile, aspect), ribbonPoint(ribbon, b, time, profile, aspect)];
      for (let crossSegment = 0; crossSegment < CROSS_SEGMENTS; crossSegment += 1) {
        const sides = [crossSegment / CROSS_SEGMENTS * 2 - 1, (crossSegment + 1) / CROSS_SEGMENTS * 2 - 1];
        const vertices = points.flatMap((point, pointIndex) => sides.map((side) => {
          const progress = pointIndex === 0 ? a : b;
          const motion = wakeRibbonMotion(ribbon, progress, time, profile);
          const width = (ribbon.widthStart + (ribbon.widthEnd - ribbon.widthStart) * progress)
            * profile.widthScale * motion.widthScale;
          const camber = 0.022 * (1 - side * side);
          return {
            progress,
            side,
            normal: normalize(point.normal.map((value, axis) => value + point.across[axis] * side * 0.12)),
            position: point.center.map((value, axis) => value + point.across[axis] * width * side + (axis === 2 ? camber : 0)),
          };
        }));
        for (const index of [0, 1, 2, 2, 1, 3]) {
          const vertex = vertices[index];
          appendVertex(data, vertex.position, vertex.normal, color, vertex.side, vertex.progress, shine);
        }
      }
    }
  }
  return new Float32Array(data);
}

export function wakeWebglAvailable() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

export function createWakeRenderer(canvas, initialPalette) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: true,
    depth: true,
    powerPreference: "high-performance",
  });
  if (!gl) return null;
  const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "WAKE program link failed");
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const stride = FLOATS_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;
  const attach = (name, size, offset) => {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset * Float32Array.BYTES_PER_ELEMENT);
  };
  attach("a_position", 3, 0);
  attach("a_normal", 3, 3);
  attach("a_color", 3, 6);
  attach("a_surface", 3, 9);
  const uniforms = {
    time: gl.getUniformLocation(program, "u_time"),
    lightScale: gl.getUniformLocation(program, "u_lightScale"),
    bloom: gl.getUniformLocation(program, "u_bloom"),
    energy: gl.getUniformLocation(program, "u_energy"),
  };
  let palette = initialPalette;
  let time = 0;
  let width = 1;
  let height = 1;
  let disposed = false;
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  return {
    label: "WebGL2 · Wake ribbons",
    resize(nextWidth, nextHeight) {
      width = Math.max(1, Math.floor(nextWidth));
      height = Math.max(1, Math.floor(nextHeight));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    },
    setPalette(nextPalette) { palette = nextPalette; },
    render({ speedKmh, effect, reducedMotion, deltaSeconds }) {
      if (disposed) return;
      const profile = wakeMotionProfile(speedKmh, effect, reducedMotion);
      time += profile.timeRate * Math.max(0, Math.min(0.1, deltaSeconds));
      const geometry = buildGeometry(palette, time, profile, width / height);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.DYNAMIC_DRAW);
      gl.clearColor(0.0025, 0.0025, 0.0028, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.lightScale, profile.lightScale);
      gl.uniform1f(uniforms.bloom, effect === "BLOOM" ? 1 : 0);
      gl.uniform1f(uniforms.energy, profile.energy);
      gl.drawArrays(gl.TRIANGLES, 0, geometry.length / FLOATS_PER_VERTEX);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    },
  };
}
