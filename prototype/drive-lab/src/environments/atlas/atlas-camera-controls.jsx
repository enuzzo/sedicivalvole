import { RailIcon } from '../../rail-icon.jsx';

export function AtlasCameraControls({ northUp, mapAppearance, onZoom, onReset, onNorthUpChange, onMapAppearanceChange }) {
  const natural = mapAppearance === 'standard';
  const toggleAppearance = () => onMapAppearanceChange(natural ? 'palette' : 'standard');
  const appearanceLabel = natural
    ? 'Map colors: standard cartographic. Switch to product palette.'
    : 'Map colors: product palette. Switch to standard cartographic colors.';
  return <nav className="atlas-camera-controls" aria-label="Map camera" onPointerDown={event => event.stopPropagation()}>
    <button type="button" aria-label="Zoom in" onClick={() => onZoom(1)}>+</button>
    <button type="button" aria-label="Reset map view" onClick={onReset}>Reset</button>
    <button type="button" aria-label="Zoom out" onClick={() => onZoom(-1)}>−</button>
    <button type="button" aria-label="Lock map north up" aria-pressed={northUp} onClick={() => onNorthUpChange(!northUp)}>{northUp ? 'North up' : 'Heading up'}</button>
    <button type="button" className="atlas-camera-appearance" aria-label={appearanceLabel} title={appearanceLabel} aria-pressed={natural}
      onPointerUp={event => { event.stopPropagation(); toggleAppearance(); }}
      onClick={event => { if (event.detail === 0) toggleAppearance(); }}>
      <RailIcon name="palette" />
    </button>
  </nav>;
}
