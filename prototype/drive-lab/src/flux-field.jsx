import { useEffect, useRef } from "react";
import { energyToFlowRate, speedToVisualVelocity } from "./signal-model.js";
import {
  APERTURE_TUNING,
  WALL_APPROACH_SPEED_KMH,
  apertureReadout,
  aperturePixelRatio,
  apertureShaderControls,
  apertureSmoothing,
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
  uniform float u_velocity;
  uniform float u_wallSize;
  uniform float u_wallOpacity;
  uniform float u_terminalVelocity;
  uniform float u_speedPulseMask;
  uniform float u_voidActive;
  uniform float u_flow;
  uniform float u_pulse;
  uniform float u_brake;
  uniform float u_bloom;
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

  vec3 shadeGrid(vec2 gridPos, bool isSide) {
    float transFract = isSide ? fract(gridPos.y) : fract(gridPos.x);
    float longFract = isSide ? fract(gridPos.x) : fract(gridPos.y);
    float transCell = isSide ? floor(gridPos.y) : floor(gridPos.x);
    vec2 tileId = floor(gridPos);
    float tone = hash21(tileId + vec2(8.0, 29.0));
    float tilePhase = hash21(tileId + vec2(1.23, 4.56));
    float localTime = (u_restRecolour / 4.5) + tilePhase;
    float currentStep = floor(localTime);
    float fade = smoothstep(0.666, 1.0, fract(localTime));
    float colorIndexA = floor(hash21(tileId + vec2(41.0, 13.0) + currentStep) * 4.0);
    float colorIndexB = floor(hash21(tileId + vec2(41.0, 13.0) + currentStep + 1.0) * 4.0);
    float transInset = mix(0.085, 0.44, u_terminalVelocity);
    float longInset = mix(mix(0.085, 0.02, u_velocity), 0.0, u_terminalVelocity);
    float transMask = smoothstep(0.0, 0.02, min(transFract, 1.0 - transFract) - transInset);
    float longMask = smoothstep(0.0, 0.02, min(longFract, 1.0 - longFract) - longInset);
    float tileMask = transMask * longMask;
    vec3 darkPanel = mix(u_base, u_mid, 0.66);
    vec3 panelA = mix(mix(mix(darkPanel, u_mid, step(0.5, colorIndexA)), u_light, step(1.5, colorIndexA)), u_accent, step(2.5, colorIndexA));
    vec3 panelB = mix(mix(mix(darkPanel, u_mid, step(0.5, colorIndexB)), u_light, step(1.5, colorIndexB)), u_accent, step(2.5, colorIndexB));
    vec3 panel = mix(panelA, panelB, fade);
    panel *= mix(0.95 + tone * 0.10, 0.90 + tone * 0.20, u_velocity);
    float streakHash = hash21(vec2(isSide ? 1.0 : 0.0, transCell) + 19.8);
    vec3 streakColor = mix(u_light, u_accent, step(0.45, streakHash));
    streakColor = mix(streakColor, u_mid, step(0.85, streakHash));
    panel = mix(panel, streakColor, u_terminalVelocity);
    vec3 color = mix(u_base, panel, tileMask);
    color = mix(color, u_accent, u_pulse * tileMask * step(0.75, tone) * 0.22 * u_speedPulseMask);
    return mix(color, u_light, u_brake * tileMask * 0.08);
  }

  vec3 shadeTunnel(vec2 uvNorm) {
    float absX = abs(uvNorm.x);
    float absY = abs(uvNorm.y);
    float majorAxis = max(max(absX, absY), 0.0001);
    float depth = (1.0 / majorAxis) - 1.0;
    bool isSide = absX >= absY;
    vec2 gridPos;
    if (isSide) {
      // Every wall shares one exact longitudinal origin. The prior side-wall
      // aspect offset shifted its depth cuts away from the top/bottom cuts,
      // so the four perspective seams no longer met cleanly at the corners.
      gridPos = vec2(sign(uvNorm.x) * (3.5 + depth - u_flow), uvNorm.y * 3.5 / absX);
    } else {
      gridPos = vec2(uvNorm.x * u_aspect * 3.5 / absY, sign(uvNorm.y) * (3.5 + depth - u_flow));
    }
    vec3 color = shadeGrid(gridPos, isSide);
    float edge = smoothstep(1.25, 0.40, max(absX * 0.75, absY));
    color *= mix(1.0, 0.75 + edge * 0.35, u_velocity);
    float terminusVoid = smoothstep(0.12, 0.17, majorAxis);
    return color * mix(1.0, terminusVoid, u_voidActive);
  }

  void main() {
    vec2 uv_norm = v_uv * 2.0 - 1.0;
    // OPEN widens the tiled aperture in its own perspective language, while
    // UNDERWATER presses the corridor inward instead of adding an overlay.
    uv_norm.x *= 1.0 - u_pulse * 0.045;
    uv_norm *= 1.0 + u_brake * 0.035;

    bool insideWall = max(abs(uv_norm.x), abs(uv_norm.y)) <= u_wallSize;
    if (insideWall && u_wallOpacity > 0.995) {
      vec2 wallGrid = vec2(uv_norm.x * u_aspect, uv_norm.y) * (3.5 / u_wallSize);
      outColor = vec4(shadeGrid(wallGrid, false), 1.0);
      return;
    }
    vec3 color = shadeTunnel(uv_norm);
    if (insideWall && u_wallOpacity > 0.001) {
      vec2 wallGrid = vec2(uv_norm.x * u_aspect, uv_norm.y) * (3.5 / u_wallSize);
      color = mix(color, shadeGrid(wallGrid, false), u_wallOpacity);
    }
    float radius = length(vec2(uv_norm.x * 0.72, uv_norm.y));
    float bloomRing = exp(-abs(radius - 0.46) * 20.0) * u_bloom;
    color = mix(color, u_light, bloomRing * 0.34);
    color = mix(color, u_base, u_brake * 0.16);
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

function drawCanvasFallback(context, canvas, energy, visualVelocity, speedKmh, palette, flow, effect) {
  const ratio = aperturePixelRatio(window.devicePixelRatio, speedKmh);
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

  if (effect === "UNDERWATER") {
    context.fillStyle = cssColor(palette.base, 0.16);
    context.fillRect(0, 0, width, height);
  } else if (effect === "BLOOM") {
    const radius = Math.min(width, height) * 0.23;
    context.beginPath();
    context.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    context.strokeStyle = cssColor(palette.light, 0.36);
    context.lineWidth = Math.max(2, height * 0.01);
    context.stroke();
  }
}

function startCanvasFallback(
  canvas,
  valuesRef,
  reducedMotion,
  onRenderer,
  onFrame,
  onRuntimeError,
) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    onRenderer("Aperture unavailable");
    onRuntimeError?.(new Error("APERTURE Canvas2D context is unavailable"));
    return undefined;
  }
  let animationFrame = 0;
  let stopped = false;
  let flow = 0;
  let visualEnergy = reducedMotion ? Math.min(valuesRef.current.energy, 0.28) : valuesRef.current.energy;
  let visualVelocity = speedToVisualVelocity(
    reducedMotion ? Math.min(valuesRef.current.speed, 20) : valuesRef.current.speed,
  );
  let visualWallSpeed = reducedMotion
    ? Math.min(valuesRef.current.speed, 20)
    : valuesRef.current.speed;
  let lastFrameAt = performance.now();
  let lastDrawAt = 0;
  onRenderer("Canvas2D · Aperture");

  const fail = (error) => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(animationFrame);
    onRenderer("Aperture unavailable");
    onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
  };

  const render = (now) => {
    if (stopped) return;
    try {
      if (now - lastDrawAt >= 1000 / 30) {
        const deltaSeconds = Math.min(0.05, Math.max(0, (now - lastFrameAt) / 1000));
        lastFrameAt = now;
        lastDrawAt = now;
        const nextEnergy = reducedMotion ? Math.min(valuesRef.current.energy, 0.28) : valuesRef.current.energy;
        visualEnergy += (nextEnergy - visualEnergy) * (nextEnergy >= visualEnergy ? 0.12 : 0.065);
        const nextVelocity = speedToVisualVelocity(
          reducedMotion ? Math.min(valuesRef.current.speed, 20) : valuesRef.current.speed,
        );
        visualVelocity += (nextVelocity - visualVelocity) * (nextVelocity >= visualVelocity ? 0.14 : 0.12);
        const nextWallSpeed = reducedMotion
          ? Math.min(valuesRef.current.speed, 20)
          : valuesRef.current.speed;
        visualWallSpeed += (nextWallSpeed - visualWallSpeed) * apertureSmoothing(
          nextWallSpeed >= visualWallSpeed ? 0.22 : 0.16,
          deltaSeconds,
        );
        if (!reducedMotion) flow += deltaSeconds * energyToFlowRate(visualEnergy, valuesRef.current.speed);
        drawCanvasFallback(
          context,
          canvas,
          visualEnergy,
          visualVelocity,
          visualWallSpeed,
          valuesRef.current.theme.palette,
          flow,
          valuesRef.current.effect,
        );
        onFrame(now, 1000 / 30, "Canvas2D", canvas.width, canvas.height);
      }
      animationFrame = requestAnimationFrame(render);
    } catch (error) {
      fail(error);
    }
  };
  animationFrame = requestAnimationFrame(render);
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
  };
}

export function FluxField({
  energy,
  speed,
  theme,
  reducedMotion,
  pulse,
  brake,
  effect,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const canvasRef = useRef(null);
  const valuesRef = useRef({ energy, speed, theme, pulse, brake, effect });
  valuesRef.current = { energy, speed, theme, pulse, brake, effect };

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
    if (!gl) {
      return startCanvasFallback(
        canvas,
        valuesRef,
        reducedMotion,
        onRenderer,
        onFrame,
        onRuntimeError,
      );
    }

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
      onRenderer("Aperture unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
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
      velocity: gl.getUniformLocation(program, "u_velocity"),
      wallSize: gl.getUniformLocation(program, "u_wallSize"),
      wallOpacity: gl.getUniformLocation(program, "u_wallOpacity"),
      terminalVelocity: gl.getUniformLocation(program, "u_terminalVelocity"),
      speedPulseMask: gl.getUniformLocation(program, "u_speedPulseMask"),
      voidActive: gl.getUniformLocation(program, "u_voidActive"),
      flow: gl.getUniformLocation(program, "u_flow"),
      pulse: gl.getUniformLocation(program, "u_pulse"),
      brake: gl.getUniformLocation(program, "u_brake"),
      bloom: gl.getUniformLocation(program, "u_bloom"),
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
    let visualWallSpeed = reducedMotion ? Math.min(speed, 20) : speed;
    let lastFrameAt = performance.now();
    let canvasCssWidth = Math.max(1, canvas.clientWidth);
    let canvasCssHeight = Math.max(1, canvas.clientHeight);
    const updateCanvasSize = () => {
      canvasCssWidth = Math.max(1, canvas.clientWidth);
      canvasCssHeight = Math.max(1, canvas.clientHeight);
    };
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateCanvasSize);
    resizeObserver?.observe(canvas);
    if (!resizeObserver) window.addEventListener("resize", updateCanvasSize);
    onRenderer("WebGL2 · Aperture");

    const fail = (error) => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(animationFrame);
      onRenderer("Aperture unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
    };

    const render = (now) => {
      if (stopped) return;
      try {
        const deltaSeconds = Math.min(0.05, Math.max(0, (now - lastFrameAt) / 1000));
        lastFrameAt = now;

        const currentSpeed = valuesRef.current.speed;
        const nextEnergy = reducedMotion ? Math.min(valuesRef.current.energy, 0.28) : valuesRef.current.energy;
        const smoothing = apertureSmoothing(nextEnergy >= visualEnergy ? 0.12 : 0.065, deltaSeconds);
        visualEnergy += (nextEnergy - visualEnergy) * smoothing;
        const nextVelocity = speedToVisualVelocity(
          reducedMotion ? Math.min(currentSpeed, 20) : currentSpeed,
        );
        const velocitySmoothing = apertureSmoothing(
          nextVelocity >= visualVelocity ? 0.14 : 0.12,
          deltaSeconds,
        );
        visualVelocity += (nextVelocity - visualVelocity) * velocitySmoothing;
        const nextWallSpeed = reducedMotion ? Math.min(currentSpeed, 20) : currentSpeed;
        const wallSmoothing = apertureSmoothing(
          nextWallSpeed >= visualWallSpeed ? 0.22 : 0.16,
          deltaSeconds,
        );
        visualWallSpeed += (nextWallSpeed - visualWallSpeed) * wallSmoothing;
        if (!reducedMotion) flow += deltaSeconds * energyToFlowRate(visualEnergy, currentSpeed);

        if (currentSpeed < REST_RECOLOUR_SPEED_KMH) restSeconds += deltaSeconds;

        const ratio = aperturePixelRatio(window.devicePixelRatio, visualWallSpeed);
        const width = Math.max(1, Math.floor(canvasCssWidth * ratio));
        const height = Math.max(1, Math.floor(canvasCssHeight * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }

        const { palette } = valuesRef.current.theme;
        const shaderControls = apertureShaderControls(
          visualWallSpeed,
        );

        gl.useProgram(program);
        gl.uniform1f(uniforms.aspect, width / height);
        gl.uniform1f(uniforms.velocity, visualVelocity);
        gl.uniform1f(uniforms.wallSize, shaderControls.wallSize);
        gl.uniform1f(uniforms.wallOpacity, shaderControls.wallOpacity);
        gl.uniform1f(uniforms.terminalVelocity, shaderControls.terminalVelocity);
        gl.uniform1f(uniforms.speedPulseMask, shaderControls.speedPulseMask);
        gl.uniform1f(uniforms.voidActive, shaderControls.voidActive);
        gl.uniform1f(uniforms.flow, flow);
        gl.uniform1f(uniforms.pulse, valuesRef.current.pulse);
        gl.uniform1f(uniforms.brake, valuesRef.current.brake);
        gl.uniform1f(uniforms.bloom, valuesRef.current.effect === "BLOOM" ? 1 : 0);
        gl.uniform1f(uniforms.restRecolour, restSeconds);
        gl.uniform3fv(uniforms.base, palette.base);
        gl.uniform3fv(uniforms.mid, palette.mid);
        gl.uniform3fv(uniforms.light, palette.light);
        gl.uniform3fv(uniforms.accent, palette.accent);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        onFrame(now, 1000 / 60, "WebGL2", width, height);
        animationFrame = requestAnimationFrame(render);
      } catch (error) {
        fail(error);
      }
    };

    const onContextLost = (event) => {
      event.preventDefault();
      fail(new Error("APERTURE WebGL2 context lost"));
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    animationFrame = requestAnimationFrame(render);

    return () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", updateCanvasSize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [onFrame, onRenderer, onRuntimeError, reducedMotion]);

  return <canvas className="field-canvas" ref={canvasRef} aria-hidden="true" />;
}
