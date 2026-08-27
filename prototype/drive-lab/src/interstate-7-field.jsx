import { useEffect, useMemo, useRef } from "react";
import { speedToInterstate7Targets } from "./interstate-7-bridge.js";

const ORIGINAL_INTERSTATE_7_PATH = "third-party/infinite-lights/index7.html";

export function Interstate7Field({ speed, reducedMotion, onRenderer, onFrame }) {
  const frameRef = useRef(null);
  const valuesRef = useRef({ speed, reducedMotion });
  valuesRef.current = { speed, reducedMotion };
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
          return originalUpdate.call(this, delta);
        };
        bridgeInstalled = true;
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
