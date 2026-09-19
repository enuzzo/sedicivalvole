import { useContextualControls } from "../contextual-controls.jsx";
import {DRIVEY_RENDER_MODES, nextDriveyRenderModeId} from '../environments/drivey/drivey-model.js';
import {PRTCL_TYPES, nextPrtclTypeId} from '../environments/prtcl/prtcl-model.js';
import {getFluxEnvironment, nextShaderGradientEnvironmentId} from '../flux-environments.js';

const displayLabel = entry => entry?.displayLabel ?? entry?.label ?? '';

export function DriveyCycleControl({ settings, onChange }) {
  const contextual = useContextualControls();
  const wireframe = settings.renderMode === DRIVEY_RENDER_MODES.wireframe.id;
  const renderMode = wireframe
    ? DRIVEY_RENDER_MODES.wireframe
    : DRIVEY_RENDER_MODES.normal;
  const nextRenderMode = DRIVEY_RENDER_MODES[nextDriveyRenderModeId(renderMode.id)];
  return (
    <div {...contextual}
      className="visual-cycle-control drivey-cycle-control"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="visual-cycle-rail drivey-cycle-rail">
        <button
          className="visual-cycle-button visual-render-toggle"
          type="button"
          aria-label={`DRIVEY render ${renderMode.label}. Next ${nextRenderMode.label}`}
          aria-pressed={wireframe}
          onClick={() => onChange({ renderMode: nextRenderMode.id })}
        >
          <span>RENDER</span>
          <small>{renderMode.label}</small>
        </button>
      </div>
    </div>
  );
}

export function PrtclCycleControl({ settings, onChange }) {
  const contextual = useContextualControls();
  const current = PRTCL_TYPES[settings.type] ?? PRTCL_TYPES.frequency;
  const next = PRTCL_TYPES[nextPrtclTypeId(current.id)];
  return (
    <div {...contextual}
      className="visual-cycle-control prtcl-cycle-control"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="visual-cycle-rail prtcl-cycle-rail">
        <button
          className="visual-cycle-button visual-particle-cycle"
          type="button"
          aria-label={`PRTCL type ${current.fullLabel}. Next ${next.fullLabel}`}
          onClick={() => onChange({ type: next.id })}
        >
          <span>TYPE</span>
          <small>{current.label}</small>
        </button>
      </div>
    </div>
  );
}

export function ShaderGradientCycleControl({ environment, onChange }) {
  const contextual = useContextualControls();
  const nextEnvironment = getFluxEnvironment(nextShaderGradientEnvironmentId(environment.id));
  return (
    <div {...contextual}
      className="visual-cycle-control gradient-cycle-control"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="visual-cycle-rail gradient-cycle-rail">
        <button
          className="visual-cycle-button visual-gradient-cycle"
          type="button"
          aria-label={`Gradient variant ${displayLabel(environment)}. Next ${displayLabel(nextEnvironment)}`}
          onClick={() => onChange(nextEnvironment.id)}
        >
          <span>VARIANT</span>
          <small>{environment.variantLabel}</small>
        </button>
      </div>
    </div>
  );
}
