import {
  PRTCL_TYPES,
  advancePrtclMacroTransition,
  createPrtclMacroResponse,
  createPrtclMacroTransitionState,
  normalizePrtclSettings,
  prtclMacroTargets,
  prtclMotionProfile,
} from "./prtcl-model.js";

const TYPE_INDEX = Object.freeze({ frequency: 0, axiom: 1 });

// The two active procedural families below are GPU adaptations of the selected
// formulas in the user-owned PRTCL checkout at the pinned source commit. The
// renderer itself, its camera/palette bridge, and its lifecycle are authored
// for sedicivalvole; no PRTCL runtime, UI, dependency, font, or asset is bundled.
const VERTEX_SHADER = `#version 300 es
  precision highp float;
  precision highp int;

  uniform mat4 u_view;
  uniform mat4 u_projection;
  uniform float u_time;
  uniform float u_pixelRatio;
  uniform float u_pointScale;
  uniform float u_formScale;
  uniform float u_depthScale;
  uniform float u_colourEnergy;
  uniform float u_pulse;
  uniform float u_brightness;
  uniform float u_spreadScale;
  uniform float u_underwater;
  uniform int u_type;
  uniform vec3 u_mid;
  uniform vec3 u_light;
  uniform vec3 u_accent;
  uniform vec3 u_secondary;

  out vec3 v_colour;
  out float v_luminance;
  out float v_agent;
  out float v_nativeBloom;

  float hashIndex(float index, float factor) {
    return fract(sin(index * 1.6180339887 * factor) * 43758.5453);
  }

  vec3 paletteBand(float value, float phase) {
    float band = clamp(value, 0.0, 1.0);
    vec3 lower = mix(u_mid, u_accent, smoothstep(0.02, 0.52, band));
    vec3 upper = mix(u_accent, u_secondary, smoothstep(0.38, 0.92, band));
    vec3 colour = mix(lower, upper, smoothstep(0.35, 0.76, band));
    colour = mix(colour, u_light, smoothstep(0.88, 1.0, band) * 0.68);
    float musical = 0.5 + 0.5 * sin(u_time * 2.1 + phase * 11.0);
    return mix(colour, mix(colour, u_light, musical * 0.48), u_colourEnergy * 0.52);
  }

  void frequencyParticle(float index, float count, out vec3 position, out vec3 colour, out float luminance) {
    float fraction = index / count;
    float radius = sqrt(fraction);
    float theta = index * 2.399963229728653;
    float baseX = radius * cos(theta);
    float baseY = radius * sin(theta);
    float baseZ = (fraction - 0.5) * 2.0;
    float frequency = 2.253;
    float amplitude = 11.23;
    float fractalDepth = 2.478;
    float time = u_time * 0.455;

    float wave1 = sin(baseX * frequency + time) * cos(baseY * frequency - time);
    float wave2 = sin(baseY * frequency * 2.0 - time * 1.3)
      * cos(baseZ * frequency * 1.5 + time);
    float wave3 = sin(baseZ * frequency * 3.0 + time * 0.7)
      * cos(baseX * frequency * 2.5 - time);
    float wave = (wave1 + wave2 * 0.5 + wave3 * 0.25) / (1.0 + fractalDepth * 0.25);
    float radialPulse = sin(radius * frequency * 10.0 - time * 2.0) * amplitude * 0.2;
    float distortion = wave * amplitude;
    float nextX = baseX * (amplitude + distortion + radialPulse);
    float nextY = baseY * (amplitude + distortion + radialPulse);
    float nextZ = baseZ * (amplitude + distortion) + wave * amplitude * 0.5;
    float cosine = cos(time * 0.2);
    float sine = sin(time * 0.2);

    position = vec3(
      (nextX * cosine - nextY * sine) * 0.06,
      (nextX * sine + nextY * cosine) * 0.06,
      nextZ * 0.06 * u_depthScale
    ) * u_spreadScale;
    float crest = clamp(abs(wave) * 1.18, 0.0, 1.0);
    colour = paletteBand(0.12 + crest * 0.88, fraction);
    luminance = 0.46 + crest * 0.92;
  }

  float axiomSurface(float x, float z, float time, float spread, float height) {
    float frequency = 3.0 / spread;
    float surface = 0.0;
    for (int wave = 1; wave <= 3; wave += 1) {
      float level = float(wave);
      float waveFrequency = level * 0.7;
      float waveAmplitude = 1.0 / level;
      surface += sin(x * frequency * waveFrequency + time * (0.3 + level * 0.15))
        * waveAmplitude * 0.5;
      surface += cos(z * frequency * waveFrequency * 1.3 - time * (0.2 + level * 0.1))
        * waveAmplitude * 0.4;
    }
    return surface * height;
  }

  void axiomParticle(float index, float count, out vec3 position, out vec3 colour, out float luminance, out float agent) {
    float spread = 3.774;
    float waveHeight = 0.611;
    float time = u_time * 0.516;
    float agentCount = floor(count * 0.12174);
    float terrainCount = count - agentCount;
    agent = index < agentCount ? 1.0 : 0.0;

    if (agent < 0.5) {
      float terrainIndex = index - agentCount;
      float gridSize = ceil(sqrt(terrainCount));
      float gridX = mod(terrainIndex, gridSize) / gridSize - 0.5;
      float gridZ = floor(terrainIndex / gridSize) / gridSize - 0.5;
      float x = gridX * spread * 2.0;
      float z = gridZ * spread * 2.0;
      float y = axiomSurface(x, z, time, spread, waveHeight);
      position = vec3(x, y, z * u_depthScale) * u_spreadScale;
      float heightBand = clamp((y / (waveHeight + 0.01) + 1.0) * 0.5, 0.0, 1.0);
      vec3 terrainBase = mix(u_mid, u_accent, 0.72);
      vec3 crestColour = mix(u_secondary, u_light, 0.48);
      colour = mix(terrainBase, crestColour, smoothstep(0.64, 0.96, heightBand));
      luminance = 0.16 + heightBand * 0.72;
      return;
    }

    float h1 = hashIndex(index, 127.1);
    float h2 = hashIndex(index, 269.5);
    float h3 = hashIndex(index, 419.2);
    float cycleDuration = 5.0 + h3 * 8.0;
    float phase = mod(u_time * 1.796 * 0.25 + h1 * cycleDuration, cycleDuration) / cycleDuration;
    float x = (h1 - 0.5) * spread * 1.8;
    float z = (h2 - 0.5) * spread * 1.8;
    float driftTime = phase * cycleDuration;
    float slide = driftTime * driftTime * 1.796 * 0.01;
    float direction = h1 * 6.28318530718;
    x += cos(direction) * slide;
    z += sin(direction) * slide;
    x -= floor(x / (spread * 2.0) + 0.5) * spread * 2.0;
    z -= floor(z / (spread * 2.0) + 0.5) * spread * 2.0;
    float surface = axiomSurface(x, z, time, spread, waveHeight);
    float frequency = 3.0 / spread;
    float slope = 0.0;
    for (int wave = 1; wave <= 3; wave += 1) {
      float level = float(wave);
      float waveFrequency = level * 0.7;
      float waveAmplitude = 1.0 / level;
      slope += cos(x * frequency * waveFrequency + time * (0.3 + level * 0.15))
        * frequency * waveFrequency * waveAmplitude * 0.5;
    }
    float bounce = abs(slope) * 0.3;
    float y;
    if (phase < 0.1) {
      float fall = phase / 0.1;
      y = (1.0 - fall * fall) * (waveHeight * 4.0 + h3 * 2.0)
        + fall * fall * (surface + bounce);
    } else {
      y = surface + bounce + 0.05;
    }
    position = vec3(x, y, z * u_depthScale) * u_spreadScale;
    float musicalPulse = 0.5 + 0.5 * sin(u_time * 3.0 + index * 2.1);
    float pulse = mix(0.58, musicalPulse, u_colourEnergy);
    colour = mix(u_secondary, u_light, 0.55 + pulse * 0.45);
    luminance = 0.82 + pulse * 0.72;
  }

  void main() {
    float index = float(gl_VertexID);
    float count;
    float pointSize;
    vec3 position;
    vec3 colour;
    float luminance;
    float agent = 0.0;

    if (u_type == 0) {
      count = 24000.0;
      pointSize = 0.43;
      frequencyParticle(index, count, position, colour, luminance);
    } else {
      count = 37000.0;
      pointSize = 0.93;
      axiomParticle(index, count, position, colour, luminance, agent);
    }

    position *= u_formScale;
    vec4 viewPosition = u_view * vec4(position, 1.0);
    float perspectiveScale = 20.0 / max(0.35, -viewPosition.z);
    float audioPulse = 1.0 + u_pulse * (0.06 + 0.08 * sin(u_time * 2.7 + index * 0.013));
    gl_PointSize = clamp(pointSize * u_pixelRatio * u_pointScale * perspectiveScale * audioPulse, 1.0, 12.0 * u_pixelRatio);
    gl_Position = u_projection * viewPosition;
    v_colour = colour;
    v_luminance = luminance * u_brightness * mix(1.0, 0.86, u_underwater);
    v_agent = agent;
    v_nativeBloom = u_type == 1 ? 0.0 : 1.0;
  }
`;

const FRAGMENT_SHADER = `#version 300 es
  precision highp float;
  uniform float u_bloom;
  uniform float u_underwater;
  in vec3 v_colour;
  in float v_luminance;
  in float v_agent;
  in float v_nativeBloom;
  out vec4 outColour;

  void main() {
    float distanceFromCentre = length(gl_PointCoord - vec2(0.5));
    if (distanceFromCentre > 0.5) discard;
    float core = 1.0 - smoothstep(0.06, 0.5, distanceFromCentre);
    float halo = 1.0 - smoothstep(0.2, 0.5, distanceFromCentre);
    float nativeGlow = mix(0.14, 0.27, v_nativeBloom);
    float glow = mix(nativeGlow, 0.44, u_bloom) + v_agent * 0.18;
    float alpha = mix(core, halo, glow) * mix(0.9, 0.62, u_underwater);
    vec3 colour = v_colour * v_luminance
      * (1.0 + v_nativeBloom * 0.18 + u_bloom * core * 0.42 + v_agent * 0.18);
    outColour = vec4(max(colour, vec3(0.0)), alpha);
  }
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "PRTCL shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
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

function perspective(aspect, zoom = 1) {
  const near = 0.01;
  const far = 100;
  const factor = zoom / Math.tan(Math.PI / 6);
  return new Float32Array([
    factor / Math.max(0.01, aspect), 0, 0, 0,
    0, factor, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ]);
}

function cameraForType(typeId, time) {
  if (typeId === "axiom") {
    return {
      eye: [3.271, 0.862, -3.755],
      target: [-0.013, -0.29, -0.005],
      up: [0, 1, 0],
      zoom: 1,
    };
  }
  const angle = time * 0.1;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const sourceEye = [1.944, 0, -1.447];
  return {
    eye: [
      sourceEye[0] * cosine + sourceEye[2] * sine,
      sourceEye[1],
      -sourceEye[0] * sine + sourceEye[2] * cosine,
    ],
    target: [0, 0, 0],
    up: [0, 1, 0],
    zoom: 0.98,
  };
}

function backgroundCss(palette) {
  const channel = (value) => Math.round(Math.min(1, Math.max(0, value)) * 255);
  const edge = palette.base.map((value) => channel(value * 0.62));
  const centre = palette.base.map((value, index) => channel(value + palette.accent[index] * 0.18));
  return `radial-gradient(ellipse at 52% 48%, rgb(${centre.join(" ")}) 0%, rgb(${edge.join(" ")}) 72%)`;
}

export function prtclWebglAvailable() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

export function createPrtclRenderer(canvas, initialPalette, initialTypeId = "frequency") {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: true,
    premultipliedAlpha: false,
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
    throw new Error(gl.getProgramInfoLog(program) || "PRTCL program link failed");
  }
  const vertexArray = gl.createVertexArray();
  const uniform = (name) => gl.getUniformLocation(program, name);
  const uniforms = {
    view: uniform("u_view"),
    projection: uniform("u_projection"),
    time: uniform("u_time"),
    pixelRatio: uniform("u_pixelRatio"),
    pointScale: uniform("u_pointScale"),
    formScale: uniform("u_formScale"),
    depthScale: uniform("u_depthScale"),
    colourEnergy: uniform("u_colourEnergy"),
    pulse: uniform("u_pulse"),
    brightness: uniform("u_brightness"),
    spreadScale: uniform("u_spreadScale"),
    bloom: uniform("u_bloom"),
    underwater: uniform("u_underwater"),
    type: uniform("u_type"),
    mid: uniform("u_mid"),
    light: uniform("u_light"),
    accent: uniform("u_accent"),
    secondary: uniform("u_secondary"),
  };
  let palette = initialPalette;
  let typeId = normalizePrtclSettings({ type: initialTypeId }).type;
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let time = 0;
  let transitionAtMs = 0;
  let macroState = createPrtclMacroTransitionState();
  let macroResponse = createPrtclMacroResponse();
  let macroAttackSeconds = null;
  let macroReleaseSeconds = null;
  let disposed = false;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.depthMask(false);
  gl.clearColor(0, 0, 0, 0);
  gl.bindVertexArray(vertexArray);
  canvas.style.background = backgroundCss(palette);

  return {
    get label() { return `WebGL2 · PRTCL ${PRTCL_TYPES[typeId].fullLabel}`; },
    resize(nextWidth, nextHeight, nextPixelRatio = 1) {
      width = Math.max(1, Math.floor(nextWidth));
      height = Math.max(1, Math.floor(nextHeight));
      pixelRatio = Math.max(1, nextPixelRatio);
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    },
    setPalette(nextPalette) {
      palette = nextPalette;
      canvas.style.background = backgroundCss(palette);
    },
    setType(nextTypeId) {
      typeId = normalizePrtclSettings({ type: nextTypeId }).type;
    },
    render({
      speedKmh,
      audioLevel,
      effect,
      macroSnapshot = null,
      reducedMotion,
      deltaSeconds,
      calibration = null,
    }) {
      if (disposed) return;
      const multiplier = (name, fallback = 1, minimum = 0, maximum = 3) => {
        const value = Number(calibration?.[name]);
        return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
      };
      const attackSeconds = multiplier("attackMs", 120, 0, 2000) / 1000;
      const releaseSeconds = multiplier("releaseMs", 280, 0, 3000) / 1000;
      if (attackSeconds !== macroAttackSeconds || releaseSeconds !== macroReleaseSeconds) {
        macroAttackSeconds = attackSeconds;
        macroReleaseSeconds = releaseSeconds;
        macroResponse = createPrtclMacroResponse({ attackSeconds, releaseSeconds });
      }
      const frameSeconds = Math.max(0, Math.min(0.1, deltaSeconds));
      transitionAtMs += frameSeconds * 1000;
      macroState = advancePrtclMacroTransition(
        macroState,
        prtclMacroTargets({ effect, macroSnapshot }),
        transitionAtMs,
        macroResponse,
      );
      const profile = prtclMotionProfile({
        speedKmh,
        audioLevel,
        macroAmounts: macroState.value,
        reducedMotion,
      });
      const flowScale = multiplier("flowScale") * multiplier("driftScale");
      time += frameSeconds * profile.travelRate * flowScale;
      const camera = cameraForType(typeId, time);
      const cameraDepth = multiplier("cameraDepth", 1, 0.5, 2);
      const eye = camera.eye.map((value) => value * cameraDepth);
      const view = lookAt(eye, camera.target, camera.up);
      const aspect = width / Math.max(1, height);
      const responsiveZoom = camera.zoom * Math.min(1, Math.max(0.64, aspect / 0.9));
      const projection = perspective(aspect, responsiveZoom);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vertexArray);
      gl.uniformMatrix4fv(uniforms.view, false, view);
      gl.uniformMatrix4fv(uniforms.projection, false, projection);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.pixelRatio, pixelRatio);
      gl.uniform1f(uniforms.pointScale, profile.pointScale * multiplier("pointScale"));
      gl.uniform1f(uniforms.formScale, profile.formScale * multiplier("formScale"));
      gl.uniform1f(uniforms.depthScale, profile.depthScale * multiplier("depthScale"));
      gl.uniform1f(uniforms.colourEnergy, profile.colourEnergy);
      gl.uniform1f(uniforms.pulse, profile.pulse);
      gl.uniform1f(uniforms.brightness, profile.brightness);
      gl.uniform1f(uniforms.spreadScale, profile.spreadScale);
      gl.uniform1f(uniforms.bloom, profile.bloom);
      gl.uniform1f(uniforms.underwater, profile.underwater);
      gl.uniform1i(uniforms.type, TYPE_INDEX[typeId]);
      gl.uniform3fv(uniforms.mid, palette.mid);
      gl.uniform3fv(uniforms.light, palette.light);
      gl.uniform3fv(uniforms.accent, palette.accent);
      gl.uniform3fv(uniforms.secondary, palette.secondary);
      const densityScale = multiplier("densityScale", 1, 0.1, 1);
      gl.drawArrays(gl.POINTS, 0, Math.max(1, Math.round(PRTCL_TYPES[typeId].particleCount * densityScale)));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      canvas.style.background = "";
      gl.deleteVertexArray(vertexArray);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    },
  };
}
