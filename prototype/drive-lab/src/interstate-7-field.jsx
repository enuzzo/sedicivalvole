import { useEffect, useMemo, useRef } from "react";
import {
  createInterstateLoadDeadline,
  INTERSTATE7_ENTRY_PHASE_SECONDS,
  speedToInterstate7Targets,
  themeToInterstate7Palette,
} from "./interstate-7-bridge.js";
import {
  canvasFramebufferSize,
  SIXTY_FPS_FRAME_INTERVAL_MS,
} from "./render-telemetry.js";

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

export function Interstate7Field({
  speed,
  theme,
  reducedMotion,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const frameRef = useRef(null);
  const valuesRef = useRef({ speed, theme, reducedMotion, onRenderer, onFrame, onRuntimeError });
  valuesRef.current = { speed, theme, reducedMotion, onRenderer, onFrame, onRuntimeError };
  const source = useMemo(
    () => new URL(`/${ORIGINAL_INTERSTATE_7_PATH}`, window.location.origin).href,
    [],
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    let animationFrame = 0;
    let stopped = false;
    let bridgeState = "waiting";

    const fail = (error) => {
      if (stopped || bridgeState === "failed") return;
      bridgeState = "failed";
      loadDeadline.clear();
      cancelAnimationFrame(animationFrame);
      frame.classList.remove("is-ready");
      valuesRef.current.onRenderer("Interstate 7 unavailable");
      valuesRef.current.onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
    };

    const installBridge = () => {
      const frameWindow = frame.contentWindow;
      if (!frameWindow || bridgeState !== "waiting") return;
      bridgeState = "installing";

      try {
        const styleSelector = "style[data-sedicivalvole-integration='true']";
        if (!frameWindow.document.querySelector(styleSelector)) {
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
        }

        const Interstate7App = frameWindow.eval("App");
        const originalUpdate = Interstate7App?.prototype?.update;
        if (typeof originalUpdate !== "function") throw new Error("Interstate 7 update hook is unavailable");
        if (!originalUpdate.__sedicivalvoleBridge) {
          const updateFromRoadSpeed = function updateFromRoadSpeed(delta) {
            try {
              const { speedUpTarget, fovTarget } = speedToInterstate7Targets(
                frameWindow.__SEDICIVALVOLE_SPEED_KMH__ ?? 0,
              );
              if (!this.__sedicivalvoleEntryFramed) {
              // Enter at an attractive existing phase of the untouched upstream
              // distortion, where the road already fills the Tesla viewport.
              // Seeding the current controls also prevents the original fast
              // startup from flashing before the vehicle-speed bridge settles.
              this.timeOffset += INTERSTATE7_ENTRY_PHASE_SECONDS;
              this.speedUp = speedUpTarget;
              this.camera.fov = fovTarget;
              this.camera.updateProjectionMatrix();
                this.__sedicivalvoleEntryFramed = true;
              }
              this.speedUpTarget = speedUpTarget;
              this.fovTarget = fovTarget;
              applyTheme(this, frameWindow.__SEDICIVALVOLE_THEME__);
              const result = originalUpdate.call(this, delta);
            // Count the upstream renderer's own update, not the parent frame's
            // requestAnimationFrame loop. If the vendor renderer stalls,
            // diagnostics must stall too instead of reporting an invented 60 FPS.
              const framebuffer = canvasFramebufferSize(
                frameWindow.document.querySelector("#app canvas"),
              );
              if (framebuffer) {
                valuesRef.current.onFrame(
                  performance.now(),
                  SIXTY_FPS_FRAME_INTERVAL_MS,
                  "WebGL · Original Interstate 7",
                  framebuffer.width,
                  framebuffer.height,
                );
              }
              return result;
            } catch (error) {
              fail(error);
              return undefined;
            }
          };
          Object.defineProperty(updateFromRoadSpeed, "__sedicivalvoleBridge", { value: true });
          Interstate7App.prototype.update = updateFromRoadSpeed;
        }
        bridgeState = "ready";
        frame.classList.add("is-ready");
        valuesRef.current.onRenderer("WebGL · Original Interstate 7");
      } catch (error) {
        if (frame.dataset.sedicivalvoleBridgeWarningReported !== "true") {
          frame.dataset.sedicivalvoleBridgeWarningReported = "true";
          console.warn("[Interstate7Field] Original runtime bridge unavailable", error);
        }
        fail(error);
      }
    };

    const render = (now) => {
      if (stopped) return;
      animationFrame = requestAnimationFrame(render);
      try {
        const frameWindow = frame.contentWindow;
        if (!frameWindow) return;

        const inputSpeed = valuesRef.current.reducedMotion
          ? Math.min(valuesRef.current.speed, 20)
          : valuesRef.current.speed;
        frameWindow.__SEDICIVALVOLE_SPEED_KMH__ = inputSpeed;
        frameWindow.__SEDICIVALVOLE_THEME__ = valuesRef.current.theme;
      } catch (error) {
        fail(error);
      }
    };

    const loadDeadline = createInterstateLoadDeadline({
      schedule: (callback, delay) => window.setTimeout(callback, delay),
      cancel: (timer) => window.clearTimeout(timer),
      onTimeout: () => fail(new Error("Interstate 7 load timed out")),
    });

    const onLoad = () => {
      if (!loadDeadline.clear()) return;
      bridgeState = "waiting";
      frame.classList.remove("is-ready");
      installBridge();
    };
    frame.addEventListener("load", onLoad);
    try {
      if (frame.contentDocument?.readyState === "complete" && frame.contentWindow?.location.href === source) {
        onLoad();
      }
    } catch {
      // The configured runtime is same-origin; a transient navigation simply
      // falls through to the bounded load handler above.
    }
    animationFrame = requestAnimationFrame(render);

    return () => {
      stopped = true;
      loadDeadline.clear();
      cancelAnimationFrame(animationFrame);
      frame.removeEventListener("load", onLoad);
    };
  }, [source]);

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
