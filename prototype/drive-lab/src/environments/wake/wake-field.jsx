import { useEffect, useRef } from "react";
import {
  catmullRomPoint,
  WAKE_RIBBONS,
  wakeMotionProfile,
  wakeRibbonMotion,
  wakeToneColor,
} from "./wake-model.js";
import { createWakeRenderer, wakeWebglAvailable } from "./wake-renderer.js";

const MAX_PIXEL_RATIO = 1.35;

function surfaceSize(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  return {
    width: Math.max(1, Math.floor(canvas.clientWidth * ratio)),
    height: Math.max(1, Math.floor(canvas.clientHeight * ratio)),
  };
}

function cssColor(color) {
  return `rgb(${color.map((value) => Math.round(Math.min(1, Math.max(0, value)) * 255)).join(" ")})`;
}

function startCanvasFallback(canvas, valuesRef, onRenderer, onFrame, onRuntimeError) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    onRenderer("Wake unavailable");
    onRuntimeError?.(new Error("WAKE Canvas2D context is unavailable"));
    return undefined;
  }
  let animationFrame = 0;
  let stopped = false;
  let lastFrameAt = performance.now();
  let time = 0;
  let travel = 0;
  onRenderer("Canvas2D · Wake ribbons");
  const render = (now) => {
    if (stopped) return;
    try {
      const { width, height } = surfaceSize(canvas);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.fillStyle = "#010101";
      context.fillRect(0, 0, width, height);
      const profile = wakeMotionProfile(
        valuesRef.current.speed,
        valuesRef.current.effect,
        valuesRef.current.reducedMotion,
      );
      const elapsed = Math.max(0, Math.min((now - lastFrameAt) / 1000, 0.1));
      lastFrameAt = now;
      time += profile.timeRate * elapsed;
      travel = (travel + profile.streamRate * elapsed) % 1;
      for (const ribbon of WAKE_RIBBONS) {
        context.beginPath();
        for (let segment = 0; segment <= 48; segment += 1) {
          const progress = segment / 48;
          const motion = wakeRibbonMotion(ribbon, progress, time, profile, travel);
          const point = catmullRomPoint(ribbon.points, Math.min(1, Math.max(0, progress + motion.along)));
          const x = (point[0] + motion.x) * 0.5 + 0.5;
          const y = 0.5 - (point[1] + motion.y) * 0.5;
          if (segment === 0) context.moveTo(x * width, y * height);
          else context.lineTo(x * width, y * height);
        }
        context.lineCap = "round";
        context.lineJoin = "round";
        const middleMotion = wakeRibbonMotion(ribbon, 0.5, time, profile, travel);
        context.lineWidth = (ribbon.widthStart + ribbon.widthEnd) * 0.5
          * profile.widthScale * middleMotion.widthScale * height;
        context.strokeStyle = cssColor(wakeToneColor(valuesRef.current.theme.palette, ribbon.tone));
        context.shadowColor = context.strokeStyle;
        context.shadowBlur = valuesRef.current.effect === "BLOOM" ? 18 : 5;
        context.globalAlpha = valuesRef.current.effect === "UNDERWATER" ? 0.72 : 0.96;
        context.stroke();
      }
      context.globalAlpha = 1;
      context.shadowBlur = 0;
      onFrame(now, 1000 / 30, "Canvas2D", width, height);
      animationFrame = requestAnimationFrame(render);
    } catch (error) {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      onRenderer("Wake unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };
  animationFrame = requestAnimationFrame(render);
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
  };
}

export function WakeField({
  speed,
  theme,
  effect,
  reducedMotion,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const valuesRef = useRef({ speed, theme, effect, reducedMotion });
  valuesRef.current = { speed, theme, effect, reducedMotion };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (!wakeWebglAvailable()) {
      return startCanvasFallback(canvas, valuesRef, onRenderer, onFrame, onRuntimeError);
    }
    let renderer;
    try {
      renderer = createWakeRenderer(canvas, valuesRef.current.theme.palette);
      if (!renderer) throw new Error("WAKE WebGL2 context is unavailable");
    } catch (error) {
      onRenderer("Wake unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
      return undefined;
    }
    rendererRef.current = renderer;
    let animationFrame = 0;
    let stopped = false;
    let lastFrameAt = performance.now();
    onRenderer(renderer.label);
    const render = (now) => {
      if (stopped) return;
      try {
        const elapsed = Math.max(0, Math.min((now - lastFrameAt) / 1000, 0.1));
        lastFrameAt = now;
        const { width, height } = surfaceSize(canvas);
        if (canvas.width !== width || canvas.height !== height) renderer.resize(width, height);
        renderer.render({
          speedKmh: valuesRef.current.speed,
          effect: valuesRef.current.effect,
          reducedMotion: valuesRef.current.reducedMotion,
          deltaSeconds: elapsed,
        });
        onFrame(now, 1000 / 60, "WebGL2", width, height);
        animationFrame = requestAnimationFrame(render);
      } catch (error) {
        stopped = true;
        cancelAnimationFrame(animationFrame);
        onRenderer("Wake unavailable");
        onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };
    const onContextLost = (event) => {
      event.preventDefault();
      stopped = true;
      cancelAnimationFrame(animationFrame);
      onRenderer("Wake unavailable");
      onRuntimeError?.(new Error("WAKE WebGL2 context lost"));
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
  }, [onFrame, onRenderer, onRuntimeError]);

  useEffect(() => {
    rendererRef.current?.setPalette(theme.palette);
  }, [theme]);

  return <canvas className="field-canvas" ref={canvasRef} aria-hidden="true" />;
}
