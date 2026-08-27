// Development-only QA harness for the Flux visual environments.
//
// It mounts one environment field at a held speed so rendered comparisons and
// frame-pacing measurements are reproducible instead of depending on where the
// Demo happens to be. It is not part of the product: `vite build` only takes
// index.html as an entry, so this page never reaches a build or a deployment.
//
// Query parameters:
//   env    aperture | meridian | latitudes      (default: meridian)
//   speed  held km/h                            (default: 0)
//   theme  pearl | graphite | red | blue | silver
//   sweep  seconds for one 0 -> ceiling -> 0 pass; overrides `speed`
//   reduced   "1" to force reduced motion
//   readout   "0" to hide the measurement overlay for clean captures
//
// Example: /qa-field.html?env=meridian&speed=115&theme=red

import { lazy, StrictMode, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { getFluxTheme } from "../src/flux-themes.js";
import { ROAD_SPEED_CEILING_KMH, speedToEnergy } from "../src/signal-model.js";

// Loaded on demand so the harness can run an environment that another branch
// has not built yet, and so one broken renderer cannot block the others.
const FIELDS = {
  aperture: lazy(() => import("../src/flux-field.jsx")
    .then((module) => ({ default: module.FluxField }))),
  meridian: lazy(() => import("../src/environments/meridian/meridian-field.jsx")
    .then((module) => ({ default: module.MeridianField }))),
  latitudes: lazy(() => import("../src/environments/latitudes/latitudes-field.jsx")
    .then((module) => ({ default: module.LatitudesField }))),
};

const parameters = new URLSearchParams(window.location.search);
const readNumber = (name, fallback) => {
  const value = Number(parameters.get(name));
  return Number.isFinite(value) ? value : fallback;
};

const ENVIRONMENT = parameters.get("env") ?? "meridian";
const HELD_SPEED = Math.max(0, readNumber("speed", 0));
const SWEEP_SECONDS = readNumber("sweep", 0);
const THEME = getFluxTheme(parameters.get("theme") ?? "red");
const REDUCED_MOTION = parameters.get("reduced") === "1";
const SHOW_READOUT = parameters.get("readout") !== "0";

function useHeldSpeed() {
  const [speed, setSpeed] = useState(HELD_SPEED);

  useEffect(() => {
    if (!(SWEEP_SECONDS > 0)) return undefined;
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const phase = ((now - startedAt) / 1000 / SWEEP_SECONDS) % 1;
      const triangle = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
      setSpeed(triangle * ROAD_SPEED_CEILING_KMH);
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return speed;
}

/** Frame pacing measured from the field's own onFrame callback. */
function useFramePacing() {
  const stateRef = useRef({
    intervals: [], renderer: "", width: 0, height: 0, lastAt: null,
  });
  const [summary, setSummary] = useState(null);

  const onFrame = useCallback((capturedAtMs, _targetFrameMs, renderer, width, height) => {
    const state = stateRef.current;
    if (state.lastAt != null) {
      state.intervals.push(capturedAtMs - state.lastAt);
      if (state.intervals.length > 600) state.intervals.shift();
    }
    state.lastAt = capturedAtMs;
    state.renderer = renderer;
    state.width = width;
    state.height = height;
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const { intervals, renderer, width, height } = stateRef.current;
      if (intervals.length < 12) return;
      const sorted = [...intervals].sort((a, b) => a - b);
      const mean = intervals.reduce((total, value) => total + value, 0) / intervals.length;
      setSummary({
        samples: intervals.length,
        meanMs: mean,
        fps: 1000 / mean,
        p95Ms: sorted[Math.floor(sorted.length * 0.95)],
        maxMs: sorted[sorted.length - 1],
        slowOver34: intervals.filter((value) => value > 34).length,
        renderer,
        width,
        height,
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return { onFrame, summary };
}

function Harness() {
  const speed = useHeldSpeed();
  const { onFrame, summary } = useFramePacing();
  const [renderer, setRenderer] = useState("starting");

  // Expose the live measurement to automated capture and profiling runs.
  useEffect(() => {
    window.__SEDICIVALVOLE_QA__ = { environment: ENVIRONMENT, speed, renderer, pacing: summary };
  }, [speed, renderer, summary]);

  const shared = {
    speed,
    theme: THEME,
    reducedMotion: REDUCED_MOTION,
    onRenderer: setRenderer,
    onFrame,
  };

  const Field = FIELDS[ENVIRONMENT] ?? FIELDS.meridian;
  const extra = ENVIRONMENT === "aperture"
    ? { energy: speedToEnergy(speed), pulse: 0, brake: 0 }
    : {};

  const APP_COMMIT = typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "dev";

  return (
    <>
      <Suspense fallback={null}>
        <Field {...shared} {...extra} />
      </Suspense>
      <div className="qa-readout" hidden={!SHOW_READOUT}>
        {[
          `${ENVIRONMENT.toUpperCase()}  ${speed.toFixed(1)} km/h  [${APP_COMMIT}]`,
          renderer,
          summary
            ? `${summary.fps.toFixed(1)} fps  mean ${summary.meanMs.toFixed(2)}ms  `
              + `p95 ${summary.p95Ms.toFixed(2)}ms  max ${summary.maxMs.toFixed(2)}ms`
            : "measuring frame pacing",
          summary ? `${summary.width}x${summary.height}  slow>34ms ${summary.slowOver34}` : "",
        ].filter(Boolean).join("\n")}
      </div>
    </>
  );
}

createRoot(document.getElementById("qa-root")).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
