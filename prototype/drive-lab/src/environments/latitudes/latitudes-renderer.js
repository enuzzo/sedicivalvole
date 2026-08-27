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
  uniform float u_restPhase;
  uniform vec3 u_tone0;
  uniform vec3 u_tone1;
  uniform vec3 u_tone2;
  uniform vec3 u_tone3;

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

  vec3 toneAt(float index) {
    vec3 tone = u_tone0;
    tone = mix(tone, u_tone1, step(0.5, index));
    tone = mix(tone, u_tone2, step(1.5, index));
    tone = mix(tone, u_tone3, step(2.5, index));
    return tone;
  }

  void main() {
    float age = v_uv.y;

    // The only place travel enters the image. Older strata carry more lag, so
    // the lateral field is displaced further the higher up the frame it sits.
    float lag = lagAt(age);
    float u = v_uv.x * u_aspect + lag * u_shearPerMetre + u_restPhase;
    float v = v_uv.y * u_bandFrequency;

    // Irrational-ish frequency ratios keep the strata unevenly spaced, so the
    // stack reads as an editorial register rather than as even wallpaper.
    float band = sin(v * TAU)
      + 0.55 * sin(v * TAU * 0.37 + 1.7)
      + 0.30 * sin(v * TAU * 2.19 + 4.1)
      + u_fineWeight * 0.45 * sin(v * TAU * 3.7 + 2.3);
    band /= 2.3;

    // Shear only reads as speed if the lateral field has distinct features. A
    // smooth sinusoid displaced by lag just relocates itself and lumps against
    // the strata; narrow marks at incommensurate spacings each trace a single
    // continuous streak whose slope is the speed and whose curve is the
    // acceleration, because every row draws the same marks at its own lag.
    float marks =
        smoothstep(0.93, 1.0, sin(u * TAU * 2.60))
      + smoothstep(0.95, 1.0, sin(u * TAU * 4.19 + 2.1))
      + u_fineWeight * smoothstep(0.96, 1.0, sin(u * TAU * 7.09 + 0.7));

    float value = band * 0.72 + marks * u_lateralWeight * 0.58;

    float quantised = clamp(value * 0.5 * u_toneSpread + 0.5, 0.0, 1.0) * 4.0 - 0.5;
    float lower = floor(quantised);
    float fraction = quantised - lower;
    // Just enough analytic width to stop the tone edges aliasing, without
    // softening the hard-edged register into a gradient.
    float antialias = clamp(fwidth(quantised) * 0.7, 0.0015, 0.5);
    float blend = smoothstep(0.5 - antialias, 0.5 + antialias, fraction);

    vec3 color = mix(
      toneAt(clamp(lower, 0.0, 3.0)),
      toneAt(clamp(lower + 1.0, 0.0, 3.0)),
      blend
    );
    outColor = vec4(color, 1.0);
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
    "u_tone0", "u_tone1", "u_tone2", "u_tone3",
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
      gl.uniform1f(uniforms.u_restPhase, restPhase);

      gl.uniform3fv(uniforms.u_tone0, palette.base);
      gl.uniform3fv(uniforms.u_tone1, palette.mid);
      gl.uniform3fv(uniforms.u_tone2, palette.light);
      gl.uniform3fv(uniforms.u_tone3, palette.accent);

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
