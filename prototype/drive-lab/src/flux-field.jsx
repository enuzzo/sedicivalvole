import { useEffect, useRef } from "react";
import { energyToFlowRate, speedToVisualVelocity, visualVelocityToMorphWarp } from "./signal-model.js";

/** Below this the vehicle counts as standing still for recolouring. */
const REST_RECOLOUR_SPEED_KMH = 1;
/** Seconds between resting re-deals. */
const REST_RECOLOUR_INTERVAL_SECONDS = 4.5;

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
  uniform float u_velocity;
  uniform float u_flow;
  uniform float u_pulse;
  uniform float u_brake;
  uniform float u_restRecolour;
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
    vec2 edge = min(point, 1.0 - point) - inset;
    vec2 antialias = max(fwidth(point) * 1.25, vec2(0.001));
    vec2 inside = smoothstep(vec2(0.0), antialias, edge);
    return inside.x * inside.y;
  }

  float squarePerimeter(vec2 point) {
    vec2 absolutePoint = abs(point);
    if (absolutePoint.y >= absolutePoint.x) {
      if (point.y >= 0.0) return 1.0 + point.x / max(point.y, 0.0001);
      return 5.0 - point.x / max(-point.y, 0.0001);
    }
    if (point.x >= 0.0) return 3.0 - point.y / max(point.x, 0.0001);
    return 7.0 + point.y / max(-point.x, 0.0001);
  }

  void main() {
    vec2 screen = v_uv * 2.0 - 1.0;
    screen.x *= u_aspect * 0.77;

    float energy = smoothstep(0.02, 0.96, u_energy);
    float velocity = smoothstep(0.08, 0.96, u_velocity);
    float shrink = smoothstep(0.0, 0.42, energy);
    float warp = pow(smoothstep(0.02, 0.92, u_velocity), 1.05);
    float majorAxis = max(max(abs(screen.x), abs(screen.y)), 0.035);
    float perimeter = squarePerimeter(screen);
    float depth = 1.0 / max(majorAxis, 0.12);

    // -- One coordinate system at every speed ------------------------------
    //
    // This field used to blend a Cartesian flat grid with a ring-topology tunnel
    // grid. Those are different topologies: squarePerimeter switches branch on
    // the diagonals, so every intermediate blend carried a fraction of that
    // discontinuity across them and floor() cut tiles along the diagonals.
    // No continuous map exists between the two, so the tearing could not be
    // tuned away -- the flat state had to become a degenerate case of the tunnel
    // rather than a separate scene.
    //
    // Now the angular coordinate is used unchanged at all speeds, so its
    // discontinuity is never blended, and only the radial coordinate
    // interpolates -- between a linear reading of majorAxis and the perspective
    // reading. Both are monotonic toward the centre, so their blend is monotonic
    // and cannot fold. Speed deforms one field instead of crossfading two.

    // A Cartesian grid is kept at every speed and the tunnel is produced by
    // displacing it radially, rather than by switching to ring coordinates.
    // The remap is monotonic in majorAxis and therefore continuous and
    // invertible, so floor() can never cut a tile: the same objects deform.
    //
    // Cell size in screen space goes as dr / d(mapped), so a logarithmic remap
    // shrinks tiles toward the centre and builds the vanishing point, while at
    // rest the remap is the identity and the field is a plain flat mosaic.
    const float R_FLOOR = 0.055;
    // Anisotropic so the resting tiles read square on a wide viewport: screen.x
    // already carries the aspect term, so x needs the larger count.
    const vec2 GRID_SCALE = vec2(5.2, 4.0);
    const float TUNNEL_SCALE = 0.46;

    float radius = max(majorAxis, R_FLOOR);
    float flatMapped = radius;
    float tunnelMapped = log(radius / R_FLOOR) * TUNNEL_SCALE;
    float mapped = mix(flatMapped, tunnelMapped, warp) + u_flow * 0.05 * warp;
    vec2 displaced = screen * (mapped / radius);

    vec2 fieldGrid = displaced * GRID_SCALE;
    vec2 fieldCell = floor(fieldGrid);
    vec2 fieldLocal = fract(fieldGrid);
    float identity = hash21(fieldCell + vec2(17.0, 3.0));
    float tone = hash21(fieldCell + vec2(8.0, 29.0));

    float flatInsetX = 0.12;
    float compactInsetX = mix(flatInsetX, 0.27, shrink);
    float flatInsetY = clamp(0.5 - (0.5 - flatInsetX) * u_aspect * 0.7, 0.03, 0.42);
    float compactInsetY = clamp(0.5 - (0.5 - compactInsetX) * u_aspect * 0.7, 0.03, 0.42);
    vec2 compactInset = vec2(compactInsetX, mix(flatInsetY, compactInsetY, shrink));
    float trailInset = mix(0.15 + 0.1 * hash21(fieldCell + vec2(9.0)), 0.012, velocity);
    vec2 tunnelInset = vec2(0.1 + 0.07 * hash21(fieldCell + vec2(4.0)), trailInset);
    vec2 fieldInset = mix(compactInset, tunnelInset, warp);
    float tile = rectangleMask(fieldLocal, fieldInset);

    // Keyed to the world cell, so a tile carries the same colour for as long as
    // it is in the scene: the field moves, the tile's index moves with it, and
    // its colour never changes underneath it.
    //
    // u_restRecolour is the single deliberate exception. It advances in discrete
    // steps only while the vehicle is standing still, so a stationary mosaic
    // re-deals its colours every few seconds. The moment the vehicle moves it is
    // frozen, and every tile's colour is fixed from then on.
    float colorIndex = floor(hash21(fieldCell + vec2(41.0, 13.0) + u_restRecolour) * 4.0);
    vec3 darkPanel = mix(u_base, u_mid, 0.66);
    vec3 panel = darkPanel;
    panel = mix(panel, u_mid, step(0.5, colorIndex));
    panel = mix(panel, u_light, step(1.5, colorIndex));
    panel = mix(panel, u_accent, step(2.5, colorIndex));
    // Per-tile shading only. The previous form modulated every panel from the
    // shared flow clock, which read as an unmotivated shimmer at a standstill.
    panel *= mix(0.97 + tone * 0.06, 0.88 + tone * 0.22, warp);
    vec3 color = mix(u_base, panel, tile);

    float apertureRadius = max(abs(screen.x) * 0.78, abs(screen.y));
    float apertureGrowth = smoothstep(0.02, 0.72, warp);
    float apertureSize = mix(-0.01, 0.105, apertureGrowth);
    float apertureActive = step(0.0, apertureSize);
    float aperture = apertureActive * (1.0 - smoothstep(apertureSize, apertureSize + 0.012, apertureRadius));
    float apertureFrame = apertureActive
      * smoothstep(apertureSize - 0.012, apertureSize, apertureRadius)
      * (1.0 - smoothstep(apertureSize + 0.012, apertureSize + 0.025, apertureRadius));
    vec3 apertureVoid = u_base * 0.08;
    color = mix(color, apertureVoid, aperture);
    color = mix(color, u_mid * 0.34, apertureFrame * 0.5);

    float edge = smoothstep(1.18, 0.38, max(abs(screen.x) * 0.72, abs(screen.y)));
    color *= mix(1.0, 0.66 + edge * 0.42, warp);
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

function hashCell(column, row) {
  let value = (Math.trunc(column) * 73856093) ^ (Math.trunc(row) * 19349663);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function cssColor(rgb, alpha = 1) {
  return `rgb(${rgb.map((value) => Math.round(value * 255)).join(" ")} / ${alpha})`;
}

function smoothstep(minimum, maximum, value) {
  const normalized = Math.min(1, Math.max(0, (value - minimum) / (maximum - minimum)));
  return normalized * normalized * (3 - 2 * normalized);
}

function mixColor(from, to, amount) {
  return from.map((value, index) => value + (to[index] - value) * amount);
}

function drawCanvasFallback(context, canvas, energy, visualVelocity, palette, flow) {
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
  const shrink = smoothstep(0, 0.42, easedEnergy);
  const warp = visualVelocityToMorphWarp(visualVelocity);
  const flatDark = mixColor(palette.base, palette.mid, 0.66);
  const flatColors = [flatDark, palette.mid, palette.light, palette.accent];

  for (let index = 0; index < 96; index += 1) {
    const column = index % 12;
    const row = Math.floor(index / 12);
    const flatX = (column + 0.5) * width / 12;
    const flatY = (row + 0.5) * height / 8;

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

    const x = flatX + (tunnelX - flatX) * warp;
    const y = flatY + (tunnelY - flatY) * warp;
    const panelScale = 0.45 + scale * 0.88;
    const horizontal = side === 0 || side === 2;
    const flatSize = Math.min(width / 12, height / 8) * 0.74;
    const compactSize = flatSize * (1 - shrink * 0.43);
    const radialStretch = 1 + velocity * 4.5;
    const tunnelWidth = width * (horizontal ? 0.07 : 0.018 * radialStretch) * panelScale;
    const tunnelHeight = height * (horizontal ? 0.018 * radialStretch : 0.075) * panelScale;
    const panelWidth = compactSize + (tunnelWidth - compactSize) * warp;
    const panelHeight = compactSize + (tunnelHeight - compactSize) * warp;

    // Matches the WebGL2 path: a linear combination of the cell coordinates
    // marches one step per row and reads as a spiral, so the tone is hashed.
    const colorIndex = hashCell(column, row) % flatColors.length;
    context.fillStyle = cssColor(flatColors[colorIndex], 0.92 + travel * 0.08);
    context.fillRect(x - panelWidth / 2, y - panelHeight / 2, panelWidth, panelHeight);
  }

  const apertureGrowth = smoothstep(0.02, 0.72, warp);
  const apertureScale = -0.01 + apertureGrowth * 0.115;
  if (apertureScale > 0) {
    const apertureWidth = width * apertureScale;
    const apertureHeight = height * apertureScale;
    context.fillStyle = cssColor(palette.mid, 0.46);
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
  let visualVelocity = speedToVisualVelocity(
    reducedMotion ? Math.min(valuesRef.current.speed, 20) : valuesRef.current.speed,
  );
  let lastFrameAt = performance.now();
  let lastDrawAt = 0;
  onRenderer("Canvas2D · Aperture");
  drawCanvasFallback(
    context,
    canvas,
    visualEnergy,
    visualVelocity,
    valuesRef.current.theme.palette,
    flow,
  );

  const render = (now) => {
    if (stopped) return;
    animationFrame = requestAnimationFrame(render);
    if (now - lastDrawAt < 1000 / 30) return;
    const deltaSeconds = Math.min(0.05, Math.max(0, (now - lastFrameAt) / 1000));
    lastFrameAt = now;
    lastDrawAt = now;
    const nextEnergy = reducedMotion ? Math.min(valuesRef.current.energy, 0.28) : valuesRef.current.energy;
    visualEnergy += (nextEnergy - visualEnergy) * (nextEnergy >= visualEnergy ? 0.12 : 0.065);
    const nextVelocity = speedToVisualVelocity(
      reducedMotion ? Math.min(valuesRef.current.speed, 20) : valuesRef.current.speed,
    );
    visualVelocity += (nextVelocity - visualVelocity) * (nextVelocity >= visualVelocity ? 0.14 : 0.12);
    if (!reducedMotion) flow += deltaSeconds * energyToFlowRate(visualEnergy, valuesRef.current.speed);
    drawCanvasFallback(
      context,
      canvas,
      visualEnergy,
      visualVelocity,
      valuesRef.current.theme.palette,
      flow,
    );
    onFrame(now, 1000 / 30, "Canvas2D", canvas.width, canvas.height);
  };
  animationFrame = requestAnimationFrame(render);
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
  };
}

export function FluxField({ energy, speed, theme, reducedMotion, pulse, brake, onRenderer, onFrame }) {
  const canvasRef = useRef(null);
  const valuesRef = useRef({ energy, speed, theme, pulse, brake });
  valuesRef.current = { energy, speed, theme, pulse, brake };

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
      velocity: gl.getUniformLocation(program, "u_velocity"),
      flow: gl.getUniformLocation(program, "u_flow"),
      pulse: gl.getUniformLocation(program, "u_pulse"),
      brake: gl.getUniformLocation(program, "u_brake"),
      restRecolour: gl.getUniformLocation(program, "u_restRecolour"),
      base: gl.getUniformLocation(program, "u_base"),
      mid: gl.getUniformLocation(program, "u_mid"),
      light: gl.getUniformLocation(program, "u_light"),
      accent: gl.getUniformLocation(program, "u_accent"),
    };

    let animationFrame = 0;
    let stopped = false;
    let flow = 0;
    // The resting mosaic re-deals its colours on a slow discrete step. It only
    // advances while the vehicle is effectively stopped, so as soon as it moves
    // every tile's colour is fixed for as long as it stays in the scene.
    let restSeconds = 0;
    let restRecolour = 0;
    let visualEnergy = reducedMotion ? Math.min(energy, 0.28) : energy;
    let visualVelocity = speedToVisualVelocity(reducedMotion ? Math.min(speed, 20) : speed);
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
      const smoothing = nextEnergy >= visualEnergy ? 0.12 : 0.065;
      visualEnergy += (nextEnergy - visualEnergy) * smoothing;
      const nextVelocity = speedToVisualVelocity(
        reducedMotion ? Math.min(valuesRef.current.speed, 20) : valuesRef.current.speed,
      );
      const velocitySmoothing = nextVelocity >= visualVelocity ? 0.14 : 0.12;
      visualVelocity += (nextVelocity - visualVelocity) * velocitySmoothing;
      if (!reducedMotion) flow += deltaSeconds * energyToFlowRate(visualEnergy, valuesRef.current.speed);

      if (valuesRef.current.speed < REST_RECOLOUR_SPEED_KMH) {
        restSeconds += deltaSeconds;
        if (restSeconds >= REST_RECOLOUR_INTERVAL_SECONDS) {
          restSeconds = 0;
          restRecolour += 1;
        }
      } else {
        restSeconds = 0;
      }

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
      gl.uniform1f(uniforms.velocity, visualVelocity);
      gl.uniform1f(uniforms.flow, flow);
      gl.uniform1f(uniforms.pulse, valuesRef.current.pulse);
      gl.uniform1f(uniforms.brake, valuesRef.current.brake);
      gl.uniform1f(uniforms.restRecolour, restRecolour);
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
