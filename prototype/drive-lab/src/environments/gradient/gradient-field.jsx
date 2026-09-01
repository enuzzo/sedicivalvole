import { useEffect, useRef } from "react";
import { createGradientRenderer, gradientWebglAvailable } from "./gradient-renderer.js";

const MAX_GRADIENT_PIXEL_RATIO = 1;

function surfaceSize(canvas) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_GRADIENT_PIXEL_RATIO);
  return {
    width: Math.max(1, Math.floor(canvas.clientWidth * pixelRatio)),
    height: Math.max(1, Math.floor(canvas.clientHeight * pixelRatio)),
  };
}

const toCss = (channels, alpha = 1) => `rgba(${channels
  .map((channel) => Math.round(Math.min(1, Math.max(0, channel)) * 255))
  .join(",")},${alpha})`;

function startCanvasFallback(canvas, valuesRef, onRenderer, onFrame, onRuntimeError) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    onRenderer("Gradient unavailable");
    onRuntimeError?.(new Error("GRADIENT Canvas2D context is unavailable"));
    return undefined;
  }
  let animationFrame = 0;
  let stopped = false;
  let lastFrameAt = 0;
  onRenderer("Canvas2D · Gradient static field");

  const render = (now) => {
    if (stopped) return;
    if (now - lastFrameAt >= 1000 / 20) {
      lastFrameAt = now;
      const { width, height } = surfaceSize(canvas);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const { palette, speed } = valuesRef.current;
      const energy = Math.min(1, Math.max(0, speed / 130));
      context.fillStyle = toCss(palette.base);
      context.fillRect(0, 0, width, height);
      const field = context.createRadialGradient(
        width * (0.42 + energy * 0.08), height * 0.56, width * 0.04,
        width * 0.5, height * 0.56, width * (0.72 - energy * 0.12),
      );
      field.addColorStop(0, toCss(palette.base));
      field.addColorStop(0.36, toCss(palette.accent));
      field.addColorStop(0.72, toCss(palette.secondary));
      field.addColorStop(1, toCss(palette.base));
      context.fillStyle = field;
      context.fillRect(0, 0, width, height);
      onFrame(now, 1000 / 20, "Canvas2D", width, height);
    }
    animationFrame = requestAnimationFrame(render);
  };
  animationFrame = requestAnimationFrame(render);
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
  };
}

export function GradientField({
  speed,
  audioLevel = 0,
  musicMode = "play-road",
  theme,
  reducedMotion,
  effect,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const callbacksRef = useRef({ onRenderer, onFrame, onRuntimeError });
  callbacksRef.current = { onRenderer, onFrame, onRuntimeError };
  const valuesRef = useRef({ speed, audioLevel, musicMode, theme, reducedMotion, effect });
  valuesRef.current = { speed, audioLevel, musicMode, theme, reducedMotion, effect };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (!gradientWebglAvailable()) {
      return startCanvasFallback(
        canvas,
        valuesRef,
        callbacksRef.current.onRenderer,
        callbacksRef.current.onFrame,
        callbacksRef.current.onRuntimeError,
      );
    }

    let renderer;
    try {
      renderer = createGradientRenderer(canvas, valuesRef.current.theme.palette);
      if (!renderer) throw new Error("GRADIENT WebGL2 renderer is unavailable");
    } catch (error) {
      callbacksRef.current.onRenderer("Gradient unavailable");
      callbacksRef.current.onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
      return undefined;
    }
    rendererRef.current = renderer;
    callbacksRef.current.onRenderer(renderer.label);
    let animationFrame = 0;
    let stopped = false;
    let lastFrameAt = performance.now();

    const fail = (error) => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(animationFrame);
      callbacksRef.current.onRenderer("Gradient unavailable");
      callbacksRef.current.onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
    };
    const render = (now) => {
      if (stopped) return;
      try {
        const deltaSeconds = Math.max(0, Math.min((now - lastFrameAt) / 1000, 0.1));
        lastFrameAt = now;
        const { width, height } = surfaceSize(canvas);
        if (canvas.width !== width || canvas.height !== height) renderer.resize(width, height);
        const current = valuesRef.current;
        renderer.render({
          speedKmh: current.speed,
          audioLevel: current.audioLevel,
          musicMode: current.musicMode,
          effect: current.effect,
          reducedMotion: current.reducedMotion,
          deltaSeconds,
        });
        callbacksRef.current.onFrame(now, 1000 / 60, "WebGL2", width, height);
        animationFrame = requestAnimationFrame(render);
      } catch (error) {
        fail(error);
      }
    };
    const onContextLost = (event) => {
      event.preventDefault();
      fail(new Error("GRADIENT WebGL2 context lost"));
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    animationFrame = requestAnimationFrame(render);
    return () => {
      stopped = true;
      rendererRef.current = null;
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.setPalette(theme.palette);
  }, [theme]);

  return <canvas className="field-canvas gradient-field" ref={canvasRef} aria-hidden="true" />;
}
