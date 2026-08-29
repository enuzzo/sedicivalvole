// Project-authored fluid field. This shader uses coupled sine domains and an
// independently authored warp system; it does not copy the CodePen shader or
// its separately attributed value-noise fragment. The exact study boundary is
// recorded in docs/SOURCE-ADMISSION-2026-08-29.md.

const VERTEX_SHADER = `#version 300 es
  in vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `#version 300 es
  precision highp float;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform float u_time;
  uniform float u_colorTime;
  uniform float u_energy;
  uniform float u_music;
  uniform float u_musicPulse;
  uniform float u_agitation;
  uniform float u_scale;
  uniform float u_warp;
  uniform float u_convergence;
  uniform float u_glow;
  uniform float u_pressure;
  uniform float u_effect;
  uniform vec3 u_base;
  uniform vec3 u_mid;
  uniform vec3 u_light;
  uniform vec3 u_accent;
  uniform vec3 u_secondary;
  out vec4 outColor;

  mat2 turn(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
    float radius = length(uv);
    uv *= mix(1.0, 1.0 + radius * 1.7, u_convergence);
    uv -= u_pointer * (0.12 + 0.08 * u_music) * exp(-radius * 1.8);
    uv *= u_scale;

    vec2 q = uv;
    float field = 0.0;
    float weight = 0.54;
    for (int layer = 0; layer < 6; layer += 1) {
      float f = float(layer);
      float phase = u_time * (0.42 + f * 0.07)
        + u_colorTime * (0.16 + f * 0.025)
        + u_musicPulse * u_agitation * (0.24 + f * 0.03);
      vec2 drift = vec2(
        sin(q.y * (2.3 + f * 0.41) + phase + f * 1.7),
        cos(q.x * (2.6 + f * 0.37) - phase * 0.93 - f * 0.8)
      );
      q += drift * u_warp * weight * (0.26 + u_music * 0.08 + u_agitation * 0.05);
      q = turn(0.48 + f * 0.11 + sin(phase * 0.22) * 0.08) * q * 1.31;
      field += (sin(q.x * 2.1 + phase) + cos(q.y * 2.4 - phase * 0.81)) * weight;
      weight *= 0.63;
    }

    float filaments = sin(q.x * 5.7 + sin(q.y * 3.8 - u_time * 0.22) * 1.6)
      + cos(q.y * 6.3 - cos(q.x * 4.2 + u_time * 0.18) * 1.4);
    float eddies = sin((q.x + q.y) * (8.1 + u_agitation) + field * 1.8 - u_colorTime * 0.54)
      * cos((q.x - q.y) * 5.4 - field * 1.1 + u_musicPulse * u_agitation);
    float marbleField = field * 0.37 + filaments * 0.19 + eddies * 0.16
      + radius * u_convergence * 4.8 - u_colorTime * 0.14;
    float contour = 0.5 + 0.5 * sin(marbleField * 2.35 + eddies * 0.42);
    float secondaryContour = 0.5 + 0.5 * sin(
      marbleField * 5.2 - filaments * 0.62 + eddies * 0.76 + u_colorTime * 0.18
    );
    float tertiaryContour = 0.5 + 0.5 * sin(
      marbleField * 9.6 + field * 0.72 - eddies * 0.42
    );
    float islands = smoothstep(0.08, 0.92, contour);
    float boundary = 1.0 - smoothstep(0.025, 0.14, abs(contour - 0.5));
    float innerBoundary = 1.0 - smoothstep(0.018, 0.095, abs(secondaryContour - 0.5));
    float creases = pow(1.0 - abs(secondaryContour * 2.0 - 1.0), 11.0);
    float fineCreases = pow(1.0 - abs(tertiaryContour * 2.0 - 1.0), 15.0);
    float core = exp(-radius * mix(3.8, 2.4, u_energy));
    float colorPhase = 0.5 + 0.5 * sin(field * 0.86 + u_colorTime);

    vec3 lowField = mix(u_base, u_secondary, 0.24 + secondaryContour * 0.45);
    vec3 highField = mix(u_mid, u_accent, 0.18 + tertiaryContour * 0.30);
    vec3 color = mix(lowField, highField, islands);
    color = mix(color, u_secondary, smoothstep(0.58, 0.96, secondaryContour) * 0.32);
    color = mix(color, u_accent, smoothstep(0.68, 0.98, contour) * (0.16 + u_music * 0.08));
    color = mix(color, mix(u_accent, u_secondary, colorPhase), eddies * eddies * 0.08);
    color = mix(color, u_base, min(0.82, boundary * 0.58 + innerBoundary * 0.24));
    color += u_light * (creases * (0.045 + u_glow * 0.19) + fineCreases * 0.045);
    color += mix(u_accent, u_secondary, colorPhase) * core * u_convergence * 0.34;
    color += u_light * creases * u_musicPulse * u_agitation * 0.08;

    if (u_effect > 1.5 && u_effect < 2.5) {
      color = mix(color, mix(u_base, u_secondary, 0.28), 0.24);
      color *= u_pressure;
    } else if (u_effect > 2.5) {
      color += u_light * pow(creases, 1.5) * 0.28;
    } else if (u_effect > 0.5) {
      color += mix(u_accent, u_light, 0.25) * core * 0.16;
    }

    float vignette = 1.0 - smoothstep(0.26, 1.05, radius);
    color *= 0.56 + vignette * 0.34;
    outColor = vec4(max(color, vec3(0.0)), 1.0);
  }
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "PRIMORDIAL shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export function primordialWebglAvailable() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

export function createPrimordialRenderer(canvas, initialPalette) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
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
    throw new Error(gl.getProgramInfoLog(program) || "PRIMORDIAL shader link failed");
  }

  const vertexArray = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name) => gl.getUniformLocation(program, name);
  const uniforms = {
    resolution: uniform("u_resolution"),
    pointer: uniform("u_pointer"),
    time: uniform("u_time"),
    colorTime: uniform("u_colorTime"),
    energy: uniform("u_energy"),
    music: uniform("u_music"),
    musicPulse: uniform("u_musicPulse"),
    agitation: uniform("u_agitation"),
    scale: uniform("u_scale"),
    warp: uniform("u_warp"),
    convergence: uniform("u_convergence"),
    glow: uniform("u_glow"),
    pressure: uniform("u_pressure"),
    effect: uniform("u_effect"),
    base: uniform("u_base"),
    mid: uniform("u_mid"),
    light: uniform("u_light"),
    accent: uniform("u_accent"),
    secondary: uniform("u_secondary"),
  };
  let palette = initialPalette;
  let time = 0;
  let colorTime = 0;
  let pulseTime = 0;
  let disposed = false;

  const setColor = (location, color) => gl.uniform3f(location, color[0], color[1], color[2]);
  return {
    label: "WebGL2 · Primordial fluid field",
    resize(width, height) {
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    setPalette(nextPalette) {
      palette = nextPalette;
    },
    render({ profile, pointer, musicLevel, effect, deltaSeconds }) {
      if (disposed) return;
      time += deltaSeconds * profile.flowRate;
      colorTime += deltaSeconds * profile.colorRate;
      pulseTime += deltaSeconds * profile.musicTempoHz;
      const musicPulse = profile.musicTempoHz > 0
        ? 0.5 + 0.5 * Math.sin(pulseTime * Math.PI * 2)
        : 0;

      gl.useProgram(program);
      gl.bindVertexArray(vertexArray);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.colorTime, colorTime);
      gl.uniform1f(uniforms.energy, profile.energy);
      gl.uniform1f(uniforms.music, musicLevel);
      gl.uniform1f(uniforms.musicPulse, musicPulse);
      gl.uniform1f(uniforms.agitation, profile.agitation);
      gl.uniform1f(uniforms.scale, profile.scale);
      gl.uniform1f(uniforms.warp, profile.warp);
      gl.uniform1f(uniforms.convergence, profile.convergence);
      gl.uniform1f(uniforms.glow, profile.glow);
      gl.uniform1f(uniforms.pressure, profile.pressure);
      gl.uniform1f(
        uniforms.effect,
        effect === "OPEN" ? 1 : effect === "UNDERWATER" ? 2 : effect === "BLOOM" ? 3 : 0,
      );
      setColor(uniforms.base, palette.base);
      setColor(uniforms.mid, palette.mid);
      setColor(uniforms.light, palette.light);
      setColor(uniforms.accent, palette.accent);
      setColor(uniforms.secondary, palette.secondary);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vertexArray);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    },
  };
}

export const PRIMORDIAL_SHADER_SOURCES = Object.freeze({
  vertex: VERTEX_SHADER,
  fragment: FRAGMENT_SHADER,
});
