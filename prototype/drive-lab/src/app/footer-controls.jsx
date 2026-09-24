import { useRef, useEffect } from "react";
import { Led, VisualThumb, NiGlyph } from "../ui/night-instrument.jsx";
import { getScoreGenre, scoreSource } from "../score/genres.js";
import { useOutsideDismiss } from "../ui/use-outside-dismiss.js";
import { getFluxTheme, FLUX_THEMES } from "../flux-themes.js";
import { eventOrigin, withInkWipe } from "../ui/ink-wipe.js";

export function ModeSelector({ mode = "flux", onChange }) {
  return (
    <nav className="mode-selector" aria-label="Experience mode" data-mode={mode}>
      <span className="mode-thumb" aria-hidden="true" />
      <button type="button" className={mode === "engine" ? "is-active" : ""} aria-pressed={mode === "engine"} onClick={() => onChange?.("engine")}><Led on={mode === "engine"} />ENGINE</button>
      <button className={mode === "flux" ? "is-active" : ""} type="button" aria-pressed={mode === "flux"} onClick={() => onChange?.("flux")}><Led on={mode === "flux"} />MUSIC</button>
    </nav>
  );
}

/**
 * The score control in the command bar.
 *
 * The bar keeps the geometry it had: one cell, one label, one value. The
 * library itself opens in a panel, because six entries with their state written
 * on them cannot be legible at arm's length inside a 190px cell, and making the
 * bar taller to fit them would cost the thing that makes this interface work —
 * that it retreats off-canvas entirely and leaves the road.
 */
function DisclosureCaret() {
  return (
    <svg className="disclosure-caret" viewBox="0 0 12 8" aria-hidden="true">
      <path d="m1 1 5 5 5-5" />
    </svg>
  );
}

export function displayLabel(entry) {
  return entry?.displayLabel ?? entry?.label ?? "";
}

export function VisualControl({ environment, onOpen }) {
  const name = displayLabel(environment);
  return (
    <button
      className="environment-control"
      type="button"
      aria-haspopup="dialog"
      aria-label={`Visual ${name} ${environment.number}. Tap to change`}
      onClick={onOpen}
    >
      <VisualThumb id={environment.id} className="control-thumb" width={40} height={40} />
      <span className="control-label">VISUAL</span>
      <span className="control-value">
        <strong>{name}</strong>
        <span className="control-catalog-number">{environment.number}</span>
      </span>
      <span className="control-disclosure"><DisclosureCaret /></span>
    </button>
  );
}

export function MusicControl({ genreId, selection, onOpen, musicMode, soundtrackSnapshot = null, artworkUrl = null }) {
  if (musicMode === "soundtrack") {
    const current = soundtrackSnapshot?.current;
    const featured = soundtrackSnapshot?.library?.selection?.kind === "featured";
    const providerMark = featured ? "LO" : "JM";
    const stateLabel = current?.title ?? (
      soundtrackSnapshot?.status === "loading" ? `Loading ${featured ? "Illobo" : "Jamendo"}` : "Soundtrack"
    );
    return (
      <button
        className="score-control"
        type="button"
        aria-haspopup="dialog"
        aria-label={`Soundtrack ${stateLabel}. Tap for artist credit and effects`}
        onClick={onOpen}
      >
        {artworkUrl ? <img className="control-thumb" src={artworkUrl} alt="" width="40" height="40" decoding="async" /> : <span className="control-thumb is-placeholder" aria-hidden="true"><NiGlyph name="music" /></span>}
        <span className="control-label">{featured ? "ILLOBO" : "JAMENDO"}</span>
        <span className="control-value">
          <strong aria-live="polite">{stateLabel}</strong>
          <span className="control-catalog-number is-provider">{providerMark}</span>
        </span>
        <span className="control-disclosure"><DisclosureCaret /></span>
      </button>
    );
  }
  const pending = selection.status === "loading" ? selection.requestedScoreId : null;
  const selected = getScoreGenre(pending ?? genreId);
  const selectedName = displayLabel(selected);
  const stateLabel = selection.status === "loading"
    ? `${selectedName} · Loading`
    : selection.status === "restored"
      ? `${selectedName} · Restored`
      : selection.status === "unavailable"
        ? `${selectedName} · Unavailable`
        : selectedName;
  return (
    <button
      className="score-control"
      type="button"
      aria-haspopup="dialog"
      aria-label={`Music ${stateLabel}, ${selected.family}. Tap to change`}
      title={selection.message ?? undefined}
      onClick={onOpen}
    >
      <img className="control-thumb" src={selected.coverUrl} alt="" width="40" height="40" decoding="async" />
      <span className="control-label">PLAY THE ROAD</span>
      <span className="control-value">
        <strong aria-live="polite">{stateLabel}</strong>
        <span className="control-catalog-number" title={scoreSource(selected.id).note}>
          {scoreSource(selected.id).mark} {selected.number}
        </span>
      </span>
      <span className="control-disclosure"><DisclosureCaret /></span>
    </button>
  );
}

const paletteName = (theme) => theme.label.replace(/\s+\d+$/, "").toLowerCase().replace(/^./, (character) => character.toUpperCase());

/** A full-cell palette preview opens ten independently reachable touch targets. */
export function PaletteControl({ themeId, onChange, open, onOpenChange }) {
  const containerRef = useRef(null);
  useOutsideDismiss(containerRef, open, () => onOpenChange(false));
  const selected = getFluxTheme(themeId);
  useEffect(() => {
    if (!open) return undefined;
    const dismiss = (event) => {
      if (event.type === "keydown" ? event.key === "Escape" : !containerRef.current?.contains(event.target)) onOpenChange(false);
    };

    document.addEventListener("keydown", dismiss);
    containerRef.current?.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
    return () => {

      document.removeEventListener("keydown", dismiss);
    };
  }, [open, onOpenChange]);
  const swatch = (theme) => ({ background: theme.swatchSecondary
    ? `linear-gradient(105deg, ${theme.swatch} 0 52%, ${theme.swatchSecondary} 52% 100%)`
    : theme.swatch });
  return (
    <div className="palette-control" ref={containerRef} onBlurCapture={(event) => {
      // Safari touch buttons can blur the focused swatch without focusing the tapped button.
      // Outside pointer dismissal already owns that case; only dismiss a known focus departure.
      if (open && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) onOpenChange(false);
    }}>
      <button className="palette-trigger" type="button" aria-label={`Palette ${selected.label}. Choose palette`}
        aria-expanded={open} aria-controls="palette-menu" onClick={() => onOpenChange(!open)}>
        <span className="palette-orb" style={swatch(selected)} aria-hidden="true" />
        <span className="palette-trigger-copy"><span>PALETTE</span><strong>{paletteName(selected)}</strong></span>
      </button>
      {open ? <div className="palette-menu" id="palette-menu" role="group" aria-label="Colour palettes">
        {FLUX_THEMES.map((theme) => <button key={theme.id} type="button" aria-pressed={theme.id === themeId}
          aria-label={`Use the ${theme.label.toLowerCase()} palette`} onClick={(event) => { const origin = eventOrigin(event); onOpenChange(false); withInkWipe(origin, () => onChange(theme.id)); }}>
          <span style={swatch(theme)} aria-hidden="true" /><strong>{paletteName(theme)}</strong>
        </button>)}
      </div> : null}
    </div>
  );
}
