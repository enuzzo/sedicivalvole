import { useEffect, useRef } from "react";
import { energyToFlowRate, speedToVisualVelocity } from "./signal-model.js";
import {
  APERTURE_TUNING,
  WALL_APPROACH_SPEED_KMH,
  apertureReadout,
  apertureWall,
} from "./aperture-model.js";

export { APERTURE_TUNING, WALL_APPROACH_SPEED_KMH, apertureReadout, apertureWall };

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
  uniform float u_speedKmh;
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

  void main() {
    vec2 uv_norm = v_uv * 2.0 - 1.0;
    
    float normSpeed = clamp(u_speedKmh / 35.0, 0.0, 1.0);
    float warp = normSpeed * normSpeed * (3.0 - 2.0 * normSpeed);
    float terminalVelocity = smoothstep(118.0, 130.0, u_speedKmh);

    vec3 darkPanel = mix(u_base, u_mid, 0.66);

    float absX = abs(uv_norm.x);
    float absY = abs(uv_norm.y);
    float majorAxis = max(max(absX, absY), 0.0001);
    
    // Depth maps from 0 (at edges) to infinity (at center).
    // At majorAxis = 0.125, Depth = 7.0 tiles.
    float depth = (1.0 / majorAxis) - 1.0;
    float flowOffset = u_flow * warp;
    
    bool isSide = absX >= absY;
    
    vec2 gridPos;
    if (isSide) {
        float signX = sign(uv_norm.x);
        float longi = 3.5 * u_aspect + depth - flowOffset;
        float trans = uv_norm.y * 3.5 / absX;
        gridPos.x = mix(uv_norm.x * u_aspect * 3.5, signX * longi, warp);
        gridPos.y = mix(uv_norm.y * 3.5, trans, warp);
    } else {
        float signY = sign(uv_norm.y);
        float longi = 3.5 + depth - flowOffset;
        float trans = uv_norm.x * u_aspect * 3.5 / absY;
        gridPos.x = mix(uv_norm.x * u_aspect * 3.5, trans, warp);
        gridPos.y = mix(uv_norm.y * 3.5, signY * longi, warp);
    }
    
    // Determine fractional parts based on which axis acts as longitudinal/transverse
    float transFract = isSide ? fract(gridPos.y) : fract(gridPos.x);
    float longFract  = isSide ? fract(gridPos.x) : fract(gridPos.y);
    
    float transCell = isSide ? floor(gridPos.y) : floor(gridPos.x);
    
    // Base Tile ID purely on the 2D grid position, guaranteeing 100% seamless continuity at warp=0
    vec2 tileId = vec2(floor(gridPos.x), floor(gridPos.y));
    float colorIndex = floor(hash21(tileId + vec2(41.0, 13.0) + u_restRecolour) * 4.0);
    float tone = hash21(tileId + vec2(8.0, 29.0));

    // Tile Insets and Masking
    float baseTransInset = 0.085;
    float baseLongInset = mix(0.085, 0.02, u_velocity);
    float transInset = mix(baseTransInset, 0.44, terminalVelocity);
    float longInset = mix(baseLongInset, 0.0, terminalVelocity);

    float transMask = smoothstep(0.0, 0.02, min(transFract, 1.0 - transFract) - transInset);
    float longMask = smoothstep(0.0, 0.02, min(longFract, 1.0 - longFract) - longInset);
    float tileMask = transMask * longMask;

    vec3 panel = darkPanel;
    panel = mix(panel, u_mid, step(0.5, colorIndex));
    panel = mix(panel, u_light, step(1.5, colorIndex));
    panel = mix(panel, u_accent, step(2.5, colorIndex));
    panel *= mix(0.95 + tone * 0.10, 0.90 + tone * 0.20, u_velocity);

    // Terminal velocity laser streak coloring (white & red/accent)
    float streakHash = hash21(vec2(isSide ? 1.0 : 0.0, transCell) + 19.8);
    vec3 streakColor = mix(u_light, u_accent, step(0.45, streakHash));
    streakColor = mix(streakColor, u_mid, step(0.85, streakHash));
    panel = mix(panel, streakColor, terminalVelocity);

    vec3 color = mix(u_base, panel, tileMask);

    // Reactive Audio Pulse & Brake Highlights
    float pulse = u_pulse * tileMask * step(0.75, tone) * 0.22;
    color = mix(color, u_accent, pulse);
    color = mix(color, u_light, u_brake * tileMask * 0.08);

    // Outer edge vignette
    float edge = smoothstep(1.25, 0.40, max(absX * 0.75, absY));
    color *= mix(1.0, 0.75 + edge * 0.35, u_velocity);

    // FINAL TERMINUS VOID GATE:
    // Void covers the central 12% of the screen, hiding the infinite depth singularity
    float terminusVoid = smoothstep(0.12, 0.17, majorAxis);
    float voidActive = smoothstep(15.0, 35.0, u_speedKmh);
    color *= mix(1.0, terminusVoid, voidActive);

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

function drawCanvasFallback(context, canvas, energy, visualVelocity, speedKmh, palette, flow) {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
  const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
  const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.fillStyle = cssColor(palette.base);
  context.fillRect(0, 0, width, height);

  const flatDark = mixColor(palette.base, palette.mid, 0.66);
  const flatColors = [flatDark, palette.mid, palette.light, palette.accent];
  const wall = apertureWall(speedKmh);

  // If at standstill or low speed, draw the end wall
  if (wall.proximity > 0.01) {
    const tileSize = (height / 7) * wall.size;
    const cols = Math.ceil(width / tileSize) + 2;
    const rows = 9;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let c = -Math.floor(cols / 2); c <= Math.ceil(cols / 2); c += 1) {
      for (let r = -Math.floor(rows / 2); r <= Math.ceil(rows / 2); r += 1) {
        const px = centerX + (c - 0.5) * tileSize;
        const py = centerY + (r - 0.5) * tileSize;
        if (Math.abs(px - centerX) > (width / 2) * wall.size + tileSize) continue;
        if (Math.abs(py - centerY) > (height / 2) * wall.size + tileSize) continue;

        const colorIndex = hashCell(c + 50, r + 50) % flatColors.length;
        context.fillStyle = cssColor(flatColors[colorIndex], wall.luminance);
        context.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
      }
    }
  }

  // Draw perspective bands if wall is receding
  if (wall.proximity < 0.99) {
    const centerX = width / 2;
    const centerY = height / 2;
    const terminalVelocity = smoothstep(118, 130, speedKmh);

    for (let ring = 0; ring < 7; ring += 1) {
      const z = ring + 1 - (flow % 1);
      if (z < 1.0 || z > 8.0) continue;
      const s = 1.0 / z;
      const ringW = width * s;
      const ringH = height * s;
      const ringColor = terminalVelocity > 0.5
        ? (ring % 2 === 0 ? palette.light : palette.accent)
        : flatColors[ring % flatColors.length];

      context.strokeStyle = cssColor(ringColor, 0.7);
      context.lineWidth = terminalVelocity > 0.5 ? 2 : 4;
      context.strokeRect(centerX - ringW / 2, centerY - ringH / 2, ringW, ringH);
    }
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
    valuesRef.current.speed,
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
      valuesRef.current.speed,
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
      speedKmh: gl.getUniformLocation(program, "u_speedKmh"),
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

      const currentSpeed = valuesRef.current.speed;
      const nextEnergy = reducedMotion ? Math.min(valuesRef.current.energy, 0.28) : valuesRef.current.energy;
      const smoothing = nextEnergy >= visualEnergy ? 0.12 : 0.065;
      visualEnergy += (nextEnergy - visualEnergy) * smoothing;
      const nextVelocity = speedToVisualVelocity(
        reducedMotion ? Math.min(currentSpeed, 20) : currentSpeed,
      );
      const velocitySmoothing = nextVelocity >= visualVelocity ? 0.14 : 0.12;
      visualVelocity += (nextVelocity - visualVelocity) * velocitySmoothing;
      if (!reducedMotion) flow += deltaSeconds * energyToFlowRate(visualEnergy, currentSpeed);

      if (currentSpeed < REST_RECOLOUR_SPEED_KMH) {
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
      gl.uniform1f(uniforms.speedKmh, reducedMotion ? Math.min(currentSpeed, 20) : currentSpeed);
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
