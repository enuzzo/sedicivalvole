// LATITUDES 04 — React host for the stratum renderer.
//
// Owns the canvas, the loop, resolution scaling, context-loss reporting, and the
// Canvas2D degradation path. All motion mathematics lives in latitudes-model.js
// so both renderers describe the same stack of moments.

import { useEffect, useRef } from "react";
import {
  advanceLatitudesHistory,
  createLatitudesHistory,
  historyLagMetres,
  LATITUDES_SHEAR_PER_METRE,
  speedToFieldStructure,
  speedToRestPhaseRate,
} from "./latitudes-model.js";
import { createLatitudesRenderer, latitudesWebglAvailable } from "./latitudes-renderer.js";

const MAX_PIXEL_RATIO = 1.25;
const WEBGL_TARGET_FRAME_MS = 1000 / 60;
const FALLBACK_TARGET_FRAME_MS = 1000 / 30;
const FALLBACK_ROWS = 96;
const FALLBACK_COLUMNS = 22;
const TAU = Math.PI * 2;

function smoothstep(edge0, edge1, value) {
  const normalized = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return normalized * normalized * (3 - 2 * normalized);
}

function surfaceSize(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  return {
    width: Math.max(1, Math.floor(canvas.clientWidth * ratio)),
    height: Math.max(1, Math.floor(canvas.clientHeight * ratio)),
  };
}

const toCss = (channels) => `rgb(${channels
  .map((channel) => Math.round(Math.min(1, Math.max(0, channel)) * 255))
  .join(",")})`;

/** The same field the shader evaluates, at one point. */
function fieldValue(u, v, structure) {
  const band = (
    Math.sin(v * TAU)
    + 0.55 * Math.sin(v * TAU * 0.37 + 1.7)
    + 0.30 * Math.sin(v * TAU * 2.19 + 4.1)
    + structure.fineWeight * 0.45 * Math.sin(v * TAU * 3.7 + 2.3)
  ) / 2.3;
  const marks =
    smoothstep(0.93, 1.0, Math.sin(u * TAU * 2.60))
    + smoothstep(0.95, 1.0, Math.sin(u * TAU * 4.19 + 2.1))
    + structure.fineWeight * smoothstep(0.96, 1.0, Math.sin(u * TAU * 7.09 + 0.7));
  return band * 0.72 + marks * structure.lateralWeight * 0.58;
}

/**
 * Canvas2D degradation: the same stack drawn as a coarse grid of solid cells,
 * at a reduced frame target.
 */
function startCanvasFallback(canvas, valuesRef, onRenderer, onFrame) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    onRenderer("Latitudes unavailable");
    return () => {};
  }

  const history = createLatitudesHistory();
  let animationFrame = 0;
  let stopped = false;
  let restPhase = 0;
  let lastFrameAt = performance.now();
  onRenderer("Canvas2D · Latitudes");

  const render = (now) => {
    if (stopped) return;
    animationFrame = requestAnimationFrame(render);
    const elapsed = Math.max(0, Math.min((now - lastFrameAt) / 1000, 0.25));
    if (elapsed < 1 / 32) return;
    lastFrameAt = now;

    const { speed, reducedMotion, palette } = valuesRef.current;
    const effectiveSpeed = reducedMotion ? Math.min(speed, 20) : speed;
    advanceLatitudesHistory(history, effectiveSpeed, elapsed);
    restPhase += speedToRestPhaseRate(effectiveSpeed) * elapsed;

    const { width, height } = surfaceSize(canvas);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const structure = speedToFieldStructure(effectiveSpeed);
    const tones = [palette.base, palette.mid, palette.light, palette.accent];
    const aspect = width / height;
    const rowHeight = height / FALLBACK_ROWS;
    const columnWidth = width / FALLBACK_COLUMNS;

    for (let row = 0; row < FALLBACK_ROWS; row += 1) {
      // Row 0 is the bottom of the frame, which is the newest stratum.
      const age = (row + 0.5) / FALLBACK_ROWS;
      const lag = historyLagMetres(history, age);
      const v = age * structure.bandFrequency;
      const y = height - (row + 1) * rowHeight;

      for (let column = 0; column < FALLBACK_COLUMNS; column += 1) {
        const u = ((column + 0.5) / FALLBACK_COLUMNS) * aspect
          + lag * LATITUDES_SHEAR_PER_METRE + restPhase;
        const value = fieldValue(u, v, structure);
        const quantised = Math.min(1, Math.max(0, value * 0.5 * structure.toneSpread + 0.5));
        const index = Math.min(3, Math.floor(quantised * 4));
        context.fillStyle = toCss(tones[index]);
        context.fillRect(column * columnWidth, y, columnWidth + 1, rowHeight + 1);
      }
    }

    onFrame(now, FALLBACK_TARGET_FRAME_MS, "Canvas2D", width, height);
  };

  animationFrame = requestAnimationFrame(render);
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
  };
}

export function LatitudesField({ speed, theme, reducedMotion, onRenderer, onFrame }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const valuesRef = useRef({ speed, reducedMotion, palette: theme.palette });
  valuesRef.current = { speed, reducedMotion, palette: theme.palette };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    if (!latitudesWebglAvailable()) {
      return startCanvasFallback(canvas, valuesRef, onRenderer, onFrame);
    }

    const renderer = createLatitudesRenderer(canvas, valuesRef.current.palette);
    if (!renderer) {
      onRenderer("Latitudes shader error");
      return undefined;
    }
    rendererRef.current = renderer;

    let animationFrame = 0;
    let stopped = false;
    let contextLost = false;
    let lastFrameAt = performance.now();
    onRenderer(renderer.label);

    const render = (now) => {
      if (stopped) return;
      animationFrame = requestAnimationFrame(render);
      if (contextLost) return;

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
    };

    const onContextLost = (event) => {
      event.preventDefault();
      contextLost = true;
      onRenderer("WebGL2 context lost");
    };
    const onContextRestored = () => onRenderer("WebGL2 · reload required");
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    animationFrame = requestAnimationFrame(render);

    return () => {
      stopped = true;
      rendererRef.current = null;
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      renderer.dispose();
    };
    // The renderer owns its loop and reads live values through valuesRef, so it
    // must not be rebuilt when speed or theme change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFrame, onRenderer]);

  useEffect(() => {
    rendererRef.current?.setPalette(theme.palette);
  }, [theme]);

  return <canvas className="field-canvas" ref={canvasRef} aria-hidden="true" />;
}
