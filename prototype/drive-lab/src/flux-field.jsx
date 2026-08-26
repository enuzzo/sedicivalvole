import { useEffect, useRef } from "react";

const VERTEX_SHADER = `#version 300 es
  in vec2 a_position;
  out vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `#version 300 es
  precision highp float;

  uniform float u_aspect;
  uniform float u_energy;
  uniform float u_flow;
  uniform float u_pulse;
  uniform float u_brake;
  uniform vec3 u_base;
  uniform vec3 u_mid;
  uniform vec3 u_light;
  uniform vec3 u_accent;

  in vec2 v_uv;
  out vec4 outColor;

  float hash21(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += vec2(dot(point, point + vec2(45.32)));
    return fract(point.x * point.y);
  }

  float rectangleMask(vec2 point, vec2 inset) {
    vec2 inside = step(inset, point) * step(inset, 1.0 - point);
    return inside.x * inside.y;
  }

  void main() {
    vec2 screen = v_uv * 2.0 - 1.0;
    screen.x *= u_aspect * 0.77;

    float energy = smoothstep(0.02, 0.96, u_energy);
    float majorAxis = max(max(abs(screen.x), abs(screen.y)), 0.035);
    float sideSurface = step(abs(screen.y), abs(screen.x));
    float lateral = mix(
      screen.x / (abs(screen.y) + 0.055),
      screen.y / (abs(screen.x) + 0.055),
      sideSurface
    );
    float depth = 1.0 / majorAxis;

    vec2 flatGrid = v_uv * vec2(13.0, 7.0);
    vec2 tunnelGrid = vec2(lateral * 15.0, depth * 4.5 - u_flow);
    vec2 grid = mix(flatGrid, tunnelGrid, energy);
    vec2 cell = floor(grid);
    vec2 local = fract(grid);

    float identity = hash21(cell + vec2(sideSurface * 17.0, 3.0));
    float tone = hash21(cell + vec2(8.0, 29.0));
    float enabled = step(mix(0.84, 0.18, energy), identity);
    vec2 tunnelInset = vec2(0.09 + 0.08 * hash21(cell + vec2(4.0)), 0.12 + 0.12 * hash21(cell + vec2(9.0)));
    vec2 inset = mix(vec2(0.28, 0.34), tunnelInset, energy);
    float tile = rectangleMask(local, inset) * enabled;
    float seam = 1.0 - rectangleMask(local, vec2(0.035));

    vec3 panel = u_mid * (0.35 + tone * 0.5);
    panel = mix(panel, u_light, step(0.84 - energy * 0.12, tone));
    panel = mix(panel, u_accent, step(0.94 - energy * 0.03, identity) * smoothstep(0.12, 0.5, energy));

    vec3 color = u_base;
    color = mix(color, u_mid * 0.18, seam * (0.3 + energy * 0.3));
    color = mix(color, panel, tile);

    float apertureRadius = max(abs(screen.x) * 0.78, abs(screen.y));
    float aperture = 1.0 - smoothstep(0.055, 0.105, apertureRadius);
    float apertureFrame = smoothstep(0.09, 0.12, apertureRadius) * (1.0 - smoothstep(0.12, 0.155, apertureRadius));
    vec3 apertureVoid = u_base * 0.08;
    color = mix(color, apertureVoid, aperture * energy);
    color = mix(color, u_mid * 0.34, apertureFrame * energy * 0.5);

    float calmRule = 1.0 - smoothstep(0.0, 0.012, abs(fract(v_uv.y * 7.0) - 0.5));
    color += u_mid * calmRule * (1.0 - energy) * 0.09;

    float edge = smoothstep(1.18, 0.38, max(abs(screen.x) * 0.72, abs(screen.y)));
    color *= 0.66 + edge * 0.42;
    color = mix(color, u_accent, u_pulse * tile * step(0.84, identity) * 0.16);
    color = mix(color, u_light, u_brake * (0.035 + apertureFrame * 0.08));

    outColor = vec4(color, 1.0);
  }
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown shader compilation error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function cssColor(rgb, alpha = 1) {
  return `rgb(${rgb.map((value) => Math.round(value * 255)).join(" ")} / ${alpha})`;
}

function drawCanvasFallback(context, canvas, energy, palette, flow) {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
  const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
  const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.fillStyle = cssColor(palette.base);
  context.fillRect(0, 0, width, height);
  const centerX = width / 2;
  const centerY = height * 0.5;
  const easedEnergy = energy * energy * (3 - 2 * energy);

  for (let index = 0; index < 96; index += 1) {
    const column = index % 12;
    const row = Math.floor(index / 12);
    const flatX = (column + 0.2 + ((index * 13) % 7) * 0.09) * width / 12;
    const flatY = (row + 0.24 + ((index * 17) % 5) * 0.1) * height / 8;

    const ring = Math.floor(index / 8);
    const slot = index % 8;
    const side = Math.floor(slot / 2);
    const along = slot % 2 === 0 ? -0.42 : 0.42;
    const travel = (ring / 12 + flow * 0.075) % 1;
    const scale = 0.055 + travel * travel * 1.16;
    let tunnelX = centerX;
    let tunnelY = centerY;
    if (side === 0) {
      tunnelX += along * width * scale;
      tunnelY -= height * 0.43 * scale;
    } else if (side === 1) {
      tunnelX += width * 0.43 * scale;
      tunnelY += along * height * scale;
    } else if (side === 2) {
      tunnelX += along * width * scale;
      tunnelY += height * 0.43 * scale;
    } else {
      tunnelX -= width * 0.43 * scale;
      tunnelY += along * height * scale;
    }

    const x = flatX + (tunnelX - flatX) * easedEnergy;
    const y = flatY + (tunnelY - flatY) * easedEnergy;
    const seed = (index * 37) % 19;
    const panelScale = 0.45 + scale * 0.88;
    const horizontal = side === 0 || side === 2;
    const flatWidth = width * (0.028 + (seed % 4) * 0.012);
    const flatHeight = Math.max(2, height * 0.012);
    const tunnelWidth = width * (horizontal ? 0.095 : 0.024) * panelScale;
    const tunnelHeight = height * (horizontal ? 0.025 : 0.1) * panelScale;
    const panelWidth = flatWidth + (tunnelWidth - flatWidth) * easedEnergy;
    const panelHeight = flatHeight + (tunnelHeight - flatHeight) * easedEnergy;

    context.fillStyle = seed === 0
      ? cssColor(palette.accent, 0.96)
      : seed > 13
        ? cssColor(palette.light, 0.78)
        : cssColor(palette.mid, 0.54 + travel * 0.4);
    context.fillRect(x - panelWidth / 2, y - panelHeight / 2, panelWidth, panelHeight);
  }

  if (easedEnergy > 0.08) {
    const apertureWidth = width * (0.016 + (1 - easedEnergy) * 0.05);
    const apertureHeight = height * (0.02 + (1 - easedEnergy) * 0.065);
    context.fillStyle = cssColor(palette.mid, 0.46 * easedEnergy);
    context.fillRect(
      centerX - apertureWidth / 2 - 1,
      centerY - apertureHeight / 2 - 1,
      apertureWidth + 2,
      apertureHeight + 2,
    );
    context.fillStyle = cssColor(palette.base);
    context.fillRect(centerX - apertureWidth / 2, centerY - apertureHeight / 2, apertureWidth, apertureHeight);
  }
}

function startCanvasFallback(canvas, valuesRef, reducedMotion, onRenderer, onFrame) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return undefined;
  let animationFrame = 0;
  let stopped = false;
  let flow = 0;
  let visualEnergy = reducedMotion ? Math.min(valuesRef.current.energy, 0.28) : valuesRef.current.energy;
  let lastFrameAt = performance.now();
  let lastDrawAt = 0;
  onRenderer("Canvas2D · Aperture");
  drawCanvasFallback(context, canvas, visualEnergy, valuesRef.current.theme.palette, flow);

  const render = (now) => {
    if (stopped) return;
    animationFrame = requestAnimationFrame(render);
    if (now - lastDrawAt < 1000 / 30) return;
    const deltaSeconds = Math.min(0.05, Math.max(0, (now - lastFrameAt) / 1000));
    lastFrameAt = now;
    lastDrawAt = now;
    const nextEnergy = reducedMotion ? Math.min(valuesRef.current.energy, 0.28) : valuesRef.current.energy;
    visualEnergy += (nextEnergy - visualEnergy) * (nextEnergy >= visualEnergy ? 0.12 : 0.045);
    if (!reducedMotion) flow += deltaSeconds * (0.08 + visualEnergy * 1.45);
    drawCanvasFallback(context, canvas, visualEnergy, valuesRef.current.theme.palette, flow);
    onFrame(now, 1000 / 30, "Canvas2D", canvas.width, canvas.height);
  };
  animationFrame = requestAnimationFrame(render);
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
  };
}

export function FluxField({ energy, theme, reducedMotion, pulse, brake, onRenderer, onFrame }) {
  const canvasRef = useRef(null);
  const valuesRef = useRef({ energy, theme, pulse, brake });
  valuesRef.current = { energy, theme, pulse, brake };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const probe = document.createElement("canvas");
    const webglAvailable = Boolean(probe.getContext("webgl2"));
    const gl = webglAvailable ? canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "high-performance",
    }) : null;
    if (!gl) return startCanvasFallback(canvas, valuesRef, reducedMotion, onRenderer, onFrame);

    let program;
    let vertexShader;
    let fragmentShader;
    try {
      vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "Unknown shader link error");
      }
    } catch (error) {
      console.warn("[FluxField] WebGL2 shader setup failed", error);
      onRenderer("WebGL2 shader error");
      return undefined;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      aspect: gl.getUniformLocation(program, "u_aspect"),
      energy: gl.getUniformLocation(program, "u_energy"),
      flow: gl.getUniformLocation(program, "u_flow"),
      pulse: gl.getUniformLocation(program, "u_pulse"),
      brake: gl.getUniformLocation(program, "u_brake"),
      base: gl.getUniformLocation(program, "u_base"),
      mid: gl.getUniformLocation(program, "u_mid"),
      light: gl.getUniformLocation(program, "u_light"),
      accent: gl.getUniformLocation(program, "u_accent"),
    };

    let animationFrame = 0;
    let stopped = false;
    let flow = 0;
    let visualEnergy = reducedMotion ? Math.min(energy, 0.28) : energy;
    let lastFrameAt = performance.now();
    let lastDrawAt = 0;
    onRenderer("WebGL2 · Aperture");

    const render = (now) => {
      if (stopped) return;
      animationFrame = requestAnimationFrame(render);
      if (now - lastDrawAt < 1000 / 45) return;
      const deltaSeconds = Math.min(0.05, Math.max(0, (now - lastFrameAt) / 1000));
      lastFrameAt = now;
      lastDrawAt = now;

      const nextEnergy = reducedMotion ? Math.min(valuesRef.current.energy, 0.28) : valuesRef.current.energy;
      const smoothing = nextEnergy >= visualEnergy ? 0.12 : 0.045;
      visualEnergy += (nextEnergy - visualEnergy) * smoothing;
      if (!reducedMotion) flow += deltaSeconds * (0.08 + visualEnergy * 1.45);

      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const { palette } = valuesRef.current.theme;
      gl.useProgram(program);
      gl.uniform1f(uniforms.aspect, width / height);
      gl.uniform1f(uniforms.energy, visualEnergy);
      gl.uniform1f(uniforms.flow, flow);
      gl.uniform1f(uniforms.pulse, valuesRef.current.pulse);
      gl.uniform1f(uniforms.brake, valuesRef.current.brake);
      gl.uniform3fv(uniforms.base, palette.base);
      gl.uniform3fv(uniforms.mid, palette.mid);
      gl.uniform3fv(uniforms.light, palette.light);
      gl.uniform3fv(uniforms.accent, palette.accent);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      onFrame(now, 1000 / 45, "WebGL2", width, height);
    };

    const onContextLost = (event) => {
      event.preventDefault();
      onRenderer("WebGL2 context lost");
    };
    const onContextRestored = () => onRenderer("WebGL2 · reload required");
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    animationFrame = requestAnimationFrame(render);

    return () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [onFrame, onRenderer, reducedMotion]);

  return <canvas className="field-canvas" ref={canvasRef} aria-hidden="true" />;
}
