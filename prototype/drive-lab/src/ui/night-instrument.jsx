import { ROAD_SPEED_CEILING_KMH } from "../signal-model.js";
import { visualThumbnailUrl } from "../flux-environments.js";

/*
 * Night Instrument primitives. Every moving part reads a real signal: road
 * speed, playback, effect depth. Nothing here animates for decoration, and all
 * motion is transform/opacity so the WebGL field keeps the GPU.
 */

const DIGITS = "0123456789";

/** Odometer digits. Screen readers get the plain value from `label`. */
export function RollingNumber({ value, label, className = "" }) {
  const text = String(value);
  if (!/^\d+$/.test(text)) {
    return <strong className={`rolling-number is-static ${className}`.trim()} aria-label={label}>{text}</strong>;
  }
  return (
    <strong className={`rolling-number ${className}`.trim()} aria-label={label ?? text}>
      {[...text].map((digit, index) => (
        <span className="rolling-digit" key={text.length - index} aria-hidden="true">
          <span className="rolling-strip" style={{ "--digit": Number(digit) }}>
            {[...DIGITS].map((glyph) => <span key={glyph}>{glyph}</span>)}
          </span>
        </span>
      ))}
    </strong>
  );
}

/** The share of the shared 130 km/h response ceiling, drawn as one lit line. */
export function SpeedGauge({ speed, live = true }) {
  const fraction = live ? Math.min(1, Math.max(0, (Number(speed) || 0) / ROAD_SPEED_CEILING_KMH)) : 0;
  return (
    <span className="speed-gauge" aria-hidden="true" data-live={live}>
      <i style={{ transform: `scaleX(${fraction.toFixed(3)})` }} />
    </span>
  );
}

export function Led({ on = false, tone = "accent" }) {
  return <i className={`ni-led is-${tone}`} data-on={on} aria-hidden="true" />;
}

/** One LED per effect, lit when that effect has depth. */
export function LedRow({ states }) {
  return (
    <span className="ni-led-row" aria-hidden="true">
      {states.map((on, index) => <Led key={index} on={on} />)}
    </span>
  );
}

/** Four bars that move only while audio is actually playing. */
export function ActivityBars({ playing }) {
  return (
    <span className="ni-activity" data-playing={playing} aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

export function VisualThumb({ id, className = "", width = 48, height = 48 }) {
  return (
    <img
      className={`ni-visual-thumb ${className}`.trim()}
      src={visualThumbnailUrl(id)}
      alt=""
      width={width}
      height={height}
      decoding="async"
      loading="lazy"
      draggable="false"
    />
  );
}

/* Original monochrome glyphs for the rails and the passenger remote. */
const GLYPHS = {
  speaker: <><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  "speaker-off": <><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" /><path d="m16 9.5 5 5M21 9.5l-5 5" /></>,
  brake: <><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3" /><path d="M3.5 7.5a10 10 0 0 0 0 9M20.5 7.5a10 10 0 0 1 0 9" /></>,
  mix: <><path d="M6 4v16M12 4v16M18 4v16" /><rect x="4" y="12.5" width="4" height="3" rx="1" /><rect x="10" y="7" width="4" height="3" rx="1" /><rect x="16" y="14.5" width="4" height="3" rx="1" /></>,
  visual: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M3.5 15.5 9 11l4 3.5 2.5-2 5 4" /></>,
  music: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  engine: <><path d="M5 9h3l1.5-2h5L16 9h2v3h2v4h-2v2h-4l-1.5 1.5h-5L7 18H5z" /><path d="M2.5 11v5" /></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.8-1 1.3-2l-.5-1a1.6 1.6 0 0 1 1.5-2.3H17a3.5 3.5 0 0 0 3.5-3.5c0-4.6-3.8-8.2-8.5-8.2Z" /><circle cx="8" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="15" cy="8" r="1" /></>,
  phone: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>,
  scan: <><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" /><path d="M4 12h16" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.5 6.5 2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  back: <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  chevron: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
};

export function NiGlyph({ name, className = "" }) {
  return (
    <svg className={`ni-glyph ${className}`.trim()} data-glyph={name} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {GLYPHS[name]}
    </svg>
  );
}
