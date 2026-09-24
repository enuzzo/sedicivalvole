import { useRef, useEffect } from "react";
import { MANUAL_EFFECT_CONTROLS as SOUNDTRACK_MANUAL_CONTROLS } from "../manual-effects-controls.js";
import { LedRow } from "../ui/night-instrument.jsx";

const clampDepth = (value) => Math.min(1, Math.max(0, Math.round(value * 100) / 100));

/**
 * One performance pad. A tap plays the authored hit (or stops the effect); a
 * vertical drag sets depth, drawn as a column of light rising in the pad. The
 * pad is an ARIA slider, so keyboard and assistive control stay complete.
 */
function PerformancePad({ effect, amount, onChange }) {
  const padRef = useRef(null);
  const dragRef = useRef(null);
  const active = amount > 0.01;
  const percent = Math.round(amount * 100);
  const toggle = () => onChange(effect.id, active ? 0 : effect.performanceAmount);
  const release = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    padRef.current?.releasePointerCapture?.(event.pointerId);
    if (!drag.moved && event.type === "pointerup") toggle();
  };
  return (
    <div
      ref={padRef}
      className={`fx-pad${active ? " is-active" : ""}${effect.family ? ` is-family-${effect.family}` : ""}`}
      style={{ "--depth": amount }}
      role="slider"
      tabIndex={0}
      aria-label={`${effect.displayLabel} depth`}
      aria-describedby="fx-pad-help"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%${active ? ", playing" : ", off"}`}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (event.pointerType === "mouse" && event.button !== 0) return;
        dragRef.current = { pointerId: event.pointerId, y: event.clientY, start: amount, moved: false };
        padRef.current?.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const travel = drag.y - event.clientY;
        if (!drag.moved && Math.abs(travel) < 8) return;
        drag.moved = true;
        const height = Math.max(60, padRef.current?.clientHeight ?? 120);
        onChange(effect.id, clampDepth(drag.start + travel / (height * 0.9)));
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={(event) => {
        const steps = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05, PageUp: 0.1, PageDown: -0.1 };
        if (event.key in steps) onChange(effect.id, clampDepth(amount + steps[event.key]));
        else if (event.key === "Home") onChange(effect.id, 0);
        else if (event.key === "End") onChange(effect.id, 1);
        else if (event.key === "Enter" || event.key === " ") toggle();
        else return;
        event.preventDefault();
      }}
    >
      <span className="fx-pad-level" aria-hidden="true" />
      <span className="fx-pad-copy">
        <strong>{effect.label}</strong>
        <small>{effect.note}</small>
      </span>
      <span className="fx-pad-readout" aria-hidden="true">
        {effect.family === "tone" ? <em>EQ</em> : null}
        <b>{percent}</b><i>%</i>
      </span>
    </div>
  );
}

export function ManualEffectsDeck({ values, onChange, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const activeCount = SOUNDTRACK_MANUAL_CONTROLS.filter(({ id }) => values[id] > 0.01).length;
  return (
    <div className="manual-effects-overlay">
      <button className="manual-effects-backdrop" type="button" tabIndex={-1} onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onClose(); }} aria-label="Close Performance FX" />
      <section
        id="manual-effects-deck"
        className="manual-effects-deck control-layer is-pads"
        role="dialog"
        aria-modal="false"
        aria-labelledby="manual-effects-title"
      >
      <header>
        <div>
          <small>MIX · PLAY THE ROAD + SOUNDTRACK</small>
          <h2 id="manual-effects-title">Performance FX</h2>
        </div>
        <span className="fx-deck-count"><LedRow states={SOUNDTRACK_MANUAL_CONTROLS.map(({ id }) => values[id] > 0.01)} />{activeCount}/8 ACTIVE</span>
        <button type="button" onClick={() => SOUNDTRACK_MANUAL_CONTROLS.forEach(({ id }) => onChange(id, 0))}>RESET</button>
        <button type="button" autoFocus onClick={onClose}>CLOSE</button>
      </header>
      <p id="fx-pad-help" className="fx-pad-help">Tap a pad to play it. Drag up or down to set its depth.</p>
      <div className="manual-effects-grid fx-pad-grid">
        {SOUNDTRACK_MANUAL_CONTROLS.map((effect) => (
          <PerformancePad key={effect.id} effect={effect} amount={values[effect.id]} onChange={onChange} />
        ))}
      </div>
      </section>
    </div>
  );
}
