import { ROAD_SPEED_CEILING_KMH } from "../../signal-model.js";

const clamp = (value, minimum = 0, maximum = 1) => (
  Math.min(maximum, Math.max(minimum, Number(value) || 0))
);

export const SHADERGRADIENT_BASE_SETTINGS = Object.freeze({
  type: "waterPlane",
  shader: "defaults",
  color1: "#f5ead2",
  color2: "#e55d87",
  color3: "#5078d0",
  animate: "on",
  uTime: 0,
  uSpeed: 0.22,
  uStrength: 2.6,
  uDensity: 1.15,
  uFrequency: 3.4,
  uAmplitude: 0,
  range: "disabled",
  rangeStart: 0,
  rangeEnd: 40,
  loop: "on",
  loopDuration: 12,
  grain: "on",
  grainBlending: 0.24,
  wireframe: false,
  lightType: "3d",
  envPreset: "city",
  brightness: 1.2,
  reflection: 0.18,
  rotationX: 18,
  rotationY: 0,
  rotationZ: 18,
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  cAzimuthAngle: 175,
  cPolarAngle: 82,
  cDistance: 4.2,
  cameraZoom: 1,
  smoothTime: 0.05,
  zoomOut: false,
  toggleAxis: false,
  enableTransition: true,
  enableCameraUpdate: false,
  fov: 48,
  pixelDensity: 1,
  pointerEvents: "none",
  lazyLoad: true,
  threshold: 0.1,
  rootMargin: "0px",
  preserveDrawingBuffer: false,
  powerPreference: "high-performance",
  envBasePath: "",
  responseMode: "road-audio",
  speed: 35,
  audioEnergy: 0.25,
});

export const SHADERGRADIENT_STUDIES = Object.freeze({
  "japanese-mist": Object.freeze({
    ...SHADERGRADIENT_BASE_SETTINGS,
    id: "japanese-mist",
    label: "Japanese Mist",
    description: "Soft water, warm paper, and a slow chromatic tide.",
  }),
  "acid-orchard": Object.freeze({
    ...SHADERGRADIENT_BASE_SETTINGS,
    id: "acid-orchard",
    label: "Acid Orchard",
    description: "A broad graphic field with punchy, speed-led folding.",
    type: "plane",
    color1: "#ff3b30",
    color2: "#d8ff43",
    color3: "#ff62bd",
    uSpeed: 0.34,
    uStrength: 3.8,
    uDensity: 1.3,
    uFrequency: 5.2,
    uAmplitude: 1.1,
    brightness: 1.3,
    reflection: 0.08,
    rotationX: 0,
    rotationY: 14,
    rotationZ: 48,
    positionX: -0.7,
    cAzimuthAngle: 205,
    cPolarAngle: 90,
    cDistance: 5.4,
    fov: 52,
    responseMode: "road",
    speed: 70,
    audioEnergy: 0.15,
  }),
  "chromatic-silk": Object.freeze({
    ...SHADERGRADIENT_BASE_SETTINGS,
    id: "chromatic-silk",
    label: "Chromatic Silk",
    description: "A luminous sculptural fold for stronger motion studies.",
    type: "sphere",
    shader: "cosmic",
    color1: "#28d7cc",
    color2: "#6c45ff",
    color3: "#ff7b32",
    uSpeed: 0.3,
    uStrength: 1.1,
    uDensity: 0.85,
    uFrequency: 4.8,
    uAmplitude: 4.5,
    brightness: 1.45,
    reflection: 0.32,
    rotationX: 0,
    rotationY: 24,
    rotationZ: 132,
    cAzimuthAngle: 245,
    cPolarAngle: 128,
    cDistance: 2.4,
    cameraZoom: 7,
    fov: 44,
    responseMode: "road-audio",
    speed: 105,
    audioEnergy: 0.55,
  }),
});

export const SHADERGRADIENT_STUDY_IDS = Object.freeze(Object.keys(SHADERGRADIENT_STUDIES));
export const DEFAULT_SHADERGRADIENT_STUDY_ID = SHADERGRADIENT_STUDY_IDS[0];

export function getShaderGradientStudy(studyId) {
  return SHADERGRADIENT_STUDIES[studyId] ?? SHADERGRADIENT_STUDIES[DEFAULT_SHADERGRADIENT_STUDY_ID];
}

function rgbToHex(rgb) {
  const channel = (value) => Math.round(clamp(value) * 255).toString(16).padStart(2, "0");
  return `#${rgb.map(channel).join("")}`;
}

function mixRgb(first, second, amount) {
  const mix = clamp(amount);
  return first.map((value, index) => value + (second[index] - value) * mix);
}

/**
 * Carry the complete product palette into every Gradient variant. Accent and
 * secondary remain exact theme channels; the third colour is a light-tinted
 * derivative so three-colour shaders stay inside the selected mood.
 */
export function shaderGradientPalette(studyId, theme) {
  const study = getShaderGradientStudy(studyId);
  const palette = theme?.palette;
  if (!palette?.accent || !palette?.secondary || !palette?.light) {
    return Object.freeze({ color1: study.color1, color2: study.color2, color3: study.color3 });
  }

  const accent = rgbToHex(palette.accent);
  const secondary = rgbToHex(palette.secondary);
  if (study.id === "japanese-mist") {
    return Object.freeze({
      color1: accent,
      color2: rgbToHex(mixRgb(palette.accent, palette.light, 0.58)),
      color3: secondary,
    });
  }
  if (study.id === "acid-orchard") {
    return Object.freeze({
      color1: accent,
      color2: secondary,
      color3: rgbToHex(mixRgb(palette.secondary, palette.light, 0.34)),
    });
  }
  return Object.freeze({
    color1: secondary,
    color2: accent,
    color3: rgbToHex(mixRgb(palette.accent, palette.light, 0.46)),
  });
}

export function shaderGradientResponse(settings, {
  speedKmh = settings.speed,
  audioLevel = settings.audioEnergy,
  responseMode = settings.responseMode,
  effect = null,
  underwaterAmount = null,
  reducedMotion = false,
} = {}) {
  const road = responseMode === "free"
    ? 0
    : clamp(speedKmh, 0, ROAD_SPEED_CEILING_KMH) / ROAD_SPEED_CEILING_KMH;
  const audio = responseMode === "road-audio" && !reducedMotion ? clamp(audioLevel) : 0;
  const motionScale = responseMode === "free" ? 1 : 0.5 + road * 2.3;
  const underwater = underwaterAmount == null
    ? effect === "UNDERWATER" ? 1 : 0
    : clamp(underwaterAmount);
  const open = effect === "OPEN";
  const bloom = effect === "BLOOM";

  return Object.freeze({
    uSpeed: reducedMotion
      ? 0
      : settings.uSpeed * (motionScale + audio * 0.45) * (1 - underwater * 0.58),
    uStrength: settings.uStrength + road * 2.8 + audio * 1.25 + (open ? 0.65 : 0)
      + underwater * (settings.type === "sphere" ? 2.8 : 3.6),
    uDensity: settings.uDensity + road * 0.55 + audio * 0.18 + underwater * 1.15,
    uFrequency: settings.uFrequency + road * 1.6,
    brightness: settings.brightness + road * 0.2 + audio * 0.22 + (bloom ? 0.42 : 0),
    rotationZ: settings.rotationZ + road * 32,
    underwater,
  });
}
