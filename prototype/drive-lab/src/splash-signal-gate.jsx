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
  uniform float u_time;

  in vec2 v_uv;
  out vec4 outColor;

  void main() {
    vec2 point = v_uv * 2.0 - 1.0;
    point.x *= u_aspect;

    vec3 color = vec3(0.008, 0.010, 0.010);
    float bend = 1.0 - smoothstep(0.0, 0.58, v_uv.y);
    float lowerReach = pow(bend, 1.48);
    float bendFocus = smoothstep(0.10, 0.46, v_uv.y) * (1.0 - smoothstep(0.56, 0.82, v_uv.y));

    for (int sideIndex = 0; sideIndex < 2; sideIndex += 1) {
      float side = sideIndex == 0 ? -1.0 : 1.0;
      vec3 laneColor = side < 0.0 ? vec3(0.95, 0.035, 0.012) : vec3(0.72, 0.84, 0.96);

      for (int laneIndex = 0; laneIndex < 12; laneIndex += 1) {
        float lane = (float(laneIndex) + 0.5) / 12.0;
        float upperX = side * (0.028 + lane * 0.205);
        float lowerX = side * mix(u_aspect * 0.56, u_aspect * 1.58, lane);
        float wave = sin(u_time * 0.42 + lane * 8.2 + side * 0.9) * 0.008 * bendFocus;
        float laneX = mix(upperX, lowerX, lowerReach) + wave;
        float distanceToLane = abs(point.x - laneX);
        float coreWidth = mix(0.0014, 0.0025, bend);
        float antialias = max(fwidth(distanceToLane) * 1.25, 0.0012);
        float core = 1.0 - smoothstep(coreWidth, coreWidth + antialias, distanceToLane);
        float glow = exp(-distanceToLane * mix(58.0, 32.0, bend));
        float signal = 0.88 + 0.12 * sin(u_time * 0.9 - v_uv.y * 21.0 + lane * 11.0);
        float laneFade = mix(0.62, 1.0, smoothstep(0.0, 0.2, lane));
        color += laneColor * core * signal * laneFade;
        color += laneColor * glow * 0.07 * laneFade;
      }
    }

    float centerSeam = exp(-abs(point.x) * 95.0) * 0.065;
    color += vec3(0.74, 0.82, 0.86) * centerSeam;
    float edgeVignette = smoothstep(1.34, 0.34, abs(point.x) / max(u_aspect, 0.01));
    color *= 0.72 + edgeVignette * 0.28;

    outColor = vec4(color, 1.0);
  }
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Unknown splash shader compilation error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function drawFallback(context, canvas, time) {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
  const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
  const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  context.fillStyle = "#020303";
  context.fillRect(0, 0, width, height);
  context.lineCap = "round";

  for (const side of [-1, 1]) {
    for (let laneIndex = 0; laneIndex < 12; laneIndex += 1) {
      const lane = (laneIndex + 0.5) / 12;
      const upperX = width / 2 + side * width * (0.018 + lane * 0.07);
      const lowerX = width / 2 + side * width * (0.1 + lane * 0.46);
      const wave = Math.sin(time * 0.42 + lane * 8.2 + side * 0.9) * width * 0.004;
      context.beginPath();
      context.moveTo(lowerX, height + 4);
      context.bezierCurveTo(
        lowerX * 0.68 + upperX * 0.32,
        height * 0.59,
        upperX + wave,
        height * 0.51,
        upperX,
        height * 0.35,
      );
      context.lineTo(upperX, -4);
      context.strokeStyle = side < 0
        ? `rgba(242, 24, 8, ${0.66 + lane * 0.3})`
        : `rgba(188, 216, 246, ${0.62 + lane * 0.3})`;
      context.lineWidth = Math.max(1, ratio * (0.78 + lane * 0.42));
      context.shadowColor = side < 0 ? "rgba(242, 24, 8, .42)" : "rgba(188, 216, 246, .4)";
      context.shadowBlur = ratio * 5;
      context.stroke();
    }
  }
  context.shadowBlur = 0;
}

function startCanvasFallback(canvas, activeRef, reducedMotion) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return undefined;
  let animationFrame = 0;
  let stopped = false;
  const startedAt = performance.now();

  const render = (now) => {
    if (stopped) return;
    drawFallback(context, canvas, reducedMotion ? 0 : (now - startedAt) / 1000);
    if (activeRef.current && !reducedMotion) animationFrame = requestAnimationFrame(render);
  };
  animationFrame = requestAnimationFrame(render);
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
  };
}

export function SplashSignalGate({ active, reducedMotion }) {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "high-performance",
    });
    if (!gl) return startCanvasFallback(canvas, activeRef, reducedMotion);

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
        throw new Error(gl.getProgramInfoLog(program) || "Unknown splash shader link error");
      }
    } catch (error) {
      console.warn("[SplashSignalGate] WebGL2 shader setup failed", error);
      return startCanvasFallback(canvas, activeRef, reducedMotion);
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
    const aspectUniform = gl.getUniformLocation(program, "u_aspect");
    const timeUniform = gl.getUniformLocation(program, "u_time");
    const startedAt = performance.now();
    let animationFrame = 0;
    let stopped = false;

    const render = (now) => {
      if (stopped) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.useProgram(program);
      gl.uniform1f(aspectUniform, width / height);
      gl.uniform1f(timeUniform, reducedMotion ? 0 : (now - startedAt) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (activeRef.current && !reducedMotion) animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [reducedMotion]);

  return <canvas className="splash-signal-field" ref={canvasRef} aria-hidden="true" />;
}
