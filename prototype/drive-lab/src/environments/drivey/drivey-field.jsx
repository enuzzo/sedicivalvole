import { useEffect, useMemo, useRef } from "react";
import {
  createDriveyAutomaticInput,
  createDriveyLoadDeadline,
  DEFAULT_DRIVEY_SETTINGS,
  driveyMotionProfile,
  driveyRuntimeUrl,
  normalizeDriveySettings,
  stabilizeDriveyRoadFollower,
  themeToDriveyPalette,
} from "./drivey-model.js";
import {
  canvasFramebufferSize,
  SIXTY_FPS_FRAME_INTERVAL_MS,
} from "../../render-telemetry.js";

const MAX_DRIVEY_PIXEL_RATIO = 1.25;

function setThreeColor(target, rgb) {
  target?.setRGB?.(rgb[0], rgb[1], rgb[2]);
}

function makeThreeColor(bridge, rgb) {
  return new bridge.Color().setRGB(rgb[0], rgb[1], rgb[2]);
}

function installAutomaticRoadInput(bridge) {
  const { drivey, Input } = bridge;
  if (drivey.__sedicivalvoleInputInstalled) return;
  drivey.controlScheme = createDriveyAutomaticInput(Input);
  drivey.__sedicivalvoleInputInstalled = true;
}

function applyPalette(bridge, palette) {
  const {
    drivey,
    paletteWireframe,
    silhouetteMaterial,
    transparentMaterial,
  } = bridge;
  for (const material of [silhouetteMaterial, transparentMaterial]) {
    setThreeColor(material?.uniforms?.darkTint?.value, palette.dark);
    setThreeColor(material?.uniforms?.fullTint?.value, palette.full);
    setThreeColor(material?.uniforms?.secondaryTint?.value, palette.secondary);
    setThreeColor(material?.uniforms?.lightTint?.value, palette.light);
  }
  setThreeColor(paletteWireframe?.background, palette.background);
  setThreeColor(paletteWireframe?.line, palette.full);
  setThreeColor(paletteWireframe?.highlight, palette.secondary);
  drivey.themeColors = {
    dark: makeThreeColor(bridge, palette.dark),
    full: makeThreeColor(bridge, palette.full),
    light: makeThreeColor(bridge, palette.light),
  };
  drivey.level?.tint?.copy?.(drivey.themeColors.full);
  drivey.screen.backgroundColor = makeThreeColor(bridge, palette.background);
}

function driveyRendererLabel(renderMode) {
  return `WebGL · Original Drivey · ${renderMode === "wireframe" ? "Wireframe" : "Normal"}`;
}

function applyRenderMode(bridge, renderMode) {
  const { drivey, silhouetteMaterial, transparentMaterial } = bridge;
  const wireframe = renderMode === "wireframe";
  drivey.currentEffect = wireframe ? "wireframe" : "ombré";
  drivey.isWireframe = wireframe;
  drivey.screen.setWireframe(wireframe);
  drivey.screen.setCycleColors(false);
  silhouetteMaterial.uniforms.isWireframe.value = wireframe;
  transparentMaterial.uniforms.isWireframe.value = wireframe;
  drivey.updateCamera();
}

function installFrameTelemetry(bridge, valuesRef, appliedState, fail) {
  const { screen } = bridge.drivey;
  if (screen.render.__sedicivalvoleBridge) return;
  const originalRender = screen.render.bind(screen);
  const renderWithTelemetry = function renderWithTelemetry() {
    const active = screen.active;
    try {
      const result = originalRender();
      if (active) {
        const framebuffer = canvasFramebufferSize(screen.renderer?.domElement);
        if (framebuffer) {
          valuesRef.current.onFrame(
            performance.now(),
            SIXTY_FPS_FRAME_INTERVAL_MS,
            appliedState.rendererLabel ?? driveyRendererLabel("normal"),
            framebuffer.width,
            framebuffer.height,
          );
        }
      }
      return result;
    } catch (error) {
      fail(error);
      return undefined;
    }
  };
  Object.defineProperty(renderWithTelemetry, "__sedicivalvoleBridge", { value: true });
  screen.render = renderWithTelemetry;
}

function applyBridgeState(bridge, values, state) {
  const { drivey } = bridge;
  const settings = normalizeDriveySettings(values.settings);
  const profile = driveyMotionProfile({
    speedKmh: values.speed,
    audioLevel: values.audioLevel,
    effect: values.effect,
    reducedMotion: values.reducedMotion,
  });

  installAutomaticRoadInput(bridge);
  stabilizeDriveyRoadFollower(drivey.myCar);
  drivey.screen.setCycleColors(false);
  drivey.cruiseSpeed = profile.cruiseSpeed;
  drivey.npcControlScheme.cruiseSpeedMultiplier = profile.npcSpeedScale;
  drivey.npcControlScheme.steer = 0;
  drivey.npcControlScheme.laneShift = 0;

  if (state.camera !== settings.camera) {
    drivey.setCameraMount(settings.camera);
    state.camera = settings.camera;
  }
  if (state.traffic !== settings.traffic) {
    drivey.setNumOtherCars(settings.traffic);
    state.traffic = settings.traffic;
  }
  if (state.renderMode !== settings.renderMode) {
    applyRenderMode(bridge, settings.renderMode);
    state.renderMode = settings.renderMode;
    state.rendererLabel = driveyRendererLabel(settings.renderMode);
    values.onRenderer(state.rendererLabel);
  }
  if (Math.abs(drivey.screen.camera.fov - profile.fov) > 0.01) {
    drivey.screen.camera.fov = profile.fov;
    drivey.screen.camera.updateProjectionMatrix();
  }

  const paletteSignature = [
    values.theme.id,
    settings.renderMode,
    values.effect ?? "none",
    Math.round(profile.colourEnergy * 100),
  ].join(":");
  if (state.palette !== paletteSignature) {
    applyPalette(bridge, themeToDriveyPalette(values.theme, profile));
    state.palette = paletteSignature;
  }

  const reducedChanged = state.reducedMotion !== profile.reducedMotion;
  state.reducedMotion = profile.reducedMotion;
  drivey.screen.active = !profile.reducedMotion;
  if (profile.reducedMotion && (reducedChanged || state.staticSignature !== paletteSignature)) {
    drivey.screen.renderPass.camera = drivey.screen.camera;
    drivey.screen.composer.render();
    state.staticSignature = paletteSignature;
  }
}

export function DriveyField({
  speed,
  audioLevel = 0,
  theme,
  effect,
  settings = DEFAULT_DRIVEY_SETTINGS,
  reducedMotion,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const frameRef = useRef(null);
  const valuesRef = useRef({
    speed,
    audioLevel,
    theme,
    effect,
    settings,
    reducedMotion,
    onFrame,
    onRenderer,
  });
  valuesRef.current = {
    speed,
    audioLevel,
    theme,
    effect,
    settings,
    reducedMotion,
    onFrame,
    onRenderer,
  };
  const source = useMemo(
    () => driveyRuntimeUrl(window.location.origin, __APP_BUILD__),
    [],
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    let animationFrame = 0;
    let readinessFrame = 0;
    let childWindow = null;
    let bridge = null;
    let bridgeState = "waiting";
    let stopped = false;
    const appliedState = {
      camera: null,
      traffic: null,
      renderMode: null,
      rendererLabel: null,
      palette: null,
      reducedMotion: null,
      staticSignature: null,
    };

    const fail = (error) => {
      if (stopped || bridgeState === "failed") return;
      bridgeState = "failed";
      if (bridge?.drivey?.screen) bridge.drivey.screen.active = false;
      loadDeadline.clear();
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(readinessFrame);
      frame.classList.remove("is-ready");
      onRenderer("Drivey unavailable");
      onRuntimeError?.(error instanceof Error ? error : new Error(String(error)));
    };

    const onChildError = (event) => {
      fail(event.error ?? new Error(event.message || "Original Drivey runtime error"));
    };
    const onChildRejection = (event) => {
      fail(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };

    const finishBridge = (candidate) => {
      bridge = candidate;
      const { drivey } = bridge;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DRIVEY_PIXEL_RATIO);
      drivey.screen.renderer.setPixelRatio(pixelRatio);
      drivey.screen.setResolution(1);
      installFrameTelemetry(bridge, valuesRef, appliedState, fail);
      applyBridgeState(bridge, valuesRef.current, appliedState);
      bridgeState = "ready";
      loadDeadline.clear();
      frame.classList.add("is-ready");
    };

    const waitForRuntime = () => {
      if (stopped || bridgeState !== "loading") return;
      try {
        const candidate = childWindow?.__SEDICIVALVOLE_DRIVEY__;
        const ready = candidate?.drivey?.level
          && candidate.drivey.screen?.renderer?.domElement
          && candidate.drivey.cameraMountsByName;
        if (ready) {
          finishBridge(candidate);
          return;
        }
        readinessFrame = requestAnimationFrame(waitForRuntime);
      } catch (error) {
        fail(error);
      }
    };

    const loadDeadline = createDriveyLoadDeadline({
      schedule: (callback, delay) => window.setTimeout(callback, delay),
      cancel: (timer) => window.clearTimeout(timer),
      onTimeout: () => fail(new Error("Original Drivey load timed out")),
    });

    const onLoad = () => {
      if (stopped || bridgeState === "failed") return;
      try {
        childWindow?.removeEventListener("error", onChildError);
        childWindow?.removeEventListener("unhandledrejection", onChildRejection);
        childWindow = frame.contentWindow;
        if (!childWindow) throw new Error("Original Drivey window is unavailable");
        childWindow.addEventListener("error", onChildError);
        childWindow.addEventListener("unhandledrejection", onChildRejection);
        bridgeState = "loading";
        readinessFrame = requestAnimationFrame(waitForRuntime);
      } catch (error) {
        fail(error);
      }
    };

    const sync = () => {
      if (stopped) return;
      animationFrame = requestAnimationFrame(sync);
      if (bridgeState !== "ready" || !bridge) return;
      try {
        applyBridgeState(bridge, valuesRef.current, appliedState);
      } catch (error) {
        fail(error);
      }
    };

    frame.addEventListener("load", onLoad);
    try {
      if (frame.contentDocument?.readyState === "complete" && frame.contentWindow?.location.href === source) {
        onLoad();
      }
    } catch {
      // The configured runtime is same-origin; navigation is bounded by the load deadline.
    }
    animationFrame = requestAnimationFrame(sync);

    return () => {
      stopped = true;
      if (bridge?.drivey?.screen) bridge.drivey.screen.active = false;
      loadDeadline.clear();
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(readinessFrame);
      frame.removeEventListener("load", onLoad);
      childWindow?.removeEventListener("error", onChildError);
      childWindow?.removeEventListener("unhandledrejection", onChildRejection);
    };
  }, [onRenderer, onRuntimeError, source]);

  return (
    <iframe
      className="drivey-upstream-frame"
      ref={frameRef}
      src={source}
      title="Original Rezmason Drivey visual environment"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
