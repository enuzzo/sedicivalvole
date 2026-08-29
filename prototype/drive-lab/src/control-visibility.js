export function isControlLayerFocused(activeElement) {
  return Boolean(activeElement?.closest?.(".control-layer"));
}
