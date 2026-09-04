import { RailIcon } from "./rail-icon.jsx";
import { useEffect, useRef } from "react";

const APPEARANCE_OPTIONS = Object.freeze([
  Object.freeze({ id: "light", label: "LIGHT", icon: "/third-party/tabler-icons/sun.svg" }),
  Object.freeze({ id: "dark", label: "DARK", icon: "/third-party/tabler-icons/moon.svg" }),
  Object.freeze({ id: "auto", label: "AUTO", icon: "/third-party/tabler-icons/sun-moon.svg" }),
]);

function appearanceOption(mode) {
  return APPEARANCE_OPTIONS.find((option) => option.id === mode) ?? APPEARANCE_OPTIONS[0];
}

export function AppearanceControl({
  mode,
  effectiveAppearance,
  open,
  onOpenChange,
  onChange,
}) {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const activeOption = appearanceOption(mode);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!containerRef.current?.contains(event.target)) onOpenChange(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    window.addEventListener("keydown", closeOnEscape);
    const focusFrame = window.requestAnimationFrame(() => {
      optionRefs.current[APPEARANCE_OPTIONS.indexOf(activeOption)]?.focus({ preventScroll: true });
    });
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeOption, onOpenChange, open]);

  const moveMenuFocus = (event) => {
    const keyMoves = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
    };
    const currentIndex = optionRefs.current.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = APPEARANCE_OPTIONS.length - 1;
    else if (keyMoves[event.key]) {
      nextIndex = (Math.max(0, currentIndex) + keyMoves[event.key] + APPEARANCE_OPTIONS.length)
        % APPEARANCE_OPTIONS.length;
    } else return;
    event.preventDefault();
    optionRefs.current[nextIndex]?.focus({ preventScroll: true });
  };

  return (
    <div
      className={`appearance-control${open ? " is-open" : ""}`}
      ref={containerRef}
      onBlurCapture={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget)) onOpenChange(false);
      }}
    >
      <button
        ref={triggerRef}
        className="appearance-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="appearance-menu"
        aria-label={`Appearance ${activeOption.label}. Effective ${effectiveAppearance}. Tap to change.`}
        onClick={() => onOpenChange(!open)}
      >
        <RailIcon name={activeOption.icon.split("/").at(-1).replace(".svg", "")} />
        <span>{activeOption.label}</span>
      </button>
      {open ? (
        <div
          id="appearance-menu"
          className="appearance-menu"
          role="menu"
          aria-label="Interface appearance"
          onKeyDown={moveMenuFocus}
        >
          {APPEARANCE_OPTIONS.map((option, index) => (
            <button
              key={option.id}
              ref={(node) => { optionRefs.current[index] = node; }}
              className={`appearance-option${mode === option.id ? " is-selected" : ""}`}
              type="button"
              role="menuitemradio"
              aria-checked={mode === option.id}
              tabIndex={mode === option.id ? 0 : -1}
              onClick={() => {
                onChange(option.id);
                onOpenChange(false);
                triggerRef.current?.focus({ preventScroll: true });
              }}
            >
              <img className="appearance-icon" src={option.icon} alt="" aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
