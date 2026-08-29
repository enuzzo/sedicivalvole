// MERIDIAN 03 — React host for the corridor renderer.
//
// Owns the canvas, the animation loop, resolution scaling, context-loss
// reporting, and the Canvas2D degradation path. It holds no visual mathematics:
// every mapping comes from meridian-model.js so the WebGL2 and Canvas2D paths
// describe the same world.

import { useEffect, useRef } from "react";
import {
  advanceTimeOffset,
  distortionAt,
  MERIDIAN_TRAVEL_LENGTH,
  speedToDistortionField,
  speedToLayerDensity,
  speedToProjection,
  speedToTimeRate,
} from "./meridian-model.js";
import { createMeridianRenderer, meridianWebglAvailable } from "./meridian-renderer.js";

const MAX_PIXEL_RATIO = 1.25;
const WEBGL_TARGET_FRAME_MS = 1000 / 60;
const FALLBACK_TARGET_FRAME_MS = 1000 / 30;

function surfaceSize(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  return {
    width: Math.max(1, Math.floor(canvas.clientWidth * ratio)),
    height: Math.max(1, Math.floor(canvas.clientHeight * ratio)),
  };
}

const toCss = (channels, scale = 1) => `rgb(${channels
  .map((channel) => Math.round(Math.min(1, Math.max(0, channel * scale)) * 255))
  .join(",")})`;

/**
 * Canvas2D degradation. It draws the same rails and stations through the same
 * displacement field with a hand-rolled projection, at a reduced frame target.
 */
function startCanvasFallback(canvas, valuesRef, onRenderer, onFrame, onRuntimeError) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    onRenderer("Meridian unavailable");
    onRuntimeError?.(new Error("MERIDIAN Canvas2D context is unavailable"));
    return undefined;
  }

  const lanes = [0, -2.7, 2.7, -5.9, 5.9, -9.6, 9.6];
  const stations = 26;
  let animationFrame = 0;
  let stopped = false;
  let timeOffset = 0;
  let lastFrameAt = performance.now();
  onRenderer("Canvas2D · Meridian");

  const fail = (error) => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(animationFrame);
    onRenderer("Meridian unavailable");
    onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
  };

  const render = (now) => {
    if (stopped) return;
    try {
      const elapsed = Math.max(0, Math.min((now - lastFrameAt) / 1000, 0.25));
      if (elapsed >= 1 / 32) {
        lastFrameAt = now;

        const { speed, reducedMotion, palette } = valuesRef.current;
        const effectiveSpeed = reducedMotion ? Math.min(speed, 20) : speed;
        timeOffset = advanceTimeOffset(timeOffset, speedToTimeRate(effectiveSpeed), elapsed);

        const { width, height } = surfaceSize(canvas);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const field = speedToDistortionField(effectiveSpeed);
        const density = speedToLayerDensity(effectiveSpeed);
        const projection = speedToProjection(effectiveSpeed);
        const focal = height / (2 * Math.tan((projection.fovDegrees * Math.PI) / 360));
        const eyeY = projection.cameraLift;

        const project = (x, y, z) => {
          const depth = 6 - z;
          if (depth < 0.4) return null;
          return {
            sx: width / 2 + (focal * x) / depth,
            sy: height / 2 - (focal * (y - eyeY)) / depth,
          };
        };

        context.fillStyle = toCss(palette.base);
        context.fillRect(0, 0, width, height);
        context.lineCap = "butt";

        for (const lane of lanes) {
          context.beginPath();
          let started = false;
          for (let step = 0; step <= 46; step += 1) {
            const progress = step / 46;
            const displacement = distortionAt(progress, timeOffset, field);
            const point = project(
              lane + displacement.x,
              displacement.y,
              -progress * MERIDIAN_TRAVEL_LENGTH,
            );
            if (!point) continue;
            if (started) context.lineTo(point.sx, point.sy);
            else { context.moveTo(point.sx, point.sy); started = true; }
          }
          context.strokeStyle = toCss(lane === 0 ? palette.light : palette.mid, density.railGlow);
          context.lineWidth = lane === 0 ? 2 : 1.2;
          context.stroke();
        }

        const stationSpan = MERIDIAN_TRAVEL_LENGTH / stations;
        for (let station = 0; station < stations; station += 1) {
          const travelled = (station * stationSpan + timeOffset * 26) % MERIDIAN_TRAVEL_LENGTH;
          const z = -(MERIDIAN_TRAVEL_LENGTH - travelled);
          const progress = Math.min(1, -z / MERIDIAN_TRAVEL_LENGTH);
          if (progress > density.gateFraction) continue;
          const displacement = distortionAt(progress, timeOffset, field);
          for (const side of [-1, 1]) {
            const base = project(side * 10.8 + displacement.x, displacement.y, z);
            const top = project(side * 10.8 + displacement.x, displacement.y + 2, z);
            if (!base || !top) continue;
            context.beginPath();
            context.moveTo(base.sx, base.sy);
            context.lineTo(top.sx, top.sy);
            context.strokeStyle = toCss(palette.accent, 1 - progress * 0.8);
            context.lineWidth = 2;
            context.stroke();
          }
        }

        onFrame(now, FALLBACK_TARGET_FRAME_MS, "Canvas2D", width, height);
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

export function MeridianField({
  speed,
  theme,
  reducedMotion,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const valuesRef = useRef({ speed, reducedMotion, palette: theme.palette });
  valuesRef.current = { speed, reducedMotion, palette: theme.palette };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    // Probe before touching the real canvas: asking it for WebGL2 would rule out
    // Canvas2D on the same surface even if the request failed.
    if (!meridianWebglAvailable()) {
      return startCanvasFallback(canvas, valuesRef, onRenderer, onFrame, onRuntimeError);
    }

    let renderer;
    try {
      renderer = createMeridianRenderer(canvas, valuesRef.current.palette);
    } catch (error) {
      onRenderer("Meridian unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
      return undefined;
    }
    if (!renderer) {
      onRenderer("Meridian unavailable");
      onRuntimeError?.(new Error("MERIDIAN WebGL2 renderer is unavailable"));
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
      onRenderer("Meridian unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
    };

    const render = (now) => {
      if (stopped) return;
      try {
        const elapsed = Math.max(0, Math.min((now - lastFrameAt) / 1000, 0.25));
        lastFrameAt = now;

        const { width, height } = surfaceSize(canvas);
        if (canvas.width !== width || canvas.height !== height) renderer.resize(width, height);

        renderer.render({
          speedKmh: valuesRef.current.speed,
          deltaSeconds: elapsed,
          reducedMotion: valuesRef.current.reducedMotion,
        });

        onFrame(now, WEBGL_TARGET_FRAME_MS, "WebGL2", width, height);
        animationFrame = requestAnimationFrame(render);
      } catch (error) {
        fail(error);
      }
    };

    const onContextLost = (event) => {
      event.preventDefault();
      fail(new Error("MERIDIAN WebGL2 context lost"));
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
    // The renderer owns its own loop and reads live values through valuesRef, so
    // it must not be rebuilt when speed or theme change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFrame, onRenderer, onRuntimeError]);

  useEffect(() => {
    rendererRef.current?.setPalette(theme.palette);
  }, [theme]);

  return <canvas className="field-canvas" ref={canvasRef} aria-hidden="true" />;
}
