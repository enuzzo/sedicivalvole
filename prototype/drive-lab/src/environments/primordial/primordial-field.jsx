import { useEffect, useRef } from "react";
import { primordialMotionProfile } from "./primordial-model.js";
import { createPrimordialRenderer, primordialWebglAvailable } from "./primordial-renderer.js";
import {
  sourceMix,
  sourceRgb,
  sourceSurfaceSize,
  startSourceCanvasLoop,
} from "../source-field-utils.js";

function renderFallback({ context, width, height, deltaSeconds, state, values }) {
  const profile = primordialMotionProfile({
    speedKmh: values.speed,
    musicLevel: values.musicLevel,
    bpm: values.bpm,
    effect: values.effect,
    reducedMotion: values.reducedMotion,
    settings: values.settings,
  });
  state.time += deltaSeconds * profile.flowRate;
  state.colorTime += deltaSeconds * profile.colorRate;
  const palette = values.theme.palette;
  const columns = 72;
  const rows = 52;
  const cellWidth = width / columns + 1;
  const cellHeight = height / rows + 1;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column / columns * 2 - 1 + values.pointer.x * 0.08;
      const y = row / rows * 2 - 1 - values.pointer.y * 0.08;
      const radius = Math.hypot(x, y);
      const flow = Math.sin(x * 7 + Math.sin(y * 5 + state.time) * profile.warp)
        + Math.cos(y * 8 - Math.cos(x * 4 - state.time * 0.8) * profile.warp)
        + Math.sin((x + y) * 5 + state.colorTime);
      const contour = 0.5 + 0.5 * Math.sin(flow * 1.8 + radius * profile.convergence * 9);
      const dark = sourceMix(palette.base, palette.mid, contour * 0.68);
      const vivid = contour > 0.63
        ? sourceMix(dark, palette.accent, (contour - 0.63) * 1.8)
        : sourceMix(dark, palette.secondary, (0.63 - contour) * 0.42);
      context.fillStyle = sourceRgb(vivid);
      context.fillRect(column * cellWidth, row * cellHeight, cellWidth + 1, cellHeight + 1);
    }
  }
}

export function PrimordialField({
  speed,
  musicLevel,
  bpm,
  theme,
  effect,
  reducedMotion,
  settings,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const valuesRef = useRef({
    speed,
    musicLevel,
    bpm,
    theme,
    effect,
    reducedMotion,
    settings,
    pointer: pointerRef.current,
  });
  valuesRef.current = {
    speed,
    musicLevel,
    bpm,
    theme,
    effect,
    reducedMotion,
    settings,
    pointer: pointerRef.current,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!primordialWebglAvailable()) {
      return startSourceCanvasLoop({
        canvas,
        valuesRef,
        label: "Primordial fluid field fallback",
        createState: () => ({ time: 0, colorTime: 0 }),
        render: renderFallback,
        onRenderer,
        onFrame,
        onRuntimeError,
      });
    }

    let renderer;
    try {
      renderer = createPrimordialRenderer(canvas, valuesRef.current.theme.palette);
      if (!renderer) throw new Error("PRIMORDIAL WebGL2 context is unavailable");
    } catch (error) {
      onRenderer("Primordial unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
      return undefined;
    }

    rendererRef.current = renderer;
    let animationFrame = 0;
    let stopped = false;
    let lastFrameAt = performance.now();
    onRenderer(renderer.label);

    const fail = (error) => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(animationFrame);
      onRenderer("Primordial unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
    };
    const frame = (now) => {
      if (stopped) return;
      try {
        const deltaSeconds = Math.max(0, Math.min((now - lastFrameAt) / 1000, 0.1));
        lastFrameAt = now;
        const { width, height } = sourceSurfaceSize(canvas);
        if (canvas.width !== width || canvas.height !== height) renderer.resize(width, height);
        const profile = primordialMotionProfile({
          speedKmh: valuesRef.current.speed,
          musicLevel: valuesRef.current.musicLevel,
          bpm: valuesRef.current.bpm,
          effect: valuesRef.current.effect,
          reducedMotion: valuesRef.current.reducedMotion,
          settings: valuesRef.current.settings,
        });
        renderer.render({
          profile,
          pointer: valuesRef.current.pointer,
          musicLevel: Math.min(1, Math.max(0, Number(valuesRef.current.musicLevel) || 0)),
          effect: valuesRef.current.effect,
          deltaSeconds,
        });
        onFrame(now, 1000 / 60, "WebGL2", width, height);
        animationFrame = requestAnimationFrame(frame);
      } catch (error) {
        fail(error);
      }
    };
    const onContextLost = (event) => {
      event.preventDefault();
      fail(new Error("PRIMORDIAL WebGL2 context lost"));
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    animationFrame = requestAnimationFrame(frame);
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

  const updatePointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerRef.current.x = Math.min(
      1,
      Math.max(-1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1),
    );
    pointerRef.current.y = Math.min(
      1,
      Math.max(-1, 1 - ((event.clientY - bounds.top) / bounds.height) * 2),
    );
  };
  const releasePointer = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
  };

  return (
    <canvas
      className="field-canvas primordial-field-canvas"
      ref={canvasRef}
      aria-hidden="true"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        updatePointer(event);
      }}
      onPointerMove={updatePointer}
      onPointerUp={releasePointer}
      onPointerCancel={releasePointer}
      onPointerLeave={(event) => {
        if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) releasePointer(event);
      }}
    />
  );
}
