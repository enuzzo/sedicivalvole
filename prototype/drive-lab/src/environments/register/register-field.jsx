import { useEffect, useMemo, useRef } from "react";
import {
  accelerationToMisregistration,
  physicalMisregistrationCssPx,
  speedToRegisterFamily,
} from "./register-model.js";

const LAYOUTS = [
  [
    ["paper tall plate", 8, 13, 6, 54],
    ["mid square", 23, 28, 13, 16],
    ["accent square plate", 23, 50, 13, 17],
    ["paper arc plate", 10, 70, 27, 28],
    ["paper stem", 45, 81, 3, 16],
    ["accent stem plate", 61, 82, 9, 16],
    ["mid low", 72, 90, 13, 6],
    ["paper slash plate", 84, 69, 13, 27],
  ],
  [
    ["accent tall plate", 8, 18, 5, 48],
    ["paper square plate", 20, 14, 15, 19],
    ["mid stem", 27, 54, 7, 30],
    ["paper arc plate", 41, 12, 24, 34],
    ["accent square plate", 49, 58, 15, 21],
    ["paper stem", 70, 25, 3, 52],
    ["mid square", 80, 16, 12, 18],
    ["paper low plate", 79, 72, 16, 14],
  ],
  [
    ["paper tall plate", 7, 12, 5, 61],
    ["accent square plate", 19, 25, 15, 22],
    ["mid low", 18, 78, 17, 9],
    ["paper arc plate", 45, 10, 19, 41],
    ["mid tall plate", 63, 34, 12, 31],
    ["paper rule", 77, 35, 2, 34],
    ["accent tall plate", 90, 12, 4, 42],
    ["paper slash plate", 80, 70, 14, 25],
  ],
];

const GRID_RULES = Array.from({ length: 7 }, (_, index) => index + 1);

function toCss(channels) {
  return `rgb(${channels.map((channel) => Math.round(channel * 255)).join(" ")})`;
}

export function RegisterField({ event, tempo, theme, reducedMotion, brakeAmount = 0, onRenderer, onFrame }) {
  const fieldRef = useRef(null);
  const family = speedToRegisterFamily(event.speedKmh);
  const layout = useMemo(
    () => LAYOUTS[(family + event.revision) % LAYOUTS.length],
    [event.revision, family],
  );
  const offsetLevel = accelerationToMisregistration(event.accelerationMps2, event.motionPhase);
  const sampledOffset = physicalMisregistrationCssPx(offsetLevel, window.devicePixelRatio);
  const brakeAlignment = Math.min(1, Math.max(0, Number(brakeAmount) || 0));
  const offset = reducedMotion ? 0 : sampledOffset * (1 - brakeAlignment);
  const palette = theme.palette;

  useEffect(() => {
    onRenderer("DOM/CSS · Register");
  }, [onRenderer]);

  useEffect(() => {
    const frame = requestAnimationFrame((capturedAtMs) => {
      const bounds = fieldRef.current?.getBoundingClientRect();
      onFrame(capturedAtMs, 1000, "DOM/CSS", Math.round(bounds?.width ?? 0), Math.round(bounds?.height ?? 0));
    });
    return () => cancelAnimationFrame(frame);
  }, [event.revision, onFrame]);

  return (
    <div
      className="register-field"
      ref={fieldRef}
      aria-hidden="true"
      data-family={family}
      data-registration={offset < 0.05 ? "aligned" : "offset"}
      style={{
        "--register-base": toCss(palette.base),
        "--register-mid": toCss(palette.mid),
        "--register-paper": toCss(palette.light),
        "--register-accent": toCss(palette.accent),
        "--register-offset": `${offset}px`,
        "--register-beat-duration": `${60 / Math.max(1, Number(tempo) || 120)}s`,
      }}
    >
      <div className="register-page" key={event.revision}>
        <div className="register-grid" aria-hidden="true">
          {GRID_RULES.map((rule) => <i key={rule} style={{ "--register-rule": rule }} />)}
        </div>
        {layout.map(([classes, x, y, width, height], index) => (
          <i
            className={`register-element ${classes}`}
            key={`${event.revision}-${index}`}
            style={{
              "--register-x": `${x}%`,
              "--register-y": `${y}%`,
              "--register-width": `${width}%`,
              "--register-height": `${height}%`,
            }}
          />
        ))}
        <i className="register-beat-line" />
      </div>
    </div>
  );
}
