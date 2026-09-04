export function isControlLayerFocused(activeElement) {
  return Boolean(activeElement?.closest?.(".control-layer"));
}

const CONTROL_ACTION_SELECTOR = [
  ".control-layer button",
  ".visual-cycle-control button",
  ".atlas-panel-toggle",
  ".atlas-history-range",
  ".atlas-map-appearance",
  ".control-layer input",
  ".control-layer select",
  ".control-layer textarea",
  ".control-layer [contenteditable='true']",
  ".control-layer [role='slider']",
].join(", ");

export function shouldReleaseControlFocus(activationTarget, controlsPinned = false) {
  return controlsPinned !== true
    && Boolean(activationTarget?.closest?.(CONTROL_ACTION_SELECTOR));
}
