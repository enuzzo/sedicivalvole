import { useEffect, useRef } from "react";
import {
  DEFAULT_PRTCL_SETTINGS,
  normalizePrtclSettings,
} from "./prtcl-model.js";
import { createPrtclRenderer, prtclWebglAvailable } from "./prtcl-renderer.js";

const MAX_PRTCL_PIXEL_RATIO = 1.25;

function surfaceSize(canvas) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PRTCL_PIXEL_RATIO);
  return {
    width: Math.max(1, Math.floor(canvas.clientWidth * pixelRatio)),
    height: Math.max(1, Math.floor(canvas.clientHeight * pixelRatio)),
    pixelRatio,
  };
}

export function PrtclField({
  speed,
  audioLevel = 0,
  theme,
  effect,
  settings = DEFAULT_PRTCL_SETTINGS,
  calibration = null,
  reducedMotion,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const valuesRef = useRef({
    speed,
    audioLevel,
    effect,
    settings: normalizePrtclSettings(settings),
    calibration,
    reducedMotion,
  });
  valuesRef.current = {
    speed,
    audioLevel,
    effect,
    settings: normalizePrtclSettings(settings),
    calibration,
    reducedMotion,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (!prtclWebglAvailable()) {
      onRenderer("PRTCL unavailable");
      onRuntimeError?.(new Error("PRTCL requires WebGL2"));
      return undefined;
    }
    let renderer;
    try {
      renderer = createPrtclRenderer(
        canvas,
        theme.palette,
        valuesRef.current.settings.type,
      );
      if (!renderer) throw new Error("PRTCL WebGL2 context is unavailable");
    } catch (error) {
      onRenderer("PRTCL unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
      return undefined;
    }
    rendererRef.current = renderer;
    onRenderer(renderer.label);
    let animationFrame = 0;
    let stopped = false;
    let lastFrameAt = performance.now();

    const fail = (error) => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(animationFrame);
      onRenderer("PRTCL unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
    };
    const render = (now) => {
      if (stopped) return;
      try {
        const elapsed = Math.max(0, Math.min((now - lastFrameAt) / 1000, 0.1));
        lastFrameAt = now;
        const { width, height, pixelRatio } = surfaceSize(canvas);
        if (canvas.width !== width || canvas.height !== height) {
          renderer.resize(width, height, pixelRatio);
        }
        const current = valuesRef.current;
        renderer.render({
          speedKmh: current.speed,
          audioLevel: current.audioLevel,
          effect: current.effect,
          reducedMotion: current.reducedMotion,
          deltaSeconds: elapsed,
          calibration: current.calibration,
        });
        onFrame(now, 1000 / 60, "WebGL2", width, height);
        animationFrame = requestAnimationFrame(render);
      } catch (error) {
        fail(error);
      }
    };
    const onContextLost = (event) => {
      event.preventDefault();
      fail(new Error("PRTCL WebGL2 context lost"));
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

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setType(normalizePrtclSettings(settings).type);
    onRenderer(renderer.label);
  }, [onRenderer, settings]);

  return <canvas className="field-canvas prtcl-field" ref={canvasRef} aria-hidden="true" />;
}
