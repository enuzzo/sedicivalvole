// LATITUDES 04 — WebGL2 stratum renderer.
//
// One fullscreen pass. There is no geometry, no depth, and no camera: the whole
// image is a function of the motion history that latitudes-model.js maintains.
//
// The history reaches the shader as a 240 x 1 R32F texture holding, for each
// stratum, the metres travelled since the moment that stratum represents. Lag is
// uploaded rather than absolute distance so the values stay small and bounded
// through a long session instead of losing float precision as the odometer grows.

import {
  advanceLatitudesHistory,
  createLatitudesHistory,
  historyLagMetres,
  LATITUDES_HISTORY_SAMPLES,
  LATITUDES_SHEAR_PER_METRE,
  speedToFieldStructure,
  speedToRestPhaseRate,
} from "./latitudes-model.js";

const VERTEX_SHADER = `#version 300 es
  in vec2 a_position;
  out vec2 v_uv;
  void main() {
    // v_uv.y is 0 at the bottom of the frame, which is the newest stratum.
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `#version 300 es
  precision highp float;

  uniform sampler2D u_lag;
  uniform float u_samples;
  uniform float u_aspect;
  uniform float u_shearPerMetre;
  uniform float u_bandFrequency;
  uniform float u_lateralWeight;
  uniform float u_fineWeight;
  uniform float u_toneSpread;
  uniform float u_relief;
  uniform float u_contourGlow;
  uniform float u_particleWeight;
  uniform float u_restPhase;
  uniform vec3 u_tone0;
  uniform vec3 u_tone1;
  uniform vec3 u_tone2;
  uniform vec3 u_tone3;
  uniform vec3 u_tone4;

  in vec2 v_uv;
  out vec4 outColor;

  #define TAU 6.28318530717959

  /** Metres travelled since the stratum at this age was recorded. */
  float lagAt(float age) {
    float position = clamp(age, 0.0, 1.0) * (u_samples - 1.0);
    float lower = floor(position);
    float upper = min(lower + 1.0, u_samples - 1.0);
    float blend = position - lower;
    float a = texelFetch(u_lag, ivec2(int(lower), 0), 0).r;
    float b = texelFetch(u_lag, ivec2(int(upper), 0), 0).r;
    return mix(a, b, blend);
  }

  float hash21(vec2 value) {
    vec3 p3 = fract(vec3(value.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec2 p = v_uv * 2.0 - 1.0;
    p.x *= u_aspect;
    float horizon = 0.34;
    float horizonGlow = exp(-pow(abs(p.y - horizon) * 3.2, 1.35));
    vec3 color = mix(u_tone0, u_tone1 * 0.34, 0.18 + horizonGlow * 0.20);
    color += mix(u_tone4, u_tone2, 0.72) * horizonGlow * 0.065;

    // Fourteen broad temporal ribbons replace the old one-pixel strata. Every
    // ribbon still samples the same eight-second movement history, so a steady
    // speed rakes the surfaces evenly and acceleration bends them as before.
    for (int layer = 0; layer < 14; layer += 1) {
      float age = float(layer) / 13.0;
      float lag = lagAt(age);
      float depth = pow(age, 0.82);
      float phase = lag * u_shearPerMetre * TAU * 1.75 + u_restPhase * TAU;
      float lateral = p.x + phase;
      float broad = sin(lateral * (1.15 + age * 0.72) + float(layer) * 1.41);
      float detail = sin(lateral * 2.73 - float(layer) * 0.83) * u_fineWeight;
      float curve = (broad * 0.72 + detail * 0.28)
        * (0.055 + (1.0 - depth) * 0.115) * u_relief * u_lateralWeight;
      float baseY = -0.88 + depth * 1.24;
      float ribbonWidth = mix(0.155, 0.018, depth) * (0.82 + u_toneSpread * 0.18);
      float distanceToRibbon = abs(p.y - (baseY + curve));
      float body = 1.0 - smoothstep(ribbonWidth * 0.22, ribbonWidth, distanceToRibbon);
      float core = 1.0 - smoothstep(0.0, max(fwidth(distanceToRibbon) * 2.1, 0.0035), distanceToRibbon);
      float shadow = 1.0 - smoothstep(ribbonWidth, ribbonWidth * 2.2, distanceToRibbon);

      vec3 layerTone = layer % 4 == 0 ? u_tone3
        : (layer % 3 == 0 ? u_tone4 : (layer % 2 == 0 ? u_tone2 : u_tone1));
      float light = 0.18 + (1.0 - depth) * 0.34 + broad * 0.10;
      vec3 surface = mix(u_tone1 * 0.36, layerTone, 0.38 + light);
      color *= 1.0 - shadow * body * 0.20;
      color = mix(color, surface, body * (0.38 + (1.0 - depth) * 0.36));
      color += mix(u_tone2, u_tone3, float(layer % 5 == 0))
        * core * u_contourGlow * (0.38 + (1.0 - depth) * 0.55);
    }

    vec2 particleCell = floor((v_uv * vec2(u_aspect, 1.0)) * vec2(210.0, 130.0));
    float particleSeed = hash21(particleCell);
    float particle = step(0.9925, particleSeed)
      * smoothstep(0.46, 0.0, length(fract(v_uv * vec2(210.0, 130.0)) - 0.5));
    color += mix(u_tone3, u_tone2, step(0.997, particleSeed))
      * particle * u_particleWeight * (0.32 + horizonGlow * 0.7);

    float vignette = 1.0 - smoothstep(0.42, 1.25, length(p * vec2(0.52, 0.72)));
    color *= 0.68 + vignette * 0.38;
    outColor = vec4(max(color, vec3(0.0)), 1.0);
  }
`;

/**
 * Whether a WebGL2 context can be created. Must be asked before touching the
 * real canvas: requesting WebGL2 fixes a canvas's context type permanently, so a
 * canvas handed to WebGL can never fall back to Canvas2D.
 */
export function latitudesWebglAvailable() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`[latitudes] shader compilation failed: ${log}`);
  }
  return shader;
}

export function createLatitudesRenderer(canvas, initialPalette) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  let program;
  try {
    program = gl.createProgram();
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`[latitudes] program link failed: ${gl.getProgramInfoLog(program)}`);
    }
  } catch (error) {
    console.warn(String(error));
    return null;
  }

  const uniforms = {};
  for (const name of [
    "u_lag", "u_samples", "u_aspect", "u_shearPerMetre", "u_bandFrequency",
    "u_lateralWeight", "u_fineWeight", "u_toneSpread", "u_restPhase",
    "u_relief", "u_contourGlow", "u_particleWeight",
    "u_tone0", "u_tone1", "u_tone2", "u_tone3", "u_tone4",
  ]) uniforms[name] = gl.getUniformLocation(program, name);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const positionLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const lagTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, lagTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, LATITUDES_HISTORY_SAMPLES, 1);

  const lagBuffer = new Float32Array(LATITUDES_HISTORY_SAMPLES);
  const history = createLatitudesHistory();
  let palette = initialPalette;
  let restPhase = 0;
  let width = 1;
  let height = 1;
  let disposed = false;

  return {
    label: "WebGL2 · Latitudes strata",

    setPalette(nextPalette) {
      palette = nextPalette;
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
      advanceLatitudesHistory(history, speed, deltaSeconds);
      restPhase += speedToRestPhaseRate(speed) * Math.max(0, Math.min(deltaSeconds, 0.25));

      for (let index = 0; index < LATITUDES_HISTORY_SAMPLES; index += 1) {
        lagBuffer[index] = historyLagMetres(history, index / (LATITUDES_HISTORY_SAMPLES - 1));
      }

      const structure = speedToFieldStructure(speed);

      gl.viewport(0, 0, width, height);
      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, lagTexture);
      gl.texSubImage2D(
        gl.TEXTURE_2D, 0, 0, 0, LATITUDES_HISTORY_SAMPLES, 1, gl.RED, gl.FLOAT, lagBuffer,
      );
      gl.uniform1i(uniforms.u_lag, 0);

      gl.uniform1f(uniforms.u_samples, LATITUDES_HISTORY_SAMPLES);
      gl.uniform1f(uniforms.u_aspect, width / height);
      gl.uniform1f(uniforms.u_shearPerMetre, LATITUDES_SHEAR_PER_METRE);
      gl.uniform1f(uniforms.u_bandFrequency, structure.bandFrequency);
      gl.uniform1f(uniforms.u_lateralWeight, structure.lateralWeight);
      gl.uniform1f(uniforms.u_fineWeight, structure.fineWeight);
      gl.uniform1f(uniforms.u_toneSpread, structure.toneSpread);
      gl.uniform1f(uniforms.u_relief, structure.relief);
      gl.uniform1f(uniforms.u_contourGlow, structure.contourGlow);
      gl.uniform1f(uniforms.u_particleWeight, structure.particleWeight);
      gl.uniform1f(uniforms.u_restPhase, restPhase);

      gl.uniform3fv(uniforms.u_tone0, palette.base);
      gl.uniform3fv(uniforms.u_tone1, palette.mid);
      gl.uniform3fv(uniforms.u_tone2, palette.light);
      gl.uniform3fv(uniforms.u_tone3, palette.accent);
      gl.uniform3fv(uniforms.u_tone4, palette.secondary);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      gl.deleteTexture(lagTexture);
      gl.deleteBuffer(quad);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
