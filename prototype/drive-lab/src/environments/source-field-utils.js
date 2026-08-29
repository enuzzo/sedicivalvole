export const SOURCE_MAX_PIXEL_RATIO = 1.25;

export function sourceSurfaceSize(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, SOURCE_MAX_PIXEL_RATIO);
  return {
    width: Math.max(1, Math.floor(canvas.clientWidth * ratio)),
    height: Math.max(1, Math.floor(canvas.clientHeight * ratio)),
  };
}

export function sourceRgb(color, alpha = 1) {
  const channels = color.map((value) => Math.round(Math.min(1, Math.max(0, value)) * 255));
  return alpha >= 1
    ? `rgb(${channels.join(" ")})`
    : `rgb(${channels.join(" ")} / ${Math.min(1, Math.max(0, alpha))})`;
}

export function sourceMix(from, to, amount) {
  const mix = Math.min(1, Math.max(0, amount));
  return from.map((value, index) => value + (to[index] - value) * mix);
}

export function startSourceCanvasLoop({
  canvas,
  valuesRef,
  label,
  targetFrameMs = 1000 / 60,
  createState = () => ({}),
  render,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!context) {
    onRenderer(`${label} unavailable`);
    onRuntimeError?.(new Error(`${label} Canvas2D context is unavailable`));
    return undefined;
  }
  const state = createState();
  let animationFrame = 0;
  let stopped = false;
  let lastFrameAt = performance.now();
  onRenderer(`Canvas2D · ${label}`);

  const fail = (error) => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(animationFrame);
    onRenderer(`${label} unavailable`);
    onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
  };

  const frame = (now) => {
    if (stopped) return;
    try {
      const { width, height } = sourceSurfaceSize(canvas);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const deltaSeconds = Math.max(0, Math.min((now - lastFrameAt) / 1000, 0.1));
      lastFrameAt = now;
      render({ context, width, height, now, deltaSeconds, state, values: valuesRef.current });
      onFrame(now, targetFrameMs, "Canvas2D", width, height);
      animationFrame = requestAnimationFrame(frame);
    } catch (error) {
      fail(error);
    }
  };

  animationFrame = requestAnimationFrame(frame);
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
  };
}
