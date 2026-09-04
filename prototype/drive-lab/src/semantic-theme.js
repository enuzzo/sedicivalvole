// Interface colours are derivatives of the authored palette. Never feed these
// contrast corrections back into a renderer or a third-party colour buffer.
export const UI_SURFACES = Object.freeze({
  light: Object.freeze({ surface: "#f4f4f4", strong: "#f4f4f4", control: "#e6e6e6", hover: "#dcdcdc", text: "#171a20", metadata: "#60636a", selected: "#171a20", onSelected: "#f4f4f4" }),
  dark: Object.freeze({ surface: "#1a1a1a", strong: "#0f0f0f", control: "#262626", hover: "#333333", text: "#f4f4f4", metadata: "#b0b0b0", selected: "#f4f4f4", onSelected: "#171a20" }),
});

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const linear = (value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const encoded = (value) => value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
const channels = (hex) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new TypeError(`Expected an opaque six-digit colour: ${hex}`);
  return hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255);
};
export const rgbHex = (rgb) => `#${rgb.map((value) => Math.round(clamp(value) * 255).toString(16).padStart(2, "0")).join("")}`;
export function contrastRatio(first, second) {
  const luminance = (hex) => channels(hex).map(linear).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Oklab matrices by Björn Ottosson (public-domain reference implementation).
// https://bottosson.github.io/posts/oklab/ — see THIRD_PARTY_NOTICES.md.
// Search lightness
// in both directions; reduce chroma only enough to remain inside sRGB gamut.
export function hexToOklab(hex) {
  const [r, g, b] = channels(hex).map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

function labToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

function gamutColour(L, a, b) {
  const inGamut = (rgb) => rgb.every((value) => value >= -1e-7 && value <= 1.0000001);
  let rgb = labToLinear([L, a, b]);
  if (!inGamut(rgb)) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 22; i += 1) {
      const amount = (lo + hi) / 2;
      if (inGamut(labToLinear([L, a * amount, b * amount]))) lo = amount;
      else hi = amount;
    }
    rgb = labToLinear([L, a * lo, b * lo]);
  }
  return rgbHex(rgb.map(encoded));
}

export function resolveContrast(raw, backgrounds, minimum = 4.5) {
  const surfaces = Array.isArray(backgrounds) ? backgrounds : [backgrounds];
  if (!surfaces.length || !Number.isFinite(minimum) || minimum < 1 || minimum > 21) throw new RangeError("Invalid contrast context");
  const ratio = (hex) => Math.min(...surfaces.map((background) => contrastRatio(hex, background)));
  const rawRatio = ratio(raw);
  let resolved = raw;
  if (rawRatio < minimum) {
    const [L, a, b] = hexToOklab(raw);
    const candidates = [];
    for (const endpoint of [0, 1]) {
      if (ratio(gamutColour(endpoint, a, b)) < minimum) continue;
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 24; i += 1) {
        const amount = (lo + hi) / 2;
        const candidate = gamutColour(L + (endpoint - L) * amount, a, b);
        if (ratio(candidate) >= minimum) hi = amount;
        else lo = amount;
      }
      const hex = gamutColour(L + (endpoint - L) * hi, a, b);
      const distance = hexToOklab(hex).reduce((sum, value, i) => sum + (value - [L, a, b][i]) ** 2, 0);
      candidates.push({ hex, distance });
    }
    candidates.sort((a, b) => a.distance - b.distance);
    if (!candidates.length) throw new RangeError("No shared contrast-safe colour exists for these surfaces");
    resolved = candidates[0].hex;
  }
  return Object.freeze({ raw, resolved, rawRatio, ratio: ratio(resolved), minimum,
    variant: resolved === raw ? "authored" : "contrast-enhanced",
    backgrounds: Object.freeze([...surfaces]),
  });
}

const cache = new WeakMap();
export function resolveSemanticTheme(theme, appearance = "light") {
  if (!UI_SURFACES[appearance]) throw new RangeError("Unknown appearance");
  let variants = cache.get(theme);
  if (!variants) { variants = new Map(); cache.set(theme, variants); }
  if (variants.has(appearance)) return variants.get(appearance);
  const neutrals = UI_SURFACES[appearance];
  const surfaces = [neutrals.surface, neutrals.strong, neutrals.control, neutrals.hover];
  const accent = theme.swatch;
  const chartAccent = rgbHex(theme.palette.accent);
  const secondary = rgbHex(theme.palette.secondary);
  const role = (raw, minimum = 4.5, backgrounds = surfaces) => resolveContrast(raw, backgrounds, minimum);
  const roles = {
    text: role(neutrals.text),
    metadata: role(neutrals.metadata),
    accentText: role(accent),
    selectedAccent: role(accent, 4.5, neutrals.selected),
    selectedText: role(neutrals.onSelected, 4.5, neutrals.selected),
    focus: role(accent, 3),
    boundary: role(neutrals.metadata, 3),
    chartPrimary: role(chartAccent),
    chartSecondary: role(secondary),
    indicator: role(accent, 3),
    effectSurface: role(secondary, 3),
    success: role(appearance === "light" ? "#167442" : "#55d991"),
    caution: role(appearance === "light" ? "#975800" : "#f3a84c"),
    alert: role(appearance === "light" ? "#bb282d" : "#ff7770"),
  };
  const effectInk = contrastRatio(neutrals.text, roles.effectSurface.resolved) >= 4.5 ? neutrals.text : neutrals.onSelected;
  roles.effectText = role(effectInk, 4.5, roles.effectSurface.resolved);
  const css = {
    "--ui-surface": neutrals.surface, "--ui-surface-strong": neutrals.strong,
    "--ui-control": neutrals.control, "--ui-control-hover": neutrals.hover,
    "--ui-selected-surface": neutrals.selected,
  };
  for (const [name, cssName] of Object.entries({text:"text", metadata:"muted", accentText:"accent-text", selectedAccent:"selected-accent", selectedText:"selected-text", focus:"focus", boundary:"line", chartPrimary:"chart-primary", chartSecondary:"chart-secondary", indicator:"indicator", effectSurface:"effect-surface", effectText:"effect-text", success:"success", caution:"caution", alert:"alert"})) {
    css[`--ui-${cssName}`] = roles[name].resolved;
  }
  css["--ui-subtle"] = roles.metadata.resolved;
  const result = Object.freeze({ palette: theme.id, appearance, neutrals, roles: Object.freeze(roles), css: Object.freeze(css) });
  variants.set(appearance, result);
  return result;
}
