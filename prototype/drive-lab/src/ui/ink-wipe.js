import { flushSync } from "react-dom";

/**
 * Palette changes spread like ink from the swatch that was touched. Uses the
 * View Transitions API when present; otherwise, or with reduced motion, the
 * change applies at once. The wipe is a single compositor clip animation.
 */
export function withInkWipe(origin, apply) {
  const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof document?.startViewTransition !== "function") {
    apply();
    return;
  }
  const width = globalThis.innerWidth || 0;
  const height = globalThis.innerHeight || 0;
  const x = Number.isFinite(origin?.x) && origin.x > 0 ? origin.x : width / 2;
  const y = Number.isFinite(origin?.y) && origin.y > 0 ? origin.y : height / 2;
  const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
  let transition;
  try {
    transition = document.startViewTransition(() => flushSync(apply));
  } catch {
    apply();
    return;
  }
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 640, easing: "cubic-bezier(.2, .75, .2, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  }).catch(() => {});
}

export const eventOrigin = (event) => (event && Number.isFinite(event.clientX) ? { x: event.clientX, y: event.clientY } : null);
