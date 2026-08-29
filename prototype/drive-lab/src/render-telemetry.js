export const SIXTY_FPS_FRAME_INTERVAL_MS = 1000 / 60;
export const THIRTY_FPS_FRAME_INTERVAL_MS = 1000 / 30;

/**
 * Returns the drawing-buffer dimensions that the renderer actually allocated.
 * CSS layout dimensions are deliberately not accepted as a fallback because
 * diagnostics must not under-report device-pixel-ratio or render-scale costs.
 */
export function canvasFramebufferSize(canvas) {
  const width = canvas?.width;
  const height = canvas?.height;
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }
  return { width, height };
}

/** Keeps telemetry sampling at or below its target rate without inventing frames. */
export function frameTelemetryIsDue(lastFrameAt, capturedAt, targetFrameIntervalMs) {
  if (!Number.isFinite(capturedAt) || !Number.isFinite(targetFrameIntervalMs) || targetFrameIntervalMs <= 0) {
    return false;
  }
  return !Number.isFinite(lastFrameAt)
    || capturedAt - lastFrameAt >= targetFrameIntervalMs;
}
