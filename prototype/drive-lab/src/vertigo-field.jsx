import { useEffect, useRef } from "react";
import { energyToFlowRate, speedToVisualVelocity } from "./signal-model.js";

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
  uniform vec3 u_base;
  uniform vec3 u_mid;
  uniform vec3 u_light;
  uniform vec3 u_accent;
  uniform vec3 u_secondary;

  in vec2 v_uv;
  out vec4 outColor;

  float hash11(float value) {
    return fract(sin(value * 127.1) * 43758.5453);
  }

  float band(float coordinate, float width) {
    float distanceToCenter = abs(fract(coordinate) - 0.5);
    float antialias = max(fwidth(coordinate) * 0.85, 0.004);
    return 1.0 - smoothstep(width, width + antialias, distanceToCenter);
  }

  void main() {
    vec2 point = v_uv * 2.0 - 1.0;
    point.x *= u_aspect * 0.77;

    float energy = smoothstep(0.015, 0.97, u_energy);
    float velocity = smoothstep(0.04, 0.98, u_velocity);
    float fold = pow(smoothstep(0.08, 0.92, energy), 1.22);
    float time = u_flow * 0.22;

    float baseHorizon = mix(0.72, 0.08, fold);
    float preliminaryFloorDepth = clamp((baseHorizon - point.y) / (baseHorizon + 1.0), 0.0, 1.0);
    float preliminaryWallDepth = clamp((point.y - baseHorizon) / max(1.0 - baseHorizon, 0.001), 0.0, 1.0);
    float preliminaryProgress = mix(-preliminaryFloorDepth, preliminaryWallDepth, step(baseHorizon, point.y));

    float lateralWave = fold * (
      sin(preliminaryProgress * 4.7 + time * 0.72) * 0.052
      + sin(preliminaryProgress * 9.4 - time * 0.31) * 0.016
    );
    point.x -= lateralWave;

    float bendWave = fold * (
      sin(point.x * 7.0 + time * 0.28) * 0.026
      + sin(point.x * 13.0 - time * 0.18) * 0.009
    );
    float horizon = baseHorizon + bendWave;
    float wallBlend = smoothstep(horizon - 0.045, horizon + 0.045, point.y);
    float floorDepth = clamp((horizon - point.y) / (horizon + 1.0), 0.0, 1.0);
    float wallDepth = clamp((point.y - horizon) / max(1.0 - horizon, 0.001), 0.0, 1.0);

    float flatSpread = 1.22;
    float perspectiveSpread = mix(0.105, 1.52, pow(floorDepth, 0.72));
    float perspectiveAmount = mix(0.28, 1.0, fold);
    float floorSpread = mix(flatSpread, perspectiveSpread, perspectiveAmount);
    float uprightSpread = mix(flatSpread, 0.14 + wallDepth * 0.055, fold);
    float spread = mix(floorSpread, uprightSpread, wallBlend);
    float laneCoordinate = point.x / max(spread, 0.025);
    float roadCoordinate = abs(laneCoordinate);

    float roadMask = smoothstep(0.105, 0.145, roadCoordinate)
      * (1.0 - smoothstep(0.92, 0.99, roadCoordinate));
    float laneScale = mix(8.5, 11.5, fold);
    float stripeCoordinate = (roadCoordinate - 0.115) * laneScale;
    float laneIndex = floor(stripeCoordinate);
    float laneNoise = hash11(laneIndex + step(0.0, laneCoordinate) * 19.0);
    float lineWidth = mix(0.13, mix(0.048, 0.115, laneNoise), fold);
    lineWidth *= mix(0.82, 1.72, pow(floorDepth, 0.8));
    lineWidth = min(lineWidth, 0.28);
    float line = band(stripeCoordinate, lineWidth);
    float glow = band(stripeCoordinate, min(0.34, lineWidth + mix(0.13, 0.085, fold)));
    float halo = band(stripeCoordinate, min(0.46, lineWidth + mix(0.21, 0.13, fold)));

    float longitudinal = mix(1.0 - floorDepth, 1.0 + wallDepth, wallBlend);
    float travel = longitudinal * mix(3.2, 8.8, velocity)
      - u_flow * mix(0.08, 0.64, velocity)
      + laneNoise * 4.0;
    float travelPhase = fract(travel);
    float segment = smoothstep(0.035, 0.16, travelPhase)
      * (1.0 - smoothstep(mix(0.56, 0.84, velocity), 0.98, travelPhase));
    float continuity = mix(0.58, 0.88, fold);
    float trail = mix(continuity, 1.0, segment);

    vec3 leftColor = mix(u_mid, u_accent, 0.92);
    vec3 rightColor = mix(u_secondary, u_light, step(0.72, laneNoise) * 0.58);
    vec3 trailColor = laneCoordinate < 0.0 ? leftColor : rightColor;
    float idleBreath = 0.9 + 0.1 * sin(time * 0.52 + laneNoise * 6.2831853);
    trailColor *= (0.66 + laneNoise * 1.08) * idleBreath;

    float surfaceGrid = band((roadCoordinate - 0.1) * 17.0, 0.025) * roadMask;
    float depthGrid = band(longitudinal * 14.0 - u_flow * 0.075, 0.018) * roadMask;
    vec3 surface = mix(u_base, u_mid, 0.16 + surfaceGrid * 0.08 + depthGrid * 0.055);
    float unfoldedMask = 1.0 - smoothstep(horizon - 0.025, horizon + 0.035, point.y);
    float fieldMask = mix(unfoldedMask, 1.0, smoothstep(0.05, 0.32, fold));
    vec3 color = mix(u_base, surface, fieldMask);
    color += trailColor * halo * roadMask * trail * mix(0.13, 0.38, velocity) * fieldMask;
    color += trailColor * glow * roadMask * trail * mix(0.26, 0.62, velocity) * fieldMask;
    color += trailColor * line * roadMask * trail * mix(0.72, 1.28, velocity) * fieldMask;

    float centerVoid = 1.0 - smoothstep(0.075, 0.135, roadCoordinate);
    color = mix(color, u_base * 0.16, centerVoid * (0.62 + fold * 0.38));
    float sideFade = 1.0 - smoothstep(0.86, 1.34, abs(point.x));
    float topFade = mix(1.0, smoothstep(1.05, 0.30, point.y), fold * 0.12);
    color *= 0.72 + sideFade * 0.34;
    color *= topFade;
    color = mix(color, u_light, u_pulse * line * roadMask * 0.16);
    color = mix(color, u_light, u_brake * (0.025 + depthGrid * 0.055));

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

function mixColor(from, to, amount) {
  return from.map((value, index) => value + (to[index] - value) * amount);
}

function drawCanvasFallback(context, canvas, energy, velocity, palette, flow) {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
  const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
  const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  context.fillStyle = cssColor(palette.base);
  context.fillRect(0, 0, width, height);
  const fold = Math.pow(Math.max(0, Math.min(1, energy)), 1.22);
  const horizon = height * (0.14 + fold * 0.32);
  const lateral = Math.sin(flow * 0.16) * width * 0.025 * fold;
  const secondary = palette.secondary ?? mixColor(palette.light, palette.accent, 0.28);

  context.lineCap = "round";
  for (let side = -1; side <= 1; side += 2) {
    for (let lane = 0; lane < 8; lane += 1) {
      const laneAmount = (lane + 1.1) / 9.4;
      const startX = width / 2 + side * width * (0.075 + laneAmount * 0.52);
      const bendX = width / 2 + lateral + side * width * (0.025 + laneAmount * 0.055 * fold);
      const endX = width / 2 + lateral * 0.7 + side * width * (0.025 + laneAmount * 0.065 * fold);
      const wave = Math.sin(flow * 0.12 + lane * 0.72 + side) * width * 0.018 * fold;
      context.beginPath();
      context.moveTo(startX, height + 8);
      context.bezierCurveTo(
        startX * 0.78 + bendX * 0.22 + wave,
        height * 0.55,
        bendX - wave * 0.35,
        horizon + height * 0.09,
        bendX,
        horizon,
      );
      if (fold > 0.02) {
        context.bezierCurveTo(
          bendX + wave,
          horizon * 0.72,
          endX - wave * 0.4,
          height * 0.08,
          endX,
          -8,
        );
      }
      const baseColor = side < 0 ? palette.accent : secondary;
      const color = lane % 4 === 0 && side > 0 ? palette.light : baseColor;
      context.strokeStyle = cssColor(color, 0.78 + (lane % 3) * 0.08);
      context.lineWidth = Math.max(1, ratio * (1.2 + velocity * 1.8 + (lane % 3) * 0.35));
      context.setLineDash([height * (0.18 + velocity * 0.32), height * (0.07 + (1 - velocity) * 0.12)]);
      context.lineDashOffset = flow * height * 0.055;
      context.stroke();
    }
  }
  context.setLineDash([]);
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
  onRenderer("Canvas2D · Vertigo");

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
    drawCanvasFallback(context, canvas, visualEnergy, visualVelocity, valuesRef.current.theme.palette, flow);
    onFrame(now, 1000 / 30, "Canvas2D", canvas.width, canvas.height);
  };
  animationFrame = requestAnimationFrame(render);
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
  };
}

export function VertigoField({ energy, speed, theme, reducedMotion, pulse, brake, onRenderer, onFrame }) {
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
      console.warn("[VertigoField] WebGL2 shader setup failed", error);
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
      base: gl.getUniformLocation(program, "u_base"),
      mid: gl.getUniformLocation(program, "u_mid"),
      light: gl.getUniformLocation(program, "u_light"),
      accent: gl.getUniformLocation(program, "u_accent"),
      secondary: gl.getUniformLocation(program, "u_secondary"),
    };

    let animationFrame = 0;
    let stopped = false;
    let flow = 0;
    let visualEnergy = reducedMotion ? Math.min(energy, 0.28) : energy;
    let visualVelocity = speedToVisualVelocity(reducedMotion ? Math.min(speed, 20) : speed);
    let lastFrameAt = performance.now();
    let lastDrawAt = 0;
    onRenderer("WebGL2 · Vertigo");

    const render = (now) => {
      if (stopped) return;
      animationFrame = requestAnimationFrame(render);
      if (now - lastDrawAt < 1000 / 45) return;
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

      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const { palette } = valuesRef.current.theme;
      const secondary = palette.secondary ?? palette.light;
      gl.useProgram(program);
      gl.uniform1f(uniforms.aspect, width / height);
      gl.uniform1f(uniforms.energy, visualEnergy);
      gl.uniform1f(uniforms.velocity, visualVelocity);
      gl.uniform1f(uniforms.flow, flow);
      gl.uniform1f(uniforms.pulse, valuesRef.current.pulse);
      gl.uniform1f(uniforms.brake, valuesRef.current.brake);
      gl.uniform3fv(uniforms.base, palette.base);
      gl.uniform3fv(uniforms.mid, palette.mid);
      gl.uniform3fv(uniforms.light, palette.light);
      gl.uniform3fv(uniforms.accent, palette.accent);
      gl.uniform3fv(uniforms.secondary, secondary);
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
