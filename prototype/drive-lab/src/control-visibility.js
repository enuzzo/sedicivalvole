export function isControlLayerFocused(activeElement) {
  return Boolean(activeElement?.closest?.(".control-layer"));
}

const CONTROL_ACTION_SELECTOR = [
  ".control-layer button",
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
