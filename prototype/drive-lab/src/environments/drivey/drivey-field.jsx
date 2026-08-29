import { useEffect, useRef } from "react";
import {
  DEFAULT_DRIVEY_SETTINGS,
  driveyGridDensity,
  driveyMotionProfile,
  normalizeDriveySettings,
  projectDriveyPoint,
} from "./drivey-model.js";

const MAX_PIXEL_RATIO = 1.35;

function surfaceSize(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  return {
    width: Math.max(1, Math.floor(canvas.clientWidth * ratio)),
    height: Math.max(1, Math.floor(canvas.clientHeight * ratio)),
  };
}

function rgb(color, alpha = 1, gain = 1) {
  const channels = color.map((value) => Math.round(Math.min(1, Math.max(0, value * gain)) * 255));
  return `rgb(${channels.join(" ")} / ${Math.min(1, Math.max(0, alpha))})`;
}

function strokeProjectedLine(context, points, width, height) {
  context.beginPath();
  points.forEach((point, index) => {
    const x = point.x * width;
    const y = point.y * height;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
}

function roadPoint(lateral, progress, state, profile) {
  return projectDriveyPoint({
    lateral,
    progress,
    time: state.time,
    profile,
    settings: state.settings,
  });
}

function drawRoad(context, width, height, state, profile, palette) {
  const density = driveyGridDensity(state.settings);
  const roadLongitudinal = [];
  for (let index = 0; index <= density.longitudinal; index += 1) {
    roadLongitudinal.push(-1 + (index / density.longitudinal) * 2);
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  // Terrain longitudinal contours share the road projection but remain outside
  // its edges, making one continuous world rather than a separate sky effect.
  context.strokeStyle = rgb(palette.mid, 0.24 + profile.lineEnergy * 0.14);
  context.lineWidth = 0.55;
  for (let side = -1; side <= 1; side += 2) {
    for (let index = 0; index < density.terrainLines; index += 1) {
      const lateral = side * (1.14 + index * 0.2);
      const points = [];
      for (let step = 0; step <= 44; step += 1) {
        const progress = step / 44;
        const point = roadPoint(lateral, progress, state, profile);
        const terrainWave = Math.sin(progress * (13 + index * 0.7) + index * 1.9 + state.time * 0.12)
          * (0.018 + index * 0.002)
          * (1 - point.depth * 0.46);
        points.push({ x: point.x, y: point.y - terrainWave });
      }
      strokeProjectedLine(context, points, width, height);
    }
  }

  // Cross-contours move towards the camera. Their wrap is smooth and bounded.
  context.strokeStyle = rgb(palette.mid, 0.19 + profile.lineEnergy * 0.12);
  for (let row = 0; row < density.crossSections; row += 1) {
    const travel = state.reducedMotion ? 0 : (state.travel * 0.18) % 1;
    const progress = ((row / density.crossSections) + travel) % 1;
    const left = roadPoint(-2.75, progress, state, profile);
    const right = roadPoint(2.75, progress, state, profile);
    strokeProjectedLine(context, [left, right], width, height);
  }

  // A dark road bed preserves line hierarchy without importing a texture.
  const leftEdge = [];
  const rightEdge = [];
  for (let step = 0; step <= 54; step += 1) {
    const progress = step / 54;
    leftEdge.push(roadPoint(-1, progress, state, profile));
    rightEdge.push(roadPoint(1, progress, state, profile));
  }
  context.beginPath();
  leftEdge.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x * width, point.y * height);
    else context.lineTo(point.x * width, point.y * height);
  });
  [...rightEdge].reverse().forEach((point) => context.lineTo(point.x * width, point.y * height));
  context.closePath();
  context.fillStyle = rgb(palette.base, 0.82, 0.55);
  context.fill();

  for (const lateral of roadLongitudinal) {
    const edge = Math.abs(lateral) > 0.99;
    const centre = Math.abs(lateral) < 0.04;
    context.strokeStyle = edge
      ? rgb(palette.light, 0.68 + profile.lineEnergy * 0.24)
      : centre
        ? rgb(palette.accent, 0.58 + profile.colourPulse * 0.34)
        : rgb(palette.mid, 0.26 + profile.lineEnergy * 0.18);
    context.lineWidth = edge ? 1.5 : centre ? 1.2 : 0.65;
    const points = [];
    for (let step = 0; step <= 54; step += 1) {
      points.push(roadPoint(lateral, step / 54, state, profile));
    }
    strokeProjectedLine(context, points, width, height);
  }

  // Moving road sections make forward travel unambiguous at every camera.
  for (let row = 0; row < density.crossSections + 4; row += 1) {
    const travel = state.reducedMotion ? 0 : state.travel % 1;
    const progress = ((row / (density.crossSections + 4)) + travel) % 1;
    const left = roadPoint(-1, progress, state, profile);
    const right = roadPoint(1, progress, state, profile);
    context.strokeStyle = row % 4 === 0
      ? rgb(palette.accent, 0.28 + profile.colourPulse * 0.36)
      : rgb(palette.light, 0.12 + profile.lineEnergy * 0.09);
    context.lineWidth = row % 4 === 0 ? 1.15 : 0.55;
    strokeProjectedLine(context, [left, right], width, height);
  }

  // Sparse centre dashes are geometry, not a scrolling image or texture.
  context.strokeStyle = rgb(palette.light, 0.72 + profile.lineEnergy * 0.22);
  context.lineWidth = 2.1;
  for (let dash = 0; dash < 11; dash += 1) {
    const start = ((dash / 11) + (state.reducedMotion ? 0 : state.travel * 0.56)) % 1;
    const end = Math.min(1, start + 0.026 + start * 0.02);
    if (end <= start) continue;
    strokeProjectedLine(
      context,
      [roadPoint(0, start, state, profile), roadPoint(0, end, state, profile)],
      width,
      height,
    );
  }
  context.restore();
}

export function DriveyField({
  speed,
  audioLevel = 0,
  theme,
  effect,
  settings = DEFAULT_DRIVEY_SETTINGS,
  reducedMotion,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const canvasRef = useRef(null);
  const valuesRef = useRef({ speed, audioLevel, theme, effect, settings, reducedMotion });
  valuesRef.current = {
    speed,
    audioLevel,
    theme,
    effect,
    settings: normalizeDriveySettings(settings),
    reducedMotion,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) {
      onRenderer("Drivey unavailable");
      onRuntimeError?.(new Error("DRIVEY Canvas2D context is unavailable"));
      return undefined;
    }
    let animationFrame = 0;
    let stopped = false;
    let lastFrameAt = performance.now();
    const state = {
      time: 0,
      travel: 0,
      settings: valuesRef.current.settings,
      reducedMotion: valuesRef.current.reducedMotion,
    };
    onRenderer("Canvas2D · Drivey road field");
    const fail = (error) => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(animationFrame);
      onRenderer("Drivey unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
    };
    const render = (now) => {
      if (stopped) return;
      try {
        const { width, height } = surfaceSize(canvas);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        const elapsed = Math.min(0.1, Math.max(0, (now - lastFrameAt) / 1000));
        lastFrameAt = now;
        const values = valuesRef.current;
        const profile = driveyMotionProfile({
          speedKmh: values.speed,
          audioLevel: values.audioLevel,
          effect: values.effect,
          reducedMotion: values.reducedMotion,
        });
        state.settings = values.settings;
        state.reducedMotion = values.reducedMotion;
        state.time += profile.travelRate * elapsed;
        state.travel = (state.travel + profile.travelRate * elapsed * 0.42) % 1;
        context.fillStyle = rgb(values.theme.palette.base, 1, 0.36);
        context.fillRect(0, 0, width, height);
        drawRoad(context, width, height, state, profile, values.theme.palette);
        onFrame(now, 1000 / 60, "Canvas2D", width, height);
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
  }, [onFrame, onRenderer, onRuntimeError]);

  return <canvas className="field-canvas" ref={canvasRef} aria-hidden="true" />;
}
