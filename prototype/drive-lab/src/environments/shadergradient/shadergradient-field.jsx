import { Component, useEffect, useMemo, useRef } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import {
  getShaderGradientStudy,
  shaderGradientPalette,
  shaderGradientResponse,
} from "./studies.js";
import { audioMacroAmount } from "../../response-mapping.js";

function drawFallback(context, width, height, colors, response, speedKmh, elapsedSeconds) {
  const road = Math.min(1, Math.max(0, speedKmh / 130));
  const travel = elapsedSeconds * (0.035 + road * 0.24);
  const brake = response.underwater;
  const x = width * (0.32 + Math.sin(travel) * (0.1 + brake * 0.24));
  const y = height * (0.46 + Math.cos(travel * 0.72) * (0.12 + brake * 0.18));
  const radius = Math.max(width, height) * (0.68 + road * 0.18 - brake * 0.24);
  const field = context.createRadialGradient(x, y, 0, width * 0.5, height * 0.5, radius);
  field.addColorStop(0, colors.color1);
  field.addColorStop(0.48, colors.color2);
  field.addColorStop(1, colors.color3);
  context.fillStyle = field;
  context.fillRect(0, 0, width, height);
}

function ShaderGradientFallback({ study, colors, response, speed, reducedMotion, onRenderer, onRuntimeError }) {
  const canvasRef = useRef(null);
  const valuesRef = useRef({ colors, response, speed, reducedMotion });
  valuesRef.current = { colors, response, speed, reducedMotion };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) {
      onRuntimeError?.(new Error(`${study.label} Canvas2D fallback is unavailable`));
      return undefined;
    }
    onRenderer?.(`Canvas2D · ${study.label} fallback`);
    let animationFrame = 0;
    let lastFrameAt = performance.now();
    let elapsedSeconds = 0;
    const render = (now) => {
      const deltaMs = Math.max(0, Math.min(now - lastFrameAt, 100));
      lastFrameAt = now;
      if (!valuesRef.current.reducedMotion) elapsedSeconds += deltaMs / 1000;
      const ratio = Math.min(window.devicePixelRatio || 1, 1);
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      drawFallback(
        context,
        width,
        height,
        valuesRef.current.colors,
        valuesRef.current.response,
        valuesRef.current.speed,
        elapsedSeconds,
      );
      animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [onRenderer, onRuntimeError, study]);

  return <canvas className="field-canvas shadergradient-fallback" ref={canvasRef} aria-hidden="true" />;
}

class ShaderGradientBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    this.props.onFailure?.(error);
  }

  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

export default function ShaderGradientField({
  studyId,
  speed,
  audioLevel = 0,
  musicMode = "play-road",
  macroSnapshot = null,
  theme,
  reducedMotion,
  effect,
  onRenderer,
  onFrame,
  onRuntimeError,
}) {
  const rootRef = useRef(null);
  const callbacksRef = useRef({ onRenderer, onFrame, onRuntimeError });
  callbacksRef.current = { onRenderer, onFrame, onRuntimeError };
  const study = getShaderGradientStudy(studyId);
  const responseMode = musicMode === "play-road" ? "road-audio" : "road";
  const underwaterAmount = macroSnapshot == null
    ? null
    : audioMacroAmount(macroSnapshot, "underwater");
  const colors = useMemo(
    () => shaderGradientPalette(study.id, theme),
    [study.id, theme],
  );
  const effective = useMemo(() => shaderGradientResponse(study, {
    speedKmh: speed,
    audioLevel,
    responseMode,
    effect,
    underwaterAmount,
    reducedMotion,
  }), [audioLevel, effect, reducedMotion, responseMode, speed, study, underwaterAmount]);

  useEffect(() => {
    callbacksRef.current.onRenderer?.(`ShaderGradient · ${study.label}`);
    let animationFrame = 0;
    let lastFrameAt = performance.now();
    const recordFrame = (now) => {
      const canvas = rootRef.current?.querySelector("canvas");
      const deltaMs = Math.max(0, Math.min(now - lastFrameAt, 100));
      lastFrameAt = now;
      callbacksRef.current.onFrame?.(
        now,
        deltaMs,
        "WebGL",
        canvas?.width ?? rootRef.current?.clientWidth ?? 0,
        canvas?.height ?? rootRef.current?.clientHeight ?? 0,
      );
      animationFrame = requestAnimationFrame(recordFrame);
    };
    animationFrame = requestAnimationFrame(recordFrame);
    return () => cancelAnimationFrame(animationFrame);
  }, [study]);

  const fallback = (
    <ShaderGradientFallback
      study={study}
      colors={colors}
      response={effective}
      speed={speed}
      reducedMotion={reducedMotion}
      onRenderer={onRenderer}
      onRuntimeError={onRuntimeError}
    />
  );

  return (
    <div className="field-canvas shadergradient-field" ref={rootRef} aria-hidden="true">
      <ShaderGradientBoundary
        key={study.id}
        fallback={fallback}
        onFailure={() => callbacksRef.current.onRenderer?.(`Canvas2D · ${study.label} fallback`)}
      >
        <ShaderGradientCanvas
          className="shadergradient-canvas"
          style={{ position: "absolute", inset: 0 }}
          pixelDensity={1}
          fov={study.fov}
          pointerEvents="none"
          lazyLoad={false}
          preserveDrawingBuffer={false}
          powerPreference="high-performance"
        >
          <ShaderGradient
            control="props"
            type={study.type}
            shader={study.shader}
            animate={reducedMotion ? "off" : study.animate}
            grain={study.grain}
            grainBlending={study.grainBlending}
            wireframe={study.wireframe}
            color1={colors.color1}
            color2={colors.color2}
            color3={colors.color3}
            uTime={study.uTime}
            uSpeed={effective.uSpeed}
            uStrength={effective.uStrength}
            uDensity={effective.uDensity}
            uFrequency={effective.uFrequency}
            uAmplitude={study.uAmplitude}
            range={study.range}
            rangeStart={study.rangeStart}
            rangeEnd={study.rangeEnd}
            loop={study.loop}
            loopDuration={study.loopDuration}
            lightType="3d"
            brightness={effective.brightness}
            reflection={study.reflection}
            positionX={study.positionX}
            positionY={study.positionY}
            positionZ={study.positionZ}
            rotationX={study.rotationX}
            rotationY={study.rotationY}
            rotationZ={effective.rotationZ}
            cAzimuthAngle={study.cAzimuthAngle}
            cPolarAngle={study.cPolarAngle}
            cDistance={study.cDistance}
            cameraZoom={study.cameraZoom}
            smoothTime={study.smoothTime}
            zoomOut={study.zoomOut}
            toggleAxis={study.toggleAxis}
            enableTransition={study.enableTransition}
            enableCameraUpdate={false}
          />
        </ShaderGradientCanvas>
      </ShaderGradientBoundary>
    </div>
  );
}
