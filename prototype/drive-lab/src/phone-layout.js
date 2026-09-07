/** Scope the phone shell to a touch-first handset, never a narrow desktop window. */
export function classifyPhoneLayout({ width, height, coarsePointer }) {
  if (!coarsePointer || !Number.isFinite(width) || !Number.isFinite(height)
    || Math.min(width, height) > 480 || Math.max(width, height) > 1000) return null;
  return width > height ? "landscape" : "portrait";
}
