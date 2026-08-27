import { useEffect, useMemo, useRef } from "react";
import {
  speedToInterstate7Targets,
  themeToInterstate7Palette,
} from "./interstate-7-bridge.js";

const ORIGINAL_INTERSTATE_7_PATH = "third-party/infinite-lights/index7.html";

function setThreeColor(target, rgb) {
  target?.setRGB?.(rgb[0], rgb[1], rgb[2]);
}

function recolourInstances(mesh, colors, paired = false) {
  const attribute = mesh?.geometry?.attributes?.aColor;
  if (!attribute?.array) return;
  for (let index = 0; index < attribute.count; index += 1) {
    const colorIndex = paired ? Math.floor(index / 2) : index;
    const color = colors[colorIndex % colors.length];
    const offset = index * 3;
    attribute.array[offset] = color[0];
    attribute.array[offset + 1] = color[1];
    attribute.array[offset + 2] = color[2];
  }
  attribute.needsUpdate = true;
}

function recolourRoad(mesh, surface, markings) {
  const uniforms = mesh?.material?.uniforms;
  setThreeColor(uniforms?.uColor?.value, surface);
  setThreeColor(uniforms?.uBrokenLinesColor?.value, markings);
  setThreeColor(uniforms?.uShoulderLinesColor?.value, markings);
}

function applyTheme(app, theme) {
  if (!theme?.palette || app.__sedicivalvoleThemeId === theme.id) return;
  const palette = themeToInterstate7Palette(theme);
  setThreeColor(app.scene?.fog?.color, palette.background);
  setThreeColor(app.fogUniforms?.fogColor?.value, palette.background);
  recolourInstances(app.leftCarLights?.mesh, palette.leftCars, true);
  recolourInstances(app.rightCarLights?.mesh, palette.rightCars, true);
  recolourInstances(app.leftSticks?.mesh, palette.sticks);
  recolourRoad(app.road?.leftRoadWay, palette.road, palette.markings);
  recolourRoad(app.road?.rightRoadWay, palette.road, palette.markings);
  recolourRoad(app.road?.island, palette.island, palette.markings);
  app.__sedicivalvoleThemeId = theme.id;
}

export function Interstate7Field({ speed, theme, reducedMotion, onRenderer, onFrame }) {
  const frameRef = useRef(null);
  const valuesRef = useRef({ speed, theme, reducedMotion });
  valuesRef.current = { speed, theme, reducedMotion };
  const source = useMemo(
    () => new URL(`/${ORIGINAL_INTERSTATE_7_PATH}`, window.location.origin).href,
    [],
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    let animationFrame = 0;
    let stopped = false;
    let frameLoaded = false;
    let bridgeInstalled = false;
    let lastFrameAt = performance.now();

    const installBridge = () => {
      const frameWindow = frame.contentWindow;
      if (!frameWindow || bridgeInstalled) return;

      try {
        const integrationStyle = frameWindow.document.createElement("style");
        integrationStyle.dataset.sedicivalvoleIntegration = "true";
        integrationStyle.textContent = `
          html, body, main, .content, #app {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
          .frame, .content__title-wrap { display: none !important; }
          .content { position: relative !important; }
        `;
        frameWindow.document.head.append(integrationStyle);

        const Interstate7App = frameWindow.eval("App");
        const originalUpdate = Interstate7App.prototype.update;
        Interstate7App.prototype.update = function updateFromRoadSpeed(delta) {
          const { speedUpTarget, fovTarget } = speedToInterstate7Targets(
            frameWindow.__SEDICIVALVOLE_SPEED_KMH__ ?? 0,
          );
          this.speedUpTarget = speedUpTarget;
          this.fovTarget = fovTarget;
          applyTheme(this, frameWindow.__SEDICIVALVOLE_THEME__);
          return originalUpdate.call(this, delta);
        };
        bridgeInstalled = true;
        frame.classList.add("is-ready");
        onRenderer("WebGL · Original Interstate 7");
      } catch (error) {
        console.warn("[Interstate7Field] Original runtime bridge unavailable", error);
        onRenderer("Interstate 7 bridge error");
      }
    };

    const render = (now) => {
      if (stopped) return;
      animationFrame = requestAnimationFrame(render);
      const frameWindow = frame.contentWindow;
      if (!frameWindow) return;

      const inputSpeed = valuesRef.current.reducedMotion
        ? Math.min(valuesRef.current.speed, 20)
        : valuesRef.current.speed;
      frameWindow.__SEDICIVALVOLE_SPEED_KMH__ = inputSpeed;
      frameWindow.__SEDICIVALVOLE_THEME__ = valuesRef.current.theme;
      if (frameLoaded && !bridgeInstalled) installBridge();

      const elapsed = Math.max(1, now - lastFrameAt);
      lastFrameAt = now;
      onFrame(
        now,
        elapsed,
        "WebGL · Original Interstate 7",
        frame.clientWidth,
        frame.clientHeight,
      );
    };

    const onLoad = () => {
      frameLoaded = true;
      installBridge();
    };
    frame.addEventListener("load", onLoad);
    animationFrame = requestAnimationFrame(render);

    return () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      frame.removeEventListener("load", onLoad);
    };
  }, [onFrame, onRenderer]);

  return (
    <iframe
      className="interstate-seven-frame"
      ref={frameRef}
      src={source}
      title="Original Interstate 7 visual environment"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
